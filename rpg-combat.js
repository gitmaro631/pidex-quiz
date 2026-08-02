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
import { CLASS_ESSENCE_ITEM, TIER_POWER_MULT, MAX_SKILL_TIER } from './data/rpg/training.js';
import { ENHANCE_ATK_PER_LEVEL, ENHANCE_DEF_PER_LEVEL, RARE_MONSTER_STONE_DROP_CHANCE } from './data/rpg/enhancement.js';
import { facilityBonusMultiplier, moraleResistBonus, improvisedAttackBonus } from './data/rpg/facilities.js';
import { SQUIRE_SKILL_POWER_MULT } from './data/rpg/mercenaries.js';
import { tLang, ti } from './util-i18n.js';
import { getMonsterName, getSkillName, getMonsterSkillName, getItemName, getZoneName } from './rpg-i18n.js';

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
// VIT 1당, 레벨업 1회당 최대체력 +0.5 - applyXpGain(rpg-progression.js)이 레벨업 "그 순간"의 VIT로
// 매번 계산해서 vitHpAccrued에 영구 누적함(나중에 VIT를 더 찍어도 이미 지난 레벨업분은 재계산 안 됨 -
// 그래서 같은 최종 스탯이라도 언제 스탯을 찍었느냐에 따라 최대체력이 갈림). export해서 rpg-progression.js와 공유
export const VIT_HP_PER_LEVEL = 0.5;
const BASE_MP = 15;
const MP_PER_LEVEL = 2;
// 마나는 각 직업의 주스탯(전사=STR, 궁수=AGI, 마법사=INT, 성직자=WIS)에 비례 - VIT/HP와 같은 방식으로
// 레벨업 시점 스탯 기준으로 mainStatMpAccrued에 영구 누적됨
export const MAGIC_STAT_MP_PER_LEVEL = 0.3;
const BASE_STAMINA = 40;
const STAMINA_PER_LEVEL = 2;
// AGI도 같은 방식으로 agiStaminaAccrued에 영구 누적
export const AGI_STAMINA_PER_LEVEL = 0.4;
// 직업이 숙련되지 않은 무기(classDef.weaponTypes에 없는 타입)를 장착했을 때의 패널티 - 명중굴림에 페널티로 통합됨
const OFF_CLASS_WEAPON_DAMAGE_MULT = 0.7;
const OFF_CLASS_WEAPON_ATTACK_PENALTY = 4; // D&D식 명중굴림(1d20+공격보정 vs AC)에 -4
// 캐스터(마법사/성직자, resourceType이 stamina가 아닌 직업)가 방패를 장착했을 때의 패널티 - 두 손이
// 자유롭지 않아 방패를 제대로 못 다루므로 방패의 방어력 기여분이 이만큼만 반영됨(회피/AC 저하로 체감)
const OFF_CLASS_SHIELD_DEF_MULT = 0.4;
// 전사는 "만능 근접직" 컨셉이라 어떤 무기든 비숙련 패널티 없음(classDef.weaponTypes 체크 자체를 건너뜀)
const UNRESTRICTED_WEAPON_CLASS_IDS = ['warrior'];
// 성기사/흑기사는 반대로 "컨셉 무기"(발더스게이트/디아블로 참고, 전용무기 컨셉) 몇 개만 패널티 없음 -
// 성기사=검+사슬도리깨(축복받은 둔기), 흑기사=도끼+대검(저주받은 양손검). classDef.weaponTypes와
// 반드시 동일하게 맞춰둠(둘 다 이 목록 참고)
const CONCEPT_WEAPON_BY_CLASS = { paladin: ['sword', 'flail'], dark_knight: ['axe', 'greatsword'] };
// 물매(sling)는 원거리 보조무기 컨셉이라 직업 무관하게 항상 패널티 없음(전 직업 공용)
const UNIVERSAL_NO_PENALTY_WEAPON_TYPES = ['sling'];
function isOffClassWeapon(classDef, weaponType) {
  if (!weaponType) return false;
  if (UNIVERSAL_NO_PENALTY_WEAPON_TYPES.includes(weaponType)) return false;
  if (UNRESTRICTED_WEAPON_CLASS_IDS.includes(classDef.id)) return false;
  const allowed = CONCEPT_WEAPON_BY_CLASS[classDef.id] || classDef.weaponTypes;
  return !allowed.includes(weaponType);
}
// isOffClassWeapon과 같은 기준으로, 공격 스킬이 실제로 발동하는(isSkillUsable 참고) 무기 종류
// 목록을 UI 표시용으로 돌려줌 - null이면 "아무 무기나 가능"(전사 전용)이라는 뜻
export function attackSkillWeaponTypes(classDef) {
  if (UNRESTRICTED_WEAPON_CLASS_IDS.includes(classDef.id)) return null;
  const base = CONCEPT_WEAPON_BY_CLASS[classDef.id] || classDef.weaponTypes;
  return [...new Set([...base, ...UNIVERSAL_NO_PENALTY_WEAPON_TYPES])];
}
// 용병의 멘탈(공포저항) - 전열에서 피격당할 때마다 낮은 확률로 멘탈이 나가서 후열로 숨음(그 전투 한정, 일시적)
const MORALE_BREAK_BASE_CHANCE = 0.13; // 예전엔 0.25 - 근접딜러가 밀려나 그 라운드 공격을 못하는 스노우볼이 너무 잦다는 피드백으로 완화
const PLAYER_BASE_MENTAL_RESIST = 50; // 유저 캐릭터 전용 스탯이 따로 없어 용병 평균값(50~65)대로 기본값 사용
// 성기사/흑기사는 신념형 직업이라 멘탈이 원래 흔들리지 않음 - 공포로 인한 진형 후퇴 판정 자체를 항상 통과(0% 밀림)
const CLASS_MENTAL_RESIST_OVERRIDE = { paladin: 100, dark_knight: 100 };
// 힐/저주/파티버프가 없는 서포트 역할 용병(전사/궁수 등)이 쓰는 자기 전용 방어 버프의 지속시간/세기
const SELF_DEF_BUFF_ROUNDS = 3;
const SELF_DEF_BUFF_AC_BONUS = 3;
// 체력이 이 비율 이하로 떨어지면 무조건(확률 판정 없이) 맨 뒷열로 후퇴함 - 기존 "위험 수위" 경고 로그와 같은 기준선
const DANGER_RETREAT_HP_PCT = 0.25;
// 전사 최후의 저항(last_stand) - "죽기 직전"은 위 후퇴 기준(25%)보다 더 급박해야 하므로 별도로 낮게 잡음.
// 전투당 1회만 발동(actor.lastStandUsed로 관리), 무적 지속시간은 훈련 단계와 무관하게 항상 고정값(이게
// "무적은 기본" 요구사항) - 훈련해서 오르는 건 무기 데미지 보너스 쪽(LAST_STAND_WEAPON_BONUS_BY_TIER)
const LAST_STAND_HP_TRIGGER_PCT = 0.15;
const LAST_STAND_INVINCIBLE_ROUNDS = 2;
const LAST_STAND_WEAPON_BONUS_BY_TIER = { 1: 0.05, 2: 0.08, 3: 0.12 };
// 방패기술 반격의 기본 데미지 배율(자기 atk 기준) - 방패기술 훈련 단계에 따라 더 세짐(computeCharacterCombatStats 참고)
const SHIELD_COUNTER_BASE_DAMAGE_MULT = 0.5;
// 전사 이도류(dual_wield) - 보조무기 공격력 합산치에 얹는 추가 보너스. 3단계(만렙)에서 정확히 +5%가 되도록
// 단계별 값을 직접 지정(다른 패시브처럼 TIER_POWER_MULT로 배율만 곱하는 방식이 아님 - 목표 수치가 명확해서 고정표 사용)
const DUAL_WIELD_BONUS_BY_TIER = { 1: 0.03, 2: 0.04, 3: 0.05 };
// 성직자 둔기술(blunt_mastery) - 철퇴/전쟁망치/모닝스타/사슬도리깨 장착 시 주무기 공격력에 얹는 보너스.
// 3단계(만렙)에서 정확히 +10%(1/2단계는 6%/8%) - dual_wield와 같은 원칙으로 고정표 사용
const BLUNT_WEAPON_TYPES = ['mace', 'warhammer', 'morning_star', 'flail'];
const BLUNT_MASTERY_BONUS_BY_TIER = { 1: 0.06, 2: 0.08, 3: 0.10 };
// 마법사 완드술/스태프술 - 완드는 원래 화력이 낮은 대신 방패/양손완드가 가능해서 보너스도 작게(3단계 5%),
// 스태프는 양손 전용이라 화력이 센 대신 보너스도 크게(3단계 10%)
const WAND_MASTERY_BONUS_BY_TIER = { 1: 0.03, 2: 0.04, 3: 0.05 };
const STAFF_MASTERY_BONUS_BY_TIER = { 1: 0.06, 2: 0.08, 3: 0.10 };
// 궁수 회피 스킬 - 3단계(만렙)에서 5% 안쪽으로 제한
const EVASION_SKILL_BONUS_BY_TIER = { 1: 0.03, 2: 0.04, 3: 0.05 };
// 궁수 급소노출(exposing_shot) - 원래는 명중 시 무조건 발동이라 궁수 클리어 속도가 다른 직업 대비
// 지나치게 빨랐음(밸런스 시뮬로 확인). 확정 발동에서 확률 발동으로 하향
const EXPOSE_SHOT_PROC_CHANCE_BY_TIER = { 1: 0.2, 2: 0.25, 3: 0.3 };
// 사기진작(morale_boost) 시전 시 파티 전원이 멘탈붕괴 완전 면역을 받는 지속 라운드 수
const MORALE_BOOST_IMMUNE_ROUNDS = 4;
// 성기사 불굴의 의지 - 발동 1회당 AC(방어) 증가폭(그 전투 내내 유지, 스택 가능)
const INDOMITABLE_WILL_AC_PER_STACK = 2;
// 흑기사 피의 저주(blood_drain) - 지속 라운드 수, 라운드당 흡수량 배율(자기 atk 기준)
const BLOOD_DRAIN_ROUNDS = 3;
const BLOOD_DRAIN_PER_ROUND_MULT = 0.3;
// 흑기사 공포의 오라(dread_aura) - 몹이 멘탈붕괴로 공격을 못 하는 지속 라운드 수
const DREAD_AURA_STUN_ROUNDS = 2;
// 흑기사 되살림의 저주(reanimate) - 예전엔 "누가 죽어있으면 확률로 부활"이었는데, 이제 유저 본인이
// 죽는 순간 전투당 1회 확정 발동으로 바뀜: 본인 포함 이미 죽어있던 파티원 전원이 동시에 부활하고
// (부활 시 채워지는 체력 비율은 훈련 단계로 결정), 부활 직후 몇 라운드간 파티 전원이 무적이 됨
const REANIMATE_HP_PCT_BY_TIER = { 1: 0.25, 2: 0.5, 3: 0.75 };
const REANIMATE_INVINCIBLE_ROUNDS = 2;
// 성기사 용맹한 결의(valorous_resolve) - 발동 1회당 파티 전체 공격력 배율/방어력 증가폭(전투 내내 유지, 스택)
const PALADIN_PARTY_BOOST_ATK_MULT_PER_STACK = 1.03;
const PALADIN_PARTY_BOOST_DEF_AC_PER_STACK = 1;
// 전사 도발(taunt) - 훈련 단계(1~3)에 따라 지속 라운드 수가 늘어남(확률과는 별개 축)
const TAUNT_ROUNDS_BY_TIER = { 1: 2, 2: 3, 3: 4 };
// 공격 대상+스킬 선택(chooseAttackPlan) - 다른 몹들 평균 공격력 대비 이 배율 이상이면 "위협 몹"으로 우선 타겟팅
const THREAT_ATK_MULTIPLIER = 1.5;
// 이 정도 데미지(자기 atk 기준 추정치)면 끝낼 수 있다고 보고 "광역 싹쓸이 기회" 판정에 씀
const FINISH_HIT_ESTIMATE_MULT = 0.8;
// 궁수 급소노출(exposing_shot) - 회피력(AC) 감소가 유지되는 라운드 수(감소량 자체는 스킬 단계별로 다름)
const EXPOSE_EVASION_ROUNDS = 3;
// 성기사 개종(conversion) - 공격이 명중하면 확률로 그 몹을 회유해 몇 라운드간 파티 대신 다른 몹을 공격하게 함
const CONVERSION_ROUNDS = 3;
// 흑기사 공포의 일격(fear_strike) - dread_aura(맞았을 때 발동)와 반대로 '때렸을 때' 발동하는 별도 스킬.
// 같은 stunnedRounds를 공유하므로 겹치면 Math.max로 더 긴 쪽이 유지됨(DREAD_AURA_STUN_ROUNDS 재사용)
// 성직자 천사의 강림(angelic_descent) - 힐/광역힐 어느 쪽이든 시전하면 확률 없이 항상 발동(치유 자체가
// 조건), 몇 라운드간 파티 전체 공격력/방어력이 오르고 매 라운드 소량 회복됨. 훈련 단계가 오르면 세 효과 모두 세짐
const ANGELIC_DESCENT_ROUNDS = 3;
const ANGELIC_DESCENT_ATK_MULT_BY_TIER = { 1: 1.08, 2: 1.12, 3: 1.16 };
const ANGELIC_DESCENT_DEF_AC_BONUS_BY_TIER = { 1: 2, 2: 3, 3: 4 };
const ANGELIC_DESCENT_HEAL_PCT_BY_TIER = { 1: 0.03, 2: 0.04, 3: 0.05 };
// 마법사 연쇄 마력탄(chain_bolt) - 명중한 타격 하나하나마다(단일공격이든 광역의 각 타격이든) 독립적으로
// 확률 판정, 발동하면 그 타격 데미지의 절반이 무작위 "다른" 몹에게 튐(스플래시로도 죽을 수 있음 -
// 기존 attack_all 기본 스플래시(HP 1 보존, 확률 없음)와는 별개의 새 패시브)
const CHAIN_BOLT_SPLASH_MULT = 0.5;
// 전 직업 공용 - 생명력 재생(hp_regen)/기력 회복(resource_regen) 패시브. 확률 판정 없이 매 라운드 무조건
// 적용, 훈련 단계가 오르면 회복 비율만 커짐(1단계 1% ~ 3단계 3%). 체력을 자원으로 쓰는 흑기사가 특히 도움을 받음
const HP_REGEN_PCT_BY_TIER = { 1: 0.01, 2: 0.02, 3: 0.03 };
const RESOURCE_REGEN_PCT_BY_TIER = { 1: 0.01, 2: 0.02, 3: 0.03 };
// 흑기사 전용 생명력 흡수(vampiric_strike) - 무기 흡혈(lifeSteal, 아이템 스탯)과는 별개로 훈련해서 얻는
// 패시브. 확률 판정 없이 명중할 때마다 무조건 발동, 무기 흡혈과 중첩됨(둘 다 있으면 합산)
const VAMPIRIC_STRIKE_PCT_BY_TIER = { 1: 0.03, 2: 0.05, 3: 0.08 };
// 밀려난 칸 수(rowsOut)당 명중/피해 페널티 - 더 이상 "공격 불가"로 아예 막지 않는 대신, 밀린 만큼
// 조금씩 불리해짐(전열→후열처럼 두 칸 밀리면 페널티가 누적으로 더 세짐 - selectAttackWeapon 참고)
const PUSHED_ATTACK_ROLL_PENALTY_PER_ROW = 2;
const PUSHED_DAMAGE_MULT_PER_ROW = 0.85;
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
function bodyPartNameFor(part, lang) { return tLang(`rpg.ui.bodyPart.${part}`, lang, BODY_PART_NAMES[part]); }
// 아주 작은 확률로 단계를 건너뛰고 곧장 중상 - 상성이 나쁘거나 지역에 비해 렙이 낮으면 더 잘 발생
const DIRECT_SEVERE_BASE_CHANCE = 0.02;
const DIRECT_SEVERE_WEAK_AFFINITY_BONUS = 0.03;
const DIRECT_SEVERE_UNDERLEVEL_BONUS = 0.03;
const UNDERLEVEL_ZONE_MULTIPLIER = 3;
// 직업훈련소 결정 - 몹 종류 무관, 내(본인) 직업에 맞는 결정이 킬당 이 확률로 하나씩 드랍됨.
// 20%는 너무 자주 나온다는 피드백으로 5%로 낮춤(스킬 1단계 배우는 데 결정 3개 필요 - 대략 킬 60회당 3개꼴)
const ESSENCE_DROP_CHANCE = 0.05;
// 그 지역 유니크(2단계)/레전더리(3단계) 몹 전용 - 세트 아이템(반지/목걸이 중 하나)이 이 확률로 드랍
const SET_ITEM_DROP_CHANCE = 0.08;
// 5피스 풀세트(지역 무관) 조각 드랍 확률 - 아무 지역이든 유니크/레전더리몹이면 발동, 훨씬 희귀함
const FULL_SET_ITEM_DROP_CHANCE = 0.02;
// 골드주머니 고블린(방랑) - 지역 무관 이 확률로 일반 조우 대신 등장(monsters.js의 gold_pouch_goblin 참고)
const GOLD_POUCH_GOBLIN_CHANCE = 0.005;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// baseKey별 로케일 배열(rpg.log.flavor.{baseKey}.{i})에서 lang에 맞는 문구를 무작위로 하나 골라옴.
// arr는 원본 한국어 배열 - 개수 판단 + 키가 아직 없는 언어의 폴백으로 그대로 씀
function pickFlavor(baseKey, arr, lang) {
  const i = randInt(0, arr.length - 1);
  return tLang(`rpg.log.flavor.${baseKey}.${i}`, lang, arr[i]);
}

