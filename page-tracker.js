import { t, getLang } from './util-i18n.js';

const HORIZON      = 'https://api.mainnet.minepi.com';
const REPORTS_COL  = 'hack_reports';
const CEX_DB       = new Map([]);

function getDb() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
  return firebase.firestore();
}

// ── tracker 로컬 번역 (11개 언어, 나머지는 fallback) ──────
const TT = {
  ko: {
    'tab.report': '신고하기', 'tab.search': '지갑 조회', 'tab.mywallet': '내 지갑', 'tab.watch': '관심 지갑',
    'report.title': '🚨 피해 신고', 'report.victim_id': '피해자 Pi ID', 'report.suspect_wallet': '의심 지갑 주소',
    'report.amount': '피해 금액 (Pi)', 'report.date': '피해 날짜', 'report.txhash': '트랜잭션 해시 (선택)',
    'report.desc': '상황 설명 (선택)', 'report.btn': '신고 제출', 'report.btn.loading': '제출 중...',
    'report.success': '✅ 신고가 접수되었습니다.', 'report.err.required': '필수 항목을 모두 입력해주세요.',
    'report.err.wallet': '지갑 주소 형식이 올바르지 않습니다 (G로 시작, 56자).', 'report.err.generic': '오류가 발생했습니다. 다시 시도해주세요.',
    'presearch.title': '신고 전 사전 조회', 'presearch.placeholder': '의심 지갑 주소 입력...',
    'presearch.warn.not_wallet': 'G로 시작하는 지갑 주소를 입력해주세요.', 'presearch.hint.short': '최소 4자 이상 입력하세요.',
    'presearch.loading': '조회 중...', 'presearch.none': '기존 신고 내역이 없습니다.',
    'presearch.found': '{n}건의 기존 신고가 있습니다.',
    'search.title': '🔍 지갑 조회', 'search.placeholder': '지갑 주소 입력 (G...)',
    'search.btn': '조회', 'search.no_tx': '거래 내역 없음', 'search.err.fail': '조회 실패',
    'search.err.not_found': '지갑을 찾을 수 없습니다.', 'search.error': '조회 중 오류가 발생했습니다.',
    'list.title': '🗂️ 신고 목록', 'list.filter': '지갑/피해자 ID 검색...', 'list.count': '신고',
    'list.loading': '불러오는 중...', 'list.empty': '신고 내역이 없습니다.', 'list.search_btn': '조회',
    'list.wallet': '의심 지갑:',
    'summary.reports': '신고 건수', 'summary.reported_pi': '피해액 합계', 'summary.tx_count': '발송 건수', 'summary.total_sent': '총 발송액',
    'tx.to': '→', 'tx.from': '←', 'tx.match': '{n}건 신고 일치', 'tx.victims': '피해자',
    'risk.safe': '안전', 'risk.low': '주의', 'risk.mid': '위험', 'risk.high': '매우 위험',
    'matched.victim_id': '피해자', 'matched.chain': '체인 일치',
    'top10.title': '신고 다발 지갑 TOP 10', 'top10.cases': '건',
    'verify.btn': '목격 확인', 'verify.done': '확인 완료', 'verify.mine': '내 신고',
    'verify.confirmed': '명 확인', 'verify.toast': '목격 확인이 등록되었습니다.',
    'export.toast': '클립보드에 복사되었습니다.', 'export.copied': '✅ 복사됨', 'export.manual': '전체 선택 후 복사해주세요.',
    'doc.title': 'Pi 피해 수사 자료', 'doc.generated': '생성',
    'doc.wallet_sec': '의심 지갑', 'doc.reports_sec': '신고 현황', 'doc.count': '신고 건수',
    'doc.total_pi': '피해액 합계', 'doc.victims_sec': '피해자 목록', 'doc.victim_id': '피해자 ID',
    'doc.damage': '피해액', 'doc.date': '피해 날짜', 'doc.tx_hash': 'TX 해시', 'doc.situation': '상황',
    'doc.outgoing_sec': '발송 거래 내역', 'doc.no_tx': '없음', 'doc.chain_match': '★ 신고와 일치',
    'doc.amount': '금액', 'doc.cex_sec': 'CEX 송금 현황', 'doc.verify_sec': '데이터 검증',
    'doc.verify_body': 'Horizon API (mainnet) 기반 거래 내역',
    'doc.submit_sec': '제출처', 'doc.police': '경찰서 사이버범죄수사대',
    'doc.pi_foundation': 'Pi Foundation (support@minepi.com)',
    'doc.cex_note': 'CEX 해당 시 거래소 고객센터',
    'doc.notes_sec': '안내사항', 'doc.note1': '이 자료는 참고용입니다.',
    'doc.note2': '체인상 일치는 추정이며 확정적 증거가 아닙니다.',
    'doc.note3': '수사기관 판단에 따라 해석이 달라질 수 있습니다.',
    'mywallet.title': '내 지갑 (메인넷)', 'mywallet.add': '지갑 추가',
    'mywallet.no_wallets': '등록된 지갑이 없습니다.', 'mywallet.loading': '불러오는 중...',
    'mywallet.fail': '불러오기 실패', 'mywallet.refresh': '새로고침',
    'mywallet.pi.total': 'π 총 잔액', 'mywallet.pi.avail': '사용 가능', 'mywallet.pi.reserve': '최소 보유 (예상)',
    'mywallet.tokens': '보유 토큰', 'mywallet.txs': '최근 거래', 'mywallet.lp': 'LP 포지션',
    'mywallet.no_lp': 'LP 없음', 'mywallet.tx_none': '거래 내역 없음', 'mywallet.updated': '업데이트',
    'mywallet.tx_sent': '전송', 'mywallet.tx_recv': '수신',
    'mywallet.add.title': '지갑 추가', 'mywallet.add.alias_ph': '별칭 (예: 메인 지갑)',
    'mywallet.add.addr_ph': '지갑 주소 (G...)', 'mywallet.add.err_addr': '주소 형식 오류 (G로 시작, 56자)',
    'mywallet.add.err_dup': '이미 등록된 주소입니다.',
    'mywallet.alias.edit': '별칭 수정', 'mywallet.delete': '지갑 삭제',
    'mywallet.delete.confirm': '이 지갑을 삭제하시겠습니까?',
    'mywallet.cloud.backup': '클라우드 백업', 'mywallet.cloud.restore': '클라우드 복원',
    'mywallet.cloud.ok': '✅ 백업 완료', 'mywallet.cloud.fail': '오류가 발생했습니다.',
    'mywallet.cloud.no_data': '복원할 데이터가 없습니다.',
    'mywallet.restore.ok': '✅ 복원 완료', 'mywallet.restore.warn': '현재 지갑 목록이 클라우드 데이터로 교체됩니다.',
    'mywallet.backup.tip': '지갑 정보는 기기에 저장됩니다. 기기 분실 대비 백업을 권장합니다.',
    'mywallet.backup.empty_warn': '현재 지갑이 없습니다. 빈 상태로 백업하면 클라우드의 기존 데이터가 삭제됩니다. 계속하시겠습니까?',
    'watch.title': '관심 지갑 추적', 'watch.empty': '관심 지갑이 없습니다.',
    'watch.add.btn': '지갑 추가', 'watch.add.addr_ph': '지갑 주소 (G...)',
    'watch.add.err_addr': '주소를 확인해주세요.', 'watch.fetch.btn': '🔍 전체 조회',
    'watch.fetch.loading': '조회 중...', 'watch.internal.title': '🔄 내부 거래',
    'watch.feed.title': '📡 전체 피드', 'watch.no.internal': '내부 거래 없음',
    'watch.new.tx': '새 거래 감지', 'watch.report.warn': '신고된 지갑',
    'watch.cloud.backup': '클라우드 백업', 'watch.cloud.restore': '클라우드 복원',
    'watch.cloud.ok': '✅ 백업 완료', 'watch.cloud.fail': '오류가 발생했습니다.',
    'watch.cloud.no_data': '복원할 데이터가 없습니다.',
    'watch.restore.ok': '✅ 복원 완료', 'watch.restore.warn': '현재 관심 지갑 목록이 클라우드 데이터로 교체됩니다.',
    'watch.backup.empty_warn': '관심 지갑이 없습니다. 빈 상태로 백업하면 기존 클라우드 데이터가 삭제됩니다. 계속하시겠습니까?',
    'cex.estimated': '거래소 (추정)',
    'ctx.watch': '관심 지갑 추가', 'ctx.watch.slot': '여유 {n}개', 'ctx.watch.exists': '이미 추가됨',
    'ctx.watch.full': '관심 지갑이 가득 찼습니다 (최대 10개)', 'ctx.watch.alias_title': '별칭 입력',
    'ctx.watch.alias_ph': '별칭 (선택)', 'ctx.watch.added': '추가됨',
    'ctx.register.both': 'PiDEX + 관심 동시 등록', 'ctx.both.alias_title': '별칭 입력',
    'ctx.both.alias_ph': '별칭 (선택)', 'ctx.both.sent': '✅ 등록 완료', 'ctx.both.fail': '등록 실패',
    'ctx.pidex.no_login': 'Pi 로그인이 필요합니다.',
    'ctx.cancel': '취소', 'ctx.save': '저장',
    'toast.copied': '복사됨',
  },
  en: {
    'tab.report': 'Report', 'tab.search': 'Wallet Search', 'tab.mywallet': 'My Wallet', 'tab.watch': 'Watch List',
    'report.title': '🚨 Report Hack', 'report.victim_id': 'Victim Pi ID', 'report.suspect_wallet': 'Suspect Wallet Address',
    'report.amount': 'Amount Lost (Pi)', 'report.date': 'Date of Incident', 'report.txhash': 'Transaction Hash (optional)',
    'report.desc': 'Description (optional)', 'report.btn': 'Submit Report', 'report.btn.loading': 'Submitting...',
    'report.success': '✅ Report submitted.', 'report.err.required': 'Please fill in all required fields.',
    'report.err.wallet': 'Invalid wallet address (starts with G, 56 chars).', 'report.err.generic': 'An error occurred. Please try again.',
    'presearch.title': 'Pre-check Before Reporting', 'presearch.placeholder': 'Enter suspect wallet address...',
    'presearch.warn.not_wallet': 'Please enter a wallet address starting with G.', 'presearch.hint.short': 'Enter at least 4 characters.',
    'presearch.loading': 'Searching...', 'presearch.none': 'No existing reports found.',
    'presearch.found': '{n} existing report(s) found.',
    'search.title': '🔍 Wallet Search', 'search.placeholder': 'Enter wallet address (G...)',
    'search.btn': 'Search', 'search.no_tx': 'No transactions', 'search.err.fail': 'Search failed',
    'search.err.not_found': 'Wallet not found.', 'search.error': 'Error during search.',
    'list.title': '🗂️ Report List', 'list.filter': 'Search wallet/victim ID...', 'list.count': 'reports',
    'list.loading': 'Loading...', 'list.empty': 'No reports yet.', 'list.search_btn': 'Search',
    'list.wallet': 'Suspect Wallet:',
    'summary.reports': 'Reports', 'summary.reported_pi': 'Total Reported', 'summary.tx_count': 'Outgoing Txs', 'summary.total_sent': 'Total Sent',
    'tx.to': '→', 'tx.from': '←', 'tx.match': '{n} report match(es)', 'tx.victims': 'Victims',
    'risk.safe': 'Safe', 'risk.low': 'Caution', 'risk.mid': 'Danger', 'risk.high': 'High Risk',
    'matched.victim_id': 'Victim', 'matched.chain': 'Chain Match',
    'top10.title': 'Most Reported Wallets TOP 10', 'top10.cases': ' cases',
    'verify.btn': 'Verify', 'verify.done': 'Verified', 'verify.mine': 'My Report',
    'verify.confirmed': ' verified', 'verify.toast': 'Verification recorded.',
    'export.toast': 'Copied to clipboard.', 'export.copied': '✅ Copied', 'export.manual': 'Select all and copy.',
    'doc.title': 'Pi Hack Investigation Report', 'doc.generated': 'Generated',
    'doc.wallet_sec': 'Suspect Wallet', 'doc.reports_sec': 'Report Summary', 'doc.count': 'Report Count',
    'doc.total_pi': 'Total Reported', 'doc.victims_sec': 'Victim List', 'doc.victim_id': 'Victim ID',
    'doc.damage': 'Damage', 'doc.date': 'Date', 'doc.tx_hash': 'TX Hash', 'doc.situation': 'Description',
    'doc.outgoing_sec': 'Outgoing Transactions', 'doc.no_tx': 'None', 'doc.chain_match': '★ Matches Report',
    'doc.amount': 'Amount', 'doc.cex_sec': 'CEX Transfer Summary', 'doc.verify_sec': 'Data Verification',
    'doc.verify_body': 'Based on Horizon API (mainnet) transaction data',
    'doc.submit_sec': 'Submit To', 'doc.police': 'Local Cybercrime Unit',
    'doc.pi_foundation': 'Pi Foundation (support@minepi.com)',
    'doc.cex_note': 'CEX customer support if applicable',
    'doc.notes_sec': 'Notes', 'doc.note1': 'This document is for reference purposes.',
    'doc.note2': 'Chain matches are estimates, not definitive proof.',
    'doc.note3': 'Interpretation may vary by jurisdiction.',
    'mywallet.title': 'My Wallet (Mainnet)', 'mywallet.add': 'Add Wallet',
    'mywallet.no_wallets': 'No wallets registered.', 'mywallet.loading': 'Loading...',
    'mywallet.fail': 'Load failed', 'mywallet.refresh': 'Refresh',
    'mywallet.pi.total': 'π Total Balance', 'mywallet.pi.avail': 'Available', 'mywallet.pi.reserve': 'Min Reserve (est.)',
    'mywallet.tokens': 'Tokens', 'mywallet.txs': 'Recent Transactions', 'mywallet.lp': 'LP Positions',
    'mywallet.no_lp': 'No LP positions', 'mywallet.tx_none': 'No transactions', 'mywallet.updated': 'Updated',
    'mywallet.tx_sent': 'Sent', 'mywallet.tx_recv': 'Received',
    'mywallet.add.title': 'Add Wallet', 'mywallet.add.alias_ph': 'Alias (e.g. Main Wallet)',
    'mywallet.add.addr_ph': 'Wallet Address (G...)', 'mywallet.add.err_addr': 'Invalid address (starts with G, 56 chars)',
    'mywallet.add.err_dup': 'This address is already registered.',
    'mywallet.alias.edit': 'Edit Alias', 'mywallet.delete': 'Delete Wallet',
    'mywallet.delete.confirm': 'Are you sure you want to delete this wallet?',
    'mywallet.cloud.backup': 'Cloud Backup', 'mywallet.cloud.restore': 'Cloud Restore',
    'mywallet.cloud.ok': '✅ Backup complete', 'mywallet.cloud.fail': 'An error occurred.',
    'mywallet.cloud.no_data': 'No data to restore.',
    'mywallet.restore.ok': '✅ Restored', 'mywallet.restore.warn': 'Your current wallet list will be replaced with cloud data.',
    'mywallet.backup.tip': 'Wallets are stored locally. Backup recommended in case of device loss.',
    'mywallet.backup.empty_warn': 'No wallets to back up. Backing up an empty list will erase cloud data. Continue?',
    'watch.title': 'Watch List', 'watch.empty': 'No wallets in watch list.',
    'watch.add.btn': 'Add Wallet', 'watch.add.addr_ph': 'Wallet address (G...)',
    'watch.add.err_addr': 'Please check the address.', 'watch.fetch.btn': '🔍 Fetch All',
    'watch.fetch.loading': 'Fetching...', 'watch.internal.title': '🔄 Internal Transfers',
    'watch.feed.title': '📡 Full Feed', 'watch.no.internal': 'No internal transfers',
    'watch.new.tx': 'New transaction detected', 'watch.report.warn': 'Reported wallet',
    'watch.cloud.backup': 'Cloud Backup', 'watch.cloud.restore': 'Cloud Restore',
    'watch.cloud.ok': '✅ Backup complete', 'watch.cloud.fail': 'An error occurred.',
    'watch.cloud.no_data': 'No data to restore.',
    'watch.restore.ok': '✅ Restored', 'watch.restore.warn': 'Your watch list will be replaced with cloud data.',
    'watch.backup.empty_warn': 'Watch list is empty. Backing up will erase cloud data. Continue?',
    'cex.estimated': 'Exchange (est.)',
    'ctx.watch': 'Add to Watch List', 'ctx.watch.slot': '{n} slots left', 'ctx.watch.exists': 'Already added',
    'ctx.watch.full': 'Watch list is full (max 10)', 'ctx.watch.alias_title': 'Enter Alias',
    'ctx.watch.alias_ph': 'Alias (optional)', 'ctx.watch.added': 'Added',
    'ctx.register.both': 'Add to PiDEX + Watch', 'ctx.both.alias_title': 'Enter Alias',
    'ctx.both.alias_ph': 'Alias (optional)', 'ctx.both.sent': '✅ Registered', 'ctx.both.fail': 'Registration failed',
    'ctx.pidex.no_login': 'Pi login required.',
    'ctx.cancel': 'Cancel', 'ctx.save': 'Save',
    'toast.copied': 'Copied',
  },
};

