import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderQuizPage }  from './page-quiz.js';
import { renderRankPage }  from './page-rank.js';
import { renderStatsPage } from './page-stats.js';
import { getScore, getLives } from './util-storage.js';
import { initLang, t, getLang, setLang, SUPPORTED_LANGS } from './util-i18n.js';
import { renderIntroPage } from './page-intro.js';
import { renderHelpModal } from './page-help.js';

// ── 페이지 라우팅 ──────────────────────────────────────
let activePage = 'quiz';
const renderedPages = new Set();

const PAGE_RENDERERS = {
  quiz:  (el) => renderQuizPage(el),
  rank:  (el) => renderRankPage(el),
  stats: (el) => renderStatsPage(el),
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
export function updateHeaderScore() {
  const el = document.getElementById('header-score');
  if (el) el.textContent = `${getScore()}점`;
}

export function updateHeaderLives() {
  const el = document.getElementById('header-lives');
  if (!el) return;
  const n = getLives();
  el.textContent = '❤️'.repeat(Math.max(0, n)) || '💀';
}

function applyNavLabels() {
  const quizTab = document.querySelector('.nav-tab[data-page="quiz"] .nav-label');
  const rankTab = document.querySelector('.nav-tab[data-page="rank"] .nav-label');
  const statsTab = document.querySelector('.nav-tab[data-page="stats"] .nav-label');
  if (quizTab)  quizTab.textContent  = t('nav.quiz');
  if (rankTab)  rankTab.textContent  = t('nav.rank');
  if (statsTab) statsTab.textContent = t('nav.stats');
}

// ── 로그인 ────────────────────────────────────────────
async function doLogin() {
  const btn   = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.innerHTML = '연결 중... / Connecting...';
  if (errEl) errEl.style.display = 'none';
  try {
    const auth = await authenticate();
    document.getElementById('header-username').textContent = auth.user?.username ?? 'Pioneer';
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    updateHeaderScore();
    updateHeaderLives();
    applyNavLabels();
    switchPage('quiz');
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = t('login.btn') + '<br><span class="login-btn-en">Start Quiz</span>';
    if (errEl) { errEl.textContent = t('login.fail'); errEl.style.display = 'block'; }
    console.error(e);
  }
}

// ── 인트로 페이지 ─────────────────────────────────────
function showLoginScreen() {
  const loginBtn = document.getElementById('btn-login');
  if (loginBtn) {
    loginBtn.innerHTML = t('login.btn') + '<br><span class="login-btn-en">Start Quiz</span>';
  }
  const loginNote = document.getElementById('login-note');
  if (loginNote) loginNote.textContent = t('login.note') + ' · Pi Browser only';

  document.getElementById('intro-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function showIntro() {
  const introContainer = document.getElementById('intro-screen');
  introContainer.classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');

  renderIntroPage(introContainer, () => {
    localStorage.setItem('quiz_intro_seen', '1');
    showLoginScreen();
  });
}

// ── 언어 선택 드롭다운 (헤더 버튼) ───────────────────
function buildLangPicker() {
  const btn = document.getElementById('btn-lang');
  if (!btn) return;

  const dropdown = document.getElementById('lang-dropdown');
  if (!dropdown) return;

  // 드롭다운 항목 채우기
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
      // 현재 활성 상태 갱신
      dropdown.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      applyNavLabels();
      // 열려 있는 인트로 화면은 재렌더
      if (!document.getElementById('intro-screen').classList.contains('hidden')) {
        showIntro();
      }
    });
  });
}

// ── 초기화 ────────────────────────────────────────────
function init() {
  initLang();
  initPiSDK();

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);

  // 도움말 버튼
  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => renderHelpModal());
  }

  // 언어 선택
  buildLangPicker();

  // 인트로 표시 여부
  const introSeen = localStorage.getItem('quiz_intro_seen');
  if (!introSeen) {
    showIntro();
  }
}

init();
