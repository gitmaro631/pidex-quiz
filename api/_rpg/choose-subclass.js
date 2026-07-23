// 특정 레벨 도달 시 부직업(겸업) 1개 최초 1회 선택 - 이후 스킬 풀이 본업+부직업으로 합쳐짐
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { CLASSES } from '../../data/rpg/classes.js';
import { SUB_CLASS_UNLOCK_LEVEL } from '../../rpg-progression.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, classId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!CLASSES[classId]) return res.status(400).json({ error: 'invalid_class' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (character.classSub) { outcome = { error: 'subclass_already_chosen' }; return null; }
      if ((character.level || 1) < SUB_CLASS_UNLOCK_LEVEL) { outcome = { error: 'level_too_low' }; return null; }
      if (classId === character.classMain) { outcome = { error: 'same_as_main_class' }; return null; }

      const now = Date.now();
      outcome = { classSub: classId };
      return { ...character, classSub: classId, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
