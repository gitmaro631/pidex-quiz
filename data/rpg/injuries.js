// 마을 의사 치료비 공식 - api/_rpg/cure-injury.js(실제 차감)와 page-rpg.js(표시)가 공유
export const CURE_COST_PER_TURN = 3;
export const CURE_SEVERITY_COST_MULT = { 1: 1, 2: 2 };

export function computeCureCost(injury) {
  return Math.max(5, Math.ceil(injury.turnsLeft * CURE_COST_PER_TURN * (CURE_SEVERITY_COST_MULT[injury.severity] || 1)));
}

// 골드 대신 턴포인트를 써서 쉬며 치료하는 방식(rest-heal.js) - 경상은 적게, 중상은 많이 소모
export const REST_HEAL_TURN_COST_BY_SEVERITY = { 1: 2, 2: 5 };

// 순수 체력(HP) 회복 - 부상(injury)과는 별개로, 전투로 깎인 HP 자체를 쉬면서 채움(포션 없이 무료,
// 골드 대신 턴 소모). 최대체력 100% 회복 기준 턴수 - 중상(5턴)보다 적게 들도록 낮게 잡음
export const HP_REST_HEAL_FULL_TURNS = 3;
