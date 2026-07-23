// 랜덤박스(뽑기) - 골드 소모처. 박스 자체는 인벤토리에 안 쌓이고 즉시 결과 아이템만 지급.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem, capacityForCharacter } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';

const LOOT_POOL = [
  { itemId: 'ring_normal', weight: 25 },
  { itemId: 'necklace_normal', weight: 25 },
  { itemId: 'weapon_uncommon', weight: 15 },
  { itemId: 'armor_uncommon', weight: 15 },
  { itemId: 'ring_uncommon', weight: 12 },
  { itemId: 'necklace_uncommon', weight: 12 },
  { itemId: 'weapon_rare', weight: 5 },
  { itemId: 'armor_rare', weight: 5 },
  { itemId: 'ring_rare', weight: 4 },
  { itemId: 'necklace_rare', weight: 4 },
  { itemId: 'weapon_legendary', weight: 1 },
  { itemId: 'armor_legendary', weight: 1 },
];

function rollLootPool() {
  const total = LOOT_POOL.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of LOOT_POOL) {
    if (roll < entry.weight) return entry.itemId;
    roll -= entry.weight;
  }
  return LOOT_POOL[0].itemId;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const boxPrice = ITEMS.random_box.shopPrice;

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if ((character.gold || 0) < boxPrice) { outcome = { error: 'not_enough_gold' }; return null; }

      const wonItemId = rollLootPool();
      const inventory = [...(character.inventory || [])];
      const overflowed = !addItem(inventory, wonItemId, 1, capacityForCharacter(character));
      const now = Date.now();

      outcome = {
        itemId: wonItemId,
        rarity: ITEMS[wonItemId].rarity,
        overflowed,
        gold: (character.gold || 0) - boxPrice,
      };

      return { ...character, gold: (character.gold || 0) - boxPrice, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
