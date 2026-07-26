// 지역 정의 — 나중에 대륙/섬 추가는 이 배열/객체에 항목만 추가하면 됨(코드 수정 불필요)
// varianceMin/Max: 진입시 몹 스탯에 곱해지는 랜덤 배율 범위(협곡이 가장 넓음 = 정보빈곤 컨셉의 핵심)
export const ZONES = {
  meadow: {
    id: 'meadow', name: '해변 저지대', town: 'town1', tier: 1,
    varianceMin: 0.95, varianceMax: 1.05,
    monsterIds: ['slime', 'field_rat', 'wolf_pup'],
    rareMonsterId: 'giant_slime',
    groupSizeMin: 1, groupSizeMax: 1,
  },
  ruins_hill: {
    id: 'ruins_hill', name: '버려진 등대', town: 'town1', tier: 2,
    varianceMin: 0.9, varianceMax: 1.1,
    monsterIds: ['bandit', 'goblin'],
    rareMonsterId: 'goblin_chief',
    groupSizeMin: 2, groupSizeMax: 3,
  },
  swamp: {
    id: 'swamp', name: '항만 습지', town: 'town2', tier: 3,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['poison_frog', 'swamp_tentacle'],
    rareMonsterId: 'swamp_lord',
    groupSizeMin: 1, groupSizeMax: 2,
    // 이전 마을 최상위 사냥터의 성 도전 자격(100회 공략)을 채워야 다음 마을(town2) 전체가 열림
    unlockZoneId: 'ruins_hill',
  },
  canyon: {
    id: 'canyon', name: '채석장 협곡', town: 'town2', tier: 4,
    varianceMin: 0.7, varianceMax: 1.4, // 변동폭 최대 - 매번 다른 협곡
    monsterIds: ['mine_bug', 'beast_miner'],
    rareMonsterId: 'canyon_wyrm',
    groupSizeMin: 1, groupSizeMax: 2,
    unlockZoneId: 'ruins_hill',
  },
  foothills: {
    id: 'foothills', name: '산기슭 지대', town: 'town3', tier: 6,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['mountain_goat', 'highland_bandit'],
    rareMonsterId: 'bandit_captain',
    groupSizeMin: 2, groupSizeMax: 3,
    unlockZoneId: 'canyon',
  },
  ridge: {
    id: 'ridge', name: '험준한 능선', town: 'town3', tier: 7,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['rock_wyvern', 'cliff_ambusher'],
    rareMonsterId: 'griffin_lord',
    groupSizeMin: 1, groupSizeMax: 2,
    unlockZoneId: 'canyon',
  },
  lava_fields: {
    id: 'lava_fields', name: '용암 지대', town: 'town4', tier: 8,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['fire_salamander', 'ash_cultist'],
    rareMonsterId: 'ifrit_lord',
    groupSizeMin: 1, groupSizeMax: 2,
    unlockZoneId: 'ridge',
  },
  sulfur_caves: {
    id: 'sulfur_caves', name: '유황 동굴', town: 'town4', tier: 9,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['sulfur_bat', 'slave_driver'],
    rareMonsterId: 'pit_fiend',
    groupSizeMin: 2, groupSizeMax: 3,
    unlockZoneId: 'ridge',
  },
  ruined_temple: {
    id: 'ruined_temple', name: '무너진 신전', town: 'town5', tier: 10,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['temple_guardian', 'cursed_priest'],
    rareMonsterId: 'fallen_high_priest',
    groupSizeMin: 1, groupSizeMax: 2,
    unlockZoneId: 'sulfur_caves',
  },
  abyss_corridor: {
    id: 'abyss_corridor', name: '심연 회랑', town: 'town5', tier: 11,
    varianceMin: 0.75, varianceMax: 1.4,
    monsterIds: ['abyss_wraith', 'shadow_assassin'],
    rareMonsterId: 'abyss_lord',
    groupSizeMin: 1, groupSizeMax: 2,
    unlockZoneId: 'sulfur_caves',
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

// 유니크몹 - 그 지역의 레어몹(rareMonsterId)과 같은 개체지만 한 단계 더 위. pity 없이 항상 이
// 고정 확률로만 등장(레어처럼 처치할수록 확률이 오르지 않음). 2단계(유니크)/3단계(레전더리) 순으로
// 판정하며, 스탯/보상이 크게 세지는 대신 훨씬 이기기 힘듦
export const UNIQUE_TIER_NAMES = { 1: '레어', 2: '유니크', 3: '레전더리' };
export const UNIQUE_TIER_CHANCES = { 2: 0.004, 3: 0.0008 };
export const UNIQUE_TIER_STAT_MULT = { 1: 1, 2: 1.6, 3: 2.4 };
export const UNIQUE_TIER_REWARD_MULT = { 1: 1, 2: 1.8, 3: 3 };
