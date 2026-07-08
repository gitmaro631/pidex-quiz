import { getScore, getRank, getNextRank, getStats, getHighScore, getLives, getMode, MODES, RANKS, addLives, getLastLeaderboardViewTime, setLastLeaderboardViewTime } from './util-storage.js';
import { shareResult } from './util-share.js';
import { fetchLeaderboard, initFirebase, migrateLeaderboard } from './firebase.js';
import { countryToFlag } from './util-i18n.js';
import { t } from './util-i18n.js';
import { updateHeaderLives } from './app.js';
import { setupPullToRefresh } from './util-ptr.js';

const VIEW_COOLDOWN_MS = 60 * 60 * 1000;

export async function renderRankPage(container) {
  setupPullToRefresh(container, () => renderRankPage(container));
  const score     = getScore();
  const highScore = getHighScore();
  const rank      = getRank(score);
  const next      = getNextRank(score);
  const lives     = getLives();
  const mode      = getMode();
  const { correct, seen } = getStats();
  const pct       = seen > 0 ? Math.round(correct / seen * 100) : 0;
  const username  = document.getElementById('header-username')?.textContent ?? 'Pioneer';

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

      <div class="rank-card">
        <div class="rank-card-title">${t('app.title')}</div>
        ${modeBadge}
        <div class="rank-card-rank">${t(rank.key)}</div>
        <div class="rank-card-score">${score}${unit}</div>
        ${livesDisplay}
        <div class="rank-card-stats">${statsText}</div>
        <div class="rank-card-user">Pioneer: ${username}</div>
      </div>

      <div class="rank-progress">
        ${getRankProgressHTML(score)}
      </div>

      ${nextHintHTML}

      <button class="btn-share" id="btn-share">${t('btn.share')}</button>
      <p class="share-hint">${t('rank.shareHint')}</p>

      <!-- 리더보드 모드 탭 -->
      <div class="leaderboard-section">
        <h3 class="leaderboard-title">${t('rank.leaderboard')}</h3>
        <div class="lb-mode-tabs">
          <button class="lb-tab active" data-mode="miner">⛏️ Miner</button>
          <button class="lb-tab" data-mode="pioneer">🚀 Pioneer</button>
          <button class="lb-tab" data-mode="validator">🔱 Validator</button>
        </div>
        <div id="leaderboard-list" class="leaderboard-loading">${t('lb.loading')}</div>
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
            <span class="lb-user">${flag ? `${flag} ` : ''}${r.username}</span>
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
  return RANKS.map((r, i) => {
    const next    = RANKS[i + 1];
    const active  = score >= r.min;
    const current = active && (!next || score < next.min);
    const pct     = next
      ? Math.min(100, Math.round((score - r.min) / (next.min - r.min) * 100))
      : 100;

    return `
      <div class="rank-step ${active ? 'active' : ''} ${current ? 'current' : ''}">
        <div class="rank-step-label">${t(r.key)}</div>
        ${current && next ? `
          <div class="rank-bar-wrap">
            <div class="rank-bar" style="width:${pct}%"></div>
          </div>
          <div class="rank-bar-pct">${pct}%</div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function showToast(container, msg) {
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
