// 순수 계산 모듈(입출력 없음) — rpg-combat.js와 같은 패턴. 영지 경제(골드)와 영지배치 용병
// 개인효과(훈련소/병원/사기진작소/방벽/연공실/연무장)를 "영지일" 단위로 정산한다. 영지일은 실시간이
// 아니라 플레이어가 턴포인트를 "그 레벨의 턴 상한만큼" 소모할 때마다 하루씩 지나가는 것으로 정의됨
// (레벨이 오르면 턴 상한도 오르므로 하루가 점점 길어져 상대적으로 여유가 생기는 구조) -
// api/_rpg/adventure.js가 매 모험마다 이 결과를 트랜잭션 안에서 반영.
import { turnCapForLevel } from './api/_rpgTurns.js';
import { TERRITORY_JOBS } from './data/rpg/mercenaries.js';
import { facilityBonusMultiplier } from './data/rpg/facilities.js';
import { computeCharacterCombatStats } from './rpg-combat.js';
import { applyXpGain } from './rpg-progression.js';

// 지금까지 쓴 누적 턴(totalTurnsSpent)과 현재 레벨의 턴 상한으로 "지금까지 지난 영지일 수"를 계산
export function territoryDaysElapsed(totalTurnsSpent, level) {
  return Math.floor((totalTurnsSpent || 0) / turnCapForLevel(level));
}

// 영지 일자리별로 그 일자리에 배치된 용병 "개인"에게 붙는 효과(시설 레벨/경제와는 별개) -
// 훈련소=경험치(본인 레벨 초과 불가), 병원=체력회복+부상치료 가속, 사기진작소=멘탈저항 영구 소량 상승,
// 방벽=방어력 영구 소량 상승, 연공실=최대 마나/스테미나 % 영구 소량 상승, 연무장=회피율 영구 소량 상승
// (전부 상한 있음, rpg-combat.js의 computeCharacterCombatStats가 이 필드들을 읽어 실제 전투 스탯에 반영)
export const TRAINING_XP_PER_DAY_PER_LEVEL = 15; // 용병 레벨 1당 영지 1일에 이만큼 경험치 획득
export const HOSPITAL_HP_HEAL_PCT_PER_DAY = 0.2; // 영지 1일에 최대체력의 이 비율만큼 회복
export const HOSPITAL_INJURY_TURNS_HEALED_PER_DAY = 3; // 영지 1일에 부상 남은턴을 이만큼 앞당김
export const MORALE_RESIST_GAIN_PER_DAY = 0.4; // 영지 1일에 멘탈저항 영구 보너스 이만큼 증가
export const MORALE_RESIST_GAIN_CAP = 20; // 사기진작소로 얻는 개인 멘탈저항 보너스 상한
// 밸런스 파괴 방지 - 전부 상승폭/상한을 보수적으로 낮게 잡음(턴을 어떤 형태로든 소모할 때마다
// 영지일이 지나면서 조금씩 쌓이는 구조라, 낮은 수치라도 장기적으로는 의미 있게 누적됨)
export const RAMPARTS_DEF_GAIN_PER_DAY = 0.2; // 영지 1일에 방어력 영구 보너스 이만큼 증가
export const RAMPARTS_DEF_GAIN_CAP = 10; // 방벽으로 얻는 개인 방어력 보너스 상한
export const SANCTUM_RESOURCE_GAIN_PCT_PER_DAY = 0.2; // 영지 1일에 최대 마나/스테미나 % 보너스 이만큼 증가
export const SANCTUM_RESOURCE_GAIN_PCT_CAP = 10; // 연공실로 얻는 개인 마나/스테미나 % 보너스 상한
// 이 개인효과는 용병 전용(applyMercTerritoryJobEffect가 character.mercenaries만 처리함 - 플레이어 본인은
// 해당 없음). 용병 궁수 기준 회피 스킬 만렙(5%)과 합치면 최대 8%가 되게 상한을 3%로 낮춤(5%+3%=8%).
// 40일 만에 상한 도달하는 기존 램프 속도는 유지(0.03/40=0.00075)
export const BASICS_EVASION_GAIN_PER_DAY = 0.00075; // 영지 1일에 회피율(0~1) 이만큼 증가
export const BASICS_EVASION_GAIN_CAP = 0.03; // 연무장으로 얻는 개인 회피율 보너스 상한(3%)

