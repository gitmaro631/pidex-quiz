// 마을 탭에서 직접 다른 마을로 이동 - 턴포인트 1 소모(지역 진입으로 인한 자동 이동과 같은 비용).
// 이전 마을 최상위 지역 100회 공략 조건을 채워야 그 마을로 이동 가능(zones.js의 unlockZoneId 참고).
// 시설 레벨은 계정 공용 문서에서 관리됨(_rpgFacilities.js 참고 - 캐릭터1/2/3이 공유)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { accountFacilitiesDocPath, defaultAccountFacilities } from '../_rpgFacilities.js';
import { computeCurrentTurns } from '../_rpgTurns.js';
import { isOverCapacity } from '../_rpgInventory.js';
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
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!TOWNS[townId]) return res.status(400).json({ error: 'invalid_town' });
  const isAdmin = isAdminUsername(username);

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    const facilitiesPath = accountFacilitiesDocPath(username, slot);
    await withMultiDocTransaction([docPath, facilitiesPath], (docs) => {
      const character = docs[docPath] || defaultCharacter(slot);
      const accountFacilities = docs[facilitiesPath] || defaultAccountFacilities();
      if (character.currentTown === townId) { outcome = { error: 'already_there' }; return {}; }
      // 용병 해고로 반납된 장비 등으로 가방이 칸/무게 한도를 넘었으면 정리하기 전까진 이동을 막음(관리자 제외)
      if (!isAdmin && isOverCapacity(character)) { outcome = { error: 'inventory_over_capacity' }; return {}; }

      const gateZone = Object.values(ZONES).find((z) => z.town === townId);
      const gateZoneId = gateZone && gateZone.unlockZoneId;
      if (gateZoneId && ((character.zoneClearCounts || {})[gateZoneId] || 0) < CASTLE_CLEAR_REQUIREMENT) {
        outcome = { error: 'zone_locked' }; return {};
      }

      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);
      if (!isAdmin && turns < 1) { outcome = { error: 'not_enough_turns' }; return {}; }
      const nextTurns = isAdmin ? turns : turns - 1;

      const nextTotalTurnsSpent = (character.totalTurnsSpent || 0) + 1;
      const daysNow = territoryDaysElapsed(nextTotalTurnsSpent, character.level);
      const daysSinceCheckpoint = daysNow - (character.territoryDayCheckpoint || 0);
      const territorySettlement = settleTerritoryDays(
        { ...character, facilityDays: accountFacilities.facilityDays, facilityLevels: accountFacilities.facilityLevels },
        daysSinceCheckpoint,
      );
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
        [docPath]: {
          ...character,
          currentTown: townId,
          gold: finalGold,
          turnPoints: nextTurns,
          turnPointsUpdatedAt: now,
          totalTurnsSpent: nextTotalTurnsSpent,
          territoryDayCheckpoint: daysNow,
          foodStock: territorySettlement ? territorySettlement.nextFoodStock : character.foodStock,
          updatedAt: now,
        },
        [facilitiesPath]: territorySettlement
          ? { facilityDays: territorySettlement.nextFacilityDays, facilityLevels: territorySettlement.nextFacilityLevels, updatedAt: now }
          : undefined,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
