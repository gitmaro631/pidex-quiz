// 골드 경매장 - 본인 리스팅 취소(아직 팔리기 전(open)만 가능). 에스크로했던 골드를 그대로 환불
import { verifyPiUser } from '../_verifyPiUser.js';
import { withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, isValidSlot, defaultCharacter } from '../_rpgCharacter.js';
import { goldListingDocPath, effectiveListingStatus } from '../_rpgGoldListing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, listingId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!listingId) return res.status(400).json({ error: 'invalid_listing' });

  const charPath = characterDocPath(username, slot);
  const listingPath = goldListingDocPath(listingId);

  let outcome = null;
  try {
    await withMultiDocTransaction([charPath, listingPath], async (docs) => {
      const listing = docs[listingPath];
      if (!listing) { outcome = { error: 'listing_not_found' }; return {}; }
      if (listing.sellerUsername !== username || listing.sellerSlot !== slot) { outcome = { error: 'not_your_listing' }; return {}; }
      if (effectiveListingStatus(listing) !== 'open') { outcome = { error: 'listing_not_cancellable' }; return {}; }

      const character = docs[charPath] || defaultCharacter(slot);
      const now = Date.now();
      outcome = { cancelled: true, gold: (character.gold || 0) + listing.goldAmount };
      return {
        [charPath]: { ...character, gold: (character.gold || 0) + listing.goldAmount, updatedAt: now },
        [listingPath]: { ...listing, status: 'cancelled', cancelledAt: now },
      };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
