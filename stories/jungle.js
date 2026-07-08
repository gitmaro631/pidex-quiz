export const JUNGLE = {
  id: 'jungle',
  name: '아마존 정글',
  desc: '헬기 추락. 아마존 깊은 곳. 마을까지 4일.',
  emoji: '🌿',
  startScene: 'crash_site',

  items: {
    knife:   { label: '나이프',  emoji: '🔪', desc: '덫 제작·길 개척' },
    lighter: { label: '라이터',  emoji: '🔥', desc: '불 피우기·신호' },
    bottle:  { label: '물통',    emoji: '💧', desc: '물 보관·정수' },
  },

  scenes: {

    /* ══ DAY 1 ══════════════════════════════════════ */

    crash_site: {
      day: 1, title: '추락 현장',
      text: '눈을 떴다. 헬기 잔해에 끼인 채로. 어깨에서 통증이 느껴지지만 뼈는 멀쩡하다. 짙어지는 연기가 이 자리를 떠나야 한다고 경고한다. 서쪽에서 강 소리가 들린다.',
      effect: { hunger: -5 },
      choices: [
        { text: '강 소리를 향해 이동한다', next: 'river_approach' },
        { text: '잔해를 먼저 수색한다', next: 'wreck_search' },
      ],
    },

    wreck_search: {
      day: 1, title: '잔해 수색',
      text: '조종석 아래에서 비상용 에너지바를 찾았다. 동시에 연료 냄새가 강해졌다. 불꽃이 튀면 끝이다.',
      effect: { hunger: -5 },
      choices: [
        { text: '에너지바를 챙기고 즉시 빠져나간다', next: 'river_approach', effect: { hunger: 20 }, pi: 2 },
        { text: '조금 더 뒤진다', next: 'explosion' },
      ],
    },

    explosion: {
      day: 1, title: '폭발',
      text: '연료에 불이 붙었다. 폭발에 날아가 나무에 부딪혔다. 갈비뼈에서 뚝 소리가 났다.',
      isEnd: true, endType: 'injury',
      endText: '갈비뼈 골절. 정글 속에서 혼자 버티기엔 너무 심각한 부상이었다.',
    },

    river_approach: {
      day: 1, title: '강가',
      text: '강에 도달했다. 탁하고 빠른 물줄기. 목이 타들어간다. 정수 없이 마시면 기생충 위험이 있다.\n\n손에 든 소지품을 둘러봤다. 뭔가 다른 방법이 있을 것 같다.',
      effect: { hunger: -10 },
      choices: [
        { text: '강물을 그냥 마신다', next: 'drink_raw' },
        { text: '불을 피워 끓여 마신다', next: 'boil_water', requires: 'lighter', requireDesc: '라이터가 없다', pi: 3 },
        { text: '물통에 채워두고 계속 이동한다', next: 'day2_path', requires: 'bottle', requireDesc: '물통이 없다', pi: 2 },
        { text: '물통과 라이터로 태양열 증류기를 만든다', next: 'solar_still', requires: ['bottle', 'lighter'], requireDesc: '물통과 라이터가 모두 필요하다', pi: 12 },
        { text: '참고 계속 이동한다', next: 'day2_thirsty' },
      ],
    },

    solar_still: {
      day: 1, title: '태양열 증류기',
      text: '물통 한쪽을 잘라 강가 웅덩이 위에 걸쳐 증류기를 만들었다. 시간이 걸렸지만 깨끗한 물을 얻었다.\n\n그 과정에서 반짝이는 물통 표면이 햇빛을 반사했다. 상공에서 무언가가 반응했다. 30분 후, 헬기 소리가 들렸다.',
      effect: { health: 10 },
      choices: [
        { text: '트인 곳으로 달려가 신호를 보낸다', next: 'early_rescue' },
      ],
    },

    early_rescue: {
      day: 1, title: '기적의 구조',
      text: '헬기가 내려왔다. 조종사가 눈을 크게 떴다.\n\n"당신... 어제 실종됐다고 들었는데. 어떻게 이렇게 빨리?"\n\n물통과 라이터. 누가 봐도 평범해 보이는 두 물건이 예상치 못한 기적을 만들었다.',
      isEnd: true, endType: 'success',
      endText: '1일 — 물통과 라이터의 조합이 첫날 탈출을 만들었다.',
      pi: 15,
    },

    drink_raw: {
      day: 1, title: '날 것의 강물',
      text: '마셨다. 당장은 살 것 같다. 몇 시간 뒤 배가 뒤틀리기 시작했다. 기생충이다.',
      effect: { health: -25 },
      choices: [
        { text: '참고 계속 걷는다', next: 'day2_path' },
      ],
    },

    boil_water: {
      day: 1, title: '끓인 물',
      text: '마른 나무를 모아 불을 피웠다. 강물을 끓여 안전하게 마셨다. 라이터 연료가 줄었다.',
      choices: [
        { text: '하류를 따라 이동한다', next: 'day2_path' },
      ],
    },

    /* ══ DAY 2 ══════════════════════════════════════ */

    day2_thirsty: {
      day: 2, title: '탈수',
      text: '탈수 증세가 왔다. 입술이 갈라지고 머리가 지끈거린다.',
      effect: { health: -20, hunger: -15 },
      choices: [
        { text: '강 지류를 찾아 마신다', next: 'day2_path' },
        { text: '참고 계속 이동한다', next: 'collapse' },
      ],
    },

    collapse: {
      day: 2, title: '쓰러짐',
      text: '온몸이 뜨겁다. 더 이상 발이 떨어지지 않는다.',
      isEnd: true, endType: 'hunger',
      endText: '탈수로 쓰러졌다. 정글은 물 없이는 하루를 버티기도 어렵다.',
    },

    day2_path: {
      day: 2, title: '이틀째 정글',
      text: '이틀째 아침. 온몸이 쑤신다. 앞에 강 지류가 가로막고 있다. 배가 극도로 고프다.',
      effect: { hunger: -15 },
      choices: [
        { text: '강 지류를 건넌다', next: 'river_cross' },
        { text: '나이프로 덫을 만들어 식량을 확보한다', next: 'set_trap', requires: 'knife', requireDesc: '나이프가 없으면 덫을 만들 수 없다' },
        { text: '주변 식물에서 먹을 것을 찾는다', next: 'forage' },
        { text: '물통으로 빗물을 모아 마신다', next: 'rainwater', requires: 'bottle', requireDesc: '물통이 없다', pi: 3 },
      ],
    },

    rainwater: {
      day: 2, title: '빗물 수집',
      text: '물통을 펼쳐 나뭇잎 위에 내리는 빗방울을 모았다. 깨끗한 빗물. 예상치 못한 곳에서 쓸모가 있었다.',
      effect: { health: 10 },
      choices: [
        { text: '강 지류를 건넌다', next: 'river_cross' },
      ],
    },

    set_trap: {
      day: 2, title: '덫 설치',
      text: '나이프로 나뭇가지를 다듬어 덫을 만들었다. 아침에 작은 설치류가 걸렸다. 불을 피워 구워 먹었다. 허기가 가셨다.',
      effect: { hunger: 25 },
      choices: [
        { text: '강 지류를 건너 계속 이동한다', next: 'river_cross', pi: 4 },
      ],
    },

    forage: {
      day: 2, title: '채집',
      text: '빨갛고 탐스러운 열매를 발견했다. 색깔은 좋아 보인다. 하지만 정글의 열매는 독이 있는 것이 많다.',
      effect: { hunger: -5 },
      choices: [
        { text: '냄새를 맡고 먹는다', next: 'forage_eat' },
        { text: '포기하고 강으로 향한다', next: 'river_cross' },
      ],
    },

    forage_eat: {
      day: 2, title: '독성 열매',
      text: '입 안이 타는 듯한 감각. 독성 식물이었다. 온몸에 경련이 일었다.',
      isEnd: true, endType: 'illness',
      endText: '정글에서 모르는 열매를 먹는 건 도박이다. 치명적인 실수였다.',
    },

    river_cross: {
      day: 2, title: '강 지류 도하',
      text: '지류로 들어섰다. 예상보다 물살이 세다. 어떻게 건널 것인가.',
      effect: { hunger: -5 },
      choices: [
        { text: '그냥 강행한다', next: 'river_slip' },
        { text: '얕은 곳을 찾아 우회한다', next: 'river_safe', effect: { hunger: -10 } },
        { text: '나이프로 지팡이를 만들어 안전하게 건넌다', next: 'river_safe', requires: 'knife', requireDesc: '나이프가 없다', pi: 2 },
      ],
    },

    river_slip: {
      day: 2, title: '물살에 휩쓸려',
      text: '발을 헛디뎌 10미터를 떠내려갔다. 간신히 바위를 잡았다. 짐이 모두 젖었고 어깨를 부딪혔다.',
      effect: { health: -25 },
      choices: [
        { text: '불을 피워 몸을 말린다', next: 'day3_fork', requires: 'lighter', requireDesc: '라이터가 없다', effect: { health: 10 }, pi: 2 },
        { text: '젖은 채로 계속 이동한다', next: 'day3_fork', effect: { health: -10 } },
      ],
    },

    river_safe: {
      day: 2, title: '무사 도하',
      text: '시간이 걸렸지만 안전하게 건넜다. 체력을 아꼈다.',
      choices: [
        { text: '계속 이동한다', next: 'day3_fork' },
      ],
    },

    /* ══ DAY 3 ══════════════════════════════════════ */

    day3_fork: {
      day: 3, title: '셋째 날 오전',
      text: '셋째 날. 정글이 조금 얇아지는 것 같다. 두 갈래 길이 나왔다.\n\n오른쪽엔 연기가 피어오르고, 왼쪽엔 맨발 발자국이 이어진다.',
      effect: { hunger: -15 },
      choices: [
        { text: '연기를 향해 오른쪽으로 간다', next: 'loggers_camp' },
        { text: '발자국을 따라 왼쪽으로 간다', next: 'tribe_encounter' },
      ],
    },

    loggers_camp: {
      day: 3, title: '불법 벌목 캠프',
      text: '연기의 근원은 벌목꾼들의 캠프였다. 총을 든 남자 셋이 당신을 발견했다. 눈빛이 좋지 않다.\n\n라이터가 있다면 다른 방법이 있을 것 같다.',
      choices: [
        { text: '손을 들고 도움을 요청한다', next: 'loggers_betray' },
        { text: '눈치를 보다 몰래 우회한다', next: 'loggers_sneak', pi: 3 },
        { text: '북쪽 덤불에 불을 붙여 혼란을 만든다', next: 'fire_diversion', requires: 'lighter', requireDesc: '라이터가 없다', pi: 8 },
      ],
    },

    loggers_betray: {
      day: 3, title: '배신',
      text: '리더가 음식을 주고 재워줬다. 새벽에 눈을 뜨니 깊은 정글 어딘가에 묶여 있었다.',
      isEnd: true, endType: 'criminal',
      endText: '불법 벌목꾼들에게 이용당했다. 낯선 곳에서 낯선 사람의 호의는 위험하다.',
    },

    fire_diversion: {
      day: 3, title: '화재 교란',
      text: '라이터로 캠프 북쪽 덤불에 불을 붙였다. 벌목꾼들이 소리를 지르며 불 쪽으로 달려갔다. 그 틈을 타 캠프 한가운데를 가로질렀다. 식량 가방 하나도 챙겼다.\n\n누가 봐도 당연한 용도 같은 라이터가 가장 예상치 못한 방식으로 길을 열었다.',
      effect: { hunger: 20 },
      choices: [
        { text: '계속 달린다', next: 'researcher_event' },
      ],
    },

    loggers_sneak: {
      day: 3, title: '우회 성공',
      text: '납작 엎드려 캠프를 우회했다. 벌목꾼들이 낸 길이 보였다. 이 길을 따라가니 속도가 빨라졌다.',
      choices: [
        { text: '길을 따라 계속 이동한다', next: 'researcher_event' },
      ],
    },

    tribe_encounter: {
      day: 3, title: '원주민',
      text: '발자국의 주인이 나타났다. 창을 든 원주민 두 명이 당신을 에워쌌다. 행동 하나가 상황을 결정한다.',
      choices: [
        { text: '천천히 손을 들어 무해함을 보인다', next: 'tribe_peace', pi: 5 },
        { text: '라이터를 꺼내 불꽃을 보여준다', next: 'tribe_gift', requires: 'lighter', requireDesc: '라이터가 없다', pi: 6 },
        { text: '틈을 봐서 도망친다', next: 'tribe_run' },
      ],
    },

    tribe_peace: {
      day: 3, title: '신뢰',
      text: '오랜 침묵 끝에 원주민이 창을 내렸다. 마을로 데려가 음식과 물을 줬다. 다음 날 아침, 방향을 알려줬다.',
      effect: { health: 20, hunger: 30 },
      choices: [
        { text: '알려준 방향으로 출발한다', next: 'researcher_event' },
      ],
    },

    tribe_gift: {
      day: 3, title: '불의 선물',
      text: '라이터를 건네자 원주민의 눈이 반짝였다. 크게 웃으며 환대해줬다. 음식과 방향을 알려받고 하룻밤 쉬었다.',
      effect: { health: 30, hunger: 40 },
      choices: [
        { text: '출발한다', next: 'researcher_event' },
      ],
    },

    tribe_run: {
      day: 3, title: '도주',
      text: '달렸다. 창이 머리 위를 스쳐지나갔다. 원주민 소리가 멀어졌지만 방향을 잃었다. 강을 다시 찾는 데 반나절이 걸렸다.',
      effect: { health: -20, hunger: -20 },
      choices: [
        { text: '강을 따라 하류로 내려간다', next: 'researcher_event' },
      ],
    },

    /* ══ SPECIAL: Pi Core Team Cameo ════════════════ */

    researcher_event: {
      day: 3, title: '낯선 연구자들',
      text: '지친 몸을 이끌고 걷던 중, 정글 끝에서 두 남자를 마주쳤다.\n\n한 명은 에너지가 넘치고 분산 네트워크에 대해 혼자 중얼거리는 외국인이었고, 다른 한 명은 말수가 적지만 눈빛이 날카로웠다. 배낭엔 위성 장비가 들어 있었다.\n\n"Nikos입니다. 이쪽은 Cheng." 짧은 소개 후, 두 사람은 아무 말 없이 GPS 좌표 쪽지를 건넸다.\n\n"이 방향으로 6시간이면 도로가 나옵니다."\n\n어떻게 여기 있냐고 물었지만, 두 사람은 그저 웃으며 정글 속으로 사라졌다.',
      effect: { health: 15, hunger: 15 },
      choices: [
        { text: '좌표를 따라 이동한다', next: 'day4_final', pi: 10 },
      ],
    },

    /* ══ DAY 4 ══════════════════════════════════════ */

    day4_final: {
      day: 4, title: '마지막 날',
      text: '넷째 날 오후. 정글이 열렸다. 저 멀리 도로와 차량이 보인다. 마지막 힘을 쥐어짜야 한다.',
      effect: { hunger: -15 },
      choices: [
        { text: '있는 힘을 다해 도로로 달린다', next: 'success_run', pi: 5 },
        { text: '연기 신호를 보낸다', next: 'success_signal', requires: 'lighter', requireDesc: '라이터가 없다', pi: 5 },
        { text: '트인 곳에서 크게 소리를 지른다', next: 'success_shout', pi: 3 },
        { text: '물통으로 햇빛을 반사해 신호를 보낸다', next: 'success_mirror', requires: 'bottle', requireDesc: '물통이 없다', pi: 7 },
      ],
    },

    success_run: {
      day: 4, title: '전력 질주',
      text: '온몸의 에너지를 쏟아부어 달렸다. 도로에 도달했다. 지나가던 트럭이 멈췄다.',
      isEnd: true, endType: 'success',
      endText: '4일간의 아마존 정글에서 살아남았다.',
    },

    success_signal: {
      day: 4, title: '연기 신호',
      text: '마른 나뭇잎을 모아 연기를 피웠다. 30분 뒤 도로 쪽에서 사람이 달려왔다.',
      isEnd: true, endType: 'success',
      endText: '4일간의 아마존 정글에서 살아남았다.',
    },

    success_shout: {
      day: 4, title: '절규',
      text: '목이 쉬도록 소리를 질렀다. 도로에서 차가 멈추더니 사람이 내렸다.',
      isEnd: true, endType: 'success',
      endText: '4일간의 아마존 정글에서 살아남았다.',
    },

    success_mirror: {
      day: 4, title: '반사 신호',
      text: '물통의 매끄러운 면으로 햇빛을 모아 반사했다. 도로 위 차량이 멈추고 운전자가 이쪽을 향해 걸어왔다.\n\n물통이 또 한 번 예상 밖의 역할을 해냈다.',
      isEnd: true, endType: 'success',
      endText: '4일간의 아마존 정글에서 살아남았다. 물통은 마지막까지 쓸모 있었다.',
    },
  },
};
