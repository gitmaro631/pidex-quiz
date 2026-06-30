export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX 测验',
  'nav.quiz':       '测验',
  'nav.rank':       '我的等级',
  'nav.stats':      '社区统计',
  'btn.next':       '下一题 →',
  'btn.again':      '继续',
  'btn.rank':       '查看等级',
  'btn.share':      '📤 分享结果',
  'btn.intro':      '关于',
  'btn.help':       '帮助',
  'btn.lang':       '语言',
  'btn.close':      '关闭',
  'btn.start':      '开始',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      '测试您的DEX知识并获得等级',
  'login.btn':      '开始测验',
  'login.note':     '仅限Pi浏览器',
  'login.fail':     '连接失败，请重试。',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   '正确！',
  'quiz.wrong':     '错误',
  'quiz.see_result':'查看结果',
  'quiz.session_stats': '本次会话：{c}/{t} 正确 ({p}%)',
  'quiz.next_rank': '距{label}还差{n}分',
  'quiz.max_rank':  '🎉 已达最高等级！',
  'quiz.allDone':   '所有题目已完成！🎉',
  'quiz.start':     '开始测验',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    '选择游戏模式',
  'mode.reset.note':      '切换模式将重置生命和分数',
  'mode.change':          '切换模式',
  'mode.miner.desc':      '初始2条命\n每4次问卷+1命\n每次查看统计/排名+1命（每1小时）\n每答对10题+1命',
  'mode.pioneer.desc':    '初始2条命\n每4次问卷+1命',
  'mode.validator.desc':  '无生命\n答错一题即游戏结束\n挑战高分！',
  'mode.lives.none':      '无生命',
  'mode.validator.fail':  '答错 — Validator模式结束！',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': '生命耗尽！',
  'gameover.best':  '🎉 个人新纪录！',
  'gameover.prev':  '个人最高：{n}分',
  'gameover.desc':  '您的分数将记入排行榜\n游戏将重新开始。',
  'gameover.btn':   '提交排行榜并重新开始',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 社区问卷',
  'survey.submit':      '提交',
  'survey.skip':        '跳过',
  'survey.edit':        '修改',
  'survey.write':       '填写',
  'survey.back':        '← 返回列表',
  'survey.page.title':  '📋 问卷',
  'survey.page.desc':   '参与问卷可获得生命并为社区统计作贡献。',
  'survey.life.bonus':  '🎉 已完成{n}份问卷！+1条命',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     '加载中...',
  'lb.empty':       '暂无记录',
  'lb.fail':        '加载失败',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           '您在哪个国家？',
  'S_COUNTRY.placeholder': '— 选择国家 —',

  'S_JOIN_YEAR.q':         '您是什么时候加入Pi Network的？',
  'S_JOIN_YEAR.over1year': '超过1年前',
  'S_JOIN_YEAR.under1year':'不足1年前',

  'S_MINING.q':            '您每天还在挖Pi吗？',
  'S_MINING.daily':        '每天挖矿',
  'S_MINING.sometimes':    '偶尔忘记',
  'S_MINING.rarely':       '很少挖矿',

  'S_KYC.q':               '您的KYC（身份验证）状态？',
  'S_KYC.passed':          '已通过',
  'S_KYC.pending':         '已申请，等待中',
  'S_KYC.failed':          '已申请，但失败',
  'S_KYC.notTried':        '尚未尝试',

  'S_NODE_GROUP.ecosystemMsg': '节点运营者是Pi Network去中心化的核心。您的回答直接贡献于Pi生态系统的发展 🌐',
  'S_NODE.q':              '您在运行Pi节点吗？',
  'S_NODE.running':        '正在运行',
  'S_NODE.stopped':        '运行过但已停止',
  'S_NODE.planning':       '计划运行',
  'S_NODE.noInterest':     '没有兴趣',

  'S_NODE_PC.q':           '您在什么环境下运行？',
  'S_NODE_PC.dedicated':   '专用节点电脑',
  'S_NODE_PC.regular':     '普通电脑',
  'S_NODE_PC.server':      '服务器 / 云端',

  'S_NODE_REASON.q':       '您不运行的原因或未来计划？',
  'S_NODE_REASON.cost':    '电费 / 电脑成本',
  'S_NODE_REASON.unknown': '不知道如何操作',
  'S_NODE_REASON.noNeed':  '感觉不需要',
  'S_NODE_REASON.planSoon':'打算很快开始',

  'S_TRADE_EXP.q':         '您有Pi交易经验吗？（多选）',
  'S_TRADE_EXP.p2p':       'P2P直接交易',
  'S_TRADE_EXP.barter':    '以物易物',
  'S_TRADE_EXP.exchange':  '交易所（OKX等）',
  'S_TRADE_EXP.dexApp':    '在Pi应用内付款',
  'S_TRADE_EXP.none':      '尚无',

  'S_CRYPTO_EXP.q':        '一般加密货币经验？（多选）',
  'S_CRYPTO_EXP.hold':     '持有过BTC/ETH等',
  'S_CRYPTO_EXP.dex':      '使用过DEX',
  'S_CRYPTO_EXP.lp':       '提供过流动性（LP）',
  'S_CRYPTO_EXP.arb':      '尝试过套利',
  'S_CRYPTO_EXP.none':     '无',

  'S_INFO_SOURCE.q':        '您主要从哪里获取Pi相关信息？',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Pi App官方频道',
  'S_INFO_SOURCE.community':'社区论坛',
  'S_INFO_SOURCE.etc':      '其他',
};
