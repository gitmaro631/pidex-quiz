export default {
  // ── 앱 공통 ──────────────────────────────────────────
  'app.title':      'PiDEX 퀴즈',
  'nav.quiz':       '퀴즈',
  'nav.rank':       '내 등급',
  'nav.stats':      '커뮤니티 통계',
  'btn.next':       '다음 →',
  'btn.again':      '계속하기',
  'btn.rank':       '내 등급 보기',
  'btn.share':      '📤 결과 공유하기',
  'btn.intro':      '앱 소개',
  'btn.help':       '도움말',
  'btn.lang':       '언어',
  'btn.close':      '닫기',
  'btn.start':      '시작하기',

  // ── 로그인 ───────────────────────────────────────────
  'login.sub':      'DEX 지식을 테스트하고 등급을 받아보세요',
  'login.btn':      '퀴즈 시작하기',
  'login.note':     'Pi Browser 전용',
  'login.fail':     '연결 실패. 다시 시도해주세요.',

  // ── 퀴즈 ─────────────────────────────────────────────
  'quiz.correct':   '정답!',
  'quiz.wrong':     '오답',
  'quiz.see_result':'결과 보기',
  'quiz.session_stats': '이번 세션: {c}/{t} 정답 ({p}%)',
  'quiz.next_rank': '다음 등급 {label}까지 {n}점',
  'quiz.max_rank':  '🎉 최고 등급!',
  'quiz.allDone':   '모든 문항을 풀었어요! 🎉',
  'quiz.start':     '퀴즈 시작',

  // ── 모드 ─────────────────────────────────────────────
  'mode.select.title':    '게임 모드를 선택하세요',
  'mode.reset.note':      '모드를 바꾸면 생명과 점수가 초기화됩니다',
  'mode.change':          '모드 변경',
  'mode.miner.desc':      '기본 생명 2개\n설문 4개당 +1생명\n통계/랭킹 조회 시 +1생명 (1시간마다)\n퀴즈 10개 맞추면 +1생명',
  'mode.pioneer.desc':    '기본 생명 2개\n설문 4개당 +1생명',
  'mode.validator.desc':  '생명 없음\n한 문제라도 틀리면 즉시 종료\n고득점 도전!',
  'mode.lives.none':           '생명 없음',
  'mode.validator.fail':       '오답 — Validator 모드 종료!',
  'mode.change.confirm.title': '모드를 변경할까요?',
  'mode.change.confirm.desc':  '{mode} 모드 진행 중 ({score}점)\n모드 변경 시 점수·생명이 초기화됩니다.',
  'mode.change.confirm.submit':'랭킹 등록 후 모드 변경',
  'mode.change.confirm.cancel':'취소 (현재 모드 유지)',

  // ── 게임오버 ──────────────────────────────────────────
  'gameover.title': '생명력 소진!',
  'gameover.best':  '🎉 개인 최고 기록!',
  'gameover.prev':  '개인 최고: {n}점',
  'gameover.desc':  '이 점수가 리더보드에 등록되고\n게임이 처음부터 시작됩니다',
  'gameover.btn':   '리더보드 등록 후 재시작',

  // ── 설문 ─────────────────────────────────────────────
  'survey.badge':       '📋 커뮤니티 설문',
  'survey.submit':      '제출',
  'survey.skip':        '건너뛰기',
  'survey.edit':        '수정',
  'survey.write':       '작성하기',
  'survey.back':        '← 목록으로',
  'survey.page.title':  '📋 설문 참여',
  'survey.page.desc':   '설문에 참여하면 생명력을 획득하고 커뮤니티 통계에 기여합니다.',
  'survey.life.bonus':  '🎉 설문 {n}개 완료! 생명력 +1',

  // ── 리더보드 ──────────────────────────────────────────
  'lb.loading':     '불러오는 중...',
  'lb.empty':       '아직 등록된 기록이 없어요',
  'lb.fail':        '불러오기 실패',

  // ── 설문 문항 ─────────────────────────────────────────
  'S_COUNTRY.q':           '어느 나라에 계신가요?',
  'S_COUNTRY.placeholder': '— 국가를 선택하세요 —',

  'S_JOIN_YEAR.q':         '파이 네트워크에 언제 가입하셨나요?',
  'S_JOIN_YEAR.over1year': '1년 이상',
  'S_JOIN_YEAR.under1year':'1년 이하',

  'S_MINING.q':            '지금도 매일 파이를 채굴하고 있나요?',
  'S_MINING.daily':        '매일 채굴 중',
  'S_MINING.sometimes':    '가끔 까먹어요',
  'S_MINING.rarely':       '거의 안 해요',

  'S_KYC.q':               'KYC(신원 인증) 상태는 어떻게 되시나요?',
  'S_KYC.passed':          '통과 완료',
  'S_KYC.pending':         '시도했지만 대기 중',
  'S_KYC.failed':          '시도했지만 실패',
  'S_KYC.notTried':        '아직 시도 안 함',

  'S_NODE_GROUP.ecosystemMsg': '노드 운영자는 파이 네트워크 탈중앙화의 핵심입니다. 여러분의 답변이 파이 생태계 발전에 직접 기여합니다 🌐',
  'S_NODE.q':              '파이 노드를 운영하고 계신가요?',
  'S_NODE.running':        '현재 운영 중',
  'S_NODE.stopped':        '돌리다가 중단했어요',
  'S_NODE.planning':       '앞으로 돌릴 계획이에요',
  'S_NODE.noInterest':     '관심 없어요',

  'S_NODE_PC.q':           '어떤 환경에서 운영하나요?',
  'S_NODE_PC.dedicated':   '전문 노드컴',
  'S_NODE_PC.regular':     '일반 PC',
  'S_NODE_PC.server':      '서버 / 클라우드',

  'S_NODE_REASON.q':       '돌리지 않는 이유나 향후 계획을 알려주세요.',
  'S_NODE_REASON.cost':    '전기·컴퓨터 비용 부담',
  'S_NODE_REASON.unknown': '방법을 잘 모름',
  'S_NODE_REASON.noNeed':  '필요성을 못 느낌',
  'S_NODE_REASON.planSoon':'조만간 시작할 예정',

  'S_TRADE_EXP.q':         '파이 관련 거래 경험이 있으신가요? (복수 선택)',
  'S_TRADE_EXP.p2p':       'P2P 직거래',
  'S_TRADE_EXP.barter':    '물물교환',
  'S_TRADE_EXP.exchange':  '거래소 PI 매매 (OKX 등)',
  'S_TRADE_EXP.dexApp':    '파이 앱 내 결제',
  'S_TRADE_EXP.none':      '아직 없어요',

  'S_CRYPTO_EXP.q':        '일반 암호화폐 경험은? (복수 선택)',
  'S_CRYPTO_EXP.hold':     'BTC/ETH 등 보유 경험',
  'S_CRYPTO_EXP.dex':      'DEX 사용 경험',
  'S_CRYPTO_EXP.lp':       '유동성 공급(LP) 경험',
  'S_CRYPTO_EXP.arb':      '차익거래 시도',
  'S_CRYPTO_EXP.none':     '없어요',

  'S_INFO_SOURCE.q':       '파이 관련 정보를 주로 어디서 얻으시나요?',
  'S_INFO_SOURCE.youtube':  '유튜브',
  'S_INFO_SOURCE.telegram': '텔레그램',
  'S_INFO_SOURCE.piApp':    '파이 앱 공식 채널',
  'S_INFO_SOURCE.community':'커뮤니티 포럼',
  'S_INFO_SOURCE.etc':      '기타',
};
