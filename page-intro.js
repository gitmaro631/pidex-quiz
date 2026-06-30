import { t, getLang, SUPPORTED_LANGS, setLang } from './util-i18n.js';

// ── 앱 소개 콘텐츠 (언어별) ──────────────────────────
const INTRO_CONTENT = {
  ko: {
    headline: 'PiDEX 퀴즈에 오신 것을 환영합니다! 🎉',
    subtitle: 'Pi 파이오니어를 위한 DEX 지식 퀴즈 & 글로벌 커뮤니티 설문',
    sections: [
      { icon: '🧠', title: '퀴즈로 배우세요',      body: 'PiDEX, AMM, 유동성, 가스비 등 Pi 생태계를 이해하는 핵심 DEX 지식을 퀴즈로 배울 수 있습니다. 초급·중급·고급 3단계.' },
      { icon: '❤️', title: '생명력 시스템',        body: '처음에 생명력 5개. 오답 시 -1, 5연속 정답 시 +1, 설문 완료 시 +3. 생명력이 0이 되면 점수가 리더보드에 등록되고 새 게임 시작.' },
      { icon: '🌍', title: '글로벌 파이오니어 설문', body: '이 앱의 핵심 목표는 전 세계 파이오니어들의 현황을 파악하는 것입니다. 설문 참여 시 +5점 +생명력 3개.' },
      { icon: '🏆', title: '리더보드로 경쟁하세요', body: '전 세계 파이오니어들과 점수를 겨뤄보세요. Pi Browser로 로그인하면 글로벌 리더보드에 등록됩니다.' },
    ],
    privacy: '🔒 수집된 설문 데이터는 Pi 생태계 발전을 위한 통계 목적으로만 사용되며, 개인 식별 정보는 저장되지 않습니다.',
    appsTitle: '🔗 유틸 모음',
    appsOpen: 'Pi Browser로 열기 →',
    btn: '퀴즈 시작하기 →',
  },
  en: {
    headline: 'Welcome to PiDEX Quiz! 🎉',
    subtitle: 'DEX knowledge quiz & global community survey for Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Learn Through Quizzes',        body: 'Master PiDEX, AMM, liquidity, gas fees and all DEX concepts essential for Pi. Three levels: Beginner, Intermediate, Advanced.' },
      { icon: '❤️', title: 'Lives System',                 body: 'Start with 5 lives. Wrong = -1, 5-streak = +1, survey = +3. When lives hit 0, your score goes on the leaderboard and a new game starts.' },
      { icon: '🌍', title: 'Global Pioneer Survey',        body: 'This app\'s core goal is to understand the Pi Pioneer community worldwide. Each survey earns +5 pts and +3 lives!' },
      { icon: '🏆', title: 'Compete on the Leaderboard',  body: 'Compete with Pioneers worldwide. Log in via Pi Browser to save your score to the global leaderboard.' },
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
      { icon: '🧠', title: 'Belajar Lewat Kuis',         body: 'Pelajari PiDEX, AMM, likuiditas, biaya gas, dan semua konsep DEX penting. Tiga tingkat: Pemula, Menengah, Mahir.' },
      { icon: '❤️', title: 'Sistem Nyawa',               body: 'Mulai dengan 5 nyawa. Salah = -1, 5 beruntun = +1, survei = +3. Nyawa habis → skor masuk papan peringkat, mulai ulang.' },
      { icon: '🌍', title: 'Survei Pioneer Global',      body: 'Tujuan utama memahami komunitas Pi Pioneer di seluruh dunia. Ikut survei → +5 poin dan +3 nyawa!' },
      { icon: '🏆', title: 'Bersaing di Papan Peringkat', body: 'Bersaing dengan Pioneer di seluruh dunia. Login Pi Browser untuk masuk papan peringkat global.' },
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
      { icon: '🧠', title: 'Học qua câu hỏi',        body: 'Nắm vững PiDEX, AMM, thanh khoản, phí gas. Ba cấp độ: Cơ bản, Trung cấp, Nâng cao.' },
      { icon: '❤️', title: 'Hệ thống mạng',          body: 'Bắt đầu 5 mạng. Sai = -1, 5 liên tiếp = +1, khảo sát = +3. Hết mạng → điểm lên bảng xếp hạng.' },
      { icon: '🌍', title: 'Khảo sát Pioneer toàn cầu', body: 'Mục tiêu chính: hiểu cộng đồng Pi Pioneer toàn cầu. Tham gia khảo sát nhận +5 điểm và +3 mạng!' },
      { icon: '🏆', title: 'Cạnh tranh bảng xếp hạng', body: 'Thi đấu với Pioneer toàn cầu. Đăng nhập Pi Browser để lưu điểm.' },
    ],
    privacy: '🔒 Dữ liệu khảo sát chỉ dùng cho thống kê Pi. Không lưu thông tin cá nhân.',
    appsTitle: '🔗 Ứng dụng của tôi',
    appsOpen: 'Mở trong Pi Browser →',
    btn: 'Bắt đầu Câu hỏi →',
  },
  zh: {
    headline: '欢迎来到 PiDEX 测验！🎉',
    subtitle: '专为 Pi 先锋设计的 DEX 知识测验与全球社区调查',
    sections: [
      { icon: '🧠', title: '通过测验学习',   body: '掌握 PiDEX、AMM、流动性、Gas 费等。三个难度：初级、中级、高级。' },
      { icon: '❤️', title: '生命系统',      body: '开始 5 条命。答错 -1，连续 5 次 +1，问卷 +3。生命耗尽 → 成绩上榜，开始新游戏。' },
      { icon: '🌍', title: '全球先锋调查', body: '核心目标：了解全球 Pi 先锋社区现状。参与调查得 +5 分和 +3 命！' },
      { icon: '🏆', title: '排行榜竞争',   body: '与全球先锋竞争。Pi Browser 登录后成绩登上全球排行榜。' },
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
      { icon: '🧠', title: 'クイズで学ぼう',      body: 'PiDEX、AMM、流動性、ガス代など Pi エコシステムに必要な DEX の知識を学べます。初級・中級・上級の 3 段階。' },
      { icon: '❤️', title: 'ライフシステム',      body: 'ライフ 5 からスタート。不正解 -1、5 連続正解 +1、アンケート回答 +3。ライフ 0 でスコアがリーダーボードに登録されゲームリセット。' },
      { icon: '🌍', title: 'グローバル調査',      body: 'このアプリの核心目的は世界中の Pi パイオニアの状況を把握すること。アンケート回答で +5pt と +3 ライフ！' },
      { icon: '🏆', title: 'リーダーボードで競う', body: '世界のパイオニアとスコアを競いましょう。Pi Browser でログインするとグローバルリーダーボードに登録されます。' },
    ],
    privacy: '🔒 収集したアンケートデータは Pi エコシステムの統計目的のみに使用され、個人を特定できる情報は保存されません。',
    appsTitle: '🔗 マイアプリ',
    appsOpen: 'Pi Browser で開く →',
    btn: 'クイズを始める →',
  },
  fr: {
    headline: 'Bienvenue dans PiDEX Quiz ! 🎉',
    subtitle: 'Quiz de connaissances DEX & sondage communautaire mondial pour les Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Apprenez via des Quiz',    body: 'Maîtrisez PiDEX, AMM, liquidité, frais de gas. Trois niveaux : Débutant, Intermédiaire, Avancé.' },
      { icon: '❤️', title: 'Système de Vies',         body: 'Commencez avec 5 vies. Mauvaise réponse = -1, 5 bonnes de suite = +1, sondage = +3. Vies à 0 → score enregistré, nouveau jeu.' },
      { icon: '🌍', title: 'Sondage Pioneer Mondial', body: 'Objectif principal : comprendre la communauté Pi Pioneer mondiale. Chaque sondage rapporte +5 pts et +3 vies !' },
      { icon: '🏆', title: 'Classement Mondial',      body: 'Rivalisez avec des Pioneers du monde entier. Connectez-vous via Pi Browser pour enregistrer votre score.' },
    ],
    privacy: '🔒 Les données du sondage sont utilisées uniquement à des fins statistiques pour l\'écosystème Pi. Aucune donnée personnelle n\'est stockée.',
    appsTitle: '🔗 Mes Applications',
    appsOpen: 'Ouvrir dans Pi Browser →',
    btn: 'Commencer le Quiz →',
  },
  th: {
    headline: 'ยินดีต้อนรับสู่ PiDEX Quiz! 🎉',
    subtitle: 'แบบทดสอบความรู้ DEX & แบบสำรวจชุมชนทั่วโลกสำหรับ Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'เรียนรู้ผ่านแบบทดสอบ',  body: 'เรียนรู้ PiDEX, AMM, สภาพคล่อง, ค่าก๊าซ ฯลฯ สามระดับ: ผู้เริ่มต้น, ระดับกลาง, ขั้นสูง' },
      { icon: '❤️', title: 'ระบบชีวิต',             body: 'เริ่มด้วย 5 ชีวิต ตอบผิด -1 ตอบถูก 5 ครั้งติด +1 แบบสำรวจ +3 ชีวิต = 0 → คะแนนขึ้นกระดาน เริ่มใหม่' },
      { icon: '🌍', title: 'แบบสำรวจ Pioneer ทั่วโลก', body: 'เป้าหมายหลักของแอปนี้คือการเข้าใจชุมชน Pi Pioneer ทั่วโลก ร่วมแบบสำรวจรับ +5 แต้มและ +3 ชีวิต!' },
      { icon: '🏆', title: 'แข่งขันบนกระดานอันดับ', body: 'แข่งกับ Pioneers ทั่วโลก ล็อกอินผ่าน Pi Browser เพื่อบันทึกคะแนน' },
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
      { icon: '🧠', title: 'Belajar Melalui Kuiz',         body: 'Kuasai PiDEX, AMM, kecairan, yuran gas. Tiga tahap: Permulaan, Pertengahan, Lanjutan.' },
      { icon: '❤️', title: 'Sistem Nyawa',                 body: 'Mulakan dengan 5 nyawa. Salah = -1, 5 berturut = +1, tinjauan = +3. Nyawa habis → skor masuk papan, mula semula.' },
      { icon: '🌍', title: 'Tinjauan Pioneer Global',      body: 'Tujuan utama memahami komuniti Pi Pioneer di seluruh dunia. Sertai tinjauan untuk +5 mata dan +3 nyawa!' },
      { icon: '🏆', title: 'Bersaing di Papan Kedudukan', body: 'Bersaing dengan Pioneer di seluruh dunia. Log masuk Pi Browser untuk simpan skor.' },
    ],
    privacy: '🔒 Data tinjauan hanya digunakan untuk statistik ekosistem Pi. Tiada maklumat peribadi disimpan.',
    appsTitle: '🔗 Aplikasi Saya',
    appsOpen: 'Buka dalam Pi Browser →',
    btn: 'Mulakan Kuiz →',
  },
  bn: {
    headline: 'PiDEX কুইজে আপনাকে স্বাগতম! 🎉',
    subtitle: 'Pi পাইওনিয়ারদের জন্য DEX জ্ঞান কুইজ এবং বৈশ্বিক কমিউনিটি জরিপ',
    sections: [
      { icon: '🧠', title: 'কুইজের মাধ্যমে শিখুন',    body: 'PiDEX, AMM, তারল্য, গ্যাস ফি শিখুন। তিনটি স্তর: প্রাথমিক, মধ্যবর্তী, উন্নত।' },
      { icon: '❤️', title: 'জীবন পদ্ধতি',             body: '৫টি জীবন দিয়ে শুরু। ভুল = -১, ৫ ধারাবাহিক = +১, জরিপ = +৩। জীবন ০ হলে → স্কোর লিডারবোর্ডে, নতুন গেম।' },
      { icon: '🌍', title: 'বৈশ্বিক পাইওনিয়ার জরিপ', body: 'মূল লক্ষ্য: বিশ্বের Pi পাইওনিয়ার সম্প্রদায় বোঝা। জরিপে অংশ নিলে +৫ পয়েন্ট ও +৩ জীবন!' },
      { icon: '🏆', title: 'লিডারবোর্ডে প্রতিযোগিতা', body: 'বিশ্বজুড়ে পাইওনিয়ারদের সাথে প্রতিযোগিতা করুন। Pi Browser দিয়ে লগইন করুন।' },
    ],
    privacy: '🔒 জরিপ ডেটা শুধুমাত্র Pi ইকোসিস্টেমের পরিসংখ্যানের জন্য ব্যবহৃত হয়। কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হয় না।',
    appsTitle: '🔗 আমার অ্যাপ',
    appsOpen: 'Pi Browser-এ খুলুন →',
    btn: 'কুইজ শুরু করুন →',
  },
  sw: {
    headline: 'Karibu kwenye PiDEX Quiz! 🎉',
    subtitle: 'Maswali ya ujuzi wa DEX na utafiti wa jamii ya ulimwengu kwa Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Jifunze Kupitia Maswali',   body: 'Jifunze PiDEX, AMM, ukwasi, ada za gas. Viwango vitatu: Mwanzo, Kati, Juu.' },
      { icon: '❤️', title: 'Mfumo wa Maisha',           body: 'Anza na maisha 5. Jibu baya = -1, mfululizo 5 = +1, utafiti = +3. Maisha 0 → alama kwenye ubao, mchezo mpya.' },
      { icon: '🌍', title: 'Utafiti wa Pioneer Duniani', body: 'Lengo kuu: kuelewa jamii ya Pi Pioneer duniani. Shiriki utafiti → +5 pointi na +3 maisha!' },
      { icon: '🏆', title: 'Shindana kwenye Ubao',      body: 'Shindana na Pioneers duniani kote. Ingia kupitia Pi Browser ili kuhifadhi alama yako.' },
    ],
    privacy: '🔒 Data ya utafiti inatumika tu kwa takwimu za mfumo wa Pi. Hakuna taarifa za kibinafsi zinazohifadhiwa.',
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
      zh: 'PiDEX Util',   ja: 'PiDEX Util',   fr: 'PiDEX Util',   th: 'PiDEX Util',
      ms: 'PiDEX Util',   bn: 'PiDEX Util',   sw: 'PiDEX Util',
    },
    tags: ['DEX', 'LP', 'ARB', 'SWAP'],
    desc: {
      ko: 'DEX 현황 대시보드 · LP 계산기 · 차익 탐색 · 스왑 시뮬레이터 · 지갑 조회',
      en: 'DEX dashboard · LP calculator · Arbitrage finder · Swap simulator · Wallet view',
      id: 'Dasbor DEX · Kalkulator LP · Pencari arbitrase · Simulator swap · Lihat dompet',
      vi: 'Bảng DEX · Tính LP · Tìm arbitrage · Mô phỏng swap · Xem ví',
      zh: 'DEX 概览 · LP 计算器 · 套利查找 · 兑换模拟 · 钱包查询',
      ja: 'DEX 概況 · LP計算機 · アービトラージ探索 · スワップシミュレーター · ウォレット照会',
      fr: 'Tableau DEX · Calculatrice LP · Recherche d\'arbitrage · Simulateur swap · Portefeuille',
      th: 'แดชบอร์ด DEX · คำนวณ LP · ค้นหา Arb · จำลอง Swap · ดูกระเป๋า',
      ms: 'Papan DEX · Kalkulator LP · Pencari arbitraj · Simulator swap · Lihat dompet',
      bn: 'DEX ড্যাশবোর্ড · LP ক্যালকুলেটর · Arb খোঁজা · Swap সিমুলেটর',
      sw: 'Dashibodi DEX · Kikokotoo LP · Tafuta arbitrage · Mchezo wa swap',
    },
  },
  {
    icon: '🔬',
    url: 'https://mmstrategylabqge3450.pinet.com/',
    name: {
      ko: 'MM 백테스트',         en: 'MM Backtest',          id: 'MM Backtest',
      vi: 'MM Backtest',         zh: 'MM 回测',              ja: 'MM バックテスト',
      fr: 'MM Backtest',         th: 'MM Backtest',          ms: 'MM Backtest',
      bn: 'MM ব্যাকটেস্ট',      sw: 'MM Backtest',
    },
    tags: ['Orderbook', 'AMM', 'Stellar', 'Pi DEX'],
    desc: {
      ko: '마켓메이킹 전략 시뮬레이터 · Orderbook/AMM 두 전략 · Pi DEX + Stellar 메인넷 지원',
      en: 'Market-making strategy simulator · Orderbook/AMM strategies · Pi DEX + Stellar mainnet',
      id: 'Simulator strategi market-making · Strategi Orderbook/AMM · Pi DEX + Stellar mainnet',
      vi: 'Trình mô phỏng chiến lược market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      zh: '做市策略模拟器 · 订单簿/AMM 两种策略 · 支持 Pi DEX + Stellar 主网',
      ja: 'マーケットメイキング戦略シミュレーター · オーダーブック/AMM · Pi DEX + Stellar メインネット',
      fr: 'Simulateur de stratégie de market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      th: 'ตัวจำลองกลยุทธ์ Market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      ms: 'Simulator strategi market-making · Orderbook/AMM · Pi DEX + Stellar mainnet',
      bn: 'মার্কেট-মেকিং কৌশল সিমুলেটর · Orderbook/AMM · Pi DEX + Stellar mainnet',
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
              <p>${s.body}</p>
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
