// 대장간 수리스킬 훈련 - 골드만 필요(결정 불필요). 단계가 오를수록 셀프 수리 가능한 아이템 등급이 오름
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { MAX_REPAIR_SKILL_LEVEL, REPAIR_SKILL_COSTS } from '../../data/rpg/enhancement.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const currentLevel = character.repairSkillLevel || 0;
      const nextLevel = currentLevel + 1;
      if (nextLevel > MAX_REPAIR_SKILL_LEVEL) { outcome = { error: 'max_tier_reached' }; return null; }

      const cost = REPAIR_SKILL_COSTS[nextLevel];
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const now = Date.now();
      outcome = { level: nextLevel, cost, gold: character.gold - cost };
      return { ...character, gold: character.gold - cost, repairSkillLevel: nextLevel, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
