// 턴이 완전히 바닥났을 때, 퀴즈를 몇 문제 푼 걸 대가로 1시간에 한 번만 기본 턴 상한까지 즉시 채워줌
// (퀴즈 문제 수는 클라이언트가 로컬로 세서 보내는 값이라 완벽한 서버검증은 아니지만, 이 앱의 다른
// 자기신고 기반 진행상황과 같은 신뢰 수준 - 계정 단위 쿨다운으로 남용은 막음)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, accountDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';

const COOLDOWN_MS = 60 * 60 * 1000; // 1시간에 한 번
const REQUIRED_QUIZ_ANSWERS = 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, quizAnswersSolved } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if ((Number(quizAnswersSolved) || 0) < REQUIRED_QUIZ_ANSWERS) return res.status(400).json({ error: 'not_enough_quiz_answers' });

  const accPath = accountDocPath(username);
  const charPath = characterDocPath(username, slot);

  let outcome = null;
  try {
    await withMultiDocTransaction([accPath, charPath], async (docs) => {
      const account = docs[accPath] || { createdAt: Date.now() };
      const character = docs[charPath] || defaultCharacter(slot);
      const now = Date.now();

      const remainingCooldown = COOLDOWN_MS - (now - (account.lastQuizTurnRefillAt || 0));
      if (remainingCooldown > 0) { outcome = { error: 'refill_on_cooldown' }; return {}; }

      const currentTurns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now, character.surveyBonusUnlocked);
      if (currentTurns > 0) { outcome = { error: 'turns_not_empty' }; return {}; }

      const cap = turnCapForLevel(character.level, character.surveyBonusUnlocked);
      outcome = { turnPoints: cap, turnPointsCap: cap };

      return {
        [accPath]: { ...account, lastQuizTurnRefillAt: now, updatedAt: now },
        [charPath]: { ...character, turnPoints: cap, turnPointsUpdatedAt: now, updatedAt: now },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
