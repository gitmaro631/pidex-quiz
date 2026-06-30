export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX Sınav',
  'nav.quiz':       'Sınav',
  'nav.rank':       'Sıralamam',
  'nav.stats':      'Topluluk İstatistikleri',
  'btn.next':       'Sonraki →',
  'btn.again':      'Devam Et',
  'btn.rank':       'Sıralamayı Gör',
  'btn.share':      '📤 Sonucu Paylaş',
  'btn.intro':      'Hakkında',
  'btn.help':       'Yardım',
  'btn.lang':       'Dil',
  'btn.close':      'Kapat',
  'btn.start':      'Başla',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'DEX bilginizi test edin ve sıralamada yerinizi alın',
  'login.btn':      'Sınavı Başlat',
  'login.note':     'Yalnızca Pi Browser için',
  'login.fail':     'Bağlantı başarısız. Lütfen tekrar deneyin.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'Doğru!',
  'quiz.wrong':     'Yanlış',
  'quiz.see_result':'Sonucu Gör',
  'quiz.session_stats': 'Bu oturum: {c}/{t} doğru ({p}%)',
  'quiz.next_rank': '{label} için {n} puan daha',
  'quiz.max_rank':  '🎉 Maksimum sıraya ulaşıldı!',
  'quiz.allDone':   'Tüm sorular tamamlandı! 🎉',
  'quiz.start':     'Sınavı Başlat',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'Oyun Modunu Seç',
  'mode.reset.note':      'Modu değiştirmek canlarınızı ve puanınızı sıfırlayacak',
  'mode.change':          'Modu Değiştir',
  'mode.miner.desc':      'Başlangıçta 2 can\nHer 4 ankette +1 can\nİstatistik/sıralama görüntülemede +1 can (her 1 saatte bir)\nHer 10 doğru cevap için +1 can',
  'mode.pioneer.desc':    'Başlangıçta 2 can\nHer 4 ankette +1 can',
  'mode.validator.desc':  'Can yok\nBir yanlış cevap = anında oyun bitti\nYüksek puan mücadelesi!',
  'mode.lives.none':      'Can yok',
  'mode.validator.fail':  'Yanlış — Validator modu sona erdi!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'Canlar Bitti!',
  'gameover.best':  '🎉 Yeni Kişisel Rekor!',
  'gameover.prev':  'Kişisel en iyi: {n} puan',
  'gameover.desc':  'Puanınız lider tablosuna eklenecek\nve oyun yeniden başlayacak.',
  'gameover.btn':   'Lider Tablosuna Gönder ve Yeniden Başla',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 Topluluk Anketi',
  'survey.submit':      'Gönder',
  'survey.skip':        'Atla',
  'survey.edit':        'Düzenle',
  'survey.write':       'Doldur',
  'survey.back':        '← Listeye Dön',
  'survey.page.title':  '📋 Anket',
  'survey.page.desc':   'Ankete katılmak can kazandırır ve topluluk istatistiklerine katkı sağlar.',
  'survey.life.bonus':  '🎉 {n} anket tamamlandı! +1 can',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'Yükleniyor...',
  'lb.empty':       'Henüz kayıt yok',
  'lb.fail':        'Yükleme başarısız',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'Hangi ülkedesiniz?',
  'S_COUNTRY.placeholder': '— Ülke seçin —',

  'S_JOIN_YEAR.q':         'Pi Network\'e ne zaman katıldınız?',
  'S_JOIN_YEAR.over1year': '1 yıldan fazla önce',
  'S_JOIN_YEAR.under1year':'1 yıldan az önce',

  'S_MINING.q':            'Hâlâ her gün Pi madenciliği yapıyor musunuz?',
  'S_MINING.daily':        'Her gün madencilik',
  'S_MINING.sometimes':    'Bazen unutuyorum',
  'S_MINING.rarely':       'Nadiren madencilik',

  'S_KYC.q':               'KYC (kimlik doğrulama) durumunuz nedir?',
  'S_KYC.passed':          'Geçti',
  'S_KYC.pending':         'Denedim ama bekliyor',
  'S_KYC.failed':          'Denedim ama başarısız',
  'S_KYC.notTried':        'Henüz denemedi',

  'S_NODE_GROUP.ecosystemMsg': 'Düğüm operatörleri Pi Network\'in merkeziyetsizliğinin omurgasıdır. Cevaplarınız Pi ekosistemine doğrudan katkı sağlar 🌐',
  'S_NODE.q':              'Pi düğümü çalıştırıyor musunuz?',
  'S_NODE.running':        'Şu anda çalışıyor',
  'S_NODE.stopped':        'Çalıştırdım ama durdurdum',
  'S_NODE.planning':       'Çalıştırmayı planlıyorum',
  'S_NODE.noInterest':     'İlgilenmiyorum',

  'S_NODE_PC.q':           'Hangi ortamda çalıştırıyorsunuz?',
  'S_NODE_PC.dedicated':   'Özel düğüm bilgisayarı',
  'S_NODE_PC.regular':     'Normal bilgisayar',
  'S_NODE_PC.server':      'Sunucu / Bulut',

  'S_NODE_REASON.q':       'Çalıştırmama nedeniniz veya gelecek planlarınız?',
  'S_NODE_REASON.cost':    'Elektrik / bilgisayar maliyeti',
  'S_NODE_REASON.unknown': 'Nasıl yapacağımı bilmiyorum',
  'S_NODE_REASON.noNeed':  'Gerek duymuyorum',
  'S_NODE_REASON.planSoon':'Yakında başlamayı planlıyorum',

  'S_TRADE_EXP.q':         'Pi ticareti deneyiminiz var mı? (çoklu seçim)',
  'S_TRADE_EXP.p2p':       'Doğrudan P2P ticaret',
  'S_TRADE_EXP.barter':    'Takas / mal değişimi',
  'S_TRADE_EXP.exchange':  'Borsa (OKX vb.)',
  'S_TRADE_EXP.dexApp':    'Pi uygulamalarında ödeme',
  'S_TRADE_EXP.none':      'Henüz yok',

  'S_CRYPTO_EXP.q':        'Genel kripto deneyimi? (çoklu seçim)',
  'S_CRYPTO_EXP.hold':     'BTC/ETH vb. tuttum',
  'S_CRYPTO_EXP.dex':      'DEX kullandım',
  'S_CRYPTO_EXP.lp':       'Likidite sağladım (LP)',
  'S_CRYPTO_EXP.arb':      'Arbitraj denedim',
  'S_CRYPTO_EXP.none':     'Hiçbiri',

  'S_INFO_SOURCE.q':        'Pi ile ilgili bilgileri esas olarak nereden alıyorsunuz?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Pi App resmi kanalı',
  'S_INFO_SOURCE.community':'Topluluk forumu',
  'S_INFO_SOURCE.etc':      'Diğer',
};
