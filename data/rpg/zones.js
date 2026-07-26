// 지역 정의 — 나중에 대륙/섬 추가는 이 배열/객체에 항목만 추가하면 됨(코드 수정 불필요)
// varianceMin/Max: 진입시 몹 스탯에 곱해지는 랜덤 배율 범위(협곡이 가장 넓음 = 정보빈곤 컨셉의 핵심)
export const ZONES = {
  meadow: {
    id: 'meadow', name: '해변 저지대', town: 'town1', tier: 1,
    varianceMin: 0.95, varianceMax: 1.05,
    monsterIds: ['slime', 'field_rat', 'wolf_pup'],
    rareMonsterId: 'giant_slime',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  ruins_hill: {
    id: 'ruins_hill', name: '버려진 등대', town: 'town1', tier: 2,
    varianceMin: 0.9, varianceMax: 1.1,
    monsterIds: ['bandit', 'goblin'],
    rareMonsterId: 'goblin_chief',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  swamp: {
    id: 'swamp', name: '항만 습지', town: 'town2', tier: 3,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['poison_frog', 'swamp_tentacle'],
    rareMonsterId: 'swamp_lord',
    groupSizeMin: 1, groupSizeMax: 4,
    // 이전 마을 최상위 사냥터의 성 도전 자격(100회 공략)을 채워야 다음 마을(town2) 전체가 열림
    unlockZoneId: 'ruins_hill',
  },
  canyon: {
    id: 'canyon', name: '채석장 협곡', town: 'town2', tier: 4,
    varianceMin: 0.7, varianceMax: 1.4, // 변동폭 최대 - 매번 다른 협곡
    monsterIds: ['mine_bug', 'beast_miner'],
    rareMonsterId: 'canyon_wyrm',
    groupSizeMin: 1, groupSizeMax: 4,
    unlockZoneId: 'ruins_hill',
  },
  foothills: {
    id: 'foothills', name: '산기슭 지대', town: 'town3', tier: 6,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['mountain_goat', 'highland_bandit'],
    rareMonsterId: 'bandit_captain',
    groupSizeMin: 1, groupSizeMax: 5,
    unlockZoneId: 'canyon',
  },
  ridge: {
    id: 'ridge', name: '험준한 능선', town: 'town3', tier: 7,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['rock_wyvern', 'cliff_ambusher'],
    rareMonsterId: 'griffin_lord',
    groupSizeMin: 1, groupSizeMax: 6,
    unlockZoneId: 'canyon',
  },
  lava_fields: {
    id: 'lava_fields', name: '용암 지대', town: 'town4', tier: 8,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['fire_salamander', 'ash_cultist'],
    rareMonsterId: 'ifrit_lord',
    groupSizeMin: 1, groupSizeMax: 6,
    unlockZoneId: 'ridge',
  },
  sulfur_caves: {
    id: 'sulfur_caves', name: '유황 동굴', town: 'town4', tier: 9,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['sulfur_bat', 'slave_driver'],
    rareMonsterId: 'pit_fiend',
    groupSizeMin: 1, groupSizeMax: 7,
    unlockZoneId: 'ridge',
  },
  ruined_temple: {
    id: 'ruined_temple', name: '무너진 신전', town: 'town5', tier: 10,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['temple_guardian', 'cursed_priest'],
    rareMonsterId: 'fallen_high_priest',
    groupSizeMin: 1, groupSizeMax: 7,
    unlockZoneId: 'sulfur_caves',
  },
  abyss_corridor: {
    id: 'abyss_corridor', name: '심연 회랑', town: 'town5', tier: 11,
    varianceMin: 0.75, varianceMax: 1.4,
    monsterIds: ['abyss_wraith', 'shadow_assassin'],
    rareMonsterId: 'abyss_lord',
    groupSizeMin: 1, groupSizeMax: 7,
    unlockZoneId: 'sulfur_caves',
  },
  dungeon: {
    id: 'dungeon', name: '고대 묘굴', town: null, tier: 5,
    varianceMin: 0.95, varianceMax: 1.1,
    monsterIds: ['skeleton', 'wraith'],
    rareMonsterId: 'dungeon_guardian',
    groupSizeMin: 1, groupSizeMax: 5,
    requiresTorch: true,
    noTeleportScroll: true,
  },

  // ══════════════════════════════════════════════════════════════════════
  // 신규 확장 지역 (town당 8곳 추가 = 40곳) + 신규 던전 2곳
  // town별 신규 몹 풀은 monsters.js 하단의 "신규 확장" 섹션 참고
  // ══════════════════════════════════════════════════════════════════════

  // ── town1 신규 (해변 저지대 계열) — 기존 meadow(t1)/ruins_hill(t2) 사이~바로 위 대역, tier 1~3 ──
  tidal_flat: {
    id: 'tidal_flat', name: '조수 갯벌', town: 'town1', tier: 1,
    varianceMin: 0.95, varianceMax: 1.05,
    monsterIds: ['sand_crab', 'seagull_flock'],
    rareMonsterId: 'crab_king',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  driftwood_cove: {
    id: 'driftwood_cove', name: '유목 해안', town: 'town1', tier: 1,
    varianceMin: 0.95, varianceMax: 1.1,
    monsterIds: ['tide_smuggler', 'driftwood_golem'],
    rareMonsterId: 'smuggler_boss',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  shell_reef: {
    id: 'shell_reef', name: '조개껍질 암초', town: 'town1', tier: 2,
    varianceMin: 0.9, varianceMax: 1.1,
    monsterIds: ['shell_hermit', 'sand_crab', 'seagull_flock'],
    rareMonsterId: 'hermit_elder',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  gull_cliffs: {
    id: 'gull_cliffs', name: '갈매기 절벽', town: 'town1', tier: 2,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['seagull_flock', 'brine_witch'],
    rareMonsterId: 'storm_gull',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  brine_marsh: {
    id: 'brine_marsh', name: '바닷물 늪', town: 'town1', tier: 2,
    varianceMin: 0.9, varianceMax: 1.1,
    monsterIds: ['brine_witch', 'tide_smuggler'],
    rareMonsterId: 'brine_matriarch',
    groupSizeMin: 1, groupSizeMax: 3,
  },
  sunken_wreck: {
    id: 'sunken_wreck', name: '침몰선', town: 'town1', tier: 3,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['driftwood_golem', 'shell_hermit', 'brine_witch'],
    rareMonsterId: 'wreck_captain',
    groupSizeMin: 1, groupSizeMax: 4,
  },
  coastal_watch: {
    id: 'coastal_watch', name: '해안 감시탑', town: 'town1', tier: 3,
    varianceMin: 0.9, varianceMax: 1.1,
    monsterIds: ['tide_smuggler', 'seagull_flock', 'sand_crab'],
    rareMonsterId: 'watch_commander',
    groupSizeMin: 1, groupSizeMax: 4,
  },
  pearl_grotto: {
    id: 'pearl_grotto', name: '진주 동굴', town: 'town1', tier: 3,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['shell_hermit', 'driftwood_golem'],
    rareMonsterId: 'pearl_serpent',
    groupSizeMin: 1, groupSizeMax: 4,
  },

  // ── town2 신규 (항만/채석장) — 기존 swamp(t3)/canyon(t4) 대역, tier 3~5 ──
  harbor_docks: {
    id: 'harbor_docks', name: '항만 부두', town: 'town2', tier: 3,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['harbor_rat_swarm', 'dock_thug'],
    rareMonsterId: 'harbor_overseer',
    groupSizeMin: 1, groupSizeMax: 4,
    unlockZoneId: 'ruins_hill',
  },
  sunken_pier: {
    id: 'sunken_pier', name: '가라앉은 선착장', town: 'town2', tier: 3,
    varianceMin: 0.9, varianceMax: 1.2,
    monsterIds: ['dock_thug', 'harpoon_marauder'],
    rareMonsterId: 'drowned_sailor_king',
    groupSizeMin: 1, groupSizeMax: 4,
  },
  rat_warehouse: {
    id: 'rat_warehouse', name: '쥐떼 창고', town: 'town2', tier: 4,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['harbor_rat_swarm', 'tunnel_stalker', 'dock_thug'],
    rareMonsterId: 'rat_swarm_queen',
    groupSizeMin: 1, groupSizeMax: 4,
  },
  quarry_depths: {
    id: 'quarry_depths', name: '채석장 심층', town: 'town2', tier: 4,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['quarry_brute', 'harpoon_marauder'],
    rareMonsterId: 'quarry_overlord',
    groupSizeMin: 1, groupSizeMax: 4,
  },
  collapsed_shaft: {
    id: 'collapsed_shaft', name: '붕괴된 갱도', town: 'town2', tier: 4,
    varianceMin: 0.75, varianceMax: 1.35,
    monsterIds: ['tunnel_stalker', 'rust_golem'],
    rareMonsterId: 'shaft_horror',
    groupSizeMin: 1, groupSizeMax: 4,
  },
  rusted_foundry: {
    id: 'rusted_foundry', name: '녹슨 제련소', town: 'town2', tier: 5,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['rust_golem', 'quarry_brute'],
    rareMonsterId: 'foundry_golem_prime',
    groupSizeMin: 1, groupSizeMax: 5,
  },
  smugglers_tunnel: {
    id: 'smugglers_tunnel', name: '밀수업자의 땅굴', town: 'town2', tier: 5,
    varianceMin: 0.8, varianceMax: 1.25,
    monsterIds: ['tunnel_stalker', 'harbor_rat_swarm'],
    rareMonsterId: 'kingpin_smuggler',
    groupSizeMin: 1, groupSizeMax: 5,
  },
  flooded_quarry: {
    id: 'flooded_quarry', name: '침수된 채석장', town: 'town2', tier: 5,
    varianceMin: 0.75, varianceMax: 1.35,
    monsterIds: ['harpoon_marauder', 'rust_golem', 'quarry_brute'],
    rareMonsterId: 'flood_serpent',
    groupSizeMin: 1, groupSizeMax: 5,
  },

  // ── town3 신규 (산악) — 기존 foothills(t6)/ridge(t7) 대역, tier 6~8 ──
  hawk_peak: {
    id: 'hawk_peak', name: '매봉우리', town: 'town3', tier: 6,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['mountain_hawk', 'horned_ram'],
    rareMonsterId: 'sky_hawk_matriarch',
    groupSizeMin: 1, groupSizeMax: 5,
    unlockZoneId: 'canyon',
  },
  rope_bridge_pass: {
    id: 'rope_bridge_pass', name: '구름다리 고갯길', town: 'town3', tier: 6,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['rope_bridge_bandit', 'horned_ram'],
    rareMonsterId: 'bridge_warlord',
    groupSizeMin: 1, groupSizeMax: 5,
  },
  troll_den: {
    id: 'troll_den', name: '트롤의 굴', town: 'town3', tier: 7,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['stone_troll', 'horned_ram'],
    rareMonsterId: 'elder_stone_troll',
    groupSizeMin: 1, groupSizeMax: 6,
  },
  frost_ridge: {
    id: 'frost_ridge', name: '서리 능선', town: 'town3', tier: 7,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['avalanche_yeti', 'mountain_hawk'],
    rareMonsterId: 'frost_wyvern',
    groupSizeMin: 1, groupSizeMax: 6,
  },
  shaman_shrine: {
    id: 'shaman_shrine', name: '주술사의 성소', town: 'town3', tier: 7,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['peak_shaman', 'rope_bridge_bandit'],
    rareMonsterId: 'high_shaman',
    groupSizeMin: 1, groupSizeMax: 6,
  },
  yeti_lair: {
    id: 'yeti_lair', name: '예티의 소굴', town: 'town3', tier: 8,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['avalanche_yeti', 'stone_troll'],
    rareMonsterId: 'alpha_yeti',
    groupSizeMin: 1, groupSizeMax: 6,
  },
  thunder_summit: {
    id: 'thunder_summit', name: '천둥 정상', town: 'town3', tier: 8,
    varianceMin: 0.8, varianceMax: 1.35,
    monsterIds: ['mountain_hawk', 'peak_shaman'],
    rareMonsterId: 'thunder_roc',
    groupSizeMin: 1, groupSizeMax: 6,
  },
  ram_horn_valley: {
    id: 'ram_horn_valley', name: '산양뿔 계곡', town: 'town3', tier: 8,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['horned_ram', 'stone_troll', 'rope_bridge_bandit'],
    rareMonsterId: 'ram_king',
    groupSizeMin: 1, groupSizeMax: 6,
  },

  // ── town4 신규 (화산지대) — 기존 lava_fields(t8)/sulfur_caves(t9) 대역, tier 8~10 ──
  magma_flow: {
    id: 'magma_flow', name: '마그마 유역', town: 'town4', tier: 8,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['magma_slug', 'ember_imp'],
    rareMonsterId: 'magma_behemoth',
    groupSizeMin: 1, groupSizeMax: 6,
    unlockZoneId: 'ridge',
  },
  imp_warren: {
    id: 'imp_warren', name: '임프 소굴', town: 'town4', tier: 8,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['ember_imp', 'sulfur_wasp_swarm'],
    rareMonsterId: 'imp_overlord',
    groupSizeMin: 1, groupSizeMax: 6,
  },
  obsidian_spire: {
    id: 'obsidian_spire', name: '흑요석 첨탑', town: 'town4', tier: 9,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['obsidian_guardian', 'magma_slug'],
    rareMonsterId: 'obsidian_colossus',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  cinder_wastes: {
    id: 'cinder_wastes', name: '잿불 황무지', town: 'town4', tier: 9,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['cinder_wolf', 'ember_imp'],
    rareMonsterId: 'cinder_fang_alpha',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  molten_sanctum: {
    id: 'molten_sanctum', name: '용암 성소', town: 'town4', tier: 9,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['molten_priest', 'obsidian_guardian'],
    rareMonsterId: 'molten_archpriest',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  wasp_hive: {
    id: 'wasp_hive', name: '말벌 둥지', town: 'town4', tier: 10,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['sulfur_wasp_swarm', 'cinder_wolf'],
    rareMonsterId: 'wasp_queen',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  ashfall_crater: {
    id: 'ashfall_crater', name: '잿비 분화구', town: 'town4', tier: 10,
    varianceMin: 0.8, varianceMax: 1.35,
    monsterIds: ['magma_slug', 'molten_priest'],
    rareMonsterId: 'ashfall_wyrm',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  brimstone_gate: {
    id: 'brimstone_gate', name: '유황의 문', town: 'town4', tier: 10,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['obsidian_guardian', 'molten_priest', 'ember_imp'],
    rareMonsterId: 'brimstone_warden',
    groupSizeMin: 1, groupSizeMax: 7,
  },

  // ── town5 신규 (고대유적) — 기존 ruined_temple(t10)/abyss_corridor(t11) 대역, tier 10~12 ──
  sentinel_hall: {
    id: 'sentinel_hall', name: '파수병의 전당', town: 'town5', tier: 10,
    varianceMin: 0.85, varianceMax: 1.2,
    monsterIds: ['stone_sentinel', 'bone_archer'],
    rareMonsterId: 'ancient_sentinel_king',
    groupSizeMin: 1, groupSizeMax: 7,
    unlockZoneId: 'sulfur_caves',
  },
  ghoul_crypt: {
    id: 'ghoul_crypt', name: '구울의 지하묘', town: 'town5', tier: 10,
    varianceMin: 0.85, varianceMax: 1.25,
    monsterIds: ['crypt_ghoul', 'stone_sentinel'],
    rareMonsterId: 'ghoul_matriarch',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  wisp_sanctuary: {
    id: 'wisp_sanctuary', name: '도깨비불 성역', town: 'town5', tier: 11,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['relic_wisp', 'void_acolyte'],
    rareMonsterId: 'wisp_swarm_avatar',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  bone_ossuary: {
    id: 'bone_ossuary', name: '뼈의 납골당', town: 'town5', tier: 11,
    varianceMin: 0.8, varianceMax: 1.25,
    monsterIds: ['bone_archer', 'crypt_ghoul'],
    rareMonsterId: 'bone_archon',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  hound_kennel: {
    id: 'hound_kennel', name: '그림자 사냥개의 우리', town: 'town5', tier: 11,
    varianceMin: 0.75, varianceMax: 1.35,
    monsterIds: ['shadow_hound', 'crypt_ghoul'],
    rareMonsterId: 'hound_alpha',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  acolyte_chamber: {
    id: 'acolyte_chamber', name: '신도의 방', town: 'town5', tier: 12,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['void_acolyte', 'relic_wisp'],
    rareMonsterId: 'void_high_priest',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  forgotten_vault: {
    id: 'forgotten_vault', name: '잊혀진 금고', town: 'town5', tier: 12,
    varianceMin: 0.8, varianceMax: 1.3,
    monsterIds: ['stone_sentinel', 'bone_archer', 'void_acolyte'],
    rareMonsterId: 'vault_guardian_wraith',
    groupSizeMin: 1, groupSizeMax: 7,
  },
  starlight_ruins: {
    id: 'starlight_ruins', name: '별빛 폐허', town: 'town5', tier: 12,
    varianceMin: 0.75, varianceMax: 1.4,
    monsterIds: ['shadow_hound', 'relic_wisp'],
    rareMonsterId: 'starlight_revenant',
    groupSizeMin: 1, groupSizeMax: 7,
  },

  // ── 신규 던전 2곳 (town: null, 마을과 무관한 선택 콘텐츠) ──
  dungeon2: {
    id: 'dungeon2', name: '황혼의 지하묘지', town: null, tier: 7,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['grave_wight', 'specter_archer'],
    rareMonsterId: 'crypt_lord',
    groupSizeMin: 1, groupSizeMax: 6,
    requiresTorch: true,
    noTeleportScroll: true,
  },
  dungeon3: {
    id: 'dungeon3', name: '심판의 지하미궁', town: null, tier: 12,
    varianceMin: 0.9, varianceMax: 1.15,
    monsterIds: ['judgment_construct', 'soul_reaper'],
    rareMonsterId: 'eternal_judge',
    groupSizeMin: 1, groupSizeMax: 7,
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
