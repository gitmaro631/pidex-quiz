import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem, capacityForCharacter } from '../_rpgInventory.js';
import { QUESTS } from '../../data/rpg/quests.js';
import { checkQuestCondition } from '../../rpg-quests.js';
import { applyXpGain } from '../../rpg-progression.js';
import { checkNewLoreUnlocks } from '../../rpg-lore.js';
import { LORE_ENTRIES } from '../../data/rpg/lore.js';
import { effectiveStats } from '../../rpg-combat.js';
import { CLASSES } from '../../data/rpg/classes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, questId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

  const quest = QUESTS[questId];
  if (!quest) return res.status(400).json({ error: 'invalid_quest' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const questFlags = { ...(character.questFlags || {}) };
      if (questFlags[questId] === 'done') { outcome = { error: 'quest_already_done' }; return null; }
      if (!checkQuestCondition(character, quest.condition)) { outcome = { error: 'quest_condition_not_met' }; return null; }

      const inventory = [...(character.inventory || [])];
      let overflowed = false;
      if (quest.reward.itemId) {
        if (!addItem(inventory, quest.reward.itemId, quest.reward.qty || 1, capacityForCharacter(character))) {
          overflowed = true;
        }
      }

      // 체력/마나/스태미나 레벨업 고정 시스템 - 본인 캐릭터 전용(adventure.js와 동일 규칙)
      const playerEffStats = effectiveStats(character);
      const playerMainClass = CLASSES[character.classMain] || CLASSES.warrior;
      const statSnapshot = { vit: playerEffStats.vit, mainStat: playerEffStats[playerMainClass.statScaling.atk] ?? playerEffStats.str, agi: playerEffStats.agi };
      const progression = applyXpGain(character, quest.reward.xp || 0, statSnapshot);
      questFlags[questId] = 'done';
      const now = Date.now();

      const newLoreIds = checkNewLoreUnlocks(character, { completedQuestId: questId });
      const loreUnlocked = [...(character.loreUnlocked || []), ...newLoreIds];
      const newLoreEntries = newLoreIds.map((id) => LORE_ENTRIES[id]);

      outcome = {
        questId, reward: quest.reward, overflowed, newLore: newLoreEntries,
        gold: (character.gold || 0) + (quest.reward.gold || 0),
        level: progression.level, levelsGained: progression.levelsGained,
      };

      return {
        ...character,
        gold: (character.gold || 0) + (quest.reward.gold || 0),
        level: progression.level,
        xp: progression.xp,
        statPoints: progression.statPoints,
        vitHpAccrued: progression.vitHpAccrued,
        mainStatMpAccrued: progression.mainStatMpAccrued,
        agiStaminaAccrued: progression.agiStaminaAccrued,
        inventory,
        questFlags,
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
