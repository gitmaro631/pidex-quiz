import { verifyPiUserFull } from '../_verifyPiUser.js';
import { firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { accountFacilitiesDocPath, defaultAccountFacilities } from '../_rpgFacilities.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { computeCharacterCombatStats } from '../../rpg-combat.js';
import { fetchSurveyCompletion, isSurveyFullyComplete } from '../_rpgSurvey.js';

const SURVEY_CHECK_TTL_MS = 60 * 60 * 1000; // 1시간에 한 번만 재확인(매 캐릭터 조회마다 설문 문서를 읽으면 낭비)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, country } = req.body;
  const verified = await verifyPiUserFull(accessToken);
  if (!verified) return res.status(401).json({ error: 'invalid accessToken' });
  const { username, uid } = verified;
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

  try {
    const docPath = characterDocPath(username, slot);
    let character = await firestoreGetDoc(docPath);
    if (!character) {
      character = await withFirestoreTransaction(docPath, (current) => {
        if (current) return null; // 그 사이 다른 요청이 이미 생성함
        return defaultCharacter(slot);
      });
    }

    // 국적(모험 랭킹보드 국기 표시용) - 퀴즈 랭킹의 updateLeaderboardCountry와 같은 원칙으로,
    // 한 번 기록되면 덮어쓰지 않고 최초 확인값만 저장(기기/VPN 등으로 흔들려도 안정적으로 유지)
    if (country && !character.country) {
      character = { ...character, country };
      await withFirestoreTransaction(docPath, (current) => (
        current && !current.country ? { ...current, country } : null
      ));
    }

    // 영지 시설 레벨은 캐릭터 문서가 아니라 계정 공용 문서에서 옴(_rpgFacilities.js) - 같은 유저의
    // 캐릭터1/2/3이 전부 같은 시설을 공유(용병 배치는 캐릭터별로 그대로 유지). 필드 이름은 그대로
    // facilityDays/facilityLevels라 나머지 코드(client, rpg-combat.js 등)는 이 함수만 알면 됨
    const accountFacilities = (await firestoreGetDoc(accountFacilitiesDocPath(username, slot))) || defaultAccountFacilities();
    character = { ...character, facilityDays: accountFacilities.facilityDays, facilityLevels: accountFacilities.facilityLevels };

    // 설문 완료 여부는 자주 안 바뀌는 값이라 캐릭터 문서에 캐싱해두고, TTL이 지났을 때만 다시 확인함.
    // 완료 상태였다가(surveyBonusUnlocked:true) 이번에 다시 확인했는데 미완료로 바뀌었으면(설문 문항이
    // 추가/변경돼서) surveyBonusLapsed를 한 번만 내려줘서 클라이언트가 "재설문 필요" 안내를 띄우게 함
    const now = Date.now();
    const checkedAt = character.surveyBonusCheckedAt || 0;
    let surveyBonusLapsed = false;
    if (uid && now - checkedAt > SURVEY_CHECK_TTL_MS) {
      const surveyDoc = await fetchSurveyCompletion(uid);
      const nowUnlocked = !!surveyDoc && isSurveyFullyComplete(surveyDoc.completedIds, surveyDoc.answers);
      const wasUnlocked = !!character.surveyBonusUnlocked;
      if (wasUnlocked && !nowUnlocked) surveyBonusLapsed = true;
      character = { ...character, surveyBonusUnlocked: nowUnlocked, surveyBonusCheckedAt: now, updatedAt: now };
      await withFirestoreTransaction(docPath, (current) => ({ ...(current || character), surveyBonusUnlocked: nowUnlocked, surveyBonusCheckedAt: now, updatedAt: now }));
    }

    const currentTurns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);
    const combatStats = computeCharacterCombatStats(character);
    return res.status(200).json({
      ...character,
      turnPoints: currentTurns,
      turnPointsCap: turnCapForLevel(character.level, character.surveyBonusUnlocked),
      surveyBonusLapsed,
      maxHp: combatStats.maxHp,
      maxMp: combatStats.maxMp,
      maxStamina: combatStats.maxStamina,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
