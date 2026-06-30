import { getScore, getRank, getNextRank, getStats, getHighScore, getLives, getMode, MODES, addLives, getLastLeaderboardViewTime, setLastLeaderboardViewTime } from './util-storage.js';
import { shareResult } from './util-share.js';
import { fetchLeaderboard, initFirebase } from './firebase.js';
import { t } from './util-i18n.js';
import { updateHeaderLives } from './app.js';

const VIEW_COOLDOWN_MS = 60 * 60 * 1000;

export async function renderRankPage(container) {
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

  container.innerHTML = `
    <div class="rank-page">

      <div class="rank-card">
        <div class="rank-card-title">PiDEX 퀴즈</div>
        ${modeBadge}
        <div class="rank-card-rank">${rank.label}</div>
        <div class="rank-card-score">${score}점</div>
        ${livesDisplay}
        <div class="rank-card-stats">
          총 ${seen}문제 · 정답률 ${pct}% · 최고 ${highScore}점
        </div>
        <div class="rank-card-user">Pioneer: ${username}</div>
      </div>

      <div class="rank-progress">
        ${getRankProgressHTML(score)}
      </div>

      ${next ? `
        <div class="rank-next-hint">
          <b>${next.label}</b> 등급까지 <b>${next.min - score}점</b> 남았어요
        </div>
      ` : '<div class="rank-next-hint">🎉 최고 등급 달성!</div>'}

      <button class="btn-share" id="btn-share">${t('btn.share')}</button>
      <p class="share-hint">텔레그램 · X · 카카오 등에 공유하세요</p>

      <!-- 리더보드 모드 탭 -->
      <div class="leaderboard-section">
        <h3 class="leaderboard-title">🏆 리더보드</h3>
        <div class="lb-mode-tabs">
          <button class="lb-tab active" data-mode="miner">⛏️ Miner</button>
          <button class="lb-tab" data-mode="pioneer">🚀 Pioneer</button>
          <button class="lb-tab" data-mode="validator">🔱 Validator</button>
        </div>
        <div id="leaderboard-list" class="leaderboard-loading">불러오는 중...</div>
      </div>

    </div>
  `;

  container.querySelector('#btn-share').addEventListener('click', async () => {
    const result = await shareResult(username);
    const msg = result === 'shared' ? '공유 완료!' : '클립보드에 복사됐어요!';
    showToast(container, msg);
  });

  // 리더보드 탭 전환
  initFirebase();
  const listEl = container.querySelector('#leaderboard-list');

  async function loadLeaderboard(lbMode) {
    listEl.innerHTML = '<div class="leaderboard-loading">불러오는 중...</div>';
    try {
      const rows = await fetchLeaderboard(lbMode, 100);
      if (rows.length === 0) {
        listEl.innerHTML = `<div class="leaderboard-empty">아직 등록된 기록이 없어요</div>`;
      } else {
        listEl.innerHTML = rows.map((r, i) => `
          <div class="leaderboard-row ${r.username === username ? 'leaderboard-me' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-user">${r.username}</span>
            <span class="lb-score">${r.score}점</span>
          </div>
        `).join('');
      }
    } catch {
      listEl.innerHTML = `<div class="leaderboard-empty">불러오기 실패</div>`;
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
  const ranks = [
    { min: 0,    label: '🌱 탐색자' },
    { min: 201,  label: '📊 분석가' },
    { min: 501,  label: '⚡ 트레이더' },
    { min: 1001, label: '🏦 마켓메이커' },
    { min: 2001, label: '🔱 전략가' },
  ];

  return ranks.map((r, i) => {
    const next    = ranks[i + 1];
    const active  = score >= r.min;
    const current = active && (!next || score < next.min);
    const pct     = next
      ? Math.min(100, Math.round((score - r.min) / (next.min - r.min) * 100))
      : 100;

    return `
      <div class="rank-step ${active ? 'active' : ''} ${current ? 'current' : ''}">
        <div class="rank-step-label">${r.label}</div>
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
