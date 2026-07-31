// 순수 계산 모듈(입출력 없음) — rpg-combat.js와 같은 패턴. 영지 경제(시설 레벨/식량/골드/용병 급여)를
// "영지일" 단위로 정산한다. 영지일은 실시간이 아니라 플레이어가 턴포인트를 "그 레벨의 턴 상한만큼"
// 소모할 때마다 하루씩 지나가는 것으로 정의됨(레벨이 오르면 턴 상한도 오르므로 하루가 점점 길어져
// 상대적으로 여유가 생기는 구조) - api/_rpg/adventure.js가 매 모험마다 이 결과를 트랜잭션 안에서 반영.
import { turnCapForLevel } from './api/_rpgTurns.js';
import {
  TERRITORY_JOBS, FOOD_PER_DAY_PER_FARMER, FOOD_CONSUMPTION_PER_DAY_PER_WORKER,
  GOLD_PER_MISSING_FOOD, WAGE_PER_MERC_PER_DAY,
} from './data/rpg/mercenaries.js';
import { facilityBonusMultiplier, facilityAccrualRate } from './data/rpg/facilities.js';

// 지금까지 쓴 누적 턴(totalTurnsSpent)과 현재 레벨의 턴 상한으로 "지금까지 지난 영지일 수"를 계산
export function territoryDaysElapsed(totalTurnsSpent, level) {
  return Math.floor((totalTurnsSpent || 0) / turnCapForLevel(level));
}

// daysToProcess(영지일 수)만큼 영지 경제를 정산 - character를 변형하지 않고 다음 상태만 반환.
// daysToProcess가 0 이하면 null(정산할 게 없음)
export function settleTerritoryDays(character, daysToProcess) {
  if (daysToProcess <= 0) return null;

  const workingMercs = (character.mercenaries || []).filter((m) => m.assignment === 'territory' && !m.hospitalized);
  const farmWorkers = workingMercs.filter((m) => m.job === 'farm');
  const otherWorkers = workingMercs.filter((m) => m.job !== 'farm');
  const clearingWorkers = workingMercs.filter((m) => m.job === 'clearing');

  // 1) 농장 - 식량 생산은 항상 그대로 적립됨(다른 시설 사정과 무관)
  const farmProduced = facilityAccrualRate(farmWorkers, 'farm') * FOOD_PER_DAY_PER_FARMER * daysToProcess
    * facilityBonusMultiplier(character, 'farm');
  const foodAfterProduction = (character.foodStock || 0) + farmProduced;

  // 2) 농장 외 근무자의 식량 소비 - 재고로 부족하면 부족분을 골드로 대신 지출(비상 식량 구매)
  const neededFood = otherWorkers.length * FOOD_CONSUMPTION_PER_DAY_PER_WORKER * daysToProcess;
  const consumedFromStock = Math.min(foodAfterProduction, neededFood);
  const foodDeficit = Math.max(0, neededFood - foodAfterProduction);
  const foodEmergencyCost = Math.round(foodDeficit * GOLD_PER_MISSING_FOOD);
  const nextFoodStock = Math.round((foodAfterProduction - consumedFromStock) * 10) / 10;

  // 3) 시설 레벨업은 이제 플레이어 본인이 work-territory.js로 직접 일할 때만 발생함 - 용병을
  // 영지 일자리에 배치해도 더 이상 시설 누적 영지일(facilityDays)에 기여하지 않음(레벨업 감지도 안 함).
  // 그대로 유지되는 값만 넘겨줌(감소/변경 없음)
  const nextFacilityDays = { ...(character.facilityDays || {}) };
  const nextFacilityLevels = { ...(character.facilityLevels || {}) };
  const leveledUp = [];

  // 4) 개간지 골드 산출(인원수 기준, 시설레벨 보너스 적용) - 5) 용병 상주 급여(전원, 일자리 무관)
  const goldIncome = Math.floor(clearingWorkers.length * TERRITORY_JOBS.clearing.goldPerDay * daysToProcess
    * facilityBonusMultiplier({ facilityLevels: nextFacilityLevels }, 'clearing'));
  const wagePaid = Math.round(workingMercs.length * WAGE_PER_MERC_PER_DAY * daysToProcess);

  const goldDelta = goldIncome - wagePaid - foodEmergencyCost;

  return {
    daysProcessed: daysToProcess,
    nextFacilityDays, nextFacilityLevels, nextFoodStock,
    goldIncome, wagePaid, foodEmergencyCost, goldDelta,
    leveledUp,
  };
}
