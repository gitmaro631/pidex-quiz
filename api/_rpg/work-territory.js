// 사냥이 버거운 유저를 위한 안전한 턴 소모처 - 전투 없이 턴 1개를 영지 시설 일에 투입함.
// 용병과 같은 일자리(clearing/training/ramparts/farm)를 고르되, 용병보다 기여 배율이 더 높음
// (PLAYER_TERRITORY_BONUS_MULT). 시설 성장(공/방/골드 보너스)을 통해 결과적으로 전투를 쉽게 만드는 게 목적이라
// 용병들의 일 단위 정산(settleTerritoryDays)과 별개로 이 턴의 기여분만 즉시 시설 누적일에 반영함.
// 골드 산출(개간지)도 이 턴만큼 비례해서 즉시 지급 - 식량 생산/소비는 이 액션에서는 다루지 않음(용병 몫)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { TERRITORY_JOBS, PLAYER_TERRITORY_BONUS_MULT } from '../../data/rpg/mercenaries.js';
import { facilityLevelForDays, facilityBonusMultiplier, BASELINE_MERC_LEVEL } from '../../data/rpg/facilities.js';
import { territoryDaysElapsed, settleTerritoryDays } from '../../rpg-territory.js';
import { isAdminUsername } from '../_rpgAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, job } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!TERRITORY_JOBS[job]) return res.status(400).json({ error: 'invalid_job' });
  const isAdmin = isAdminUsername(username);

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);
      if (!isAdmin && turns < 1) { outcome = { error: 'not_enough_turns' }; return null; }

      // 이 턴 하나의 기여분 - "레벨/기준레벨" 비율을 하루 기준(turnCapForLevel)으로 나눠 1턴어치만 반영.
      // 레벨1~4는 기준레벨(5)로 취급해서 기여도 하한을 둠 - 안 그러면 저레벨일 때 기여가 너무 작아서
      // 시설 첫 레벨업에만 턴 수백~수천개가 필요해지는 문제가 있었음
      const effLevel = Math.max(character.level, BASELINE_MERC_LEVEL);
      const dayFraction = 1 / turnCapForLevel(character.level, character.surveyBonusUnlocked);
      const contribution = (effLevel / BASELINE_MERC_LEVEL) * PLAYER_TERRITORY_BONUS_MULT * dayFraction;

      const nextFacilityDays = { ...(character.facilityDays || {}) };
      nextFacilityDays[job] = (nextFacilityDays[job] || 0) + contribution;
      const prevLevel = (character.facilityLevels || {})[job] || 0;
      const newLevel = facilityLevelForDays(nextFacilityDays[job]);
      const nextFacilityLevels = { ...(character.facilityLevels || {}), [job]: newLevel };

      const goldIncome = job === 'clearing'
        ? Math.floor(TERRITORY_JOBS.clearing.goldPerDay * dayFraction * facilityBonusMultiplier({ facilityLevels: nextFacilityLevels }, 'clearing'))
        : 0;

      const nextTurns = isAdmin ? turns : turns - 1;
      const nextTotalTurnsSpent = (character.totalTurnsSpent || 0) + 1;

      // 이 턴 소모로 영지일 경계도 넘을 수 있음 - 그러면 용병 몫(식량/급여/골드)도 같이 정산
      const daysNow = territoryDaysElapsed(nextTotalTurnsSpent, character.level);
      const daysSinceCheckpoint = daysNow - (character.territoryDayCheckpoint || 0);
      const territorySettlement = settleTerritoryDays(character, daysSinceCheckpoint);

      const finalFacilityDays = territorySettlement ? { ...territorySettlement.nextFacilityDays, [job]: nextFacilityDays[job] } : nextFacilityDays;
      const finalFacilityLevels = territorySettlement
        ? { ...territorySettlement.nextFacilityLevels, [job]: Math.max(territorySettlement.nextFacilityLevels[job] || 0, newLevel) }
        : nextFacilityLevels;
      const foodStock = territorySettlement ? territorySettlement.nextFoodStock : character.foodStock;
      const territoryGoldDelta = territorySettlement ? territorySettlement.goldDelta : 0;
      const finalGold = Math.max(0, (character.gold || 0) + goldIncome + territoryGoldDelta);

      outcome = {
        job, goldIncome, gold: finalGold,
        turnPoints: nextTurns, turnPointsCap: turnCapForLevel(character.level, character.surveyBonusUnlocked),
        facilityDays: finalFacilityDays,
        facilityLevels: finalFacilityLevels,
        leveledUp: newLevel > prevLevel ? [{ jobId: job, name: TERRITORY_JOBS[job].name, level: newLevel }] : [],
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
        gold: finalGold,
        turnPoints: nextTurns,
        turnPointsUpdatedAt: now,
        totalTurnsSpent: nextTotalTurnsSpent,
        territoryDayCheckpoint: daysNow,
        facilityDays: finalFacilityDays,
        facilityLevels: finalFacilityLevels,
        foodStock,
        updatedAt: now,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
