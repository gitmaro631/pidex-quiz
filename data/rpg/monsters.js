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
};
