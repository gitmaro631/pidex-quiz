export const RADIATION = {
  id: 'radiation',
  name: '방사능 구역',
  emoji: '☢️',
  startScene: 'zone_entry',
  items: {
    dosimeter: { label: '선량계',  emoji: '☢️', desc: '방사선량 측정·안전 경로 탐색' },
    hazmat:    { label: '방호복',  emoji: '🛡️', desc: '고오염 지역 진입·차량 탐색' },
    iodine:    { label: '요오드',  emoji: '💊', desc: '방사선 피폭 완화·체력 회복' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    zone_entry: {
      day: 1,
      title: '출입 금지 구역',
      text: `군사 실험 사고로 반경 20km가 봉쇄됐다.
당신의 차는 EMP로 멈췄다. 무전기도 죽었다.
구소련 시대의 도시 프리피야트 같은 폐허가 펼쳐진다.
외부 검문소까지 15km. 방사선이 측정되고 있다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '[선량계] 선량계로 안전한 방향을 측정한다',
          next: 'safe_path_found',
          requires: 'dosimeter',
          requireDesc: '방사선량을 알 수 없다. 어디가 안전한지 모른다.',
          pi: 5,
        },
        {
          text: '[방호복] 방호복을 입고 북쪽 공장 지대로 들어간다',
          next: 'factory_zone',
          requires: 'hazmat',
          requireDesc: '방호복 없이 공장 지대는 즉사 수준의 방사선이다.',
          pi: 5,
          effect: { health: -5 },
        },
        {
          text: '폐허 외곽을 따라 검문소 방향으로 이동한다',
          next: 'outskirts_path',
          effect: { health: -15, hunger: -15 },
        },
      ],
    },

    safe_path_found: {
      day: 1,
      title: '안전 경로',
      text: `선량계가 울렸다. 북쪽은 위험. 동쪽은 상대적으로 낮다.
동쪽 숲을 통과하면 검문소까지 8km.
선량계가 없었다면 몰랐을 경로다.`,
      pi: 10,
      choices: [
        {
          text: '[요오드] 요오드를 복용하고 숲 경로로 진입한다',
          next: 'forest_shortcut',
          requires: 'iodine',
          requireDesc: '요오드 없이 숲 경로는 위험하다',
          pi: 8,
          effect: { health: 5 },
        },
        {
          text: '숲 경로를 조심스럽게 통과한다',
          next: 'forest_shortcut',
          effect: { health: -10, hunger: -10 },
        },
      ],
    },

    forest_shortcut: {
      day: 1,
      title: '숲 경로',
      text: `나무들이 기형적으로 자라 있다. 적막하다.
선량계 수치가 낮은 땅을 골라 밟으며 이동했다.
3시간 만에 검문소 담장이 보인다.`,
      pi: 10,
      choices: [
        { text: '검문소를 향해 달린다', next: 'success_checkpoint' },
      ],
    },

    factory_zone: {
      day: 1,
      title: '공장 지대',
      text: `방호복이 방사선을 막아줬다.
폐공장 안에 작동 중인 차량이 있다.
배터리가 살아있다 — 누군가 최근에 왔었다.`,
      pi: 10,
      choices: [
        {
          text: '차량을 몰고 검문소로 향한다',
          next: 'vehicle_escape',
          pi: 10,
          effect: { health: 5 },
        },
        {
          text: '공장 안을 더 탐색한다',
          next: 'factory_search',
          effect: { health: -5 },
        },
      ],
    },

    factory_search: {
      day: 1,
      title: '공장 내부',
      text: `선반 위에 무전기가 있다. 주파수를 맞췄다.
"...여기 군 검문소. 누구 듣고 있으면 응답하시오."
위치를 전달했다.`,
      pi: 8,
      choices: [
        {
          text: '구조대가 올 때까지 공장에 대기한다',
          next: 'success_factory_rescue',
        },
        {
          text: '차량을 타고 스스로 탈출한다',
          next: 'vehicle_escape',
        },
      ],
    },

    vehicle_escape: {
      day: 1,
      title: '차량 탈출',
      text: `먼지 쌓인 군용 지프가 시동이 걸렸다.
검문소까지 전속력으로 달렸다.
바리케이드에서 군인들이 뛰어나왔다.`,
      isEnd: true,
      endType: 'success',
      pi: 18,
      endText: '방호복이 고오염 지역을 열었다. 차량이 탈출을 완성했다.',
    },

    outskirts_path: {
      day: 1,
      title: '외곽 이동',
      text: `폐허 외곽을 돌았다.
오염이 낮은 지역이지만 노출 시간이 길어지고 있다.
연구 컨테이너가 보인다.`,
      effect: { health: -5, hunger: -10 },
      choices: [
        { text: '컨테이너로 들어간다', next: 'research_container' },
        {
          text: '계속 검문소를 향해 이동한다',
          next: 'daylong_march',
          effect: { health: -20, hunger: -20 },
        },
      ],
    },

    research_container: {
      day: 1,
      title: '연구 컨테이너',
      text: `"Nikos입니다. 방사선 환경 연구팀이에요. 이 쪽은 Cheng."
"방호복 여분이 있어요. 우리 차도 있습니다."
Cheng이 키를 건네며 검문소 경로를 알려줬다.`,
      pi: 12,
      choices: [
        { text: '함께 탈출한다', next: 'success_researcher_escape' },
      ],
    },

    success_researcher_escape: {
      day: 1,
      title: '탈출',
      text: `Nikos와 Cheng의 차로 검문소에 도착했다.
"연구는 마저 해야 해서요. 데이터가 중요하거든요."
두 사람은 다시 구역 안으로 들어갔다.`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '방사능 구역에도 사람이 있었다. 뜻밖의 동료가 출구를 열어줬다.',
    },

    /* ── Day 2 ─────────────────────────────────────── */

    daylong_march: {
      day: 2,
      title: '하루 행군',
      text: `걸으며 피폭이 쌓이고 있다.
오심이 온다.`,
      effect: { health: -15, hunger: -20 },
      choices: [
        {
          text: '[요오드] 요오드를 복용해 피폭을 완화한다',
          next: 'iodine_recovery',
          requires: 'iodine',
          requireDesc: '요오드가 없다. 증상이 심해진다.',
          pi: 8,
          effect: { health: 15 },
        },
        {
          text: '멈추지 않고 계속 이동한다',
          next: 'push_through',
          effect: { health: -15, hunger: -10 },
        },
      ],
    },

    iodine_recovery: {
      day: 2,
      title: '요오드 복용',
      text: `증상이 완화됐다. 몸이 조금 살아났다.
검문소 담장이 보이기 시작한다.`,
      pi: 5,
      choices: [
        { text: '검문소로 향한다', next: 'success_checkpoint' },
      ],
    },

    push_through: {
      day: 2,
      title: '강행군',
      text: `구역질을 참으며 걸었다.
담장이 보인다. 마지막 힘을 쥐어짰다.
군인들이 달려왔다.`,
      effect: { health: -10 },
      choices: [
        { text: '쓰러지기 직전에 도착한다', next: 'success_checkpoint' },
      ],
    },

    radiation_sickness: {
      day: 2,
      title: '방사선 피폭',
      text: `구역질, 두통, 경련.
더 이상 걸을 수 없다.`,
      isEnd: true,
      endType: 'illness',
      endText: '방사선은 눈에 보이지 않는다. 그래서 더 무섭다.',
    },

    /* ── End Scenes ────────────────────────────────── */

    success_checkpoint: {
      day: 1,
      title: '검문소',
      text: `담장 너머로 소리를 질렀다.
군인들이 달려왔다. 방호복을 입힌 채 차에 태웠다.
제독 처리소에서 전신 스캔을 받았다.
"운 좋으셨어요."`,
      isEnd: true,
      endType: 'success',
      pi: 12,
      endText: '보이지 않는 적과 싸웠다. 올바른 판단이 방사선보다 빨랐다.',
    },

    success_factory_rescue: {
      day: 1,
      title: '구조대 도착',
      text: `20분 뒤 방호복을 입은 군인들이 들어왔다.
"어떻게 이 안에 들어왔어요?"
헬기로 이송됐다.`,
      isEnd: true,
      endType: 'success',
      pi: 14,
      endText: '무전 한 통이 탈출구가 됐다. 방호복이 그 기회를 만들었다.',
    },

  },
};
