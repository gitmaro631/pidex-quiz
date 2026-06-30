export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX Kuis',
  'nav.quiz':       'Kuis',
  'nav.rank':       'Peringkat Saya',
  'nav.stats':      'Statistik Komunitas',
  'btn.next':       'Berikutnya →',
  'btn.again':      'Lanjutkan',
  'btn.rank':       'Lihat Peringkat',
  'btn.share':      '📤 Bagikan Hasil',
  'btn.intro':      'Tentang',
  'btn.help':       'Bantuan',
  'btn.lang':       'Bahasa',
  'btn.close':      'Tutup',
  'btn.start':      'Mulai',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'Uji pengetahuan DEX Anda & raih peringkat',
  'login.btn':      'Mulai Kuis',
  'login.note':     'Khusus Pi Browser',
  'login.fail':     'Koneksi gagal. Silakan coba lagi.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'Benar!',
  'quiz.wrong':     'Salah',
  'quiz.see_result':'Lihat Hasil',
  'quiz.session_stats': 'Sesi ini: {c}/{t} benar ({p}%)',
  'quiz.next_rank': '{n} poin lagi ke {label}',
  'quiz.max_rank':  '🎉 Peringkat tertinggi!',
  'quiz.allDone':   'Semua soal selesai! 🎉',
  'quiz.start':     'Mulai Kuis',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'Pilih Mode Permainan',
  'mode.reset.note':      'Mengganti mode akan mereset nyawa dan skor Anda',
  'mode.change':          'Ganti Mode',
  'mode.miner.desc':      '2 nyawa awal\n+1 nyawa per 4 survei\n+1 nyawa per lihat statistik/peringkat (setiap 1 jam)\n+1 nyawa per 10 jawaban benar',
  'mode.pioneer.desc':    '2 nyawa awal\n+1 nyawa per 4 survei',
  'mode.validator.desc':  'Tanpa nyawa\nSatu jawaban salah = langsung game over\nTantangan skor tinggi!',
  'mode.lives.none':      'Tanpa nyawa',
  'mode.validator.fail':  'Salah — Mode Validator berakhir!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'Nyawa Habis!',
  'gameover.best':  '🎉 Rekor Pribadi Baru!',
  'gameover.prev':  'Rekor terbaik: {n} poin',
  'gameover.desc':  'Skor Anda akan didaftarkan ke papan peringkat\ndan permainan akan dimulai ulang.',
  'gameover.btn':   'Daftarkan ke Papan Peringkat & Mulai Ulang',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 Survei Komunitas',
  'survey.submit':      'Kirim',
  'survey.skip':        'Lewati',
  'survey.edit':        'Edit',
  'survey.write':       'Isi',
  'survey.back':        '← Kembali ke Daftar',
  'survey.page.title':  '📋 Survei',
  'survey.page.desc':   'Mengisi survei akan memberikan nyawa dan berkontribusi pada statistik komunitas.',
  'survey.life.bonus':  '🎉 {n} survei selesai! +1 nyawa',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'Memuat...',
  'lb.empty':       'Belum ada catatan',
  'lb.fail':        'Gagal memuat',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'Anda berada di negara mana?',
  'S_COUNTRY.placeholder': '— Pilih negara —',

  'S_JOIN_YEAR.q':         'Kapan Anda bergabung dengan Pi Network?',
  'S_JOIN_YEAR.over1year': 'Lebih dari 1 tahun lalu',
  'S_JOIN_YEAR.under1year':'Kurang dari 1 tahun lalu',

  'S_MINING.q':            'Apakah Anda masih menambang Pi setiap hari?',
  'S_MINING.daily':        'Menambang setiap hari',
  'S_MINING.sometimes':    'Kadang lupa',
  'S_MINING.rarely':       'Jarang menambang',

  'S_KYC.q':               'Apa status KYC (verifikasi identitas) Anda?',
  'S_KYC.passed':          'Lulus',
  'S_KYC.pending':         'Sudah mencoba tapi menunggu',
  'S_KYC.failed':          'Sudah mencoba tapi gagal',
  'S_KYC.notTried':        'Belum pernah mencoba',

  'S_NODE_GROUP.ecosystemMsg': 'Operator node adalah tulang punggung desentralisasi Pi Network. Jawaban Anda berkontribusi langsung pada pengembangan ekosistem Pi 🌐',
  'S_NODE.q':              'Apakah Anda menjalankan node Pi?',
  'S_NODE.running':        'Sedang berjalan',
  'S_NODE.stopped':        'Pernah menjalankan tapi berhenti',
  'S_NODE.planning':       'Berencana menjalankan',
  'S_NODE.noInterest':     'Tidak tertarik',

  'S_NODE_PC.q':           'Lingkungan apa yang Anda gunakan?',
  'S_NODE_PC.dedicated':   'PC node khusus',
  'S_NODE_PC.regular':     'PC biasa',
  'S_NODE_PC.server':      'Server / Cloud',

  'S_NODE_REASON.q':       'Apa alasan Anda tidak menjalankan, atau rencana ke depan?',
  'S_NODE_REASON.cost':    'Biaya listrik / komputer',
  'S_NODE_REASON.unknown': 'Tidak tahu caranya',
  'S_NODE_REASON.noNeed':  'Tidak merasa perlu',
  'S_NODE_REASON.planSoon':'Berencana mulai segera',

  'S_TRADE_EXP.q':         'Apakah Anda punya pengalaman trading Pi? (pilihan ganda)',
  'S_TRADE_EXP.p2p':       'Trade P2P langsung',
  'S_TRADE_EXP.barter':    'Barter / tukar barang',
  'S_TRADE_EXP.exchange':  'Exchange (OKX, dll.)',
  'S_TRADE_EXP.dexApp':    'Pembayaran di aplikasi Pi',
  'S_TRADE_EXP.none':      'Belum pernah',

  'S_CRYPTO_EXP.q':        'Pengalaman kripto umum? (pilihan ganda)',
  'S_CRYPTO_EXP.hold':     'Pernah pegang BTC/ETH dll.',
  'S_CRYPTO_EXP.dex':      'Pernah pakai DEX',
  'S_CRYPTO_EXP.lp':       'Pernah sediakan likuiditas (LP)',
  'S_CRYPTO_EXP.arb':      'Pernah coba arbitrase',
  'S_CRYPTO_EXP.none':     'Belum pernah',

  'S_INFO_SOURCE.q':        'Di mana Anda biasanya mendapatkan informasi seputar Pi?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Saluran resmi Pi App',
  'S_INFO_SOURCE.community':'Forum komunitas',
  'S_INFO_SOURCE.etc':      'Lainnya',
};
