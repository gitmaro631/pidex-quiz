// 최초 1회 주직업 선택 (겸업/부직업 시스템은 이후 레벨업 단계에서 별도 엔드포인트로 추가 예정).
// 캐릭터 이름도 이때 같이 정함 - rename-mercenary.js와 같은 글자수 제한(최대 12자) 재사용
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { CLASSES } from '../../data/rpg/classes.js';

const MAX_NAME_LENGTH = 12;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, classId, name } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!CLASSES[classId]) return res.status(400).json({ error: 'invalid_class' });
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) return res.status(400).json({ error: 'invalid_name' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (character.classMain) { outcome = { error: 'class_already_chosen' }; return null; }

      const now = Date.now();
      outcome = { classMain: classId, name: trimmedName };
      return { ...character, classMain: classId, name: trimmedName, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
