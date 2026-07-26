// 종자 흡수 - 다른 용병(squire)을 이 용병(host)에 붙여서 부직업처럼 스킬(50% 위력)+스탯 일부(10%,
// 흡수 시점 고정)를 얻음. squire는 완전히 사라지고(되돌릴 수 없음), host당 1회만 가능.
// host의 고용가치(hireCostBonus)도 살짝 올라감 - 캐릭터 삭제시 자산환산(delete-character.js)에 반영
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { MERCENARY_TEMPLATES, SQUIRE_STAT_BONUS_PCT, SQUIRE_HIRE_COST_BONUS_PCT } from '../../data/rpg/mercenaries.js';
import { computeCharacterCombatStats } from '../../rpg-combat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, hostMercId, squireMercId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  if (!hostMercId || !squireMercId || hostMercId === squireMercId) return res.status(400).json({ error: 'invalid_squire' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const hostIdx = mercenaries.findIndex((m) => m.id === hostMercId);
      const squireIdx = mercenaries.findIndex((m) => m.id === squireMercId);
      if (hostIdx === -1 || squireIdx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }
      const host = mercenaries[hostIdx];
      const squire = mercenaries[squireIdx];
      if (host.classSub) { outcome = { error: 'squire_already_absorbed' }; return null; }
      if (squire.classMain === host.classMain) { outcome = { error: 'same_as_main_class' }; return null; }

      const squireStats = computeCharacterCombatStats(squire);
      const squireStatBonus = {
        atk: Math.round(squireStats.atk * SQUIRE_STAT_BONUS_PCT),
        def: Math.round(squireStats.def * SQUIRE_STAT_BONUS_PCT),
        maxHp: Math.round(squireStats.maxHp * SQUIRE_STAT_BONUS_PCT),
      };
      const squireTemplate = MERCENARY_TEMPLATES[squire.templateId];
      const hireCostBonus = (host.hireCostBonus || 0) + Math.round((squireTemplate ? squireTemplate.hireCost : 0) * SQUIRE_HIRE_COST_BONUS_PCT);

      const nextMercenaries = mercenaries
        .filter((m) => m.id !== squireMercId)
        .map((m) => (m.id === hostMercId ? { ...m, classSub: squire.classMain, squireStatBonus, hireCostBonus } : m));

      const now = Date.now();
      outcome = { hostMercId, classSub: squire.classMain, squireStatBonus, hireCostBonus };
      return { ...character, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
