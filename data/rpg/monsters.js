// 몹 정의 — baseStats는 지역(zone)의 varianceMin~Max로 랜덤 배율 적용 후 사용됨.
// dropTable: { itemId, chance(0~1), qtyMin, qtyMax }
export const MONSTERS = {
  slime: {
    id: 'slime', name: '슬라임', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 18, atk: 3, def: 0 },
    xp: 3, goldMin: 1, goldMax: 3,
    dropTable: [
      { itemId: 'slime_jelly', chance: 0.5, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_small', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
  },
  field_rat: {
    id: 'field_rat', name: '들쥐', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 14, atk: 4, def: 0 },
    xp: 3, goldMin: 1, goldMax: 2,
    dropTable: [
      { itemId: 'rat_tail', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
  },
  wolf_pup: {
    id: 'wolf_pup', name: '새끼 늑대', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 22, atk: 5, def: 1 },
    xp: 4, goldMin: 2, goldMax: 4,
    dropTable: [
      { itemId: 'wolf_pelt', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
  },
  giant_slime: {
    id: 'giant_slime', name: '거대 슬라임', element: 'water', tags: ['beast'], rare: true,
    baseStats: { hp: 70, atk: 8, def: 2 },
    xp: 20, goldMin: 15, goldMax: 30,
    dropTable: [
      { itemId: 'slime_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.3, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // 2~5지역(초원 제외) 몹은 전부 스탯/보상 x1.35 상향됨 - 용병 파티(최대 3인) 플레이를 기준으로
  // 재조정한 값. 초원(meadow)은 튜토리얼 성격이라 손대지 않음.
  bandit: {
    // ranged: true - 활을 쓰는 몹이라 궁수가 화살로 견제해도 무효(원거리 대 원거리)
    id: 'bandit', name: '도적', element: 'none', tags: ['humanoid'], rare: false, ranged: true,
    baseStats: { hp: 41, atk: 9, def: 1 },
    xp: 8, goldMin: 7, goldMax: 14, // 도적은 즉시 골드를 흘림(컨셉과 일치)
    dropTable: [
      { itemId: 'torn_cloth', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  goblin: {
    id: 'goblin', name: '고블린', element: 'none', tags: ['humanoid'], rare: false,
    baseStats: { hp: 46, atk: 8, def: 3 },
    xp: 8, goldMin: 4, goldMax: 8,
    dropTable: [
      { itemId: 'goblin_fang', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  goblin_chief: {
    id: 'goblin_chief', name: '고블린 족장', element: 'none', tags: ['humanoid'], rare: true, ranged: true,
    baseStats: { hp: 149, atk: 19, def: 5 },
    xp: 41, goldMin: 34, goldMax: 61,
    dropTable: [
      { itemId: 'chief_totem', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.23, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
  },

  poison_frog: {
    id: 'poison_frog', name: '독개구리', element: 'water', tags: ['beast'], rare: false,
    baseStats: { hp: 51, atk: 7, def: 1 }, poisonChance: 0.4,
    xp: 11, goldMin: 5, goldMax: 11,
    dropTable: [
      { itemId: 'poison_gland', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  swamp_tentacle: {
    id: 'swamp_tentacle', name: '늪지 촉수', element: 'water', tags: ['beast'], rare: false,
    baseStats: { hp: 62, atk: 9, def: 3 }, poisonChance: 0.25,
    xp: 12, goldMin: 5, goldMax: 12,
    dropTable: [
      { itemId: 'tentacle_fiber', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  swamp_lord: {
    id: 'swamp_lord', name: '늪지의 군주', element: 'water', tags: ['beast'], rare: true,
    baseStats: { hp: 203, atk: 22, def: 7 }, poisonChance: 0.5,
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'swamp_lord_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.46, qtyMin: 1, qtyMax: 1 },
    ],
  },

  mine_bug: {
    id: 'mine_bug', name: '광산 곤충', element: 'air', tags: ['beast'], rare: false,
    baseStats: { hp: 68, atk: 12, def: 4 },
    xp: 15, goldMin: 7, goldMax: 14,
    dropTable: [
      { itemId: 'ore_shard', chance: 0.52, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_medium', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.07, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.02, qtyMin: 1, qtyMax: 1 },
    ],
  },
  beast_miner: {
    id: 'beast_miner', name: '반인반수 광부', element: 'air', tags: ['humanoid'], rare: false, ambushChance: 0.2,
    baseStats: { hp: 81, atk: 15, def: 4 },
    xp: 18, goldMin: 8, goldMax: 16,
    dropTable: [
      { itemId: 'miner_pick', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.07, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.02, qtyMin: 1, qtyMax: 1 },
    ],
  },
  canyon_wyrm: {
    id: 'canyon_wyrm', name: '협곡 와이번', element: 'air', tags: ['beast'], rare: true,
    baseStats: { hp: 270, atk: 27, def: 8 },
    xp: 74, goldMin: 61, goldMax: 108,
    dropTable: [
      { itemId: 'wyrm_scale', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
  },

  skeleton: {
    id: 'skeleton', name: '스켈레톤', element: 'dark', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 88, atk: 18, def: 5 },
    xp: 22, goldMin: 11, goldMax: 20,
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.52, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_large', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  wraith: {
    id: 'wraith', name: '망령', element: 'dark', tags: ['undead'], rare: false, statusImmune: true, ranged: true,
    baseStats: { hp: 101, atk: 20, def: 4 },
    xp: 24, goldMin: 12, goldMax: 22,
    dropTable: [
      { itemId: 'wraith_essence', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  dungeon_guardian: {
    id: 'dungeon_guardian', name: '던전 수호자', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    baseStats: { hp: 432, atk: 35, def: 11 },
    xp: 122, goldMin: 108, goldMax: 189,
    dropTable: [
      { itemId: 'guardian_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.58, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // ── 산악 마을(town3) ── 산적떼가 활개치는 능선지대. tags에 'demon'도 이후 등장(화산지대부터)
  mountain_goat: {
    id: 'mountain_goat', name: '산악 염소', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 110, atk: 22, def: 6 },
    xp: 27, goldMin: 12, goldMax: 22,
    dropTable: [
      { itemId: 'goat_horn', chance: 0.48, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  highland_bandit: {
    id: 'highland_bandit', name: '산적', element: 'none', tags: ['humanoid'], rare: false, ranged: true,
    baseStats: { hp: 128, atk: 26, def: 7 },
    xp: 30, goldMin: 18, goldMax: 32, // 산적은 즉시 골드를 흘림
    dropTable: [
      { itemId: 'bandit_dagger', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.13, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  bandit_captain: {
    id: 'bandit_captain', name: '산적 두목', element: 'none', tags: ['humanoid'], rare: true, ranged: true,
    baseStats: { hp: 560, atk: 46, def: 14 },
    xp: 160, goldMin: 145, goldMax: 250,
    dropTable: [
      { itemId: 'captain_emblem', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.22, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
  },
  rock_wyvern: {
    id: 'rock_wyvern', name: '바위 와이번', element: 'air', tags: ['beast'], rare: false,
    baseStats: { hp: 140, atk: 27, def: 8 },
    xp: 34, goldMin: 15, goldMax: 27,
    dropTable: [
      { itemId: 'wyvern_talon', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.13, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  cliff_ambusher: {
    id: 'cliff_ambusher', name: '매복 산적', element: 'none', tags: ['humanoid'], rare: false, ambushChance: 0.3,
    baseStats: { hp: 170, atk: 33, def: 9 },
    xp: 38, goldMin: 20, goldMax: 36,
    dropTable: [
      { itemId: 'ambusher_hood', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.14, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },
  griffin_lord: {
    id: 'griffin_lord', name: '그리폰 군주', element: 'air', tags: ['beast'], rare: true,
    baseStats: { hp: 730, atk: 60, def: 18 },
    xp: 208, goldMin: 189, goldMax: 325,
    dropTable: [
      { itemId: 'griffin_feather', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // ── 화산지대(town4) ── 화염 짐승과 광신도, 첫 악마(demon) 등장
  fire_salamander: {
    id: 'fire_salamander', name: '화염 도마뱀', element: 'fire', tags: ['beast'], rare: false,
    baseStats: { hp: 180, atk: 36, def: 11 },
    xp: 44, goldMin: 22, goldMax: 40,
    dropTable: [
      { itemId: 'salamander_scale', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  ash_cultist: {
    id: 'ash_cultist', name: '화산 광신도', element: 'fire', tags: ['humanoid'], rare: false, ranged: true,
    baseStats: { hp: 220, atk: 42, def: 13 },
    xp: 54, goldMin: 27, goldMax: 49,
    dropTable: [
      { itemId: 'cultist_talisman', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  ifrit_lord: {
    id: 'ifrit_lord', name: '이프리트 군주', element: 'fire', tags: ['demon'], rare: true,
    baseStats: { hp: 950, atk: 78, def: 23 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'ifrit_horn', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
  },
  sulfur_bat: {
    id: 'sulfur_bat', name: '유황 박쥐', element: 'air', tags: ['beast'], rare: false, statusImmune: true,
    baseStats: { hp: 232, atk: 46, def: 13 },
    xp: 58, goldMin: 29, goldMax: 52,
    dropTable: [
      { itemId: 'bat_wing', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.09, qtyMin: 1, qtyMax: 1 },
    ],
  },
  slave_driver: {
    id: 'slave_driver', name: '광산 감시병', element: 'none', tags: ['humanoid'], rare: false, ambushChance: 0.2,
    baseStats: { hp: 284, atk: 54, def: 17 },
    xp: 70, goldMin: 35, goldMax: 63,
    dropTable: [
      { itemId: 'driver_whip', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.09, qtyMin: 1, qtyMax: 1 },
    ],
  },
  pit_fiend: {
    id: 'pit_fiend', name: '구렁의 마인', element: 'fire', tags: ['demon'], rare: true, statusImmune: true,
    baseStats: { hp: 1235, atk: 101, def: 30 },
    xp: 351, goldMin: 318, goldMax: 546,
    dropTable: [
      { itemId: 'fiend_brand', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // ── 고대유적(town5) ── 봉인된 신전을 지키는 언데드 수호자와 그림자 세력
  temple_guardian: {
    id: 'temple_guardian', name: '신전 석상 수호병', element: 'dark', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 300, atk: 58, def: 20 },
    xp: 76, goldMin: 38, goldMax: 68,
    dropTable: [
      { itemId: 'guardian_shard', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  cursed_priest: {
    id: 'cursed_priest', name: '저주받은 사제', element: 'dark', tags: ['humanoid'], rare: false, ranged: true,
    baseStats: { hp: 340, atk: 66, def: 18 },
    xp: 86, goldMin: 43, goldMax: 77,
    dropTable: [
      { itemId: 'cursed_rosary', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  fallen_high_priest: {
    id: 'fallen_high_priest', name: '타락한 대신관', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    baseStats: { hp: 1605, atk: 131, def: 39 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'high_priest_relic', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
  },
  abyss_wraith: {
    id: 'abyss_wraith', name: '심연의 망령', element: 'dark', tags: ['undead'], rare: false, statusImmune: true, ranged: true,
    baseStats: { hp: 390, atk: 76, def: 22 },
    xp: 98, goldMin: 50, goldMax: 89,
    dropTable: [
      { itemId: 'abyss_essence', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },
  shadow_assassin: {
    id: 'shadow_assassin', name: '그림자 암살자', element: 'dark', tags: ['humanoid'], rare: false, ambushChance: 0.35,
    baseStats: { hp: 420, atk: 88, def: 20 },
    xp: 108, goldMin: 55, goldMax: 98,
    dropTable: [
      { itemId: 'assassin_blade_shard', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },
  abyss_lord: {
    id: 'abyss_lord', name: '심연의 군주', element: 'dark', tags: ['demon'], rare: true, statusImmune: true, ranged: true,
    baseStats: { hp: 2085, atk: 170, def: 51 },
    xp: 593, goldMin: 537, goldMax: 923,
    dropTable: [
      { itemId: 'abyss_lord_seal', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.6, qtyMin: 1, qtyMax: 1 },
    ],
  },
};
