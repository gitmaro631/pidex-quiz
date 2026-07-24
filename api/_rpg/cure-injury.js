// 마을 의사 치료 - 경상/중상 관계없이 골드로 즉시 완치. 비용은 남은 회복턴 x 심각도에 비례.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const COST_PER_TURN = 3;
const SEVERITY_COST_MULT = { 1: 1, 2: 2 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, part } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (part !== 'arm' && part !== 'leg') return res.status(400).json({ error: 'invalid_part' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const injuries = character.injuries || { arm: { severity: 0, turnsLeft: 0 }, leg: { severity: 0, turnsLeft: 0 } };
      const injury = injuries[part] || { severity: 0, turnsLeft: 0 };
      if (!injury.severity) { outcome = { error: 'no_injury' }; return null; }

      const cost = Math.max(5, Math.ceil(injury.turnsLeft * COST_PER_TURN * (SEVERITY_COST_MULT[injury.severity] || 1)));
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const nextInjuries = { ...injuries, [part]: { severity: 0, turnsLeft: 0 } };
      const now = Date.now();
      outcome = { part, cost, gold: character.gold - cost, injuries: nextInjuries };
      return { ...character, gold: character.gold - cost, injuries: nextInjuries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
