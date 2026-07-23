// 공개 마켓 리스팅 조회 - 인증 불필요(공개 데이터), 리더보드 조회와 같은 성격
import { firestoreListCollection } from '../_firestore.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rows = await firestoreListCollection('rpg_market_listings');
    const active = rows
      .filter((r) => r.qty > 0)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 100);
    return res.status(200).json({ listings: active });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
