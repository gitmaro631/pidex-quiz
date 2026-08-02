// 레벨/경험치 순수 계산 모듈 — 지수형 곡선(후반 레벨업이 매우 힘들어짐), 레벨업시 스탯포인트 지급
import { VIT_HP_PER_LEVEL, MAGIC_STAT_MP_PER_LEVEL, AGI_STAMINA_PER_LEVEL } from './rpg-combat.js';

const STAT_POINTS_PER_LEVEL = 3;
export const SUB_CLASS_UNLOCK_LEVEL = 15;

// level -> level+1로 가는 데 필요한 누적 경험치(그 레벨에서부터 카운트, character.xp는 "현재 레벨 내 진행도")
export function xpToNextLevel(level) {
  return Math.round(20 * Math.pow(level, 2.5));
}

// 경험치 획득을 반영하고 필요하면 여러 레벨을 한 번에 올림(레벨업 여러 번 발생 가능).
// statSnapshot({vit, mainStat, agi})을 넘기면(본인 캐릭터 전용 - adventure.js/claim-quest.js 참고) 레벨업
// "그 순간"의 스탯 기준으로 체력/마나/스태미나 증가분을 vitHpAccrued/mainStatMpAccrued/agiStaminaAccrued에
// 영구 누적함 - 나중에 스탯을 더 찍어도 이미 지난 레벨업분은 재계산되지 않음(초반에 VIT를 몰아 찍은
// 캐릭터가 나중에 같은 VIT를 찍은 캐릭터보다 최대체력이 더 높게 굳어지는 효과). 용병(statSnapshot 없음)은
// 이 로직 자체를 안 타고 예전처럼 rpg-combat.js가 현재 스탯으로 그때그때 계산함
export function applyXpGain(character, xpGain, statSnapshot) {
  let level = character.level || 1;
  let xp = (character.xp || 0) + xpGain;
  let statPoints = character.statPoints || 0;
  let levelsGained = 0;

  let vitHpAccrued = character.vitHpAccrued;
  let mainStatMpAccrued = character.mainStatMpAccrued;
  let agiStaminaAccrued = character.agiStaminaAccrued;
  if (statSnapshot) {
    // 처음 도입되는 캐릭터(누적치 없음)는 기존 공식(스탯×레벨×계수)으로 역산한 값을 시작점으로 삼아서
    // 전환 시점에 체력/마나/스태미나가 갑자기 떨어지는 일이 없게 함
    if (vitHpAccrued == null) vitHpAccrued = Math.round(statSnapshot.vit * level * VIT_HP_PER_LEVEL);
    if (mainStatMpAccrued == null) mainStatMpAccrued = Math.round(statSnapshot.mainStat * level * MAGIC_STAT_MP_PER_LEVEL);
    if (agiStaminaAccrued == null) agiStaminaAccrued = Math.round(statSnapshot.agi * level * AGI_STAMINA_PER_LEVEL);
  }

  let threshold = xpToNextLevel(level);
  while (xp >= threshold) {
    xp -= threshold;
    level += 1;
    statPoints += STAT_POINTS_PER_LEVEL;
    levelsGained += 1;
    threshold = xpToNextLevel(level);
    if (statSnapshot) {
      vitHpAccrued += Math.round(statSnapshot.vit * VIT_HP_PER_LEVEL);
      mainStatMpAccrued += Math.round(statSnapshot.mainStat * MAGIC_STAT_MP_PER_LEVEL);
      agiStaminaAccrued += Math.round(statSnapshot.agi * AGI_STAMINA_PER_LEVEL);
    }
  }

  const result = { level, xp, statPoints, levelsGained };
  if (statSnapshot) Object.assign(result, { vitHpAccrued, mainStatMpAccrued, agiStaminaAccrued });
  return result;
}
