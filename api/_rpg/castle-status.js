// 성 점령전 - 특정 지역의 성 현재 상태(비어있음/성주 정보) 조회
import { firestoreGetDoc } from '../_firestore.js';
import { castleDocPath } from '../../data/rpg/castle.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { zoneId } = req.body;
  if (!zoneId) return res.status(400).json({ error: 'invalid zoneId' });
  try {
    const castle = await firestoreGetDoc(castleDocPath(zoneId));
    return res.status(200).json({ castle });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
