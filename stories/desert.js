export const DESERT = {
  id: 'desert',
  name: '사하라 사막',
  emoji: '🏜️',
  startScene: 'storm_end',
  items: {
    hat:    { label: '모자',   emoji: '🎩', desc: '햇볕 차단·사막 예절' },
    mirror: { label: '손거울', emoji: '🪞', desc: '신호·방향 탐색' },
    cloth:  { label: '넓은 천', emoji: '🧣', desc: '텐트·모래폭풍 방어' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    storm_end: {
      day: 1,
      title: '폭풍 직후',
      text: `모래폭풍이 끝났다. 눈을 뜨자 사방이 모래뿐이다.
탐사팀과 함께였던 차량도, 장비도 보이지 않는다.
해는 중천. 피부가 타기 시작한다.
먼 지평선에 로마 시대 유적 돌벽이 보인다.`,
      effect: { health: -5, hunger: -10 },
      choices: [
        {
          text: '태양 위치로 방향을 잡고 걷는다',
          next: 'shadow_walk',
          pi: 0,
          effect: { health: -5, hunger: -5 },
        },
        {
          text: '유적 돌벽으로 피신해 상황을 살핀다',
          next: 'ruin_explore',
          pi: 0,
        },
        {
          text: '거울로 태양 반사를 시도한다',
          next: 'mirror_signal_open',
          requires: 'mirror',
          requireDesc: '거울이 없다',
          pi: 5,
        },
      ],
    },

    mirror_signal_open: {
      day: 1,
      title: '기적',
      text: `반사각을 맞추자 빛이 뻗어나갔다.
몇 분 후, 멀리서 헬기 한 대가 방향을 틀기 시작한다.
불과 5분 뒤 착지했다. 구조대였다.
"어떻게 정확히 이쪽으로 신호를?" 손거울 하나가 사막을 건넜다.`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '손거울 하나가 사막과 하늘을 이었다. 탈출까지 걸린 시간 — 23분.',
    },

    shadow_walk: {
      day: 1,
      title: '태양 나침반',
      text: `막대기 그림자로 방향을 잡았다. 북동쪽이 도로 방향이어야 한다.
그러나 정오 열기가 맹렬하다. 멀리 반짝이는 게 보인다.
오아시스인가, 신기루인가.`,
      effect: { health: -10, hunger: -15 },
      choices: [
        {
          text: '반짝이는 곳을 향해 달려간다',
          next: 'mirage_chase',
          effect: { health: -15, hunger: -20 },
        },
        {
          text: '[모자] 그늘을 만들며 천천히 능선으로 이동한다',
          next: 'shaded_march',
          requires: 'hat',
          requireDesc: '햇볕을 막을 것이 없다',
          pi: 3,
          effect: { health: -5, hunger: -10 },
        },
        {
          text: '[천] 즉석 텐트를 치고 열기를 피한다',
          next: 'cloth_shelter',
          requires: 'cloth',
          requireDesc: '그늘을 만들 천이 없다',
          pi: 5,
        },
      ],
    },

    mirage_chase: {
      day: 2,
      title: '신기루',
      text: `달려갔지만 아무것도 없었다. 신기루였다.
바닥에 쓰러졌다. 구역질이 난다.
에너지가 바닥났다. 혼자서는 일어서기도 힘들다.`,
      effect: { health: -20, hunger: -20 },
      choices: [
        {
          text: '마지막 힘으로 능선 방향으로 기어간다',
          next: 'ridge_overlook',
          effect: { health: -15, hunger: -10 },
        },
        {
          text: '[천] 천으로 몸을 덮고 야간 이동을 준비한다',
          next: 'cloth_shelter',
          requires: 'cloth',
          requireDesc: '그늘을 만들 방법이 없다. 이대로 쓰러진다.',
          pi: 3,
        },
      ],
    },

    cloth_shelter: {
      day: 1,
      title: '모래 텐트',
      text: `천을 바위 두 개 사이에 고정해 간이 텐트를 만들었다.
오후 맹열한 햇볕을 피해 잠들었다.
밤이 됐다. 37도였던 기온이 18도로 내려갔다.
별이 쏟아진다. 오리온자리가 동쪽을 알려준다.`,
      pi: 5,
      choices: [
        {
          text: '별을 나침반 삼아 밤새 이동한다',
          next: 'night_march',
          effect: { health: -10, hunger: -20 },
        },
        {
          text: '새벽까지 기다렸다가 출발한다',
          next: 'dawn_start',
          effect: { health: 5, hunger: -10 },
        },
      ],
    },

    night_march: {
      day: 2,
      title: '사막의 밤',
      text: `별빛 아래 걸었다. 선선했다.
3시간쯤 걸었을까, 멀리 모닥불처럼 보이는 불빛이 흔들린다.`,
      choices: [
        {
          text: '불빛을 향해 다가간다',
          next: 'bedouin_camp',
          pi: 3,
        },
        {
          text: '불빛은 무시하고 도로 방향으로 계속 걷는다',
          next: 'highway_sight',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    dawn_start: {
      day: 2,
      title: '새벽 출발',
      text: `새벽 5시, 지평선이 붉게 물들었다.
체온이 회복됐다. 저 멀리 능선 너머 검은 아스팔트 선이 보인다.`,
      choices: [
        {
          text: '능선을 넘어 도로로 향한다',
          next: 'highway_sight',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    shaded_march: {
      day: 1,
      title: '유적 벽화',
      text: `모자 덕분에 체력 소모가 줄었다.
얼마 뒤 유적 구역 벽에 새겨진 부조가 보인다.
별자리 그림과 방향 표시. 고대 카라반이 남긴 이정표다.
북동쪽 — 오아시스 방향이다.`,
      pi: 5,
      choices: [
        {
          text: '북동쪽을 향해 이동한다',
          next: 'oasis_path',
          effect: { health: -10, hunger: -15 },
        },
        {
          text: '유적 내부에서 물을 찾는다',
          next: 'ruin_explore',
        },
      ],
    },

    oasis_path: {
      day: 1,
      title: '오아시스를 향해',
      text: `2시간 걷자 야자수가 보인다.
진짜다. 발걸음이 빨라진다.`,
      choices: [
        { text: '달려간다', next: 'oasis_found', pi: 5 },
      ],
    },

    oasis_found: {
      day: 2,
      title: '오아시스',
      text: `대추야자 아래 우물이 있다.
물을 퍼마셨다. 체력이 살아난다.
이제 선택이다. 여기서 기다리느냐, 계속 이동하느냐.`,
      effect: { health: 20, hunger: -10 },
      pi: 5,
      choices: [
        {
          text: '오아시스에서 구조를 기다린다',
          next: 'oasis_wait',
        },
        {
          text: '물을 마신 뒤 도로를 향해 출발한다',
          next: 'highway_sight',
          effect: { health: 5, hunger: -10 },
        },
      ],
    },

    oasis_wait: {
      day: 3,
      title: '기다림',
      text: `이틀을 기다렸지만 아무도 오지 않았다.
물은 있지만 식량이 없다.
더 이상은 버틸 수 없다. 직접 이동해야 한다.`,
      effect: { hunger: -40 },
      choices: [
        {
          text: '마지막 힘을 쥐어짜 도로로 향한다',
          next: 'highway_sight',
          effect: { health: -10, hunger: -10 },
        },
      ],
    },

    ruin_explore: {
      day: 1,
      title: '로마 유적',
      text: `로마 시대 포르타 마그나였다. 안으로 들어가자
지하로 내려가는 계단이 보인다. 저장 시설이었던 것 같다.
계단 아래엔 고대 저수조 — 물이 남아 있다!`,
      effect: { health: 15, hunger: -5 },
      pi: 5,
      choices: [
        {
          text: '물을 마시고 체력을 회복한 뒤 방향을 잡는다',
          next: 'shaded_march',
          effect: { health: 10 },
        },
        {
          text: '유적 깊숙이 더 탐색한다',
          next: 'ruin_deep',
        },
      ],
    },

    ruin_deep: {
      day: 1,
      title: '두 사람',
      text: `내부 홀 안쪽에서 빛이 새어나온다.
노트북 두 대가 켜져 있고, 두 사람이 앉아 있다.
한 명이 일어서며 말한다. "저는 Nikos라고 합니다. 지질 조사 중이에요. 이 쪽은 Cheng."
Cheng이 이미 위성 전화를 들고 있었다. "구조 신청할게요. 20분이면 옵니다."`,
      pi: 10,
      choices: [
        { text: '감사히 구조 헬기를 기다린다', next: 'researcher_rescue', pi: 5 },
      ],
    },

    researcher_rescue: {
      day: 1,
      title: '구조',
      text: `헬기가 왔다. Nikos와 Cheng은 데이터 수집을 계속해야 한다며 남았다.
"Desert Protocol이라고 부릅니다. 이런 상황에서도 살아남으셨군요."
두 사람이 손을 흔들며 유적 안으로 사라졌다.`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '폐허 안에 뜻밖의 두 사람이 있었다. 운명처럼 나타났다가 사라졌다.',
    },

    ridge_overlook: {
      day: 1,
      title: '능선 위',
      text: `능선에서 바라보니 멀리 아스팔트 선이 보인다.
약 3시간 거리다. 그런데 지평선 너머 갈색 모래 구름이 피어오른다.
또 다른 폭풍이 온다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '폭풍 전에 도로로 전력 질주한다',
          next: 'storm_race',
          effect: { health: -30, hunger: -15 },
        },
        {
          text: '[천] 천으로 몸을 감싸고 제자리에서 폭풍을 버틴다',
          next: 'cloth_storm_survive',
          requires: 'cloth',
          requireDesc: '몸을 감쌀 것이 없다. 폭풍에 휩쓸린다.',
          pi: 8,
        },
        {
          text: '능선 뒤 바위틈에 숨는다',
          next: 'rock_shelter',
        },
      ],
    },

    storm_race: {
      day: 2,
      title: '폭풍 속 질주',
      text: `달렸지만 폭풍이 더 빨랐다.
모래가 눈을 찌르고 방향을 잃었다.
다음 날 아침 눈을 떴지만 체력이 바닥났다.`,
      effect: { health: -30, hunger: -20 },
      choices: [
        {
          text: '마지막 힘으로 도로 방향으로 기어간다',
          next: 'highway_sight',
          effect: { health: -15 },
        },
      ],
    },

    cloth_storm_survive: {
      day: 2,
      title: '폭풍을 넘어',
      text: `천으로 눈과 코를 막고 웅크렸다.
2시간 뒤 폭풍이 지나갔다. 눈에 모래 한 알 들어오지 않았다.
능선 너머 도로가 더 가깝게 느껴진다.`,
      choices: [
        { text: '도로를 향해 이동한다', next: 'highway_sight', pi: 3 },
      ],
    },

    rock_shelter: {
      day: 2,
      title: '바위틈',
      text: `폭풍을 버텼다. 그러나 목이 타오른다.
바위틈 안쪽에 모래에 반쯤 파묻힌 물통이 보인다.
탐사대가 남긴 것이다. 안에 물이 조금 있다.`,
      effect: { health: -10, hunger: -20 },
      choices: [
        { text: '물을 마시고 도로로 향한다', next: 'highway_sight', effect: { health: 10 } },
      ],
    },

    bedouin_camp: {
      day: 2,
      title: '베두인 캠프',
      text: `베두인 유목민 캠프였다.
낙타 대상이 3일 뒤 사막 변두리 마을로 출발할 예정이라고 한다.
대장이 손짓한다. 합류하겠느냐고.`,
      pi: 8,
      choices: [
        {
          text: '대상 행렬에 합류한다',
          next: 'caravan_join',
        },
        {
          text: '[모자] 모자를 선물로 건네며 빠른 이동을 요청한다',
          next: 'hat_gift',
          requires: 'hat',
          requireDesc: '건넬 것이 없다',
          pi: 10,
        },
      ],
    },

    hat_gift: {
      day: 2,
      title: '사막의 예절',
      text: `사막에서 모자는 귀한 선물이다.
대장이 눈을 빛내며 웃는다. 최고급 낙타 한 마리를 내준다.
하룻만에 마을에 닿았다.`,
      pi: 5,
      choices: [
        { text: '낙타를 타고 마을로 향한다', next: 'success_town' },
      ],
    },

    caravan_join: {
      day: 3,
      title: '대상 행렬',
      text: `낙타 등에서 본 사막 일몰이 눈물겹도록 아름다웠다.
사흘 뒤, 마을 첨탑이 보였다.`,
      pi: 8,
      choices: [
        { text: '마을로 들어선다', next: 'success_town' },
      ],
    },

    highway_sight: {
      day: 3,
      title: '아스팔트',
      text: `아스팔트가 발에 닿는다. 10분 뒤 먼지를 일으키며 트럭이 멈춰 선다.
운전사가 물을 내민다. "어디서 오셨어요?"`,
      pi: 5,
      choices: [
        { text: '트럭에 오른다', next: 'success_highway' },
      ],
    },

    /* ── End Scenes ────────────────────────────────── */

    success_town: {
      day: 2,
      title: '마을 도착',
      text: `마을 경계에 들어서자 아이들이 뛰어나왔다.
깨끗한 물 한 잔. 빵 한 조각. 세상에서 가장 맛있는 것들이었다.`,
      isEnd: true,
      endType: 'success',
      pi: 8,
      endText: '사막이 당신을 돌려보냈다. 더 단단해진 채로.',
    },

    success_highway: {
      day: 3,
      title: '탈출',
      text: `트럭 조수석에서 에어컨 바람을 맞았다.
창밖으로 사막이 멀어졌다.`,
      isEnd: true,
      endType: 'success',
      pi: 5,
      endText: '3일간의 사막. 아스팔트 위에서 살아남았다.',
    },

    desert_collapse: {
      day: 2,
      title: '한계',
      text: `더 이상 움직일 수가 없다.
모래가 눈앞을 채운다. 의식이 흐려진다.`,
      isEnd: true,
      endType: 'hunger',
      endText: '사막의 열기가 모든 것을 앗아갔다. 한 발짝이 부족했다.',
    },

  },
};
