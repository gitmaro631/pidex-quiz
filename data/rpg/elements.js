// 속성 상성: 물→불→대기→물 순환(각 방향 다 보너스/페널티), 어둠↔신성은 서로 상극(양방향 보너스)
export const ELEMENTS = ['water', 'fire', 'air', 'dark', 'holy', 'none'];

const CYCLE = ['water', 'fire', 'air']; // water beats fire, fire beats air, air beats water

export const ADVANTAGE_MULT = 1.25;
export const DISADVANTAGE_MULT = 0.85;

// attacker 속성이 defender 속성에 대해 유/불리한지 판정, 데미지 배율 반환
export function elementalMultiplier(attackerEl, defenderEl) {
  if (!attackerEl || !defenderEl || attackerEl === 'none' || defenderEl === 'none') return 1;

  const aIdx = CYCLE.indexOf(attackerEl);
  const dIdx = CYCLE.indexOf(defenderEl);
  if (aIdx !== -1 && dIdx !== -1) {
    if ((aIdx + 1) % 3 === dIdx) return ADVANTAGE_MULT; // attacker beats defender
    if ((dIdx + 1) % 3 === aIdx) return DISADVANTAGE_MULT; // defender beats attacker
    return 1;
  }

  const isDarkHoly = (attackerEl === 'dark' && defenderEl === 'holy') || (attackerEl === 'holy' && defenderEl === 'dark');
  if (isDarkHoly) return ADVANTAGE_MULT; // 서로 상극 - 양방향 보너스

  return 1;
}
