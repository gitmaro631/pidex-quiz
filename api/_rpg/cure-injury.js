// 마을 의사 치료 - 경상/중상 관계없이 골드로 즉시 완치. 비용은 남은 회복턴 x 심각도에 비례(입원보다 비쌈).
// mercId를 주면 본인이 아니라 그 용병을 치료함(입원 중이었다면 즉시 퇴원 처리됨)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const COST_PER_TURN = 3;
const SEVERITY_COST_MULT = { 1: 1, 2: 2 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, part, mercId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (part !== 'arm' && part !== 'leg') return res.status(400).json({ error: 'invalid_part' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);

      let mercenaries = character.mercenaries || [];
      let mercIdx = -1;
      let target = character;
      if (mercId) {
        mercIdx = mercenaries.findIndex((m) => m.id === mercId);
        if (mercIdx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }
        target = mercenaries[mercIdx];
      }

      const injuries = target.injuries || { arm: { severity: 0, turnsLeft: 0 }, leg: { severity: 0, turnsLeft: 0 } };
      const injury = injuries[part] || { severity: 0, turnsLeft: 0 };
      if (!injury.severity) { outcome = { error: 'no_injury' }; return null; }

      const cost = Math.max(5, Math.ceil(injury.turnsLeft * COST_PER_TURN * (SEVERITY_COST_MULT[injury.severity] || 1)));
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const nextInjuries = { ...injuries, [part]: { severity: 0, turnsLeft: 0 } };
      const now = Date.now();

      if (mercId) {
        mercenaries = [...mercenaries];
        mercenaries[mercIdx] = { ...mercenaries[mercIdx], injuries: nextInjuries, hospitalized: false };
        outcome = { part, mercId, cost, gold: character.gold - cost, injuries: nextInjuries };
        return { ...character, gold: character.gold - cost, mercenaries, updatedAt: now };
      }
      outcome = { part, cost, gold: character.gold - cost, injuries: nextInjuries };
      return { ...character, gold: character.gold - cost, injuries: nextInjuries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
