import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { isValidSlot } from '../_rpgCharacter.js';
import { goldListingDocPath, effectiveListingStatus } from '../_rpgGoldListing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, listingId, accessToken, slot } = req.body;
  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId required' });
  }

  // 골드 경매장 구매 결제면, Pi에 승인 요청을 보내기 전에 먼저 리스팅을 "예약" 상태로 잠가서 두 사람이
  // 동시에 같은 리스팅을 사는 걸 막음. 구매자는 accessToken으로 서버가 직접 검증(클라이언트가 보낸
  // username은 신뢰하지 않음 - _verifyPiUser.js 상단 주석 참고)
  if (listingId) {
    const buyerUsername = await verifyPiUser(accessToken);
    if (!buyerUsername) return res.status(401).json({ error: 'invalid accessToken' });
    if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

    let reserveError = null;
    await withFirestoreTransaction(goldListingDocPath(listingId), (listing) => {
      if (!listing) { reserveError = 'listing_not_found'; return null; }
      if (effectiveListingStatus(listing) !== 'open') { reserveError = 'listing_unavailable'; return null; }
      if (listing.sellerUsername === buyerUsername) { reserveError = 'cannot_buy_own_listing'; return null; }
      return { ...listing, status: 'reserved', buyerUsername, buyerSlot: slot, reservedAt: Date.now(), paymentId };
    });
    if (reserveError) return res.status(400).json({ error: reserveError });
  }

  const apiKey = process.env.PI_NETWORK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'PI_NETWORK_API_KEY not configured' });
  }

  const response = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/approve`,
    {
      method: 'POST',
      headers: { Authorization: `Key ${apiKey}` },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json(data);
  }
  return res.status(200).json(data);
}
