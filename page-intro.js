import { t, getLang, SUPPORTED_LANGS, setLang } from './util-i18n.js';

// ── 앱 소개 콘텐츠 (언어별) ──────────────────────────
const INTRO_CONTENT = {
  ko: {
    headline: 'PiDEX 퀴즈에 오신 것을 환영합니다! 🎉',
    subtitle: 'Pi 파이오니어를 위한 DEX 지식 퀴즈 & 글로벌 커뮤니티 설문',
    sections: [
      { icon: '🧠', title: '퀴즈로 배우세요',       body: 'PiDEX, AMM, 유동성, 가스비 등 Pi 생태계의 핵심 DEX 지식을 퀴즈로 배워보세요. 초급·중급·고급 총 88문항.' },
      { icon: '⚙️', title: '3가지 게임 모드',       body: '⛏️ Miner: 생명 2개, 설문·통계조회·10연속 정답으로 생명 충전\n🚀 Pioneer: 생명 2개, 설문으로 생명 충전\n🔱 Validator: 생명 없음, 한 문제 틀리면 즉시 종료' },
      { icon: '📋', title: '커뮤니티 설문',          body: '설문 4개 완료마다 +1 생명. 설문 페이지에서 언제든지 수정 가능. 전 세계 파이오니어 현황을 함께 파악해요.' },
      { icon: '🏆', title: '글로벌 리더보드',        body: '모드별 상위 100명 순위. Pi Browser로 로그인하면 자동으로 글로벌 리더보드에 등록됩니다.' },
    ],
    privacy: '🔒 수집된 설문 데이터는 Pi 생태계 통계 목적으로만 사용되며, 개인 식별 정보는 저장되지 않습니다.',
    appsTitle: '🔗 유틸 모음',
    appsOpen: 'Pi Browser로 열기 →',
    btn: '퀴즈 시작하기 →',
  },
  en: {
    headline: 'Welcome to PiDEX Quiz! 🎉',
    subtitle: 'DEX knowledge quiz & global community survey for Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Learn Through Quizzes',   body: 'Master PiDEX, AMM, liquidity, gas fees and all DEX concepts essential for Pi. 88 questions across Beginner, Mid, and Advanced levels.' },
      { icon: '⚙️', title: '3 Game Modes',            body: '⛏️ Miner: 2 lives, earn lives via surveys, stats views & 10 correct streak\n🚀 Pioneer: 2 lives, earn lives via surveys\n🔱 Validator: no lives — one wrong answer ends the game' },
      { icon: '📋', title: 'Community Survey',         body: 'Every 4 surveys completed = +1 life. Edit your answers anytime on the survey page. Help map the global Pi Pioneer community.' },
      { icon: '🏆', title: 'Global Leaderboard',      body: 'Top 100 per mode. Log in via Pi Browser to register your score on the global leaderboard automatically.' },
    ],
    privacy: '🔒 Survey data is used solely for Pi ecosystem statistics. No personally identifiable information is stored.',
    appsTitle: '🔗 My Apps',
    appsOpen: 'Open in Pi Browser →',
    btn: 'Start Quiz →',
  },
  id: {
    headline: 'Selamat Datang di PiDEX Quiz! 🎉',
    subtitle: 'Kuis pengetahuan DEX & survei komunitas global untuk Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Belajar Lewat Kuis',      body: 'Kuasai PiDEX, AMM, likuiditas, biaya gas. 88 pertanyaan dalam tiga tingkat: Pemula, Menengah, Mahir.' },
      { icon: '⚙️', title: '3 Mode Permainan',        body: '⛏️ Miner: 2 nyawa, isi lewat survei, statistik & 10 jawaban benar beruntun\n🚀 Pioneer: 2 nyawa, isi lewat survei\n🔱 Validator: tanpa nyawa — satu salah langsung tamat' },
      { icon: '📋', title: 'Survei Komunitas',         body: 'Setiap 4 survei selesai = +1 nyawa. Edit jawaban kapan saja. Bantu peta komunitas Pi Pioneer global.' },
      { icon: '🏆', title: 'Papan Peringkat Global',  body: 'Top 100 per mode. Login Pi Browser untuk mendaftar ke papan peringkat global.' },
    ],
    privacy: '🔒 Data survei hanya untuk statistik ekosistem Pi. Tidak ada informasi pribadi yang disimpan.',
    appsTitle: '🔗 Aplikasi Saya',
    appsOpen: 'Buka di Pi Browser →',
    btn: 'Mulai Kuis →',
  },
  vi: {
    headline: 'Chào mừng đến với PiDEX Quiz! 🎉',
    subtitle: 'Câu hỏi kiến thức DEX & khảo sát cộng đồng toàn cầu cho Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Học qua câu hỏi',         body: 'Nắm vững PiDEX, AMM, thanh khoản, phí gas. 88 câu hỏi ở ba cấp độ: Cơ bản, Trung cấp, Nâng cao.' },
      { icon: '⚙️', title: '3 Chế độ chơi',           body: '⛏️ Miner: 2 mạng, nạp qua khảo sát, xem thống kê & 10 câu đúng liên tiếp\n🚀 Pioneer: 2 mạng, nạp qua khảo sát\n🔱 Validator: không có mạng — sai một câu là kết thúc' },
      { icon: '📋', title: 'Khảo sát cộng đồng',      body: 'Cứ hoàn thành 4 khảo sát = +1 mạng. Chỉnh sửa câu trả lời bất cứ lúc nào. Cùng khám phá cộng đồng Pi Pioneer toàn cầu.' },
      { icon: '🏆', title: 'Bảng xếp hạng toàn cầu', body: 'Top 100 theo từng chế độ. Đăng nhập Pi Browser để tự động đăng ký điểm.' },
    ],
    privacy: '🔒 Dữ liệu khảo sát chỉ dùng cho thống kê Pi. Không lưu thông tin cá nhân.',
    appsTitle: '🔗 Ứng dụng của tôi',
    appsOpen: 'Mở trong Pi Browser →',
    btn: 'Bắt đầu →',
  },
  zh: {
    headline: '欢迎来到 PiDEX 测验！🎉',
    subtitle: '专为 Pi 先锋设计的 DEX 知识测验与全球社区调查',
    sections: [
      { icon: '🧠', title: '通过测验学习',    body: '掌握 PiDEX、AMM、流动性、Gas 费等。共 88 题，分初级、中级、高级三个难度。' },
      { icon: '⚙️', title: '3 种游戏模式',   body: '⛏️ Miner：2 条命，通过问卷、查看统计及连续答对 10 题补充生命\n🚀 Pioneer：2 条命，通过问卷补充生命\n🔱 Validator：无生命 — 答错即结束' },
      { icon: '📋', title: '社区调查',        body: '每完成 4 份问卷 = +1 条命。随时可在问卷页面修改答案。一起了解全球 Pi 先锋社区。' },
      { icon: '🏆', title: '全球排行榜',      body: '每种模式前 100 名。通过 Pi Browser 登录后自动注册到全球排行榜。' },
    ],
    privacy: '🔒 调查数据仅用于 Pi 生态系统统计目的，不存储任何个人信息。',
    appsTitle: '🔗 我的工具集',
    appsOpen: '在 Pi Browser 中打开 →',
    btn: '开始测验 →',
  },
  ja: {
    headline: 'PiDEX クイズへようこそ！🎉',
    subtitle: 'Pi パイオニア向け DEX 知識クイズ & グローバルコミュニティ調査',
    sections: [
      { icon: '🧠', title: 'クイズで学ぼう',       body: 'PiDEX・AMM・流動性・ガス代など Pi エコシステムの DEX 知識を習得。初級・中級・上級 計 88 問。' },
      { icon: '⚙️', title: '3 つのゲームモード',   body: '⛏️ Miner：ライフ 2、アンケート・統計閲覧・10 連続正解でライフ補充\n🚀 Pioneer：ライフ 2、アンケートでライフ補充\n🔱 Validator：ライフなし — 1 問不正解で即終了' },
      { icon: '📋', title: 'コミュニティ調査',      body: 'アンケート 4 件ごとに +1 ライフ。調査ページでいつでも回答を編集可能。世界の Pi パイオニアを一緒に可視化しましょう。' },
      { icon: '🏆', title: 'グローバルランキング', body: 'モードごとに上位 100 名。Pi Browser でログインするとリーダーボードに自動登録。' },
    ],
    privacy: '🔒 収集したアンケートデータは Pi エコシステムの統計目的のみに使用されます。個人情報は保存されません。',
    appsTitle: '🔗 マイアプリ',
    appsOpen: 'Pi Browser で開く →',
    btn: 'クイズを始める →',
  },
  tl: {
    headline: 'Maligayang pagdating sa PiDEX Quiz! 🎉',
    subtitle: 'DEX knowledge quiz at global community survey para sa Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Matuto sa Quiz',           body: 'Aralin ang PiDEX, AMM, liquidity, gas fees. 88 tanong sa tatlong antas: Simula, Gitna, Advanced.' },
      { icon: '⚙️', title: '3 Game Mode',              body: '⛏️ Miner: 2 buhay, dagdag sa survey, stats at 10 tamang sagot\n🚀 Pioneer: 2 buhay, dagdag sa survey\n🔱 Validator: walang buhay — isang mali at tapos na' },
      { icon: '📋', title: 'Community Survey',          body: 'Bawat 4 survey = +1 buhay. I-edit ang mga sagot kahit kailan. Tuklasin natin ang global Pi Pioneer community.' },
      { icon: '🏆', title: 'Global Leaderboard',       body: 'Top 100 bawat mode. Mag-login sa Pi Browser para ma-register ang score sa global leaderboard.' },
    ],
    privacy: '🔒 Ang data ng survey ay ginagamit lamang para sa istatistika ng Pi ecosystem. Walang personal na impormasyon ang naka-imbak.',
    appsTitle: '🔗 Aking mga App',
    appsOpen: 'Buksan sa Pi Browser →',
    btn: 'Simulan ang Quiz →',
  },
  hi: {
    headline: 'PiDEX क्विज़ में आपका स्वागत है! 🎉',
    subtitle: 'Pi पायनियर्स के लिए DEX ज्ञान क्विज़ और वैश्विक सामुदायिक सर्वे',
    sections: [
      { icon: '🧠', title: 'क्विज़ से सीखें',         body: 'PiDEX, AMM, तरलता, गैस शुल्क सीखें। तीन स्तरों में 88 प्रश्न: प्रारंभिक, मध्य, उन्नत।' },
      { icon: '⚙️', title: '3 गेम मोड',               body: '⛏️ Miner: 2 जीवन, सर्वे/स्टैट्स/10 सही उत्तर से जीवन बढ़ाएं\n🚀 Pioneer: 2 जीवन, सर्वे से जीवन बढ़ाएं\n🔱 Validator: कोई जीवन नहीं — एक गलत = तुरंत समाप्त' },
      { icon: '📋', title: 'सामुदायिक सर्वे',         body: 'हर 4 सर्वे = +1 जीवन। सर्वे पेज पर कभी भी उत्तर संपादित करें। वैश्विक Pi पायनियर समुदाय को समझें।' },
      { icon: '🏆', title: 'वैश्विक लीडरबोर्ड',       body: 'प्रत्येक मोड में शीर्ष 100। Pi Browser से लॉगिन करें और स्वचालित रूप से लीडरबोर्ड पर दर्ज हों।' },
    ],
    privacy: '🔒 सर्वे डेटा केवल Pi पारिस्थितिकी तंत्र सांख्यिकी के लिए उपयोग किया जाता है। कोई व्यक्तिगत जानकारी संग्रहीत नहीं होती।',
    appsTitle: '🔗 मेरे ऐप्स',
    appsOpen: 'Pi Browser में खोलें →',
    btn: 'क्विज़ शुरू करें →',
  },
  bn: {
    headline: 'PiDEX কুইজে আপনাকে স্বাগতম! 🎉',
    subtitle: 'Pi পাইওনিয়ারদের জন্য DEX জ্ঞান কুইজ এবং বৈশ্বিক কমিউনিটি জরিপ',
    sections: [
      { icon: '🧠', title: 'কুইজের মাধ্যমে শিখুন',   body: 'PiDEX, AMM, তারল্য, গ্যাস ফি শিখুন। তিনটি স্তরে ৮৮টি প্রশ্ন: প্রাথমিক, মধ্যবর্তী, উন্নত।' },
      { icon: '⚙️', title: '৩টি গেম মোড',            body: '⛏️ Miner: ২টি জীবন, সার্ভে/স্ট্যাট/১০ সঠিকে জীবন বাড়ান\n🚀 Pioneer: ২টি জীবন, সার্ভেতে জীবন বাড়ান\n🔱 Validator: জীবন নেই — একটি ভুল = তাৎক্ষণিক শেষ' },
      { icon: '📋', title: 'কমিউনিটি জরিপ',           body: 'প্রতি ৪টি জরিপ = +১ জীবন। যেকোনো সময় উত্তর সম্পাদনা করুন। বৈশ্বিক Pi পাইওনিয়ার সম্প্রদায় বুঝুন।' },
      { icon: '🏆', title: 'বৈশ্বিক লিডারবোর্ড',      body: 'প্রতি মোডে শীর্ষ ১০০। Pi Browser দিয়ে লগইন করুন এবং স্বয়ংক্রিয়ভাবে নিবন্ধিত হন।' },
    ],
    privacy: '🔒 জরিপ ডেটা শুধুমাত্র Pi ইকোসিস্টেমের পরিসংখ্যানের জন্য ব্যবহৃত হয়। কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হয় না।',
    appsTitle: '🔗 আমার অ্যাপ',
    appsOpen: 'Pi Browser-এ খুলুন →',
    btn: 'কুইজ শুরু করুন →',
  },
  th: {
    headline: 'ยินดีต้อนรับสู่ PiDEX Quiz! 🎉',
    subtitle: 'แบบทดสอบความรู้ DEX & แบบสำรวจชุมชนทั่วโลกสำหรับ Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'เรียนรู้ผ่านแบบทดสอบ',   body: 'เรียนรู้ PiDEX, AMM, สภาพคล่อง, ค่าก๊าซ 88 คำถามใน 3 ระดับ: เริ่มต้น, กลาง, สูง' },
      { icon: '⚙️', title: '3 โหมดเกม',               body: '⛏️ Miner: 2 ชีวิต เติมชีวิตด้วยแบบสำรวจ/สถิติ/ตอบถูก 10 ข้อ\n🚀 Pioneer: 2 ชีวิต เติมชีวิตด้วยแบบสำรวจ\n🔱 Validator: ไม่มีชีวิต — ผิดข้อเดียวจบเลย' },
      { icon: '📋', title: 'แบบสำรวจชุมชน',            body: 'ทุก 4 แบบสำรวจ = +1 ชีวิต แก้ไขคำตอบได้ตลอดเวลา ร่วมทำความเข้าใจชุมชน Pi Pioneer ทั่วโลก' },
      { icon: '🏆', title: 'กระดานอันดับโลก',          body: 'Top 100 ต่อโหมด เข้าสู่ระบบด้วย Pi Browser เพื่อบันทึกคะแนนในกระดานโลก' },
    ],
    privacy: '🔒 ข้อมูลแบบสำรวจใช้เพื่อสถิติระบบนิเวศ Pi เท่านั้น ไม่มีการเก็บข้อมูลส่วนบุคคล',
    appsTitle: '🔗 แอปของฉัน',
    appsOpen: 'เปิดใน Pi Browser →',
    btn: 'เริ่มทำแบบทดสอบ →',
  },
  ms: {
    headline: 'Selamat Datang ke PiDEX Quiz! 🎉',
    subtitle: 'Kuiz pengetahuan DEX & tinjauan komuniti global untuk Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Belajar Melalui Kuiz',      body: 'Kuasai PiDEX, AMM, kecairan, yuran gas. 88 soalan dalam tiga tahap: Permulaan, Pertengahan, Lanjutan.' },
      { icon: '⚙️', title: '3 Mod Permainan',           body: '⛏️ Miner: 2 nyawa, tambah nyawa melalui tinjauan/statistik/10 jawapan betul\n🚀 Pioneer: 2 nyawa, tambah melalui tinjauan\n🔱 Validator: tiada nyawa — satu salah terus tamat' },
      { icon: '📋', title: 'Tinjauan Komuniti',          body: 'Setiap 4 tinjauan = +1 nyawa. Edit jawapan bila-bila masa. Bantu fahami komuniti Pi Pioneer global.' },
      { icon: '🏆', title: 'Papan Kedudukan Global',    body: 'Top 100 setiap mod. Log masuk Pi Browser untuk daftarkan skor ke papan kedudukan global.' },
    ],
    privacy: '🔒 Data tinjauan hanya digunakan untuk statistik ekosistem Pi. Tiada maklumat peribadi disimpan.',
    appsTitle: '🔗 Aplikasi Saya',
    appsOpen: 'Buka dalam Pi Browser →',
    btn: 'Mulakan Kuiz →',
  },
  es: {
    headline: '¡Bienvenido a PiDEX Quiz! 🎉',
    subtitle: 'Quiz de conocimiento DEX y encuesta global para Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Aprende con el Quiz',       body: 'Domina PiDEX, AMM, liquidez, tarifas de gas. 88 preguntas en tres niveles: Principiante, Intermedio, Avanzado.' },
      { icon: '⚙️', title: '3 Modos de Juego',         body: '⛏️ Miner: 2 vidas, recarga con encuestas/estadísticas/10 correctas seguidas\n🚀 Pioneer: 2 vidas, recarga con encuestas\n🔱 Validator: sin vidas — un error y termina' },
      { icon: '📋', title: 'Encuesta Comunitaria',      body: 'Cada 4 encuestas = +1 vida. Edita tus respuestas cuando quieras. Conoce la comunidad Pi Pioneer global.' },
      { icon: '🏆', title: 'Marcador Global',           body: 'Top 100 por modo. Inicia sesión con Pi Browser para registrar tu puntuación automáticamente.' },
    ],
    privacy: '🔒 Los datos de la encuesta se usan solo para estadísticas del ecosistema Pi. No se almacena información personal.',
    appsTitle: '🔗 Mis Apps',
    appsOpen: 'Abrir en Pi Browser →',
    btn: 'Iniciar Quiz →',
  },
  pt: {
    headline: 'Bem-vindo ao PiDEX Quiz! 🎉',
    subtitle: 'Quiz de conhecimento DEX e pesquisa global para Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Aprenda com o Quiz',        body: 'Domine PiDEX, AMM, liquidez, taxas de gas. 88 perguntas em três níveis: Iniciante, Médio, Avançado.' },
      { icon: '⚙️', title: '3 Modos de Jogo',          body: '⛏️ Miner: 2 vidas, recarregue com pesquisas/estatísticas/10 acertos seguidos\n🚀 Pioneer: 2 vidas, recarregue com pesquisas\n🔱 Validator: sem vidas — um erro e acabou' },
      { icon: '📋', title: 'Pesquisa Comunitária',      body: 'A cada 4 pesquisas = +1 vida. Edite suas respostas a qualquer momento. Entenda a comunidade Pi Pioneer global.' },
      { icon: '🏆', title: 'Placar Global',             body: 'Top 100 por modo. Faça login com Pi Browser para registrar automaticamente no placar global.' },
    ],
    privacy: '🔒 Os dados da pesquisa são usados apenas para estatísticas do ecossistema Pi. Nenhuma informação pessoal é armazenada.',
    appsTitle: '🔗 Meus Apps',
    appsOpen: 'Abrir no Pi Browser →',
    btn: 'Iniciar Quiz →',
  },
  fr: {
    headline: 'Bienvenue dans PiDEX Quiz ! 🎉',
    subtitle: 'Quiz de connaissances DEX & sondage communautaire mondial pour les Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Apprenez via des Quiz',     body: 'Maîtrisez PiDEX, AMM, liquidité, frais de gas. 88 questions en trois niveaux : Débutant, Intermédiaire, Avancé.' },
      { icon: '⚙️', title: '3 Modes de Jeu',           body: '⛏️ Miner : 2 vies, rechargez via sondages/statistiques/10 bonnes réponses\n🚀 Pioneer : 2 vies, rechargez via sondages\n🔱 Validator : aucune vie — une erreur et c\'est fini' },
      { icon: '📋', title: 'Sondage Communautaire',     body: 'Tous les 4 sondages = +1 vie. Modifiez vos réponses à tout moment. Comprendre ensemble la communauté Pi Pioneer mondiale.' },
      { icon: '🏆', title: 'Classement Mondial',        body: 'Top 100 par mode. Connectez-vous via Pi Browser pour enregistrer automatiquement votre score.' },
    ],
    privacy: '🔒 Les données du sondage sont utilisées uniquement à des fins statistiques. Aucune donnée personnelle n\'est stockée.',
    appsTitle: '🔗 Mes Applications',
    appsOpen: 'Ouvrir dans Pi Browser →',
    btn: 'Commencer le Quiz →',
  },
  ru: {
    headline: 'Добро пожаловать в PiDEX Викторину! 🎉',
    subtitle: 'Викторина по DEX и глобальный опрос сообщества для Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Учитесь через Викторину',   body: 'Освойте PiDEX, AMM, ликвидность, комиссии. 88 вопросов трёх уровней: Начальный, Средний, Продвинутый.' },
      { icon: '⚙️', title: '3 Игровых Режима',         body: '⛏️ Miner: 2 жизни, пополняйте через опросы/статистику/10 правильных подряд\n🚀 Pioneer: 2 жизни, пополняйте через опросы\n🔱 Validator: без жизней — одна ошибка и конец' },
      { icon: '📋', title: 'Опрос Сообщества',          body: 'Каждые 4 опроса = +1 жизнь. Редактируйте ответы в любое время. Вместе исследуем глобальное сообщество Pi Pioneer.' },
      { icon: '🏆', title: 'Глобальный Рейтинг',       body: 'Топ 100 по каждому режиму. Войдите через Pi Browser для автоматической регистрации в рейтинге.' },
    ],
    privacy: '🔒 Данные опроса используются исключительно в статистических целях для экосистемы Pi. Личные данные не хранятся.',
    appsTitle: '🔗 Мои Приложения',
    appsOpen: 'Открыть в Pi Browser →',
    btn: 'Начать Викторину →',
  },
  tr: {
    headline: 'PiDEX Sınavına Hoş Geldiniz! 🎉',
    subtitle: 'Pi Pioneers için DEX bilgi sınavı ve küresel topluluk anketi',
    sections: [
      { icon: '🧠', title: 'Quiz ile Öğrenin',          body: 'PiDEX, AMM, likidite, gas ücretlerini öğrenin. Üç seviyede 88 soru: Başlangıç, Orta, İleri.' },
      { icon: '⚙️', title: '3 Oyun Modu',              body: '⛏️ Miner: 2 can, anket/istatistik/10 doğru ile can kazanın\n🚀 Pioneer: 2 can, anketle can kazanın\n🔱 Validator: can yok — bir yanlış ve oyun biter' },
      { icon: '📋', title: 'Topluluk Anketi',           body: 'Her 4 anket = +1 can. Yanıtlarınızı istediğiniz zaman düzenleyin. Küresel Pi Pioneer topluluğunu birlikte anlayalım.' },
      { icon: '🏆', title: 'Küresel Lider Tablosu',    body: 'Mod başına ilk 100. Pi Browser ile giriş yapın, puanınız otomatik kaydedilir.' },
    ],
    privacy: '🔒 Anket verileri yalnızca Pi ekosistemi istatistikleri için kullanılır. Kişisel bilgi saklanmaz.',
    appsTitle: '🔗 Uygulamalarım',
    appsOpen: 'Pi Browser\'da Aç →',
    btn: 'Sınavı Başlat →',
  },
  ar: {
    headline: 'مرحباً بك في اختبار PiDEX! 🎉',
    subtitle: 'اختبار معرفة DEX واستطلاع مجتمعي عالمي لـ Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'تعلّم عبر الاختبار',       body: 'أتقن PiDEX وAMM والسيولة ورسوم الغاز. 88 سؤالاً في ثلاثة مستويات: مبتدئ، متوسط، متقدم.' },
      { icon: '⚙️', title: '3 أوضاع لعب',             body: '⛏️ Miner: روحان، اكسب أرواحاً بالاستبيانات والإحصاءات و10 إجابات صحيحة متتالية\n🚀 Pioneer: روحان، اكسب أرواحاً بالاستبيانات\n🔱 Validator: بلا أرواح — خطأ واحد وتنتهي اللعبة' },
      { icon: '📋', title: 'استطلاع المجتمع',          body: 'كل 4 استطلاعات = +1 روح. عدّل إجاباتك في أي وقت. افهم مجتمع Pi Pioneer العالمي معاً.' },
      { icon: '🏆', title: 'لوحة المتصدرين العالمية', body: 'أفضل 100 لكل وضع. سجّل دخولك عبر Pi Browser لتسجيل نقاطك تلقائياً.' },
    ],
    privacy: '🔒 تُستخدم بيانات الاستطلاع فقط لأغراض إحصاءات نظام Pi البيئي. لا يتم تخزين أي معلومات شخصية.',
    appsTitle: '🔗 تطبيقاتي',
    appsOpen: 'فتح في Pi Browser →',
    btn: 'ابدأ الاختبار →',
  },
  sw: {
    headline: 'Karibu kwenye PiDEX Quiz! 🎉',
    subtitle: 'Maswali ya ujuzi wa DEX na utafiti wa jamii ya ulimwengu kwa Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Jifunze Kupitia Maswali',   body: 'Jifunze PiDEX, AMM, ukwasi, ada za gas. Maswali 88 katika viwango vitatu: Mwanzo, Kati, Juu.' },
      { icon: '⚙️', title: 'Hali 3 za Mchezo',         body: '⛏️ Miner: maisha 2, jaza kupitia dodoso/takwimu/majibu 10 sahihi mfululizo\n🚀 Pioneer: maisha 2, jaza kupitia dodoso\n🔱 Validator: bila maisha — jibu moja baya na mchezo unaisha' },
      { icon: '📋', title: 'Dodoso la Jamii',           body: 'Kila dodoso 4 = +1 maisha. Hariri majibu wakati wowote. Elewa pamoja jamii ya Pi Pioneer duniani.' },
      { icon: '🏆', title: 'Ubao wa Viongozi wa Ulimwengu', body: 'Top 100 kwa kila hali. Ingia kupitia Pi Browser ili kuhifadhi alama yako kiotomatiki.' },
    ],
    privacy: '🔒 Data ya dodoso inatumika tu kwa takwimu za mfumo wa Pi. Hakuna taarifa za kibinafsi zinazohifadhiwa.',
    appsTitle: '🔗 Programu Zangu',
    appsOpen: 'Fungua kwenye Pi Browser →',
    btn: 'Anza Maswali →',
  },
};

