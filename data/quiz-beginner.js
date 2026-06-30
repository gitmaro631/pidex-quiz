// 초급 문항 — 10점 / 정답
// 형식: { id, q, choices[4], answer(0-3), explanation, source }
// 대본에서 뽑은 문제만 추가. 억지 문제 금지.
// id 규칙: B + 3자리 순번 (B001, B002 ...)

export const quizBeginner = [

  // ── 예시 문항 (대본 분석 후 실제 문항으로 교체) ──────
  {
    id: 'B001',
    q: 'DEX는 무엇의 줄임말인가요?',
    choices: [
      'Digital Exchange',
      'Decentralized Exchange',
      'Direct Exchange',
      'Derivative Exchange',
    ],
    answer: 1,
    explanation: 'DEX는 Decentralized Exchange, 탈중앙화 거래소의 줄임말입니다. 블록체인 위에서 코드가 직접 거래를 처리해요.',
    source: 'pidex_util_guide',
  },

  {
    id: 'B002',
    q: '오더북(Orderbook)이란 무엇인가요?',
    choices: [
      'DEX에서 유동성을 자동으로 결정하는 공식',
      '토큰의 가격 차이를 이용해 수익을 내는 방법',
      '사겠다는 주문과 팔겠다는 주문이 쌓여 있는 목록',
      '두 토큰을 일정 비율로 묶어두는 풀',
    ],
    answer: 2,
    explanation: '오더북은 매수 주문과 매도 주문이 층층이 쌓인 목록이에요. 업비트나 빗썸의 호가창이 바로 오더북입니다.',
    source: 'pidex_util_guide',
  },

  {
    id: 'B003',
    q: 'AMM이란 무엇인가요?',
    choices: [
      'Advanced Market Monitoring',
      'Automated Market Maker',
      'Asset Management Method',
      'Arbitrage Matching Module',
    ],
    answer: 1,
    explanation: 'AMM은 Automated Market Maker, 자동화된 시장조성자라는 뜻이에요. 풀에 두 자산을 넣어두면 공식이 자동으로 가격을 결정해줘요.',
    source: 'pidex_util_guide',
  },

];
