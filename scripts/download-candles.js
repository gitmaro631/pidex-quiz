// 관리자 전용 로컬 스크립트 — 절대 웹앱(page-tracker.js)이나 api/ 폴더에 넣지 말 것.
// OKX 무료 공개 API(history-candles)로 1분봉을 받아 로컬 SQLite(scripts/candles.db)에 저장한다.
// 유료 API가 필요 없다 — 상장일까지 페이지네이션으로 계속 과거로 내려받을 수 있다.
//
// 항상 "지금"에서 과거로 페이지를 넘기면서 저장하고, 이미 저장된 캔들만 나오는 페이지를 만나면
// (= 지난 실행 이후 새로 생긴 분봉까지만 이어받은 것) 자동으로 멈춘다 — 그래서 매일 그냥 다시 실행하면
// 최신분만 이어받는 "일일 업데이트"가 되고, 처음 실행하면(DB가 비어있으니) 자연스럽게 상장일까지 전체 백필된다.
// --full을 주면 이미 저장된 구간을 만나도 멈추지 않고 끝까지(상장일까지) 계속 진행한다 — 결측 구간 점검용.
//
// 실행 전 준비:
//   cd scripts && npm install
// 실행:
//   node scripts/download-candles.js --pair PI-USDT
//   node scripts/download-candles.js --pair GRAM-USDT --full

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH          = path.join(__dirname, 'candles.db');
const BAR               = '1m';
const PAGE_LIMIT        = 100;
const REQUEST_DELAY_MS  = 300; // OKX 공개 API 레이트리밋 여유

function parseArgs(argv) {
  const args = { full: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--pair') args.pair = argv[++i];
    else if (argv[i] === '--full') args.full = true;
  }
  return args;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function openDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS candles (
      pair   TEXT    NOT NULL,
      ts     INTEGER NOT NULL,
      open   REAL, high REAL, low REAL, close REAL, volume REAL,
      PRIMARY KEY (pair, ts)
    );
  `);
  return db;
}

async function fetchPage(pair, after) {
  let url = `https://www.okx.com/api/v5/market/history-candles?instId=${pair}&bar=${BAR}&limit=${PAGE_LIMIT}`;
  if (after) url += `&after=${after}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OKX API error (${res.status})`);
  const json = await res.json();
  if (json.code !== '0') throw new Error(json.msg || 'OKX API error');
  return json.data; // [[ts, open, high, low, close, vol, ...], ...] 최신순(내림차순)
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pair) {
    console.error('사용법: node scripts/download-candles.js --pair PI-USDT [--full]');
    process.exit(1);
  }

  const db = openDb();
  const existsStmt = db.prepare('SELECT 1 FROM candles WHERE pair = ? AND ts = ?');
  const insert = db.prepare(`
    INSERT OR IGNORE INTO candles (pair, ts, open, high, low, close, volume)
    VALUES (@pair, @ts, @open, @high, @low, @close, @volume)
  `);
  const insertMany = db.transaction((items) => {
    for (const c of items) {
      insert.run({
        pair: args.pair,
        ts: parseInt(c[0], 10),
        open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]),
        volume: parseFloat(c[5]),
      });
    }
  });

  let after;
  let totalNew = 0;
  let page = 0;

  while (true) {
    page++;
    const rows = await fetchPage(args.pair, after);
    if (!rows || rows.length === 0) {
      console.log('더 이상 과거 데이터 없음 — 상장일까지 전체 다운로드 완료');
      break;
    }

    const newCount = rows.filter(c => !existsStmt.get(args.pair, parseInt(c[0], 10))).length;
    insertMany(rows);
    totalNew += newCount;

    const oldestInPage = Math.min(...rows.map(c => parseInt(c[0], 10)));
    console.log(`페이지 ${page}: 신규 ${newCount}건 (가장 오래된 시점: ${new Date(oldestInPage).toISOString()})`);

    if (newCount === 0 && !args.full) {
      console.log('이미 저장된 구간과 이어짐 — 최신 데이터까지 반영 완료 (전체 재확인은 --full)');
      break;
    }

    after = oldestInPage;
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`완료 — 이번 실행에서 새로 저장된 캔들 ${totalNew}건`);
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
