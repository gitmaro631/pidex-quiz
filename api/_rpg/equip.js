import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem, removeItem, inventoryQty, capacityForCharacter } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';
import { CLASSES } from '../../data/rpg/classes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const item = ITEMS[itemId];
  if (!item || (item.type !== 'weapon' && item.type !== 'armor')) {
    return res.status(400).json({ error: 'not_equippable' });
  }
  const equipSlot = item.type; // 'weapon' | 'armor'

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const inventory = [...(character.inventory || [])];
      if (inventoryQty(inventory, itemId) < 1) { outcome = { error: 'item_not_owned' }; return null; }

      if (equipSlot === 'weapon') {
        const cls = CLASSES[character.classMain] || CLASSES.warrior;
        if (item.weaponType && !cls.weaponTypes.includes(item.weaponType)) {
          outcome = { error: 'wrong_weapon_type' };
          return null;
        }
      }

      const equipment = { ...(character.equipment || {}) };
      const previous = equipment[equipSlot];
      removeItem(inventory, itemId, 1);
      if (previous && !addItem(inventory, previous, 1, capacityForCharacter(character))) {
        outcome = { error: 'inventory_full' };
        return null;
      }
      equipment[equipSlot] = itemId;

      const now = Date.now();
      outcome = { equipSlot, equipped: itemId, previous: previous || null };
      return { ...character, equipment, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
