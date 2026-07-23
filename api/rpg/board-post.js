// 마을 게시판(포스트잇) 글쓰기 - 실시간 아님, 그냥 Firestore 컬렉션에 쌓임
import crypto from 'crypto';
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreSetDoc } from '../_firestore.js';
import { isValidSlot } from '../_rpgCharacter.js';
import { TOWNS } from '../../data/rpg/towns.js';

const MAX_MESSAGE_LENGTH = 150;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, townId, message } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!TOWNS[townId]) return res.status(400).json({ error: 'invalid_town' });

  const text = String(message || '').trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ error: 'invalid_message' });

  try {
    const postId = crypto.randomUUID();
    const now = Date.now();
    await firestoreSetDoc(`rpg_town_board/${postId}`, {
      postId, username, slot, townId, message: text, createdAt: now,
    });
    return res.status(200).json({ postId, message: text, createdAt: now });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
