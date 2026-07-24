// 순수 계산 모듈(입출력 없음) — tax-lots.js와 같은 패턴. RNG(Math.random)만 사용하고
// Firestore/네트워크 호출은 하지 않음 -> api/rpg/adventure.js가 이 결과를 트랜잭션 안에서 저장.
import { ZONES, RARE_PITY_BASE_CHANCE, RARE_PITY_KILL_THRESHOLD, RARE_PITY_INCREMENT_PER_KILL } from './data/rpg/zones.js';
import { MONSTERS } from './data/rpg/monsters.js';
import { ITEMS } from './data/rpg/items.js';
import { CLASSES } from './data/rpg/classes.js';
import { elementalMultiplier } from './data/rpg/elements.js';

const MAX_ROUNDS_PER_ENCOUNTER = 40;
const BASE_INJURY_CHANCE = 0.08;
const WEAK_AFFINITY_INJURY_BONUS = 0.12; // 상성이 안 좋으면 다칠 확률이 더 높아짐
const BASE_DODGE_CHANCE = 0.08; // 다리가 온전할 때만 정상적으로 회피 시도 가능
// severity: 0=건강, 1=경상(붕대로 치료 가능), 2=중상(의사에게만 치료 가능)
const INJURY_ATK_MULT = { 1: 0.85, 2: 0.6 };
const INJURY_DODGE_MULT = { 1: 0.5, 2: 0 };
const INJURY_INCOMING_DAMAGE_BONUS = { 1: 0.1, 2: 0.25 };
const INJURY_DURATION_RANGE = { 1: [5, 15], 2: [15, 40] };
const BODY_PART_NAMES = { arm: '팔', leg: '다리' };
// 아주 작은 확률로 단계를 건너뛰고 곧장 중상 - 상성이 나쁘거나 지역에 비해 렙이 낮으면 더 잘 발생
const DIRECT_SEVERE_BASE_CHANCE = 0.02;
const DIRECT_SEVERE_WEAK_AFFINITY_BONUS = 0.03;
const DIRECT_SEVERE_UNDERLEVEL_BONUS = 0.03;
const UNDERLEVEL_ZONE_MULTIPLIER = 3;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

// 지역 킬카운트를 반영한 레어몹 pity 확률
export function rareChanceForZone(killCount) {
  const over = Math.max(0, (killCount || 0) - RARE_PITY_KILL_THRESHOLD);
  return Math.min(1, RARE_PITY_BASE_CHANCE + over * RARE_PITY_INCREMENT_PER_KILL);
}

// 지역 진입 -> 몹 구성(일반 무리 또는 레어 단독) 결정
export function rollEncounter(zoneId, killCount) {
  const zone = ZONES[zoneId];
  if (!zone) throw new Error(`unknown zoneId: ${zoneId}`);

  const rareChance = rareChanceForZone(killCount);
  if (Math.random() < rareChance) {
    return { zone, monsterIds: [zone.rareMonsterId], isRare: true };
  }
  const groupSize = randInt(zone.groupSizeMin, zone.groupSizeMax);
  const monsterIds = Array.from({ length: groupSize }, () => zone.monsterIds[randInt(0, zone.monsterIds.length - 1)]);
  return { zone, monsterIds, isRare: false };
}

function buildMonsterInstance(monsterId, zone) {
  const def = MONSTERS[monsterId];
  const variance = randRange(zone.varianceMin, zone.varianceMax);
  return {
    id: def.id, name: def.name, element: def.element, tags: def.tags || [], rare: !!def.rare,
    statusImmune: !!def.statusImmune, poisonChance: def.poisonChance || 0, ambushChance: def.ambushChance || 0,
    maxHp: Math.round(def.baseStats.hp * variance),
    hp: Math.round(def.baseStats.hp * variance),
    atk: Math.round(def.baseStats.atk * variance),
    def: Math.round(def.baseStats.def * variance),
    xp: def.xp, goldMin: def.goldMin, goldMax: def.goldMax, dropTable: def.dropTable,
  };
}

