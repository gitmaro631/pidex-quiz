// 골드 경매장 - 판매 등록. 등록 즉시 캐릭터 골드에서 에스크로(차감)해서, 동시에 여러 개 등록해도
// 실제로 없는 골드를 파는 걸 막음. 등록 수수료(등록 골드량의 0.1%, 최소 1골드)는 등록 시점에
// 항상 선불로 받고 취소해도 환불 안 됨(스팸 방지 목적의 골드 싱크) - 에스크로된 판매 골드 자체는
// 취소하면 환불됨(cancel-gold-listing.js), 팔리면 그대로 구매자에게 지급됨(api/payments/complete.js가
// 결제 완료 시 처리) - 반드시 테스트파이(Pi 샌드박스) 거래임
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction, firestoreListCollection } from '../_firestore.js';
import { characterDocPath, isValidSlot, defaultCharacter } from '../_rpgCharacter.js';
import { goldListingDocPath, effectiveListingStatus } from '../_rpgGoldListing.js';
import crypto from 'crypto';

const MIN_GOLD_LISTING = 100;
const MAX_OPEN_LISTINGS_PER_SELLER = 5;
const LISTING_FEE_PCT = 0.001;
const MIN_LISTING_FEE = 1;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, goldAmount, priceTestPi } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  const gold = Math.floor(Number(goldAmount));
  const price = Number(priceTestPi);
  if (!Number.isFinite(gold) || gold < MIN_GOLD_LISTING) return res.status(400).json({ error: 'invalid_gold_amount' });
  if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'invalid_price' });
  const fee = Math.max(MIN_LISTING_FEE, Math.floor(gold * LISTING_FEE_PCT));

  try {
    const allListings = await firestoreListCollection('rpg_gold_listings');
    const openCount = allListings.filter((l) => l.sellerUsername === username && effectiveListingStatus(l) === 'open').length;
    if (openCount >= MAX_OPEN_LISTINGS_PER_SELLER) return res.status(400).json({ error: 'too_many_listings' });

    const charPath = characterDocPath(username, slot);
    const listingId = crypto.randomUUID();
    const listingPath = goldListingDocPath(listingId);

    let outcome = null;
    await withMultiDocTransaction([charPath, listingPath], async (docs) => {
      const character = docs[charPath] || defaultCharacter(slot);
      if ((character.gold || 0) < gold + fee) { outcome = { error: 'not_enough_gold' }; return {}; }

      const now = Date.now();
      const listing = {
        id: listingId, sellerUsername: username, sellerSlot: slot,
        goldAmount: gold, priceTestPi: price, feeGold: fee, status: 'open', createdAt: now,
      };
      outcome = { listing };
      return {
        [charPath]: { ...character, gold: character.gold - gold - fee, updatedAt: now },
        [listingPath]: listing,
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
