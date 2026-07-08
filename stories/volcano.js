export const VOLCANO = {
  id: 'volcano',
  name: '화산섬',
  emoji: '🌋',
  startScene: 'eruption_caught',
  items: {
    gas_mask: { label: '방독면',   emoji: '😷', desc: '화산 가스 차단' },
    rope:     { label: '로프',     emoji: '🪢', desc: '절벽 하강·용암 지대 횡단' },
    mirror:   { label: '신호 거울', emoji: '🪞', desc: '해상 선박 신호' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    eruption_caught: {
      day: 1,
      title: '분화',
      text: `섬 중앙에서 굉음이 울렸다.
갑작스러운 분화다. 연구 조사 중이었다.
용암이 동쪽 사면을 타고 내려오고 있다.
해안으로 나가야 한다. 두 가지 경로가 있다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '북쪽 해안 길을 따라 이동한다',
          next: 'coast_path',
          effect: { health: -5, hunger: -10 },
        },
        {
          text: '[로프] 서쪽 절벽을 타고 해안으로 직접 내려간다',
          next: 'cliff_rappel',
          requires: 'rope',
          requireDesc: '로프 없이 절벽은 너무 위험하다',
          pi: 5,
          effect: { health: -10 },
        },
        {
          text: '[거울] 해안에서 지나가는 선박에 즉시 신호를 보낸다',
          next: 'mirror_signal_sea',
          requires: 'mirror',
          requireDesc: '신호를 보낼 방법이 없다',
          pi: 5,
        },
      ],
    },

    mirror_signal_sea: {
      day: 1,
      title: '해상 신호',
      text: `해안 절벽 위에서 거울로 빛을 반사했다.
5분 뒤 2km 거리의 어선이 방향을 바꿨다.
보트가 내려왔다. "무슨 일이에요? 섬에서 연기가 나던데."`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '거울 하나로 바다와 섬을 이었다. 분화 시작 20분 만에 탈출.',
    },

    cliff_rappel: {
      day: 1,
      title: '절벽 하강',
      text: `로프를 바위에 걸고 절벽을 내려갔다.
아래에 작은 해안 동굴이 보인다.
파도가 들어오지 않는 안전한 곳이다.`,
      pi: 8,
      choices: [
        {
          text: '[거울] 동굴 입구에서 지나가는 배에 신호를 보낸다',
          next: 'cove_signal',
          requires: 'mirror',
          requireDesc: '신호를 보낼 방법이 없다. 배를 기다린다.',
          pi: 5,
        },
        {
          text: '동굴에서 잠시 쉬며 다음 행동을 결정한다',
          next: 'cove_shelter',
        },
      ],
    },

    cove_signal: {
      day: 1,
      title: '동굴 신호',
      text: `파도 사이로 거울을 비췄다.
어선 한 척이 돌아왔다.
"분화 시작됐는데 아직 섬에 있었어요?!"`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '절벽 아래 숨겨진 동굴이 피난처였다. 로프와 거울이 생명줄이었다.',
    },

    cove_shelter: {
      day: 1,
      title: '해안 동굴',
      text: `동굴 안은 서늘하다.
파도 소리와 함께 멀리서 폭발음이 들린다.
용암이 동쪽을 막았다. 서쪽 해안으로 돌아가야 한다.`,
      choices: [
        {
          text: '파도를 피해 서쪽 해안으로 이동한다',
          next: 'west_coast',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    coast_path: {
      day: 1,
      title: '해안 길',
      text: `북쪽 해안을 따라 이동했다.
갑자기 화산 가스가 밀려왔다.
유황 냄새. 눈이 따갑고 기침이 나온다.`,
      effect: { health: -10, hunger: -5 },
      choices: [
        {
          text: '[방독면] 방독면을 쓰고 통과한다',
          next: 'gas_passage',
          requires: 'gas_mask',
          requireDesc: '가스를 피할 방법이 없다. 폐가 타들어 간다.',
          pi: 8,
          effect: { health: -5 },
        },
        {
          text: '옷으로 코를 막고 숨을 참으며 뛴다',
          next: 'dash_through_gas',
          effect: { health: -25, hunger: -10 },
        },
        {
          text: '뒤로 돌아 다른 경로를 찾는다',
          next: 'inland_detour',
          effect: { health: -10 },
        },
      ],
    },

    gas_passage: {
      day: 1,
      title: '가스 지대 통과',
      text: `방독면이 모든 것을 막아줬다.
10분 뒤 맑은 공기 지역으로 나왔다.
서쪽 해안이 바로 앞이다.`,
      pi: 5,
      choices: [
        { text: '서쪽 해안으로 나간다', next: 'west_coast' },
      ],
    },

    dash_through_gas: {
      day: 1,
      title: '전력 질주',
      text: `숨을 참고 달렸다. 30초가 너무 길었다.
해안으로 나왔지만 기침이 멈추지 않는다.
폐가 손상됐다.`,
      effect: { health: -20 },
      choices: [
        { text: '해안에서 신호를 보낸다', next: 'west_coast' },
      ],
    },

    inland_detour: {
      day: 1,
      title: '내륙 우회',
      text: `용암 지대를 돌아갔다. 열기가 맹렬하다.
연구 오두막이 보인다. 두 사람이 있다.`,
      pi: 5,
      choices: [
        { text: '오두막으로 향한다', next: 'volcanologist_meet' },
      ],
    },

    volcanologist_meet: {
      day: 1,
      title: '화산학자',
      text: `"Nikos입니다. 화산학자예요. 이 쪽은 Cheng."
"저희도 탈출해야 합니다. 고무 보트가 있어요. 같이 갑시다."
Cheng이 방독면 두 개를 더 꺼냈다.`,
      pi: 10,
      choices: [
        { text: '보트를 타고 탈출한다', next: 'success_boat_escape' },
      ],
    },

    /* ── Day 2 ─────────────────────────────────────── */

    west_coast: {
      day: 2,
      title: '서쪽 해안',
      text: `서쪽 해안에 도착했다.
파도 너머로 멀리 어선들이 보인다.
신호를 보내야 한다.`,
      choices: [
        {
          text: '[거울] 어선을 향해 거울 신호를 보낸다',
          next: 'success_rescue_boat',
          requires: 'mirror',
          requireDesc: '신호를 보낼 방법이 없다. 배들이 지나친다.',
          pi: 8,
        },
        {
          text: '[방독면+로프] 방독면을 쓰고 로프로 절벽을 내려가 파도에 뛰어든다',
          next: 'ocean_swim',
          requires: ['gas_mask', 'rope'],
          requireDesc: '방독면과 로프가 모두 필요하다',
          pi: 10,
          effect: { health: -15, hunger: -10 },
        },
        {
          text: '해안에서 대기하며 배를 기다린다',
          next: 'wait_coast',
          effect: { health: -10, hunger: -20 },
        },
      ],
    },

    ocean_swim: {
      day: 2,
      title: '해상 탈출',
      text: `로프를 절벽에 고정하고 파도 속으로 내려갔다.
방독면으로 가스를 막으며 헤엄쳤다.
어선이 가까워졌다.`,
      pi: 5,
      choices: [
        { text: '어선에 매달린다', next: 'success_rescue_boat' },
      ],
    },

    wait_coast: {
      day: 2,
      title: '대기',
      text: `다음 날, 배가 한 척 다가왔다.
"섬에 연기가 심해서 확인하러 왔어요."`,
      pi: 3,
      choices: [
        { text: '배에 탄다', next: 'success_rescue_boat' },
      ],
    },

    gas_death: {
      day: 1,
      title: '화산 가스',
      text: `유황 가스가 폐를 채웠다.
방독면이 없었다.`,
      isEnd: true,
      endType: 'illness',
      endText: '화산 가스는 냄새보다 먼저 폐를 공격한다.',
    },

    lava_death: {
      day: 1,
      title: '용암',
      text: `용암이 길을 막았다. 너무 늦었다.`,
      isEnd: true,
      endType: 'injury',
      endText: '용암은 기다려주지 않는다.',
    },

    /* ── End Scenes ────────────────────────────────── */

    success_boat_escape: {
      day: 1,
      title: '탈출',
      text: `고무 보트를 타고 섬을 빠져나왔다.
뒤를 돌아보니 섬 중앙이 불기둥을 내뿜고 있었다.
"데이터는 다 받았어요." Cheng이 태블릿을 들어 보였다.`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '화산이 분화하는 섬에서 살아나왔다. 데이터까지 챙긴 채로.',
    },

    success_rescue_boat: {
      day: 2,
      title: '해상 구조',
      text: `배 위에서 섬을 바라봤다.
용암이 해안선을 바꾸고 있었다.
1시간 더 늦었다면 탈출구가 없었을 것이다.`,
      isEnd: true,
      endType: 'success',
      pi: 10,
      endText: '화산섬은 지질학적 시간으로 산다. 인간의 시간은 그 사이의 틈이었다.',
    },

  },
};
