// 마을 게시판 조회 - 공개 데이터, 인증 불필요(마켓/랭킹과 같은 성격)
import { firestoreListCollection } from '../_firestore.js';
import { TOWNS } from '../../data/rpg/towns.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const townId = req.query.townId;
  if (!TOWNS[townId]) return res.status(400).json({ error: 'invalid_town' });

  try {
    const rows = await firestoreListCollection('rpg_town_board');
    const posts = rows
      .filter((r) => r.townId === townId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 50);
    return res.status(200).json({ posts });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
