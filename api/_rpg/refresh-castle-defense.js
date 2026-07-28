// 성 점령전 - 성주가 자기 성의 방어 전력치(defensePower)를 지금 시점의 장비/용병 기준으로 다시 계산해서
// 갱신함. claim-castle.js는 "차지한 순간"의 전력치를 스냅샷으로 고정해버리기 때문에, 이후 장비를
// 바꾸거나 용병을 새로 들여도 방어력이 예전 그대로였음 - 성에 다시 들어갔을 때 이 버튼으로 최신화 가능
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { castleDocPath } from '../../data/rpg/castle.js';
import { computePartyPower } from '../../rpg-combat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!zoneId) return res.status(400).json({ error: 'invalid zoneId' });

  try {
    const character = await firestoreGetDoc(characterDocPath(username, slot)) || defaultCharacter(slot);
    const newPower = Math.round(computePartyPower(character));

    let outcome = null;
    await withFirestoreTransaction(castleDocPath(zoneId), (current) => {
      if (!current) { outcome = { error: 'castle_not_found' }; return null; }
      if (current.ownerUsername !== username || current.ownerSlot !== Number(slot)) { outcome = { error: 'not_castle_owner' }; return null; }
      outcome = { defensePower: newPower, previousDefensePower: Math.round(current.defensePower || 0) };
      return { ...current, defensePower: newPower, defenseRefreshedAt: Date.now() };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