// 전투 로그 연출용 문구 - 매번 같은 "N 피해"만 반복하면 지루하니 짧은 동사구를 랜덤으로 섞어씀.
// 문법이 꼬이지 않게 항상 "이(가)/을(를)" 형태의 조사 뒤에 붙는 구조로 통일(기존 코드 관례와 동일)
const ATTACK_HIT_INTROS = ['제대로 꽂혔다', '정확히 적중했다', '매섭게 파고들었다', '빈틈을 찔렀다', '묵직하게 들어갔다'];
const ATTACK_CRIT_INTROS = ['급소를 완벽히 꿰뚫었다', '치명적인 일격이 작렬했다', '빈틈없이 급소를 노렸다'];
const ATTACK_MISS_LINES = ['빗나갔다', '허공을 갈랐다', '아슬아슬하게 비껴갔다', '가로막혔다'];
const MONSTER_HIT_INTROS = ['강타했다', '물어뜯었다', '베어냈다', '덮쳤다', '내리찍었다'];
const MONSTER_CRIT_INTROS = ['치명적으로 급소를 강타했다', '방어를 완전히 무너뜨렸다'];
const MONSTER_MISS_LINES = ['가까스로 피했다', '아슬아슬하게 회피했다', '몸을 굴려 피했다', '방어로 막아냈다'];
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

