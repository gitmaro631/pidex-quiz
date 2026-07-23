import { getScore, getRank, getNextRank, getStats, getHighScore, getLives, getMode, MODES, addLives, getLastLeaderboardViewTime, setLastLeaderboardViewTime, syncHighScore, syncStats } from './util-storage.js';
import { shareResult } from './util-share.js';
import { fetchLeaderboard, fetchMyLeaderboardEntry, initFirebase, migrateLeaderboard } from './firebase.js';
import { countryToFlag } from './util-i18n.js';
import { t } from './util-i18n.js';
import { updateHeaderLives } from './app.js';
import { setupPullToRefresh } from './util-ptr.js';

const VIEW_COOLDOWN_MS = 60 * 60 * 1000;

function esc(str) { return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export async function renderRankPage(container) {
  setupPullToRefresh(container, () => renderRankPage(container));
  const mode      = getMode();
  const username  = document.getElementById('header-username')?.textContent ?? 'Pioneer';

  // 기기 변경/캐시 초기화로 로컬 통계가 서버 기록보다 낮으면 서버 값으로 동기화
  // 로컬에 선택된 모드 기록이 없는 기기(캐시 초기화 등)에서는 3개 모드 리더보드를 모두 확인
  const modesToCheck = mode ? [mode] : Object.keys(MODES);
  for (const m of modesToCheck) {
    try {
      const entry = await fetchMyLeaderboardEntry(username, m);
      if (entry) {
        syncHighScore(entry.score ?? 0);
        if (entry.seen != null && entry.correct != null) syncStats(entry.correct, entry.seen);
      }
    } catch {}
  }

  const score     = getScore();
  const highScore = getHighScore();
  const rank      = getRank(score);
  const next      = getNextRank(score);
  const lives     = getLives();
  const { correct, seen } = getStats();
  const pct       = seen > 0 ? Math.round(correct / seen * 100) : 0;

  // Miner 전용: 랭킹보드 조회 1시간마다 생명 +1
  if (mode === 'miner') {
    const now      = Date.now();
    const lastView = getLastLeaderboardViewTime();
    if (now - lastView >= VIEW_COOLDOWN_MS) {
      addLives(1);
      setLastLeaderboardViewTime();
      updateHeaderLives();
    }
  }

  const livesDisplay = lives === null
    ? ''
    : `<div class="rank-card-lives">${'❤️'.repeat(Math.max(0, lives)) || '💀'}</div>`;

  const modeCfg = mode ? MODES[mode] : null;
  const modeBadge = modeCfg ? `<div class="mode-badge">${modeCfg.icon} ${modeCfg.label}</div>` : '';

  const unit = t('quiz.score_unit');
  const statsText = t('rank.stats')
    .replace('{seen}', seen)
    .replace('{pct}', pct)
    .replace('{high}', highScore)
    .replace('{unit}', unit);

  const nextHintHTML = next
    ? `<div class="rank-next-hint">${
        t('rank.next')
          .replace('{label}', `<b>${t(next.key)}</b>`)
          .replace('{n}', `<b>${next.min - score}${unit}</b>`)
      }</div>`
    : `<div class="rank-next-hint">${t('rank.max')}</div>`;

  container.innerHTML = `
    <div class="rank-page">

      <!-- 랭킹보드 -->
      <div class="leaderboard-section">
        <h3 class="leaderboard-title">${t('rank.leaderboard')}</h3>

        <!-- 상단: 퀴즈 / 모험 -->
        <div class="lb-type-tabs">
          <button class="lb-type-tab active" data-type="quiz">🧩 퀴즈</button>
          <button class="lb-type-tab" data-type="rpg">⚔️ 모험</button>
        </div>

        <!-- 퀴즈 섹션 -->
        <div id="lb-quiz-section">

          <div class="rank-card">
            <div class="rank-card-title">${t('app.title')}</div>
            ${modeBadge}
            <div class="rank-card-rank">${t(rank.key)}</div>
            <div class="rank-card-score">${score}${unit}</div>
            ${livesDisplay}
            <div class="rank-card-stats">${statsText}</div>
            <div class="rank-card-user">Pioneer: ${esc(username)}</div>
          </div>

          <div class="rank-progress">
            ${getRankProgressHTML(score)}
          </div>

          ${nextHintHTML}

          <button class="btn-share" id="btn-share">${t('btn.share')}</button>
          <p class="share-hint">${t('rank.shareHint')}</p>

          <div class="lb-mode-tabs">
            <button class="lb-tab active" data-mode="miner">⛏️ Miner</button>
            <button class="lb-tab" data-mode="pioneer">🚀 Pioneer</button>
            <button class="lb-tab" data-mode="validator">🔱 Validator</button>
          </div>
          <div id="leaderboard-list" class="leaderboard-loading">${t('lb.loading')}</div>
        </div>

        <!-- 모험(골드) 섹션 -->
        <div id="lb-rpg-section" class="hidden">
          <div id="rpg-leaderboard-list" class="leaderboard-loading">${t('lb.loading')}</div>
        </div>
      </div>

    </div>
  `;

  container.querySelector('#btn-share').addEventListener('click', async () => {
    const result = await shareResult(username);
    const msg = result === 'shared' ? t('rank.shared') : t('rank.copied');
    showToast(container, msg);
  });

  // 일회성 DB 마이그레이션 (중복 제거 + username doc ID 통일)
  initFirebase();
  if (!localStorage.getItem('lb_migrated_v3')) {
    migrateLeaderboard()
      .then(() => localStorage.setItem('lb_migrated_v3', '1'))
      .catch(console.warn);
  }
  const listEl = container.querySelector('#leaderboard-list');

  async function loadLeaderboard(lbMode) {
    listEl.innerHTML = `<div class="leaderboard-loading">${t('lb.loading')}</div>`;
    try {
      const rows = await fetchLeaderboard(lbMode, 100);
      if (rows.length === 0) {
        listEl.innerHTML = `<div class="leaderboard-empty">${t('lb.empty')}</div>`;
      } else {
        listEl.innerHTML = rows.map((r, i) => {
          const flag = r.country ? countryToFlag(r.country) : '';
          return `
          <div class="leaderboard-row ${r.username === username ? 'leaderboard-me' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-user">${flag ? `${flag} ` : ''}${esc(r.username)}</span>
            <span class="lb-score">${r.score}${unit}</span>
          </div>
        `}).join('');
      }
    } catch {
      listEl.innerHTML = `<div class="leaderboard-empty">${t('lb.fail')}</div>`;
    }
  }

  container.querySelectorAll('.lb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadLeaderboard(tab.dataset.mode);
    });
  });

  // 모험(RPG) 골드 랭킹 - 서버가 rpg_characters를 집계해서 반환(공개 데이터, 인증 불필요)
  let rpgLoaded = false;
  async function loadRpgLeaderboard() {
    const listEl = container.querySelector('#rpg-leaderboard-list');
    listEl.innerHTML = `<div class="leaderboard-loading">${t('lb.loading')}</div>`;
    try {
      const res = await fetch('/api/rpg/gold-leaderboard');
      const data = await res.json();
      const rows = data.leaderboard || [];
      if (!rows.length) {
        listEl.innerHTML = `<div class="leaderboard-empty">${t('lb.empty')}</div>`;
      } else {
        listEl.innerHTML = rows.map((r, i) => `
          <div class="leaderboard-row ${r.username === username ? 'leaderboard-me' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-user">${esc(r.username)}</span>
            <span class="lb-score">Lv.${r.level}${r.slot ? ` (슬롯${r.slot})` : ''} · ${r.gold}골드</span>
          </div>`).join('');
      }
      rpgLoaded = true;
    } catch {
      listEl.innerHTML = `<div class="leaderboard-empty">${t('lb.fail')}</div>`;
    }
  }

  // 퀴즈/모험 상단 탭
  container.querySelectorAll('.lb-type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.lb-type-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isQuiz = tab.dataset.type === 'quiz';
      container.querySelector('#lb-quiz-section').classList.toggle('hidden', !isQuiz);
      container.querySelector('#lb-rpg-section').classList.toggle('hidden', isQuiz);
      if (!isQuiz && !rpgLoaded) loadRpgLeaderboard();
    });
  });

  // 초기 로드: 현재 모드 탭 선택
  const initialMode = mode ?? 'miner';
  const activeTab = container.querySelector(`.lb-tab[data-mode="${initialMode}"]`);
  if (activeTab) {
    container.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
  }
  loadLeaderboard(initialMode);
}

function getRankProgressHTML(score) {
  const rank = getRank(score);
  const next = getNextRank(score);
  const pct  = next
    ? Math.min(100, Math.round((score - rank.min) / (next.min - rank.min) * 100))
    : 100;

  return `
    <div class="rank-step current">
      <div class="rank-step-label">${t(rank.key)}</div>
      ${next ? `
        <div class="rank-bar-wrap">
          <div class="rank-bar" style="width:${pct}%"></div>
        </div>
        <div class="rank-bar-pct">${pct}%</div>
      ` : ''}
    </div>
  `;
}

function showToast(container, msg) {
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
