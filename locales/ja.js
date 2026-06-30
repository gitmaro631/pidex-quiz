export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX クイズ',
  'nav.quiz':       'クイズ',
  'nav.rank':       'マイランク',
  'nav.stats':      'コミュニティ統計',
  'btn.next':       '次へ →',
  'btn.again':      '続ける',
  'btn.rank':       'ランクを見る',
  'btn.share':      '📤 結果をシェア',
  'btn.intro':      'アプリ紹介',
  'btn.help':       'ヘルプ',
  'btn.lang':       '言語',
  'btn.close':      '閉じる',
  'btn.start':      'はじめる',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'DEX知識をテストしてランクを獲得しよう',
  'login.btn':      'クイズをはじめる',
  'login.note':     'Pi Browser専用',
  'login.fail':     '接続に失敗しました。もう一度お試しください。',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   '正解！',
  'quiz.wrong':     '不正解',
  'quiz.see_result':'結果を見る',
  'quiz.session_stats': 'このセッション：{c}/{t} 正解 ({p}%)',
  'quiz.next_rank': '{label}まであと{n}ポイント',
  'quiz.max_rank':  '🎉 最高ランク達成！',
  'quiz.allDone':   '全問完了！🎉',
  'quiz.start':     'クイズをはじめる',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'ゲームモードを選択',
  'mode.reset.note':      'モードを変更するとライフとスコアがリセットされます',
  'mode.change':          'モード変更',
  'mode.miner.desc':      '初期ライフ2個\nサーベイ4個ごとに+1ライフ\n統計/ランキング閲覧ごとに+1ライフ（1時間ごと）\n10問正解ごとに+1ライフ',
  'mode.pioneer.desc':    '初期ライフ2個\nサーベイ4個ごとに+1ライフ',
  'mode.validator.desc':  'ライフなし\n1問でも間違えたら即終了\nハイスコアに挑戦！',
  'mode.lives.none':      'ライフなし',
  'mode.validator.fail':  '不正解 — Validatorモード終了！',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'ライフ切れ！',
  'gameover.best':  '🎉 自己ベスト更新！',
  'gameover.prev':  '自己ベスト：{n}ポイント',
  'gameover.desc':  'このスコアがリーダーボードに登録され\nゲームが最初からスタートします。',
  'gameover.btn':   'リーダーボードに登録して再スタート',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 コミュニティサーベイ',
  'survey.submit':      '送信',
  'survey.skip':        'スキップ',
  'survey.edit':        '編集',
  'survey.write':       '回答する',
  'survey.back':        '← 一覧に戻る',
  'survey.page.title':  '📋 サーベイ',
  'survey.page.desc':   'サーベイに参加するとライフを獲得し、コミュニティ統計に貢献できます。',
  'survey.life.bonus':  '🎉 {n}件のサーベイ完了！+1ライフ',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     '読み込み中...',
  'lb.empty':       'まだ記録がありません',
  'lb.fail':        '読み込み失敗',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'どの国にお住まいですか？',
  'S_COUNTRY.placeholder': '— 国を選択 —',

  'S_JOIN_YEAR.q':         'Pi Networkにいつ参加しましたか？',
  'S_JOIN_YEAR.over1year': '1年以上前',
  'S_JOIN_YEAR.under1year':'1年未満前',

  'S_MINING.q':            '今でも毎日Piをマイニングしていますか？',
  'S_MINING.daily':        '毎日マイニング中',
  'S_MINING.sometimes':    'たまに忘れる',
  'S_MINING.rarely':       'ほとんどしない',

  'S_KYC.q':               'KYC（本人確認）のステータスは？',
  'S_KYC.passed':          '通過済み',
  'S_KYC.pending':         '申請したが審査待ち',
  'S_KYC.failed':          '申請したが失敗',
  'S_KYC.notTried':        'まだ試していない',

  'S_NODE_GROUP.ecosystemMsg': 'ノードオペレーターはPi Networkの分散化の要です。あなたの回答がPiエコシステムの発展に直接貢献します 🌐',
  'S_NODE.q':              'Piノードを運営していますか？',
  'S_NODE.running':        '現在運営中',
  'S_NODE.stopped':        '運営していたが停止',
  'S_NODE.planning':       '運営する予定',
  'S_NODE.noInterest':     '興味なし',

  'S_NODE_PC.q':           'どの環境で運営していますか？',
  'S_NODE_PC.dedicated':   '専用ノードPC',
  'S_NODE_PC.regular':     '一般PC',
  'S_NODE_PC.server':      'サーバー / クラウド',

  'S_NODE_REASON.q':       '運営しない理由や今後の計画は？',
  'S_NODE_REASON.cost':    '電気代・PC代の負担',
  'S_NODE_REASON.unknown': 'やり方がわからない',
  'S_NODE_REASON.noNeed':  '必要性を感じない',
  'S_NODE_REASON.planSoon':'もうすぐ始める予定',

  'S_TRADE_EXP.q':         'Piの取引経験はありますか？（複数選択）',
  'S_TRADE_EXP.p2p':       'P2P直接取引',
  'S_TRADE_EXP.barter':    '物々交換',
  'S_TRADE_EXP.exchange':  '取引所（OKXなど）',
  'S_TRADE_EXP.dexApp':    'PiアプリでのPI決済',
  'S_TRADE_EXP.none':      'まだない',

  'S_CRYPTO_EXP.q':        '一般的な暗号資産の経験は？（複数選択）',
  'S_CRYPTO_EXP.hold':     'BTC/ETHなどを保有したことがある',
  'S_CRYPTO_EXP.dex':      'DEXを使ったことがある',
  'S_CRYPTO_EXP.lp':       '流動性提供（LP）をしたことがある',
  'S_CRYPTO_EXP.arb':      '裁定取引を試みたことがある',
  'S_CRYPTO_EXP.none':     'なし',

  'S_INFO_SOURCE.q':        'Pi関連の情報を主にどこから得ていますか？',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'PiApp公式チャンネル',
  'S_INFO_SOURCE.community':'コミュニティフォーラム',
  'S_INFO_SOURCE.etc':      'その他',
};
