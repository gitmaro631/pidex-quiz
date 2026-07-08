import { initPiSDK, authenticate } from './pi-sdk.js';
import { detectCountry } from './util-i18n.js';
import { renderQuizPage }   from './page-quiz.js';
import { renderRankPage }   from './page-rank.js';
import { renderStatsPage }  from './page-stats.js';
import { renderSurveyPage } from './page-survey.js';
import { getScore, getLives, isSubscribed } from './util-storage.js';
import { initLang, t, getLang, setLang, SUPPORTED_LANGS } from './util-i18n.js';
import { renderHelpModal }  from './page-help.js';
import { initFirebase, loadSurveyFromFirestore, updateLeaderboardCountry } from './firebase.js';
import { mergeSurveyFromCloud } from './util-storage.js';
const NOTICE = {
  version: '2026-07-08',
  ko: "📚 퀴즈 업데이트 안내\n\n📅 2026-07-08\n\n✅ 초급 (B040~B044) +5문제\n✅ 중급 (M035~M039) +5문제\n✅ 고급 (A016~A017) +2문제\n\nEP27~29: 영국 FCA 규제, PiDEX Util 가이드, 오더북 마켓메이킹 내용이 추가되었습니다.",
  en: "📚 Quiz Update\n\n📅 2026-07-08\n\n✅ Beginner (B040~B044) +5 questions\n✅ Intermediate (M035~M039) +5 questions\n✅ Advanced (A016~A017) +2 questions\n\nEP27~29: New content on UK FCA regulation, PiDEX Util guide, and orderbook market-making has been added.",
  zh: "📚 题库更新通知\n\n📅 2026-07-08\n\n✅ 初级 (B040~B044) +5题\n✅ 中级 (M035~M039) +5题\n✅ 高级 (A016~A017) +2题\n\nEP27~29：新增英国FCA监管、PiDEX Util指南及订单簿做市商相关内容。",
  id: "📚 Pembaruan Kuis\n\n📅 2026-07-08\n\n✅ Pemula (B040~B044) +5 soal\n✅ Menengah (M035~M039) +5 soal\n✅ Lanjutan (A016~A017) +2 soal\n\nEP27~29: Konten baru tentang regulasi FCA Inggris, panduan PiDEX Util, dan market-making orderbook telah ditambahkan.",
  ja: "📚 クイズ更新のお知らせ\n\n📅 2026-07-08\n\n✅ 初級 (B040~B044) +5問\n✅ 中級 (M035~M039) +5問\n✅ 上級 (A016~A017) +2問\n\nEP27~29：英国FCA規制、PiDEX Utilガイド、オーダーブック・マーケットメイキングの内容を追加しました。",
  es: "📚 Actualización de Preguntas\n\n📅 2026-07-08\n\n✅ Principiante (B040~B044) +5 preguntas\n✅ Intermedio (M035~M039) +5 preguntas\n✅ Avanzado (A016~A017) +2 preguntas\n\nEP27~29: Se ha añadido contenido sobre regulación FCA del Reino Unido, guía de PiDEX Util y market-making con libro de órdenes.",
  fr: "📚 Mise à jour des quiz\n\n📅 2026-07-08\n\n✅ Débutant (B040~B044) +5 questions\n✅ Intermédiaire (M035~M039) +5 questions\n✅ Avancé (A016~A017) +2 questions\n\nEP27~29 : Nouveau contenu sur la réglementation FCA britannique, le guide PiDEX Util et le market-making sur carnet d'ordres.",
  vi: "📚 Cập nhật câu hỏi\n\n📅 2026-07-08\n\n✅ Cơ bản (B040~B044) +5 câu\n✅ Trung cấp (M035~M039) +5 câu\n✅ Nâng cao (A016~A017) +2 câu\n\nEP27~29: Đã thêm nội dung về quy định FCA Anh, hướng dẫn PiDEX Util và tạo lập thị trường sổ lệnh.",
  pt: "📚 Atualização do Quiz\n\n📅 2026-07-08\n\n✅ Iniciante (B040~B044) +5 questões\n✅ Intermediário (M035~M039) +5 questões\n✅ Avançado (A016~A017) +2 questões\n\nEP27~29: Novo conteúdo sobre regulação FCA do Reino Unido, guia do PiDEX Util e market-making com livro de ordens.",
  ms: "📚 Kemas Kini Kuiz\n\n📅 2026-07-08\n\n✅ Asas (B040~B044) +5 soalan\n✅ Pertengahan (M035~M039) +5 soalan\n✅ Lanjutan (A016~A017) +2 soalan\n\nEP27~29: Kandungan baharu tentang peraturan FCA UK, panduan PiDEX Util dan pembuatan pasaran buku pesanan telah ditambah.",
  tl: "📚 Update ng Quiz\n\n📅 2026-07-08\n\n✅ Simula (B040~B044) +5 tanong\n✅ Katamtaman (M035~M039) +5 tanong\n✅ Advanced (A016~A017) +2 tanong\n\nEP27~29: Idinagdag ang bagong nilalaman tungkol sa regulasyon ng UK FCA, gabay sa PiDEX Util, at orderbook market-making.",
  hi: "📚 क्विज़ अपडेट\n\n📅 2026-07-08\n\n✅ शुरुआती (B040~B044) +5 प्रश्न\n✅ मध्यवर्ती (M035~M039) +5 प्रश्न\n✅ उन्नत (A016~A017) +2 प्रश्न\n\nEP27~29: UK FCA विनियमन, PiDEX Util गाइड और ऑर्डरबुक मार्केट-मेकिंग पर नई सामग्री जोड़ी गई है।",
  ar: "📚 تحديث الاختبار\n\n📅 2026-07-08\n\n✅ مبتدئ (B040~B044) +5 أسئلة\n✅ متوسط (M035~M039) +5 أسئلة\n✅ متقدم (A016~A017) +2 سؤال\n\nEP27~29: تمت إضافة محتوى جديد حول تنظيم FCA البريطاني ودليل PiDEX Util وصناعة السوق بدفتر الأوامر.",
  ru: "📚 Обновление викторины\n\n📅 2026-07-08\n\n✅ Начальный (B040~B044) +5 вопросов\n✅ Средний (M035~M039) +5 вопросов\n✅ Продвинутый (A016~A017) +2 вопроса\n\nEP27~29: Добавлены новые вопросы о регулировании FCA Великобритании, руководстве PiDEX Util и маркет-мейкинге в стакане заявок.",
  bn: "📚 কুইজ আপডেট\n\n📅 2026-07-08\n\n✅ প্রাথমিক (B040~B044) +৫টি প্রশ্ন\n✅ মধ্যবর্তী (M035~M039) +৫টি প্রশ্ন\n✅ উন্নত (A016~A017) +২টি প্রশ্ন\n\nEP27~29: UK FCA বিধিমালা, PiDEX Util গাইড এবং অর্ডারবুক মার্কেট-মেকিং বিষয়ে নতুন কন্টেন্ট যোগ করা হয়েছে।",
  sw: "📚 Sasisho la Maswali\n\n📅 2026-07-08\n\n✅ Mwanzo (B040~B044) +maswali 5\n✅ Kati (M035~M039) +maswali 5\n✅ Juu (A016~A017) +maswali 2\n\nEP27~29: Maudhui mapya kuhusu kanuni za FCA za Uingereza, mwongozo wa PiDEX Util na uundaji wa soko la orderbook yameongezwa.",
  th: "📚 อัปเดตคำถาม\n\n📅 2026-07-08\n\n✅ ระดับต้น (B040~B044) +5 ข้อ\n✅ ระดับกลาง (M035~M039) +5 ข้อ\n✅ ระดับสูง (A016~A017) +2 ข้อ\n\nEP27~29: เพิ่มเนื้อหาใหม่เกี่ยวกับกฎระเบียบ FCA ของสหราชอาณาจักร คู่มือ PiDEX Util และการทำ Market-making ด้วย Orderbook",
  tr: "📚 Quiz Güncellemesi\n\n📅 2026-07-08\n\n✅ Başlangıç (B040~B044) +5 soru\n✅ Orta (M035~M039) +5 soru\n✅ İleri (A016~A017) +2 soru\n\nEP27~29: Birleşik Krallık FCA düzenlemesi, PiDEX Util rehberi ve emir defteri market-making hakkında yeni içerikler eklendi.",
};

