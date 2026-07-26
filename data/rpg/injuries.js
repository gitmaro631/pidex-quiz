// 마을 의사 치료비 공식 - api/_rpg/cure-injury.js(실제 차감)와 page-rpg.js(표시)가 공유
export const CURE_COST_PER_TURN = 3;
export const CURE_SEVERITY_COST_MULT = { 1: 1, 2: 2 };

export function computeCureCost(injury) {
  return Math.max(5, Math.ceil(injury.turnsLeft * CURE_COST_PER_TURN * (CURE_SEVERITY_COST_MULT[injury.severity] || 1)));
}