// 용병 한 명에게 그 일자리 효과를 daysToProcess만큼 적용한 새 상태를 반환 - 전투동행(active) 중이거나
// 입원(hospitalized) 중이면 대상이 아니라 그대로 반환
export function applyMercTerritoryJobEffect(merc, daysToProcess, playerLevel) {
  if (merc.assignment !== 'territory' || merc.hospitalized || daysToProcess <= 0) return merc;

  if (merc.job === 'training') {
    const cap = Math.max(1, playerLevel || 1);
    if ((merc.level || 1) >= cap) return merc;
    const xpGain = Math.round((merc.level || 1) * TRAINING_XP_PER_DAY_PER_LEVEL * daysToProcess);
    if (xpGain <= 0) return merc;
    const progression = applyXpGain(merc, xpGain);
    // 유저 본인 레벨을 넘으면 그 시점에서 멈춤(경험치도 0으로) - adventure.js의 전투 레벨업 캡과 동일 원칙
    if (progression.level >= cap) return { ...merc, level: cap, xp: 0, statPoints: progression.statPoints };
    return { ...merc, level: progression.level, xp: progression.xp, statPoints: progression.statPoints };
  }

  if (merc.job === 'hospital') {
    const stats = computeCharacterCombatStats(merc);
    const currentHp = Math.min(stats.maxHp, Math.round((merc.currentHp ?? stats.maxHp) + stats.maxHp * HOSPITAL_HP_HEAL_PCT_PER_DAY * daysToProcess));
    const healTurns = Math.round(HOSPITAL_INJURY_TURNS_HEALED_PER_DAY * daysToProcess);
    const prevInjuries = merc.injuries || {};
    const injuries = {};
    for (const part of ['arm', 'leg']) {
      const prev = prevInjuries[part] || { severity: 0, turnsLeft: 0 };
      if (prev.severity > 0 && healTurns > 0) {
        const turnsLeft = Math.max(0, prev.turnsLeft - healTurns);
        injuries[part] = turnsLeft > 0 ? { severity: prev.severity, turnsLeft } : { severity: 0, turnsLeft: 0 };
      } else {
        injuries[part] = prev;
      }
    }
    return { ...merc, currentHp, injuries };
  }

  if (merc.job === 'morale') {
    const moraleTrainingBonus = Math.min(MORALE_RESIST_GAIN_CAP, (merc.moraleTrainingBonus || 0) + MORALE_RESIST_GAIN_PER_DAY * daysToProcess);
    return { ...merc, moraleTrainingBonus };
  }

  if (merc.job === 'ramparts') {
    const rampartsDefBonus = Math.min(RAMPARTS_DEF_GAIN_CAP, (merc.rampartsDefBonus || 0) + RAMPARTS_DEF_GAIN_PER_DAY * daysToProcess);
    return { ...merc, rampartsDefBonus };
  }

  if (merc.job === 'sanctum') {
    const sanctumResourceBonusPct = Math.min(SANCTUM_RESOURCE_GAIN_PCT_CAP, (merc.sanctumResourceBonusPct || 0) + SANCTUM_RESOURCE_GAIN_PCT_PER_DAY * daysToProcess);
    return { ...merc, sanctumResourceBonusPct };
  }

  if (merc.job === 'basics') {
    const basicsEvasionBonus = Math.min(BASICS_EVASION_GAIN_CAP, (merc.basicsEvasionBonus || 0) + BASICS_EVASION_GAIN_PER_DAY * daysToProcess);
    return { ...merc, basicsEvasionBonus };
  }

  return merc;
}

// daysToProcess(영지일 수)만큼 영지 경제를 정산 - character를 변형하지 않고 다음 상태만 반환.
// daysToProcess가 0 이하면 null(정산할 게 없음). playerLevel은 훈련소 배치 용병의 레벨 상한 기준으로만
// 쓰임(생략하면 character.level 그대로 사용 - 전투 중 이번 모험으로 레벨업했다면 호출부가 그 최신 레벨을 넘겨줌)
export function settleTerritoryDays(character, daysToProcess, playerLevel = character.level || 1) {
  if (daysToProcess <= 0) return null;

  const workingMercs = (character.mercenaries || []).filter((m) => m.assignment === 'territory' && !m.hospitalized);
  const clearingWorkers = workingMercs.filter((m) => m.job === 'clearing');

  // 1) 시설 레벨업은 이제 플레이어 본인이 work-territory.js로 직접 일할 때만 발생함 - 용병을
  // 영지 일자리에 배치해도 더 이상 시설 누적 영지일(facilityDays)에 기여하지 않음(레벨업 감지도 안 함).
  // 그대로 유지되는 값만 넘겨줌(감소/변경 없음)
  const nextFacilityDays = { ...(character.facilityDays || {}) };
  const nextFacilityLevels = { ...(character.facilityLevels || {}) };
  const leveledUp = [];

  // 2) 개간지 골드 산출(인원수 기준, 시설레벨 보너스 적용) - 용병 상주 급여는 없음(고용비는 선술집에서
  // 고용할 때 한 번만 냄)
  const goldIncome = Math.floor(clearingWorkers.length * TERRITORY_JOBS.clearing.goldPerDay * daysToProcess
    * facilityBonusMultiplier({ facilityLevels: nextFacilityLevels }, 'clearing'));

  const goldDelta = goldIncome;

  // 훈련소/병원/사기진작소/방벽/연공실/연무장 배치 용병 개인 효과(applyMercTerritoryJobEffect 참고) -
  // 개간지는 경제 활동(골드)만 하고 개인 스탯 효과는 없음, 해당 없는 용병은 그대로 통과
  const nextMercenaries = (character.mercenaries || []).map((m) => applyMercTerritoryJobEffect(m, daysToProcess, playerLevel));

  return {
    daysProcessed: daysToProcess,
    nextFacilityDays, nextFacilityLevels,
    goldIncome, goldDelta,
    leveledUp, nextMercenaries,
  };
}
