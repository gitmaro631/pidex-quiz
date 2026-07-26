// 마을 정의 - 대륙 하나 안에서 해안→항구도시→산악→화산지대→고대유적 순으로 이어지는 여정.
// tier는 상점/선술집 구성과 마을 잠금 순서에 쓰임(높을수록 후반 마을). zoneIds는 그 마을 소속 사냥터.
export const TOWNS = {
  town1: { id: 'town1', name: '해안 마을', tier: 1, zoneIds: ['meadow', 'ruins_hill'] },
  town2: { id: 'town2', name: '항구도시', tier: 2, zoneIds: ['swamp', 'canyon'] },
  town3: { id: 'town3', name: '산악 마을', tier: 3, zoneIds: ['foothills', 'ridge'] },
  town4: { id: 'town4', name: '화산지대', tier: 4, zoneIds: ['lava_fields', 'sulfur_caves'] },
  town5: { id: 'town5', name: '고대유적', tier: 5, zoneIds: ['ruined_temple', 'abyss_corridor'] },
};