export function buildMonsterInstance(monsterId, zone, uniqueTier = 1, lang = 'ko') {
  const def = MONSTERS[monsterId];
  const variance = randRange(zone.varianceMin, zone.varianceMax);
  const statMult = UNIQUE_TIER_STAT_MULT[uniqueTier] || 1;
  const rewardMult = UNIQUE_TIER_REWARD_MULT[uniqueTier] || 1;
  const uniqueTierName = uniqueTier > 1 ? tLang(`rpg.ui.combat.uniqueTier.${uniqueTier}`, lang, UNIQUE_TIER_NAMES[uniqueTier]) : null;
  const monsterName = getMonsterName(monsterId, lang);
  return {
    id: def.id, name: uniqueTierName ? `${uniqueTierName} ${monsterName}` : monsterName,
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
  // 겸업(부직업)을 고르면 부직업의 "패시브 스킬만" 함께 사용 가능(공격/힐/버프 같은 액티브는 제외) -
  // 본업 정체성(무기타입/스탯보정/주력 전투스킬)은 완전히 그대로 유지한 채 패시브만 얹는 컨셉.
  // 용병이 종자 흡수로 얻은 부직업(character.squireStatBonus 존재로 판별)은 스킬 위력이 50%로 깎임
  // (skillEffectivePower 참고) - 플레이어 본인의 정식 부직업은 페널티 없이 100% 그대로 사용
  const isSquireSubclass = !!character.squireStatBonus;
  // id 중복 제외(예: 방패장착은 모든 직업이 이미 갖고 있어서 부직업으로 또 얹을 필요 없음)
  const subClsPassiveSkills = subCls
    ? subCls.skills.filter((s) => s.type.startsWith('passive_') && !mainCls.skills.some((ms) => ms.id === s.id))
    : [];
  const skills = subCls
    ? [...mainCls.skills, ...subClsPassiveSkills.map((s) => (isSquireSubclass ? { ...s, squireSkill: true } : s))]
    : mainCls.skills;
  // 용병은 액티브 스킬만 사용(패시브 제외) - basic_attack은 예외(항상 나가는 기본공격이라 유지).
  // isMercenary 플래그가 없는 예전 용병 기록도 걸러내도록 skillLevels 부재(용병은 훈련 대상이 아니라
  // 한 번도 설정된 적 없음, 본인 캐릭터는 defaultCharacter가 항상 {}로 채워줌)를 보조 판정 기준으로 같이 씀
  const isMercenaryLike = !!character.isMercenary || !character.skillLevels;
  const classDef = isMercenaryLike
    ? { ...mainCls, skills: skills.filter((s) => s.id === 'basic_attack' || !s.type.startsWith('passive_')) }
    : { ...mainCls, skills };
  const scalingStat = stats[mainCls.statScaling.atk] ?? stats.str; // str/agi/int 등 직업별 주스탯

  const equipment = character.equipment || {};
  const weaponItem = equipment.weapon ? ITEMS[equipment.weapon] : null;
  const offhandItem = equipment.offhand ? ITEMS[equipment.offhand] : null;
  const shieldItem = equipment.shield ? ITEMS[equipment.shield] : null;
  const armorTopItem = equipment.armor_top ? ITEMS[equipment.armor_top] : null;
  const armorBottomItem = equipment.armor_bottom ? ITEMS[equipment.armor_bottom] : null;
  const ringItem = equipment.ring ? ITEMS[equipment.ring] : null;
  const necklaceItem = equipment.necklace ? ITEMS[equipment.necklace] : null;

  // 내구도 0이 되면 파손 - 수리 전까지 그 부위 보너스가 전부 사라짐(장신구는 내구도 대상 아님)
  const weaponBroken = weaponItem && (equipment.weaponDurability ?? 100) <= 0;
  const offhandBroken = offhandItem && (equipment.offhandDurability ?? 100) <= 0;
  const shieldBroken = shieldItem && (equipment.shieldDurability ?? 100) <= 0;
  const armorTopBroken = armorTopItem && (equipment.armor_topDurability ?? 100) <= 0;
  const armorBottomBroken = armorBottomItem && (equipment.armor_bottomDurability ?? 100) <= 0;

  // 대장간 강화(1~10단계) - 내구도와 같은 원칙으로, 파손되면 강화 보너스도 함께 사라짐
  const weaponEnhanceBonus = weaponBroken ? 0 : (equipment.weaponEnhanceLevel || 0) * ENHANCE_ATK_PER_LEVEL;
  const offhandEnhanceBonus = offhandBroken ? 0 : (equipment.offhandEnhanceLevel || 0) * ENHANCE_ATK_PER_LEVEL;
  const shieldEnhanceBonus = shieldBroken ? 0 : (equipment.shieldEnhanceLevel || 0) * ENHANCE_DEF_PER_LEVEL;
  const armorTopEnhanceBonus = armorTopBroken ? 0 : (equipment.armor_topEnhanceLevel || 0) * ENHANCE_DEF_PER_LEVEL;
  const armorBottomEnhanceBonus = armorBottomBroken ? 0 : (equipment.armor_bottomEnhanceLevel || 0) * ENHANCE_DEF_PER_LEVEL;
  const weaponBaseAtkBonus = (weaponBroken ? 0 : ((weaponItem && weaponItem.atkBonus) || 0)) + weaponEnhanceBonus;
  // 무기 종류별 숙련 패시브(성직자 둔기술/마법사 완드술·스태프술) - 해당 무기 장착 중일 때만 적용,
  // 어떤 스킬 타입도 클래스당 하나뿐이라 서로 안 겹침(위 상수들 참고)
  const currentWeaponType = weaponBroken ? null : (weaponItem && weaponItem.weaponType);
  const bluntMasterySkillDef = classDef.skills.find((s) => s.type === 'passive_blunt_mastery');
  const bluntMasteryTier = (character.skillLevels && bluntMasterySkillDef && character.skillLevels[bluntMasterySkillDef.id]) || 0;
  const bluntMasteryBonusPct = BLUNT_WEAPON_TYPES.includes(currentWeaponType) && bluntMasteryTier > 0 ? (BLUNT_MASTERY_BONUS_BY_TIER[bluntMasteryTier] || 0) : 0;
  const wandMasterySkillDef = classDef.skills.find((s) => s.type === 'passive_wand_mastery');
  const wandMasteryTier = (character.skillLevels && wandMasterySkillDef && character.skillLevels[wandMasterySkillDef.id]) || 0;
  const wandMasteryBonusPct = currentWeaponType === 'wand' && wandMasteryTier > 0 ? (WAND_MASTERY_BONUS_BY_TIER[wandMasteryTier] || 0) : 0;
  const staffMasterySkillDef = classDef.skills.find((s) => s.type === 'passive_staff_mastery');
  const staffMasteryTier = (character.skillLevels && staffMasterySkillDef && character.skillLevels[staffMasterySkillDef.id]) || 0;
  const staffMasteryBonusPct = currentWeaponType === 'staff' && staffMasteryTier > 0 ? (STAFF_MASTERY_BONUS_BY_TIER[staffMasteryTier] || 0) : 0;
  // 전사 최후의 저항(last_stand) - 무기 종류 무관(전사는 만능 근접직)하게 무기 데미지에 훈련 단계별 보너스를 얹음.
  // 무적 발동 자체는 훈련 여부와 무관하게 항상 되지만(1단계 이상 배웠으면), 이 데미지 보너스만 단계에 비례해서 커짐
  const lastStandSkillDef = classDef.skills.find((s) => s.type === 'passive_last_stand');
  const lastStandTier = (character.skillLevels && lastStandSkillDef && character.skillLevels[lastStandSkillDef.id]) || 0;
  const lastStandBonusPct = lastStandTier > 0 ? (LAST_STAND_WEAPON_BONUS_BY_TIER[lastStandTier] || 0) : 0;
  const weaponAtkBonus = Math.round(weaponBaseAtkBonus * (1 + bluntMasteryBonusPct + wandMasteryBonusPct + staffMasteryBonusPct + lastStandBonusPct));
  // 이도류(전사 전용, equip.js에서 방패와 상호배타적으로 강제함) - 보조무기의 공격력이 그대로 합산됨(기본
  // 동작, 훈련 불필요). dual_wield 패시브를 훈련해뒀으면 그 위에 단계별 추가 보너스가 얹어짐(위 상수 참고)
  const offhandBaseAtkBonus = (offhandBroken ? 0 : ((offhandItem && offhandItem.atkBonus) || 0)) + offhandEnhanceBonus;
  const dualWieldSkillDef = classDef.skills.find((s) => s.type === 'passive_dual_wield');
  const dualWieldTier = (character.skillLevels && dualWieldSkillDef && character.skillLevels[dualWieldSkillDef.id]) || 0;
  const dualWieldBonusPct = offhandItem && dualWieldTier > 0 ? (DUAL_WIELD_BONUS_BY_TIER[dualWieldTier] || 0) : 0;
  const offhandAtkBonus = Math.round(offhandBaseAtkBonus * (1 + dualWieldBonusPct));
  // 보조무기(weapon2/weapon3) - 내구도/강화 추적 없는 단순 예비무기. 진형이 밀려 주무기가 안 닿는 상황에서
  // 상황에 맞는 무기로 자동 전환하는 데 씀(rpg-combat.js의 selectAttackWeapon 참고) - 평소엔 아무 영향 없음
  const subWeapons = ['weapon2', 'weapon3']
    .map((slot) => equipment[slot] && ITEMS[equipment[slot]])
    .filter(Boolean)
    .map((item) => ({ weaponType: item.weaponType, atkBonus: item.atkBonus || 0, element: item.element || 'none', elements: item.elements || null, lifeSteal: item.lifeSteal || 0 }));
  // 방패는 물리 직업(전사/궁수) 전용 장비지만 캐스터도 장착 자체는 가능 - 다만 방어력 기여가 대폭 깎임(회피 저하).
  // 단, 방패장착(shield_equip, 모든 직업이 배울 수 있는 공용 패시브)을 훈련해뒀으면 이 페널티가 없어짐
  const hasShieldEquipSkill = !!(character.skillLevels && character.skillLevels.shield_equip > 0);
  const offClassShield = !!(shieldItem && !shieldBroken && mainCls.resourceType !== 'stamina' && !hasShieldEquipSkill);
  // 방패기술(shield_mastery, 전사 전용 패시브) - 방패 자체에 붙은 멘탈붕괴방어/반격확률/완전방어확률
  // 수치를 "활성화"시킴(방패기술 없이는 방패에 이 수치가 있어도 그냥 안 씀). 등급 높은 방패일수록 기본 수치가
  // 크고, 방패기술 훈련 단계(1~3)가 오를수록 그 위에 TIER_POWER_MULT만큼 확률/반격피해가 더 올라감
  const shieldMasteryTier = (character.skillLevels && character.skillLevels.shield_mastery) || 0;
  const shieldMasteryActive = shieldMasteryTier > 0 && !!shieldItem && !shieldBroken;
  const shieldMasteryPowerMult = shieldMasteryActive ? (TIER_POWER_MULT[shieldMasteryTier] || 1) : 1;
  const shieldMentalResistBonus = shieldMasteryActive ? Math.round((shieldItem.mentalResistBonus || 0) * shieldMasteryPowerMult) : 0;
  const shieldCounterChance = shieldMasteryActive ? (shieldItem.counterChance || 0) * shieldMasteryPowerMult : 0;
  const shieldBlockChance = shieldMasteryActive ? (shieldItem.blockChance || 0) * shieldMasteryPowerMult : 0;
  // 반격 데미지 배율의 기준값(자기 atk 기준) - 방패기술 단계가 오르면 이것도 같이 세짐
  const shieldCounterDamageMult = shieldMasteryActive ? SHIELD_COUNTER_BASE_DAMAGE_MULT * shieldMasteryPowerMult : 0;
  // 궁수 전용 패시브 - 회피(피격시 확률로 완전 회피). 훈련 단계(1~3)가
  // 오르면 발동 확률이 TIER_POWER_MULT만큼 세짐(스킬 자체의 power 필드를 기준 확률로 사용)
  const evasionSkillDef = classDef.skills.find((s) => s.type === 'passive_evasion');
  const evasionTier = (character.skillLevels && evasionSkillDef && character.skillLevels[evasionSkillDef.id]) || 0;
  // 3단계(만렙)에서 5% 안쪽으로 딱 떨어지게 고정표 사용(다른 무기숙련 패시브들과 같은 원칙 -
  // power*TIER_POWER_MULT로는 정확한 목표치를 못 맞춰서 EVASION_SKILL_BONUS_BY_TIER를 직접 씀)
  // 연무장 배치 개인효과(basicsEvasionBonus)는 용병 전용(applyMercTerritoryJobEffect가 character.mercenaries만
  // 순회함) - 플레이어 본인은 work-territory.js로 공용 시설 레벨은 올릴 수 있어도 이 개인 보너스는 못 받음.
  // 그래서 본인 캐릭터의 회피율은 사실상 궁수 전용 회피 패시브 스킬 만렙(5%)이 최대치
  const evasionChance = (evasionTier > 0 ? (EVASION_SKILL_BONUS_BY_TIER[evasionTier] || 0) : 0) + (character.basicsEvasionBonus || 0);
  // 궁수 급소노출 - 명중 시 이 확률로만 발동(EXPOSE_SHOT_PROC_CHANCE_BY_TIER 참고, 예전엔 무조건 발동)
  const exposeShotSkillDef = classDef.skills.find((s) => s.type === 'passive_expose_evasion');
  const exposeShotTier = (character.skillLevels && exposeShotSkillDef && character.skillLevels[exposeShotSkillDef.id]) || 0;
  const exposeShotChance = exposeShotTier > 0 ? (EXPOSE_SHOT_PROC_CHANCE_BY_TIER[exposeShotTier] || 0) : 0;
  // 마법사 전용 패시브 - 공격을 받으면 확률로 방어의 오라를 둘러 몇 라운드간 자기 AC가 오름(performMonsterAttack 참고)
  const arcaneAuraSkillDef = classDef.skills.find((s) => s.type === 'passive_arcane_aura');
  const arcaneAuraTier = (character.skillLevels && arcaneAuraSkillDef && character.skillLevels[arcaneAuraSkillDef.id]) || 0;
  const arcaneAuraChance = arcaneAuraTier > 0 ? arcaneAuraSkillDef.power * (TIER_POWER_MULT[arcaneAuraTier] || 1) : 0;
  const shieldDefContribution = (shieldBroken ? 0 : (((shieldItem && shieldItem.defBonus) || 0) + shieldEnhanceBonus))
    * (offClassShield ? OFF_CLASS_SHIELD_DEF_MULT : 1);
  // 방패+상의+하의가 함께 "몸통 방어구" 취급으로 방어력/체력에 합산됨
  const gearDefBonus = shieldDefContribution
    + (armorTopBroken ? 0 : ((armorTopItem && armorTopItem.defBonus) || 0)) + armorTopEnhanceBonus
    + (armorBottomBroken ? 0 : ((armorBottomItem && armorBottomItem.defBonus) || 0)) + armorBottomEnhanceBonus;
  // 무기/보조무기도 성직자 둔기 아이템 등의 hpBonus/severeInjuryResist를 실제로 반영하도록 포함
  const gearHpBonus = (shieldBroken ? 0 : ((shieldItem && shieldItem.hpBonus) || 0))
    + (armorTopBroken ? 0 : ((armorTopItem && armorTopItem.hpBonus) || 0))
    + (armorBottomBroken ? 0 : ((armorBottomItem && armorBottomItem.hpBonus) || 0))
    + (weaponBroken ? 0 : ((weaponItem && weaponItem.hpBonus) || 0))
    + (offhandBroken ? 0 : ((offhandItem && offhandItem.hpBonus) || 0));
  const gearSevereInjuryResist = (shieldBroken ? 0 : ((shieldItem && shieldItem.severeInjuryResist) || 0))
    + (armorTopBroken ? 0 : ((armorTopItem && armorTopItem.severeInjuryResist) || 0))
    + (armorBottomBroken ? 0 : ((armorBottomItem && armorBottomItem.severeInjuryResist) || 0))
    + (weaponBroken ? 0 : ((weaponItem && weaponItem.severeInjuryResist) || 0))
    + (offhandBroken ? 0 : ((offhandItem && offhandItem.severeInjuryResist) || 0));
  // 무기의 mentalResistBonus(성직자 둔기 아이템 등) - 방패의 것과 달리 방패기술 같은 "활성화" 훈련
  // 없이도 항상 그대로 적용됨(단순 장비 스탯이라 별도 숙련 게이트가 필요 없음)
  const weaponMentalResistBonus = (weaponBroken ? 0 : ((weaponItem && weaponItem.mentalResistBonus) || 0))
    + (offhandBroken ? 0 : ((offhandItem && offhandItem.mentalResistBonus) || 0));
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
  const improvisedBonus = improvisedAttackBonus(character); // 연무장 - 기본공격(무기/스킬 불필요) 위력/명중 보너스
  // 종자로 흡수한 용병의 스탯 일부(흡수 시점에 고정된 값) - squire-mercenary.js가 부여
  const squireBonus = character.squireStatBonus || {};
  // 영지 배치 개인효과(rpg-territory.js의 applyMercTerritoryJobEffect가 용병 개체에 직접 붙여줌) -
  // 방벽=방어력 flat 가산, 연공실=최대 마나/스테미나 % 가산, 연무장=회피율 flat 가산(evasionChance에서 반영),
  // 공방=공격력 flat 가산
  const rampartsDefBonus = character.rampartsDefBonus || 0;
  const sanctumResourceBonusPct = character.sanctumResourceBonusPct || 0;
  const workshopAtkBonus = character.workshopAtkBonus || 0;
  const finalAtk = Math.round((scalingStat * 2 + level + weaponAtkBonus + offhandAtkBonus + accessoryAtkBonus) * facilityAtkMult) + (squireBonus.atk || 0) + workshopAtkBonus;
  const finalDef = Math.round((stats.vit + gearDefBonus + accessoryDefBonus) * facilityDefMult) + (squireBonus.def || 0) + rampartsDefBonus;
  // D&D식 명중판정용 - 레벨/tier 위주로 압축한 값(공/방 원수치를 그대로 쓰면 고티어에서 늘 명중해버림).
  // attackBonus: 레벨 + 무기숙련(atk의 일부) / ac: 레벨 + 방어(def의 일부) + 민첩(dex 보정격)
  const attackBonus = 2 + Math.floor(level / 3) + Math.min(6, Math.floor(finalAtk / 10));
  const defAcContribution = Math.min(8, Math.floor(finalDef / 8)); // 도발(taunt)이 "방어력 2배"를 표현할 때 이만큼을 한 번 더 더해줌
  const ac = 10 + Math.floor(level / 3) + defAcContribution + Math.min(5, Math.floor(stats.agi / 8));
  // 체력/마나/스태미나의 스탯 기여분 - 본인 캐릭터는 applyXpGain(rpg-progression.js)이 매 레벨업 "그 순간"의
  // 스탯으로 계산해 vitHpAccrued/mainStatMpAccrued/agiStaminaAccrued에 영구 누적해준 값을 그대로 씀(나중에
  // 스탯을 더 찍어도 지난 레벨업분은 안 바뀜). 이 누적치가 없는 경우(용병, 혹은 아직 한 번도 레벨업을
  // 안 거친 캐릭터)는 예전처럼 현재 스탯×현재레벨로 즉석 계산(순수함수라 값은 항상 같음, 그냥 "고정" 효과만 없음)
  const vitHpContribution = character.vitHpAccrued != null ? character.vitHpAccrued : Math.round(stats.vit * level * VIT_HP_PER_LEVEL);
  const mainStatMpContribution = character.mainStatMpAccrued != null ? character.mainStatMpAccrued : Math.round(scalingStat * level * MAGIC_STAT_MP_PER_LEVEL);
  const agiStaminaContribution = character.agiStaminaAccrued != null ? character.agiStaminaAccrued : Math.round(stats.agi * level * AGI_STAMINA_PER_LEVEL);
  return {
    maxHp: BASE_HP + level * HP_PER_LEVEL + vitHpContribution + gearHpBonus + accessoryHpBonus + (squireBonus.maxHp || 0),
    maxMp: Math.round((BASE_MP + level * MP_PER_LEVEL + mainStatMpContribution) * facilityResourceMult * (1 + sanctumResourceBonusPct / 100)),
    // 향후 스테미나 소모 스킬/행동에 대비한 자원(현재는 회복 대상으로만 사용)
    maxStamina: Math.round((BASE_STAMINA + level * STAMINA_PER_LEVEL + agiStaminaContribution) * facilityResourceMult * (1 + sanctumResourceBonusPct / 100)),
    atk: finalAtk,
    def: finalDef,
    attackBonus,
    ac,
    element: weaponBroken ? 'none' : ((weaponItem && weaponItem.element) || 'none'), // 무기 파손시 속성공격도 사라짐
    // 등급 높은 지팡이/완드는 elements(복수)로 2개 이상의 속성을 가질 수 있음 - 시전마다 그중 하나를
    // 무작위로 골라 씀(performAttack의 castElement 참고). 없으면 위 element(단일) 그대로 사용
    elements: weaponBroken ? null : ((weaponItem && weaponItem.elements) || null),
    weaponType: (weaponItem && weaponItem.weaponType) || null,
    weaponAtkBonus, // 주무기가 최종 atk에 기여한 원수치(보조무기로 전투 중 전환할 때 이 값만 빼고 갈아끼움)
    // 흡혈(lifeSteal) - 무기 자체에 붙는 수치(훈련 불필요, 장착만 하면 바로 적용). 입힌 피해의 이 비율만큼
    // 그 즉시 체력으로 회복함(performAttack 참고) - 무기 파손시 사라짐
    weaponLifeSteal: weaponBroken ? 0 : ((weaponItem && weaponItem.lifeSteal) || 0),
    // 마법사 양손완드 - 보조무기가 완드일 때만 씀(performAttack의 동시타격 판정 참고). 전사 이도류와
    // 달리 물리 데미지가 아니라 "속성이 다르면 별도 속성 공격을 하나 더 날림" 컨셉이라 원소 정보가 필요함
    offhandWeaponType: (offhandItem && !offhandBroken && offhandItem.weaponType) || null,
    offhandElement: (offhandItem && !offhandBroken && offhandItem.element) || null,
    offhandAtkBonus,
    improvisedAttackBonus: improvisedBonus, // 연무장 시설 보너스(기본공격 전용) - performAttack 참고
    subWeapons,
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
    // 방패기술(shield_mastery)이 있어야만 0이 아님 - performMonsterAttack 참고
    shieldMentalResistBonus,
    weaponMentalResistBonus, // 무기/보조무기의 mentalResistBonus 합산치 - 별도 숙련 없이 항상 적용됨
    shieldCounterChance,
    shieldBlockChance,
    shieldCounterDamageMult,
    defAcContribution,
    // 궁수 전용 - 훈련 안 했으면 항상 0
    evasionChance,
    exposeShotChance,
    // 마법사 전용 - 훈련 안 했으면 항상 0
    arcaneAuraChance,
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
// wearChance - 이번 전투에서 그 부위가 "아예 마모될지 말지"의 확률(기본 1 = 매번 마모, 예전과 동일).
// 초급 사냥터(저티어 지역)에서 장비가 너무 빨리 닳아 수리비 부담이 크다는 피드백으로, adventure.js가
// 지역 tier에 따라 이 값을 낮춰서 넘겨줌 - 마모 "양"을 억지로 줄이면 최소 1은 항상 깎여서 티가 잘 안
// 나길래, 대신 마모가 아예 안 일어나는 판을 늘리는 방식으로 바꿈
export function applyEquipmentWear(equipment, wearChance = 1) {
  const next = { ...equipment };
  const brokenNow = [];
  const wearOne = (itemKey, durabilityKey) => {
    if (!next[itemKey]) return;
    const before = next[durabilityKey] ?? 100;
    if (before <= 0) return; // 이미 파손됨 - 수리 전까지 더 닳지 않음
    if (Math.random() >= wearChance) return; // 이번 전투는 마모 없이 넘어감
    const wear = randInt(1, 3);
    let after = Math.max(0, before - wear);
    const breakChance = Math.min(0.8, (100 - after) / 150);
    if (after > 0 && Math.random() < breakChance) after = 0;
    next[durabilityKey] = after;
    if (after === 0) brokenNow.push(itemKey);
  };
  wearOne('weapon', 'weaponDurability');
  wearOne('offhand', 'offhandDurability');
  wearOne('shield', 'shieldDurability');
  wearOne('armor_top', 'armor_topDurability');
  wearOne('armor_bottom', 'armor_bottomDurability');
  return { equipment: next, brokenNow };
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
  weapon_uncommon: ['weapon_uncommon', 'weapon_bow_uncommon', 'weapon_staff_uncommon', 'weapon_mace_uncommon', 'weapon_wand_uncommon', 'weapon_greatsword_uncommon', 'weapon_axe_uncommon'],
  weapon_rare: ['weapon_rare', 'weapon_bow_rare', 'weapon_staff_rare', 'weapon_mace_rare', 'weapon_wand_rare', 'weapon_greatsword_rare', 'weapon_axe_rare'],
  weapon_legendary: ['weapon_legendary', 'weapon_bow_legendary', 'weapon_staff_legendary', 'weapon_mace_legendary', 'weapon_wand_legendary', 'weapon_greatsword_legendary', 'weapon_axe_legendary'],
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

const RANGED_WEAPON_TYPES = ['bow', 'staff', 'wand', 'sling']; // 원거리 무기 - 자동 진형 판정시 후열로 분류(활=사격, 지팡이/완드=마법, 물매=투척)
// 양손무기 - 방패와 동시 장착 불가(equip.js 참고). 완드는 한손이라 방패와 같이 낄 수 있음(스태프와의 차별점)
export const TWO_HANDED_WEAPON_TYPES = ['staff'];
// 사거리가 긴 근접무기 - 전열이 아니라 중열에서도 상대 전열을 때릴 수 있음(창=길이, 사슬도리깨=휘둘러서 닿음)
const EXTENDED_REACH_WEAPON_TYPES = ['spear', 'flail'];
export const FORMATION_ROWS = ['front', 'mid', 'back']; // 몹 반격 우선순위도 이 순서(전열이 있으면 전열, 없으면 중열, 그다음 후열)

// 무기 타입 하나가 어느 열까지 닿는지 - 원거리는 위치 무관, 창/사슬도리깨는 전열+중열, 그 외 근접은 전열뿐.
// 주무기뿐 아니라 보조무기(weapon2/weapon3) 각각의 사거리 판정에도 씀(selectAttackWeapon 참고)
function weaponReachRows(weaponType) {
  if (RANGED_WEAPON_TYPES.includes(weaponType)) return FORMATION_ROWS;
  if (EXTENDED_REACH_WEAPON_TYPES.includes(weaponType)) return ['front', 'mid'];
  return ['front'];
}

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
function buildCombatant({ characterLike, isSelf, formationRow, ownerCharacter, lang = 'ko' }) {
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
    level: characterLike.level || 1, // 용병 액티브 스킬의 레벨연동 자동단계(skillEffectivePower 참고)에 씀
    // 영어처럼 격변화가 있는 언어에서 "Me's Attack" 같은 비문이 나오지 않도록, 자기 자신 라벨을
    // 문법적 위치별로 따로 준비함(한국어는 조사가 자동으로 붙어 label 하나로 충분해서 그대로 재사용).
    // label=주어(I), labelObject=목적어(me), labelPossessive=소유격 전체구(My / "이름's").
    // "'s" 접미사는 영어에서만 성립하는 표기라 lang==='en'일 때만 붙임 - 다른 언어(인도네시아어 등)는
    // 소유격 표시가 어순/조사로 되거나 아예 필요 없어서 붙이면 오히려 영어 표기가 섞여 보임(버그였음)
    name: isSelf ? tLang('rpg.ui.combat.selfSubject', lang, '나') : characterLike.name,
    label: isSelf ? tLang('rpg.ui.combat.selfSubject', lang, '나') : characterLike.name,
    labelObject: isSelf ? tLang('rpg.ui.combat.selfObject', lang, '나') : characterLike.name,
    labelPossessive: isSelf
      ? tLang('rpg.ui.combat.selfPossessive', lang, '나')
      : (lang === 'en' ? `${characterLike.name}'s` : characterLike.name),
    combatStats,
    stance: characterLike.stance || 'stable',
    formationRow,
    homeFormationRow: formationRow, // 사기진작(morale_boost)이 멘탈붕괴로 밀려난 아군을 되돌릴 때 쓰는 원래 자리
    mentallyBroken: false, // 멘탈붕괴로 밀려난 상태인지 - 위험수위(HP) 강제 후퇴와는 구분해서 사기진작 복귀 대상만 표시
    mentalImmuneRounds: 0, // 사기진작을 받으면 몇 라운드간 멘탈붕괴 판정 자체를 안 함
    allowedRows,
    hp: typeof characterLike.currentHp === 'number' ? characterLike.currentHp : combatStats.maxHp,
    mp: typeof characterLike.currentMp === 'number' ? characterLike.currentMp : combatStats.maxMp,
    stamina: typeof characterLike.currentStamina === 'number' ? characterLike.currentStamina : combatStats.maxStamina,
    alive: true,
    accessoryElementDefense,
    doubleAttackChance,
    // 본인도 용병과 동일하게 공포에 밀려날 수 있음(유저 캐릭터 전용 필드가 없으니 기본값 사용).
    // 사기진작소 보너스는 본인/용병 구분 없이 그 캐릭터가 배치한 시설이니 파티 전원에게 적용됨.
    // 성기사/흑기사는 CLASS_MENTAL_RESIST_OVERRIDE(100)로 다른 값을 다 덮어써서 사실상 안 밀림
    mentalResist: Math.min(100, (CLASS_MENTAL_RESIST_OVERRIDE[characterLike.classMain]
      ?? (isSelf ? (characterLike.mentalResist ?? PLAYER_BASE_MENTAL_RESIST) : characterLike.mentalResist + (characterLike.moraleTrainingBonus || 0)))
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
  // 공격 스킬(단일/광역)은 그 직업에 맞는 무기를 들고 있어야만 발동함 - 궁수가 검을 들고 조준사격을
  // 쏘거나 맨손으로 쏘는 건 말이 안 되므로, 직업 비숙련 무기(isOffClassWeapon)이거나 무기가 아예
  // 없으면 스킬 자체가 안 나가고 기본공격(맨몸/즉흥)으로 자동 대체됨(chooseAttackPlan 참고).
  // 전사는 "만능 근접직" 컨셉이라 isOffClassWeapon이 항상 false를 주므로 이 제약에서 자연히 예외가 됨
  if (skill.type === 'attack' || skill.type === 'attack_all') {
    const weaponType = actor.combatStats.weaponType;
    if (!weaponType || isOffClassWeapon(actor.combatStats.classDef, weaponType)) return false;
  }
  if (actor.isSelf) return (actor.skillLevels && actor.skillLevels[skill.id] > 0);
  return true; // 용병은 훈련 시스템 대상이 아니라 항상 사용 가능
}
// 훈련 단계(1~3)에 따라 위력이 세짐 - 본인만 해당, 용병은 항상 기본 위력.
// squireSkill(종자 흡수로 얻은 스킬)이면 위력이 SQUIRE_SKILL_POWER_MULT(50%)로 깎임
// 훈련소에서 결정+골드로 단계를 올리는 본인과 달리, 용병은 별도 훈련 없이 레벨이 5 오를 때마다
// 액티브 스킬 단계가 자동으로 1씩 올라감(최대 MAX_SKILL_TIER, 본인 훈련 단계와 같은 상한/배율 재사용)
const MERC_LEVELS_PER_SKILL_TIER = 5;
function mercAutoSkillTier(level) {
  return Math.min(MAX_SKILL_TIER, Math.floor((level || 1) / MERC_LEVELS_PER_SKILL_TIER));
}
function skillEffectivePower(actor, skill) {
  const squireMult = skill.squireSkill ? SQUIRE_SKILL_POWER_MULT : 1;
  if (!actor.isSelf) {
    const mercTier = mercAutoSkillTier(actor.level);
    return skill.power * (TIER_POWER_MULT[mercTier] || 1) * squireMult;
  }
  const tier = (actor.skillLevels && actor.skillLevels[skill.id]) || 0;
  return skill.power * (TIER_POWER_MULT[tier] || 1);
}
// 파티원(본인/용병) 스킬의 표시용 이름 - classDef.id 기준으로 locale 키(rpg.skill.{classId}.{skillId}.name)를
// 조회하고, 종자로 흡수한 부직업 스킬처럼 원래 직업이 다를 수 있는 경우엔 skill.name(원본 한국어)으로 자연 폴백
function displaySkillName(actor, skill, lang) {
  return getSkillName(actor.combatStats.classDef.id, skill.id, lang) || skill.name;
}
// 몹 스킬의 표시용 이름
function displayMonsterSkillName(monster, skill, lang) {
  return getMonsterSkillName(monster.id, skill.id, lang) || skill.name;
}

// 지금 위치(formationRow)에서 실제로 쓸 무기를 주무기+보조무기(weapon2/weapon3) 중에서 고름 - "위치/상황에
// 따라 무기 3개 중 하나를 골라 쓴다"는 컨셉. 그 열에 닿는 무기가 있으면 그중 공격력이 가장 센 걸 쓰고,
// 셋 다 안 닿으면(밀려난 근접무기 등) 그래도 주무기로 공격은 계속하되 rowsOut(밀려난 칸 수)만큼
// performAttack에서 명중/피해 페널티가 붙음
function selectAttackWeapon(actor) {
  const combatStats = actor.combatStats;
  const candidates = [
    { weaponType: combatStats.weaponType, atkBonus: combatStats.weaponAtkBonus, element: combatStats.element, elements: combatStats.elements, lifeSteal: combatStats.weaponLifeSteal, isMain: true },
    ...(combatStats.subWeapons || []).map((w) => ({ ...w, isMain: false })),
  ].filter((w) => w.weaponType);

  const reaching = candidates.filter((w) => weaponReachRows(w.weaponType).includes(actor.formationRow));
  if (reaching.length) {
    return { ...reaching.reduce((a, b) => (b.atkBonus > a.atkBonus ? b : a)), rowsOut: 0 };
  }
  const main = candidates.find((w) => w.isMain) || { weaponType: combatStats.weaponType, atkBonus: combatStats.weaponAtkBonus, element: combatStats.element, elements: combatStats.elements, lifeSteal: combatStats.weaponLifeSteal, isMain: true };
  const maxReachIdx = Math.max(...weaponReachRows(main.weaponType).map((r) => FORMATION_ROWS.indexOf(r)));
  const rowsOut = Math.max(0, FORMATION_ROWS.indexOf(actor.formationRow) - maxReachIdx);
  return { ...main, rowsOut };
}

// 파티원 한 명의 공격 1회 처리(스킬/화살/부상/비숙련무기 패널티/2연타 전부 포함) - monster는 참조로 변형됨.
// otherMonsters: 같은 조우에서 아직 순서를 기다리는 나머지 몹들 - attack_all(광역) 스킬의 스플래시 대상
function performAttack({ actor, monster, otherMonsters, log, isUnderleveled, partyBuffs, party, chosenSkill, lang = 'ko' }) {
  const combatStats = actor.combatStats;
  const weapon = selectAttackWeapon(actor);
  // 보조무기로 교체됐으면 그 무기의 원수치로, 주무기 그대로면 rowsOut(밀린 칸 수)만큼 피해 배율이 깎임
  // (combatStats.atk는 이미 주무기 보너스가 반영된 최종치라, 그 보너스만 빼고 선택된 무기 보너스로 갈아끼움 -
  // 시설 배율 등이 살짝 근사치가 되지만 "약간의 페널티" 수준에선 무시할 만함)
  const effectiveAtk = Math.max(1, combatStats.atk - combatStats.weaponAtkBonus + weapon.atkBonus)
    * Math.pow(PUSHED_DAMAGE_MULT_PER_ROW, weapon.rowsOut);
  // 어떤 공격스킬(단일/광역)을 쓸지는 이제 resolveCombat의 chooseAttackPlan이 전장 상황(위협몹/싹쓸이
  // 기회/몹 수)을 보고 미리 정해서 넘겨줌 - chosenSkill이 없을 때만(예외적 호출 경로 대비) 예전처럼
  // 배열 마지막 스킬로 폴백
  const skills = combatStats.classDef.skills.filter((s) => (s.type === 'attack' || s.type === 'attack_all') && isSkillUsable(actor, s));
  const skill = chosenSkill || (skills.length > 0 ? skills[skills.length - 1] : null);
  // 아직 다른 공격 스킬을 못 배웠거나 쓸 자원이 없으면 직업별 기본공격(basic_attack, skills 배열에
  // 있는 훈련 가능한 스킬)으로 대체 - 0단계(미훈련)여도 항상 쓸 수 있고, 훈련하면 다른 스킬처럼
  // TIER_POWER_MULT만큼 위력이 세짐. 무기가 진짜 없을 때(weapon.atkBonus<=0)만 improvisedAttack.powerMult
  // 페널티가 추가로 곱해지고, 무기는 있는데 스킬만 없으면 그 페널티 없이 기본공격 위력 그대로 나감
  const basicAttackSkill = combatStats.classDef.skills.find((s) => s.id === 'basic_attack');
  const improvised = combatStats.classDef.improvisedAttack || { powerMult: 1 };
  // 스킬 없이 기본공격이 나갈 때, 실제로 무기를 들고 있으면(weapon.atkBonus>0) 그 무기 이름으로 표시함 -
  // 검을 들고 있는데도 항상 "주먹질"이라고 뜨던 문제 수정(데미지 계산엔 원래도 무기 보너스가 반영되고
  // 있었음 - 표시 문구만 실제 상황과 안 맞았던 것). 진짜 맨손(무기 자체가 없음)일 때만 직업별
  // 맨몸 기술 이름(주먹질/짱돌 던지기 등)을 그대로 씀
  const attackLabel = skill
    ? displaySkillName(actor, skill, lang)
    : (weapon.atkBonus > 0
      ? ti('rpg.log.weaponAttackLabel', lang, { weapon: tLang(`rpg.ui.weaponType.${weapon.weaponType}`, lang, weapon.weaponType) })
      : displaySkillName(actor, basicAttackSkill, lang));
  // 파티 전체 적용: buff_atk_party(마법사/흑기사 등, 1회성) * 성기사 용맹한 결의(매턴 확률로 쌓이는 영구 스택)
  // 성직자 천사의 강림(angelic_descent) - 시전 후 몇 라운드 동안만 유지되는 시한부 버프(다른 파티버프와
  // 달리 재시전으로 갱신되고 라운드가 다하면 자동 소멸 - angelicRoundsLeft 참고)
  const angelicAtkMult = (partyBuffs.angelicRoundsLeft || 0) > 0 ? (partyBuffs.angelicAtkMult || 1) : 1;
  let power = (skill ? skillEffectivePower(actor, skill) : skillEffectivePower(actor, basicAttackSkill)) * partyBuffs.atkMult * (partyBuffs.paladinAtkMult || 1) * angelicAtkMult;
  if (!skill && weapon.atkBonus <= 0) power *= improvised.powerMult * combatStats.improvisedAttackBonus.powerMult;
  if (skill) spendActorResource(actor, skill, skill.manaCost);

  // 화살 소모 개념 없음 - 활은 항상 카이팅 가능(예전엔 화살 떨어지면 위력 60%로 깎였는데, 신규
  // 캐릭터가 화살 없이 활을 만들어도 못 쓰는 문제가 있어서 아예 없앰)
  const isBowThisAttack = weapon.weaponType === 'bow';
  const isKiting = isBowThisAttack;

  if (actor.injurySeverity.arm > 0) power *= INJURY_ATK_MULT[actor.injurySeverity.arm];

  const offClassWeapon = isOffClassWeapon(combatStats.classDef, weapon.weaponType);
  if (offClassWeapon) power *= OFF_CLASS_WEAPON_DAMAGE_MULT;

  // 스킬이 자체 속성(elements)을 가지면 매번 그 중 하나를 무작위로 골라 무기 속성 대신 사용
  // 스킬 자체에 elements가 있으면 그걸 우선(마법사/성직자 예전 방식 호환), 없으면 무기의 elements(등급
  // 높은 지팡이/완드가 2개 이상 가질 수 있음)에서 무작위로 하나, 그것도 없으면 무기의 단일 element
  const castElement = skill && skill.elements
    ? skill.elements[randInt(0, skill.elements.length - 1)]
    : (weapon.elements && weapon.elements.length ? weapon.elements[randInt(0, weapon.elements.length - 1)] : weapon.element);
  const elemMult = elementalMultiplier(castElement, monster.element);
  const affinity = classMonsterAffinity(combatStats.classDef, monster.tags);
  const affinityMult = affinity ? affinity.multiplier : 1;
  const affinityNote = affinity
    ? (affinity.kind === 'strong' ? tLang('rpg.ui.combat.strongAffinityNote', lang, ' (천적 관계! 추가 피해)') : tLang('rpg.ui.combat.weakAffinityNote', lang, ' (상성에 밀려 위력 약화)'))
    : '';
  const elementNote = (skill && skill.elements) || (weapon.elements && weapon.elements.length) ? ` [${castElement}]` : '';
  const pushedNote = weapon.rowsOut > 0 ? tLang('rpg.ui.combat.pushedNote', lang, ' (밀려난 자세라 위력 약화)') : '';

  // D&D식 명중판정 - 1d20 + 공격보정(비숙련무기면 -4, 밀려난 칸 수만큼 추가 감점) vs 몹 AC.
  // 자연20은 항상 명중+치명타, 자연1은 항상 빗나감
  let monsterDied = false;
  const hitCount = Math.random() < actor.doubleAttackChance ? 2 : 1;
  let lastRawDamage = 0;
  let anyHit = false;
  // 마법사 연쇄 마력탄(chain_bolt) - 이 공격에서 발생한 타격 하나하나가 독립적으로 판정하며, 스플래시로
  // 죽은 몹은 여기 모아뒀다가 함수 끝에서 반환(resolveCombat이 handleMonsterDeath를 호출하도록)
  const chainBoltDefeated = [];
  const tryChainBolt = (sourceMonster, damageDealt, pool) => {
    const chainSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_chain_bolt' && isSkillUsable(actor, s));
    if (!chainSkill || Math.random() >= skillEffectivePower(actor, chainSkill)) return;
    const candidates = pool.filter((m) => m !== sourceMonster && m.hp > 0);
    if (!candidates.length) return;
    const victim = candidates[randInt(0, candidates.length - 1)];
    const splashDamage = Math.max(1, Math.round(damageDealt * CHAIN_BOLT_SPLASH_MULT));
    victim.hp -= splashDamage;
    log.push(ti('rpg.log.chainBoltSplash', lang, { actor: actor.label, actorPoss: actor.labelPossessive, monster: victim.name, damage: splashDamage }));
    if (victim.hp <= 0) chainBoltDefeated.push(victim);
  };
  for (let hitIdx = 0; hitIdx < hitCount && !monsterDied; hitIdx++) {
    const naturalRoll = randInt(1, 20);
    const attackRollBonus = combatStats.attackBonus
      - (offClassWeapon ? OFF_CLASS_WEAPON_ATTACK_PENALTY : 0)
      - weapon.rowsOut * PUSHED_ATTACK_ROLL_PENALTY_PER_ROW
      + (!skill && weapon.atkBonus <= 0 ? combatStats.improvisedAttackBonus.accuracyBonus : 0);
    const isCrit = naturalRoll === 20;
    const isFumble = naturalRoll === 1;
    // 궁수 급소노출(exposing_shot)로 회피력이 떨어진 몹은 이 기간 동안 AC가 낮아져 누구든 더 잘 맞힘
    const monsterEffectiveAc = monster.ac - (monster.evasionDebuffRoundsLeft > 0 ? (monster.evasionDebuffReduction || 0) : 0);
    const hit = isCrit || (!isFumble && naturalRoll + attackRollBonus >= monsterEffectiveAc);
    const hitLabel = hitIdx === 1 ? tLang('rpg.ui.combat.extraHitLabel', lang, ' (추가타!)') : '';
    if (!hit) {
      log.push(ti('rpg.log.attackMiss', lang, { actor: actor.label, actorPoss: actor.labelPossessive, attack: attackLabel, miss: pickFlavor('attackMiss', ATTACK_MISS_LINES, lang), hitLabel }));
      continue;
    }
    anyHit = true;
    // 급소노출 - 명중해도 exposeShotChance 확률로만 발동(단계가 오르면 발동확률도, 감소량도 커짐)
    const exposeSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_expose_evasion' && isSkillUsable(actor, s));
    if (exposeSkill && Math.random() < (combatStats.exposeShotChance || 0)) {
      // 같은 디버프가 아직 남아있는 상태에서 재적용되면 지속시간/감소량 둘 다 더 큰 쪽으로(짧은 쪽으로
      // 덮어써서 손해보지 않게) - 서로 다른 디버프끼리는 각자 자기 타이머로 독립적으로 유지됨
      monster.evasionDebuffRoundsLeft = Math.max(monster.evasionDebuffRoundsLeft || 0, EXPOSE_EVASION_ROUNDS);
      monster.evasionDebuffReduction = Math.max(monster.evasionDebuffReduction || 0, Math.round(skillEffectivePower(actor, exposeSkill)));
      log.push(ti('rpg.log.exposeEvasion', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, exposeSkill, lang), monster: monster.name }));
    }
    // 성기사 전용 개종(conversion) - 공격이 명중하면 확률로 그 몹을 회유해 몇 라운드간 파티 대신 다른 몹을 공격하게 함
    const conversionSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_conversion' && isSkillUsable(actor, s));
    if (conversionSkill && Math.random() < skillEffectivePower(actor, conversionSkill)) {
      monster.charmedRoundsLeft = Math.max(monster.charmedRoundsLeft || 0, CONVERSION_ROUNDS);
      log.push(ti('rpg.log.conversionTrigger', lang, { actor: actor.label, actorPoss: actor.labelPossessive, monster: monster.name }));
    }
    // 흑기사 전용 공포의 일격(fear_strike) - 공격이 명중하면 확률로 그 몹을 멘탈붕괴시켜 몇 라운드 공격 불가
    // (dread_aura는 '맞았을 때' 발동하는 반대 트리거 - 같은 stunnedRounds를 공유해 겹치면 더 긴 쪽 유지)
    const fearStrikeSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_fear_strike' && isSkillUsable(actor, s));
    if (fearStrikeSkill && Math.random() < skillEffectivePower(actor, fearStrikeSkill)) {
      monster.stunnedRounds = Math.max(monster.stunnedRounds || 0, DREAD_AURA_STUN_ROUNDS);
      log.push(ti('rpg.log.fearStrike', lang, { actor: actor.label, actorPoss: actor.labelPossessive, monster: monster.name }));
    }
    const critMult = isCrit ? CRIT_DAMAGE_MULT : 1;
    const rawDamage = Math.max(1, Math.round(effectiveAtk * power * elemMult * affinityMult * critMult * randRange(0.85, 1.15)));
    lastRawDamage = rawDamage;
    monster.hp -= rawDamage;
    const intro = isCrit ? pickFlavor('attackCritIntro', ATTACK_CRIT_INTROS, lang) : pickFlavor('attackHitIntro', ATTACK_HIT_INTROS, lang);
    const critLabel = isCrit ? tLang('rpg.ui.combat.critLabel', lang, ' 💥치명타!') : '';
    log.push(ti('rpg.log.attackHit', lang, {
      actor: actor.label, actorPoss: actor.labelPossessive, attack: attackLabel, intro, monster: monster.name, damage: rawDamage,
      elementNote, affinityNote, critLabel, hitLabel, pushedNote,
    }));
    if (otherMonsters && otherMonsters.length) tryChainBolt(monster, rawDamage, otherMonsters);
    // 무기 흡혈(lifeSteal) - 스킬/훈련 무관, 무기 자체에 붙은 수치라 장착만 하면 항상 적용됨
    if (weapon.lifeSteal > 0) {
      const lifeStealAmount = Math.round(rawDamage * weapon.lifeSteal);
      if (lifeStealAmount > 0) {
        actor.hp = Math.min(actor.combatStats.maxHp, actor.hp + lifeStealAmount);
        log.push(ti('rpg.log.weaponLifeSteal', lang, { actor: actor.label, actorPoss: actor.labelPossessive, amount: lifeStealAmount }));
      }
    }
    // 흑기사 전용 생명력 흡수(vampiric_strike) - 무기 흡혈과 별개로 중첩, 확률 판정 없이 명중 시 항상 발동
    const vampiricSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_vampiric_strike' && isSkillUsable(actor, s));
    if (vampiricSkill) {
      const vampTier = (actor.skillLevels && actor.skillLevels[vampiricSkill.id]) || 0;
      const vampPct = VAMPIRIC_STRIKE_PCT_BY_TIER[vampTier] || 0;
      const vampAmount = Math.round(rawDamage * vampPct);
      if (vampAmount > 0) {
        actor.hp = Math.min(actor.combatStats.maxHp, actor.hp + vampAmount);
        log.push(ti('rpg.log.vampiricStrike', lang, { actor: actor.label, actorPoss: actor.labelPossessive, amount: vampAmount }));
      }
    }
    // 성기사 전용 패시브 - 입힌 피해의 일정 %만큼 파티 중 체력이 가장 낮은 아군(본인 포함)을 치료
    const holyLeechSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_holy_leech' && isSkillUsable(actor, s));
    if (holyLeechSkill && party && party.length) {
      const healPct = skillEffectivePower(actor, holyLeechSkill);
      const healAmount = Math.round(rawDamage * healPct);
      const lowestAlly = party.filter((p) => p.alive && p.hp > 0)
        .reduce((min, p) => (p.hp / p.combatStats.maxHp < min.hp / min.combatStats.maxHp ? p : min));
      if (lowestAlly) {
        lowestAlly.hp = Math.min(lowestAlly.combatStats.maxHp, lowestAlly.hp + healAmount);
        log.push(ti('rpg.log.holyLeech', lang, { actor: actor.label, actorPoss: actor.labelPossessive, target: lowestAlly.label, targetObj: lowestAlly.labelObject, amount: healAmount }));
      }
    }
    if (monster.hp <= 0) monsterDied = true;
    // 흑기사 전용 패시브(HP소모) - 명중하면 확률로 흡혈 저주를 걸어 몇 라운드간 몹 체력을 깎아 옮겨줌
    if (!monsterDied) {
      const drainSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_blood_drain' && isSkillUsable(actor, s));
      if (drainSkill) {
        const chance = skillEffectivePower(actor, drainSkill);
        if (Math.random() < chance) {
          spendActorResource(actor, drainSkill, drainSkill.manaCost);
          monster.drainRoundsLeft = BLOOD_DRAIN_ROUNDS;
          monster.drainPerRound = Math.max(1, Math.round(combatStats.atk * BLOOD_DRAIN_PER_ROUND_MULT));
          monster.drainTargetActor = actor;
          log.push(ti('rpg.log.bloodDrainStart', lang, { actor: actor.label, actorPoss: actor.labelPossessive, monster: monster.name }));
        }
      }
    }
  }
  // 광역(attack_all) - 대기 중인 다른 몹들에게도 스플래시 피해(스플래시로는 죽지 않음, HP 1 보존)
  if (anyHit && skill && skill.type === 'attack_all' && otherMonsters && otherMonsters.length) {
    const splashDamage = Math.max(1, Math.round(lastRawDamage * 0.4));
    for (const other of otherMonsters) {
      if (other === monster || other.hp <= 0) continue;
      other.hp = Math.max(1, other.hp - splashDamage);
      // 연쇄 마력탄 - 광역 스플래시로 맞은 몹 하나하나도 독립적으로 확률 판정(전체 대상 풀에서 자기 자신만 제외)
      tryChainBolt(other, splashDamage, [monster, ...otherMonsters]);
    }
    log.push(ti('rpg.log.attackAllSplash', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, skill, lang), damage: splashDamage }));
  }
  // 마법사 양손완드 - 주무기/보조무기가 둘 다 완드고 이번에 쓴 속성(castElement)과 보조무기 속성이
  // 다르면, 명중한 공격에 보조무기 속성 타격을 하나 더 동시에 날림(별도 명중판정 없음 - "두 속성을
  // 동시에 쏜다"는 컨셉이라 주공격이 맞았으면 자동 적중)
  if (anyHit && monster.hp > 0 && combatStats.weaponType === 'wand' && combatStats.offhandWeaponType === 'wand'
    && combatStats.offhandElement && combatStats.offhandElement !== castElement) {
    const offhandElemMult = elementalMultiplier(combatStats.offhandElement, monster.element);
    const offhandDamage = Math.max(1, Math.round(combatStats.offhandAtkBonus * offhandElemMult * affinityMult * randRange(0.85, 1.15)));
    monster.hp -= offhandDamage;
    if (monster.hp <= 0) monsterDied = true;
    log.push(ti('rpg.log.dualWandCast', lang, {
      actor: actor.label, actorPoss: actor.labelPossessive, monster: monster.name,
      damage: offhandDamage, element: combatStats.offhandElement,
    }));
  }
  return { monsterDied, isKiting, affinity, splashDefeated: chainBoltDefeated };
}

// 몹의 반격 1회 처리 - target(파티원 한 명)이 대상. 카이팅 중이면 아예 호출되지 않음(resolveCombat에서 스킵)
function performMonsterAttack({ monster, target, log, isUnderleveled, affinityFromLastHit, partyBuffs, party, lang = 'ko' }) {
  const combatStats = target.combatStats;
  // D&D식 명중판정 - 다리 부상이면 AC가 그만큼 낮아짐(예전엔 회피율 저하로 표현하던 것과 같은 자리).
  // 성직자의 "마법 방어막" 버프(defMult>1)는 이제 데미지 감소 대신 AC 상승으로 반영됨
  const legPenalty = target.injurySeverity.leg ? (LEG_INJURY_AC_PENALTY[target.injurySeverity.leg] || 0) : 0;
  const defBuffAcBonus = Math.round((partyBuffs.defMult - 1) * 10);
  const selfDefBonus = target.selfDefRounds > 0 ? (target.selfDefBonus || 0) : 0;
  // 성기사 불굴의 의지로 쌓인 영구 방어력(전투 내내 유지) + 용맹한 결의로 파티 전체에 쌓인 방어력
  const stackingDefBonus = (target.stackingDefBonus || 0) + (partyBuffs.paladinDefAcBonus || 0);
  // 전사 도발(taunt) - 지속시간 동안 방어력 2배(= 방어력이 AC에 기여하는 몫을 한 번 더 더해줌)
  const tauntDefBonus = target.tauntRoundsLeft > 0 ? (combatStats.defAcContribution || 0) : 0;
  // 성직자 천사의 강림 - 시한부(angelicRoundsLeft) 동안만 적용
  const angelicDefBonus = (partyBuffs.angelicRoundsLeft || 0) > 0 ? (partyBuffs.angelicDefAcBonus || 0) : 0;
  const targetAC = combatStats.ac + defBuffAcBonus + selfDefBonus + stackingDefBonus + tauntDefBonus + angelicDefBonus - legPenalty;
  const naturalRoll = randInt(1, 20);
  const isCrit = naturalRoll === 20;
  const isFumble = naturalRoll === 1;
  const hit = isCrit || (!isFumble && naturalRoll + monster.attackBonus >= targetAC);
  if (!hit) {
    log.push(ti('rpg.log.monsterAttackMiss', lang, { target: target.label, monster: monster.name, miss: pickFlavor('monsterMiss', MONSTER_MISS_LINES, lang) }));
    return { monsterDiedFromCounter: false };
  }
  // 궁수 전용 회피(evasion) 패시브 - 명중 판정(AC)과는 별개로, 맞을 때마다 이 확률로 완전히 피함(치명타 포함)
  if (Math.random() < (combatStats.evasionChance || 0)) {
    log.push(ti('rpg.log.evasionDodge', lang, { target: target.label, monster: monster.name }));
    return { monsterDiedFromCounter: false };
  }
  // 방패기술의 완전방어(blockChance) - 명중이 확정된 공격도 방패로 완전히 무산시킴(치명타여도 막힘)
  if (Math.random() < (combatStats.shieldBlockChance || 0)) {
    log.push(ti('rpg.log.shieldBlock', lang, { target: target.label, monster: monster.name }));
    return { monsterDiedFromCounter: false };
  }
  // 전사 전용 최후의 저항(last_stand) - 무적 상태면 명중이 확정된 공격(치명타 포함)도 데미지 자체가 없음
  if (target.invincibleRoundsLeft > 0) {
    log.push(ti('rpg.log.lastStandImmune', lang, { target: target.label, monster: monster.name }));
    return { monsterDiedFromCounter: false };
  }

  const injuryDamageBonus = (INJURY_INCOMING_DAMAGE_BONUS[target.injurySeverity.arm] || 0) + (INJURY_INCOMING_DAMAGE_BONUS[target.injurySeverity.leg] || 0);
  const elementResistMult = (target.accessoryElementDefense === 'all' || target.accessoryElementDefense === monster.element) ? 0.7 : 1;
  const critMult = isCrit ? CRIT_DAMAGE_MULT : 1;
  const monsterDamage = Math.max(1, Math.round(monster.atk * critMult * randRange(0.85, 1.15) * (1 + injuryDamageBonus) * elementResistMult));
  target.hp -= monsterDamage;
  const intro = isCrit ? pickFlavor('monsterCritIntro', MONSTER_CRIT_INTROS, lang) : pickFlavor('monsterHitIntro', MONSTER_HIT_INTROS, lang);
  const critLabel = isCrit ? tLang('rpg.ui.combat.critLabel', lang, ' 💥치명타!') : '';
  log.push(ti('rpg.log.monsterHit', lang, { monster: monster.name, target: target.label, targetObj: target.labelObject, intro, damage: monsterDamage, critLabel }));
  // 흑기사 전용 되살림의 저주(reanimate) - 유저 본인이 죽는 순간 전투당 1회 확정 발동. 본인 포함
  // 이미 죽어있던 파티원 전원을 동시에 부활시키고(부활 체력 비율은 훈련 단계로 결정 -
  // REANIMATE_HP_PCT_BY_TIER), 부활 직후 몇 라운드간 파티 전원이 무적이 됨(last_stand과 같은
  // invincibleRoundsLeft 필드를 공유해서 쓰므로 겹치면 Math.max로 더 긴 쪽이 유지됨)
  if (target.hp <= 0 && target.isSelf && !target.reanimateUsed) {
    const reviveSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_revive' && isSkillUsable(target, s));
    if (reviveSkill) {
      target.reanimateUsed = true;
      const tier = (target.skillLevels && target.skillLevels[reviveSkill.id]) || 1;
      const revivePct = REANIMATE_HP_PCT_BY_TIER[tier] || REANIMATE_HP_PCT_BY_TIER[1];
      party.filter((p) => p.hp <= 0).forEach((p) => { p.hp = Math.round(p.combatStats.maxHp * revivePct); });
      party.filter((p) => p.hp > 0).forEach((p) => { p.invincibleRoundsLeft = Math.max(p.invincibleRoundsLeft || 0, REANIMATE_INVINCIBLE_ROUNDS); });
      log.push(ti('rpg.log.reanimateTrigger', lang, { actor: target.label, actorPoss: target.labelPossessive }));
    }
  }
  // 방패기술의 반격 - 맞은 직후 방패로 쳐내며 즉시 되받아침(자기 atk 기준 배율 데미지)
  let monsterDiedFromCounter = false;
  if (monster.hp > 0 && Math.random() < (combatStats.shieldCounterChance || 0)) {
    const counterDamage = Math.max(1, Math.round(combatStats.atk * (combatStats.shieldCounterDamageMult || 0)));
    monster.hp -= counterDamage;
    log.push(ti('rpg.log.shieldCounter', lang, { target: target.label, monster: monster.name, damage: counterDamage }));
    if (monster.hp <= 0) monsterDiedFromCounter = true;
  }
  if (!monster.statusImmune && monster.poisonChance > 0 && Math.random() < monster.poisonChance) {
    const poisonDamage = Math.round(combatStats.maxHp * 0.05);
    target.hp -= poisonDamage;
    log.push(ti('rpg.log.poisoned', lang, { target: target.label, damage: poisonDamage }));
  }
  // 마법사 전용 방어의 오라(arcane_aura) - 공격을 받으면 확률로 발동(전사 방어태세와 같은 selfDefRounds/
  // selfDefBonus를 재사용) - 이미 걸려있으면 재발동 안 함
  if (target.hp > 0 && !(target.selfDefRounds > 0) && Math.random() < (combatStats.arcaneAuraChance || 0)) {
    target.selfDefRounds = SELF_DEF_BUFF_ROUNDS;
    target.selfDefBonus = SELF_DEF_BUFF_AC_BONUS;
    log.push(ti('rpg.log.arcaneAura', lang, { target: target.label }));
  }
  // 성기사 전용 불굴의 의지(indomitable_will) - 공격을 받으면 확률로 방어력이 한 단계 영구 상승(스택, 전투 내내 유지)
  if (target.hp > 0) {
    const indomitableSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_indomitable_will' && isSkillUsable(target, s));
    if (indomitableSkill && Math.random() < skillEffectivePower(target, indomitableSkill)) {
      target.stackingDefBonus = (target.stackingDefBonus || 0) + INDOMITABLE_WILL_AC_PER_STACK;
      log.push(ti('rpg.log.indomitableWill', lang, { target: target.label, targetPoss: target.labelPossessive }));
    }
  }
  // 흑기사 전용 공포의 오라(dread_aura, HP소모) - 공격을 받으면 확률로 그 몹을 멘탈붕괴시켜 몇 라운드 공격 불가
  if (target.hp > 0) {
    const dreadSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_dread_aura' && isSkillUsable(target, s));
    if (dreadSkill && Math.random() < skillEffectivePower(target, dreadSkill)) {
      spendActorResource(target, dreadSkill, dreadSkill.manaCost);
      // 같은 종류의 스턴이 이미 걸려있으면 더 긴 쪽으로(짧게 덮어쓰지 않음) - fear_strike(공격시 발동)와도 공용
      monster.stunnedRounds = Math.max(monster.stunnedRounds || 0, DREAD_AURA_STUN_ROUNDS);
      log.push(ti('rpg.log.dreadAura', lang, { target: target.label, targetPoss: target.labelPossessive, monster: monster.name }));
    }
  }
  // 위험 수위(체력 25% 이하)에 처음 진입한 순간만 경고 - 매 공격마다 반복하지 않게 1회성 플래그로 관리
  if (!target.lowHpWarned && target.hp > 0 && target.hp / combatStats.maxHp <= DANGER_RETREAT_HP_PCT) {
    target.lowHpWarned = true;
    log.push(ti('rpg.log.lowHpWarning', lang, { target: target.label, targetPoss: target.labelPossessive }));
  }

  // 목숨이 위험하면(체력 25% 이하) 확률 판정 없이 무조건 맨 뒷열로 도망침 - 아래 멘탈 밀림(확률 판정)과는
  // 별개의 확정 발동. 용병/유저 구분 없이 동일 적용. 이미 후열이면(더 물러날 곳이 없음) 아무 일도 없고,
  // 뒤이은 멘탈 밀림 판정도 이미 후열이라 조건(rowIdx < length-1)이 자연히 걸러져 중복 이동은 없음
  if (target.hp > 0 && target.hp / combatStats.maxHp <= DANGER_RETREAT_HP_PCT && target.formationRow !== 'back') {
    target.formationRow = 'back';
    log.push(ti('rpg.log.dangerRetreat', lang, { target: target.label }));
  }

  // 전사 전용 최후의 저항(last_stand) - 체력이 LAST_STAND_HP_TRIGGER_PCT(15%) 이하로 처음 떨어진
  // 순간 전투당 1회만 발동(target.lastStandUsed로 관리). 무적 지속시간은 훈련 단계와 무관하게 항상 고정
  if (target.hp > 0 && !target.lastStandUsed && target.hp / combatStats.maxHp <= LAST_STAND_HP_TRIGGER_PCT) {
    const lastStandSkill = combatStats.classDef.skills.find((s) => s.type === 'passive_last_stand' && isSkillUsable(target, s));
    if (lastStandSkill) {
      target.lastStandUsed = true;
      target.invincibleRoundsLeft = LAST_STAND_INVINCIBLE_ROUNDS;
      log.push(ti('rpg.log.lastStandTrigger', lang, { target: target.label, targetPoss: target.labelPossessive }));
    }
  }

  // 맞으면 멘탈(공포저항)이 낮을수록 한 칸 뒤로 물러날 확률이 있음(전열->중열->후열, 전투 중 일시적,
  // 다음 모험에서는 다시 기본 진형으로 돌아옴). 밀려도 이제 공격 자체는 계속 가능(rowsOut 페널티만
  // 붙음 - performAttack/selectAttackWeapon 참고)이라 근접무기라도 "이번 라운드 통째로 공격 불가"는
  // 더 이상 없음. 그래서 파티원이 혼자여도 밀림 자체는 적용하되, 원거리(활/지팡이)는 밀려봤자 사거리가
  // 위치 무관이라 의미가 없으므로 "혼자 + 근접무기"일 때만 밀림 판정을 함
  const soloParty = party.filter((p) => p.alive).length <= 1;
  const targetMeleeWeapon = !RANGED_WEAPON_TYPES.includes(target.combatStats.weaponType);
  const rowIdx = FORMATION_ROWS.indexOf(target.formationRow);
  // 사기진작(morale_boost)을 받아 멘탈붕괴 면역 중이면 판정 자체를 안 함(tryUtilitySkill 참고)
  if ((!soloParty || targetMeleeWeapon) && typeof target.mentalResist === 'number' && rowIdx >= 0 && rowIdx < FORMATION_ROWS.length - 1 && target.hp > 0 && !(target.mentalImmuneRounds > 0)) {
    // 방패기술의 멘탈붕괴방어 - 방패 자체의 수치만큼 멘탈저항에 그대로 더해짐
    const effectiveMentalResist = Math.min(100, target.mentalResist + partyBuffs.mentalBonus + (combatStats.shieldMentalResistBonus || 0) + (combatStats.weaponMentalResistBonus || 0));
    const breakChance = MORALE_BREAK_BASE_CHANCE * (1 - effectiveMentalResist / 100);
    // 1차 판정 - 맞은 본인이 멘탈이 나가는지
    if (Math.random() < breakChance) {
      const nextRow = FORMATION_ROWS[rowIdx + 1];
      // 그 뒷줄에 다른 파티원이 있으면 "교체" 시도 - 이 사람도 자기 멘탈 판정(2차)을 함. 여기서
      // 내성을 보이면(=버텨내면) 자리를 안 내주는 셈이라 앞사람도 결국 못 밀려남(교체 자체가 취소)
      const swapCandidate = !soloParty ? party.find((p) => p !== target && p.alive && p.hp > 0 && p.formationRow === nextRow) : null;
      let pushed = true;
      if (swapCandidate && typeof swapCandidate.mentalResist === 'number') {
        const swapEffectiveResist = Math.min(100, swapCandidate.mentalResist + partyBuffs.mentalBonus);
        const swapBreakChance = MORALE_BREAK_BASE_CHANCE * (1 - swapEffectiveResist / 100);
        if (!(Math.random() < swapBreakChance)) {
          pushed = false;
          log.push(ti('rpg.log.moraleSwapResisted', lang, { target: target.label, swap: swapCandidate.label }));
        }
      }
      if (pushed) {
        target.formationRow = nextRow;
        target.mentallyBroken = true; // 사기진작(morale_boost)이 나중에 이 표시를 보고 원위치로 되돌림
        if (swapCandidate) {
          swapCandidate.formationRow = FORMATION_ROWS[rowIdx];
          log.push(ti('rpg.log.moralePushedSwap', lang, { target: target.label, swap: swapCandidate.label }));
        } else {
          log.push(ti('rpg.log.moralePushed', lang, { target: target.label }));
        }
        const frontStillHeld = party.some((p) => p.alive && p.hp > 0 && p.formationRow === 'front');
        if (!frontStillHeld) log.push(tLang('rpg.log.frontCollapsed', lang, '⚠️ 전열이 완전히 무너졌다! 몹들이 후열까지 노리기 시작한다...'));
      }
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
      log.push(ti('rpg.log.severeInjuryDirect', lang, { target: target.label, part: bodyPartNameFor(part, lang), turns: turnsLeft }));
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
        ? ti('rpg.log.injuryWorsened', lang, { target: target.label, targetPoss: target.labelPossessive, part: bodyPartNameFor(part, lang), turns: turnsLeft })
        : ti('rpg.log.injuryMinor', lang, { target: target.label, part: bodyPartNameFor(part, lang), turns: turnsLeft }));
    }
  }
  return { monsterDiedFromCounter };
}

