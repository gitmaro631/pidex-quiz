import { getScore, getRank, getNextRank, getStats, getHighScore, getLives } from './util-storage.js';
import { shareResult } from './util-share.js';
import { fetchLeaderboard } from './firebase.js';

export async function renderRankPage(container) {
  const score     = getScore();
  const highScore = getHighScore();
  const rank      = getRank(score);
  const next      = getNextRank(score);
  const lives     = getLives();
  const { correct, seen } = getStats();
  const pct       = seen > 0 ? Math.round(correct / seen * 100) : 0;

  const username = document.getElementById('header-username')?.textContent ?? 'Pioneer';

  container.innerHTML = `
    <div class="rank-page">

      <div class="rank-card">
        <div class="rank-card-title">PiDEX 퀴즈</div>
        <div class="rank-card-rank">${rank.label}</div>
        <div class="rank-card-score">${score}점</div>
        <div class="rank-card-lives">${'❤️'.repeat(Math.max(0,lives)) || '💀'}</div>
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

      <button class="btn-share" id="btn-share">
        📤 결과 공유하기
      </button>
      <p class="share-hint">텔레그램 · X · 카카오 등에 공유하세요</p>

      <div class="leaderboard-section">
        <h3 class="leaderboard-title">🏆 전체 리더보드 TOP 20</h3>
        <div id="leaderboard-list" class="leaderboard-loading">불러오는 중...</div>
      </div>

    </div>
  `;

  container.querySelector('#btn-share').addEventListener('click', async () => {
    const result = await shareResult(username);
    const msg = result === 'shared' ? '공유 완료!' : '클립보드에 복사됐어요!';
    showToast(container, msg);
  });

  // 리더보드 비동기 로드
  const listEl = container.querySelector('#leaderboard-list');
  try {
    const rows = await fetchLeaderboard(20);
    if (rows.length === 0) {
      listEl.innerHTML = `<div class="leaderboard-empty">아직 기록이 없어요. 첫 번째 도전자가 되세요!</div>`;
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
    listEl.innerHTML = `<div class="leaderboard-empty">리더보드 로드 실패</div>`;
  }
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
    const next   = ranks[i + 1];
    const active = score >= r.min;
    const current = active && (!next || score < next.min);
    const pct  = next
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
  const t = document.createElement('div');
  t.className = 'toast-msg';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
