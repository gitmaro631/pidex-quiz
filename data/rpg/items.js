// 아이템 정의 — 1차 버전(전투/드랍이 참조하는 최소 세트). 상점/인벤토리 단계에서 대폭 확장 예정.
// rarity: normal | uncommon | rare | epic | legendary
export const ITEMS = {
  // 소모품 (weight: 인벤토리 무게 제한 계산용 - _rpgInventory.js weightLimitForCharacter 참고)
  hp_potion_small: { id: 'hp_potion_small', name: '체력 물약(소)', type: 'consumable', rarity: 'normal', healPct: 0.3, shopPrice: 20, weight: 0.5 },
  mp_potion_small: { id: 'mp_potion_small', name: '마나 물약(소)', type: 'consumable', rarity: 'normal', restoreMpPct: 0.3, shopPrice: 20, weight: 0.5 },
  antidote: { id: 'antidote', name: '해독제', type: 'consumable', rarity: 'normal', cureStatus: 'poison', shopPrice: 15, weight: 0.5 },
  stamina_potion_small: { id: 'stamina_potion_small', name: '스테미나 물약(소)', type: 'consumable', rarity: 'normal', restoreStaminaPct: 0.3, shopPrice: 20, weight: 0.5 },
  torch: { id: 'torch', name: '횃불', type: 'consumable', rarity: 'normal', shopPrice: 30, weight: 1 },
  arrow: { id: 'arrow', name: '화살', type: 'ammo', rarity: 'normal', shopPrice: 2, weight: 0.1 }, // 상점에서 10개 묶음으로 구매됨(개당 가격)
  bandage: { id: 'bandage', name: '붕대', type: 'consumable', rarity: 'normal', cureInjury: 'mild', shopPrice: 25, weight: 0.3 }, // 경상만 치료, 중상은 의사에게
  identify_scroll: { id: 'identify_scroll', name: '감정 스크롤', type: 'consumable', rarity: 'normal', identifyScroll: true, shopPrice: 40, weight: 0.2 }, // 미확인 아이템 즉시 감정

  // 가방 - 사용하면 즉시 소모되며 인벤토리 슬롯을 영구히 늘려줌(장착 아님)
  bag_small: { id: 'bag_small', name: '작은 가방', type: 'bag', rarity: 'normal', slotBonus: 5, weight: 2 },
  bag_medium: { id: 'bag_medium', name: '중간 가방', type: 'bag', rarity: 'uncommon', slotBonus: 10, weight: 3 },
  bag_large: { id: 'bag_large', name: '큰 가방', type: 'bag', rarity: 'rare', slotBonus: 20, weight: 4 },
  bag_dungeon: { id: 'bag_dungeon', name: '심연의 가방', type: 'bag', rarity: 'epic', slotBonus: 30, weight: 5 },

  // 시작 장비 (상점 구매용). armorClass: 경갑(light)/중갑(heavy) - 방어력은 낮아도 가벼운 경갑 vs 무겁지만 튼튼한 중갑
  // strRequirement: 이 힘(STR) 미만이면 착용 불가(장신구의 힘 보너스도 합산해서 판정) - 경갑도 소량 필요, 중갑은 훨씬 많이 필요
  weapon_basic_sword: { id: 'weapon_basic_sword', name: '낡은 장검', type: 'weapon', weaponType: 'sword', rarity: 'normal', atkBonus: 3, shopPrice: 50, weight: 4 },
  weapon_basic_spear: { id: 'weapon_basic_spear', name: '낡은 창', type: 'weapon', weaponType: 'spear', rarity: 'normal', atkBonus: 3, shopPrice: 50, weight: 5 },
  weapon_basic_axe: { id: 'weapon_basic_axe', name: '낡은 도끼', type: 'weapon', weaponType: 'axe', rarity: 'normal', atkBonus: 4, shopPrice: 50, weight: 6 },
  weapon_basic_bow: { id: 'weapon_basic_bow', name: '낡은 활', type: 'weapon', weaponType: 'bow', rarity: 'normal', atkBonus: 3, shopPrice: 50, weight: 3 },
  weapon_basic_dagger: { id: 'weapon_basic_dagger', name: '낡은 단도', type: 'weapon', weaponType: 'dagger', rarity: 'normal', atkBonus: 2, shopPrice: 40, weight: 2 }, // 궁수의 보조무기 - 화살이 떨어지면 이걸로 근접전
  weapon_basic_staff: { id: 'weapon_basic_staff', name: '낡은 지팡이', type: 'weapon', weaponType: 'staff', rarity: 'normal', atkBonus: 3, shopPrice: 50, weight: 3 },
  armor_basic: { id: 'armor_basic', name: '낡은 갑옷', type: 'armor', rarity: 'normal', armorClass: 'light', defBonus: 2, hpBonus: 10, shopPrice: 60, weight: 6, strRequirement: 5 },
  // 천 방어구(cloth) - 마법사/성직자 전용. 힘과 지혜 둘 다 일정 이상 필요(마력 운용에 정신력도 필요하다는 설정)
  armor_cloth_basic: { id: 'armor_cloth_basic', name: '낡은 로브', type: 'armor', rarity: 'normal', armorClass: 'cloth', defBonus: 1, hpBonus: 8, shopPrice: 55, weight: 3, strRequirement: 4, wisRequirement: 4 },

  // 지역별 재료 (합성/승급 소재, 상점 단계에서 용도 확장)
  slime_jelly: { id: 'slime_jelly', name: '슬라임 젤리', type: 'material', rarity: 'normal', weight: 0.5 },
  rat_tail: { id: 'rat_tail', name: '들쥐 꼬리', type: 'material', rarity: 'normal', weight: 0.2 },
  wolf_pelt: { id: 'wolf_pelt', name: '늑대 가죽', type: 'material', rarity: 'normal', weight: 1 },
  torn_cloth: { id: 'torn_cloth', name: '해진 천', type: 'material', rarity: 'normal', weight: 0.3 },
  goblin_fang: { id: 'goblin_fang', name: '고블린 이빨', type: 'material', rarity: 'normal', weight: 0.2 },
  poison_gland: { id: 'poison_gland', name: '독샘', type: 'material', rarity: 'normal', weight: 0.3 },
  tentacle_fiber: { id: 'tentacle_fiber', name: '촉수 섬유', type: 'material', rarity: 'normal', weight: 0.3 },
  ore_shard: { id: 'ore_shard', name: '광석 조각', type: 'material', rarity: 'normal', weight: 1.5 },
  miner_pick: { id: 'miner_pick', name: '광부의 곡괭이', type: 'material', rarity: 'uncommon', weight: 3 },
  bone_fragment: { id: 'bone_fragment', name: '뼛조각', type: 'material', rarity: 'normal', weight: 0.5 },
  wraith_essence: { id: 'wraith_essence', name: '망령의 정수', type: 'material', rarity: 'uncommon', weight: 0.2 },

  // 직업훈련소 결정 - 몹을 잡으면 내 직업에 맞는 게 일정 확률로 드랍(몹 종류 무관). 스킬을 배우거나
  // 단계를 올릴 때 소모됨(data/rpg/training.js 참고)
  essence_strength: { id: 'essence_strength', name: '힘의 결정', type: 'material', rarity: 'uncommon', weight: 0.3 },
  essence_agility: { id: 'essence_agility', name: '민첩의 결정', type: 'material', rarity: 'uncommon', weight: 0.3 },
  essence_arcane: { id: 'essence_arcane', name: '마력의 결정', type: 'material', rarity: 'uncommon', weight: 0.3 },
  essence_holy: { id: 'essence_holy', name: '신성의 결정', type: 'material', rarity: 'uncommon', weight: 0.3 },

  // 대장간 강화석 - 유니크(레어)몹을 잡으면 낮은 확률로 드랍(data/rpg/enhancement.js 참고)
  enhance_stone: { id: 'enhance_stone', name: '강화석', type: 'material', rarity: 'rare', weight: 0.5 },

  // 레어몹 전용 드랍 (합성/장비 소재)
  slime_core: { id: 'slime_core', name: '슬라임 핵', type: 'material', rarity: 'uncommon', weight: 0.5 },
  chief_totem: { id: 'chief_totem', name: '족장의 토템', type: 'material', rarity: 'rare', weight: 1 },
  swamp_lord_core: { id: 'swamp_lord_core', name: '늪지 군주의 핵', type: 'material', rarity: 'rare', weight: 1 },
  wyrm_scale: { id: 'wyrm_scale', name: '와이번 비늘', type: 'material', rarity: 'epic', weight: 1.5 },
  guardian_core: { id: 'guardian_core', name: '수호자의 핵', type: 'material', rarity: 'legendary', weight: 1 },

  // 레어몹 드랍 장비 — weaponType 없음(무속성 만능이라 임시 처리, 등급 세분화는 나중 콘텐츠 단계에서)
  weapon_uncommon: { id: 'weapon_uncommon', name: '단련된 장검', type: 'weapon', weaponType: 'sword', rarity: 'uncommon', atkBonus: 8, weight: 4 },
  weapon_rare: { id: 'weapon_rare', name: '칠흑의 검', type: 'weapon', weaponType: 'sword', rarity: 'rare', atkBonus: 16, element: 'dark', weight: 5 },
  weapon_legendary: { id: 'weapon_legendary', name: '수호자의 성검', type: 'weapon', weaponType: 'sword', rarity: 'legendary', atkBonus: 30, element: 'holy', weight: 6 },
  armor_uncommon: { id: 'armor_uncommon', name: '강철 갑옷', type: 'armor', rarity: 'uncommon', armorClass: 'heavy', defBonus: 4, hpBonus: 20, weight: 12, strRequirement: 12 },
  armor_rare: { id: 'armor_rare', name: '정련된 판금 갑옷', type: 'armor', rarity: 'rare', armorClass: 'heavy', defBonus: 9, hpBonus: 45, weight: 16, strRequirement: 18 },
  armor_legendary: { id: 'armor_legendary', name: '수호자의 갑주', type: 'armor', rarity: 'legendary', armorClass: 'heavy', defBonus: 18, hpBonus: 90, weight: 20, strRequirement: 28 },
  armor_reinforced_rare: { id: 'armor_reinforced_rare', name: '중갑 보강 흉갑', type: 'armor', rarity: 'rare', armorClass: 'heavy', defBonus: 9, hpBonus: 40, severeInjuryResist: 0.3, weight: 18, strRequirement: 18 },

  // 경갑 상위 등급 - 중갑보다 방어력/체력은 낮지만 훨씬 가볍고 힘 요구치도 낮음(궁수 전용 착용 라인)
  armor_light_uncommon: { id: 'armor_light_uncommon', name: '가죽 조끼', type: 'armor', rarity: 'uncommon', armorClass: 'light', defBonus: 3, hpBonus: 15, weight: 5, strRequirement: 8 },
  armor_light_rare: { id: 'armor_light_rare', name: '숙련된 사냥꾼의 경갑', type: 'armor', rarity: 'rare', armorClass: 'light', defBonus: 6, hpBonus: 32, weight: 7, strRequirement: 12 },
  armor_light_legendary: { id: 'armor_light_legendary', name: '바람추적자의 경갑', type: 'armor', rarity: 'legendary', armorClass: 'light', defBonus: 12, hpBonus: 65, weight: 9, strRequirement: 20 },

  // 천 방어구 상위 등급 - 마법사/성직자 전용, 힘+지혜 둘 다 요구
  armor_cloth_uncommon: { id: 'armor_cloth_uncommon', name: '견습 마법사의 로브', type: 'armor', rarity: 'uncommon', armorClass: 'cloth', defBonus: 2, hpBonus: 14, weight: 4, strRequirement: 6, wisRequirement: 8 },
  armor_cloth_rare: { id: 'armor_cloth_rare', name: '현자의 로브', type: 'armor', rarity: 'rare', armorClass: 'cloth', defBonus: 5, hpBonus: 30, weight: 5, strRequirement: 9, wisRequirement: 12 },
  armor_cloth_legendary: { id: 'armor_cloth_legendary', name: '대주교의 성의', type: 'armor', rarity: 'legendary', armorClass: 'cloth', defBonus: 10, hpBonus: 60, weight: 6, strRequirement: 14, wisRequirement: 20 },

  // 장신구 - 반지/목걸이 (랜덤박스 전용 획득처, 상점 미판매)
  ring_normal: { id: 'ring_normal', name: '낡은 반지', type: 'ring', rarity: 'normal', atkBonus: 2, weight: 0.2 },
  ring_uncommon: { id: 'ring_uncommon', name: '고급 반지', type: 'ring', rarity: 'uncommon', atkBonus: 5, defBonus: 2, weight: 0.2 },
  ring_rare: { id: 'ring_rare', name: '희귀 반지', type: 'ring', rarity: 'rare', atkBonus: 10, defBonus: 4, weight: 0.2 },
  necklace_normal: { id: 'necklace_normal', name: '낡은 목걸이', type: 'necklace', rarity: 'normal', hpBonus: 15, weight: 0.3 },
  necklace_uncommon: { id: 'necklace_uncommon', name: '고급 목걸이', type: 'necklace', rarity: 'uncommon', hpBonus: 35, defBonus: 3, weight: 0.3 },
  necklace_rare: { id: 'necklace_rare', name: '희귀 목걸이', type: 'necklace', rarity: 'rare', hpBonus: 70, defBonus: 6, weight: 0.3 },

  // 장신구 특수 효과 - 속성방어/중상방어/확률적 2연타 (랜덤박스 전용, 레어 등급)
  ring_ward_water: { id: 'ring_ward_water', name: '물의 가호 반지', type: 'ring', rarity: 'rare', atkBonus: 4, elementDefense: 'water', weight: 0.2 },
  ring_ward_fire: { id: 'ring_ward_fire', name: '불의 가호 반지', type: 'ring', rarity: 'rare', atkBonus: 4, elementDefense: 'fire', weight: 0.2 },
  ring_ward_air: { id: 'ring_ward_air', name: '대기의 가호 반지', type: 'ring', rarity: 'rare', atkBonus: 4, elementDefense: 'air', weight: 0.2 },
  necklace_ward_dark: { id: 'necklace_ward_dark', name: '어둠의 가호 목걸이', type: 'necklace', rarity: 'rare', hpBonus: 30, elementDefense: 'dark', weight: 0.3 },
  necklace_ward_holy: { id: 'necklace_ward_holy', name: '신성한 가호 목걸이', type: 'necklace', rarity: 'rare', hpBonus: 30, elementDefense: 'holy', weight: 0.3 },
  ring_stalwart: { id: 'ring_stalwart', name: '불굴의 반지', type: 'ring', rarity: 'rare', defBonus: 5, severeInjuryResist: 0.25, weight: 0.2 },
  necklace_stalwart: { id: 'necklace_stalwart', name: '불굴의 목걸이', type: 'necklace', rarity: 'rare', hpBonus: 30, severeInjuryResist: 0.25, weight: 0.3 },
  ring_swift_strike: { id: 'ring_swift_strike', name: '쾌속의 반지', type: 'ring', rarity: 'rare', atkBonus: 6, doubleAttackChance: 0.15, weight: 0.2 },
  necklace_swift_strike: { id: 'necklace_swift_strike', name: '쾌속의 목걸이', type: 'necklace', rarity: 'rare', atkBonus: 4, doubleAttackChance: 0.15, weight: 0.3 },

  // 장신구 - 스탯 보너스(힘/민첩/지능) - 착용만 해도 기본 스탯이 오른 것처럼 적용됨
  ring_strength: { id: 'ring_strength', name: '力의 반지', type: 'ring', rarity: 'rare', strBonus: 3, weight: 0.2 },
  necklace_strength: { id: 'necklace_strength', name: '괴력의 목걸이', type: 'necklace', rarity: 'rare', strBonus: 3, weight: 0.3 },
  ring_agility: { id: 'ring_agility', name: '민첩의 반지', type: 'ring', rarity: 'rare', agiBonus: 3, weight: 0.2 },
  necklace_agility: { id: 'necklace_agility', name: '바람의 목걸이', type: 'necklace', rarity: 'rare', agiBonus: 3, weight: 0.3 },
  ring_intellect: { id: 'ring_intellect', name: '지능의 반지', type: 'ring', rarity: 'rare', intBonus: 3, weight: 0.2 },
  necklace_intellect: { id: 'necklace_intellect', name: '현자의 목걸이', type: 'necklace', rarity: 'rare', intBonus: 3, weight: 0.3 },
  ring_wisdom: { id: 'ring_wisdom', name: '지혜의 반지', type: 'ring', rarity: 'rare', wisBonus: 3, weight: 0.2 },
  necklace_wisdom: { id: 'necklace_wisdom', name: '성자의 목걸이', type: 'necklace', rarity: 'rare', wisBonus: 3, weight: 0.3 },

  // 전속성방어 - 모든 아이템 통틀어 극히 낮은 확률로만 나오는 신화급 장신구
  ring_omniward: { id: 'ring_omniward', name: '만물 수호의 반지', type: 'ring', rarity: 'legendary', atkBonus: 8, defBonus: 6, elementDefense: 'all', weight: 0.2 },

  // 세트 아이템 - 그 지역 유니크(2단계)/레전더리(3단계) 몹만 낮은 확률로 드랍. 반지+목걸이 두 짝을
  // 같은 setId로 함께 착용하면 SET_BONUSES의 추가 보너스가 붙음(반지/목걸이는 원래 직업 제한이 없어서
  // 어떤 직업이든 맞출 수 있음). 유저간 마켓 거래로 짝을 맞추기 쉽도록 클래스 무관하게 설계함
  ring_set_meadow: { id: 'ring_set_meadow', name: '숲의 파수꾼 반지', type: 'ring', rarity: 'epic', setId: 'meadow_set', atkBonus: 6, hpBonus: 20, weight: 0.2 },
  necklace_set_meadow: { id: 'necklace_set_meadow', name: '숲의 파수꾼 목걸이', type: 'necklace', rarity: 'epic', setId: 'meadow_set', hpBonus: 40, defBonus: 4, weight: 0.3 },
  ring_set_ruins_hill: { id: 'ring_set_ruins_hill', name: '폐허 약탈자 반지', type: 'ring', rarity: 'epic', setId: 'ruins_hill_set', atkBonus: 12, weight: 0.2 },
  necklace_set_ruins_hill: { id: 'necklace_set_ruins_hill', name: '폐허 약탈자 목걸이', type: 'necklace', rarity: 'epic', setId: 'ruins_hill_set', atkBonus: 6, hpBonus: 30, weight: 0.3 },
  ring_set_swamp: { id: 'ring_set_swamp', name: '늪지 사령관 반지', type: 'ring', rarity: 'epic', setId: 'swamp_set', defBonus: 8, elementDefense: 'water', weight: 0.2 },
  necklace_set_swamp: { id: 'necklace_set_swamp', name: '늪지 사령관 목걸이', type: 'necklace', rarity: 'epic', setId: 'swamp_set', hpBonus: 50, elementDefense: 'water', weight: 0.3 },
  ring_set_canyon: { id: 'ring_set_canyon', name: '협곡 추적자 반지', type: 'ring', rarity: 'epic', setId: 'canyon_set', atkBonus: 8, doubleAttackChance: 0.08, weight: 0.2 },
  necklace_set_canyon: { id: 'necklace_set_canyon', name: '협곡 추적자 목걸이', type: 'necklace', rarity: 'epic', setId: 'canyon_set', hpBonus: 35, doubleAttackChance: 0.08, weight: 0.3 },
  ring_set_dungeon: { id: 'ring_set_dungeon', name: '망자의 유산 반지', type: 'ring', rarity: 'epic', setId: 'dungeon_set', atkBonus: 10, elementDefense: 'dark', weight: 0.2 },
  necklace_set_dungeon: { id: 'necklace_set_dungeon', name: '망자의 유산 목걸이', type: 'necklace', rarity: 'epic', setId: 'dungeon_set', hpBonus: 45, severeInjuryResist: 0.15, weight: 0.3 },

  // 랜덤박스 - 상점에서 골드로 직접 뽑기(박스 자체는 인벤토리에 안 쌓이고 즉시 결과만 지급)
  random_box: { id: 'random_box', name: '수상한 상자', type: 'randombox', rarity: 'normal', shopPrice: 150, weight: 0 },
};

