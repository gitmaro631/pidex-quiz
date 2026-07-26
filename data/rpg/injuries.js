// 마을 의사 치료비 공식 - api/_rpg/cure-injury.js(실제 차감)와 page-rpg.js(표시)가 공유
export const CURE_COST_PER_TURN = 3;
export const CURE_SEVERITY_COST_MULT = { 1: 1, 2: 2 };

export function computeCureCost(injury) {
  return Math.max(5, Math.ceil(injury.turnsLeft * CURE_COST_PER_TURN * (CURE_SEVERITY_COST_MULT[injury.severity] || 1)));
}

// 골드 대신 턴포인트를 써서 쉬며 치료하는 방식(rest-heal.js) - 경상은 적게, 중상은 많이 소모
export const REST_HEAL_TURN_COST_BY_SEVERITY = { 1: 2, 2: 5 };
