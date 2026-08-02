// 선술집에서 용병 고용 - 파티 구성은 플레이어 자유(오늘 로테이션에 있고 아직 안 고용했으면 가능), 최대 인원 제한 있음
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot, createMercenaryInstance } from '../_rpgCharacter.js';
import { MERCENARY_TEMPLATES, MAX_MERCENARIES, MAX_TERRITORY_MERCENARIES, ACTIVE_HIRE_COST_MULT_BY_SLOT, dailyTavernRoster } from '../../data/rpg/mercenaries.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, templateId } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

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

      // 전투 동행(active) 최대 3명 + 영지에서 일하는(territory) 잉여 인원 최대 4명 - 총원 제한
      const mercenaries = character.mercenaries || [];
      if (mercenaries.length >= MAX_MERCENARIES + MAX_TERRITORY_MERCENARIES) { outcome = { error: 'party_full' }; return null; }

      // 전투 자리가 남아있으면 바로 전투 동행(그 슬롯 번호만큼 고용비 할증), 아니면 영지행(할증 없음 -
      // 전투에 안 나가는 인원이라 굳이 비싸게 만들 이유가 없음)
      const activeCount = mercenaries.filter((m) => m.assignment === 'active').length;
      const willBeActive = activeCount < MAX_MERCENARIES;
      const costMult = willBeActive ? (ACTIVE_HIRE_COST_MULT_BY_SLOT[activeCount] || 1) : 1;
      const finalCost = Math.round(template.hireCost * costMult);
      if ((character.gold || 0) < finalCost) { outcome = { error: 'not_enough_gold' }; return null; }

      const now = Date.now();
      const instance = createMercenaryInstance(templateId, now);
      // 고용 시점의 누적 턴소모량을 기록 - 해고할 때 "얼마나 오래 데리고 있었는지"를 턴 기준으로 계산해서
      // 골드로 환급하는 데 씀(dismiss-mercenary.js 참고, 이 프로젝트는 실시간이 아니라 턴 소모 기준 시간)
      instance.turnsSpentAtHire = character.totalTurnsSpent || 0;
      if (willBeActive) { instance.assignment = 'active'; instance.job = null; }
      const nextMercenaries = [...mercenaries, instance];
      outcome = { hired: instance, gold: character.gold - finalCost };
      return { ...character, gold: character.gold - finalCost, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
