// 전투 중 자동 포션 사용 규칙 저장 - rpg-combat.js의 maybeUsePotion()이 이 배열을 순서대로 확인함
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { ITEMS } from '../../data/rpg/items.js';

const MAX_PER_BATTLE_CAP = 10;

function sanitizeRule(rule) {
  const item = ITEMS[rule?.itemId];
  if (!item || !item.healPct) return null; // 현재는 HP 회복형 포션만 자동사용 대상
  const hpThresholdPct = Math.min(100, Math.max(1, Math.floor(Number(rule.hpThresholdPct))));
  const maxPerBattle = Math.min(MAX_PER_BATTLE_CAP, Math.max(1, Math.floor(Number(rule.maxPerBattle))));
  if (!Number.isFinite(hpThresholdPct) || !Number.isFinite(maxPerBattle)) return null;
  return { itemId: rule.itemId, hpThresholdPct, maxPerBattle };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, potionRules } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!Array.isArray(potionRules)) return res.status(400).json({ error: 'invalid_rules' });

  const sanitized = potionRules.map(sanitizeRule).filter(Boolean);
  if (sanitized.length !== potionRules.length) return res.status(400).json({ error: 'invalid_rules' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      outcome = { potionRules: sanitized };
      return { ...character, potionRules: sanitized, updatedAt: now };
    });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
