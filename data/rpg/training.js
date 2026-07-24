// 직업훈련소 - 각 직업 스킬은 처음엔 미습득 상태라 전투에서 안 나가고, 훈련소에서 결정+골드로
// 배우거나(1단계) 단계를 올려야(2~3단계) 위력이 세짐. 결정은 몹을 잡으면 내 직업에 맞는 게 일정
// 확률로 드랍됨(몹 종류 무관 - 내 직업 기준으로만 결정됨, rpg-combat.js의 ESSENCE_DROP_CHANCE 참고)
export const CLASS_ESSENCE_ITEM = {
  warrior: 'essence_strength',
  archer: 'essence_agility',
  mage: 'essence_arcane',
  priest: 'essence_holy',
};

export const MAX_SKILL_TIER = 3;

// 단계가 오를수록(1->2->3) 필요한 결정/골드가 늘어남. index 0은 안 씀(1단계부터 시작)
export const TRAINING_TIER_COSTS = {
  1: { essence: 3, gold: 100 },
  2: { essence: 6, gold: 250 },
  3: { essence: 10, gold: 500 },
};

// 스킬 위력에 곱해지는 단계별 배율
export const TIER_POWER_MULT = { 1: 1.0, 2: 1.15, 3: 1.3 };
