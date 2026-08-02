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
        const [encodedUsername] = String(r.id).split('__');
        return {
          username: decodeURIComponent(encodedUsername),
          level: r.level,
          gold: r.gold,
          classMain: r.classMain || null,
          currentTown: r.currentTown || null,
          totalTurnsSpent: r.totalTurnsSpent || 0,
          country: r.country || null,
        };
      })
      .filter((r) => r.username !== ADMIN_USERNAME) // 관리자(테스트 계정)는 랭킹에서 제외
      .sort((a, b) => b.gold - a.gold);
    // 슬롯 표시를 없애면서 계정당 캐릭터(슬롯) 여러 개가 각각 한 줄씩 나오면 같은 유저가 중복으로
    // 보이므로, 유저(username)당 가장 골드가 높은 캐릭터 하나만 남김(이미 골드 내림차순 정렬됨)
    const seen = new Set();
    const dedup = [];
    for (const r of top) {
      if (seen.has(r.username)) continue;
      seen.add(r.username);
      dedup.push(r);
    }
    const result = dedup.slice(0, 100);
    return res.status(200).json({ leaderboard: result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
