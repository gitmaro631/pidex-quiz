// 계정의 캐릭터 슬롯(기본 5개, 관리자는 테스트슬롯 1개 추가) 목록 조회 - 캐릭터 선택 화면용 요약 정보만 반환
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc } from '../_firestore.js';
import { characterDocPath, maxCharacterSlotsFor, MAX_CHARACTER_SLOTS } from '../_rpgCharacter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });

  try {
    const maxSlots = maxCharacterSlotsFor(username);
    const slots = await Promise.all(
      Array.from({ length: maxSlots }, (_, i) => i + 1).map(async (slot) => {
        const character = await firestoreGetDoc(characterDocPath(username, slot));
        const isTestSlot = slot > MAX_CHARACTER_SLOTS;
        if (!character) return { slot, exists: false, isTestSlot };
        return {
          slot, exists: true, isTestSlot,
          level: character.level, classMain: character.classMain, gold: character.gold, name: character.name || null,
        };
      })
    );
    return res.status(200).json({ slots, maxSlots });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
