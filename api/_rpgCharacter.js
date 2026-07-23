import { turnCapForLevel } from './_rpgTurns.js';
import { computeCharacterCombatStats } from '../rpg-combat.js';

export const MAX_CHARACTER_SLOTS = 3;

export function isValidSlot(slot) {
  const n = Number(slot);
  return Number.isInteger(n) && n >= 1 && n <= MAX_CHARACTER_SLOTS;
}

// 계정(username)당 최대 3캐릭 - 슬롯별로 완전히 독립된 문서
export function characterDocPath(username, slot) {
  return `rpg_characters/${encodeURIComponent(username)}__${slot}`;
}

export function defaultCharacter(slot, now = Date.now()) {
  const base = {
    slot,
    level: 1,
    xp: 0,
    statPoints: 0,
    stats: { str: 5, int: 5, agi: 5, vit: 5 },
    classMain: null,
    classSub: null,
    equipment: { weapon: null, armor: null, head: null, hands: null, feet: null, ring: null, necklace: null },
    inventory: [],
    inventorySlotBonus: 0,
    currentTown: 'town1',
    gold: 0,
    turnPoints: turnCapForLevel(1),
    turnPointsUpdatedAt: now,
    stance: 'stable',
    potionRules: [],
    zoneKillCounts: {},
    visitedZones: [],
    questFlags: {},
    loreUnlocked: [],
    createdAt: now,
    updatedAt: now,
  };
  const combatStats = computeCharacterCombatStats(base);
  return {
    ...base,
    currentHp: combatStats.maxHp,
    currentMp: combatStats.maxMp,
    currentStamina: combatStats.maxStamina,
  };
}
