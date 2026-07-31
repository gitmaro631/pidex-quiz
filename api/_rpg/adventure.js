import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { accountFacilitiesDocPath, defaultAccountFacilities } from '../_rpgFacilities.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { removeItem, tryAddItem, isOverCapacity } from '../_rpgInventory.js';
import { ZONES } from '../../data/rpg/zones.js';
import { resolveCombat, applyEquipmentWear } from '../../rpg-combat.js';
import { applyXpGain } from '../../rpg-progression.js';
import { checkNewLoreUnlocks } from '../../rpg-lore.js';
import { LORE_ENTRIES } from '../../data/rpg/lore.js';
import { isAdminUsername } from '../_rpgAdmin.js';
import { CASTLE_CLEAR_REQUIREMENT } from '../../data/rpg/castle.js';
import { facilityBonusMultiplier } from '../../data/rpg/facilities.js';
import { territoryDaysElapsed, settleTerritoryDays } from '../../rpg-territory.js';
import { tLang, ti } from '../../util-i18n.js';
import { getTownName } from '../../rpg-i18n.js';

const EQUIP_SLOT_LABELS = { weapon: '무기', shield: '방패', armor_top: '상의', armor_bottom: '하의' };
function equipSlotLabelFor(slot, lang) { return tLang(`rpg.ui.equipSlot.${slot}`, lang, EQUIP_SLOT_LABELS[slot] || slot); }

