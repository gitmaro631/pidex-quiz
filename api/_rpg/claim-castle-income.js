// 성주 일일 수입 정산 - 하루 1회, 소유 중인 모든 성의 지역 등급(tier)에 비례한 골드를 받음.
// 등급이 일정 이상인 성은 결정/강화석도 소량 추가 지급.
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc, withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { tryAddItem } from '../_rpgInventory.js';
import { ZONES } from '../../data/rpg/zones.js';
import { CLASS_ESSENCE_ITEM } from '../../data/rpg/training.js';
import { GOLD_INCOME_PER_TIER, MATERIAL_BONUS_MIN_TIER, MATERIAL_BONUS_QTY, castleDocPath } from '../../data/rpg/castle.js';
import { facilityBonusMultiplier } from '../../data/rpg/facilities.js';

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    const preCheck = await firestoreGetDoc(docPath);
    const today = todayDateKey();
    if (preCheck && preCheck.lastCastleIncomeClaimDate === today) {
      return res.status(200).json({ gold: preCheck.gold || 0, income: 0, ownedZones: [], alreadyClaimed: true });
    }

    // 소유 중인 성 목록 조회(지역 수가 적어 개별 조회 - 컬렉션 쿼리 불필요)
    const ownedZones = [];
    for (const zoneId of Object.keys(ZONES)) {
      const castle = await firestoreGetDoc(castleDocPath(zoneId));
      if (castle && castle.ownerUsername === username && castle.ownerSlot === Number(slot)) {
        ownedZones.push(zoneId);
      }
    }

    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (character.lastCastleIncomeClaimDate === today) { outcome = { gold: character.gold || 0, income: 0, ownedZones: [], alreadyClaimed: true }; return null; }

      let income = 0;
      const inventory = [...(character.inventory || [])];
      const materialsGranted = [];
      for (const zoneId of ownedZones) {
        const zone = ZONES[zoneId];
        income += zone.tier * GOLD_INCOME_PER_TIER;
        if (zone.tier >= MATERIAL_BONUS_MIN_TIER) {
          const essenceItemId = CLASS_ESSENCE_ITEM[character.classMain];
          if (essenceItemId && tryAddItem(character, inventory, essenceItemId, MATERIAL_BONUS_QTY).ok) {
            materialsGranted.push({ itemId: essenceItemId, qty: MATERIAL_BONUS_QTY });
          }
          if (tryAddItem(character, inventory, 'enhance_stone', MATERIAL_BONUS_QTY).ok) {
            materialsGranted.push({ itemId: 'enhance_stone', qty: MATERIAL_BONUS_QTY });
          }
        }
      }

      income = Math.floor(income * facilityBonusMultiplier(character, 'clearing'));
      const now = Date.now();
      outcome = { gold: (character.gold || 0) + income, income, ownedZones, materialsGranted, alreadyClaimed: false };
      return { ...character, gold: (character.gold || 0) + income, inventory, lastCastleIncomeClaimDate: today, updatedAt: now };
    });

    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
