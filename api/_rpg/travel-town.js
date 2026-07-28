// 마을 탭에서 직접 다른 마을로 이동 - 턴포인트 1 소모(지역 진입으로 인한 자동 이동과 같은 비용).
// 이전 마을 최상위 지역 100회 공략 조건을 채워야 그 마을로 이동 가능(zones.js의 unlockZoneId 참고)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns } from '../_rpgTurns.js';
import { TOWNS } from '../../data/rpg/towns.js';
import { ZONES } from '../../data/rpg/zones.js';
import { CASTLE_CLEAR_REQUIREMENT } from '../../data/rpg/castle.js';
import { isAdminUsername } from '../_rpgAdmin.js';
import { territoryDaysElapsed, settleTerritoryDays } from '../../rpg-territory.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, townId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!TOWNS[townId]) return res.status(400).json({ error: 'invalid_town' });
  const isAdmin = isAdminUsername(username);

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (character.currentTown === townId) { outcome = { error: 'already_there' }; return null; }

      const gateZone = Object.values(ZONES).find((z) => z.town === townId);
      const gateZoneId = gateZone && gateZone.unlockZoneId;
      if (gateZoneId && ((character.zoneClearCounts || {})[gateZoneId] || 0) < CASTLE_CLEAR_REQUIREMENT) {
        outcome = { error: 'zone_locked' }; return null;
      }

      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);
      if (!isAdmin && turns < 1) { outcome = { error: 'not_enough_turns' }; return null; }
      const nextTurns = isAdmin ? turns : turns - 1;

      const nextTotalTurnsSpent = (character.totalTurnsSpent || 0) + 1;
      const daysNow = territoryDaysElapsed(nextTotalTurnsSpent, character.level);
      const daysSinceCheckpoint = daysNow - (character.territoryDayCheckpoint || 0);
      const territorySettlement = settleTerritoryDays(character, daysSinceCheckpoint);
      const territoryGoldDelta = territorySettlement ? territorySettlement.goldDelta : 0;
      const finalGold = Math.max(0, (character.gold || 0) + territoryGoldDelta);

      outcome = {
        currentTown: townId, turnPoints: nextTurns, gold: finalGold,
        territoryNotice: territorySettlement ? {
          daysProcessed: territorySettlement.daysProcessed,
          goldIncome: territorySettlement.goldIncome,
          wagePaid: territorySettlement.wagePaid,
          foodEmergencyCost: territorySettlement.foodEmergencyCost,
          goldDelta: territorySettlement.goldDelta,
          leveledUp: territorySettlement.leveledUp,
        } : null,
      };
      return {
        ...character,
        currentTown: townId,
        gold: finalGold,
        turnPoints: nextTurns,
        turnPointsUpdatedAt: now,
        totalTurnsSpent: nextTotalTurnsSpent,
        territoryDayCheckpoint: daysNow,
        facilityDays: territorySettlement ? territorySettlement.nextFacilityDays : character.facilityDays,
        facilityLevels: territorySettlement ? territorySettlement.nextFacilityLevels : character.facilityLevels,
        foodStock: territorySettlement ? territorySettlement.nextFoodStock : character.foodStock,
        updatedAt: now,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
