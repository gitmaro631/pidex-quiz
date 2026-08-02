// 영지 시설 레벨 계산 - TERRITORY_JOBS(mercenaries.js)의 각 일자리가 곧 시설이기도 함.
// 용병을 그 일자리에 배치한 누적 "영지일"(rpg-territory.js 참고 - 턴포인트 소모 기반, 실시간 아님)이
// 쌓일수록 레벨이 오르고, 레벨마다 영구 전역 보너스가 붙음(골드/공격력/방어력/식량생산).
// 의도적으로 천천히 오르도록 설계 - 단기 수입이 아니라 장기 성장 목표.
import { TERRITORY_JOBS } from './mercenaries.js';

// 레벨 1개 올리는 데 필요한 "구간당" 배치 영지일 - 레벨5 용병 1명 상주 기준
// (예전엔 7이었는데, 저레벨 캐릭터의 영지 근무 기여도가 낮은 것과 겹쳐 초반 첫 레벨업에만 턴 수백~수천개가
// 필요했다는 피드백으로 5로 낮춤 - work-territory.js의 레벨 하한 조정과 함께 적용)
export const FACILITY_DAYS_PER_LEVEL = 5;
// 레벨이 오를수록 요구 영지일이 배율로 불어남(지수 성장) - 예전엔 레벨에 비례해서만 늘었는데(삼각수),
// 그 정도로는 무한정 업그레이드가 결국 감당 가능한 범위였음. 이제는 한 레벨 한 레벨이 기하급수적으로
// 비싸져서, 상한을 따로 두지 않아도 실제로 도달 가능한 레벨이 사실상 자연스럽게 막힘(무적화 방지).
// 1.25였다가 초반 체감 난이도가 너무 과하다는 피드백으로 1.15로 완화
export const FACILITY_LEVEL_GROWTH = 1.15;
// 용병 레벨이 시설 성장 속도에 그대로 비례함(레벨5=1배 기준) - 레벨10 용병은 레벨1 용병보다 10배 빠르게 적립
export const BASELINE_MERC_LEVEL = 5;
export const MAX_MERCS_PER_FACILITY = 3; // 한 시설(일자리)에 동시에 배치 가능한 용병 수 제한

// 레벨 L에서 L+1로 가는 데 필요한 "그 구간만"의 영지일 - 지수 성장(FACILITY_LEVEL_GROWTH^L)
function daysForLevelStep(level) {
  return FACILITY_DAYS_PER_LEVEL * Math.pow(FACILITY_LEVEL_GROWTH, level);
}

// 누적 영지일(days)로 현재 레벨을 계산 - 레벨이 오를수록 한 구간의 요구치 자체가 기하급수적으로
// 커져서(daysForLevelStep 참고), 무한정 업그레이드는 이론상 가능해도 실제로는 자연히 막힘
export function facilityLevelForDays(days) {
  let level = 0;
  let required = 0;
  while (true) {
    required += daysForLevelStep(level);
    if (days < required) break;
    level++;
  }
  return level;
}

// 현재 레벨 + 다음 레벨까지 남은 진행률(표시용)
export function facilityProgress(days) {
  const level = facilityLevelForDays(days);
  let requiredSoFar = 0;
  for (let l = 0; l < level; l++) requiredSoFar += daysForLevelStep(l);
  const daysForNextLevel = daysForLevelStep(level);
  return { level, daysIntoLevel: days - requiredSoFar, daysForNextLevel };
}

// jobId(clearing/training/ramparts/hospital/morale/sanctum/basics) 시설의 현재 레벨에 따른 배율(1.0 = 보너스 없음)
export function facilityBonusMultiplier(character, jobId) {
  const job = TERRITORY_JOBS[jobId];
  if (!job) return 1;
  const level = ((character && character.facilityLevels) || {})[jobId] || 0;
  return 1 + (job.bonusPctPerLevel * level) / 100;
}

// 병원 시설 전용 - 다른 시설과 달리 "보너스"가 아니라 치료 비용/시간을 깎아주는 배율(최대 80% 감소)
export function hospitalCostMultiplier(character) {
  const level = ((character && character.facilityLevels) || {}).hospital || 0;
  return Math.max(0.2, 1 - (TERRITORY_JOBS.hospital.bonusPctPerLevel * level) / 100);
}

// 사기진작소 전용 - %배율이 아니라 멘탈저항(mentalResist, 0~100)에 고정치로 더해지는 보너스.
// 본인 전투에서 전열이 공격당했을 때 공포로 후열로 밀려날 확률을 낮추는 데 쓰임(rpg-combat.js 참고)
export function moraleResistBonus(character) {
  const level = ((character && character.facilityLevels) || {}).morale || 0;
  return TERRITORY_JOBS.morale.bonusPctPerLevel * level;
}

// 연무장 전용 - 기본공격(improvisedAttack)의 위력 배율 + 명중굴림 보정치. 명중은 D&D식 소수치라
// 위력%의 절반만 반영(레벨10=위력+40%, 명중+5 정도로 완만하게)
export function improvisedAttackBonus(character) {
  const level = ((character && character.facilityLevels) || {}).basics || 0;
  const pct = TERRITORY_JOBS.basics.bonusPctPerLevel * level;
  return { powerMult: 1 + pct / 100, accuracyBonus: Math.round(pct / 2) };
}

// 공방 전용 - 병원처럼 "보너스"가 아니라 장비 마모 확률을 깎아주는 배율(최대 30% 감소).
// api/_rpg/adventure.js의 wearChance에 곱해서 씀 - 용병 본인 장비는 애초에 안 닳으므로 해당 없음
const WORKSHOP_WEAR_REDUCTION_CAP_PCT = 30;
export function durabilityWearReductionMultiplier(character) {
  const level = ((character && character.facilityLevels) || {}).workshop || 0;
  const reductionPct = Math.min(WORKSHOP_WEAR_REDUCTION_CAP_PCT, TERRITORY_JOBS.workshop.bonusPctPerLevel * level);
  return 1 - reductionPct / 100;
}
