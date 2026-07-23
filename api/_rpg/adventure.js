import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel } from '../_rpgTurns.js';
import { addItem, removeItem, capacityForCharacter } from '../_rpgInventory.js';
import { ZONES } from '../../data/rpg/zones.js';
import { TOWNS } from '../../data/rpg/towns.js';
import { resolveCombat } from '../../rpg-combat.js';
import { applyXpGain } from '../../rpg-progression.js';
import { checkNewLoreUnlocks } from '../../rpg-lore.js';
import { LORE_ENTRIES } from '../../data/rpg/lore.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const zone = ZONES[zoneId];
  if (!zone) return res.status(400).json({ error: 'invalid zoneId' });

  // updateFn은 재시도 시 다시 호출될 수 있음 - 마지막으로 실제 커밋된 시도의 outcome만 유효
  let outcome = null;

  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now);

      if (turns < 1) { outcome = { error: 'not_enough_turns' }; return null; }
      const inventory = [...(character.inventory || [])];
      if (zone.requiresTorch) {
        const torchQty = (inventory.find((e) => e.itemId === 'torch') || {}).qty || 0;
        if (torchQty < 1) { outcome = { error: 'no_torch' }; return null; }
        removeItem(inventory, 'torch', 1);
      }

      const combatResult = resolveCombat({ character, zoneId, stance: character.stance });

      const capacity = capacityForCharacter(character);
      const overflowedLoot = [];
      for (const drop of combatResult.loot) {
        if (!addItem(inventory, drop.itemId, drop.qty, capacity)) overflowedLoot.push(drop.itemId);
      }
      if (overflowedLoot.length) combatResult.log.push('인벤토리가 가득 차서 일부 전리품을 놓쳤다.');
      for (const [itemId, usedQty] of Object.entries(combatResult.potionsUsed)) removeItem(inventory, itemId, usedQty);

      // 죽으면(패배) 아이템은 그대로 유지한 채 마지막으로 있었던 마을로 돌아감 - 부활 자체는 무료지만
      // 다시 사냥터까지 가려면 소모품을 또 써야 하니 결과적으로 골드 소모를 유도함
      const nextTown = zone.town || character.currentTown || 'town1';
      if (!combatResult.victory) {
        const townName = (TOWNS[nextTown] || {}).name || nextTown;
        combatResult.log.push(`정신을 차려보니 ${townName}이었다.`);
      }

      const zoneKillCounts = { ...(character.zoneKillCounts || {}) };
      zoneKillCounts[zoneId] = combatResult.isRareEncounter
        ? 0
        : (zoneKillCounts[zoneId] || 0) + combatResult.killedMonsterIds.length;

      const visitedZones = [...(character.visitedZones || [])];
      const isFirstVisit = !visitedZones.includes(zoneId);
      if (isFirstVisit) visitedZones.push(zoneId);

      const defeatedRareMonsterId = (combatResult.isRareEncounter && combatResult.victory)
        ? combatResult.killedMonsterIds[0]
        : null;
      const loreContext = {
        visitedZoneId: isFirstVisit ? zoneId : null,
        defeatedRareMonsterId,
      };
      const newLoreIds = checkNewLoreUnlocks(character, loreContext);
      const loreUnlocked = [...(character.loreUnlocked || []), ...newLoreIds];
      const newLoreEntries = newLoreIds.map((id) => LORE_ENTRIES[id]);

      const nextTurns = turns - 1;
      const progression = applyXpGain(character, combatResult.xpGain);
      outcome = {
        newLore: newLoreEntries,
        log: combatResult.log,
        victory: combatResult.victory,
        isRareEncounter: combatResult.isRareEncounter,
        xpGain: combatResult.xpGain,
        goldGain: combatResult.goldGain,
        loot: combatResult.loot,
        turnPoints: nextTurns,
        turnPointsCap: turnCapForLevel(progression.level),
        currentHp: combatResult.finalHp,
        currentMp: combatResult.finalMp,
        finalHpPct: combatResult.finalHpPct,
        currentTown: nextTown,
        level: progression.level,
        levelsGained: progression.levelsGained,
        statPoints: progression.statPoints,
      };

      return {
        ...character,
        gold: (character.gold || 0) + combatResult.goldGain,
        level: progression.level,
        xp: progression.xp,
        statPoints: progression.statPoints,
        turnPoints: nextTurns,
        turnPointsUpdatedAt: now,
        currentHp: combatResult.finalHp,
        currentMp: combatResult.finalMp,
        currentTown: nextTown,
        inventory,
        zoneKillCounts,
        visitedZones,
        loreUnlocked,
        updatedAt: now,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
