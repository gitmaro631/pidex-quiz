// 던전 성 도전 - 그 지역을 100회 이상 공략해야 도전 가능. 비어있으면 즉시 차지, 누가 있으면
// 전력치(computePartyPower) 비교 확률 판정으로 승패를 가름(실제 턴제 전투 아님).
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { accountFacilitiesDocPath, defaultAccountFacilities } from '../_rpgFacilities.js';
import { ZONES } from '../../data/rpg/zones.js';
import { CASTLE_CLEAR_REQUIREMENT, CASTLE_ROLL_VARIANCE, castleDocPath } from '../../data/rpg/castle.js';
import { computePartyPower } from '../../rpg-combat.js';

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  const zone = ZONES[zoneId];
  if (!zone) return res.status(400).json({ error: 'invalid zoneId' });

  let outcome = null;
  try {
    const character = await firestoreGetDoc(characterDocPath(username, slot)) || defaultCharacter(slot);
    const clears = (character.zoneClearCounts || {})[zoneId] || 0;
    if (clears < CASTLE_CLEAR_REQUIREMENT) return res.status(400).json({ error: 'not_enough_clears' });

    // 도전 전력치도 시설(훈련소/방벽) 보너스가 반영돼야 함 - 시설은 계정 공용 문서(_rpgFacilities.js)
    const accountFacilities = (await firestoreGetDoc(accountFacilitiesDocPath(username, slot))) || defaultAccountFacilities();
    const challengerPower = computePartyPower({ ...character, facilityLevels: accountFacilities.facilityLevels });
    const challengerName = username;

    const castlePath = castleDocPath(zoneId);
    await withFirestoreTransaction(castlePath, (current) => {
      const now = Date.now();
      if (!current) {
        // 비어있는 성 - 바로 차지
        outcome = { won: true, wasEmpty: true, zoneId };
        return { zoneId, ownerUsername: username, ownerSlot: slot, ownerName: challengerName, defensePower: challengerPower, capturedAt: now };
      }
      if (current.ownerUsername === username && current.ownerSlot === slot) {
        outcome = { error: 'already_owner' };
        return null;
      }

      const challengerRoll = challengerPower * randRange(...CASTLE_ROLL_VARIANCE);
      const defenderRoll = (current.defensePower || 1) * randRange(...CASTLE_ROLL_VARIANCE);
      const won = challengerRoll > defenderRoll;
      outcome = {
        won, wasEmpty: false, zoneId,
        previousOwnerName: current.ownerName,
        challengerRoll: Math.round(challengerRoll), defenderRoll: Math.round(defenderRoll),
      };
      if (!won) return null; // 패배 - 성은 그대로, 페널티 없음

      return { zoneId, ownerUsername: username, ownerSlot: slot, ownerName: challengerName, defensePower: challengerPower, capturedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
