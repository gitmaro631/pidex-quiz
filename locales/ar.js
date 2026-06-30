export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'اختبار PiDEX',
  'nav.quiz':       'اختبار',
  'nav.rank':       'ترتيبي',
  'nav.stats':      'إحصاءات المجتمع',
  'btn.next':       '→ التالي',
  'btn.again':      'استمر',
  'btn.rank':       'عرض الترتيب',
  'btn.share':      '📤 شارك النتيجة',
  'btn.intro':      'حول',
  'btn.help':       'مساعدة',
  'btn.lang':       'اللغة',
  'btn.close':      'إغلاق',
  'btn.start':      'ابدأ',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'اختبر معرفتك بـ DEX واحصل على ترتيبك',
  'login.btn':      'ابدأ الاختبار',
  'login.note':     'لمتصفح Pi Browser فقط',
  'login.fail':     'فشل الاتصال. يرجى المحاولة مرة أخرى.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'صحيح!',
  'quiz.wrong':     'خطأ',
  'quiz.see_result':'عرض النتيجة',
  'quiz.session_stats': 'هذه الجلسة: {c}/{t} صحيح ({p}%)',
  'quiz.next_rank': '{n} نقطة للوصول إلى {label}',
  'quiz.max_rank':  '🎉 تم الوصول إلى أعلى مستوى!',
  'quiz.allDone':   'تمت الإجابة على جميع الأسئلة! 🎉',
  'quiz.start':     'ابدأ الاختبار',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'اختر وضع اللعبة',
  'mode.reset.note':      'تغيير الوضع سيعيد تعيين الأرواح والنقاط',
  'mode.change':          'تغيير الوضع',
  'mode.miner.desc':      'روحان في البداية\n+1 روح كل 4 استبيانات\n+1 روح عند عرض الإحصاءات/الترتيب (كل ساعة)\n+1 روح كل 10 إجابات صحيحة',
  'mode.pioneer.desc':    'روحان في البداية\n+1 روح كل 4 استبيانات',
  'mode.validator.desc':  'لا أرواح\nإجابة خاطئة واحدة = انتهاء اللعبة فوراً\nتحدٍّ للحصول على أعلى نقاط!',
  'mode.lives.none':      'لا أرواح',
  'mode.validator.fail':  'خطأ — انتهى وضع Validator!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'نفدت الأرواح!',
  'gameover.best':  '🎉 رقم قياسي شخصي جديد!',
  'gameover.prev':  'أفضل نتيجة شخصية: {n} نقطة',
  'gameover.desc':  'سيتم تسجيل نتيجتك في لوحة المتصدرين\nوستبدأ اللعبة من جديد.',
  'gameover.btn':   'أرسل إلى لوحة المتصدرين وأعد البداية',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 استبيان المجتمع',
  'survey.submit':      'إرسال',
  'survey.skip':        'تخطي',
  'survey.edit':        'تعديل',
  'survey.write':       'تعبئة',
  'survey.back':        '← العودة إلى القائمة',
  'survey.page.title':  '📋 الاستبيان',
  'survey.page.desc':   'المشاركة في الاستبيانات تمنحك أرواحاً وتساهم في إحصاءات المجتمع.',
  'survey.life.bonus':  '🎉 اكتملت {n} استبيانات! +1 روح',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'جارٍ التحميل...',
  'lb.empty':       'لا توجد سجلات حتى الآن',
  'lb.fail':        'فشل التحميل',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'في أي دولة أنت؟',
  'S_COUNTRY.placeholder': '— اختر الدولة —',

  'S_JOIN_YEAR.q':         'متى انضممت إلى Pi Network؟',
  'S_JOIN_YEAR.over1year': 'منذ أكثر من سنة',
  'S_JOIN_YEAR.under1year':'منذ أقل من سنة',

  'S_MINING.q':            'هل لا تزال تعدن Pi كل يوم؟',
  'S_MINING.daily':        'التعدين كل يوم',
  'S_MINING.sometimes':    'أنسى أحياناً',
  'S_MINING.rarely':       'نادراً ما أعدن',

  'S_KYC.q':               'ما هي حالة KYC (التحقق من الهوية) الخاصة بك؟',
  'S_KYC.passed':          'اجتزت',
  'S_KYC.pending':         'حاولت لكنها قيد الانتظار',
  'S_KYC.failed':          'حاولت لكنها فشلت',
  'S_KYC.notTried':        'لم أحاول بعد',

  'S_NODE_GROUP.ecosystemMsg': 'مشغّلو العقد هم العمود الفقري لامركزية Pi Network. إجاباتك تساهم مباشرة في تطوير نظام Pi البيئي 🌐',
  'S_NODE.q':              'هل تشغّل عقدة Pi؟',
  'S_NODE.running':        'تعمل حالياً',
  'S_NODE.stopped':        'شغّلتها لكنني أوقفتها',
  'S_NODE.planning':       'أخطط لتشغيلها',
  'S_NODE.noInterest':     'غير مهتم',

  'S_NODE_PC.q':           'ما البيئة التي تشغّلها فيها؟',
  'S_NODE_PC.dedicated':   'حاسوب مخصص للعقدة',
  'S_NODE_PC.regular':     'حاسوب عادي',
  'S_NODE_PC.server':      'خادم / سحابة',

  'S_NODE_REASON.q':       'ما سبب عدم التشغيل، أو خططك المستقبلية؟',
  'S_NODE_REASON.cost':    'تكلفة الكهرباء / الحاسوب',
  'S_NODE_REASON.unknown': 'لا أعرف كيف',
  'S_NODE_REASON.noNeed':  'لا أشعر بالحاجة',
  'S_NODE_REASON.planSoon':'أخطط للبدء قريباً',

  'S_TRADE_EXP.q':         'هل لديك تجربة في تداول Pi؟ (اختيار متعدد)',
  'S_TRADE_EXP.p2p':       'تداول P2P مباشر',
  'S_TRADE_EXP.barter':    'المقايضة / تبادل السلع',
  'S_TRADE_EXP.exchange':  'بورصة (OKX، إلخ)',
  'S_TRADE_EXP.dexApp':    'دفع في تطبيقات Pi',
  'S_TRADE_EXP.none':      'لا بعد',

  'S_CRYPTO_EXP.q':        'تجربة العملات المشفرة العامة؟ (اختيار متعدد)',
  'S_CRYPTO_EXP.hold':     'امتلكت BTC/ETH إلخ',
  'S_CRYPTO_EXP.dex':      'استخدمت DEX',
  'S_CRYPTO_EXP.lp':       'قدّمت سيولة (LP)',
  'S_CRYPTO_EXP.arb':      'حاولت المراجحة',
  'S_CRYPTO_EXP.none':     'لا شيء',

  'S_INFO_SOURCE.q':        'من أين تحصل عادةً على المعلومات المتعلقة بـ Pi؟',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'القناة الرسمية لـ Pi App',
  'S_INFO_SOURCE.community':'منتدى المجتمع',
  'S_INFO_SOURCE.etc':      'أخرى',
};
