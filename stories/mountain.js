export const MOUNTAIN = {
  id: 'mountain',
  name: '히말라야 고산',
  emoji: '🏔️',
  startScene: 'snowfield',
  items: {
    rope:  { label: '로프',   emoji: '🪢', desc: '확보·하강·고정' },
    flare: { label: '신호탄', emoji: '🚀', desc: '구조 신호·야생동물 위협' },
    tea:   { label: '고산차', emoji: '🫖', desc: '고산병 완화·체온 유지' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    snowfield: {
      day: 1,
      title: '눈사태 직후',
      text: `눈을 떴다. 해발 4,800m.
눈사태가 트레킹 팀을 삼켜버렸다.
혼자다. 능선 너머로 내려가야 한다.
바람이 칼처럼 스친다.`,
      effect: { health: -15, hunger: -15 },
      choices: [
        {
          text: '경사면을 타고 아래로 내려간다',
          next: 'slope_descent',
        },
        {
          text: '능선을 따라 이동해 전체 지형을 파악한다',
          next: 'ridge_path',
        },
        {
          text: '[로프+신호탄] 로프에 신호탄을 묶어 계곡 건너편으로 발사한다',
          next: 'zipline_combo',
          requires: ['rope', 'flare'],
          requireDesc: '로프와 신호탄이 모두 있어야 한다',
          pi: 5,
        },
      ],
    },

    zipline_combo: {
      day: 1,
      title: '즉흥 집라인',
      text: `신호탄을 로프에 묶어 계곡 건너 바위에 쐈다.
줄이 걸렸다. 로프가 팽팽하게 당겨진다.
결사적으로 매달려 건넜다. 반대편에 팀 대피소가 보인다.
팀원들이 뛰어나온다. "어떻게 된 거야?!"`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '로프와 신호탄. 따로 있으면 평범한 장비지만, 합치자 탈출구가 됐다.',
    },

    slope_descent: {
      day: 1,
      title: '급경사',
      text: `빙판 경사면이다. 한 발만 삐끗해도 수백 미터 추락이다.
크레바스가 여기저기 입을 벌리고 있다.`,
      choices: [
        {
          text: '[로프] 로프로 확보하며 천천히 내려간다',
          next: 'safe_descent',
          requires: 'rope',
          requireDesc: '확보 장비 없이 내려가면 너무 위험하다',
          pi: 5,
          effect: { health: -10, hunger: -15 },
        },
        {
          text: '그냥 내려간다',
          next: 'slip_fall',
          effect: { health: -60, hunger: -10 },
        },
      ],
    },

    slip_fall: {
      day: 1,
      title: '추락',
      text: `발이 미끄러졌다.
순식간에 20미터를 미끄러졌다. 바위에 부딪혔다.
의식이 흐려진다.`,
      isEnd: true,
      endType: 'injury',
      endText: '히말라야는 방심을 허락하지 않는다. 한 발이 너무 가벼웠다.',
    },

    safe_descent: {
      day: 1,
      title: '안전 하강',
      text: `로프 덕분에 무사히 내려왔다.
발 아래로 좁은 계곡 길이 보인다.
고산증이 온다. 머리가 욱신거린다.`,
      pi: 5,
      choices: [
        {
          text: '[고산차] 차를 마시고 증상을 완화한다',
          next: 'tea_boost',
          requires: 'tea',
          requireDesc: '고산증이 심해지기 시작한다',
          pi: 5,
          effect: { health: 20 },
        },
        {
          text: '참고 계곡 길을 따라 이동한다',
          next: 'valley_path',
          effect: { health: -15, hunger: -15 },
        },
      ],
    },

    tea_boost: {
      day: 1,
      title: '고산차의 온기',
      text: `온기가 온몸에 퍼진다. 고산증 증상이 완화됐다.
머리가 맑아진다. 계곡 아래로 연기가 보인다.
사람이 사는 곳이다.`,
      pi: 3,
      choices: [
        { text: '연기를 향해 이동한다', next: 'valley_path', effect: { health: -5, hunger: -10 } },
      ],
    },

    ridge_path: {
      day: 1,
      title: '능선 위',
      text: `능선에서 바라보니 멀리 기상 관측소 철탑이 보인다.
반대쪽 사면에는 절의 지붕 같은 것도 눈에 들어온다.
바람이 거세지기 시작한다. 폭풍 전조다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '기상 관측소 철탑으로 이동한다',
          next: 'weather_station',
          effect: { health: -10, hunger: -10 },
        },
        {
          text: '절 방향으로 내려간다',
          next: 'monastery_near',
          effect: { health: -10, hunger: -15 },
        },
        {
          text: '[로프] 로프로 몸을 고정하며 폭풍 속에 능선을 횡단한다',
          next: 'ridge_cross',
          requires: 'rope',
          requireDesc: '로프 없이 폭풍 속 능선은 자살이다',
          pi: 5,
          effect: { health: -10, hunger: -10 },
        },
      ],
    },

    weather_station: {
      day: 1,
      title: '기상 관측소',
      text: `무인 관측소인 줄 알았다. 문을 열자 두 사람이 앉아 있었다.
"Nikos입니다. 기후 데이터 수집 중이에요. 이 쪽은 Cheng."
Cheng이 이미 위성 전화를 들었다. "구조대 부를게요. 45분이면 옵니다."
두 사람은 폭풍이 지나면 다시 데이터 수집을 재개할 거라며 남았다.`,
      pi: 15,
      choices: [
        { text: '구조 헬기를 기다린다', next: 'success_heli' },
      ],
    },

    ridge_cross: {
      day: 1,
      title: '능선 횡단',
      text: `로프로 자일 파트너처럼 바위에 확보하며 능선을 건넜다.
폭풍이 몰아쳤지만 로프가 버텨줬다.
반대편으로 내려오니 절 지붕이 코앞이다.`,
      pi: 5,
      choices: [
        { text: '절로 향한다', next: 'monastery_near', effect: { health: -5, hunger: -10 } },
      ],
    },

    /* ── Day 2 ─────────────────────────────────────── */

    valley_path: {
      day: 2,
      title: '계곡 길',
      text: `3시간을 걸었다. 멀리서 염불 소리가 들린다.
눈길 위로 발자국이 있다. 사람이 다니는 길이다.`,
      choices: [
        {
          text: '염불 소리를 따라간다',
          next: 'monastery_near',
        },
        {
          text: '[신호탄] 구조 신호를 쏜다',
          next: 'flare_signal',
          requires: 'flare',
          requireDesc: '신호를 보낼 수단이 없다',
          pi: 8,
        },
      ],
    },

    snowstorm_caught: {
      day: 2,
      title: '폭풍 속',
      text: `거센 눈보라가 시야를 막았다. 방향을 잃었다.
저체온증이 온다. 손발이 감각을 잃어간다.`,
      effect: { health: -30, hunger: -20 },
      choices: [
        {
          text: '[신호탄] 밤하늘에 신호탄을 쏜다',
          next: 'flare_signal',
          requires: 'flare',
          requireDesc: '아무도 모르는 곳에서 조용히 쓰러진다.',
          pi: 10,
        },
        {
          text: '눈 속에 몸을 파고 비박한다',
          next: 'snow_bivouac',
          effect: { health: -15 },
        },
      ],
    },

    snow_bivouac: {
      day: 2,
      title: '눈 비박',
      text: `눈굴을 팠다. 바람을 막자 온기가 조금 생겼다.
새벽이 되자 폭풍이 잦아들었다.
그런데 고산증 두통이 심해진다.`,
      choices: [
        {
          text: '[고산차] 차를 마시고 증상을 억누른다',
          next: 'tea_saves',
          requires: 'tea',
          requireDesc: '고산증이 악화된다. 의식을 잃어간다.',
          pi: 5,
          effect: { health: 15 },
        },
        {
          text: '고산증을 무시하고 강행군한다',
          next: 'altitude_death',
          effect: { health: -50 },
        },
      ],
    },

    tea_saves: {
      day: 2,
      title: '마지막 차 한 잔',
      text: `뜨거운 고산차가 의식을 되살렸다.
눈 속에서 새어나오는 빛이 보인다. 새벽이다.
저 아래에 절의 윤곽이 드러난다.`,
      choices: [
        { text: '절을 향해 내려간다', next: 'monastery_near', effect: { health: -10, hunger: -15 } },
      ],
    },

    altitude_death: {
      day: 2,
      title: '고산증',
      text: `눈앞이 하얗게 변했다. 고산증이 뇌를 압박했다.
4,600m의 눈 위에서 조용히 쓰러졌다.`,
      isEnd: true,
      endType: 'illness',
      endText: '고도가 인간을 압도했다. 산은 언제나 경건하게 대해야 한다.',
    },

    monastery_near: {
      day: 2,
      title: '티베트 사원',
      text: `낡은 목문이 삐걱거리며 열렸다.
스님 한 명이 나와 합장하며 안으로 안내한다.
따뜻한 방. 야크 버터 차 향기.`,
      choices: [
        {
          text: '도움을 청하고 구조를 요청한다',
          next: 'monk_help',
        },
        {
          text: '[고산차] 가져온 고산차를 꺼내 함께 나눈다',
          next: 'tea_ceremony',
          requires: 'tea',
          requireDesc: '나눌 것이 없다',
          pi: 10,
        },
      ],
    },

    tea_ceremony: {
      day: 2,
      title: '차 공양',
      text: `고산차를 꺼내자 스님의 눈이 빛난다.
같은 지역 찻잎이었다. 오래된 교역 품종이다.
주지 스님이 직접 나서서 교역로를 통해 마을까지 안내해 주겠다고 한다.
헬기보다 빠른 루트가 있다고.`,
      pi: 8,
      choices: [
        { text: '스님의 안내를 따른다', next: 'success_monastery' },
      ],
    },

    monk_help: {
      day: 2,
      title: '위성 전화',
      text: `스님이 낡은 위성 전화를 꺼냈다.
30분 뒤 구조 헬기 소리가 들렸다.`,
      pi: 5,
      choices: [
        { text: '헬기에 오른다', next: 'success_monastery' },
      ],
    },

    flare_signal: {
      day: 2,
      title: '붉은 신호',
      text: `신호탄이 설원을 붉게 물들였다.
15분 후 수색 헬기가 프로펠러 소리를 내며 나타났다.`,
      pi: 8,
      choices: [
        { text: '헬기에 오른다', next: 'success_heli' },
      ],
    },

    /* ── End Scenes ────────────────────────────────── */

    success_heli: {
      day: 1,
      title: '구조',
      text: `헬기 안에서 산소 마스크를 쓰자 세상이 선명해졌다.
창밖으로 히말라야 설봉이 멀어졌다.`,
      isEnd: true,
      endType: 'success',
      pi: 10,
      endText: '산이 당신을 보내줬다. 살아 돌아가라고.',
    },

    success_monastery: {
      day: 2,
      title: '사원을 떠나며',
      text: `사원 입구에서 스님들이 합장했다.
저 멀리 구조대 차량 불빛이 보인다.`,
      isEnd: true,
      endType: 'success',
      pi: 8,
      endText: '히말라야의 사원이 당신을 품었다. 4,800m에서 걸어 내려온 자.',
    },

  },
};
