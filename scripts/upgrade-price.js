// 관리자 전용 로컬 스크립트 — 절대 웹앱(page-tracker.js)이나 api/ 폴더에 넣지 말 것.
// 이 파일이 하는 일: wallet_ledger/{address}/entries 중 auto_price_src === 'daily'(일봉으로 폴백된 것)만 골라
// download-candles.js로 미리 받아둔 로컬 1분봉(scripts/candles.db)에서 정확한 단가를 찾아 auto_price/auto_price_src만
// 덮어씀. manual_price는 절대 건드리지 않음.
//
// 실행 전 준비:
//   1) cd scripts && npm install
//   2) Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 키(JSON) 발급 → scripts/serviceAccountKey.json 으로 저장 (.gitignore에 이미 포함됨)
//   3) node scripts/download-candles.js --pair PI-USDT 로 candles.db를 먼저 채워둘 것
//
// 실행:
//   node scripts/upgrade-price.js --address G... [--asset π] [--list] [--dry-run]
//   node scripts/upgrade-price.js --all [--asset π] [--list] [--dry-run]
//   --all       hack_pending_wallets(QuizPi 내 지갑)에 등록된 모든 유저의 모든 지갑을 일괄 처리
//   --list      실제로 아무것도 안 하고, 일봉으로 폴백된 엔트리 개수만 보여줌
//   --dry-run   로컬 DB 조회까지 하되 Firestore에 쓰지는 않고 결과만 출력
//   --asset     생략하면 해당 지갑의 모든 자산 대상

const admin = require('firebase-admin');
const path  = require('path');
const { DatabaseSync } = require('node:sqlite'); // Node 22+ 내장 — 별도 설치/컴파일 필요 없음

const ADMIN_USERNAME = 'cam1998pi'; // page-tracker.js 등 앱 전체에서 쓰는 것과 동일한 값
const LEDGER_COL      = 'wallet_ledger'; // page-tracker.js와 동일한 컬렉션명 — 반드시 일치해야 함
const ASSET_OKX_PAIR  = { 'π': 'PI-USDT', 'GRAM': 'GRAM-USDT' }; // page-tracker.js의 ASSET_OKX_SYMBOL과 동일하게 유지
const MAX_GAP_MS       = 6 * 60 * 60 * 1000; // 가장 가까운 캔들이 6시간 넘게 떨어져 있으면 신뢰 안 함(null 처리)

function parseArgs(argv) {
  const args = { list: false, dryRun: false, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--address') args.address = argv[++i];
    else if (a === '--asset') args.asset = argv[++i];
    else if (a === '--username') args.username = argv[++i];
    else if (a === '--list') args.list = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--all') args.all = true;
  }
  return args;
}

// hack_pending_wallets(QuizPi 내 지갑) 전체 유저 문서에서 등록된 지갑 주소를 모두 모아 중복 제거
async function collectAllWalletAddresses(db) {
  const snap = await db.collection('hack_pending_wallets').get();
  const addrSet = new Set();
  snap.docs.forEach(doc => {
    const wallets = doc.data().wallets || [];
    wallets.forEach(w => { if (w.address) addrSet.add(w.address); });
  });
  return [...addrSet];
}

// ── 로컬 1분봉 조회 ──────────────────────────────────────────────
// candles.db(download-candles.js로 미리 채워둔 것)에서 해당 시각 이전 가장 가까운 1분봉을 찾는다.
// 반환 형식: { price: number } | null (매핑 안 된 자산이거나, 근처 캔들이 없거나 너무 멀리 떨어진 경우)
let _candlesDb = null;
function getCandlesDb() {
  if (_candlesDb) return _candlesDb;
  const dbPath = path.join(__dirname, 'candles.db');
  try {
    _candlesDb = new DatabaseSync(dbPath, { readOnly: true });
  } catch {
    console.error(`candles.db를 찾을 수 없습니다: ${dbPath}`);
    console.error('먼저 node scripts/download-candles.js --pair PI-USDT 로 받아두세요.');
    process.exit(1);
  }
  return _candlesDb;
}