// 세트 보너스 - 반지+목걸이(setId 동일) 둘 다 착용시 추가로 붙는 보너스. 지역(zoneId)별 세트를
// 그 지역 유니크/레전더리 몹 전용 드랍으로 연결하는 데도 씀(rpg-combat.js의 rollSetItemDrop 참고)
export const SET_BONUSES = {
  meadow_set: { zoneId: 'meadow', name: '숲의 파수꾼 세트', bonus: { hpBonus: 30, defBonus: 3 } },
  ruins_hill_set: { zoneId: 'ruins_hill', name: '폐허 약탈자 세트', bonus: { atkBonus: 8 } },
  swamp_set: { zoneId: 'swamp', name: '늪지 사령관 세트', bonus: { defBonus: 6, hpBonus: 30 } },
  canyon_set: { zoneId: 'canyon', name: '협곡 추적자 세트', bonus: { doubleAttackChance: 0.07 } },
  dungeon_set: { zoneId: 'dungeon', name: '망자의 유산 세트', bonus: { atkBonus: 6, severeInjuryResist: 0.1 } },
};

// 지역id -> 그 지역 세트의 [반지itemId, 목걸이itemId] - 드랍 판정에 사용
export const ZONE_SET_ITEMS = Object.entries(SET_BONUSES).reduce((acc, [setId, def]) => {
  acc[def.zoneId] = [`ring_set_${def.zoneId}`, `necklace_set_${def.zoneId}`];
  return acc;
}, {});

// NPC 헐값 매입가 계산 — 정가가 있으면 그 30%, 없으면(드랍 전용 재료 등) 등급별 고정가
const RARITY_SELL_FALLBACK = { normal: 5, uncommon: 15, rare: 40, epic: 100, legendary: 250 };
export function npcSellPrice(itemId) {
  const item = ITEMS[itemId];
  if (!item) return 0;
  if (item.shopPrice) return Math.max(1, Math.floor(item.shopPrice * 0.3));
  return RARITY_SELL_FALLBACK[item.rarity] || 3;
}

// 등급별 "아이템 레벨" 근사치 - 실제 레벨 필드가 없는 대신 등급으로 대략적인 착용 시점을 추정.
// 내 레벨보다 아이템 레벨이 높으면 미확인(감정 필요) 상태로 표시됨(page-rpg.js의 isItemIdentified 참고)
export const RARITY_ITEM_LEVEL = { normal: 1, uncommon: 8, rare: 16, epic: 26, legendary: 36 };
