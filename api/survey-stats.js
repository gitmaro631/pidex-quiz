import { firestoreListCollection, firestoreGetDoc, firestoreSetDoc } from './_firestore.js';

const CACHE_PATH = 'survey_stats_cache/latest';
const TTL_MS = 30 * 60 * 1000; // 30분 — 이 시간 안에는 캐시된 집계를 그대로 반환

// firebase.js의 aggregateStats()와 동일한 로직 — 서버에서 미리 계산해서 캐싱
function aggregateStats(rows) {
  if (rows.length === 0) return { total: 0 };

  const count = (field, value) =>
    rows.filter(r => r[field] === value).length;

  const countAny = (field, value) =>
    rows.filter(r => Array.isArray(r[field]) ? r[field].includes(value) : r[field] === value).length;

  const sectionTotal = (field) =>
    rows.filter(r => r[field] !== undefined && r[field] !== null).length;

  const sectionTotalAny = (field) =>
    rows.filter(r => Array.isArray(r[field]) && r[field].length > 0).length;

  const byCountry = {};
  for (const r of rows) {
    const cc = r.S_COUNTRY;
    if (!cc) continue;
    if (!byCountry[cc]) byCountry[cc] = { total: 0, kycPassed: 0, kycTotal: 0, nodeRunning: 0, nodeTotal: 0 };
    const c = byCountry[cc];
    c.total++;
    if (r.S_KYC)  { c.kycTotal++;  if (r.S_KYC === 'passed')  c.kycPassed++;  }
    if (r.S_NODE) { c.nodeTotal++; if (r.S_NODE === 'running') c.nodeRunning++; }
  }

  return {
    total: rows.length,
    kyc: {
      passed:   count('S_KYC', 'passed'),
      failed:   count('S_KYC', 'failed'),
      pending:  count('S_KYC', 'pending'),
      notTried: count('S_KYC', 'notTried'),
      _total:   sectionTotal('S_KYC'),
    },
    node: {
      running:    count('S_NODE', 'running'),
      stopped:    count('S_NODE', 'stopped'),
      planning:   count('S_NODE', 'planning'),
      noInterest: count('S_NODE', 'noInterest'),
      _total:     sectionTotal('S_NODE'),
    },
    tradeExp: {
      p2p:      countAny('S_TRADE_EXP', 'p2p'),
      exchange: countAny('S_TRADE_EXP', 'exchange'),
      barter:   countAny('S_TRADE_EXP', 'barter'),
      dexApp:   countAny('S_TRADE_EXP', 'dexApp'),
      none:     countAny('S_TRADE_EXP', 'none'),
      _total:   sectionTotalAny('S_TRADE_EXP'),
    },
    byCountry,
    countriesTotal: sectionTotal('S_COUNTRY'),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const force = req.query.force === '1';

  try {
    if (!force) {
      const cached = await firestoreGetDoc(CACHE_PATH);
      if (cached && cached.computedAt && Date.now() - cached.computedAt < TTL_MS) {
        return res.status(200).json({ stats: cached.stats, cachedAt: cached.computedAt });
      }
    }

    const rows = (await firestoreListCollection('surveys')).map(d => d.answers ?? {});
    const stats = aggregateStats(rows);
    const computedAt = Date.now();
    firestoreSetDoc(CACHE_PATH, { stats, computedAt }).catch(() => {});
    return res.status(200).json({ stats, cachedAt: computedAt });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