// 성기사 감화(conversion)로 회유된 몹이 다른 몹을 때릴 때 쓰는 단순화된 몹-대-몹 공격(파티원 대상 공격처럼
// 부상/멘탈/장비 같은 파티 전용 시스템은 관여하지 않음 - 몹은 그런 상태를 갖지 않음)
function performMonsterVsMonsterAttack({ attacker, defender, log, lang = 'ko' }) {
  const naturalRoll = randInt(1, 20);
  const isCrit = naturalRoll === 20;
  const isFumble = naturalRoll === 1;
  const hit = isCrit || (!isFumble && naturalRoll + attacker.attackBonus >= defender.ac);
  if (!hit) {
    log.push(ti('rpg.log.charmedAttackMiss', lang, { attacker: attacker.name, defender: defender.name }));
    return;
  }
  const critMult = isCrit ? CRIT_DAMAGE_MULT : 1;
  const damage = Math.max(1, Math.round(attacker.atk * critMult * randRange(0.85, 1.15)));
  defender.hp -= damage;
  log.push(ti('rpg.log.charmedAttackHit', lang, { attacker: attacker.name, defender: defender.name, damage }));
}

// 진짜 패시브(되살림/도발/용맹한 결의) - 라운드 시작 시 모든 생존 파티원에 대해 자동으로 판정.
// tryUtilitySkill과 달리 턴을 쓰는 "선택"이 아니라서 우선순위가 없고, 이번 라운드 공격 여부와 무관하게 그냥 발동함
function applyRoundStartPassives({ party, partyBuffs, log, lang = 'ko' }) {
  const alive = party.filter((p) => p.alive && p.hp > 0);
  alive.forEach((actor) => {
    // 성기사 용맹한 결의(valorous_resolve) - 확률로 파티 전체 공격력/방어력이 조금씩 영구 상승(전투 내내 유지, 스택)
    const partyBoostSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'passive_party_boost' && isSkillUsable(actor, s));
    if (partyBoostSkill && Math.random() < skillEffectivePower(actor, partyBoostSkill)) {
      partyBuffs.paladinAtkMult = (partyBuffs.paladinAtkMult || 1) * PALADIN_PARTY_BOOST_ATK_MULT_PER_STACK;
      partyBuffs.paladinDefAcBonus = (partyBuffs.paladinDefAcBonus || 0) + PALADIN_PARTY_BOOST_DEF_AC_PER_STACK;
      log.push(ti('rpg.log.partyBoost', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, partyBoostSkill, lang) }));
    }
    // 전사 도발(taunt) - 확률로 발동, 지속시간 동안 몹의 표적을 자신에게 몰고 방어력이 2배가 됨. 이미 도발 중이면 재발동 안 함
    const tauntSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'passive_taunt' && isSkillUsable(actor, s));
    if (tauntSkill && !(actor.tauntRoundsLeft > 0) && Math.random() < skillEffectivePower(actor, tauntSkill)) {
      spendActorResource(actor, tauntSkill, tauntSkill.manaCost);
      const tier = (actor.skillLevels && actor.skillLevels[tauntSkill.id]) || 1;
      actor.tauntRoundsLeft = TAUNT_ROUNDS_BY_TIER[tier] || TAUNT_ROUNDS_BY_TIER[1];
      log.push(ti('rpg.log.taunt', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, tauntSkill, lang) }));
    }
    // 전 직업 공용 생명력 재생(hp_regen) - 확률 판정 없이 매 라운드 무조건, 훈련 단계만큼 최대체력의 %를 회복
    const hpRegenSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'passive_hp_regen' && isSkillUsable(actor, s));
    if (hpRegenSkill && actor.hp > 0 && actor.hp < actor.combatStats.maxHp) {
      const tier = (actor.skillLevels && actor.skillLevels[hpRegenSkill.id]) || 0;
      const pct = HP_REGEN_PCT_BY_TIER[tier] || 0;
      const healAmount = Math.round(actor.combatStats.maxHp * pct);
      if (healAmount > 0) {
        actor.hp = Math.min(actor.combatStats.maxHp, actor.hp + healAmount);
        log.push(ti('rpg.log.hpRegenTick', lang, { actor: actor.label, actorPoss: actor.labelPossessive, amount: healAmount }));
      }
    }
    // 전 직업 공용 기력 회복(resource_regen) - 마나/스태미나 중 그 직업이 실제로 쓰는 자원만 회복
    const resourceRegenSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'passive_resource_regen' && isSkillUsable(actor, s));
    if (resourceRegenSkill) {
      const tier = (actor.skillLevels && actor.skillLevels[resourceRegenSkill.id]) || 0;
      const pct = RESOURCE_REGEN_PCT_BY_TIER[tier] || 0;
      const resourceKey = actor.combatStats.classDef.resourceType === 'stamina' ? 'stamina' : 'mp';
      const maxKey = resourceKey === 'stamina' ? 'maxStamina' : 'maxMp';
      const regenAmount = Math.round(actor.combatStats[maxKey] * pct);
      if (regenAmount > 0 && actor[resourceKey] < actor.combatStats[maxKey]) {
        actor[resourceKey] = Math.min(actor.combatStats[maxKey], actor[resourceKey] + regenAmount);
        log.push(ti('rpg.log.resourceRegenTick', lang, { actor: actor.label, actorPoss: actor.labelPossessive, amount: regenAmount }));
      }
    }
  });
}