// ── 공지 팝업 ────────────────────────────────────────
function showNoticeIfNeeded() {
  if (!NOTICE) return;
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const skipUntil   = parseInt(localStorage.getItem(SKIP_KEY) || '0', 10);
  const skipVersion = localStorage.getItem(VERSION_KEY) || '';
  if (skipVersion === NOTICE.version && Date.now() < skipUntil) return;
  const lang = getLang();
  const text = NOTICE[lang] || NOTICE['en'];
  const overlay = document.createElement('div');
  overlay.id = 'notice-overlay';
  overlay.className = 'notice-overlay';
  overlay.innerHTML = `
    <div class="notice-box">
      <div class="notice-body">${text.replace(/\n/g, '<br>')}</div>
      <label class="notice-skip-label">
        <input type="checkbox" id="notice-skip-check">
        <span>${t('notice_skip_week')}</span>
      </label>
      <button class="notice-close-btn" id="notice-close-btn">${t('notice_confirm')}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('notice-close-btn').addEventListener('click', () => {
    if (document.getElementById('notice-skip-check').checked) {
      localStorage.setItem(SKIP_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      localStorage.setItem(VERSION_KEY, NOTICE.version);
    }
    overlay.remove();
  });
}

// ── 현재 로그인한 Pi UID ──────────────────────────────
let currentUid = null;
export function getCurrentUid() { return currentUid; }

// ── 페이지 라우팅 ──────────────────────────────────────
let activePage = 'quiz';
const renderedPages = new Set();

const PAGE_RENDERERS = {
  quiz:   (el) => renderQuizPage(el),
  survey: (el) => renderSurveyPage(el),
  rank:   (el) => renderRankPage(el),
  stats:  (el) => renderStatsPage(el),
};

function switchPage(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`page-${pageKey}`).classList.remove('hidden');
  document.querySelector(`.nav-tab[data-page="${pageKey}"]`).classList.add('active');
  activePage = pageKey;
  if (!renderedPages.has(pageKey)) {
    renderedPages.add(pageKey);
    PAGE_RENDERERS[pageKey]?.(document.getElementById(`page-${pageKey}`));
  }
}

export function rerenderPage(pageKey) {
  renderedPages.delete(pageKey);
  switchPage(pageKey);
}

// ── 헤더 업데이트 ─────────────────────────────────────
let _headerUsername = 'Pioneer';
export function updateHeaderUsername(name) {
  if (name) _headerUsername = name;
  const el = document.getElementById('header-username');
  if (el) el.textContent = isSubscribed() ? `⭐ ${_headerUsername}` : _headerUsername;
}

export function updateHeaderScore() {
  const el = document.getElementById('header-score');
  if (el) el.textContent = `${getScore()}${t('quiz.score_unit')}`;
}

export function updateHeaderLives() {
  const el = document.getElementById('header-lives');
  if (!el) return;
  const n = getLives();
  if (n === null) {
    el.textContent = '🔱';
  } else {
    el.textContent = '❤️'.repeat(Math.max(0, n)) || '💀';
  }
}

function applyNavLabels() {
  const quizTab   = document.querySelector('.nav-tab[data-page="quiz"] .nav-label');
  const surveyTab = document.querySelector('.nav-tab[data-page="survey"] .nav-label');
  const rankTab   = document.querySelector('.nav-tab[data-page="rank"] .nav-label');
  const statsTab  = document.querySelector('.nav-tab[data-page="stats"] .nav-label');
  if (quizTab)   quizTab.textContent   = t('nav.quiz');
  if (surveyTab) surveyTab.textContent = t('nav.survey');
  if (rankTab)   rankTab.textContent   = t('nav.rank');
  if (statsTab)  statsTab.textContent  = t('nav.stats');
  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.textContent = `❓ ${t('btn.help')}`;
}

// ── 로그인 ────────────────────────────────────────────
async function doLogin() {
  const btn   = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.textContent = t('login.connecting');
  if (errEl) errEl.style.display = 'none';
  try {
    const auth = await authenticate();
    const user = auth.user;
    currentUid = user?.uid ?? user?.username ?? null;

    updateHeaderUsername(user?.username ?? 'Pioneer');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    // Firestore에서 설문 기록 불러와 로컬에 병합 (중복 방지)
    if (currentUid) {
      initFirebase();
      const cloudData = await loadSurveyFromFirestore(currentUid);
      if (cloudData) {
        mergeSurveyFromCloud(cloudData.answers, cloudData.completedIds);
      }
      // 리더보드 country 필드 없는 기존 항목 업서트
      const country = detectCountry();
      if (country && user?.username) {
        updateLeaderboardCountry(user.username, country).catch(console.warn);
      }
    }

    updateHeaderScore();
    updateHeaderLives();
    applyNavLabels();
    switchPage('quiz');
    showNoticeIfNeeded();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = t('login.btn');
    if (errEl) { errEl.textContent = t('login.fail'); errEl.style.display = 'block'; }
    console.error(e);
  }
}

// ── 언어 선택 ─────────────────────────────────────────
function buildLangPicker() {
  const btn      = document.getElementById('btn-lang');
  const dropdown = document.getElementById('lang-dropdown');
  if (!btn || !dropdown) return;

  function updateBtn() {
    const cur = SUPPORTED_LANGS.find(l => l.code === getLang()) ?? SUPPORTED_LANGS[0];
    btn.innerHTML = `<span>${cur.flag}</span><span>${cur.label}</span><span class="lang-arrow">▾</span>`;
  }
  updateBtn();

  dropdown.innerHTML = SUPPORTED_LANGS.map(l => `
    <button class="lang-option ${l.code === getLang() ? 'active' : ''}" data-lang="${l.code}">
      ${l.flag} ${l.label}
    </button>
  `).join('');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));

  dropdown.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setLang(opt.dataset.lang);
      dropdown.classList.remove('open');
      dropdown.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      updateBtn();
      applyNavLabels();
      rerenderPage(activePage);
    });
  });
}

// ── 유틸모음 오버레이 ────────────────────────────────────
function renderUtilsOverlay() {
  const panel = document.getElementById('utils-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="utils-header">
      <span class="utils-title">🚀 Pi Hub</span>
      <button class="utils-close-btn" id="utils-close-btn">${t('btn.close')} ✕</button>
    </div>
    <div class="utils-body">

    <a class="util-card" href="#" onclick="window.open('https://apppidexutillaac6961.pinet.com/', '_hub_'+Date.now());return false;">
      <div class="util-card-icon">
        <img src="icons/pidex-util.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="PiDEX Util">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">PiDEX Util</div>
        <div class="util-card-tags">
          <span class="util-tag">Arbitrage Finder</span>
          <span class="util-tag">LP Calculator</span>
          <span class="util-tag">Swap Simulator</span>
        </div>
        <div class="util-card-desc">${t('hub.pidex.desc')}</div>
        <div class="util-card-link">${t('hub.open')}</div>
      </div>
    </a>

    <a class="util-card" href="#" onclick="window.open('https://mmstrategylabqge3450.pinet.com/', '_hub_'+Date.now());return false;">
      <div class="util-card-icon">
        <img src="icons/mmlab.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="MM Strategy Lab">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">MM Strategy Lab</div>
        <div class="util-card-tags">
          <span class="util-tag">Orderbook MM</span>
          <span class="util-tag">AMM</span>
          <span class="util-tag">Auto Optimize</span>
        </div>
        <div class="util-card-desc">${t('hub.mmlab.desc')}</div>
        <div class="util-card-link">${t('hub.open')}</div>
      </div>
    </a>

    <a class="util-card" href="#" onclick="return false;" style="opacity:0.6;cursor:default;">
      <div class="util-card-icon">
        <img src="icons/hack-tracker.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="Pi Hack Tracker">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">Pi Hack Tracker</div>
        <div class="util-card-tags">
          <span class="util-tag">Hack Report</span>
          <span class="util-tag">Wallet Trace</span>
          <span class="util-tag">Community</span>
        </div>
        <div class="util-card-desc">${t('hub.hack.desc')}</div>
        <div class="util-card-link" style="color:#888;">${t('hub.coming_soon')}</div>
      </div>
    </a>

    <a class="util-card" href="#" onclick="return false;" style="opacity:0.6;cursor:default;">
      <div class="util-card-icon">
        <img src="icons/survival.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="Pi Survival Game">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">Pi Survival Game</div>
        <div class="util-card-tags">
          <span class="util-tag">Survival</span>
          <span class="util-tag">Text RPG</span>
          <span class="util-tag">11 Maps</span>
        </div>
        <div class="util-card-desc">${t('hub.survival.desc')}</div>
        <div class="util-card-link" style="color:#888;">${t('hub.coming_soon')}</div>
      </div>
    </a>
    </div>
  `;

  panel.querySelector('#utils-close-btn').addEventListener('click', () => {
    document.getElementById('utils-overlay').classList.add('hidden');
  });
}