// ── 유틸 모음 앱 목록 ────────────────────────────────
const MY_APPS = [
  {
    icon: '📊',
    url: 'https://apppidexutillaac6961.pinet.com/',
    name: {
      ko: 'PiDEX Util',   en: 'PiDEX Util',   id: 'PiDEX Util',   vi: 'PiDEX Util',
      zh: 'PiDEX Util',   ja: 'PiDEX Util',   tl: 'PiDEX Util',   hi: 'PiDEX Util',
      bn: 'PiDEX Util',   th: 'PiDEX Util',   ms: 'PiDEX Util',   es: 'PiDEX Util',
      pt: 'PiDEX Util',   fr: 'PiDEX Util',   ru: 'PiDEX Util',   tr: 'PiDEX Util',
      ar: 'PiDEX Util',   sw: 'PiDEX Util',
    },
    tags: ['DEX', 'LP', 'ARB', 'SWAP'],
    desc: {
      ko: 'DEX 현황 대시보드 · LP 계산기 · 차익 탐색 · 스왑 시뮬레이터 · 지갑 조회',
      en: 'DEX dashboard · LP calculator · Arbitrage finder · Swap simulator · Wallet view',
      id: 'Dasbor DEX · Kalkulator LP · Pencari arbitrase · Simulator swap · Lihat dompet',
      vi: 'Bảng DEX · Tính LP · Tìm arbitrage · Mô phỏng swap · Xem ví',
      zh: 'DEX 概览 · LP 计算器 · 套利查找 · 兑换模拟 · 钱包查询',
      ja: 'DEX 概況 · LP計算機 · アービトラージ探索 · スワップシミュレーター · ウォレット照会',
      tl: 'DEX dashboard · LP calculator · Arbitrage finder · Swap simulator · Wallet view',
      hi: 'DEX डैशबोर्ड · LP कैलकुलेटर · Arb खोज · Swap सिमुलेटर · वॉलेट देखें',
      bn: 'DEX ড্যাশবোর্ড · LP ক্যালকুলেটর · Arb খোঁজা · Swap সিমুলেটর · ওয়ালেট দেখুন',
      th: 'แดชบอร์ด DEX · คำนวณ LP · ค้นหา Arb · จำลอง Swap · ดูกระเป๋า',
      ms: 'Papan DEX · Kalkulator LP · Pencari arbitraj · Simulator swap · Lihat dompet',
      es: 'Panel DEX · Calculadora LP · Buscador de arbitraje · Simulador swap · Ver cartera',
      pt: 'Painel DEX · Calculadora LP · Buscador de arbitragem · Simulador swap · Ver carteira',
      fr: 'Tableau DEX · Calculatrice LP · Recherche arbitrage · Simulateur swap · Portefeuille',
      ru: 'Панель DEX · Калькулятор LP · Поиск арбитража · Симулятор свопа · Кошелёк',
      tr: 'DEX paneli · LP hesaplayıcı · Arbitraj bulucu · Swap simülatörü · Cüzdan görünümü',
      ar: 'لوحة DEX · حاسبة LP · باحث المراجحة · محاكي Swap · عرض المحفظة',
      sw: 'Dashibodi DEX · Kikokotoo LP · Tafuta arbitrage · Mchezo wa swap · Angalia mkoba',
    },
  },
  {
    icon: '🔬',
    url: 'https://mmstrategylabqge3450.pinet.com/',
    name: {
      ko: 'MM 백테스트',    en: 'MM Backtest',   id: 'MM Backtest',   vi: 'MM Backtest',
      zh: 'MM 回测',        ja: 'MM バックテスト', tl: 'MM Backtest',  hi: 'MM बैकटेस्ट',
      bn: 'MM ব্যাকটেস্ট', th: 'MM Backtest',   ms: 'MM Backtest',   es: 'MM Backtest',
      pt: 'MM Backtest',    fr: 'MM Backtest',   ru: 'MM Бэктест',    tr: 'MM Backtest',
      ar: 'MM اختبار',      sw: 'MM Backtest',
    },
    tags: ['Orderbook', 'AMM', 'Stellar', 'Pi DEX'],
    desc: {
      ko: '마켓메이킹 전략 시뮬레이터 · Orderbook/AMM 두 전략 · Pi DEX + Stellar 메인넷 지원',
      en: 'Market-making strategy simulator · Orderbook/AMM strategies · Pi DEX + Stellar mainnet',
      id: 'Simulator strategi market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      vi: 'Trình mô phỏng chiến lược market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      zh: '做市策略模拟器 · 订单簿/AMM · 支持 Pi DEX + Stellar 主网',
      ja: 'マーケットメイキング戦略シミュレーター · オーダーブック/AMM · Pi DEX + Stellar メインネット',
      tl: 'Market-making strategy simulator · Orderbook/AMM · Pi DEX + Stellar mainnet',
      hi: 'मार्केट-मेकिंग स्ट्रैटेजी सिमुलेटर · Orderbook/AMM · Pi DEX + Stellar mainnet',
      bn: 'মার্কেট-মেকিং কৌশল সিমুলেটর · Orderbook/AMM · Pi DEX + Stellar mainnet',
      th: 'ตัวจำลองกลยุทธ์ Market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      ms: 'Simulator strategi market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      es: 'Simulador de estrategia market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      pt: 'Simulador de estratégia market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      fr: 'Simulateur de stratégie market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      ru: 'Симулятор стратегии маркет-мейкинга · Orderbook/AMM · Pi DEX + Stellar mainnet',
      tr: 'Market-making strateji simülatörü · Orderbook/AMM · Pi DEX + Stellar mainnet',
      ar: 'محاكي استراتيجية صنع السوق · Orderbook/AMM · Pi DEX + Stellar mainnet',
      sw: 'Msimulizi wa mkakati wa market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
    },
  },
];

