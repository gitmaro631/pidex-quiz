// 인벤토리 화면의 상단고정(핀) 순서를 저장 - 다음 로그인에도 그대로 보이도록 character 문서에 영속화.
// 클라이언트가 전체 배열을 통째로 보내서 그대로 덮어씀(핀은 소량이라 부분 갱신 필요 없음)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const MAX_PINNED_ITEMS = 40;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, pinnedItemIds } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!Array.isArray(pinnedItemIds) || pinnedItemIds.some((id) => typeof id !== 'string')) {
    return res.status(400).json({ error: 'invalid_pinned_items' });
  }
  const nextPinned = pinnedItemIds.slice(0, MAX_PINNED_ITEMS);

  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      return { ...character, pinnedItemIds: nextPinned, updatedAt: Date.now() };
    });
    return res.status(200).json({ pinnedItemIds: nextPinned });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
