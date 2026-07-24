// 용병 배치 변경 - 'active'(전투 동행, 최대 MAX_MERCENARIES명) <-> 'territory'(영지에서 일함)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { MAX_MERCENARIES } from '../../data/rpg/mercenaries.js';

const VALID_ASSIGNMENTS = ['active', 'territory'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId, assignment } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId || !VALID_ASSIGNMENTS.includes(assignment)) return res.status(400).json({ error: 'invalid_assignment' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const idx = mercenaries.findIndex((m) => m.id === mercId);
      if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }

      if (assignment === 'active') {
        if (mercenaries[idx].hospitalized) { outcome = { error: 'already_hospitalized' }; return null; }
        const activeCount = mercenaries.filter((m, i) => i !== idx && m.assignment === 'active').length;
        if (activeCount >= MAX_MERCENARIES) { outcome = { error: 'party_full' }; return null; }
      }

      const nextMercenaries = [...mercenaries];
      nextMercenaries[idx] = { ...nextMercenaries[idx], assignment, job: assignment === 'territory' ? 'clearing' : null };
      const now = Date.now();
      outcome = { mercId, assignment };
      return { ...character, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
