// 계정 공유 이송상자 - 마을마다 하나, 같은 계정의 캐릭터 3명이 서로 골드/아이템을 전달하는 용도.
// 예: 캐릭1이 마을2에서 입금 -> 나중에 캐릭2가 마을2에 방문해서 출금.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { firestoreGetDoc } from '../_firestore.js';
import { characterDocPath, isValidSlot } from '../_rpgCharacter.js';
import { addItem, removeItem, inventoryQty, capacityForCharacter } from '../_rpgInventory.js';
import { TOWNS } from '../../data/rpg/towns.js';
import { ITEMS } from '../../data/rpg/items.js';

function accountStorageDocPath(username, townId) {
  return `rpg_account_storage/${encodeURIComponent(username)}__${townId}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, townId, direction, gold, itemId, qty } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!TOWNS[townId]) return res.status(400).json({ error: 'invalid_town' });

  if (direction === 'view') {
    const storage = await firestoreGetDoc(accountStorageDocPath(username, townId));
    return res.status(200).json({ gold: storage?.gold || 0, items: storage?.items || [] });
  }

  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (direction !== 'deposit' && direction !== 'withdraw') return res.status(400).json({ error: 'invalid_direction' });

  const goldAmount = gold ? Math.max(1, Math.floor(Number(gold))) : 0;
  const itemQty = itemId ? Math.max(1, Math.floor(Number(qty) || 1)) : 0;
  if (!goldAmount && !(itemId && itemQty)) return res.status(400).json({ error: 'invalid_amount' });
  if (goldAmount && itemId) return res.status(400).json({ error: 'choose_one_resource_type' });
  if (itemId && !ITEMS[itemId]) return res.status(400).json({ error: 'unknown_item' });

  const characterPath = characterDocPath(username, slot);
  const storagePath = accountStorageDocPath(username, townId);

  let outcome = null;
  try {
    await withMultiDocTransaction([characterPath, storagePath], (docs) => {
      const character = docs[characterPath];
      if (!character) { outcome = { error: 'character_not_found' }; return {}; }
      const storage = docs[storagePath] || { gold: 0, items: [] };
      const inventory = [...(character.inventory || [])];
      const storageItems = [...(storage.items || [])];
      let charGold = character.gold || 0;
      let storeGold = storage.gold || 0;

      if (direction === 'deposit') {
        if (goldAmount) {
          if (charGold < goldAmount) { outcome = { error: 'not_enough_gold' }; return {}; }
          charGold -= goldAmount; storeGold += goldAmount;
        } else {
          if (inventoryQty(inventory, itemId) < itemQty) { outcome = { error: 'not_enough_items' }; return {}; }
          removeItem(inventory, itemId, itemQty);
          addItem(storageItems, itemId, itemQty); // 이송상자는 슬롯 제한 없음
        }
      } else {
        if (goldAmount) {
          if (storeGold < goldAmount) { outcome = { error: 'not_enough_stored_gold' }; return {}; }
          storeGold -= goldAmount; charGold += goldAmount;
        } else {
          if (inventoryQty(storageItems, itemId) < itemQty) { outcome = { error: 'not_enough_stored_items' }; return {}; }
          if (!addItem(inventory, itemId, itemQty, capacityForCharacter(character))) {
            outcome = { error: 'inventory_full' };
            return {};
          }
          removeItem(storageItems, itemId, itemQty);
        }
      }

      const now = Date.now();
      outcome = { direction, gold: charGold, storageGold: storeGold, storageItems };
      return {
        [characterPath]: { ...character, gold: charGold, inventory, updatedAt: now },
        [storagePath]: { gold: storeGold, items: storageItems, updatedAt: now },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
