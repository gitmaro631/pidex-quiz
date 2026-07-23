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

  bandit: {
    id: 'bandit', name: '도적', element: 'none', tags: ['humanoid'], rare: false,
    baseStats: { hp: 30, atk: 7, def: 1 },
    xp: 6, goldMin: 5, goldMax: 10, // 도적은 즉시 골드를 흘림(컨셉과 일치)
    dropTable: [
      { itemId: 'torn_cloth', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.04, qtyMin: 1, qtyMax: 1 },
    ],
  },
  goblin: {
    id: 'goblin', name: '고블린', element: 'none', tags: ['humanoid'], rare: false,
    baseStats: { hp: 34, atk: 6, def: 2 },
    xp: 6, goldMin: 3, goldMax: 6,
    dropTable: [
      { itemId: 'goblin_fang', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.04, qtyMin: 1, qtyMax: 1 },
    ],
  },
  goblin_chief: {
    id: 'goblin_chief', name: '고블린 족장', element: 'none', tags: ['humanoid'], rare: true,
    baseStats: { hp: 110, atk: 14, def: 4 },
    xp: 30, goldMin: 25, goldMax: 45,
    dropTable: [
      { itemId: 'chief_totem', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.3, qtyMin: 1, qtyMax: 1 },
    ],
  },

  poison_frog: {
    id: 'poison_frog', name: '독개구리', element: 'water', tags: ['beast'], rare: false,
    baseStats: { hp: 38, atk: 5, def: 1 }, poisonChance: 0.4,
    xp: 8, goldMin: 4, goldMax: 8,
    dropTable: [
      { itemId: 'poison_gland', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  swamp_tentacle: {
    id: 'swamp_tentacle', name: '늪지 촉수', element: 'water', tags: ['beast'], rare: false,
    baseStats: { hp: 46, atk: 7, def: 2 }, poisonChance: 0.25,
    xp: 9, goldMin: 4, goldMax: 9,
    dropTable: [
      { itemId: 'tentacle_fiber', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  swamp_lord: {
    id: 'swamp_lord', name: '늪지의 군주', element: 'water', tags: ['beast'], rare: true,
    baseStats: { hp: 150, atk: 16, def: 5 }, poisonChance: 0.5,
    xp: 40, goldMin: 35, goldMax: 60,
    dropTable: [
      { itemId: 'swamp_lord_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
  },

  mine_bug: {
    id: 'mine_bug', name: '광산 곤충', element: 'air', tags: ['beast'], rare: false,
    baseStats: { hp: 50, atk: 9, def: 3 },
    xp: 11, goldMin: 5, goldMax: 10,
    dropTable: [
      { itemId: 'ore_shard', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_medium', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.06, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.02, qtyMin: 1, qtyMax: 1 },
    ],
  },
  beast_miner: {
    id: 'beast_miner', name: '반인반수 광부', element: 'air', tags: ['humanoid'], rare: false, ambushChance: 0.2,
    baseStats: { hp: 60, atk: 11, def: 3 },
    xp: 13, goldMin: 6, goldMax: 12,
    dropTable: [
      { itemId: 'miner_pick', chance: 0.3, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.06, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.02, qtyMin: 1, qtyMax: 1 },
    ],
  },
  canyon_wyrm: {
    id: 'canyon_wyrm', name: '협곡 와이번', element: 'air', tags: ['beast'], rare: true,
    baseStats: { hp: 200, atk: 20, def: 6 },
    xp: 55, goldMin: 45, goldMax: 80,
    dropTable: [
      { itemId: 'wyrm_scale', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.3, qtyMin: 1, qtyMax: 1 },
    ],
  },

  skeleton: {
    id: 'skeleton', name: '스켈레톤', element: 'dark', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 65, atk: 13, def: 4 },
    xp: 16, goldMin: 8, goldMax: 15,
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_large', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  wraith: {
    id: 'wraith', name: '망령', element: 'dark', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 75, atk: 15, def: 3 },
    xp: 18, goldMin: 9, goldMax: 16,
    dropTable: [
      { itemId: 'wraith_essence', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  dungeon_guardian: {
    id: 'dungeon_guardian', name: '던전 수호자', element: 'dark', tags: ['undead'], rare: true, statusImmune: true,
    baseStats: { hp: 320, atk: 26, def: 8 },
    xp: 90, goldMin: 80, goldMax: 140,
    dropTable: [
      { itemId: 'guardian_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
  },
};
