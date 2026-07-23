// 마을 NPC 정의 — 마을 탭에서 대사/퀘스트 제공. 나중에 추가할 때 이 객체에 항목만 넣으면 됨.
export const NPCS = {
  npc_elder: {
    id: 'npc_elder', name: '마을 원로', townId: 'town1',
    dialogue: [
      '이 마을에 온 걸 환영하네, 모험가.',
      '초원부터 천천히 익혀보게. 서두르다 다치는 법이야.',
    ],
    questIds: ['q1_welcome', 'q2_meadow_clear'],
  },
  npc_guard: {
    id: 'npc_guard', name: '마을 경비병', townId: 'town1',
    dialogue: ['요즘 폐허 언덕 쪽 몬스터가 부쩍 늘었다는군. 조심하게.'],
    questIds: ['q3_level5'],
  },
  npc_trade_chief: {
    id: 'npc_trade_chief', name: '교역소장', townId: 'town2',
    dialogue: [
      '이 마을은 상인들이 모여드는 곳이지.',
      '늪지에서 나는 재료를 가져오면 값을 쳐주겠네.',
    ],
    questIds: ['q4_swamp_clear'],
  },
  npc_scout: {
    id: 'npc_scout', name: '정찰병', townId: 'town2',
    dialogue: [
      '협곡 쪽은... 날마다 상태가 달라. 어제 괜찮았다고 오늘도 괜찮으리란 법은 없어.',
      '요즘 협곡 너머 고대 유적 쪽에서 이상한 기운이 느껴진다는 소문이 있네.',
    ],
    questIds: ['q5_canyon_clear'],
  },
};
