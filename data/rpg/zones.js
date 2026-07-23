// 지역 정의 — 나중에 대륙/섬 추가는 이 배열/객체에 항목만 추가하면 됨(코드 수정 불필요)
// varianceMin/Max: 진입시 몹 스탯에 곱해지는 랜덤 배율 범위(협곡이 가장 넓음 = 정보빈곤 컨셉의 핵심)
export const ZONES = {
  meadow: {
    id: 'meadow', name: '초원/숲', town: 'town1', tier: 1,
    varianceMin: 0.95, varianceMax: 1.05,
    monsterIds: ['slime', 'field_rat', 'wolf_pup'],
    rareMonsterId: 'giant_slime',
    groupSizeMin: 1, groupSizeMax: 1,
  },
  ruins_hill: {
    id: 'ruins_hill', name: '폐허 언덕', town: 'town1', tier: 2,
    varianceMin: 0.9, varianceMax: 1.1,
    monsterIds: ['bandit', 'goblin'],
    rareMonsterId: 'goblin_chief',
    groupSizeMin: 2, groupSizeMax: 3,
  },
  swamp: {
    id: 'swamp', name: '늪지', town: 'town2', tier: 3,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['poison_frog', 'swamp_tentacle'],
    rareMonsterId: 'swamp_lord',
    groupSizeMin: 1, groupSizeMax: 2,
  },
  canyon: {
    id: 'canyon', name: '협곡/폐광', town: 'town2', tier: 4,
    varianceMin: 0.7, varianceMax: 1.4, // 변동폭 최대 - 매번 다른 협곡
    monsterIds: ['mine_bug', 'beast_miner'],
    rareMonsterId: 'canyon_wyrm',
    groupSizeMin: 1, groupSizeMax: 2,
  },
  dungeon: {
    id: 'dungeon', name: '고대 묘굴', town: null, tier: 5,
    varianceMin: 0.95, varianceMax: 1.1,
    monsterIds: ['skeleton', 'wraith'],
    rareMonsterId: 'dungeon_guardian',
    groupSizeMin: 1, groupSizeMax: 1,
    requiresTorch: true,
    noTeleportScroll: true,
  },
};

export const RARE_PITY_BASE_CHANCE = 0.01;
export const RARE_PITY_KILL_THRESHOLD = 50;
export const RARE_PITY_INCREMENT_PER_KILL = 0.02;
