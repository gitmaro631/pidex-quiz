// 몹 정의 — baseStats는 지역(zone)의 varianceMin~Max로 랜덤 배율 적용 후 사용됨.
// dropTable: { itemId, chance(0~1), qtyMin, qtyMax }
// targetPriority(생략시 'front') - 이 몹이 파티 공격대상을 고르는 방식(rpg-combat.js pickMonsterTarget 참고)
//   front: 진형(전열→중열→후열) 우선순위 그대로 / lowest_hp: 약한 상대부터 마무리(도적/암살자류)
//   highest_atk: 가장 위협적인 상대부터 노림(전술적인 주술사/보스류) / random: 무작위(비행/광포한 개체)
// skills(생략시 없음) - 매 라운드 기본공격 대신 확률+쿨다운으로 나가는 특수기(rpg-combat.js tryMonsterSkill 참고)
export const MONSTERS = {
  slime: {
    id: 'slime', name: '슬라임', element: 'none', tags: ['beast'], rare: false,
    // 예전엔 hp18/atk3 - 레벨1 맨몸 캐릭터가 groupSizeMax 3인 초원에서 승률 10%대까지 떨어지는
    // 문제가 실측(시뮬레이션)으로 확인돼서 초원 3종 전부 하향(체력 대략 40~45%, 공격력 30~35% 감소)
    baseStats: { hp: 10, atk: 2, def: 0 },
    xp: 3, goldMin: 1, goldMax: 3,
    dropTable: [
      { itemId: 'slime_jelly', chance: 0.5, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_small', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
  },
  field_rat: {
    id: 'field_rat', name: '들쥐', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 8, atk: 2, def: 0 },
    xp: 3, goldMin: 1, goldMax: 2,
    dropTable: [
      { itemId: 'rat_tail', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.08, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
  },
  wolf_pup: {
    id: 'wolf_pup', name: '새끼 늑대', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 12, atk: 3, def: 0 },
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
    skills: [{ id: 'acid_burst', name: '산성 파열', type: 'attack_all', chance: 0.25, powerMult: 1.2, cooldownRounds: 3 }],
  },

  // 2~5지역(초원 제외) 몹은 전부 스탯/보상 x1.35 상향됨 - 용병 파티(최대 3인) 플레이를 기준으로
  // 재조정한 값. 초원(meadow)은 튜토리얼 성격이라 손대지 않음.
  bandit: {
    // ranged: true - 활을 쓰는 몹이라 궁수가 화살로 견제해도 무효(원거리 대 원거리)
    id: 'bandit', name: '도적', element: 'none', tags: ['humanoid'], rare: false, ranged: true,
    targetPriority: 'lowest_hp', // 약한 상대부터 노리는 좀도둑 기질
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
    targetPriority: 'highest_atk', // 족장답게 가장 위협적인 상대부터 노림
    baseStats: { hp: 149, atk: 19, def: 5 },
    xp: 41, goldMin: 34, goldMax: 61,
    dropTable: [
      { itemId: 'chief_totem', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.23, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'war_cry', name: '전쟁의 함성', type: 'attack', chance: 0.3, powerMult: 1.8, cooldownRounds: 3 }],
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
    id: 'swamp_lord', name: '늪지의 군주', element: 'water', tags: ['beast'], rare: true, poisonChance: 0.5,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 203, atk: 22, def: 7 },
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'swamp_lord_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.46, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'toxic_wave', name: '맹독 파도', type: 'attack_all', chance: 0.25, powerMult: 1.3, cooldownRounds: 3 }],
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
    targetPriority: 'lowest_hp',
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
    targetPriority: 'random', // 하늘을 나는 개체라 예측 불가능하게 덮침
    baseStats: { hp: 270, atk: 27, def: 8 },
    xp: 74, goldMin: 61, goldMax: 108,
    dropTable: [
      { itemId: 'wyrm_scale', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'wing_gust', name: '날개폭풍', type: 'attack_all', chance: 0.25, powerMult: 1.2, cooldownRounds: 3 }],
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
    targetPriority: 'random', // 형체 없이 떠다니는 개체라 누구를 덮칠지 예측 불가
    baseStats: { hp: 101, atk: 20, def: 4 },
    xp: 24, goldMin: 12, goldMax: 22,
    dropTable: [
      { itemId: 'wraith_essence', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'wail', name: '절규', type: 'attack_all', chance: 0.2, powerMult: 1.1, cooldownRounds: 4 }],
  },
  dungeon_guardian: {
    id: 'dungeon_guardian', name: '던전 수호자', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    targetPriority: 'highest_atk', // 수호자답게 가장 위협적인 침입자부터 처리
    baseStats: { hp: 432, atk: 35, def: 11 },
    xp: 122, goldMin: 108, goldMax: 189,
    dropTable: [
      { itemId: 'guardian_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.58, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'dark_judgement', name: '암흑심판', type: 'attack', chance: 0.3, powerMult: 2, cooldownRounds: 4 },
      { id: 'guardian_mend', name: '수호자의 재생', type: 'heal_self', chance: 0.15, healPct: 0.15, cooldownRounds: 5 },
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
    targetPriority: 'lowest_hp',
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
    targetPriority: 'lowest_hp', // 약해진 상대를 확실히 끝내는 두목
    baseStats: { hp: 560, atk: 46, def: 14 },
    xp: 160, goldMin: 145, goldMax: 250,
    dropTable: [
      { itemId: 'captain_emblem', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.22, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'coup_de_grace', name: '결정타', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  rock_wyvern: {
    id: 'rock_wyvern', name: '바위 와이번', element: 'air', tags: ['beast'], rare: false,
    targetPriority: 'random',
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
    targetPriority: 'lowest_hp',
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
    targetPriority: 'random', // 하늘에서 급강하 - 누구든 덮칠 수 있음
    baseStats: { hp: 730, atk: 60, def: 18 },
    xp: 208, goldMin: 189, goldMax: 325,
    dropTable: [
      { itemId: 'griffin_feather', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'dive_strike', name: '급강하 일격', type: 'attack', chance: 0.3, powerMult: 1.8, cooldownRounds: 4 }],
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
    targetPriority: 'highest_atk', // 가장 강한 자부터 제물로 노리는 광신도
    baseStats: { hp: 220, atk: 42, def: 13 },
    xp: 54, goldMin: 27, goldMax: 49,
    dropTable: [
      { itemId: 'cultist_talisman', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'ember_bolt', name: '불씨 화살', type: 'attack', chance: 0.25, powerMult: 1.4, cooldownRounds: 3 }],
  },
  ifrit_lord: {
    id: 'ifrit_lord', name: '이프리트 군주', element: 'fire', tags: ['demon'], rare: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 950, atk: 78, def: 23 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'ifrit_horn', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'hellfire', name: '지옥불', type: 'attack_all', chance: 0.3, powerMult: 1.4, cooldownRounds: 4 }],
  },
  sulfur_bat: {
    id: 'sulfur_bat', name: '유황 박쥐', element: 'air', tags: ['beast'], rare: false, statusImmune: true,
    targetPriority: 'random',
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
    targetPriority: 'lowest_hp',
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
    targetPriority: 'lowest_hp',
    baseStats: { hp: 1235, atk: 101, def: 30 },
    xp: 351, goldMin: 318, goldMax: 546,
    dropTable: [
      { itemId: 'fiend_brand', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'soul_rend', name: '영혼파괴', type: 'attack', chance: 0.3, powerMult: 2, cooldownRounds: 4 },
      { id: 'fiend_regen', name: '마인의 재생', type: 'heal_self', chance: 0.15, healPct: 0.12, cooldownRounds: 5 },
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
    targetPriority: 'highest_atk',
    baseStats: { hp: 340, atk: 66, def: 18 },
    xp: 86, goldMin: 43, goldMax: 77,
    dropTable: [
      { itemId: 'cursed_rosary', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'curse_bolt', name: '저주의 구슬', type: 'attack', chance: 0.25, powerMult: 1.4, cooldownRounds: 3 },
      { id: 'unholy_mend', name: '사악한 치유', type: 'heal_self', chance: 0.15, healPct: 0.15, cooldownRounds: 5 },
    ],
  },
  fallen_high_priest: {
    id: 'fallen_high_priest', name: '타락한 대신관', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 1605, atk: 131, def: 39 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'high_priest_relic', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'dark_smite', name: '암흑의 심판', type: 'attack', chance: 0.3, powerMult: 1.8, cooldownRounds: 4 },
      { id: 'unholy_heal', name: '사악한 치유', type: 'heal_self', chance: 0.2, healPct: 0.15, cooldownRounds: 4 },
    ],
  },
  abyss_wraith: {
    id: 'abyss_wraith', name: '심연의 망령', element: 'dark', tags: ['undead'], rare: false, statusImmune: true, ranged: true,
    targetPriority: 'random',
    baseStats: { hp: 390, atk: 76, def: 22 },
    xp: 98, goldMin: 50, goldMax: 89,
    dropTable: [
      { itemId: 'abyss_essence', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'wail', name: '절규', type: 'attack_all', chance: 0.2, powerMult: 1.15, cooldownRounds: 4 }],
  },
  shadow_assassin: {
    id: 'shadow_assassin', name: '그림자 암살자', element: 'dark', tags: ['humanoid'], rare: false, ambushChance: 0.35,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 420, atk: 88, def: 20 },
    xp: 108, goldMin: 55, goldMax: 98,
    dropTable: [
      { itemId: 'assassin_blade_shard', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'backstab', name: '기습 일격', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  abyss_lord: {
    id: 'abyss_lord', name: '심연의 군주', element: 'dark', tags: ['demon'], rare: true, statusImmune: true, ranged: true,
    targetPriority: 'lowest_hp', // 최종보스급 - 약해진 상대를 가차없이 끝냄
    baseStats: { hp: 2085, atk: 170, def: 51 },
    xp: 593, goldMin: 537, goldMax: 923,
    dropTable: [
      { itemId: 'abyss_lord_seal', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.6, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'abyssal_wave', name: '심연의 파도', type: 'attack_all', chance: 0.3, powerMult: 1.5, cooldownRounds: 4 },
      { id: 'void_strike', name: '공허의 일격', type: 'attack', chance: 0.25, powerMult: 2.2, cooldownRounds: 4 },
    ],
  },

  // ── 방랑하는 골드주머니 고블린 - 어느 지역에서든 아주 낮은 확률로 등장(rpg-combat.js rollEncounter의
  // GOLD_POUCH_GOBLIN_CHANCE 참고). 체력/공격력은 낮아 한두 대면 죽지만, acBonus로 회피력(명중난이도)이
  // 극단적으로 높아서 명중률(공격보정)이 높거나 추가타(2연타) 확률이 높은 캐릭/용병이 있어야 겨우 맞힐 수 있음
  gold_pouch_goblin: {
    id: 'gold_pouch_goblin', name: '골드주머니 고블린', element: 'none', tags: ['humanoid'], rare: false,
    targetPriority: 'random',
    acBonus: 10, // 지역 tier 기반 기본 AC에 이만큼 추가 - 회피의 화신
    baseStats: { hp: 20, atk: 4, def: 1 },
    xp: 30, goldMin: 90, goldMax: 160,
    dropTable: [
      { itemId: 'gold_pouch', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.3, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 신규 확장 몹 — town당 일반몹 6종(공용 풀, 신규 지역 8곳에 조합으로 재사용) +
  // 신규 지역마다 전용 레어몹 1종 + 신규 던전 2곳(각 일반몹 2종 + 레어몹 1종)
  // ══════════════════════════════════════════════════════════════════════

  // ── town1 신규 (해변 저지대 계열) 일반몹 ──
  sand_crab: {
    // 두꺼운 등딱지 - 방어형 몸빵, 특별한 기믹 없이 묵직하게 버팀
    id: 'sand_crab', name: '모래게', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 57, atk: 7, def: 4 },
    xp: 9, goldMin: 5, goldMax: 10,
    dropTable: [
      { itemId: 'crab_shell', chance: 0.48, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_small', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.04, qtyMin: 1, qtyMax: 1 },
    ],
  },
  seagull_flock: {
    id: 'seagull_flock', name: '갈매기 떼', element: 'none', tags: ['beast'], rare: false,
    targetPriority: 'random', // 어지럽게 날아다니며 아무나 덮침
    baseStats: { hp: 37, atk: 10, def: 1 },
    xp: 9, goldMin: 5, goldMax: 10,
    dropTable: [
      { itemId: 'gull_feather', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.04, qtyMin: 1, qtyMax: 1 },
    ],
  },
  tide_smuggler: {
    // ranged: true - 석궁으로 견제하는 밀수꾼
    id: 'tide_smuggler', name: '밀수꾼', element: 'none', tags: ['humanoid'], rare: false, ranged: true, ambushChance: 0.25,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 40, atk: 11, def: 1 },
    xp: 10, goldMin: 8, goldMax: 15, // 밀수꾼답게 골드를 두둑히 흘림
    dropTable: [
      { itemId: 'smuggled_goods', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  shell_hermit: {
    id: 'shell_hermit', name: '소라게 은둔자', element: 'none', tags: ['beast'], rare: false,
    acBonus: 8, // 껍질 속에 숨는 회피형
    baseStats: { hp: 38, atk: 9, def: 2 },
    xp: 9, goldMin: 5, goldMax: 11,
    dropTable: [
      { itemId: 'hermit_shell', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.04, qtyMin: 1, qtyMax: 1 },
    ],
  },
  driftwood_golem: {
    id: 'driftwood_golem', name: '유목 골렘', element: 'none', tags: ['beast'], rare: false, statusImmune: true,
    baseStats: { hp: 62, atk: 8, def: 5 },
    xp: 10, goldMin: 5, goldMax: 10,
    dropTable: [
      { itemId: 'driftwood_chunk', chance: 0.45, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.09, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.04, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'heavy_smash', name: '유목 강타', type: 'attack', chance: 0.2, powerMult: 1.6, cooldownRounds: 4 }],
  },
  brine_witch: {
    id: 'brine_witch', name: '바닷물 마녀', element: 'water', tags: ['humanoid'], rare: false, ranged: true, poisonChance: 0.3,
    baseStats: { hp: 36, atk: 10, def: 1 },
    xp: 10, goldMin: 6, goldMax: 12,
    dropTable: [
      { itemId: 'brine_essence', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'brine_wave', name: '바닷물 파도', type: 'attack_all', chance: 0.2, powerMult: 1.15, cooldownRounds: 4 }],
  },

  // ── town1 신규 지역별 레어몹 ──
  crab_king: {
    id: 'crab_king', name: '게 왕', element: 'none', tags: ['beast'], rare: true,
    baseStats: { hp: 90, atk: 10, def: 5 },
    xp: 20, goldMin: 15, goldMax: 30,
    dropTable: [
      { itemId: 'crab_king_claw', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.3, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'claw_crush', name: '집게 분쇄', type: 'attack', chance: 0.3, powerMult: 1.7, cooldownRounds: 3 }],
  },
  smuggler_boss: {
    id: 'smuggler_boss', name: '밀수단 두목', element: 'none', tags: ['humanoid'], rare: true, ranged: true, ambushChance: 0.3,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 65, atk: 13, def: 2 },
    xp: 20, goldMin: 15, goldMax: 30,
    dropTable: [
      { itemId: 'smuggler_ledger', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_small', chance: 0.3, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'ambush_volley', name: '매복 사격', type: 'attack', chance: 0.3, powerMult: 1.6, cooldownRounds: 3 }],
  },
  hermit_elder: {
    id: 'hermit_elder', name: '은둔 장로', element: 'none', tags: ['beast'], rare: true,
    acBonus: 10,
    baseStats: { hp: 140, atk: 15, def: 6 },
    xp: 41, goldMin: 34, goldMax: 61,
    dropTable: [
      { itemId: 'ancient_pearl', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'shell_regen', name: '껍질 재생', type: 'heal_self', chance: 0.2, healPct: 0.12, cooldownRounds: 5 }],
  },
  storm_gull: {
    id: 'storm_gull', name: '폭풍 갈매기', element: 'air', tags: ['beast'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 135, atk: 22, def: 5 },
    xp: 41, goldMin: 34, goldMax: 61,
    dropTable: [
      { itemId: 'storm_feather', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'wing_storm', name: '날개 폭풍', type: 'attack_all', chance: 0.25, powerMult: 1.2, cooldownRounds: 3 }],
  },
  brine_matriarch: {
    id: 'brine_matriarch', name: '바닷물 마녀 대모', element: 'water', tags: ['humanoid'], rare: true, ranged: true, poisonChance: 0.5,
    baseStats: { hp: 150, atk: 18, def: 4 },
    xp: 41, goldMin: 34, goldMax: 61,
    dropTable: [
      { itemId: 'brine_matriarch_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'toxic_tide', name: '맹독 조류', type: 'attack_all', chance: 0.25, powerMult: 1.25, cooldownRounds: 3 }],
  },
  wreck_captain: {
    id: 'wreck_captain', name: '침몰선 선장 유령', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 195, atk: 26, def: 7 },
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'captain_ghost_lantern', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'ghostly_curse', name: '유령의 저주', type: 'attack', chance: 0.3, powerMult: 1.7, cooldownRounds: 3 }],
  },
  watch_commander: {
    id: 'watch_commander', name: '감시대장', element: 'none', tags: ['humanoid'], rare: true, ranged: true,
    targetPriority: 'highest_atk', // 전술적으로 가장 위협적인 상대부터 지휘
    baseStats: { hp: 210, atk: 25, def: 9 },
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'commander_badge', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'rally_strike', name: '집결의 일격', type: 'attack', chance: 0.3, powerMult: 1.8, cooldownRounds: 4 }],
  },
  pearl_serpent: {
    id: 'pearl_serpent', name: '진주 이무기', element: 'water', tags: ['beast'], rare: true, poisonChance: 0.3,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 200, atk: 24, def: 6 },
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'serpent_pearl', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'pearl_venom_bite', name: '진주독니', type: 'attack', chance: 0.25, powerMult: 1.6, cooldownRounds: 3 }],
  },

  // ── town2 신규 (항만/채석장) 일반몹 ──
  harbor_rat_swarm: {
    id: 'harbor_rat_swarm', name: '항만 쥐떼', element: 'none', tags: ['beast'], rare: false,
    targetPriority: 'random', // 떼로 몰려들어 아무나 물어뜯음
    baseStats: { hp: 70, atk: 13, def: 3 },
    xp: 16, goldMin: 8, goldMax: 14,
    dropTable: [
      { itemId: 'rat_swarm_fur', chance: 0.46, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_medium', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  dock_thug: {
    id: 'dock_thug', name: '부두 건달', element: 'none', tags: ['humanoid'], rare: false, ambushChance: 0.2,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 72, atk: 16, def: 4 },
    xp: 17, goldMin: 10, goldMax: 18,
    dropTable: [
      { itemId: 'dock_thug_club', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.11, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  harpoon_marauder: {
    id: 'harpoon_marauder', name: '작살잡이 약탈자', element: 'none', tags: ['humanoid'], rare: false, ranged: true,
    targetPriority: 'highest_atk', // 가장 위협적인 상대를 작살로 노림
    baseStats: { hp: 68, atk: 18, def: 3 },
    xp: 18, goldMin: 9, goldMax: 16,
    dropTable: [
      { itemId: 'broken_harpoon', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.11, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  quarry_brute: {
    id: 'quarry_brute', name: '채석장 거인', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 98, atk: 11, def: 7 },
    xp: 18, goldMin: 9, goldMax: 16,
    dropTable: [
      { itemId: 'quarry_stone', chance: 0.48, qtyMin: 1, qtyMax: 2 },
      { itemId: 'bag_medium', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_uncommon', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  tunnel_stalker: {
    id: 'tunnel_stalker', name: '갱도 잠복자', element: 'none', tags: ['beast'], rare: false, ambushChance: 0.3,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 65, atk: 17, def: 3 },
    xp: 18, goldMin: 9, goldMax: 17,
    dropTable: [
      { itemId: 'stalker_cloak', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
  },
  rust_golem: {
    id: 'rust_golem', name: '녹슨 골렘', element: 'none', tags: ['beast'], rare: false, statusImmune: true,
    baseStats: { hp: 100, atk: 13, def: 8 },
    xp: 18, goldMin: 9, goldMax: 16,
    dropTable: [
      { itemId: 'rusted_gear', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.03, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'rusty_slam', name: '녹슨 강타', type: 'attack', chance: 0.2, powerMult: 1.6, cooldownRounds: 4 }],
  },

  // ── town2 신규 지역별 레어몹 ──
  harbor_overseer: {
    id: 'harbor_overseer', name: '항만 감독관', element: 'none', tags: ['humanoid'], rare: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 195, atk: 27, def: 7 },
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'harbor_overseer_seal', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'overseer_order', name: '감독관의 명령', type: 'attack', chance: 0.3, powerMult: 1.7, cooldownRounds: 3 }],
  },
  drowned_sailor_king: {
    id: 'drowned_sailor_king', name: '익사한 선원왕', element: 'water', tags: ['undead'], rare: true, statusImmune: true,
    targetPriority: 'random',
    baseStats: { hp: 210, atk: 20, def: 8 },
    xp: 54, goldMin: 47, goldMax: 81,
    dropTable: [
      { itemId: 'drowned_crown', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_medium', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'drowning_grasp', name: '익사의 손아귀', type: 'attack', chance: 0.25, powerMult: 1.6, cooldownRounds: 3 }],
  },
  rat_swarm_queen: {
    id: 'rat_swarm_queen', name: '쥐떼의 여왕', element: 'none', tags: ['beast'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 260, atk: 30, def: 7 },
    xp: 74, goldMin: 61, goldMax: 108,
    dropTable: [
      { itemId: 'rat_queen_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'swarm_bite', name: '무리 물어뜯기', type: 'attack_all', chance: 0.25, powerMult: 1.2, cooldownRounds: 3 }],
  },
  quarry_overlord: {
    id: 'quarry_overlord', name: '채석장 지배자', element: 'none', tags: ['humanoid'], rare: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 300, atk: 24, def: 12 },
    xp: 74, goldMin: 61, goldMax: 108,
    dropTable: [
      { itemId: 'quarry_overlord_pick', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'overlord_crush', name: '지배자의 분쇄', type: 'attack', chance: 0.3, powerMult: 1.8, cooldownRounds: 4 }],
  },
  shaft_horror: {
    id: 'shaft_horror', name: '갱도의 공포', element: 'none', tags: ['beast'], rare: true, ambushChance: 0.3,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 255, atk: 32, def: 7 },
    xp: 74, goldMin: 61, goldMax: 108,
    dropTable: [
      { itemId: 'shaft_horror_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'cave_in', name: '생매장', type: 'attack', chance: 0.25, powerMult: 1.9, cooldownRounds: 4 }],
  },
  foundry_golem_prime: {
    id: 'foundry_golem_prime', name: '제련소 골렘 프라임', element: 'none', tags: ['beast'], rare: true, statusImmune: true,
    baseStats: { hp: 460, atk: 32, def: 15 },
    xp: 122, goldMin: 108, goldMax: 189,
    dropTable: [
      { itemId: 'foundry_golem_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'molten_press', name: '용융 압착', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  kingpin_smuggler: {
    id: 'kingpin_smuggler', name: '밀수 조직의 보스', element: 'none', tags: ['humanoid'], rare: true, ranged: true, ambushChance: 0.35,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 400, atk: 40, def: 9 },
    xp: 122, goldMin: 108, goldMax: 189,
    dropTable: [
      { itemId: 'kingpin_ledger', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'kingpin_ambush', name: '보스의 매복', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  flood_serpent: {
    id: 'flood_serpent', name: '범람의 이무기', element: 'water', tags: ['beast'], rare: true, poisonChance: 0.3,
    targetPriority: 'random',
    baseStats: { hp: 420, atk: 36, def: 11 },
    xp: 122, goldMin: 108, goldMax: 189,
    dropTable: [
      { itemId: 'flood_serpent_scale', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'flood_surge', name: '범람의 급류', type: 'attack_all', chance: 0.3, powerMult: 1.35, cooldownRounds: 4 }],
  },

  // ── town3 신규 (산악) 일반몹 ──
  mountain_hawk: {
    id: 'mountain_hawk', name: '산악 매', element: 'air', tags: ['beast'], rare: false,
    targetPriority: 'random', // 하늘에서 급강하 - 예측 불가
    baseStats: { hp: 145, atk: 33, def: 7 },
    xp: 35, goldMin: 17, goldMax: 30,
    dropTable: [
      { itemId: 'hawk_talon', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.13, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  rope_bridge_bandit: {
    id: 'rope_bridge_bandit', name: '구름다리 산적', element: 'none', tags: ['humanoid'], rare: false, ranged: true, ambushChance: 0.25,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 150, atk: 34, def: 8 },
    xp: 37, goldMin: 22, goldMax: 38, // 산적답게 골드를 두둑히 흘림
    dropTable: [
      { itemId: 'frayed_rope', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.13, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },
  stone_troll: {
    id: 'stone_troll', name: '돌 트롤', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 210, atk: 26, def: 15 },
    xp: 38, goldMin: 19, goldMax: 33,
    dropTable: [
      { itemId: 'troll_hide', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.14, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'boulder_smash', name: '바위 강타', type: 'attack', chance: 0.2, powerMult: 1.7, cooldownRounds: 4 }],
  },
  avalanche_yeti: {
    id: 'avalanche_yeti', name: '설산 예티', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 190, atk: 32, def: 10 },
    xp: 38, goldMin: 19, goldMax: 34,
    dropTable: [
      { itemId: 'yeti_fur', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.14, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'icy_roar', name: '얼음 포효', type: 'attack_all', chance: 0.2, powerMult: 1.2, cooldownRounds: 4 }],
  },
  peak_shaman: {
    id: 'peak_shaman', name: '산정 주술사', element: 'air', tags: ['humanoid'], rare: false, ranged: true,
    targetPriority: 'highest_atk', // 가장 위협적인 상대부터 노리는 전술형 주술사
    baseStats: { hp: 140, atk: 36, def: 7 },
    xp: 38, goldMin: 19, goldMax: 34,
    dropTable: [
      { itemId: 'shaman_totem_shard', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.14, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'storm_call', name: '폭풍 소환', type: 'attack_all', chance: 0.22, powerMult: 1.25, cooldownRounds: 4 }],
  },
  horned_ram: {
    id: 'horned_ram', name: '뿔산양', element: 'none', tags: ['beast'], rare: false,
    baseStats: { hp: 160, atk: 34, def: 9 },
    xp: 37, goldMin: 18, goldMax: 32,
    dropTable: [
      { itemId: 'ram_horn', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.13, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // ── town3 신규 지역별 레어몹 ──
  sky_hawk_matriarch: {
    id: 'sky_hawk_matriarch', name: '하늘매 대모', element: 'air', tags: ['beast'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 540, atk: 50, def: 13 },
    xp: 160, goldMin: 145, goldMax: 250,
    dropTable: [
      { itemId: 'sky_hawk_feather', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'talon_dive', name: '발톱 급강하', type: 'attack_all', chance: 0.3, powerMult: 1.4, cooldownRounds: 4 }],
  },
  bridge_warlord: {
    id: 'bridge_warlord', name: '구름다리 전쟁군주', element: 'none', tags: ['humanoid'], rare: true, ranged: true, ambushChance: 0.25,
    targetPriority: 'highest_atk',
    baseStats: { hp: 580, atk: 52, def: 15 },
    xp: 160, goldMin: 145, goldMax: 250,
    dropTable: [
      { itemId: 'bridge_warlord_banner', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'warlord_strike', name: '전쟁군주의 일격', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  elder_stone_troll: {
    id: 'elder_stone_troll', name: '늙은 돌 트롤', element: 'none', tags: ['beast'], rare: true,
    baseStats: { hp: 780, atk: 55, def: 22 },
    xp: 208, goldMin: 189, goldMax: 325,
    dropTable: [
      { itemId: 'elder_troll_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'ground_pound', name: '대지분쇄', type: 'attack', chance: 0.25, powerMult: 1.8, cooldownRounds: 4 },
      { id: 'stone_regen', name: '돌의 재생', type: 'heal_self', chance: 0.15, healPct: 0.13, cooldownRounds: 5 },
    ],
  },
  frost_wyvern: {
    id: 'frost_wyvern', name: '서리 와이번', element: 'air', tags: ['beast'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 720, atk: 64, def: 17 },
    xp: 208, goldMin: 189, goldMax: 325,
    dropTable: [
      { itemId: 'frost_wyvern_scale', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'frost_breath', name: '서리 숨결', type: 'attack_all', chance: 0.3, powerMult: 1.4, cooldownRounds: 4 }],
  },
  high_shaman: {
    id: 'high_shaman', name: '대주술사', element: 'air', tags: ['humanoid'], rare: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 700, atk: 62, def: 16 },
    xp: 208, goldMin: 189, goldMax: 325,
    dropTable: [
      { itemId: 'high_shaman_staff_head', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'arcane_tempest', name: '비전 폭풍', type: 'attack_all', chance: 0.28, powerMult: 1.35, cooldownRounds: 4 }],
  },
  alpha_yeti: {
    id: 'alpha_yeti', name: '우두머리 예티', element: 'none', tags: ['beast'], rare: true,
    baseStats: { hp: 1000, atk: 72, def: 27 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'alpha_yeti_pelt', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'avalanche_slam', name: '눈사태 강타', type: 'attack_all', chance: 0.3, powerMult: 1.4, cooldownRounds: 4 }],
  },
  thunder_roc: {
    id: 'thunder_roc', name: '천둥 로크', element: 'air', tags: ['beast'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 920, atk: 86, def: 20 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'thunder_roc_feather', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'thunder_strike', name: '천둥의 일격', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  ram_king: {
    id: 'ram_king', name: '산양의 왕', element: 'none', tags: ['beast'], rare: true,
    baseStats: { hp: 1010, atk: 75, def: 25 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'ram_king_horn', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.35, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'ram_charge', name: '돌진 박치기', type: 'attack', chance: 0.3, powerMult: 1.85, cooldownRounds: 4 }],
  },

  // ── town4 신규 (화산지대) 일반몹 ──
  magma_slug: {
    id: 'magma_slug', name: '마그마 슬러그', element: 'fire', tags: ['beast'], rare: false,
    baseStats: { hp: 310, atk: 40, def: 22 },
    xp: 62, goldMin: 30, goldMax: 54,
    dropTable: [
      { itemId: 'magma_residue', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  ember_imp: {
    id: 'ember_imp', name: '불씨 임프', element: 'fire', tags: ['demon'], rare: false, ranged: true,
    targetPriority: 'random', // 재빠르게 날아다니며 아무나 노림
    baseStats: { hp: 210, atk: 58, def: 10 },
    xp: 64, goldMin: 33, goldMax: 58,
    dropTable: [
      { itemId: 'imp_horn', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  obsidian_guardian: {
    id: 'obsidian_guardian', name: '흑요석 수호병', element: 'fire', tags: ['beast'], rare: false, statusImmune: true,
    baseStats: { hp: 320, atk: 44, def: 24 },
    xp: 66, goldMin: 33, goldMax: 60,
    dropTable: [
      { itemId: 'obsidian_shard', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.09, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'obsidian_slam', name: '흑요석 강타', type: 'attack', chance: 0.2, powerMult: 1.7, cooldownRounds: 4 }],
  },
  cinder_wolf: {
    id: 'cinder_wolf', name: '잿불 늑대', element: 'fire', tags: ['beast'], rare: false,
    targetPriority: 'lowest_hp', // 무리지어 약한 상대부터 물어뜯음
    baseStats: { hp: 240, atk: 56, def: 12 },
    xp: 64, goldMin: 32, goldMax: 58,
    dropTable: [
      { itemId: 'cinder_pelt', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  molten_priest: {
    id: 'molten_priest', name: '용암의 사제', element: 'fire', tags: ['humanoid'], rare: false, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 230, atk: 54, def: 13 },
    xp: 66, goldMin: 33, goldMax: 60,
    dropTable: [
      { itemId: 'molten_relic', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.17, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.09, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'molten_mend', name: '용암의 치유', type: 'heal_self', chance: 0.15, healPct: 0.13, cooldownRounds: 5 }],
  },
  sulfur_wasp_swarm: {
    id: 'sulfur_wasp_swarm', name: '유황 말벌떼', element: 'air', tags: ['beast'], rare: false, poisonChance: 0.35,
    targetPriority: 'random',
    baseStats: { hp: 215, atk: 52, def: 11 },
    xp: 63, goldMin: 32, goldMax: 57,
    dropTable: [
      { itemId: 'wasp_stinger', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.16, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },

  // ── town4 신규 지역별 레어몹 ──
  magma_behemoth: {
    id: 'magma_behemoth', name: '마그마 거수', element: 'fire', tags: ['beast'], rare: true,
    baseStats: { hp: 1050, atk: 70, def: 28 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'magma_behemoth_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'magma_eruption', name: '마그마 분출', type: 'attack_all', chance: 0.3, powerMult: 1.4, cooldownRounds: 4 }],
  },
  imp_overlord: {
    id: 'imp_overlord', name: '임프 대공', element: 'fire', tags: ['demon'], rare: true, ranged: true,
    targetPriority: 'random',
    baseStats: { hp: 880, atk: 92, def: 18 },
    xp: 270, goldMin: 245, goldMax: 420,
    dropTable: [
      { itemId: 'imp_overlord_horn', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'infernal_barrage', name: '지옥의 연발탄', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  obsidian_colossus: {
    id: 'obsidian_colossus', name: '흑요석 거상', element: 'fire', tags: ['beast'], rare: true, statusImmune: true,
    baseStats: { hp: 1350, atk: 92, def: 38 },
    xp: 351, goldMin: 318, goldMax: 546,
    dropTable: [
      { itemId: 'obsidian_colossus_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'colossal_smash', name: '거상의 강타', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  cinder_fang_alpha: {
    id: 'cinder_fang_alpha', name: '잿불 무리의 우두머리', element: 'fire', tags: ['beast'], rare: true, ambushChance: 0.25,
    targetPriority: 'lowest_hp', // 무리의 우두머리답게 스킬 없이 순수한 수와 기습으로 압박
    baseStats: { hp: 1180, atk: 115, def: 25 },
    xp: 351, goldMin: 318, goldMax: 546,
    dropTable: [
      { itemId: 'cinder_alpha_fang', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
  },
  molten_archpriest: {
    id: 'molten_archpriest', name: '용암 대사제', element: 'fire', tags: ['humanoid'], rare: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 1150, atk: 108, def: 27 },
    xp: 351, goldMin: 318, goldMax: 546,
    dropTable: [
      { itemId: 'molten_archpriest_censer', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'sacred_flame', name: '신성한 불꽃', type: 'attack', chance: 0.25, powerMult: 1.9, cooldownRounds: 4 },
      { id: 'archpriest_mend', name: '대사제의 치유', type: 'heal_self', chance: 0.15, healPct: 0.15, cooldownRounds: 5 },
    ],
  },
  wasp_queen: {
    id: 'wasp_queen', name: '말벌 여왕', element: 'air', tags: ['beast'], rare: true, poisonChance: 0.5,
    targetPriority: 'random',
    baseStats: { hp: 1550, atk: 120, def: 35 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'wasp_queen_stinger', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'stinger_swarm', name: '독침 떼공격', type: 'attack_all', chance: 0.3, powerMult: 1.4, cooldownRounds: 4 }],
  },
  ashfall_wyrm: {
    id: 'ashfall_wyrm', name: '잿비의 와이번', element: 'fire', tags: ['beast'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 1600, atk: 128, def: 37 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'ashfall_wyrm_scale', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'ashfall_breath', name: '잿비 숨결', type: 'attack_all', chance: 0.3, powerMult: 1.45, cooldownRounds: 4 }],
  },
  brimstone_warden: {
    id: 'brimstone_warden', name: '유황문 파수병', element: 'fire', tags: ['demon'], rare: true, statusImmune: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 1700, atk: 118, def: 45 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'brimstone_warden_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'brimstone_judgement', name: '유황의 심판', type: 'attack', chance: 0.3, powerMult: 2, cooldownRounds: 4 }],
  },

  // ── town5 신규 (고대유적) 일반몹 ──
  stone_sentinel: {
    id: 'stone_sentinel', name: '석상 파수병', element: 'dark', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 480, atk: 68, def: 30 },
    xp: 100, goldMin: 50, goldMax: 90,
    dropTable: [
      { itemId: 'sentinel_rubble', chance: 0.46, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  crypt_ghoul: {
    id: 'crypt_ghoul', name: '묘지 구울', element: 'dark', tags: ['undead'], rare: false, ambushChance: 0.2,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 390, atk: 92, def: 18 },
    xp: 104, goldMin: 55, goldMax: 96,
    dropTable: [
      { itemId: 'ghoul_claw', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  relic_wisp: {
    id: 'relic_wisp', name: '유물의 도깨비불', element: 'dark', tags: ['undead'], rare: false, ranged: true,
    targetPriority: 'random',
    baseStats: { hp: 360, atk: 90, def: 16 },
    xp: 103, goldMin: 53, goldMax: 94,
    dropTable: [
      { itemId: 'wisp_flame', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },
  bone_archer: {
    id: 'bone_archer', name: '해골 궁수', element: 'dark', tags: ['undead'], rare: false, statusImmune: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 380, atk: 96, def: 19 },
    xp: 105, goldMin: 55, goldMax: 96,
    dropTable: [
      { itemId: 'bone_arrowhead', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },
  shadow_hound: {
    id: 'shadow_hound', name: '그림자 사냥개', element: 'dark', tags: ['beast'], rare: false, ambushChance: 0.25,
    targetPriority: 'lowest_hp', // 무리지어 약한 상대부터 사냥
    baseStats: { hp: 370, atk: 94, def: 17 },
    xp: 104, goldMin: 54, goldMax: 95,
    dropTable: [
      { itemId: 'hound_fang', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
  },
  void_acolyte: {
    id: 'void_acolyte', name: '공허의 신도', element: 'dark', tags: ['humanoid'], rare: false, ranged: true,
    baseStats: { hp: 350, atk: 88, def: 15 },
    xp: 104, goldMin: 54, goldMax: 95,
    dropTable: [
      { itemId: 'acolyte_seal', chance: 0.42, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.19, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.07, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'void_mend', name: '공허의 치유', type: 'heal_self', chance: 0.15, healPct: 0.13, cooldownRounds: 5 }],
  },

  // ── town5 신규 지역별 레어몹 ──
  ancient_sentinel_king: {
    id: 'ancient_sentinel_king', name: '고대 파수병왕', element: 'dark', tags: ['undead'], rare: true, statusImmune: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 1750, atk: 122, def: 48 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'ancient_sentinel_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'kings_judgement', name: '왕의 심판', type: 'attack', chance: 0.3, powerMult: 1.9, cooldownRounds: 4 }],
  },
  ghoul_matriarch: {
    id: 'ghoul_matriarch', name: '구울의 여왕', element: 'dark', tags: ['undead'], rare: true, ambushChance: 0.3,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 1550, atk: 140, def: 33 },
    xp: 456, goldMin: 413, goldMax: 710,
    dropTable: [
      { itemId: 'ghoul_matriarch_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'ghoulish_frenzy', name: '구울의 광란', type: 'attack', chance: 0.3, powerMult: 2, cooldownRounds: 4 }],
  },
  wisp_swarm_avatar: {
    id: 'wisp_swarm_avatar', name: '도깨비불 군체의 화신', element: 'dark', tags: ['undead'], rare: true, ranged: true,
    targetPriority: 'random',
    baseStats: { hp: 2000, atk: 165, def: 45 },
    xp: 593, goldMin: 537, goldMax: 923,
    dropTable: [
      { itemId: 'wisp_avatar_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.22, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'wisp_barrage', name: '도깨비불 난사', type: 'attack_all', chance: 0.3, powerMult: 1.45, cooldownRounds: 4 }],
  },
  bone_archon: {
    id: 'bone_archon', name: '해골 대군', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 2100, atk: 178, def: 55 },
    xp: 593, goldMin: 537, goldMax: 923,
    dropTable: [
      { itemId: 'bone_archon_skull', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.22, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'archon_volley', name: '대군의 사격', type: 'attack', chance: 0.3, powerMult: 2, cooldownRounds: 4 }],
  },
  hound_alpha: {
    id: 'hound_alpha', name: '그림자 사냥개 우두머리', element: 'dark', tags: ['beast'], rare: true, ambushChance: 0.35,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 2000, atk: 190, def: 40 },
    xp: 593, goldMin: 537, goldMax: 923,
    dropTable: [
      { itemId: 'hound_alpha_fang', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.22, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'pack_rend', name: '무리의 파열', type: 'attack', chance: 0.3, powerMult: 2.1, cooldownRounds: 4 }],
  },
  void_high_priest: {
    id: 'void_high_priest', name: '공허의 대사제', element: 'dark', tags: ['humanoid'], rare: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 2600, atk: 210, def: 60 },
    xp: 770, goldMin: 700, goldMax: 1200,
    dropTable: [
      { itemId: 'void_high_priest_relic', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.6, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'void_smite', name: '공허의 심판', type: 'attack', chance: 0.28, powerMult: 2, cooldownRounds: 4 },
      { id: 'high_priest_mend', name: '대사제의 치유', type: 'heal_self', chance: 0.18, healPct: 0.15, cooldownRounds: 4 },
    ],
  },
  vault_guardian_wraith: {
    id: 'vault_guardian_wraith', name: '금고의 수호 망령', element: 'dark', tags: ['undead'], rare: true, statusImmune: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 2850, atk: 200, def: 70 },
    xp: 770, goldMin: 700, goldMax: 1200,
    dropTable: [
      { itemId: 'vault_wraith_key', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.6, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'vault_seal_strike', name: '봉인의 일격', type: 'attack', chance: 0.3, powerMult: 2, cooldownRounds: 4 }],
  },
  starlight_revenant: {
    id: 'starlight_revenant', name: '별빛의 부활자', element: 'dark', tags: ['undead'], rare: true,
    targetPriority: 'random',
    baseStats: { hp: 2700, atk: 225, def: 63 },
    xp: 770, goldMin: 700, goldMax: 1200,
    dropTable: [
      { itemId: 'starlight_revenant_core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.6, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'starlight_burst', name: '별빛 폭발', type: 'attack_all', chance: 0.3, powerMult: 1.5, cooldownRounds: 4 }],
  },

  // ── 신규 던전1: 황혼의 지하묘지(tier 7) ──
  grave_wight: {
    id: 'grave_wight', name: '무덤 강시', element: 'dark', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 190, atk: 28, def: 13 },
    xp: 37, goldMin: 19, goldMax: 33,
    dropTable: [
      { itemId: 'wight_grave_dust', chance: 0.48, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  specter_archer: {
    id: 'specter_archer', name: '원혼 궁수', element: 'dark', tags: ['undead'], rare: false, statusImmune: true, ranged: true,
    targetPriority: 'random',
    baseStats: { hp: 150, atk: 36, def: 8 },
    xp: 38, goldMin: 19, goldMax: 34,
    dropTable: [
      { itemId: 'specter_bowstring', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_large', chance: 0.15, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_rare', chance: 0.06, qtyMin: 1, qtyMax: 1 },
    ],
  },
  crypt_lord: {
    id: 'crypt_lord', name: '지하묘지의 군주', element: 'dark', tags: ['undead'], rare: true, statusImmune: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 750, atk: 58, def: 20 },
    xp: 208, goldMin: 189, goldMax: 325,
    dropTable: [
      { itemId: 'crypt_lord_crown', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'crypt_curse', name: '묘지의 저주', type: 'attack', chance: 0.3, powerMult: 1.8, cooldownRounds: 4 },
      { id: 'crypt_mend', name: '묘지의 재생', type: 'heal_self', chance: 0.15, healPct: 0.13, cooldownRounds: 5 },
    ],
  },

  // ── 신규 던전2: 심판의 지하미궁(tier 12, 엔드게임) ──
  judgment_construct: {
    id: 'judgment_construct', name: '심판의 강철병', element: 'none', tags: ['undead'], rare: false, statusImmune: true,
    baseStats: { hp: 650, atk: 90, def: 40 },
    xp: 128, goldMin: 64, goldMax: 113,
    dropTable: [
      { itemId: 'construct_core_shard', chance: 0.48, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [{ id: 'judgment_slam', name: '심판의 강타', type: 'attack', chance: 0.2, powerMult: 1.8, cooldownRounds: 4 }],
  },
  soul_reaper: {
    id: 'soul_reaper', name: '영혼 수확자', element: 'dark', tags: ['undead'], rare: false, statusImmune: true, ranged: true, ambushChance: 0.3,
    targetPriority: 'lowest_hp',
    baseStats: { hp: 480, atk: 130, def: 20 },
    xp: 132, goldMin: 65, goldMax: 118,
    dropTable: [
      { itemId: 'reaper_scythe_blade', chance: 0.44, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.08, qtyMin: 1, qtyMax: 1 },
    ],
  },
  eternal_judge: {
    id: 'eternal_judge', name: '영원한 심판자', element: 'dark', tags: ['undead'], rare: true, statusImmune: true, ranged: true,
    targetPriority: 'highest_atk',
    baseStats: { hp: 2900, atk: 215, def: 70 },
    xp: 770, goldMin: 700, goldMax: 1200,
    dropTable: [
      { itemId: 'eternal_judge_seal', chance: 1, qtyMin: 1, qtyMax: 1 },
      { itemId: 'weapon_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'armor_legendary', chance: 0.25, qtyMin: 1, qtyMax: 1 },
      { itemId: 'bag_dungeon', chance: 0.6, qtyMin: 1, qtyMax: 1 },
    ],
    skills: [
      { id: 'final_verdict', name: '최후의 심판', type: 'attack', chance: 0.3, powerMult: 2.2, cooldownRounds: 4 },
      { id: 'judges_grace', name: '심판자의 은총', type: 'heal_self', chance: 0.15, healPct: 0.15, cooldownRounds: 5 },
    ],
  },
};
