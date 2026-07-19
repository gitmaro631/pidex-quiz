// 관리자 전용 로컬 스크립트 — 절대 웹앱(page-tracker.js)이나 api/ 폴더에 넣지 말 것.
// 이 파일이 하는 일: wallet_ledger/{address}/entries 중 auto_price_src === 'daily'(일봉으로 폴백된 것)만 골라
// 유료 시세 API로 분봉 단가를 재조회해서 auto_price/auto_price_src만 덮어씀. manual_price는 절대 건드리지 않음.
//
// 실행 전 준비:
//   1) cd scripts && npm install
//   2) Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 키(JSON) 발급 → scripts/serviceAccountKey.json 으로 저장 (.gitignore에 이미 포함됨)
//   3) 유료 API 키가 준비되면 아래 fetchPaidMinutePrice()의 TODO 부분을 채울 것
//
// 실행:
//   node scripts/upgrade-price.js --address G... [--asset π] [--list] [--dry-run]
//   --list      실제로 아무것도 안 하고, 일봉으로 폴백된 엔트리 개수만 보여줌 (유료 API 연동 전에도 사용 가능)
//   --dry-run   유료 API까지 호출은 하되 Firestore에 쓰지는 않고 결과만 출력
//   --asset     생략하면 해당 지갑의 모든 자산 대상

const admin = require('firebase-admin');
const path  = require('path');

const ADMIN_USERNAME = 'cam1998pi'; // page-tracker.js 등 앱 전체에서 쓰는 것과 동일한 값
const LEDGER_COL      = 'wallet_ledger'; // page-tracker.js와 동일한 컬렉션명 — 반드시 일치해야 함

function parseArgs(argv) {
  const args = { list: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--address') args.address = argv[++i];
    else if (a === '--asset') args.asset = argv[++i];
    else if (a === '--username') args.username = argv[++i];
    else if (a === '--list') args.list = true;
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

// ── TODO: 유료 API 연동 지점 ────────────────────────────────────────
// OKX 유료 시세 API 정보를 받으면 여기만 채우면 됨.
// 반환 형식: { price: number } | null (해당 시각 근처 캔들을 못 찾으면 null)
async function fetchPaidMinutePrice(asset, timestampMs) {
  throw new Error(
    `fetchPaidMinutePrice()가 아직 구현되지 않았습니다 (asset=${asset}, ts=${timestampMs}). ` +
    `유료 API 키/엔드포인트 정보를 알려주시면 이 함수만 채우면 됩니다.`
  );
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if ((args.username ?? ADMIN_USERNAME) !== ADMIN_USERNAME) {
    console.error('관리자 계정이 아닙니다. 종료합니다.');
    process.exit(1);
  }
  if (!args.address) {
    console.error('사용법: node scripts/upgrade-price.js --address G... [--asset π] [--list] [--dry-run]');
    process.exit(1);
  }

  const db = initFirebaseAdmin();
  const entriesRef = db.collection(LEDGER_COL).doc(args.address).collection('entries');

  const snap = await entriesRef.where('auto_price_src', '==', 'daily').get();
  let targets = snap.docs;
  if (args.asset) {
    targets = targets.filter(d => {
      const data = d.data();
      return data.asset === args.asset || data.dest_asset === args.asset || data.send_asset === args.asset;
    });
  }

  console.log(`지갑 ${args.address} — 일봉 폴백 엔트리 ${targets.length}건 발견${args.asset ? ` (자산: ${args.asset})` : ''}`);
  if (args.list || targets.length === 0) return;

  let upgraded = 0, failed = 0;
  for (const doc of targets) {
    const data  = doc.data();
    const asset = data.asset || data.dest_asset || data.send_asset;
    const ts    = new Date(data.created_at).getTime();
    try {
      const result = await fetchPaidMinutePrice(asset, ts);
      if (!result) { failed++; continue; }
      console.log(`  ${doc.id} (${asset} @ ${data.created_at}) → ${result.price}`);
      if (!args.dryRun) {
        await doc.ref.set({ auto_price: result.price, auto_price_src: '1m_paid' }, { merge: true });
        // manual_price 필드는 이 payload에 없으므로 절대 덮어써지지 않음
      }
      upgraded++;
    } catch (e) {
      console.error(`  ${doc.id} 실패: ${e.message}`);
      failed++;
    }
  }

  console.log(`완료 — 성공 ${upgraded}건, 실패/스킵 ${failed}건${args.dryRun ? ' (dry-run, Firestore 미반영)' : ''}`);
}

main().catch(e => { console.error(e); process.exit(1); });
