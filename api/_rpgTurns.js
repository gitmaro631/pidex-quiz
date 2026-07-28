// RPG 턴 포인트 회복/상한 계산 — 크론 없이 조회 시점에 지연 계산
export const HOUR_MS = 60 * 60 * 1000;
export const RANKING_BONUS_TURNS = 30; // 실제 시간 기준 하루 1회(claim-daily-bonus.js) - 영지의 "턴소모 기반 하루"와는 별개
export const RANKING_BONUS_RANK_CUTOFF = 100;
// 설문조사를 전부 완료한 계정은 기본 턴 상한이 이만큼 더 높음(surveyBonusUnlocked, character.js가 계정별로
// 확인/캐싱함) - 상한이 높으면 회복도 그만큼 비례해서 빨라짐(아래 computeCurrentTurns 참고, 상한/24를
// 시간당 회복량으로 쓰기 때문에 상한이 3배면 회복도 3배가 됨)
export const SURVEY_BONUS_TURN_CAP_ADD = 20;

export function turnCapForLevel(level, surveyBonusUnlocked = false) {
  const lvl = Math.max(1, Number(level) || 1);
  const base = 30 + (surveyBonusUnlocked ? SURVEY_BONUS_TURN_CAP_ADD : 0); // 순수 기본값 30(설문 무관), 완료자는 +20 더
  return base + Math.floor(lvl / 5); // 5레벨마다 +1
}

// turnPoints/turnPointsUpdatedAt(ms)는 마지막으로 "실제 소모"가 일어난 시점 기준 저장값.
// 시간당 회복량 = 상한(cap)을 24로 나눈 값(하루치를 다 쓰면 하루 지나야 다시 가득 찬다는 개념) -
// 지금 시점 기준 회복량을 얹어 상한 내로 클램프한 값을 반환한다(저장은 소모 시에만)
export function computeCurrentTurns(turnPoints, turnPointsUpdatedAtMs, level, nowMs = Date.now(), surveyBonusUnlocked = false) {
  const cap = turnCapForLevel(level, surveyBonusUnlocked);
  const stored = Number(turnPoints) || 0;
  const lastUpdate = Number(turnPointsUpdatedAtMs) || nowMs;
  const elapsedMs = Math.max(0, nowMs - lastUpdate);
  const regenPerMs = (cap / 24) / HOUR_MS;
  const regenerated = Math.floor(elapsedMs * regenPerMs);
  return Math.min(cap, stored + regenerated);
}
