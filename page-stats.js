import { initFirebase, fetchSurveyStats } from './firebase.js';
import { addLives, getLastStatsViewTime, setLastStatsViewTime } from './util-storage.js';
import { updateHeaderLives } from './app.js';

const STATS_LIFE_COOLDOWN_MS = 60 * 60 * 1000; // 1시간

export async function renderStatsPage(container) {
  container.innerHTML = `<div class="stats-loading">통계 불러오는 중...</div>`;

  // 1시간마다 생명 +1 지급
  const now      = Date.now();
  const lastView = getLastStatsViewTime();
  if (now - lastView >= STATS_LIFE_COOLDOWN_MS) {
    addLives(1);
    setLastStatsViewTime();
    updateHeaderLives();
  }

  initFirebase();
  const stats = await fetchSurveyStats();

  if (!stats || stats.total === 0) {
    container.innerHTML = `
      <div class="stats-empty">
        <p>아직 충분한 응답 데이터가 없어요.</p>
        <p>퀴즈를 풀고 설문에 참여해주세요! 📋</p>
      </div>
    `;
    return;
  }

  const pct = (n) => `${Math.round(n / stats.total * 100)}%`;

  container.innerHTML = `
    <div class="stats-page">
      <h2 class="stats-title">📊 파이오니어 커뮤니티 통계</h2>
      <p class="stats-total">총 응답자 <b>${stats.total.toLocaleString()}</b>명</p>

      <!-- KYC -->
      <div class="stats-section">
        <h3>KYC 현황</h3>
        ${barRow('통과 완료',   stats.kyc.passed,     stats.total)}
        ${barRow('대기 중',     stats.kyc.pending,    stats.total)}
        ${barRow('실패',        stats.kyc.failed,     stats.total)}
        ${barRow('미시도',      stats.kyc.notTried,   stats.total)}
      </div>

      <!-- 노드 -->
      <div class="stats-section">
        <h3>노드 운영 현황</h3>
        ${barRow('현재 운영 중',   stats.node.running,    stats.total)}
        ${barRow('돌리다 중단',    stats.node.stopped,    stats.total)}
        ${barRow('운영 계획',      stats.node.planning,   stats.total)}
        ${barRow('관심 없음',      stats.node.noInterest, stats.total)}
      </div>

      <!-- 거래 경험 -->
      <div class="stats-section">
        <h3>파이 거래 경험</h3>
        ${barRow('P2P 직거래',   stats.tradeExp.p2p,      stats.total)}
        ${barRow('물물교환',      stats.tradeExp.barter,   stats.total)}
        ${barRow('거래소 매매',   stats.tradeExp.exchange, stats.total)}
        ${barRow('DEX 사용',     stats.tradeExp.dex,      stats.total)}
        ${barRow('경험 없음',     stats.tradeExp.none,     stats.total)}
      </div>

      <!-- 국가 TOP 5 -->
      <div class="stats-section">
        <h3>국가별 분포 TOP 5</h3>
        ${countryTopHTML(stats.countries, stats.total)}
      </div>

      <p class="stats-note">* 설문 참여자 기준 집계. 실시간 업데이트.</p>
    </div>
  `;
}

function barRow(label, count, total) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return `
    <div class="stat-row">
      <div class="stat-label">${label}</div>
      <div class="stat-bar-wrap">
        <div class="stat-bar" style="width:${pct}%"></div>
      </div>
      <div class="stat-pct">${pct}% <span class="stat-count">(${count})</span></div>
    </div>
  `;
}

function countryTopHTML(countries, total) {
  const sorted = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const flags = { KR:'🇰🇷', US:'🇺🇸', ID:'🇮🇩', IN:'🇮🇳', PH:'🇵🇭', CN:'🇨🇳', VN:'🇻🇳', OTHER:'🌐' };

  return sorted.map(([code, count]) =>
    barRow(`${flags[code] ?? '🌐'} ${code}`, count, total)
  ).join('');
}
