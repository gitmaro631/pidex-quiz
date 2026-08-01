// 용병 전투 설정 - stance(쎈몹/약한몹 우선 타겟팅)를 유저 본인 stance와 완전히 독립적으로
// 용병 개인별로 저장. combatRole(fight/support) 설정은 폐지됨 - 힐 스킬을 가진 용병은 이제
// 역할설정과 무관하게 아군이 다치면 항상 힐을 최우선으로 씀(rpg-combat.js 참고)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const VALID_STANCES = ['aggressive', 'stable'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId, stance } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId) return res.status(400).json({ error: 'invalid_mercId' });
  if (!VALID_STANCES.includes(stance)) return res.status(400).json({ error: 'invalid_stance' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const idx = mercenaries.findIndex((m) => m.id === mercId);
      if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }

      const nextMerc = { ...mercenaries[idx], stance };
      const nextMercenaries = [...mercenaries];
      nextMercenaries[idx] = nextMerc;
      const now = Date.now();
      outcome = { mercId, stance: nextMerc.stance };
      return { ...character, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
