export const ALIEN = {
  id: 'alien',
  name: '외계 행성',
  emoji: '👽',
  startScene: 'crashed_lander',
  items: {
    crystal:    { label: '공명 결정', emoji: '💎', desc: '주파수 증폭·소통 불명' },
    suit_patch: { label: '우주복 수리 키트', emoji: '🛠️', desc: '기압 유지·이동 가능' },
    beacon:     { label: '긴급 비콘', emoji: '📡', desc: '모선에 구조 신호 발신' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    crashed_lander: {
      day: 1,
      title: 'KEPLER-3 착륙',
      text: `착륙선 엔진이 고장났다. 비상 착지.
KEPLER-3 행성 표면. 대기는 호흡 불가능하나 압력은 유지된다.
모선은 72시간 내 이 궤도를 떠난다.
착륙선 내부에 이전 탐사대가 남긴 홀로그램 로그가 깜박이고 있다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '홀로그램 로그를 재생한다',
          next: 'holo_log',
          pi: 5,
        },
        {
          text: '즉시 비콘을 가동해 구조 신호를 보낸다',
          next: 'beacon_deploy',
        },
        {
          text: '착륙선 외부를 탐색한다',
          next: 'surface_explore',
          effect: { health: -5, hunger: -10 },
        },
      ],
    },

    holo_log: {
      day: 1,
      title: '이전 탐사대의 기록',
      text: `홀로그램에 두 사람의 얼굴이 떴다.
"Nikos입니다. 1차 탐사대장. 이 행성의 공명 결정은 외계 생명체의 언어입니다.
절대 가져가지 마시오 — 아니, 가져갔다면 그것이 당신의 열쇠가 될 겁니다.
Cheng이 발견했습니다. 결정이 그들과 소통의 주파수를 맞춥니다."
로그가 끊겼다.`,
      pi: 10,
      choices: [
        {
          text: '[결정] 공명 결정을 꺼내 비콘에 붙인다',
          next: 'crystal_beacon',
          requires: 'crystal',
          requireDesc: '결정이 없다. 비콘만 가동한다.',
          pi: 5,
        },
        {
          text: '일단 비콘을 가동하고 탐색에 나선다',
          next: 'beacon_deploy',
        },
      ],
    },

    crystal_beacon: {
      day: 1,
      title: '공명 증폭',
      text: `결정을 비콘 안테나에 접촉하자 주파수가 폭발적으로 증폭됐다.
평소라면 72시간 걸릴 신호가 4분 만에 모선에 닿았다.
"모선 여기. 착륙선 위치 확인. 회수 셔틀 발진합니다. ETA 90분."
결정이 진동했다. 무언가가 응답한 것처럼.`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '공명 결정이 두 역할을 했다. 모선과의 다리, 그리고 이 행성과의 첫 인사.',
    },

    beacon_deploy: {
      day: 1,
      title: '비콘 가동',
      text: `비콘을 가동했다. 신호가 발신되기 시작한다.
그런데 수신 강도가 너무 낮다. 모선에 닿으려면 최소 40시간이 걸릴 것 같다.
시간이 촉박하다.`,
      choices: [
        {
          text: '[결정] 결정으로 신호를 증폭한다',
          next: 'crystal_beacon',
          requires: 'crystal',
          requireDesc: '신호 강도가 부족하다. 더 기다려야 한다.',
          pi: 10,
        },
        {
          text: '신호를 보내놓고 탐색에 나선다',
          next: 'surface_explore',
          effect: { health: -5, hunger: -10 },
        },
        {
          text: '[우주복 수리] 착륙선을 수리해 안테나를 높이 세운다',
          next: 'antenna_boost',
          requires: 'suit_patch',
          requireDesc: '수리 도구가 없다',
          pi: 8,
          effect: { health: -10 },
        },
      ],
    },

    antenna_boost: {
      day: 1,
      title: '안테나 수리',
      text: `착륙선 외부 안테나를 수리 키트로 높이 세웠다.
신호 강도가 3배로 올랐다.
모선으로부터 응답이 왔다. "확인. 회수 셔틀 발진. ETA 6시간."`,
      pi: 10,
      choices: [
        { text: '착륙선에서 모선을 기다린다', next: 'wait_pickup' },
      ],
    },

    surface_explore: {
      day: 1,
      title: '행성 표면',
      text: `보랏빛 평원. 바위에서 빛이 새어나온다.
공명 결정과 같은 재질이다.
멀리서 움직이는 것이 보인다. 생명체다.`,
      choices: [
        {
          text: '[결정] 결정을 꺼내 생명체에게 천천히 다가간다',
          next: 'alien_contact',
          requires: 'crystal',
          requireDesc: '결정이 없다. 생명체가 위협적으로 느껴져 피한다.',
          pi: 5,
        },
        {
          text: '생명체를 피해 착륙선으로 돌아간다',
          next: 'back_to_lander',
          effect: { health: -5, hunger: -5 },
        },
        {
          text: '생명체를 향해 손을 든다',
          next: 'alien_hostile',
          effect: { health: -30 },
        },
      ],
    },

    alien_contact: {
      day: 1,
      title: '첫 접촉',
      text: `결정을 내밀자 생명체가 멈췄다.
그것도 같은 결정을 가지고 있었다. 두 결정이 진동을 주고받았다.
이미지가 머릿속에 들어왔다 — 착륙선, 모선, 궤도, 직선으로 연결된 경로.
그들이 당신을 안내하려 한다.`,
      pi: 15,
      choices: [
        { text: '생명체의 안내를 따른다', next: 'alien_guide' },
      ],
    },

    alien_guide: {
      day: 1,
      title: '안내',
      text: `생명체가 언덕 위로 데려갔다.
그 위에는 거대한 신호 증폭 구조물이 있었다. 그들의 것이었다.
결정을 구조물에 접촉하자 신호가 쏘아 올려졌다.
"모선 여기. 무슨 신호가 이렇게 강한 거야? 착륙선 위치 확인. 즉시 회수합니다."`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '인류 최초의 외계 접촉. 그 통로는 공명 결정 하나였다. 그리고 용기.',
    },

    alien_hostile: {
      day: 1,
      title: '오해',
      text: `생명체가 경보음을 냈다. 무리가 몰려왔다.
우주복을 찢으려 한다.`,
      isEnd: true,
      endType: 'criminal',
      endText: '무기도 결정도 없는 손짓은 위협으로 읽혔다. 소통 없는 접근은 위험하다.',
    },

    back_to_lander: {
      day: 2,
      title: '착륙선 귀환',
      text: `착륙선으로 돌아왔다. 비콘이 깜박이고 있다.
신호가 아직 모선에 닿지 않았다.
산소 잔여량 — 20시간.`,
      choices: [
        {
          text: '[결정] 이제라도 결정으로 비콘을 증폭한다',
          next: 'crystal_beacon',
          requires: 'crystal',
          requireDesc: '결정이 없다. 신호가 닿기를 기다린다.',
          pi: 5,
        },
        {
          text: '[우주복 수리] 착륙선 안테나를 수리해 올린다',
          next: 'antenna_boost',
          requires: 'suit_patch',
          requireDesc: '수리 도구가 없다. 기다린다.',
          pi: 5,
        },
        {
          text: '신호가 닿기를 기다린다',
          next: 'wait_timeout',
          effect: { health: -20, hunger: -30 },
        },
      ],
    },

    /* ── Day 2-3 ────────────────────────────────────── */

    wait_pickup: {
      day: 2,
      title: '대기',
      text: `6시간 뒤 회수 셔틀이 착지했다.
파일럿이 해치를 열었다. "살아있네요!"`,
      pi: 5,
      choices: [
        { text: '셔틀에 탑승한다', next: 'success_pickup' },
      ],
    },

    wait_timeout: {
      day: 3,
      title: '시간 초과',
      text: `모선이 궤도를 떠났다. 신호는 닿지 않았다.
산소가 바닥났다.`,
      isEnd: true,
      endType: 'illness',
      endText: '72시간의 창이 닫혔다. 타이밍이 전부였다.',
    },

    /* ── End Scenes ────────────────────────────────── */

    success_pickup: {
      day: 2,
      title: '귀환',
      text: `셔틀이 모선과 도킹했다.
모선 선원들이 박수를 쳤다.
KEPLER-3 행성이 창문 너머로 멀어졌다.`,
      isEnd: true,
      endType: 'success',
      pi: 10,
      endText: '미지의 행성에서 살아 돌아왔다. 우주는 넓고, 인간은 작지만 끈질기다.',
    },

  },
};
