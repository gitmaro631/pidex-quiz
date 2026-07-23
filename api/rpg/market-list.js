// 유저간 거래(마켓) - 판매 등록: 인벤토리에서 아이템을 빼서 공개 리스팅으로 올린다.
import crypto from 'crypto';
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId, qty, pricePerUnit } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const sellQty = Math.max(1, Math.floor(Number(qty) || 1));
  const price = Math.max(1, Math.floor(Number(pricePerUnit) || 0));
  if (!ITEMS[itemId] || price < 1) return res.status(400).json({ error: 'invalid_listing' });

  const listingId = crypto.randomUUID();
  const characterPath = characterDocPath(username, slot);
  const listingPath = `rpg_market_listings/${listingId}`;

  let outcome = null;
  try {
    await withMultiDocTransaction([characterPath, listingPath], (docs) => {
      const character = docs[characterPath] || defaultCharacter(slot);
      const inventory = [...(character.inventory || [])];
      if (inventoryQty(inventory, itemId) < sellQty) { outcome = { error: 'not_enough_items' }; return {}; }
      removeItem(inventory, itemId, sellQty);

      const now = Date.now();
      outcome = { listingId, itemId, qty: sellQty, pricePerUnit: price };
      return {
        [characterPath]: { ...character, inventory, updatedAt: now },
        [listingPath]: {
          listingId, sellerUsername: username, sellerSlot: slot, itemId, qty: sellQty, pricePerUnit: price,
          createdAt: now, updatedAt: now,
        },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