// 반지/목걸이의 힘/민첩/지능 보너스를 기본 스탯에 더한 "실효 스탯" - 전투 계산과 소지 가능 무게 계산이 공유
export function effectiveStats(character) {
  const stats = character.stats || { str: 5, int: 5, agi: 5, vit: 5 };
  const equipment = character.equipment || {};
  const ringItem = equipment.ring ? ITEMS[equipment.ring] : null;
  const necklaceItem = equipment.necklace ? ITEMS[equipment.necklace] : null;
  return {
    str: stats.str + ((ringItem && ringItem.strBonus) || 0) + ((necklaceItem && necklaceItem.strBonus) || 0),
    agi: stats.agi + ((ringItem && ringItem.agiBonus) || 0) + ((necklaceItem && necklaceItem.agiBonus) || 0),
    int: stats.int + ((ringItem && ringItem.intBonus) || 0) + ((necklaceItem && necklaceItem.intBonus) || 0),
    vit: stats.vit,
  };
}

// 레벨/스탯/직업/장비로부터 전투용 파생 스탯 계산
export function computeCharacterCombatStats(character) {
  const stats = effectiveStats(character);
  const level = character.level || 1;
  const mainCls = CLASSES[character.classMain] || CLASSES.warrior;
  const subCls = character.classSub ? CLASSES[character.classSub] : null;
  // 겸업(부직업)을 고르면 부직업 스킬까지 함께 사용 가능 - 본업 정체성(무기타입/스탯보정)은 그대로 유지
  const skills = subCls ? [...mainCls.skills, ...subCls.skills] : mainCls.skills;
  const classDef = { ...mainCls, skills };
  const scalingStat = mainCls.statScaling.atk === 'agi' ? stats.agi : stats.str;

  const equipment = character.equipment || {};
  const weaponItem = equipment.weapon ? ITEMS[equipment.weapon] : null;
  const armorItem = equipment.armor ? ITEMS[equipment.armor] : null;
  const ringItem = equipment.ring ? ITEMS[equipment.ring] : null;
  const necklaceItem = equipment.necklace ? ITEMS[equipment.necklace] : null;

  // 내구도 0이 되면 파손 - 수리 전까지 그 부위 보너스가 전부 사라짐(장신구는 내구도 대상 아님)
  const weaponBroken = weaponItem && (equipment.weaponDurability ?? 100) <= 0;
  const armorBroken = armorItem && (equipment.armorDurability ?? 100) <= 0;

  const weaponAtkBonus = weaponBroken ? 0 : ((weaponItem && weaponItem.atkBonus) || 0);
  const armorDefBonus = armorBroken ? 0 : ((armorItem && armorItem.defBonus) || 0);
  const armorHpBonus = armorBroken ? 0 : ((armorItem && armorItem.hpBonus) || 0);
  const accessoryAtkBonus = (ringItem && ringItem.atkBonus || 0) + (necklaceItem && necklaceItem.atkBonus || 0);
  const accessoryDefBonus = (ringItem && ringItem.defBonus || 0) + (necklaceItem && necklaceItem.defBonus || 0);
  const accessoryHpBonus = (ringItem && ringItem.hpBonus || 0) + (necklaceItem && necklaceItem.hpBonus || 0);

  return {
    maxHp: stats.vit * 10 + level * 5 + armorHpBonus + accessoryHpBonus,
    maxMp: stats.int * 5 + level * 2,
    maxStamina: 50 + level * 2, // 향후 스테미나 소모 스킬/행동에 대비한 자원(현재는 회복 대상으로만 사용)
    atk: scalingStat * 2 + level + weaponAtkBonus + accessoryAtkBonus,
    def: stats.vit + armorDefBonus + accessoryDefBonus,
    element: weaponBroken ? 'none' : ((weaponItem && weaponItem.element) || 'none'), // 무기 파손시 속성공격도 사라짐
    weaponType: (weaponItem && weaponItem.weaponType) || null,
    weaponBroken: !!weaponBroken,
    armorBroken: !!armorBroken,
    // 방어구의 "중상방어" 속성 - 중상을 입을 확률을 이만큼 줄여줌(파손되면 무효)
    severeInjuryResist: armorBroken ? 0 : ((armorItem && armorItem.severeInjuryResist) || 0),
    classDef,
  };
}

// 전투 1회를 치른 뒤 장착중인 무기/방어구에 마모를 적용 - 내구도가 낮을수록 조기 파손 확률이 높아짐
export function applyEquipmentWear(equipment) {
  const next = { ...equipment };
  const brokenNow = [];
  const wearOne = (itemKey, durabilityKey) => {
    if (!next[itemKey]) return;
    const before = next[durabilityKey] ?? 100;
    if (before <= 0) return; // 이미 파손됨 - 수리 전까지 더 닳지 않음
    const wear = randInt(1, 3);
    let after = Math.max(0, before - wear);
    const breakChance = Math.min(0.8, (100 - after) / 150);
    if (after > 0 && Math.random() < breakChance) after = 0;
    next[durabilityKey] = after;
    if (after === 0) brokenNow.push(itemKey);
  };
  wearOne('weapon', 'weaponDurability');
  wearOne('armor', 'armorDurability');
  return { equipment: next, brokenNow };
}

