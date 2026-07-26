// 순수 계산 모듈(입출력 없음) — tax-lots.js와 같은 패턴. RNG(Math.random)만 사용하고
// Firestore/네트워크 호출은 하지 않음 -> api/rpg/adventure.js가 이 결과를 트랜잭션 안에서 저장.
import {
  ZONES, RARE_PITY_BASE_CHANCE, RARE_PITY_KILL_THRESHOLD, RARE_PITY_INCREMENT_PER_KILL,
  UNIQUE_TIER_NAMES, UNIQUE_TIER_CHANCES, UNIQUE_TIER_STAT_MULT, UNIQUE_TIER_REWARD_MULT,
} from './data/rpg/zones.js';
import { MONSTERS } from './data/rpg/monsters.js';
import { ITEMS, SET_BONUSES, ZONE_SET_ITEMS, FULL_SET_DEFS, ALL_FULL_SET_ITEM_IDS } from './data/rpg/items.js';
import { CLASSES } from './data/rpg/classes.js';
import { elementalMultiplier } from './data/rpg/elements.js';
import { CLASS_ESSENCE_ITEM, TIER_POWER_MULT } from './data/rpg/training.js';
import { ENHANCE_ATK_PER_LEVEL, ENHANCE_DEF_PER_LEVEL, RARE_MONSTER_STONE_DROP_CHANCE } from './data/rpg/enhancement.js';

// 반지+목걸이가 같은 세트(setId)면 세트 보너스를 반환, 아니면 null
function matchedSetBonus(ringItem, necklaceItem) {
  if (!ringItem || !necklaceItem || !ringItem.setId || ringItem.setId !== necklaceItem.setId) return null;
  return SET_BONUSES[ringItem.setId] || null;
}

// 5피스 풀세트 판정 - 상의/하의/목걸이/반지 4개 고정 + 방패 또는 무기(altSlotPieces) 중 하나만
// 갖춰도 세트 완성으로 인정. 여러 세트가 동시에 완성될 순 없음(슬롯이 겹쳐서) - 맞는 것 하나만 반환
function computeFullSetBonus(equipment) {
  const equippedIds = new Set(Object.values(equipment).filter((v) => typeof v === 'string'));
  for (const def of Object.values(FULL_SET_DEFS)) {
    const hasFixedPieces = def.pieces.every((id) => equippedIds.has(id));
    const hasAltPiece = def.altSlotPieces.some((id) => equippedIds.has(id));
    if (hasFixedPieces && hasAltPiece) return def;
  }
  return null;
}

const MAX_ROUNDS_PER_ENCOUNTER = 40;
// 패배해서 마을로 돌아오면 무료로 부활은 하지만 완전 회복은 아님 - 최대치의 이 비율만큼만 채워진 채로
// 돌아옴(그래야 "졌다"는 느낌이 남고, 바로 다시 나가기 전에 회복할 동기가 생김)
const DEFEAT_REVIVE_PCT = 0.3;
const BASE_HP = 40;
const HP_PER_LEVEL = 6;
const VIT_HP_PER_LEVEL = 0.5; // VIT 1당, 레벨 1당 최대체력 +0.5 - 레벨이 오를수록 VIT 효과가 누적돼 커짐
const BASE_MP = 15;
const MP_PER_LEVEL = 2;
// 마나는 각 직업의 주스탯(전사=STR, 궁수=AGI, 마법사=INT, 성직자=WIS)에 비례 - VIT/HP와 같은 방식으로
// 레벨이 오를수록 그 스탯 투자분이 누적돼 마나가 커짐
const MAGIC_STAT_MP_PER_LEVEL = 0.3;
const BASE_STAMINA = 40;
const STAMINA_PER_LEVEL = 2;
const AGI_STAMINA_PER_LEVEL = 0.4; // AGI도 같은 방식으로 스테미나에 누적 반영
// 직업이 숙련되지 않은 무기(classDef.weaponTypes에 없는 타입)를 장착했을 때의 패널티
const OFF_CLASS_WEAPON_DAMAGE_MULT = 0.7;
const OFF_CLASS_WEAPON_MISS_CHANCE = 0.2;
// 용병의 멘탈(공포저항) - 전열에서 피격당할 때마다 낮은 확률로 멘탈이 나가서 후열로 숨음(그 전투 한정, 일시적)
const MORALE_BREAK_BASE_CHANCE = 0.25;
const BASE_INJURY_CHANCE = 0.08;
const WEAK_AFFINITY_INJURY_BONUS = 0.12; // 상성이 안 좋으면 다칠 확률이 더 높아짐
const BASE_DODGE_CHANCE = 0.08; // 다리가 온전할 때만 정상적으로 회피 시도 가능
// 민첩(AGI) - 회피와 "공격속도"(추가타 확률)에 영향. 공격속도는 라운드제 전투 특성상 별도 행동 순서가
// 아니라 확률적 추가타(장신구의 2연타 효과와 같은 방식)로 구현 - 두 보너스는 합산됨
const AGI_DODGE_PER_POINT = 0.004; // 민첩 1당 회피율 +0.4%p
const AGI_EXTRA_ATTACK_PER_POINT = 0.003; // 민첩 1당 추가타(2연타) 확률 +0.3%p
const MAX_DODGE_CHANCE = 0.5;
const MAX_EXTRA_ATTACK_CHANCE = 0.6;
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
// 직업훈련소 결정 - 몹 종류 무관, 내(본인) 직업에 맞는 결정이 킬당 이 확률로 하나씩 드랍됨
const ESSENCE_DROP_CHANCE = 0.2;
// 그 지역 유니크(2단계)/레전더리(3단계) 몹 전용 - 세트 아이템(반지/목걸이 중 하나)이 이 확률로 드랍
const SET_ITEM_DROP_CHANCE = 0.08;
// 5피스 풀세트(지역 무관) 조각 드랍 확률 - 아무 지역이든 유니크/레전더리몹이면 발동, 훨씬 희귀함
const FULL_SET_ITEM_DROP_CHANCE = 0.02;

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

