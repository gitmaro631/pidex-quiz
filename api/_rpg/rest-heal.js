// 영지에서 휴식하며 부상을 치료 - 골드 대신 턴포인트를 소모(의사/붕대와는 다른 세 번째 치료 수단).
// 경상/중상에 따라 소모 턴수가 다름(REST_HEAL_TURN_COST_BY_SEVERITY). mercId를 주면 본인이 아니라
// 그 용병을 치료함(전투 동행 여부 무관, 입원 중이어도 가능)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns } from '../_rpgTurns.js';
import { REST_HEAL_TURN_COST_BY_SEVERITY } from '../../data/rpg/injuries.js';
import { hospitalCostMultiplier } from '../../data/rpg/facilities.js';
import { isAdminUsername } from '../_rpgAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, part, mercId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (part !== 'arm' && part !== 'leg') return res.status(400).json({ error: 'invalid_part' });
  const isAdmin = isAdminUsername(username);

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now);

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

      const cost = Math.max(1, Math.round((REST_HEAL_TURN_COST_BY_SEVERITY[injury.severity] || 2) * hospitalCostMultiplier(character)));
      if (!isAdmin && turns < cost) { outcome = { error: 'not_enough_turns' }; return null; }

      const nextInjuries = { ...injuries, [part]: { severity: 0, turnsLeft: 0 } };
      const nextTurns = isAdmin ? turns : turns - cost;

      if (mercId) {
        mercenaries = [...mercenaries];
        mercenaries[mercIdx] = { ...mercenaries[mercIdx], injuries: nextInjuries };
        outcome = { part, mercId, cost, turnPoints: nextTurns, injuries: nextInjuries };
        return { ...character, mercenaries, turnPoints: nextTurns, turnPointsUpdatedAt: now, updatedAt: now };
      }
      outcome = { part, cost, turnPoints: nextTurns, injuries: nextInjuries };
      return { ...character, injuries: nextInjuries, turnPoints: nextTurns, turnPointsUpdatedAt: now, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
