// 로어(탐험일지) 언락 판정 - 순수함수, context에 이번 행동에서 발생한 사건들을 담아 넘긴다
import { LORE_ENTRIES } from './data/rpg/lore.js';

export function checkNewLoreUnlocks(character, context) {
  const unlocked = new Set(character.loreUnlocked || []);
  const newly = [];
  for (const entry of Object.values(LORE_ENTRIES)) {
    if (unlocked.has(entry.id)) continue;
    const t = entry.trigger;
    let met = false;
    if (t.type === 'questDone' && context.completedQuestId === t.questId) met = true;
    else if (t.type === 'zoneFirstVisit' && context.visitedZoneId === t.zoneId) met = true;
    else if (t.type === 'rareMonsterDefeated' && context.defeatedRareMonsterId === t.monsterId) met = true;
    if (met) newly.push(entry.id);
  }
  return newly;
}
