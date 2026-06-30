import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderQuizPage }  from './page-quiz.js';
import { renderRankPage }  from './page-rank.js';
import { renderStatsPage } from './page-stats.js';
import { getScore, getLives } from './util-storage.js';

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
    switchPage('quiz');
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = '퀴즈 시작하기<br><span class="login-btn-en">Start Quiz</span>';
    if (errEl) { errEl.textContent = '연결 실패. 다시 시도해주세요. / Connection failed.'; errEl.style.display = 'block'; }
    console.error(e);
  }
}

// ── 초기화 ────────────────────────────────────────────
function init() {
  initPiSDK();

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);
}

init();
