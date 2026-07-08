export const ARCTIC = {
  id: 'arctic',
  name: '남극 설원',
  emoji: '🧊',
  startScene: 'blizzard_end',
  items: {
    thermal:  { label: '방한복',     emoji: '🧥', desc: '동사 방지·체온 유지' },
    ice_pick: { label: '아이스픽',   emoji: '⛏️', desc: '빙벽 극복·얼음 낚시' },
    radio:    { label: '비상 라디오', emoji: '📻', desc: '구조 신호 발신' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    blizzard_end: {
      day: 1,
      title: '폭풍 직후',
      text: `설상차가 크레바스에 빠졌다. 블리자드가 막 끝났다.
영하 38도. 바람이 피부를 벤다.
남극 세종 기지가 40km 떨어져 있다고 기억한다.
하늘이 맑아지는 틈을 이용해야 한다.`,
      effect: { health: -15, hunger: -15 },
      choices: [
        {
          text: '[라디오] 비상 라디오로 기지에 연락한다',
          next: 'radio_call',
          requires: 'radio',
          requireDesc: '라디오가 없다. 혼자 헤쳐나가야 한다.',
          pi: 5,
        },
        {
          text: '기지 방향으로 이동을 시작한다',
          next: 'ice_trek',
          effect: { health: -15, hunger: -15 },
        },
        {
          text: '[방한복] 얼음 쉘터를 짓고 폭풍을 다시 버틸 준비를 한다',
          next: 'ice_shelter',
          requires: 'thermal',
          requireDesc: '방한복 없이 쉘터를 짓다가 저체온증이 온다',
          pi: 5,
        },
      ],
    },

    radio_call: {
      day: 1,
      title: '교신',
      text: `잡음 너머로 목소리가 들렸다.
"여기 기지입니다. 좌표 수신했습니다. 설상차 출동 — 90분 소요."
떨리는 손으로 라디오를 꼭 쥐었다.`,
      pi: 10,
      choices: [
        {
          text: '[방한복] 방한복을 입고 구조대를 기다린다',
          next: 'wait_rescue_thermal',
          requires: 'thermal',
          requireDesc: '방한복 없이 90분을 버티는 건 위험하다.',
          pi: 3,
          effect: { health: 5 },
        },
        {
          text: '눈 속에 몸을 파고 체온을 유지하며 기다린다',
          next: 'wait_rescue_bare',
          effect: { health: -20 },
        },
      ],
    },

    wait_rescue_thermal: {
      day: 1,
      title: '구조대 도착',
      text: `방한복이 체온을 지켰다.
85분 뒤 설상차 불빛이 보였다. 기지 대원들이 달려왔다.`,
      isEnd: true,
      endType: 'success',
      pi: 12,
      endText: '영하 38도에서 90분을 버텼다. 라디오와 방한복이 생명줄이었다.',
    },

    wait_rescue_bare: {
      day: 1,
      title: '한계',
      text: `30분이 지나자 손발 감각이 사라졌다.
의식이 흐려진다. 설상차가 도착했을 때 손이 움직이지 않았다.
가까스로 살아났다.`,
      isEnd: true,
      endType: 'success',
      pi: 5,
      endText: '살았지만, 방한복 없이 버티는 건 도박이었다.',
    },

    ice_shelter: {
      day: 1,
      title: '눈 쉘터',
      text: `방한복을 입은 채 눈을 파 이글루 형태의 쉘터를 만들었다.
내부 온도가 -15도로 올랐다. 살 것 같다.
다음 폭풍이 오기 전에 이동해야 한다.`,
      pi: 5,
      choices: [
        {
          text: '[아이스픽] 빙원을 뚫고 얼음 낚시로 식량을 확보한다',
          next: 'ice_fishing',
          requires: 'ice_pick',
          requireDesc: '얼음을 뚫을 수 없다',
          pi: 8,
          effect: { health: 5, hunger: 20 },
        },
        {
          text: '날씨가 풀리면 기지를 향해 이동한다',
          next: 'ice_trek',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    ice_fishing: {
      day: 1,
      title: '남극 빙어',
      text: `빙원을 뚫자 맑은 물이 올라왔다.
생선을 잡았다. 날것이지만 체력이 살아났다.
쉘터 밖으로 펭귄 한 마리가 코를 들이밀었다.`,
      pi: 5,
      choices: [
        { text: '펭귄을 따라가 본다', next: 'penguin_follow' },
        { text: '기지 방향으로 이동을 시작한다', next: 'ice_trek', effect: { health: -10, hunger: -10 } },
      ],
    },

    penguin_follow: {
      day: 1,
      title: '펭귄의 길',
      text: `펭귄은 30분을 걸어 해안 절벽 위로 안내했다.
절벽 아래, 얼음 틈 사이로 기지의 안테나가 보인다!
펭귄들은 이 경로를 알고 있었다.`,
      pi: 15,
      choices: [
        {
          text: '[아이스픽] 절벽을 타고 기지로 내려간다',
          next: 'cliff_descent',
          requires: 'ice_pick',
          requireDesc: '아이스픽 없이 절벽은 불가능하다',
          pi: 5,
          effect: { health: -10 },
        },
        { text: '빙원을 돌아 기지 입구를 찾는다', next: 'base_arrive', effect: { health: -15, hunger: -15 } },
      ],
    },

    cliff_descent: {
      day: 1,
      title: '절벽 하강',
      text: `아이스픽으로 빙벽에 확보하며 내려갔다.
기지 출입문이 눈앞에 보인다.
노크하자 문이 열렸다.`,
      pi: 5,
      choices: [
        { text: '기지 안으로 들어간다', next: 'base_arrive' },
      ],
    },

    /* ── Day 2 ─────────────────────────────────────── */

    ice_trek: {
      day: 2,
      title: '빙원 행군',
      text: `영하 30도의 평원을 걷는다.
지평선까지 하얀 것뿐이다.
4시간 뒤 저 멀리 빨간 구조물이 보인다 — 기지다.
그런데 발 아래 얼음이 갈라지는 소리가 들린다.`,
      effect: { health: -20, hunger: -25 },
      choices: [
        {
          text: '[아이스픽] 얼음 상태를 확인하며 조심히 이동한다',
          next: 'safe_crossing',
          requires: 'ice_pick',
          requireDesc: '확인 없이 발을 내딛는다. 얼음이 깨진다.',
          pi: 5,
          effect: { health: -5 },
        },
        {
          text: '돌아서 먼 길로 우회한다',
          next: 'detour_path',
          effect: { health: -15, hunger: -15 },
        },
      ],
    },

    safe_crossing: {
      day: 2,
      title: '안전 이동',
      text: `아이스픽으로 두드리며 단단한 얼음만 밟았다.
20분 뒤 안전 지대에 도달했다.
기지가 1km 앞이다.`,
      choices: [
        { text: '기지로 달려간다', next: 'base_arrive', pi: 5 },
      ],
    },

    detour_path: {
      day: 2,
      title: '우회로',
      text: `2시간을 더 걸었다. 체력이 바닥났다.
기지가 보인다. 마지막 힘을 쥐어짠다.`,
      effect: { health: -20, hunger: -20 },
      choices: [
        { text: '기지 문을 두드린다', next: 'base_arrive' },
      ],
    },

    ice_crack: {
      day: 2,
      title: '크레바스',
      text: `발 아래 얼음이 깨졌다.
차가운 물 속으로 빠졌다.`,
      isEnd: true,
      endType: 'injury',
      endText: '남극의 얼음은 눈으로 볼 수 없는 위험을 숨긴다.',
    },

    /* ── End Scenes ────────────────────────────────── */

    base_arrive: {
      day: 2,
      title: '기지 도착',
      text: `문이 열렸다. 따뜻한 공기가 밀려왔다.
"Nikos입니다. 기지 대장이에요. 이 쪽은 Cheng. 우리가 수색 준비하던 참이었어요."
핫초코가 손에 쥐어졌다.`,
      isEnd: true,
      endType: 'success',
      pi: 12,
      endText: '영하 38도를 걷고 돌아왔다. 기지의 불빛이 이렇게 아름다울 수 없었다.',
    },

    hypothermia: {
      day: 2,
      title: '저체온증',
      text: `몸이 떨리다가 멈췄다. 저체온증의 역설적 온기가 찾아왔다.
눈 위에 쓰러졌다.`,
      isEnd: true,
      endType: 'illness',
      endText: '남극은 따뜻하게 죽는 법을 알고 있다. 방한이 전부였다.',
    },

  },
};
