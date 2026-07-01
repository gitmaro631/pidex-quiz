import { initFirebase, fetchSurveyStats } from './firebase.js';
import { addLives, getLastStatsViewTime, setLastStatsViewTime, getMode } from './util-storage.js';
import { updateHeaderLives } from './app.js';

const STATS_LIFE_COOLDOWN_MS = 60 * 60 * 1000;

// 국가코드 → 국기+국가명
const COUNTRY_INFO = {
  AF:'🇦🇫 Afghanistan', AL:'🇦🇱 Albania', DZ:'🇩🇿 Algeria', AD:'🇦🇩 Andorra', AO:'🇦🇴 Angola',
  AG:'🇦🇬 Antigua and Barbuda', AR:'🇦🇷 Argentina', AM:'🇦🇲 Armenia', AU:'🇦🇺 Australia',
  AT:'🇦🇹 Austria', AZ:'🇦🇿 Azerbaijan', BS:'🇧🇸 Bahamas', BH:'🇧🇭 Bahrain', BD:'🇧🇩 Bangladesh',
  BB:'🇧🇧 Barbados', BY:'🇧🇾 Belarus', BE:'🇧🇪 Belgium', BZ:'🇧🇿 Belize', BJ:'🇧🇯 Benin',
  BT:'🇧🇹 Bhutan', BO:'🇧🇴 Bolivia', BA:'🇧🇦 Bosnia and Herzegovina', BW:'🇧🇼 Botswana',
  BR:'🇧🇷 Brazil', BN:'🇧🇳 Brunei', BG:'🇧🇬 Bulgaria', BF:'🇧🇫 Burkina Faso', BI:'🇧🇮 Burundi',
  CV:'🇨🇻 Cape Verde', KH:'🇰🇭 Cambodia', CM:'🇨🇲 Cameroon', CA:'🇨🇦 Canada',
  CF:'🇨🇫 Central African Republic', TD:'🇹🇩 Chad', CL:'🇨🇱 Chile', CN:'🇨🇳 China',
  CO:'🇨🇴 Colombia', KM:'🇰🇲 Comoros', CG:'🇨🇬 Congo', CD:'🇨🇩 Congo DR', CR:'🇨🇷 Costa Rica',
  HR:'🇭🇷 Croatia', CU:'🇨🇺 Cuba', CY:'🇨🇾 Cyprus', CZ:'🇨🇿 Czech Republic', DK:'🇩🇰 Denmark',
  DJ:'🇩🇯 Djibouti', DM:'🇩🇲 Dominica', DO:'🇩🇴 Dominican Republic', EC:'🇪🇨 Ecuador',
  EG:'🇪🇬 Egypt', SV:'🇸🇻 El Salvador', GQ:'🇬🇶 Equatorial Guinea', ER:'🇪🇷 Eritrea',
  EE:'🇪🇪 Estonia', SZ:'🇸🇿 Eswatini', ET:'🇪🇹 Ethiopia', FJ:'🇫🇯 Fiji', FI:'🇫🇮 Finland',
  FR:'🇫🇷 France', GA:'🇬🇦 Gabon', GM:'🇬🇲 Gambia', GE:'🇬🇪 Georgia', DE:'🇩🇪 Germany',
  GH:'🇬🇭 Ghana', GR:'🇬🇷 Greece', GD:'🇬🇩 Grenada', GT:'🇬🇹 Guatemala', GN:'🇬🇳 Guinea',
  GW:'🇬🇼 Guinea-Bissau', GY:'🇬🇾 Guyana', HT:'🇭🇹 Haiti', HN:'🇭🇳 Honduras', HU:'🇭🇺 Hungary',
  IS:'🇮🇸 Iceland', IN:'🇮🇳 India', ID:'🇮🇩 Indonesia', IR:'🇮🇷 Iran', IQ:'🇮🇶 Iraq',
  IE:'🇮🇪 Ireland', IL:'🇮🇱 Israel', IT:'🇮🇹 Italy', CI:'🇨🇮 Ivory Coast', JM:'🇯🇲 Jamaica',
  JP:'🇯🇵 Japan', JO:'🇯🇴 Jordan', KZ:'🇰🇿 Kazakhstan', KE:'🇰🇪 Kenya', KI:'🇰🇮 Kiribati',
  XK:'🇽🇰 Kosovo', KW:'🇰🇼 Kuwait', KG:'🇰🇬 Kyrgyzstan', LA:'🇱🇦 Laos', LV:'🇱🇻 Latvia',
  LB:'🇱🇧 Lebanon', LS:'🇱🇸 Lesotho', LR:'🇱🇷 Liberia', LY:'🇱🇾 Libya', LI:'🇱🇮 Liechtenstein',
  LT:'🇱🇹 Lithuania', LU:'🇱🇺 Luxembourg', MG:'🇲🇬 Madagascar', MW:'🇲🇼 Malawi',
  MY:'🇲🇾 Malaysia', MV:'🇲🇻 Maldives', ML:'🇲🇱 Mali', MT:'🇲🇹 Malta', MH:'🇲🇭 Marshall Islands',
  MR:'🇲🇷 Mauritania', MU:'🇲🇺 Mauritius', MX:'🇲🇽 Mexico', FM:'🇫🇲 Micronesia',
  MD:'🇲🇩 Moldova', MC:'🇲🇨 Monaco', MN:'🇲🇳 Mongolia', ME:'🇲🇪 Montenegro', MA:'🇲🇦 Morocco',
  MZ:'🇲🇿 Mozambique', MM:'🇲🇲 Myanmar', NA:'🇳🇦 Namibia', NR:'🇳🇷 Nauru', NP:'🇳🇵 Nepal',
  NL:'🇳🇱 Netherlands', NZ:'🇳🇿 New Zealand', NI:'🇳🇮 Nicaragua', NE:'🇳🇪 Niger',
  NG:'🇳🇬 Nigeria', MK:'🇲🇰 North Macedonia', NO:'🇳🇴 Norway', OM:'🇴🇲 Oman',
  PK:'🇵🇰 Pakistan', PW:'🇵🇼 Palau', PS:'🇵🇸 Palestine', PA:'🇵🇦 Panama',
  PG:'🇵🇬 Papua New Guinea', PY:'🇵🇾 Paraguay', PE:'🇵🇪 Peru', PH:'🇵🇭 Philippines',
  PL:'🇵🇱 Poland', PT:'🇵🇹 Portugal', QA:'🇶🇦 Qatar', RO:'🇷🇴 Romania', RU:'🇷🇺 Russia',
  RW:'🇷🇼 Rwanda', KN:'🇰🇳 Saint Kitts and Nevis', LC:'🇱🇨 Saint Lucia',
  VC:'🇻🇨 Saint Vincent', WS:'🇼🇸 Samoa', SM:'🇸🇲 San Marino', ST:'🇸🇹 Sao Tome',
  SA:'🇸🇦 Saudi Arabia', SN:'🇸🇳 Senegal', RS:'🇷🇸 Serbia', SC:'🇸🇨 Seychelles',
  SL:'🇸🇱 Sierra Leone', SG:'🇸🇬 Singapore', SK:'🇸🇰 Slovakia', SI:'🇸🇮 Slovenia',
  SB:'🇸🇧 Solomon Islands', SO:'🇸🇴 Somalia', ZA:'🇿🇦 South Africa', KR:'🇰🇷 South Korea',
  SS:'🇸🇸 South Sudan', ES:'🇪🇸 Spain', LK:'🇱🇰 Sri Lanka', SD:'🇸🇩 Sudan',
  SR:'🇸🇷 Suriname', SE:'🇸🇪 Sweden', CH:'🇨🇭 Switzerland', SY:'🇸🇾 Syria',
  TW:'🇹🇼 Taiwan', TJ:'🇹🇯 Tajikistan', TZ:'🇹🇿 Tanzania', TH:'🇹🇭 Thailand',
  TL:'🇹🇱 Timor-Leste', TG:'🇹🇬 Togo', TO:'🇹🇴 Tonga', TT:'🇹🇹 Trinidad and Tobago',
  TN:'🇹🇳 Tunisia', TR:'🇹🇷 Turkiye', TM:'🇹🇲 Turkmenistan', TV:'🇹🇻 Tuvalu',
  UG:'🇺🇬 Uganda', UA:'🇺🇦 Ukraine', AE:'🇦🇪 UAE', GB:'🇬🇧 United Kingdom',
  US:'🇺🇸 United States', UY:'🇺🇾 Uruguay', UZ:'🇺🇿 Uzbekistan', VU:'🇻🇺 Vanuatu',
  VE:'🇻🇪 Venezuela', VN:'🇻🇳 Vietnam', YE:'🇾🇪 Yemen', ZM:'🇿🇲 Zambia', ZW:'🇿🇼 Zimbabwe',
};

