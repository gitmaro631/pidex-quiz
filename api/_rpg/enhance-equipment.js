// 대장간 강화 - 강화석+골드로 장착 중인 무기(공격력)/방어구(방어력)를 1단계씩 올림(최대 10단계).
// 단계가 오를수록 필요량이 늘어남(data/rpg/enhancement.js 참고). 내구도와 같은 원칙으로 장비를
// 갈아끼우면 강화 단계는 초기화됨(개별 아이템 인스턴스를 추적하지 않는 기존 설계와 동일한 v1 단순화)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { MAX_ENHANCE_LEVEL, ENHANCE_LEVEL_COSTS } from '../../data/rpg/enhancement.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, equipSlot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  const DURABILITY_SLOTS = ['weapon', 'offhand', 'shield', 'armor_top', 'armor_bottom'];
  if (!DURABILITY_SLOTS.includes(equipSlot)) return res.status(400).json({ error: 'invalid_equip_slot' });

  const levelKey = `${equipSlot}EnhanceLevel`;

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (!character.equipment[equipSlot]) { outcome = { error: 'nothing_equipped' }; return null; }

      const currentLevel = character.equipment[levelKey] || 0;
      const nextLevel = currentLevel + 1;
      if (nextLevel > MAX_ENHANCE_LEVEL) { outcome = { error: 'max_tier_reached' }; return null; }

      const cost = ENHANCE_LEVEL_COSTS[nextLevel];
      if ((character.gold || 0) < cost.gold) { outcome = { error: 'not_enough_gold' }; return null; }
      if (inventoryQty(character.inventory, 'enhance_stone') < cost.stones) { outcome = { error: 'not_enough_material' }; return null; }

      const inventory = [...(character.inventory || [])];
      removeItem(inventory, 'enhance_stone', cost.stones);
      const equipment = { ...character.equipment, [levelKey]: nextLevel };
      const now = Date.now();

      outcome = { equipSlot, level: nextLevel, cost, gold: character.gold - cost.gold };
      return { ...character, gold: character.gold - cost.gold, inventory, equipment, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
