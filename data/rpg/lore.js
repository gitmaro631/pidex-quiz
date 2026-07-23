// 탐험일지(로어) - 큰 줄기 스토리를 NPC 대사/퀘스트/보스전 보상으로 조금씩 흘려주는 방식.
// 결말을 확정짓지 않고 "다른 대륙/미지의 던전이 있다"는 떡밥만 남겨서, 나중에 콘텐츠(대륙/섬) 추가시
// 자연스럽게 이어붙일 수 있게 함. trigger: questDone(questId) | zoneFirstVisit(zoneId) | rareMonsterDefeated(monsterId)
export const LORE_ENTRIES = {
  lore_arrival: {
    id: 'lore_arrival', order: 1, title: '첫 발자국',
    text: '이 땅은 최근에야 외부에 알려지기 시작한 대륙이다. 아직 이름조차 제대로 붙지 않은 곳. 항구의 늙은 뱃사람들은 "돌아올 때마다 수평선이 낯설어진다"고 중얼거린다.',
    trigger: { type: 'questDone', questId: 'q1_welcome' },
  },
  lore_old_maps: {
    id: 'lore_old_maps', order: 2, title: '낡은 지도',
    text: '마을 원로가 색이 바랜 지도 한 장을 보여주었다. "이 대륙 너머에도 땅이 있다고 하더군. 아직 아무도 가본 적은 없지만 말일세."',
    trigger: { type: 'questDone', questId: 'q2_meadow_clear' },
  },
  lore_trade_routes: {
    id: 'lore_trade_routes', order: 3, title: '교역로의 소문',
    text: '교역소 상인들 사이에서 먼 바다 건너 낯선 항구 이야기가 돈다. 아무도 직접 본 적은 없다고 하면서도, 다들 그 이야기를 하는 눈빛만은 진지했다.',
    trigger: { type: 'zoneFirstVisit', zoneId: 'swamp' },
  },
  lore_canyon_anomaly: {
    id: 'lore_canyon_anomaly', order: 4, title: '협곡의 문양',
    text: '정찰병이 협곡 유적에서 발견한 문양을 그려 보여주었다. 고대 묘굴 깊은 곳에서 본 것과 똑같은 문양이었다. "우연이라기엔... 너무 똑같아."',
    trigger: { type: 'questDone', questId: 'q5_canyon_clear' },
  },
  lore_dungeon_guardian: {
    id: 'lore_dungeon_guardian', order: 5, title: '수호자의 마지막 말',
    text: '던전 수호자가 무너지며 남긴 말은 짧았다. "...봉인은, 이곳만이 아니다." 그 말의 의미를 아는 사람은 아직 아무도 없다.',
    trigger: { type: 'rareMonsterDefeated', monsterId: 'dungeon_guardian' },
  },
};