export async function renderStatsPage(container) {
  container.innerHTML = `<div class="stats-loading">통계 불러오는 중...</div>`;

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

  const kycTotal   = stats.kyc._total;
  const nodeTotal  = stats.node._total;
  const tradeTotal = stats.tradeExp._total;

  container.innerHTML = `
    <div class="stats-page">
      <h2 class="stats-title">📊 파이오니어 커뮤니티 통계</h2>
      <p class="stats-total">총 참여자 <b>${stats.total.toLocaleString()}</b>명</p>

      ${kycTotal > 0 ? `
      <div class="stats-section">
        <h3>KYC 현황 <span class="stats-section-n">(${kycTotal}명 응답)</span></h3>
        ${barRow('통과 완료', stats.kyc.passed,   kycTotal)}
        ${barRow('대기 중',   stats.kyc.pending,  kycTotal)}
        ${barRow('실패',      stats.kyc.failed,   kycTotal)}
        ${barRow('미시도',    stats.kyc.notTried, kycTotal)}
      </div>` : ''}

      ${nodeTotal > 0 ? `
      <div class="stats-section">
        <h3>노드 운영 현황 <span class="stats-section-n">(${nodeTotal}명 응답)</span></h3>
        ${barRow('현재 운영 중', stats.node.running,    nodeTotal)}
        ${barRow('돌리다 중단',  stats.node.stopped,    nodeTotal)}
        ${barRow('운영 계획',    stats.node.planning,   nodeTotal)}
        ${barRow('관심 없음',    stats.node.noInterest, nodeTotal)}
      </div>` : ''}

      ${tradeTotal > 0 ? `
      <div class="stats-section">
        <h3>파이 거래 경험 <span class="stats-section-n">(${tradeTotal}명 응답)</span></h3>
        ${barRow('P2P 직거래',  stats.tradeExp.p2p,      tradeTotal)}
        ${barRow('물물교환',     stats.tradeExp.barter,   tradeTotal)}
        ${barRow('거래소 매매',  stats.tradeExp.exchange, tradeTotal)}
        ${barRow('파이 앱 결제', stats.tradeExp.dexApp,   tradeTotal)}
        ${barRow('경험 없음',    stats.tradeExp.none,     tradeTotal)}
      </div>` : ''}

      ${countryTableHTML(stats.byCountry)}

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

function pct(n, d) {
  if (!d) return '-';
  return Math.round(n / d * 100) + '%';
}

function countryTableHTML(byCountry) {
  const entries = Object.entries(byCountry).sort((a, b) => b[1].total - a[1].total);
  if (entries.length === 0) return '';

  const rows = entries.map(([code, c]) => `
    <tr>
      <td class="ct-country">${COUNTRY_INFO[code] ?? ('🌐 ' + code)}</td>
      <td class="ct-num">${c.total}</td>
      <td class="ct-num">${c.kycTotal  ? pct(c.kycPassed,  c.kycTotal)  : '-'}</td>
      <td class="ct-num">${c.nodeTotal ? pct(c.nodeRunning, c.nodeTotal) : '-'}</td>
    </tr>
  `).join('');

  return `
    <div class="stats-section">
      <h3>국가별 통계 <span class="stats-section-n">(${entries.length}개국)</span></h3>
      <div class="country-table-wrap">
        <table class="country-table">
          <thead>
            <tr>
              <th class="ct-country">국가</th>
              <th class="ct-num">응답</th>
              <th class="ct-num">KYC통과</th>
              <th class="ct-num">노드운영</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}