// ── 초기화 ────────────────────────────────────────────
function initLoginScreen() {
  const titleEl = document.getElementById('login-title');
  const subEl   = document.getElementById('login-sub');
  const btn     = document.getElementById('btn-login');
  const note    = document.getElementById('login-note');
  if (titleEl) titleEl.textContent = t('app.title');
  if (subEl)   subEl.textContent   = t('login.sub');
  if (btn)     btn.textContent     = t('login.btn');
  if (note)    note.textContent    = t('login.note');
}

async function init() {
  initLang();
  initLoginScreen();
  await initPiSDK();

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => rerenderPage(btn.dataset.page));
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);

  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.addEventListener('click', () => renderHelpModal());

  const utilsOverlayBtn = document.getElementById('btn-intro-overlay');
  if (utilsOverlayBtn) utilsOverlayBtn.addEventListener('click', () => {
    const overlay = document.getElementById('utils-overlay');
    overlay.classList.toggle('hidden');
    if (!overlay.classList.contains('hidden')) renderUtilsOverlay();
  });

  document.getElementById('utils-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('utils-overlay')) {
      document.getElementById('utils-overlay').classList.add('hidden');
    }
  });

  buildLangPicker();

  // 구독 동기화 완료 시 헤더 업데이트
  window.addEventListener('sub:synced', () => updateHeaderUsername());
}

init();
