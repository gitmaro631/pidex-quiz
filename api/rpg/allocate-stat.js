// 레벨업으로 쌓인 statPoints를 str/int/agi/vit 중 하나에 배분
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const VALID_STATS = ['str', 'int', 'agi', 'vit'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, stat, amount } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!VALID_STATS.includes(stat)) return res.status(400).json({ error: 'invalid_stat' });

  const points = Math.max(1, Math.floor(Number(amount) || 1));

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if ((character.statPoints || 0) < points) { outcome = { error: 'not_enough_stat_points' }; return null; }

      const stats = { ...character.stats, [stat]: (character.stats[stat] || 0) + points };
      const now = Date.now();
      outcome = { stat, amount: points, stats, statPoints: character.statPoints - points };
      return { ...character, stats, statPoints: character.statPoints - points, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
