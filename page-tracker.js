import { t, getLang } from './util-i18n.js';
import { computeFifoLots, computeMovingAvgLots } from './tax-lots.js';
import { currentAccessToken } from './pi-sdk.js';

const HORIZON      = 'https://api.mainnet.minepi.com';
const REPORTS_COL  = 'hack_reports';
const CEX_DB       = new Map([]);

// 언어 변경 시 트래커가 다시 렌더링되어도 보던 탭을 유지하기 위한 상태
let lastTrackerTab = 'list';

function getDb() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
  return firebase.firestore();
}

// ── tracker 로컬 번역 (18개 언어) ──────
const TT = {
  ko: {
    'tab.report': '신고하기', 'tab.search': '지갑 조회', 'tab.mywallet': '내 지갑', 'tab.watch': '관심 지갑', 'tab.ledger': '장부',
    'ledger.title': '지갑 장부 (월별/연별)', 'ledger.loading': '내역을 불러오는 중...', 'ledger.empty': '거래 내역이 없습니다.',
    'ledger.in': '입금', 'ledger.out': '출금', 'ledger.net': '순증감', 'ledger.year_total': '연간 합계',
    'ledger.export': '📤 CSV 내보내기', 'ledger.refresh': '↻ 새로고침',
    'ledger.note': '⚠️ 이 장부는 처음 연 시점부터의 지갑 입출금 내역을 수집합니다. 2027년 과세 연도부터는 그 해 1월 1일까지 자동으로 소급해서 채웁니다. 실제 세무 신고 시엔 거래소 매수 체결내역을 취득가액의 근거로 사용하세요 — 이 장부는 지갑의 입출금 흐름 참고용입니다.',
    'ledger.fail': '내역을 불러오지 못했습니다.', 'ledger.counterpart_all': '상대 지갑 (선택 안 하면 전체 표시)',
    'ledger.mode_combined': '합계', 'ledger.mode_individual': '개별',
    'ledger.incomplete_warn': '이 지갑은 거래량이 많아 올해 1월 1일까지 전부 자동으로 불러오지 못했습니다. 관리자에게 문의해주세요 (상한을 올려 다시 동기화해드릴 수 있습니다).',
    'tab.tax': '세금계산',
    'tax.title': '세금계산 (FIFO / 이동평균법)',
    'tax.loading': '거래 내역을 불러오는 중...', 'tax.syncing': '⏳ 스왑 내역 동기화 중...',
    'tax.method.fifo': '선입선출법 (FIFO)', 'tax.method.moving_avg': '이동평균법',
    'tax.method.hint': '거래소(가상자산사업자)를 경유한 거래는 법적으로 이동평균법, 개인지갑·비수탁 DEX는 선입선출법이 적용됩니다.',
    'tax.method.unset': '미태그', 'tax.method.fifo_short': 'FIFO', 'tax.method.avg_short': '이동평균',
    'tax.untagged_hint': '아직 태그되지 않은 상대 지갑이에요. 태그하면 계산 대상에 포함할 수 있어요.',
    'tax.tag_now': '태그하기', 'tax.tag_dialog.title': '거래 방식 지정',
    'tax.disposal.date': '일시', 'tax.disposal.qty': '수량', 'tax.disposal.proceeds': '처분가액',
    'tax.disposal.cost': '취득원가', 'tax.disposal.gain': '손익',
    'tax.no_price': '⚠️ 가격 미확인 {n}건 — 계산에서 제외됨',
    'tax.manual_price.edit': '단가 수동 입력', 'tax.manual_price.auto': '자동 조회가',
    'tax.note': '⚠️ 이 계산은 참고용입니다. 실제 세무 신고 전엔 반드시 세무사와 확인하세요.',
    'tax.report.title': '세무서 제출용 보고서', 'tax.report.select_wallets': '포함할 상대 지갑 선택',
    'tax.report.self_swap': 'DEX 자체 스왑 (선입선출)', 'tax.report.date_from': '시작일', 'tax.report.date_to': '종료일',
    'tax.report.generate': '보고서 생성',
    'tax.report.no_selection': '지갑을 하나 이상 선택하세요.',
    'tax.report.method_label': '적용 방식', 'tax.report.period_label': '기간', 'tax.report.wallets_label': '포함된 상대 지갑',
    'tax.report.total_gain': '총 손익', 'tax.report.export': '📤 보고서 CSV 내보내기',
    'report.title': '🚨 피해 신고', 'report.realname_warn': "⚠️ 본 신고는 <strong>실명제</strong>로 운영됩니다.<br>Pi 계정으로 로그인한 본인만 신고할 수 있으며,<br>허위 신고 시 법적 책임이 따를 수 있습니다.", 'report.victim_id': '피해자 Pi ID', 'report.suspect_wallet': '의심 지갑 주소',
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
    'mywallet.load.fail': '서버에서 내 지갑 목록을 불러오지 못했습니다.',
    'mywallet.not_activated': '이 지갑은 아직 Pi 메인넷에서 활성화되지 않았습니다. (Pi를 받은 적이 없으면 계정이 생성되지 않아요)',
    'mywallet.not_activated.confirm': "그래도 추가하시겠습니까?",
    'mywallet.not_activated.icon_title': "비활성 지갑 (Pi를 받은 적 없음)",
    'mywallet.max_hint': '최대 {n}개',
    'mywallet.pi.total': 'π 총 잔액', 'mywallet.pi.avail': '사용 가능', 'mywallet.pi.reserve': '최소 보유 (예상)',
    'mywallet.tokens': '보유 토큰', 'mywallet.txs': '최근 거래', 'mywallet.lp': 'LP 포지션',
    'mywallet.lock.title': "잠금 잔액",
    'mywallet.lock.total': "잠긴 금액",
    'mywallet.lock.claimable': "청구 가능",
    "backup.title": "백업 / 복구",
    "backup.load_fail": "슬롯을 불러오지 못했습니다",
    "backup.empty": "비어있음",
    "backup.slot": "슬롯 {n}",
    "backup.slot_info": "{n}개 · {date}",
    "backup.btn.full_backup": "전체 백업",
    "backup.btn.append_backup": "추가 백업",
    "backup.btn.full_restore": "전체 복원",
    "backup.btn.append_restore": "추가 복원",
    "backup.saved": "백업 완료",
    "backup.fail": "오류가 발생했습니다",
    "backup.confirm.overwrite": "슬롯 {n}의 기존 기록이 삭제되고 현재 목록으로 교체됩니다. 계속할까요?",
    "backup.confirm.save": "슬롯 {n}에 현재 목록을 백업합니다.",
    "backup.confirm.truncate": "최대 {n}개까지만 저장되고 {dropped}개는 제외됩니다. 계속할까요?",
    "backup.confirm.restore_full": "현재 목록이 모두 지워지고 슬롯 {n}의 내용으로 교체됩니다. 계속할까요?",
    'mywallet.no_lp': 'LP 없음', 'mywallet.tx_none': '거래 내역 없음', 'mywallet.updated': '업데이트',
    'mywallet.tx_sent': '전송', 'mywallet.tx_recv': '수신',
    'mywallet.add.title': '지갑 추가', 'mywallet.add.alias_ph': '별칭 (예: 메인 지갑)',
    'mywallet.add.addr_ph': '지갑 주소 (G...)', 'mywallet.add.err_addr': '주소 형식 오류 (G로 시작, 56자)',
    'mywallet.add.err_dup': '이미 등록된 주소입니다.', 'mywallet.add.err_full': '내 지갑이 이미 30개입니다. 정리 후 다시 시도해주세요.',
    'mywallet.alias.edit': '별칭 수정', 'mywallet.delete': '지갑 삭제',
    'mywallet.delete.confirm': '이 지갑을 삭제하시겠습니까?',
    'mywallet.cloud.fail': '서버 오류가 발생했습니다.',
    'watch.title': '관심 지갑 추적', 'watch.empty': '관심 지갑이 없습니다.',
    'watch.load.fail': '서버에서 관심 지갑 목록을 불러오지 못했습니다.',
    'watch.max_hint': '(최대 {n}개)',
    'watch.add.btn': '지갑 추가', 'watch.add.addr_ph': '지갑 주소 (G...)',
    'watch.add.err_addr': '주소를 확인해주세요.', 'watch.fetch.btn': '🔍 전체 조회',
    'watch.fetch.loading': '조회 중...', 'watch.internal.title': '🔄 내부 거래',
    'watch.feed.title': '📡 전체 피드', 'watch.no.internal': '내부 거래 없음',
    'watch.new.tx': '새 거래 감지', 'watch.report.warn': '신고된 지갑',
    'watch.cloud.fail': '서버 오류가 발생했습니다.',
    "backup.alias_conflict.title": "별칭 충돌",
    "backup.alias_conflict.desc": "{n}개 주소의 별칭이 현재와 다릅니다. 어떤 별칭을 사용할까요?",
    "backup.alias_conflict.keep_latest": "최신 별칭 유지 (권장)",
    "backup.alias_conflict.use_backup": "백업 시점 별칭 사용",
    "ctx.trade": "지갑별칭에 추가",
    "tab.trade": "지갑별칭",
    "trade.title": "지갑별칭",
    "trade.desc": "등록해두면 거래내역에서 이 주소가 별칭으로 표시됩니다.",
    "trade.empty": "등록된 지갑별칭이 없습니다.",
    "trade.add.title": "지갑별칭 추가",
    "trade.add.err_full": "지갑별칭이 이미 {n}개입니다. 정리 후 다시 시도해주세요.",
    'cex.estimated': '거래소 (추정)',
    'ctx.watch': '관심 지갑 추가', 'ctx.watch.slot': '여유 {n}개', 'ctx.watch.exists': '이미 추가됨',
    'ctx.watch.full': '관심 지갑이 가득 찼습니다 (최대 10개)', 'ctx.watch.alias_title': '별칭 입력',
    'ctx.watch.alias_ph': '별칭 (선택)', 'ctx.watch.added': '추가됨',
    'ctx.register.both': '파이덱스 유틸 테스트넷지갑에 등록', 'ctx.both.alias_title': '별칭 입력',
    'ctx.both.alias_ph': '별칭 (선택)', 'ctx.both.sent': '✅ 등록 완료', 'ctx.both.fail': '등록 실패',
    'ctx.both.dup': '이미 등록된 주소입니다', 'ctx.both.full': '테스트넷 지갑이 이미 {n}개입니다. 파이덱스 유틸 앱에서 슬롯을 비운 후 다시 시도해주세요.',
    'ctx.pidex.no_login': 'Pi 로그인이 필요합니다.',
    'ctx.cancel': '취소', 'ctx.save': '저장',
    'ctx.continue': "계속",
    'toast.copied': '복사됨',
  },
  en: {
    'tab.report': 'Report', 'tab.search': 'Wallet Search', 'tab.mywallet': 'My Wallet', 'tab.watch': 'Watch List', 'tab.ledger': 'Ledger',
    'ledger.title': 'Wallet Ledger (Monthly/Yearly)', 'ledger.loading': 'Loading history...', 'ledger.empty': 'No transactions.',
    'ledger.in': 'In', 'ledger.out': 'Out', 'ledger.net': 'Net', 'ledger.year_total': 'Year Total',
    'ledger.export': '📤 Export CSV', 'ledger.refresh': '↻ Refresh',
    'ledger.note': '⚠️ This ledger collects wallet in/out history starting from when you first open it. From tax year 2027 onward, it automatically backfills to January 1st of that year. For actual tax filing, use your exchange trade records as the basis for acquisition cost — this ledger is for reference on wallet in/out flow only.',
    'ledger.fail': 'Failed to load history.', 'ledger.counterpart_all': 'Counterparty (shows all if none selected)',
    'ledger.mode_combined': 'Combined', 'ledger.mode_individual': 'Individual',
    'ledger.incomplete_warn': 'This wallet has too much activity to fully sync back to January 1st this year automatically. Please contact the admin (the sync limit can be raised and re-run for you).',
    'tab.tax': 'Tax Calc',
    'tax.title': 'Tax Calculation (FIFO / Moving Average)',
    'tax.loading': 'Loading transaction history...', 'tax.syncing': '⏳ Syncing swap history...',
    'tax.method.fifo': 'FIFO', 'tax.method.moving_avg': 'Moving Average',
    'tax.method.hint': 'By law, transactions routed through a licensed exchange use the moving-average method; personal wallets and non-custodial DEX use FIFO.',
    'tax.method.unset': 'Untagged', 'tax.method.fifo_short': 'FIFO', 'tax.method.avg_short': 'Moving Avg',
    'tax.untagged_hint': 'This counterparty wallet is not tagged yet. Tag it to include it in the calculation.',
    'tax.tag_now': 'Tag now', 'tax.tag_dialog.title': 'Set Costing Method',
    'tax.disposal.date': 'Date', 'tax.disposal.qty': 'Qty', 'tax.disposal.proceeds': 'Proceeds',
    'tax.disposal.cost': 'Cost Basis', 'tax.disposal.gain': 'Gain/Loss',
    'tax.no_price': '⚠️ {n} entries with no price — excluded from calculation',
    'tax.manual_price.edit': 'Set manual price', 'tax.manual_price.auto': 'Auto price',
    'tax.note': '⚠️ This calculation is for reference only. Confirm with a tax professional before actual filing.',
    'tax.report.title': 'Report for Tax Filing', 'tax.report.select_wallets': 'Select counterparty wallets to include',
    'tax.report.self_swap': 'Self DEX swap (FIFO)', 'tax.report.date_from': 'From', 'tax.report.date_to': 'To',
    'tax.report.generate': 'Generate Report',
    'tax.report.no_selection': 'Select at least one wallet.',
    'tax.report.method_label': 'Method Used', 'tax.report.period_label': 'Period', 'tax.report.wallets_label': 'Included Counterparty Wallets',
    'tax.report.total_gain': 'Total Gain/Loss', 'tax.report.export': '📤 Export Report CSV',
    'report.title': '🚨 Report Hack', 'report.realname_warn': "⚠️ This report is operated under a <strong>real-name policy</strong>.<br>Only the logged-in Pi account holder can file a report,<br>and false reports may carry legal liability.", 'report.victim_id': 'Victim Pi ID', 'report.suspect_wallet': 'Suspect Wallet Address',
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
    'mywallet.load.fail': 'Could not load your wallet list from the server.',
    'mywallet.not_activated': 'This wallet has not been activated on Pi mainnet yet. (An account is only created after it receives Pi at least once)',
    'mywallet.not_activated.confirm': "Add it anyway?",
    'mywallet.not_activated.icon_title': "Inactive wallet (never received Pi)",
    'mywallet.max_hint': 'Max {n}',
    'mywallet.pi.total': 'π Total Balance', 'mywallet.pi.avail': 'Available', 'mywallet.pi.reserve': 'Min Reserve (est.)',
    'mywallet.tokens': 'Tokens', 'mywallet.txs': 'Recent Transactions', 'mywallet.lp': 'LP Positions',
    'mywallet.lock.title': "Locked Balance",
    'mywallet.lock.total': "Locked Amount",
    'mywallet.lock.claimable': "Claimable Now",
    "backup.title": "Backup / Restore",
    "backup.load_fail": "Could not load slots",
    "backup.empty": "Empty",
    "backup.slot": "Slot {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Full Backup",
    "backup.btn.append_backup": "Append Backup",
    "backup.btn.full_restore": "Full Restore",
    "backup.btn.append_restore": "Append Restore",
    "backup.saved": "Backup saved",
    "backup.fail": "An error occurred",
    "backup.confirm.overwrite": "Slot {n}'s existing data will be deleted and replaced with the current list. Continue?",
    "backup.confirm.save": "Back up the current list to Slot {n}.",
    "backup.confirm.truncate": "Only up to {n} will be saved and {dropped} will be dropped. Continue?",
    "backup.confirm.restore_full": "The current list will be cleared and replaced with Slot {n}. Continue?",
    'mywallet.no_lp': 'No LP positions', 'mywallet.tx_none': 'No transactions', 'mywallet.updated': 'Updated',
    'mywallet.tx_sent': 'Sent', 'mywallet.tx_recv': 'Received',
    'mywallet.add.title': 'Add Wallet', 'mywallet.add.alias_ph': 'Alias (e.g. Main Wallet)',
    'mywallet.add.addr_ph': 'Wallet Address (G...)', 'mywallet.add.err_addr': 'Invalid address (starts with G, 56 chars)',
    'mywallet.add.err_dup': 'This address is already registered.', 'mywallet.add.err_full': 'My Wallet list is full (30). Remove one and try again.',
    'mywallet.alias.edit': 'Edit Alias', 'mywallet.delete': 'Delete Wallet',
    'mywallet.delete.confirm': 'Are you sure you want to delete this wallet?',
    'mywallet.cloud.fail': 'A server error occurred.',
    'watch.title': 'Watch List', 'watch.empty': 'No wallets in watch list.',
    'watch.load.fail': 'Could not load your watch list from the server.',
    'watch.max_hint': '(max {n})',
    'watch.add.btn': 'Add Wallet', 'watch.add.addr_ph': 'Wallet address (G...)',
    'watch.add.err_addr': 'Please check the address.', 'watch.fetch.btn': '🔍 Fetch All',
    'watch.fetch.loading': 'Fetching...', 'watch.internal.title': '🔄 Internal Transfers',
    'watch.feed.title': '📡 Full Feed', 'watch.no.internal': 'No internal transfers',
    'watch.new.tx': 'New transaction detected', 'watch.report.warn': 'Reported wallet',
    'watch.cloud.fail': 'A server error occurred.',
    "backup.alias_conflict.title": "Alias Conflict",
    "backup.alias_conflict.desc": "{n} address(es) have a different alias than your current setup. Which should be used?",
    "backup.alias_conflict.keep_latest": "Keep Latest Alias (Recommended)",
    "backup.alias_conflict.use_backup": "Use Backup-Time Alias",
    "ctx.trade": "Add Wallet Alias",
    "tab.trade": "Wallet Alias",
    "trade.title": "Wallet Aliases",
    "trade.desc": "Registered addresses will be shown with their alias in transaction lists.",
    "trade.empty": "No wallet aliases registered.",
    "trade.add.title": "Add Wallet Alias",
    "trade.add.err_full": "You already have {n} wallet aliases. Please remove some and try again.",
    'cex.estimated': 'Exchange (est.)',
    'ctx.watch': 'Add to Watch List', 'ctx.watch.slot': '{n} slots left', 'ctx.watch.exists': 'Already added',
    'ctx.watch.full': 'Watch list is full (max 10)', 'ctx.watch.alias_title': 'Enter Alias',
    'ctx.watch.alias_ph': 'Alias (optional)', 'ctx.watch.added': 'Added',
    'ctx.register.both': 'Register to PiDEX Util Testnet Wallet', 'ctx.both.alias_title': 'Enter Alias',
    'ctx.both.alias_ph': 'Alias (optional)', 'ctx.both.sent': '✅ Registered', 'ctx.both.fail': 'Registration failed',
    'ctx.both.dup': 'Already registered', 'ctx.both.full': 'Testnet wallet list is full ({n}). Free up a slot in the PiDEX Util app and try again.',
    'ctx.pidex.no_login': 'Pi login required.',
    'ctx.cancel': 'Cancel', 'ctx.save': 'Save',
    'ctx.continue': "Continue",
    'toast.copied': 'Copied',
  },
  zh: {
    "tab.report": "举报",
    "tab.search": "钱包查询",
    "tab.mywallet": "我的钱包",
    "tab.watch": "关注钱包", "tab.ledger": "账本",
    "ledger.title": "钱包账本（按月/年）", "ledger.loading": "正在加载记录...", "ledger.empty": "没有交易记录。",
    "ledger.in": "收入", "ledger.out": "支出", "ledger.net": "净额", "ledger.year_total": "年度合计",
    "ledger.export": "📤 导出CSV", "ledger.refresh": "↻ 刷新",
    "ledger.note": "⚠️ 此账本从您第一次打开时开始收集钱包收支记录。从2027纳税年度起，将自动追溯补齐到当年1月1日。实际报税时请以交易所的成交记录作为取得成本的依据——此账本仅供钱包收支流水参考。",
    "ledger.fail": "加载记录失败。", "ledger.counterpart_all": "对方钱包（不选则显示全部）",
    "ledger.mode_combined": "合计", "ledger.mode_individual": "个别",
    "ledger.incomplete_warn": "该钱包交易量过大，未能自动同步到今年1月1日。请联系管理员（可以提高上限后为您重新同步）。",
    "tab.tax": "税务计算",
    "tax.title": "税务计算（先进先出法 / 移动平均法）",
    "tax.loading": "正在加载交易记录...", "tax.syncing": "⏳ 正在同步兑换记录...",
    "tax.method.fifo": "先进先出法 (FIFO)", "tax.method.moving_avg": "移动平均法",
    "tax.method.hint": "根据法律，通过交易所（虚拟资产业者）进行的交易适用移动平均法，个人钱包和非托管DEX适用先进先出法。",
    "tax.untagged_hint": "这是尚未标记的对方钱包。标记后即可将其纳入计算。",
    "tax.method.unset": "未标记", "tax.method.fifo_short": "先进先出", "tax.method.avg_short": "移动平均",
    "tax.tag_now": "立即标记", "tax.tag_dialog.title": "设置计算方式",
    "tax.disposal.date": "日期", "tax.disposal.qty": "数量", "tax.disposal.proceeds": "处置金额",
    "tax.disposal.cost": "取得原价", "tax.disposal.gain": "损益",
    "tax.no_price": "⚠️ 有 {n} 笔价格未确认 — 已从计算中排除",
    "tax.manual_price.edit": "手动输入单价", "tax.manual_price.auto": "自动查询价",
    "tax.note": "⚠️ 此计算仅供参考。正式报税前请务必与税务师确认。",
    "tax.report.title": "报税用报告", "tax.report.select_wallets": "选择要包含的对方钱包",
    "tax.report.self_swap": "DEX自我兑换（先进先出法）", "tax.report.date_from": "起始日期", "tax.report.date_to": "结束日期",
    "tax.report.generate": "生成报告",
    "tax.report.no_selection": "请至少选择一个钱包。",
    "tax.report.method_label": "适用方式", "tax.report.period_label": "期间", "tax.report.wallets_label": "包含的对方钱包",
    "tax.report.total_gain": "总损益", "tax.report.export": "📤 导出报告CSV",
    "report.title": "🚨 举报诈骗",
    'report.realname_warn': "⚠️ 本举报采用<strong>实名制</strong>运营。<br>只有登录的Pi账户本人才能举报，<br>虚假举报可能承担法律责任。",
    "report.victim_id": "受害者 Pi ID",
    "report.suspect_wallet": "嫌疑钱包地址",
    "report.amount": "损失金额 (Pi)",
    "report.date": "事件日期",
    "report.txhash": "交易哈希（可选）",
    "report.desc": "情况说明（可选）",
    "report.btn": "提交举报",
    "report.btn.loading": "提交中...",
    "report.success": "✅ 举报已提交。",
    "report.err.required": "请填写所有必填项。",
    "report.err.wallet": "钱包地址格式不正确（以G开头，56位）。",
    "report.err.generic": "发生错误，请重试。",
    "presearch.title": "举报前预先查询",
    "presearch.placeholder": "输入嫌疑钱包地址...",
    "presearch.warn.not_wallet": "请输入以G开头的钱包地址。",
    "presearch.hint.short": "请至少输入4个字符。",
    "presearch.loading": "查询中...",
    "presearch.none": "没有已有的举报记录。",
    "presearch.found": "已有 {n} 条举报记录。",
    "search.title": "🔍 钱包查询",
    "search.placeholder": "输入钱包地址 (G...)",
    "search.btn": "查询",
    "search.no_tx": "无交易记录",
    "search.err.fail": "查询失败",
    "search.err.not_found": "找不到该钱包。",
    "search.error": "查询时发生错误。",
    "list.title": "🗂️ 举报列表",
    "list.filter": "搜索钱包/受害者ID...",
    "list.count": "举报",
    "list.loading": "加载中...",
    "list.empty": "暂无举报记录。",
    "list.search_btn": "查询",
    "list.wallet": "嫌疑钱包：",
    "summary.reports": "举报数",
    "summary.reported_pi": "损失总额",
    "summary.tx_count": "发送笔数",
    "summary.total_sent": "总发送额",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} 条举报匹配",
    "tx.victims": "受害者",
    "risk.safe": "安全",
    "risk.low": "注意",
    "risk.mid": "危险",
    "risk.high": "非常危险",
    "matched.victim_id": "受害者",
    "matched.chain": "链上匹配",
    "top10.title": "举报最多的钱包 TOP 10",
    "top10.cases": "件",
    "verify.btn": "确认目击",
    "verify.done": "已确认",
    "verify.mine": "我的举报",
    "verify.confirmed": " 人确认",
    "verify.toast": "目击确认已登记。",
    "export.toast": "已复制到剪贴板。",
    "export.copied": "✅ 已复制",
    "export.manual": "请全选后复制。",
    "doc.title": "Pi 诈骗调查资料",
    "doc.generated": "生成时间",
    "doc.wallet_sec": "嫌疑钱包",
    "doc.reports_sec": "举报现状",
    "doc.count": "举报数",
    "doc.total_pi": "损失总额",
    "doc.victims_sec": "受害者列表",
    "doc.victim_id": "受害者ID",
    "doc.damage": "损失额",
    "doc.date": "事件日期",
    "doc.tx_hash": "交易哈希",
    "doc.situation": "情况",
    "doc.outgoing_sec": "发送交易记录",
    "doc.no_tx": "无",
    "doc.chain_match": "★ 与举报一致",
    "doc.amount": "金额",
    "doc.cex_sec": "CEX转账现状",
    "doc.verify_sec": "数据验证",
    "doc.verify_body": "基于 Horizon API（主网）的交易记录",
    "doc.submit_sec": "提交至",
    "doc.police": "警察网络犯罪调查队",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "如涉及CEX，请联系交易所客服",
    "doc.notes_sec": "注意事项",
    "doc.note1": "本资料仅供参考。",
    "doc.note2": "链上匹配为推断，并非确定性证据。",
    "doc.note3": "解读可能因司法机关而异。",
    "mywallet.title": "我的钱包（主网）",
    "mywallet.add": "添加钱包",
    "mywallet.no_wallets": "没有已注册的钱包。",
    "mywallet.loading": "加载中...",
    "mywallet.fail": "加载失败",
    "mywallet.refresh": "刷新",
    "mywallet.load.fail": "无法从服务器加载我的钱包列表。",
    "mywallet.not_activated": "该钱包尚未在Pi主网激活。（从未收到过Pi的账户不会被创建）",
    'mywallet.not_activated.confirm': "仍要添加吗？",
    'mywallet.not_activated.icon_title': "未激活钱包（从未收到过Pi）",
    "mywallet.max_hint": "最多 {n} 个",
    "mywallet.pi.total": "π 总余额",
    "mywallet.pi.avail": "可用",
    "mywallet.pi.reserve": "最低保留（预估）",
    "mywallet.tokens": "持有代币",
    "mywallet.txs": "最近交易",
    "mywallet.lp": "LP 持仓",
    'mywallet.lock.title': "锁仓余额",
    'mywallet.lock.total': "锁定金额",
    'mywallet.lock.claimable': "可立即领取",
    "backup.title": "备份 / 恢复",
    "backup.load_fail": "无法加载插槽",
    "backup.empty": "空",
    "backup.slot": "插槽 {n}",
    "backup.slot_info": "{n}个 · {date}",
    "backup.btn.full_backup": "完全备份",
    "backup.btn.append_backup": "追加备份",
    "backup.btn.full_restore": "完全恢复",
    "backup.btn.append_restore": "追加恢复",
    "backup.saved": "备份完成",
    "backup.fail": "发生错误",
    "backup.confirm.overwrite": "插槽 {n} 的现有记录将被删除并替换为当前列表。是否继续？",
    "backup.confirm.save": "将当前列表备份到插槽 {n}。",
    "backup.confirm.truncate": "最多只能保存 {n} 个，{dropped} 个将被排除。是否继续？",
    "backup.confirm.restore_full": "当前列表将被清空并替换为插槽 {n} 的内容。是否继续？",
    "mywallet.no_lp": "无LP",
    "mywallet.tx_none": "无交易记录",
    "mywallet.updated": "更新时间",
    "mywallet.tx_sent": "发送",
    "mywallet.tx_recv": "收到",
    "mywallet.add.title": "添加钱包",
    "mywallet.add.alias_ph": "别名（例如：主钱包）",
    "mywallet.add.addr_ph": "钱包地址 (G...)",
    "mywallet.add.err_addr": "地址格式错误（以G开头，56位）",
    "mywallet.add.err_dup": "该地址已注册。",
    "mywallet.add.err_full": "我的钱包已达30个上限，请整理后重试。",
    "mywallet.alias.edit": "修改别名",
    "mywallet.delete": "删除钱包",
    "mywallet.delete.confirm": "确定要删除此钱包吗？",
    "mywallet.cloud.fail": "服务器发生错误。",
    "watch.title": "关注钱包追踪",
    "watch.empty": "没有关注的钱包。",
    "watch.load.fail": "无法从服务器加载关注钱包列表。",
    "watch.max_hint": "（最多 {n} 个）",
    "watch.add.btn": "添加钱包",
    "watch.add.addr_ph": "钱包地址 (G...)",
    "watch.add.err_addr": "请确认地址。",
    "watch.fetch.btn": "🔍 全部查询",
    "watch.fetch.loading": "查询中...",
    "watch.internal.title": "🔄 内部交易",
    "watch.feed.title": "📡 全部动态",
    "watch.no.internal": "无内部交易",
    "watch.new.tx": "检测到新交易",
    "watch.report.warn": "已举报钱包",
    "watch.cloud.fail": "服务器发生错误。",
    "backup.alias_conflict.title": "别名冲突",
    "backup.alias_conflict.desc": "{n}个地址的别名与当前不同。要使用哪个别名？",
    "backup.alias_conflict.keep_latest": "保留最新别名（推荐）",
    "backup.alias_conflict.use_backup": "使用备份时的别名",
    "ctx.trade": "添加钱包别名",
    "tab.trade": "钱包别名",
    "trade.title": "钱包别名",
    "trade.desc": "注册后，该地址会在交易记录中以别名显示。",
    "trade.empty": "尚未注册钱包别名。",
    "trade.add.title": "添加钱包别名",
    "trade.add.err_full": "钱包别名已达到{n}个上限，请删除后重试。",
    "cex.estimated": "交易所（推测）",
    "ctx.watch": "加入关注钱包",
    "ctx.watch.slot": "剩余 {n} 个",
    "ctx.watch.exists": "已添加",
    "ctx.watch.full": "关注钱包已满（最多10个）",
    "ctx.watch.alias_title": "输入别名",
    "ctx.watch.alias_ph": "别名（可选）",
    "ctx.watch.added": "已添加",
    "ctx.register.both": "注册到PiDEX Util测试网钱包",
    "ctx.both.alias_title": "输入别名",
    "ctx.both.alias_ph": "别名（可选）",
    "ctx.both.sent": "✅ 注册完成",
    "ctx.both.fail": "注册失败",
    "ctx.both.dup": "已注册的地址",
    "ctx.both.full": "测试网钱包已有 {n} 个，请在PiDEX Util应用中清出空位后重试。",
    "ctx.pidex.no_login": "需要Pi登录。",
    "ctx.cancel": "取消",
    "ctx.continue": "继续",
    "ctx.save": "保存",
    "toast.copied": "已复制",
  },
  id: {
    "tab.report": "Laporkan",
    "tab.search": "Cari Dompet",
    "tab.mywallet": "Dompet Saya",
    "tab.watch": "Daftar Pantau", "tab.ledger": "Buku Besar",
    "ledger.title": "Buku Besar Dompet (Bulanan/Tahunan)", "ledger.loading": "Memuat riwayat...", "ledger.empty": "Tidak ada transaksi.",
    "ledger.in": "Masuk", "ledger.out": "Keluar", "ledger.net": "Bersih", "ledger.year_total": "Total Tahunan",
    "ledger.export": "📤 Ekspor CSV", "ledger.refresh": "↻ Segarkan",
    "ledger.note": "⚠️ Buku besar ini mengumpulkan riwayat masuk/keluar dompet mulai dari saat Anda pertama kali membukanya. Mulai tahun pajak 2027, secara otomatis akan disinkronkan mundur hingga 1 Januari tahun tersebut. Untuk pelaporan pajak sebenarnya, gunakan catatan transaksi bursa Anda sebagai dasar biaya perolehan — buku besar ini hanya untuk referensi arus masuk/keluar dompet.",
    "ledger.fail": "Gagal memuat riwayat.", "ledger.counterpart_all": "Rekanan (tampilkan semua jika tidak dipilih)",
    "ledger.mode_combined": "Gabungan", "ledger.mode_individual": "Individual",
    "ledger.incomplete_warn": "Dompet ini memiliki terlalu banyak aktivitas untuk disinkronkan otomatis hingga 1 Januari tahun ini. Silakan hubungi admin (batas dapat dinaikkan dan disinkronkan ulang untuk Anda).",
    "tab.tax": "Kalkulasi Pajak",
    "tax.title": "Kalkulasi Pajak (FIFO / Rata-rata Bergerak)",
    "tax.loading": "Memuat riwayat transaksi...", "tax.syncing": "⏳ Menyinkronkan riwayat swap...",
    "tax.method.fifo": "FIFO (Masuk Pertama Keluar Pertama)", "tax.method.moving_avg": "Rata-rata Bergerak",
    "tax.method.hint": "Menurut hukum, transaksi melalui bursa (penyedia jasa aset kripto berizin) menggunakan metode rata-rata bergerak; dompet pribadi dan DEX non-kustodian menggunakan FIFO.",
    "tax.untagged_hint": "Ini adalah dompet rekanan yang belum ditandai. Tandai untuk menyertakannya dalam perhitungan.",
    "tax.method.unset": "Belum ditandai", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Rata-rata",
    "tax.tag_now": "Tandai sekarang", "tax.tag_dialog.title": "Tetapkan Metode Perhitungan",
    "tax.disposal.date": "Tanggal", "tax.disposal.qty": "Jumlah", "tax.disposal.proceeds": "Hasil Penjualan",
    "tax.disposal.cost": "Harga Perolehan", "tax.disposal.gain": "Untung/Rugi",
    "tax.no_price": "⚠️ {n} entri tanpa harga — dikecualikan dari perhitungan",
    "tax.manual_price.edit": "Atur harga manual", "tax.manual_price.auto": "Harga otomatis",
    "tax.note": "⚠️ Perhitungan ini hanya untuk referensi. Konfirmasi dengan konsultan pajak sebelum pelaporan sebenarnya.",
    "tax.report.title": "Laporan untuk Pelaporan Pajak", "tax.report.select_wallets": "Pilih dompet rekanan yang disertakan",
    "tax.report.self_swap": "Swap DEX sendiri (FIFO)", "tax.report.date_from": "Dari", "tax.report.date_to": "Sampai",
    "tax.report.generate": "Buat Laporan",
    "tax.report.no_selection": "Pilih setidaknya satu dompet.",
    "tax.report.method_label": "Metode yang Digunakan", "tax.report.period_label": "Periode", "tax.report.wallets_label": "Dompet Rekanan yang Disertakan",
    "tax.report.total_gain": "Total Untung/Rugi", "tax.report.export": "📤 Ekspor CSV Laporan",
    "report.title": "🚨 Laporkan Penipuan",
    'report.realname_warn': "⚠️ Laporan ini dioperasikan dengan <strong>kebijakan nama asli</strong>.<br>Hanya pemegang akun Pi yang login yang dapat melaporkan,<br>dan laporan palsu dapat berakibat hukum.",
    "report.victim_id": "Pi ID Korban",
    "report.suspect_wallet": "Alamat Dompet Terduga",
    "report.amount": "Jumlah Kerugian (Pi)",
    "report.date": "Tanggal Kejadian",
    "report.txhash": "Hash Transaksi (opsional)",
    "report.desc": "Deskripsi (opsional)",
    "report.btn": "Kirim Laporan",
    "report.btn.loading": "Mengirim...",
    "report.success": "✅ Laporan terkirim.",
    "report.err.required": "Harap isi semua kolom wajib.",
    "report.err.wallet": "Format alamat dompet salah (dimulai dengan G, 56 karakter).",
    "report.err.generic": "Terjadi kesalahan. Coba lagi.",
    "presearch.title": "Periksa Sebelum Melapor",
    "presearch.placeholder": "Masukkan alamat dompet terduga...",
    "presearch.warn.not_wallet": "Harap masukkan alamat dompet yang dimulai dengan G.",
    "presearch.hint.short": "Masukkan minimal 4 karakter.",
    "presearch.loading": "Mencari...",
    "presearch.none": "Tidak ada laporan yang ada.",
    "presearch.found": "{n} laporan yang ada ditemukan.",
    "search.title": "🔍 Cari Dompet",
    "search.placeholder": "Masukkan alamat dompet (G...)",
    "search.btn": "Cari",
    "search.no_tx": "Tidak ada transaksi",
    "search.err.fail": "Pencarian gagal",
    "search.err.not_found": "Dompet tidak ditemukan.",
    "search.error": "Terjadi kesalahan saat mencari.",
    "list.title": "🗂️ Daftar Laporan",
    "list.filter": "Cari dompet/ID korban...",
    "list.count": "laporan",
    "list.loading": "Memuat...",
    "list.empty": "Belum ada laporan.",
    "list.search_btn": "Cari",
    "list.wallet": "Dompet Terduga:",
    "summary.reports": "Laporan",
    "summary.reported_pi": "Total Dilaporkan",
    "summary.tx_count": "Transaksi Keluar",
    "summary.total_sent": "Total Terkirim",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} laporan cocok",
    "tx.victims": "Korban",
    "risk.safe": "Aman",
    "risk.low": "Waspada",
    "risk.mid": "Bahaya",
    "risk.high": "Sangat Berbahaya",
    "matched.victim_id": "Korban",
    "matched.chain": "Cocok Rantai",
    "top10.title": "10 Dompet Paling Dilaporkan",
    "top10.cases": "kasus",
    "verify.btn": "Verifikasi",
    "verify.done": "Terverifikasi",
    "verify.mine": "Laporan Saya",
    "verify.confirmed": " terverifikasi",
    "verify.toast": "Verifikasi tercatat.",
    "export.toast": "Disalin ke clipboard.",
    "export.copied": "✅ Disalin",
    "export.manual": "Pilih semua lalu salin.",
    "doc.title": "Laporan Investigasi Penipuan Pi",
    "doc.generated": "Dibuat",
    "doc.wallet_sec": "Dompet Terduga",
    "doc.reports_sec": "Ringkasan Laporan",
    "doc.count": "Jumlah Laporan",
    "doc.total_pi": "Total Dilaporkan",
    "doc.victims_sec": "Daftar Korban",
    "doc.victim_id": "ID Korban",
    "doc.damage": "Kerugian",
    "doc.date": "Tanggal",
    "doc.tx_hash": "Hash TX",
    "doc.situation": "Deskripsi",
    "doc.outgoing_sec": "Transaksi Keluar",
    "doc.no_tx": "Tidak ada",
    "doc.chain_match": "★ Cocok dengan Laporan",
    "doc.amount": "Jumlah",
    "doc.cex_sec": "Ringkasan Transfer CEX",
    "doc.verify_sec": "Verifikasi Data",
    "doc.verify_body": "Berdasarkan data transaksi Horizon API (mainnet)",
    "doc.submit_sec": "Kirim Ke",
    "doc.police": "Unit Cybercrime Setempat",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Layanan pelanggan CEX bila berlaku",
    "doc.notes_sec": "Catatan",
    "doc.note1": "Dokumen ini untuk referensi.",
    "doc.note2": "Kecocokan rantai adalah perkiraan, bukan bukti pasti.",
    "doc.note3": "Interpretasi dapat berbeda menurut yurisdiksi.",
    "mywallet.title": "Dompet Saya (Mainnet)",
    "mywallet.add": "Tambah Dompet",
    "mywallet.no_wallets": "Tidak ada dompet terdaftar.",
    "mywallet.loading": "Memuat...",
    "mywallet.fail": "Gagal memuat",
    "mywallet.refresh": "Segarkan",
    "mywallet.load.fail": "Tidak dapat memuat daftar dompet Anda dari server.",
    "mywallet.not_activated": "Dompet ini belum diaktifkan di Pi mainnet. (Akun baru dibuat setelah menerima Pi minimal sekali)",
    'mywallet.not_activated.confirm': "Tetap tambahkan?",
    'mywallet.not_activated.icon_title': "Dompet tidak aktif (belum pernah menerima Pi)",
    "mywallet.max_hint": "Maks {n}",
    "mywallet.pi.total": "π Saldo Total",
    "mywallet.pi.avail": "Tersedia",
    "mywallet.pi.reserve": "Cadangan Min (perkiraan)",
    "mywallet.tokens": "Token",
    "mywallet.txs": "Transaksi Terbaru",
    "mywallet.lp": "Posisi LP",
    'mywallet.lock.title': "Saldo Terkunci",
    'mywallet.lock.total': "Jumlah Terkunci",
    'mywallet.lock.claimable': "Dapat Diklaim Sekarang",
    "backup.title": "Backup / Pulihkan",
    "backup.load_fail": "Gagal memuat slot",
    "backup.empty": "Kosong",
    "backup.slot": "Slot {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Backup Penuh",
    "backup.btn.append_backup": "Backup Tambahan",
    "backup.btn.full_restore": "Pulihkan Penuh",
    "backup.btn.append_restore": "Pulihkan Tambahan",
    "backup.saved": "Backup tersimpan",
    "backup.fail": "Terjadi kesalahan",
    "backup.confirm.overwrite": "Data yang ada di Slot {n} akan dihapus dan diganti dengan daftar saat ini. Lanjutkan?",
    "backup.confirm.save": "Backup daftar saat ini ke Slot {n}.",
    "backup.confirm.truncate": "Hanya {n} yang akan disimpan dan {dropped} akan dibuang. Lanjutkan?",
    "backup.confirm.restore_full": "Daftar saat ini akan dihapus dan diganti dengan isi Slot {n}. Lanjutkan?",
    "mywallet.no_lp": "Tidak ada LP",
    "mywallet.tx_none": "Tidak ada transaksi",
    "mywallet.updated": "Diperbarui",
    "mywallet.tx_sent": "Terkirim",
    "mywallet.tx_recv": "Diterima",
    "mywallet.add.title": "Tambah Dompet",
    "mywallet.add.alias_ph": "Alias (mis. Dompet Utama)",
    "mywallet.add.addr_ph": "Alamat Dompet (G...)",
    "mywallet.add.err_addr": "Alamat tidak valid (dimulai G, 56 karakter)",
    "mywallet.add.err_dup": "Alamat ini sudah terdaftar.",
    "mywallet.add.err_full": "Daftar Dompet Saya sudah penuh (30). Hapus satu lalu coba lagi.",
    "mywallet.alias.edit": "Edit Alias",
    "mywallet.delete": "Hapus Dompet",
    "mywallet.delete.confirm": "Yakin ingin menghapus dompet ini?",
    "mywallet.cloud.fail": "Terjadi kesalahan server.",
    "watch.title": "Daftar Pantau",
    "watch.empty": "Tidak ada dompet di daftar pantau.",
    "watch.load.fail": "Tidak dapat memuat daftar pantau Anda dari server.",
    "watch.max_hint": "(maks {n})",
    "watch.add.btn": "Tambah Dompet",
    "watch.add.addr_ph": "Alamat dompet (G...)",
    "watch.add.err_addr": "Harap periksa alamatnya.",
    "watch.fetch.btn": "🔍 Ambil Semua",
    "watch.fetch.loading": "Mengambil...",
    "watch.internal.title": "🔄 Transfer Internal",
    "watch.feed.title": "📡 Feed Lengkap",
    "watch.no.internal": "Tidak ada transfer internal",
    "watch.new.tx": "Transaksi baru terdeteksi",
    "watch.report.warn": "Dompet dilaporkan",
    "watch.cloud.fail": "Terjadi kesalahan server.",
    "backup.alias_conflict.title": "Konflik Alias",
    "backup.alias_conflict.desc": "{n} alamat memiliki alias yang berbeda dari saat ini. Alias mana yang akan digunakan?",
    "backup.alias_conflict.keep_latest": "Pertahankan Alias Terbaru (Disarankan)",
    "backup.alias_conflict.use_backup": "Gunakan Alias Saat Backup",
    "ctx.trade": "Tambah Alias Dompet",
    "tab.trade": "Alias Dompet",
    "trade.title": "Alias Dompet",
    "trade.desc": "Alamat yang didaftarkan akan ditampilkan dengan aliasnya di daftar transaksi.",
    "trade.empty": "Belum ada alias dompet terdaftar.",
    "trade.add.title": "Tambah Alias Dompet",
    "trade.add.err_full": "Anda sudah memiliki {n} alias dompet. Hapus beberapa lalu coba lagi.",
    "cex.estimated": "Bursa (perkiraan)",
    "ctx.watch": "Tambah ke Daftar Pantau",
    "ctx.watch.slot": "{n} slot tersisa",
    "ctx.watch.exists": "Sudah ditambahkan",
    "ctx.watch.full": "Daftar pantau penuh (maks 10)",
    "ctx.watch.alias_title": "Masukkan Alias",
    "ctx.watch.alias_ph": "Alias (opsional)",
    "ctx.watch.added": "Ditambahkan",
    "ctx.register.both": "Daftarkan ke Dompet Testnet PiDEX Util",
    "ctx.both.alias_title": "Masukkan Alias",
    "ctx.both.alias_ph": "Alias (opsional)",
    "ctx.both.sent": "✅ Terdaftar",
    "ctx.both.fail": "Pendaftaran gagal",
    "ctx.both.dup": "Sudah terdaftar",
    "ctx.both.full": "Daftar dompet testnet sudah penuh ({n}). Kosongkan slot di aplikasi PiDEX Util lalu coba lagi.",
    "ctx.pidex.no_login": "Diperlukan login Pi.",
    "ctx.cancel": "Batal",
    "ctx.continue": "Lanjutkan",
    "ctx.save": "Simpan",
    "toast.copied": "Disalin",
  },
  ja: {
    "tab.report": "通報",
    "tab.search": "ウォレット照会",
    "tab.mywallet": "マイウォレット",
    "tab.watch": "ウォッチリスト", "tab.ledger": "台帳",
    "ledger.title": "ウォレット台帳（月別・年別）", "ledger.loading": "履歴を読み込み中...", "ledger.empty": "取引履歴がありません。",
    "ledger.in": "入金", "ledger.out": "出金", "ledger.net": "純増減", "ledger.year_total": "年間合計",
    "ledger.export": "📤 CSVエクスポート", "ledger.refresh": "↻ 更新",
    "ledger.note": "⚠️ この台帳は初めて開いた時点からのウォレットの入出金履歴を収集します。2027年の課税年度からは、その年の1月1日まで自動的に遡って収集します。実際の税務申告には取引所の約定履歴を取得原価の根拠として使用してください — この台帳はウォレットの入出金の流れの参考用です。",
    "ledger.fail": "履歴の読み込みに失敗しました。", "ledger.counterpart_all": "相手ウォレット（未選択なら全て表示）",
    "ledger.mode_combined": "合計", "ledger.mode_individual": "個別",
    "ledger.incomplete_warn": "このウォレットは取引量が多いため、今年の1月1日まで自動的に同期できませんでした。管理者にお問い合わせください（上限を引き上げて再同期できます）。",
    "tab.tax": "税金計算",
    "tax.title": "税金計算（FIFO / 移動平均法）",
    "tax.loading": "取引履歴を読み込み中...", "tax.syncing": "⏳ スワップ履歴を同期中...",
    "tax.method.fifo": "先入先出法 (FIFO)", "tax.method.moving_avg": "移動平均法",
    "tax.method.hint": "法律上、取引所（暗号資産事業者）経由の取引には移動平均法、個人ウォレット・非管理型DEXには先入先出法が適用されます。",
    "tax.untagged_hint": "まだタグ付けされていない相手ウォレットです。タグを付けると計算対象に含められます。",
    "tax.method.unset": "未タグ", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "移動平均",
    "tax.tag_now": "タグ付けする", "tax.tag_dialog.title": "計算方式を設定",
    "tax.disposal.date": "日時", "tax.disposal.qty": "数量", "tax.disposal.proceeds": "処分価額",
    "tax.disposal.cost": "取得原価", "tax.disposal.gain": "損益",
    "tax.no_price": "⚠️ 価格未確認 {n} 件 — 計算から除外",
    "tax.manual_price.edit": "単価を手動入力", "tax.manual_price.auto": "自動取得価格",
    "tax.note": "⚠️ この計算は参考用です。実際の申告前に必ず税理士にご確認ください。",
    "tax.report.title": "税務署提出用レポート", "tax.report.select_wallets": "含める相手ウォレットを選択",
    "tax.report.self_swap": "DEX自己スワップ（先入先出法）", "tax.report.date_from": "開始日", "tax.report.date_to": "終了日",
    "tax.report.generate": "レポートを生成",
    "tax.report.no_selection": "ウォレットを1つ以上選択してください。",
    "tax.report.method_label": "適用方式", "tax.report.period_label": "期間", "tax.report.wallets_label": "含まれる相手ウォレット",
    "tax.report.total_gain": "合計損益", "tax.report.export": "📤 レポートCSVをエクスポート",
    "report.title": "🚨 被害通報",
    'report.realname_warn': "⚠️ 本報告は<strong>実名制</strong>で運営されています。<br>ログインしたご本人のPiアカウントのみ報告できます。<br>虚偽の報告には法的責任が伴う場合があります。",
    "report.victim_id": "被害者 Pi ID",
    "report.suspect_wallet": "疑わしいウォレットアドレス",
    "report.amount": "被害額 (Pi)",
    "report.date": "被害発生日",
    "report.txhash": "トランザクションハッシュ（任意）",
    "report.desc": "状況説明（任意）",
    "report.btn": "通報を送信",
    "report.btn.loading": "送信中...",
    "report.success": "✅ 通報を受け付けました。",
    "report.err.required": "必須項目をすべて入力してください。",
    "report.err.wallet": "ウォレットアドレスの形式が正しくありません（Gで始まる56文字）。",
    "report.err.generic": "エラーが発生しました。もう一度お試しください。",
    "presearch.title": "通報前の事前照会",
    "presearch.placeholder": "疑わしいウォレットアドレスを入力...",
    "presearch.warn.not_wallet": "Gで始まるウォレットアドレスを入力してください。",
    "presearch.hint.short": "4文字以上入力してください。",
    "presearch.loading": "照会中...",
    "presearch.none": "既存の通報はありません。",
    "presearch.found": "{n}件の既存通報があります。",
    "search.title": "🔍 ウォレット照会",
    "search.placeholder": "ウォレットアドレスを入力 (G...)",
    "search.btn": "照会",
    "search.no_tx": "取引履歴なし",
    "search.err.fail": "照会失敗",
    "search.err.not_found": "ウォレットが見つかりません。",
    "search.error": "照会中にエラーが発生しました。",
    "list.title": "🗂️ 通報一覧",
    "list.filter": "ウォレット/被害者IDで検索...",
    "list.count": "件の通報",
    "list.loading": "読み込み中...",
    "list.empty": "通報はまだありません。",
    "list.search_btn": "照会",
    "list.wallet": "疑わしいウォレット：",
    "summary.reports": "通報件数",
    "summary.reported_pi": "被害額合計",
    "summary.tx_count": "送信件数",
    "summary.total_sent": "総送信額",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n}件の通報に一致",
    "tx.victims": "被害者",
    "risk.safe": "安全",
    "risk.low": "注意",
    "risk.mid": "危険",
    "risk.high": "非常に危険",
    "matched.victim_id": "被害者",
    "matched.chain": "チェーン一致",
    "top10.title": "通報の多いウォレット TOP 10",
    "top10.cases": "件",
    "verify.btn": "目撃確認",
    "verify.done": "確認済み",
    "verify.mine": "自分の通報",
    "verify.confirmed": "名確認",
    "verify.toast": "目撃確認が登録されました。",
    "export.toast": "クリップボードにコピーしました。",
    "export.copied": "✅ コピー済み",
    "export.manual": "全選択してコピーしてください。",
    "doc.title": "Pi 被害調査資料",
    "doc.generated": "生成日時",
    "doc.wallet_sec": "疑わしいウォレット",
    "doc.reports_sec": "通報状況",
    "doc.count": "通報件数",
    "doc.total_pi": "被害額合計",
    "doc.victims_sec": "被害者一覧",
    "doc.victim_id": "被害者ID",
    "doc.damage": "被害額",
    "doc.date": "被害日",
    "doc.tx_hash": "TXハッシュ",
    "doc.situation": "状況",
    "doc.outgoing_sec": "送信取引履歴",
    "doc.no_tx": "なし",
    "doc.chain_match": "★ 通報と一致",
    "doc.amount": "金額",
    "doc.cex_sec": "CEX送金状況",
    "doc.verify_sec": "データ検証",
    "doc.verify_body": "Horizon API（メインネット）に基づく取引データ",
    "doc.submit_sec": "提出先",
    "doc.police": "サイバー犯罪捜査担当警察",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "CEXの場合は取引所カスタマーサポート",
    "doc.notes_sec": "注意事項",
    "doc.note1": "本資料は参考用です。",
    "doc.note2": "チェーン上の一致は推定であり、確定的な証拠ではありません。",
    "doc.note3": "解釈は捜査機関によって異なる場合があります。",
    "mywallet.title": "マイウォレット（メインネット）",
    "mywallet.add": "ウォレット追加",
    "mywallet.no_wallets": "登録されたウォレットがありません。",
    "mywallet.loading": "読み込み中...",
    "mywallet.fail": "読み込み失敗",
    "mywallet.refresh": "更新",
    "mywallet.load.fail": "サーバーからマイウォレットリストを読み込めませんでした。",
    "mywallet.not_activated": "このウォレットはまだPiメインネットで有効化されていません。（一度もPiを受け取っていないアカウントは作成されません）",
    'mywallet.not_activated.confirm': "それでも追加しますか？",
    'mywallet.not_activated.icon_title': "未有効化のウォレット（Pi受取履歴なし）",
    "mywallet.max_hint": "最大{n}個",
    "mywallet.pi.total": "π 総残高",
    "mywallet.pi.avail": "利用可能",
    "mywallet.pi.reserve": "最低保有（推定）",
    "mywallet.tokens": "保有トークン",
    "mywallet.txs": "最近の取引",
    "mywallet.lp": "LPポジション",
    'mywallet.lock.title': "ロック残高",
    'mywallet.lock.total': "ロック中の金額",
    'mywallet.lock.claimable': "今すぐ請求可能",
    "backup.title": "バックアップ / 復元",
    "backup.load_fail": "スロットを読み込めませんでした",
    "backup.empty": "空き",
    "backup.slot": "スロット {n}",
    "backup.slot_info": "{n}個 · {date}",
    "backup.btn.full_backup": "全体バックアップ",
    "backup.btn.append_backup": "追加バックアップ",
    "backup.btn.full_restore": "全体復元",
    "backup.btn.append_restore": "追加復元",
    "backup.saved": "バックアップ完了",
    "backup.fail": "エラーが発生しました",
    "backup.confirm.overwrite": "スロット{n}の既存データが削除され、現在のリストに置き換わります。続けますか？",
    "backup.confirm.save": "現在のリストをスロット{n}にバックアップします。",
    "backup.confirm.truncate": "最大{n}個のみ保存され、{dropped}個は除外されます。続けますか？",
    "backup.confirm.restore_full": "現在のリストがすべて削除され、スロット{n}の内容に置き換わります。続けますか？",
    "mywallet.no_lp": "LPなし",
    "mywallet.tx_none": "取引履歴なし",
    "mywallet.updated": "更新",
    "mywallet.tx_sent": "送信",
    "mywallet.tx_recv": "受信",
    "mywallet.add.title": "ウォレット追加",
    "mywallet.add.alias_ph": "エイリアス（例：メインウォレット）",
    "mywallet.add.addr_ph": "ウォレットアドレス (G...)",
    "mywallet.add.err_addr": "アドレス形式エラー（Gで始まる56文字）",
    "mywallet.add.err_dup": "既に登録されているアドレスです。",
    "mywallet.add.err_full": "マイウォレットが既に30個です。整理してから再試行してください。",
    "mywallet.alias.edit": "エイリアス編集",
    "mywallet.delete": "ウォレット削除",
    "mywallet.delete.confirm": "このウォレットを削除しますか？",
    "mywallet.cloud.fail": "サーバーエラーが発生しました。",
    "watch.title": "ウォッチリスト追跡",
    "watch.empty": "ウォッチリストにウォレットがありません。",
    "watch.load.fail": "サーバーからウォッチリストを読み込めませんでした。",
    "watch.max_hint": "（最大{n}個）",
    "watch.add.btn": "ウォレット追加",
    "watch.add.addr_ph": "ウォレットアドレス (G...)",
    "watch.add.err_addr": "アドレスを確認してください。",
    "watch.fetch.btn": "🔍 全件照会",
    "watch.fetch.loading": "照会中...",
    "watch.internal.title": "🔄 内部取引",
    "watch.feed.title": "📡 全フィード",
    "watch.no.internal": "内部取引なし",
    "watch.new.tx": "新しい取引を検出",
    "watch.report.warn": "通報済みウォレット",
    "watch.cloud.fail": "サーバーエラーが発生しました。",
    "backup.alias_conflict.title": "エイリアスの競合",
    "backup.alias_conflict.desc": "{n}件のアドレスのエイリアスが現在と異なります。どちらを使用しますか？",
    "backup.alias_conflict.keep_latest": "最新のエイリアスを維持（推奨）",
    "backup.alias_conflict.use_backup": "バックアップ時点のエイリアスを使用",
    "ctx.trade": "ウォレットエイリアスを追加",
    "tab.trade": "ウォレットエイリアス",
    "trade.title": "ウォレットエイリアス",
    "trade.desc": "登録したアドレスは取引履歴でエイリアス表示されます。",
    "trade.empty": "登録されたウォレットエイリアスがありません。",
    "trade.add.title": "ウォレットエイリアスを追加",
    "trade.add.err_full": "ウォレットエイリアスが既に{n}件登録されています。整理してから再試行してください。",
    "cex.estimated": "取引所（推定）",
    "ctx.watch": "ウォッチリストに追加",
    "ctx.watch.slot": "残り{n}個",
    "ctx.watch.exists": "既に追加済み",
    "ctx.watch.full": "ウォッチリストが満杯です（最大10個）",
    "ctx.watch.alias_title": "エイリアスを入力",
    "ctx.watch.alias_ph": "エイリアス（任意）",
    "ctx.watch.added": "追加済み",
    "ctx.register.both": "PiDEX Utilテストネットウォレットに登録",
    "ctx.both.alias_title": "エイリアスを入力",
    "ctx.both.alias_ph": "エイリアス（任意）",
    "ctx.both.sent": "✅ 登録完了",
    "ctx.both.fail": "登録失敗",
    "ctx.both.dup": "既に登録済みのアドレス",
    "ctx.both.full": "テストネットウォレットが既に{n}個です。PiDEX Utilアプリで枠を空けてから再試行してください。",
    "ctx.pidex.no_login": "Piログインが必要です。",
    "ctx.cancel": "キャンセル",
    "ctx.continue": "続行",
    "ctx.save": "保存",
    "toast.copied": "コピー済み",
  },
  es: {
    "tab.report": "Reportar",
    "tab.search": "Buscar Cartera",
    "tab.mywallet": "Mi Cartera",
    "tab.watch": "Lista de Seguimiento", "tab.ledger": "Libro Mayor",
    "ledger.title": "Libro Mayor de Cartera (Mensual/Anual)", "ledger.loading": "Cargando historial...", "ledger.empty": "No hay transacciones.",
    "ledger.in": "Entrada", "ledger.out": "Salida", "ledger.net": "Neto", "ledger.year_total": "Total Anual",
    "ledger.export": "📤 Exportar CSV", "ledger.refresh": "↻ Actualizar",
    "ledger.note": "⚠️ Este libro mayor recopila el historial de entrada/salida de la cartera desde el momento en que lo abre por primera vez. A partir del año fiscal 2027, se sincronizará automáticamente hacia atrás hasta el 1 de enero de ese año. Para la declaración de impuestos real, use los registros de operaciones de su exchange como base del costo de adquisición — este libro mayor es solo para referencia del flujo de entrada/salida de la cartera.",
    "ledger.fail": "Error al cargar el historial.", "ledger.counterpart_all": "Contraparte (muestra todas si no se selecciona ninguna)",
    "ledger.mode_combined": "Combinado", "ledger.mode_individual": "Individual",
    "ledger.incomplete_warn": "Esta cartera tiene demasiada actividad para sincronizarse automáticamente hasta el 1 de enero de este año. Contacte al administrador (el límite se puede aumentar y resincronizar para usted).",
    "tab.tax": "Cálculo de Impuestos",
    "tax.title": "Cálculo de Impuestos (FIFO / Promedio Móvil)",
    "tax.loading": "Cargando historial de transacciones...", "tax.syncing": "⏳ Sincronizando historial de intercambios...",
    "tax.method.fifo": "FIFO (Primero en Entrar, Primero en Salir)", "tax.method.moving_avg": "Promedio Móvil",
    "tax.method.hint": "Por ley, las transacciones a través de un exchange (proveedor de activos virtuales autorizado) usan el método de promedio móvil; las carteras personales y DEX no custodiados usan FIFO.",
    "tax.untagged_hint": "Esta es una cartera de contraparte sin etiquetar. Etiquétala para incluirla en el cálculo.",
    "tax.method.unset": "Sin etiquetar", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Promedio Móvil",
    "tax.tag_now": "Etiquetar ahora", "tax.tag_dialog.title": "Establecer Método de Cálculo",
    "tax.disposal.date": "Fecha", "tax.disposal.qty": "Cantidad", "tax.disposal.proceeds": "Ingresos",
    "tax.disposal.cost": "Costo de Adquisición", "tax.disposal.gain": "Ganancia/Pérdida",
    "tax.no_price": "⚠️ {n} entradas sin precio — excluidas del cálculo",
    "tax.manual_price.edit": "Establecer precio manual", "tax.manual_price.auto": "Precio automático",
    "tax.note": "⚠️ Este cálculo es solo de referencia. Confirme con un asesor fiscal antes de presentar la declaración real.",
    "tax.report.title": "Informe para Declaración de Impuestos", "tax.report.select_wallets": "Seleccionar carteras de contraparte a incluir",
    "tax.report.self_swap": "Intercambio propio en DEX (FIFO)", "tax.report.date_from": "Desde", "tax.report.date_to": "Hasta",
    "tax.report.generate": "Generar Informe",
    "tax.report.no_selection": "Seleccione al menos una cartera.",
    "tax.report.method_label": "Método Aplicado", "tax.report.period_label": "Período", "tax.report.wallets_label": "Carteras de Contraparte Incluidas",
    "tax.report.total_gain": "Ganancia/Pérdida Total", "tax.report.export": "📤 Exportar CSV del Informe",
    "report.title": "🚨 Reportar Estafa",
    'report.realname_warn': "⚠️ Este reporte se gestiona bajo una <strong>política de nombre real</strong>.<br>Solo el titular de la cuenta Pi con sesión iniciada puede reportar,<br>y los reportes falsos pueden acarrear responsabilidad legal.",
    "report.victim_id": "ID Pi de la Víctima",
    "report.suspect_wallet": "Dirección de Cartera Sospechosa",
    "report.amount": "Monto Perdido (Pi)",
    "report.date": "Fecha del Incidente",
    "report.txhash": "Hash de Transacción (opcional)",
    "report.desc": "Descripción (opcional)",
    "report.btn": "Enviar Reporte",
    "report.btn.loading": "Enviando...",
    "report.success": "✅ Reporte enviado.",
    "report.err.required": "Complete todos los campos obligatorios.",
    "report.err.wallet": "Formato de dirección inválido (empieza con G, 56 caracteres).",
    "report.err.generic": "Ocurrió un error. Intente de nuevo.",
    "presearch.title": "Verificación Previa al Reporte",
    "presearch.placeholder": "Ingrese la dirección sospechosa...",
    "presearch.warn.not_wallet": "Ingrese una dirección que empiece con G.",
    "presearch.hint.short": "Ingrese al menos 4 caracteres.",
    "presearch.loading": "Buscando...",
    "presearch.none": "No se encontraron reportes existentes.",
    "presearch.found": "{n} reporte(s) existente(s) encontrado(s).",
    "search.title": "🔍 Buscar Cartera",
    "search.placeholder": "Ingrese la dirección (G...)",
    "search.btn": "Buscar",
    "search.no_tx": "Sin transacciones",
    "search.err.fail": "Búsqueda fallida",
    "search.err.not_found": "Cartera no encontrada.",
    "search.error": "Error durante la búsqueda.",
    "list.title": "🗂️ Lista de Reportes",
    "list.filter": "Buscar cartera/ID de víctima...",
    "list.count": "reportes",
    "list.loading": "Cargando...",
    "list.empty": "Aún no hay reportes.",
    "list.search_btn": "Buscar",
    "list.wallet": "Cartera Sospechosa:",
    "summary.reports": "Reportes",
    "summary.reported_pi": "Total Reportado",
    "summary.tx_count": "Transacciones Salientes",
    "summary.total_sent": "Total Enviado",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} coincidencia(s) de reporte",
    "tx.victims": "Víctimas",
    "risk.safe": "Seguro",
    "risk.low": "Precaución",
    "risk.mid": "Peligro",
    "risk.high": "Alto Riesgo",
    "matched.victim_id": "Víctima",
    "matched.chain": "Coincidencia en Cadena",
    "top10.title": "Top 10 Carteras Más Reportadas",
    "top10.cases": "casos",
    "verify.btn": "Verificar",
    "verify.done": "Verificado",
    "verify.mine": "Mi Reporte",
    "verify.confirmed": " verificado(s)",
    "verify.toast": "Verificación registrada.",
    "export.toast": "Copiado al portapapeles.",
    "export.copied": "✅ Copiado",
    "export.manual": "Seleccione todo y copie.",
    "doc.title": "Informe de Investigación de Estafa Pi",
    "doc.generated": "Generado",
    "doc.wallet_sec": "Cartera Sospechosa",
    "doc.reports_sec": "Resumen de Reportes",
    "doc.count": "Cantidad de Reportes",
    "doc.total_pi": "Total Reportado",
    "doc.victims_sec": "Lista de Víctimas",
    "doc.victim_id": "ID de Víctima",
    "doc.damage": "Daño",
    "doc.date": "Fecha",
    "doc.tx_hash": "Hash TX",
    "doc.situation": "Descripción",
    "doc.outgoing_sec": "Transacciones Salientes",
    "doc.no_tx": "Ninguna",
    "doc.chain_match": "★ Coincide con Reporte",
    "doc.amount": "Monto",
    "doc.cex_sec": "Resumen de Transferencias CEX",
    "doc.verify_sec": "Verificación de Datos",
    "doc.verify_body": "Basado en datos de transacciones de Horizon API (mainnet)",
    "doc.submit_sec": "Enviar A",
    "doc.police": "Unidad Local de Cibercrimen",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Soporte del exchange si aplica",
    "doc.notes_sec": "Notas",
    "doc.note1": "Este documento es solo de referencia.",
    "doc.note2": "Las coincidencias en cadena son estimaciones, no pruebas definitivas.",
    "doc.note3": "La interpretación puede variar según la jurisdicción.",
    "mywallet.title": "Mi Cartera (Mainnet)",
    "mywallet.add": "Agregar Cartera",
    "mywallet.no_wallets": "No hay carteras registradas.",
    "mywallet.loading": "Cargando...",
    "mywallet.fail": "Error al cargar",
    "mywallet.refresh": "Actualizar",
    "mywallet.load.fail": "No se pudo cargar tu lista de carteras del servidor.",
    "mywallet.not_activated": "Esta cartera aún no ha sido activada en la mainnet de Pi. (Una cuenta solo se crea al recibir Pi al menos una vez)",
    'mywallet.not_activated.confirm': "¿Agregar de todos modos?",
    'mywallet.not_activated.icon_title': "Cartera inactiva (nunca recibió Pi)",
    "mywallet.max_hint": "Máx {n}",
    "mywallet.pi.total": "π Saldo Total",
    "mywallet.pi.avail": "Disponible",
    "mywallet.pi.reserve": "Reserva Mín. (est.)",
    "mywallet.tokens": "Tokens",
    "mywallet.txs": "Transacciones Recientes",
    "mywallet.lp": "Posiciones LP",
    'mywallet.lock.title': "Saldo Bloqueado",
    'mywallet.lock.total': "Monto Bloqueado",
    'mywallet.lock.claimable': "Reclamable Ahora",
    "backup.title": "Copia de seguridad / Restaurar",
    "backup.load_fail": "No se pudieron cargar las ranuras",
    "backup.empty": "Vacío",
    "backup.slot": "Ranura {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Copia Completa",
    "backup.btn.append_backup": "Copia Añadida",
    "backup.btn.full_restore": "Restauración Completa",
    "backup.btn.append_restore": "Restauración Añadida",
    "backup.saved": "Copia guardada",
    "backup.fail": "Ocurrió un error",
    "backup.confirm.overwrite": "Los datos existentes en la Ranura {n} se eliminarán y se reemplazarán con la lista actual. ¿Continuar?",
    "backup.confirm.save": "Respaldar la lista actual en la Ranura {n}.",
    "backup.confirm.truncate": "Solo se guardarán hasta {n} y se descartarán {dropped}. ¿Continuar?",
    "backup.confirm.restore_full": "La lista actual se borrará y se reemplazará con el contenido de la Ranura {n}. ¿Continuar?",
    "mywallet.no_lp": "Sin posiciones LP",
    "mywallet.tx_none": "Sin transacciones",
    "mywallet.updated": "Actualizado",
    "mywallet.tx_sent": "Enviado",
    "mywallet.tx_recv": "Recibido",
    "mywallet.add.title": "Agregar Cartera",
    "mywallet.add.alias_ph": "Alias (ej. Cartera Principal)",
    "mywallet.add.addr_ph": "Dirección de Cartera (G...)",
    "mywallet.add.err_addr": "Dirección inválida (empieza con G, 56 caracteres)",
    "mywallet.add.err_dup": "Esta dirección ya está registrada.",
    "mywallet.add.err_full": "Tu lista de Mi Cartera está llena (30). Elimina una e intenta de nuevo.",
    "mywallet.alias.edit": "Editar Alias",
    "mywallet.delete": "Eliminar Cartera",
    "mywallet.delete.confirm": "¿Seguro que deseas eliminar esta cartera?",
    "mywallet.cloud.fail": "Ocurrió un error del servidor.",
    "watch.title": "Lista de Seguimiento",
    "watch.empty": "No hay carteras en la lista de seguimiento.",
    "watch.load.fail": "No se pudo cargar tu lista de seguimiento del servidor.",
    "watch.max_hint": "(máx {n})",
    "watch.add.btn": "Agregar Cartera",
    "watch.add.addr_ph": "Dirección de cartera (G...)",
    "watch.add.err_addr": "Verifique la dirección.",
    "watch.fetch.btn": "🔍 Consultar Todo",
    "watch.fetch.loading": "Consultando...",
    "watch.internal.title": "🔄 Transferencias Internas",
    "watch.feed.title": "📡 Feed Completo",
    "watch.no.internal": "Sin transferencias internas",
    "watch.new.tx": "Nueva transacción detectada",
    "watch.report.warn": "Cartera reportada",
    "watch.cloud.fail": "Ocurrió un error del servidor.",
    "backup.alias_conflict.title": "Conflicto de Alias",
    "backup.alias_conflict.desc": "{n} direcciones tienen un alias diferente al actual. ¿Cuál desea usar?",
    "backup.alias_conflict.keep_latest": "Mantener Alias Más Reciente (Recomendado)",
    "backup.alias_conflict.use_backup": "Usar Alias del Momento del Backup",
    "ctx.trade": "Agregar Alias de Cartera",
    "tab.trade": "Alias de Cartera",
    "trade.title": "Alias de Cartera",
    "trade.desc": "Las direcciones registradas se mostrarán con su alias en el historial de transacciones.",
    "trade.empty": "No hay alias de cartera registrados.",
    "trade.add.title": "Agregar Alias de Cartera",
    "trade.add.err_full": "Ya tienes {n} alias de cartera. Elimina alguno e intenta de nuevo.",
    "cex.estimated": "Exchange (est.)",
    "ctx.watch": "Agregar a Lista de Seguimiento",
    "ctx.watch.slot": "{n} espacios restantes",
    "ctx.watch.exists": "Ya agregado",
    "ctx.watch.full": "Lista de seguimiento llena (máx 10)",
    "ctx.watch.alias_title": "Ingrese Alias",
    "ctx.watch.alias_ph": "Alias (opcional)",
    "ctx.watch.added": "Agregado",
    "ctx.register.both": "Registrar en Cartera Testnet de PiDEX Util",
    "ctx.both.alias_title": "Ingrese Alias",
    "ctx.both.alias_ph": "Alias (opcional)",
    "ctx.both.sent": "✅ Registrado",
    "ctx.both.fail": "Registro fallido",
    "ctx.both.dup": "Ya registrado",
    "ctx.both.full": "La lista de carteras testnet está llena ({n}). Libera un espacio en la app PiDEX Util e intenta de nuevo.",
    "ctx.pidex.no_login": "Se requiere inicio de sesión Pi.",
    "ctx.cancel": "Cancelar",
    "ctx.continue": "Continuar",
    "ctx.save": "Guardar",
    "toast.copied": "Copiado",
  },
  fr: {
    "tab.report": "Signaler",
    "tab.search": "Rechercher Portefeuille",
    "tab.mywallet": "Mon Portefeuille",
    "tab.watch": "Liste de Surveillance", "tab.ledger": "Grand Livre",
    "ledger.title": "Grand Livre du Portefeuille (Mensuel/Annuel)", "ledger.loading": "Chargement de l'historique...", "ledger.empty": "Aucune transaction.",
    "ledger.in": "Entrée", "ledger.out": "Sortie", "ledger.net": "Net", "ledger.year_total": "Total Annuel",
    "ledger.export": "📤 Exporter en CSV", "ledger.refresh": "↻ Actualiser",
    "ledger.note": "⚠️ Ce registre collecte l'historique des entrées/sorties du portefeuille à partir du moment où vous l'ouvrez pour la première fois. À partir de l'année fiscale 2027, il se synchronisera automatiquement en arrière jusqu'au 1er janvier de cette année-là. Pour la déclaration fiscale réelle, utilisez les relevés de transactions de votre plateforme d'échange comme base du coût d'acquisition — ce registre est uniquement à titre de référence pour les flux entrants/sortants du portefeuille.",
    "ledger.fail": "Échec du chargement de l'historique.", "ledger.counterpart_all": "Contrepartie (affiche toutes si aucune sélection)",
    "ledger.mode_combined": "Combiné", "ledger.mode_individual": "Individuel",
    "ledger.incomplete_warn": "Ce portefeuille a une activité trop importante pour se synchroniser automatiquement jusqu'au 1er janvier de cette année. Veuillez contacter l'administrateur (la limite peut être augmentée et resynchronisée pour vous).",
    "tab.tax": "Calcul Fiscal",
    "tax.title": "Calcul Fiscal (FIFO / Moyenne Mobile)",
    "tax.loading": "Chargement de l'historique des transactions...", "tax.syncing": "⏳ Synchronisation de l'historique des échanges...",
    "tax.method.fifo": "FIFO (Premier Entré, Premier Sorti)", "tax.method.moving_avg": "Moyenne Mobile",
    "tax.method.hint": "Selon la loi, les transactions via une bourse (prestataire d'actifs virtuels agréé) utilisent la méthode de la moyenne mobile ; les portefeuilles personnels et les DEX non dépositaires utilisent le FIFO.",
    "tax.untagged_hint": "Ce portefeuille de contrepartie n'est pas encore étiqueté. Étiquetez-le pour l'inclure dans le calcul.",
    "tax.method.unset": "Non étiqueté", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Moyenne Mobile",
    "tax.tag_now": "Étiqueter maintenant", "tax.tag_dialog.title": "Définir la Méthode de Calcul",
    "tax.disposal.date": "Date", "tax.disposal.qty": "Qté", "tax.disposal.proceeds": "Produit de Cession",
    "tax.disposal.cost": "Coût d'Acquisition", "tax.disposal.gain": "Gain/Perte",
    "tax.no_price": "⚠️ {n} entrées sans prix — exclues du calcul",
    "tax.manual_price.edit": "Définir un prix manuel", "tax.manual_price.auto": "Prix automatique",
    "tax.note": "⚠️ Ce calcul est fourni à titre indicatif uniquement. Consultez un fiscaliste avant toute déclaration réelle.",
    "tax.report.title": "Rapport pour Déclaration Fiscale", "tax.report.select_wallets": "Sélectionner les portefeuilles de contrepartie à inclure",
    "tax.report.self_swap": "Échange DEX personnel (FIFO)", "tax.report.date_from": "Du", "tax.report.date_to": "Au",
    "tax.report.generate": "Générer le Rapport",
    "tax.report.no_selection": "Sélectionnez au moins un portefeuille.",
    "tax.report.method_label": "Méthode Appliquée", "tax.report.period_label": "Période", "tax.report.wallets_label": "Portefeuilles de Contrepartie Inclus",
    "tax.report.total_gain": "Gain/Perte Total", "tax.report.export": "📤 Exporter le CSV du Rapport",
    "report.title": "🚨 Signaler une Arnaque",
    'report.realname_warn': "⚠️ Ce signalement est géré selon une <strong>politique du vrai nom</strong>.<br>Seul le titulaire du compte Pi connecté peut signaler,<br>et les faux signalements peuvent engager une responsabilité légale.",
    "report.victim_id": "ID Pi de la Victime",
    "report.suspect_wallet": "Adresse du Portefeuille Suspect",
    "report.amount": "Montant Perdu (Pi)",
    "report.date": "Date de l'Incident",
    "report.txhash": "Hash de Transaction (optionnel)",
    "report.desc": "Description (optionnel)",
    "report.btn": "Soumettre le Signalement",
    "report.btn.loading": "Envoi en cours...",
    "report.success": "✅ Signalement soumis.",
    "report.err.required": "Veuillez remplir tous les champs obligatoires.",
    "report.err.wallet": "Format d'adresse invalide (commence par G, 56 caractères).",
    "report.err.generic": "Une erreur est survenue. Veuillez réessayer.",
    "presearch.title": "Vérification Avant Signalement",
    "presearch.placeholder": "Entrez l'adresse suspecte...",
    "presearch.warn.not_wallet": "Veuillez entrer une adresse commençant par G.",
    "presearch.hint.short": "Entrez au moins 4 caractères.",
    "presearch.loading": "Recherche...",
    "presearch.none": "Aucun signalement existant trouvé.",
    "presearch.found": "{n} signalement(s) existant(s) trouvé(s).",
    "search.title": "🔍 Rechercher Portefeuille",
    "search.placeholder": "Entrez l'adresse (G...)",
    "search.btn": "Rechercher",
    "search.no_tx": "Aucune transaction",
    "search.err.fail": "Échec de la recherche",
    "search.err.not_found": "Portefeuille introuvable.",
    "search.error": "Erreur lors de la recherche.",
    "list.title": "🗂️ Liste des Signalements",
    "list.filter": "Rechercher portefeuille/ID victime...",
    "list.count": "signalements",
    "list.loading": "Chargement...",
    "list.empty": "Aucun signalement pour le moment.",
    "list.search_btn": "Rechercher",
    "list.wallet": "Portefeuille Suspect :",
    "summary.reports": "Signalements",
    "summary.reported_pi": "Total Signalé",
    "summary.tx_count": "Transactions Sortantes",
    "summary.total_sent": "Total Envoyé",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} signalement(s) correspondant(s)",
    "tx.victims": "Victimes",
    "risk.safe": "Sûr",
    "risk.low": "Prudence",
    "risk.mid": "Danger",
    "risk.high": "Risque Élevé",
    "matched.victim_id": "Victime",
    "matched.chain": "Correspondance de Chaîne",
    "top10.title": "Top 10 des Portefeuilles les Plus Signalés",
    "top10.cases": "cas",
    "verify.btn": "Vérifier",
    "verify.done": "Vérifié",
    "verify.mine": "Mon Signalement",
    "verify.confirmed": " vérifié(s)",
    "verify.toast": "Vérification enregistrée.",
    "export.toast": "Copié dans le presse-papiers.",
    "export.copied": "✅ Copié",
    "export.manual": "Sélectionnez tout et copiez.",
    "doc.title": "Rapport d'Enquête sur Arnaque Pi",
    "doc.generated": "Généré",
    "doc.wallet_sec": "Portefeuille Suspect",
    "doc.reports_sec": "Résumé des Signalements",
    "doc.count": "Nombre de Signalements",
    "doc.total_pi": "Total Signalé",
    "doc.victims_sec": "Liste des Victimes",
    "doc.victim_id": "ID Victime",
    "doc.damage": "Dommage",
    "doc.date": "Date",
    "doc.tx_hash": "Hash TX",
    "doc.situation": "Description",
    "doc.outgoing_sec": "Transactions Sortantes",
    "doc.no_tx": "Aucune",
    "doc.chain_match": "★ Correspond au Signalement",
    "doc.amount": "Montant",
    "doc.cex_sec": "Résumé des Transferts CEX",
    "doc.verify_sec": "Vérification des Données",
    "doc.verify_body": "Basé sur les données de transaction Horizon API (mainnet)",
    "doc.submit_sec": "Soumettre À",
    "doc.police": "Unité Locale de Cybercriminalité",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Support client de l'exchange si applicable",
    "doc.notes_sec": "Remarques",
    "doc.note1": "Ce document est fourni à titre de référence.",
    "doc.note2": "Les correspondances en chaîne sont des estimations, pas des preuves définitives.",
    "doc.note3": "L'interprétation peut varier selon la juridiction.",
    "mywallet.title": "Mon Portefeuille (Mainnet)",
    "mywallet.add": "Ajouter un Portefeuille",
    "mywallet.no_wallets": "Aucun portefeuille enregistré.",
    "mywallet.loading": "Chargement...",
    "mywallet.fail": "Échec du chargement",
    "mywallet.refresh": "Actualiser",
    "mywallet.load.fail": "Impossible de charger votre liste de portefeuilles depuis le serveur.",
    "mywallet.not_activated": "Ce portefeuille n'a pas encore été activé sur le mainnet Pi. (Un compte n'est créé qu'après avoir reçu du Pi au moins une fois)",
    'mywallet.not_activated.confirm': "Ajouter quand même ?",
    'mywallet.not_activated.icon_title': "Portefeuille inactif (jamais reçu de Pi)",
    "mywallet.max_hint": "Max {n}",
    "mywallet.pi.total": "π Solde Total",
    "mywallet.pi.avail": "Disponible",
    "mywallet.pi.reserve": "Réserve Min. (est.)",
    "mywallet.tokens": "Jetons",
    "mywallet.txs": "Transactions Récentes",
    "mywallet.lp": "Positions LP",
    'mywallet.lock.title': "Solde Verrouillé",
    'mywallet.lock.total': "Montant Verrouillé",
    'mywallet.lock.claimable': "Réclamable Maintenant",
    "backup.title": "Sauvegarde / Restauration",
    "backup.load_fail": "Impossible de charger les emplacements",
    "backup.empty": "Vide",
    "backup.slot": "Emplacement {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Sauvegarde Complète",
    "backup.btn.append_backup": "Sauvegarde Ajoutée",
    "backup.btn.full_restore": "Restauration Complète",
    "backup.btn.append_restore": "Restauration Ajoutée",
    "backup.saved": "Sauvegarde enregistrée",
    "backup.fail": "Une erreur est survenue",
    "backup.confirm.overwrite": "Les données existantes de l'emplacement {n} seront supprimées et remplacées par la liste actuelle. Continuer ?",
    "backup.confirm.save": "Sauvegarder la liste actuelle dans l'emplacement {n}.",
    "backup.confirm.truncate": "Seuls {n} seront enregistrés et {dropped} seront exclus. Continuer ?",
    "backup.confirm.restore_full": "La liste actuelle sera effacée et remplacée par le contenu de l'emplacement {n}. Continuer ?",
    "mywallet.no_lp": "Aucune position LP",
    "mywallet.tx_none": "Aucune transaction",
    "mywallet.updated": "Mis à jour",
    "mywallet.tx_sent": "Envoyé",
    "mywallet.tx_recv": "Reçu",
    "mywallet.add.title": "Ajouter un Portefeuille",
    "mywallet.add.alias_ph": "Alias (ex. Portefeuille Principal)",
    "mywallet.add.addr_ph": "Adresse du Portefeuille (G...)",
    "mywallet.add.err_addr": "Adresse invalide (commence par G, 56 caractères)",
    "mywallet.add.err_dup": "Cette adresse est déjà enregistrée.",
    "mywallet.add.err_full": "Votre liste Mon Portefeuille est pleine (30). Supprimez-en un et réessayez.",
    "mywallet.alias.edit": "Modifier l'Alias",
    "mywallet.delete": "Supprimer le Portefeuille",
    "mywallet.delete.confirm": "Voulez-vous vraiment supprimer ce portefeuille ?",
    "mywallet.cloud.fail": "Une erreur serveur est survenue.",
    "watch.title": "Liste de Surveillance",
    "watch.empty": "Aucun portefeuille dans la liste de surveillance.",
    "watch.load.fail": "Impossible de charger votre liste de surveillance depuis le serveur.",
    "watch.max_hint": "(max {n})",
    "watch.add.btn": "Ajouter un Portefeuille",
    "watch.add.addr_ph": "Adresse du portefeuille (G...)",
    "watch.add.err_addr": "Veuillez vérifier l'adresse.",
    "watch.fetch.btn": "🔍 Tout Récupérer",
    "watch.fetch.loading": "Récupération...",
    "watch.internal.title": "🔄 Transferts Internes",
    "watch.feed.title": "📡 Flux Complet",
    "watch.no.internal": "Aucun transfert interne",
    "watch.new.tx": "Nouvelle transaction détectée",
    "watch.report.warn": "Portefeuille signalé",
    "watch.cloud.fail": "Une erreur serveur est survenue.",
    "backup.alias_conflict.title": "Conflit d'Alias",
    "backup.alias_conflict.desc": "{n} adresse(s) ont un alias différent de l'actuel. Lequel utiliser ?",
    "backup.alias_conflict.keep_latest": "Conserver l'Alias le Plus Récent (Recommandé)",
    "backup.alias_conflict.use_backup": "Utiliser l'Alias au Moment de la Sauvegarde",
    "ctx.trade": "Ajouter un Alias de Portefeuille",
    "tab.trade": "Alias de Portefeuille",
    "trade.title": "Alias de Portefeuille",
    "trade.desc": "Les adresses enregistrées s'afficheront avec leur alias dans l'historique des transactions.",
    "trade.empty": "Aucun alias de portefeuille enregistré.",
    "trade.add.title": "Ajouter un Alias de Portefeuille",
    "trade.add.err_full": "Vous avez déjà {n} alias de portefeuille. Supprimez-en avant de réessayer.",
    "cex.estimated": "Exchange (est.)",
    "ctx.watch": "Ajouter à la Liste de Surveillance",
    "ctx.watch.slot": "{n} emplacement(s) restant(s)",
    "ctx.watch.exists": "Déjà ajouté",
    "ctx.watch.full": "Liste de surveillance pleine (max 10)",
    "ctx.watch.alias_title": "Entrez l'Alias",
    "ctx.watch.alias_ph": "Alias (optionnel)",
    "ctx.watch.added": "Ajouté",
    "ctx.register.both": "Enregistrer dans le Portefeuille Testnet PiDEX Util",
    "ctx.both.alias_title": "Entrez l'Alias",
    "ctx.both.alias_ph": "Alias (optionnel)",
    "ctx.both.sent": "✅ Enregistré",
    "ctx.both.fail": "Échec de l'enregistrement",
    "ctx.both.dup": "Déjà enregistré",
    "ctx.both.full": "La liste des portefeuilles testnet est pleine ({n}). Libérez un emplacement dans l'application PiDEX Util et réessayez.",
    "ctx.pidex.no_login": "Connexion Pi requise.",
    "ctx.cancel": "Annuler",
    "ctx.continue": "Continuer",
    "ctx.save": "Enregistrer",
    "toast.copied": "Copié",
  },
  vi: {
    "tab.report": "Báo cáo",
    "tab.search": "Tra cứu Ví",
    "tab.mywallet": "Ví của tôi",
    "tab.watch": "Danh sách theo dõi", "tab.ledger": "Sổ Cái",
    "ledger.title": "Sổ Cái Ví (Theo Tháng/Năm)", "ledger.loading": "Đang tải lịch sử...", "ledger.empty": "Không có giao dịch.",
    "ledger.in": "Vào", "ledger.out": "Ra", "ledger.net": "Ròng", "ledger.year_total": "Tổng Năm",
    "ledger.export": "📤 Xuất CSV", "ledger.refresh": "↻ Làm mới",
    "ledger.note": "⚠️ Sổ cái này thu thập lịch sử vào/ra của ví kể từ lần đầu tiên bạn mở nó. Từ năm tính thuế 2027 trở đi, sổ cái sẽ tự động đồng bộ ngược về ngày 1 tháng 1 năm đó. Khi khai thuế thực tế, hãy dùng lịch sử khớp lệnh trên sàn giao dịch làm cơ sở giá vốn — sổ cái này chỉ mang tính tham khảo cho dòng tiền vào/ra của ví.",
    "ledger.fail": "Không tải được lịch sử.", "ledger.counterpart_all": "Đối tác (hiển thị tất cả nếu không chọn)",
    "ledger.mode_combined": "Tổng hợp", "ledger.mode_individual": "Riêng lẻ",
    "ledger.incomplete_warn": "Ví này có quá nhiều hoạt động để tự động đồng bộ đến ngày 1 tháng 1 năm nay. Vui lòng liên hệ quản trị viên (có thể nâng giới hạn và đồng bộ lại cho bạn).",
    "tab.tax": "Tính Thuế",
    "tax.title": "Tính Thuế (FIFO / Bình Quân Gia Quyền)",
    "tax.loading": "Đang tải lịch sử giao dịch...", "tax.syncing": "⏳ Đang đồng bộ lịch sử hoán đổi...",
    "tax.method.fifo": "FIFO (Nhập Trước Xuất Trước)", "tax.method.moving_avg": "Bình Quân Gia Quyền",
    "tax.method.hint": "Theo luật, giao dịch qua sàn (nhà cung cấp tài sản ảo được cấp phép) áp dụng phương pháp bình quân gia quyền; ví cá nhân và DEX phi lưu ký áp dụng FIFO.",
    "tax.untagged_hint": "Đây là ví đối tác chưa được gắn nhãn. Gắn nhãn để đưa vào tính toán.",
    "tax.method.unset": "Chưa gắn nhãn", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Bình Quân",
    "tax.tag_now": "Gắn nhãn ngay", "tax.tag_dialog.title": "Đặt Phương Pháp Tính",
    "tax.disposal.date": "Ngày", "tax.disposal.qty": "SL", "tax.disposal.proceeds": "Số Tiền Thu Được",
    "tax.disposal.cost": "Giá Vốn", "tax.disposal.gain": "Lãi/Lỗ",
    "tax.no_price": "⚠️ {n} mục không có giá — bị loại khỏi tính toán",
    "tax.manual_price.edit": "Đặt giá thủ công", "tax.manual_price.auto": "Giá tự động",
    "tax.note": "⚠️ Kết quả tính toán này chỉ mang tính tham khảo. Hãy xác nhận với chuyên gia thuế trước khi khai báo thực tế.",
    "tax.report.title": "Báo Cáo Nộp Thuế", "tax.report.select_wallets": "Chọn ví đối tác cần bao gồm",
    "tax.report.self_swap": "Hoán đổi tự thân trên DEX (FIFO)", "tax.report.date_from": "Từ ngày", "tax.report.date_to": "Đến ngày",
    "tax.report.generate": "Tạo Báo Cáo",
    "tax.report.no_selection": "Vui lòng chọn ít nhất một ví.",
    "tax.report.method_label": "Phương Pháp Áp Dụng", "tax.report.period_label": "Kỳ", "tax.report.wallets_label": "Ví Đối Tác Được Bao Gồm",
    "tax.report.total_gain": "Tổng Lãi/Lỗ", "tax.report.export": "📤 Xuất CSV Báo Cáo",
    "report.title": "🚨 Báo cáo Lừa đảo",
    'report.realname_warn': "⚠️ Báo cáo này được vận hành theo <strong>chính sách tên thật</strong>.<br>Chỉ chủ tài khoản Pi đã đăng nhập mới có thể báo cáo,<br>và báo cáo sai có thể chịu trách nhiệm pháp lý.",
    "report.victim_id": "ID Pi của Nạn nhân",
    "report.suspect_wallet": "Địa chỉ Ví Nghi ngờ",
    "report.amount": "Số tiền Mất (Pi)",
    "report.date": "Ngày Xảy ra",
    "report.txhash": "Mã Giao dịch (tùy chọn)",
    "report.desc": "Mô tả (tùy chọn)",
    "report.btn": "Gửi Báo cáo",
    "report.btn.loading": "Đang gửi...",
    "report.success": "✅ Đã gửi báo cáo.",
    "report.err.required": "Vui lòng điền đầy đủ các trường bắt buộc.",
    "report.err.wallet": "Định dạng địa chỉ ví không hợp lệ (bắt đầu bằng G, 56 ký tự).",
    "report.err.generic": "Đã xảy ra lỗi. Vui lòng thử lại.",
    "presearch.title": "Kiểm tra Trước khi Báo cáo",
    "presearch.placeholder": "Nhập địa chỉ ví nghi ngờ...",
    "presearch.warn.not_wallet": "Vui lòng nhập địa chỉ ví bắt đầu bằng G.",
    "presearch.hint.short": "Nhập ít nhất 4 ký tự.",
    "presearch.loading": "Đang tìm kiếm...",
    "presearch.none": "Không tìm thấy báo cáo nào.",
    "presearch.found": "Tìm thấy {n} báo cáo hiện có.",
    "search.title": "🔍 Tra cứu Ví",
    "search.placeholder": "Nhập địa chỉ ví (G...)",
    "search.btn": "Tra cứu",
    "search.no_tx": "Không có giao dịch",
    "search.err.fail": "Tra cứu thất bại",
    "search.err.not_found": "Không tìm thấy ví.",
    "search.error": "Lỗi khi tra cứu.",
    "list.title": "🗂️ Danh sách Báo cáo",
    "list.filter": "Tìm ví/ID nạn nhân...",
    "list.count": "báo cáo",
    "list.loading": "Đang tải...",
    "list.empty": "Chưa có báo cáo nào.",
    "list.search_btn": "Tra cứu",
    "list.wallet": "Ví Nghi ngờ:",
    "summary.reports": "Báo cáo",
    "summary.reported_pi": "Tổng Báo cáo",
    "summary.tx_count": "Giao dịch Gửi đi",
    "summary.total_sent": "Tổng Đã gửi",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} báo cáo trùng khớp",
    "tx.victims": "Nạn nhân",
    "risk.safe": "An toàn",
    "risk.low": "Cẩn thận",
    "risk.mid": "Nguy hiểm",
    "risk.high": "Rất Nguy hiểm",
    "matched.victim_id": "Nạn nhân",
    "matched.chain": "Trùng khớp Chuỗi",
    "top10.title": "Top 10 Ví Bị Báo cáo Nhiều nhất",
    "top10.cases": "vụ",
    "verify.btn": "Xác nhận",
    "verify.done": "Đã xác nhận",
    "verify.mine": "Báo cáo của tôi",
    "verify.confirmed": " người xác nhận",
    "verify.toast": "Đã ghi nhận xác nhận.",
    "export.toast": "Đã sao chép vào bộ nhớ tạm.",
    "export.copied": "✅ Đã sao chép",
    "export.manual": "Chọn tất cả rồi sao chép.",
    "doc.title": "Tài liệu Điều tra Lừa đảo Pi",
    "doc.generated": "Đã tạo",
    "doc.wallet_sec": "Ví Nghi ngờ",
    "doc.reports_sec": "Tóm tắt Báo cáo",
    "doc.count": "Số Báo cáo",
    "doc.total_pi": "Tổng Báo cáo",
    "doc.victims_sec": "Danh sách Nạn nhân",
    "doc.victim_id": "ID Nạn nhân",
    "doc.damage": "Thiệt hại",
    "doc.date": "Ngày",
    "doc.tx_hash": "Mã TX",
    "doc.situation": "Mô tả",
    "doc.outgoing_sec": "Giao dịch Gửi đi",
    "doc.no_tx": "Không có",
    "doc.chain_match": "★ Trùng khớp Báo cáo",
    "doc.amount": "Số tiền",
    "doc.cex_sec": "Tóm tắt Chuyển khoản CEX",
    "doc.verify_sec": "Xác minh Dữ liệu",
    "doc.verify_body": "Dựa trên dữ liệu giao dịch Horizon API (mainnet)",
    "doc.submit_sec": "Gửi Đến",
    "doc.police": "Đơn vị Tội phạm Mạng Địa phương",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Hỗ trợ khách hàng sàn giao dịch nếu có",
    "doc.notes_sec": "Ghi chú",
    "doc.note1": "Tài liệu này chỉ mang tính tham khảo.",
    "doc.note2": "Trùng khớp chuỗi là ước tính, không phải bằng chứng chắc chắn.",
    "doc.note3": "Cách diễn giải có thể khác nhau tùy theo cơ quan pháp luật.",
    "mywallet.title": "Ví của tôi (Mainnet)",
    "mywallet.add": "Thêm Ví",
    "mywallet.no_wallets": "Chưa có ví nào được đăng ký.",
    "mywallet.loading": "Đang tải...",
    "mywallet.fail": "Tải thất bại",
    "mywallet.refresh": "Làm mới",
    "mywallet.load.fail": "Không thể tải danh sách ví của bạn từ server.",
    "mywallet.not_activated": "Ví này chưa được kích hoạt trên Pi mainnet. (Tài khoản chỉ được tạo sau khi nhận Pi ít nhất một lần)",
    'mywallet.not_activated.confirm': "Vẫn thêm chứ?",
    'mywallet.not_activated.icon_title': "Ví chưa kích hoạt (chưa từng nhận Pi)",
    "mywallet.max_hint": "Tối đa {n}",
    "mywallet.pi.total": "π Tổng số dư",
    "mywallet.pi.avail": "Khả dụng",
    "mywallet.pi.reserve": "Dự trữ Tối thiểu (ước tính)",
    "mywallet.tokens": "Token",
    "mywallet.txs": "Giao dịch Gần đây",
    "mywallet.lp": "Vị thế LP",
    'mywallet.lock.title': "Số Dư Bị Khóa",
    'mywallet.lock.total': "Số Tiền Bị Khóa",
    'mywallet.lock.claimable': "Có Thể Nhận Ngay",
    "backup.title": "Sao lưu / Khôi phục",
    "backup.load_fail": "Không thể tải các khe",
    "backup.empty": "Trống",
    "backup.slot": "Khe {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Sao lưu Toàn bộ",
    "backup.btn.append_backup": "Sao lưu Bổ sung",
    "backup.btn.full_restore": "Khôi phục Toàn bộ",
    "backup.btn.append_restore": "Khôi phục Bổ sung",
    "backup.saved": "Đã lưu sao lưu",
    "backup.fail": "Đã xảy ra lỗi",
    "backup.confirm.overwrite": "Dữ liệu hiện có trong Khe {n} sẽ bị xóa và thay bằng danh sách hiện tại. Tiếp tục?",
    "backup.confirm.save": "Sao lưu danh sách hiện tại vào Khe {n}.",
    "backup.confirm.truncate": "Chỉ {n} mục sẽ được lưu và {dropped} mục sẽ bị loại bỏ. Tiếp tục?",
    "backup.confirm.restore_full": "Danh sách hiện tại sẽ bị xóa và thay bằng nội dung của Khe {n}. Tiếp tục?",
    "mywallet.no_lp": "Không có LP",
    "mywallet.tx_none": "Không có giao dịch",
    "mywallet.updated": "Đã cập nhật",
    "mywallet.tx_sent": "Đã gửi",
    "mywallet.tx_recv": "Đã nhận",
    "mywallet.add.title": "Thêm Ví",
    "mywallet.add.alias_ph": "Biệt danh (vd: Ví chính)",
    "mywallet.add.addr_ph": "Địa chỉ Ví (G...)",
    "mywallet.add.err_addr": "Địa chỉ không hợp lệ (bắt đầu G, 56 ký tự)",
    "mywallet.add.err_dup": "Địa chỉ này đã được đăng ký.",
    "mywallet.add.err_full": "Danh sách Ví của tôi đã đầy (30). Xóa một cái rồi thử lại.",
    "mywallet.alias.edit": "Sửa Biệt danh",
    "mywallet.delete": "Xóa Ví",
    "mywallet.delete.confirm": "Bạn có chắc muốn xóa ví này không?",
    "mywallet.cloud.fail": "Đã xảy ra lỗi server.",
    "watch.title": "Danh sách theo dõi",
    "watch.empty": "Không có ví nào trong danh sách theo dõi.",
    "watch.load.fail": "Không thể tải danh sách theo dõi của bạn từ server.",
    "watch.max_hint": "(tối đa {n})",
    "watch.add.btn": "Thêm Ví",
    "watch.add.addr_ph": "Địa chỉ ví (G...)",
    "watch.add.err_addr": "Vui lòng kiểm tra địa chỉ.",
    "watch.fetch.btn": "🔍 Tải Tất cả",
    "watch.fetch.loading": "Đang tải...",
    "watch.internal.title": "🔄 Giao dịch Nội bộ",
    "watch.feed.title": "📡 Toàn bộ Feed",
    "watch.no.internal": "Không có giao dịch nội bộ",
    "watch.new.tx": "Phát hiện giao dịch mới",
    "watch.report.warn": "Ví đã bị báo cáo",
    "watch.cloud.fail": "Đã xảy ra lỗi server.",
    "backup.alias_conflict.title": "Xung Đột Biệt Danh",
    "backup.alias_conflict.desc": "{n} địa chỉ có biệt danh khác với hiện tại. Dùng biệt danh nào?",
    "backup.alias_conflict.keep_latest": "Giữ Biệt Danh Mới Nhất (Khuyên dùng)",
    "backup.alias_conflict.use_backup": "Dùng Biệt Danh Lúc Sao Lưu",
    "ctx.trade": "Thêm Biệt Danh Ví",
    "tab.trade": "Biệt Danh Ví",
    "trade.title": "Biệt Danh Ví",
    "trade.desc": "Địa chỉ đã đăng ký sẽ hiển thị bằng biệt danh trong danh sách giao dịch.",
    "trade.empty": "Chưa đăng ký biệt danh ví nào.",
    "trade.add.title": "Thêm Biệt Danh Ví",
    "trade.add.err_full": "Bạn đã có {n} biệt danh ví. Vui lòng xóa bớt rồi thử lại.",
    "cex.estimated": "Sàn giao dịch (ước tính)",
    "ctx.watch": "Thêm vào Danh sách theo dõi",
    "ctx.watch.slot": "Còn {n} chỗ trống",
    "ctx.watch.exists": "Đã thêm",
    "ctx.watch.full": "Danh sách theo dõi đã đầy (tối đa 10)",
    "ctx.watch.alias_title": "Nhập Biệt danh",
    "ctx.watch.alias_ph": "Biệt danh (tùy chọn)",
    "ctx.watch.added": "Đã thêm",
    "ctx.register.both": "Đăng ký vào Ví Testnet PiDEX Util",
    "ctx.both.alias_title": "Nhập Biệt danh",
    "ctx.both.alias_ph": "Biệt danh (tùy chọn)",
    "ctx.both.sent": "✅ Đã đăng ký",
    "ctx.both.fail": "Đăng ký thất bại",
    "ctx.both.dup": "Đã đăng ký",
    "ctx.both.full": "Danh sách ví testnet đã đầy ({n}). Hãy dọn chỗ trống trong ứng dụng PiDEX Util rồi thử lại.",
    "ctx.pidex.no_login": "Yêu cầu đăng nhập Pi.",
    "ctx.cancel": "Hủy",
    "ctx.continue": "Tiếp tục",
    "ctx.save": "Lưu",
    "toast.copied": "Đã sao chép",
  },
  pt: {
    "tab.report": "Denunciar",
    "tab.search": "Buscar Carteira",
    "tab.mywallet": "Minha Carteira",
    "tab.watch": "Lista de Observação", "tab.ledger": "Livro-razão",
    "ledger.title": "Livro-razão da Carteira (Mensal/Anual)", "ledger.loading": "Carregando histórico...", "ledger.empty": "Nenhuma transação.",
    "ledger.in": "Entrada", "ledger.out": "Saída", "ledger.net": "Líquido", "ledger.year_total": "Total Anual",
    "ledger.export": "📤 Exportar CSV", "ledger.refresh": "↻ Atualizar",
    "ledger.note": "⚠️ Este livro-razão coleta o histórico de entrada/saída da carteira a partir do momento em que você o abre pela primeira vez. A partir do ano fiscal de 2027, ele sincronizará automaticamente retroativamente até 1º de janeiro daquele ano. Para a declaração de impostos real, use os registros de negociação da sua corretora como base do custo de aquisição — este livro-razão é apenas para referência do fluxo de entrada/saída da carteira.",
    "ledger.fail": "Falha ao carregar o histórico.", "ledger.counterpart_all": "Contraparte (mostra todas se nenhuma selecionada)",
    "ledger.mode_combined": "Combinado", "ledger.mode_individual": "Individual",
    "ledger.incomplete_warn": "Esta carteira tem atividade demais para sincronizar automaticamente até 1º de janeiro deste ano. Entre em contato com o administrador (o limite pode ser aumentado e ressincronizado para você).",
    "tab.tax": "Cálculo de Impostos",
    "tax.title": "Cálculo de Impostos (FIFO / Média Móvel)",
    "tax.loading": "Carregando histórico de transações...", "tax.syncing": "⏳ Sincronizando histórico de trocas...",
    "tax.method.fifo": "FIFO (Primeiro a Entrar, Primeiro a Sair)", "tax.method.moving_avg": "Média Móvel",
    "tax.method.hint": "Por lei, transações via uma exchange (provedor de ativos virtuais licenciado) usam o método de média móvel; carteiras pessoais e DEX não custodiados usam FIFO.",
    "tax.untagged_hint": "Esta é uma carteira de contraparte ainda não etiquetada. Etiquete-a para incluí-la no cálculo.",
    "tax.method.unset": "Sem etiqueta", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Média Móvel",
    "tax.tag_now": "Etiquetar agora", "tax.tag_dialog.title": "Definir Método de Cálculo",
    "tax.disposal.date": "Data", "tax.disposal.qty": "Qtd", "tax.disposal.proceeds": "Valor da Venda",
    "tax.disposal.cost": "Custo de Aquisição", "tax.disposal.gain": "Ganho/Perda",
    "tax.no_price": "⚠️ {n} entradas sem preço — excluídas do cálculo",
    "tax.manual_price.edit": "Definir preço manual", "tax.manual_price.auto": "Preço automático",
    "tax.note": "⚠️ Este cálculo é apenas para referência. Confirme com um contador antes da declaração real.",
    "tax.report.title": "Relatório para Declaração de Impostos", "tax.report.select_wallets": "Selecionar carteiras de contraparte a incluir",
    "tax.report.self_swap": "Troca própria na DEX (FIFO)", "tax.report.date_from": "De", "tax.report.date_to": "Até",
    "tax.report.generate": "Gerar Relatório",
    "tax.report.no_selection": "Selecione pelo menos uma carteira.",
    "tax.report.method_label": "Método Aplicado", "tax.report.period_label": "Período", "tax.report.wallets_label": "Carteiras de Contraparte Incluídas",
    "tax.report.total_gain": "Ganho/Perda Total", "tax.report.export": "📤 Exportar CSV do Relatório",
    "report.title": "🚨 Denunciar Golpe",
    'report.realname_warn': "⚠️ Esta denúncia é operada sob uma <strong>política de nome real</strong>.<br>Somente o titular da conta Pi conectado pode denunciar,<br>e denúncias falsas podem gerar responsabilidade legal.",
    "report.victim_id": "ID Pi da Vítima",
    "report.suspect_wallet": "Endereço da Carteira Suspeita",
    "report.amount": "Valor Perdido (Pi)",
    "report.date": "Data do Incidente",
    "report.txhash": "Hash da Transação (opcional)",
    "report.desc": "Descrição (opcional)",
    "report.btn": "Enviar Denúncia",
    "report.btn.loading": "Enviando...",
    "report.success": "✅ Denúncia enviada.",
    "report.err.required": "Preencha todos os campos obrigatórios.",
    "report.err.wallet": "Formato de endereço inválido (começa com G, 56 caracteres).",
    "report.err.generic": "Ocorreu um erro. Tente novamente.",
    "presearch.title": "Verificação Antes de Denunciar",
    "presearch.placeholder": "Digite o endereço suspeito...",
    "presearch.warn.not_wallet": "Digite um endereço que comece com G.",
    "presearch.hint.short": "Digite pelo menos 4 caracteres.",
    "presearch.loading": "Buscando...",
    "presearch.none": "Nenhuma denúncia existente encontrada.",
    "presearch.found": "{n} denúncia(s) existente(s) encontrada(s).",
    "search.title": "🔍 Buscar Carteira",
    "search.placeholder": "Digite o endereço (G...)",
    "search.btn": "Buscar",
    "search.no_tx": "Sem transações",
    "search.err.fail": "Busca falhou",
    "search.err.not_found": "Carteira não encontrada.",
    "search.error": "Erro durante a busca.",
    "list.title": "🗂️ Lista de Denúncias",
    "list.filter": "Buscar carteira/ID da vítima...",
    "list.count": "denúncias",
    "list.loading": "Carregando...",
    "list.empty": "Ainda não há denúncias.",
    "list.search_btn": "Buscar",
    "list.wallet": "Carteira Suspeita:",
    "summary.reports": "Denúncias",
    "summary.reported_pi": "Total Denunciado",
    "summary.tx_count": "Transações Enviadas",
    "summary.total_sent": "Total Enviado",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} denúncia(s) correspondente(s)",
    "tx.victims": "Vítimas",
    "risk.safe": "Seguro",
    "risk.low": "Cuidado",
    "risk.mid": "Perigo",
    "risk.high": "Alto Risco",
    "matched.victim_id": "Vítima",
    "matched.chain": "Correspondência de Cadeia",
    "top10.title": "Top 10 Carteiras Mais Denunciadas",
    "top10.cases": "casos",
    "verify.btn": "Verificar",
    "verify.done": "Verificado",
    "verify.mine": "Minha Denúncia",
    "verify.confirmed": " verificado(s)",
    "verify.toast": "Verificação registrada.",
    "export.toast": "Copiado para a área de transferência.",
    "export.copied": "✅ Copiado",
    "export.manual": "Selecione tudo e copie.",
    "doc.title": "Relatório de Investigação de Golpe Pi",
    "doc.generated": "Gerado",
    "doc.wallet_sec": "Carteira Suspeita",
    "doc.reports_sec": "Resumo de Denúncias",
    "doc.count": "Quantidade de Denúncias",
    "doc.total_pi": "Total Denunciado",
    "doc.victims_sec": "Lista de Vítimas",
    "doc.victim_id": "ID da Vítima",
    "doc.damage": "Dano",
    "doc.date": "Data",
    "doc.tx_hash": "Hash TX",
    "doc.situation": "Descrição",
    "doc.outgoing_sec": "Transações Enviadas",
    "doc.no_tx": "Nenhuma",
    "doc.chain_match": "★ Corresponde à Denúncia",
    "doc.amount": "Valor",
    "doc.cex_sec": "Resumo de Transferências CEX",
    "doc.verify_sec": "Verificação de Dados",
    "doc.verify_body": "Baseado em dados de transações da Horizon API (mainnet)",
    "doc.submit_sec": "Enviar Para",
    "doc.police": "Unidade Local de Crimes Cibernéticos",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Suporte ao cliente da corretora, se aplicável",
    "doc.notes_sec": "Notas",
    "doc.note1": "Este documento é apenas para referência.",
    "doc.note2": "Correspondências em cadeia são estimativas, não provas definitivas.",
    "doc.note3": "A interpretação pode variar de acordo com a jurisdição.",
    "mywallet.title": "Minha Carteira (Mainnet)",
    "mywallet.add": "Adicionar Carteira",
    "mywallet.no_wallets": "Nenhuma carteira registrada.",
    "mywallet.loading": "Carregando...",
    "mywallet.fail": "Falha ao carregar",
    "mywallet.refresh": "Atualizar",
    "mywallet.load.fail": "Não foi possível carregar sua lista de carteiras do servidor.",
    "mywallet.not_activated": "Esta carteira ainda não foi ativada na mainnet do Pi. (Uma conta só é criada após receber Pi pelo menos uma vez)",
    'mywallet.not_activated.confirm': "Adicionar mesmo assim?",
    'mywallet.not_activated.icon_title': "Carteira inativa (nunca recebeu Pi)",
    "mywallet.max_hint": "Máx {n}",
    "mywallet.pi.total": "π Saldo Total",
    "mywallet.pi.avail": "Disponível",
    "mywallet.pi.reserve": "Reserva Mín. (est.)",
    "mywallet.tokens": "Tokens",
    "mywallet.txs": "Transações Recentes",
    "mywallet.lp": "Posições LP",
    'mywallet.lock.title': "Saldo Bloqueado",
    'mywallet.lock.total': "Valor Bloqueado",
    'mywallet.lock.claimable': "Resgatável Agora",
    "backup.title": "Backup / Restaurar",
    "backup.load_fail": "Não foi possível carregar os slots",
    "backup.empty": "Vazio",
    "backup.slot": "Slot {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Backup Completo",
    "backup.btn.append_backup": "Backup Adicional",
    "backup.btn.full_restore": "Restauração Completa",
    "backup.btn.append_restore": "Restauração Adicional",
    "backup.saved": "Backup salvo",
    "backup.fail": "Ocorreu um erro",
    "backup.confirm.overwrite": "Os dados existentes no Slot {n} serão excluídos e substituídos pela lista atual. Continuar?",
    "backup.confirm.save": "Fazer backup da lista atual no Slot {n}.",
    "backup.confirm.truncate": "Apenas {n} serão salvos e {dropped} serão descartados. Continuar?",
    "backup.confirm.restore_full": "A lista atual será apagada e substituída pelo conteúdo do Slot {n}. Continuar?",
    "mywallet.no_lp": "Sem posições LP",
    "mywallet.tx_none": "Sem transações",
    "mywallet.updated": "Atualizado",
    "mywallet.tx_sent": "Enviado",
    "mywallet.tx_recv": "Recebido",
    "mywallet.add.title": "Adicionar Carteira",
    "mywallet.add.alias_ph": "Apelido (ex. Carteira Principal)",
    "mywallet.add.addr_ph": "Endereço da Carteira (G...)",
    "mywallet.add.err_addr": "Endereço inválido (começa com G, 56 caracteres)",
    "mywallet.add.err_dup": "Este endereço já está registrado.",
    "mywallet.add.err_full": "Sua lista Minha Carteira está cheia (30). Remova uma e tente novamente.",
    "mywallet.alias.edit": "Editar Apelido",
    "mywallet.delete": "Excluir Carteira",
    "mywallet.delete.confirm": "Tem certeza que deseja excluir esta carteira?",
    "mywallet.cloud.fail": "Ocorreu um erro no servidor.",
    "watch.title": "Lista de Observação",
    "watch.empty": "Nenhuma carteira na lista de observação.",
    "watch.load.fail": "Não foi possível carregar sua lista de observação do servidor.",
    "watch.max_hint": "(máx {n})",
    "watch.add.btn": "Adicionar Carteira",
    "watch.add.addr_ph": "Endereço da carteira (G...)",
    "watch.add.err_addr": "Verifique o endereço.",
    "watch.fetch.btn": "🔍 Buscar Tudo",
    "watch.fetch.loading": "Buscando...",
    "watch.internal.title": "🔄 Transferências Internas",
    "watch.feed.title": "📡 Feed Completo",
    "watch.no.internal": "Sem transferências internas",
    "watch.new.tx": "Nova transação detectada",
    "watch.report.warn": "Carteira denunciada",
    "watch.cloud.fail": "Ocorreu um erro no servidor.",
    "backup.alias_conflict.title": "Conflito de Apelido",
    "backup.alias_conflict.desc": "{n} endereço(s) têm um apelido diferente do atual. Qual usar?",
    "backup.alias_conflict.keep_latest": "Manter Apelido Mais Recente (Recomendado)",
    "backup.alias_conflict.use_backup": "Usar Apelido do Momento do Backup",
    "ctx.trade": "Adicionar Apelido de Carteira",
    "tab.trade": "Apelido de Carteira",
    "trade.title": "Apelidos de Carteira",
    "trade.desc": "Endereços registrados serão exibidos com seu apelido na lista de transações.",
    "trade.empty": "Nenhum apelido de carteira registrado.",
    "trade.add.title": "Adicionar Apelido de Carteira",
    "trade.add.err_full": "Você já possui {n} apelidos de carteira. Remova alguns e tente novamente.",
    "cex.estimated": "Corretora (est.)",
    "ctx.watch": "Adicionar à Lista de Observação",
    "ctx.watch.slot": "{n} vaga(s) restante(s)",
    "ctx.watch.exists": "Já adicionado",
    "ctx.watch.full": "Lista de observação cheia (máx 10)",
    "ctx.watch.alias_title": "Digite o Apelido",
    "ctx.watch.alias_ph": "Apelido (opcional)",
    "ctx.watch.added": "Adicionado",
    "ctx.register.both": "Registrar na Carteira Testnet PiDEX Util",
    "ctx.both.alias_title": "Digite o Apelido",
    "ctx.both.alias_ph": "Apelido (opcional)",
    "ctx.both.sent": "✅ Registrado",
    "ctx.both.fail": "Registro falhou",
    "ctx.both.dup": "Já registrado",
    "ctx.both.full": "A lista de carteiras testnet está cheia ({n}). Libere uma vaga no app PiDEX Util e tente novamente.",
    "ctx.pidex.no_login": "Login Pi necessário.",
    "ctx.cancel": "Cancelar",
    "ctx.continue": "Continuar",
    "ctx.save": "Salvar",
    "toast.copied": "Copiado",
  },
  ms: {
    "tab.report": "Laporkan",
    "tab.search": "Cari Dompet",
    "tab.mywallet": "Dompet Saya",
    "tab.watch": "Senarai Pantauan", "tab.ledger": "Lejar",
    "ledger.title": "Lejar Dompet (Bulanan/Tahunan)", "ledger.loading": "Memuatkan sejarah...", "ledger.empty": "Tiada transaksi.",
    "ledger.in": "Masuk", "ledger.out": "Keluar", "ledger.net": "Bersih", "ledger.year_total": "Jumlah Tahunan",
    "ledger.export": "📤 Eksport CSV", "ledger.refresh": "↻ Segar Semula",
    "ledger.note": "⚠️ Lejar ini mengumpul sejarah masuk/keluar dompet bermula dari masa anda membukanya buat kali pertama. Mulai tahun cukai 2027, ia akan disegerakkan secara automatik ke belakang sehingga 1 Januari tahun tersebut. Untuk pemfailan cukai sebenar, gunakan rekod dagangan bursa anda sebagai asas kos perolehan — lejar ini hanya untuk rujukan aliran masuk/keluar dompet.",
    "ledger.fail": "Gagal memuatkan sejarah.", "ledger.counterpart_all": "Rakan Niaga (papar semua jika tiada dipilih)",
    "ledger.mode_combined": "Gabungan", "ledger.mode_individual": "Individu",
    "ledger.incomplete_warn": "Dompet ini mempunyai aktiviti yang terlalu banyak untuk disegerakkan secara automatik sehingga 1 Januari tahun ini. Sila hubungi admin (had boleh dinaikkan dan disegerakkan semula untuk anda).",
    "tab.tax": "Pengiraan Cukai",
    "tax.title": "Pengiraan Cukai (FIFO / Purata Bergerak)",
    "tax.loading": "Memuatkan sejarah transaksi...", "tax.syncing": "⏳ Menyegerakkan sejarah pertukaran...",
    "tax.method.fifo": "FIFO (Masuk Dahulu Keluar Dahulu)", "tax.method.moving_avg": "Purata Bergerak",
    "tax.method.hint": "Menurut undang-undang, transaksi melalui pertukaran (pembekal aset maya berlesen) menggunakan kaedah purata bergerak; dompet peribadi dan DEX bukan kustodian menggunakan FIFO.",
    "tax.untagged_hint": "Ini ialah dompet rakan niaga yang belum ditag. Tag untuk memasukkannya dalam pengiraan.",
    "tax.method.unset": "Tidak ditag", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Purata",
    "tax.tag_now": "Tag sekarang", "tax.tag_dialog.title": "Tetapkan Kaedah Pengiraan",
    "tax.disposal.date": "Tarikh", "tax.disposal.qty": "Kuantiti", "tax.disposal.proceeds": "Hasil Pelupusan",
    "tax.disposal.cost": "Kos Perolehan", "tax.disposal.gain": "Untung/Rugi",
    "tax.no_price": "⚠️ {n} entri tanpa harga — dikecualikan daripada pengiraan",
    "tax.manual_price.edit": "Tetapkan harga manual", "tax.manual_price.auto": "Harga automatik",
    "tax.note": "⚠️ Pengiraan ini hanya untuk rujukan. Sahkan dengan perunding cukai sebelum pemfailan sebenar.",
    "tax.report.title": "Laporan untuk Pemfailan Cukai", "tax.report.select_wallets": "Pilih dompet rakan niaga untuk disertakan",
    "tax.report.self_swap": "Pertukaran DEX sendiri (FIFO)", "tax.report.date_from": "Dari", "tax.report.date_to": "Hingga",
    "tax.report.generate": "Jana Laporan",
    "tax.report.no_selection": "Pilih sekurang-kurangnya satu dompet.",
    "tax.report.method_label": "Kaedah Digunakan", "tax.report.period_label": "Tempoh", "tax.report.wallets_label": "Dompet Rakan Niaga Disertakan",
    "tax.report.total_gain": "Jumlah Untung/Rugi", "tax.report.export": "📤 Eksport CSV Laporan",
    "report.title": "🚨 Laporkan Penipuan",
    'report.realname_warn': "⚠️ Laporan ini dikendalikan di bawah <strong>dasar nama sebenar</strong>.<br>Hanya pemegang akaun Pi yang log masuk boleh melaporkan,<br>dan laporan palsu boleh membawa liabiliti undang-undang.",
    "report.victim_id": "ID Pi Mangsa",
    "report.suspect_wallet": "Alamat Dompet Disyaki",
    "report.amount": "Jumlah Kerugian (Pi)",
    "report.date": "Tarikh Kejadian",
    "report.txhash": "Hash Transaksi (pilihan)",
    "report.desc": "Penerangan (pilihan)",
    "report.btn": "Hantar Laporan",
    "report.btn.loading": "Menghantar...",
    "report.success": "✅ Laporan dihantar.",
    "report.err.required": "Sila isi semua medan wajib.",
    "report.err.wallet": "Format alamat dompet tidak sah (bermula dengan G, 56 aksara).",
    "report.err.generic": "Ralat berlaku. Sila cuba lagi.",
    "presearch.title": "Semakan Sebelum Melapor",
    "presearch.placeholder": "Masukkan alamat dompet disyaki...",
    "presearch.warn.not_wallet": "Sila masukkan alamat dompet bermula dengan G.",
    "presearch.hint.short": "Masukkan sekurang-kurangnya 4 aksara.",
    "presearch.loading": "Mencari...",
    "presearch.none": "Tiada laporan sedia ada dijumpai.",
    "presearch.found": "{n} laporan sedia ada dijumpai.",
    "search.title": "🔍 Cari Dompet",
    "search.placeholder": "Masukkan alamat dompet (G...)",
    "search.btn": "Cari",
    "search.no_tx": "Tiada transaksi",
    "search.err.fail": "Carian gagal",
    "search.err.not_found": "Dompet tidak dijumpai.",
    "search.error": "Ralat semasa mencari.",
    "list.title": "🗂️ Senarai Laporan",
    "list.filter": "Cari dompet/ID mangsa...",
    "list.count": "laporan",
    "list.loading": "Memuatkan...",
    "list.empty": "Belum ada laporan.",
    "list.search_btn": "Cari",
    "list.wallet": "Dompet Disyaki:",
    "summary.reports": "Laporan",
    "summary.reported_pi": "Jumlah Dilaporkan",
    "summary.tx_count": "Transaksi Keluar",
    "summary.total_sent": "Jumlah Dihantar",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} laporan sepadan",
    "tx.victims": "Mangsa",
    "risk.safe": "Selamat",
    "risk.low": "Berhati-hati",
    "risk.mid": "Bahaya",
    "risk.high": "Risiko Tinggi",
    "matched.victim_id": "Mangsa",
    "matched.chain": "Padanan Rantaian",
    "top10.title": "Top 10 Dompet Paling Dilaporkan",
    "top10.cases": "kes",
    "verify.btn": "Sahkan",
    "verify.done": "Disahkan",
    "verify.mine": "Laporan Saya",
    "verify.confirmed": " disahkan",
    "verify.toast": "Pengesahan direkodkan.",
    "export.toast": "Disalin ke papan keratan.",
    "export.copied": "✅ Disalin",
    "export.manual": "Pilih semua dan salin.",
    "doc.title": "Laporan Siasatan Penipuan Pi",
    "doc.generated": "Dijana",
    "doc.wallet_sec": "Dompet Disyaki",
    "doc.reports_sec": "Ringkasan Laporan",
    "doc.count": "Bilangan Laporan",
    "doc.total_pi": "Jumlah Dilaporkan",
    "doc.victims_sec": "Senarai Mangsa",
    "doc.victim_id": "ID Mangsa",
    "doc.damage": "Kerosakan",
    "doc.date": "Tarikh",
    "doc.tx_hash": "Hash TX",
    "doc.situation": "Penerangan",
    "doc.outgoing_sec": "Transaksi Keluar",
    "doc.no_tx": "Tiada",
    "doc.chain_match": "★ Sepadan dengan Laporan",
    "doc.amount": "Jumlah",
    "doc.cex_sec": "Ringkasan Pemindahan CEX",
    "doc.verify_sec": "Pengesahan Data",
    "doc.verify_body": "Berdasarkan data transaksi Horizon API (mainnet)",
    "doc.submit_sec": "Hantar Kepada",
    "doc.police": "Unit Jenayah Siber Tempatan",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Khidmat pelanggan pertukaran jika berkenaan",
    "doc.notes_sec": "Nota",
    "doc.note1": "Dokumen ini untuk rujukan sahaja.",
    "doc.note2": "Padanan rantaian adalah anggaran, bukan bukti muktamad.",
    "doc.note3": "Tafsiran mungkin berbeza mengikut bidang kuasa.",
    "mywallet.title": "Dompet Saya (Mainnet)",
    "mywallet.add": "Tambah Dompet",
    "mywallet.no_wallets": "Tiada dompet berdaftar.",
    "mywallet.loading": "Memuatkan...",
    "mywallet.fail": "Gagal memuatkan",
    "mywallet.refresh": "Muat Semula",
    "mywallet.load.fail": "Tidak dapat memuatkan senarai dompet anda dari pelayan.",
    "mywallet.not_activated": "Dompet ini belum diaktifkan pada mainnet Pi. (Akaun hanya dicipta selepas menerima Pi sekurang-kurangnya sekali)",
    'mywallet.not_activated.confirm': "Tambah juga?",
    'mywallet.not_activated.icon_title': "Dompet tidak aktif (tidak pernah menerima Pi)",
    "mywallet.max_hint": "Maks {n}",
    "mywallet.pi.total": "π Baki Keseluruhan",
    "mywallet.pi.avail": "Tersedia",
    "mywallet.pi.reserve": "Rizab Min (anggaran)",
    "mywallet.tokens": "Token",
    "mywallet.txs": "Transaksi Terkini",
    "mywallet.lp": "Kedudukan LP",
    'mywallet.lock.title': "Baki Terkunci",
    'mywallet.lock.total': "Jumlah Terkunci",
    'mywallet.lock.claimable': "Boleh Dituntut Sekarang",
    "backup.title": "Sandaran / Pulihkan",
    "backup.load_fail": "Tidak dapat memuatkan slot",
    "backup.empty": "Kosong",
    "backup.slot": "Slot {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Sandaran Penuh",
    "backup.btn.append_backup": "Sandaran Tambahan",
    "backup.btn.full_restore": "Pemulihan Penuh",
    "backup.btn.append_restore": "Pemulihan Tambahan",
    "backup.saved": "Sandaran disimpan",
    "backup.fail": "Ralat berlaku",
    "backup.confirm.overwrite": "Data sedia ada dalam Slot {n} akan dipadam dan digantikan dengan senarai semasa. Teruskan?",
    "backup.confirm.save": "Sandarkan senarai semasa ke Slot {n}.",
    "backup.confirm.truncate": "Hanya {n} akan disimpan dan {dropped} akan digugurkan. Teruskan?",
    "backup.confirm.restore_full": "Senarai semasa akan dipadam dan digantikan dengan kandungan Slot {n}. Teruskan?",
    "mywallet.no_lp": "Tiada LP",
    "mywallet.tx_none": "Tiada transaksi",
    "mywallet.updated": "Dikemas kini",
    "mywallet.tx_sent": "Dihantar",
    "mywallet.tx_recv": "Diterima",
    "mywallet.add.title": "Tambah Dompet",
    "mywallet.add.alias_ph": "Alias (cth. Dompet Utama)",
    "mywallet.add.addr_ph": "Alamat Dompet (G...)",
    "mywallet.add.err_addr": "Alamat tidak sah (bermula G, 56 aksara)",
    "mywallet.add.err_dup": "Alamat ini sudah berdaftar.",
    "mywallet.add.err_full": "Senarai Dompet Saya sudah penuh (30). Buang satu dan cuba lagi.",
    "mywallet.alias.edit": "Edit Alias",
    "mywallet.delete": "Padam Dompet",
    "mywallet.delete.confirm": "Adakah anda pasti mahu memadam dompet ini?",
    "mywallet.cloud.fail": "Ralat pelayan berlaku.",
    "watch.title": "Senarai Pantauan",
    "watch.empty": "Tiada dompet dalam senarai pantauan.",
    "watch.load.fail": "Tidak dapat memuatkan senarai pantauan anda dari pelayan.",
    "watch.max_hint": "(maks {n})",
    "watch.add.btn": "Tambah Dompet",
    "watch.add.addr_ph": "Alamat dompet (G...)",
    "watch.add.err_addr": "Sila semak alamat.",
    "watch.fetch.btn": "🔍 Ambil Semua",
    "watch.fetch.loading": "Mengambil...",
    "watch.internal.title": "🔄 Pemindahan Dalaman",
    "watch.feed.title": "📡 Suapan Penuh",
    "watch.no.internal": "Tiada pemindahan dalaman",
    "watch.new.tx": "Transaksi baharu dikesan",
    "watch.report.warn": "Dompet dilaporkan",
    "watch.cloud.fail": "Ralat pelayan berlaku.",
    "backup.alias_conflict.title": "Konflik Alias",
    "backup.alias_conflict.desc": "{n} alamat mempunyai alias berbeza daripada semasa. Alias mana hendak digunakan?",
    "backup.alias_conflict.keep_latest": "Kekalkan Alias Terkini (Disyorkan)",
    "backup.alias_conflict.use_backup": "Guna Alias Semasa Sandaran",
    "ctx.trade": "Tambah Alias Dompet",
    "tab.trade": "Alias Dompet",
    "trade.title": "Alias Dompet",
    "trade.desc": "Alamat yang didaftarkan akan dipaparkan dengan alias dalam senarai transaksi.",
    "trade.empty": "Tiada alias dompet didaftarkan.",
    "trade.add.title": "Tambah Alias Dompet",
    "trade.add.err_full": "Anda sudah mempunyai {n} alias dompet. Padam sebahagian dan cuba lagi.",
    "cex.estimated": "Pertukaran (anggaran)",
    "ctx.watch": "Tambah ke Senarai Pantauan",
    "ctx.watch.slot": "{n} slot berbaki",
    "ctx.watch.exists": "Sudah ditambah",
    "ctx.watch.full": "Senarai pantauan penuh (maks 10)",
    "ctx.watch.alias_title": "Masukkan Alias",
    "ctx.watch.alias_ph": "Alias (pilihan)",
    "ctx.watch.added": "Ditambah",
    "ctx.register.both": "Daftar ke Dompet Testnet PiDEX Util",
    "ctx.both.alias_title": "Masukkan Alias",
    "ctx.both.alias_ph": "Alias (pilihan)",
    "ctx.both.sent": "✅ Berdaftar",
    "ctx.both.fail": "Pendaftaran gagal",
    "ctx.both.dup": "Sudah berdaftar",
    "ctx.both.full": "Senarai dompet testnet sudah penuh ({n}). Kosongkan slot dalam aplikasi PiDEX Util dan cuba lagi.",
    "ctx.pidex.no_login": "Log masuk Pi diperlukan.",
    "ctx.cancel": "Batal",
    "ctx.continue": "Teruskan",
    "ctx.save": "Simpan",
    "toast.copied": "Disalin",
  },
  tl: {
    "tab.report": "I-report",
    "tab.search": "Hanapin ang Wallet",
    "tab.mywallet": "Aking Wallet",
    "tab.watch": "Watchlist", "tab.ledger": "Talaan",
    "ledger.title": "Talaan ng Wallet (Buwanan/Taunan)", "ledger.loading": "Nilo-load ang kasaysayan...", "ledger.empty": "Walang transaksyon.",
    "ledger.in": "Papasok", "ledger.out": "Palabas", "ledger.net": "Net", "ledger.year_total": "Kabuuang Taunan",
    "ledger.export": "📤 I-export ang CSV", "ledger.refresh": "↻ I-refresh",
    "ledger.note": "⚠️ Ang talaang ito ay nangongolekta ng kasaysayan ng papasok/palabas ng wallet simula sa unang pagbukas mo nito. Simula sa taong buwis 2027, awtomatiko itong mag-sync pabalik hanggang Enero 1 ng taong iyon. Para sa aktwal na pag-file ng buwis, gamitin ang mga talaan ng kalakalan sa iyong exchange bilang batayan ng gastos sa pagkuha — ang talaang ito ay para lamang sa sanggunian ng daloy ng papasok/palabas ng wallet.",
    "ledger.fail": "Nabigong i-load ang kasaysayan.", "ledger.counterpart_all": "Katapat (ipapakita lahat kung walang napili)",
    "ledger.mode_combined": "Kombinado", "ledger.mode_individual": "Indibidwal",
    "ledger.incomplete_warn": "Masyadong maraming aktibidad ang wallet na ito para awtomatikong ma-sync hanggang Enero 1 ngayong taon. Mangyaring makipag-ugnayan sa admin (maaaring itaas ang limitasyon at i-sync muli para sa iyo).",
    "tab.tax": "Kalkulasyon ng Buwis",
    "tax.title": "Kalkulasyon ng Buwis (FIFO / Moving Average)",
    "tax.loading": "Naglo-load ng history ng transaksyon...", "tax.syncing": "⏳ Sinisync ang history ng swap...",
    "tax.method.fifo": "FIFO (Unang Pumasok, Unang Lalabas)", "tax.method.moving_avg": "Moving Average",
    "tax.method.hint": "Ayon sa batas, ang mga transaksyon sa pamamagitan ng exchange (lisensyadong provider ng virtual asset) ay gumagamit ng moving-average method; ang personal wallet at non-custodial DEX ay gumagamit ng FIFO.",
    "tax.untagged_hint": "Ito ay counterparty wallet na hindi pa naka-tag. I-tag para maisama sa kalkulasyon.",
    "tax.method.unset": "Hindi pa naka-tag", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Moving Avg",
    "tax.tag_now": "I-tag ngayon", "tax.tag_dialog.title": "Itakda ang Costing Method",
    "tax.disposal.date": "Petsa", "tax.disposal.qty": "Dami", "tax.disposal.proceeds": "Kinita",
    "tax.disposal.cost": "Gastos sa Pagkuha", "tax.disposal.gain": "Kita/Lugi",
    "tax.no_price": "⚠️ {n} entry na walang presyo — hindi kasama sa kalkulasyon",
    "tax.manual_price.edit": "Itakda ang manual na presyo", "tax.manual_price.auto": "Awtomatikong presyo",
    "tax.note": "⚠️ Ang kalkulasyong ito ay para sa reference lamang. Kumpirmahin sa isang tax professional bago mag-file nang aktwal.",
    "tax.report.title": "Ulat para sa Pag-file ng Buwis", "tax.report.select_wallets": "Piliin ang counterparty wallet na isasama",
    "tax.report.self_swap": "Sariling DEX swap (FIFO)", "tax.report.date_from": "Mula", "tax.report.date_to": "Hanggang",
    "tax.report.generate": "Gumawa ng Ulat",
    "tax.report.no_selection": "Pumili ng kahit isang wallet.",
    "tax.report.method_label": "Ginamit na Method", "tax.report.period_label": "Panahon", "tax.report.wallets_label": "Kasamang Counterparty Wallet",
    "tax.report.total_gain": "Kabuuang Kita/Lugi", "tax.report.export": "📤 I-export ang CSV ng Ulat",
    "report.title": "🚨 I-report ang Scam",
    'report.realname_warn': "⚠️ Ang ulat na ito ay pinapatakbo sa ilalim ng <strong>patakaran ng tunay na pangalan</strong>.<br>Tanging ang may-ari ng Pi account na naka-login ang maaaring mag-ulat,<br>at ang mga huwad na ulat ay maaaring magdulot ng legal na pananagutan.",
    "report.victim_id": "Pi ID ng Biktima",
    "report.suspect_wallet": "Address ng Suspicious na Wallet",
    "report.amount": "Halagang Nawala (Pi)",
    "report.date": "Petsa ng Insidente",
    "report.txhash": "Transaction Hash (opsyonal)",
    "report.desc": "Paglalarawan (opsyonal)",
    "report.btn": "Isumite ang Report",
    "report.btn.loading": "Isinusumite...",
    "report.success": "✅ Naisumite ang report.",
    "report.err.required": "Pakipunan ang lahat ng required na field.",
    "report.err.wallet": "Hindi wastong format ng address (nagsisimula sa G, 56 karakter).",
    "report.err.generic": "May naganap na error. Subukan muli.",
    "presearch.title": "Pre-check Bago Mag-report",
    "presearch.placeholder": "Ilagay ang suspicious na address...",
    "presearch.warn.not_wallet": "Maglagay ng address na nagsisimula sa G.",
    "presearch.hint.short": "Maglagay ng hindi bababa sa 4 na karakter.",
    "presearch.loading": "Naghahanap...",
    "presearch.none": "Walang natagpuang existing na report.",
    "presearch.found": "{n} existing na report ang natagpuan.",
    "search.title": "🔍 Hanapin ang Wallet",
    "search.placeholder": "Ilagay ang address (G...)",
    "search.btn": "Hanapin",
    "search.no_tx": "Walang transaksyon",
    "search.err.fail": "Nabigo ang paghahanap",
    "search.err.not_found": "Hindi natagpuan ang wallet.",
    "search.error": "May error habang naghahanap.",
    "list.title": "🗂️ Listahan ng Report",
    "list.filter": "Hanapin ang wallet/ID ng biktima...",
    "list.count": "report",
    "list.loading": "Naglo-load...",
    "list.empty": "Wala pang report.",
    "list.search_btn": "Hanapin",
    "list.wallet": "Suspicious na Wallet:",
    "summary.reports": "Mga Report",
    "summary.reported_pi": "Kabuuang Naireport",
    "summary.tx_count": "Palabas na Transaksyon",
    "summary.total_sent": "Kabuuang Ipinadala",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} tugma sa report",
    "tx.victims": "Mga Biktima",
    "risk.safe": "Ligtas",
    "risk.low": "Mag-ingat",
    "risk.mid": "Mapanganib",
    "risk.high": "Mataas na Panganib",
    "matched.victim_id": "Biktima",
    "matched.chain": "Tugma sa Chain",
    "top10.title": "Top 10 Pinaka-Reportadong Wallet",
    "top10.cases": "kaso",
    "verify.btn": "I-verify",
    "verify.done": "Na-verify na",
    "verify.mine": "Aking Report",
    "verify.confirmed": " na-verify",
    "verify.toast": "Naitala ang verification.",
    "export.toast": "Nakopya sa clipboard.",
    "export.copied": "✅ Nakopya",
    "export.manual": "Piliin lahat at kopyahin.",
    "doc.title": "Ulat ng Imbestigasyon sa Pi Scam",
    "doc.generated": "Nabuo",
    "doc.wallet_sec": "Suspicious na Wallet",
    "doc.reports_sec": "Buod ng Report",
    "doc.count": "Bilang ng Report",
    "doc.total_pi": "Kabuuang Naireport",
    "doc.victims_sec": "Listahan ng Biktima",
    "doc.victim_id": "ID ng Biktima",
    "doc.damage": "Pinsala",
    "doc.date": "Petsa",
    "doc.tx_hash": "TX Hash",
    "doc.situation": "Paglalarawan",
    "doc.outgoing_sec": "Palabas na Transaksyon",
    "doc.no_tx": "Wala",
    "doc.chain_match": "★ Tugma sa Report",
    "doc.amount": "Halaga",
    "doc.cex_sec": "Buod ng Paglipat sa CEX",
    "doc.verify_sec": "Pagpapatunay ng Datos",
    "doc.verify_body": "Batay sa datos ng transaksyon ng Horizon API (mainnet)",
    "doc.submit_sec": "Isumite Sa",
    "doc.police": "Lokal na Yunit ng Cybercrime",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Customer support ng exchange kung naaangkop",
    "doc.notes_sec": "Mga Tala",
    "doc.note1": "Ang dokumentong ito ay para sa sanggunian lamang.",
    "doc.note2": "Ang mga tugma sa chain ay pagtatantya, hindi tiyak na patunay.",
    "doc.note3": "Maaaring mag-iba ang interpretasyon depende sa hurisdiksyon.",
    "mywallet.title": "Aking Wallet (Mainnet)",
    "mywallet.add": "Magdagdag ng Wallet",
    "mywallet.no_wallets": "Walang nakarehistrong wallet.",
    "mywallet.loading": "Naglo-load...",
    "mywallet.fail": "Nabigong mag-load",
    "mywallet.refresh": "I-refresh",
    "mywallet.load.fail": "Hindi ma-load ang listahan ng iyong wallet mula sa server.",
    "mywallet.not_activated": "Ang wallet na ito ay hindi pa na-activate sa Pi mainnet. (Ang account ay nagagawa lang pagkatapos makatanggap ng Pi nang kahit isang beses)",
    'mywallet.not_activated.confirm': "Idagdag pa rin?",
    'mywallet.not_activated.icon_title': "Hindi aktibong wallet (hindi pa nakatanggap ng Pi)",
    "mywallet.max_hint": "Max {n}",
    "mywallet.pi.total": "π Kabuuang Balanse",
    "mywallet.pi.avail": "Available",
    "mywallet.pi.reserve": "Min Reserve (tantiya)",
    "mywallet.tokens": "Mga Token",
    "mywallet.txs": "Kamakailang Transaksyon",
    "mywallet.lp": "LP Position",
    'mywallet.lock.title': "Naka-lock na Balanse",
    'mywallet.lock.total': "Naka-lock na Halaga",
    'mywallet.lock.claimable': "Puwedeng Kunin Na",
    "backup.title": "Backup / Ibalik",
    "backup.load_fail": "Hindi ma-load ang mga slot",
    "backup.empty": "Walang laman",
    "backup.slot": "Slot {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Buong Backup",
    "backup.btn.append_backup": "Karagdagang Backup",
    "backup.btn.full_restore": "Buong Pagbawi",
    "backup.btn.append_restore": "Karagdagang Pagbawi",
    "backup.saved": "Na-save ang backup",
    "backup.fail": "May naganap na error",
    "backup.confirm.overwrite": "Ang datos sa Slot {n} ay tatanggalin at papalitan ng kasalukuyang listahan. Magpatuloy?",
    "backup.confirm.save": "I-backup ang kasalukuyang listahan sa Slot {n}.",
    "backup.confirm.truncate": "{n} lang ang mase-save at {dropped} ang aalisin. Magpatuloy?",
    "backup.confirm.restore_full": "Ang kasalukuyang listahan ay tatanggalin at papalitan ng laman ng Slot {n}. Magpatuloy?",
    "mywallet.no_lp": "Walang LP",
    "mywallet.tx_none": "Walang transaksyon",
    "mywallet.updated": "Na-update",
    "mywallet.tx_sent": "Ipinadala",
    "mywallet.tx_recv": "Natanggap",
    "mywallet.add.title": "Magdagdag ng Wallet",
    "mywallet.add.alias_ph": "Alias (hal. Pangunahing Wallet)",
    "mywallet.add.addr_ph": "Address ng Wallet (G...)",
    "mywallet.add.err_addr": "Hindi wastong address (nagsisimula sa G, 56 karakter)",
    "mywallet.add.err_dup": "Nakarehistro na ang address na ito.",
    "mywallet.add.err_full": "Puno na ang listahan ng Aking Wallet (30). Mag-alis ng isa at subukan muli.",
    "mywallet.alias.edit": "I-edit ang Alias",
    "mywallet.delete": "Tanggalin ang Wallet",
    "mywallet.delete.confirm": "Sigurado ka bang gusto mong tanggalin ang wallet na ito?",
    "mywallet.cloud.fail": "May naganap na server error.",
    "watch.title": "Watchlist",
    "watch.empty": "Walang wallet sa watchlist.",
    "watch.load.fail": "Hindi ma-load ang iyong watchlist mula sa server.",
    "watch.max_hint": "(max {n})",
    "watch.add.btn": "Magdagdag ng Wallet",
    "watch.add.addr_ph": "Address ng wallet (G...)",
    "watch.add.err_addr": "Pakisuri ang address.",
    "watch.fetch.btn": "🔍 Kunin Lahat",
    "watch.fetch.loading": "Kinukuha...",
    "watch.internal.title": "🔄 Internal na Paglipat",
    "watch.feed.title": "📡 Buong Feed",
    "watch.no.internal": "Walang internal na paglipat",
    "watch.new.tx": "May natukoy na bagong transaksyon",
    "watch.report.warn": "Naireport na wallet",
    "watch.cloud.fail": "May naganap na server error.",
    "backup.alias_conflict.title": "Salungat na Alias",
    "backup.alias_conflict.desc": "{n} address ang may ibang alias kumpara sa kasalukuyan. Aling alias ang gagamitin?",
    "backup.alias_conflict.keep_latest": "Panatilihin ang Pinakabagong Alias (Inirerekomenda)",
    "backup.alias_conflict.use_backup": "Gamitin ang Alias Noong Backup",
    "ctx.trade": "Magdagdag ng Alyas ng Wallet",
    "tab.trade": "Alyas ng Wallet",
    "trade.title": "Alyas ng Wallet",
    "trade.desc": "Ang mga rehistradong address ay ipapakita gamit ang alias sa listahan ng transaksyon.",
    "trade.empty": "Walang nakarehistrong alyas ng wallet.",
    "trade.add.title": "Magdagdag ng Alyas ng Wallet",
    "trade.add.err_full": "Mayroon ka nang {n} alyas ng wallet. Mag-alis ng ilan at subukan ulit.",
    "cex.estimated": "Exchange (tantiya)",
    "ctx.watch": "Idagdag sa Watchlist",
    "ctx.watch.slot": "{n} slot na natitira",
    "ctx.watch.exists": "Naidagdag na",
    "ctx.watch.full": "Puno na ang watchlist (max 10)",
    "ctx.watch.alias_title": "Ilagay ang Alias",
    "ctx.watch.alias_ph": "Alias (opsyonal)",
    "ctx.watch.added": "Naidagdag",
    "ctx.register.both": "Irehistro sa PiDEX Util Testnet Wallet",
    "ctx.both.alias_title": "Ilagay ang Alias",
    "ctx.both.alias_ph": "Alias (opsyonal)",
    "ctx.both.sent": "✅ Narehistro",
    "ctx.both.fail": "Nabigo ang pagrehistro",
    "ctx.both.dup": "Nakarehistro na",
    "ctx.both.full": "Puno na ang listahan ng testnet wallet ({n}). Magbakante ng slot sa PiDEX Util app at subukan muli.",
    "ctx.pidex.no_login": "Kailangan ng Pi login.",
    "ctx.cancel": "Kanselahin",
    "ctx.continue": "Magpatuloy",
    "ctx.save": "I-save",
    "toast.copied": "Nakopya",
  },
  hi: {
    "tab.report": "रिपोर्ट करें",
    "tab.search": "वॉलेट खोजें",
    "tab.mywallet": "मेरा वॉलेट",
    "tab.watch": "वॉचलिस्ट", "tab.ledger": "बहीखाता",
    "ledger.title": "वॉलेट बहीखाता (मासिक/वार्षिक)", "ledger.loading": "इतिहास लोड हो रहा है...", "ledger.empty": "कोई लेनदेन नहीं।",
    "ledger.in": "जमा", "ledger.out": "निकासी", "ledger.net": "शुद्ध", "ledger.year_total": "वार्षिक कुल",
    "ledger.export": "📤 CSV निर्यात करें", "ledger.refresh": "↻ रीफ्रेश करें",
    "ledger.note": "⚠️ यह बहीखाता आपके पहली बार खोलने के क्षण से वॉलेट के आवक/जावक इतिहास को एकत्र करता है। कर वर्ष 2027 से, यह स्वचालित रूप से उस वर्ष की 1 जनवरी तक पीछे की ओर सिंक हो जाएगा। वास्तविक कर फाइलिंग के लिए, अधिग्रहण लागत के आधार के रूप में अपने एक्सचेंज के व्यापार रिकॉर्ड का उपयोग करें — यह बहीखाता केवल वॉलेट के आवक/जावक प्रवाह के संदर्भ के लिए है।",
    "ledger.fail": "इतिहास लोड करने में विफल।", "ledger.counterpart_all": "प्रतिपक्ष (कुछ न चुनने पर सभी दिखेगा)",
    "ledger.mode_combined": "संयुक्त", "ledger.mode_individual": "व्यक्तिगत",
    "ledger.incomplete_warn": "इस वॉलेट में इतनी अधिक गतिविधि है कि यह इस वर्ष 1 जनवरी तक स्वचालित रूप से सिंक नहीं हो सका। कृपया व्यवस्थापक से संपर्क करें (सीमा बढ़ाकर आपके लिए फिर से सिंक किया जा सकता है)।",
    "tab.tax": "कर गणना",
    "tax.title": "कर गणना (FIFO / मूविंग एवरेज)",
    "tax.loading": "लेनदेन इतिहास लोड हो रहा है...", "tax.syncing": "⏳ स्वैप इतिहास सिंक हो रहा है...",
    "tax.method.fifo": "FIFO (पहले आओ पहले जाओ)", "tax.method.moving_avg": "मूविंग एवरेज",
    "tax.method.hint": "कानून के अनुसार, एक्सचेंज (लाइसेंस प्राप्त वर्चुअल एसेट प्रदाता) के माध्यम से किए गए लेनदेन पर मूविंग एवरेज विधि लागू होती है; व्यक्तिगत वॉलेट और गैर-कस्टोडियल DEX पर FIFO लागू होता है।",
    "tax.untagged_hint": "यह अभी टैग न किया गया प्रतिपक्ष वॉलेट है। टैग करने पर इसे गणना में शामिल किया जा सकता है।",
    "tax.method.unset": "टैग नहीं किया गया", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "मूविंग एवरेज",
    "tax.tag_now": "अभी टैग करें", "tax.tag_dialog.title": "गणना विधि सेट करें",
    "tax.disposal.date": "तारीख", "tax.disposal.qty": "मात्रा", "tax.disposal.proceeds": "बिक्री राशि",
    "tax.disposal.cost": "अधिग्रहण लागत", "tax.disposal.gain": "लाभ/हानि",
    "tax.no_price": "⚠️ {n} एंट्री बिना कीमत के — गणना से बाहर रखा गया",
    "tax.manual_price.edit": "मैन्युअल कीमत सेट करें", "tax.manual_price.auto": "स्वचालित कीमत",
    "tax.note": "⚠️ यह गणना केवल संदर्भ के लिए है। वास्तविक फाइलिंग से पहले कर सलाहकार से अवश्य पुष्टि करें।",
    "tax.report.title": "कर फाइलिंग के लिए रिपोर्ट", "tax.report.select_wallets": "शामिल करने के लिए प्रतिपक्ष वॉलेट चुनें",
    "tax.report.self_swap": "DEX स्व-स्वैप (FIFO)", "tax.report.date_from": "से", "tax.report.date_to": "तक",
    "tax.report.generate": "रिपोर्ट बनाएं",
    "tax.report.no_selection": "कम से कम एक वॉलेट चुनें।",
    "tax.report.method_label": "लागू विधि", "tax.report.period_label": "अवधि", "tax.report.wallets_label": "शामिल प्रतिपक्ष वॉलेट",
    "tax.report.total_gain": "कुल लाभ/हानि", "tax.report.export": "📤 रिपोर्ट CSV निर्यात करें",
    "report.title": "🚨 धोखाधड़ी की रिपोर्ट करें",
    'report.realname_warn': "⚠️ यह रिपोर्ट <strong>वास्तविक-नाम नीति</strong> के तहत संचालित होती है।<br>केवल लॉग इन किया गया Pi खाता धारक ही रिपोर्ट कर सकता है,<br>और झूठी रिपोर्ट पर कानूनी जिम्मेदारी हो सकती है।",
    "report.victim_id": "पीड़ित का Pi ID",
    "report.suspect_wallet": "संदिग्ध वॉलेट पता",
    "report.amount": "खोई गई राशि (Pi)",
    "report.date": "घटना की तारीख",
    "report.txhash": "ट्रांजैक्शन हैश (वैकल्पिक)",
    "report.desc": "विवरण (वैकल्पिक)",
    "report.btn": "रिपोर्ट सबमिट करें",
    "report.btn.loading": "सबमिट हो रहा है...",
    "report.success": "✅ रिपोर्ट सबमिट हुई।",
    "report.err.required": "कृपया सभी आवश्यक फ़ील्ड भरें।",
    "report.err.wallet": "अमान्य वॉलेट पता प्रारूप (G से शुरू, 56 अक्षर)।",
    "report.err.generic": "एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    "presearch.title": "रिपोर्ट करने से पहले जांच",
    "presearch.placeholder": "संदिग्ध पता दर्ज करें...",
    "presearch.warn.not_wallet": "कृपया G से शुरू होने वाला पता दर्ज करें।",
    "presearch.hint.short": "कम से कम 4 अक्षर दर्ज करें।",
    "presearch.loading": "खोज रहा है...",
    "presearch.none": "कोई मौजूदा रिपोर्ट नहीं मिली।",
    "presearch.found": "{n} मौजूदा रिपोर्ट मिली।",
    "search.title": "🔍 वॉलेट खोजें",
    "search.placeholder": "पता दर्ज करें (G...)",
    "search.btn": "खोजें",
    "search.no_tx": "कोई लेनदेन नहीं",
    "search.err.fail": "खोज विफल",
    "search.err.not_found": "वॉलेट नहीं मिला।",
    "search.error": "खोज के दौरान त्रुटि।",
    "list.title": "🗂️ रिपोर्ट सूची",
    "list.filter": "वॉलेट/पीड़ित ID खोजें...",
    "list.count": "रिपोर्ट्स",
    "list.loading": "लोड हो रहा है...",
    "list.empty": "अभी तक कोई रिपोर्ट नहीं।",
    "list.search_btn": "खोजें",
    "list.wallet": "संदिग्ध वॉलेट:",
    "summary.reports": "रिपोर्ट्स",
    "summary.reported_pi": "कुल रिपोर्ट की गई",
    "summary.tx_count": "आउटगोइंग लेनदेन",
    "summary.total_sent": "कुल भेजा गया",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} रिपोर्ट मेल",
    "tx.victims": "पीड़ित",
    "risk.safe": "सुरक्षित",
    "risk.low": "सावधानी",
    "risk.mid": "खतरा",
    "risk.high": "उच्च जोखिम",
    "matched.victim_id": "पीड़ित",
    "matched.chain": "चेन मैच",
    "top10.title": "सबसे अधिक रिपोर्ट किए गए वॉलेट टॉप 10",
    "top10.cases": "मामले",
    "verify.btn": "सत्यापित करें",
    "verify.done": "सत्यापित",
    "verify.mine": "मेरी रिपोर्ट",
    "verify.confirmed": " सत्यापित",
    "verify.toast": "सत्यापन दर्ज किया गया।",
    "export.toast": "क्लिपबोर्ड पर कॉपी किया गया।",
    "export.copied": "✅ कॉपी हुआ",
    "export.manual": "सभी चुनें और कॉपी करें।",
    "doc.title": "Pi धोखाधड़ी जांच रिपोर्ट",
    "doc.generated": "जनरेट किया गया",
    "doc.wallet_sec": "संदिग्ध वॉलेट",
    "doc.reports_sec": "रिपोर्ट सारांश",
    "doc.count": "रिपोर्ट संख्या",
    "doc.total_pi": "कुल रिपोर्ट की गई",
    "doc.victims_sec": "पीड़ित सूची",
    "doc.victim_id": "पीड़ित ID",
    "doc.damage": "नुकसान",
    "doc.date": "तारीख",
    "doc.tx_hash": "TX हैश",
    "doc.situation": "विवरण",
    "doc.outgoing_sec": "आउटगोइंग लेनदेन",
    "doc.no_tx": "कोई नहीं",
    "doc.chain_match": "★ रिपोर्ट से मेल खाता है",
    "doc.amount": "राशि",
    "doc.cex_sec": "CEX ट्रांसफर सारांश",
    "doc.verify_sec": "डेटा सत्यापन",
    "doc.verify_body": "Horizon API (mainnet) लेनदेन डेटा पर आधारित",
    "doc.submit_sec": "यहां सबमिट करें",
    "doc.police": "स्थानीय साइबर अपराध इकाई",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "यदि लागू हो तो एक्सचेंज ग्राहक सहायता",
    "doc.notes_sec": "नोट्स",
    "doc.note1": "यह दस्तावेज़ केवल संदर्भ के लिए है।",
    "doc.note2": "चेन मैच अनुमान हैं, निर्णायक प्रमाण नहीं।",
    "doc.note3": "व्याख्या क्षेत्राधिकार के अनुसार भिन्न हो सकती है।",
    "mywallet.title": "मेरा वॉलेट (मेननेट)",
    "mywallet.add": "वॉलेट जोड़ें",
    "mywallet.no_wallets": "कोई वॉलेट पंजीकृत नहीं।",
    "mywallet.loading": "लोड हो रहा है...",
    "mywallet.fail": "लोड विफल",
    "mywallet.refresh": "रीफ्रेश करें",
    "mywallet.load.fail": "सर्वर से आपकी वॉलेट सूची लोड नहीं हो सकी।",
    "mywallet.not_activated": "यह वॉलेट अभी तक Pi मेननेट पर सक्रिय नहीं हुआ है। (खाता तभी बनता है जब कम से कम एक बार Pi प्राप्त हो)",
    'mywallet.not_activated.confirm': "फिर भी जोड़ें?",
    'mywallet.not_activated.icon_title': "निष्क्रिय वॉलेट (कभी Pi प्राप्त नहीं हुआ)",
    "mywallet.max_hint": "अधिकतम {n}",
    "mywallet.pi.total": "π कुल बैलेंस",
    "mywallet.pi.avail": "उपलब्ध",
    "mywallet.pi.reserve": "न्यूनतम रिज़र्व (अनुमानित)",
    "mywallet.tokens": "टोकन",
    "mywallet.txs": "हाल के लेनदेन",
    "mywallet.lp": "LP पोज़िशन",
    'mywallet.lock.title': "लॉक बैलेंस",
    'mywallet.lock.total': "लॉक राशि",
    'mywallet.lock.claimable': "अभी क्लेम करने योग्य",
    "backup.title": "बैकअप / पुनर्स्थापित करें",
    "backup.load_fail": "स्लॉट लोड नहीं हो सके",
    "backup.empty": "खाली",
    "backup.slot": "स्लॉट {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "पूर्ण बैकअप",
    "backup.btn.append_backup": "अतिरिक्त बैकअप",
    "backup.btn.full_restore": "पूर्ण पुनर्स्थापन",
    "backup.btn.append_restore": "अतिरिक्त पुनर्स्थापन",
    "backup.saved": "बैकअप सहेजा गया",
    "backup.fail": "एक त्रुटि हुई",
    "backup.confirm.overwrite": "स्लॉट {n} का मौजूदा डेटा हटा दिया जाएगा और वर्तमान सूची से बदल दिया जाएगा। जारी रखें?",
    "backup.confirm.save": "वर्तमान सूची को स्लॉट {n} में बैकअप करें।",
    "backup.confirm.truncate": "केवल {n} तक सहेजे जाएंगे और {dropped} हटा दिए जाएंगे। जारी रखें?",
    "backup.confirm.restore_full": "वर्तमान सूची पूरी तरह हटा दी जाएगी और स्लॉट {n} की सामग्री से बदल दी जाएगी। जारी रखें?",
    "mywallet.no_lp": "कोई LP नहीं",
    "mywallet.tx_none": "कोई लेनदेन नहीं",
    "mywallet.updated": "अपडेट किया गया",
    "mywallet.tx_sent": "भेजा गया",
    "mywallet.tx_recv": "प्राप्त हुआ",
    "mywallet.add.title": "वॉलेट जोड़ें",
    "mywallet.add.alias_ph": "उपनाम (जैसे मुख्य वॉलेट)",
    "mywallet.add.addr_ph": "वॉलेट पता (G...)",
    "mywallet.add.err_addr": "अमान्य पता (G से शुरू, 56 अक्षर)",
    "mywallet.add.err_dup": "यह पता पहले से पंजीकृत है।",
    "mywallet.add.err_full": "आपकी मेरा वॉलेट सूची भर गई है (30)। एक हटाएं और पुनः प्रयास करें।",
    "mywallet.alias.edit": "उपनाम संपादित करें",
    "mywallet.delete": "वॉलेट हटाएं",
    "mywallet.delete.confirm": "क्या आप वाकई इस वॉलेट को हटाना चाहते हैं?",
    "mywallet.cloud.fail": "सर्वर त्रुटि हुई।",
    "watch.title": "वॉचलिस्ट",
    "watch.empty": "वॉचलिस्ट में कोई वॉलेट नहीं।",
    "watch.load.fail": "सर्वर से आपकी वॉचलिस्ट लोड नहीं हो सकी।",
    "watch.max_hint": "(अधिकतम {n})",
    "watch.add.btn": "वॉलेट जोड़ें",
    "watch.add.addr_ph": "वॉलेट पता (G...)",
    "watch.add.err_addr": "कृपया पता जांचें।",
    "watch.fetch.btn": "🔍 सभी लाएं",
    "watch.fetch.loading": "लाया जा रहा है...",
    "watch.internal.title": "🔄 आंतरिक स्थानांतरण",
    "watch.feed.title": "📡 पूरा फ़ीड",
    "watch.no.internal": "कोई आंतरिक स्थानांतरण नहीं",
    "watch.new.tx": "नया लेनदेन पाया गया",
    "watch.report.warn": "रिपोर्ट किया गया वॉलेट",
    "watch.cloud.fail": "सर्वर त्रुटि हुई।",
    "backup.alias_conflict.title": "उपनाम टकराव",
    "backup.alias_conflict.desc": "{n} पते का उपनाम वर्तमान से अलग है। कौन सा उपनाम उपयोग करें?",
    "backup.alias_conflict.keep_latest": "नवीनतम उपनाम रखें (अनुशंसित)",
    "backup.alias_conflict.use_backup": "बैकअप के समय का उपनाम उपयोग करें",
    "ctx.trade": "वॉलेट उपनाम जोड़ें",
    "tab.trade": "वॉलेट उपनाम",
    "trade.title": "वॉलेट उपनाम",
    "trade.desc": "पंजीकृत पते लेनदेन सूची में उपनाम के साथ दिखाए जाएंगे।",
    "trade.empty": "कोई वॉलेट उपनाम पंजीकृत नहीं है।",
    "trade.add.title": "वॉलेट उपनाम जोड़ें",
    "trade.add.err_full": "आपके पास पहले से ही {n} वॉलेट उपनाम हैं। कुछ हटाकर फिर से प्रयास करें।",
    "cex.estimated": "एक्सचेंज (अनुमानित)",
    "ctx.watch": "वॉचलिस्ट में जोड़ें",
    "ctx.watch.slot": "{n} स्लॉट बचे",
    "ctx.watch.exists": "पहले से जोड़ा गया",
    "ctx.watch.full": "वॉचलिस्ट भर गई (अधिकतम 10)",
    "ctx.watch.alias_title": "उपनाम दर्ज करें",
    "ctx.watch.alias_ph": "उपनाम (वैकल्पिक)",
    "ctx.watch.added": "जोड़ा गया",
    "ctx.register.both": "PiDEX Util टेस्टनेट वॉलेट में पंजीकृत करें",
    "ctx.both.alias_title": "उपनाम दर्ज करें",
    "ctx.both.alias_ph": "उपनाम (वैकल्पिक)",
    "ctx.both.sent": "✅ पंजीकृत",
    "ctx.both.fail": "पंजीकरण विफल",
    "ctx.both.dup": "पहले से पंजीकृत",
    "ctx.both.full": "टेस्टनेट वॉलेट सूची पहले से भरी है ({n})। PiDEX Util ऐप में स्लॉट खाली करें और पुनः प्रयास करें।",
    "ctx.pidex.no_login": "Pi लॉगिन आवश्यक है।",
    "ctx.cancel": "रद्द करें",
    "ctx.continue": "जारी रखें",
    "ctx.save": "सहेजें",
    "toast.copied": "कॉपी हुआ",
  },
  ar: {
    "tab.report": "الإبلاغ",
    "tab.search": "البحث عن محفظة",
    "tab.mywallet": "محفظتي",
    "tab.watch": "قائمة المراقبة", "tab.ledger": "السجل",
    "ledger.title": "سجل المحفظة (شهري/سنوي)", "ledger.loading": "جارٍ تحميل السجل...", "ledger.empty": "لا توجد معاملات.",
    "ledger.in": "وارد", "ledger.out": "صادر", "ledger.net": "الصافي", "ledger.year_total": "الإجمالي السنوي",
    "ledger.export": "📤 تصدير CSV", "ledger.refresh": "↻ تحديث",
    "ledger.note": "⚠️ يجمع هذا السجل تاريخ الوارد/الصادر للمحفظة اعتبارًا من اللحظة التي تفتحه فيها لأول مرة. اعتبارًا من السنة الضريبية 2027، ستتم المزامنة تلقائيًا للخلف حتى 1 يناير من ذلك العام. عند تقديم الإقرار الضريبي الفعلي، استخدم سجلات صفقات منصة التداول كأساس لتكلفة الاقتناء — هذا السجل مخصص فقط كمرجع لتدفق الأموال داخل وخارج المحفظة.",
    "ledger.fail": "فشل تحميل السجل.", "ledger.counterpart_all": "الطرف المقابل (يعرض الكل إذا لم يتم التحديد)",
    "ledger.mode_combined": "مجمّع", "ledger.mode_individual": "فردي",
    "ledger.incomplete_warn": "هذه المحفظة بها نشاط كثير جدًا بحيث لا يمكن مزامنتها تلقائيًا حتى 1 يناير من هذا العام. يرجى التواصل مع المسؤول (يمكن رفع الحد وإعادة المزامنة لك).",
    "tab.tax": "حساب الضرائب",
    "tax.title": "حساب الضرائب (FIFO / المتوسط المتحرك)",
    "tax.loading": "جارٍ تحميل سجل المعاملات...", "tax.syncing": "⏳ جارٍ مزامنة سجل التبديل...",
    "tax.method.fifo": "FIFO (الوارد أولاً يصرف أولاً)", "tax.method.moving_avg": "المتوسط المتحرك",
    "tax.method.hint": "بموجب القانون، تُطبَّق طريقة المتوسط المتحرك على المعاملات عبر منصة تداول (مزود أصول افتراضية مرخص)، بينما تُطبَّق طريقة FIFO على المحافظ الشخصية و DEX غير الحاضنة.",
    "tax.untagged_hint": "هذه محفظة مقابلة لم يتم وسمها بعد. قم بوسمها لتضمينها في الحساب.",
    "tax.method.unset": "غير موسوم", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "متوسط متحرك",
    "tax.tag_now": "وسم الآن", "tax.tag_dialog.title": "تعيين طريقة الحساب",
    "tax.disposal.date": "التاريخ", "tax.disposal.qty": "الكمية", "tax.disposal.proceeds": "عائدات البيع",
    "tax.disposal.cost": "تكلفة الاستحواذ", "tax.disposal.gain": "الربح/الخسارة",
    "tax.no_price": "⚠️ {n} إدخالات بدون سعر — مستبعدة من الحساب",
    "tax.manual_price.edit": "تعيين سعر يدوي", "tax.manual_price.auto": "السعر التلقائي",
    "tax.note": "⚠️ هذا الحساب لأغراض مرجعية فقط. يرجى التأكيد مع محاسب ضرائب قبل التقديم الفعلي.",
    "tax.report.title": "تقرير لتقديم الإقرار الضريبي", "tax.report.select_wallets": "اختر المحافظ المقابلة المراد تضمينها",
    "tax.report.self_swap": "تبديل ذاتي على DEX (FIFO)", "tax.report.date_from": "من", "tax.report.date_to": "إلى",
    "tax.report.generate": "إنشاء التقرير",
    "tax.report.no_selection": "اختر محفظة واحدة على الأقل.",
    "tax.report.method_label": "الطريقة المطبقة", "tax.report.period_label": "الفترة", "tax.report.wallets_label": "المحافظ المقابلة المضمنة",
    "tax.report.total_gain": "إجمالي الربح/الخسارة", "tax.report.export": "📤 تصدير CSV للتقرير",
    "report.title": "🚨 الإبلاغ عن احتيال",
    'report.realname_warn': "⚠️ تُدار هذه الشكوى وفق <strong>سياسة الاسم الحقيقي</strong>.<br>يمكن فقط لصاحب حساب Pi المسجّل الدخول تقديم الشكوى،<br>وقد تترتب مسؤولية قانونية على الشكاوى الكاذبة.",
    "report.victim_id": "معرف Pi للضحية",
    "report.suspect_wallet": "عنوان المحفظة المشتبه بها",
    "report.amount": "المبلغ المفقود (Pi)",
    "report.date": "تاريخ الحادثة",
    "report.txhash": "هاش المعاملة (اختياري)",
    "report.desc": "الوصف (اختياري)",
    "report.btn": "إرسال البلاغ",
    "report.btn.loading": "جارٍ الإرسال...",
    "report.success": "✅ تم إرسال البلاغ.",
    "report.err.required": "يرجى ملء جميع الحقول المطلوبة.",
    "report.err.wallet": "تنسيق عنوان المحفظة غير صحيح (يبدأ بـ G، 56 حرفاً).",
    "report.err.generic": "حدث خطأ. يرجى المحاولة مرة أخرى.",
    "presearch.title": "التحقق قبل الإبلاغ",
    "presearch.placeholder": "أدخل عنوان المحفظة المشتبه بها...",
    "presearch.warn.not_wallet": "يرجى إدخال عنوان يبدأ بـ G.",
    "presearch.hint.short": "أدخل 4 أحرف على الأقل.",
    "presearch.loading": "جارٍ البحث...",
    "presearch.none": "لم يتم العثور على بلاغات سابقة.",
    "presearch.found": "تم العثور على {n} بلاغ(ات) سابقة.",
    "search.title": "🔍 البحث عن محفظة",
    "search.placeholder": "أدخل العنوان (G...)",
    "search.btn": "بحث",
    "search.no_tx": "لا توجد معاملات",
    "search.err.fail": "فشل البحث",
    "search.err.not_found": "المحفظة غير موجودة.",
    "search.error": "خطأ أثناء البحث.",
    "list.title": "🗂️ قائمة البلاغات",
    "list.filter": "البحث عن محفظة/معرف ضحية...",
    "list.count": "بلاغات",
    "list.loading": "جارٍ التحميل...",
    "list.empty": "لا توجد بلاغات بعد.",
    "list.search_btn": "بحث",
    "list.wallet": "المحفظة المشتبه بها:",
    "summary.reports": "البلاغات",
    "summary.reported_pi": "إجمالي المبلغ عنه",
    "summary.tx_count": "المعاملات الصادرة",
    "summary.total_sent": "إجمالي المرسل",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} بلاغ(ات) مطابقة",
    "tx.victims": "الضحايا",
    "risk.safe": "آمن",
    "risk.low": "تحذير",
    "risk.mid": "خطر",
    "risk.high": "خطر مرتفع",
    "matched.victim_id": "الضحية",
    "matched.chain": "تطابق السلسلة",
    "top10.title": "أكثر 10 محافظ تم الإبلاغ عنها",
    "top10.cases": "حالة",
    "verify.btn": "تأكيد",
    "verify.done": "تم التأكيد",
    "verify.mine": "بلاغي",
    "verify.confirmed": " تأكيد",
    "verify.toast": "تم تسجيل التأكيد.",
    "export.toast": "تم النسخ إلى الحافظة.",
    "export.copied": "✅ تم النسخ",
    "export.manual": "حدد الكل ثم انسخ.",
    "doc.title": "تقرير تحقيق احتيال Pi",
    "doc.generated": "تم الإنشاء",
    "doc.wallet_sec": "المحفظة المشتبه بها",
    "doc.reports_sec": "ملخص البلاغات",
    "doc.count": "عدد البلاغات",
    "doc.total_pi": "إجمالي المبلغ عنه",
    "doc.victims_sec": "قائمة الضحايا",
    "doc.victim_id": "معرف الضحية",
    "doc.damage": "الضرر",
    "doc.date": "التاريخ",
    "doc.tx_hash": "هاش TX",
    "doc.situation": "الوصف",
    "doc.outgoing_sec": "المعاملات الصادرة",
    "doc.no_tx": "لا شيء",
    "doc.chain_match": "★ يطابق البلاغ",
    "doc.amount": "المبلغ",
    "doc.cex_sec": "ملخص تحويلات CEX",
    "doc.verify_sec": "التحقق من البيانات",
    "doc.verify_body": "استناداً إلى بيانات معاملات Horizon API (الشبكة الرئيسية)",
    "doc.submit_sec": "إرسال إلى",
    "doc.police": "وحدة الجرائم الإلكترونية المحلية",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "دعم عملاء البورصة إن وجد",
    "doc.notes_sec": "ملاحظات",
    "doc.note1": "هذا المستند لأغراض مرجعية فقط.",
    "doc.note2": "تطابقات السلسلة تقديرية وليست دليلاً قاطعاً.",
    "doc.note3": "قد يختلف التفسير حسب الجهة القضائية.",
    "mywallet.title": "محفظتي (الشبكة الرئيسية)",
    "mywallet.add": "إضافة محفظة",
    "mywallet.no_wallets": "لا توجد محافظ مسجلة.",
    "mywallet.loading": "جارٍ التحميل...",
    "mywallet.fail": "فشل التحميل",
    "mywallet.refresh": "تحديث",
    "mywallet.load.fail": "تعذر تحميل قائمة محافظك من الخادم.",
    "mywallet.not_activated": "لم يتم تفعيل هذه المحفظة بعد على شبكة Pi الرئيسية. (يتم إنشاء الحساب فقط بعد استلام Pi مرة واحدة على الأقل)",
    'mywallet.not_activated.confirm': "إضافة على أي حال؟",
    'mywallet.not_activated.icon_title': "محفظة غير نشطة (لم تستلم Pi قط)",
    "mywallet.max_hint": "الحد الأقصى {n}",
    "mywallet.pi.total": "π الرصيد الإجمالي",
    "mywallet.pi.avail": "متاح",
    "mywallet.pi.reserve": "الحد الأدنى للاحتياطي (تقديري)",
    "mywallet.tokens": "العملات",
    "mywallet.txs": "المعاملات الأخيرة",
    "mywallet.lp": "مراكز LP",
    'mywallet.lock.title': "الرصيد المقفل",
    'mywallet.lock.total': "المبلغ المقفل",
    'mywallet.lock.claimable': "قابل للمطالبة الآن",
    "backup.title": "نسخ احتياطي / استعادة",
    "backup.load_fail": "تعذر تحميل الفتحات",
    "backup.empty": "فارغ",
    "backup.slot": "الفتحة {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "نسخ احتياطي كامل",
    "backup.btn.append_backup": "نسخ احتياطي إضافي",
    "backup.btn.full_restore": "استعادة كاملة",
    "backup.btn.append_restore": "استعادة إضافية",
    "backup.saved": "تم حفظ النسخة الاحتياطية",
    "backup.fail": "حدث خطأ",
    "backup.confirm.overwrite": "سيتم حذف البيانات الموجودة في الفتحة {n} واستبدالها بالقائمة الحالية. هل تريد المتابعة؟",
    "backup.confirm.save": "نسخ القائمة الحالية احتياطياً إلى الفتحة {n}.",
    "backup.confirm.truncate": "سيتم حفظ {n} فقط وإزالة {dropped}. هل تريد المتابعة؟",
    "backup.confirm.restore_full": "سيتم مسح القائمة الحالية واستبدالها بمحتوى الفتحة {n}. هل تريد المتابعة؟",
    "mywallet.no_lp": "لا يوجد LP",
    "mywallet.tx_none": "لا توجد معاملات",
    "mywallet.updated": "تم التحديث",
    "mywallet.tx_sent": "مرسل",
    "mywallet.tx_recv": "مستلم",
    "mywallet.add.title": "إضافة محفظة",
    "mywallet.add.alias_ph": "الاسم المستعار (مثال: المحفظة الرئيسية)",
    "mywallet.add.addr_ph": "عنوان المحفظة (G...)",
    "mywallet.add.err_addr": "عنوان غير صالح (يبدأ بـ G، 56 حرفاً)",
    "mywallet.add.err_dup": "هذا العنوان مسجل بالفعل.",
    "mywallet.add.err_full": "قائمة محفظتي ممتلئة (30). احذف واحدة وحاول مرة أخرى.",
    "mywallet.alias.edit": "تعديل الاسم المستعار",
    "mywallet.delete": "حذف المحفظة",
    "mywallet.delete.confirm": "هل أنت متأكد أنك تريد حذف هذه المحفظة؟",
    "mywallet.cloud.fail": "حدث خطأ في الخادم.",
    "watch.title": "قائمة المراقبة",
    "watch.empty": "لا توجد محافظ في قائمة المراقبة.",
    "watch.load.fail": "تعذر تحميل قائمة المراقبة من الخادم.",
    "watch.max_hint": "(الحد الأقصى {n})",
    "watch.add.btn": "إضافة محفظة",
    "watch.add.addr_ph": "عنوان المحفظة (G...)",
    "watch.add.err_addr": "يرجى التحقق من العنوان.",
    "watch.fetch.btn": "🔍 جلب الكل",
    "watch.fetch.loading": "جارٍ الجلب...",
    "watch.internal.title": "🔄 التحويلات الداخلية",
    "watch.feed.title": "📡 التغذية الكاملة",
    "watch.no.internal": "لا توجد تحويلات داخلية",
    "watch.new.tx": "تم اكتشاف معاملة جديدة",
    "watch.report.warn": "محفظة تم الإبلاغ عنها",
    "watch.cloud.fail": "حدث خطأ في الخادم.",
    "backup.alias_conflict.title": "تعارض الاسم المستعار",
    "backup.alias_conflict.desc": "يوجد {n} عنوان بأسماء مستعارة مختلفة عن الحالية. أي اسم مستعار تريد استخدامه؟",
    "backup.alias_conflict.keep_latest": "الاحتفاظ بأحدث اسم مستعار (موصى به)",
    "backup.alias_conflict.use_backup": "استخدام الاسم المستعار وقت النسخ الاحتياطي",
    "ctx.trade": "إضافة اسم مستعار للمحفظة",
    "tab.trade": "أسماء المحافظ المستعارة",
    "trade.title": "أسماء المحافظ المستعارة",
    "trade.desc": "سيتم عرض العناوين المسجلة باسمها المستعار في قائمة المعاملات.",
    "trade.empty": "لا توجد أسماء مستعارة مسجلة للمحافظ.",
    "trade.add.title": "إضافة اسم مستعار للمحفظة",
    "trade.add.err_full": "لديك بالفعل {n} أسماء مستعارة للمحافظ. يرجى حذف البعض والمحاولة مرة أخرى.",
    "cex.estimated": "بورصة (تقديري)",
    "ctx.watch": "إضافة إلى قائمة المراقبة",
    "ctx.watch.slot": "{n} فتحة متبقية",
    "ctx.watch.exists": "مضاف بالفعل",
    "ctx.watch.full": "قائمة المراقبة ممتلئة (الحد الأقصى 10)",
    "ctx.watch.alias_title": "أدخل الاسم المستعار",
    "ctx.watch.alias_ph": "الاسم المستعار (اختياري)",
    "ctx.watch.added": "تمت الإضافة",
    "ctx.register.both": "التسجيل في محفظة PiDEX Util التجريبية",
    "ctx.both.alias_title": "أدخل الاسم المستعار",
    "ctx.both.alias_ph": "الاسم المستعار (اختياري)",
    "ctx.both.sent": "✅ تم التسجيل",
    "ctx.both.fail": "فشل التسجيل",
    "ctx.both.dup": "مسجل بالفعل",
    "ctx.both.full": "قائمة محافظ الشبكة التجريبية ممتلئة ({n}). أخلِ مكاناً في تطبيق PiDEX Util وحاول مرة أخرى.",
    "ctx.pidex.no_login": "تسجيل الدخول بـ Pi مطلوب.",
    "ctx.cancel": "إلغاء",
    "ctx.continue": "متابعة",
    "ctx.save": "حفظ",
    "toast.copied": "تم النسخ",
  },
  ru: {
    "tab.report": "Сообщить",
    "tab.search": "Поиск кошелька",
    "tab.mywallet": "Мой кошелёк",
    "tab.watch": "Список наблюдения", "tab.ledger": "Гроссбух",
    "ledger.title": "Гроссбух кошелька (по месяцам/годам)", "ledger.loading": "Загрузка истории...", "ledger.empty": "Нет транзакций.",
    "ledger.in": "Поступления", "ledger.out": "Списания", "ledger.net": "Итого", "ledger.year_total": "Итого за год",
    "ledger.export": "📤 Экспорт CSV", "ledger.refresh": "↻ Обновить",
    "ledger.note": "⚠️ Этот гроссбух собирает историю поступлений/списаний кошелька с момента первого открытия. Начиная с налогового 2027 года, он будет автоматически синхронизироваться назад до 1 января того года. Для реальной налоговой отчётности используйте историю сделок вашей биржи как основу для расчёта стоимости приобретения — этот гроссбух предназначен только для справки по движению средств кошелька.",
    "ledger.fail": "Не удалось загрузить историю.", "ledger.counterpart_all": "Контрагент (показывает всех, если ничего не выбрано)",
    "ledger.mode_combined": "Итого", "ledger.mode_individual": "Отдельно",
    "ledger.incomplete_warn": "У этого кошелька слишком много активности, чтобы автоматически синхронизироваться до 1 января этого года. Пожалуйста, свяжитесь с администратором (лимит можно повысить и синхронизировать заново).",
    "tab.tax": "Расчёт налогов",
    "tax.title": "Расчёт налогов (FIFO / Скользящее среднее)",
    "tax.loading": "Загрузка истории транзакций...", "tax.syncing": "⏳ Синхронизация истории обменов...",
    "tax.method.fifo": "FIFO (первым пришёл — первым ушёл)", "tax.method.moving_avg": "Скользящее среднее",
    "tax.method.hint": "По закону, транзакции через биржу (лицензированного поставщика виртуальных активов) используют метод скользящего среднего; личные кошельки и некастодиальные DEX используют FIFO.",
    "tax.untagged_hint": "Это кошелёк-контрагент без метки. Присвойте метку, чтобы включить его в расчёт.",
    "tax.method.unset": "Без метки", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Скольз. среднее",
    "tax.tag_now": "Присвоить метку", "tax.tag_dialog.title": "Задать метод расчёта",
    "tax.disposal.date": "Дата", "tax.disposal.qty": "Кол-во", "tax.disposal.proceeds": "Выручка",
    "tax.disposal.cost": "Себестоимость", "tax.disposal.gain": "Прибыль/убыток",
    "tax.no_price": "⚠️ {n} записей без цены — исключены из расчёта",
    "tax.manual_price.edit": "Задать цену вручную", "tax.manual_price.auto": "Автоматическая цена",
    "tax.note": "⚠️ Этот расчёт носит справочный характер. Перед фактической подачей декларации обязательно проконсультируйтесь с налоговым специалистом.",
    "tax.report.title": "Отчёт для подачи в налоговую", "tax.report.select_wallets": "Выбрать кошельки-контрагенты для включения",
    "tax.report.self_swap": "Собственный своп в DEX (FIFO)", "tax.report.date_from": "С", "tax.report.date_to": "По",
    "tax.report.generate": "Сформировать отчёт",
    "tax.report.no_selection": "Выберите хотя бы один кошелёк.",
    "tax.report.method_label": "Применённый метод", "tax.report.period_label": "Период", "tax.report.wallets_label": "Включённые кошельки-контрагенты",
    "tax.report.total_gain": "Итоговая прибыль/убыток", "tax.report.export": "📤 Экспорт CSV отчёта",
    "report.title": "🚨 Сообщить о мошенничестве",
    'report.realname_warn': "⚠️ Эта жалоба обрабатывается согласно <strong>политике настоящих имён</strong>.<br>Подать жалобу может только владелец вошедшего в систему аккаунта Pi,<br>а ложные жалобы могут повлечь юридическую ответственность.",
    "report.victim_id": "Pi ID жертвы",
    "report.suspect_wallet": "Адрес подозрительного кошелька",
    "report.amount": "Сумма убытка (Pi)",
    "report.date": "Дата инцидента",
    "report.txhash": "Хэш транзакции (необязательно)",
    "report.desc": "Описание (необязательно)",
    "report.btn": "Отправить жалобу",
    "report.btn.loading": "Отправка...",
    "report.success": "✅ Жалоба отправлена.",
    "report.err.required": "Пожалуйста, заполните все обязательные поля.",
    "report.err.wallet": "Неверный формат адреса кошелька (начинается с G, 56 символов).",
    "report.err.generic": "Произошла ошибка. Попробуйте снова.",
    "presearch.title": "Проверка перед подачей жалобы",
    "presearch.placeholder": "Введите подозрительный адрес...",
    "presearch.warn.not_wallet": "Пожалуйста, введите адрес, начинающийся с G.",
    "presearch.hint.short": "Введите не менее 4 символов.",
    "presearch.loading": "Поиск...",
    "presearch.none": "Существующих жалоб не найдено.",
    "presearch.found": "Найдено {n} существующих жалоб.",
    "search.title": "🔍 Поиск кошелька",
    "search.placeholder": "Введите адрес (G...)",
    "search.btn": "Поиск",
    "search.no_tx": "Нет транзакций",
    "search.err.fail": "Ошибка поиска",
    "search.err.not_found": "Кошелёк не найден.",
    "search.error": "Ошибка при поиске.",
    "list.title": "🗂️ Список жалоб",
    "list.filter": "Поиск кошелька/ID жертвы...",
    "list.count": "жалоб",
    "list.loading": "Загрузка...",
    "list.empty": "Пока нет жалоб.",
    "list.search_btn": "Поиск",
    "list.wallet": "Подозрительный кошелёк:",
    "summary.reports": "Жалобы",
    "summary.reported_pi": "Всего заявлено",
    "summary.tx_count": "Исходящие транзакции",
    "summary.total_sent": "Всего отправлено",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} совпадение(й) с жалобами",
    "tx.victims": "Жертвы",
    "risk.safe": "Безопасно",
    "risk.low": "Осторожно",
    "risk.mid": "Опасно",
    "risk.high": "Высокий риск",
    "matched.victim_id": "Жертва",
    "matched.chain": "Совпадение в цепочке",
    "top10.title": "ТОП-10 наиболее часто указанных кошельков",
    "top10.cases": "случаев",
    "verify.btn": "Подтвердить",
    "verify.done": "Подтверждено",
    "verify.mine": "Моя жалоба",
    "verify.confirmed": " подтвердили",
    "verify.toast": "Подтверждение зарегистрировано.",
    "export.toast": "Скопировано в буфер обмена.",
    "export.copied": "✅ Скопировано",
    "export.manual": "Выделите всё и скопируйте.",
    "doc.title": "Отчёт о расследовании мошенничества с Pi",
    "doc.generated": "Создано",
    "doc.wallet_sec": "Подозрительный кошелёк",
    "doc.reports_sec": "Сводка жалоб",
    "doc.count": "Количество жалоб",
    "doc.total_pi": "Всего заявлено",
    "doc.victims_sec": "Список жертв",
    "doc.victim_id": "ID жертвы",
    "doc.damage": "Ущерб",
    "doc.date": "Дата",
    "doc.tx_hash": "Хэш TX",
    "doc.situation": "Описание",
    "doc.outgoing_sec": "Исходящие транзакции",
    "doc.no_tx": "Нет",
    "doc.chain_match": "★ Совпадает с жалобой",
    "doc.amount": "Сумма",
    "doc.cex_sec": "Сводка переводов CEX",
    "doc.verify_sec": "Проверка данных",
    "doc.verify_body": "На основе данных транзакций Horizon API (mainnet)",
    "doc.submit_sec": "Отправить в",
    "doc.police": "Местное подразделение по киберпреступлениям",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Служба поддержки биржи при необходимости",
    "doc.notes_sec": "Примечания",
    "doc.note1": "Этот документ предназначен только для справки.",
    "doc.note2": "Совпадения в цепочке являются оценочными, а не окончательным доказательством.",
    "doc.note3": "Интерпретация может отличаться в зависимости от юрисдикции.",
    "mywallet.title": "Мой кошелёк (mainnet)",
    "mywallet.add": "Добавить кошелёк",
    "mywallet.no_wallets": "Нет зарегистрированных кошельков.",
    "mywallet.loading": "Загрузка...",
    "mywallet.fail": "Ошибка загрузки",
    "mywallet.refresh": "Обновить",
    "mywallet.load.fail": "Не удалось загрузить список ваших кошельков с сервера.",
    "mywallet.not_activated": "Этот кошелёк ещё не активирован в основной сети Pi. (Аккаунт создаётся только после получения Pi хотя бы один раз)",
    'mywallet.not_activated.confirm': "Всё равно добавить?",
    'mywallet.not_activated.icon_title': "Неактивный кошелёк (никогда не получал Pi)",
    "mywallet.max_hint": "Макс. {n}",
    "mywallet.pi.total": "π Общий баланс",
    "mywallet.pi.avail": "Доступно",
    "mywallet.pi.reserve": "Мин. резерв (оценка)",
    "mywallet.tokens": "Токены",
    "mywallet.txs": "Недавние транзакции",
    "mywallet.lp": "LP-позиции",
    'mywallet.lock.title': "Заблокированный баланс",
    'mywallet.lock.total': "Заблокированная сумма",
    'mywallet.lock.claimable': "Доступно для получения",
    "backup.title": "Резервная копия / Восстановление",
    "backup.load_fail": "Не удалось загрузить слоты",
    "backup.empty": "Пусто",
    "backup.slot": "Слот {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Полное резервирование",
    "backup.btn.append_backup": "Дополнительное резервирование",
    "backup.btn.full_restore": "Полное восстановление",
    "backup.btn.append_restore": "Дополнительное восстановление",
    "backup.saved": "Резервная копия сохранена",
    "backup.fail": "Произошла ошибка",
    "backup.confirm.overwrite": "Существующие данные в слоте {n} будут удалены и заменены текущим списком. Продолжить?",
    "backup.confirm.save": "Сохранить текущий список в слот {n}.",
    "backup.confirm.truncate": "Будет сохранено только {n}, а {dropped} будет исключено. Продолжить?",
    "backup.confirm.restore_full": "Текущий список будет очищен и заменён содержимым слота {n}. Продолжить?",
    "mywallet.no_lp": "Нет LP",
    "mywallet.tx_none": "Нет транзакций",
    "mywallet.updated": "Обновлено",
    "mywallet.tx_sent": "Отправлено",
    "mywallet.tx_recv": "Получено",
    "mywallet.add.title": "Добавить кошелёк",
    "mywallet.add.alias_ph": "Псевдоним (напр. Основной кошелёк)",
    "mywallet.add.addr_ph": "Адрес кошелька (G...)",
    "mywallet.add.err_addr": "Неверный адрес (начинается с G, 56 символов)",
    "mywallet.add.err_dup": "Этот адрес уже зарегистрирован.",
    "mywallet.add.err_full": "Список «Мой кошелёк» заполнен (30). Удалите один и попробуйте снова.",
    "mywallet.alias.edit": "Изменить псевдоним",
    "mywallet.delete": "Удалить кошелёк",
    "mywallet.delete.confirm": "Вы уверены, что хотите удалить этот кошелёк?",
    "mywallet.cloud.fail": "Произошла ошибка сервера.",
    "watch.title": "Список наблюдения",
    "watch.empty": "В списке наблюдения нет кошельков.",
    "watch.load.fail": "Не удалось загрузить список наблюдения с сервера.",
    "watch.max_hint": "(макс. {n})",
    "watch.add.btn": "Добавить кошелёк",
    "watch.add.addr_ph": "Адрес кошелька (G...)",
    "watch.add.err_addr": "Пожалуйста, проверьте адрес.",
    "watch.fetch.btn": "🔍 Загрузить всё",
    "watch.fetch.loading": "Загрузка...",
    "watch.internal.title": "🔄 Внутренние переводы",
    "watch.feed.title": "📡 Полная лента",
    "watch.no.internal": "Нет внутренних переводов",
    "watch.new.tx": "Обнаружена новая транзакция",
    "watch.report.warn": "Кошелёк, о котором сообщили",
    "watch.cloud.fail": "Произошла ошибка сервера.",
    "backup.alias_conflict.title": "Конфликт псевдонимов",
    "backup.alias_conflict.desc": "У {n} адресов псевдоним отличается от текущего. Какой использовать?",
    "backup.alias_conflict.keep_latest": "Оставить последний псевдоним (рекомендуется)",
    "backup.alias_conflict.use_backup": "Использовать псевдоним на момент резервной копии",
    "ctx.trade": "Добавить псевдоним кошелька",
    "tab.trade": "Псевдонимы кошельков",
    "trade.title": "Псевдонимы кошельков",
    "trade.desc": "Зарегистрированные адреса будут отображаться под псевдонимом в списке транзакций.",
    "trade.empty": "Псевдонимы кошельков не зарегистрированы.",
    "trade.add.title": "Добавить псевдоним кошелька",
    "trade.add.err_full": "У вас уже есть {n} псевдонимов кошельков. Удалите некоторые и попробуйте снова.",
    "cex.estimated": "Биржа (оценка)",
    "ctx.watch": "Добавить в список наблюдения",
    "ctx.watch.slot": "Осталось {n} мест",
    "ctx.watch.exists": "Уже добавлено",
    "ctx.watch.full": "Список наблюдения заполнен (макс. 10)",
    "ctx.watch.alias_title": "Введите псевдоним",
    "ctx.watch.alias_ph": "Псевдоним (необязательно)",
    "ctx.watch.added": "Добавлено",
    "ctx.register.both": "Зарегистрировать в тестовом кошельке PiDEX Util",
    "ctx.both.alias_title": "Введите псевдоним",
    "ctx.both.alias_ph": "Псевдоним (необязательно)",
    "ctx.both.sent": "✅ Зарегистрировано",
    "ctx.both.fail": "Ошибка регистрации",
    "ctx.both.dup": "Уже зарегистрировано",
    "ctx.both.full": "Список тестовых кошельков заполнен ({n}). Освободите место в приложении PiDEX Util и попробуйте снова.",
    "ctx.pidex.no_login": "Требуется вход через Pi.",
    "ctx.cancel": "Отмена",
    "ctx.continue": "Продолжить",
    "ctx.save": "Сохранить",
    "toast.copied": "Скопировано",
  },
  bn: {
    "tab.report": "রিপোর্ট করুন",
    "tab.search": "ওয়ালেট খুঁজুন",
    "tab.mywallet": "আমার ওয়ালেট",
    "tab.watch": "ওয়াচলিস্ট", "tab.ledger": "খতিয়ান",
    "ledger.title": "ওয়ালেট খতিয়ান (মাসিক/বার্ষিক)", "ledger.loading": "ইতিহাস লোড হচ্ছে...", "ledger.empty": "কোনো লেনদেন নেই।",
    "ledger.in": "জমা", "ledger.out": "উত্তোলন", "ledger.net": "নিট", "ledger.year_total": "বার্ষিক মোট",
    "ledger.export": "📤 CSV রপ্তানি করুন", "ledger.refresh": "↻ রিফ্রেশ করুন",
    "ledger.note": "⚠️ এই খতিয়ানটি আপনি প্রথমবার খোলার মুহূর্ত থেকে ওয়ালেটের আসা/যাওয়ার ইতিহাস সংগ্রহ করে। ২০২৭ কর বছর থেকে, এটি স্বয়ংক্রিয়ভাবে সেই বছরের ১ জানুয়ারি পর্যন্ত পিছনে সিঙ্ক হবে। প্রকৃত কর ফাইলিংয়ের জন্য, অর্জন ব্যয়ের ভিত্তি হিসেবে আপনার এক্সচেঞ্জের ট্রেড রেকর্ড ব্যবহার করুন — এই খতিয়ানটি শুধুমাত্র ওয়ালেটের আসা/যাওয়ার প্রবাহের রেফারেন্সের জন্য।",
    "ledger.fail": "ইতিহাস লোড করতে ব্যর্থ হয়েছে।", "ledger.counterpart_all": "প্রতিপক্ষ (কিছু নির্বাচন না করলে সব দেখাবে)",
    "ledger.mode_combined": "সম্মিলিত", "ledger.mode_individual": "পৃথক",
    "ledger.incomplete_warn": "এই ওয়ালেটে এত বেশি কার্যকলাপ রয়েছে যে এটি এই বছরের ১ জানুয়ারি পর্যন্ত স্বয়ংক্রিয়ভাবে সিঙ্ক করা যায়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন (সীমা বাড়িয়ে আপনার জন্য পুনরায় সিঙ্ক করা যেতে পারে)।",
    "tab.tax": "কর গণনা",
    "tax.title": "কর গণনা (FIFO / মুভিং এভারেজ)",
    "tax.loading": "লেনদেনের ইতিহাস লোড হচ্ছে...", "tax.syncing": "⏳ সোয়াপ ইতিহাস সিঙ্ক হচ্ছে...",
    "tax.method.fifo": "FIFO (প্রথমে আসা প্রথমে যাওয়া)", "tax.method.moving_avg": "মুভিং এভারেজ",
    "tax.method.hint": "আইন অনুযায়ী, এক্সচেঞ্জের (লাইসেন্সপ্রাপ্ত ভার্চুয়াল অ্যাসেট প্রদানকারী) মাধ্যমে লেনদেনে মুভিং এভারেজ পদ্ধতি প্রযোজ্য; ব্যক্তিগত ওয়ালেট এবং নন-কাস্টোডিয়াল DEX-এ FIFO প্রযোজ্য।",
    "tax.untagged_hint": "এটি এখনও ট্যাগ না করা প্রতিপক্ষ ওয়ালেট। ট্যাগ করলে এটি গণনায় অন্তর্ভুক্ত করা যাবে।",
    "tax.method.unset": "ট্যাগ করা হয়নি", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "মুভিং এভারেজ",
    "tax.tag_now": "এখনই ট্যাগ করুন", "tax.tag_dialog.title": "গণনা পদ্ধতি নির্ধারণ করুন",
    "tax.disposal.date": "তারিখ", "tax.disposal.qty": "পরিমাণ", "tax.disposal.proceeds": "বিক্রয় মূল্য",
    "tax.disposal.cost": "অধিগ্রহণ খরচ", "tax.disposal.gain": "লাভ/ক্ষতি",
    "tax.no_price": "⚠️ {n}টি এন্ট্রিতে দাম নেই — গণনা থেকে বাদ দেওয়া হয়েছে",
    "tax.manual_price.edit": "ম্যানুয়াল দাম নির্ধারণ করুন", "tax.manual_price.auto": "স্বয়ংক্রিয় দাম",
    "tax.note": "⚠️ এই গণনা শুধুমাত্র রেফারেন্সের জন্য। প্রকৃত ফাইলিংয়ের আগে অবশ্যই ট্যাক্স পেশাদারের সাথে নিশ্চিত করুন।",
    "tax.report.title": "কর ফাইলিংয়ের জন্য প্রতিবেদন", "tax.report.select_wallets": "অন্তর্ভুক্ত করার জন্য প্রতিপক্ষ ওয়ালেট নির্বাচন করুন",
    "tax.report.self_swap": "DEX স্ব-সোয়াপ (FIFO)", "tax.report.date_from": "থেকে", "tax.report.date_to": "পর্যন্ত",
    "tax.report.generate": "প্রতিবেদন তৈরি করুন",
    "tax.report.no_selection": "অন্তত একটি ওয়ালেট নির্বাচন করুন।",
    "tax.report.method_label": "প্রয়োগকৃত পদ্ধতি", "tax.report.period_label": "সময়কাল", "tax.report.wallets_label": "অন্তর্ভুক্ত প্রতিপক্ষ ওয়ালেট",
    "tax.report.total_gain": "মোট লাভ/ক্ষতি", "tax.report.export": "📤 প্রতিবেদন CSV এক্সপোর্ট করুন",
    "report.title": "🚨 প্রতারণা রিপোর্ট করুন",
    'report.realname_warn': "⚠️ এই রিপোর্ট <strong>প্রকৃত-নাম নীতি</strong>র অধীনে পরিচালিত হয়।<br>শুধুমাত্র লগইন করা Pi অ্যাকাউন্টধারীই রিপোর্ট করতে পারবেন,<br>এবং মিথ্যা রিপোর্টে আইনি দায় হতে পারে।",
    "report.victim_id": "ভুক্তভোগীর Pi ID",
    "report.suspect_wallet": "সন্দেহভাজন ওয়ালেট ঠিকানা",
    "report.amount": "হারানো পরিমাণ (Pi)",
    "report.date": "ঘটনার তারিখ",
    "report.txhash": "লেনদেন হ্যাশ (ঐচ্ছিক)",
    "report.desc": "বিবরণ (ঐচ্ছিক)",
    "report.btn": "রিপোর্ট জমা দিন",
    "report.btn.loading": "জমা হচ্ছে...",
    "report.success": "✅ রিপোর্ট জমা হয়েছে।",
    "report.err.required": "সব প্রয়োজনীয় ঘর পূরণ করুন।",
    "report.err.wallet": "অবৈধ ওয়ালেট ঠিকানা ফরম্যাট (G দিয়ে শুরু, ৫৬ অক্ষর)।",
    "report.err.generic": "একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
    "presearch.title": "রিপোর্ট করার আগে যাচাই",
    "presearch.placeholder": "সন্দেহভাজন ঠিকানা লিখুন...",
    "presearch.warn.not_wallet": "দয়া করে G দিয়ে শুরু হওয়া ঠিকানা লিখুন।",
    "presearch.hint.short": "কমপক্ষে ৪টি অক্ষর লিখুন।",
    "presearch.loading": "খোঁজা হচ্ছে...",
    "presearch.none": "কোনো বিদ্যমান রিপোর্ট পাওয়া যায়নি।",
    "presearch.found": "{n}টি বিদ্যমান রিপোর্ট পাওয়া গেছে।",
    "search.title": "🔍 ওয়ালেট খুঁজুন",
    "search.placeholder": "ঠিকানা লিখুন (G...)",
    "search.btn": "খুঁজুন",
    "search.no_tx": "কোনো লেনদেন নেই",
    "search.err.fail": "খোঁজা ব্যর্থ",
    "search.err.not_found": "ওয়ালেট পাওয়া যায়নি।",
    "search.error": "খোঁজার সময় ত্রুটি।",
    "list.title": "🗂️ রিপোর্ট তালিকা",
    "list.filter": "ওয়ালেট/ভুক্তভোগী ID খুঁজুন...",
    "list.count": "রিপোর্ট",
    "list.loading": "লোড হচ্ছে...",
    "list.empty": "এখনো কোনো রিপোর্ট নেই।",
    "list.search_btn": "খুঁজুন",
    "list.wallet": "সন্দেহভাজন ওয়ালেট:",
    "summary.reports": "রিপোর্ট",
    "summary.reported_pi": "মোট রিপোর্ট করা",
    "summary.tx_count": "বহির্গামী লেনদেন",
    "summary.total_sent": "মোট পাঠানো",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n}টি রিপোর্ট মিল",
    "tx.victims": "ভুক্তভোগী",
    "risk.safe": "নিরাপদ",
    "risk.low": "সতর্কতা",
    "risk.mid": "বিপদ",
    "risk.high": "উচ্চ ঝুঁকি",
    "matched.victim_id": "ভুক্তভোগী",
    "matched.chain": "চেইন মিল",
    "top10.title": "সর্বাধিক রিপোর্ট করা ওয়ালেট টপ ১০",
    "top10.cases": "মামলা",
    "verify.btn": "যাচাই করুন",
    "verify.done": "যাচাইকৃত",
    "verify.mine": "আমার রিপোর্ট",
    "verify.confirmed": " যাচাই করেছেন",
    "verify.toast": "যাচাই নথিভুক্ত হয়েছে।",
    "export.toast": "ক্লিপবোর্ডে কপি হয়েছে।",
    "export.copied": "✅ কপি হয়েছে",
    "export.manual": "সব নির্বাচন করে কপি করুন।",
    "doc.title": "Pi প্রতারণা তদন্ত প্রতিবেদন",
    "doc.generated": "তৈরি হয়েছে",
    "doc.wallet_sec": "সন্দেহভাজন ওয়ালেট",
    "doc.reports_sec": "রিপোর্ট সারাংশ",
    "doc.count": "রিপোর্ট সংখ্যা",
    "doc.total_pi": "মোট রিপোর্ট করা",
    "doc.victims_sec": "ভুক্তভোগী তালিকা",
    "doc.victim_id": "ভুক্তভোগী ID",
    "doc.damage": "ক্ষতি",
    "doc.date": "তারিখ",
    "doc.tx_hash": "TX হ্যাশ",
    "doc.situation": "বিবরণ",
    "doc.outgoing_sec": "বহির্গামী লেনদেন",
    "doc.no_tx": "কোনোটি নেই",
    "doc.chain_match": "★ রিপোর্টের সাথে মেলে",
    "doc.amount": "পরিমাণ",
    "doc.cex_sec": "CEX ট্রান্সফার সারাংশ",
    "doc.verify_sec": "ডেটা যাচাইকরণ",
    "doc.verify_body": "Horizon API (মেইননেট) লেনদেন ডেটার উপর ভিত্তি করে",
    "doc.submit_sec": "জমা দিন",
    "doc.police": "স্থানীয় সাইবার অপরাধ ইউনিট",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "প্রযোজ্য হলে এক্সচেঞ্জ গ্রাহক সহায়তা",
    "doc.notes_sec": "নোট",
    "doc.note1": "এই নথিটি শুধুমাত্র রেফারেন্সের জন্য।",
    "doc.note2": "চেইন মিল অনুমান, চূড়ান্ত প্রমাণ নয়।",
    "doc.note3": "ব্যাখ্যা এখতিয়ার অনুযায়ী ভিন্ন হতে পারে।",
    "mywallet.title": "আমার ওয়ালেট (মেইননেট)",
    "mywallet.add": "ওয়ালেট যোগ করুন",
    "mywallet.no_wallets": "কোনো ওয়ালেট নিবন্ধিত নেই।",
    "mywallet.loading": "লোড হচ্ছে...",
    "mywallet.fail": "লোড ব্যর্থ",
    "mywallet.refresh": "রিফ্রেশ করুন",
    "mywallet.load.fail": "সার্ভার থেকে আপনার ওয়ালেট তালিকা লোড করা যায়নি।",
    "mywallet.not_activated": "এই ওয়ালেটটি এখনও Pi মেইননেটে সক্রিয় হয়নি। (অ্যাকাউন্ট শুধুমাত্র কমপক্ষে একবার Pi পাওয়ার পরে তৈরি হয়)",
    'mywallet.not_activated.confirm': "তবুও যোগ করবেন?",
    'mywallet.not_activated.icon_title': "নিষ্ক্রিয় ওয়ালেট (কখনও Pi পায়নি)",
    "mywallet.max_hint": "সর্বোচ্চ {n}",
    "mywallet.pi.total": "π মোট ব্যালেন্স",
    "mywallet.pi.avail": "উপলব্ধ",
    "mywallet.pi.reserve": "সর্বনিম্ন রিজার্ভ (আনুমানিক)",
    "mywallet.tokens": "টোকেন",
    "mywallet.txs": "সাম্প্রতিক লেনদেন",
    "mywallet.lp": "LP অবস্থান",
    'mywallet.lock.title': "লক করা ব্যালেন্স",
    'mywallet.lock.total': "লক করা পরিমাণ",
    'mywallet.lock.claimable': "এখনই দাবিযোগ্য",
    "backup.title": "ব্যাকআপ / পুনরুদ্ধার",
    "backup.load_fail": "স্লট লোড করা যায়নি",
    "backup.empty": "খালি",
    "backup.slot": "স্লট {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "সম্পূর্ণ ব্যাকআপ",
    "backup.btn.append_backup": "সংযোজন ব্যাকআপ",
    "backup.btn.full_restore": "সম্পূর্ণ পুনরুদ্ধার",
    "backup.btn.append_restore": "সংযোজন পুনরুদ্ধার",
    "backup.saved": "ব্যাকআপ সংরক্ষিত হয়েছে",
    "backup.fail": "একটি ত্রুটি ঘটেছে",
    "backup.confirm.overwrite": "স্লট {n}-এর বিদ্যমান তথ্য মুছে ফেলা হবে এবং বর্তমান তালিকা দিয়ে প্রতিস্থাপিত হবে। চালিয়ে যাবেন?",
    "backup.confirm.save": "বর্তমান তালিকা স্লট {n}-এ ব্যাকআপ করুন।",
    "backup.confirm.truncate": "শুধুমাত্র {n}টি সংরক্ষিত হবে এবং {dropped}টি বাদ যাবে। চালিয়ে যাবেন?",
    "backup.confirm.restore_full": "বর্তমান তালিকা সম্পূর্ণ মুছে ফেলা হবে এবং স্লট {n}-এর বিষয়বস্তু দিয়ে প্রতিস্থাপিত হবে। চালিয়ে যাবেন?",
    "mywallet.no_lp": "কোনো LP নেই",
    "mywallet.tx_none": "কোনো লেনদেন নেই",
    "mywallet.updated": "আপডেট হয়েছে",
    "mywallet.tx_sent": "পাঠানো হয়েছে",
    "mywallet.tx_recv": "প্রাপ্ত হয়েছে",
    "mywallet.add.title": "ওয়ালেট যোগ করুন",
    "mywallet.add.alias_ph": "ডাকনাম (যেমন প্রধান ওয়ালেট)",
    "mywallet.add.addr_ph": "ওয়ালেট ঠিকানা (G...)",
    "mywallet.add.err_addr": "অবৈধ ঠিকানা (G দিয়ে শুরু, ৫৬ অক্ষর)",
    "mywallet.add.err_dup": "এই ঠিকানা ইতিমধ্যে নিবন্ধিত।",
    "mywallet.add.err_full": "আপনার আমার ওয়ালেট তালিকা পূর্ণ (৩০)। একটি সরান এবং আবার চেষ্টা করুন।",
    "mywallet.alias.edit": "ডাকনাম সম্পাদনা করুন",
    "mywallet.delete": "ওয়ালেট মুছুন",
    "mywallet.delete.confirm": "আপনি কি নিশ্চিত এই ওয়ালেট মুছে ফেলতে চান?",
    "mywallet.cloud.fail": "সার্ভার ত্রুটি ঘটেছে।",
    "watch.title": "ওয়াচলিস্ট",
    "watch.empty": "ওয়াচলিস্টে কোনো ওয়ালেট নেই।",
    "watch.load.fail": "সার্ভার থেকে আপনার ওয়াচলিস্ট লোড করা যায়নি।",
    "watch.max_hint": "(সর্বোচ্চ {n})",
    "watch.add.btn": "ওয়ালেট যোগ করুন",
    "watch.add.addr_ph": "ওয়ালেট ঠিকানা (G...)",
    "watch.add.err_addr": "ঠিকানা যাচাই করুন।",
    "watch.fetch.btn": "🔍 সব আনুন",
    "watch.fetch.loading": "আনা হচ্ছে...",
    "watch.internal.title": "🔄 অভ্যন্তরীণ স্থানান্তর",
    "watch.feed.title": "📡 সম্পূর্ণ ফিড",
    "watch.no.internal": "কোনো অভ্যন্তরীণ স্থানান্তর নেই",
    "watch.new.tx": "নতুন লেনদেন সনাক্ত হয়েছে",
    "watch.report.warn": "রিপোর্ট করা ওয়ালেট",
    "watch.cloud.fail": "সার্ভার ত্রুটি ঘটেছে।",
    "backup.alias_conflict.title": "ডাকনাম দ্বন্দ্ব",
    "backup.alias_conflict.desc": "{n}টি ঠিকানার ডাকনাম বর্তমানের চেয়ে ভিন্ন। কোনটি ব্যবহার করবেন?",
    "backup.alias_conflict.keep_latest": "সর্বশেষ ডাকনাম রাখুন (প্রস্তাবিত)",
    "backup.alias_conflict.use_backup": "ব্যাকআপের সময়ের ডাকনাম ব্যবহার করুন",
    "ctx.trade": "ওয়ালেট ডাকনাম যোগ করুন",
    "tab.trade": "ওয়ালেট ডাকনাম",
    "trade.title": "ওয়ালেট ডাকনাম",
    "trade.desc": "নিবন্ধিত ঠিকানাগুলি লেনদেন তালিকায় ডাকনাম হিসেবে দেখানো হবে।",
    "trade.empty": "কোনো ওয়ালেট ডাকনাম নিবন্ধিত নেই।",
    "trade.add.title": "ওয়ালেট ডাকনাম যোগ করুন",
    "trade.add.err_full": "আপনার ইতিমধ্যে {n}টি ওয়ালেট ডাকনাম আছে। কিছু মুছে আবার চেষ্টা করুন।",
    "cex.estimated": "এক্সচেঞ্জ (আনুমানিক)",
    "ctx.watch": "ওয়াচলিস্টে যোগ করুন",
    "ctx.watch.slot": "{n}টি স্লট বাকি",
    "ctx.watch.exists": "ইতিমধ্যে যোগ হয়েছে",
    "ctx.watch.full": "ওয়াচলিস্ট পূর্ণ (সর্বোচ্চ ১০)",
    "ctx.watch.alias_title": "ডাকনাম লিখুন",
    "ctx.watch.alias_ph": "ডাকনাম (ঐচ্ছিক)",
    "ctx.watch.added": "যোগ হয়েছে",
    "ctx.register.both": "PiDEX Util টেস্টনেট ওয়ালেটে নিবন্ধন করুন",
    "ctx.both.alias_title": "ডাকনাম লিখুন",
    "ctx.both.alias_ph": "ডাকনাম (ঐচ্ছিক)",
    "ctx.both.sent": "✅ নিবন্ধিত",
    "ctx.both.fail": "নিবন্ধন ব্যর্থ",
    "ctx.both.dup": "ইতিমধ্যে নিবন্ধিত",
    "ctx.both.full": "টেস্টনেট ওয়ালেট তালিকা পূর্ণ ({n})। PiDEX Util অ্যাপে স্লট খালি করুন এবং আবার চেষ্টা করুন।",
    "ctx.pidex.no_login": "Pi লগইন প্রয়োজন।",
    "ctx.cancel": "বাতিল",
    "ctx.continue": "চালিয়ে যান",
    "ctx.save": "সংরক্ষণ করুন",
    "toast.copied": "কপি হয়েছে",
  },
  sw: {
    "tab.report": "Ripoti",
    "tab.search": "Tafuta Pochi",
    "tab.mywallet": "Pochi Yangu",
    "tab.watch": "Orodha ya Ufuatiliaji", "tab.ledger": "Kitabu cha Hesabu",
    "ledger.title": "Kitabu cha Hesabu cha Pochi (Kila Mwezi/Mwaka)", "ledger.loading": "Inapakia historia...", "ledger.empty": "Hakuna miamala.",
    "ledger.in": "Ndani", "ledger.out": "Nje", "ledger.net": "Jumla Halisi", "ledger.year_total": "Jumla ya Mwaka",
    "ledger.export": "📤 Hamisha CSV", "ledger.refresh": "↻ Onyesha upya",
    "ledger.note": "⚠️ Kitabu hiki cha hesabu hukusanya historia ya ndani/nje ya pochi kuanzia wakati unapokifungua kwa mara ya kwanza. Kuanzia mwaka wa kodi 2027, kitasawazishwa kiotomatiki nyuma hadi Januari 1 ya mwaka huo. Kwa ajili ya kufungua mizigo ya kodi halisi, tumia rekodi za biashara za soko lako kama msingi wa gharama ya ununuzi — kitabu hiki cha hesabu ni kwa ajili ya marejeleo ya mtiririko wa pochi pekee.",
    "ledger.fail": "Imeshindwa kupakia historia.", "ledger.counterpart_all": "Mshirika (huonyesha wote ikiwa hakuna aliyechaguliwa)",
    "ledger.mode_combined": "Jumla", "ledger.mode_individual": "Kibinafsi",
    "ledger.incomplete_warn": "Pochi hii ina shughuli nyingi mno kusawazishwa kiotomatiki hadi Januari 1 mwaka huu. Tafadhali wasiliana na msimamizi (kikomo kinaweza kuongezwa na kusawazishwa upya kwa ajili yako).",
    "tab.tax": "Hesabu ya Kodi",
    "tax.title": "Hesabu ya Kodi (FIFO / Wastani Unaosonga)",
    "tax.loading": "Inapakia historia ya miamala...", "tax.syncing": "⏳ Inasawazisha historia ya kubadilishana...",
    "tax.method.fifo": "FIFO (Iliyoingia Kwanza Yatoka Kwanza)", "tax.method.moving_avg": "Wastani Unaosonga",
    "tax.method.hint": "Kisheria, miamala kupitia soko la kubadilishana (mtoa huduma wa mali za kidijitali aliyeidhinishwa) hutumia mbinu ya wastani unaosonga; pochi za kibinafsi na DEX zisizo za kuhifadhi hutumia FIFO.",
    "tax.untagged_hint": "Hii ni pochi ya mshirika ambayo bado haijawekwa lebo. Iweke lebo ili iingizwe kwenye hesabu.",
    "tax.method.unset": "Haijawekwa lebo", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Wastani",
    "tax.tag_now": "Weka lebo sasa", "tax.tag_dialog.title": "Weka Mbinu ya Uhesabuji",
    "tax.disposal.date": "Tarehe", "tax.disposal.qty": "Kiasi", "tax.disposal.proceeds": "Mapato ya Mauzo",
    "tax.disposal.cost": "Gharama ya Ununuzi", "tax.disposal.gain": "Faida/Hasara",
    "tax.no_price": "⚠️ Maingizo {n} bila bei — yametengwa kutoka kwenye hesabu",
    "tax.manual_price.edit": "Weka bei kwa mkono", "tax.manual_price.auto": "Bei ya kiotomatiki",
    "tax.note": "⚠️ Hesabu hii ni kwa ajili ya rejeleo tu. Thibitisha na mtaalamu wa kodi kabla ya kuwasilisha rasmi.",
    "tax.report.title": "Ripoti kwa Ajili ya Kuwasilisha Kodi", "tax.report.select_wallets": "Chagua pochi za mshirika za kujumuisha",
    "tax.report.self_swap": "Kubadilishana kwa DEX binafsi (FIFO)", "tax.report.date_from": "Kutoka", "tax.report.date_to": "Hadi",
    "tax.report.generate": "Tengeneza Ripoti",
    "tax.report.no_selection": "Chagua angalau pochi moja.",
    "tax.report.method_label": "Mbinu Iliyotumika", "tax.report.period_label": "Kipindi", "tax.report.wallets_label": "Pochi za Mshirika Zilizojumuishwa",
    "tax.report.total_gain": "Jumla ya Faida/Hasara", "tax.report.export": "📤 Hamisha CSV ya Ripoti",
    "report.title": "🚨 Ripoti Udanganyifu",
    'report.realname_warn': "⚠️ Ripoti hii inaendeshwa chini ya <strong>sera ya jina halisi</strong>.<br>Ni mmiliki wa akaunti ya Pi aliyeingia pekee anayeweza kuripoti,<br>na ripoti za uongo zinaweza kusababisha dhima ya kisheria.",
    "report.victim_id": "Pi ID ya Mwathirika",
    "report.suspect_wallet": "Anwani ya Pochi Inayoshukiwa",
    "report.amount": "Kiasi Kilichopotea (Pi)",
    "report.date": "Tarehe ya Tukio",
    "report.txhash": "Hash ya Muamala (si lazima)",
    "report.desc": "Maelezo (si lazima)",
    "report.btn": "Wasilisha Ripoti",
    "report.btn.loading": "Inawasilisha...",
    "report.success": "✅ Ripoti imewasilishwa.",
    "report.err.required": "Tafadhali jaza sehemu zote zinazohitajika.",
    "report.err.wallet": "Muundo wa anwani ya pochi si sahihi (huanza na G, herufi 56).",
    "report.err.generic": "Hitilafu imetokea. Tafadhali jaribu tena.",
    "presearch.title": "Ukaguzi Kabla ya Kuripoti",
    "presearch.placeholder": "Ingiza anwani inayoshukiwa...",
    "presearch.warn.not_wallet": "Tafadhali ingiza anwani inayoanza na G.",
    "presearch.hint.short": "Ingiza angalau herufi 4.",
    "presearch.loading": "Inatafuta...",
    "presearch.none": "Hakuna ripoti zilizopo zilizopatikana.",
    "presearch.found": "Ripoti {n} zilizopo zimepatikana.",
    "search.title": "🔍 Tafuta Pochi",
    "search.placeholder": "Ingiza anwani (G...)",
    "search.btn": "Tafuta",
    "search.no_tx": "Hakuna miamala",
    "search.err.fail": "Utafutaji umeshindwa",
    "search.err.not_found": "Pochi haikupatikana.",
    "search.error": "Hitilafu wakati wa kutafuta.",
    "list.title": "🗂️ Orodha ya Ripoti",
    "list.filter": "Tafuta pochi/ID ya mwathirika...",
    "list.count": "ripoti",
    "list.loading": "Inapakia...",
    "list.empty": "Bado hakuna ripoti.",
    "list.search_btn": "Tafuta",
    "list.wallet": "Pochi Inayoshukiwa:",
    "summary.reports": "Ripoti",
    "summary.reported_pi": "Jumla Iliyoripotiwa",
    "summary.tx_count": "Miamala ya Kutoka",
    "summary.total_sent": "Jumla Iliyotumwa",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "Ripoti {n} zinazolingana",
    "tx.victims": "Waathirika",
    "risk.safe": "Salama",
    "risk.low": "Tahadhari",
    "risk.mid": "Hatari",
    "risk.high": "Hatari Kubwa",
    "matched.victim_id": "Mwathirika",
    "matched.chain": "Ulinganifu wa Msururu",
    "top10.title": "Pochi 10 Zilizoripotiwa Zaidi",
    "top10.cases": "kesi",
    "verify.btn": "Thibitisha",
    "verify.done": "Imethibitishwa",
    "verify.mine": "Ripoti Yangu",
    "verify.confirmed": " wamethibitisha",
    "verify.toast": "Uthibitisho umerekodiwa.",
    "export.toast": "Imenakiliwa kwenye ubao wa kunakili.",
    "export.copied": "✅ Imenakiliwa",
    "export.manual": "Chagua yote kisha nakili.",
    "doc.title": "Ripoti ya Uchunguzi wa Udanganyifu wa Pi",
    "doc.generated": "Imetengenezwa",
    "doc.wallet_sec": "Pochi Inayoshukiwa",
    "doc.reports_sec": "Muhtasari wa Ripoti",
    "doc.count": "Idadi ya Ripoti",
    "doc.total_pi": "Jumla Iliyoripotiwa",
    "doc.victims_sec": "Orodha ya Waathirika",
    "doc.victim_id": "ID ya Mwathirika",
    "doc.damage": "Uharibifu",
    "doc.date": "Tarehe",
    "doc.tx_hash": "Hash ya TX",
    "doc.situation": "Maelezo",
    "doc.outgoing_sec": "Miamala ya Kutoka",
    "doc.no_tx": "Hakuna",
    "doc.chain_match": "★ Inalingana na Ripoti",
    "doc.amount": "Kiasi",
    "doc.cex_sec": "Muhtasari wa Uhamisho wa CEX",
    "doc.verify_sec": "Uthibitishaji wa Data",
    "doc.verify_body": "Kulingana na data ya muamala ya Horizon API (mainnet)",
    "doc.submit_sec": "Wasilisha Kwa",
    "doc.police": "Kitengo cha Uhalifu wa Mtandao cha Eneo",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Msaada wa wateja wa soko la fedha ikiwa unatumika",
    "doc.notes_sec": "Vidokezo",
    "doc.note1": "Hati hii ni kwa madhumuni ya rejea tu.",
    "doc.note2": "Ulinganifu wa msururu ni makadirio, si uthibitisho wa uhakika.",
    "doc.note3": "Tafsiri inaweza kutofautiana kulingana na mamlaka.",
    "mywallet.title": "Pochi Yangu (Mainnet)",
    "mywallet.add": "Ongeza Pochi",
    "mywallet.no_wallets": "Hakuna pochi zilizosajiliwa.",
    "mywallet.loading": "Inapakia...",
    "mywallet.fail": "Imeshindwa kupakia",
    "mywallet.refresh": "Onyesha upya",
    "mywallet.load.fail": "Imeshindwa kupakia orodha ya pochi zako kutoka kwa seva.",
    "mywallet.not_activated": "Pochi hii bado haijaamilishwa kwenye mainnet ya Pi. (Akaunti huundwa tu baada ya kupokea Pi angalau mara moja)",
    'mywallet.not_activated.confirm': "Ongeza hata hivyo?",
    'mywallet.not_activated.icon_title': "Pochi isiyofanya kazi (haijawahi kupokea Pi)",
    "mywallet.max_hint": "Kiwango cha juu {n}",
    "mywallet.pi.total": "π Salio Jumla",
    "mywallet.pi.avail": "Inapatikana",
    "mywallet.pi.reserve": "Akiba ya Chini (makadirio)",
    "mywallet.tokens": "Tokeni",
    "mywallet.txs": "Miamala ya Hivi Karibuni",
    "mywallet.lp": "Nafasi za LP",
    'mywallet.lock.title': "Salio Lililofungwa",
    'mywallet.lock.total': "Kiasi Kilichofungwa",
    'mywallet.lock.claimable': "Kinaweza Kudaiwa Sasa",
    "backup.title": "Hifadhi Nakala / Rejesha",
    "backup.load_fail": "Imeshindwa kupakia nafasi",
    "backup.empty": "Tupu",
    "backup.slot": "Nafasi {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Hifadhi Kamili",
    "backup.btn.append_backup": "Hifadhi ya Ziada",
    "backup.btn.full_restore": "Urejeshaji Kamili",
    "backup.btn.append_restore": "Urejeshaji wa Ziada",
    "backup.saved": "Nakala imehifadhiwa",
    "backup.fail": "Hitilafu imetokea",
    "backup.confirm.overwrite": "Data iliyopo kwenye Nafasi {n} itafutwa na kubadilishwa na orodha ya sasa. Endelea?",
    "backup.confirm.save": "Hifadhi orodha ya sasa kwenye Nafasi {n}.",
    "backup.confirm.truncate": "{n} tu ndizo zitahifadhiwa na {dropped} zitaondolewa. Endelea?",
    "backup.confirm.restore_full": "Orodha ya sasa itafutwa yote na kubadilishwa na maudhui ya Nafasi {n}. Endelea?",
    "mywallet.no_lp": "Hakuna LP",
    "mywallet.tx_none": "Hakuna miamala",
    "mywallet.updated": "Imesasishwa",
    "mywallet.tx_sent": "Imetumwa",
    "mywallet.tx_recv": "Imepokewa",
    "mywallet.add.title": "Ongeza Pochi",
    "mywallet.add.alias_ph": "Jina la utani (mf. Pochi Kuu)",
    "mywallet.add.addr_ph": "Anwani ya Pochi (G...)",
    "mywallet.add.err_addr": "Anwani si sahihi (huanza na G, herufi 56)",
    "mywallet.add.err_dup": "Anwani hii tayari imesajiliwa.",
    "mywallet.add.err_full": "Orodha yako ya Pochi Yangu imejaa (30). Ondoa moja na ujaribu tena.",
    "mywallet.alias.edit": "Hariri Jina la Utani",
    "mywallet.delete": "Futa Pochi",
    "mywallet.delete.confirm": "Una uhakika unataka kufuta pochi hii?",
    "mywallet.cloud.fail": "Hitilafu ya seva imetokea.",
    "watch.title": "Orodha ya Ufuatiliaji",
    "watch.empty": "Hakuna pochi kwenye orodha ya ufuatiliaji.",
    "watch.load.fail": "Imeshindwa kupakia orodha yako ya ufuatiliaji kutoka kwa seva.",
    "watch.max_hint": "(kiwango cha juu {n})",
    "watch.add.btn": "Ongeza Pochi",
    "watch.add.addr_ph": "Anwani ya pochi (G...)",
    "watch.add.err_addr": "Tafadhali kagua anwani.",
    "watch.fetch.btn": "🔍 Pata Zote",
    "watch.fetch.loading": "Inapata...",
    "watch.internal.title": "🔄 Uhamisho wa Ndani",
    "watch.feed.title": "📡 Mlisho Kamili",
    "watch.no.internal": "Hakuna uhamisho wa ndani",
    "watch.new.tx": "Muamala mpya umegunduliwa",
    "watch.report.warn": "Pochi iliyoripotiwa",
    "watch.cloud.fail": "Hitilafu ya seva imetokea.",
    "backup.alias_conflict.title": "Mgongano wa Jina la Utani",
    "backup.alias_conflict.desc": "Anwani {n} zina jina la utani tofauti na la sasa. Ni lipi litumike?",
    "backup.alias_conflict.keep_latest": "Weka Jina la Utani Jipya Zaidi (Inapendekezwa)",
    "backup.alias_conflict.use_backup": "Tumia Jina la Utani la Wakati wa Hifadhi",
    "ctx.trade": "Ongeza Jina Bandia la Pochi",
    "tab.trade": "Majina Bandia ya Pochi",
    "trade.title": "Majina Bandia ya Pochi",
    "trade.desc": "Anwani zilizosajiliwa zitaonyeshwa kwa jina lake katika orodha ya miamala.",
    "trade.empty": "Hakuna jina bandia la pochi lililosajiliwa.",
    "trade.add.title": "Ongeza Jina Bandia la Pochi",
    "trade.add.err_full": "Tayari una majina bandia ya pochi {n}. Futa baadhi kisha jaribu tena.",
    "cex.estimated": "Soko la fedha (makadirio)",
    "ctx.watch": "Ongeza kwenye Orodha ya Ufuatiliaji",
    "ctx.watch.slot": "Nafasi {n} zimebaki",
    "ctx.watch.exists": "Tayari imeongezwa",
    "ctx.watch.full": "Orodha ya ufuatiliaji imejaa (kiwango cha juu 10)",
    "ctx.watch.alias_title": "Ingiza Jina la Utani",
    "ctx.watch.alias_ph": "Jina la utani (si lazima)",
    "ctx.watch.added": "Imeongezwa",
    "ctx.register.both": "Sajili kwenye Pochi ya Testnet ya PiDEX Util",
    "ctx.both.alias_title": "Ingiza Jina la Utani",
    "ctx.both.alias_ph": "Jina la utani (si lazima)",
    "ctx.both.sent": "✅ Imesajiliwa",
    "ctx.both.fail": "Usajili umeshindwa",
    "ctx.both.dup": "Tayari imesajiliwa",
    "ctx.both.full": "Orodha ya pochi za testnet imejaa ({n}). Achilia nafasi kwenye programu ya PiDEX Util na ujaribu tena.",
    "ctx.pidex.no_login": "Kuingia kwa Pi kunahitajika.",
    "ctx.cancel": "Ghairi",
    "ctx.continue": "Endelea",
    "ctx.save": "Hifadhi",
    "toast.copied": "Imenakiliwa",
  },
  th: {
    "tab.report": "รายงาน",
    "tab.search": "ค้นหากระเป๋าเงิน",
    "tab.mywallet": "กระเป๋าของฉัน",
    "tab.watch": "รายการเฝ้าดู", "tab.ledger": "บัญชี",
    "ledger.title": "บัญชีกระเป๋าเงิน (รายเดือน/รายปี)", "ledger.loading": "กำลังโหลดประวัติ...", "ledger.empty": "ไม่มีธุรกรรม",
    "ledger.in": "เข้า", "ledger.out": "ออก", "ledger.net": "สุทธิ", "ledger.year_total": "ยอดรวมรายปี",
    "ledger.export": "📤 ส่งออก CSV", "ledger.refresh": "↻ รีเฟรช",
    "ledger.note": "⚠️ บัญชีนี้รวบรวมประวัติเข้า/ออกของกระเป๋าเงินตั้งแต่ช่วงเวลาที่คุณเปิดครั้งแรก ตั้งแต่ปีภาษี 2027 เป็นต้นไป จะซิงค์ย้อนหลังโดยอัตโนมัติไปจนถึงวันที่ 1 มกราคมของปีนั้น สำหรับการยื่นภาษีจริง โปรดใช้ประวัติการซื้อขายจากตลาดแลกเปลี่ยนของคุณเป็นฐานต้นทุนการได้มา — บัญชีนี้มีไว้เพื่ออ้างอิงกระแสเงินเข้า/ออกของกระเป๋าเงินเท่านั้น",
    "ledger.fail": "โหลดประวัติไม่สำเร็จ", "ledger.counterpart_all": "คู่ค้า (แสดงทั้งหมดหากไม่ได้เลือก)",
    "ledger.mode_combined": "รวม", "ledger.mode_individual": "แยกราย",
    "ledger.incomplete_warn": "กระเป๋าเงินนี้มีกิจกรรมมากเกินไปจนไม่สามารถซิงค์อัตโนมัติย้อนไปถึงวันที่ 1 มกราคมของปีนี้ได้ กรุณาติดต่อผู้ดูแลระบบ (สามารถปรับเพิ่มขีดจำกัดและซิงค์ใหม่ให้ได้)",
    "tab.tax": "คำนวณภาษี",
    "tax.title": "คำนวณภาษี (FIFO / ถัวเฉลี่ยเคลื่อนที่)",
    "tax.loading": "กำลังโหลดประวัติธุรกรรม...", "tax.syncing": "⏳ กำลังซิงค์ประวัติการสวอป...",
    "tax.method.fifo": "FIFO (เข้าก่อนออกก่อน)", "tax.method.moving_avg": "ถัวเฉลี่ยเคลื่อนที่",
    "tax.method.hint": "ตามกฎหมาย ธุรกรรมผ่านตลาดแลกเปลี่ยน (ผู้ให้บริการสินทรัพย์ดิจิทัลที่ได้รับอนุญาต) ใช้วิธีถัวเฉลี่ยเคลื่อนที่ ส่วนกระเป๋าส่วนตัวและ DEX แบบไม่ดูแลทรัพย์สินใช้วิธี FIFO",
    "tax.untagged_hint": "นี่คือกระเป๋าคู่ค้าที่ยังไม่ได้แท็ก แท็กเพื่อรวมไว้ในการคำนวณ",
    "tax.method.unset": "ยังไม่ได้แท็ก", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "ถัวเฉลี่ย",
    "tax.tag_now": "แท็กตอนนี้", "tax.tag_dialog.title": "กำหนดวิธีคำนวณ",
    "tax.disposal.date": "วันที่", "tax.disposal.qty": "จำนวน", "tax.disposal.proceeds": "มูลค่าที่ได้รับ",
    "tax.disposal.cost": "ต้นทุนที่ได้มา", "tax.disposal.gain": "กำไร/ขาดทุน",
    "tax.no_price": "⚠️ {n} รายการไม่มีราคา — ไม่รวมในการคำนวณ",
    "tax.manual_price.edit": "กำหนดราคาด้วยตนเอง", "tax.manual_price.auto": "ราคาที่ดึงอัตโนมัติ",
    "tax.note": "⚠️ การคำนวณนี้ใช้เพื่ออ้างอิงเท่านั้น กรุณายืนยันกับผู้เชี่ยวชาญด้านภาษีก่อนยื่นแบบจริง",
    "tax.report.title": "รายงานสำหรับยื่นภาษี", "tax.report.select_wallets": "เลือกกระเป๋าคู่ค้าที่จะรวม",
    "tax.report.self_swap": "การสวอปด้วยตนเองใน DEX (FIFO)", "tax.report.date_from": "จาก", "tax.report.date_to": "ถึง",
    "tax.report.generate": "สร้างรายงาน",
    "tax.report.no_selection": "กรุณาเลือกกระเป๋าอย่างน้อยหนึ่งใบ",
    "tax.report.method_label": "วิธีที่ใช้", "tax.report.period_label": "ช่วงเวลา", "tax.report.wallets_label": "กระเป๋าคู่ค้าที่รวมอยู่",
    "tax.report.total_gain": "กำไร/ขาดทุนรวม", "tax.report.export": "📤 ส่งออก CSV รายงาน",
    "report.title": "🚨 รายงานการหลอกลวง",
    'report.realname_warn': "⚠️ รายงานนี้ดำเนินการภายใต้<strong>นโยบายใช้ชื่อจริง</strong><br>เฉพาะเจ้าของบัญชี Pi ที่เข้าสู่ระบบเท่านั้นที่สามารถรายงานได้<br>และการรายงานเท็จอาจมีความรับผิดทางกฎหมาย",
    "report.victim_id": "Pi ID ของผู้เสียหาย",
    "report.suspect_wallet": "ที่อยู่กระเป๋าเงินที่ต้องสงสัย",
    "report.amount": "จำนวนที่สูญเสีย (Pi)",
    "report.date": "วันที่เกิดเหตุ",
    "report.txhash": "แฮชธุรกรรม (ไม่บังคับ)",
    "report.desc": "คำอธิบาย (ไม่บังคับ)",
    "report.btn": "ส่งรายงาน",
    "report.btn.loading": "กำลังส่ง...",
    "report.success": "✅ ส่งรายงานแล้ว",
    "report.err.required": "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด",
    "report.err.wallet": "รูปแบบที่อยู่กระเป๋าเงินไม่ถูกต้อง (ขึ้นต้นด้วย G, 56 ตัวอักษร)",
    "report.err.generic": "เกิดข้อผิดพลาด กรุณาลองใหม่",
    "presearch.title": "ตรวจสอบก่อนรายงาน",
    "presearch.placeholder": "ป้อนที่อยู่ที่ต้องสงสัย...",
    "presearch.warn.not_wallet": "กรุณาป้อนที่อยู่ที่ขึ้นต้นด้วย G",
    "presearch.hint.short": "ป้อนอย่างน้อย 4 ตัวอักษร",
    "presearch.loading": "กำลังค้นหา...",
    "presearch.none": "ไม่พบรายงานที่มีอยู่",
    "presearch.found": "พบ {n} รายงานที่มีอยู่",
    "search.title": "🔍 ค้นหากระเป๋าเงิน",
    "search.placeholder": "ป้อนที่อยู่ (G...)",
    "search.btn": "ค้นหา",
    "search.no_tx": "ไม่มีธุรกรรม",
    "search.err.fail": "การค้นหาล้มเหลว",
    "search.err.not_found": "ไม่พบกระเป๋าเงิน",
    "search.error": "เกิดข้อผิดพลาดระหว่างการค้นหา",
    "list.title": "🗂️ รายการรายงาน",
    "list.filter": "ค้นหากระเป๋าเงิน/ID ผู้เสียหาย...",
    "list.count": "รายงาน",
    "list.loading": "กำลังโหลด...",
    "list.empty": "ยังไม่มีรายงาน",
    "list.search_btn": "ค้นหา",
    "list.wallet": "กระเป๋าเงินที่ต้องสงสัย:",
    "summary.reports": "รายงาน",
    "summary.reported_pi": "ยอดรวมที่รายงาน",
    "summary.tx_count": "ธุรกรรมขาออก",
    "summary.total_sent": "ยอดรวมที่ส่ง",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} รายงานที่ตรงกัน",
    "tx.victims": "ผู้เสียหาย",
    "risk.safe": "ปลอดภัย",
    "risk.low": "ระวัง",
    "risk.mid": "อันตราย",
    "risk.high": "เสี่ยงสูง",
    "matched.victim_id": "ผู้เสียหาย",
    "matched.chain": "ตรงกันในเชน",
    "top10.title": "10 กระเป๋าเงินที่ถูกรายงานมากที่สุด",
    "top10.cases": "กรณี",
    "verify.btn": "ยืนยัน",
    "verify.done": "ยืนยันแล้ว",
    "verify.mine": "รายงานของฉัน",
    "verify.confirmed": " ยืนยันแล้ว",
    "verify.toast": "บันทึกการยืนยันแล้ว",
    "export.toast": "คัดลอกไปยังคลิปบอร์ดแล้ว",
    "export.copied": "✅ คัดลอกแล้ว",
    "export.manual": "เลือกทั้งหมดแล้วคัดลอก",
    "doc.title": "รายงานการสืบสวนการหลอกลวง Pi",
    "doc.generated": "สร้างเมื่อ",
    "doc.wallet_sec": "กระเป๋าเงินที่ต้องสงสัย",
    "doc.reports_sec": "สรุปรายงาน",
    "doc.count": "จำนวนรายงาน",
    "doc.total_pi": "ยอดรวมที่รายงาน",
    "doc.victims_sec": "รายชื่อผู้เสียหาย",
    "doc.victim_id": "ID ผู้เสียหาย",
    "doc.damage": "ความเสียหาย",
    "doc.date": "วันที่",
    "doc.tx_hash": "แฮช TX",
    "doc.situation": "คำอธิบาย",
    "doc.outgoing_sec": "ธุรกรรมขาออก",
    "doc.no_tx": "ไม่มี",
    "doc.chain_match": "★ ตรงกับรายงาน",
    "doc.amount": "จำนวน",
    "doc.cex_sec": "สรุปการโอน CEX",
    "doc.verify_sec": "การตรวจสอบข้อมูล",
    "doc.verify_body": "อ้างอิงจากข้อมูลธุรกรรม Horizon API (mainnet)",
    "doc.submit_sec": "ส่งถึง",
    "doc.police": "หน่วยอาชญากรรมไซเบอร์ในพื้นที่",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "ฝ่ายบริการลูกค้าของตลาดแลกเปลี่ยนหากเกี่ยวข้อง",
    "doc.notes_sec": "หมายเหตุ",
    "doc.note1": "เอกสารนี้มีไว้เพื่อการอ้างอิงเท่านั้น",
    "doc.note2": "การจับคู่บนเชนเป็นเพียงการประมาณ ไม่ใช่หลักฐานที่แน่ชัด",
    "doc.note3": "การตีความอาจแตกต่างกันไปตามเขตอำนาจศาล",
    "mywallet.title": "กระเป๋าของฉัน (Mainnet)",
    "mywallet.add": "เพิ่มกระเป๋าเงิน",
    "mywallet.no_wallets": "ไม่มีกระเป๋าเงินที่ลงทะเบียน",
    "mywallet.loading": "กำลังโหลด...",
    "mywallet.fail": "โหลดล้มเหลว",
    "mywallet.refresh": "รีเฟรช",
    "mywallet.load.fail": "ไม่สามารถโหลดรายการกระเป๋าเงินของคุณจากเซิร์ฟเวอร์",
    "mywallet.not_activated": "กระเป๋าเงินนี้ยังไม่ได้เปิดใช้งานบน Pi mainnet (บัญชีจะถูกสร้างขึ้นหลังจากได้รับ Pi อย่างน้อยหนึ่งครั้งเท่านั้น)",
    'mywallet.not_activated.confirm': "ยังต้องการเพิ่มหรือไม่?",
    'mywallet.not_activated.icon_title': "กระเป๋าเงินไม่ได้ใช้งาน (ไม่เคยได้รับ Pi)",
    "mywallet.max_hint": "สูงสุด {n}",
    "mywallet.pi.total": "π ยอดคงเหลือทั้งหมด",
    "mywallet.pi.avail": "ใช้ได้",
    "mywallet.pi.reserve": "สำรองขั้นต่ำ (โดยประมาณ)",
    "mywallet.tokens": "โทเคน",
    "mywallet.txs": "ธุรกรรมล่าสุด",
    "mywallet.lp": "ตำแหน่ง LP",
    'mywallet.lock.title': "ยอดเงินที่ถูกล็อก",
    'mywallet.lock.total': "จำนวนที่ถูกล็อก",
    'mywallet.lock.claimable': "สามารถเคลมได้ตอนนี้",
    "backup.title": "สำรองข้อมูล / กู้คืน",
    "backup.load_fail": "ไม่สามารถโหลดช่องได้",
    "backup.empty": "ว่างเปล่า",
    "backup.slot": "ช่อง {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "สำรองข้อมูลทั้งหมด",
    "backup.btn.append_backup": "สำรองข้อมูลเพิ่มเติม",
    "backup.btn.full_restore": "กู้คืนทั้งหมด",
    "backup.btn.append_restore": "กู้คืนเพิ่มเติม",
    "backup.saved": "บันทึกการสำรองข้อมูลแล้ว",
    "backup.fail": "เกิดข้อผิดพลาด",
    "backup.confirm.overwrite": "ข้อมูลที่มีอยู่ในช่อง {n} จะถูกลบและแทนที่ด้วยรายการปัจจุบัน ดำเนินการต่อหรือไม่?",
    "backup.confirm.save": "สำรองรายการปัจจุบันไปยังช่อง {n}",
    "backup.confirm.truncate": "จะบันทึกได้สูงสุด {n} รายการเท่านั้น และ {dropped} รายการจะถูกตัดออก ดำเนินการต่อหรือไม่?",
    "backup.confirm.restore_full": "รายการปัจจุบันจะถูกล้างทั้งหมดและแทนที่ด้วยเนื้อหาของช่อง {n} ดำเนินการต่อหรือไม่?",
    "mywallet.no_lp": "ไม่มี LP",
    "mywallet.tx_none": "ไม่มีธุรกรรม",
    "mywallet.updated": "อัปเดตแล้ว",
    "mywallet.tx_sent": "ส่งแล้ว",
    "mywallet.tx_recv": "ได้รับแล้ว",
    "mywallet.add.title": "เพิ่มกระเป๋าเงิน",
    "mywallet.add.alias_ph": "ชื่อเล่น (เช่น กระเป๋าหลัก)",
    "mywallet.add.addr_ph": "ที่อยู่กระเป๋าเงิน (G...)",
    "mywallet.add.err_addr": "ที่อยู่ไม่ถูกต้อง (ขึ้นต้นด้วย G, 56 ตัวอักษร)",
    "mywallet.add.err_dup": "ที่อยู่นี้ลงทะเบียนแล้ว",
    "mywallet.add.err_full": "รายการกระเป๋าของฉันเต็มแล้ว (30) ลบออกหนึ่งรายการแล้วลองใหม่",
    "mywallet.alias.edit": "แก้ไขชื่อเล่น",
    "mywallet.delete": "ลบกระเป๋าเงิน",
    "mywallet.delete.confirm": "แน่ใจหรือไม่ว่าต้องการลบกระเป๋าเงินนี้?",
    "mywallet.cloud.fail": "เกิดข้อผิดพลาดของเซิร์ฟเวอร์",
    "watch.title": "รายการเฝ้าดู",
    "watch.empty": "ไม่มีกระเป๋าเงินในรายการเฝ้าดู",
    "watch.load.fail": "ไม่สามารถโหลดรายการเฝ้าดูของคุณจากเซิร์ฟเวอร์",
    "watch.max_hint": "(สูงสุด {n})",
    "watch.add.btn": "เพิ่มกระเป๋าเงิน",
    "watch.add.addr_ph": "ที่อยู่กระเป๋าเงิน (G...)",
    "watch.add.err_addr": "กรุณาตรวจสอบที่อยู่",
    "watch.fetch.btn": "🔍 ดึงข้อมูลทั้งหมด",
    "watch.fetch.loading": "กำลังดึงข้อมูล...",
    "watch.internal.title": "🔄 การโอนภายใน",
    "watch.feed.title": "📡 ฟีดทั้งหมด",
    "watch.no.internal": "ไม่มีการโอนภายใน",
    "watch.new.tx": "ตรวจพบธุรกรรมใหม่",
    "watch.report.warn": "กระเป๋าเงินที่ถูกรายงาน",
    "watch.cloud.fail": "เกิดข้อผิดพลาดของเซิร์ฟเวอร์",
    "backup.alias_conflict.title": "ชื่อเล่นขัดแย้งกัน",
    "backup.alias_conflict.desc": "มี {n} ที่อยู่ที่มีชื่อเล่นต่างจากปัจจุบัน จะใช้ชื่อเล่นไหน?",
    "backup.alias_conflict.keep_latest": "ใช้ชื่อเล่นล่าสุด (แนะนำ)",
    "backup.alias_conflict.use_backup": "ใช้ชื่อเล่นตอนสำรองข้อมูล",
    "ctx.trade": "เพิ่มชื่อเล่นกระเป๋า",
    "tab.trade": "ชื่อเล่นกระเป๋า",
    "trade.title": "ชื่อเล่นกระเป๋า",
    "trade.desc": "ที่อยู่ที่ลงทะเบียนจะแสดงเป็นชื่อเล่นในรายการธุรกรรม",
    "trade.empty": "ยังไม่มีการลงทะเบียนชื่อเล่นกระเป๋า",
    "trade.add.title": "เพิ่มชื่อเล่นกระเป๋า",
    "trade.add.err_full": "คุณมีชื่อเล่นกระเป๋าครบ {n} รายการแล้ว กรุณาลบบางส่วนแล้วลองใหม่",
    "cex.estimated": "ตลาดแลกเปลี่ยน (โดยประมาณ)",
    "ctx.watch": "เพิ่มในรายการเฝ้าดู",
    "ctx.watch.slot": "เหลือ {n} ช่อง",
    "ctx.watch.exists": "เพิ่มแล้ว",
    "ctx.watch.full": "รายการเฝ้าดูเต็มแล้ว (สูงสุด 10)",
    "ctx.watch.alias_title": "ป้อนชื่อเล่น",
    "ctx.watch.alias_ph": "ชื่อเล่น (ไม่บังคับ)",
    "ctx.watch.added": "เพิ่มแล้ว",
    "ctx.register.both": "ลงทะเบียนในกระเป๋า Testnet ของ PiDEX Util",
    "ctx.both.alias_title": "ป้อนชื่อเล่น",
    "ctx.both.alias_ph": "ชื่อเล่น (ไม่บังคับ)",
    "ctx.both.sent": "✅ ลงทะเบียนแล้ว",
    "ctx.both.fail": "การลงทะเบียนล้มเหลว",
    "ctx.both.dup": "ลงทะเบียนแล้ว",
    "ctx.both.full": "รายการกระเป๋า testnet เต็มแล้ว ({n}) กรุณาเคลียร์พื้นที่ในแอป PiDEX Util แล้วลองใหม่",
    "ctx.pidex.no_login": "ต้องเข้าสู่ระบบ Pi",
    "ctx.cancel": "ยกเลิก",
    "ctx.continue": "ดำเนินการต่อ",
    "ctx.save": "บันทึก",
    "toast.copied": "คัดลอกแล้ว",
  },
  tr: {
    "tab.report": "Bildir",
    "tab.search": "Cüzdan Ara",
    "tab.mywallet": "Cüzdanım",
    "tab.watch": "İzleme Listesi", "tab.ledger": "Defter",
    "ledger.title": "Cüzdan Defteri (Aylık/Yıllık)", "ledger.loading": "Geçmiş yükleniyor...", "ledger.empty": "İşlem yok.",
    "ledger.in": "Gelen", "ledger.out": "Giden", "ledger.net": "Net", "ledger.year_total": "Yıllık Toplam",
    "ledger.export": "📤 CSV Dışa Aktar", "ledger.refresh": "↻ Yenile",
    "ledger.note": "⚠️ Bu defter, ilk açtığınız andan itibaren cüzdan giriş/çıkış geçmişini toplar. 2027 vergi yılından itibaren, o yılın 1 Ocak'ına kadar otomatik olarak geriye doğru senkronize edilecektir. Gerçek vergi beyanı için edinim maliyeti temeli olarak borsanızın işlem kayıtlarını kullanın — bu defter yalnızca cüzdan giriş/çıkış akışı referansı içindir.",
    "ledger.fail": "Geçmiş yüklenemedi.", "ledger.counterpart_all": "Karşı Taraf (hiçbiri seçilmezse tümü gösterilir)",
    "ledger.mode_combined": "Toplam", "ledger.mode_individual": "Bireysel",
    "ledger.incomplete_warn": "Bu cüzdanda bu yılın 1 Ocak'ına kadar otomatik olarak senkronize edilemeyecek kadar çok işlem var. Lütfen yöneticiyle iletişime geçin (sınır artırılıp sizin için yeniden senkronize edilebilir).",
    "tab.tax": "Vergi Hesaplama",
    "tax.title": "Vergi Hesaplama (FIFO / Hareketli Ortalama)",
    "tax.loading": "İşlem geçmişi yükleniyor...", "tax.syncing": "⏳ Takas geçmişi senkronize ediliyor...",
    "tax.method.fifo": "FIFO (İlk Giren İlk Çıkar)", "tax.method.moving_avg": "Hareketli Ortalama",
    "tax.method.hint": "Kanuna göre, bir borsa (lisanslı sanal varlık sağlayıcısı) üzerinden yapılan işlemlerde hareketli ortalama yöntemi, kişisel cüzdanlarda ve saklama hizmeti sunmayan DEX'lerde FIFO yöntemi uygulanır.",
    "tax.untagged_hint": "Bu, henüz etiketlenmemiş bir karşı taraf cüzdanıdır. Hesaplamaya dahil etmek için etiketleyin.",
    "tax.method.unset": "Etiketlenmedi", "tax.method.fifo_short": "FIFO", "tax.method.avg_short": "Hareketli Ort.",
    "tax.tag_now": "Şimdi etiketle", "tax.tag_dialog.title": "Maliyet Yöntemini Belirle",
    "tax.disposal.date": "Tarih", "tax.disposal.qty": "Miktar", "tax.disposal.proceeds": "Satış Geliri",
    "tax.disposal.cost": "Edinim Maliyeti", "tax.disposal.gain": "Kâr/Zarar",
    "tax.no_price": "⚠️ Fiyatı olmayan {n} kayıt — hesaplamadan hariç tutuldu",
    "tax.manual_price.edit": "Manuel fiyat belirle", "tax.manual_price.auto": "Otomatik fiyat",
    "tax.note": "⚠️ Bu hesaplama yalnızca referans amaçlıdır. Gerçek beyan öncesinde mutlaka bir vergi uzmanına danışın.",
    "tax.report.title": "Vergi Beyanı için Rapor", "tax.report.select_wallets": "Dahil edilecek karşı taraf cüzdanlarını seçin",
    "tax.report.self_swap": "Kendi DEX takası (FIFO)", "tax.report.date_from": "Başlangıç", "tax.report.date_to": "Bitiş",
    "tax.report.generate": "Rapor Oluştur",
    "tax.report.no_selection": "En az bir cüzdan seçin.",
    "tax.report.method_label": "Uygulanan Yöntem", "tax.report.period_label": "Dönem", "tax.report.wallets_label": "Dahil Edilen Karşı Taraf Cüzdanları",
    "tax.report.total_gain": "Toplam Kâr/Zarar", "tax.report.export": "📤 Rapor CSV'sini Dışa Aktar",
    "report.title": "🚨 Dolandırıcılık Bildir",
    'report.realname_warn': "⚠️ Bu bildirim <strong>gerçek isim politikası</strong> kapsamında yürütülür.<br>Yalnızca oturum açmış Pi hesabı sahibi bildirimde bulunabilir,<br>ve yanlış bildirimler yasal sorumluluk doğurabilir.",
    "report.victim_id": "Mağdurun Pi ID'si",
    "report.suspect_wallet": "Şüpheli Cüzdan Adresi",
    "report.amount": "Kaybedilen Miktar (Pi)",
    "report.date": "Olay Tarihi",
    "report.txhash": "İşlem Hash'i (isteğe bağlı)",
    "report.desc": "Açıklama (isteğe bağlı)",
    "report.btn": "Bildirimi Gönder",
    "report.btn.loading": "Gönderiliyor...",
    "report.success": "✅ Bildirim gönderildi.",
    "report.err.required": "Lütfen tüm zorunlu alanları doldurun.",
    "report.err.wallet": "Geçersiz cüzdan adresi formatı (G ile başlar, 56 karakter).",
    "report.err.generic": "Bir hata oluştu. Lütfen tekrar deneyin.",
    "presearch.title": "Bildirmeden Önce Ön Kontrol",
    "presearch.placeholder": "Şüpheli adresi girin...",
    "presearch.warn.not_wallet": "Lütfen G ile başlayan bir adres girin.",
    "presearch.hint.short": "En az 4 karakter girin.",
    "presearch.loading": "Aranıyor...",
    "presearch.none": "Mevcut bildirim bulunamadı.",
    "presearch.found": "{n} mevcut bildirim bulundu.",
    "search.title": "🔍 Cüzdan Ara",
    "search.placeholder": "Adresi girin (G...)",
    "search.btn": "Ara",
    "search.no_tx": "İşlem yok",
    "search.err.fail": "Arama başarısız",
    "search.err.not_found": "Cüzdan bulunamadı.",
    "search.error": "Arama sırasında hata.",
    "list.title": "🗂️ Bildirim Listesi",
    "list.filter": "Cüzdan/mağdur ID ara...",
    "list.count": "bildirim",
    "list.loading": "Yükleniyor...",
    "list.empty": "Henüz bildirim yok.",
    "list.search_btn": "Ara",
    "list.wallet": "Şüpheli Cüzdan:",
    "summary.reports": "Bildirimler",
    "summary.reported_pi": "Toplam Bildirilen",
    "summary.tx_count": "Giden İşlemler",
    "summary.total_sent": "Toplam Gönderilen",
    "tx.to": "→",
    "tx.from": "←",
    "tx.match": "{n} bildirim eşleşmesi",
    "tx.victims": "Mağdurlar",
    "risk.safe": "Güvenli",
    "risk.low": "Dikkat",
    "risk.mid": "Tehlikeli",
    "risk.high": "Yüksek Risk",
    "matched.victim_id": "Mağdur",
    "matched.chain": "Zincir Eşleşmesi",
    "top10.title": "En Çok Bildirilen 10 Cüzdan",
    "top10.cases": "vaka",
    "verify.btn": "Doğrula",
    "verify.done": "Doğrulandı",
    "verify.mine": "Bildirimim",
    "verify.confirmed": " doğruladı",
    "verify.toast": "Doğrulama kaydedildi.",
    "export.toast": "Panoya kopyalandı.",
    "export.copied": "✅ Kopyalandı",
    "export.manual": "Tümünü seçip kopyalayın.",
    "doc.title": "Pi Dolandırıcılık Soruşturma Raporu",
    "doc.generated": "Oluşturuldu",
    "doc.wallet_sec": "Şüpheli Cüzdan",
    "doc.reports_sec": "Bildirim Özeti",
    "doc.count": "Bildirim Sayısı",
    "doc.total_pi": "Toplam Bildirilen",
    "doc.victims_sec": "Mağdur Listesi",
    "doc.victim_id": "Mağdur ID",
    "doc.damage": "Zarar",
    "doc.date": "Tarih",
    "doc.tx_hash": "TX Hash",
    "doc.situation": "Açıklama",
    "doc.outgoing_sec": "Giden İşlemler",
    "doc.no_tx": "Yok",
    "doc.chain_match": "★ Bildirimle Eşleşiyor",
    "doc.amount": "Miktar",
    "doc.cex_sec": "CEX Transfer Özeti",
    "doc.verify_sec": "Veri Doğrulama",
    "doc.verify_body": "Horizon API (mainnet) işlem verilerine dayanmaktadır",
    "doc.submit_sec": "Şuraya Gönder",
    "doc.police": "Yerel Siber Suç Birimi",
    "doc.pi_foundation": "Pi Foundation (support@minepi.com)",
    "doc.cex_note": "Uygulanabilirse borsa müşteri desteği",
    "doc.notes_sec": "Notlar",
    "doc.note1": "Bu belge yalnızca referans amaçlıdır.",
    "doc.note2": "Zincir eşleşmeleri tahminidir, kesin kanıt değildir.",
    "doc.note3": "Yorum, yargı yetkisine göre değişebilir.",
    "mywallet.title": "Cüzdanım (Mainnet)",
    "mywallet.add": "Cüzdan Ekle",
    "mywallet.no_wallets": "Kayıtlı cüzdan yok.",
    "mywallet.loading": "Yükleniyor...",
    "mywallet.fail": "Yükleme başarısız",
    "mywallet.refresh": "Yenile",
    "mywallet.load.fail": "Cüzdan listeniz sunucudan yüklenemedi.",
    "mywallet.not_activated": "Bu cüzdan henüz Pi mainnet'te etkinleştirilmedi. (Hesap yalnızca en az bir kez Pi aldıktan sonra oluşturulur)",
    'mywallet.not_activated.confirm': "Yine de eklensin mi?",
    'mywallet.not_activated.icon_title': "Etkin olmayan cüzdan (hiç Pi almadı)",
    "mywallet.max_hint": "Maks {n}",
    "mywallet.pi.total": "π Toplam Bakiye",
    "mywallet.pi.avail": "Kullanılabilir",
    "mywallet.pi.reserve": "Min Rezerv (tahmini)",
    "mywallet.tokens": "Tokenler",
    "mywallet.txs": "Son İşlemler",
    "mywallet.lp": "LP Pozisyonları",
    'mywallet.lock.title': "Kilitli Bakiye",
    'mywallet.lock.total': "Kilitli Miktar",
    'mywallet.lock.claimable': "Şimdi Talep Edilebilir",
    "backup.title": "Yedekle / Geri Yükle",
    "backup.load_fail": "Slotlar yüklenemedi",
    "backup.empty": "Boş",
    "backup.slot": "Slot {n}",
    "backup.slot_info": "{n} · {date}",
    "backup.btn.full_backup": "Tam Yedekleme",
    "backup.btn.append_backup": "Ekleme Yedekleme",
    "backup.btn.full_restore": "Tam Geri Yükleme",
    "backup.btn.append_restore": "Ekleme Geri Yükleme",
    "backup.saved": "Yedekleme kaydedildi",
    "backup.fail": "Bir hata oluştu",
    "backup.confirm.overwrite": "Slot {n}'deki mevcut veriler silinecek ve geçerli listeyle değiştirilecek. Devam edilsin mi?",
    "backup.confirm.save": "Geçerli listeyi Slot {n}'e yedekleyin.",
    "backup.confirm.truncate": "Yalnızca {n} kaydedilecek ve {dropped} çıkarılacak. Devam edilsin mi?",
    "backup.confirm.restore_full": "Geçerli liste tamamen silinecek ve Slot {n} içeriğiyle değiştirilecek. Devam edilsin mi?",
    "mywallet.no_lp": "LP yok",
    "mywallet.tx_none": "İşlem yok",
    "mywallet.updated": "Güncellendi",
    "mywallet.tx_sent": "Gönderildi",
    "mywallet.tx_recv": "Alındı",
    "mywallet.add.title": "Cüzdan Ekle",
    "mywallet.add.alias_ph": "Takma ad (örn. Ana Cüzdan)",
    "mywallet.add.addr_ph": "Cüzdan Adresi (G...)",
    "mywallet.add.err_addr": "Geçersiz adres (G ile başlar, 56 karakter)",
    "mywallet.add.err_dup": "Bu adres zaten kayıtlı.",
    "mywallet.add.err_full": "Cüzdanım listeniz dolu (30). Birini kaldırıp tekrar deneyin.",
    "mywallet.alias.edit": "Takma Adı Düzenle",
    "mywallet.delete": "Cüzdanı Sil",
    "mywallet.delete.confirm": "Bu cüzdanı silmek istediğinizden emin misiniz?",
    "mywallet.cloud.fail": "Bir sunucu hatası oluştu.",
    "watch.title": "İzleme Listesi",
    "watch.empty": "İzleme listesinde cüzdan yok.",
    "watch.load.fail": "İzleme listeniz sunucudan yüklenemedi.",
    "watch.max_hint": "(maks {n})",
    "watch.add.btn": "Cüzdan Ekle",
    "watch.add.addr_ph": "Cüzdan adresi (G...)",
    "watch.add.err_addr": "Lütfen adresi kontrol edin.",
    "watch.fetch.btn": "🔍 Tümünü Getir",
    "watch.fetch.loading": "Getiriliyor...",
    "watch.internal.title": "🔄 Dahili Transferler",
    "watch.feed.title": "📡 Tam Akış",
    "watch.no.internal": "Dahili transfer yok",
    "watch.new.tx": "Yeni işlem tespit edildi",
    "watch.report.warn": "Bildirilen cüzdan",
    "watch.cloud.fail": "Bir sunucu hatası oluştu.",
    "backup.alias_conflict.title": "Takma Ad Çakışması",
    "backup.alias_conflict.desc": "{n} adresin takma adı mevcuttan farklı. Hangisi kullanılsın?",
    "backup.alias_conflict.keep_latest": "En Son Takma Adı Koru (Önerilen)",
    "backup.alias_conflict.use_backup": "Yedekleme Anındaki Takma Adı Kullan",
    "ctx.trade": "Cüzdan Takma Adı Ekle",
    "tab.trade": "Cüzdan Takma Adları",
    "trade.title": "Cüzdan Takma Adları",
    "trade.desc": "Kayıtlı adresler işlem listesinde takma adlarıyla gösterilecektir.",
    "trade.empty": "Kayıtlı cüzdan takma adı yok.",
    "trade.add.title": "Cüzdan Takma Adı Ekle",
    "trade.add.err_full": "Zaten {n} cüzdan takma adınız var. Bazılarını silip tekrar deneyin.",
    "cex.estimated": "Borsa (tahmini)",
    "ctx.watch": "İzleme Listesine Ekle",
    "ctx.watch.slot": "{n} yer kaldı",
    "ctx.watch.exists": "Zaten eklendi",
    "ctx.watch.full": "İzleme listesi dolu (maks 10)",
    "ctx.watch.alias_title": "Takma Ad Girin",
    "ctx.watch.alias_ph": "Takma ad (isteğe bağlı)",
    "ctx.watch.added": "Eklendi",
    "ctx.register.both": "PiDEX Util Testnet Cüzdanına Kaydet",
    "ctx.both.alias_title": "Takma Ad Girin",
    "ctx.both.alias_ph": "Takma ad (isteğe bağlı)",
    "ctx.both.sent": "✅ Kaydedildi",
    "ctx.both.fail": "Kayıt başarısız",
    "ctx.both.dup": "Zaten kayıtlı",
    "ctx.both.full": "Testnet cüzdan listesi dolu ({n}). PiDEX Util uygulamasında bir yer boşaltıp tekrar deneyin.",
    "ctx.pidex.no_login": "Pi girişi gerekli.",
    "ctx.cancel": "İptal",
    "ctx.continue": "Devam Et",
    "ctx.save": "Kaydet",
    "toast.copied": "Kopyalandı",
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
  let addressAliases = {};
  function aliasFor(addr) { return addr ? addressAliases[addr] : undefined; }
  migrateAddressAliasesIfNeeded().catch(() => {});

  // ── localStorage helpers (UI 상태만 — 실제 목록은 서버가 원본) ──
  const HACK_ACTIVE_KEY  = 'hack_active_wallet';
  const WATCH_LATEST_KEY = 'hack_watch_latest_tx';
  const WATCH_MAX        = 10;
  const HACK_WALLET_MAX  = 30;
  const TRADE_MAX        = 100;

  function getHackActiveId()     { return localStorage.getItem(HACK_ACTIVE_KEY); }
  function setHackActiveId(id)   { localStorage.setItem(HACK_ACTIVE_KEY, id); }
  function genHackWalletId()     { return `h${Date.now()}${Math.random().toString(36).slice(2,5)}`; }
  function getWatchLatest()         { try { return JSON.parse(localStorage.getItem(WATCH_LATEST_KEY) || '{}'); } catch { return {}; } }
  function saveWatchLatest(latest)  { localStorage.setItem(WATCH_LATEST_KEY, JSON.stringify(latest)); }
  function genWatchId()             { return `w${Date.now()}`; }
  function genTradeId()             { return `t${Date.now()}${Math.random().toString(36).slice(2,5)}`; }

  // ── 탭 전환 ──────────────────────────────────────────
  function switchTab(tabName) {
    lastTrackerTab = tabName;
    container.querySelectorAll('.trk-tab').forEach(t => t.classList.remove('active'));
    container.querySelectorAll('.trk-tab-content').forEach(s => s.classList.remove('active'));
    container.querySelector(`.trk-tab[data-tab="${tabName}"]`)?.classList.add('active');
    container.querySelector(`#trk-tab-${tabName}`)?.classList.add('active');
    if (tabName === 'list')     loadReportList();
    if (tabName === 'watch')    renderWatchTab();
    if (tabName === 'mywallet') renderMyWalletTab();
    if (tabName === 'ledger')   renderLedgerTab();
    if (tabName === 'trade')    renderTradeTab();
    if (tabName === 'tax')      renderTaxTab();
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
      <div class="trk-tabs-wrap">
        <div class="trk-tabs">
          <button class="trk-tab active" data-tab="list">${tt('tab.report')}</button>
          <button class="trk-tab" data-tab="search">${tt('tab.search')}</button>
          <button class="trk-tab" data-tab="mywallet">${tt('tab.mywallet')}</button>
          <button class="trk-tab" data-tab="watch">${tt('tab.watch')}</button>
          <button class="trk-tab" data-tab="ledger">${tt('tab.ledger')}</button>
          <button class="trk-tab" data-tab="trade">${tt('tab.trade')}</button>
          <button class="trk-tab" data-tab="tax">${tt('tab.tax')}</button>
        </div>
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
            ${tt('report.realname_warn')}
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

      <!-- 장부 탭 -->
      <div class="trk-tab-content" id="trk-tab-ledger">
        <div class="trk-section">
          <div id="trk-ledger-content"></div>
        </div>
      </div>

      <!-- 지갑별칭 탭 -->
      <div class="trk-tab-content" id="trk-tab-trade">
        <div class="trk-section">
          <div id="trk-trade-content"></div>
        </div>
      </div>

      <!-- 세금계산 탭 -->
      <div class="trk-tab-content" id="trk-tab-tax">
        <div class="trk-section">
          <div id="trk-tax-content"></div>
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
      <button id="trk-amenu-trade"></button>
      <button id="trk-amenu-tag" class="hidden"></button>
      <button id="trk-amenu-copy"></button>
    </div>
  `;

  // ── 탭 이벤트 ────────────────────────────────────────
  container.querySelectorAll('.trk-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 언어 변경 등으로 재렌더링된 경우, 보고 있던 탭을 그대로 유지
  if (lastTrackerTab !== 'list') switchTab(lastTrackerTab);

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
          <span class="trk-top10-addr trk-copy-addr" data-copy-addr="${esc(s.addr)}">${esc(s.addr.slice(0,4))}···${esc(s.addr.slice(-3))}</span>
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

  // ── 세금계산 탭용 — payment 뿐 아니라 path_payment(스왑)도 포함해서 가져옴 ──
  // fetchPayments는 기존 "장부" 탭이 쓰므로 건드리지 않고 별도 함수로 분리
  const SWAP_OP_TYPES = ['path_payment_strict_send', 'path_payment_strict_receive'];

  async function fetchPaymentsWide(wallet, cursor = null) {
    let url = `${HORIZON}/accounts/${wallet}/payments?order=desc&limit=50&include_failed=false`;
    if (cursor) url += '&cursor=' + cursor;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) throw new Error(tt('search.err.not_found'));
      throw new Error(`API error (${res.status})`);
    }
    const data = await res.json();
    const records = (data._embedded?.records || [])
      .filter(r => r.type === 'payment' || SWAP_OP_TYPES.includes(r.type));
    const next = data._links?.next?.href?.match(/cursor=([^&]+)/)?.[1] || null;
    return { payments: records, next };
  }

  // Horizon /trades — DEX/AMM 체결 기록. 스왑의 정확한 체결 시점 단가를 온체인에서 직접 얻기 위해 사용
  // (지금은 별도 엔트리로 저장하지 않고, 가격 조회(fetchNearestOkxPrice류)에서 온디맨드로만 참조 — v1 범위)
  async function fetchTrades(wallet, cursor = null) {
    let url = `${HORIZON}/accounts/${wallet}/trades?order=desc&limit=50`;
    if (cursor) url += '&cursor=' + cursor;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) throw new Error(tt('search.err.not_found'));
      throw new Error(`API error (${res.status})`);
    }
    const data = await res.json();
    const records = data._embedded?.records || [];
    const next = data._links?.next?.href?.match(/cursor=([^&]+)/)?.[1] || null;
    return { trades: records, next };
  }

  // ── 지갑 장부 (월별/연별) — 내 지갑 탭 접근 시 신규분만 DB에 누적 기록 ──
  const LEDGER_COL         = 'wallet_ledger';
  const LEDGER_MAX_PAGE    = 200; // 1페이지 50건 * 200 = 최대 10,000건 — 과세 연도엔 사실상 거의 모든 지갑이 1월 1일까지 한 번에 커버됨
  const LEDGER_TAX_YEAR    = 2027; // 이 해부터 "1월 1일까지 소급 채움"이 활성화됨

  function isLedgerTaxYear() {
    return new Date().getFullYear() >= LEDGER_TAX_YEAR;
  }

  function ledgerYearCutoff() {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1); // (과세 연도부터) 올해 1월 1일 — 그 이전 내역은 세무 목적상 불필요
  }

  async function syncWalletLedger(address) {
    const db2 = getDb();
    if (!db2) return;
    const cursorRef = db2.collection(LEDGER_COL).doc(address);
    let cursorDoc;
    try { cursorDoc = await cursorRef.get(); } catch { return; }
    const lastToken = cursorDoc.exists ? cursorDoc.data().lastPagingToken : null;

    // 과세 연도(2027) 전엔 소급 수집 자체를 안 함 — 딱 최근 1페이지만 보고 "지금부터"로 기준점만 잡음.
    // 과세 연도부터는 언제 처음 열든(1월이든 5월이든) 그 해 1월 1일까지 확실히 소급해서 채움.
    const taxYear = isLedgerTaxYear();
    const maxPages = taxYear ? LEDGER_MAX_PAGE : 1;
    const cutoff   = taxYear ? ledgerYearCutoff() : null;

    const newRecords = [];
    let cursor        = null;
    let stop          = false;   // 이전 지점을 찾았거나, (과세 연도라면) 연초 이전에 도달
    let ranOutOfPages = false;   // 지갑 자체에 더 이상 내역이 없음
    for (let page = 0; page < maxPages && !stop; page++) {
      let payments, next;
      try { ({ payments, next } = await fetchPayments(address, cursor)); } catch { break; }
      if (!payments.length) { ranOutOfPages = true; break; }
      for (const p of payments) {
        if (lastToken && p.paging_token === lastToken) { stop = true; break; }
        if (cutoff && new Date(p.created_at) < cutoff) { stop = true; break; } // 연초 이전 — 여기서부턴 필요 없음
        newRecords.push(p);
      }
      if (stop) break;
      if (!next) { ranOutOfPages = true; break; }
      cursor = next;
    }
    // 과세 연도에 상한(10,000건)까지 다 봤는데도 이전 지점/연초에 못 닿았다면 — 거래량이 극히 많은 지갑.
    // 자동으로는 못 채우니 관리자 문의 안내를 위해 표시해둠 (관리자가 직접 상한을 올려 재동기화 가능).
    // 과세 연도 전(지금)엔 애초에 1페이지만 보는 게 정상 동작이라 이 플래그 대상이 아님.
    const incomplete = taxYear && !stop && !ranOutOfPages;
    if (newRecords.length === 0) {
      if (incomplete) await cursorRef.set({ syncIncomplete: true }, { merge: true });
      return;
    }

    const entriesCol = cursorRef.collection('entries');
    for (let i = 0; i < newRecords.length; i += 450) {
      const batch = db2.batch();
      newRecords.slice(i, i + 450).forEach(p => {
        batch.set(entriesCol.doc(p.id), {
          created_at:   p.created_at,
          from:         p.from ?? null,
          to:           p.to ?? null,
          amount:       p.amount ?? null,
          asset:        p.asset_type === 'native' ? 'π' : (p.asset_code ?? p.asset_type ?? '?'),
          paging_token: p.paging_token,
        });
      });
      await batch.commit();
    }
    await cursorRef.set({
      lastPagingToken: newRecords[0].paging_token, // desc 순서라 첫 항목이 가장 최신
      lastSyncedAt:    firebase.firestore.FieldValue.serverTimestamp(),
      syncIncomplete:  incomplete,
    }, { merge: true });
  }

  async function fetchLedgerEntries(address) {
    const db2 = getDb();
    if (!db2) return [];
    const snap = await db2.collection(LEDGER_COL).doc(address).collection('entries').get();
    return snap.docs.map(d => d.data());
  }

  // 세금계산 탭용 — 문서 id 포함(수동 단가 편집/가격 캐싱에 필요)
  async function fetchTaxLedgerEntries(address) {
    const db2 = getDb();
    if (!db2) return [];
    const snap = await db2.collection(LEDGER_COL).doc(address).collection('entries').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function fetchLedgerSyncIncomplete(address) {
    const db2 = getDb();
    if (!db2) return false;
    try {
      const doc = await db2.collection(LEDGER_COL).doc(address).get();
      return doc.exists && doc.data().syncIncomplete === true;
    } catch { return false; }
  }

  // ── 세금계산용 확장 동기화 — payment + path_payment(스왑)까지 포함, 별도 커서로 관리 ──
  // "세금계산" 탭을 열 때만 호출됨(장부 탭 진입만으로는 안 돎 — 안 쓰는 유저에게 불필요한 Horizon 호출 방지)
  function normalizeWideRecord(p) {
    const isSwap = SWAP_OP_TYPES.includes(p.type);
    const base = {
      created_at:   p.created_at,
      from:         p.from ?? null,
      to:           p.to ?? null,
      paging_token: p.paging_token,
      op_type:      p.type,
    };
    if (!isSwap) {
      return {
        ...base,
        amount: p.amount ?? null,
        asset:  p.asset_type === 'native' ? 'π' : (p.asset_code ?? p.asset_type ?? '?'),
      };
    }
    return {
      ...base,
      send_asset:  p.source_asset_type === 'native' ? 'π' : (p.source_asset_code ?? p.source_asset_type ?? '?'),
      send_amount: p.source_amount ?? null,
      dest_asset:  p.asset_type === 'native' ? 'π' : (p.asset_code ?? p.asset_type ?? '?'),
      dest_amount: p.amount ?? null,
    };
  }

  async function syncTaxLedger(address) {
    const db2 = getDb();
    if (!db2) return;
    const cursorRef = db2.collection(LEDGER_COL).doc(address);
    let cursorDoc;
    try { cursorDoc = await cursorRef.get(); } catch { return; }
    const taxSync = cursorDoc.exists ? (cursorDoc.data().taxSync || {}) : {};
    const lastToken = taxSync.lastPagingTokenWide || null;

    const taxYear = isLedgerTaxYear();
    const maxPages = taxYear ? LEDGER_MAX_PAGE : 1;
    const cutoff   = taxYear ? ledgerYearCutoff() : null;

    const newRecords = [];
    let cursor        = null;
    let stop          = false;
    let ranOutOfPages = false;
    for (let page = 0; page < maxPages && !stop; page++) {
      let payments, next;
      try { ({ payments, next } = await fetchPaymentsWide(address, cursor)); } catch { break; }
      if (!payments.length) { ranOutOfPages = true; break; }
      for (const p of payments) {
        if (lastToken && p.paging_token === lastToken) { stop = true; break; }
        if (cutoff && new Date(p.created_at) < cutoff) { stop = true; break; }
        newRecords.push(p);
      }
      if (stop) break;
      if (!next) { ranOutOfPages = true; break; }
      cursor = next;
    }
    const incomplete = taxYear && !stop && !ranOutOfPages;

    if (newRecords.length > 0) {
      const entriesCol = cursorRef.collection('entries');
      for (let i = 0; i < newRecords.length; i += 450) {
        const batch = db2.batch();
        newRecords.slice(i, i + 450).forEach(p => {
          // {merge:true} — fetchPayments가 이미 써둔 같은 id의 단순 payment 문서엔 op_type만 얹어지고,
          // manual_price 등 사용자가 직접 입력한 필드는 이 쓰기 페이로드에 없으므로 절대 덮어써지지 않음
          batch.set(entriesCol.doc(p.id), normalizeWideRecord(p), { merge: true });
        });
        await batch.commit();
      }
    }

    await cursorRef.set({
      taxSync: {
        lastPagingTokenWide: newRecords.length ? newRecords[0].paging_token : lastToken,
        lastSyncedAt:         firebase.firestore.FieldValue.serverTimestamp(),
        syncIncomplete:       incomplete,
      },
    }, { merge: true });
  }

  async function fetchTaxSyncIncomplete(address) {
    const db2 = getDb();
    if (!db2) return false;
    try {
      const doc = await db2.collection(LEDGER_COL).doc(address).get();
      return doc.exists && doc.data().taxSync?.syncIncomplete === true;
    } catch { return false; }
  }

  // 수동 단가 — 이 필드는 syncTaxLedger의 배치 쓰기 페이로드에 절대 포함되지 않으므로 자동 동기화가 덮어쓸 수 없음
  // 수동 단가는 지갑 주소 기준 공유 문서(wallet_ledger)가 아니라 로그인한 아이디별로 완전히 분리 저장한다.
  // wallet_ledger/{address}는 누구나 그 주소를 "내 지갑"에 등록하면 접근할 수 있는 전역 캐시라서,
  // 거기 직접 쓰면 제3자가 남의 지갑에 임의 단가를 심어 진짜 소유자의 세금계산 결과를 오염시킬 수 있었음.
  const MANUAL_PRICE_COL = 'manual_prices';
  function manualPriceDocId(address, entryId) { return `${address}_${entryId}`; }

  async function fetchManualPrices(userId, address) {
    const db2 = getDb();
    if (!db2 || !userId) return {};
    try {
      const snap = await db2.collection(MANUAL_PRICE_COL).doc(userId).collection('entries')
        .where('address', '==', address).get();
      const map = {};
      snap.docs.forEach(d => { map[d.data().entryId] = d.data().price; });
      return map;
    } catch { return {}; }
  }

  async function setManualPrice(address, entryId, price) {
    const db2 = getDb();
    if (!db2 || !piUser) return;
    await db2.collection(MANUAL_PRICE_COL).doc(piUser).collection('entries')
      .doc(manualPriceDocId(address, entryId)).set({
        address, entryId, price,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
  }

  // ── 자산 일봉 종가 (OKX 공개 시세, 인증 불필요) — 세무 참고용 원화/달러 환산에 사용 ──
  const PRICE_COL        = 'asset_daily_prices';
  const ASSET_OKX_SYMBOL = { 'π': 'PI-USDT', 'GRAM': 'GRAM-USDT' }; // 매핑 없는 자산은 가격 조회 생략

  function dateKeyUTC(isoOrMs) {
    return new Date(isoOrMs).toISOString().slice(0, 10);
  }

  async function fetchOkxDailyCandles(instId, after) {
    let url = `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=1Dutc&limit=100`;
    if (after) url += `&after=${after}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OKX API error (${res.status})`);
    const json = await res.json();
    if (json.code !== '0') throw new Error(json.msg || 'OKX API error');
    return json.data; // [[ts, open, high, low, close, ...], ...] 최신순
  }

  async function syncAssetDailyPrices(asset) {
    const symbol = ASSET_OKX_SYMBOL[asset];
    if (!symbol) return; // 매핑 안 된 자산은 스킵
    const db2 = getDb();
    if (!db2) return;
    const priceRef = db2.collection(PRICE_COL).doc(asset);
    let doc;
    try { doc = await priceRef.get(); } catch { return; }
    const lastDate = doc.exists ? doc.data().lastDate : null;

    // 최신부터 역순으로 페이지 넘기며, 이전에 저장해둔 날짜에 도달하면 멈춤 (지갑 동기화와 동일한 패턴)
    const newCloses = {};
    let after = null;
    let stop  = false;
    for (let page = 0; page < 20 && !stop; page++) {
      let candles;
      try { candles = await fetchOkxDailyCandles(symbol, after); } catch { break; }
      if (!candles.length) break;
      for (const c of candles) {
        const dateKey = dateKeyUTC(parseInt(c[0], 10));
        if (lastDate && dateKey <= lastDate) { stop = true; break; }
        newCloses[dateKey] = parseFloat(c[4]);
      }
      if (stop) break;
      after = candles[candles.length - 1][0]; // 가장 오래된 캔들 ts로 다음(더 과거) 페이지 요청
    }
    if (Object.keys(newCloses).length === 0) return;
    const newest = Object.keys(newCloses).sort().pop();
    await priceRef.set({
      closes:   newCloses,
      lastDate: (!lastDate || newest > lastDate) ? newest : lastDate,
    }, { merge: true });
  }

  async function fetchAssetDailyCloses(asset) {
    const db2 = getDb();
    if (!db2 || !ASSET_OKX_SYMBOL[asset]) return {};
    try {
      const doc = await db2.collection(PRICE_COL).doc(asset).get();
      return doc.exists ? (doc.data().closes || {}) : {};
    } catch { return {}; }
  }

  // ── 세금계산용 — 거래 시점에 가장 가까운 가격 (분봉 → 시봉 → 일봉 순으로 폴백) ──
  // 단순 이체(스왑 아님) 엔트리의 auto_price 채우는 데 씀. 스왑 엔트리는 온체인 자체 비율이 더 정확해 우선 사용(§ 정규화 로직에서 처리).
  async function fetchOkxCandleNear(instId, bar, timestampMs) {
    const url = `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&after=${timestampMs}&limit=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OKX API error (${res.status})`);
    const json = await res.json();
    if (json.code !== '0') throw new Error(json.msg || 'OKX API error');
    const candles = json.data;
    if (!candles || !candles.length) return null;
    let best = candles[0];
    let bestDiff = Math.abs(parseInt(best[0], 10) - timestampMs);
    for (const c of candles) {
      const diff = Math.abs(parseInt(c[0], 10) - timestampMs);
      if (diff < bestDiff) { best = c; bestDiff = diff; }
    }
    return best; // [ts, open, high, low, close, ...]
  }

  // 세션 중에만 유효한 인메모리 캐시 — 같은 엔트리의 가격을 세금계산 탭에서 반복 조회하지 않도록
  const _nearestPriceCache = new Map();

  async function fetchNearestOkxPrice(asset, timestampMs) {
    const symbol = ASSET_OKX_SYMBOL[asset];
    if (!symbol) return null;
    const cacheKey = `${asset}|${timestampMs}`;
    if (_nearestPriceCache.has(cacheKey)) return _nearestPriceCache.get(cacheKey);

    for (const bar of ['1m', '1H']) {
      try {
        const candle = await fetchOkxCandleNear(symbol, bar, timestampMs);
        if (candle) {
          const result = { price: parseFloat(candle[4]), src: bar };
          _nearestPriceCache.set(cacheKey, result);
          return result;
        }
      } catch { /* 다음 단계로 폴백 */ }
    }
    // 분봉/시봉을 못 구하면 기존 일봉 종가로 폴백 — 나중에 auto_price_src==='daily'인 엔트리만 골라
    // 유료 API 등으로 일괄 재조회해 분봉으로 업그레이드할 수 있도록 출처를 남겨둠
    try {
      const closes = await fetchAssetDailyCloses(asset);
      const dayClose = closes[dateKeyUTC(timestampMs)];
      if (dayClose != null) {
        const result = { price: dayClose, src: 'daily' };
        _nearestPriceCache.set(cacheKey, result);
        return result;
      }
    } catch { /* no-op */ }
    _nearestPriceCache.set(cacheKey, null);
    return null;
  }

  function buildLedgerRows(entries, address, priceMaps = {}) {
    const map = {};
    entries.forEach(e => {
      if (!e.created_at || e.amount == null) return;
      const d = new Date(e.created_at);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}|${e.asset}`;
      if (!map[key]) map[key] = { year: y, month: m, asset: e.asset, in: 0, out: 0, valueIn: 0, valueOut: 0, hasValue: false, byCounterpart: {} };
      const amt   = parseFloat(e.amount);
      const close = (priceMaps[e.asset] || {})[dateKeyUTC(e.created_at)];
      const cp    = counterpartOf(e, address);
      if (!map[key].byCounterpart[cp]) map[key].byCounterpart[cp] = { in: 0, out: 0 };
      if (close != null) map[key].hasValue = true;
      if (e.to === address) {
        map[key].in += amt;
        map[key].byCounterpart[cp].in += amt;
        if (close != null) map[key].valueIn += amt * close;
      } else if (e.from === address) {
        map[key].out += amt;
        map[key].byCounterpart[cp].out += amt;
        if (close != null) map[key].valueOut += amt * close;
      }
    });
    return Object.values(map).sort((a, b) => b.year - a.year || b.month - a.month || a.asset.localeCompare(b.asset));
  }

  function ledgerRowsToCsv(rows, address) {
    const header = 'wallet,year,month,asset,in,out,net,value_in_usdt,value_out_usdt,value_net_usdt\n';
    const lines = rows.map(r => `${address},${r.year},${r.month},${r.asset},${r.in},${r.out},${r.in - r.out},${r.valueIn.toFixed(2)},${r.valueOut.toFixed(2)},${(r.valueIn - r.valueOut).toFixed(2)}`);
    return header + lines.join('\n');
  }

  function downloadCsv(filename, text) {
    const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function counterpartOf(entry, address) {
    return entry.to === address ? entry.from : entry.to;
  }

  function counterpartLabel(addr) {
    return aliasFor(addr) || `${addr.slice(0,5)}···${addr.slice(-4)}`;
  }

  function listCounterparts(entries, address) {
    const seen = new Map();
    entries.forEach(e => {
      const addr = counterpartOf(e, address);
      if (addr && !seen.has(addr)) seen.set(addr, counterpartLabel(addr));
    });
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }

  function renderLedgerRowsHtml(rows, showContrib = false) {
    if (rows.length === 0) {
      return `<div class="trk-card" style="text-align:center;padding:24px 16px;"><p style="color:#888;">${tt('ledger.empty')}</p></div>`;
    }
    let html = '';
    let curYear = null, yearIn = 0, yearOut = 0;
    const flushYear = () => {
      if (curYear == null) return;
      html += `<div style="display:flex;justify-content:space-between;padding:8px 12px;font-weight:700;background:rgba(255,255,255,0.05);border-radius:6px;margin:4px 0 10px;">
        <span>${curYear} ${tt('ledger.year_total')}</span>
        <span><span style="color:#22c55e;">+${yearIn.toFixed(2)}</span> / <span style="color:#f87171;">-${yearOut.toFixed(2)}</span></span>
      </div>`;
    };
    rows.forEach(r => {
      if (r.year !== curYear) { flushYear(); curYear = r.year; yearIn = 0; yearOut = 0; html += `<div class="trk-section-label" style="margin-top:14px;">${r.year}</div>`; }
      yearIn += r.in; yearOut += r.out;
      const net = r.in - r.out;
      const netColor = net > 0 ? '#22c55e' : net < 0 ? '#f87171' : '#888';
      const netValue = r.valueIn - r.valueOut;
      const valueLine = r.hasValue
        ? `<div style="font-size:11px;color:#888;text-align:right;margin-top:2px;">≈ $${r.valueIn.toFixed(2)} / $${r.valueOut.toFixed(2)} (${tt('ledger.net')} $${netValue.toFixed(2)})</div>`
        : '';
      const cpAddrs = Object.keys(r.byCounterpart);
      const contribLine = (showContrib && cpAddrs.length > 1)
        ? `<div style="font-size:11px;color:#666;margin-top:3px;">${cpAddrs.map(addr => {
            const c = r.byCounterpart[addr];
            const inPct  = r.in  > 0 ? Math.round(c.in  / r.in  * 100) : 0;
            const outPct = r.out > 0 ? Math.round(c.out / r.out * 100) : 0;
            return `${esc(counterpartLabel(addr))} (${tt('ledger.in')} ${inPct}% / ${tt('ledger.out')} ${outPct}%)`;
          }).join(' · ')}</div>`
        : '';
      html += `
        <div style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#ccc;">${r.year}-${String(r.month).padStart(2,'0')} · ${esc(r.asset)}</span>
            <span>
              <span style="color:#22c55e;">+${r.in.toFixed(2)}</span>
              <span style="color:#f87171;margin-left:6px;">-${r.out.toFixed(2)}</span>
              <span style="color:${netColor};margin-left:6px;font-weight:600;">= ${net.toFixed(2)}</span>
            </span>
          </div>
          ${valueLine}
          ${contribLine}
        </div>`;
    });
    flushYear();
    return html;
  }

  async function renderLedgerTab() {
    const container2 = container.querySelector('#trk-ledger-content');
    container2.innerHTML = `<p style="color:#888;padding:12px 0;">⏳ ${tt('ledger.loading')}</p>`;

    if (!piUser) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;">${tt('ctx.pidex.no_login')}</p>
        </div>`;
      return;
    }

    const wallets = await fetchHackWalletsServer();
    if (!wallets || !wallets.length) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:28px 16px;">
          <p style="color:#888;">${tt('mywallet.no_wallets')}</p>
        </div>`;
      return;
    }

    const active = wallets.find(w => w.id === getHackActiveId()) ?? wallets[0];

    container2.innerHTML = `
      <div class="trk-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;font-size:16px;">${tt('ledger.title')}</h3>
          <div style="display:flex;gap:4px;">
            <button class="trk-btn-outline trk-btn-sm" id="trk-ldg-export" style="width:auto;padding:0 12px;">${tt('ledger.export')}</button>
            <button class="trk-btn-outline trk-btn-sm" id="trk-ldg-refresh" style="width:auto;padding:0 12px;">${tt('ledger.refresh')}</button>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          ${wallets.map(w => `
            <button class="trk-watch-chip${w.id === active.id ? ' active' : ''}" data-ldg-wid="${w.id}">${esc(aliasFor(w.address) || w.alias)}</button>`).join('')}
        </div>
        <div style="font-size:11px;color:#888;margin-top:8px;">${tt('ledger.counterpart_all')}</div>
        <div id="trk-ldg-cp-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;"></div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="trk-btn-outline trk-btn-sm active" id="trk-ldg-mode-combined" style="width:auto;padding:0 12px;">${tt('ledger.mode_combined')}</button>
          <button class="trk-btn-outline trk-btn-sm" id="trk-ldg-mode-individual" style="width:auto;padding:0 12px;">${tt('ledger.mode_individual')}</button>
        </div>
        <p style="font-size:11px;color:#888;margin:8px 0 0;">${tt('ledger.note')}</p>
      </div>
      <div id="trk-ldg-detail"></div>`;

    container2.querySelectorAll('[data-ldg-wid]').forEach(btn => {
      btn.addEventListener('click', () => { setHackActiveId(btn.dataset.ldgWid); renderLedgerTab(); });
    });
    container2.querySelector('#trk-ldg-refresh').addEventListener('click', async () => {
      await syncWalletLedger(active.address).catch(() => {});
      renderLedgerTab();
    });

    const detailEl  = container2.querySelector('#trk-ldg-detail');
    const cpChipsEl  = container2.querySelector('#trk-ldg-cp-chips');
    const modeCombinedBtn   = container2.querySelector('#trk-ldg-mode-combined');
    const modeIndividualBtn = container2.querySelector('#trk-ldg-mode-individual');
    try {
      await syncWalletLedger(active.address);
      const entries = await fetchLedgerEntries(active.address);

      if (await fetchLedgerSyncIncomplete(active.address)) {
        container2.querySelector('.trk-card').insertAdjacentHTML('beforeend',
          `<p style="font-size:12px;color:#f0b429;margin:8px 0 0;">⚠️ ${tt('ledger.incomplete_warn')}</p>`);
      }

      listCounterparts(entries, active.address).forEach(([addr, label]) => {
        const chip = document.createElement('button');
        chip.className = 'trk-watch-chip';
        chip.dataset.cpAddr = addr;
        chip.textContent = label;
        cpChipsEl.appendChild(chip);
      });

      // 이 지갑 내역에 등장한 자산들의 일봉 종가를 동기화 (매핑 없는 자산은 syncAssetDailyPrices 내부에서 스킵)
      const assetsSeen = [...new Set(entries.map(e => e.asset))];
      await Promise.all(assetsSeen.map(a => syncAssetDailyPrices(a).catch(() => {})));
      const priceMaps = {};
      await Promise.all(assetsSeen.map(async a => { priceMaps[a] = await fetchAssetDailyCloses(a); }));

      const selectedCps = () => [...cpChipsEl.querySelectorAll('.active')].map(el => el.dataset.cpAddr);

      const renderFiltered = () => {
        const selected   = selectedCps();
        const individual = modeIndividualBtn.classList.contains('active');
        const targets    = selected.length ? selected : listCounterparts(entries, active.address).map(([addr]) => addr);

        if (individual) {
          const allRows = [];
          let html = '';
          targets.forEach(addr => {
            const filtered = entries.filter(e => counterpartOf(e, active.address) === addr);
            const rows = buildLedgerRows(filtered, active.address, priceMaps);
            allRows.push(...rows);
            html += `<div class="trk-section-label" style="margin-top:16px;">${esc(counterpartLabel(addr))}</div>${renderLedgerRowsHtml(rows, false)}`;
          });
          detailEl.innerHTML = html || renderLedgerRowsHtml([], false);
          return allRows;
        } else {
          const filtered = selected.length ? entries.filter(e => selected.includes(counterpartOf(e, active.address))) : entries;
          const rows = buildLedgerRows(filtered, active.address, priceMaps);
          detailEl.innerHTML = renderLedgerRowsHtml(rows, selected.length > 1);
          return rows;
        }
      };

      let currentRows = renderFiltered();
      cpChipsEl.querySelectorAll('[data-cp-addr]').forEach(chip => {
        chip.addEventListener('click', () => { chip.classList.toggle('active'); currentRows = renderFiltered(); });
      });
      modeCombinedBtn.addEventListener('click', () => {
        modeCombinedBtn.classList.add('active'); modeIndividualBtn.classList.remove('active');
        currentRows = renderFiltered();
      });
      modeIndividualBtn.addEventListener('click', () => {
        modeIndividualBtn.classList.add('active'); modeCombinedBtn.classList.remove('active');
        currentRows = renderFiltered();
      });

      container2.querySelector('#trk-ldg-export').addEventListener('click', () => {
        const selected = selectedCps();
        const suffix   = selected.length ? `_${selected.map(counterpartLabel).join('-')}` : '';
        downloadCsv(`ledger_${(aliasFor(active.address) || active.alias)}${suffix}_${new Date().toISOString().slice(0,10)}.csv`, ledgerRowsToCsv(currentRows, active.address));
      });
    } catch (e) {
      detailEl.innerHTML = `<div class="trk-card"><p style="color:#f87171;font-size:13px;">${tt('ledger.fail')}: ${e.message}</p></div>`;
    }
  }

  // ── 세금계산 탭 (FIFO / 이동평균법) ──────────────────────
  // 스왑 엔트리(op_type이 path_payment_*)의 두 다리 중 OKX 매핑된 쪽 시세를 기준으로,
  // 다른 쪽(취득 자산)의 단가는 "그 순간 내가 지불한 가치 = 지금 받은 것의 취득원가"로 역산한다.
  // 이렇게 하면 Pi DEX 안에서만 도는(OKX 미상장) 토큰도 상대편이 π/GRAM이기만 하면 가격을 구할 수 있다.
  async function resolveSwapUnitPrices(e) {
    if (e.manual_price != null) return { sendPrice: null, destPrice: e.manual_price };
    const ts = new Date(e.created_at).getTime();
    if (ASSET_OKX_SYMBOL[e.send_asset]) {
      const r = await fetchNearestOkxPrice(e.send_asset, ts);
      if (r) {
        const sendPrice = r.price;
        const destPrice = (parseFloat(e.send_amount) * sendPrice) / parseFloat(e.dest_amount);
        return { sendPrice, destPrice };
      }
    }
    if (ASSET_OKX_SYMBOL[e.dest_asset]) {
      const r = await fetchNearestOkxPrice(e.dest_asset, ts);
      if (r) {
        const destPrice = r.price;
        const sendPrice = (parseFloat(e.dest_amount) * destPrice) / parseFloat(e.send_amount);
        return { sendPrice, destPrice };
      }
    }
    return { sendPrice: null, destPrice: null };
  }

  function taxRowsToCsv(method, result, asset, address) {
    const header = 'wallet,method,asset,date,qty,proceeds,cost_basis,gain\n';
    const lines = result.disposals.map(d =>
      `${address},${method},${asset},${new Date(d.ts).toISOString()},${d.qty},${d.proceeds.toFixed(6)},${d.costBasis.toFixed(6)},${d.gain.toFixed(6)}`);
    return header + lines.join('\n');
  }

  function showManualPriceDialog(address, entry, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:280px;">
        <div class="modal-header"><span>${tt('tax.manual_price.edit')}</span></div>
        <div style="padding:16px;">
          <input type="number" step="any" id="trk-mp-input" class="form-input" value="${entry.manual_price ?? entry.auto_price ?? ''}" />
          <p id="trk-mp-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-mp-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-mp-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-mp-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-mp-input').select();
    overlay.querySelector('#trk-mp-save').onclick = async () => {
      const val    = parseFloat(overlay.querySelector('#trk-mp-input').value);
      const errEl  = overlay.querySelector('#trk-mp-err');
      const saveBtn = overlay.querySelector('#trk-mp-save');
      if (!isFinite(val)) { errEl.textContent = tt('tax.manual_price.edit'); return; }
      saveBtn.disabled = true;
      try {
        await setManualPrice(address, entry.id, val);
        entry.manual_price = val; // 같은 참조를 relevant/entries가 공유하므로 리렌더 없이도 즉시 반영됨
        overlay.remove();
        onSaved();
      } catch {
        errEl.textContent = tt('ledger.fail');
        saveBtn.disabled = false;
      }
    };
  }

  async function renderTaxTab() {
    const container2 = container.querySelector('#trk-tax-content');
    container2.innerHTML = `<p style="color:#888;padding:12px 0;">⏳ ${tt('tax.loading')}</p>`;

    if (!piUser) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;">${tt('ctx.pidex.no_login')}</p>
        </div>`;
      return;
    }

    const wallets = await fetchHackWalletsServer();
    if (!wallets || !wallets.length) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:28px 16px;">
          <p style="color:#888;">${tt('mywallet.no_wallets')}</p>
        </div>`;
      return;
    }

    const active = wallets.find(w => w.id === getHackActiveId()) ?? wallets[0];
    let tradeList = await fetchTradeWalletsServer() || [];

    container2.innerHTML = `
      <div class="trk-card">
        <h3 style="margin:0 0 8px;font-size:16px;">${tt('tax.title')}</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          ${wallets.map(w => `<button class="trk-watch-chip${w.id === active.id ? ' active' : ''}" data-tax-wid="${w.id}">${esc(aliasFor(w.address) || w.alias)}</button>`).join('')}
        </div>
        <div id="trk-tax-asset-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;"></div>
        <p style="font-size:11px;color:#888;margin:8px 0 0;">${tt('tax.note')}</p>
      </div>
      <div id="trk-tax-detail"></div>`;

    container2.querySelectorAll('[data-tax-wid]').forEach(btn => {
      btn.addEventListener('click', () => { setHackActiveId(btn.dataset.taxWid); renderTaxTab(); });
    });

    const detailEl     = container2.querySelector('#trk-tax-detail');
    const assetChipsEl = container2.querySelector('#trk-tax-asset-chips');
    detailEl.innerHTML = `<p style="color:#888;padding:12px 0;">${tt('tax.syncing')}</p>`;

    let entries;
    try {
      await syncTaxLedger(active.address);
      entries = await fetchTaxLedgerEntries(active.address);
      const manualPrices = await fetchManualPrices(piUser, active.address);
      entries.forEach(e => { if (manualPrices[e.id] != null) e.manual_price = manualPrices[e.id]; });
    } catch (e) {
      detailEl.innerHTML = `<div class="trk-card"><p style="color:#f87171;font-size:13px;">${tt('ledger.fail')}: ${e.message}</p></div>`;
      return;
    }

    const assetSet = new Set();
    entries.forEach(e => {
      if (e.asset) assetSet.add(e.asset);
      if (e.send_asset) assetSet.add(e.send_asset);
      if (e.dest_asset) assetSet.add(e.dest_asset);
    });
    const assets = [...assetSet];

    if (!assets.length) {
      detailEl.innerHTML = `<div class="trk-card"><p style="color:#888;">${tt('ledger.empty')}</p></div>`;
      return;
    }

    assets.forEach((a, i) => {
      const chip = document.createElement('button');
      chip.className = 'trk-watch-chip' + (i === 0 ? ' active' : '');
      chip.dataset.taxAsset = a;
      chip.textContent = a;
      assetChipsEl.appendChild(chip);
    });

    const renderForAsset = async (asset) => {
      detailEl.innerHTML = `<p style="color:#888;padding:12px 0;">⏳ ${tt('tax.loading')}</p>`;

      const relevant = entries.filter(e => e.asset === asset || e.send_asset === asset || e.dest_asset === asset);
      const taggedMap = new Map(tradeList.map(w => [w.address, w.costingMethod || null]));

      // 가격이 없는 단순이체 엔트리는 온디맨드로 조회해 채워둠(한 번 채워지면 Firestore에 저장되어 다음부턴 재사용)
      const db2 = getDb();
      const entriesCol = db2 ? db2.collection(LEDGER_COL).doc(active.address).collection('entries') : null;
      for (const e of relevant) {
        if (SWAP_OP_TYPES.includes(e.op_type)) continue; // 스왑은 아래서 leg별로 처리
        if (e.auto_price != null || e.manual_price != null) continue;
        if (!ASSET_OKX_SYMBOL[e.asset]) continue;
        const result = await fetchNearestOkxPrice(e.asset, new Date(e.created_at).getTime());
        if (result) {
          e.auto_price = result.price;
          e.auto_price_src = result.src;
          if (entriesCol) await entriesCol.doc(e.id).set({ auto_price: result.price, auto_price_src: result.src }, { merge: true });
        }
      }

      // 정규화 — 단순이체는 1행, 스왑은 이 자산에 해당하는 다리 1행만.
      // 미태그 지갑도 일단 행으로는 만들어두되(__method: null), 계산은 방식별로 태그된 지갑만 골라서 하므로
      // 전체를 막을 필요가 없다 — 자기 자신과의 스왑(DEX 자체 거래)만 태그 없이 FIFO로 자동 취급.
      const rows = [];
      let noPriceCount = 0;
      const cpMethod = new Map(); // address -> 'fifo' | 'moving_avg' | null
      let hasSelfSwap = false;

      for (const e of relevant) {
        const cp = counterpartOf(e, active.address);
        const cpKey  = (!cp || cp === active.address) ? '__self__' : cp;
        const method = cpKey === '__self__' ? 'fifo' : (taggedMap.get(cpKey) || null);
        if (cpKey === '__self__') hasSelfSwap = true; else cpMethod.set(cpKey, method);

        if (SWAP_OP_TYPES.includes(e.op_type)) {
          const { sendPrice, destPrice } = await resolveSwapUnitPrices(e);
          if (e.send_asset === asset) {
            const qty = parseFloat(e.send_amount);
            if (qty > 0) {
              if (sendPrice == null) { noPriceCount++; continue; }
              rows.push({ ts: new Date(e.created_at).getTime(), direction: 'out', qty, unitPrice: sendPrice, __cp: cpKey, __method: method });
            }
          }
          if (e.dest_asset === asset) {
            const qty = parseFloat(e.dest_amount);
            if (qty > 0) {
              if (destPrice == null) { noPriceCount++; continue; }
              rows.push({ ts: new Date(e.created_at).getTime(), direction: 'in', qty, unitPrice: destPrice, __cp: cpKey, __method: method });
            }
          }
          continue;
        }

        if (e.asset !== asset || e.amount == null) continue;
        const price = e.manual_price ?? e.auto_price ?? null;
        if (price == null) { noPriceCount++; continue; }
        rows.push({
          ts: new Date(e.created_at).getTime(),
          direction: e.to === active.address ? 'in' : 'out',
          qty: parseFloat(e.amount),
          unitPrice: price,
          __cp: cpKey,
          __method: method,
        });
      }

      const allCps = [...cpMethod.keys()];
      const netColor = (g) => g > 0 ? '#4ade80' : g < 0 ? '#f87171' : '#888';
      const disposalTable = (result) => result.disposals.length === 0
        ? `<p style="color:#888;font-size:12px;">-</p>`
        : `<table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead><tr style="color:#888;text-align:left;">
              <th style="padding:4px 0;">${tt('tax.disposal.date')}</th><th>${tt('tax.disposal.qty')}</th>
              <th>${tt('tax.disposal.proceeds')}</th><th>${tt('tax.disposal.cost')}</th><th>${tt('tax.disposal.gain')}</th>
            </tr></thead>
            <tbody>${result.disposals.map(d => `
              <tr>
                <td style="padding:3px 0;">${new Date(d.ts).toLocaleDateString()}</td>
                <td>${d.qty.toFixed(4)}</td>
                <td>${d.proceeds.toFixed(4)}</td>
                <td>${d.costBasis.toFixed(4)}</td>
                <td style="color:${netColor(d.gain)};">${d.gain.toFixed(4)}</td>
              </tr>`).join('')}
            </tbody></table>`;

      const rawEntriesHtml = relevant.length === 0 ? '' : `
        <div class="trk-card" style="margin-bottom:12px;">
          <div class="trk-section-label">${tt('tax.manual_price.auto')} / ${tt('tax.manual_price.edit')}</div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <tbody>${relevant.map(e => {
              const isSwap = SWAP_OP_TYPES.includes(e.op_type);
              const dir    = isSwap ? (e.send_asset === asset ? `→ ${esc(e.dest_asset)}` : `← ${esc(e.send_asset)}`) : (e.to === active.address ? tt('ledger.in') : tt('ledger.out'));
              const qty    = isSwap ? (e.send_asset === asset ? e.send_amount : e.dest_amount) : e.amount;
              const price  = e.manual_price ?? e.auto_price ?? null;
              const src    = e.manual_price != null ? '✏️' : (e.auto_price_src || '-');
              return `<tr>
                <td style="padding:3px 4px 3px 0;">${new Date(e.created_at).toLocaleDateString()}</td>
                <td style="padding:3px 4px;">${dir}</td>
                <td style="padding:3px 4px;">${qty != null ? parseFloat(qty).toFixed(4) : '-'}</td>
                <td style="padding:3px 4px;">${price != null ? price : '-'} <span style="color:#888;">(${src})</span></td>
                <td style="padding:3px 0;text-align:right;"><button class="trk-tax-mp-edit" data-entry-id="${e.id}" style="background:none;border:none;cursor:pointer;">✏️</button></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>`;

      detailEl.innerHTML = `
        ${noPriceCount ? `<p style="color:#f0b429;font-size:12px;margin:0 0 8px;">${tt2('tax.no_price', { n: noPriceCount })}</p>` : ''}
        ${rawEntriesHtml}
        <div class="trk-card">
          <div class="trk-section-label">${tt('tax.report.title')}</div>
          <div style="display:flex;gap:8px;margin:8px 0;">
            <button class="trk-btn-outline trk-btn-sm trk-tax-method-btn active" data-method="fifo" style="flex:1;">${tt('tax.method.fifo')}</button>
            <button class="trk-btn-outline trk-btn-sm trk-tax-method-btn" data-method="moving_avg" style="flex:1;">${tt('tax.method.moving_avg')}</button>
          </div>
          <p style="font-size:11px;color:#888;margin:0 0 8px;">${tt('tax.method.hint')}</p>
          <p style="font-size:11px;color:#888;margin:4px 0;">${tt('tax.report.select_wallets')}</p>
          <div id="trk-tax-report-wallets" style="display:flex;flex-direction:column;gap:6px;"></div>
          <div id="trk-tax-untagged-hint"></div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="date" id="trk-tax-report-from" class="trk-input" style="flex:1;" />
            <input type="date" id="trk-tax-report-to" class="trk-input" style="flex:1;" />
          </div>
          <p id="trk-tax-report-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:6px;"></p>
          <button class="trk-btn-submit" id="trk-tax-report-gen" style="width:100%;margin-top:6px;">${tt('tax.report.generate')}</button>
          <div id="trk-tax-report-result" style="margin-top:12px;"></div>
        </div>`;

      detailEl.querySelectorAll('.trk-tax-mp-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const entry = relevant.find(e => e.id === btn.dataset.entryId);
          if (entry) showManualPriceDialog(active.address, entry, () => renderForAsset(asset));
        });
      });

      let selectedMethod = 'fifo';

      function renderWalletPicker() {
        const walletsEl = detailEl.querySelector('#trk-tax-report-wallets');
        const taggedAddrs = allCps.filter(addr => cpMethod.get(addr) === selectedMethod);
        const rowsHtml = [
          ...taggedAddrs.map(addr => `
            <label style="display:flex;align-items:center;gap:8px;font-size:12px;">
              <input type="checkbox" class="trk-tax-report-cp" value="${esc(addr)}" checked />
              <span>${esc(counterpartLabel(addr))}</span>
            </label>`),
          ...(selectedMethod === 'fifo' && hasSelfSwap ? [`
            <label style="display:flex;align-items:center;gap:8px;font-size:12px;">
              <input type="checkbox" class="trk-tax-report-cp" value="__self__" checked />
              <span>${tt('tax.report.self_swap')}</span>
            </label>`] : []),
        ];
        walletsEl.innerHTML = rowsHtml.length ? rowsHtml.join('') : `<p style="color:#888;font-size:12px;">-</p>`;

        const untaggedAddrs = allCps.filter(addr => !cpMethod.get(addr));
        const hintEl = detailEl.querySelector('#trk-tax-untagged-hint');
        hintEl.innerHTML = untaggedAddrs.length ? `
          <p style="font-size:11px;color:#f0b429;margin-top:8px;">⚠️ ${tt('tax.untagged_hint')}</p>
          ${untaggedAddrs.map(addr => `
            <div class="trk-watch-row">
              <div><span class="trk-watch-alias">${esc(counterpartLabel(addr))}</span></div>
              <button class="trk-btn-outline trk-btn-sm" data-untagged-addr="${esc(addr)}" style="width:auto;padding:0 12px;">${tt('tax.tag_now')}</button>
            </div>`).join('')}` : '';
        hintEl.querySelectorAll('[data-untagged-addr]').forEach(btn => {
          btn.addEventListener('click', () => {
            const addr = btn.dataset.untaggedAddr;
            let entry = tradeList.find(w => w.address === addr);
            const openDialog = () => showCostingMethodDialog(entry, tradeList, () => renderForAsset(asset));
            if (entry) { openDialog(); return; }
            (async () => {
              entry = { id: genTradeId(), address: addr };
              tradeList = [...tradeList, entry];
              await saveTradeWalletsServer(tradeList);
              await setAddressAlias(addr, counterpartLabel(addr));
              openDialog();
            })();
          });
        });
      }
      renderWalletPicker();

      detailEl.querySelectorAll('.trk-tax-method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedMethod = btn.dataset.method;
          detailEl.querySelectorAll('.trk-tax-method-btn').forEach(b => b.classList.toggle('active', b === btn));
          renderWalletPicker();
        });
      });

      detailEl.querySelector('#trk-tax-report-gen').addEventListener('click', () => {
        const errEl = detailEl.querySelector('#trk-tax-report-err');
        const resultEl = detailEl.querySelector('#trk-tax-report-result');
        errEl.textContent = '';
        resultEl.innerHTML = '';

        const checked = [...detailEl.querySelectorAll('.trk-tax-report-cp:checked')];
        if (!checked.length) { errEl.textContent = tt('tax.report.no_selection'); return; }

        const selectedVals = new Set(checked.map(c => c.value));
        const fromVal = detailEl.querySelector('#trk-tax-report-from').value;
        const toVal   = detailEl.querySelector('#trk-tax-report-to').value;
        const fromTs  = fromVal ? new Date(fromVal).getTime() : -Infinity;
        const toTs    = toVal ? new Date(toVal + 'T23:59:59').getTime() : Infinity;

        const scopedRows = rows.filter(r => r.ts >= fromTs && r.ts <= toTs && r.__cp && selectedVals.has(r.__cp));
        const scopedResult = selectedMethod === 'fifo' ? computeFifoLots(scopedRows) : computeMovingAvgLots(scopedRows);
        const totalGain = scopedResult.disposals.reduce((s, d) => s + d.gain, 0);

        resultEl.innerHTML = `
          <div class="trk-card">
            <p style="font-size:12px;color:#888;margin:0 0 4px;">${tt('tax.report.method_label')}: ${selectedMethod === 'fifo' ? tt('tax.method.fifo') : tt('tax.method.moving_avg')}</p>
            <p style="font-size:12px;color:#888;margin:0 0 4px;">${tt('tax.report.period_label')}: ${fromVal || '-'} ~ ${toVal || '-'}</p>
            <p style="font-size:12px;color:#888;margin:0 0 8px;">${tt('tax.report.wallets_label')}: ${checked.map(c => c.value === '__self__' ? tt('tax.report.self_swap') : counterpartLabel(c.value)).join(', ')}</p>
            ${disposalTable(scopedResult)}
            <p style="font-size:13px;margin-top:8px;"><strong>${tt('tax.report.total_gain')}: <span style="color:${netColor(totalGain)};">${totalGain.toFixed(4)}</span></strong></p>
            <button class="trk-btn-outline trk-btn-sm" id="trk-tax-report-export" style="width:auto;padding:0 12px;margin-top:8px;">${tt('tax.report.export')}</button>
          </div>`;

        resultEl.querySelector('#trk-tax-report-export').addEventListener('click', () => {
          const csv = taxRowsToCsv(selectedMethod, scopedResult, asset, active.address);
          downloadCsv(`tax_report_${(aliasFor(active.address) || active.alias)}_${asset}_${new Date().toISOString().slice(0,10)}.csv`, csv);
        });
      });
    };

    assetChipsEl.querySelectorAll('[data-tax-asset]').forEach(chip => {
      chip.addEventListener('click', () => {
        assetChipsEl.querySelectorAll('[data-tax-asset]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderForAsset(chip.dataset.taxAsset);
      });
    });

    renderForAsset(assets[0]);
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
    const counterpartLabel = aliasFor(counterpart) || counterpart;
    const dirLabel    = isOut ? tt('tx.to') : tt('tx.from');
    const amtStr      = parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    card.innerHTML = `
      <div class="trk-tx-top"><span class="trk-tx-date">${formatDate(p.created_at)}</span><span class="trk-tx-amount ${isOut ? 'out' : 'in'}">${isOut ? '-' : '+'}${amtStr} Pi</span></div>
      <div class="trk-tx-dir">${dirLabel}</div>
      <div class="trk-tx-addr${counterpart ? ' trk-copy-addr trk-tag-ok' : ''}" ${counterpart ? `data-copy-addr="${esc(counterpart)}"` : ''}>${esc(counterpartLabel) || '-'}</div>
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
  async function fetchHackWalletsServer() {
    const key = piUser;
    if (!key || !db) return null;
    try {
      const doc = await db.collection('hack_pending_wallets').doc(key).get();
      return doc.exists ? (doc.data().wallets || []) : [];
    } catch { return null; }
  }

  async function saveHackWalletsServer(list) {
    const key = piUser;
    if (!key || !db) throw new Error('no_login');
    await db.collection('hack_pending_wallets').doc(key).set({
      wallets: list,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  async function renderMyWalletTab() {
    const container2 = container.querySelector('#trk-mywallet-content');
    container2.innerHTML = `<p style="color:#888;padding:12px 0;">⏳ ${tt('mywallet.loading')}</p>`;

    if (!piUser) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;">${tt('ctx.pidex.no_login')}</p>
        </div>`;
      return;
    }

    const wallets = await fetchHackWalletsServer();
    if (wallets === null) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;margin-bottom:12px;">${tt('mywallet.load.fail')}</p>
          <button class="trk-btn-outline" id="trk-hwt-retry" style="width:auto;padding:0 20px;">↻ ${tt('mywallet.refresh')}</button>
        </div>`;
      container2.querySelector('#trk-hwt-retry')?.addEventListener('click', renderMyWalletTab);
      return;
    }

    if (!wallets.length) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:28px 16px;">
          <p style="color:#888;margin-bottom:4px;">${tt('mywallet.no_wallets')}</p>
          <p style="font-size:11px;color:#888;margin-bottom:16px;">${tt2('mywallet.max_hint', { n: HACK_WALLET_MAX })}</p>
          <button class="trk-btn-search" id="trk-hwt-add-first" style="width:auto;padding:0 24px;">+ ${tt('mywallet.add')}</button>
        </div>`;
      container2.querySelector('#trk-hwt-add-first').addEventListener('click', () => showHackWalletAddDialog(wallets, renderMyWalletTab));
      return;
    }

    const active = wallets.find(w => w.id === getHackActiveId()) ?? wallets[0];
    setHackActiveId(active.id);

    // 지갑 메뉴 접근 시 신규 내역만 조용히 DB에 누적 기록 (장부 탭용 원본 로그)
    wallets.forEach(w => syncWalletLedger(w.address).catch(() => {}));

    container2.innerHTML = `
      <div class="trk-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;font-size:16px;">${tt('mywallet.title')} <span style="font-size:11px;color:#888;font-weight:400;">(${wallets.length}/${HACK_WALLET_MAX})</span></h3>
          <div style="display:flex;gap:4px;">
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-backup" style="width:auto;padding:0 12px;">☁️</button>
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-refresh" style="width:auto;padding:0 12px;">↻ ${tt('mywallet.refresh')}</button>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          ${wallets.map(w => `
            <button class="trk-watch-chip${w.id === active.id ? ' active' : ''}" data-hwid="${w.id}" data-active-check="${esc(w.address)}">${esc(aliasFor(w.address) || w.alias)}</button>`).join('')}
          ${wallets.length < HACK_WALLET_MAX ? `<button id="trk-hwt-add-btn" style="padding:4px 12px;border-radius:20px;font-size:12px;border:1px dashed var(--border);background:transparent;color:#888;cursor:pointer;">
            + ${tt('mywallet.add')}
          </button>` : ''}
        </div>
      </div>
      <div id="trk-hwt-detail"></div>`;

    container2.querySelectorAll('[data-hwid]').forEach(btn => {
      btn.addEventListener('click', () => { setHackActiveId(btn.dataset.hwid); renderMyWalletTab(); });
    });
    container2.querySelector('#trk-hwt-add-btn')?.addEventListener('click', () => showHackWalletAddDialog(wallets, renderMyWalletTab));
    container2.querySelector('#trk-hwt-refresh').addEventListener('click', renderMyWalletTab);
    container2.querySelector('#trk-hwt-backup').addEventListener('click', () => {
      openBackupModal('mainnet', wallets, HACK_WALLET_MAX, async (newList) => {
        await saveHackWalletsServer(newList);
        renderMyWalletTab();
      });
    });
    await loadHackWalletDetail(container2.querySelector('#trk-hwt-detail'), active, wallets);

    // 비활성 지갑 칩에 아이콘 표시 (병렬 조회 후 비동기로 반영)
    container2.querySelectorAll('[data-active-check]').forEach(async (el) => {
      const addr = el.dataset.activeCheck;
      const isActive = await isWalletActive(addr);
      if (!isActive && container2.isConnected) {
        el.insertAdjacentHTML('afterbegin', `<span title="${esc(tt('mywallet.not_activated.icon_title'))}">⚠️ </span>`);
      }
    });
  }

  async function loadHackWalletDetail(detailEl, wallet, allWallets) {
    detailEl.innerHTML = `<p style="color:#888;font-size:13px;padding:8px 0;">${tt('mywallet.loading')}</p>`;
    try {
      const [account, paymentsData, claims] = await Promise.all([
        fetchAccountMainnet(wallet.address),
        fetchPayments(wallet.address),
        fetchClaimableBalances(wallet.address).catch(() => []),
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

      const now = new Date();
      const claimableNow = claims.filter(c => !c.unlockAt || c.unlockAt <= now);
      const stillLocked  = claims.filter(c => c.unlockAt && c.unlockAt > now).sort((a, b) => a.unlockAt - b.unlockAt);
      const lockedTotal    = stillLocked.reduce((s, c) => s + c.amount, 0);
      const claimableTotal = claimableNow.reduce((s, c) => s + c.amount, 0);

      const lockHtml = claims.length === 0 ? '' : `
        <div class="trk-section-label">🔒 ${tt('mywallet.lock.title')}</div>
        <div class="trk-card">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700;"><span>${tt('mywallet.lock.total')}</span><span>${lockedTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>
          ${claimableTotal > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;color:#22c55e;"><span>${tt('mywallet.lock.claimable')}</span><span>${claimableTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>` : ''}
          ${stillLocked.map(c => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#aaa;"><span>${c.unlockAt.toLocaleDateString()}</span><span>${c.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>`).join('')}
        </div>`;

      detailEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:10px;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#7dd3fc;margin-bottom:2px;">${esc(aliasFor(wallet.address) || wallet.alias)}</div>
            <div class="trk-copy-addr" data-copy-addr="${esc(wallet.address)}" style="font-size:14px;color:#888;font-family:monospace;cursor:pointer;padding:5px 3px;display:inline-block;">${esc(wallet.address.slice(0,5))}···${esc(wallet.address.slice(-4))}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-edit-alias">✏️</button>
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-send-pidex" title="${tt('ctx.register.both')}">💼→</button>
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-del">🗑️</button>
          </div>
        </div>
        <div class="trk-section-label" style="margin-top:0;">π ${tt('mywallet.pi.total')}</div>
        <div class="trk-card">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700;"><span>${tt('mywallet.pi.total')}</span><span>${account.pi.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#22c55e;"><span>${tt('mywallet.pi.avail')}</span><span>${availablePi.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} π</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#f87171;"><span>${tt('mywallet.pi.reserve')}</span><span>~${minReserve.toFixed(2)} π</span></div>
        </div>
        ${tokensWithBal.length > 0 ? `<div class="trk-section-label">🪙 ${tt('mywallet.tokens')}</div><div class="trk-card">${tokensWithBal.map(tok => `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span>${tok.asset_code ?? tok.asset_type}</span><span>${parseFloat(tok.balance).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`).join('')}</div>` : ''}
        ${lockHtml}
        <div class="trk-section-label">📡 ${tt('mywallet.txs')}</div>
        <div style="padding-bottom:8px;">${txHtml}</div>
        <div class="trk-section-label">💧 ${tt('mywallet.lp')}</div>
        <div class="trk-card">${lpHtml}</div>
        <p style="font-size:10px;color:#666;text-align:center;margin-top:8px;">${tt('mywallet.updated')}: ${new Date().toLocaleTimeString()}</p>`;

      bindHackWalletDetailButtons(detailEl, wallet, allWallets);
    } catch (e) {
      const msg = e.notActivated ? tt('mywallet.not_activated') : `${tt('mywallet.fail')}: ${e.message}`;
      detailEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:10px;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#7dd3fc;margin-bottom:2px;">${esc(aliasFor(wallet.address) || wallet.alias)}</div>
            <div class="trk-copy-addr" data-copy-addr="${esc(wallet.address)}" style="font-size:14px;color:#888;font-family:monospace;cursor:pointer;padding:5px 3px;display:inline-block;">${esc(wallet.address.slice(0,5))}···${esc(wallet.address.slice(-4))}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-edit-alias">✏️</button>
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-send-pidex" title="${tt('ctx.register.both')}">💼→</button>
            <button class="trk-btn-outline trk-btn-sm" id="trk-hwt-del">🗑️</button>
          </div>
        </div>
        <div class="trk-card"><p style="color:#f87171;font-size:13px;">${msg}</p></div>`;
      bindHackWalletDetailButtons(detailEl, wallet, allWallets);
    }
  }

  function bindHackWalletDetailButtons(detailEl, wallet, allWallets) {
    detailEl.querySelector('#trk-hwt-edit-alias')?.addEventListener('click', () => {
      showAliasDialog(wallet, allWallets, renderMyWalletTab);
    });
    detailEl.querySelector('#trk-hwt-send-pidex')?.addEventListener('click', () => {
      sendToPidexWallet(wallet.address, `★${aliasFor(wallet.address) || wallet.alias}`);
    });
    detailEl.querySelector('#trk-hwt-del')?.addEventListener('click', () => {
      showConfirmDialog(tt('mywallet.delete'), tt('mywallet.delete.confirm'), async () => {
        try {
          const remaining = allWallets.filter(w => w.id !== wallet.id);
          await saveHackWalletsServer(remaining);
          if (remaining.length) setHackActiveId(remaining[0].id);
          renderMyWalletTab();
        } catch { showToast(tt('mywallet.cloud.fail')); }
      }, tt('mywallet.delete'));
    });
  }

  // 계정이 Pi 메인넷에서 활성화됐는지 확인 (한 번도 Pi를 받은 적 없으면 404)
  // 네트워크 오류 시에는 fail-open(활성으로 간주)하여 불필요하게 경고를 막지 않음
  async function isWalletActive(address) {
    try {
      const res = await fetch(`${HORIZON}/accounts/${address}`);
      return res.ok;
    } catch {
      return true;
    }
  }

  async function fetchAccountMainnet(address) {
    const res = await fetch(`${HORIZON}/accounts/${address}`);
    if (!res.ok) {
      if (res.status === 404) {
        const err = new Error(tt('search.err.not_found'));
        err.notActivated = true;
        throw err;
      }
      throw new Error(`API error (${res.status})`);
    }
    const data     = await res.json();
    const pi       = data.balances.find(b => b.asset_type === 'native');
    const tokens   = data.balances.filter(b => b.asset_type !== 'native' && b.asset_type !== 'liquidity_pool_shares');
    const lpShares = data.balances.filter(b => b.asset_type === 'liquidity_pool_shares');
    return { pi: parseFloat(pi?.balance ?? 0), tokens, lpShares, raw: data };
  }

  // Pi 마이그레이션 락업은 Stellar Claimable Balance로 구현됨.
  // predicate: { not: { abs_before: <ISO> } } → 그 날짜 전에는 청구 불가(잠김), 이후엔 청구 가능
  // predicate가 없거나 unconditional이면 즉시 청구 가능
  function parseClaimUnlockDate(claimant) {
    const pred = claimant?.predicate;
    if (!pred) return null;
    if (pred.not?.abs_before) return new Date(pred.not.abs_before);
    return null; // unconditional 등 그 외 조건은 즉시 청구 가능으로 취급
  }

  async function fetchClaimableBalances(address) {
    const balances = [];
    let url = `${HORIZON}/claimable_balances?claimant=${address}&limit=200&order=asc`;
    for (let page = 0; page < 20 && url; page++) {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const records = data._embedded?.records ?? [];
      for (const r of records) {
        const mine = r.claimants.find(c => c.destination === address) ?? r.claimants[0];
        balances.push({
          id: r.id,
          asset: r.asset === 'native' ? 'π' : r.asset,
          amount: parseFloat(r.amount),
          unlockAt: parseClaimUnlockDate(mine),
        });
      }
      const next = data._links?.next?.href;
      url = (next && records.length > 0) ? next : null;
    }
    return balances;
  }

  function hackWalletTxRowHtml(p, wallet) {
    const isIn  = p.to === wallet.address;
    const other = isIn ? p.from : p.to;
    const short = other ? (aliasFor(other) || `${other.slice(0,4)}···${other.slice(-3)}`) : '?';
    const amt   = parseFloat(p.amount ?? 0).toFixed(2);
    const date  = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
    const color = isIn ? '#22c55e' : '#f0b429';
    const dir   = isIn ? tt('mywallet.tx_recv') : tt('mywallet.tx_sent');
    const arrow = isIn ? '↙' : '↗';
    const myChip  = `<span style="background:rgba(255,255,255,0.10);padding:5px 9px;border-radius:4px;color:#7dd3fc;font-weight:600;">${esc(aliasFor(wallet.address) || wallet.alias)}</span>`;
    const othChip = other
      ? `<span class="trk-copy-addr trk-tag-ok" data-copy-addr="${esc(other)}" style="background:rgba(255,255,255,0.06);padding:5px 9px;border-radius:4px;color:#999;font-family:monospace;cursor:pointer;">${esc(short)}</span>`
      : `<span style="background:rgba(255,255,255,0.06);padding:5px 9px;border-radius:4px;color:#999;font-family:monospace;">?</span>`;
    const fromChip = isIn ? othChip : myChip;
    const toChip   = isIn ? myChip  : othChip;
    return `
      <div style="border-left:3px solid ${color};padding:10px 12px;margin-bottom:8px;border-radius:0 8px 8px 0;background:rgba(255,255,255,0.03);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:600;color:${color};">${arrow} ${dir}</span>
          <span style="font-size:13px;font-weight:700;color:${color};">${amt} π</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:13px;flex-wrap:wrap;">${fromChip}<span style="color:#555;font-size:13px;">──→</span>${toChip}</div>
        <div style="font-size:10px;color:#666;margin-top:4px;">${date}</div>
      </div>`;
  }

  // ── 관심 지갑 탭 (서버가 원본 — pidex_watch_list) ──────
  async function fetchWatchListServer() {
    const key = piUser;
    if (!key || !db) return null;
    try {
      const doc = await db.collection('pidex_watch_list').doc(key).get();
      return doc.exists ? (doc.data().watchList || []) : [];
    } catch { return null; }
  }

  async function saveWatchListServer(list) {
    const key = piUser;
    if (!key || !db) throw new Error('no_login');
    await db.collection('pidex_watch_list').doc(key).set({
      watchList: list,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  async function renderWatchTab() {
    const container2 = container.querySelector('#trk-watch-content');
    container2.innerHTML = `<p style="color:#888;padding:12px 0;">⏳ ${tt('mywallet.loading')}</p>`;

    if (!piUser) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;">${tt('ctx.pidex.no_login')}</p>
        </div>`;
      return;
    }

    const list = await fetchWatchListServer();
    if (list === null) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;margin-bottom:12px;">${tt('watch.load.fail')}</p>
          <button class="trk-btn-outline" id="trk-watch-retry" style="width:auto;padding:0 20px;">↻ ${tt('mywallet.refresh')}</button>
        </div>`;
      container2.querySelector('#trk-watch-retry')?.addEventListener('click', renderWatchTab);
      return;
    }

    container2.innerHTML = `
      <div class="trk-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="margin:0;">${tt('watch.title')} <span style="font-size:11px;color:#888;font-weight:400;">${tt2('watch.max_hint', { n: WATCH_MAX })}</span></h3>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:#888;">${list.length}/${WATCH_MAX}</span>
            <button class="trk-btn-outline trk-btn-sm" id="trk-watch-backup" style="width:auto;padding:0 12px;">☁️</button>
          </div>
        </div>
        <div id="trk-watch-list-rows">
          ${list.length === 0
            ? `<p style="color:#888;">${tt('watch.empty')}</p>`
            : list.map(w => `
                <div class="trk-watch-row">
                  <div>
                    <span class="trk-watch-alias" data-active-check="${esc(w.address)}">${esc(aliasFor(w.address) || w.alias)}</span>
                    <span class="trk-watch-addr trk-copy-addr" data-copy-addr="${esc(w.address)}">${esc(w.address.slice(0,4))}···${esc(w.address.slice(-3))}</span>
                  </div>
                  <div style="display:flex;gap:4px;">
                    <button class="trk-watch-edit-btn" data-wid="${w.id}">✏️</button>
                    <button class="trk-watch-del-btn" data-wid="${w.id}">✕</button>
                  </div>
                </div>`).join('')}
        </div>
        ${list.length < WATCH_MAX ? `<button class="trk-btn-outline" id="trk-btn-watch-add" style="width:100%;margin-top:12px;">+ ${tt('watch.add.btn')}</button>` : ''}
      </div>
      ${list.length > 0 ? `
        <button class="trk-btn-search" id="trk-btn-watch-fetch" style="width:100%;margin-top:10px;">🔍 ${tt('watch.fetch.btn')}</button>
        <div id="trk-watch-results"></div>` : ''}`;

    container2.querySelectorAll('.trk-watch-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = list.find(x => x.id === btn.dataset.wid);
        if (w) showWatchAliasDialog(w, list, () => renderWatchTab());
      });
    });

    container2.querySelectorAll('.trk-watch-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const updated = list.filter(w => w.id !== btn.dataset.wid);
          await saveWatchListServer(updated);
          renderWatchTab();
        } catch { showToast(tt('watch.cloud.fail')); btn.disabled = false; }
      });
    });

    container2.querySelector('#trk-btn-watch-add')?.addEventListener('click', () => {
      showWatchAddDialog(list, () => renderWatchTab());
    });

    container2.querySelector('#trk-btn-watch-fetch')?.addEventListener('click', () => fetchWatchData(list));
    container2.querySelector('#trk-watch-backup').addEventListener('click', () => {
      openBackupModal('watch', list, WATCH_MAX, async (newList) => {
        await saveWatchListServer(newList);
        renderWatchTab();
      });
    });

    // 비활성 지갑에 아이콘 표시 (병렬 조회 후 비동기로 반영)
    container2.querySelectorAll('[data-active-check]').forEach(async (el) => {
      const addr = el.dataset.activeCheck;
      const active = await isWalletActive(addr);
      if (!active && container2.isConnected) {
        el.insertAdjacentHTML('afterbegin', `<span title="${esc(tt('mywallet.not_activated.icon_title'))}">⚠️ </span>`);
      }
    });
  }

  function showWatchAliasDialog(watch, currentList, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:300px;">
        <div class="modal-header"><span>${tt('mywallet.alias.edit')}</span></div>
        <div style="padding:16px;">
          <input type="text" id="trk-wa-input" class="form-input" value="${esc(aliasFor(watch.address) || watch.alias)}" />
          <p id="trk-wa-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-wa-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-wa-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-wa-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-wa-input').select();
    overlay.querySelector('#trk-wa-save').onclick = async () => {
      const alias   = overlay.querySelector('#trk-wa-input').value.trim();
      const errEl   = overlay.querySelector('#trk-wa-err');
      const saveBtn = overlay.querySelector('#trk-wa-save');
      if (!alias) return;
      saveBtn.disabled = true;
      try {
        await setAddressAlias(watch.address, alias);
        overlay.remove();
        onSaved();
      } catch {
        errEl.textContent = tt('watch.cloud.fail');
        saveBtn.disabled = false;
      }
    };
  }

  function showWatchAddDialog(currentList, onSaved) {
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
    overlay.querySelector('#trk-w-save').onclick = async () => {
      const addr  = overlay.querySelector('#trk-w-addr').value.trim();
      const alias = overlay.querySelector('#trk-w-alias').value.trim() || aliasFor(addr) || `${addr.slice(0,6)}···${addr.slice(-4)}`;
      const err   = overlay.querySelector('#trk-w-err');
      const saveBtn = overlay.querySelector('#trk-w-save');
      if (!addr || addr.length < 10) { err.textContent = tt('watch.add.err_addr'); return; }
      if (currentList.some(w => w.address === addr)) { err.textContent = tt('ctx.watch.exists'); return; }
      if (currentList.length >= WATCH_MAX) { err.textContent = tt('ctx.watch.full'); return; }
      saveBtn.disabled = true;

      const doSave = async () => {
        try {
          const updated = [...currentList, { id: genWatchId(), address: addr }];
          await saveWatchListServer(updated);
          await setAddressAlias(addr, alias);
          overlay.remove();
          onSaved();
        } catch { err.textContent = tt('watch.cloud.fail'); saveBtn.disabled = false; }
      };

      const active = await isWalletActive(addr);
      if (active) {
        await doSave();
      } else {
        saveBtn.disabled = false;
        showConfirmDialog(tt('mywallet.not_activated.icon_title'), tt('mywallet.not_activated.confirm'), doSave, tt('ctx.continue'));
      }
    };
  }

  async function fetchWatchData(list) {
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
          return (data._embedded?.records || []).map(p => ({ ...p, _watchAlias: aliasFor(w.address) || w.alias, _watchAddr: w.address }));
        } catch { return []; }
      }));

      let reportSnap = null;
      try {
        reportSnap = db ? await db.collection(REPORTS_COL)
          .where('suspectWallet', 'in', [...addrSet].slice(0, 10)).get() : null;
      } catch { reportSnap = null; }
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
        }
      });
      saveWatchLatest(newLatest);

      const newHtml = list.filter(w => newTxMap[w.address]).map(w => `<div class="trk-watch-new-alert">🆕 ${esc(aliasFor(w.address) || w.alias)} — ${tt('watch.new.tx')}</div>`).join('');
      const warnHtml = list.filter(w => reportHits.has(w.address)).map(w => `<div class="trk-watch-warn">⚠️ ${esc(aliasFor(w.address) || w.alias)} — ${tt('watch.report.warn')}</div>`).join('');
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
    const fromLabel = aliasFor(p.from) || (p.from ? `${p.from.slice(0,4)}···${p.from.slice(-3)}` : '?');
    const toLabel   = aliasFor(p.to)   || (p.to   ? `${p.to.slice(0,4)}···${p.to.slice(-3)}`   : '?');
    return `
      <div class="trk-tx-card ${isInternal ? 'matched' : ''}">
        <div class="trk-tx-top"><span class="trk-tx-date">${esc(p._watchAlias)} · ${date}</span><span class="trk-tx-amount out">${amount} Pi</span></div>
        <div style="font-size:14px;color:#aaa;margin-top:6px;display:flex;align-items:center;">
          <span class="trk-copy-addr trk-tag-ok" data-copy-addr="${esc(p.from)}" style="padding:5px 3px;">${esc(fromLabel)}</span>
          <span style="color:#555;margin:0 4px;">──→</span>
          <span class="trk-copy-addr trk-tag-ok" data-copy-addr="${esc(p.to)}" style="padding:5px 3px;">${esc(toLabel)}</span>
        </div>
      </div>`;
  }

  // ── 공용 주소 별칭 사전 (주소당 별칭 하나 — pidex_address_aliases, 두 앱 공유) ──
  // v2: 4개 원본 목록(내지갑/관심지갑/지갑별칭 등)은 이제 alias를 저장하지 않는다.
  // 이 함수는 과거에 각 목록에 남아있던 alias를 문서 수정시각(updatedAt) 기준 오래된 것→최신 순으로
  // 병합해 통합 보관소에 반영하고, 원본 4개 문서에서 alias 필드를 제거하는 1회성 정리 작업이다.
  // (개별 지갑 단위 수정시각은 원래 없어서, 문서 전체의 updatedAt을 최선의 근사치로 사용한다.)
  async function migrateAddressAliasesIfNeeded() {
    if (!piUser || !db) return;
    const ref = db.collection('pidex_address_aliases').doc(piUser);
    const snap = await ref.get();
    if (snap.exists && snap.data().migratedV2At) {
      addressAliases = snap.data().aliases || {};
      return;
    }
    const merged = { ...(snap.exists ? (snap.data().aliases || {}) : {}) };
    try {
      const refs = {
        trade: db.collection('pidex_trade_wallets').doc(piUser),
        watch: db.collection('pidex_watch_list').doc(piUser),
        pidex: db.collection('pidex_wallets').doc(piUser),
        hack:  db.collection('hack_pending_wallets').doc(piUser),
      };
      const [tradeDoc, watchDoc, pidexDoc, hackDoc] = await Promise.all([
        refs.trade.get(), refs.watch.get(), refs.pidex.get(), refs.hack.get(),
      ]);
      const docs = {
        trade: { doc: tradeDoc, list: tradeDoc.exists ? (tradeDoc.data().mainnet || []) : [] },
        watch: { doc: watchDoc, list: watchDoc.exists ? (watchDoc.data().watchList || []) : [] },
        pidex: { doc: pidexDoc, list: pidexDoc.exists ? (pidexDoc.data().wallets || []) : [] },
        hack:  { doc: hackDoc,  list: hackDoc.exists  ? (hackDoc.data().wallets || [])  : [] },
      };
      // 문서의 updatedAt(없으면 0 = 가장 오래된 것으로 취급) 기준 오름차순 정렬 후, 늦게 수정된 목록이 나중에 덮어씀
      const order = Object.entries(docs).sort((a, b) => {
        const ta = a[1].doc.exists ? (a[1].doc.data().updatedAt?.toMillis?.() ?? 0) : 0;
        const tb = b[1].doc.exists ? (b[1].doc.data().updatedAt?.toMillis?.() ?? 0) : 0;
        return ta - tb;
      });
      for (const [, { list }] of order) {
        for (const w of list) if (w.address && w.alias) merged[w.address] = w.alias;
      }

      // 원본 4개 문서에서 alias 필드 제거 (통합 보관소만 진짜 저장소로 남김)
      const strip = (list) => list.map(w => {
        const { alias, ...rest } = w;
        return rest;
      });
      const writes = [];
      if (tradeDoc.exists) writes.push(refs.trade.set({ mainnet: strip(docs.trade.list) }, { merge: true }));
      if (watchDoc.exists) writes.push(refs.watch.set({ watchList: strip(docs.watch.list) }, { merge: true }));
      if (pidexDoc.exists) writes.push(refs.pidex.set({ wallets: strip(docs.pidex.list) }, { merge: true }));
      if (hackDoc.exists)  writes.push(refs.hack.set({ wallets: strip(docs.hack.list) }, { merge: true }));
      await Promise.all(writes);
    } catch { /* 마이그레이션 실패해도 이번 세션은 계속 진행 */ }

    addressAliases = merged;
    try {
      await ref.set({ aliases: merged, migratedV2At: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    } catch { /* 저장 실패해도 이번 세션 메모리상 별칭은 사용 가능 */ }
  }

  async function setAddressAlias(address, alias) {
    if (!piUser || !db || !address) return;
    try {
      await db.collection('pidex_address_aliases').doc(piUser).set({
        aliases: { [address]: alias },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      addressAliases = { ...addressAliases, [address]: alias };
    } catch { /* 실패해도 각 목록 자체의 alias로 계속 표시되므로 무시 */ }
  }

  // ── 지갑별칭 탭 (상대방 주소 별칭 등록, 서버가 원본 — pidex_trade_wallets) ──
  async function fetchTradeWalletsServer() {
    const key = piUser;
    if (!key || !db) return null;
    try {
      const doc = await db.collection('pidex_trade_wallets').doc(key).get();
      return doc.exists ? (doc.data().mainnet || []) : [];
    } catch { return null; }
  }

  async function saveTradeWalletsServer(list) {
    const key = piUser;
    if (!key || !db) throw new Error('no_login');
    await db.collection('pidex_trade_wallets').doc(key).set({
      mainnet: list,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async function renderTradeTab() {
    const container2 = container.querySelector('#trk-trade-content');
    container2.innerHTML = `<p style="color:#888;padding:12px 0;">⏳ ${tt('mywallet.loading')}</p>`;

    if (!piUser) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;">${tt('ctx.pidex.no_login')}</p>
        </div>`;
      return;
    }

    const list = await fetchTradeWalletsServer();
    if (list === null) {
      container2.innerHTML = `
        <div class="trk-card" style="text-align:center;padding:24px 16px;">
          <p style="color:#f87171;margin-bottom:12px;">${tt('mywallet.load.fail')}</p>
          <button class="trk-btn-outline" id="trk-trade-retry" style="width:auto;padding:0 20px;">↻ ${tt('mywallet.refresh')}</button>
        </div>`;
      container2.querySelector('#trk-trade-retry')?.addEventListener('click', renderTradeTab);
      return;
    }

    container2.innerHTML = `
      <div class="trk-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;">${tt('trade.title')} <span style="font-size:11px;color:#888;font-weight:400;">${tt2('watch.max_hint', { n: TRADE_MAX })}</span></h3>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:#888;">${list.length}/${TRADE_MAX}</span>
            <button class="trk-btn-outline trk-btn-sm" id="trk-trade-backup" style="width:auto;padding:0 12px;">☁️</button>
          </div>
        </div>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">${tt('trade.desc')}</p>
        <div id="trk-trade-list-rows">
          ${list.length === 0
            ? `<p style="color:#888;">${tt('trade.empty')}</p>`
            : list.map(w => `
                <div class="trk-watch-row">
                  <div>
                    <span class="trk-watch-alias">${esc(aliasFor(w.address) || w.alias)}</span>
                    <span class="trk-watch-addr trk-copy-addr" data-copy-addr="${esc(w.address)}">${esc(w.address.slice(0,4))}···${esc(w.address.slice(-3))}</span>
                  </div>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <button class="trk-trade-method-btn" data-tid="${w.id}" style="font-size:11px;padding:2px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:${w.costingMethod ? 'rgba(108,92,231,0.2)' : 'transparent'};color:${w.costingMethod ? 'var(--primary,#6c5ce7)' : '#888'};">${w.costingMethod === 'fifo' ? tt('tax.method.fifo_short') : w.costingMethod === 'moving_avg' ? tt('tax.method.avg_short') : tt('tax.method.unset')}</button>
                    <button class="trk-trade-edit-btn" data-tid="${w.id}">✏️</button>
                    <button class="trk-trade-del-btn" data-tid="${w.id}">✕</button>
                  </div>
                </div>`).join('')}
        </div>
        ${list.length < TRADE_MAX ? `<button class="trk-btn-outline" id="trk-btn-trade-add" style="width:100%;margin-top:12px;">+ ${tt('watch.add.btn')}</button>` : ''}
      </div>`;

    container2.querySelectorAll('.trk-trade-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = list.find(x => x.id === btn.dataset.tid);
        if (w) showTradeAliasDialog(w, list, () => renderTradeTab());
      });
    });

    container2.querySelectorAll('.trk-trade-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = list.find(x => x.id === btn.dataset.tid);
        if (w) showCostingMethodDialog(w, list, () => renderTradeTab());
      });
    });

    container2.querySelectorAll('.trk-trade-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const updated = list.filter(w => w.id !== btn.dataset.tid);
          await saveTradeWalletsServer(updated);
          renderTradeTab();
        } catch { showToast(tt('watch.cloud.fail')); btn.disabled = false; }
      });
    });

    container2.querySelector('#trk-btn-trade-add')?.addEventListener('click', () => {
      showTradeAddDialog(list, () => renderTradeTab());
    });

    container2.querySelector('#trk-trade-backup').addEventListener('click', () => {
      openBackupModal('trade', list, TRADE_MAX, async (newList) => {
        await saveTradeWalletsServer(newList);
        renderTradeTab();
      });
    });
  }

  function showTradeAliasDialog(entry, currentList, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:300px;">
        <div class="modal-header"><span>${tt('mywallet.alias.edit')}</span></div>
        <div style="padding:16px;">
          <input type="text" id="trk-ta-input" class="form-input" value="${esc(aliasFor(entry.address) || entry.alias)}" />
          <p id="trk-ta-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-ta-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-ta-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-ta-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-ta-input').select();
    overlay.querySelector('#trk-ta-save').onclick = async () => {
      const alias   = overlay.querySelector('#trk-ta-input').value.trim();
      const errEl   = overlay.querySelector('#trk-ta-err');
      const saveBtn = overlay.querySelector('#trk-ta-save');
      if (!alias) return;
      saveBtn.disabled = true;
      try {
        await setAddressAlias(entry.address, alias);
        overlay.remove();
        onSaved();
      } catch {
        errEl.textContent = tt('watch.cloud.fail');
        saveBtn.disabled = false;
      }
    };
  }

  // 상대 지갑에 세금계산 방식(FIFO/이동평균) 태그 — showTradeAliasDialog와 같은 모달 골격, 입력 대신 방식 선택
  function showCostingMethodDialog(entry, currentList, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const methods = [
      { id: 'fifo',       label: tt('tax.method.fifo') },
      { id: 'moving_avg', label: tt('tax.method.moving_avg') },
    ];
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header"><span>${tt('tax.tag_dialog.title')}</span></div>
        <div style="padding:16px;">
          <p style="font-size:12px;color:#888;margin:0 0 12px;">${esc(aliasFor(entry.address) || entry.alias)}</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${methods.map(m => `
              <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;cursor:pointer;">
                <input type="radio" name="trk-cm-method" value="${m.id}" ${entry.costingMethod === m.id ? 'checked' : ''} />
                <span>${m.label}</span>
              </label>`).join('')}
          </div>
          <p style="font-size:11px;color:#888;margin-top:10px;">${tt('tax.method.hint')}</p>
          <p id="trk-cm-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-cm-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-cm-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-cm-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-cm-save').onclick = async () => {
      const selected = overlay.querySelector('input[name="trk-cm-method"]:checked')?.value;
      const errEl    = overlay.querySelector('#trk-cm-err');
      const saveBtn  = overlay.querySelector('#trk-cm-save');
      if (!selected) { errEl.textContent = tt('tax.method.hint'); return; }
      saveBtn.disabled = true;
      try {
        const res = await upsertTradeWallet(entry.address, { costingMethod: selected });
        if (!res.ok) { errEl.textContent = tt('watch.cloud.fail'); saveBtn.disabled = false; return; }
        overlay.remove();
        onSaved();
      } catch {
        errEl.textContent = tt('watch.cloud.fail');
        saveBtn.disabled = false;
      }
    };
  }

  function showTradeAddDialog(currentList, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header"><span>${tt('trade.add.title')}</span></div>
        <div style="padding:16px;">
          <input id="trk-t-addr" type="text" class="form-input mono" placeholder="${tt('mywallet.add.addr_ph')}" style="margin-bottom:8px;" />
          <input id="trk-t-alias" type="text" class="form-input" placeholder="${tt('ctx.watch.alias_ph')}" maxlength="20" />
          <div id="trk-t-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-t-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-t-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-t-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-t-save').onclick = async () => {
      const addr  = overlay.querySelector('#trk-t-addr').value.trim();
      const alias = overlay.querySelector('#trk-t-alias').value.trim() || aliasFor(addr) || `${addr.slice(0,6)}···${addr.slice(-4)}`;
      const err   = overlay.querySelector('#trk-t-err');
      const saveBtn = overlay.querySelector('#trk-t-save');
      if (!addr || addr.length < 10) { err.textContent = tt('watch.add.err_addr'); return; }
      if (currentList.some(w => w.address === addr)) { err.textContent = tt('mywallet.add.err_dup'); return; }
      if (currentList.length >= TRADE_MAX) { err.textContent = tt2('trade.add.err_full', { n: TRADE_MAX }); return; }
      saveBtn.disabled = true;
      try {
        const updated = [...currentList, { id: genTradeId(), address: addr }];
        await saveTradeWalletsServer(updated);
        await setAddressAlias(addr, alias);
        overlay.remove();
        onSaved();
      } catch { err.textContent = tt('watch.cloud.fail'); saveBtn.disabled = false; }
    };
  }

  // ── 주소 컨텍스트 메뉴 ───────────────────────────────
  let menuAddr = '', menuDismissing = false, menuTagEligible = false;

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
      menuTagEligible = el.classList.contains('trk-tag-ok');
      updateAddrMenu().catch(() => {});
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

    async function updateAddrMenu() {
      const askedAddr = menuAddr;
      const watchBtn = container.querySelector('#trk-amenu-watch');
      const tradeBtn = container.querySelector('#trk-amenu-trade');
      watchBtn.textContent = `👁 ${tt('ctx.watch')}...`;
      watchBtn.disabled = true;
      tradeBtn.textContent = `🏷️ ${tt('ctx.trade')}...`;
      tradeBtn.disabled = true;
      container.querySelector('#trk-amenu-pidex').textContent = `📥 ${tt('ctx.register.both')}`;
      container.querySelector('#trk-amenu-copy').textContent  = `📋 ${tt('toast.copied')}`;
      const tagBtn = container.querySelector('#trk-amenu-tag');
      tagBtn.classList.toggle('hidden', !menuTagEligible);
      tagBtn.textContent = `🏷️ ${tt('tax.tag_dialog.title')}`;

      const [watch, trade] = await Promise.all([fetchWatchListServer(), fetchTradeWalletsServer()]);
      if (menuAddr !== askedAddr) return; // 메뉴가 다른 주소로 다시 열린 경우 무시

      if (watch === null) { watchBtn.textContent = `👁 ${tt('watch.load.fail')}`; }
      else {
        const slots = WATCH_MAX - watch.length;
        const alreadyIn = watch.some(w => w.address === menuAddr);
        watchBtn.textContent = alreadyIn ? `✅ ${tt('ctx.watch.exists')}` : `👁 ${tt('ctx.watch')} (${tt2('ctx.watch.slot', { n: slots })})`;
        watchBtn.disabled = alreadyIn || slots === 0;
      }

      if (trade === null) { tradeBtn.textContent = `🏷️ ${tt('mywallet.load.fail')}`; }
      else {
        const tAlreadyIn = trade.some(w => w.address === menuAddr);
        tradeBtn.textContent = tAlreadyIn ? `✅ ${tt('ctx.watch.exists')}` : `🏷️ ${tt('ctx.trade')}`;
        tradeBtn.disabled = tAlreadyIn || trade.length >= TRADE_MAX;
      }
    }

    container.querySelector('#trk-amenu-watch').addEventListener('click', () => { const addr = menuAddr; hideAddrMenu(); addToWatchList(addr); });
    container.querySelector('#trk-amenu-trade').addEventListener('click', () => { const addr = menuAddr; hideAddrMenu(); addToTradeWalletsQuick(addr); });
    container.querySelector('#trk-amenu-tag').addEventListener('click', () => { const addr = menuAddr; hideAddrMenu(); showAddressTagDialog(addr); });
    container.querySelector('#trk-amenu-pidex').addEventListener('click', () => {
      const addr = menuAddr;
      hideAddrMenu();
      sendToPidexWallet(addr, aliasFor(addr) || `★${addr.slice(0,6)}···${addr.slice(-4)}`);
    });
    container.querySelector('#trk-amenu-copy').addEventListener('click', () => {
      const addr = menuAddr;
      hideAddrMenu();
      navigator.clipboard.writeText(addr).then(() => showToast(tt('toast.copied'))).catch(() => {});
    });
  }

  async function addToTradeWalletsQuick(addr) {
    if (!addr) return;
    const alias = aliasFor(addr) || `${addr.slice(0,6)}···${addr.slice(-4)}`;
    try {
      const list = await fetchTradeWalletsServer();
      if (list === null) { showToast(tt('mywallet.load.fail')); return; }
      if (list.some(w => w.address === addr)) { showToast(tt('ctx.watch.exists')); return; }
      if (list.length >= TRADE_MAX) { showToast(tt2('trade.add.err_full', { n: TRADE_MAX })); return; }
      const updated = [...list, { id: genTradeId(), address: addr }];
      await saveTradeWalletsServer(updated);
      await setAddressAlias(addr, alias);
      showToast(`🏷️ ${alias} ${tt('ctx.watch.added')}`);
    } catch { showToast(tt('watch.cloud.fail')); }
  }

  // 지갑별칭 목록에 없으면 추가, 있으면 costingMethod만 갱신 (거래내역에서 바로 태그할 때 사용)
  async function upsertTradeWallet(addr, { alias, costingMethod } = {}) {
    const list = await fetchTradeWalletsServer();
    if (list === null) return { ok: false, reason: 'load_fail' };
    const existing = list.find(w => w.address === addr);
    let updated;
    if (existing) {
      updated = list.map(w => w.id === existing.id ? { ...w, ...(costingMethod !== undefined ? { costingMethod } : {}) } : w);
    } else {
      if (list.length >= TRADE_MAX) return { ok: false, reason: 'full' };
      updated = [...list, { id: genTradeId(), address: addr, ...(costingMethod !== undefined ? { costingMethod } : {}) }];
    }
    await saveTradeWalletsServer(updated);
    if (alias) await setAddressAlias(addr, alias);
    return { ok: true };
  }

  // 별칭이 없으면 먼저 입력받고, 상대주소에 세금계산 방식(FIFO/이동평균)을 태그 — 거래내역 어디서든 진입 가능
  async function showAddressTagDialog(addr) {
    const existingAlias = aliasFor(addr);
    const list = await fetchTradeWalletsServer();
    const existing = list?.find(w => w.address === addr);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const methods = [
      { id: 'fifo',       label: tt('tax.method.fifo') },
      { id: 'moving_avg', label: tt('tax.method.moving_avg') },
    ];
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header"><span>${tt('tax.tag_dialog.title')}</span></div>
        <div style="padding:16px;">
          ${existingAlias
            ? `<p style="font-size:12px;color:#888;margin:0 0 12px;">${esc(existingAlias)}</p>`
            : `<input type="text" id="trk-tag-alias-input" class="form-input" value="${esc(`${addr.slice(0,6)}···${addr.slice(-4)}`)}" style="margin-bottom:12px;" />`}
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${methods.map(m => `
              <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;cursor:pointer;">
                <input type="radio" name="trk-tag-method" value="${m.id}" ${existing?.costingMethod === m.id ? 'checked' : ''} />
                <span>${m.label}</span>
              </label>`).join('')}
          </div>
          <p style="font-size:11px;color:#888;margin-top:10px;">${tt('tax.method.hint')}</p>
          <p id="trk-tag-err" style="font-size:12px;color:#f87171;min-height:16px;margin-top:4px;"></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-outline" id="trk-tag-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-tag-save" style="flex:1;">${tt('ctx.save')}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#trk-tag-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#trk-tag-alias-input')?.select();
    overlay.querySelector('#trk-tag-save').onclick = async () => {
      const selected   = overlay.querySelector('input[name="trk-tag-method"]:checked')?.value;
      const aliasInput = overlay.querySelector('#trk-tag-alias-input');
      const alias      = aliasInput ? aliasInput.value.trim() : null;
      const errEl      = overlay.querySelector('#trk-tag-err');
      const saveBtn    = overlay.querySelector('#trk-tag-save');
      if (aliasInput && !alias) { errEl.textContent = tt('watch.cloud.fail'); return; }
      if (!selected) { errEl.textContent = tt('tax.method.hint'); return; }
      saveBtn.disabled = true;
      try {
        const res = await upsertTradeWallet(addr, { alias, costingMethod: selected });
        if (!res.ok) {
          errEl.textContent = res.reason === 'full' ? tt2('trade.add.err_full', { n: TRADE_MAX }) : tt('watch.cloud.fail');
          saveBtn.disabled = false;
          return;
        }
        overlay.remove();
        showToast(`🏷️ ${alias || existingAlias} ${tt('ctx.watch.added')}`);
      } catch {
        errEl.textContent = tt('watch.cloud.fail');
        saveBtn.disabled = false;
      }
    };
  }

  function hideAddrMenu() {
    container.querySelector('#trk-addr-menu').classList.add('hidden');
    menuAddr = '';
  }

  async function addToWatchList(addr) {
    if (!addr) return;
    const alias = aliasFor(addr) || `👁${addr.slice(0,6)}···${addr.slice(-4)}`;

    const doAdd = async () => {
      try {
        const list = await fetchWatchListServer();
        if (list === null) { showToast(tt('watch.load.fail')); return; }
        if (list.some(w => w.address === addr)) { showToast(tt('ctx.watch.exists')); return; }
        if (list.length >= WATCH_MAX) { showToast(tt('ctx.watch.full')); return; }
        const updated = [...list, { id: genWatchId(), address: addr }];
        await saveWatchListServer(updated);
        await setAddressAlias(addr, alias);
        showToast(`👁 ${alias} ${tt('ctx.watch.added')}`);
      } catch { showToast(tt('watch.cloud.fail')); }
    };

    const active = await isWalletActive(addr);
    if (active) {
      await doAdd();
    } else {
      showConfirmDialog(tt('mywallet.not_activated.icon_title'), tt('mywallet.not_activated.confirm'), doAdd, tt('ctx.continue'));
    }
  }

  // 파이덱스 유틸 테스트넷 지갑 (pidex_wallets 컬렉션, 서버가 원본)
  const PIDEX_WALLET_MAX = 30;

  async function registerInPidexWallet(username, address, alias) {
    if (!db || !username) throw new Error('no_login');
    const docRef = db.collection('pidex_wallets').doc(username);
    const doc     = await docRef.get();
    const wallets = doc.exists ? (doc.data().wallets || []) : [];
    if (wallets.some(w => w.address === address)) return 'duplicate';
    if (wallets.length >= PIDEX_WALLET_MAX) return 'full';
    wallets.push({ id: `p${Date.now()}`, address });
    await docRef.set({ wallets, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    await setAddressAlias(address, alias);
    return 'added';
  }

  async function sendToPidexWallet(addr, presetAlias) {
    if (!piUser) { showToast(tt('ctx.pidex.no_login')); return; }
    const alias = presetAlias || `★${addr.slice(0,6)}···${addr.slice(-4)}`;

    const doSend = async () => {
      try {
        const result = await registerInPidexWallet(piUser, addr, alias);
        if (result === 'added')          showToast(tt('ctx.both.sent'));
        else if (result === 'duplicate') showToast(tt('ctx.both.dup'));
        else if (result === 'full')      showToast(tt2('ctx.both.full', { n: PIDEX_WALLET_MAX }));
      } catch { showToast(tt('ctx.both.fail')); }
    };

    const active = await isWalletActive(addr);
    if (active) {
      await doSend();
    } else {
      showConfirmDialog(tt('mywallet.not_activated.icon_title'), tt('mywallet.not_activated.confirm'), doSend, tt('ctx.continue'));
    }
  }

  // ── 클라우드 백업/복구 (Google Cloud Storage, 슬롯 5개) ──
  function dedupeWalletsByAddress(list) {
    const seen = new Set();
    const out = [];
    for (const w of list) {
      if (seen.has(w.address)) continue;
      seen.add(w.address);
      out.push(w);
    }
    return out;
  }

  async function fetchBackupSlot(category, slot) {
    const res = await fetch('/api/backup/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: currentAccessToken, category, username: piUser, slot }),
    });
    if (!res.ok) throw new Error('backup get failed');
    return res.json();
  }

  async function putBackupSlot(category, slot, wallets) {
    const res = await fetch('/api/backup/put', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: currentAccessToken, category, username: piUser, slot, wallets }),
    });
    if (!res.ok) throw new Error('backup put failed');
    return res.json();
  }

  function openBackupModal(category, currentWallets, maxCount, onApplied) {
    if (!piUser) { showToast(tt('ctx.pidex.no_login')); return; }
    // 백업 슬롯은 예전 형식(alias 포함)일 수 있음 — 복원 시 alias는 통합 보관소로 보내고
    // 목록 자체엔 심지 않는다(단일 저장소 원칙 유지)
    const originalOnApplied = onApplied;
    onApplied = async (list) => {
      const stripped = list.map(w => {
        const { alias, ...rest } = w;
        if (w.address && alias) setAddressAlias(w.address, alias).catch(() => {});
        return rest;
      });
      return originalOnApplied(stripped);
    };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:380px;">
        <div class="modal-header"><span>☁️ ${tt('backup.title')}</span><button class="modal-close" id="bk-x">✕</button></div>
        <div style="padding:16px;max-height:70vh;overflow-y:auto;" id="bk-body">
          <p style="color:#888;font-size:13px;">${tt('mywallet.loading')}</p>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#bk-x').onclick = () => overlay.remove();

    const bodyEl = overlay.querySelector('#bk-body');
    let slotsData = [];

    async function loadSlots() {
      bodyEl.innerHTML = `<p style="color:#888;font-size:13px;">${tt('mywallet.loading')}</p>`;
      try {
        slotsData = await Promise.all([1, 2, 3, 4, 5].map(s => fetchBackupSlot(category, s)));
        renderSlots();
      } catch {
        bodyEl.innerHTML = `<p style="color:#f87171;font-size:13px;">${tt('backup.load_fail')}</p>`;
      }
    }

    function renderSlots() {
      bodyEl.innerHTML = slotsData.map((s, i) => {
        const slotNum = i + 1;
        const empty = !s.exists;
        const dateStr = empty ? '' : new Date(s.updatedAt).toLocaleString();
        const aliasPreview = empty ? '' : s.wallets.map(w => esc(w.alias)).join(', ');
        return `
          <div style="border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <b style="font-size:13px;">${tt2('backup.slot', { n: slotNum })}</b>
              <span style="font-size:11px;color:#888;">${empty ? tt('backup.empty') : tt2('backup.slot_info', { n: s.wallets.length, date: dateStr })}</span>
            </div>
            ${empty ? '' : `<div style="font-size:11px;color:#aaa;margin-bottom:8px;line-height:1.5;word-break:break-all;">${aliasPreview}</div>`}
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button class="trk-btn-outline trk-btn-sm" data-act="backup-full" data-slot="${slotNum}">${tt('backup.btn.full_backup')}</button>
              <button class="trk-btn-outline trk-btn-sm" data-act="backup-append" data-slot="${slotNum}">${tt('backup.btn.append_backup')}</button>
              <button class="trk-btn-outline trk-btn-sm" data-act="restore-full" data-slot="${slotNum}" ${empty ? 'disabled' : ''}>${tt('backup.btn.full_restore')}</button>
              <button class="trk-btn-outline trk-btn-sm" data-act="restore-append" data-slot="${slotNum}" ${empty ? 'disabled' : ''}>${tt('backup.btn.append_restore')}</button>
            </div>
          </div>`;
      }).join('');

      bodyEl.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => handleAction(btn.dataset.act, Number(btn.dataset.slot)));
      });
    }

    async function handleAction(act, slotNum) {
      const slotInfo = slotsData[slotNum - 1];

      if (act === 'backup-full') {
        const msg = slotInfo.exists ? tt2('backup.confirm.overwrite', { n: slotNum }) : tt2('backup.confirm.save', { n: slotNum });
        showConfirmDialog(tt('backup.title'), msg, async () => {
          try {
            await putBackupSlot(category, slotNum, currentWallets);
            showToast(tt('backup.saved'));
            loadSlots();
          } catch { showToast(tt('backup.fail')); }
        }, tt('backup.btn.full_backup'));
        return;
      }

      if (act === 'backup-append') {
        const existing = slotInfo.exists ? slotInfo.wallets : [];
        const merged = dedupeWalletsByAddress([...existing, ...currentWallets]);
        const doSave = async (list) => {
          try {
            await putBackupSlot(category, slotNum, list);
            showToast(tt('backup.saved'));
            loadSlots();
          } catch { showToast(tt('backup.fail')); }
        };
        if (merged.length > maxCount) {
          showConfirmDialog(
            tt('backup.title'),
            tt2('backup.confirm.truncate', { n: maxCount, dropped: merged.length - maxCount }),
            () => doSave(merged.slice(0, maxCount)),
            tt('ctx.continue')
          );
        } else {
          await doSave(merged);
        }
        return;
      }

      if (act === 'restore-full') {
        showConfirmDialog(tt('backup.title'), tt2('backup.confirm.restore_full', { n: slotNum }), async () => {
          const conflicts = findAliasConflicts(slotInfo.wallets);
          const proceed = async (useLatest) => {
            try {
              await onApplied(applyAliasChoice(slotInfo.wallets, conflicts, useLatest));
              overlay.remove();
            } catch { showToast(tt('backup.fail')); }
          };
          if (conflicts.length) showAliasConflictDialog(conflicts, proceed);
          else await proceed(false);
        }, tt('backup.btn.full_restore'));
        return;
      }

      if (act === 'restore-append') {
        const merged = dedupeWalletsByAddress([...currentWallets, ...slotInfo.wallets]);
        const doRestore = async (list) => {
          try {
            await onApplied(list);
            overlay.remove();
          } catch { showToast(tt('backup.fail')); }
        };
        const conflicts = findAliasConflicts(merged);
        const proceedWithChoice = async (useLatest) => {
          const finalList = applyAliasChoice(merged, conflicts, useLatest);
          if (finalList.length > maxCount) {
            showConfirmDialog(
              tt('backup.title'),
              tt2('backup.confirm.truncate', { n: maxCount, dropped: finalList.length - maxCount }),
              () => doRestore(finalList.slice(0, maxCount)),
              tt('ctx.continue')
            );
          } else {
            await doRestore(finalList);
          }
        };
        if (conflicts.length) showAliasConflictDialog(conflicts, proceedWithChoice);
        else await proceedWithChoice(false);
        return;
      }
    }

    function findAliasConflicts(list) {
      const conflicts = [];
      for (const w of list) {
        if (!w.address || !w.alias) continue;
        const current = addressAliases[w.address];
        if (current && current !== w.alias) conflicts.push({ address: w.address, current, backup: w.alias });
      }
      return conflicts;
    }

    function applyAliasChoice(list, conflicts, useLatest) {
      if (!useLatest || !conflicts.length) return list;
      const map = new Map(conflicts.map(c => [c.address, c.current]));
      return list.map(w => map.has(w.address) ? { ...w, alias: map.get(w.address) } : w);
    }

    function showAliasConflictDialog(conflicts, onChoice) {
      const box = document.createElement('div');
      box.className = 'modal-overlay';
      box.innerHTML = `
        <div class="modal-box" style="max-width:360px;">
          <div class="modal-header"><span>${tt('backup.alias_conflict.title')}</span></div>
          <div style="padding:16px;">
            <p style="font-size:13px;color:#ccc;line-height:1.6;margin-bottom:12px;">${tt2('backup.alias_conflict.desc', { n: conflicts.length })}</p>
            <div style="max-height:160px;overflow-y:auto;font-size:12px;color:#999;margin-bottom:14px;line-height:1.8;">
              ${conflicts.slice(0, 30).map(c => `<div>${esc(c.address.slice(0,4))}···${esc(c.address.slice(-3))}: <b style="color:#7dd3fc;">${esc(c.current)}</b> → ${esc(c.backup)}</div>`).join('')}
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn-primary" id="bkc-latest">${tt('backup.alias_conflict.keep_latest')}</button>
              <button class="btn-outline" id="bkc-backup">${tt('backup.alias_conflict.use_backup')}</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(box);
      box.querySelector('#bkc-latest').onclick = () => { box.remove(); onChoice(true); };
      box.querySelector('#bkc-backup').onclick = () => { box.remove(); onChoice(false); };
    }

    loadSlots();
  }

  // ── 유틸 다이얼로그 ───────────────────────────────────
  function showHackWalletAddDialog(currentWallets, onSaved) {
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
    overlay.querySelector('#trk-add-save').onclick   = async () => {
      const addr    = overlay.querySelector('#trk-add-addr').value.trim();
      const alias   = overlay.querySelector('#trk-add-alias').value.trim() || aliasFor(addr) || `Wallet ${currentWallets.length + 1}`;
      const errEl   = overlay.querySelector('#trk-add-err');
      const saveBtn = overlay.querySelector('#trk-add-save');
      if (!addr.startsWith('G') || addr.length !== 56) { errEl.textContent = tt('mywallet.add.err_addr'); return; }
      if (currentWallets.some(w => w.address === addr)) { errEl.textContent = tt('mywallet.add.err_dup'); return; }
      if (currentWallets.length >= HACK_WALLET_MAX) { errEl.textContent = tt('mywallet.add.err_full'); return; }
      saveBtn.disabled = true;

      const doSave = async () => {
        try {
          const wallet  = { id: genHackWalletId(), address: addr };
          const updated = [...currentWallets, wallet];
          await saveHackWalletsServer(updated);
          await setAddressAlias(addr, alias);
          setHackActiveId(wallet.id);
          overlay.remove();
          onSaved();
        } catch { errEl.textContent = tt('mywallet.cloud.fail'); saveBtn.disabled = false; }
      };

      const active = await isWalletActive(addr);
      if (active) {
        await doSave();
      } else {
        saveBtn.disabled = false;
        showConfirmDialog(tt('mywallet.not_activated.icon_title'), tt('mywallet.not_activated.confirm'), doSave, tt('ctx.continue'));
      }
    };
  }

  function showAliasDialog(wallet, allWallets, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:300px;">
        <div class="modal-header"><span>${tt('mywallet.alias.edit')}</span><button class="modal-close" id="trk-ea-x">✕</button></div>
        <div style="padding:16px;">
          <input type="text" id="trk-ea-input" class="form-input" value="${esc(aliasFor(wallet.address) || wallet.alias)}" />
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
    overlay.querySelector('#trk-ea-save').onclick   = async () => {
      const alias   = overlay.querySelector('#trk-ea-input').value.trim();
      const saveBtn = overlay.querySelector('#trk-ea-save');
      if (!alias) return;
      saveBtn.disabled = true;
      try {
        await setAddressAlias(wallet.address, alias);
        overlay.remove();
        onSaved();
      } catch { showToast(tt('mywallet.cloud.fail')); saveBtn.disabled = false; }
    };
  }

  function showConfirmDialog(title, body, onConfirmed, okLabel) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:300px;">
        <div class="modal-header"><span>${title}</span><button class="modal-close" id="trk-dlg-x">✕</button></div>
        <div style="padding:16px;">
          <p style="font-size:13px;margin-bottom:16px;line-height:1.5;">${body}</p>
          <div style="display:flex;gap:8px;">
            <button class="btn-outline" id="trk-dlg-cancel" style="flex:1;">${tt('ctx.cancel')}</button>
            <button class="btn-primary" id="trk-dlg-ok" style="flex:1;">${okLabel ?? tt('ctx.save')}</button>
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
