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

// ── 공지 팝업 ────────────────────────────────────────
async function showNoticeIfNeeded() {
  let NOTICE;
  try {
    const mod = await import('./notice.js');
    NOTICE = mod.NOTICE;
  } catch(e) { return; }
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
