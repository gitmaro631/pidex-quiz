// 아이템 정의 — 1차 버전(전투/드랍이 참조하는 최소 세트). 상점/인벤토리 단계에서 대폭 확장 예정.
// rarity: normal | uncommon | rare | epic | legendary
export const ITEMS = {
  // 소모품
  hp_potion_small: { id: 'hp_potion_small', name: '체력 물약(소)', type: 'consumable', rarity: 'normal', healPct: 0.3, shopPrice: 20 },
  mp_potion_small: { id: 'mp_potion_small', name: '마나 물약(소)', type: 'consumable', rarity: 'normal', restoreMpPct: 0.3, shopPrice: 20 },
  antidote: { id: 'antidote', name: '해독제', type: 'consumable', rarity: 'normal', cureStatus: 'poison', shopPrice: 15 },
  stamina_potion_small: { id: 'stamina_potion_small', name: '스테미나 물약(소)', type: 'consumable', rarity: 'normal', restoreStaminaPct: 0.3, shopPrice: 20 },
  torch: { id: 'torch', name: '횃불', type: 'consumable', rarity: 'normal', shopPrice: 30 },

  // 가방 - 사용하면 즉시 소모되며 인벤토리 슬롯을 영구히 늘려줌(장착 아님)
  bag_small: { id: 'bag_small', name: '작은 가방', type: 'bag', rarity: 'normal', slotBonus: 5 },
  bag_medium: { id: 'bag_medium', name: '중간 가방', type: 'bag', rarity: 'uncommon', slotBonus: 10 },
  bag_large: { id: 'bag_large', name: '큰 가방', type: 'bag', rarity: 'rare', slotBonus: 20 },
  bag_dungeon: { id: 'bag_dungeon', name: '심연의 가방', type: 'bag', rarity: 'epic', slotBonus: 30 },

  // 시작 장비 (상점 구매용)
  weapon_basic_sword: { id: 'weapon_basic_sword', name: '낡은 장검', type: 'weapon', weaponType: 'sword', rarity: 'normal', atkBonus: 3, shopPrice: 50 },
  weapon_basic_spear: { id: 'weapon_basic_spear', name: '낡은 창', type: 'weapon', weaponType: 'spear', rarity: 'normal', atkBonus: 3, shopPrice: 50 },
  weapon_basic_axe: { id: 'weapon_basic_axe', name: '낡은 도끼', type: 'weapon', weaponType: 'axe', rarity: 'normal', atkBonus: 4, shopPrice: 50 },
  weapon_basic_bow: { id: 'weapon_basic_bow', name: '낡은 활', type: 'weapon', weaponType: 'bow', rarity: 'normal', atkBonus: 3, shopPrice: 50 },
  armor_basic: { id: 'armor_basic', name: '낡은 갑옷', type: 'armor', rarity: 'normal', defBonus: 2, hpBonus: 10, shopPrice: 60 },

  // 지역별 재료 (합성/승급 소재, 상점 단계에서 용도 확장)
  slime_jelly: { id: 'slime_jelly', name: '슬라임 젤리', type: 'material', rarity: 'normal' },
  rat_tail: { id: 'rat_tail', name: '들쥐 꼬리', type: 'material', rarity: 'normal' },
  wolf_pelt: { id: 'wolf_pelt', name: '늑대 가죽', type: 'material', rarity: 'normal' },
  torn_cloth: { id: 'torn_cloth', name: '해진 천', type: 'material', rarity: 'normal' },
  goblin_fang: { id: 'goblin_fang', name: '고블린 이빨', type: 'material', rarity: 'normal' },
  poison_gland: { id: 'poison_gland', name: '독샘', type: 'material', rarity: 'normal' },
  tentacle_fiber: { id: 'tentacle_fiber', name: '촉수 섬유', type: 'material', rarity: 'normal' },
  ore_shard: { id: 'ore_shard', name: '광석 조각', type: 'material', rarity: 'normal' },
  miner_pick: { id: 'miner_pick', name: '광부의 곡괭이', type: 'material', rarity: 'uncommon' },
  bone_fragment: { id: 'bone_fragment', name: '뼛조각', type: 'material', rarity: 'normal' },
  wraith_essence: { id: 'wraith_essence', name: '망령의 정수', type: 'material', rarity: 'uncommon' },

  // 레어몹 전용 드랍 (합성/장비 소재)
  slime_core: { id: 'slime_core', name: '슬라임 핵', type: 'material', rarity: 'uncommon' },
  chief_totem: { id: 'chief_totem', name: '족장의 토템', type: 'material', rarity: 'rare' },
  swamp_lord_core: { id: 'swamp_lord_core', name: '늪지 군주의 핵', type: 'material', rarity: 'rare' },
  wyrm_scale: { id: 'wyrm_scale', name: '와이번 비늘', type: 'material', rarity: 'epic' },
  guardian_core: { id: 'guardian_core', name: '수호자의 핵', type: 'material', rarity: 'legendary' },

  // 레어몹 드랍 장비 — weaponType 없음(무속성 만능이라 임시 처리, 등급 세분화는 나중 콘텐츠 단계에서)
  weapon_uncommon: { id: 'weapon_uncommon', name: '고급 무기(미확정)', type: 'weapon', weaponType: 'sword', rarity: 'uncommon', atkBonus: 8 },
  weapon_rare: { id: 'weapon_rare', name: '희귀 무기(미확정)', type: 'weapon', weaponType: 'sword', rarity: 'rare', atkBonus: 16 },
  weapon_legendary: { id: 'weapon_legendary', name: '전설 무기(미확정)', type: 'weapon', weaponType: 'sword', rarity: 'legendary', atkBonus: 30 },
  armor_uncommon: { id: 'armor_uncommon', name: '고급 방어구(미확정)', type: 'armor', rarity: 'uncommon', defBonus: 4, hpBonus: 20 },
  armor_rare: { id: 'armor_rare', name: '희귀 방어구(미확정)', type: 'armor', rarity: 'rare', defBonus: 9, hpBonus: 45 },
  armor_legendary: { id: 'armor_legendary', name: '전설 방어구(미확정)', type: 'armor', rarity: 'legendary', defBonus: 18, hpBonus: 90 },
};

// NPC 헐값 매입가 계산 — 정가가 있으면 그 30%, 없으면(드랍 전용 재료 등) 등급별 고정가
const RARITY_SELL_FALLBACK = { normal: 5, uncommon: 15, rare: 40, epic: 100, legendary: 250 };
export function npcSellPrice(itemId) {
  const item = ITEMS[itemId];
  if (!item) return 0;
  if (item.shopPrice) return Math.max(1, Math.floor(item.shopPrice * 0.3));
  return RARITY_SELL_FALLBACK[item.rarity] || 3;
}
