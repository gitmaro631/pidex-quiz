// 용병 전투 설정 - stance(쎈몹/약한몹 우선 타겟팅)와 combatRole(fight/support)을 유저 본인 stance와
// 완전히 독립적으로 용병 개인별로 저장. 힐러 컨셉 용병(떠돌이 성직자/군의관)은 MERCENARY_TEMPLATES의
// fixedCombatRole 때문에 combatRole 변경 요청 자체를 거부함(rpg-combat.js resolveCombat이 어차피
// fixedCombatRole을 우선시하므로 저장해봤자 의미가 없어 혼란을 막기 위해 아예 막아둠)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { MERCENARY_TEMPLATES } from '../../data/rpg/mercenaries.js';

const VALID_STANCES = ['aggressive', 'stable'];
const VALID_COMBAT_ROLES = ['fight', 'support'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId, stance, combatRole } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId) return res.status(400).json({ error: 'invalid_mercId' });
  if (stance !== undefined && !VALID_STANCES.includes(stance)) return res.status(400).json({ error: 'invalid_stance' });
  if (combatRole !== undefined && !VALID_COMBAT_ROLES.includes(combatRole)) return res.status(400).json({ error: 'invalid_combatRole' });
  if (stance === undefined && combatRole === undefined) return res.status(400).json({ error: 'nothing_to_update' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const idx = mercenaries.findIndex((m) => m.id === mercId);
      if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }

      const merc = mercenaries[idx];
      const template = MERCENARY_TEMPLATES[merc.templateId];
      if (combatRole !== undefined && template && template.fixedCombatRole) {
        outcome = { error: 'fixed_combat_role' };
        return null;
      }

      const nextMerc = { ...merc };
      if (stance !== undefined) nextMerc.stance = stance;
      if (combatRole !== undefined) nextMerc.combatRole = combatRole;

      const nextMercenaries = [...mercenaries];
      nextMercenaries[idx] = nextMerc;
      const now = Date.now();
      outcome = { mercId, stance: nextMerc.stance, combatRole: nextMerc.combatRole };
      return { ...character, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
