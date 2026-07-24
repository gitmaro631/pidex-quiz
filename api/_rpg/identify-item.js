// 미확인(감정 필요) 아이템 감정 - 감정 스크롤을 쓰면 즉시 확정, 스크롤 없이는 본인이나 활성
// 용병 중 누군가의 지혜가 그 아이템 등급의 요구치 이상이면 성공(무료, 실패해도 페널티 없음).
// 한 번 감정되면 그 itemId는 앞으로 계정 내내(이 캐릭터 한정) 항상 실제 스탯이 보임.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { ITEMS, RARITY_ITEM_LEVEL } from '../../data/rpg/items.js';
import { effectiveStats } from '../../rpg-combat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId, useScroll } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  const item = ITEMS[itemId];
  if (!item) return res.status(400).json({ error: 'unknown_item' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const identifiedItems = character.identifiedItems || [];
      if (identifiedItems.includes(itemId)) { outcome = { identified: true, itemId, alreadyKnown: true }; return null; }

      const inventory = [...(character.inventory || [])];
      let identified = false;

      if (useScroll) {
        if (inventoryQty(inventory, 'identify_scroll') < 1) { outcome = { error: 'not_enough_items' }; return null; }
        removeItem(inventory, 'identify_scroll', 1);
        identified = true;
      } else {
        const requiredWis = RARITY_ITEM_LEVEL[item.rarity] || 1;
        const selfWis = effectiveStats(character).wis;
        const bestMercWis = Math.max(0, ...(character.mercenaries || [])
          .filter((m) => m.assignment === 'active' && !m.hospitalized)
          .map((m) => effectiveStats(m).wis));
        identified = Math.max(selfWis, bestMercWis) >= requiredWis;
      }

      if (!identified) { outcome = { identified: false, itemId }; return null; }

      const nextIdentified = [...identifiedItems, itemId];
      const now = Date.now();
      outcome = { identified: true, itemId };
      return { ...character, inventory, identifiedItems: nextIdentified, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
