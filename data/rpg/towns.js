// 마을 정의 - 대륙 하나 안에서 해안→항구도시→산악→화산지대→고대유적 순으로 이어지는 여정.
// tier는 상점/선술집 구성과 마을 잠금 순서에 쓰임(높을수록 후반 마을). zoneIds는 그 마을 소속 사냥터.
export const TOWNS = {
  town1: { id: 'town1', name: '해안 마을', tier: 1, zoneIds: ['meadow', 'ruins_hill', 'tidal_flat', 'driftwood_cove', 'shell_reef', 'gull_cliffs', 'brine_marsh', 'sunken_wreck', 'coastal_watch', 'pearl_grotto'] },
  town2: { id: 'town2', name: '항구도시', tier: 2, zoneIds: ['swamp', 'canyon', 'harbor_docks', 'sunken_pier', 'rat_warehouse', 'quarry_depths', 'collapsed_shaft', 'rusted_foundry', 'smugglers_tunnel', 'flooded_quarry'] },
  town3: { id: 'town3', name: '산악 마을', tier: 3, zoneIds: ['foothills', 'ridge', 'hawk_peak', 'rope_bridge_pass', 'troll_den', 'frost_ridge', 'shaman_shrine', 'yeti_lair', 'thunder_summit', 'ram_horn_valley'] },
  town4: { id: 'town4', name: '화산지대', tier: 4, zoneIds: ['lava_fields', 'sulfur_caves', 'magma_flow', 'imp_warren', 'obsidian_spire', 'cinder_wastes', 'molten_sanctum', 'wasp_hive', 'ashfall_crater', 'brimstone_gate'] },
  town5: { id: 'town5', name: '고대유적', tier: 5, zoneIds: ['ruined_temple', 'abyss_corridor', 'sentinel_hall', 'ghoul_crypt', 'wisp_sanctuary', 'bone_ossuary', 'hound_kennel', 'acolyte_chamber', 'forgotten_vault', 'starlight_ruins'] },
};
