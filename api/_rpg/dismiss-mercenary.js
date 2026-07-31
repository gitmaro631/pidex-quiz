// 용병 해고 - 골드 환급은 없음(고용비는 선술집에서 고용할 때 한 번만 내는 비용이라 돌려주지 않음).
// 용병이 입고 있던 장비(무기/방패/상하의)는 유저 가방으로 강제 반납됨 - 칸/무게가 이미 꽉 차 있어도
// 반납 자체는 막지 않고(addItem을 capacity 인자 없이 호출해 한도 무시) 대신 그 상태로는 사냥·마을이동이
// 막히게 해서(_rpgInventory.js의 isOverCapacity, adventure.js/travel-town.js 참고) 정리를 유도함
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem } from '../_rpgInventory.js';

const MERC_EQUIP_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId) return res.status(400).json({ error: 'invalid_mercenary' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const merc = mercenaries.find((m) => m.id === mercId);
      if (!merc) { outcome = { error: 'mercenary_not_found' }; return null; }

      const inventory = [...(character.inventory || [])];
      const returnedItems = [];
      for (const equipSlot of MERC_EQUIP_SLOTS) {
        const itemId = merc.equipment && merc.equipment[equipSlot];
        if (itemId) { addItem(inventory, itemId, 1); returnedItems.push(itemId); }
      }

      const nextMercenaries = mercenaries.filter((m) => m.id !== mercId);
      const now = Date.now();
      outcome = { dismissed: mercId, returnedItems };
      return { ...character, mercenaries: nextMercenaries, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
