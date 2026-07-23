import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { computeCharacterCombatStats } from '../../rpg-combat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  try {
    const docPath = characterDocPath(username, slot);
    let character = await firestoreGetDoc(docPath);
    if (!character) {
      character = await withFirestoreTransaction(docPath, (current) => {
        if (current) return null; // 그 사이 다른 요청이 이미 생성함
        return defaultCharacter(slot);
      });
    }

    const currentTurns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level);
    const combatStats = computeCharacterCombatStats(character);
    return res.status(200).json({
      ...character,
      turnPoints: currentTurns,
      turnPointsCap: turnCapForLevel(character.level),
      maxHp: combatStats.maxHp,
      maxMp: combatStats.maxMp,
      maxStamina: combatStats.maxStamina,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
