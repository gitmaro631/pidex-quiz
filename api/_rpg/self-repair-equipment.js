// 셀프 수리 - 수리스킬(등급 충족)과 수리 망치(1개 소모)가 있어야 함. 스킬 투자 보상으로 대장간
// 수리보다 저렴함(SELF_REPAIR_DISCOUNT)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';
import { rarityAllowedBySkill } from '../../data/rpg/enhancement.js';

const REPAIR_COST_PER_POINT_BY_RARITY = { normal: 2, uncommon: 3, rare: 5, epic: 8, legendary: 12 };
const SELF_REPAIR_DISCOUNT = 0.6; // 대장간 수리비의 60%만 냄(스킬 투자 보상)
const DURABILITY_SLOTS = ['weapon', 'offhand', 'shield', 'armor_top', 'armor_bottom'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, equipSlot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!DURABILITY_SLOTS.includes(equipSlot)) return res.status(400).json({ error: 'invalid_equip_slot' });

  const durabilityKey = `${equipSlot}Durability`;

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const equippedItemId = character.equipment[equipSlot];
      if (!equippedItemId) { outcome = { error: 'nothing_equipped' }; return null; }
      const equippedItem = ITEMS[equippedItemId];

      if (!rarityAllowedBySkill(equippedItem.rarity, character.repairSkillLevel || 0)) {
        outcome = { error: 'repair_skill_too_low' };
        return null;
      }
      if (inventoryQty(character.inventory, 'repair_hammer') < 1) { outcome = { error: 'not_enough_items' }; return null; }

      const durability = character.equipment[durabilityKey] ?? 100;
      if (durability >= 100) { outcome = { error: 'already_full_durability' }; return null; }

      const costPerPoint = REPAIR_COST_PER_POINT_BY_RARITY[equippedItem.rarity || 'normal'] || 2;
      const cost = Math.ceil((100 - durability) * costPerPoint * SELF_REPAIR_DISCOUNT);
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const inventory = [...(character.inventory || [])];
      removeItem(inventory, 'repair_hammer', 1);
      const equipment = { ...character.equipment, [durabilityKey]: 100 };
      const now = Date.now();

      outcome = { equipSlot, cost, gold: character.gold - cost, durability: 100 };
      return { ...character, gold: character.gold - cost, inventory, equipment, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
