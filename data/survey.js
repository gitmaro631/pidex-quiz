// 설문 문항 정의
// insertAfter: 초급 퀴즈 N번 문제 이후에 삽입 (null = 자동 배치)

export const surveyQuestions = [

  // ── A. 기본 프로필 ──────────────────────────────────
  {
    id: 'S_COUNTRY',
    group: 'profile',
    insertAfter: 3,
    type: 'single',
    q: '어느 나라에 계신가요? / Which country are you from?',
    choices: [
      { value: 'KR', label: '🇰🇷 한국 (Korea)' },
      { value: 'US', label: '🇺🇸 미국 (USA)' },
      { value: 'ID', label: '🇮🇩 인도네시아 (Indonesia)' },
      { value: 'IN', label: '🇮🇳 인도 (India)' },
      { value: 'PH', label: '🇵🇭 필리핀 (Philippines)' },
      { value: 'CN', label: '🇨🇳 중국 (China)' },
      { value: 'VN', label: '🇻🇳 베트남 (Vietnam)' },
      { value: 'OTHER', label: '기타 / Other' },
    ],
  },

  {
    id: 'S_JOIN_YEAR',
    group: 'profile',
    insertAfter: 6,
    type: 'single',
    q: '파이 네트워크에 언제 가입하셨나요? / When did you join Pi Network?',
    choices: [
      { value: '2019', label: '2019년 이전 / Before 2019' },
      { value: '2019', label: '2019년' },
      { value: '2020', label: '2020년' },
      { value: '2021', label: '2021년' },
      { value: '2022', label: '2022년' },
      { value: '2023', label: '2023년 이후 / 2023 or later' },
    ],
  },

  {
    id: 'S_MINING',
    group: 'profile',
    insertAfter: 9,
    type: 'single',
    q: '지금도 매일 파이를 채굴하고 있나요? / Are you still mining Pi daily?',
    choices: [
      { value: 'daily',    label: '네, 매일 채굴 중 / Yes, every day' },
      { value: 'sometimes', label: '가끔 까먹어요 / Sometimes I forget' },
      { value: 'rarely',   label: '거의 안 해요 / Rarely' },
      { value: 'stopped',  label: '그만뒀어요 / Stopped' },
    ],
  },

  // ── B. KYC ──────────────────────────────────────────
  {
    id: 'S_KYC',
    group: 'kyc',
    insertAfter: 12,
    type: 'single',
    q: 'KYC(신원 인증) 상태는 어떻게 되시나요? / What is your KYC status?',
    choices: [
      { value: 'passed',   label: '통과 완료 / Passed' },
      { value: 'pending',  label: '시도했지만 대기 중 / Tried, waiting' },
      { value: 'failed',   label: '시도했지만 실패 / Failed' },
      { value: 'notTried', label: '아직 시도 안 함 / Not tried yet' },
    ],
  },

  // ── C. 노드 (통합 카드) ─────────────────────────────
  {
    id: 'S_NODE_GROUP',
    group: 'node',
    insertAfter: 15,
    type: 'grouped',
    ecosystemMsg: '노드 운영자는 파이 네트워크 탈중앙화의 핵심입니다. 여러분의 답변이 파이 생태계 발전에 직접 기여합니다 🌐',
    subQuestions: [
      {
        id: 'S_NODE',
        q: '파이 노드를 운영하고 계신가요?',
        choices: [
          { value: 'running',    label: '현재 운영 중' },
          { value: 'stopped',    label: '돌리다가 중단했어요' },
          { value: 'planning',   label: '앞으로 돌릴 계획이에요' },
          { value: 'noInterest', label: '관심 없어요' },
        ],
      },
      {
        id: 'S_NODE_PC',
        q: '어떤 환경에서 운영하나요?',
        showIf: { id: 'S_NODE', values: ['running'] },
        choices: [
          { value: 'dedicated', label: '전문 노드컴 (24시간 상시)' },
          { value: 'regular',   label: '일반 PC (틈날 때만)' },
          { value: 'server',    label: '서버 / 클라우드' },
        ],
      },
      {
        id: 'S_NODE_REASON',
        q: '돌리지 않는 이유나 향후 계획을 알려주세요.',
        showIf: { id: 'S_NODE', values: ['stopped', 'planning', 'noInterest'] },
        choices: [
          { value: 'cost',     label: '전기·컴퓨터 비용 부담' },
          { value: 'unknown',  label: '방법을 잘 모름' },
          { value: 'noNeed',   label: '필요성을 못 느낌' },
          { value: 'planSoon', label: '조만간 시작할 예정' },
        ],
      },
    ],
  },

  // ── D. 거래 경험 ─────────────────────────────────────
  {
    id: 'S_TRADE_EXP',
    group: 'trade',
    insertAfter: 21,
    type: 'multi',
    q: '파이 관련 거래 경험이 있으신가요? (복수 선택) / Pi trading experience? (select all that apply)',
    choices: [
      { value: 'p2p',      label: 'P2P 직거래 / P2P direct trade' },
      { value: 'barter',   label: '물물교환 / Barter (goods/services)' },
      { value: 'exchange', label: '거래소 PI 매매 (OKX 등) / Exchange trading' },
      { value: 'dexApp',   label: '파이 앱 내 결제 / Pi app payment' },
      { value: 'none',     label: '아직 없어요 / None yet' },
    ],
  },

  {
    id: 'S_CRYPTO_EXP',
    group: 'trade',
    insertAfter: 24,
    type: 'multi',
    q: '일반 암호화폐 경험은? (복수 선택) / Crypto experience? (select all that apply)',
    choices: [
      { value: 'hold',     label: 'BTC/ETH 등 보유 경험 / Held BTC/ETH etc.' },
      { value: 'dex',      label: 'DEX 사용 경험 / Used a DEX' },
      { value: 'lp',       label: '유동성 공급(LP) 경험 / Provided liquidity (LP)' },
      { value: 'arb',      label: '차익거래 시도 / Tried arbitrage' },
      { value: 'none',     label: '없어요 / None' },
    ],
  },

  // ── E. DEX 앱 사용 ───────────────────────────────────
  {
    id: 'S_DEX_APP',
    group: 'app',
    insertAfter: 27,
    type: 'multi',
    q: '현재 사용 중인 파이 관련 앱은? (복수 선택) / Which Pi apps do you use? (select all that apply)',
    choices: [
      { value: 'pidexUtil', label: 'PiDEX Util' },
      { value: 'mmLab',     label: 'MM Strategy Lab' },
      { value: 'piChat',    label: 'Pi Chat / 파이 채팅' },
      { value: 'piShop',    label: 'Pi 쇼핑 앱 / Pi Shopping' },
      { value: 'none',      label: '없어요 / None' },
    ],
  },

  {
    id: 'S_INFO_SOURCE',
    group: 'app',
    insertAfter: 30,
    type: 'single',
    q: '파이 관련 정보를 주로 어디서 얻으시나요? / Where do you get Pi info?',
    choices: [
      { value: 'youtube',   label: '유튜브 / YouTube' },
      { value: 'telegram',  label: '텔레그램 / Telegram' },
      { value: 'piApp',     label: '파이 앱 공식 채널 / Pi App official' },
      { value: 'community', label: '커뮤니티 포럼 / Community forum' },
    ],
  },

];