function inventoryQty(inventory, itemId) {
  const entry = (inventory || []).find((e) => e.itemId === itemId);
  return entry ? entry.qty : 0;
}

// 스탠스+포션규칙에 따라 이번 라운드에 포션을 쓸지 결정 (potionsUsed는 호출 사이 누적 상태)
function maybeUsePotion({ character, hp, maxHp, potionsUsed, log }) {
  for (const rule of character.potionRules || []) {
    const used = potionsUsed[rule.itemId] || 0;
    if (used >= rule.maxPerBattle) continue;
    if (inventoryQty(character.inventory, rule.itemId) - used <= 0) continue;
    const hpPct = (hp / maxHp) * 100;
    if (hpPct > rule.hpThresholdPct) continue;
    const item = ITEMS[rule.itemId];
    if (!item) continue;
    potionsUsed[rule.itemId] = used + 1;
    if (item.healPct) {
      const healAmount = Math.round(maxHp * item.healPct);
      log.push(`${item.name}을(를) 사용해 체력을 ${healAmount} 회복했다.`);
      return { hpDelta: healAmount };
    }
  }
  return null;
}

// 직업-몹 타입 상성(확률 발동) - 명중 보장 아님, 발동하면 그 라운드 데미지에 배율 적용
function classMonsterAffinity(classDef, monsterTags) {
  for (const entry of classDef.strongVs || []) {
    if (monsterTags.includes(entry.tag) && Math.random() < entry.chance) {
      return { multiplier: entry.multiplier, kind: 'strong' };
    }
  }
  for (const entry of classDef.weakVs || []) {
    if (monsterTags.includes(entry.tag) && Math.random() < entry.chance) {
      return { multiplier: entry.multiplier, kind: 'weak' };
    }
  }
  return null;
}

function rollLoot(monster) {
  const loot = [];
  for (const drop of monster.dropTable || []) {
    if (Math.random() < drop.chance) {
      loot.push({ itemId: drop.itemId, qty: randInt(drop.qtyMin, drop.qtyMax) });
    }
  }
  return loot;
}

