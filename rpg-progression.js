// 레벨/경험치 순수 계산 모듈 — 지수형 곡선(후반 레벨업이 매우 힘들어짐), 레벨업시 스탯포인트 지급
const STAT_POINTS_PER_LEVEL = 3;
export const SUB_CLASS_UNLOCK_LEVEL = 10;

// level -> level+1로 가는 데 필요한 누적 경험치(그 레벨에서부터 카운트, character.xp는 "현재 레벨 내 진행도")
export function xpToNextLevel(level) {
  return Math.round(20 * Math.pow(level, 2.5));
}

// 경험치 획득을 반영하고 필요하면 여러 레벨을 한 번에 올림(레벨업 여러 번 발생 가능)
export function applyXpGain(character, xpGain) {
  let level = character.level || 1;
  let xp = (character.xp || 0) + xpGain;
  let statPoints = character.statPoints || 0;
  let levelsGained = 0;

  let threshold = xpToNextLevel(level);
  while (xp >= threshold) {
    xp -= threshold;
    level += 1;
    statPoints += STAT_POINTS_PER_LEVEL;
    levelsGained += 1;
    threshold = xpToNextLevel(level);
  }

  return { level, xp, statPoints, levelsGained };
}
