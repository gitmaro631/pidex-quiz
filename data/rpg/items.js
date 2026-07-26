// 아이템 정의 — 1차 버전(전투/드랍이 참조하는 최소 세트). 상점/인벤토리 단계에서 대폭 확장 예정.
// rarity: normal | uncommon | rare | epic | legendary
export const ITEMS = {
  // 소모품 (weight: 인벤토리 무게 제한 계산용 - _rpgInventory.js weightLimitForCharacter 참고)
  hp_potion_small: { id: 'hp_potion_small', name: '체력 물약(소)', type: 'consumable', rarity: 'normal', healPct: 0.3, shopPrice: 20, weight: 0.5 },
  mp_potion_small: { id: 'mp_potion_small', name: '마나 물약(소)', type: 'consumable', rarity: 'normal', restoreMpPct: 0.3, shopPrice: 20, weight: 0.5 },
  antidote: { id: 'antidote', name: '해독제', type: 'consumable', rarity: 'normal', cureStatus: 'poison', shopPrice: 15, weight: 0.5 },
  stamina_potion_small: { id: 'stamina_potion_small', name: '스테미나 물약(소)', type: 'consumable', rarity: 'normal', restoreStaminaPct: 0.3, shopPrice: 20, weight: 0.5 },
  // 마을 등급이 오르면 상점에 더 나은 물약도 풀림(minTownTier 없으면 tier1부터 판매)
  hp_potion_medium: { id: 'hp_potion_medium', name: '체력 물약(중)', type: 'consumable', rarity: 'normal', healPct: 0.5, shopPrice: 45, weight: 0.6, minTownTier: 2 },
  mp_potion_medium: { id: 'mp_potion_medium', name: '마나 물약(중)', type: 'consumable', rarity: 'normal', restoreMpPct: 0.5, shopPrice: 45, weight: 0.6, minTownTier: 2 },
  stamina_potion_medium: { id: 'stamina_potion_medium', name: '스테미나 물약(중)', type: 'consumable', rarity: 'normal', restoreStaminaPct: 0.5, shopPrice: 45, weight: 0.6, minTownTier: 2 },
  hp_potion_large: { id: 'hp_potion_large', name: '체력 물약(대)', type: 'consumable', rarity: 'normal', healPct: 0.75, shopPrice: 90, weight: 0.8, minTownTier: 4 },
  mp_potion_large: { id: 'mp_potion_large', name: '마나 물약(대)', type: 'consumable', rarity: 'normal', restoreMpPct: 0.75, shopPrice: 90, weight: 0.8, minTownTier: 4 },
  stamina_potion_large: { id: 'stamina_potion_large', name: '스테미나 물약(대)', type: 'consumable', rarity: 'normal', restoreStaminaPct: 0.75, shopPrice: 90, weight: 0.8, minTownTier: 4 },
  torch: { id: 'torch', name: '횃불', type: 'consumable', rarity: 'normal', shopPrice: 30, weight: 1 },
  arrow: { id: 'arrow', name: '화살', type: 'ammo', rarity: 'normal', shopPrice: 2, weight: 0.1 }, // 상점에서 10개 묶음으로 구매됨(개당 가격)
  bandage: { id: 'bandage', name: '붕대', type: 'consumable', rarity: 'normal', cureInjury: 'mild', shopPrice: 25, weight: 0.3 }, // 경상만 치료, 중상은 의사에게
  identify_scroll: { id: 'identify_scroll', name: '감정 스크롤', type: 'consumable', rarity: 'normal', identifyScroll: true, shopPrice: 40, weight: 0.2 }, // 미확인 아이템 즉시 감정
  repair_hammer: { id: 'repair_hammer', name: '수리 망치', type: 'consumable', rarity: 'normal', repairHammer: true, shopPrice: 30, weight: 1 }, // 셀프 수리 1회당 소모(수리스킬 필요)

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
  // 사슬로 연결된 무기 - 창처럼 사거리가 있어 중열에서도 상대 전열을 공격 가능(rpg-combat.js EXTENDED_REACH_WEAPON_TYPES)
  weapon_basic_flail: { id: 'weapon_basic_flail', name: '낡은 사슬도리깨', type: 'weapon', weaponType: 'flail', rarity: 'normal', atkBonus: 4, shopPrice: 55, weight: 6 },
  weapon_basic_bow: { id: 'weapon_basic_bow', name: '낡은 활', type: 'weapon', weaponType: 'bow', rarity: 'normal', atkBonus: 3, shopPrice: 50, weight: 3 },
  weapon_basic_dagger: { id: 'weapon_basic_dagger', name: '낡은 단도', type: 'weapon', weaponType: 'dagger', rarity: 'normal', atkBonus: 2, shopPrice: 40, weight: 2 }, // 궁수의 보조무기 - 화살이 떨어지면 이걸로 근접전
  weapon_basic_staff: { id: 'weapon_basic_staff', name: '낡은 지팡이', type: 'weapon', weaponType: 'staff', rarity: 'normal', atkBonus: 3, shopPrice: 50, weight: 3 },
  armor_basic: { id: 'armor_basic', name: '낡은 갑옷', type: 'armor_top', rarity: 'normal', armorClass: 'light', defBonus: 2, hpBonus: 10, shopPrice: 60, weight: 6, strRequirement: 5 },
  // 천 방어구(cloth) - 마법사/성직자 전용. 힘과 지혜 둘 다 일정 이상 필요(마력 운용에 정신력도 필요하다는 설정)
  armor_cloth_basic: { id: 'armor_cloth_basic', name: '낡은 로브', type: 'armor_top', rarity: 'normal', armorClass: 'cloth', defBonus: 1, hpBonus: 8, shopPrice: 55, weight: 3, strRequirement: 4, wisRequirement: 4 },

  // 하의(armor_bottom) - 상의와 별개 슬롯. armorClass 원칙은 상의와 동일(경갑/중갑/천갑)
  armor_bottom_basic: { id: 'armor_bottom_basic', name: '낡은 하의', type: 'armor_bottom', rarity: 'normal', armorClass: 'light', defBonus: 1, hpBonus: 6, shopPrice: 45, weight: 4, strRequirement: 5 },
  armor_bottom_cloth_basic: { id: 'armor_bottom_cloth_basic', name: '낡은 로브 하의', type: 'armor_bottom', rarity: 'normal', armorClass: 'cloth', defBonus: 1, hpBonus: 5, shopPrice: 40, weight: 2, strRequirement: 4, wisRequirement: 4 },
  armor_bottom_light_uncommon: { id: 'armor_bottom_light_uncommon', name: '가죽 각반', type: 'armor_bottom', rarity: 'uncommon', armorClass: 'light', defBonus: 2, hpBonus: 10, weight: 3, strRequirement: 8 },
  armor_bottom_heavy_uncommon: { id: 'armor_bottom_heavy_uncommon', name: '강철 각반', type: 'armor_bottom', rarity: 'uncommon', armorClass: 'heavy', defBonus: 3, hpBonus: 14, weight: 9, strRequirement: 12 },
  armor_bottom_cloth_uncommon: { id: 'armor_bottom_cloth_uncommon', name: '견습 마법사의 로브 하의', type: 'armor_bottom', rarity: 'uncommon', armorClass: 'cloth', defBonus: 1, hpBonus: 10, weight: 3, strRequirement: 6, wisRequirement: 8 },

  // 방패(shield) - 물리 직업(전사/궁수, resourceType:'stamina')만 착용 가능. 캐스터는 두 손이
  // 지팡이를 쥐어야 해서 방패를 못 씀(equip.js가 classDef.resourceType으로 판정)
  shield_basic: { id: 'shield_basic', name: '낡은 방패', type: 'shield', rarity: 'normal', defBonus: 3, hpBonus: 5, shopPrice: 55, weight: 5, strRequirement: 6 },
  shield_uncommon: { id: 'shield_uncommon', name: '강철 방패', type: 'shield', rarity: 'uncommon', defBonus: 6, hpBonus: 15, weight: 8, strRequirement: 10 },
  shield_rare: { id: 'shield_rare', name: '수호자의 방패', type: 'shield', rarity: 'rare', defBonus: 12, hpBonus: 30, severeInjuryResist: 0.15, weight: 11, strRequirement: 16 },

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
  // 산악 마을(town3) 재료
  goat_horn: { id: 'goat_horn', name: '산악 염소 뿔', type: 'material', rarity: 'normal', weight: 0.5 },
  bandit_dagger: { id: 'bandit_dagger', name: '산적의 단검', type: 'material', rarity: 'normal', weight: 0.5 },
  wyvern_talon: { id: 'wyvern_talon', name: '와이번 발톱', type: 'material', rarity: 'normal', weight: 0.5 },
  ambusher_hood: { id: 'ambusher_hood', name: '매복자의 두건', type: 'material', rarity: 'normal', weight: 0.3 },
  // 화산지대(town4) 재료
  salamander_scale: { id: 'salamander_scale', name: '화염 도마뱀 비늘', type: 'material', rarity: 'normal', weight: 0.5 },
  cultist_talisman: { id: 'cultist_talisman', name: '광신도의 부적', type: 'material', rarity: 'normal', weight: 0.3 },
  bat_wing: { id: 'bat_wing', name: '유황 박쥐 날개', type: 'material', rarity: 'normal', weight: 0.3 },
  driver_whip: { id: 'driver_whip', name: '감시병의 채찍', type: 'material', rarity: 'normal', weight: 0.7 },
  // 고대유적(town5) 재료
  guardian_shard: { id: 'guardian_shard', name: '수호병의 파편', type: 'material', rarity: 'normal', weight: 0.7 },
  cursed_rosary: { id: 'cursed_rosary', name: '저주받은 묵주', type: 'material', rarity: 'normal', weight: 0.3 },
  abyss_essence: { id: 'abyss_essence', name: '심연의 정수', type: 'material', rarity: 'normal', weight: 0.2 },
  assassin_blade_shard: { id: 'assassin_blade_shard', name: '암살자의 칼조각', type: 'material', rarity: 'normal', weight: 0.4 },

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
  captain_emblem: { id: 'captain_emblem', name: '두목의 인장', type: 'material', rarity: 'rare', weight: 1 },
  griffin_feather: { id: 'griffin_feather', name: '그리폰의 깃털', type: 'material', rarity: 'epic', weight: 1 },
  ifrit_horn: { id: 'ifrit_horn', name: '이프리트의 뿔', type: 'material', rarity: 'epic', weight: 1.5 },
  fiend_brand: { id: 'fiend_brand', name: '마인의 낙인', type: 'material', rarity: 'legendary', weight: 1 },
  high_priest_relic: { id: 'high_priest_relic', name: '대신관의 유물', type: 'material', rarity: 'legendary', weight: 1 },
  abyss_lord_seal: { id: 'abyss_lord_seal', name: '심연 군주의 봉인', type: 'material', rarity: 'legendary', weight: 1.5 },

  // 레어몹 드랍 장비 — weaponType 없음(무속성 만능이라 임시 처리, 등급 세분화는 나중 콘텐츠 단계에서)
  weapon_uncommon: { id: 'weapon_uncommon', name: '단련된 장검', type: 'weapon', weaponType: 'sword', rarity: 'uncommon', atkBonus: 8, weight: 4 },
  weapon_rare: { id: 'weapon_rare', name: '칠흑의 검', type: 'weapon', weaponType: 'sword', rarity: 'rare', atkBonus: 16, element: 'dark', weight: 5 },
  weapon_legendary: { id: 'weapon_legendary', name: '수호자의 성검', type: 'weapon', weaponType: 'sword', rarity: 'legendary', atkBonus: 30, element: 'holy', weight: 6 },
  armor_uncommon: { id: 'armor_uncommon', name: '강철 갑옷', type: 'armor_top', rarity: 'uncommon', armorClass: 'heavy', defBonus: 4, hpBonus: 20, weight: 12, strRequirement: 12 },
  armor_rare: { id: 'armor_rare', name: '정련된 판금 갑옷', type: 'armor_top', rarity: 'rare', armorClass: 'heavy', defBonus: 9, hpBonus: 45, weight: 16, strRequirement: 18 },
  armor_legendary: { id: 'armor_legendary', name: '수호자의 갑주', type: 'armor_top', rarity: 'legendary', armorClass: 'heavy', defBonus: 18, hpBonus: 90, weight: 20, strRequirement: 28 },
  armor_reinforced_rare: { id: 'armor_reinforced_rare', name: '중갑 보강 흉갑', type: 'armor_top', rarity: 'rare', armorClass: 'heavy', defBonus: 9, hpBonus: 40, severeInjuryResist: 0.3, weight: 18, strRequirement: 18 },

  // 경갑 상위 등급 - 중갑보다 방어력/체력은 낮지만 훨씬 가볍고 힘 요구치도 낮음(궁수 전용 착용 라인)
  armor_light_uncommon: { id: 'armor_light_uncommon', name: '가죽 조끼', type: 'armor_top', rarity: 'uncommon', armorClass: 'light', defBonus: 3, hpBonus: 15, weight: 5, strRequirement: 8 },
  armor_light_rare: { id: 'armor_light_rare', name: '숙련된 사냥꾼의 경갑', type: 'armor_top', rarity: 'rare', armorClass: 'light', defBonus: 6, hpBonus: 32, weight: 7, strRequirement: 12 },
  armor_light_legendary: { id: 'armor_light_legendary', name: '바람추적자의 경갑', type: 'armor_top', rarity: 'legendary', armorClass: 'light', defBonus: 12, hpBonus: 65, weight: 9, strRequirement: 20 },

  // 천 방어구 상위 등급 - 마법사/성직자 전용, 힘+지혜 둘 다 요구
  armor_cloth_uncommon: { id: 'armor_cloth_uncommon', name: '견습 마법사의 로브', type: 'armor_top', rarity: 'uncommon', armorClass: 'cloth', defBonus: 2, hpBonus: 14, weight: 4, strRequirement: 6, wisRequirement: 8 },
  armor_cloth_rare: { id: 'armor_cloth_rare', name: '현자의 로브', type: 'armor_top', rarity: 'rare', armorClass: 'cloth', defBonus: 5, hpBonus: 30, weight: 5, strRequirement: 9, wisRequirement: 12 },
  armor_cloth_legendary: { id: 'armor_cloth_legendary', name: '대주교의 성의', type: 'armor_top', rarity: 'legendary', armorClass: 'cloth', defBonus: 10, hpBonus: 60, weight: 6, strRequirement: 14, wisRequirement: 20 },

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

  // 5피스 풀세트 - 상의+하의+목걸이+반지 4개는 공통이고, 5번째 자리는 방패 또는 무기 중 하나로
  // 채우면 세트 완성으로 인정됨(FULL_SET_DEFS의 altPieceMap 참고). 어느 지역이든 유니크/레전더리몹이
  // 낮은 확률로 드랍(지역 한정 아님) - 마켓 거래로 나머지 조각을 모을 수 있음
  armor_top_heavyset: { id: 'armor_top_heavyset', name: '중량 갑주 상의', type: 'armor_top', rarity: 'epic', armorClass: 'heavy', defBonus: 14, hpBonus: 55, weight: 16, strRequirement: 16 },
  armor_bottom_heavyset: { id: 'armor_bottom_heavyset', name: '중량 갑주 하의', type: 'armor_bottom', rarity: 'epic', armorClass: 'heavy', defBonus: 10, hpBonus: 40, weight: 12, strRequirement: 16 },
  necklace_heavyset: { id: 'necklace_heavyset', name: '중량 수호자의 목걸이', type: 'necklace', rarity: 'epic', hpBonus: 40, defBonus: 4, weight: 0.3 },
  ring_heavyset: { id: 'ring_heavyset', name: '중량 수호자의 반지', type: 'ring', rarity: 'epic', defBonus: 6, atkBonus: 2, weight: 0.2 },
  shield_heavyset: { id: 'shield_heavyset', name: '중량 수호자의 방패', type: 'shield', rarity: 'epic', defBonus: 10, hpBonus: 25, weight: 12, strRequirement: 16 },
  weapon_heavyset: { id: 'weapon_heavyset', name: '중량 수호자의 대검', type: 'weapon', weaponType: 'sword', rarity: 'epic', atkBonus: 20, weight: 7 },

  // 직업별 5피스 세트(현재 1개씩) - 각 직업 무기 타입에 맞춘 5번째 자리(무기 또는 방패)
  armor_top_warriorset: { id: 'armor_top_warriorset', name: '용맹한 전사의 흉갑', type: 'armor_top', rarity: 'epic', armorClass: 'heavy', defBonus: 12, hpBonus: 45, weight: 14, strRequirement: 15 },
  armor_bottom_warriorset: { id: 'armor_bottom_warriorset', name: '용맹한 전사의 각반', type: 'armor_bottom', rarity: 'epic', armorClass: 'heavy', defBonus: 8, hpBonus: 30, weight: 10, strRequirement: 15 },
  necklace_warriorset: { id: 'necklace_warriorset', name: '용맹한 전사의 목걸이', type: 'necklace', rarity: 'epic', atkBonus: 6, hpBonus: 25, weight: 0.3 },
  ring_warriorset: { id: 'ring_warriorset', name: '용맹한 전사의 반지', type: 'ring', rarity: 'epic', atkBonus: 8, weight: 0.2 },
  shield_warriorset: { id: 'shield_warriorset', name: '용맹한 전사의 방패', type: 'shield', rarity: 'epic', defBonus: 9, hpBonus: 20, weight: 10, strRequirement: 15 },

  armor_top_archerset: { id: 'armor_top_archerset', name: '바람추적자의 상의', type: 'armor_top', rarity: 'epic', armorClass: 'light', defBonus: 6, hpBonus: 30, weight: 6, strRequirement: 12 },
  armor_bottom_archerset: { id: 'armor_bottom_archerset', name: '바람추적자의 하의', type: 'armor_bottom', rarity: 'epic', armorClass: 'light', defBonus: 4, hpBonus: 20, weight: 4, strRequirement: 12 },
  necklace_archerset: { id: 'necklace_archerset', name: '바람추적자의 목걸이', type: 'necklace', rarity: 'epic', agiBonus: 4, hpBonus: 20, weight: 0.3 },
  ring_archerset: { id: 'ring_archerset', name: '바람추적자의 반지', type: 'ring', rarity: 'epic', atkBonus: 6, agiBonus: 3, weight: 0.2 },
  weapon_archerset: { id: 'weapon_archerset', name: '바람추적자의 활', type: 'weapon', weaponType: 'bow', rarity: 'epic', atkBonus: 18, weight: 4 },

  armor_top_mageset: { id: 'armor_top_mageset', name: '대현자의 로브', type: 'armor_top', rarity: 'epic', armorClass: 'cloth', defBonus: 5, hpBonus: 28, weight: 5, strRequirement: 9, wisRequirement: 14 },
  armor_bottom_mageset: { id: 'armor_bottom_mageset', name: '대현자의 로브 하의', type: 'armor_bottom', rarity: 'epic', armorClass: 'cloth', defBonus: 3, hpBonus: 18, weight: 3, strRequirement: 9, wisRequirement: 14 },
  necklace_mageset: { id: 'necklace_mageset', name: '대현자의 목걸이', type: 'necklace', rarity: 'epic', intBonus: 4, hpBonus: 20, weight: 0.3 },
  ring_mageset: { id: 'ring_mageset', name: '대현자의 반지', type: 'ring', rarity: 'epic', atkBonus: 6, intBonus: 3, weight: 0.2 },
  weapon_mageset: { id: 'weapon_mageset', name: '대현자의 지팡이', type: 'weapon', weaponType: 'staff', rarity: 'epic', atkBonus: 18, weight: 4 },

  armor_top_priestset: { id: 'armor_top_priestset', name: '대주교 성의', type: 'armor_top', rarity: 'epic', armorClass: 'cloth', defBonus: 5, hpBonus: 30, weight: 5, strRequirement: 9, wisRequirement: 14 },
  armor_bottom_priestset: { id: 'armor_bottom_priestset', name: '대주교 성의 하의', type: 'armor_bottom', rarity: 'epic', armorClass: 'cloth', defBonus: 3, hpBonus: 20, weight: 3, strRequirement: 9, wisRequirement: 14 },
  necklace_priestset: { id: 'necklace_priestset', name: '대주교의 목걸이', type: 'necklace', rarity: 'epic', wisBonus: 4, hpBonus: 25, weight: 0.3 },
  ring_priestset: { id: 'ring_priestset', name: '대주교의 반지', type: 'ring', rarity: 'epic', wisBonus: 3, defBonus: 3, weight: 0.2 },
  weapon_priestset: { id: 'weapon_priestset', name: '대주교의 지팡이', type: 'weapon', weaponType: 'staff', rarity: 'epic', atkBonus: 16, weight: 4 },

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

// 5피스 풀세트 정의 - 상의/하의/목걸이/반지 4개는 고정이고, 5번째 자리(altSlot)는 방패 또는 무기 중
// 하나만 있어도 세트 완성으로 인정됨(방패는 물리 직업만 착용 가능해서 캐스터는 무기 쪽으로 맞춤).
// 지역 한정이 아니라 아무 지역 유니크/레전더리몹에서나 낮은 확률로 조각이 드랍됨(rpg-combat.js 참고)
export const FULL_SET_DEFS = {
  heavy_set: {
    name: '중량방어구 세트',
    pieces: ['armor_top_heavyset', 'armor_bottom_heavyset', 'necklace_heavyset', 'ring_heavyset'],
    altSlotPieces: ['shield_heavyset', 'weapon_heavyset'], // 둘 중 하나만 있어도 됨
    bonus: { elementDefense: 'all' },
  },
  warrior_set: {
    name: '용맹한 전사 세트', classId: 'warrior',
    pieces: ['armor_top_warriorset', 'armor_bottom_warriorset', 'necklace_warriorset', 'ring_warriorset'],
    altSlotPieces: ['shield_warriorset'],
    bonus: { atkBonus: 10, defBonus: 6 },
  },
  archer_set: {
    name: '바람추적자 세트', classId: 'archer',
    pieces: ['armor_top_archerset', 'armor_bottom_archerset', 'necklace_archerset', 'ring_archerset'],
    altSlotPieces: ['weapon_archerset'],
    bonus: { doubleAttackChance: 0.1, agiBonus: 3 },
  },
  mage_set: {
    name: '대현자 세트', classId: 'mage',
    pieces: ['armor_top_mageset', 'armor_bottom_mageset', 'necklace_mageset', 'ring_mageset'],
    altSlotPieces: ['weapon_mageset'],
    bonus: { intBonus: 5, atkBonus: 8 },
  },
  priest_set: {
    name: '대주교 세트', classId: 'priest',
    pieces: ['armor_top_priestset', 'armor_bottom_priestset', 'necklace_priestset', 'ring_priestset'],
    altSlotPieces: ['weapon_priestset'],
    bonus: { wisBonus: 5, severeInjuryResist: 0.15 },
  },
};

// 풀세트에 속한 모든 조각 itemId 목록(드랍 풀에 사용)
export const ALL_FULL_SET_ITEM_IDS = Object.values(FULL_SET_DEFS)
  .flatMap((def) => [...def.pieces, ...def.altSlotPieces]);

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
