import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { tryAddItem } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';
import { TOWNS } from '../../data/rpg/towns.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId, qty } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const buyQty = Math.max(1, Math.floor(Number(qty) || 1));
  const item = ITEMS[itemId];
  if (!item || !item.shopPrice) return res.status(400).json({ error: 'not_purchasable' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const townTier = (TOWNS[character.currentTown] || {}).tier || 1;
      if ((item.minTownTier || 1) > townTier) { outcome = { error: 'not_purchasable' }; return null; }
      const cost = item.shopPrice * buyQty;
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const inventory = [...(character.inventory || [])];
      const added = tryAddItem(character, inventory, itemId, buyQty);
      if (!added.ok) { outcome = { error: added.reason }; return null; }
      const now = Date.now();
      outcome = { itemId, qty: buyQty, cost, gold: character.gold - cost };
      return { ...character, gold: character.gold - cost, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
