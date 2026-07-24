// 선술집에서 용병 고용 - 본인 직업과 상호보완적인 직업(근접<->원거리)만 고용 가능, 최대 인원 제한 있음
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot, createMercenaryInstance } from '../_rpgCharacter.js';
import { MERCENARY_TEMPLATES, MAX_MERCENARIES, MAX_TERRITORY_MERCENARIES, dailyTavernRoster } from '../../data/rpg/mercenaries.js';
import { CLASSES } from '../../data/rpg/classes.js';

// 근접(전열) 직업인지 - 무기 라인업에 활이 아닌 무기가 하나라도 있으면 근접 계열로 판정
function isMeleeClass(classId) {
  const cls = CLASSES[classId];
  return !!cls && cls.weaponTypes.some((t) => t !== 'bow');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, templateId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const template = MERCENARY_TEMPLATES[templateId];
  if (!template) return res.status(400).json({ error: 'unknown_mercenary' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      if (!character.classMain) { outcome = { error: 'no_class_selected' }; return null; }

      // 선술집 구성은 하루 단위로 바뀜 - 오늘 그 마을에 없는 용병은 고용 불가
      const today = dailyTavernRoster(character.currentTown || 'town1');
      if (!today.includes(templateId)) { outcome = { error: 'not_in_today_roster' }; return null; }

      // 전투 동행(active) 최대 2명 + 영지에서 일하는(territory) 잉여 인원 최대 4명 - 총원 제한
      const mercenaries = character.mercenaries || [];
      if (mercenaries.length >= MAX_MERCENARIES + MAX_TERRITORY_MERCENARIES) { outcome = { error: 'party_full' }; return null; }

      // 상호보완적 직업만 고용 가능 - 본인이 근접이면 원거리(마법 포함)를, 원거리면 근접을
      const selfMelee = isMeleeClass(character.classMain);
      const mercMelee = isMeleeClass(template.classMain);
      if (selfMelee === mercMelee) { outcome = { error: 'incompatible_class' }; return null; }

      if ((character.gold || 0) < template.hireCost) { outcome = { error: 'not_enough_gold' }; return null; }

      const now = Date.now();
      const instance = createMercenaryInstance(templateId, now);
      // 전투 자리(최대 MAX_MERCENARIES)가 남아있으면 바로 전투 동행, 아니면 영지에서 일 시작
      const activeCount = mercenaries.filter((m) => m.assignment === 'active').length;
      if (activeCount < MAX_MERCENARIES) { instance.assignment = 'active'; instance.job = null; }
      const nextMercenaries = [...mercenaries, instance];
      outcome = { hired: instance, gold: character.gold - template.hireCost };
      return { ...character, gold: character.gold - template.hireCost, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
