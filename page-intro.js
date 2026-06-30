import { t, getLang, SUPPORTED_LANGS, setLang } from './util-i18n.js';

// 언어별 소개 콘텐츠
const INTRO_CONTENT = {
  ko: {
    headline: 'PiDEX 퀴즈에 오신 것을 환영합니다! 🎉',
    subtitle: 'Pi 파이오니어를 위한 DEX 지식 퀴즈 & 글로벌 커뮤니티 설문',
    sections: [
      {
        icon: '🧠',
        title: '퀴즈로 배우세요',
        body: 'PiDEX, AMM, 유동성, 가스비 등 Pi 생태계를 이해하는 데 필요한 핵심 DEX 지식을 퀴즈로 배울 수 있습니다. 초급·중급·고급 3단계로 구성되어 있어요.',
      },
      {
        icon: '❤️',
        title: '생명력 시스템',
        body: '처음에 생명력 5개를 받습니다. 오답 시 1개 감소, 5연속 정답 시 1개 회복됩니다. 생명력이 0이 되면 점수가 리더보드에 등록되고 새 게임이 시작돼요.',
      },
      {
        icon: '🌍',
        title: '글로벌 파이오니어 설문',
        body: '이 앱의 핵심 목표는 전 세계 파이오니어들의 현황을 파악하는 것입니다. 퀴즈 도중 간단한 설문에 참여하면 +5점과 생명력 +3을 받을 수 있어요.',
      },
      {
        icon: '🏆',
        title: '리더보드로 경쟁하세요',
        body: '전 세계 파이오니어들과 점수를 겨뤄보세요. Pi Browser로 로그인하면 자신의 점수가 글로벌 리더보드에 등록됩니다.',
      },
    ],
    privacy: '🔒 수집된 설문 데이터는 Pi 생태계 발전을 위한 통계 목적으로만 사용되며, 개인 식별 정보는 저장되지 않습니다.',
    btn: '퀴즈 시작하기 →',
  },
  en: {
    headline: 'Welcome to PiDEX Quiz! 🎉',
    subtitle: 'DEX knowledge quiz & global community survey for Pi Pioneers',
    sections: [
      {
        icon: '🧠',
        title: 'Learn Through Quizzes',
        body: 'Master PiDEX, AMM, liquidity, gas fees, and all the DEX concepts essential for the Pi ecosystem. Three difficulty levels: Beginner, Intermediate, and Advanced.',
      },
      {
        icon: '❤️',
        title: 'Lives System',
        body: 'You start with 5 lives. Each wrong answer costs 1 life. Every 5 correct answers in a row earns +1 life. When lives reach 0, your score is saved to the leaderboard and a new game begins.',
      },
      {
        icon: '🌍',
        title: 'Global Pioneer Survey',
        body: 'The core purpose of this app is to understand the Pi Pioneer community worldwide. Participating in surveys earns you +5 points and +3 lives!',
      },
      {
        icon: '🏆',
        title: 'Compete on the Leaderboard',
        body: 'Compete with Pioneers around the world. Log in with Pi Browser to save your score to the global leaderboard.',
      },
    ],
    privacy: '🔒 Survey data is used solely for statistical purposes to advance the Pi ecosystem. No personally identifiable information is stored.',
    btn: 'Start Quiz →',
  },
  id: {
    headline: 'Selamat Datang di PiDEX Quiz! 🎉',
    subtitle: 'Kuis pengetahuan DEX & survei komunitas global untuk Pi Pioneers',
    sections: [
      {
        icon: '🧠',
        title: 'Belajar Lewat Kuis',
        body: 'Pelajari PiDEX, AMM, likuiditas, biaya gas, dan semua konsep DEX penting untuk ekosistem Pi. Tiga tingkat kesulitan: Pemula, Menengah, dan Mahir.',
      },
      {
        icon: '❤️',
        title: 'Sistem Nyawa',
        body: 'Kamu mulai dengan 5 nyawa. Setiap jawaban salah mengurangi 1 nyawa. Setiap 5 jawaban benar berturut-turut mendapat +1 nyawa. Jika nyawa habis, skormu disimpan ke papan peringkat.',
      },
      {
        icon: '🌍',
        title: 'Survei Pioneer Global',
        body: 'Tujuan utama aplikasi ini adalah memahami komunitas Pi Pioneer di seluruh dunia. Ikut survei dan dapatkan +5 poin serta +3 nyawa!',
      },
      {
        icon: '🏆',
        title: 'Bersaing di Papan Peringkat',
        body: 'Bersaing dengan Pioneer di seluruh dunia. Login dengan Pi Browser untuk menyimpan skor ke papan peringkat global.',
      },
    ],
    privacy: '🔒 Data survei hanya digunakan untuk tujuan statistik demi kemajuan ekosistem Pi. Tidak ada informasi pribadi yang disimpan.',
    btn: 'Mulai Kuis →',
  },
  vi: {
    headline: 'Chào mừng đến với PiDEX Quiz! 🎉',
    subtitle: 'Câu hỏi kiến thức DEX & khảo sát cộng đồng toàn cầu cho Pi Pioneers',
    sections: [
      { icon: '🧠', title: 'Học qua câu hỏi', body: 'Nắm vững PiDEX, AMM, thanh khoản, phí gas và mọi khái niệm DEX cần thiết. Ba cấp độ: Cơ bản, Trung cấp, Nâng cao.' },
      { icon: '❤️', title: 'Hệ thống mạng', body: 'Bắt đầu với 5 mạng. Trả lời sai -1 mạng, đúng 5 lần liên tiếp +1 mạng. Hết mạng, điểm được lưu vào bảng xếp hạng.' },
      { icon: '🌍', title: 'Khảo sát Pioneer toàn cầu', body: 'Mục tiêu chính là tìm hiểu cộng đồng Pi Pioneer trên toàn thế giới. Tham gia khảo sát để nhận +5 điểm và +3 mạng!' },
      { icon: '🏆', title: 'Cạnh tranh trên bảng xếp hạng', body: 'Thi đấu với các Pioneer trên toàn cầu. Đăng nhập Pi Browser để lưu điểm.' },
    ],
    privacy: '🔒 Dữ liệu khảo sát chỉ dùng cho mục đích thống kê. Không lưu thông tin cá nhân.',
    btn: 'Bắt đầu Câu hỏi →',
  },
  zh: {
    headline: '欢迎来到 PiDEX 测验！🎉',
    subtitle: '专为 Pi 先锋设计的 DEX 知识测验与全球社区调查',
    sections: [
      { icon: '🧠', title: '通过测验学习', body: '掌握 PiDEX、AMM、流动性、Gas 费用等 Pi 生态系统必备的 DEX 知识。三个难度级别：初级、中级、高级。' },
      { icon: '❤️', title: '生命系统', body: '开始时拥有 5 条命。答错 -1 命，连续 5 次答对 +1 命。生命耗尽时，成绩登上排行榜，新游戏开始。' },
      { icon: '🌍', title: '全球先锋调查', body: '本应用的核心目标是了解全球 Pi 先锋社区现状。参与调查可获得 +5 分和 +3 命！' },
      { icon: '🏆', title: '排行榜竞争', body: '与全球先锋竞争。使用 Pi Browser 登录即可将成绩保存至全球排行榜。' },
    ],
    privacy: '🔒 调查数据仅用于推进 Pi 生态系统的统计目的。不存储任何个人身份信息。',
    btn: '开始测验 →',
  },
};

function getContent() {
  const lang = getLang();
  return INTRO_CONTENT[lang] || INTRO_CONTENT['en'];
}

export function renderIntroPage(container, onStart) {
  const c = getContent();

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
