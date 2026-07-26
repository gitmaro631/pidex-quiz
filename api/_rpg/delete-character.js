// 캐릭터 슬롯 삭제 - 되돌릴 수 없음(장비/인벤토리/골드/용병 전부 사라짐). 클라이언트에서 확인창을 띄움
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreDeleteDoc } from '../_firestore.js';
import { characterDocPath, isValidSlot } from '../_rpgCharacter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  try {
    await firestoreDeleteDoc(characterDocPath(username, slot));
    return res.status(200).json({ deleted: true, slot });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
