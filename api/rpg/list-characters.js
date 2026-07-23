// 계정의 캐릭터 슬롯(최대 3개) 목록 조회 - 캐릭터 선택 화면용 요약 정보만 반환
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc } from '../_firestore.js';
import { characterDocPath, MAX_CHARACTER_SLOTS } from '../_rpgCharacter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });

  try {
    const slots = await Promise.all(
      Array.from({ length: MAX_CHARACTER_SLOTS }, (_, i) => i + 1).map(async (slot) => {
        const character = await firestoreGetDoc(characterDocPath(username, slot));
        if (!character) return { slot, exists: false };
        return {
          slot, exists: true,
          level: character.level, classMain: character.classMain, gold: character.gold,
        };
      })
    );
    return res.status(200).json({ slots, maxSlots: MAX_CHARACTER_SLOTS });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
