export const ISLAND = {
  id: 'island',
  name: '태평양 무인도',
  emoji: '🏝️',
  startScene: 'beach_wakeup',
  items: {
    rope:  { label: '로프',   emoji: '🪢', desc: '뗏목 제작·고정' },
    knife: { label: '나이프', emoji: '🔪', desc: '식량 확보·도구 제작' },
    flare: { label: '신호탄', emoji: '🚀', desc: '구조 신호' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    beach_wakeup: {
      day: 1,
      title: '조난',
      text: `크루즈 여객선이 암초에 부딪혔다.
정신을 차리자 낯선 해변이다.
태평양 어딘가. 사방이 바다다.
저 멀리 수평선에 무언가가 지나가고 있다 — 화물선이다.`,
      effect: { health: -10, hunger: -15 },
      choices: [
        {
          text: '[신호탄] 지나가는 화물선에 신호탄을 쏜다',
          next: 'flare_ship',
          requires: 'flare',
          requireDesc: '배가 사라지기 전에 신호를 보낼 방법이 없다',
          pi: 5,
        },
        {
          text: '섬 내부를 탐색한다',
          next: 'explore_inland',
          effect: { health: -5, hunger: -10 },
        },
        {
          text: '해안을 따라 다른 생존자나 물자를 찾는다',
          next: 'beach_search',
          effect: { health: -5, hunger: -10 },
        },
      ],
    },

    flare_ship: {
      day: 1,
      title: '신호 성공',
      text: `신호탄이 붉은 빛을 쏘아 올렸다.
5분 뒤 화물선이 방향을 틀었다.
구명보트가 내려왔다. 선원이 손을 내밀었다.
"어디서 오셨어요?"`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '눈에 띄지 않으면 구조되지 않는다. 신호탄 하나가 모든 것을 바꿨다.',
    },

    beach_search: {
      day: 1,
      title: '해안 수색',
      text: `파도에 밀려온 잔해들이 있다.
구명조끼, 플라스틱 통, 나무 판자.
그리고 두 사람 — 살아있다.`,
      pi: 5,
      choices: [
        { text: '두 사람에게 다가간다', next: 'survivor_meet' },
      ],
    },

    survivor_meet: {
      day: 1,
      title: '생존자',
      text: `"Nikos입니다. 이 쪽은 Cheng — 우린 해양 생태 연구팀이에요.
사실 이 섬은 우리가 조사 중이던 곳이에요. 위성 전화가 있어요."
Cheng이 전화를 꺼냈다. 배터리가 5%였다.
한 통만 걸 수 있다.`,
      pi: 10,
      choices: [
        { text: '해경에 구조 요청 전화를 건다', next: 'sat_phone_rescue' },
      ],
    },

    sat_phone_rescue: {
      day: 1,
      title: '위성 전화',
      text: `연결됐다. 위치를 전달했다.
"3시간 내 출동합니다."
Nikos와 Cheng은 데이터 수집을 마저 하겠다며 남았다.`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '섬 안에 뜻밖의 동료가 있었다. 사람이 답이었다.',
    },

    explore_inland: {
      day: 1,
      title: '섬 내부',
      text: `야자수 숲을 헤치고 들어갔다.
맑은 계곡물을 발견했다. 목이 살아난다.
높은 곳으로 올라가자 섬 전체가 보인다.
북쪽 해안에 오두막 같은 구조물이 있다.`,
      effect: { health: 10, hunger: -10 },
      pi: 5,
      choices: [
        {
          text: '[나이프] 야자를 따서 식량을 확보한다',
          next: 'coconut_food',
          requires: 'knife',
          requireDesc: '손으로는 딸 수 없다',
          pi: 5,
          effect: { health: 10, hunger: 20 },
        },
        {
          text: '북쪽 오두막으로 향한다',
          next: 'old_hut',
        },
        {
          text: '뗏목을 만들어 탈출을 준비한다',
          next: 'raft_build',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    coconut_food: {
      day: 1,
      title: '야자',
      text: `야자 과육과 즙이 체력을 살렸다.
이제 탈출 방법을 찾아야 한다.`,
      choices: [
        {
          text: '[로프] 뗏목을 엮어 탈출을 시도한다',
          next: 'raft_build',
          requires: 'rope',
          requireDesc: '묶을 것이 없어 판자가 흩어진다',
          pi: 3,
        },
        {
          text: '높은 곳에서 연기 신호를 피운다',
          next: 'signal_smoke',
          effect: { health: -5, hunger: -10 },
        },
      ],
    },

    old_hut: {
      day: 1,
      title: '낡은 오두막',
      text: `오래된 어부의 오두막이다.
안에 낡은 어망과 성냥이 있다.
그리고 섬에서 가장 높은 곳으로 가는 오솔길이 있다.`,
      pi: 5,
      choices: [
        {
          text: '[나이프] 어망으로 물고기를 잡는다',
          next: 'fishing',
          requires: 'knife',
          requireDesc: '어망 손질을 할 수 없다',
          pi: 5,
          effect: { health: 5, hunger: 25 },
        },
        {
          text: '성냥으로 봉화를 피운다',
          next: 'signal_smoke',
          pi: 5,
        },
      ],
    },

    fishing: {
      day: 2,
      title: '낚시',
      text: `물고기를 잡았다. 배가 차자 생각이 명료해진다.
내일을 버틸 수 있다.`,
      choices: [
        {
          text: '[로프] 뗏목을 엮기 시작한다',
          next: 'raft_build',
          requires: 'rope',
          requireDesc: '로프가 없다',
          pi: 3,
        },
        { text: '봉화 신호를 계속 피운다', next: 'signal_smoke' },
      ],
    },

    signal_smoke: {
      day: 2,
      title: '봉화',
      text: `가장 높은 바위 위에서 불을 피웠다.
하루를 기다렸다.
다음 날 저녁, 저 멀리 어선이 연기를 보고 방향을 바꾼다.`,
      pi: 8,
      choices: [
        { text: '해안으로 내려가 손을 흔든다', next: 'success_boat' },
      ],
    },

    /* ── Day 2 ─────────────────────────────────────── */

    raft_build: {
      day: 2,
      title: '뗏목 제작',
      text: `로프로 판자들을 단단히 엮었다.
야자 잎으로 돛을 달았다.
파도가 거세지기 전에 출발해야 한다.`,
      pi: 5,
      choices: [
        {
          text: '뗏목을 띄우고 바람 방향으로 나아간다',
          next: 'ocean_drift',
          effect: { health: -10, hunger: -20 },
        },
      ],
    },

    ocean_drift: {
      day: 3,
      title: '표류',
      text: `이틀을 표류했다.
갈증과 싸우며 버텼다.
멀리 선박의 불빛이 보인다.`,
      effect: { health: -20, hunger: -30 },
      choices: [
        {
          text: '[신호탄] 신호탄을 쏜다',
          next: 'success_rescue',
          requires: 'flare',
          requireDesc: '신호를 보낼 방법이 없다. 선박이 지나쳐 간다.',
          pi: 10,
        },
        {
          text: '[나이프] 날생선을 잡아 수분을 보충한다',
          next: 'raw_fish_survive',
          requires: 'knife',
          requireDesc: '아무것도 없다. 탈수가 심해진다.',
          pi: 5,
          effect: { health: 10, hunger: 15 },
        },
      ],
    },

    raw_fish_survive: {
      day: 3,
      title: '날생선',
      text: `날생선으로 수분을 버텼다.
다음 날 새벽, 섬의 윤곽이 보인다. 다른 섬이다.
사람이 살 것 같다.`,
      choices: [
        { text: '섬으로 향한다', next: 'success_boat' },
      ],
    },

    /* ── End Scenes ────────────────────────────────── */

    success_rescue: {
      day: 3,
      title: '구조',
      text: `선박이 멈췄다. 사다리가 내려왔다.
"어떻게 된 거예요?" 선원이 담요를 건넸다.`,
      isEnd: true,
      endType: 'success',
      pi: 10,
      endText: '3일간의 표류 끝에 살아남았다. 바다는 넓고 인간은 작지만 포기하지 않았다.',
    },

    success_boat: {
      day: 2,
      title: '구조',
      text: `어선이 닿았다. 선원이 손을 내밀었다.
따뜻한 국 한 그릇이 세상 전부였다.`,
      isEnd: true,
      endType: 'success',
      pi: 8,
      endText: '무인도에서 살아 돌아왔다. 불빛 하나가 생사를 갈랐다.',
    },

    ocean_death: {
      day: 3,
      title: '표류 실패',
      text: `탈수와 굶주림이 의식을 앗아갔다.
뗏목이 조류에 떠내려갔다.`,
      isEnd: true,
      endType: 'hunger',
      endText: '바다는 준비 없는 자를 돌려보내지 않는다.',
    },

  },
};
