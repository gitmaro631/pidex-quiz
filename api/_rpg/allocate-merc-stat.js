// 용병의 레벨업으로 쌓인 statPoints를 str/int/agi/vit/wis 중 하나에 배분 - allocate-stat.js와
// 동일한 구조지만 대상이 character.mercenaries 안의 특정 용병(mercId)이라는 점만 다름
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const VALID_STATS = ['str', 'int', 'agi', 'vit', 'wis'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId, stat, amount } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId) return res.status(400).json({ error: 'invalid_mercenary' });
  if (!VALID_STATS.includes(stat)) return res.status(400).json({ error: 'invalid_stat' });

  const points = Math.max(1, Math.floor(Number(amount) || 1));

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const idx = mercenaries.findIndex((m) => m.id === mercId);
      if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }
      const merc = mercenaries[idx];
      if ((merc.statPoints || 0) < points) { outcome = { error: 'not_enough_stat_points' }; return null; }

      const stats = { ...merc.stats, [stat]: (merc.stats[stat] || 0) + points };
      const nextMerc = { ...merc, stats, statPoints: merc.statPoints - points };
      const nextMercenaries = [...mercenaries];
      nextMercenaries[idx] = nextMerc;
      const now = Date.now();
      outcome = { mercId, stat, amount: points, stats, statPoints: nextMerc.statPoints };
      return { ...character, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
