import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { removeItem, tryAddItem } from '../_rpgInventory.js';
import { ZONES } from '../../data/rpg/zones.js';
import { TOWNS } from '../../data/rpg/towns.js';
import { resolveCombat, applyEquipmentWear } from '../../rpg-combat.js';
import { applyXpGain } from '../../rpg-progression.js';
import { checkNewLoreUnlocks } from '../../rpg-lore.js';
import { LORE_ENTRIES } from '../../data/rpg/lore.js';
import { isAdminUsername } from '../_rpgAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  const isAdmin = isAdminUsername(username); // 관리자는 테스트 편의를 위해 턴포인트 한도 없음

  const zone = ZONES[zoneId];
  if (!zone) return res.status(400).json({ error: 'invalid zoneId' });

  // updateFn은 재시도 시 다시 호출될 수 있음 - 마지막으로 실제 커밋된 시도의 outcome만 유효
  let outcome = null;

  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now);

      if (!isAdmin && turns < 1) { outcome = { error: 'not_enough_turns' }; return null; }
      const inventory = [...(character.inventory || [])];
      if (zone.requiresTorch) {
        const torchQty = (inventory.find((e) => e.itemId === 'torch') || {}).qty || 0;
        if (torchQty < 1) { outcome = { error: 'no_torch' }; return null; }
        removeItem(inventory, 'torch', 1);
      }

      const combatResult = resolveCombat({ character, zoneId, stance: character.stance });

      const overflowedLoot = [];
      const overweightLoot = [];
      for (const drop of combatResult.loot) {
        const added = tryAddItem(character, inventory, drop.itemId, drop.qty);
        if (!added.ok) (added.reason === 'overweight' ? overweightLoot : overflowedLoot).push(drop.itemId);
      }
      if (overflowedLoot.length) combatResult.log.push('인벤토리가 가득 차서 일부 전리품을 놓쳤다.');
      if (overweightLoot.length) combatResult.log.push('짐이 너무 무거워서 일부 전리품을 챙기지 못했다.');
      for (const [itemId, usedQty] of Object.entries(combatResult.potionsUsed)) removeItem(inventory, itemId, usedQty);
      if (combatResult.arrowsUsed > 0) removeItem(inventory, 'arrow', combatResult.arrowsUsed);

      // 전투 1회를 치르면 장착중인 무기/방어구가 마모됨 - 내구도가 낮을수록 조기 파손 확률이 높아짐
      const { equipment: wornEquipment, brokenNow } = applyEquipmentWear(character.equipment || {});
      if (brokenNow.includes('weapon')) combatResult.log.push('무기가 파손되었습니다! 수리가 필요해요.');
      if (brokenNow.includes('armor')) combatResult.log.push('방어구가 파손되었습니다! 수리가 필요해요.');

      // 죽으면(패배) 아이템은 그대로 유지한 채 마지막으로 있었던 마을로 돌아감 - 부활 자체는 무료지만
      // 다시 사냥터까지 가려면 소모품을 또 써야 하니 결과적으로 골드 소모를 유도함
      const nextTown = zone.town || character.currentTown || 'town1';
      if (!combatResult.victory) {
        const townName = (TOWNS[nextTown] || {}).name || nextTown;
        combatResult.log.push(`정신을 차려보니 ${townName}이었다.`);
      }

      const zoneKillCounts = { ...(character.zoneKillCounts || {}) };
      zoneKillCounts[zoneId] = combatResult.isRareEncounter
        ? 0
        : (zoneKillCounts[zoneId] || 0) + combatResult.killedMonsterIds.length;

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

      // 부상은 모험(턴 소모) 단위로 회복이 진행됨 - 이번 전투에서 새로 다치거나 악화된 부위는
      // combatResult.newInjuries로 갱신되고, 그 외 기존 부상은 턴이 1 지날 때마다 회복 카운트가 줄어듦
      const prevInjuries = character.injuries || { arm: { severity: 0, turnsLeft: 0 }, leg: { severity: 0, turnsLeft: 0 } };
      const injuries = {};
      for (const part of ['arm', 'leg']) {
        const prev = prevInjuries[part] || { severity: 0, turnsLeft: 0 };
        const fresh = combatResult.newInjuries && combatResult.newInjuries[part];
        if (fresh) {
          injuries[part] = { severity: fresh.severity, turnsLeft: fresh.turnsLeft };
        } else if (prev.severity > 0) {
          const turnsLeft = Math.max(0, prev.turnsLeft - 1);
          injuries[part] = turnsLeft > 0 ? { severity: prev.severity, turnsLeft } : { severity: 0, turnsLeft: 0 };
        } else {
          injuries[part] = { severity: 0, turnsLeft: 0 };
        }
      }

      const nextTurns = isAdmin ? turns : turns - 1;
      const progression = applyXpGain(character, combatResult.xpGain);
      outcome = {
        newLore: newLoreEntries,
        log: combatResult.log,
        victory: combatResult.victory,
        isRareEncounter: combatResult.isRareEncounter,
        xpGain: combatResult.xpGain,
        goldGain: combatResult.goldGain,
        loot: combatResult.loot,
        turnPoints: nextTurns,
        turnPointsCap: turnCapForLevel(progression.level),
        currentHp: combatResult.finalHp,
        currentMp: combatResult.finalMp,
        finalHpPct: combatResult.finalHpPct,
        currentTown: nextTown,
        level: progression.level,
        levelsGained: progression.levelsGained,
        statPoints: progression.statPoints,
        equipment: wornEquipment,
        injuries,
      };

      return {
        ...character,
        gold: (character.gold || 0) + combatResult.goldGain,
        level: progression.level,
        xp: progression.xp,
        statPoints: progression.statPoints,
        turnPoints: nextTurns,
        turnPointsUpdatedAt: now,
        currentHp: combatResult.finalHp,
        currentMp: combatResult.finalMp,
        currentTown: nextTown,
        inventory,
        zoneKillCounts,
        visitedZones,
        loreUnlocked,
        equipment: wornEquipment,
        injuries,
        updatedAt: now,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