// 전투 전체(무리 몹 순차 처리 포함) 판정 - 결과만 반환, 아무것도 저장하지 않음
export function resolveCombat({ character, zoneId, stance }) {
  const encounter = rollEncounter(zoneId, (character.zoneKillCounts || {})[zoneId] || 0);
  const monsters = encounter.monsterIds.map((id) => buildMonsterInstance(id, encounter.zone));
  const combatStats = computeCharacterCombatStats(character);

  // 장신구 특수 효과(속성방어/2번공격) - 반지/목걸이 둘 중 하나라도 있으면 적용, elementDefense는 'all'이면 모든 속성에 적용
  const equipmentRef = character.equipment || {};
  const ringItemRef = equipmentRef.ring ? ITEMS[equipmentRef.ring] : null;
  const necklaceItemRef = equipmentRef.necklace ? ITEMS[equipmentRef.necklace] : null;
  const accessoryElementDefense = (ringItemRef && ringItemRef.elementDefense) || (necklaceItemRef && necklaceItemRef.elementDefense) || null;
  const doubleAttackChance = (ringItemRef && ringItemRef.doubleAttackChance) || (necklaceItemRef && necklaceItemRef.doubleAttackChance) || 0;

  // HP/MP는 모험 사이에도 유지됨(전투마다 풀피 리셋 아님) - 포션 소모가 골드 소모로 이어지게 하기 위함
  let hp = typeof character.currentHp === 'number' ? character.currentHp : combatStats.maxHp;
  let mp = typeof character.currentMp === 'number' ? character.currentMp : combatStats.maxMp;
  const potionsUsed = {};
  const usesBow = combatStats.weaponType === 'bow';
  let arrowsUsed = 0;
  // 부상은 이번 전투에서만 끝나는 게 아니라 캐릭터 문서에 남아 여러 턴(모험) 동안 지속됨(adventure.js가 관리)
  // severity: 0=건강, 1=경상(붕대로 치료 가능), 2=중상(의사에게만 치료 가능)
  const injurySeverity = {
    arm: (character.injuries && character.injuries.arm && character.injuries.arm.severity) || 0,
    leg: (character.injuries && character.injuries.leg && character.injuries.leg.severity) || 0,
  };
  const newInjuries = {}; // 이번 전투 중 심각도가 "바뀐" 부위만 담김({severity, turnsLeft})
  const isUnderleveled = (character.level || 1) < encounter.zone.tier * 3; // 지역에 비해 렙이 많이 낮음
  const log = [`${encounter.zone.name}에 진입했다.`];
  let totalXp = 0;
  let totalGold = 0;
  const loot = [];
  const killedMonsterIds = [];
  let rounds = 0;
  let victory = true;

  outer:
  for (const monster of monsters) {
    log.push(`${monster.name}${monster.rare ? '(희귀)' : ''}이(가) 나타났다!`);
    while (monster.hp > 0) {
      rounds++;
      if (rounds > MAX_ROUNDS_PER_ENCOUNTER) { victory = false; log.push('너무 지쳐 전투를 중단했다.'); break outer; }

      const potionResult = maybeUsePotion({ character, hp, maxHp: combatStats.maxHp, potionsUsed, log });
      if (potionResult) hp = Math.min(combatStats.maxHp, hp + potionResult.hpDelta);

      // 캐릭터 턴: 공격형은 마나 있으면 스킬 우선, 안정형은 기본공격 위주(안전하게)
      const skills = combatStats.classDef.skills.filter((s) => s.type === 'attack' && s.manaCost <= mp);
      const useSkill = stance === 'aggressive' && skills.length > 0;
      const skill = useSkill ? skills[skills.length - 1] : null;
      let power = skill ? skill.power : 1.0;
      if (skill) mp -= skill.manaCost;

      // 활 장착시 화살 소모 - 화살이 없으면 위력이 크게 줄어듦(맨손 수준)
      if (usesBow) {
        const arrowsLeft = inventoryQty(character.inventory, 'arrow') - arrowsUsed;
        if (arrowsLeft > 0) arrowsUsed++;
        else { power *= 0.3; log.push('화살이 떨어졌다! 위력이 크게 약해졌다.'); }
      }

      if (injurySeverity.arm > 0) power *= INJURY_ATK_MULT[injurySeverity.arm]; // 팔 부상 - 공격력 약화

      const elemMult = elementalMultiplier(combatStats.element, monster.element);
      const affinity = classMonsterAffinity(combatStats.classDef, monster.tags);
      const affinityMult = affinity ? affinity.multiplier : 1;
      const affinityNote = affinity
        ? (affinity.kind === 'strong' ? ' (천적 관계! 추가 피해)' : ' (상성에 밀려 위력 약화)')
        : '';

      // 장신구의 "확률적 2타" 효과 - 발동하면 같은 라운드에 한 번 더 때림
      const hitCount = Math.random() < doubleAttackChance ? 2 : 1;
      let monsterDied = false;
      for (let hitIdx = 0; hitIdx < hitCount && !monsterDied; hitIdx++) {
        const rawDamage = Math.max(1, Math.round((combatStats.atk * power * elemMult * affinityMult - monster.def) * randRange(0.85, 1.15)));
        monster.hp -= rawDamage;
        const hitLabel = hitIdx === 1 ? ' (2연타!)' : '';
        log.push(`${skill ? skill.name : '공격'}! ${monster.name}에게 ${rawDamage} 피해.${affinityNote}${hitLabel}`);
        if (monster.hp <= 0) monsterDied = true;
      }

      if (monsterDied) {
        log.push(`${monster.name}을(를) 쓰러뜨렸다.`);
        totalXp += monster.xp;
        totalGold += randInt(monster.goldMin, monster.goldMax);
        loot.push(...rollLoot(monster));
        killedMonsterIds.push(monster.id);
        break;
      }

      // 몹 턴 - 다리 부상 정도에 따라 회피 확률이 줄어듦
      const dodgeChance = BASE_DODGE_CHANCE * (injurySeverity.leg ? INJURY_DODGE_MULT[injurySeverity.leg] : 1);
      const dodged = Math.random() < dodgeChance;
      if (dodged) {
        log.push(`${monster.name}의 공격을 회피했다!`);
      } else {
        // 부상 중이면 생명력이 더 잘 떨어짐(경상<중상) + 장신구의 속성방어가 있으면 해당 속성 피해 경감
        const injuryDamageBonus = (INJURY_INCOMING_DAMAGE_BONUS[injurySeverity.arm] || 0) + (INJURY_INCOMING_DAMAGE_BONUS[injurySeverity.leg] || 0);
        const elementResistMult = (accessoryElementDefense === 'all' || accessoryElementDefense === monster.element) ? 0.7 : 1;
        const monsterDamage = Math.max(1, Math.round((monster.atk - combatStats.def) * randRange(0.85, 1.15) * (1 + injuryDamageBonus) * elementResistMult));
        hp -= monsterDamage;
        log.push(`${monster.name}의 반격! ${monsterDamage} 피해를 입었다.`);
        if (!monster.statusImmune && monster.poisonChance > 0 && Math.random() < monster.poisonChance) {
          const poisonDamage = Math.round(combatStats.maxHp * 0.05);
          hp -= poisonDamage;
          log.push(`중독됐다! ${poisonDamage} 피해.`);
        }

        // 아주 작은 확률로 단계를 건너뛰고 곧장 중상 - 상성 나쁨/언더레벨이면 더 잘 발생, 방어구/장신구의 중상방어로 완화
        const resist = Math.min(0.8, combatStats.severeInjuryResist || 0);
        const eligibleParts = Object.keys(injurySeverity).filter((p) => injurySeverity[p] < 2);
        let injuryHandled = false;
        if (eligibleParts.length) {
          const directSevereChance = (DIRECT_SEVERE_BASE_CHANCE
            + (affinity && affinity.kind === 'weak' ? DIRECT_SEVERE_WEAK_AFFINITY_BONUS : 0)
            + (isUnderleveled ? DIRECT_SEVERE_UNDERLEVEL_BONUS : 0)) * (1 - resist);
          if (Math.random() < directSevereChance) {
            const part = eligibleParts[randInt(0, eligibleParts.length - 1)];
            injurySeverity[part] = 2;
            const [lo, hi] = INJURY_DURATION_RANGE[2];
            const turnsLeft = randInt(lo, hi);
            newInjuries[part] = { severity: 2, turnsLeft };
            log.push(`${BODY_PART_NAMES[part]}에 심각한 부상을 입었다! (중상, ${turnsLeft}턴)`);
            injuryHandled = true;
          }
        }

        // 그게 아니면 평소 확률로 한 단계만 악화(건강->경상 또는 경상->중상)
        if (!injuryHandled && eligibleParts.length) {
          const part = eligibleParts[randInt(0, eligibleParts.length - 1)];
          const nextSeverity = injurySeverity[part] + 1;
          const baseChance = BASE_INJURY_CHANCE + (affinity && affinity.kind === 'weak' ? WEAK_AFFINITY_INJURY_BONUS : 0);
          const chance = nextSeverity === 2 ? baseChance * (1 - resist) : baseChance;
          if (Math.random() < chance) {
            injurySeverity[part] = nextSeverity;
            const [lo, hi] = INJURY_DURATION_RANGE[nextSeverity];
            const turnsLeft = randInt(lo, hi);
            newInjuries[part] = { severity: nextSeverity, turnsLeft };
            log.push(nextSeverity === 2
              ? `${BODY_PART_NAMES[part]} 부상이 중상으로 악화됐다! (${turnsLeft}턴)`
              : `${BODY_PART_NAMES[part]}을(를) 다쳤다! 경상, ${turnsLeft}턴 동안 유지된다.`);
          }
        }
      }

      if (hp <= 0) { victory = false; log.push('쓰러졌다...'); break outer; }
    }
  }

  // 패배해도 페널티 없이 즉시 부활(풀피/풀마나) - 아이템은 그대로 유지
  const finalHp = victory ? Math.max(0, hp) : combatStats.maxHp;
  const finalMp = victory ? Math.max(0, mp) : combatStats.maxMp;

  return {
    log, victory, isRareEncounter: encounter.isRare, zoneId,
    xpGain: victory ? totalXp : Math.floor(totalXp * 0.3),
    goldGain: victory ? totalGold : Math.floor(totalGold * 0.3),
    loot: victory ? loot : [],
    killedMonsterIds,
    finalHp, finalMp,
    finalHpPct: Math.max(0, Math.round((finalHp / combatStats.maxHp) * 100)),
    potionsUsed,
    arrowsUsed,
    newInjuries,
  };
}
