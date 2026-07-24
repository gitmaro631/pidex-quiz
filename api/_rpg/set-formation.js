// 진형(전열/후열) 설정 - mercId 없으면 본인, 있으면 그 용병 대상. null이면 자동(장착무기 기준)으로 되돌림
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';

const VALID_ROWS = ['front', 'back', null];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId, formationRow } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!VALID_ROWS.includes(formationRow ?? null)) return res.status(400).json({ error: 'invalid_formation' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      if (mercId) {
        const mercenaries = character.mercenaries || [];
        const idx = mercenaries.findIndex((m) => m.id === mercId);
        if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }
        const nextMercenaries = [...mercenaries];
        nextMercenaries[idx] = { ...nextMercenaries[idx], formationRow: formationRow ?? null };
        outcome = { mercId, formationRow: formationRow ?? null };
        return { ...character, mercenaries: nextMercenaries, updatedAt: now };
      }
      outcome = { formationRow: formationRow ?? null };
      return { ...character, formationRow: formationRow ?? null, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
