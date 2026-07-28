import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem } from '../_rpgInventory.js';

const VALID_EQUIP_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
// 용병은 반지/목걸이 슬롯이 없음(equip.js의 MERC_EQUIPPABLE_TYPES와 동일 기준)
const MERC_VALID_EQUIP_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom'];
const DURABILITY_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, equipSlot, mercId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  const validSlots = mercId ? MERC_VALID_EQUIP_SLOTS : VALID_EQUIP_SLOTS;
  if (!validSlots.includes(equipSlot)) return res.status(400).json({ error: 'invalid_equip_slot' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = [...(character.mercenaries || [])];
      const mercIdx = mercId ? mercenaries.findIndex((m) => m.id === mercId) : -1;
      if (mercId && mercIdx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }
      const target = mercId ? mercenaries[mercIdx] : character;

      const equipment = { ...(target.equipment || {}) };
      const equippedItemId = equipment[equipSlot];
      if (!equippedItemId) { outcome = { error: 'nothing_equipped' }; return null; }

      const inventory = [...(character.inventory || [])];
      addItem(inventory, equippedItemId, 1);
      equipment[equipSlot] = null;
      if (DURABILITY_SLOTS.includes(equipSlot)) {
        equipment[`${equipSlot}Durability`] = 100;
        equipment[`${equipSlot}EnhanceLevel`] = 0;
      }

      const now = Date.now();
      outcome = { equipSlot, unequipped: equippedItemId, mercId: mercId || null };
      if (mercId) {
        mercenaries[mercIdx] = { ...target, equipment };
        return { ...character, mercenaries, inventory, updatedAt: now };
      }
      return { ...character, equipment, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
