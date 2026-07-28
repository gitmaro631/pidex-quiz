// 영지 시설 레벨 계산 - TERRITORY_JOBS(mercenaries.js)의 각 일자리가 곧 시설이기도 함.
// 용병을 그 일자리에 배치한 누적 "영지일"(rpg-territory.js 참고 - 턴포인트 소모 기반, 실시간 아님)이
// 쌓일수록 레벨이 오르고, 레벨마다 영구 전역 보너스가 붙음(골드/공격력/방어력/식량생산).
// 의도적으로 천천히 오르도록 설계 - 단기 수입이 아니라 장기 성장 목표.
import { TERRITORY_JOBS, MERCENARY_TEMPLATES, SPECIALTY_BONUS_MULT } from './mercenaries.js';

// 레벨 1개 올리는 데 필요한 "구간당" 배치 영지일 - 레벨5 용병 1명 상주 기준
export const FACILITY_DAYS_PER_LEVEL = 7;
// 레벨이 오를수록 요구 영지일이 배율로 불어남(지수 성장) - 예전엔 레벨에 비례해서만 늘었는데(삼각수),
// 그 정도로는 무한정 업그레이드가 결국 감당 가능한 범위였음. 이제는 한 레벨 한 레벨이 기하급수적으로
// 비싸져서, 상한을 따로 두지 않아도 실제로 도달 가능한 레벨이 사실상 자연스럽게 막힘(무적화 방지) -
// 레벨30이면 대략 FACILITY_DAYS_PER_LEVEL의 800배 넘는 영지일이 필요해짐
export const FACILITY_LEVEL_GROWTH = 1.25;
// 용병 레벨이 시설 성장 속도에 그대로 비례함(레벨5=1배 기준) - 레벨10 용병은 레벨1 용병보다 10배 빠르게 적립
export const BASELINE_MERC_LEVEL = 5;
export const MAX_MERCS_PER_FACILITY = 3; // 한 시설(일자리)에 동시에 배치 가능한 용병 수 제한

// 한 시설에 배치된 용병들의 "영지일 적립 속도" - 레벨/기준레벨 배율의 합(레벨이 높을수록 빠르게 적립).
// jobId를 주면 그 용병의 territorySpecialty가 이 시설과 일치할 때 SPECIALTY_BONUS_MULT(50%)를 추가로 곱함
export function facilityAccrualRate(assignedMercs, jobId) {
  return assignedMercs.reduce((sum, m) => {
    const template = MERCENARY_TEMPLATES[m.templateId];
    const specialtyMult = (jobId && template && template.territorySpecialty === jobId) ? SPECIALTY_BONUS_MULT : 1;
    return sum + ((m.level || 1) / BASELINE_MERC_LEVEL) * specialtyMult;
  }, 0);
}

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

// jobId(clearing/training/ramparts/farm) 시설의 현재 레벨에 따른 배율(1.0 = 보너스 없음)
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
