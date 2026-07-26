// 부상 입은 용병을 병원에 입원시킴 - 싸지만(고정 소액) 즉시 낫진 않음. 입원 중엔 모험에 동행하지
// 않고(보수도 안 나감) 그냥 시간(모험 턴)이 지나며 자연 회복만 진행됨. 다 나으면 자동 퇴원.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { hospitalCostMultiplier } from '../../data/rpg/facilities.js';

const ADMIT_COST = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId) return res.status(400).json({ error: 'invalid_mercenary' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const idx = mercenaries.findIndex((m) => m.id === mercId);
      if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }

      const merc = mercenaries[idx];
      const injuries = merc.injuries || {};
      const isInjured = ['arm', 'leg'].some((p) => (injuries[p] || {}).severity > 0);
      if (!isInjured) { outcome = { error: 'no_injury' }; return null; }
      if (merc.hospitalized) { outcome = { error: 'already_hospitalized' }; return null; }
      const cost = Math.max(1, Math.round(ADMIT_COST * hospitalCostMultiplier(character)));
      if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

      const nextMercenaries = [...mercenaries];
      nextMercenaries[idx] = { ...merc, hospitalized: true };
      const now = Date.now();
      outcome = { mercId, cost, gold: character.gold - cost };
      return { ...character, gold: character.gold - cost, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
