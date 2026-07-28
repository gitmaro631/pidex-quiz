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
import { facilityBonusMultiplier, moraleResistBonus } from './data/rpg/facilities.js';
import { SQUIRE_SKILL_POWER_MULT } from './data/rpg/mercenaries.js';

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
// 패배하면 소지금(모험 시작 시점 기준)의 이 비율만큼 잃음 - adventure.js가 이 값으로 실제 골드를 차감함
const DEFEAT_GOLD_LOSS_PCT = 0.1;
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
// 직업이 숙련되지 않은 무기(classDef.weaponTypes에 없는 타입)를 장착했을 때의 패널티 - 명중굴림에 페널티로 통합됨
const OFF_CLASS_WEAPON_DAMAGE_MULT = 0.7;
const OFF_CLASS_WEAPON_ATTACK_PENALTY = 4; // D&D식 명중굴림(1d20+공격보정 vs AC)에 -4
// 캐스터(마법사/성직자, resourceType이 stamina가 아닌 직업)가 방패를 장착했을 때의 패널티 - 두 손이
// 자유롭지 않아 방패를 제대로 못 다루므로 방패의 방어력 기여분이 이만큼만 반영됨(회피/AC 저하로 체감)
const OFF_CLASS_SHIELD_DEF_MULT = 0.4;
// 용병의 멘탈(공포저항) - 전열에서 피격당할 때마다 낮은 확률로 멘탈이 나가서 후열로 숨음(그 전투 한정, 일시적)
const MORALE_BREAK_BASE_CHANCE = 0.13; // 예전엔 0.25 - 근접딜러가 밀려나 그 라운드 공격을 못하는 스노우볼이 너무 잦다는 피드백으로 완화
const PLAYER_BASE_MENTAL_RESIST = 50; // 유저 캐릭터 전용 스탯이 따로 없어 용병 평균값(50~65)대로 기본값 사용
const BASE_INJURY_CHANCE = 0.08;
const WEAK_AFFINITY_INJURY_BONUS = 0.12; // 상성이 안 좋으면 다칠 확률이 더 높아짐
// D&D식 명중판정 - 1d20 + 공격보정 vs 상대 AC. 자연 20은 항상 명중(치명타), 자연 1은 항상 빗나감.
// AC/공격보정은 레벨·지역tier 위주로 스케일링(공격력/방어력 원수치가 이미 커서 그대로 쓰면 고티어에서
// 항상 명중해버림 - 그래서 레벨/tier 기반 소수치로 압축해서 계산, computeCharacterCombatStats/buildMonsterInstance 참고)
const CRIT_DAMAGE_MULT = 2;
const LEG_INJURY_AC_PENALTY = { 1: 2, 2: 5 }; // 다리 부상이면 그만큼 AC(회피력) 하락
// severity: 0=건강, 1=경상(붕대로 치료 가능), 2=중상(의사에게만 치료 가능)
const INJURY_ATK_MULT = { 1: 0.85, 2: 0.6 };
const INJURY_INCOMING_DAMAGE_BONUS = { 1: 0.1, 2: 0.25 };
// 민첩(AGI) - 이제 회피 대신 "공격속도"(추가타 확률)에만 영향(회피는 AC 명중판정으로 통합됨)
const AGI_EXTRA_ATTACK_PER_POINT = 0.003; // 민첩 1당 추가타(2연타) 확률 +0.3%p
const MAX_EXTRA_ATTACK_CHANCE = 0.6;
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
// 골드주머니 고블린(방랑) - 지역 무관 이 확률로 일반 조우 대신 등장(monsters.js의 gold_pouch_goblin 참고)
const GOLD_POUCH_GOBLIN_CHANCE = 0.005;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFlavor(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// 전투 로그 연출용 문구 - 매번 같은 "N 피해"만 반복하면 지루하니 짧은 동사구를 랜덤으로 섞어씀.
// 문법이 꼬이지 않게 항상 "이(가)/을(를)" 형태의 조사 뒤에 붙는 구조로 통일(기존 코드 관례와 동일)
const ATTACK_HIT_INTROS = ['제대로 꽂혔다', '정확히 적중했다', '매섭게 파고들었다', '빈틈을 찔렀다', '묵직하게 들어갔다'];
const ATTACK_CRIT_INTROS = ['급소를 완벽히 꿰뚫었다', '치명적인 일격이 작렬했다', '빈틈없이 급소를 노렸다'];
const ATTACK_MISS_LINES = ['빗나갔다', '허공을 갈랐다', '아슬아슬하게 비껴갔다', '가로막혔다'];
const MONSTER_HIT_INTROS = ['강타했다', '물어뜯었다', '베어냈다', '덮쳤다', '내리찍었다'];
const MONSTER_CRIT_INTROS = ['치명적으로 급소를 강타했다', '방어를 완전히 무너뜨렸다'];
const MONSTER_MISS_LINES = ['공격을 가까스로 피했다', '아슬아슬하게 회피했다', '몸을 굴려 피했다', '방어로 막아냈다'];
// 클라이언트(page-rpg.js)가 전투 로그 메시지 종류를 색으로 구분할 때 재사용 - 빗나감 문구 전체
export const COMBAT_MISS_PHRASES = [...ATTACK_MISS_LINES, ...MONSTER_MISS_LINES];

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

  // 방랑하는 골드주머니 고블린 - 지역 무관, 아주 낮은 확률로 그 지역의 일반 조우를 대체함(항상 혼자 등장)
  if (Math.random() < GOLD_POUCH_GOBLIN_CHANCE) {
    return { zone, monsterIds: ['gold_pouch_goblin'], isRare: true, uniqueTier: 1 };
  }

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

export function buildMonsterInstance(monsterId, zone, uniqueTier = 1) {
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
    // targetPriority - 이 몹이 매 공격 대상을 고르는 방식(기본 'front'=진형 우선순위). skills는
    // 매 라운드 기본공격 대신 확률적으로 나가는 특수기(공격/전체공격/자가치유) - tryMonsterSkill 참고
    targetPriority: def.targetPriority || 'front',
    skills: def.skills || [],
    skillCooldowns: {},
    maxHp: Math.round(def.baseStats.hp * variance * statMult),
    hp: Math.round(def.baseStats.hp * variance * statMult),
    atk: Math.round(def.baseStats.atk * variance * statMult),
    def: Math.round(def.baseStats.def * variance * statMult),
    // D&D식 명중판정용(레벨 대신 지역 tier 기준으로 압축) - computeCharacterCombatStats의 ac/attackBonus와 짝.
    // acBonus는 골드주머니 고블린처럼 특별히 회피력이 높은 개체용 추가 보정(monsters.js 참고)
    ac: 10 + zone.tier + (uniqueTier - 1) * 2 + (def.acBonus || 0),
    attackBonus: 2 + zone.tier + (uniqueTier - 1) * 2,
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
  // 겸업(부직업)을 고르면 부직업 스킬까지 함께 사용 가능 - 본업 정체성(무기타입/스탯보정)은 그대로 유지.
  // 용병이 종자 흡수로 얻은 부직업(character.squireStatBonus 존재로 판별)은 스킬 위력이 50%로 깎임
  // (skillEffectivePower 참고) - 플레이어 본인의 정식 부직업은 페널티 없이 100% 그대로 사용
  const isSquireSubclass = !!character.squireStatBonus;
  const skills = subCls
    ? [...mainCls.skills, ...subCls.skills.map((s) => (isSquireSubclass ? { ...s, squireSkill: true } : s))]
    : mainCls.skills;
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
  // 방패는 물리 직업(전사/궁수) 전용 장비지만 캐스터도 장착 자체는 가능 - 다만 방어력 기여가 대폭 깎임(회피 저하)
  const offClassShield = !!(shieldItem && !shieldBroken && mainCls.resourceType !== 'stamina');
  const shieldDefContribution = (shieldBroken ? 0 : (((shieldItem && shieldItem.defBonus) || 0) + shieldEnhanceBonus))
    * (offClassShield ? OFF_CLASS_SHIELD_DEF_MULT : 1);
  // 방패+상의+하의가 함께 "몸통 방어구" 취급으로 방어력/체력에 합산됨
  const gearDefBonus = shieldDefContribution
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
  // 영지 시설(훈련소/방벽/연공실) 레벨 보너스 - 용병도 buildCombatant에서 본대의 facilityLevels를
  // 물려받아 이 함수를 타므로 본인과 동일하게 적용됨
  const facilityAtkMult = facilityBonusMultiplier(character, 'training');
  const facilityDefMult = facilityBonusMultiplier(character, 'ramparts');
  const facilityResourceMult = facilityBonusMultiplier(character, 'sanctum');
  // 종자로 흡수한 용병의 스탯 일부(흡수 시점에 고정된 값) - squire-mercenary.js가 부여
  const squireBonus = character.squireStatBonus || {};
  const finalAtk = Math.round((scalingStat * 2 + level + weaponAtkBonus + accessoryAtkBonus) * facilityAtkMult) + (squireBonus.atk || 0);
  const finalDef = Math.round((stats.vit + gearDefBonus + accessoryDefBonus) * facilityDefMult) + (squireBonus.def || 0);
  // D&D식 명중판정용 - 레벨/tier 위주로 압축한 값(공/방 원수치를 그대로 쓰면 고티어에서 늘 명중해버림).
  // attackBonus: 레벨 + 무기숙련(atk의 일부) / ac: 레벨 + 방어(def의 일부) + 민첩(dex 보정격)
  const attackBonus = 2 + Math.floor(level / 3) + Math.min(6, Math.floor(finalAtk / 10));
  const ac = 10 + Math.floor(level / 3) + Math.min(8, Math.floor(finalDef / 8)) + Math.min(5, Math.floor(stats.agi / 8));
  return {
    maxHp: BASE_HP + level * HP_PER_LEVEL + Math.round(stats.vit * level * VIT_HP_PER_LEVEL) + gearHpBonus + accessoryHpBonus + (squireBonus.maxHp || 0),
    maxMp: Math.round((BASE_MP + level * MP_PER_LEVEL + Math.round(scalingStat * level * MAGIC_STAT_MP_PER_LEVEL)) * facilityResourceMult),
    // 향후 스테미나 소모 스킬/행동에 대비한 자원(현재는 회복 대상으로만 사용)
    maxStamina: Math.round((BASE_STAMINA + level * STAMINA_PER_LEVEL + Math.round(stats.agi * level * AGI_STAMINA_PER_LEVEL)) * facilityResourceMult),
    atk: finalAtk,
    def: finalDef,
    attackBonus,
    ac,
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
    // 용병도 영지 시설(훈련소/방벽) 혜택을 받아야 하니 본대의 facilityLevels를 물려받게 함
    ...(character.mercenaries || []).filter((m) => m.assignment === 'active' && !m.hospitalized)
      .map((m) => ({ ...m, facilityLevels: character.facilityLevels })),
  ];
  return members.reduce((sum, m) => {
    const stats = computeCharacterCombatStats(m);
    return sum + monsterPowerScore(stats);
  }, 0);
}

// computePartyPower와 같은 가중치로 몹 한 마리(또는 캐릭터 전투스탯)의 "전력치"를 계산 - 사냥터
// 미리보기 화면에서 몹 이름 색깔로 난이도를 표시하는 데 씀(preview-zone.js 참고)
export function monsterPowerScore(stats) {
  return stats.atk * 2 + stats.def * 3 + stats.maxHp / 5;
}

// 몹 전력치/내 파티 전력치 비율(difficultyRatio) 구간별 표시색+경험치 배율. 미리보기 화면의 몹 이름
// 색깔과 실제 처치시 받는 경험치 보너스가 같은 기준을 쓰도록 여기 한 곳에서만 정의함(클라이언트도
// 이 배열을 그대로 import해서 색을 결정 - page-rpg.js 참고). 위험한(붉은) 몹일수록 경험치를 더 줌
// 색은 회색(안전)→빨강(위험) 두 극단만 고정하고, 중간 3단계는 게임 아이템 등급색 관례(일반=회색,
// 고급=초록, 희귀=파랑, 영웅=보라)를 그대로 가져와서 한눈에 단계가 갈리도록 함
export const MONSTER_DIFFICULTY_TIERS = [
  { maxRatio: 0.15, color: '#7a7f9a', xpMult: 0.25 }, // 회색 - 매우 쉬움(앱 전역에서 쓰는 --muted 힌트 텍스트 색과 동일)
  { maxRatio: 0.3, color: '#22c55e', xpMult: 1.0 }, // 고급(초록) - 쉬움(기본)
  { maxRatio: 0.5, color: '#3b82f6', xpMult: 1.3 }, // 희귀(파랑) - 보통
  { maxRatio: 0.8, color: '#9333ea', xpMult: 1.6 }, // 영웅(보라) - 위험
  { maxRatio: Infinity, color: '#ef4444', xpMult: 2.0 }, // 빨강 - 매우 위험
];
export function monsterDifficultyTier(ratio) {
  return MONSTER_DIFFICULTY_TIERS.find((t) => ratio <= t.maxRatio) || MONSTER_DIFFICULTY_TIERS[MONSTER_DIFFICULTY_TIERS.length - 1];
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

// 공용 무기/방어구 등급(uncommon/rare/legendary) 드랍은 원래 검/중갑 하나로만 고정되어 있었음 -
// 어떤 직업이 잡든 무기/방어구 타입이 완전 무작위로 갈리게 해서(캐릭 직업과 무관) 다른 타입을 얻으면
// 직접 쓰거나(무기는 직업 불일치 패널티 감수, 방패도 동일한 원칙) 마켓에서 맞는 직업에게 거래할 수 있음
const WEAPON_TIER_VARIANTS = {
  weapon_uncommon: ['weapon_uncommon', 'weapon_bow_uncommon', 'weapon_staff_uncommon'],
  weapon_rare: ['weapon_rare', 'weapon_bow_rare', 'weapon_staff_rare'],
  weapon_legendary: ['weapon_legendary', 'weapon_bow_legendary', 'weapon_staff_legendary'],
};
const ARMOR_TIER_VARIANTS = {
  armor_uncommon: ['armor_uncommon', 'armor_light_uncommon', 'armor_cloth_uncommon'],
  armor_rare: ['armor_rare', 'armor_light_rare', 'armor_cloth_rare'],
  armor_legendary: ['armor_legendary', 'armor_light_legendary', 'armor_cloth_legendary'],
};
// 가방은 등급이 오를수록 훨씬 희귀해야 하므로(각 등급 10칸 한도, data/rpg/items.js의 BAG_TIER_CAPS 참고)
// 개별 몹 드랍표를 다 안 건드리고, 최상위 기존 등급(bag_dungeon) 드랍 중 낮은 확률로만 그보다
// 한 단계 위인 bag_dimensional(5등급)로 대체되게 함
const BAG_DIMENSIONAL_UPGRADE_CHANCE = 0.08;
function rollLootItemId(itemId) {
  const variants = WEAPON_TIER_VARIANTS[itemId] || ARMOR_TIER_VARIANTS[itemId];
  if (variants) return variants[randInt(0, variants.length - 1)];
  if (itemId === 'bag_dungeon' && Math.random() < BAG_DIMENSIONAL_UPGRADE_CHANCE) return 'bag_dimensional';
  return itemId;
}

function rollLoot(monster) {
  const loot = [];
  for (const drop of monster.dropTable || []) {
    if (Math.random() < drop.chance) {
      loot.push({ itemId: rollLootItemId(drop.itemId), qty: randInt(drop.qtyMin, drop.qtyMax) });
    }
  }
  return loot;
}

const RANGED_WEAPON_TYPES = ['bow', 'staff']; // 원거리 무기 - 자동 진형 판정시 후열로 분류(활=사격, 지팡이=마법)
// 사거리가 긴 근접무기 - 전열이 아니라 중열에서도 상대 전열을 때릴 수 있음(창=길이, 사슬도리깨=휘둘러서 닿음)
const EXTENDED_REACH_WEAPON_TYPES = ['spear', 'flail'];
export const FORMATION_ROWS = ['front', 'mid', 'back']; // 몹 반격 우선순위도 이 순서(전열이 있으면 전열, 없으면 중열, 그다음 후열)

// 이 캐릭터/용병이 지금 선택할 수 있는 진형 목록 - 활/마법(원거리) 직업은 1~3열 전부 자유,
// 창/사슬도리깨를 든 전사는 사거리를 인정해 중열까지, 그 외 근접은 전열 고정
export function allowedFormationRows(characterLike) {
  const cls = CLASSES[characterLike.classMain];
  if (cls && cls.weaponTypes.some((t) => RANGED_WEAPON_TYPES.includes(t))) return FORMATION_ROWS;
  if (EXTENDED_REACH_WEAPON_TYPES.includes(computeCharacterCombatStats(characterLike).weaponType)) return ['front', 'mid'];
  return ['front'];
}
export function canChooseFormationRow(characterLike) {
  return allowedFormationRows(characterLike).length > 1;
}
// 진형이 명시적으로 지정 안 돼있으면 장착 무기로 자동 결정(활/지팡이=후열, 그 외=전열).
// 허용되지 않는 열이 저장돼있으면(직업/무기가 바뀌었거나 과거 데이터) 무시하고 자동으로 되돌림
export function effectiveFormationRow(characterLike) {
  const allowed = allowedFormationRows(characterLike);
  if (allowed.length === 1) return allowed[0];
  if (characterLike.formationRow && allowed.includes(characterLike.formationRow)) return characterLike.formationRow;
  const autoRow = RANGED_WEAPON_TYPES.includes(computeCharacterCombatStats(characterLike).weaponType) ? 'back' : 'front';
  return allowed.includes(autoRow) ? autoRow : allowed[allowed.length - 1];
}

// 파티원 1명(본인 또는 용병)의 전투용 런타임 상태를 구성 - characterLike는 character 또는
// character.mercenaries[i] (둘 다 stats/level/classMain/equipment/injuries 구조가 동일함)
function buildCombatant({ characterLike, isSelf, formationRow, sharedInventory, ownerCharacter }) {
  // 영지 시설(훈련소/방벽 등)은 본인뿐 아니라 그 캐릭터가 고용한 용병 전원에게도 적용됨 - 용병 객체엔
  // facilityLevels가 없으니 본대(ownerCharacter)의 것을 그대로 물려받게 함(본인은 이미 갖고 있어 그대로 둠)
  const statsSource = isSelf ? characterLike : { ...characterLike, facilityLevels: (ownerCharacter || characterLike).facilityLevels };
  const combatStats = computeCharacterCombatStats(statsSource);
  const allowedRows = allowedFormationRows(characterLike);
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
    // 용병은 별도 인벤토리 없이 본대(캐릭터)의 물자를 공유 - 화살은 sharedInventory에서 사용
    stance: characterLike.stance || 'stable',
    formationRow,
    allowedRows,
    hp: typeof characterLike.currentHp === 'number' ? characterLike.currentHp : combatStats.maxHp,
    mp: typeof characterLike.currentMp === 'number' ? characterLike.currentMp : combatStats.maxMp,
    stamina: typeof characterLike.currentStamina === 'number' ? characterLike.currentStamina : combatStats.maxStamina,
    alive: true,
    usesBow: combatStats.weaponType === 'bow',
    arrowsUsed: 0,
    accessoryElementDefense,
    doubleAttackChance,
    // 본인도 용병과 동일하게 공포에 밀려날 수 있음(유저 캐릭터 전용 필드가 없으니 기본값 사용).
    // 사기진작소 보너스는 본인/용병 구분 없이 그 캐릭터가 배치한 시설이니 파티 전원에게 적용됨
    mentalResist: Math.min(100, (isSelf ? (characterLike.mentalResist ?? PLAYER_BASE_MENTAL_RESIST) : characterLike.mentalResist)
      + moraleResistBonus(ownerCharacter)),
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
// 자원 종류는 기본적으로 직업(classDef.resourceType) 하나로 정해지지만, 스킬이 resourceType을 직접
// 지정하면(성기사의 마나 스킬, 흑기사의 hp 스킬 등) 직업 기본값 대신 그 스킬의 자원을 씀 - 한 직업이
// 스태미나+마나를 섞어 쓰거나(하이브리드), 체력 자체를 자원으로 쓰는(리스크형) 스킬 구성이 가능해짐
function skillResourceKey(actor, skill) {
  const resourceType = (skill && skill.resourceType) || actor.combatStats.classDef.resourceType;
  if (resourceType === 'hp') return 'hp';
  return resourceType === 'stamina' ? 'stamina' : 'mp';
}
const HP_SKILL_MIN_REMAINING = 1; // 체력을 자원으로 쓰는 스킬은 자살 방지로 최소 이 수치는 남겨둠
function spendActorResource(actor, skill, amount) {
  const key = skillResourceKey(actor, skill);
  actor[key] -= amount;
}
// 스킬을 이번에 쓸 수 있는지 - 자원이 충분한지 + (본인이면) 훈련소에서 배운 스킬인지(미습득 스킬은 사용 불가)
function isSkillUsable(actor, skill) {
  const key = skillResourceKey(actor, skill);
  const available = key === 'hp' ? actor.hp - HP_SKILL_MIN_REMAINING : actor[key];
  if (skill.manaCost > available) return false;
  if (skill.requiresShield && !actor.combatStats.hasShield) return false; // 방패 스킬은 방패 장착 중일 때만
  if (actor.isSelf) return (actor.skillLevels && actor.skillLevels[skill.id] > 0);
  return true; // 용병은 훈련 시스템 대상이 아니라 항상 사용 가능
}
// 훈련 단계(1~3)에 따라 위력이 세짐 - 본인만 해당, 용병은 항상 기본 위력.
// squireSkill(종자 흡수로 얻은 스킬)이면 위력이 SQUIRE_SKILL_POWER_MULT(50%)로 깎임
function skillEffectivePower(actor, skill) {
  const squireMult = skill.squireSkill ? SQUIRE_SKILL_POWER_MULT : 1;
  if (!actor.isSelf) return skill.power * squireMult;
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
  if (skill) spendActorResource(actor, skill, skill.manaCost);

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

  // D&D식 명중판정 - 1d20 + 공격보정(비숙련무기면 -4) vs 몹 AC. 자연20은 항상 명중+치명타, 자연1은 항상 빗나감
  let monsterDied = false;
  const hitCount = Math.random() < actor.doubleAttackChance ? 2 : 1;
  let lastRawDamage = 0;
  let anyHit = false;
  for (let hitIdx = 0; hitIdx < hitCount && !monsterDied; hitIdx++) {
    const naturalRoll = randInt(1, 20);
    const attackRollBonus = combatStats.attackBonus - (offClassWeapon ? OFF_CLASS_WEAPON_ATTACK_PENALTY : 0);
    const isCrit = naturalRoll === 20;
    const isFumble = naturalRoll === 1;
    const hit = isCrit || (!isFumble && naturalRoll + attackRollBonus >= monster.ac);
    const hitLabel = hitIdx === 1 ? ' (추가타!)' : '';
    if (!hit) {
      log.push(`${actor.label}의 ${skill ? skill.name : '공격'}이(가) ${pickFlavor(ATTACK_MISS_LINES)}!${hitLabel}`);
      continue;
    }
    anyHit = true;
    const critMult = isCrit ? CRIT_DAMAGE_MULT : 1;
    const rawDamage = Math.max(1, Math.round(combatStats.atk * power * elemMult * affinityMult * critMult * randRange(0.85, 1.15)));
    lastRawDamage = rawDamage;
    monster.hp -= rawDamage;
    const intro = isCrit ? pickFlavor(ATTACK_CRIT_INTROS) : pickFlavor(ATTACK_HIT_INTROS);
    const critLabel = isCrit ? ' 💥치명타!' : '';
    log.push(`${actor.label}의 ${skill ? skill.name : '공격'}, ${intro}! ${monster.name}에게 ${rawDamage} 피해.${elementNote}${affinityNote}${critLabel}${hitLabel}`);
    if (monster.hp <= 0) monsterDied = true;
  }
  // 광역(attack_all) - 대기 중인 다른 몹들에게도 스플래시 피해(스플래시로는 죽지 않음, HP 1 보존)
  if (anyHit && skill && skill.type === 'attack_all' && otherMonsters && otherMonsters.length) {
    const splashDamage = Math.max(1, Math.round(lastRawDamage * 0.4));
    for (const other of otherMonsters) {
      if (other === monster || other.hp <= 0) continue;
      other.hp = Math.max(1, other.hp - splashDamage);
    }
    log.push(`${actor.label}의 ${skill.name}이(가) 주변까지 휩쓸었다! (스플래시 ${splashDamage})`);
  }
  return { monsterDied, isKiting, affinity };
}

// 몹의 반격 1회 처리 - target(파티원 한 명)이 대상. 카이팅 중이면 아예 호출되지 않음(resolveCombat에서 스킵)
function performMonsterAttack({ monster, target, log, isUnderleveled, affinityFromLastHit, partyBuffs, party }) {
  const combatStats = target.combatStats;
  // D&D식 명중판정 - 다리 부상이면 AC가 그만큼 낮아짐(예전엔 회피율 저하로 표현하던 것과 같은 자리).
  // 성직자의 "마법 방어막" 버프(defMult>1)는 이제 데미지 감소 대신 AC 상승으로 반영됨
  const legPenalty = target.injurySeverity.leg ? (LEG_INJURY_AC_PENALTY[target.injurySeverity.leg] || 0) : 0;
  const defBuffAcBonus = Math.round((partyBuffs.defMult - 1) * 10);
  const targetAC = combatStats.ac + defBuffAcBonus - legPenalty;
  const naturalRoll = randInt(1, 20);
  const isCrit = naturalRoll === 20;
  const isFumble = naturalRoll === 1;
  const hit = isCrit || (!isFumble && naturalRoll + monster.attackBonus >= targetAC);
  if (!hit) {
    log.push(`${target.label}이(가) ${monster.name}의 공격을 ${pickFlavor(MONSTER_MISS_LINES)}!`);
    return;
  }

  const injuryDamageBonus = (INJURY_INCOMING_DAMAGE_BONUS[target.injurySeverity.arm] || 0) + (INJURY_INCOMING_DAMAGE_BONUS[target.injurySeverity.leg] || 0);
  const elementResistMult = (target.accessoryElementDefense === 'all' || target.accessoryElementDefense === monster.element) ? 0.7 : 1;
  const critMult = isCrit ? CRIT_DAMAGE_MULT : 1;
  const monsterDamage = Math.max(1, Math.round(monster.atk * critMult * randRange(0.85, 1.15) * (1 + injuryDamageBonus) * elementResistMult));
  target.hp -= monsterDamage;
  const intro = isCrit ? pickFlavor(MONSTER_CRIT_INTROS) : pickFlavor(MONSTER_HIT_INTROS);
  const critLabel = isCrit ? ' 💥치명타!' : '';
  log.push(`${monster.name}이(가) ${target.label}을(를) ${intro}! ${monsterDamage} 피해.${critLabel}`);
  if (!monster.statusImmune && monster.poisonChance > 0 && Math.random() < monster.poisonChance) {
    const poisonDamage = Math.round(combatStats.maxHp * 0.05);
    target.hp -= poisonDamage;
    log.push(`${target.label}이(가) 중독됐다! ${poisonDamage} 피해.`);
  }
  // 위험 수위(체력 25% 이하)에 처음 진입한 순간만 경고 - 매 공격마다 반복하지 않게 1회성 플래그로 관리
  if (!target.lowHpWarned && target.hp > 0 && target.hp / combatStats.maxHp <= 0.25) {
    target.lowHpWarned = true;
    log.push(`🩸 ${target.label}의 체력이 위험 수위에 이르렀다!`);
  }

  // 맞으면 멘탈(공포저항)이 낮을수록 한 칸 뒤로 물러날 확률이 있음(전열->중열->후열, 전투 중 일시적,
  // 다음 모험에서는 다시 기본 진형으로 돌아옴). 앞이 뚫리면 그만큼 뒤(궁수 등)가 위험해짐. 성직자의
  // "평정심"으로 멘탈저항이 일시적으로 오를 수 있음(partyBuffs.mentalBonus). 이미 후열이면 더 물러날 곳이 없음.
  // 공포로 인한 후퇴는 무기 사거리(allowedRows)와 무관하게 후열까지 밀릴 수 있음 - 근접무기가 사거리 밖으로
  // 밀려나면 공격을 못 하게 되는 게 의도된 "최악의 경우"(performAttack 쪽 weaponReachRows 체크 참고)
  // 파티원이 본인 혼자(용병 없음)면 밀려나 봤자 뒤를 봐줄 사람이 없어서 그냥 "이번 라운드 통째로
  // 공격 못 함"이 되어버림 - 다른 파티원을 지켜주는 전술적 트레이드오프가 없는 솔로 플레이에서는
  // 공포 후퇴를 아예 적용하지 않음(초보 사냥터에서 특히 체감 난이도가 과했다는 피드백으로 추가)
  const soloParty = party.filter((p) => p.alive).length <= 1;
  const rowIdx = FORMATION_ROWS.indexOf(target.formationRow);
  if (!soloParty && typeof target.mentalResist === 'number' && rowIdx >= 0 && rowIdx < FORMATION_ROWS.length - 1 && target.hp > 0) {
    const effectiveMentalResist = Math.min(100, target.mentalResist + partyBuffs.mentalBonus);
    const breakChance = MORALE_BREAK_BASE_CHANCE * (1 - effectiveMentalResist / 100);
    if (Math.random() < breakChance) {
      target.formationRow = FORMATION_ROWS[rowIdx + 1];
      log.push(`${target.label}이(가) 공포에 질려 뒤로 물러났다! 진형이 무너졌다.`);
      const frontStillHeld = party.some((p) => p.alive && p.hp > 0 && p.formationRow === 'front');
      if (!frontStillHeld) log.push('⚠️ 전열이 완전히 무너졌다! 몹들이 후열까지 노리기 시작한다...');
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
      spendActorResource(actor, healSkill, healSkill.manaCost);
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
    spendActorResource(actor, debuffSkill, debuffSkill.manaCost);
    const debuffPower = skillEffectivePower(actor, debuffSkill);
    monster.atk = Math.max(1, Math.round(monster.atk * (1 - debuffPower)));
    monster.def = Math.max(0, Math.round(monster.def * (1 - debuffPower)));
    monster.cursed = true;
    log.push(`${actor.label}의 ${debuffSkill.name}! ${monster.name}의 힘이 약해졌다.`);
    return true;
  }

  const atkBuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_atk_party' && isSkillUsable(actor, s));
  if (atkBuffSkill && partyBuffs.atkMult === 1) {
    spendActorResource(actor, atkBuffSkill, atkBuffSkill.manaCost);
    partyBuffs.atkMult = skillEffectivePower(actor, atkBuffSkill);
    log.push(`${actor.label}의 ${atkBuffSkill.name}! 파티 전체의 무기가 강화됐다.`);
    return true;
  }

  const defBuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_def_party' && isSkillUsable(actor, s));
  if (defBuffSkill && partyBuffs.defMult === 1) {
    spendActorResource(actor, defBuffSkill, defBuffSkill.manaCost);
    partyBuffs.defMult = skillEffectivePower(actor, defBuffSkill);
    log.push(`${actor.label}의 ${defBuffSkill.name}! 파티 전체에 마법 방어막이 씌워졌다.`);
    return true;
  }

  const mentalSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_mental_party' && isSkillUsable(actor, s));
  if (mentalSkill && partyBuffs.mentalBonus === 0) {
    spendActorResource(actor, mentalSkill, mentalSkill.manaCost);
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
// presetEncounter를 주면(필드 미리보기 화면에서 이미 굴려둔 조우) 새로 굴리지 않고 그대로 사용함 -
// "보이는 몹이 곧 싸울 몹"이 되도록(preview-zone.js가 만들고 adventure.js가 그대로 소비)
export function resolveCombat({ character, zoneId, stance, presetEncounter }) {
  const encounter = presetEncounter || rollEncounter(zoneId, (character.zoneKillCounts || {})[zoneId] || 0);
  const monsters = encounter.monsterIds.map((id) => buildMonsterInstance(id, encounter.zone, encounter.uniqueTier));
  const isUnderleveled = (character.level || 1) < encounter.zone.tier * 3;
  const sharedInventory = character.inventory || []; // 파티 전원이 이 물자(화살/포션)를 공유
  // 몹 하나하나가 내 파티 대비 얼마나 위협적인지(전력비) - 위험한(붉은) 몹일수록 경험치를 더 줌,
  // 너무 쉬운(회색) 몹은 경험치를 아주 조금만 줌(사냥터 미리보기의 몹 이름 색과 같은 기준, monsterDifficultyTier 참고).
  // 몹 무리 전체의 합산 전력치로 계산해서, 같은 종류라도 여러 마리가 몰려나온 조우가 더 위험하게(더 붉게/더 많은 보상으로) 반영됨
  const partyPower = Math.max(1, computePartyPower(character));
  const groupPower = monsters.reduce((sum, m) => sum + monsterPowerScore(m), 0);
  const encounterXpMult = monsterDifficultyTier(groupPower / partyPower).xpMult;

  const party = [
    buildCombatant({ characterLike: { ...character, stance }, isSelf: true, formationRow: effectiveFormationRow(character), sharedInventory, ownerCharacter: character }),
    ...(character.mercenaries || []).map((merc) => buildCombatant({
      characterLike: merc, isSelf: false, formationRow: effectiveFormationRow(merc), sharedInventory, ownerCharacter: character,
    })),
  ];

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
  // 몹마다 다른 방식으로 파티 공격대상을 고름(targetPriority, monsters.js 참고):
  // front(기본, 진형 우선순위) / lowest_hp(약한 상대 마무리) / highest_atk(가장 위협적인 상대부터) / random(무작위)
  const pickMonsterTarget = (monster) => {
    const alive = alivePartyMembers();
    if (!alive.length) return null;
    const priority = monster.targetPriority || 'front';
    if (priority === 'lowest_hp') return alive.reduce((min, p) => (p.hp < min.hp ? p : min), alive[0]);
    if (priority === 'highest_atk') return alive.reduce((max, p) => (p.combatStats.atk > max.combatStats.atk ? p : max), alive[0]);
    if (priority === 'random') return alive[randInt(0, alive.length - 1)];
    const pool = FORMATION_ROWS.map((row) => alive.filter((p) => p.formationRow === row)).find((rowMembers) => rowMembers.length) || alive;
    return pool[randInt(0, pool.length - 1)];
  };
  // 몹의 특수기 - 매 라운드 기본공격 전에 확률+쿨다운으로 판정, 나가면 이번 라운드 기본공격은 생략
  const tryMonsterSkill = (monster) => {
    for (const skill of monster.skills) {
      if ((monster.skillCooldowns[skill.id] || 0) > 0) continue;
      if (Math.random() >= (skill.chance ?? 0.3)) continue;
      monster.skillCooldowns[skill.id] = skill.cooldownRounds ?? 3;
      if (skill.type === 'heal_self') {
        const healAmount = Math.round(monster.maxHp * (skill.healPct ?? 0.15));
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmount);
        log.push(`${monster.name}의 ${skill.name}! 체력을 ${healAmount} 회복했다.`);
        return true;
      }
      if (skill.type === 'attack_all') {
        // 광역기는 명중굴림 없이 전체 타격(플레이어의 attack_all 스플래시와 같은 취급) - D&D에서도
        // 광역 주문은 보통 회피굴림이지 명중굴림이 아니므로, 여기선 단순화해 항상 맞는 것으로 처리
        const alive = alivePartyMembers();
        alive.forEach((target) => {
          const dmg = Math.max(1, Math.round(monster.atk * (skill.powerMult ?? 1.3) * randRange(0.85, 1.15)));
          target.hp -= dmg;
        });
        log.push(`${monster.name}의 ${skill.name}! 파티 전체를 휩쓸었다.`);
        return true;
      }
      if (skill.type === 'attack') {
        const target = pickMonsterTarget(monster);
        if (!target) return false;
        const legPenalty = target.injurySeverity.leg ? (LEG_INJURY_AC_PENALTY[target.injurySeverity.leg] || 0) : 0;
        const targetAC = target.combatStats.ac + Math.round((partyBuffs.defMult - 1) * 10) - legPenalty;
        const naturalRoll = randInt(1, 20);
        const isCrit = naturalRoll === 20;
        const isFumble = naturalRoll === 1;
        if (!isCrit && (isFumble || naturalRoll + monster.attackBonus < targetAC)) {
          log.push(`${monster.name}의 ${skill.name}! ${target.label}이(가) ${pickFlavor(MONSTER_MISS_LINES)}!`);
          return true;
        }
        const dmg = Math.max(1, Math.round(monster.atk * (skill.powerMult ?? 1.6) * (isCrit ? CRIT_DAMAGE_MULT : 1) * randRange(0.85, 1.15)));
        target.hp -= dmg;
        log.push(`${monster.name}의 ${skill.name}! ${target.label}에게 ${dmg} 피해.${isCrit ? ' 💥치명타!' : ''}`);
        return true;
      }
    }
    return false;
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
    // 경험치와 골드 둘 다 같은 배율을 씀 - 일부러 저사양 장비로 몹을 상대적으로 위협적이게 만들어
    // 잡으면(전력비가 올라가 몹 이름이 붉게 보임) 보상도 더 커지는 리스크&리턴 구조가 골드에도 그대로 적용됨
    totalXp += Math.round(monster.xp * encounterXpMult);
    totalGold += Math.round(randInt(monster.goldMin, monster.goldMax) * encounterXpMult);
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
    aliveMonsters().forEach((m) => {
      for (const skillId in m.skillCooldowns) if (m.skillCooldowns[skillId] > 0) m.skillCooldowns[skillId]--;
    });

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

        // 무기 사거리가 안 닿는 위치면 아무 행동도 못 함 - 활/지팡이(원거리)는 위치 무관 항상 가능,
        // 창/사슬도리깨는 사거리가 있어 전열/중열까지 가능, 그 외 근접(검/도끼 등)은 전열이어야만 가능.
        // 공포에 밀려났거나(진형 붕괴) 원래 자리가 아니게 된 경우 전부 해당 - 이번 라운드는 몸빵만 하다가 넘어감
        const weaponReachRows = RANGED_WEAPON_TYPES.includes(actor.combatStats.weaponType)
          ? FORMATION_ROWS
          : EXTENDED_REACH_WEAPON_TYPES.includes(actor.combatStats.weaponType) ? ['front', 'mid'] : ['front'];
        if (!weaponReachRows.includes(actor.formationRow)) {
          log.push(`${actor.label}이(가) 전열에서 밀려나 있어 이번 턴은 공격하지 못했다!`);
          continue;
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
        if (tryMonsterSkill(monster)) continue;
        const target = pickMonsterTarget(monster);
        if (target) performMonsterAttack({ monster, target, log, isUnderleveled, affinityFromLastHit: null, partyBuffs, party });
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
  // 패배시 소지금의 10%를 잃음 - 실제 차감은 adventure.js가 처리(여기선 액수만 계산해서 알려줌)
  const goldLost = victory ? 0 : Math.floor((character.gold || 0) * DEFEAT_GOLD_LOSS_PCT);

  return {
    log, victory, isRareEncounter: encounter.isRare, zoneId,
    xpGain: victory ? totalXp : Math.floor(totalXp * 0.3),
    goldGain: victory ? totalGold : Math.floor(totalGold * 0.3),
    goldLost,
    loot: victory ? loot : [],
    killedMonsterIds,
    finalHp: selfFinalHp, finalMp: selfFinalMp, finalStamina: selfFinalStamina,
    finalHpPct: Math.max(0, Math.round((selfFinalHp / selfCombatant.combatStats.maxHp) * 100)),
    arrowsUsed: selfCombatant.arrowsUsed,
    newInjuries: selfCombatant.newInjuries,
    mercenaries: mercResults,
  };
}
