// RPG 턴 포인트 회복/상한 계산 — 크론 없이 조회 시점에 지연 계산
export const TURN_REGEN_MS = 6 * 60 * 1000; // 6분당 1턴 (시간당 10턴)
export const RANKING_BONUS_TURNS = 30;
export const RANKING_BONUS_RANK_CUTOFF = 100;

export function turnCapForLevel(level) {
  const lvl = Math.max(1, Number(level) || 1);
  return 10 + Math.floor((lvl - 1) / 10);
}

// turnPoints/turnPointsUpdatedAt(ms)는 마지막으로 "실제 소모"가 일어난 시점 기준 저장값.
// 지금 시점 기준 회복량을 얹어 상한 내로 클램프한 값을 반환한다(저장은 소모 시에만).
export function computeCurrentTurns(turnPoints, turnPointsUpdatedAtMs, level, nowMs = Date.now()) {
  const cap = turnCapForLevel(level);
  const stored = Number(turnPoints) || 0;
  const lastUpdate = Number(turnPointsUpdatedAtMs) || nowMs;
  const elapsedMs = Math.max(0, nowMs - lastUpdate);
  const regenerated = Math.floor(elapsedMs / TURN_REGEN_MS);
  return Math.min(cap, stored + regenerated);
}
