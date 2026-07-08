export const UNDERWATER = {
  id: 'underwater',
  name: '심해 기지',
  emoji: '🌊',
  startScene: 'emergency_room',
  items: {
    toolkit: { label: '공구 세트', emoji: '🔧', desc: '해치 열기·균열 수리' },
    flare:   { label: '수중 신호탄', emoji: '🔴', desc: '신호·수중 조명' },
    oxy:     { label: '비상 산소', emoji: '💨', desc: '호흡 연장·부력 활용' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    emergency_room: {
      day: 1,
      title: '비상 경보',
      text: `규모 5.8 지진이다. 심해 연구 기지 Neptune-7의 B구역이 침수 중이다.
비상 경보가 울린다. 당신이 있는 C구역은 아직 기압이 유지되고 있다.
탈출 잠수정은 A구역 도킹 베이에 있다. 두 개의 경로가 있다.`,
      effect: { health: -5, hunger: -5 },
      choices: [
        {
          text: '침수된 복도를 통해 A구역으로 이동한다',
          next: 'flooded_corridor',
        },
        {
          text: '[공구] 기지 제어 패널을 열어 비상 시스템을 복구한다',
          next: 'control_panel',
          requires: 'toolkit',
          requireDesc: '패널 덮개를 열 도구가 없다',
          pi: 5,
        },
        {
          text: '비상 탈출 해치를 통해 외부로 나간다',
          next: 'outer_hull',
        },
      ],
    },

    control_panel: {
      day: 1,
      title: '제어 패널',
      text: `제어 패널 내부. 수동 밸브가 보인다.
비상 배수 펌프를 가동하자 침수된 복도 수위가 내려가기 시작한다.
엘리베이터도 복구됐다. A구역까지 20초면 간다.`,
      pi: 10,
      choices: [
        { text: '엘리베이터로 A구역 도킹 베이로 간다', next: 'docking_bay' },
      ],
    },

    flooded_corridor: {
      day: 1,
      title: '침수 복도',
      text: `복도는 허리까지 차 있다. 수위가 계속 오른다.
절반쯤 왔을까, 머리 위 천장이 무너졌다. 길이 막혔다.
비상 공기 포켓이 보인다.`,
      effect: { health: -15, hunger: -10 },
      choices: [
        {
          text: '[산소] 산소 탱크를 부력 삼아 수면 위 환기 샤프트로 떠오른다',
          next: 'oxy_float',
          requires: 'oxy',
          requireDesc: '산소가 없다. 익사한다.',
          pi: 15,
        },
        {
          text: '공기 포켓 안에서 다른 방법을 찾는다',
          next: 'air_pocket',
        },
      ],
    },

    oxy_float: {
      day: 1,
      title: '산소 부력',
      text: `산소 탱크 밸브를 열고 몸 아래에 끌어당겼다.
탱크가 빠르게 부력을 만들어냈다. 위로 솟구쳤다.
천장 환기 샤프트를 통해 A구역으로 빠져나왔다.`,
      pi: 15,
      choices: [
        { text: '도킹 베이로 이동한다', next: 'docking_bay' },
      ],
    },

    air_pocket: {
      day: 1,
      title: '뜻밖의 동료',
      text: `공기 포켓 안에 두 사람이 있었다.
"Nikos입니다. 해양 지질 연구팀입니다. 이 쪽은 Cheng."
Cheng이 방수 위성 단말기를 꺼낸다.
"구조 잠수함이 이미 접근 중입니다. 여기서 기다리면 됩니다."`,
      pi: 10,
      choices: [
        { text: 'Nikos, Cheng과 함께 구조를 기다린다', next: 'pocket_rescue' },
      ],
    },

    pocket_rescue: {
      day: 1,
      title: '구조 잠수함',
      text: `30분 뒤 구조 잠수함이 도킹했다.
해치가 열렸다. Nikos가 손을 잡아당겼다.
"Neptune-7은 우리가 닫겠습니다. 먼저 나가세요."
두 사람은 기지에 남았다.`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '침수된 공기 포켓 안에 두 사람이 있었다. 운명처럼, 그리고 사명처럼.',
    },

    outer_hull: {
      day: 1,
      title: '외부 선체',
      text: `비상 해치를 열었다. 기압이 바뀌며 귀가 먹먹하다.
외부 선체를 따라 이동해야 한다. 수심 180m. 주위는 캄캄하다.`,
      choices: [
        {
          text: '[산소] 산소를 쓰며 선체를 따라 도킹 베이로 이동한다',
          next: 'hull_swim',
          requires: 'oxy',
          requireDesc: '산소 없이 180m 수심은 버틸 수 없다. 익사한다.',
          pi: 5,
          effect: { health: -20, hunger: -10 },
        },
        {
          text: '[신호탄] 수중에서 신호탄을 터뜨린다',
          next: 'flare_underwater',
          requires: 'flare',
          requireDesc: '신호를 보낼 방법이 없다. 기지로 돌아간다.',
          pi: 8,
        },
      ],
    },

    flare_underwater: {
      day: 1,
      title: '수중 신호',
      text: `수중 신호탄이 터졌다. 180m 수심에서도 빛이 퍼졌다.
대기 중이던 구조 잠수함이 빛을 포착했다.
15분 만에 해치가 열렸다.`,
      pi: 10,
      choices: [
        { text: '구조 잠수함에 탑승한다', next: 'success_sub' },
      ],
    },

    hull_swim: {
      day: 1,
      title: '선체 이동',
      text: `산소 마스크를 쓰고 선체를 따라 이동했다.
도킹 베이 외부 해치가 보인다. 수동으로 열어야 한다.`,
      choices: [
        {
          text: '[공구] 공구로 해치를 강제로 연다',
          next: 'docking_bay',
          requires: 'toolkit',
          requireDesc: '해치가 열리지 않는다. 산소가 바닥난다.',
          pi: 5,
        },
        {
          text: '[신호탄] 도킹 베이 창문에 신호탄을 비춘다',
          next: 'flare_underwater',
          requires: 'flare',
          requireDesc: '아무것도 없다. 산소만 줄어든다.',
          pi: 5,
        },
      ],
    },

    /* ── Day 2 ─────────────────────────────────────── */

    docking_bay: {
      day: 1,
      title: '도킹 베이',
      text: `탈출 잠수정 앞에 섰다.
비상 코드를 입력하자 시동이 걸린다.
해치가 열리고 어두운 심해가 펼쳐진다.`,
      pi: 5,
      choices: [
        { text: '탈출 잠수정을 조종해 수면으로 향한다', next: 'success_sub' },
      ],
    },

    engine_room: {
      day: 2,
      title: '기관실',
      text: `비상 발전기를 찾았다. 연료가 조금 남아 있다.
비상 신호 발신기에 전력을 보낼 수 있다.`,
      choices: [
        {
          text: '[공구] 배선을 연결해 신호 발신기를 작동시킨다',
          next: 'emergency_signal',
          requires: 'toolkit',
          requireDesc: '배선을 연결할 도구가 없다',
          pi: 8,
        },
      ],
    },

    emergency_signal: {
      day: 2,
      title: '비상 신호',
      text: `신호가 수면으로 전송됐다.
6시간 뒤 구조 잠수함이 도킹했다.`,
      pi: 5,
      choices: [
        { text: '구조 잠수함에 탑승한다', next: 'success_sub' },
      ],
    },

    /* ── End Scenes ────────────────────────────────── */

    success_sub: {
      day: 1,
      title: '수면 위로',
      text: `수면을 뚫고 나왔다. 태양 빛이 눈부셨다.
해경 함정이 200m 거리에 대기 중이었다.
"Neptune-7 생존자 확인!"`,
      isEnd: true,
      endType: 'success',
      pi: 10,
      endText: '180m 심해에서 살아 올라왔다. 빛이 이렇게 아름다운 것인지 몰랐다.',
    },

    drowning: {
      day: 1,
      title: '익사',
      text: `산소가 떨어졌다. 어둠 속 차가운 물이 폐를 채웠다.`,
      isEnd: true,
      endType: 'illness',
      endText: '심해는 산소 없이 머무는 것을 허락하지 않는다.',
    },

  },
};
