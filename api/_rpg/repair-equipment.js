// 무기/방어구 수리 - 내구도 부족분만큼 골드로 100까지 복구
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { ITEMS } from '../../data/rpg/items.js';

// 내구도 1당 수리비 - 장비 등급이 높을수록 비쌈
const REPAIR_COST_PER_POINT_BY_RARITY = { normal: 2, uncommon: 3, rare: 5, epic: 8, legendary: 12 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, equipSlot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  const DURABILITY_SLOTS = ['weapon', 'offhand', 'shield', 'armor_top', 'armor_bottom'];
  if (!DURABILITY_SLOTS.includes(equipSlot)) return res.status(400).json({ error: 'invalid_equip_slot' });

  const durabilityKey = `${equipSlot}Durability`;

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (!character.equipment[equipSlot]) { outcome = { error: 'nothing_equipped' }; return null; }

      const durability = character.equipment[durabilityKey] ?? 100;
      if (durability >= 100) { outcome = { error: 'already_full_durability' }; return null; }

      const equippedItem = ITEMS[character.equipment[equipSlot]];
      const costPerPoint = REPAIR_COST_PER_POINT_BY_RARITY[(equippedItem && equippedItem.rarity) || 'normal'] || 2;
      const cost = Math.ceil((100 - durability) * costPerPoint);
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const equipment = { ...character.equipment, [durabilityKey]: 100 };
      const now = Date.now();
      outcome = { equipSlot, cost, gold: character.gold - cost, durability: 100 };
      return { ...character, gold: character.gold - cost, equipment, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
