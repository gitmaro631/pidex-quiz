import { firestoreGetDoc, withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter } from '../_rpgCharacter.js';
import { goldListingDocPath } from '../_rpgGoldListing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, txid, username } = req.body;
  if (!paymentId || !txid) {
    return res.status(400).json({ error: 'paymentId and txid required' });
  }

  const apiKey = process.env.PI_NETWORK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'PI_NETWORK_API_KEY not configured' });
  }

  const response = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/complete`,
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    }
  );

  const data = await response.json();
  if (!response.ok) return res.status(response.status).json(data);

  if (data.metadata?.type === 'subscription' && username) {
    try { await saveSubscription(username); } catch (e) { console.error('Redis save failed:', e); }
  }

  // 골드 경매장 구매 결제 - Pi가 실제로 완료를 확인해준 이 시점에만 골드를 지급함(클라이언트 신고 절대 신뢰 안 함).
  // listingId는 결제 생성 시 넣은 metadata에서 그대로 돌아옴(pi-sdk.js의 createGoldPurchasePayment 참고)
  if (data.metadata?.type === 'gold_purchase' && data.metadata?.listingId) {
    try { await fulfillGoldPurchase(data.metadata.listingId, data); } catch (e) { console.error('Gold purchase fulfill failed:', e); }
  }

  return res.status(200).json(data);
}

async function saveSubscription(username) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  const ex = 30 * 24 * 3600;
  await fetch(`${url}/set/${encodeURIComponent('sub:' + username)}/${encodeURIComponent(expiry.toISOString())}?ex=${ex}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// 리스팅 문서에서 구매자를 알아내야 캐릭터 경로가 정해지므로 먼저 한 번 읽고(peek), 실제 지급은
// listingPath+구매자캐릭터Path를 묶은 원자적 트랜잭션으로 함. paymentId로 idempotency를 걸어서
// Pi SDK가 미완료 결제를 재시도(onIncompletePaymentFound)해도 골드가 중복 지급되지 않게 함
async function fulfillGoldPurchase(listingId, paymentData) {
  const listingPath = goldListingDocPath(listingId);
  const peek = await firestoreGetDoc(listingPath);
  if (!peek || peek.status !== 'reserved' || !peek.buyerUsername) return; // 이미 처리됐거나(재시도) 상태 이상 - 조용히 무시
  const buyerCharPath = characterDocPath(peek.buyerUsername, peek.buyerSlot);

  await withMultiDocTransaction([listingPath, buyerCharPath], async (docs) => {
    const listing = docs[listingPath];
    if (!listing || listing.status !== 'reserved') return {}; // 이미 지급 완료(재시도) - 아무것도 안 함, 중복지급 방지
    if (listing.paymentId !== paymentData.identifier) return {}; // 다른 결제가 이미 이 리스팅을 가져감

    const buyerChar = docs[buyerCharPath] || defaultCharacter(listing.buyerSlot);
    const now = Date.now();
    return {
      [listingPath]: { ...listing, status: 'sold', soldAt: now, txid: paymentData.transaction?.txid || null },
      [buyerCharPath]: { ...buyerChar, gold: (buyerChar.gold || 0) + listing.goldAmount, updatedAt: now },
    };
  });
}