function getContent() {
  const lang = getLang();
  return INTRO_CONTENT[lang] || INTRO_CONTENT['en'];
}

function getLangKey() {
  const lang = getLang();
  return MY_APPS[0].name[lang] ? lang : 'en';
}

export function renderIntroPage(container, onStart) {
  const c   = getContent();
  const lk  = getLangKey();

  container.innerHTML = `
    <div class="intro-page">
      <div class="intro-logo">π</div>
      <h1 class="intro-headline">${c.headline}</h1>
      <p class="intro-subtitle">${c.subtitle}</p>

      <div class="intro-sections">
        ${c.sections.map(s => `
          <div class="intro-section">
            <div class="intro-section-icon">${s.icon}</div>
            <div class="intro-section-body">
              <strong>${s.title}</strong>
              <p>${s.body.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 유틸 모음 -->
      <div class="intro-apps">
        <div class="intro-apps-title">${c.appsTitle}</div>
        ${MY_APPS.map(app => `
          <a class="intro-app-card" href="${app.url}" target="_blank">
            <div class="intro-app-icon">${app.icon}</div>
            <div class="intro-app-body">
              <div class="intro-app-name">${app.name[lk] ?? app.name.en}</div>
              <div class="intro-app-tags">
                ${app.tags.map(tag => `<span class="intro-app-tag">${tag}</span>`).join('')}
              </div>
              <div class="intro-app-desc">${app.desc[lk] ?? app.desc.en}</div>
            </div>
            <div class="intro-app-open">${c.appsOpen}</div>
          </a>
        `).join('')}
      </div>

      <!-- 언어 선택 -->
      <div class="intro-lang-select">
        <label class="intro-lang-label">🌐 Language / 언어</label>
        <div class="lang-grid" id="lang-grid">
          ${SUPPORTED_LANGS.map(l => `
            <button class="lang-btn ${l.code === getLang() ? 'active' : ''}" data-lang="${l.code}">
              ${l.flag} ${l.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="intro-privacy">${c.privacy}</div>

      <button class="btn-primary btn-intro-start" id="btn-intro-start">
        ${c.btn}
      </button>
    </div>
  `;

  container.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      renderIntroPage(container, onStart);
    });
  });

  container.querySelector('#btn-intro-start').addEventListener('click', onStart);
}
