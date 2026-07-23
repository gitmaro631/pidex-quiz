// 캐릭터 전용 저장상자 - 마을마다 하나, 그 캐릭터만 접근 가능(다른 캐릭터와 공유 안 됨). 아이템 전용(골드는 이송상자에서).
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc, withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, isValidSlot } from '../_rpgCharacter.js';
import { addItem, removeItem, inventoryQty, capacityForCharacter } from '../_rpgInventory.js';
import { TOWNS } from '../../data/rpg/towns.js';
import { ITEMS } from '../../data/rpg/items.js';

function characterStorageDocPath(username, slot, townId) {
  return `rpg_character_storage/${encodeURIComponent(username)}__${slot}__${townId}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, townId, direction, itemId, qty } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!TOWNS[townId]) return res.status(400).json({ error: 'invalid_town' });

  const storagePath = characterStorageDocPath(username, slot, townId);

  if (direction === 'view') {
    const storage = await firestoreGetDoc(storagePath);
    return res.status(200).json({ items: storage?.items || [] });
  }
  if (direction !== 'deposit' && direction !== 'withdraw') return res.status(400).json({ error: 'invalid_direction' });

  const itemQty = Math.max(1, Math.floor(Number(qty) || 1));
  if (!itemId || !ITEMS[itemId]) return res.status(400).json({ error: 'unknown_item' });

  const characterPath = characterDocPath(username, slot);

  let outcome = null;
  try {
    await withMultiDocTransaction([characterPath, storagePath], (docs) => {
      const character = docs[characterPath];
      if (!character) { outcome = { error: 'character_not_found' }; return {}; }
      const storage = docs[storagePath] || { items: [] };
      const inventory = [...(character.inventory || [])];
      const storageItems = [...(storage.items || [])];

      if (direction === 'deposit') {
        if (inventoryQty(inventory, itemId) < itemQty) { outcome = { error: 'not_enough_items' }; return {}; }
        removeItem(inventory, itemId, itemQty);
        addItem(storageItems, itemId, itemQty); // 저장상자는 슬롯 제한 없음
      } else {
        if (inventoryQty(storageItems, itemId) < itemQty) { outcome = { error: 'not_enough_stored_items' }; return {}; }
        if (!addItem(inventory, itemId, itemQty, capacityForCharacter(character))) {
          outcome = { error: 'inventory_full' };
          return {};
        }
        removeItem(storageItems, itemId, itemQty);
      }

      const now = Date.now();
      outcome = { direction, storageItems };
      return {
        [characterPath]: { ...character, inventory, updatedAt: now },
        [storagePath]: { items: storageItems, updatedAt: now },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
