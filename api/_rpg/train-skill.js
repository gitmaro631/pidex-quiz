// 직업훈련소 - 결정+골드로 스킬을 배우거나(1단계) 단계를 올림(2~3단계). 단계가 오를수록 필요한
// 결정/골드가 늘어남(data/rpg/training.js의 TRAINING_TIER_COSTS 참고).
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { CLASSES } from '../../data/rpg/classes.js';
import { CLASS_ESSENCE_ITEM, MAX_SKILL_TIER, TRAINING_TIER_COSTS } from '../../data/rpg/training.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, skillId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (!character.classMain) { outcome = { error: 'no_class_selected' }; return null; }

      const cls = CLASSES[character.classMain];
      const skill = cls.skills.find((s) => s.id === skillId);
      if (!skill) { outcome = { error: 'invalid_skill' }; return null; }

      const skillLevels = character.skillLevels || {};
      const currentTier = skillLevels[skillId] || 0;
      const nextTier = currentTier + 1;
      if (nextTier > MAX_SKILL_TIER) { outcome = { error: 'max_tier_reached' }; return null; }

      const cost = TRAINING_TIER_COSTS[nextTier];
      const essenceItemId = CLASS_ESSENCE_ITEM[character.classMain];
      if ((character.gold || 0) < cost.gold) { outcome = { error: 'not_enough_gold' }; return null; }
      if (inventoryQty(character.inventory, essenceItemId) < cost.essence) { outcome = { error: 'not_enough_material' }; return null; }

      const inventory = [...(character.inventory || [])];
      removeItem(inventory, essenceItemId, cost.essence);
      const nextSkillLevels = { ...skillLevels, [skillId]: nextTier };
      const now = Date.now();

      outcome = { skillId, tier: nextTier, gold: character.gold - cost.gold, skillLevels: nextSkillLevels };
      return { ...character, gold: character.gold - cost.gold, inventory, skillLevels: nextSkillLevels, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
