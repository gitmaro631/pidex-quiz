// 유저간 거래(마켓) - 구매: 리스팅 수량 차감 + 구매자 골드차감/아이템지급 + 판매자 골드지급(수수료 차감)
// 3개 문서(리스팅/구매자/판매자)를 withMultiDocTransaction으로 한 번에 원자 커밋 - 부분반영 방지.
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreGetDoc, withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem, capacityForCharacter } from '../_rpgInventory.js';

const MARKET_FEE_RATE = 0.15; // 고수수료로 화폐가치(골드) 유지

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, listingId, qty } = req.body;
  const buyerUsername = await verifyPiUser(accessToken);
  if (!buyerUsername) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const buyQty = Math.max(1, Math.floor(Number(qty) || 1));
  const listingPath = `rpg_market_listings/${listingId}`;

  // sellerUsername을 알아야 그 문서 경로를 트랜잭션 대상에 포함시킬 수 있어 사전 조회(거래 정합성은
  // 아래 원자적 트랜잭션이 재조회+precondition으로 보장하므로 이 사전조회는 라우팅 목적일 뿐)
  const listingPreview = await firestoreGetDoc(listingPath);
  if (!listingPreview) return res.status(404).json({ error: 'listing_not_found' });
  const sellerUsername = listingPreview.sellerUsername;
  const sellerSlot = listingPreview.sellerSlot;
  if (sellerUsername === buyerUsername && sellerSlot === slot) {
    return res.status(400).json({ error: 'cannot_buy_own_listing' });
  }

  const buyerPath = characterDocPath(buyerUsername, slot);
  const sellerPath = characterDocPath(sellerUsername, sellerSlot);

  let outcome = null;
  try {
    await withMultiDocTransaction([listingPath, buyerPath, sellerPath], (docs) => {
      const listing = docs[listingPath];
      if (!listing) { outcome = { error: 'listing_not_found' }; return {}; }
      if (buyQty > listing.qty) { outcome = { error: 'not_enough_stock' }; return {}; }

      const buyer = docs[buyerPath] || defaultCharacter(slot);
      const totalCost = listing.pricePerUnit * buyQty;
      if ((buyer.gold || 0) < totalCost) { outcome = { error: 'not_enough_gold' }; return {}; }

      const buyerInventory = [...(buyer.inventory || [])];
      if (!addItem(buyerInventory, listing.itemId, buyQty, capacityForCharacter(buyer))) {
        outcome = { error: 'inventory_full' };
        return {};
      }

      const fee = Math.floor(totalCost * MARKET_FEE_RATE);
      const sellerProceeds = totalCost - fee;
      const seller = docs[sellerPath] || defaultCharacter(sellerSlot);
      const now = Date.now();
      const remainingQty = listing.qty - buyQty;

      outcome = {
        listingId, itemId: listing.itemId, qty: buyQty, totalCost, fee, sellerProceeds,
        buyerGold: (buyer.gold || 0) - totalCost,
      };

      return {
        [listingPath]: { ...listing, qty: remainingQty, updatedAt: now },
        [buyerPath]: { ...buyer, gold: (buyer.gold || 0) - totalCost, inventory: buyerInventory, updatedAt: now },
        [sellerPath]: { ...seller, gold: (seller.gold || 0) + sellerProceeds, updatedAt: now },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
