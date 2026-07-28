import { verifyPiUserFull } from '../_verifyPiUser.js';
import { firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { computeCharacterCombatStats } from '../../rpg-combat.js';
import { fetchSurveyCompletion, isSurveyFullyComplete } from '../_rpgSurvey.js';

const SURVEY_CHECK_TTL_MS = 60 * 60 * 1000; // 1시간에 한 번만 재확인(매 캐릭터 조회마다 설문 문서를 읽으면 낭비)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const verified = await verifyPiUserFull(accessToken);
  if (!verified) return res.status(401).json({ error: 'invalid accessToken' });
  const { username, uid } = verified;
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  try {
    const docPath = characterDocPath(username, slot);
    let character = await firestoreGetDoc(docPath);
    if (!character) {
      character = await withFirestoreTransaction(docPath, (current) => {
        if (current) return null; // 그 사이 다른 요청이 이미 생성함
        return defaultCharacter(slot);
      });
    }

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
