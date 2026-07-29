// 해진 천(torn_cloth) 3개를 붕대 1개로 개조 - 재료 소재 활용도를 위한 제작 기능.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty, tryAddItem } from '../_rpgInventory.js';

const CLOTH_PER_BANDAGE = 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, qty } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

  const craftQty = Math.max(1, Math.floor(Number(qty) || 1));

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const inventory = [...(character.inventory || [])];
      const clothNeeded = craftQty * CLOTH_PER_BANDAGE;
      if (inventoryQty(inventory, 'torn_cloth') < clothNeeded) { outcome = { error: 'not_enough_material' }; return null; }

      removeItem(inventory, 'torn_cloth', clothNeeded);
      const added = tryAddItem(character, inventory, 'bandage', craftQty);
      if (!added.ok) { outcome = { error: added.reason }; return null; }

      const now = Date.now();
      outcome = { crafted: craftQty, clothUsed: clothNeeded };
      return { ...character, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
