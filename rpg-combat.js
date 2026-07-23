// 순수 계산 모듈(입출력 없음) — tax-lots.js와 같은 패턴. RNG(Math.random)만 사용하고
// Firestore/네트워크 호출은 하지 않음 -> api/rpg/adventure.js가 이 결과를 트랜잭션 안에서 저장.
import { ZONES, RARE_PITY_BASE_CHANCE, RARE_PITY_KILL_THRESHOLD, RARE_PITY_INCREMENT_PER_KILL } from './data/rpg/zones.js';
import { MONSTERS } from './data/rpg/monsters.js';
import { ITEMS } from './data/rpg/items.js';
import { CLASSES } from './data/rpg/classes.js';
import { elementalMultiplier } from './data/rpg/elements.js';

const MAX_ROUNDS_PER_ENCOUNTER = 40;

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

// 레벨/스탯/직업/장비로부터 전투용 파생 스탯 계산
export function computeCharacterCombatStats(character) {
  const stats = character.stats || { str: 5, int: 5, agi: 5, vit: 5 };
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
  const atkBonus = (weaponItem && weaponItem.atkBonus) || 0;
  const defBonus = (armorItem && armorItem.defBonus) || 0;
  const hpBonus = (armorItem && armorItem.hpBonus) || 0;

  return {
    maxHp: stats.vit * 10 + level * 5 + hpBonus,
    maxMp: stats.int * 5 + level * 2,
    maxStamina: 50 + level * 2, // 향후 스테미나 소모 스킬/행동에 대비한 자원(현재는 회복 대상으로만 사용)
    atk: scalingStat * 2 + level + atkBonus,
    def: stats.vit + defBonus,
    element: 'none', // 무기 속성 부여는 콘텐츠 확장 단계에서
    classDef,
  };
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

  // HP/MP는 모험 사이에도 유지됨(전투마다 풀피 리셋 아님) - 포션 소모가 골드 소모로 이어지게 하기 위함
  let hp = typeof character.currentHp === 'number' ? character.currentHp : combatStats.maxHp;
  let mp = typeof character.currentMp === 'number' ? character.currentMp : combatStats.maxMp;
  const potionsUsed = {};
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
      const power = skill ? skill.power : 1.0;
      if (skill) mp -= skill.manaCost;

      const elemMult = elementalMultiplier(combatStats.element, monster.element);
      const affinity = classMonsterAffinity(combatStats.classDef, monster.tags);
      const affinityMult = affinity ? affinity.multiplier : 1;
      const rawDamage = Math.max(1, Math.round((combatStats.atk * power * elemMult * affinityMult - monster.def) * randRange(0.85, 1.15)));
      monster.hp -= rawDamage;
      const affinityNote = affinity
        ? (affinity.kind === 'strong' ? ' (천적 관계! 추가 피해)' : ' (상성에 밀려 위력 약화)')
        : '';
      log.push(`${skill ? skill.name : '공격'}! ${monster.name}에게 ${rawDamage} 피해.${affinityNote}`);

      if (monster.hp <= 0) {
        log.push(`${monster.name}을(를) 쓰러뜨렸다.`);
        totalXp += monster.xp;
        totalGold += randInt(monster.goldMin, monster.goldMax);
        loot.push(...rollLoot(monster));
        killedMonsterIds.push(monster.id);
        break;
      }

      // 몹 턴
      const monsterDamage = Math.max(1, Math.round((monster.atk - combatStats.def) * randRange(0.85, 1.15)));
      hp -= monsterDamage;
      log.push(`${monster.name}의 반격! ${monsterDamage} 피해를 입었다.`);
      if (!monster.statusImmune && monster.poisonChance > 0 && Math.random() < monster.poisonChance) {
        const poisonDamage = Math.round(combatStats.maxHp * 0.05);
        hp -= poisonDamage;
        log.push(`중독됐다! ${poisonDamage} 피해.`);
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
  };
}
