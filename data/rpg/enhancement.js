// 대장간 강화 - 유니크(레어)몹을 잡으면 낮은 확률로 강화석이 드랍됨. 강화석+골드로 장착 중인
// 무기(공격력)/방어구(방어력)를 단계별로 강화. 단계가 오를수록 필요량이 늘어남.
// 내구도와 같은 v1 단순화 원칙 적용 - 다른 아이템으로 갈아끼우면 강화 단계는 초기화됨(장비 자체가
// "그 순간의 무기/방어구"를 나타낼 뿐 개별 인스턴스를 추적하지 않는 기존 설계와 동일)
export const MAX_ENHANCE_LEVEL = 10;
export const ENHANCE_ATK_PER_LEVEL = 2; // 무기 강화 1단계당 공격력 +2
export const ENHANCE_DEF_PER_LEVEL = 1; // 방어구 강화 1단계당 방어력 +1
export const RARE_MONSTER_STONE_DROP_CHANCE = 0.12; // 유니크(레어)몹 처치시 강화석 드랍 확률

// 단계별(1~10) 필요 강화석/골드 - 갈수록 가파르게 증가
export const ENHANCE_LEVEL_COSTS = {
  1: { stones: 2, gold: 80 },
  2: { stones: 3, gold: 150 },
  3: { stones: 4, gold: 250 },
  4: { stones: 6, gold: 400 },
  5: { stones: 8, gold: 600 },
  6: { stones: 10, gold: 900 },
  7: { stones: 13, gold: 1300 },
  8: { stones: 16, gold: 1800 },
  9: { stones: 20, gold: 2500 },
  10: { stones: 25, gold: 3500 },
};

// 수리는 기본적으로 대장간(NPC)에서만 가능 - 셀프 수리를 하려면 수리스킬을 배우고 그 아이템 등급까지
// 단계를 올려야 하고, 수리 망치(소모품)도 있어야 함. 대장간 수리는 스킬/망치 없이 항상 가능(등급별
// 비용은 repair-equipment.js의 REPAIR_COST_PER_POINT_BY_RARITY 그대로 재사용)
export const MAX_REPAIR_SKILL_LEVEL = 4;
export const REPAIR_SKILL_COSTS = { 1: 150, 2: 400, 3: 900, 4: 1800 }; // 골드만 필요(결정 불필요)
// 수리스킬 단계별로 셀프 수리 가능한 최고 등급
export const REPAIR_SKILL_RARITY_CAP = { 1: 'uncommon', 2: 'rare', 3: 'epic', 4: 'legendary' };
const RARITY_ORDER = ['normal', 'uncommon', 'rare', 'epic', 'legendary'];
export function rarityAllowedBySkill(rarity, skillLevel) {
  if (skillLevel <= 0) return false;
  const cap = REPAIR_SKILL_RARITY_CAP[skillLevel] || 'normal';
  return RARITY_ORDER.indexOf(rarity) <= RARITY_ORDER.indexOf(cap);
}
