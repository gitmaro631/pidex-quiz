export const SPACE = {
  id: 'space',
  name: '우주 정거장',
  emoji: '🚀',
  startScene: 'impact_alert',
  items: {
    patch:  { label: '수리 패치', emoji: '🩹', desc: '기압 균열 임시 밀봉' },
    tether: { label: '안전 줄',  emoji: '🔗', desc: '우주 공간 이동·고정' },
    tablet: { label: '데이터 태블릿', emoji: '💻', desc: '시스템 접근·항법 계산' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    impact_alert: {
      day: 1,
      title: '충돌 경보',
      text: `충격음이 울렸다. 소행성 파편이었다.
ISS-2 정거장의 B-7 연결 통로가 파손됐다.
탈출 캡슐은 D구역에 있다. B-7을 우회해야 한다.
기압이 빠지기 시작한다. 시간이 없다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '[패치] 파손 부위를 임시 밀봉하고 통로를 통과한다',
          next: 'patched_corridor',
          requires: 'patch',
          requireDesc: '기압이 계속 새어나간다. 통과할 수 없다.',
          pi: 5,
          effect: { health: -5 },
        },
        {
          text: '통신실로 이동해 구조 신호를 보낸다',
          next: 'comms_room',
          effect: { health: -10, hunger: -5 },
        },
        {
          text: '에어록을 통해 우주 공간으로 나간다',
          next: 'airlock_approach',
          effect: { health: -10, hunger: -10 },
        },
      ],
    },

    patched_corridor: {
      day: 1,
      title: '임시 밀봉',
      text: `수리 패치를 균열에 붙였다. 기압이 안정됐다.
통로를 빠르게 통과해 D구역 입구에 섰다.
탈출 캡슐 도어가 보인다.`,
      pi: 8,
      choices: [
        { text: '탈출 캡슐에 탑승한다', next: 'escape_pod_launch' },
      ],
    },

    comms_room: {
      day: 1,
      title: '통신실',
      text: `통신 시스템이 반쯤 손상됐다.
표준 주파수로 구조 신호를 보내면 최소 72시간 후 응답이 온다.
하지만 태블릿이 있으면 다른 방법이 있을 것 같다.`,
      choices: [
        {
          text: '[태블릿] 태블릿으로 자동 항법 비콘을 해킹해 강도를 증폭시킨다',
          next: 'tablet_hack',
          requires: 'tablet',
          requireDesc: '표준 신호만 보낸다. 응답까지 72시간.',
          pi: 5,
        },
        {
          text: '표준 구조 신호를 보내고 탈출 캡슐을 향해 이동한다',
          next: 'main_corridor',
          effect: { health: -10 },
        },
      ],
    },

    tablet_hack: {
      day: 1,
      title: '비콘 증폭',
      text: `태블릿으로 항법 위성 비콘 프로토콜에 접속했다.
신호 강도를 100배로 끌어올렸다.
12분 뒤 응답이 왔다. "미션 컨트롤 여기는 Nikos입니다. 캡슐로 이동하세요. 회수 준비됩니다."`,
      pi: 15,
      choices: [
        { text: '탈출 캡슐을 향해 이동한다', next: 'escape_pod_launch' },
      ],
    },

    airlock_approach: {
      day: 1,
      title: '에어록',
      text: `에어록 앞에 섰다. 우주 공간으로 나가 외벽을 타고
D구역 에어록으로 돌아오는 루트가 있다.
하지만 안전 줄 없이 나가면 표류한다.`,
      choices: [
        {
          text: '[안전 줄] 안전 줄을 걸고 우주 유영을 시작한다',
          next: 'spacewalk',
          requires: 'tether',
          requireDesc: '안전 줄 없이 나가면 우주로 표류한다.',
          pi: 5,
          effect: { health: -15, hunger: -10 },
        },
        {
          text: '위험 부담이 크다. 통신실로 향한다',
          next: 'comms_room',
          effect: { health: -5 },
        },
      ],
    },

    spacewalk: {
      day: 1,
      title: '우주 유영',
      text: `에어록이 열렸다. 눈앞에 지구가 펼쳐졌다.
안전 줄을 외벽 레일에 걸고 이동했다.
정거장 외벽을 따라 D구역 에어록까지 300m.
창문 너머로 지구의 낮과 밤이 교차했다.`,
      pi: 10,
      choices: [
        { text: 'D구역 에어록으로 들어간다', next: 'escape_pod_launch', effect: { health: -10 } },
      ],
    },

    main_corridor: {
      day: 1,
      title: '메인 통로',
      text: `통로를 이동하는 중, B-7 파손 구역 근처에서 또 다른 기압 경고가 울렸다.
통로 전체가 곧 감압될 것이다.`,
      effect: { health: -20 },
      choices: [
        {
          text: '[패치] 새로 발생한 균열을 막는다',
          next: 'patched_corridor',
          requires: 'patch',
          requireDesc: '막을 수 없다. 기압이 급격히 빠진다.',
          pi: 5,
        },
        {
          text: '전력 질주해 D구역으로 달린다',
          next: 'corridor_dash',
          effect: { health: -20, hunger: -10 },
        },
      ],
    },

    corridor_dash: {
      day: 1,
      title: '질주',
      text: `기압이 빠지는 통로를 전력으로 달렸다.
귀가 먹먹하다. D구역 도어가 보인다.
마지막 힘으로 도어를 열었다.`,
      choices: [
        { text: '탈출 캡슐에 탑승한다', next: 'escape_pod_launch', effect: { health: -15 } },
      ],
    },

    /* ── Day 2 ─────────────────────────────────────── */

    oxygen_depleting: {
      day: 2,
      title: '산소 부족',
      text: `에어록에서 기다렸지만 기압이 계속 감소했다.
의식이 흐려진다.`,
      isEnd: true,
      endType: 'illness',
      endText: '우주는 산소 없는 기다림을 허락하지 않는다.',
    },

    escape_pod_launch: {
      day: 1,
      title: '탈출 캡슐',
      text: `캡슐 내부에 들어섰다. 발사 시퀀스를 입력했다.
미션 컨트롤: "탈출 캡슐 확인. 대기권 재진입 허가합니다."
커운트다운이 시작됐다.`,
      pi: 5,
      choices: [
        { text: '발사 버튼을 누른다', next: 'success_reentry' },
      ],
    },

    /* ── End Scenes ────────────────────────────────── */

    success_reentry: {
      day: 1,
      title: '대기권 재진입',
      text: `캡슐 창에 불꽃이 튀었다. 대기권 재진입이다.
낙하산이 펼쳐졌다. 바다가 보였다.
해군 함정에서 보트가 다가왔다.`,
      isEnd: true,
      endType: 'success',
      pi: 12,
      endText: '지구가 이렇게 아름다웠던 적이 없었다. 살아서 돌아왔다.',
    },

    vacuum_death: {
      day: 1,
      title: '진공',
      text: `기압이 0으로 떨어졌다. 찰나였다.`,
      isEnd: true,
      endType: 'injury',
      endText: '우주는 실수에 두 번의 기회를 주지 않는다.',
    },

  },
};
