// 용병 배치 변경 - 'active'(전투 동행, 최대 MAX_MERCENARIES명) <-> 'territory'(영지에서 일함).
// territory로 배치(또는 이미 territory인 채로 다시 호출)할 때 job을 지정할 수 있음 - 시설(일자리)당
// MAX_MERCS_PER_FACILITY명까지만 배치 가능(facilities.js 참고)
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { MAX_MERCENARIES, TERRITORY_JOBS } from '../../data/rpg/mercenaries.js';
import { MAX_MERCS_PER_FACILITY } from '../../data/rpg/facilities.js';

const VALID_ASSIGNMENTS = ['active', 'territory'];
const DEFAULT_JOB = 'clearing';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, mercId, assignment, job } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  if (!mercId || !VALID_ASSIGNMENTS.includes(assignment)) return res.status(400).json({ error: 'invalid_assignment' });
  const nextJob = job || DEFAULT_JOB;
  if (assignment === 'territory' && !TERRITORY_JOBS[nextJob]) return res.status(400).json({ error: 'invalid_job' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = character.mercenaries || [];
      const idx = mercenaries.findIndex((m) => m.id === mercId);
      if (idx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }

      if (assignment === 'active') {
        if (mercenaries[idx].hospitalized) { outcome = { error: 'already_hospitalized' }; return null; }
        const activeCount = mercenaries.filter((m, i) => i !== idx && m.assignment === 'active').length;
        if (activeCount >= MAX_MERCENARIES) { outcome = { error: 'party_full' }; return null; }
      } else {
        // 이 시설(일자리)에 이미 배치된(본인 제외) 인원이 한도를 채웠으면 배치 불가
        const sameJobCount = mercenaries.filter((m, i) => i !== idx && m.assignment === 'territory' && m.job === nextJob).length;
        if (sameJobCount >= MAX_MERCS_PER_FACILITY) { outcome = { error: 'facility_full' }; return null; }
      }

      const nextMercenaries = [...mercenaries];
      nextMercenaries[idx] = { ...nextMercenaries[idx], assignment, job: assignment === 'territory' ? nextJob : null };
      const now = Date.now();
      outcome = { mercId, assignment, job: assignment === 'territory' ? nextJob : null };
      return { ...character, mercenaries: nextMercenaries, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
