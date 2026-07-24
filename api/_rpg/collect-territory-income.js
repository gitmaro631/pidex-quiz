// 영지에서 일하는(assignment:'territory') 용병들의 수입 정산 - 턴포인트 지연계산과 같은 방식으로,
// 마지막 정산 이후 흐른 시간 x (일자리별 시간당 산출 합계)로 계산해 골드 지급.
// 일자리 종류가 늘어나도(재료 산출 등) 이 파일은 손댈 필요 없이 TERRITORY_JOBS만 확장하면 됨
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { TERRITORY_JOBS } from '../../data/rpg/mercenaries.js';

const HOUR_MS = 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      const lastCollectAt = character.lastTerritoryCollectAt || character.createdAt || now;
      const workingMercs = (character.mercenaries || []).filter((m) => m.assignment === 'territory' && !m.hospitalized);
      const goldPerHour = workingMercs.reduce((sum, m) => sum + ((TERRITORY_JOBS[m.job] || {}).goldPerHour || 0), 0);

      const elapsedHours = Math.max(0, (now - lastCollectAt) / HOUR_MS);
      const income = Math.floor(elapsedHours * goldPerHour);
      if (income <= 0) { outcome = { income: 0, gold: character.gold || 0 }; return null; }

      outcome = { income, gold: (character.gold || 0) + income };
      return { ...character, gold: (character.gold || 0) + income, lastTerritoryCollectAt: now, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