// 공격이 아닌 스킬(치유/저주/파티버프) 사용 시도 - 사용했으면 true를 반환(이번 라운드 이 배우는 공격 안 함).
// 우선순위: 사기진작(멘탈붕괴 면역+복귀, 전투당 1회) > 치유(다친 아군 있을 때) > 저주(몹 미저주 상태) >
// 파티 버프(공격력/방어력, 전투당 1회씩만) - 진짜 패시브(되살림/도발/용맹한 결의)는 턴을 쓰는 이 함수가
// 아니라 매 라운드 자동으로 발동하는 applyRoundStartPassives에서 처리함(우선순위 개념 자체가 없음)
// 성직자 천사의 강림(angelic_descent) - heal/mass_heal 둘 다에서 공유하는 발동 처리(치유 자체가 조건이라
// 확률 판정 없음). 재시전하면 남은 라운드/수치를 그냥 새 값으로 갱신(더 짧아지는 손해를 볼 일이 없음 -
// 애초에 성직자가 힐을 계속 쓸수록 계속 갱신되는 게 자연스러운 컨셉)
function triggerAngelicDescent(actor, partyBuffs, log, lang) {
  const skill = actor.combatStats.classDef.skills.find((s) => s.type === 'passive_angelic_descent' && isSkillUsable(actor, s));
  if (!skill) return;
  const tier = (actor.skillLevels && actor.skillLevels[skill.id]) || 0;
  if (tier <= 0) return;
  partyBuffs.angelicRoundsLeft = ANGELIC_DESCENT_ROUNDS;
  partyBuffs.angelicAtkMult = ANGELIC_DESCENT_ATK_MULT_BY_TIER[tier] || 1;
  partyBuffs.angelicDefAcBonus = ANGELIC_DESCENT_DEF_AC_BONUS_BY_TIER[tier] || 0;
  partyBuffs.angelicHealPct = ANGELIC_DESCENT_HEAL_PCT_BY_TIER[tier] || 0;
  log.push(ti('rpg.log.angelicDescent', lang, { actor: actor.label, actorPoss: actor.labelPossessive }));
}

