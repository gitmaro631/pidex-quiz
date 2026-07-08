export const SAVANNA = {
  id: 'savanna',
  name: '아프리카 사바나',
  emoji: '🦁',
  startScene: 'jeep_crash',
  items: {
    spear:    { label: '창',    emoji: '🏹', desc: '위협·사냥·횃불 대용' },
    water_bag:{ label: '물자루', emoji: '🫙', desc: '물 보관·부족 교류' },
    fire_kit: { label: '부싯돌', emoji: '🪨', desc: '불 피우기·신호 연기' },
  },
  scenes: {

    /* ── Day 1 ─────────────────────────────────────── */

    jeep_crash: {
      day: 1,
      title: '사파리 사고',
      text: `사파리 지프가 건기에 갈라진 땅에 바퀴가 빠져 전복됐다.
마사이 마라 국립공원 한가운데.
가이드는 의식이 없다. 무전기는 망가졌다.
저 멀리 아카시아 나무 그늘 아래 사자 무리가 보인다.`,
      effect: { health: -10, hunger: -10 },
      choices: [
        {
          text: '[부싯돌] 마른 풀에 불을 붙여 연기 신호를 올린다',
          next: 'signal_smoke',
          requires: 'fire_kit',
          requireDesc: '불을 피울 수단이 없다',
          pi: 5,
        },
        {
          text: '강이 있는 방향으로 이동한다',
          next: 'river_direction',
          effect: { health: -5, hunger: -15 },
        },
        {
          text: '아카시아 나무 위로 피신한다',
          next: 'tree_refuge',
          effect: { health: -5 },
        },
      ],
    },

    signal_smoke: {
      day: 1,
      title: '연기 신호',
      text: `마른 풀더미에 불이 붙었다.
연기 기둥이 하늘 높이 솟았다.
10분 뒤 공원 순찰 헬기가 방향을 바꾸며 다가왔다.`,
      isEnd: true,
      endType: 'success',
      pi: 20,
      endText: '사바나는 높은 곳에 있는 자를 먼저 본다. 연기 하나가 생사를 갈랐다.',
    },

    tree_refuge: {
      day: 1,
      title: '아카시아 나무',
      text: `나무 위에 올랐다. 사자들이 지프 주위를 어슬렁거린다.
높은 곳에서 보니 북쪽으로 강이 반짝인다.
남쪽에는 마사이 마을 지붕이 보인다.`,
      choices: [
        {
          text: '마을 방향으로 이동한다',
          next: 'maasai_approach',
          effect: { health: -10, hunger: -15 },
        },
        {
          text: '강 방향으로 이동한다',
          next: 'river_direction',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    river_direction: {
      day: 1,
      title: '강을 향해',
      text: `강물 소리가 들린다. 이동하는 중 사자 한 마리가 길을 막는다.
눈을 마주쳤다. 도망치면 안 된다.`,
      choices: [
        {
          text: '[창] 창을 앞으로 세우고 천천히 물러선다',
          next: 'lion_standoff',
          requires: 'spear',
          requireDesc: '맨손으로 맞선다. 사자가 돌진한다.',
          pi: 5,
        },
        {
          text: '[부싯돌] 불꽃을 일으켜 사자를 겁준다',
          next: 'fire_lion',
          requires: 'fire_kit',
          requireDesc: '불이 없다. 사자가 돌진한다.',
          pi: 8,
        },
        {
          text: '나무 위로 달려 올라간다',
          next: 'lion_tree_climb',
          effect: { health: -20 },
        },
      ],
    },

    lion_standoff: {
      day: 1,
      title: '대치',
      text: `창을 세우고 눈을 마주친 채 서 있었다.
1분이 영원처럼 느껴졌다.
사자가 먼저 시선을 거뒀다. 천천히 물러났다.
창이 없었다면 달랐을 것이다.`,
      pi: 8,
      choices: [
        { text: '강을 향해 계속 이동한다', next: 'river_bank' },
      ],
    },

    fire_lion: {
      day: 1,
      title: '불 위협',
      text: `스파크가 사자 눈앞에서 터졌다.
사자가 뒤로 물러났다. 불을 무서워한다.`,
      pi: 10,
      choices: [
        { text: '강을 향해 계속 이동한다', next: 'river_bank' },
      ],
    },

    lion_tree_climb: {
      day: 1,
      title: '나무 위로',
      text: `간신히 올라갔지만 발톱에 긁혔다.
사자가 한 시간을 기다리다 떠났다.`,
      effect: { health: -15 },
      choices: [
        { text: '강을 향해 계속 이동한다', next: 'river_bank', effect: { health: -5, hunger: -10 } },
      ],
    },

    lion_death: {
      day: 1,
      title: '사자',
      text: `사자가 돌진했다. 순식간이었다.`,
      isEnd: true,
      endType: 'criminal',
      endText: '사바나는 포식자의 왕국이다. 맨손으로 맞서는 것은 패배를 의미한다.',
    },

    /* ── Day 1-2 ────────────────────────────────────── */

    river_bank: {
      day: 1,
      title: '강가',
      text: `강에 도착했다. 물을 마셨다.
그런데 맞은편 강가에 악어들이 있다.
상류로 가면 마사이 마을이 있을 것 같다.`,
      effect: { health: 5, hunger: -10 },
      choices: [
        {
          text: '[창] 창으로 악어를 위협하며 강을 건넌다',
          next: 'croc_crossing',
          requires: 'spear',
          requireDesc: '악어를 피할 방법이 없다',
          pi: 5,
          effect: { health: -10 },
        },
        {
          text: '상류를 따라 마을을 찾는다',
          next: 'maasai_approach',
          effect: { health: -10, hunger: -15 },
        },
      ],
    },

    croc_crossing: {
      day: 1,
      title: '강 횡단',
      text: `창으로 수면을 세게 두드리며 건넜다.
악어들이 물 속으로 들어갔다.
건넌 뒤 무릎이 떨렸다.`,
      pi: 5,
      choices: [
        { text: '마을을 향해 이동한다', next: 'maasai_approach', effect: { health: -5, hunger: -10 } },
      ],
    },

    maasai_approach: {
      day: 2,
      title: '마사이 마을',
      text: `마을 입구에 전사가 서 있다.
창을 들고 막아선다.
교류를 시도해야 한다.`,
      choices: [
        {
          text: '[물자루] 물자루를 내밀며 물을 요청한다',
          next: 'water_exchange',
          requires: 'water_bag',
          requireDesc: '교류할 것이 없다. 전사가 길을 막는다.',
          pi: 10,
        },
        {
          text: '두 손을 들어 평화를 표시한다',
          next: 'peaceful_approach',
          effect: { health: -5 },
        },
      ],
    },

    water_exchange: {
      day: 2,
      title: '물 교환',
      text: `물자루를 내밀자 전사의 표정이 부드러워졌다.
마을 안으로 안내됐다.
장로가 무전기를 꺼냈다. 공원 관리소와 연결해줬다.`,
      pi: 10,
      choices: [
        { text: '구조를 기다린다', next: 'success_village' },
      ],
    },

    peaceful_approach: {
      day: 2,
      title: '교류',
      text: `두 손을 들었다. 전사가 잠시 보다가 고개를 끄덕였다.
마을 안으로 들어갔다.`,
      choices: [
        { text: '도움을 요청한다', next: 'success_village', pi: 5 },
      ],
    },

    researcher_camp: {
      day: 1,
      title: '연구 캠프',
      text: `강 근처 텐트 두 개가 보인다.
"Nikos입니다. 야생동물 생태 연구팀이에요. 이 쪽은 Cheng."
Cheng이 위성 전화를 들었다. "공원 관리소 부를게요."`,
      pi: 10,
      choices: [
        { text: '구조를 기다린다', next: 'success_rescue_camp' },
      ],
    },

    success_rescue_camp: {
      day: 1,
      title: '구조',
      text: `30분 뒤 공원 순찰차가 왔다.
Nikos와 Cheng은 연구를 계속하겠다며 남았다.
"다음엔 가이드 없이 오지 마세요."`,
      isEnd: true,
      endType: 'success',
      pi: 15,
      endText: '사바나 한가운데 연구자 둘이 있었다. 뜻밖의 만남이 생명줄이 됐다.',
    },

    /* ── Night ─────────────────────────────────────── */

    night_savanna: {
      day: 2,
      title: '사바나의 밤',
      text: `어둠이 내렸다. 하이에나 울음소리가 사방에서 들린다.
불 없이는 버티기 힘들다.`,
      choices: [
        {
          text: '[부싯돌+창] 창에 불을 붙여 횃불로 쓴다',
          next: 'torch_march',
          requires: ['fire_kit', 'spear'],
          requireDesc: '불과 창이 모두 필요하다',
          pi: 12,
        },
        {
          text: '나무 위에서 밤을 지새운다',
          next: 'tree_night',
          effect: { health: -15, hunger: -20 },
        },
      ],
    },

    torch_march: {
      day: 2,
      title: '횃불 행진',
      text: `창 끝에 불을 붙였다. 횃불이다.
하이에나들이 불을 피해 달아났다.
새벽까지 걸어 마을에 닿았다.`,
      pi: 5,
      choices: [
        { text: '마을에 들어선다', next: 'success_village' },
      ],
    },

    tree_night: {
      day: 2,
      title: '나무 위 밤',
      text: `아침이 됐다. 하이에나들이 떠났다.
지친 몸으로 마을을 향해 출발한다.`,
      choices: [
        { text: '마을로 향한다', next: 'maasai_approach', effect: { health: -10, hunger: -15 } },
      ],
    },

    /* ── End Scenes ────────────────────────────────── */

    success_village: {
      day: 2,
      title: '마을',
      text: `마사이 전통 음식을 대접받았다.
공원 관리소 차량이 마중을 나왔다.`,
      isEnd: true,
      endType: 'success',
      pi: 10,
      endText: '사자와 악어와 하이에나의 왕국을 지나왔다. 살아있다.',
    },

    dehydration: {
      day: 2,
      title: '탈수',
      text: `건기의 열기가 모든 수분을 빼앗았다.
쓰러졌다.`,
      isEnd: true,
      endType: 'hunger',
      endText: '사바나에서 물은 목숨이다. 물자루가 비어있었다.',
    },

  },
};
