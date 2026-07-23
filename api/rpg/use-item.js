// 전투 밖(마을/스토리 진행 중 등)에서 언제든 소모품을 사용하는 엔드포인트 - 턴포인트 소모 없음.
// 포션(HP/MP/스테미나 회복)과 가방(인벤토리 슬롯 영구 확장)을 여기서 함께 처리한다.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';
import { computeCharacterCombatStats } from '../../rpg-combat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const item = ITEMS[itemId];
  const isPotion = item && (item.healPct || item.restoreMpPct || item.restoreStaminaPct);
  const isBag = item && item.type === 'bag';
  if (!item || (!isPotion && !isBag)) return res.status(400).json({ error: 'not_usable' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const inventory = [...(character.inventory || [])];
      if (inventoryQty(inventory, itemId) < 1) { outcome = { error: 'item_not_owned' }; return null; }

      removeItem(inventory, itemId, 1);
      const now = Date.now();
      let patch = { inventory, updatedAt: now };

      if (isBag) {
        const inventorySlotBonus = (character.inventorySlotBonus || 0) + item.slotBonus;
        patch = { ...patch, inventorySlotBonus };
        outcome = { itemId, effect: 'bag', slotBonus: item.slotBonus, inventorySlotBonus };
      } else {
        const combatStats = computeCharacterCombatStats(character);
        const currentHp = typeof character.currentHp === 'number' ? character.currentHp : combatStats.maxHp;
        const currentMp = typeof character.currentMp === 'number' ? character.currentMp : combatStats.maxMp;
        const currentStamina = typeof character.currentStamina === 'number' ? character.currentStamina : combatStats.maxStamina;

        const nextHp = item.healPct ? Math.min(combatStats.maxHp, currentHp + Math.round(combatStats.maxHp * item.healPct)) : currentHp;
        const nextMp = item.restoreMpPct ? Math.min(combatStats.maxMp, currentMp + Math.round(combatStats.maxMp * item.restoreMpPct)) : currentMp;
        const nextStamina = item.restoreStaminaPct ? Math.min(combatStats.maxStamina, currentStamina + Math.round(combatStats.maxStamina * item.restoreStaminaPct)) : currentStamina;

        patch = { ...patch, currentHp: nextHp, currentMp: nextMp, currentStamina: nextStamina };
        outcome = {
          itemId, effect: 'potion',
          currentHp: nextHp, maxHp: combatStats.maxHp,
          currentMp: nextMp, maxMp: combatStats.maxMp,
          currentStamina: nextStamina, maxStamina: combatStats.maxStamina,
        };
      }

      return { ...character, ...patch };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