// 지역 진입 -> 몹 구성(일반 무리 또는 레어/유니크/레전더리 단독) 결정. 유니크(2단계)/레전더리(3단계)는
// pity 없이 항상 고정 확률로만 등장 - 더 희귀한 쪽(레전더리)부터 먼저 판정
export function rollEncounter(zoneId, killCount) {
  const zone = ZONES[zoneId];
  if (!zone) throw new Error(`unknown zoneId: ${zoneId}`);

  for (const tier of [3, 2]) {
    if (Math.random() < UNIQUE_TIER_CHANCES[tier]) {
      return { zone, monsterIds: [zone.rareMonsterId], isRare: true, uniqueTier: tier };
    }
  }

  const rareChance = rareChanceForZone(killCount);
  if (Math.random() < rareChance) {
    return { zone, monsterIds: [zone.rareMonsterId], isRare: true, uniqueTier: 1 };
  }
  const groupSize = randInt(zone.groupSizeMin, zone.groupSizeMax);
  const monsterIds = Array.from({ length: groupSize }, () => zone.monsterIds[randInt(0, zone.monsterIds.length - 1)]);
  return { zone, monsterIds, isRare: false, uniqueTier: 1 };
}

function buildMonsterInstance(monsterId, zone, uniqueTier = 1) {
  const def = MONSTERS[monsterId];
  const variance = randRange(zone.varianceMin, zone.varianceMax);
  const statMult = UNIQUE_TIER_STAT_MULT[uniqueTier] || 1;
  const rewardMult = UNIQUE_TIER_REWARD_MULT[uniqueTier] || 1;
  const uniqueTierName = uniqueTier > 1 ? UNIQUE_TIER_NAMES[uniqueTier] : null;
  return {
    id: def.id, name: uniqueTierName ? `${uniqueTierName} ${def.name}` : def.name,
    element: def.element, tags: def.tags || [], rare: !!def.rare, uniqueTier,
    statusImmune: !!def.statusImmune, poisonChance: def.poisonChance || 0, ambushChance: def.ambushChance || 0,
    ranged: !!def.ranged,
    maxHp: Math.round(def.baseStats.hp * variance * statMult),
    hp: Math.round(def.baseStats.hp * variance * statMult),
    atk: Math.round(def.baseStats.atk * variance * statMult),
    def: Math.round(def.baseStats.def * variance * statMult),
    xp: Math.round(def.xp * rewardMult),
    goldMin: Math.round(def.goldMin * rewardMult),
    goldMax: Math.round(def.goldMax * rewardMult),
    dropTable: def.dropTable,
    // 이니셔티브(행동순서) 계산용 속도 - 몹 데이터에 별도 speed 필드가 없어서 지역 변동폭(variance)
    // 롤을 재사용해 그때그때 다르게 산출(기본 캐릭터 AGI 5~10대와 비슷한 범위가 되도록 스케일)
    speed: Math.round(8 * variance),
  };
}

