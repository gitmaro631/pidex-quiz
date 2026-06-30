import { getScore, getRank, getNextRank, getStats } from './util-storage.js';
import { shareResult } from './util-share.js';

export function renderRankPage(container) {
  const score  = getScore();
  const rank   = getRank(score);
  const next   = getNextRank(score);
  const { correct, seen } = getStats();
  const pct    = seen > 0 ? Math.round(correct / seen * 100) : 0;

  const username = document.getElementById('header-username')?.textContent ?? 'Pioneer';

  container.innerHTML = `
    <div class="rank-page">

      <div class="rank-card">
        <div class="rank-card-title">PiDEX 퀴즈</div>
        <div class="rank-card-rank">${rank.label}</div>
        <div class="rank-card-score">${score}점</div>
        <div class="rank-card-stats">
          총 ${seen}문제 · 정답률 ${pct}%
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

    </div>
  `;

  container.querySelector('#btn-share').addEventListener('click', async () => {
    const result = await shareResult(username);
    const msg = result === 'shared' ? '공유 완료!' : '클립보드에 복사됐어요!';
    showToast(container, msg);
  });
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