async function fetchLocalMinutePrice(asset, timestampMs) {
  const pair = ASSET_OKX_PAIR[asset];
  if (!pair) return null;
  const db  = getCandlesDb();
  const row = db.prepare(
    'SELECT ts, close FROM candles WHERE pair = ? AND ts <= ? ORDER BY ts DESC LIMIT 1'
  ).get(pair, timestampMs);
  if (!row) return null;
  if (timestampMs - row.ts > MAX_GAP_MS) return null; // 너무 오래된(구간 미보유) 캔들은 신뢰 안 함
  return { price: row.close };
}
// ────────────────────────────────────────────────────────────────

function initFirebaseAdmin() {
  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  let serviceAccount;
  try {
    serviceAccount = require(keyPath);
  } catch {
    console.error(`서비스 계정 키를 찾을 수 없습니다: ${keyPath}`);
    console.error('Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 에서 발급받아 저장하세요.');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

async function processWallet(db, address, args) {
  const entriesRef = db.collection(LEDGER_COL).doc(address).collection('entries');

  const snap = await entriesRef.where('auto_price_src', '==', 'daily').get();
  let targets = snap.docs;
  if (args.asset) {
    targets = targets.filter(d => {
      const data = d.data();
      return data.asset === args.asset || data.dest_asset === args.asset || data.send_asset === args.asset;
    });
  }

  console.log(`지갑 ${address} — 일봉 폴백 엔트리 ${targets.length}건 발견${args.asset ? ` (자산: ${args.asset})` : ''}`);
  if (args.list || targets.length === 0) return { found: targets.length, upgraded: 0, failed: 0 };

  let upgraded = 0, failed = 0;
  for (const doc of targets) {
    const data  = doc.data();
    const asset = data.asset || data.dest_asset || data.send_asset;
    const ts    = new Date(data.created_at).getTime();
    try {
      const result = await fetchLocalMinutePrice(asset, ts);
      if (!result) { failed++; continue; }
      console.log(`  ${doc.id} (${asset} @ ${data.created_at}) → ${result.price}`);
      if (!args.dryRun) {
        await doc.ref.set({ auto_price: result.price, auto_price_src: '1m_local' }, { merge: true });
        // manual_price 필드는 이 payload에 없으므로 절대 덮어써지지 않음
      }
      upgraded++;
    } catch (e) {
      console.error(`  ${doc.id} 실패: ${e.message}`);
      failed++;
    }
  }

  console.log(`  → 지갑 ${address} 완료 — 성공 ${upgraded}건, 실패/스킵 ${failed}건`);
  return { found: targets.length, upgraded, failed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if ((args.username ?? ADMIN_USERNAME) !== ADMIN_USERNAME) {
    console.error('관리자 계정이 아닙니다. 종료합니다.');
    process.exit(1);
  }
  if (!args.address && !args.all) {
    console.error('사용법: node scripts/upgrade-price.js (--address G... | --all) [--asset π] [--list] [--dry-run]');
    process.exit(1);
  }

  const db = initFirebaseAdmin();

  if (!args.all) {
    await processWallet(db, args.address, args);
    return;
  }

  const addresses = await collectAllWalletAddresses(db);
  console.log(`QuizPi 내 지갑에 등록된 주소 ${addresses.length}개 발견 — 일괄 처리 시작\n`);

  let totalFound = 0, totalUpgraded = 0, totalFailed = 0;
  for (const address of addresses) {
    const r = await processWallet(db, address, args);
    totalFound += r.found; totalUpgraded += r.upgraded; totalFailed += r.failed;
  }

  console.log(`\n전체 완료 — 지갑 ${addresses.length}개, 발견 ${totalFound}건, 성공 ${totalUpgraded}건, 실패/스킵 ${totalFailed}건${args.dryRun ? ' (dry-run, Firestore 미반영)' : ''}`);
}

main().catch(e => { console.error(e); process.exit(1); });
