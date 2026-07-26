// 사냥터 진입 미리보기 - 지역을 고르면 여러 개(OPTION_COUNT개)의 몹 구성 후보를 한 번에 보여주고,
// 그중 유저가 고른 조합 그대로 전투를 시작함("여러 조합 중에 골라서 들어간다"). 처음 보는 건 무료,
// 마음에 안 들어서 전체를 다시 굴리려면(새로고침) 턴포인트 1을 쓰고 실시간 1시간에 한 번만 가능함.
// adventure.js가 optionIndex로 그중 하나를 골라 그대로 소비함.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns } from '../_rpgTurns.js';
import { ZONES } from '../../data/rpg/zones.js';
import { MONSTERS } from '../../data/rpg/monsters.js';
import { rollEncounter } from '../../rpg-combat.js';
import { CASTLE_CLEAR_REQUIREMENT } from '../../data/rpg/castle.js';
import { isAdminUsername } from '../_rpgAdmin.js';

const REFRESH_COOLDOWN_MS = 60 * 60 * 1000; // 실시간 1시간
const OPTION_COUNT = 5; // 한 번에 보여줄 랜덤 조합 후보 수

function rollOptions(zoneId, killCount) {
  return Array.from({ length: OPTION_COUNT }, () => {
    const encounter = rollEncounter(zoneId, killCount);
    return { monsterIds: encounter.monsterIds, isRare: encounter.isRare, uniqueTier: encounter.uniqueTier };
  });
}

function previewPayload(zonePreview) {
  return {
    zoneId: zonePreview.zoneId,
    lastRefreshAt: zonePreview.lastRefreshAt,
    canRefreshAt: zonePreview.lastRefreshAt + REFRESH_COOLDOWN_MS,
    options: zonePreview.options.map((opt) => ({
      isRare: opt.isRare,
      uniqueTier: opt.uniqueTier,
      monsters: opt.monsterIds.map((id) => {
        const def = MONSTERS[id];
        return { monsterId: id, name: def ? def.name : id, tags: def ? def.tags : [] };
      }),
    })),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId, refresh } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });
  const zone = ZONES[zoneId];
  if (!zone) return res.status(400).json({ error: 'invalid zoneId' });
  const isAdmin = isAdminUsername(username);

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      if (zone.unlockZoneId && ((character.zoneClearCounts || {})[zone.unlockZoneId] || 0) < CASTLE_CLEAR_REQUIREMENT) {
        outcome = { error: 'zone_locked' }; return null;
      }

      const existing = character.zonePreview;
      // 배포 전에 저장된 예전 형태(options 배열이 아니라 monsterIds 단일 조합)일 수도 있으니, 그런 경우는
      // "같은 지역을 보고 있던 중"으로 치지 않고 새로 굴림(대비 안 하면 .options.map에서 그대로 터짐)
      const sameZoneExisting = existing && existing.zoneId === zoneId && Array.isArray(existing.options);

      if (refresh) {
        if (!sameZoneExisting) { outcome = { error: 'no_preview_to_refresh' }; return null; }
        const remainingCooldown = REFRESH_COOLDOWN_MS - (now - (existing.lastRefreshAt || 0));
        if (remainingCooldown > 0) { outcome = { error: 'refresh_on_cooldown' }; return null; }
        const turns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now);
        if (!isAdmin && turns < 1) { outcome = { error: 'not_enough_turns' }; return null; }

        const nextZonePreview = {
          zoneId, options: rollOptions(zoneId, (character.zoneKillCounts || {})[zoneId] || 0), lastRefreshAt: now,
        };
        const nextTurns = isAdmin ? turns : turns - 1;
        outcome = { preview: previewPayload(nextZonePreview), turnPoints: nextTurns };
        return {
          ...character, zonePreview: nextZonePreview, turnPoints: nextTurns, turnPointsUpdatedAt: now, updatedAt: now,
        };
      }

      // 새로고침이 아니면: 같은 지역을 이미 보고 있었으면 그대로 재사용(공짜), 아니면 새로 무료로 후보들을 굴려줌
      if (sameZoneExisting) { outcome = { preview: previewPayload(existing), turnPoints: character.turnPoints }; return null; }

      const nextZonePreview = {
        zoneId, options: rollOptions(zoneId, (character.zoneKillCounts || {})[zoneId] || 0), lastRefreshAt: now,
      };
      outcome = { preview: previewPayload(nextZonePreview), turnPoints: character.turnPoints };
      return { ...character, zonePreview: nextZonePreview, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