function tryUtilitySkill({ actor, party, monster, log, partyBuffs, lang = 'ko', healOnly = false }) {
  const alive = party.filter((p) => p.alive && p.hp > 0);

  const mentalSkill = !healOnly && actor.combatStats.classDef.skills.find((s) => s.type === 'buff_mental_party' && isSkillUsable(actor, s));
  if (mentalSkill && partyBuffs.mentalBonus === 0) {
    spendActorResource(actor, mentalSkill, mentalSkill.manaCost);
    partyBuffs.mentalBonus = skillEffectivePower(actor, mentalSkill);
    log.push(ti('rpg.log.mentalCalm', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, mentalSkill, lang) }));
    // 몇 라운드간 파티 전원이 멘탈붕괴 판정 자체를 안 받음(완전 면역) + 이미 멘탈붕괴로 밀려나있던
    // 아군은 즉시 원래 자리로 복귀
    party.filter((p) => p.alive && p.hp > 0).forEach((p) => {
      p.mentalImmuneRounds = MORALE_BOOST_IMMUNE_ROUNDS;
      if (p.mentallyBroken) {
        p.formationRow = p.homeFormationRow;
        p.mentallyBroken = false;
        log.push(ti('rpg.log.moraleRestored', lang, { target: p.label }));
      }
    });
    return true;
  }

  // 광역힐 - 다친 아군이 2명 이상일 때만 단일힐보다 우선(1명뿐이면 아래 단일힐이 더 효율적이라 그쪽으로 넘김)
  const massHealSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'heal_ally_all' && isSkillUsable(actor, s));
  if (massHealSkill) {
    const hurtMany = alive.filter((p) => p.hp / p.combatStats.maxHp < 0.6);
    if (hurtMany.length >= 2) {
      spendActorResource(actor, massHealSkill, massHealSkill.manaCost);
      const healPct = skillEffectivePower(actor, massHealSkill);
      hurtMany.forEach((p) => {
        const healAmount = Math.round(p.combatStats.maxHp * healPct) + Math.round(actor.combatStats.atk * 0.3);
        p.hp = Math.min(p.combatStats.maxHp, p.hp + healAmount);
      });
      log.push(ti('rpg.log.massHeal', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, massHealSkill, lang), count: hurtMany.length }));
      triggerAngelicDescent(actor, partyBuffs, log, lang);
      return true;
    }
  }

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
      log.push(ti('rpg.log.heal', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, healSkill, lang), target: target.label, targetObj: target.labelObject, amount: healAmount }));
      triggerAngelicDescent(actor, partyBuffs, log, lang);
      return true;
    }
  }

  // 용병이 힐 보유 시 무조건 힐 우선(사용자 지시) - 힐이 필요 없어진 뒤에야 아래(저주/버프) 시도로 넘어감.
  // healOnly 모드(용병 전용)에서는 여기서 끝 - 이 아래 저주/버프/자기방어는 본인(isSelf)만 계속 시도함
  if (healOnly) return false;

  const debuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'debuff_monster' && isSkillUsable(actor, s));
  if (debuffSkill && !monster.cursed) {
    spendActorResource(actor, debuffSkill, debuffSkill.manaCost);
    const debuffPower = skillEffectivePower(actor, debuffSkill);
    monster.atk = Math.max(1, Math.round(monster.atk * (1 - debuffPower)));
    monster.def = Math.max(0, Math.round(monster.def * (1 - debuffPower)));
    monster.cursed = true;
    log.push(ti('rpg.log.debuffMonster', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, debuffSkill, lang), monster: monster.name }));
    return true;
  }

  const atkBuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_atk_party' && isSkillUsable(actor, s));
  if (atkBuffSkill && partyBuffs.atkMult === 1) {
    spendActorResource(actor, atkBuffSkill, atkBuffSkill.manaCost);
    partyBuffs.atkMult = skillEffectivePower(actor, atkBuffSkill);
    log.push(ti('rpg.log.atkBuffParty', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, atkBuffSkill, lang) }));
    return true;
  }

  const defBuffSkill = actor.combatStats.classDef.skills.find((s) => s.type === 'buff_def_party' && isSkillUsable(actor, s));
  if (defBuffSkill && partyBuffs.defMult === 1) {
    spendActorResource(actor, defBuffSkill, defBuffSkill.manaCost);
    partyBuffs.defMult = skillEffectivePower(actor, defBuffSkill);
    log.push(ti('rpg.log.defBuffParty', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, defBuffSkill, lang) }));
    return true;
  }

  // 자기 자신만 지키는 방어형 스킬(전사 방어태세/궁수 회피사격) - 힐/저주/파티버프가 없는(또는 다 쓴)
  // 서포트 역할 용병도 뭔가는 하도록 하는 최후의 유틸리티 옵션. 지속시간 동안은 재시전 안 함
  const selfDefSkill = actor.combatStats.classDef.skills.find((s) => (s.type === 'buff_def' || s.type === 'buff_evade') && isSkillUsable(actor, s));
  if (selfDefSkill && !(actor.selfDefRounds > 0)) {
    spendActorResource(actor, selfDefSkill, selfDefSkill.manaCost);
    actor.selfDefRounds = SELF_DEF_BUFF_ROUNDS;
    actor.selfDefBonus = Math.round(SELF_DEF_BUFF_AC_BONUS * skillEffectivePower(actor, selfDefSkill));
    log.push(ti('rpg.log.selfDefBuff', lang, { actor: actor.label, actorPoss: actor.labelPossessive, skill: displaySkillName(actor, selfDefSkill, lang) }));
    return true;
  }

  return false;
}

