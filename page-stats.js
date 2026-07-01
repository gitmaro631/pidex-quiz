import { initFirebase, fetchSurveyStats } from './firebase.js';
import { addLives, getLastStatsViewTime, setLastStatsViewTime, getMode } from './util-storage.js';
import { updateHeaderLives } from './app.js';

const STATS_LIFE_COOLDOWN_MS = 60 * 60 * 1000;

export async function renderStatsPage(container) {
  container.innerHTML = `<div class="stats-loading">통계 불러오는 중...</div>`;

  // Miner 전용: 통계 조회 1시간마다 생명 +1
  const mode = getMode();
  if (mode === 'miner') {
    const now      = Date.now();
    const lastView = getLastStatsViewTime();
    if (now - lastView >= STATS_LIFE_COOLDOWN_MS) {
      addLives(1);
      setLastStatsViewTime();
      updateHeaderLives();
    }
  }

  initFirebase();
  const stats = await fetchSurveyStats();

  if (!stats || stats.total === 0) {
    container.innerHTML = `
      <div class="stats-empty">
        <p>아직 응답 데이터가 없어요.</p>
        <p>설문에 참여해주세요! 📋</p>
      </div>
    `;
    return;
  }

  const kycTotal      = stats.kyc._total;
  const nodeTotal     = stats.node._total;
  const tradeTotal    = stats.tradeExp._total;
  const countryTotal  = stats.countriesTotal;

  container.innerHTML = `
    <div class="stats-page">
      <h2 class="stats-title">📊 파이오니어 커뮤니티 통계</h2>
      <p class="stats-total">총 참여자 <b>${stats.total.toLocaleString()}</b>명</p>

      ${kycTotal > 0 ? `
      <div class="stats-section">
        <h3>KYC 현황 <span class="stats-section-n">(${kycTotal}명 응답)</span></h3>
        ${barRow('통과 완료',   stats.kyc.passed,   kycTotal)}
        ${barRow('대기 중',     stats.kyc.pending,  kycTotal)}
        ${barRow('실패',        stats.kyc.failed,   kycTotal)}
        ${barRow('미시도',      stats.kyc.notTried, kycTotal)}
      </div>` : ''}

      ${nodeTotal > 0 ? `
      <div class="stats-section">
        <h3>노드 운영 현황 <span class="stats-section-n">(${nodeTotal}명 응답)</span></h3>
        ${barRow('현재 운영 중',   stats.node.running,    nodeTotal)}
        ${barRow('돌리다 중단',    stats.node.stopped,    nodeTotal)}
        ${barRow('운영 계획',      stats.node.planning,   nodeTotal)}
        ${barRow('관심 없음',      stats.node.noInterest, nodeTotal)}
      </div>` : ''}

      ${tradeTotal > 0 ? `
      <div class="stats-section">
        <h3>파이 거래 경험 <span class="stats-section-n">(${tradeTotal}명 응답)</span></h3>
        ${barRow('P2P 직거래',   stats.tradeExp.p2p,      tradeTotal)}
        ${barRow('물물교환',      stats.tradeExp.barter,   tradeTotal)}
        ${barRow('거래소 매매',   stats.tradeExp.exchange, tradeTotal)}
        ${barRow('파이 앱 결제',  stats.tradeExp.dexApp,   tradeTotal)}
        ${barRow('경험 없음',     stats.tradeExp.none,     tradeTotal)}
      </div>` : ''}

      ${countryTotal > 0 ? `
      <div class="stats-section">
        <h3>국가별 분포 TOP 5 <span class="stats-section-n">(${countryTotal}명 응답)</span></h3>
        ${countryTopHTML(stats.countries, countryTotal)}
      </div>` : ''}

      <p class="stats-note">* 항목별 응답자 기준 집계. 실시간 업데이트.</p>
    </div>
  `;
}

function barRow(label, count, total) {
  const pct = total > 0 ? Math.round((count ?? 0) / total * 100) : 0;
  return `
    <div class="stat-row">
      <div class="stat-label">${label}</div>
      <div class="stat-bar-wrap">
        <div class="stat-bar" style="width:${pct}%"></div>
      </div>
      <div class="stat-pct">${pct}% <span class="stat-count">(${count ?? 0})</span></div>
    </div>
  `;
}

function countryTopHTML(countries, total) {
  const sorted = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const flags = { KR:'🇰🇷', US:'🇺🇸', ID:'🇮🇩', IN:'🇮🇳', PH:'🇵🇭', CN:'🇨🇳', VN:'🇻🇳' };

  return sorted.map(([code, count]) =>
    barRow(`${flags[code] ?? '🌐'} ${code}`, count, total)
  ).join('');
}