function tt(key) {
  const lang = getLang();
  return TT[lang]?.[key] ?? TT.en?.[key] ?? key;
}

function tt2(key, vars) {
  let s = tt(key);
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace('{' + k + '}', v); });
  return s;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function renderTrackerPage(container, username, uid) {
  const db = getDb();
  let piUser = username || null;
  let piUid  = uid     || null;

  let allPayments = [], pageCursor = null, currentWallet = '', currentReports = [], allReports = [];

  // ── localStorage helpers ─────────────────────────────
  const HACK_WALLETS_KEY = 'hack_my_wallets';
  const HACK_ACTIVE_KEY  = 'hack_active_wallet';
  const WATCH_KEY        = 'hack_watch_list';
  const WATCH_LATEST_KEY = 'hack_watch_latest_tx';
  const WATCH_MAX        = 10;

  function getHackWallets()      { try { return JSON.parse(localStorage.getItem(HACK_WALLETS_KEY) || '[]'); } catch { return []; } }
  function saveHackWallets(list) { localStorage.setItem(HACK_WALLETS_KEY, JSON.stringify(list)); }
  function getHackActiveId()     { return localStorage.getItem(HACK_ACTIVE_KEY); }
  function setHackActiveId(id)   { localStorage.setItem(HACK_ACTIVE_KEY, id); }
  function genHackWalletId()     { return `h${Date.now()}${Math.random().toString(36).slice(2,5)}`; }
  function getHackActiveWallet() {
    const wallets = getHackWallets();
    if (!wallets.length) return null;
    return wallets.find(w => w.id === getHackActiveId()) ?? wallets[0];
  }
  function getWatchList()           { try { return JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); } catch { return []; } }
  function saveWatchList(list)      { localStorage.setItem(WATCH_KEY, JSON.stringify(list)); }
  function getWatchLatest()         { try { return JSON.parse(localStorage.getItem(WATCH_LATEST_KEY) || '{}'); } catch { return {}; } }
  function saveWatchLatest(latest)  { localStorage.setItem(WATCH_LATEST_KEY, JSON.stringify(latest)); }
  function genWatchId()             { return `w${Date.now()}`; }
  function inWatchList(addr)        { return getWatchList().some(w => w.address === addr); }

  // ── 탭 전환 ──────────────────────────────────────────
  function switchTab(tabName) {
    container.querySelectorAll('.trk-tab').forEach(t => t.classList.remove('active'));
    container.querySelectorAll('.trk-tab-content').forEach(s => s.classList.remove('active'));
    container.querySelector(`.trk-tab[data-tab="${tabName}"]`)?.classList.add('active');
    container.querySelector(`#trk-tab-${tabName}`)?.classList.add('active');
    if (tabName === 'list')     loadReportList();
    if (tabName === 'watch')    renderWatchTab();
    if (tabName === 'mywallet') renderMyWalletTab();
  }

  function jumpToSearch(wallet) {
    switchTab('search');
    const input = container.querySelector('#trk-s-wallet');
    if (input) input.value = wallet;
    searchWallet();
  }

  // ── HTML 렌더 ────────────────────────────────────────
  container.innerHTML = `
    <div class="trk-wrap">
      <div class="trk-tabs">
        <button class="trk-tab active" data-tab="list">${tt('tab.report')}</button>
        <button class="trk-tab" data-tab="search">${tt('tab.search')}</button>
        <button class="trk-tab" data-tab="mywallet">${tt('tab.mywallet')}</button>
        <button class="trk-tab" data-tab="watch">${tt('tab.watch')}</button>
      </div>

      <!-- 신고 목록 탭 -->
      <div class="trk-tab-content active" id="trk-tab-list">
        <div class="trk-section">
          <h3 class="trk-section-title">${tt('presearch.title')}</h3>
          <div class="trk-row">
            <input type="text" id="trk-ps-wallet" class="trk-input" placeholder="${tt('presearch.placeholder')}" />
            <button class="trk-btn-search" id="trk-ps-btn">${tt('search.btn')}</button>
          </div>
          <div id="trk-ps-result"></div>
        </div>
        <hr class="trk-divider" />
        <div class="trk-section">
          <h3 class="trk-section-title">${tt('report.title')}</h3>
          <div class="trk-realname-warn">
            ⚠️ 본 신고는 <strong>실명제</strong>로 운영됩니다.<br>
            Pi 계정으로 로그인한 본인만 신고할 수 있으며,<br>
            허위 신고 시 법적 책임이 따를 수 있습니다.
          </div>
          <label class="trk-label">${tt('report.victim_id')} *</label>
          <input id="trk-f-victim-id" class="trk-input" type="text" value="${username ? '@' + username : ''}" readonly style="opacity:0.7;cursor:default;" />
          <label class="trk-label">${tt('report.suspect_wallet')} *</label>
          <input id="trk-f-suspect-wallet" class="trk-input mono" type="text" placeholder="G..." />
          <label class="trk-label">${tt('report.amount')} *</label>
          <input id="trk-f-amount" class="trk-input" type="number" placeholder="0" min="0" />
          <label class="trk-label">${tt('report.date')} *</label>
          <input id="trk-f-date" class="trk-input" type="date" />
          <label class="trk-label">${tt('report.txhash')}</label>
          <input id="trk-f-txhash" class="trk-input mono" type="text" placeholder="TX hash" />
          <label class="trk-label">${tt('report.desc')}</label>
          <textarea id="trk-f-desc" class="trk-input" rows="3"></textarea>
          <button class="trk-btn-submit" id="trk-btn-submit">
            <span>${tt('report.btn')}</span>
          </button>
          <p id="trk-submit-msg" class="trk-msg"></p>
        </div>
        <hr class="trk-divider" />
        <div class="trk-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <h3 class="trk-section-title" style="margin:0;">${tt('list.title')}</h3>
            <span id="trk-l-count" style="font-size:12px;color:#888;">0 ${tt('list.count')}</span>
          </div>
          <div id="trk-top10-panel"></div>
          <input type="text" id="trk-l-filter" class="trk-input" placeholder="${tt('list.filter')}" style="margin-bottom:10px;" />
          <div id="trk-list-loading" class="trk-loading hidden">${tt('list.loading')}</div>
          <div id="trk-list-empty" class="trk-empty hidden">${tt('list.empty')}</div>
          <div id="trk-report-list"></div>
        </div>
      </div>

      <!-- 지갑 조회 탭 -->
      <div class="trk-tab-content" id="trk-tab-search">
        <div class="trk-section">
          <h3 class="trk-section-title">${tt('search.title')}</h3>
          <div class="trk-row">
            <input type="text" id="trk-s-wallet" class="trk-input mono" placeholder="${tt('search.placeholder')}" />
            <button class="trk-btn-search" id="trk-s-btn">${tt('search.btn')}</button>
          </div>
          <div id="trk-search-loading" class="trk-loading hidden">⏳</div>
          <div id="trk-search-error"   class="trk-error   hidden"></div>
          <div id="trk-search-result" class="hidden">
            <div id="trk-summary-panel"   class="trk-card" style="margin-bottom:12px;"></div>
            <div id="trk-matched-section" class="hidden">
              <div class="trk-section-label warn">⚠️ ${tt('tx.match', { n: '' }).replace('{}','').trim()}</div>
              <div id="trk-matched-list"></div>
            </div>
            <div class="trk-section-label">${tt('search.title')}</div>
            <div id="trk-tx-list"></div>
            <button id="trk-tx-more" class="trk-btn-more hidden">▼ 더 보기</button>
          </div>
          <button id="trk-export-btn" class="trk-btn-export hidden">📤 ${tt('export.toast').replace('됨','').replace('Copied','Export')}</button>
        </div>
      </div>

      <!-- 내 지갑 탭 -->
      <div class="trk-tab-content" id="trk-tab-mywallet">
        <div class="trk-section">
          <div id="trk-mywallet-content"></div>
        </div>
      </div>

      <!-- 관심 지갑 탭 -->
      <div class="trk-tab-content" id="trk-tab-watch">
        <div class="trk-section">
          <div id="trk-watch-content"></div>
        </div>
      </div>
    </div>

    <!-- 수사자료 모달 -->
    <div id="trk-report-modal" class="trk-modal-overlay hidden">
      <div class="trk-modal-box">
        <div class="trk-modal-header">
          <span>${tt('doc.title')}</span>
          <button id="trk-modal-close">✕</button>
        </div>
        <textarea id="trk-report-text" class="trk-report-ta" readonly></textarea>
        <div style="display:flex;gap:8px;padding:12px;">
          <button class="trk-btn-search" id="trk-copy-btn" style="flex:1;">${tt('export.copied').replace('✅ ','')}</button>
        </div>
        <p id="trk-copy-msg" class="trk-msg" style="padding:0 12px 8px;"></p>
      </div>
    </div>

    <!-- 주소 컨텍스트 메뉴 -->
    <div id="trk-addr-menu" class="trk-addr-menu hidden">
      <button id="trk-amenu-watch"></button>
      <button id="trk-amenu-pidex"></button>
      <button id="trk-amenu-copy"></button>
    </div>
  `;

  // ── 탭 이벤트 ────────────────────────────────────────
  container.querySelectorAll('.trk-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── 사전 조회 ─────────────────────────────────────────
  const psInput = container.querySelector('#trk-ps-wallet');
  container.querySelector('#trk-ps-btn').addEventListener('click', preSearchWallet);
  psInput.addEventListener('keydown', e => { if (e.key === 'Enter') preSearchWallet(); });

  async function preSearchWallet() {
    const resultEl = container.querySelector('#trk-ps-result');
    const q = (psInput.value || '').trim();
    resultEl.innerHTML = '';
    if (!q) return;
    if (!q.toUpperCase().startsWith('G')) {
      resultEl.innerHTML = `<div class="trk-ps-warn">${tt('presearch.warn.not_wallet')}</div>`;
      return;
    }
    if (q.length < 4) {
      resultEl.innerHTML = `<div class="trk-ps-hint">${tt('presearch.hint.short')}</div>`;
      return;
    }
    if (!db) { resultEl.innerHTML = `<div class="trk-ps-warn">${tt('search.error')}</div>`; return; }
    resultEl.innerHTML = `<div class="trk-ps-loading">⏳ ${tt('presearch.loading')}</div>`;
    try {
      const snap = await db.collection(REPORTS_COL)
        .where('suspectWallet', '>=', q)
        .where('suspectWallet', '<=', q + '')
        .orderBy('suspectWallet')
        .limit(20)
        .get();
      if (snap.empty) { resultEl.innerHTML = `<div class="trk-ps-empty">${tt('presearch.none')}</div>`; return; }
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      resultEl.innerHTML = `<div class="trk-ps-found">${tt2('presearch.found', { n: rows.length })}</div>`;
      rows.forEach(r => {
        const card = document.createElement('div');
        card.className = 'trk-report-card';
        card.innerHTML = `
          <div class="trk-report-top"><span>👤 ${esc(r.victimId) || '?'}</span><span>${esc(r.date) || ''}</span></div>
          <div class="trk-report-amount">-${(r.amount||0).toLocaleString()} Pi</div>
          <div class="trk-report-wallet">${esc(r.suspectWallet)}</div>
          ${r.desc ? `<div class="trk-report-desc">"${esc(r.desc)}"</div>` : ''}
          <div class="trk-report-actions">
            <button class="trk-btn-link" data-search="${esc(r.suspectWallet)}">${tt('list.search_btn')}</button>
          </div>`;
        card.querySelector('[data-search]').addEventListener('click', () => jumpToSearch(r.suspectWallet));
        resultEl.appendChild(card);
      });
    } catch { resultEl.innerHTML = `<div class="trk-ps-warn">${tt('search.error')}</div>`; }
  }

  // ── 신고 제출 ────────────────────────────────────────
  container.querySelector('#trk-btn-submit').addEventListener('click', submitReport);

  async function submitReport() {
    if (!db) return;
    const victimId      = container.querySelector('#trk-f-victim-id').value.trim();
    const suspectWallet = container.querySelector('#trk-f-suspect-wallet').value.trim();
    const amount        = parseFloat(container.querySelector('#trk-f-amount').value);
    const date          = container.querySelector('#trk-f-date').value;
    const txHash        = container.querySelector('#trk-f-txhash').value.trim();
    const desc          = container.querySelector('#trk-f-desc').value.trim();
    const msgEl         = container.querySelector('#trk-submit-msg');
    const btn           = container.querySelector('#trk-btn-submit');

    msgEl.className = 'trk-msg';
    msgEl.textContent = '';

    if (!victimId || !suspectWallet || isNaN(amount) || amount <= 0 || !date) {
      msgEl.className = 'trk-msg err'; msgEl.textContent = tt('report.err.required'); return;
    }
    if (!suspectWallet.startsWith('G') || suspectWallet.length < 50) {
      msgEl.className = 'trk-msg err'; msgEl.textContent = tt('report.err.wallet'); return;
    }

    btn.disabled = true;
    btn.querySelector('span').textContent = tt('report.btn.loading');

    try {
      await db.collection(REPORTS_COL).add({
        victimId, suspectWallet, amount, date,
        txHash: txHash || null, desc: desc || null,
        reporterPiId: piUser || null,
        lang: getLang(),
        createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
        verifyCount: 0, verifiedBy: [],
      });
      db.collection('wallet_stats').doc(suspectWallet).set({
        reportCount:  firebase.firestore.FieldValue.increment(1),
        totalAmount:  firebase.firestore.FieldValue.increment(amount),
        lastReportAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch(() => {});

      msgEl.className = 'trk-msg ok';
      msgEl.textContent = tt('report.success');
      ['trk-f-suspect-wallet','trk-f-amount','trk-f-date','trk-f-txhash','trk-f-desc']
        .forEach(id => { container.querySelector('#' + id).value = ''; });
    } catch {
      msgEl.className = 'trk-msg err';
      msgEl.textContent = tt('report.err.generic');
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = tt('report.btn');
    }
  }

  // ── 신고 목록 ────────────────────────────────────────
  async function loadReportList() {
    if (!db) return;
    const listEl    = container.querySelector('#trk-report-list');
    const loadingEl = container.querySelector('#trk-list-loading');
    const emptyEl   = container.querySelector('#trk-list-empty');
    loadingEl.classList.remove('hidden');
    listEl.innerHTML = '';
    emptyEl.classList.add('hidden');
    try {
      const [snap, top10Snap] = await Promise.all([
        db.collection(REPORTS_COL).orderBy('createdAt', 'desc').limit(100).get(),
        db.collection('wallet_stats').orderBy('reportCount', 'desc').limit(10).get(),
      ]);
      allReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTop10(top10Snap.docs.map(d => ({ addr: d.id, ...d.data() })));
      renderReportList(allReports);
    } catch {}
    loadingEl.classList.add('hidden');
  }

  function renderTop10(stats) {
    const el = container.querySelector('#trk-top10-panel');
    if (!el || stats.length === 0) return;
    el.innerHTML = `
      <div class="trk-section-label warn" style="margin-bottom:6px;">🏴 ${tt('top10.title')}</div>
      ${stats.map((s, i) => `
        <div class="trk-top10-row">
          <span class="trk-top10-rank">${i + 1}</span>
          <span class="trk-top10-addr trk-copy-addr" data-copy-addr="${esc(s.addr)}">${esc(s.addr.slice(0,8))}···${esc(s.addr.slice(-6))}</span>
          <span class="trk-top10-count">${s.reportCount}${tt('top10.cases')}</span>
          <button class="trk-btn-link trk-top10-search" data-addr="${esc(s.addr)}">${tt('list.search_btn')}</button>
        </div>`).join('')}`;
    el.querySelectorAll('.trk-top10-search').forEach(btn => {
      btn.addEventListener('click', () => jumpToSearch(btn.dataset.addr));
    });
  }

  function renderReportList(reports) {
    const listEl  = container.querySelector('#trk-report-list');
    const emptyEl = container.querySelector('#trk-list-empty');
    const countEl = container.querySelector('#trk-l-count');
    listEl.innerHTML = '';
    countEl.textContent = `${reports.length} ${tt('list.count')}`;
    if (reports.length === 0) { emptyEl.classList.remove('hidden'); return; }
    reports.forEach(r => {
      const alreadyVerified = piUser && (r.verifiedBy || []).includes(piUser);
      const isMine = piUser && r.reporterPiId === piUser;
      const verifyCount = r.verifyCount || 0;
      const card = document.createElement('div');
      card.className = 'trk-report-card';
      card.innerHTML = `
        <div class="trk-report-top">
          <span class="trk-report-victim">👤 ${esc(r.victimId)}</span>
          <span class="trk-report-date">${esc(r.date) || ''}</span>
        </div>
        <div class="trk-report-amount">-${(r.amount||0).toLocaleString()} Pi</div>
        <div class="trk-tx-dir">${tt('list.wallet')}</div>
        <div class="trk-report-wallet trk-copy-addr" data-copy-addr="${esc(r.suspectWallet)}">${esc(r.suspectWallet)}</div>
        ${r.desc ? `<div class="trk-report-desc">"${esc(r.desc)}"</div>` : ''}
        <div class="trk-report-actions">
          <button class="trk-btn-link" data-search="${esc(r.suspectWallet)}">${tt('list.search_btn')}</button>
          ${!isMine ? `<button class="trk-btn-verify ${alreadyVerified ? 'verified' : ''}" data-rid="${esc(r.id)}" data-wallet="${esc(r.suspectWallet)}" data-amount="${r.amount||0}" ${alreadyVerified ? 'disabled' : ''}>
            ✋ ${tt('verify.btn')}${verifyCount > 0 ? ` <span class="trk-verify-count">${verifyCount}</span>` : ''}
          </button>` : `<span style="font-size:12px;color:#888;">${tt('verify.mine')}${verifyCount > 0 ? ` · ${verifyCount}${tt('verify.confirmed')}` : ''}</span>`}
        </div>`;
      card.querySelector('[data-search]').addEventListener('click', () => jumpToSearch(r.suspectWallet));
      const verifyBtn = card.querySelector('.trk-btn-verify:not([disabled])');
      if (verifyBtn) verifyBtn.addEventListener('click', () => verifyReport(verifyBtn, r.id, r.suspectWallet, r.amount || 0));
      listEl.appendChild(card);
    });
  }

  async function verifyReport(btn, reportId, suspectWallet, amount) {
    if (!piUser || !db) { showToast(tt('ctx.pidex.no_login')); return; }
    btn.disabled = true;
    try {
      await db.collection(REPORTS_COL).doc(reportId).update({
        verifyCount: firebase.firestore.FieldValue.increment(1),
        verifiedBy:  firebase.firestore.FieldValue.arrayUnion(piUser),
      });
      db.collection('wallet_stats').doc(suspectWallet).set({
        verifyCount:  firebase.firestore.FieldValue.increment(1),
        totalAmount:  firebase.firestore.FieldValue.increment(amount),
      }, { merge: true }).catch(() => {});
      btn.classList.add('verified');
      btn.innerHTML = `✅ ${tt('verify.done')}`;
      showToast(tt('verify.toast'));
    } catch { btn.disabled = false; }
  }

  container.querySelector('#trk-l-filter').addEventListener('input', () => {
    const q = container.querySelector('#trk-l-filter').value.trim().toLowerCase();
    renderReportList(q
      ? allReports.filter(r =>
          (r.suspectWallet||'').toLowerCase().includes(q) ||
          (r.victimId||'').toLowerCase().includes(q))
      : allReports
    );
  });

  // ── 지갑 조회 ─────────────────────────────────────────
  const sInput = container.querySelector('#trk-s-wallet');
  container.querySelector('#trk-s-btn').addEventListener('click', searchWallet);
  sInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchWallet(); });

  async function searchWallet() {
    const wallet    = sInput.value.trim();
    if (!wallet) return;
    const resultEl  = container.querySelector('#trk-search-result');
    const loadingEl = container.querySelector('#trk-search-loading');
    const errorEl   = container.querySelector('#trk-search-error');
    const exportBtn = container.querySelector('#trk-export-btn');
    resultEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    if (exportBtn) exportBtn.classList.add('hidden');
    loadingEl.classList.remove('hidden');
    allPayments = []; pageCursor = null;
    try {
      const [reports, paymentsData] = await Promise.all([
        fetchReportsForWallet(wallet),
        fetchPayments(wallet),
      ]);
      allPayments    = paymentsData.payments;
      pageCursor     = paymentsData.next;
      currentWallet  = wallet;
      currentReports = reports;
      renderResult(wallet, reports, allPayments);
      resultEl.classList.remove('hidden');
      if (exportBtn) exportBtn.classList.remove('hidden');
    } catch (e) {
      errorEl.textContent = tt('search.err.fail') + ': ' + (e.message || '');
      errorEl.classList.remove('hidden');
    } finally {
      loadingEl.classList.add('hidden');
    }
  }

  async function fetchReportsForWallet(wallet) {
    if (!db) return [];
    const snap = await db.collection(REPORTS_COL)
      .where('suspectWallet', '==', wallet)
      .orderBy('date', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function fetchPayments(wallet, cursor = null) {
    let url = `${HORIZON}/accounts/${wallet}/payments?order=desc&limit=50&include_failed=false`;
    if (cursor) url += '&cursor=' + cursor;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) throw new Error(tt('search.err.not_found'));
      throw new Error(`API error (${res.status})`);
    }
    const data = await res.json();
    const records = (data._embedded?.records || []).filter(r => r.type === 'payment');
    const next = data._links?.next?.href?.match(/cursor=([^&]+)/)?.[1] || null;
    return { payments: records, next };
  }

  function renderResult(wallet, reports, payments) {
    renderSummary(wallet, reports, payments);
    renderMatchedSection(reports, payments);
    renderTxList(wallet, reports, payments);
    container.querySelector('#trk-tx-more').classList.toggle('hidden', !pageCursor);
  }

  function calcRiskScore(reports, totalReported, outgoingCount, totalOut) {
    let score = 0;
    score += Math.min(reports.length * 25, 75);
    if (totalReported > 500) score += 10;
    if (totalReported > 100) score += 5;
    if (outgoingCount > 20)  score += 5;
    if (totalOut > 1000)     score += 5;
    return Math.min(score, 100);
  }

  function riskGrade(score) {
    if (score === 0) return { emoji: '🟢', cls: 'safe',   key: 'risk.safe' };
    if (score < 30)  return { emoji: '🟡', cls: 'warn',   key: 'risk.low' };
    if (score < 60)  return { emoji: '🔴', cls: 'danger', key: 'risk.mid' };
    return               { emoji: '💀', cls: 'danger', key: 'risk.high' };
  }

  function renderSummary(wallet, reports, payments) {
    const panel         = container.querySelector('#trk-summary-panel');
    const totalReported = reports.reduce((s, r) => s + (r.amount || 0), 0);
    const outgoing      = payments.filter(p => p.from === wallet);
    const totalOut      = outgoing.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const score = calcRiskScore(reports, totalReported, outgoing.length, totalOut);
    const grade = riskGrade(score);
    const amtClass = reports.length >= 3 ? 'danger' : reports.length > 0 ? 'warn' : 'ok';
    panel.innerHTML = `
      <div class="trk-summary-wallet trk-copy-addr" data-copy-addr="${esc(wallet)}">${esc(wallet)}</div>
      <div class="trk-risk-bar-wrap">
        <div class="trk-risk-bar-track">
          <div class="trk-risk-bar-fill ${grade.cls}" style="width:${score}%"></div>
        </div>
        <span class="trk-risk-score-label ${grade.cls}">${grade.emoji} ${tt(grade.key)} (${score}/100)</span>
      </div>
      <div class="trk-summary-stats">
        <div class="trk-stat-box"><div class="trk-stat-val ${amtClass}">${reports.length}</div><div class="trk-stat-lbl">${tt('summary.reports')}</div></div>
        <div class="trk-stat-box"><div class="trk-stat-val warn">${totalReported.toLocaleString()}</div><div class="trk-stat-lbl">${tt('summary.reported_pi')}</div></div>
        <div class="trk-stat-box"><div class="trk-stat-val">${outgoing.length}</div><div class="trk-stat-lbl">${tt('summary.tx_count')}</div></div>
        <div class="trk-stat-box"><div class="trk-stat-val">${Math.round(totalOut).toLocaleString()}</div><div class="trk-stat-lbl">${tt('summary.total_sent')}</div></div>
      </div>`;
  }

  function renderMatchedSection(reports, payments) {
    if (reports.length === 0) { container.querySelector('#trk-matched-section').classList.add('hidden'); return; }
    const list = container.querySelector('#trk-matched-list');
    list.innerHTML = '';
    reports.forEach(r => {
      const matched = findMatchingTx(r, payments);
      const card = document.createElement('div');
      card.className = 'trk-tx-card matched';
      card.innerHTML = `
        <div class="trk-tx-top"><span>${tt('matched.victim_id')}: ${esc(r.victimId)}</span><span class="trk-tx-amount out">-${(r.amount||0).toLocaleString()} Pi</span></div>
        <div class="trk-tx-addr">${esc(r.date) || ''}</div>
        ${r.desc ? `<div class="trk-report-desc">"${esc(r.desc)}"</div>` : ''}
        ${matched.map(tx => `<div style="font-size:12px;color:#fbbf24;">${tt('matched.chain')}: ${parseFloat(tx.amount).toFixed(2)} Pi / ${formatDate(tx.created_at)}</div>`).join('')}`;
      list.appendChild(card);
    });
    container.querySelector('#trk-matched-section').classList.remove('hidden');
  }

  function renderTxList(wallet, reports, payments) {
    const list = container.querySelector('#trk-tx-list');
    list.innerHTML = '';
    if (payments.length === 0) { list.innerHTML = `<div class="trk-empty">${tt('search.no_tx')}</div>`; return; }
    payments.forEach(p => appendTxCard(list, wallet, p, reports));
  }

  function appendTxCard(list, wallet, p, reports) {
    const isOut       = p.from === wallet;
    const matchedRpts = findMatchingTxReports(p, reports);
    const isMatched   = matchedRpts.length > 0;
    const card = document.createElement('div');
    card.className = `trk-tx-card ${isMatched ? 'matched' : isOut ? 'outgoing' : 'incoming'}`;
    const counterpart = isOut ? p.to : p.from;
    const dirLabel    = isOut ? tt('tx.to') : tt('tx.from');
    const amtStr      = parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    card.innerHTML = `
      <div class="trk-tx-top"><span class="trk-tx-date">${formatDate(p.created_at)}</span><span class="trk-tx-amount ${isOut ? 'out' : 'in'}">${isOut ? '-' : '+'}${amtStr} Pi</span></div>
      <div class="trk-tx-dir">${dirLabel}</div>
      <div class="trk-tx-addr${counterpart ? ' trk-copy-addr' : ''}" ${counterpart ? `data-copy-addr="${esc(counterpart)}"` : ''}>${esc(counterpart) || '-'}</div>
      ${isMatched ? `<div class="trk-match-badge">⚠️ ${tt2('tx.match', { n: matchedRpts.length })}</div><div style="font-size:12px;color:#f87171;">${tt('tx.victims')}: ${matchedRpts.map(r => esc(r.victimId)).join(', ')}</div>` : ''}
      <div style="font-size:10px;color:#555;margin-top:4px;">${p.transaction_hash || p.id}</div>`;
    list.appendChild(card);
  }

  container.querySelector('#trk-tx-more').addEventListener('click', async () => {
    if (!pageCursor) return;
    const wallet = sInput.value.trim();
    const data   = await fetchPayments(wallet, pageCursor);
    pageCursor   = data.next;
    allPayments  = allPayments.concat(data.payments);
    const list   = container.querySelector('#trk-tx-list');
    data.payments.forEach(p => appendTxCard(list, wallet, p, currentReports));
    container.querySelector('#trk-tx-more').classList.toggle('hidden', !pageCursor);
  });

  // 수사자료 내보내기
  container.querySelector('#trk-export-btn')?.addEventListener('click', exportReport);

  async function exportReport() {
    const text = buildReportText();
    if (navigator.share) {
      try { await navigator.share({ title: tt('doc.title'), text }); return; } catch {}
    }
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); showToast(tt('export.toast')); return; } catch {}
    }
    showReportModal(text);
  }

  function showReportModal(text) {
    container.querySelector('#trk-report-text').value = text;
    container.querySelector('#trk-copy-msg').textContent = '';
    container.querySelector('#trk-report-modal').classList.remove('hidden');
  }

  container.querySelector('#trk-modal-close').addEventListener('click', () => {
    container.querySelector('#trk-report-modal').classList.add('hidden');
  });
  container.querySelector('#trk-copy-btn').addEventListener('click', async () => {
    const text  = container.querySelector('#trk-report-text').value;
    const msgEl = container.querySelector('#trk-copy-msg');
    try {
      await navigator.clipboard.writeText(text);
      msgEl.className = 'trk-msg ok'; msgEl.textContent = tt('export.copied');
    } catch {
      container.querySelector('#trk-report-text').select();
      msgEl.className = 'trk-msg'; msgEl.textContent = tt('export.manual');
    }
  });

  function buildReportText() {
    const now = new Date().toLocaleString();
    const wallet = currentWallet;
    const reports = currentReports;
    const payments = allPayments;
    const outgoing = payments.filter(p => p.from === wallet);
    const totalRep = reports.reduce((s, r) => s + (r.amount || 0), 0);
    const LINE = '═'.repeat(44);
    let text = LINE + '\n';
    text += `  ${tt('doc.title')}\n  ${tt('doc.generated')}: ${now}\n` + LINE + '\n\n';
    text += `■ ${tt('doc.wallet_sec')}\n  ${wallet}\n\n`;
    text += `■ ${tt('doc.reports_sec')}\n  ${tt('doc.count')}: ${reports.length}\n  ${tt('doc.total_pi')}: ${totalRep.toLocaleString()} Pi\n\n`;
    if (reports.length > 0) {
      text += `■ ${tt('doc.victims_sec')}\n`;
      reports.forEach((r, i) => {
        text += `  ${i+1}. ${tt('doc.victim_id')}: ${r.victimId}\n     ${tt('doc.damage')}: ${(r.amount||0).toLocaleString()} Pi\n     ${tt('doc.date')}: ${r.date||'-'}\n`;
        if (r.txHash) text += `     ${tt('doc.tx_hash')}: ${r.txHash}\n`;
        if (r.desc) text += `     ${tt('doc.situation')}: ${r.desc}\n`;
        text += '\n';
      });
    }
    text += `■ ${tt('doc.outgoing_sec')}\n`;
    if (outgoing.length === 0) { text += `  ${tt('doc.no_tx')}\n\n`; }
    else {
      outgoing.slice(0, 20).forEach(p => {
        const matched = findMatchingTxReports(p, reports);
        const mLabel = matched.length > 0 ? ` ${tt('doc.chain_match')}` : '';
        text += `  ${formatDate(p.created_at)}\n  → ${p.to}${mLabel}\n     ${tt('doc.amount')}: ${parseFloat(p.amount).toLocaleString(undefined,{minimumFractionDigits:2})} Pi\n     TX: ${p.transaction_hash||p.id}\n\n`;
      });
    }
    text += `■ ${tt('doc.submit_sec')}\n  ${tt('doc.police')}\n  ${tt('doc.pi_foundation')}\n\n`;
    text += `■ ${tt('doc.notes_sec')}\n  ${tt('doc.note1')}\n  ${tt('doc.note2')}\n  ${tt('doc.note3')}\n` + LINE + '\n';
    return text;
  }

  // ── 내 지갑 탭 ───────────────────────────────────────
  async function renderMyWalletTab() {
    const container2 = container.querySelector('#trk-mywallet-content');
    const wallets    = getHackWallets();
    const cloudBtnsHtml = `
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-backup" style="flex:1;font-size:11px;">☁️ ${tt('mywallet.cloud.backup')}</button>
        <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-restore" style="flex:1;font-size:11px;">📥 ${tt('mywallet.cloud.restore')}</button>
      </div>
      <p style="font-size:11px;color:#f0b429;margin:6px 0 0;line-height:1.5;opacity:0.85;">💡 ${tt('mywallet.backup.tip')}</p>`;

    if (!wallets.length) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:28px 16px;">
          <p style="color:#888;margin-bottom:16px;">${tt('mywallet.no_wallets')}</p>
          <button class="trk-btn-search" id="trk-hwt-add-first" style="width:auto;padding:0 24px;">+ ${tt('mywallet.add')}</button>
        </div>
        ${cloudBtnsHtml}`;
      container2.querySelector('#trk-hwt-add-first').addEventListener('click', () => showHackWalletAddDialog(renderMyWalletTab));
      bindCloudWallet(container2);
      return;
    }

    const active = getHackActiveWallet();
    setHackActiveId(active.id);

    container2.innerHTML = `
      <div class="trk-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;font-size:16px;">${tt('mywallet.title')}</h3>
          <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-refresh" style="width:auto;padding:0 12px;">↻ ${tt('mywallet.refresh')}</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          ${wallets.map(w => `
            <button class="trk-watch-chip${w.id === active.id ? ' active' : ''}" data-hwid="${w.id}">${esc(w.alias)}</button>`).join('')}
          <button id="trk-hwt-add-btn" style="padding:4px 12px;border-radius:20px;font-size:12px;border:1px dashed var(--border);background:transparent;color:#888;cursor:pointer;">
            + ${tt('mywallet.add')}
          </button>
        </div>
        ${cloudBtnsHtml}
      </div>
      <div id="trk-hwt-detail"></div>`;

    container2.querySelectorAll('[data-hwid]').forEach(btn => {
      btn.addEventListener('click', () => { setHackActiveId(btn.dataset.hwid); renderMyWalletTab(); });
    });
    container2.querySelector('#trk-hwt-add-btn').addEventListener('click', () => showHackWalletAddDialog(renderMyWalletTab));
    container2.querySelector('#trk-hwt-refresh').addEventListener('click', renderMyWalletTab);
    bindCloudWallet(container2);
    await loadHackWalletDetail(container2.querySelector('#trk-hwt-detail'), active, wallets);
  }

  function bindCloudWallet(root) {
    root.querySelector('#trk-hwt-backup')?.addEventListener('click', backupHackWallets);
    root.querySelector('#trk-hwt-restore')?.addEventListener('click', () => {
      showConfirmDialog(tt('mywallet.cloud.restore'), tt('mywallet.restore.warn'), () => restoreHackWallets(renderMyWalletTab));
    });
  }

  async function loadHackWalletDetail(detailEl, wallet, allWallets) {
    detailEl.innerHTML = `<p style="color:#888;font-size:13px;padding:8px 0;">${tt('mywallet.loading')}</p>`;
    try {
      const [account, paymentsData] = await Promise.all([
        fetchAccountMainnet(wallet.address),
        fetchPayments(wallet.address),
      ]);
      const payments    = paymentsData.payments;
      const subentries  = account.raw.subentry_count ?? 0;
      const minReserve  = (2 + subentries) * 0.5;
      const availablePi = Math.max(0, account.pi - minReserve);
      const tokensWithBal = account.tokens.filter(tok => parseFloat(tok.balance) > 0);

      const lpHtml = account.lpShares.length === 0
        ? `<p style="color:#888;">${tt('mywallet.no_lp')}</p>`
        : account.lpShares.map(s => `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span>${s.liquidity_pool_id.slice(0,14)}...</span><span>${parseFloat(s.balance).toFixed(6)} LP</span></div>`).join('');

      const txHtml = payments.length === 0
        ? `<p style="color:#888;">${tt('mywallet.tx_none')}</p>`
        : payments.map(p => hackWalletTxRowHtml(p, wallet)).join('');

      detailEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:10px;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#7dd3fc;margin-bottom:2px;">${esc(wallet.alias)}</div>
            <div class="trk-copy-addr" data-copy-addr="${esc(wallet.address)}" style="font-size:11px;color:#888;font-family:monospace;cursor:pointer;">${esc(wallet.address.slice(0,8))}···${esc(wallet.address.slice(-8))}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-edit-alias">✏️</button>
            ${allWallets.length > 1 ? `<button class="trk-btn-outline trk-btn-sm" id="trk-hwt-del">🗑️</button>` : ''}
          </div>
        </div>
        <div class="trk-section-label" style="margin-top:0;">π ${tt('mywallet.pi.total')}</div>
        <div class="trk-card">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700;"><span>${tt('mywallet.pi.total')}</span><span>${account.pi.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#22c55e;"><span>${tt('mywallet.pi.avail')}</span><span>${availablePi.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#f87171;"><span>${tt('mywallet.pi.reserve')}</span><span>~${minReserve.toFixed(2)} π</span></div>
        </div>
        ${tokensWithBal.length > 0 ? `<div class="trk-section-label">🪙 ${tt('mywallet.tokens')}</div><div class="trk-card">${tokensWithBal.map(tok => `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span>${tok.asset_code ?? tok.asset_type}</span><span>${parseFloat(tok.balance).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`).join('')}</div>` : ''}
        <div class="trk-section-label">📡 ${tt('mywallet.txs')}</div>
        <div style="padding-bottom:8px;">${txHtml}</div>
        <div class="trk-section-label">💧 ${tt('mywallet.lp')}</div>
        <div class="trk-card">${lpHtml}</div>
        <p style="font-size:10px;color:#666;text-align:center;margin-top:8px;">${tt('mywallet.updated')}: ${new Date().toLocaleTimeString()}</p>`;

      detailEl.querySelector('#trk-hwt-edit-alias')?.addEventListener('click', () => {
        showAliasDialog(wallet.id, wallet.alias, renderMyWalletTab);
      });
      detailEl.querySelector('#trk-hwt-del')?.addEventListener('click', () => {
        showConfirmDialog(tt('mywallet.delete'), tt('mywallet.delete.confirm'), () => {
          const remaining = getHackWallets().filter(w => w.id !== wallet.id);
          saveHackWallets(remaining);
          if (remaining.length) setHackActiveId(remaining[0].id);
          renderMyWalletTab();
        });
      });
    } catch (e) {
      detailEl.innerHTML = `<div class="trk-card"><p style="color:#f87171;font-size:13px;">${tt('mywallet.fail')}: ${e.message}</p></div>`;
    }
  }

  async function fetchAccountMainnet(address) {
    const res = await fetch(`${HORIZON}/accounts/${address}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error(tt('search.err.not_found'));
      throw new Error(`API error (${res.status})`);
    }
    const data     = await res.json();
    const pi       = data.balances.find(b => b.asset_type === 'native');
    const tokens   = data.balances.filter(b => b.asset_type !== 'native' && b.asset_type !== 'liquidity_pool_shares');
    const lpShares = data.balances.filter(b => b.asset_type === 'liquidity_pool_shares');
    return { pi: parseFloat(pi?.balance ?? 0), tokens, lpShares, raw: data };
  }

  function hackWalletTxRowHtml(p, wallet) {
    const isIn  = p.to === wallet.address;
    const other = isIn ? p.from : p.to;
    const short = other ? `${other.slice(0,6)}···${other.slice(-4)}` : '?';
    const amt   = parseFloat(p.amount ?? 0).toFixed(2);
    const date  = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
    const color = isIn ? '#22c55e' : '#f0b429';
    const dir   = isIn ? tt('mywallet.tx_recv') : tt('mywallet.tx_sent');
    const arrow = isIn ? '↙' : '↗';
    const myChip  = `<span style="background:rgba(255,255,255,0.10);padding:2px 7px;border-radius:4px;color:#7dd3fc;font-weight:600;">${esc(wallet.alias)}</span>`;
    const othChip = other
      ? `<span class="trk-copy-addr" data-copy-addr="${esc(other)}" style="background:rgba(255,255,255,0.06);padding:2px 7px;border-radius:4px;color:#999;font-family:monospace;cursor:pointer;">${esc(short)}</span>`
      : `<span style="background:rgba(255,255,255,0.06);padding:2px 7px;border-radius:4px;color:#999;font-family:monospace;">?</span>`;
    const fromChip = isIn ? othChip : myChip;
    const toChip   = isIn ? myChip  : othChip;
    return `
      <div style="border-left:3px solid ${color};padding:10px 12px;margin-bottom:8px;border-radius:0 8px 8px 0;background:rgba(255,255,255,0.03);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:600;color:${color};">${arrow} ${dir}</span>
          <span style="font-size:13px;font-weight:700;color:${color};">${amt} π</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;flex-wrap:wrap;">${fromChip}<span style="color:#555;font-size:13px;">──→</span>${toChip}</div>
        <div style="font-size:10px;color:#666;margin-top:4px;">${date}</div>
      </div>`;
  }

  async function backupHackWallets() {
    const key = piUser || piUid;
    if (!key || !db) { showToast(tt('mywallet.cloud.fail')); return; }
    try {
      await db.collection('pidex_wallets').doc(key).set({
        wallets: getHackWallets(), activeId: getHackActiveId(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast(tt('mywallet.cloud.ok'));
    } catch { showToast(tt('mywallet.cloud.fail')); }
  }

  async function restoreHackWallets(onRestored) {
    const key = piUser || piUid;
    if (!key || !db) { showToast(tt('mywallet.cloud.fail')); return; }
    try {
      const doc = await db.collection('pidex_wallets').doc(key).get();
      if (!doc.exists || !doc.data().wallets?.length) { showToast(tt('mywallet.cloud.no_data')); return; }
      const data = doc.data();
      saveHackWallets(data.wallets);
      if (data.activeId) setHackActiveId(data.activeId);
      else if (data.wallets[0]?.id) setHackActiveId(data.wallets[0].id);
      showToast(tt('mywallet.restore.ok'));
      onRestored();
    } catch { showToast(tt('mywallet.cloud.fail')); }
  }

  // ── 관심 지갑 탭 ─────────────────────────────────────
  function renderWatchTab() {
    const container2 = container.querySelector('#trk-watch-content');
    const list = getWatchList();

    container2.innerHTML = `
      <div class="trk-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="margin:0;">${tt('watch.title')}</h3>
          <span style="font-size:12px;color:#888;">${list.length}/${WATCH_MAX}</span>
        </div>
        <div id="trk-watch-list-rows">
          ${list.length === 0
            ? `<p style="color:#888;">${tt('watch.empty')}</p>`
            : (() => {
                const latest = getWatchLatest();
                return list.map(w => {
                  const lastSeen = latest[w.address] || 0;
                  const isNew = lastSeen > 0 && w.latestTxAt && w.latestTxAt > lastSeen;
                  return `
                    <div class="trk-watch-row">
                      <div>
                        <span class="trk-watch-alias">${esc(w.alias)}${isNew ? ' <span class="trk-new-badge">NEW</span>' : ''}</span>
                        <span class="trk-watch-addr trk-copy-addr" data-copy-addr="${esc(w.address)}">${esc(w.address.slice(0,8))}···${esc(w.address.slice(-6))}</span>
                      </div>
                      <button class="trk-watch-del-btn" data-wid="${w.id}">✕</button>
                    </div>`;
                }).join('');
              })()}
        </div>
        ${list.length < WATCH_MAX ? `<button class="trk-btn-outline" id="trk-btn-watch-add" style="width:100%;margin-top:12px;">+ ${tt('watch.add.btn')}</button>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="trk-btn-outline trk-btn-sm" id="trk-btn-watch-backup"  style="flex:1;font-size:11px;">☁️ ${tt('watch.cloud.backup')}</button>
        <button class="trk-btn-outline trk-btn-sm" id="trk-btn-watch-restore" style="flex:1;font-size:11px;">📥 ${tt('watch.cloud.restore')}</button>
      </div>
      ${list.length > 0 ? `
        <button class="trk-btn-search" id="trk-btn-watch-fetch" style="width:100%;margin-top:10px;">🔍 ${tt('watch.fetch.btn')}</button>
        <div id="trk-watch-results"></div>` : ''}`;

    container2.querySelector('#trk-btn-watch-backup')?.addEventListener('click', () => backupHackWatchList());
    container2.querySelector('#trk-btn-watch-restore')?.addEventListener('click', () => {
      showConfirmDialog(tt('watch.cloud.restore'), tt('watch.restore.warn'), () => restoreHackWatchList(renderWatchTab));
    });

    container2.querySelectorAll('.trk-watch-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = getWatchList().filter(w => w.id !== btn.dataset.wid);
        saveWatchList(updated);
        renderWatchTab();
      });
    });

    container2.querySelector('#trk-btn-watch-add')?.addEventListener('click', () => {
      showWatchAddDialog(() => renderWatchTab());
    });

    container2.querySelector('#trk-btn-watch-fetch')?.addEventListener('click', () => fetchWatchData());
  }

  function showWatchAddDialog(onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header"><span>${tt('ctx.watch.alias_title')}</span></div>
        <div style="padding:16px;">
          <input id="trk-w-addr" type="text" class="form-input mono" placeholder="${tt('watch.add.addr_ph')}" style="margin-bottom:8px;" />
          <input id="trk-w-alias" type="text" class="form-input" placeholder="${tt('ctx.watch.alias_ph')}" maxlength="20" />
          <div id="trk-w-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-w-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-w-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-w-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-w-save').onclick = () => {
      const addr  = overlay.querySelector('#trk-w-addr').value.trim();
      const alias = overlay.querySelector('#trk-w-alias').value.trim() || `${addr.slice(0,6)}···${addr.slice(-4)}`;
      const err   = overlay.querySelector('#trk-w-err');
      if (!addr || addr.length < 10) { err.textContent = tt('watch.add.err_addr'); return; }
      const cur = getWatchList();
      if (cur.some(w => w.address === addr)) { err.textContent = tt('ctx.watch.exists'); return; }
      if (cur.length >= WATCH_MAX) { err.textContent = tt('ctx.watch.full'); return; }
      cur.push({ id: genWatchId(), address: addr, alias });
      saveWatchList(cur);
      overlay.remove();
      onSaved();
    };
  }

  async function fetchWatchData() {
    const list = getWatchList();
    if (!list.length) return;
    const resultsEl = container.querySelector('#trk-watch-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = `<div style="color:#888;padding:12px;">⏳ ${tt('watch.fetch.loading')}</div>`;

    try {
      const addrSet = new Set(list.map(w => w.address));
      const results = await Promise.all(list.map(async w => {
        try {
          const res  = await fetch(`${HORIZON}/accounts/${w.address}/payments?order=desc&limit=50&include_failed=false`);
          const data = await res.json();
          return (data._embedded?.records || []).map(p => ({ ...p, _watchAlias: w.alias, _watchAddr: w.address }));
        } catch { return []; }
      }));

      const reportSnap = db ? await db.collection(REPORTS_COL)
        .where('suspectWallet', 'in', [...addrSet].slice(0, 10)).get() : null;
      const reportHits = new Set(reportSnap?.docs?.map(d => d.data().suspectWallet) || []);

      const allTxs  = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const internal = allTxs.filter(p => addrSet.has(p.from) && addrSet.has(p.to));

      const prevLatest = getWatchLatest();
      const newLatest  = { ...prevLatest };
      const newTxMap   = {};
      results.forEach((txs, i) => {
        const addr = list[i].address;
        const latestTx = txs[0]?.created_at ? new Date(txs[0].created_at).getTime() : 0;
        if (latestTx) {
          newTxMap[addr] = latestTx > (prevLatest[addr] || 0);
          newLatest[addr] = latestTx;
          const watchList = getWatchList();
          const idx = watchList.findIndex(w => w.address === addr);
          if (idx !== -1) { watchList[idx].latestTxAt = latestTx; saveWatchList(watchList); }
        }
      });
      saveWatchLatest(newLatest);

      const newHtml = list.filter(w => newTxMap[w.address]).map(w => `<div class="trk-watch-new-alert">🆕 ${esc(w.alias)} — ${tt('watch.new.tx')}</div>`).join('');
      const warnHtml = list.filter(w => reportHits.has(w.address)).map(w => `<div class="trk-watch-warn">⚠️ ${esc(w.alias)} — ${tt('watch.report.warn')}</div>`).join('');
      const internalHtml = internal.length === 0 ? `<p style="color:#888;">${tt('watch.no.internal')}</p>` : internal.map(p => watchTxRowHtml(p, true)).join('');
      const seen = new Set();
      const feedHtml = allTxs.filter(p => { const k = p.id || p.transaction_hash; if (seen.has(k)) return false; seen.add(k); return true; }).map(p => watchTxRowHtml(p, false)).join('');

      resultsEl.innerHTML = `
        ${newHtml}${warnHtml}
        <div class="trk-section-label warn">${tt('watch.internal.title')} (${internal.length})</div>
        ${internalHtml}
        <div class="trk-section-label" style="margin-top:16px;">${tt('watch.feed.title')} (${allTxs.length})</div>
        ${feedHtml || `<p style="color:#888;">${tt('watch.empty')}</p>`}`;
    } catch {
      resultsEl.innerHTML = `<div style="color:#f87171;">${tt('search.error')}</div>`;
    }
  }

  function watchTxRowHtml(p, isInternal) {
    const amount  = parseFloat(p.amount ?? 0).toFixed(2);
    const date    = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
    const fromShort = p.from ? `${p.from.slice(0,6)}···${p.from.slice(-4)}` : '?';
    const toShort   = p.to   ? `${p.to.slice(0,6)}···${p.to.slice(-4)}`   : '?';
    return `
      <div class="trk-tx-card ${isInternal ? 'matched' : ''}">
        <div class="trk-tx-top"><span class="trk-tx-date">${esc(p._watchAlias)} · ${date}</span><span class="trk-tx-amount out">${amount} Pi</span></div>
        <div style="font-size:11px;color:#888;margin-top:4px;">
          <span class="trk-copy-addr" data-copy-addr="${esc(p.from)}">${esc(fromShort)}</span>
          <span style="color:#555;margin:0 4px;">──→</span>
          <span class="trk-copy-addr" data-copy-addr="${esc(p.to)}">${esc(toShort)}</span>
        </div>
      </div>`;
  }

  async function backupHackWatchList() {
    const key = piUser || piUid;
    if (!key || !db) { showToast(tt('watch.cloud.fail')); return; }
    try {
      await db.collection('pidex_watch_list').doc(key).set({
        watchList: getWatchList(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast(tt('watch.cloud.ok'));
    } catch { showToast(tt('watch.cloud.fail')); }
  }

  async function restoreHackWatchList(onRestored) {
    const key = piUser || piUid;
    if (!key || !db) { showToast(tt('watch.cloud.fail')); return; }
    try {
      const doc = await db.collection('pidex_watch_list').doc(key).get();
      if (!doc.exists || !doc.data().watchList?.length) { showToast(tt('watch.cloud.no_data')); return; }
      saveWatchList(doc.data().watchList);
      showToast(tt('watch.restore.ok'));
      onRestored();
    } catch { showToast(tt('watch.cloud.fail')); }
  }

  // ── 주소 컨텍스트 메뉴 ───────────────────────────────
  let menuAddr = '', menuDismissing = false;

  function bindCopyAddr() {
    const menu = container.querySelector('#trk-addr-menu');

    container.addEventListener('click', (e) => {
      if (menuDismissing) { menuDismissing = false; return; }
      const el = e.target.closest('.trk-copy-addr');
      if (!el) { hideAddrMenu(); return; }
      const addr = el.dataset.copyAddr;
      if (!addr) return;
      e.stopPropagation();
      menuAddr = addr;
      updateAddrMenu();
      const rect = el.getBoundingClientRect();
      const menuW = 240;
      let left = Math.min(rect.left, window.innerWidth - menuW - 8);
      let top  = rect.bottom + 6;
      if (top + 130 > window.innerHeight) top = rect.top - 134;
      menu.style.left = `${Math.max(8, left)}px`;
      menu.style.top  = `${top}px`;
      menu.classList.remove('hidden');
    });

    container.addEventListener('touchstart', (e) => {
      if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('.trk-copy-addr')) {
        hideAddrMenu();
      }
    }, { passive: true });

    function updateAddrMenu() {
      const watch = getWatchList();
      const slots = WATCH_MAX - watch.length;
      const alreadyIn = inWatchList(menuAddr);
      container.querySelector('#trk-amenu-watch').textContent = alreadyIn ? `✅ ${tt('ctx.watch.exists')}` : `👁 ${tt('ctx.watch')} (${tt2('ctx.watch.slot', { n: slots })})`;
      container.querySelector('#trk-amenu-watch').disabled = alreadyIn || slots === 0;
      container.querySelector('#trk-amenu-pidex').textContent = `📥 ${tt('ctx.register.both')}`;
      container.querySelector('#trk-amenu-copy').textContent  = `📋 ${tt('toast.copied')}`;
    }

    container.querySelector('#trk-amenu-watch').addEventListener('click', () => { hideAddrMenu(); addToWatchList(menuAddr); });
    container.querySelector('#trk-amenu-pidex').addEventListener('click', () => { hideAddrMenu(); registerBoth(menuAddr); });
    container.querySelector('#trk-amenu-copy').addEventListener('click', () => {
      hideAddrMenu();
      navigator.clipboard.writeText(menuAddr).then(() => showToast(tt('toast.copied'))).catch(() => {});
    });
  }

  function hideAddrMenu() {
    container.querySelector('#trk-addr-menu').classList.add('hidden');
    menuAddr = '';
  }

  function addToWatchList(addr) {
    if (!addr) return;
    const list = getWatchList();
    if (inWatchList(addr)) { showToast(tt('ctx.watch.exists')); return; }
    if (list.length >= WATCH_MAX) { showToast(tt('ctx.watch.full')); return; }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header"><span>${tt('ctx.watch.alias_title')}</span></div>
        <div style="padding:16px;">
          <div style="font-size:11px;color:#888;font-family:monospace;margin-bottom:12px;word-break:break-all;">${esc(addr)}</div>
          <input id="trk-watch-alias-input" type="text" class="form-input" placeholder="${tt('ctx.watch.alias_ph')}" maxlength="20" />
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-watch-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-watch-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-watch-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-watch-save').onclick = () => {
      const alias = overlay.querySelector('#trk-watch-alias-input').value.trim() || `${addr.slice(0,6)}···${addr.slice(-4)}`;
      const updated = getWatchList();
      if (updated.length >= WATCH_MAX || inWatchList(addr)) { overlay.remove(); return; }
      updated.push({ id: genWatchId(), address: addr, alias });
      saveWatchList(updated);
      showToast(`👁 ${alias} ${tt('ctx.watch.added')}`);
      overlay.remove();
    };
  }

  async function registerBoth(addr) {
    if (!piUser) { showToast(tt('ctx.pidex.no_login')); return; }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header"><span>${tt('ctx.both.alias_title')}</span></div>
        <div style="padding:16px;">
          <div style="font-size:11px;color:#888;font-family:monospace;margin-bottom:12px;word-break:break-all;">${esc(addr)}</div>
          <input id="trk-both-alias" type="text" class="form-input" placeholder="${tt('ctx.both.alias_ph')}" maxlength="20" />
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-both-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-both-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-both-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-both-save').onclick = async () => {
      const alias = overlay.querySelector('#trk-both-alias').value.trim() || `★${addr.slice(0,6)}···${addr.slice(-4)}`;
      overlay.remove();
      const hackWallets = getHackWallets();
      if (!hackWallets.some(w => w.address === addr)) {
        hackWallets.push({ id: genHackWalletId(), address: addr, alias, addedAt: Date.now() });
        saveHackWallets(hackWallets);
      }
      if (db) {
        try {
          const docRef  = db.collection('pidex_pending_wallets').doc(piUser);
          const doc     = await docRef.get();
          const pdxList = doc.exists ? (doc.data().wallets || []) : [];
          if (!pdxList.some(w => w.address === addr)) {
            pdxList.push({ address: addr, alias, addedAt: Date.now() });
            await docRef.set({ wallets: pdxList });
          }
          showToast(tt('ctx.both.sent'));
        } catch { showToast(tt('ctx.both.fail')); }
      }
    };
  }

  // ── 유틸 다이얼로그 ───────────────────────────────────
  function showHackWalletAddDialog(onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:340px;">
        <div class="modal-header"><span>${tt('mywallet.add.title')}</span><button class="modal-close" id="trk-add-x">✕</button></div>
        <div style="padding:16px;">
          <label style="font-size:12px;display:block;margin-bottom:4px;">${tt('mywallet.add.alias_ph')}</label>
          <input type="text" id="trk-add-alias" class="form-input" placeholder="${tt('mywallet.add.alias_ph')}" style="margin-bottom:10px;" />
          <label style="font-size:12px;display:block;margin-bottom:4px;">${tt('mywallet.add.addr_ph')}</label>
          <input type="text" id="trk-add-addr" class="form-input mono" placeholder="G..." />
          <p id="trk-add-err" style="color:#f87171;font-size:11px;margin-top:6px;min-height:16px;"></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-add-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-add-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-add-x').onclick      = () => overlay.remove();
    overlay.querySelector('#trk-add-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-add-save').onclick   = () => {
      const addr  = overlay.querySelector('#trk-add-addr').value.trim();
      const alias = overlay.querySelector('#trk-add-alias').value.trim() || `Wallet ${getHackWallets().length + 1}`;
      const errEl = overlay.querySelector('#trk-add-err');
      if (!addr.startsWith('G') || addr.length !== 56) { errEl.textContent = tt('mywallet.add.err_addr'); return; }
      if (getHackWallets().some(w => w.address === addr)) { errEl.textContent = tt('mywallet.add.err_dup'); return; }
      const wallet  = { id: genHackWalletId(), address: addr, alias };
      const wallets = getHackWallets();
      wallets.push(wallet);
      saveHackWallets(wallets);
      setHackActiveId(wallet.id);
      overlay.remove();
      onSaved();
    };
  }

  function showAliasDialog(walletId, currentAlias, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:300px;">
        <div class="modal-header"><span>${tt('mywallet.alias.edit')}</span><button class="modal-close" id="trk-ea-x">✕</button></div>
        <div style="padding:16px;">
          <input type="text" id="trk-ea-input" class="form-input" value="${esc(currentAlias)}" />
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-ea-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-ea-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-ea-x').onclick      = () => overlay.remove();
    overlay.querySelector('#trk-ea-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-ea-input').select();
    overlay.querySelector('#trk-ea-save').onclick   = () => {
      const alias = overlay.querySelector('#trk-ea-input').value.trim();
      if (!alias) return;
      const wallets = getHackWallets();
      const idx     = wallets.findIndex(w => w.id === walletId);
      if (idx !== -1) { wallets[idx].alias = alias; saveHackWallets(wallets); }
      overlay.remove();
      onSaved();
    };
  }

  function showConfirmDialog(title, body, onConfirmed) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:300px;">
        <div class="modal-header"><span>${title}</span><button class="modal-close" id="trk-dlg-x">✕</button></div>
        <div style="padding:16px;">
          <p style="font-size:13px;margin-bottom:16px;line-height:1.5;">${body}</p>
          <div style="display:flex;gap:8px;">
            <button class="btn-outline" id="trk-dlg-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-dlg-ok" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-dlg-x').onclick      = () => overlay.remove();
    overlay.querySelector('#trk-dlg-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-dlg-ok').onclick     = () => { overlay.remove(); onConfirmed(); };
  }

  // ── 매칭 로직 ────────────────────────────────────────
  function findMatchingTx(report, payments) {
    const rAmt = report.amount || 0;
    const rDate = new Date(report.date).getTime();
    return payments.filter(p => {
      const txAmt  = parseFloat(p.amount || 0);
      const txDate = new Date(p.created_at).getTime();
      return Math.abs(txAmt - rAmt) <= 1 && Math.abs(txDate - rDate) <= 2 * 86400000;
    });
  }

  function findMatchingTxReports(tx, reports) {
    const txAmt  = parseFloat(tx.amount || 0);
    const txDate = new Date(tx.created_at).getTime();
    return reports.filter(r => {
      const rAmt  = r.amount || 0;
      const rDate = new Date(r.date).getTime();
      return Math.abs(txAmt - rAmt) <= 1 && Math.abs(txDate - rDate) <= 2 * 86400000;
    });
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ── 초기화 ───────────────────────────────────────────
  bindCopyAddr();
  loadReportList();
}
