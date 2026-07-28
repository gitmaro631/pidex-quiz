// 골드 경매장 - 판매 중인 리스팅 목록(골드 1개당 가격이 싼 순으로 정렬)
import { firestoreListCollection } from '../_firestore.js';
import { effectiveListingStatus } from '../_rpgGoldListing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rows = await firestoreListCollection('rpg_gold_listings');
    const open = rows
      .filter((r) => effectiveListingStatus(r) === 'open')
      .sort((a, b) => (a.priceTestPi / a.goldAmount) - (b.priceTestPi / b.goldAmount));
    return res.status(200).json({ listings: open });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
