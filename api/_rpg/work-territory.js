// 사냥이 버거운 유저를 위한 안전한 턴 소모처 - 전투 없이 턴 1개를 영지 시설 일에 투입함.
// 용병과 같은 일자리(clearing/training/ramparts/hospital/morale/sanctum/basics)를 고르되, 용병보다
// 기여 배율이 더 높음(PLAYER_TERRITORY_BONUS_MULT). 시설 성장(공/방/골드 보너스)을 통해 결과적으로
// 전투를 쉽게 만드는 게 목적이라 용병들의 일 단위 정산(settleTerritoryDays)과 별개로 이 턴의 기여분만
// 즉시 시설 누적일에 반영함. 골드 산출(개간지)도 이 턴만큼 비례해서 즉시 지급.
// 시설 레벨(facilityDays/facilityLevels)은 캐릭터 문서가 아니라 계정 공용 문서에 저장됨(_rpgFacilities.js) -
// 같은 유저의 캐릭터1/2/3이 전부 같은 시설을 공유(용병 배치는 그대로 캐릭터별)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { accountFacilitiesDocPath, defaultAccountFacilities } from '../_rpgFacilities.js';
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
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!TERRITORY_JOBS[job]) return res.status(400).json({ error: 'invalid_job' });
  const isAdmin = isAdminUsername(username);

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    const facilitiesPath = accountFacilitiesDocPath(username, slot);
    await withMultiDocTransaction([docPath, facilitiesPath], (docs) => {
      const character = docs[docPath] || defaultCharacter(slot);
      const accountFacilities = docs[facilitiesPath] || defaultAccountFacilities();
      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);
      if (!isAdmin && turns < 1) { outcome = { error: 'not_enough_turns' }; return {}; }

      // 이 턴 하나의 기여분 - "레벨/기준레벨" 비율을 하루 기준(turnCapForLevel)으로 나눠 1턴어치만 반영.
      // 레벨1~4는 기준레벨(5)로 취급해서 기여도 하한을 둠 - 안 그러면 저레벨일 때 기여가 너무 작아서
      // 시설 첫 레벨업에만 턴 수백~수천개가 필요해지는 문제가 있었음
      const effLevel = Math.max(character.level, BASELINE_MERC_LEVEL);
      const dayFraction = 1 / turnCapForLevel(character.level, character.surveyBonusUnlocked);
      const contribution = (effLevel / BASELINE_MERC_LEVEL) * PLAYER_TERRITORY_BONUS_MULT * dayFraction;

      const nextFacilityDays = { ...accountFacilities.facilityDays };
      nextFacilityDays[job] = (nextFacilityDays[job] || 0) + contribution;
      const prevLevel = (accountFacilities.facilityLevels || {})[job] || 0;
      const newLevel = facilityLevelForDays(nextFacilityDays[job]);
      const nextFacilityLevels = { ...accountFacilities.facilityLevels, [job]: newLevel };

      const goldIncome = job === 'clearing'
        ? Math.floor(TERRITORY_JOBS.clearing.goldPerDay * dayFraction * facilityBonusMultiplier({ facilityLevels: nextFacilityLevels }, 'clearing'))
        : 0;

      const nextTurns = isAdmin ? turns : turns - 1;
      const nextTotalTurnsSpent = (character.totalTurnsSpent || 0) + 1;

      // 이 턴 소모로 영지일 경계도 넘을 수 있음 - 그러면 용병 몫(개간지 골드 + 훈련소/병원/사기진작소/
      // 방벽/연공실/연무장 개인효과)도 같이 정산(그 캐릭터의 용병만 대상, 시설 레벨 자체는 공용 문서 기준으로 계산)
      const daysNow = territoryDaysElapsed(nextTotalTurnsSpent, character.level);
      const daysSinceCheckpoint = daysNow - (character.territoryDayCheckpoint || 0);
      const territorySettlement = settleTerritoryDays(
        { ...character, facilityDays: nextFacilityDays, facilityLevels: nextFacilityLevels },
        daysSinceCheckpoint,
      );

      const finalFacilityDays = territorySettlement ? territorySettlement.nextFacilityDays : nextFacilityDays;
      const finalFacilityLevels = territorySettlement ? territorySettlement.nextFacilityLevels : nextFacilityLevels;
      const finalLeveledUpThisJob = Math.max(finalFacilityLevels[job] || 0, newLevel);
      finalFacilityLevels[job] = finalLeveledUpThisJob;
      const territoryGoldDelta = territorySettlement ? territorySettlement.goldDelta : 0;
      const finalGold = Math.max(0, (character.gold || 0) + goldIncome + territoryGoldDelta);
      const finalMercenaries = territorySettlement ? territorySettlement.nextMercenaries : character.mercenaries;

      outcome = {
        job, goldIncome, gold: finalGold,
        mercenaries: finalMercenaries,
        turnPoints: nextTurns, turnPointsCap: turnCapForLevel(character.level, character.surveyBonusUnlocked),
        facilityDays: finalFacilityDays,
        facilityLevels: finalFacilityLevels,
        leveledUp: finalLeveledUpThisJob > prevLevel ? [{ jobId: job, name: TERRITORY_JOBS[job].name, level: finalLeveledUpThisJob }] : [],
        territoryNotice: territorySettlement ? {
          daysProcessed: territorySettlement.daysProcessed,
          goldIncome: territorySettlement.goldIncome,
          goldDelta: territorySettlement.goldDelta,
          leveledUp: territorySettlement.leveledUp,
        } : null,
      };
      return {
        [docPath]: {
          ...character,
          gold: finalGold,
          turnPoints: nextTurns,
          turnPointsUpdatedAt: now,
          totalTurnsSpent: nextTotalTurnsSpent,
          territoryDayCheckpoint: daysNow,
          mercenaries: finalMercenaries,
          updatedAt: now,
        },
        [facilitiesPath]: { facilityDays: finalFacilityDays, facilityLevels: finalFacilityLevels, updatedAt: now },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
