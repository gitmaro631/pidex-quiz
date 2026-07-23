import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem } from '../_rpgInventory.js';

const VALID_EQUIP_SLOTS = ['weapon', 'armor', 'head', 'hands', 'feet', 'ring', 'necklace'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, equipSlot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!VALID_EQUIP_SLOTS.includes(equipSlot)) return res.status(400).json({ error: 'invalid_equip_slot' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const equipment = { ...(character.equipment || {}) };
      const equippedItemId = equipment[equipSlot];
      if (!equippedItemId) { outcome = { error: 'nothing_equipped' }; return null; }

      const inventory = [...(character.inventory || [])];
      addItem(inventory, equippedItemId, 1);
      equipment[equipSlot] = null;

      const now = Date.now();
      outcome = { equipSlot, unequipped: equippedItemId };
      return { ...character, equipment, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