// 전투 전체(파티 vs 몹 무리 동시 전투) 판정 - 결과만 반환, 아무것도 저장하지 않음.
// character.mercenaries(있다면, 최대 3명)가 자동으로 파티에 합류함. 몹 무리는 순차 처리가 아니라
// 전부 동시에 "살아있는" 상태로 등장하고, 매 라운드 파티원+몹 전원이 속도(AGI/몹 속도) 기준
// 이니셔티브 순서로 한 번씩 행동함(발더스게이트류 개별 행동순서). 파티원 공격은 몹 중 "현재 체력이
// 가장 낮은" 개체를 자동으로 골라 때리고(약한 몹부터 정리), 몹의 반격 대상은 기존과 동일하게
// 전열(front)이 살아있는 한 전열부터 맞음(진형은 "누가 맞아주냐"만 결정, "누가 때리냐"는 무관)
// presetEncounter를 주면(필드 미리보기 화면에서 이미 굴려둔 조우) 새로 굴리지 않고 그대로 사용함 -
// "보이는 몹이 곧 싸울 몹"이 되도록(preview-zone.js가 만들고 adventure.js가 그대로 소비)
export function resolveCombat({ character, zoneId, stance, presetEncounter, lang = 'ko' }) {
  const encounter = presetEncounter || rollEncounter(zoneId, (character.zoneKillCounts || {})[zoneId] || 0);
  const monsters = encounter.monsterIds.map((id) => buildMonsterInstance(id, encounter.zone, encounter.uniqueTier, lang));
  const isUnderleveled = (character.level || 1) < encounter.zone.tier * 3;
  // 몹 하나하나가 내 파티 대비 얼마나 위협적인지(전력비) - 위험한(붉은) 몹일수록 경험치를 더 줌,
  // 너무 쉬운(회색) 몹은 경험치를 아주 조금만 줌(사냥터 미리보기의 몹 이름 색과 같은 기준, monsterDifficultyTier 참고).
  // 몹 무리 전체의 합산 전력치로 계산해서, 같은 종류라도 여러 마리가 몰려나온 조우가 더 위험하게(더 붉게/더 많은 보상으로) 반영됨
  const partyPower = Math.max(1, computePartyPower(character));
  const groupPower = monsters.reduce((sum, m) => sum + monsterPowerScore(m), 0);
  const encounterXpMult = monsterDifficultyTier(groupPower / partyPower).xpMult;

  const party = [
    buildCombatant({ characterLike: { ...character, stance }, isSelf: true, formationRow: effectiveFormationRow(character), ownerCharacter: character, lang }),
    ...(character.mercenaries || []).map((merc) => buildCombatant({
      characterLike: merc, isSelf: false, formationRow: effectiveFormationRow(merc), ownerCharacter: character, lang,
    })),
  ];

  // 마법사/성직자의 파티 버프 - 한 번 발동하면 이 전투(모험) 내내 유지됨(재시전으로 갱신 안 됨, 1회성)
  const partyBuffs = { atkMult: 1, defMult: 1, mentalBonus: 0 };
  const log = [ti('rpg.log.zoneEnter', lang, { zone: getZoneName(zoneId, lang) })];
  monsters.forEach((m) => log.push(ti('rpg.log.monsterAppear', lang, { monster: m.name, rareLabel: m.rare && m.uniqueTier === 1 ? tLang('rpg.ui.combat.rareLabel', lang, '(희귀)') : '' })));
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
    // 전사 도발(taunt) - 지속시간 동안은 몹의 targetPriority 무관하게 무조건 도발한 전사가 표적이 됨
    const taunter = alive.find((p) => p.tauntRoundsLeft > 0);
    if (taunter) return taunter;
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
        log.push(ti('rpg.log.monsterHealSelf', lang, { monster: monster.name, skill: displayMonsterSkillName(monster, skill, lang), amount: healAmount }));
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
        log.push(ti('rpg.log.monsterAoe', lang, { monster: monster.name, skill: displayMonsterSkillName(monster, skill, lang) }));
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
          log.push(ti('rpg.log.monsterSkillMiss', lang, { monster: monster.name, skill: displayMonsterSkillName(monster, skill, lang), target: target.label, miss: pickFlavor('monsterMiss', MONSTER_MISS_LINES, lang) }));
          return true;
        }
        const dmg = Math.max(1, Math.round(monster.atk * (skill.powerMult ?? 1.6) * (isCrit ? CRIT_DAMAGE_MULT : 1) * randRange(0.85, 1.15)));
        target.hp -= dmg;
        log.push(ti('rpg.log.monsterSkillHit', lang, { monster: monster.name, skill: displayMonsterSkillName(monster, skill, lang), target: target.label, targetObj: target.labelObject, damage: dmg, critLabel: isCrit ? tLang('rpg.ui.combat.critLabel', lang, ' 💥치명타!') : '' }));
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
  // 공격 대상 + 어떤 공격스킬(단일/광역)을 쓸지 한 번에 정함 - 모든 직업 공통(스킬 종류가 이제 단일/광역
  // 딱 둘이라 이 로직 하나로 6직업 다 처리됨). 우선순위:
  // 1) 위협 몹 우선 - 몹이 2마리 이상이고 그중 한 마리가 나머지 평균보다 훨씬 세면(THREAT_ATK_MULTIPLIER)
  //    그 몹부터 단일기로 집중공격(광역보다 빨리 위협을 없애는 게 이득)
  // 2) 광역 싹쓸이 기회 - 몹이 2마리 이상이고 그중 2마리 이상이 이번 한 방으로 끝날 만큼 약해졌으면 광역기
  // 3) 기본 규칙 - 몹이 2마리 이상이면 광역, 1마리뿐이면 단일(광역 스플래시는 대상이 하나면 그냥 낭비)
  const chooseAttackPlan = (actor) => {
    const alive = aliveMonsters();
    if (!alive.length) return null;
    const attackSkills = actor.combatStats.classDef.skills.filter((s) => (s.type === 'attack' || s.type === 'attack_all') && isSkillUsable(actor, s));
    const singleSkill = attackSkills.find((s) => s.type === 'attack') || null;
    const aoeSkill = attackSkills.find((s) => s.type === 'attack_all') || null;

    if (alive.length >= 2) {
      const maxAtkMonster = alive.reduce((a, b) => (b.atk > a.atk ? b : a), alive[0]);
      const others = alive.filter((m) => m !== maxAtkMonster);
      const othersAvgAtk = others.reduce((sum, m) => sum + m.atk, 0) / others.length;
      if (maxAtkMonster.atk >= othersAvgAtk * THREAT_ATK_MULTIPLIER) {
        return { target: maxAtkMonster, skill: singleSkill || aoeSkill };
      }
    }

    if (alive.length >= 2 && aoeSkill) {
      const estimatedHit = Math.max(1, Math.round(actor.combatStats.atk * FINISH_HIT_ESTIMATE_MULT));
      const finishable = alive.filter((m) => m.hp <= estimatedHit);
      if (finishable.length >= 2) {
        const primary = finishable.reduce((a, b) => (b.hp < a.hp ? b : a), finishable[0]);
        return { target: primary, skill: aoeSkill };
      }
    }

    const target = pickMonsterByStance(actor.stance);
    const skill = alive.length >= 2 ? (aoeSkill || singleSkill) : (singleSkill || aoeSkill);
    return { target, skill };
  };
  const handleMonsterDeath = (monster) => {
    log.push(ti('rpg.log.monsterDefeated', lang, { monster: monster.name }));
    // 경험치와 골드 둘 다 같은 배율을 씀 - 일부러 저사양 장비로 몹을 상대적으로 위협적이게 만들어
    // 잡으면(전력비가 올라가 몹 이름이 붉게 보임) 보상도 더 커지는 리스크&리턴 구조가 골드에도 그대로 적용됨
    totalXp += Math.round(monster.xp * encounterXpMult);
    totalGold += Math.round(randInt(monster.goldMin, monster.goldMax) * encounterXpMult);
    loot.push(...rollLoot(monster));
    // 직업훈련소 결정 - 몹 종류 무관, 본인 직업에 맞는 결정이 일정 확률로 드랍
    const essenceItemId = CLASS_ESSENCE_ITEM[character.classMain];
    if (essenceItemId && Math.random() < ESSENCE_DROP_CHANCE) {
      loot.push({ itemId: essenceItemId, qty: 1 });
      log.push(ti('rpg.log.essenceObtained', lang, { item: getItemName(essenceItemId, lang) }));
    }
    // 레어/유니크/레전더리몹 전용 - 대장간 강화석이 낮은 확률로 드랍(단계가 높을수록 더 잘 나옴)
    if (monster.rare && Math.random() < RARE_MONSTER_STONE_DROP_CHANCE * (monster.uniqueTier || 1)) {
      loot.push({ itemId: 'enhance_stone', qty: monster.uniqueTier >= 3 ? 2 : 1 });
      log.push(ti('rpg.log.enhanceStoneObtained', lang, { item: getItemName('enhance_stone', lang) }));
    }
    // 그 지역 유니크(2단계)/레전더리(3단계) 몹만 아주 낮은 확률로 세트 아이템 한 짝을 드랍 -
    // 반지/목걸이 중 무작위 하나. 유저간 마켓 거래로 나머지 한 짝을 구해 세트를 맞출 수 있음
    if (monster.uniqueTier >= 2 && Math.random() < SET_ITEM_DROP_CHANCE) {
      const setPieces = ZONE_SET_ITEMS[zoneId];
      if (setPieces) {
        const pieceItemId = setPieces[randInt(0, setPieces.length - 1)];
        loot.push({ itemId: pieceItemId, qty: 1 });
        log.push(ti('rpg.log.setItemObtained', lang, { item: getItemName(pieceItemId, lang) }));
      }
    }
    // 5피스 풀세트(중량방어구/직업별 세트) 조각 - 지역 무관, 아무 유니크/레전더리몹에서나 드랍
    if (monster.uniqueTier >= 2 && Math.random() < FULL_SET_ITEM_DROP_CHANCE) {
      const pieceItemId = ALL_FULL_SET_ITEM_IDS[randInt(0, ALL_FULL_SET_ITEM_IDS.length - 1)];
      loot.push({ itemId: pieceItemId, qty: 1 });
      log.push(ti('rpg.log.setItemObtained', lang, { item: getItemName(pieceItemId, lang) }));
    }
    killedMonsterIds.push(monster.id);
  };

  outer:
  while (aliveMonsters().length) {
    rounds++;
    if (rounds > MAX_ROUNDS_PER_ENCOUNTER) { victory = false; log.push(tLang('rpg.log.tooTired', lang, '너무 지쳐 전투를 중단했다.')); break outer; }
    if (!alivePartyMembers().length) { victory = false; log.push(tLang('rpg.log.partyWiped', lang, '파티가 전멸했다...')); break outer; }
    aliveMonsters().forEach((m) => {
      for (const skillId in m.skillCooldowns) if (m.skillCooldowns[skillId] > 0) m.skillCooldowns[skillId]--;
      // 흑기사 피의 저주(blood_drain) 틱 - 라운드마다 몹 체력을 깎아 시전자에게 옮김
      if (m.drainRoundsLeft > 0) {
        const drainAmount = Math.min(m.hp, m.drainPerRound || 0);
        m.hp -= drainAmount;
        m.drainRoundsLeft--;
        const drainTarget = m.drainTargetActor;
        if (drainTarget && drainTarget.hp > 0) {
          drainTarget.hp = Math.min(drainTarget.combatStats.maxHp, drainTarget.hp + drainAmount);
          log.push(ti('rpg.log.bloodDrainTick', lang, { monster: m.name, target: drainTarget.label, targetObj: drainTarget.labelObject, amount: drainAmount }));
        }
        if (m.hp <= 0) handleMonsterDeath(m);
      }
      if (m.stunnedRounds > 0) m.stunnedRounds--;
      if (m.evasionDebuffRoundsLeft > 0) m.evasionDebuffRoundsLeft--;
      if (m.charmedRoundsLeft > 0) m.charmedRoundsLeft--;
    });
    alivePartyMembers().forEach((p) => {
      if (p.selfDefRounds > 0) p.selfDefRounds--;
      if (p.mentalImmuneRounds > 0) p.mentalImmuneRounds--;
      if (p.tauntRoundsLeft > 0) p.tauntRoundsLeft--;
      if (p.invincibleRoundsLeft > 0) p.invincibleRoundsLeft--;
    });
    // 성직자 천사의 강림 - 지속시간 동안 매 라운드 파티 전원 소량 회복, 라운드 소진되면 ATK/DEF 보너스도 함께 소멸
    if ((partyBuffs.angelicRoundsLeft || 0) > 0) {
      alivePartyMembers().forEach((p) => {
        const healAmount = Math.round(p.combatStats.maxHp * (partyBuffs.angelicHealPct || 0));
        if (healAmount > 0) p.hp = Math.min(p.combatStats.maxHp, p.hp + healAmount);
      });
      partyBuffs.angelicRoundsLeft--;
    }
    applyRoundStartPassives({ party, partyBuffs, log, lang });

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

        const plan = chooseAttackPlan(actor);
        if (!plan || !plan.target) continue;
        const target = plan.target;
        // 유저 본인은 항상 유틸 스킬(힐/저주/버프)을 전부 시도. 용병은 역할 구분 없이 힐 스킬을
        // 보유했으면 아군이 다쳤을 때 무조건 힐을 최우선으로 시도(healOnly) - 힐이 필요 없으면
        // 바로 아래로 넘어가 stance(공격 대상 우선순위)대로 공격함
        const usedUtility = actor.isSelf
          ? tryUtilitySkill({ actor, party, monster: target, log, partyBuffs, lang })
          : tryUtilitySkill({ actor, party, monster: target, log, partyBuffs, lang, healOnly: true });
        if (usedUtility) continue;

        const otherMonsters = monsters.filter((m) => m !== target);
        const result = performAttack({ actor, monster: target, otherMonsters, log, isUnderleveled, partyBuffs, party, chosenSkill: plan.skill, lang });
        if (result.isKiting) anyKiting = true;
        if (result.monsterDied) handleMonsterDeath(target);
        // 마법사 연쇄 마력탄 스플래시로 죽은 몹들(주 타겟과 별개)도 각각 정산
        (result.splashDefeated || []).forEach((m) => { if (m.hp <= 0) handleMonsterDeath(m); });
      } else {
        const monster = entry.ref;
        if (monster.hp <= 0) continue;
        // 흑기사 공포의 오라(dread_aura)로 멘탈붕괴된 몹은 이번 라운드 행동 불가
        if (monster.stunnedRounds > 0) {
          log.push(ti('rpg.log.monsterStunned', lang, { monster: monster.name }));
          continue;
        }
        // 성기사 감화(conversion)로 회유된 몹은 파티 대신 다른 몹을 공격함(다른 몹이 없으면 이번 턴은 그냥 넘어감 -
        // 회유가 풀릴 때까지 파티를 공격하지 않는 게 이 스킬의 핵심이라 공격 대상이 없다고 원래대로 되돌리지 않음)
        if (monster.charmedRoundsLeft > 0) {
          const allies = aliveMonsters().filter((m) => m !== monster);
          if (allies.length) {
            const victim = allies[randInt(0, allies.length - 1)];
            performMonsterVsMonsterAttack({ attacker: monster, defender: victim, log, lang });
            if (victim.hp <= 0) handleMonsterDeath(victim);
          } else {
            log.push(ti('rpg.log.charmedIdle', lang, { monster: monster.name }));
          }
          continue;
        }
        // 화살로 카이팅 중이고 비원거리 몹이면 이 몹의 반격은 무효
        if (anyKiting && !monster.ranged) {
          log.push(ti('rpg.log.kitingBlock', lang, { monster: monster.name }));
          continue;
        }
        if (tryMonsterSkill(monster)) continue;
        const target = pickMonsterTarget(monster);
        if (target) {
          const counterResult = performMonsterAttack({ monster, target, log, isUnderleveled, affinityFromLastHit: null, partyBuffs, party, lang });
          if (counterResult && counterResult.monsterDiedFromCounter) handleMonsterDeath(monster);
        }
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
      id: actor.id, newInjuries: actor.newInjuries,
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
    newInjuries: selfCombatant.newInjuries,
    mercenaries: mercResults,
  };
}
