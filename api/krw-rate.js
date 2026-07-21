import { firestoreGetDoc, firestoreSetDoc } from './_firestore.js';

// 한국수출입은행 API는 클라우드/데이터센터 IP를 차단하는 것으로 확인되어(리전을 서울로 바꿔도 동일),
// ECB(유럽중앙은행) 기반의 공개 환율 API(Frankfurter)로 대체 — 별도 키 필요 없고 어디서든 접근 가능.
// 주말/공휴일에 요청해도 직전 영업일 환율을 자동으로 반환해줌.
const CACHE_COL = 'krw_rates';

async function fetchRate(dateStr) {
  const res = await fetch(`https://api.frankfurter.app/${dateStr}?from=USD&to=KRW`);
  if (!res.ok) return null;
  const json = await res.json();
  const rate = json?.rates?.KRW;
  if (rate == null) return null;
  return { rate, sourceDate: json.date };
}

async function getRate(date) {
  const cachePath = `${CACHE_COL}/${date}`;
  const cached = await firestoreGetDoc(cachePath);
  if (cached && cached.rate != null) return cached.rate;

  const resolved = await fetchRate(date);
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
