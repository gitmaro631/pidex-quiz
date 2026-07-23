// 모험(RPG) 골드 랭킹 - 공개 데이터, 인증 불필요(퀴즈 리더보드와 같은 성격)
import { firestoreListCollection } from '../_firestore.js';
import { ADMIN_USERNAME } from '../_rpgAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rows = await firestoreListCollection('rpg_characters');
    const top = rows
      .filter((r) => typeof r.gold === 'number')
      .map((r) => {
        const [encodedUsername, slot] = String(r.id).split('__');
        return { username: decodeURIComponent(encodedUsername), slot: Number(slot), level: r.level, gold: r.gold };
      })
      .filter((r) => r.username !== ADMIN_USERNAME) // 관리자(테스트 계정)는 랭킹에서 제외
      .sort((a, b) => b.gold - a.gold)
      .slice(0, 100);
    return res.status(200).json({ leaderboard: top });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
