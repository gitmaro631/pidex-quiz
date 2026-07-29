// 영지 현황 조회 - 실제 정산(시설레벨/식량/골드/급여)은 이제 매 모험(adventure.js)마다
// "영지일" 경계를 넘을 때 자동으로 처리됨(rpg-territory.js 참고). 이 엔드포인트는 그 결과를
// 조회만 하는 용도로 남겨둠(정산 로직 중복 없음)
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { accountFacilitiesDocPath, defaultAccountFacilities } from '../_rpgFacilities.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

  try {
    const character = (await firestoreGetDoc(characterDocPath(username, slot))) || defaultCharacter(slot);
    const accountFacilities = (await firestoreGetDoc(accountFacilitiesDocPath(username, slot))) || defaultAccountFacilities();
    return res.status(200).json({
      gold: character.gold || 0,
      foodStock: character.foodStock || 0,
      facilityDays: accountFacilities.facilityDays || {},
      facilityLevels: accountFacilities.facilityLevels || {},
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
