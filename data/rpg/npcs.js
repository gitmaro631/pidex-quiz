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
  npc_doctor_1: {
    id: 'npc_doctor_1', name: '마을 의사', townId: 'town1', role: 'doctor',
    dialogue: [
      '팔이나 다리를 다쳤으면 참지 말고 이리 오게.',
      '경상이야 붕대로도 되지만, 중상은 나한테 와야 낫는다네.',
    ],
    questIds: [],
  },
  npc_doctor_2: {
    id: 'npc_doctor_2', name: '마을 의사', townId: 'town2', role: 'doctor',
    dialogue: ['다친 몸으로 계속 싸우면 더 크게 다치는 법이야.'],
    questIds: [],
  },
  npc_tavern_1: {
    id: 'npc_tavern_1', name: '선술집 주인', townId: 'town1', role: 'tavern',
    dialogue: [
      '혼자 다니기 힘들면 용병을 하나 데려가게.',
      '근접 전문이면 원거리를, 원거리 전문이면 근접을 붙여야 손발이 맞지.',
    ],
    questIds: [],
  },
  npc_tavern_2: {
    id: 'npc_tavern_2', name: '선술집 주인', townId: 'town2', role: 'tavern',
    dialogue: ['용병 보수는 모험 갈 때마다 자동으로 나가니 주머니 사정을 봐가며 고용하게.'],
    questIds: [],
  },
  npc_trainer_1: {
    id: 'npc_trainer_1', name: '직업 교관', townId: 'town1', role: 'trainer',
    dialogue: [
      '스킬은 그냥 아는 게 아니야. 몹을 잡아 결정을 모으고, 여기서 제대로 배워야 쓸 수 있어.',
      '단계를 올릴수록 위력이 세지지만 그만큼 결정도 골드도 더 필요하네.',
    ],
    questIds: [],
  },
  npc_trainer_2: {
    id: 'npc_trainer_2', name: '직업 교관', townId: 'town2', role: 'trainer',
    dialogue: ['배우지 않은 스킬은 전투에서 안 나가네. 먼저 여기서 배우게.'],
    questIds: [],
  },
  npc_blacksmith_1: {
    id: 'npc_blacksmith_1', name: '대장장이', townId: 'town1', role: 'blacksmith',
    dialogue: [
      '유니크한 놈을 잡으면 가끔 강화석이 나오지. 그걸 가져오면 무기든 방어구든 세게 만들어주겠네.',
      '단계가 오를수록 더 많이 필요해지니 각오하게.',
    ],
    questIds: [],
  },
  npc_blacksmith_2: {
    id: 'npc_blacksmith_2', name: '대장장이', townId: 'town2', role: 'blacksmith',
    dialogue: ['장비를 갈아끼우면 강화 단계가 초기화되니 신중하게 정하게.'],
    questIds: [],
  },
};