// 반지/목걸이의 힘/민첩/지능 보너스를 기본 스탯에 더한 "실효 스탯" - 전투 계산과 소지 가능 무게 계산이 공유
export function effectiveStats(character) {
  const stats = character.stats || { str: 5, int: 5, agi: 5, vit: 5, wis: 5 };
  const equipment = character.equipment || {};
  const ringItem = equipment.ring ? ITEMS[equipment.ring] : null;
  const necklaceItem = equipment.necklace ? ITEMS[equipment.necklace] : null;
  return {
    str: stats.str + ((ringItem && ringItem.strBonus) || 0) + ((necklaceItem && necklaceItem.strBonus) || 0),
    agi: stats.agi + ((ringItem && ringItem.agiBonus) || 0) + ((necklaceItem && necklaceItem.agiBonus) || 0),
    int: stats.int + ((ringItem && ringItem.intBonus) || 0) + ((necklaceItem && necklaceItem.intBonus) || 0),
    wis: (stats.wis || 0) + ((ringItem && ringItem.wisBonus) || 0) + ((necklaceItem && necklaceItem.wisBonus) || 0),
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
  const scalingStat = stats[mainCls.statScaling.atk] ?? stats.str; // str/agi/int 등 직업별 주스탯

  const equipment = character.equipment || {};
  const weaponItem = equipment.weapon ? ITEMS[equipment.weapon] : null;
  const shieldItem = equipment.shield ? ITEMS[equipment.shield] : null;
  const armorTopItem = equipment.armor_top ? ITEMS[equipment.armor_top] : null;
  const armorBottomItem = equipment.armor_bottom ? ITEMS[equipment.armor_bottom] : null;
  const ringItem = equipment.ring ? ITEMS[equipment.ring] : null;
  const necklaceItem = equipment.necklace ? ITEMS[equipment.necklace] : null;

  // 내구도 0이 되면 파손 - 수리 전까지 그 부위 보너스가 전부 사라짐(장신구는 내구도 대상 아님)
  const weaponBroken = weaponItem && (equipment.weaponDurability ?? 100) <= 0;
  const shieldBroken = shieldItem && (equipment.shieldDurability ?? 100) <= 0;
  const armorTopBroken = armorTopItem && (equipment.armor_topDurability ?? 100) <= 0;
  const armorBottomBroken = armorBottomItem && (equipment.armor_bottomDurability ?? 100) <= 0;

  // 대장간 강화(1~10단계) - 내구도와 같은 원칙으로, 파손되면 강화 보너스도 함께 사라짐
  const weaponEnhanceBonus = weaponBroken ? 0 : (equipment.weaponEnhanceLevel || 0) * ENHANCE_ATK_PER_LEVEL;
  const shieldEnhanceBonus = shieldBroken ? 0 : (equipment.shieldEnhanceLevel || 0) * ENHANCE_DEF_PER_LEVEL;
  const armorTopEnhanceBonus = armorTopBroken ? 0 : (equipment.armor_topEnhanceLevel || 0) * ENHANCE_DEF_PER_LEVEL;
  const armorBottomEnhanceBonus = armorBottomBroken ? 0 : (equipment.armor_bottomEnhanceLevel || 0) * ENHANCE_DEF_PER_LEVEL;
  const weaponAtkBonus = (weaponBroken ? 0 : ((weaponItem && weaponItem.atkBonus) || 0)) + weaponEnhanceBonus;
  // 방패+상의+하의가 함께 "몸통 방어구" 취급으로 방어력/체력에 합산됨
  const gearDefBonus = (shieldBroken ? 0 : ((shieldItem && shieldItem.defBonus) || 0)) + shieldEnhanceBonus
    + (armorTopBroken ? 0 : ((armorTopItem && armorTopItem.defBonus) || 0)) + armorTopEnhanceBonus
    + (armorBottomBroken ? 0 : ((armorBottomItem && armorBottomItem.defBonus) || 0)) + armorBottomEnhanceBonus;
  const gearHpBonus = (shieldBroken ? 0 : ((shieldItem && shieldItem.hpBonus) || 0))
    + (armorTopBroken ? 0 : ((armorTopItem && armorTopItem.hpBonus) || 0))
    + (armorBottomBroken ? 0 : ((armorBottomItem && armorBottomItem.hpBonus) || 0));
  const gearSevereInjuryResist = (shieldBroken ? 0 : ((shieldItem && shieldItem.severeInjuryResist) || 0))
    + (armorTopBroken ? 0 : ((armorTopItem && armorTopItem.severeInjuryResist) || 0))
    + (armorBottomBroken ? 0 : ((armorBottomItem && armorBottomItem.severeInjuryResist) || 0));
  // 반지+목걸이를 같은 세트(setId)로 맞춰 착용하면, 그리고 5피스 풀세트를 갖추면 각 아이템 자체
  // 스탯 위에 세트 보너스가 추가로 붙음(두 시스템은 서로 다른 slot조합이라 동시 발동도 가능)
  const twoPieceSetBonus = (matchedSetBonus(ringItem, necklaceItem) || {}).bonus || {};
  const fullSetDef = computeFullSetBonus(equipment);
  const fullSetBonus = (fullSetDef && fullSetDef.bonus) || {};
  const setBonus = {
    atkBonus: (twoPieceSetBonus.atkBonus || 0) + (fullSetBonus.atkBonus || 0),
    defBonus: (twoPieceSetBonus.defBonus || 0) + (fullSetBonus.defBonus || 0),
    hpBonus: (twoPieceSetBonus.hpBonus || 0) + (fullSetBonus.hpBonus || 0),
    severeInjuryResist: (twoPieceSetBonus.severeInjuryResist || 0) + (fullSetBonus.severeInjuryResist || 0),
    elementDefense: twoPieceSetBonus.elementDefense || fullSetBonus.elementDefense || null,
    doubleAttackChance: (twoPieceSetBonus.doubleAttackChance || 0) + (fullSetBonus.doubleAttackChance || 0),
  };
  const accessoryAtkBonus = (ringItem && ringItem.atkBonus || 0) + (necklaceItem && necklaceItem.atkBonus || 0) + (setBonus.atkBonus || 0);
  const accessoryDefBonus = (ringItem && ringItem.defBonus || 0) + (necklaceItem && necklaceItem.defBonus || 0) + (setBonus.defBonus || 0);
  const accessoryHpBonus = (ringItem && ringItem.hpBonus || 0) + (necklaceItem && necklaceItem.hpBonus || 0) + (setBonus.hpBonus || 0);

  // VIT는 레벨과 곱해져서 반영됨 - 레벨이 낮을 땐 VIT를 아무리 투자해도 체력 증가폭이 작고,
  // 레벨이 오를수록 VIT 투자분이 누적돼서 체력 성장폭이 커짐(비율 성장)
  return {
    maxHp: BASE_HP + level * HP_PER_LEVEL + Math.round(stats.vit * level * VIT_HP_PER_LEVEL) + gearHpBonus + accessoryHpBonus,
    maxMp: BASE_MP + level * MP_PER_LEVEL + Math.round(scalingStat * level * MAGIC_STAT_MP_PER_LEVEL),
    // 향후 스테미나 소모 스킬/행동에 대비한 자원(현재는 회복 대상으로만 사용)
    maxStamina: BASE_STAMINA + level * STAMINA_PER_LEVEL + Math.round(stats.agi * level * AGI_STAMINA_PER_LEVEL),
    atk: scalingStat * 2 + level + weaponAtkBonus + accessoryAtkBonus,
    def: stats.vit + gearDefBonus + accessoryDefBonus,
    element: weaponBroken ? 'none' : ((weaponItem && weaponItem.element) || 'none'), // 무기 파손시 속성공격도 사라짐
    weaponType: (weaponItem && weaponItem.weaponType) || null,
    hasShield: !!(shieldItem && !shieldBroken), // 방패 스킬(방패 강타 등) 사용 조건
    agi: stats.agi,
    weaponBroken: !!weaponBroken,
    armorBroken: !!(armorTopBroken || armorBottomBroken),
    // 방어구의 "중상방어" 속성 - 중상을 입을 확률을 이만큼 줄여줌(파손되면 무효). 세트 전용 전속성방어는
    // gearElementDefense로 별도 노출(장신구쪽 elementDefense와 buildCombatant에서 합쳐짐)
    severeInjuryResist: gearSevereInjuryResist
      + ((ringItem && ringItem.severeInjuryResist) || 0) + ((necklaceItem && necklaceItem.severeInjuryResist) || 0)
      + (setBonus.severeInjuryResist || 0),
    gearElementDefense: setBonus.elementDefense || null,
    setDoubleAttackChance: setBonus.doubleAttackChance || 0,
    classDef,
  };
}

// 파티(본인+활성 용병) 전체 전력치 - 성 점령전(castle.js) 판정에 쓰이는 단순 합산 지표.
// 실제 턴제 전투 대신 이 수치끼리 확률 비교로 승패를 가름(claim-castle.js 참고)
export function computePartyPower(character) {
  const members = [
    character,
    ...(character.mercenaries || []).filter((m) => m.assignment === 'active' && !m.hospitalized),
  ];
  return members.reduce((sum, m) => {
    const stats = computeCharacterCombatStats(m);
    return sum + stats.atk * 2 + stats.def * 3 + stats.maxHp / 5;
  }, 0);
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
  wearOne('shield', 'shieldDurability');
  wearOne('armor_top', 'armor_topDurability');
  wearOne('armor_bottom', 'armor_bottomDurability');
  return { equipment: next, brokenNow };
}

function inventoryQty(inventory, itemId) {
  const entry = (inventory || []).find((e) => e.itemId === itemId);
  return entry ? entry.qty : 0;
}

// 아이템이 회복시키는 자원 종류 판별(hp/mp/stamina) - thresholdPct는 "그 자원의 잔여율"을 기준으로 판정
function potionResourceKind(item) {
  if (item.healPct) return 'hp';
  if (item.restoreMpPct) return 'mp';
  if (item.restoreStaminaPct) return 'stamina';
  return null;
}

// 스탠스+포션규칙에 따라 이번 라운드에 포션을 쓸지 결정. 파티원 전원이 "본인 소유 인벤토리는 없고
// 본대(캐릭터)의 물자를 공유"하는 구조라 inventory/potionsUsed는 파티 전체가 공유하되,
// 언제/무엇을 마실지 정하는 potionRules(자원별 임계치)는 각자 것을 씀 - HP/MP/스테미나 전부 지원
function maybeUsePotion({ potionRules, inventory, resources, potionsUsed, log, actorLabel }) {
  for (const rule of potionRules || []) {
    const used = potionsUsed[rule.itemId] || 0;
    if (used >= rule.maxPerBattle) continue;
    if (inventoryQty(inventory, rule.itemId) - used <= 0) continue;
    const item = ITEMS[rule.itemId];
    if (!item) continue;
    const kind = potionResourceKind(item);
    if (!kind) continue;
    const { current, max } = resources[kind];
    const pct = (current / max) * 100;
    if (pct > rule.thresholdPct) continue;
    potionsUsed[rule.itemId] = used + 1;
    const restorePct = item.healPct || item.restoreMpPct || item.restoreStaminaPct;
    const amount = Math.round(max * restorePct);
    const resourceLabel = kind === 'hp' ? '체력' : kind === 'mp' ? '마나' : '스테미나';
    log.push(`${actorLabel}이(가) ${item.name}을(를) 사용해 ${resourceLabel}을(를) ${amount} 회복했다.`);
    return { kind, amount };
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

const RANGED_WEAPON_TYPES = ['bow', 'staff']; // 원거리 무기 - 자동 진형 판정시 후열로 분류(활=사격, 지팡이=마법)
// 진형이 명시적으로 지정 안 돼있으면 장착 무기로 자동 결정(활/지팡이=후열, 그 외=전열)
export function effectiveFormationRow(characterLike) {
  if (characterLike.formationRow) return characterLike.formationRow;
  return RANGED_WEAPON_TYPES.includes(computeCharacterCombatStats(characterLike).weaponType) ? 'back' : 'front';
}

// 파티원 1명(본인 또는 용병)의 전투용 런타임 상태를 구성 - characterLike는 character 또는
// character.mercenaries[i] (둘 다 stats/level/classMain/equipment/injuries 구조가 동일함)
function buildCombatant({ characterLike, isSelf, formationRow, sharedInventory }) {
  const combatStats = computeCharacterCombatStats(characterLike);
  const equipment = characterLike.equipment || {};
  const ringItem = equipment.ring ? ITEMS[equipment.ring] : null;
  const necklaceItem = equipment.necklace ? ITEMS[equipment.necklace] : null;
  // gearElementDefense는 5피스 풀세트(중량방어구 세트 등)의 전속성방어 - 장신구쪽 elementDefense와 합쳐짐.
  // combatStats.setDoubleAttackChance는 2피스+5피스 세트 보너스가 이미 합산된 값(computeCharacterCombatStats 참고)
  const accessoryElementDefense = (ringItem && ringItem.elementDefense) || (necklaceItem && necklaceItem.elementDefense) || combatStats.gearElementDefense || null;
  const doubleAttackChance = Math.min(
    MAX_EXTRA_ATTACK_CHANCE,
    ((ringItem && ringItem.doubleAttackChance) || (necklaceItem && necklaceItem.doubleAttackChance) || 0)
      + (combatStats.setDoubleAttackChance || 0)
      + combatStats.agi * AGI_EXTRA_ATTACK_PER_POINT,
  );
  return {
    id: isSelf ? 'self' : characterLike.id,
    isSelf,
    name: isSelf ? '나' : characterLike.name,
    label: isSelf ? '나' : characterLike.name,
    combatStats,
    // 용병은 별도 인벤토리 없이 본대(캐릭터)의 물자를 공유 - 화살/포션 전부 sharedInventory에서 사용
    potionRules: characterLike.potionRules || [],
    stance: characterLike.stance || 'stable',
    formationRow,
    hp: typeof characterLike.currentHp === 'number' ? characterLike.currentHp : combatStats.maxHp,
    mp: typeof characterLike.currentMp === 'number' ? characterLike.currentMp : combatStats.maxMp,
    stamina: typeof characterLike.currentStamina === 'number' ? characterLike.currentStamina : combatStats.maxStamina,
    alive: true,
    usesBow: combatStats.weaponType === 'bow',
    arrowsUsed: 0,
    accessoryElementDefense,
    doubleAttackChance,
    mentalResist: characterLike.mentalResist, // undefined면(본인) 멘탈 붕괴 로직 자체를 건너뜀
    // 스킬 훈련(skillLevels)은 본인 전용 - 용병은 훈련소 대상이 아니라 항상 자기 스킬을 자유롭게 씀
    skillLevels: isSelf ? (characterLike.skillLevels || {}) : null,
    injurySeverity: {
      arm: (characterLike.injuries && characterLike.injuries.arm && characterLike.injuries.arm.severity) || 0,
      leg: (characterLike.injuries && characterLike.injuries.leg && characterLike.injuries.leg.severity) || 0,
    },
    newInjuries: {},
  };
}

// 스킬 자원 - 물리 직업(전사/궁수)은 스테미나, 마법 직업(마법사/성직자)은 마나를 씀
function skillResourceKey(actor) {
  return actor.combatStats.classDef.resourceType === 'stamina' ? 'stamina' : 'mp';
}
function spendActorResource(actor, amount) {
  const key = skillResourceKey(actor);
  actor[key] -= amount;
}
// 스킬을 이번에 쓸 수 있는지 - 자원이 충분한지 + (본인이면) 훈련소에서 배운 스킬인지(미습득 스킬은 사용 불가)
function isSkillUsable(actor, skill) {
  if (skill.manaCost > actor[skillResourceKey(actor)]) return false;
  if (skill.requiresShield && !actor.combatStats.hasShield) return false; // 방패 스킬은 방패 장착 중일 때만
  if (actor.isSelf) return (actor.skillLevels && actor.skillLevels[skill.id] > 0);
  return true; // 용병은 훈련 시스템 대상이 아니라 항상 사용 가능
}
// 훈련 단계(1~3)에 따라 위력이 세짐 - 본인만 해당, 용병은 항상 기본 위력
function skillEffectivePower(actor, skill) {
  if (!actor.isSelf) return skill.power;
  const tier = (actor.skillLevels && actor.skillLevels[skill.id]) || 0;
  return skill.power * (TIER_POWER_MULT[tier] || 1);
}

// 파티원 한 명의 공격 1회 처리(스킬/화살/부상/비숙련무기 패널티/2연타 전부 포함) - monster는 참조로 변형됨.
// otherMonsters: 같은 조우에서 아직 순서를 기다리는 나머지 몹들 - attack_all(광역) 스킬의 스플래시 대상
function performAttack({ actor, monster, otherMonsters, sharedInventory, log, isUnderleveled, partyBuffs }) {
  const combatStats = actor.combatStats;
  // 스킬은 스탠스와 무관하게 자원이 되는 한 항상 씀(안 쓰는 건 불리해지기만 할 뿐 "방어적"인 게 아님) -
  // 스탠스는 대신 몹 타겟 우선순위(약한 몹부터/강한 몹부터)를 결정함(resolveCombat 참고)
  const skills = combatStats.classDef.skills.filter((s) => (s.type === 'attack' || s.type === 'attack_all') && isSkillUsable(actor, s));
  const useSkill = skills.length > 0;
  const skill = useSkill ? skills[skills.length - 1] : null;
  let power = (skill ? skillEffectivePower(actor, skill) : 1.0) * partyBuffs.atkMult; // 마법사의 "무기 강화" 버프가 파티 전체에 적용됨
  if (skill) spendActorResource(actor, skill.manaCost);

  const arrowsLeftBeforeShot = actor.usesBow ? inventoryQty(sharedInventory, 'arrow') - actor.arrowsUsed : 0;
  const isKiting = actor.usesBow && arrowsLeftBeforeShot > 0;
  if (actor.usesBow) {
    if (arrowsLeftBeforeShot > 0) actor.arrowsUsed++;
    else { power *= 0.6; log.push(`${actor.label}의 화살이 떨어져 단도로 근접전을 벌인다! 위력이 약해졌다.`); }
  }

  if (actor.injurySeverity.arm > 0) power *= INJURY_ATK_MULT[actor.injurySeverity.arm];

  const offClassWeapon = combatStats.weaponType && !combatStats.classDef.weaponTypes.includes(combatStats.weaponType);
  if (offClassWeapon) power *= OFF_CLASS_WEAPON_DAMAGE_MULT;

  // 스킬이 자체 속성(elements)을 가지면 매번 그 중 하나를 무작위로 골라 무기 속성 대신 사용
  const castElement = skill && skill.elements ? skill.elements[randInt(0, skill.elements.length - 1)] : combatStats.element;
  const elemMult = elementalMultiplier(castElement, monster.element);
  const affinity = classMonsterAffinity(combatStats.classDef, monster.tags);
  const affinityMult = affinity ? affinity.multiplier : 1;
  const affinityNote = affinity
    ? (affinity.kind === 'strong' ? ' (천적 관계! 추가 피해)' : ' (상성에 밀려 위력 약화)')
    : '';
  const elementNote = skill && skill.elements ? ` [${castElement}]` : '';

  let monsterDied = false;
  if (offClassWeapon && Math.random() < OFF_CLASS_WEAPON_MISS_CHANCE) {
    log.push(`${actor.label}의 공격이 (숙련되지 않은 무기라) 빗나갔다!`);
  } else {
    const hitCount = Math.random() < actor.doubleAttackChance ? 2 : 1;
    let lastRawDamage = 0;
    for (let hitIdx = 0; hitIdx < hitCount && !monsterDied; hitIdx++) {
      const rawDamage = Math.max(1, Math.round((combatStats.atk * power * elemMult * affinityMult - monster.def) * randRange(0.85, 1.15)));
      lastRawDamage = rawDamage;
      monster.hp -= rawDamage;
      const hitLabel = hitIdx === 1 ? ' (2연타!)' : '';
      log.push(`${actor.label}의 ${skill ? skill.name : '공격'}! ${monster.name}에게 ${rawDamage} 피해.${elementNote}${affinityNote}${hitLabel}`);
      if (monster.hp <= 0) monsterDied = true;
    }
    // 광역(attack_all) - 대기 중인 다른 몹들에게도 스플래시 피해(스플래시로는 죽지 않음, HP 1 보존)
    if (skill && skill.type === 'attack_all' && otherMonsters && otherMonsters.length) {
      const splashDamage = Math.max(1, Math.round(lastRawDamage * 0.4));
      for (const other of otherMonsters) {
        if (other === monster || other.hp <= 0) continue;
        other.hp = Math.max(1, other.hp - splashDamage);
      }
      log.push(`${actor.label}의 ${skill.name}이(가) 주변까지 휩쓸었다! (스플래시 ${splashDamage})`);
    }
  }
  return { monsterDied, isKiting, affinity };
}

// 몹의 반격 1회 처리 - target(파티원 한 명)이 대상. 카이팅 중이면 아예 호출되지 않음(resolveCombat에서 스킵)
function performMonsterAttack({ monster, target, log, isUnderleveled, affinityFromLastHit, partyBuffs }) {
  const combatStats = target.combatStats;
  const dodgeChance = Math.min(MAX_DODGE_CHANCE, BASE_DODGE_CHANCE + combatStats.agi * AGI_DODGE_PER_POINT)
    * (target.injurySeverity.leg ? INJURY_DODGE_MULT[target.injurySeverity.leg] : 1);
  if (Math.random() < dodgeChance) {
    log.push(`${target.label}이(가) ${monster.name}의 공격을 회피했다!`);
    return;
  }

  const injuryDamageBonus = (INJURY_INCOMING_DAMAGE_BONUS[target.injurySeverity.arm] || 0) + (INJURY_INCOMING_DAMAGE_BONUS[target.injurySeverity.leg] || 0);
  const elementResistMult = (target.accessoryElementDefense === 'all' || target.accessoryElementDefense === monster.element) ? 0.7 : 1;
  // 마법사의 "마법 방어막" 버프가 파티 전체 방어력에 적용됨(defMult가 1보다 크면 방어력 상승)
  const effectiveDef = combatStats.def * partyBuffs.defMult;
  const monsterDamage = Math.max(1, Math.round((monster.atk - effectiveDef) * randRange(0.85, 1.15) * (1 + injuryDamageBonus) * elementResistMult));
  target.hp -= monsterDamage;
  log.push(`${monster.name}이(가) ${target.label}을(를) 공격! ${monsterDamage} 피해.`);
  if (!monster.statusImmune && monster.poisonChance > 0 && Math.random() < monster.poisonChance) {
    const poisonDamage = Math.round(combatStats.maxHp * 0.05);
    target.hp -= poisonDamage;
    log.push(`${target.label}이(가) 중독됐다! ${poisonDamage} 피해.`);
  }

  // 용병이 전열에서 맞으면 멘탈(공포저항)이 낮을수록 후열로 도망칠 확률이 있음 - 전투 중 일시적,
  // 다음 모험에서는 다시 기본 진형으로 돌아옴. 앞이 뚫리면 그만큼 뒤(궁수 등)가 위험해짐. 성직자의
  // "평정심"으로 멘탈저항이 일시적으로 오를 수 있음(partyBuffs.mentalBonus)
  if (typeof target.mentalResist === 'number' && target.formationRow === 'front' && target.hp > 0) {
    const effectiveMentalResist = Math.min(100, target.mentalResist + partyBuffs.mentalBonus);
    const breakChance = MORALE_BREAK_BASE_CHANCE * (1 - effectiveMentalResist / 100);
    if (Math.random() < breakChance) {
      target.formationRow = 'back';
      log.push(`${target.label}이(가) 공포에 질려 뒤로 물러났다! 진형이 무너졌다.`);
    }
  }

  // 아주 작은 확률로 단계를 건너뛰고 곧장 중상 - 상성 나쁨/언더레벨이면 더 잘 발생, 방어구/장신구의 중상방어로 완화
  const resist = Math.min(0.8, combatStats.severeInjuryResist || 0);
  const eligibleParts = Object.keys(target.injurySeverity).filter((p) => target.injurySeverity[p] < 2);
  let injuryHandled = false;
  if (eligibleParts.length) {
    const directSevereChance = (DIRECT_SEVERE_BASE_CHANCE
      + (affinityFromLastHit && affinityFromLastHit.kind === 'weak' ? DIRECT_SEVERE_WEAK_AFFINITY_BONUS : 0)
      + (isUnderleveled ? DIRECT_SEVERE_UNDERLEVEL_BONUS : 0)) * (1 - resist);
    if (Math.random() < directSevereChance) {
      const part = eligibleParts[randInt(0, eligibleParts.length - 1)];
      target.injurySeverity[part] = 2;
      const [lo, hi] = INJURY_DURATION_RANGE[2];
      const turnsLeft = randInt(lo, hi);
      target.newInjuries[part] = { severity: 2, turnsLeft };
      log.push(`${target.label}의 ${BODY_PART_NAMES[part]}에 심각한 부상을 입었다! (중상, ${turnsLeft}턴)`);
      injuryHandled = true;
    }
  }
  if (!injuryHandled && eligibleParts.length) {
    const part = eligibleParts[randInt(0, eligibleParts.length - 1)];
    const nextSeverity = target.injurySeverity[part] + 1;
    const baseChance = BASE_INJURY_CHANCE + (affinityFromLastHit && affinityFromLastHit.kind === 'weak' ? WEAK_AFFINITY_INJURY_BONUS : 0);
    const chance = nextSeverity === 2 ? baseChance * (1 - resist) : baseChance;
    if (Math.random() < chance) {
      target.injurySeverity[part] = nextSeverity;
      const [lo, hi] = INJURY_DURATION_RANGE[nextSeverity];
      const turnsLeft = randInt(lo, hi);
      target.newInjuries[part] = { severity: nextSeverity, turnsLeft };
      log.push(nextSeverity === 2
        ? `${target.label}의 ${BODY_PART_NAMES[part]} 부상이 중상으로 악화됐다! (${turnsLeft}턴)`
        : `${target.label}이(가) ${BODY_PART_NAMES[part]}을(를) 다쳤다! 경상, ${turnsLeft}턴 동안 유지된다.`);
    }
  }
}

// 공격이 아닌 스킬(치유/저주/파티버프) 사용 시도 - 사용했으면 true를 반환(이번 라운드 이 배우는 공격 안 함).
// 우선순위: 치유(다친 아군 있을 때) > 저주(몹 미저주 상태) > 파티 버프(공격력/방어력/멘탈, 전투당 1회씩만)
function tryUtilitySkill({ actor, party, monster, log, partyBuffs }) {
  const alive = party.filter((p) => p.alive && p.hp > 0);

  const healSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'heal_ally' && isSkillUsable(actor, s));
  if (healSkill) {
    const hurt = alive.filter((p) => p.hp / p.combatStats.maxHp < 0.6)
      .sort((a, b) => (a.hp / a.combatStats.maxHp) - (b.hp / b.combatStats.maxHp));
    if (hurt.length) {
      const target = hurt[0];
      spendActorResource(actor, healSkill.manaCost);
      // 치유량은 대상 최대체력 비율 + 시전자의 공격력 절반(공격력 자체가 지혜 등 주스탯에 비례하므로
      // 자연히 지혜가 높을수록 치유량도 커짐) - 훈련 단계가 오르면 skillEffectivePower로 회복 비율도 커짐
      const healAmount = Math.round(target.combatStats.maxHp * skillEffectivePower(actor, healSkill)) + Math.round(actor.combatStats.atk * 0.5);
      target.hp = Math.min(target.combatStats.maxHp, target.hp + healAmount);
      log.push(`${actor.label}의 ${healSkill.name}! ${target.label}의 체력을 ${healAmount} 회복했다.`);
      return true;
    }
  }

  const debuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'debuff_monster' && isSkillUsable(actor, s));
  if (debuffSkill && !monster.cursed) {
    spendActorResource(actor, debuffSkill.manaCost);
    const debuffPower = skillEffectivePower(actor, debuffSkill);
    monster.atk = Math.max(1, Math.round(monster.atk * (1 - debuffPower)));
    monster.def = Math.max(0, Math.round(monster.def * (1 - debuffPower)));
    monster.cursed = true;
    log.push(`${actor.label}의 ${debuffSkill.name}! ${monster.name}의 힘이 약해졌다.`);
    return true;
  }

  const atkBuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_atk_party' && isSkillUsable(actor, s));
  if (atkBuffSkill && partyBuffs.atkMult === 1) {
    spendActorResource(actor, atkBuffSkill.manaCost);
    partyBuffs.atkMult = skillEffectivePower(actor, atkBuffSkill);
    log.push(`${actor.label}의 ${atkBuffSkill.name}! 파티 전체의 무기가 강화됐다.`);
    return true;
  }

  const defBuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_def_party' && isSkillUsable(actor, s));
  if (defBuffSkill && partyBuffs.defMult === 1) {
    spendActorResource(actor, defBuffSkill.manaCost);
    partyBuffs.defMult = skillEffectivePower(actor, defBuffSkill);
    log.push(`${actor.label}의 ${defBuffSkill.name}! 파티 전체에 마법 방어막이 씌워졌다.`);
    return true;
  }

  const mentalSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_mental_party' && isSkillUsable(actor, s));
  if (mentalSkill && partyBuffs.mentalBonus === 0) {
    spendActorResource(actor, mentalSkill.manaCost);
    partyBuffs.mentalBonus = skillEffectivePower(actor, mentalSkill);
    log.push(`${actor.label}의 ${mentalSkill.name}! 파티의 사기가 진정됐다.`);
    return true;
  }

  return false;
}

// 전투 전체(파티 vs 몹 무리 동시 전투) 판정 - 결과만 반환, 아무것도 저장하지 않음.
// character.mercenaries(있다면, 최대 2명)가 자동으로 파티에 합류함. 몹 무리는 순차 처리가 아니라
// 전부 동시에 "살아있는" 상태로 등장하고, 매 라운드 파티원+몹 전원이 속도(AGI/몹 속도) 기준
// 이니셔티브 순서로 한 번씩 행동함(발더스게이트류 개별 행동순서). 파티원 공격은 몹 중 "현재 체력이
// 가장 낮은" 개체를 자동으로 골라 때리고(약한 몹부터 정리), 몹의 반격 대상은 기존과 동일하게
// 전열(front)이 살아있는 한 전열부터 맞음(진형은 "누가 맞아주냐"만 결정, "누가 때리냐"는 무관)
export function resolveCombat({ character, zoneId, stance }) {
  const encounter = rollEncounter(zoneId, (character.zoneKillCounts || {})[zoneId] || 0);
  const monsters = encounter.monsterIds.map((id) => buildMonsterInstance(id, encounter.zone, encounter.uniqueTier));
  const isUnderleveled = (character.level || 1) < encounter.zone.tier * 3;
  const sharedInventory = character.inventory || []; // 파티 전원이 이 물자(화살/포션)를 공유

  const party = [
    buildCombatant({ characterLike: { ...character, stance }, isSelf: true, formationRow: effectiveFormationRow(character), sharedInventory }),
    ...(character.mercenaries || []).map((merc) => buildCombatant({
      characterLike: merc, isSelf: false, formationRow: effectiveFormationRow(merc), sharedInventory,
    })),
  ];

  const potionsUsed = {}; // 파티 공용 물자 소모 카운트(itemId별)
  // 마법사/성직자의 파티 버프 - 한 번 발동하면 이 전투(모험) 내내 유지됨(재시전으로 갱신 안 됨, 1회성)
  const partyBuffs = { atkMult: 1, defMult: 1, mentalBonus: 0 };
  const log = [`${encounter.zone.name}에 진입했다.`];
  monsters.forEach((m) => log.push(`${m.name}${m.rare && m.uniqueTier === 1 ? '(희귀)' : ''}이(가) 나타났다!`));
  let totalXp = 0;
  let totalGold = 0;
  const loot = [];
  const killedMonsterIds = [];
  let rounds = 0;
  let victory = true;

  const alivePartyMembers = () => party.filter((p) => p.alive && p.hp > 0);
  const aliveMonsters = () => monsters.filter((m) => m.hp > 0);
  const pickMonsterTarget = () => {
    const alive = alivePartyMembers();
    const front = alive.filter((p) => p.formationRow === 'front');
    const pool = front.length ? front : alive;
    return pool[randInt(0, pool.length - 1)];
  };
  // 파티원의 공격 대상 - 스탠스가 타겟 우선순위를 결정함. 안정형(stable)은 체력이 가장 낮은 몹부터
  // 정리(약한 순), 공격형(aggressive)은 체력이 가장 높은(가장 위협적인) 몹부터 노림(강한 순)
  const pickMonsterByStance = (stance) => {
    const alive = aliveMonsters();
    if (!alive.length) return null;
    if (stance === 'aggressive') return alive.reduce((max, m) => (m.hp > max.hp ? m : max), alive[0]);
    return alive.reduce((min, m) => (m.hp < min.hp ? m : min), alive[0]);
  };
  const handleMonsterDeath = (monster) => {
    log.push(`${monster.name}을(를) 쓰러뜨렸다.`);
    totalXp += monster.xp;
    totalGold += randInt(monster.goldMin, monster.goldMax);
    loot.push(...rollLoot(monster));
    // 직업훈련소 결정 - 몹 종류 무관, 본인 직업에 맞는 결정이 일정 확률로 드랍
    const essenceItemId = CLASS_ESSENCE_ITEM[character.classMain];
    if (essenceItemId && Math.random() < ESSENCE_DROP_CHANCE) {
      loot.push({ itemId: essenceItemId, qty: 1 });
      log.push(`${ITEMS[essenceItemId].name}을(를) 얻었다.`);
    }
    // 레어/유니크/레전더리몹 전용 - 대장간 강화석이 낮은 확률로 드랍(단계가 높을수록 더 잘 나옴)
    if (monster.rare && Math.random() < RARE_MONSTER_STONE_DROP_CHANCE * (monster.uniqueTier || 1)) {
      loot.push({ itemId: 'enhance_stone', qty: monster.uniqueTier >= 3 ? 2 : 1 });
      log.push(`${ITEMS.enhance_stone.name}을(를) 얻었다!`);
    }
    // 그 지역 유니크(2단계)/레전더리(3단계) 몹만 아주 낮은 확률로 세트 아이템 한 짝을 드랍 -
    // 반지/목걸이 중 무작위 하나. 유저간 마켓 거래로 나머지 한 짝을 구해 세트를 맞출 수 있음
    if (monster.uniqueTier >= 2 && Math.random() < SET_ITEM_DROP_CHANCE) {
      const setPieces = ZONE_SET_ITEMS[zoneId];
      if (setPieces) {
        const pieceItemId = setPieces[randInt(0, setPieces.length - 1)];
        loot.push({ itemId: pieceItemId, qty: 1 });
        log.push(`${ITEMS[pieceItemId].name}을(를) 얻었다!! 세트 아이템이다!`);
      }
    }
    // 5피스 풀세트(중량방어구/직업별 세트) 조각 - 지역 무관, 아무 유니크/레전더리몹에서나 드랍
    if (monster.uniqueTier >= 2 && Math.random() < FULL_SET_ITEM_DROP_CHANCE) {
      const pieceItemId = ALL_FULL_SET_ITEM_IDS[randInt(0, ALL_FULL_SET_ITEM_IDS.length - 1)];
      loot.push({ itemId: pieceItemId, qty: 1 });
      log.push(`${ITEMS[pieceItemId].name}을(를) 얻었다!! 세트 아이템이다!`);
    }
    killedMonsterIds.push(monster.id);
  };

  outer:
  while (aliveMonsters().length) {
    rounds++;
    if (rounds > MAX_ROUNDS_PER_ENCOUNTER) { victory = false; log.push('너무 지쳐 전투를 중단했다.'); break outer; }
    if (!alivePartyMembers().length) { victory = false; log.push('파티가 전멸했다...'); break outer; }

    // 이니셔티브 순서 - 속도(민첩/몹 속도)가 높을수록 먼저 행동. 매 라운드 다시 굴려서 소폭의
    // 변동(지터)을 줌 - 완전히 고정된 턴 순서가 되지 않게
    const initiative = [
      ...alivePartyMembers().map((p) => ({ kind: 'party', ref: p, roll: p.combatStats.agi + Math.random() * 3 })),
      ...aliveMonsters().map((m) => ({ kind: 'monster', ref: m, roll: m.speed + Math.random() * 3 })),
    ].sort((a, b) => b.roll - a.roll);

    let anyKiting = false;
    for (const entry of initiative) {
      if (!alivePartyMembers().length || !aliveMonsters().length) break;

      if (entry.kind === 'party') {
        const actor = entry.ref;
        if (actor.hp <= 0) continue;

        const potionResult = maybeUsePotion({
          potionRules: actor.potionRules, inventory: sharedInventory,
          resources: {
            hp: { current: actor.hp, max: actor.combatStats.maxHp },
            mp: { current: actor.mp, max: actor.combatStats.maxMp },
            stamina: { current: actor.stamina, max: actor.combatStats.maxStamina },
          },
          potionsUsed, log, actorLabel: actor.label,
        });
        if (potionResult) {
          if (potionResult.kind === 'hp') actor.hp = Math.min(actor.combatStats.maxHp, actor.hp + potionResult.amount);
          if (potionResult.kind === 'mp') actor.mp = Math.min(actor.combatStats.maxMp, actor.mp + potionResult.amount);
          if (potionResult.kind === 'stamina') actor.stamina = Math.min(actor.combatStats.maxStamina, actor.stamina + potionResult.amount);
        }

        const target = pickMonsterByStance(actor.stance);
        if (!target) continue;
        if (tryUtilitySkill({ actor, party, monster: target, log, partyBuffs })) continue;

        const otherMonsters = monsters.filter((m) => m !== target);
        const result = performAttack({ actor, monster: target, otherMonsters, sharedInventory, log, isUnderleveled, partyBuffs });
        if (result.isKiting) anyKiting = true;
        if (result.monsterDied) handleMonsterDeath(target);
      } else {
        const monster = entry.ref;
        if (monster.hp <= 0) continue;
        // 화살로 카이팅 중이고 비원거리 몹이면 이 몹의 반격은 무효
        if (anyKiting && !monster.ranged) {
          log.push(`화살로 거리를 벌려 ${monster.name}의 접근을 막았다!`);
          continue;
        }
        const target = pickMonsterTarget();
        if (target) performMonsterAttack({ monster, target, log, isUnderleveled, affinityFromLastHit: null, partyBuffs });
      }
    }
  }

  const selfCombatant = party[0];
  const mercResults = party.slice(1).map((actor) => {
    // 패배하면 죽지는 않고 마을로 돌아오지만(무료 부활), 완전 회복은 아니고 최대치의 일부만 채워짐
    const finalHp = victory ? Math.max(0, actor.hp) : Math.round(actor.combatStats.maxHp * DEFEAT_REVIVE_PCT);
    const finalMp = victory ? Math.max(0, actor.mp) : Math.round(actor.combatStats.maxMp * DEFEAT_REVIVE_PCT);
    const finalStamina = victory ? Math.max(0, actor.stamina) : Math.round(actor.combatStats.maxStamina * DEFEAT_REVIVE_PCT);
    return {
      id: actor.id, arrowsUsed: actor.arrowsUsed, newInjuries: actor.newInjuries,
      finalHp, finalMp, finalStamina, finalHpPct: Math.max(0, Math.round((finalHp / actor.combatStats.maxHp) * 100)),
    };
  });
  const selfFinalHp = victory ? Math.max(0, selfCombatant.hp) : Math.round(selfCombatant.combatStats.maxHp * DEFEAT_REVIVE_PCT);
  const selfFinalMp = victory ? Math.max(0, selfCombatant.mp) : Math.round(selfCombatant.combatStats.maxMp * DEFEAT_REVIVE_PCT);
  const selfFinalStamina = victory ? Math.max(0, selfCombatant.stamina) : Math.round(selfCombatant.combatStats.maxStamina * DEFEAT_REVIVE_PCT);

  return {
    log, victory, isRareEncounter: encounter.isRare, zoneId,
    xpGain: victory ? totalXp : Math.floor(totalXp * 0.3),
    goldGain: victory ? totalGold : Math.floor(totalGold * 0.3),
    loot: victory ? loot : [],
    killedMonsterIds,
    finalHp: selfFinalHp, finalMp: selfFinalMp, finalStamina: selfFinalStamina,
    finalHpPct: Math.max(0, Math.round((selfFinalHp / selfCombatant.combatStats.maxHp) * 100)),
    potionsUsed,
    arrowsUsed: selfCombatant.arrowsUsed,
    newInjuries: selfCombatant.newInjuries,
    mercenaries: mercResults,
  };
}
