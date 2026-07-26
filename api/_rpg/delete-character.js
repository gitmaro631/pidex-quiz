// 캐릭터 슬롯 삭제 - 되돌릴 수 없음. 골드/인벤토리/장비/용병을 전부 골드로 환산해 그 중 일부
// (REFUND_PCT)를 그 캐릭터가 마지막으로 있던 마을의 계정 공용창고(이송상자)에 적립함 -
// 같은 계정의 다른 캐릭터가 나중에 그 마을에서 찾아갈 수 있음. 저장상자(개인창고, 마을별)는
// 이송상자와 달리 그대로 통째로 사라짐(내용물 복구 안 됨) - 클라이언트에서 확인창을 띄움
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreDeleteDoc, firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, isValidSlot } from '../_rpgCharacter.js';
import { MERCENARY_TEMPLATES } from '../../data/rpg/mercenaries.js';
import { npcSellPrice } from '../../data/rpg/items.js';
import { TOWNS } from '../../data/rpg/towns.js';

const REFUND_PCT = 50; // 총자산 골드환산액 중 이 비율만 이송상자로 환급됨(나머지는 소멸)

function accountStorageDocPath(username, townId) {
  return `rpg_account_storage/${encodeURIComponent(username)}__${townId}`;
}
function characterStorageDocPath(username, slot, townId) {
  return `rpg_character_storage/${encodeURIComponent(username)}__${slot}__${townId}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  try {
    const docPath = characterDocPath(username, slot);
    const character = await firestoreGetDoc(docPath);
    if (!character) return res.status(200).json({ deleted: true, slot, refund: 0 });

    const inventoryValue = (character.inventory || []).reduce((sum, e) => sum + npcSellPrice(e.itemId) * e.qty, 0);
    const equipment = character.equipment || {};
    const equipSlots = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
    const equipmentValue = equipSlots.reduce((sum, s) => sum + (equipment[s] ? npcSellPrice(equipment[s]) : 0), 0);
    const mercValue = (character.mercenaries || []).reduce((sum, m) => {
      const template = MERCENARY_TEMPLATES[m.templateId];
      const baseValue = template ? Math.round(template.hireCost / 2) : 0;
      return sum + baseValue + (m.hireCostBonus || 0); // 종자 흡수로 오른 고용가치도 그대로 반영
    }, 0);
    const totalValue = (character.gold || 0) + inventoryValue + equipmentValue + mercValue;
    const refund = Math.floor(totalValue * REFUND_PCT / 100);
    const refundTown = character.currentTown && TOWNS[character.currentTown] ? character.currentTown : 'town1';

    if (refund > 0) {
      await withFirestoreTransaction(accountStorageDocPath(username, refundTown), (storage) => {
        const current = storage || { gold: 0, items: [] };
        return { ...current, gold: (current.gold || 0) + refund, updatedAt: Date.now() };
      });
    }

    await firestoreDeleteDoc(docPath);
    for (const townId of Object.keys(TOWNS)) {
      await firestoreDeleteDoc(characterStorageDocPath(username, slot, townId));
    }

    return res.status(200).json({ deleted: true, slot, refund, refundTown });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