// 부상은 모험(턴 소모) 단위로 회복이 진행됨 - 새로 다치거나 악화된 부위는 freshInjuries로 갱신되고,
// 그 외 기존 부상은 턴이 1 지날 때마다 회복 카운트가 줄어듦(본인/용병 공용 로직)
function decayInjuries(prevInjuries, freshInjuries) {
  const prev = prevInjuries || { arm: { severity: 0, turnsLeft: 0 }, leg: { severity: 0, turnsLeft: 0 } };
  const injuries = {};
  for (const part of ['arm', 'leg']) {
    const prevPart = prev[part] || { severity: 0, turnsLeft: 0 };
    const fresh = freshInjuries && freshInjuries[part];
    if (fresh) {
      injuries[part] = { severity: fresh.severity, turnsLeft: fresh.turnsLeft };
    } else if (prevPart.severity > 0) {
      const turnsLeft = Math.max(0, prevPart.turnsLeft - 1);
      injuries[part] = turnsLeft > 0 ? { severity: prevPart.severity, turnsLeft } : { severity: 0, turnsLeft: 0 };
    } else {
      injuries[part] = { severity: 0, turnsLeft: 0 };
    }
  }
  return injuries;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId, optionIndex, lang } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  const isAdmin = isAdminUsername(username); // 관리자는 테스트 편의를 위해 턴포인트 한도/가방 용량 제한 없음

  const zone = ZONES[zoneId];
  if (!zone) return res.status(400).json({ error: 'invalid zoneId' });

  // updateFn은 재시도 시 다시 호출될 수 있음 - 마지막으로 실제 커밋된 시도의 outcome만 유효
  let outcome = null;

  try {
    const docPath = characterDocPath(username, slot);
    const facilitiesPath = accountFacilitiesDocPath(username, slot);
    await withMultiDocTransaction([docPath, facilitiesPath], (docs) => {
      const character = docs[docPath] || defaultCharacter(slot);
      const accountFacilities = docs[facilitiesPath] || defaultAccountFacilities();
      // 용병 해고로 반납된 장비 등으로 가방이 칸/무게 한도를 넘었으면 정리하기 전까진 사냥을 막음(관리자 제외)
      if (!isAdmin && isOverCapacity(character)) { outcome = { error: 'inventory_over_capacity' }; return {}; }
      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);

      // 마을을 넘어가는 이동(다른 마을 소속 지역 진입)은 턴포인트 1을 추가로 소모함 - 마을 내
      // 이동/텔레포트 스크롤은 여전히 무료, 마을 간 이동만 비용이 붙음
      const travelingBetweenTowns = zone.town && character.currentTown && zone.town !== character.currentTown;
      const turnCost = 1 + (travelingBetweenTowns ? 1 : 0);
      if (!isAdmin && turns < turnCost) { outcome = { error: 'not_enough_turns' }; return {}; }
      if (zone.unlockZoneId && ((character.zoneClearCounts || {})[zone.unlockZoneId] || 0) < CASTLE_CLEAR_REQUIREMENT) {
        outcome = { error: 'zone_locked' }; return {};
      }
      const inventory = [...(character.inventory || [])];
      if (zone.requiresTorch) {
        const torchQty = (inventory.find((e) => e.itemId === 'torch') || {}).qty || 0;
        if (torchQty < 1) { outcome = { error: 'no_torch' }; return {}; }
        removeItem(inventory, 'torch', 1);
      }
      // 전투/개간지 골드보너스는 공용 시설 레벨 기준(캐릭터별 stale 값이 아니라 이 트랜잭션에서 읽은 최신값)
      const characterForCombat = { ...character, facilityLevels: accountFacilities.facilityLevels };

      // 입원 중이거나 영지에서 일하는(assignment:'territory') 용병은 모험에 동행하지 않음(보수도 안 나감) -
      // 그냥 시간이 지나며 자연 회복만 진행됨(영지 수입은 collect-territory-income.js가 별도 정산)
      const restingMercs = (character.mercenaries || []).filter((m) => m.hospitalized || m.assignment !== 'active');
      // 용병 보수는 모험 1회당 자동 차감(전투 동행 중인 용병만) - 못 내면 그 용병들만 전원 해고
      let gold = character.gold || 0;
      let mercenaries = (character.mercenaries || []).filter((m) => !m.hospitalized && m.assignment === 'active');
      const totalWage = mercenaries.reduce((sum, m) => sum + (m.wagePerAdventure || 0), 0);
      const wageMessages = [];
      if (totalWage > 0) {
        if (gold < totalWage) {
          wageMessages.push(ti('rpg.log.wageUnpaid', lang, { wage: totalWage }));
          mercenaries = [];
        } else {
          gold -= totalWage;
        }
      }

      // 필드 미리보기(preview-zone.js)로 이미 본 몹 구성 후보들 중 유저가 고른 하나(optionIndex)를 그대로
      // 씀("보이는 게 곧 상대") - 미리보기가 없거나 인덱스가 잘못됐으면(미리보기 화면을 건너뛴 예전
      // 클라이언트 등) 안전하게 그 자리에서 새로 굴림
      const zonePreview = (character.zonePreviews || {})[zoneId];
      const chosenOption = (zonePreview && zonePreview.zoneId === zoneId && zonePreview.options
        && zonePreview.options[optionIndex]) || null;
      const presetEncounter = chosenOption
        ? { zone, monsterIds: chosenOption.monsterIds, isRare: chosenOption.isRare, uniqueTier: chosenOption.uniqueTier }
        : null;
      const combatResult = resolveCombat({ character: { ...characterForCombat, mercenaries }, zoneId, stance: character.stance, presetEncounter, lang });
      combatResult.log.unshift(...wageMessages);
      if (travelingBetweenTowns) {
        combatResult.log.unshift(ti('rpg.log.townTravel', lang, { town: getTownName(zone.town, lang) }));
      }

      const overflowedLoot = [];
      const overweightLoot = [];
      for (const drop of combatResult.loot) {
        const added = tryAddItem(character, inventory, drop.itemId, drop.qty);
        if (!added.ok) (added.reason === 'overweight' ? overweightLoot : overflowedLoot).push(drop.itemId);
      }
      if (overflowedLoot.length) combatResult.log.push(tLang('rpg.log.inventoryFullLoot', lang, '인벤토리가 가득 차서 일부 전리품을 놓쳤다.'));
      if (overweightLoot.length) combatResult.log.push(tLang('rpg.log.overweightLoot', lang, '짐이 너무 무거워서 일부 전리품을 챙기지 못했다.'));

      // 전투 1회를 치르면 장착중인 무기/방어구가 마모됨 - 내구도가 낮을수록 조기 파손 확률이 높아짐.
      // 초급 지역(tier 낮음)은 아직 수리비 감당이 버거운 시기라 마모가 아예 안 일어나는 판을 늘려줌
      const wearChance = zone.tier <= 2 ? 0.35 : zone.tier <= 5 ? 0.7 : 1;
      const { equipment: wornEquipment, brokenNow } = applyEquipmentWear(character.equipment || {}, wearChance);
      brokenNow.forEach((s) => combatResult.log.push(ti('rpg.log.equipBroken', lang, { slot: equipSlotLabelFor(s, lang) })));

      // 죽으면(패배) 아이템은 그대로 유지한 채 마지막으로 있었던 마을로 돌아감 - 부활 자체는 무료지만
      // 소지금의 10%를 잃고(resolveCombat이 계산한 goldLost), 다시 사냥터까지 가려면 소모품을
      // 또 써야 하니 결과적으로 골드 소모를 유도함
      const nextTown = zone.town || character.currentTown || 'town1';
      if (!combatResult.victory) {
        const townName = getTownName(nextTown, lang);
        if (combatResult.goldLost > 0) combatResult.log.push(ti('rpg.log.goldStolen', lang, { gold: combatResult.goldLost }));
        combatResult.log.push(ti('rpg.log.wokeUpInTown', lang, { town: townName }));
      }

      const zoneKillCounts = { ...(character.zoneKillCounts || {}) };
      zoneKillCounts[zoneId] = combatResult.isRareEncounter
        ? 0
        : (zoneKillCounts[zoneId] || 0) + combatResult.killedMonsterIds.length;

      // 성 도전 자격용 - 레어 pity와 무관하게 그 지역 모험을 승리로 마친 횟수(100 이상이면 도전 가능)
      const zoneClearCounts = { ...(character.zoneClearCounts || {}) };
      if (combatResult.victory) zoneClearCounts[zoneId] = (zoneClearCounts[zoneId] || 0) + 1;

      const visitedZones = [...(character.visitedZones || [])];
      const isFirstVisit = !visitedZones.includes(zoneId);
      if (isFirstVisit) visitedZones.push(zoneId);

      const defeatedRareMonsterId = (combatResult.isRareEncounter && combatResult.victory)
        ? combatResult.killedMonsterIds[0]
        : null;
      const loreContext = {
        visitedZoneId: isFirstVisit ? zoneId : null,
        defeatedRareMonsterId,
      };
      const newLoreIds = checkNewLoreUnlocks(character, loreContext);
      const loreUnlocked = [...(character.loreUnlocked || []), ...newLoreIds];
      const newLoreEntries = newLoreIds.map((id) => LORE_ENTRIES[id]);

      const injuries = decayInjuries(character.injuries, combatResult.newInjuries);
      const progression = applyXpGain(character, combatResult.xpGain);

      // 개간지(시설) 레벨만큼 전투 골드획득에 % 보너스
      const bonusedGoldGain = Math.floor(combatResult.goldGain * facilityBonusMultiplier(characterForCombat, 'clearing'));

      // 영지일 경계 판정 - 지금까지 쓴 누적 턴(관리자도 포함, 통계용)이 이번 모험의 턴소모만큼 늘어났고,
      // 그로 인해 "영지일"이 하루 이상 지났으면 영지 경제(시설레벨/식량/골드/용병 상주급여)를 정산함
      const nextTotalTurnsSpent = (character.totalTurnsSpent || 0) + turnCost;
      const daysNow = territoryDaysElapsed(nextTotalTurnsSpent, progression.level);
      const daysSinceCheckpoint = daysNow - (character.territoryDayCheckpoint || 0);
      const territorySettlement = settleTerritoryDays(characterForCombat, daysSinceCheckpoint);
      let territoryNotice = null;
      if (territorySettlement) {
        territoryNotice = {
          daysProcessed: territorySettlement.daysProcessed,
          goldIncome: territorySettlement.goldIncome,
          wagePaid: territorySettlement.wagePaid,
          foodEmergencyCost: territorySettlement.foodEmergencyCost,
          goldDelta: territorySettlement.goldDelta,
          leveledUp: territorySettlement.leveledUp,
        };
      }

      // 용병 결과 반영 - 각자 체력/마나/부상/내구도/경험치를 본인과 동일한 방식으로 처리.
      // 용병 레벨은 본인 레벨을 넘지 못함(주인공이 파티의 성장 한계) - 넘으면 경험치도 그 시점에서 멈춤
      const updatedMercenaries = mercenaries.map((merc) => {
        const mr = combatResult.mercenaries.find((r) => r.id === merc.id);
        if (!mr) return merc;
        const { equipment: mercWornEquipment, brokenNow: mercBrokenNow } = applyEquipmentWear(merc.equipment || {}, wearChance);
        mercBrokenNow.forEach((s) => combatResult.log.push(ti('rpg.log.mercEquipBroken', lang, { merc: merc.name, slot: equipSlotLabelFor(s, lang) })));
        let mercProgression = applyXpGain(merc, combatResult.xpGain);
        if (mercProgression.level > progression.level) {
          if (merc.level < progression.level) combatResult.log.push(ti('rpg.log.mercLevelCapped', lang, { merc: merc.name }));
          mercProgression = { level: progression.level, xp: 0, statPoints: mercProgression.statPoints };
        }
        return {
          ...merc,
          level: mercProgression.level,
          xp: mercProgression.xp,
          statPoints: mercProgression.statPoints,
          currentHp: mr.finalHp,
          currentMp: mr.finalMp,
          currentStamina: mr.finalStamina,
          equipment: mercWornEquipment,
          injuries: decayInjuries(merc.injuries, mr.newInjuries),
        };
      });

      // 입원/영지 근무 중인 용병도 전투는 안 하지만 턴은 지나가니 부상 회복은 계속 진행됨 - 입원 중이었고
      // 다 나으면 자동 퇴원(영지 근무는 계속 유지, 병상만 벗어남)
      const updatedRestingMercs = restingMercs.map((merc) => {
        const nextInjuries = decayInjuries(merc.injuries, null);
        const stillInjured = ['arm', 'leg'].some((p) => nextInjuries[p].severity > 0);
        if (merc.hospitalized && !stillInjured) combatResult.log.push(ti('rpg.log.mercDischarged', lang, { merc: merc.name }));
        return { ...merc, injuries: nextInjuries, hospitalized: merc.hospitalized && stillInjured };
      });
      const allUpdatedMercenaries = [...updatedMercenaries, ...updatedRestingMercs];

      const nextTurns = isAdmin ? turns : turns - turnCost;
      const territoryGoldDelta = territorySettlement ? territorySettlement.goldDelta : 0;
      const finalGold = Math.max(0, gold + bonusedGoldGain - combatResult.goldLost + territoryGoldDelta);
      outcome = {
        newLore: newLoreEntries,
        log: combatResult.log,
        victory: combatResult.victory,
        isRareEncounter: combatResult.isRareEncounter,
        xpGain: combatResult.xpGain,
        goldGain: bonusedGoldGain,
        loot: combatResult.loot,
        turnPoints: nextTurns,
        turnPointsCap: turnCapForLevel(progression.level, character.surveyBonusUnlocked),
        currentHp: combatResult.finalHp,
        currentMp: combatResult.finalMp,
        currentStamina: combatResult.finalStamina,
        finalHpPct: combatResult.finalHpPct,
        currentTown: nextTown,
        level: progression.level,
        levelsGained: progression.levelsGained,
        statPoints: progression.statPoints,
        equipment: wornEquipment,
        injuries,
        mercenaries: allUpdatedMercenaries,
        wagePaid: totalWage,
        gold: finalGold,
        territoryNotice,
      };

      return {
        [docPath]: {
          ...character,
          gold: finalGold,
          level: progression.level,
          xp: progression.xp,
          statPoints: progression.statPoints,
          turnPoints: nextTurns,
          turnPointsUpdatedAt: now,
          totalTurnsSpent: nextTotalTurnsSpent,
          territoryDayCheckpoint: daysNow,
          foodStock: territorySettlement ? territorySettlement.nextFoodStock : character.foodStock,
          currentHp: combatResult.finalHp,
          currentMp: combatResult.finalMp,
          currentStamina: combatResult.finalStamina,
          currentTown: nextTown,
          inventory,
          zoneKillCounts,
          zoneClearCounts,
          visitedZones,
          loreUnlocked,
          equipment: wornEquipment,
          injuries,
          mercenaries: allUpdatedMercenaries,
          // 이번 조우는 소비됨 - 이 지역만 미리보기를 비움(다른 지역 미리보기는 그대로 유지),
          // 다음에 이 지역을 다시 보면 무료로 새로 굴려짐
          zonePreviews: { ...(character.zonePreviews || {}), [zoneId]: null },
          updatedAt: now,
        },
        [facilitiesPath]: territorySettlement
          ? { facilityDays: territorySettlement.nextFacilityDays, facilityLevels: territorySettlement.nextFacilityLevels, updatedAt: now }
          : undefined,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
