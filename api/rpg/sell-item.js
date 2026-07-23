import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { ITEMS, npcSellPrice } from '../../data/rpg/items.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId, qty } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const sellQty = Math.max(1, Math.floor(Number(qty) || 1));
  if (!ITEMS[itemId]) return res.status(400).json({ error: 'unknown_item' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const inventory = [...(character.inventory || [])];
      if (inventoryQty(inventory, itemId) < sellQty) { outcome = { error: 'not_enough_items' }; return null; }

      removeItem(inventory, itemId, sellQty);
      const proceeds = npcSellPrice(itemId) * sellQty;
      const now = Date.now();
      outcome = { itemId, qty: sellQty, proceeds, gold: (character.gold || 0) + proceeds };
      return { ...character, gold: (character.gold || 0) + proceeds, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
