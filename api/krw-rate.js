import { firestoreGetDoc, firestoreSetDoc } from './_firestore.js';

const CACHE_COL = 'krw_rates';

function toYmd(dateStr) {
  return dateStr.replace(/-/g, '');
}

function prevDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchEximRate(dateStr) {
  const key = process.env.EXIM_API_KEY;
  if (!key) throw new Error('EXIM_API_KEY not configured');
  const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${key}&searchdate=${toYmd(dateStr)}&data=AP01`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Exim API error (${res.status})`);
  const json = await res.json();
  const usd = Array.isArray(json) ? json.find(r => r.cur_unit === 'USD') : null;
  if (!usd || !usd.deal_bas_r) return null;
  return parseFloat(usd.deal_bas_r.replace(/,/g, ''));
}

// 주말/공휴일이면 환율 고시가 없으므로, 최대 7일 전까지 거슬러 올라가며 가장 최근 영업일 환율을 찾는다
async function resolveRateForDate(date) {
  let d = date, rate = null, tries = 0;
  while (rate == null && tries < 7) {
    rate = await fetchEximRate(d);
    if (rate == null) d = prevDateStr(d);
    tries++;
  }
  return rate == null ? null : { rate, sourceDate: d };
}

async function getRate(date) {
  const cachePath = `${CACHE_COL}/${date}`;
  const cached = await firestoreGetDoc(cachePath);
  if (cached && cached.rate != null) return cached.rate;

  const resolved = await resolveRateForDate(date);
  if (!resolved) return null;
  firestoreSetDoc(cachePath, { rate: resolved.rate, sourceDate: resolved.sourceDate, cachedAt: Date.now() }).catch(() => {});
  return resolved.rate;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const raw = req.query.dates;
  if (!raw) return res.status(400).json({ error: 'dates required (comma-separated YYYY-MM-DD)' });
  const dates = [...new Set(String(raw).split(',').map(s => s.trim()).filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s)))];
  if (!dates.length) return res.status(400).json({ error: 'no valid dates' });

  try {
    const rates = {};
    for (const date of dates) {
      rates[date] = await getRate(date);
    }
    return res.status(200).json({ rates });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
