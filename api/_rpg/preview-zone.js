// 사냥터 진입 미리보기 - 지역을 고르면 여러 개(OPTION_COUNT개)의 몹 구성 후보를 한 번에 보여주고,
// 그중 유저가 고른 조합 그대로 전투를 시작함("여러 조합 중에 골라서 들어간다"). 지역별로 미리보기를
// 따로 저장해서(zonePreviews) 다른 지역 갔다와도 유지됨 - 처음 보는 지역은 무료, 마음에 안 들어서
// 다시 굴리려면(새로고침) 골드를 씀(지역 티어가 높을수록 더 비쌈). adventure.js가 optionIndex로 그중 하나를 골라 그대로 소비함.
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { ZONES } from '../../data/rpg/zones.js';
import { MONSTERS } from '../../data/rpg/monsters.js';
import { rollEncounter, buildMonsterInstance, monsterPowerScore, computePartyPower } from '../../rpg-combat.js';
import { CASTLE_CLEAR_REQUIREMENT } from '../../data/rpg/castle.js';
import { getMonsterName } from '../../rpg-i18n.js';

const OPTION_COUNT = 5; // 한 번에 보여줄 랜덤 조합 후보 수
const REFRESH_GOLD_BASE = 15;
const REFRESH_GOLD_PER_TIER = 15;
export function refreshGoldCost(zone) {
  return REFRESH_GOLD_BASE + zone.tier * REFRESH_GOLD_PER_TIER;
}

function rollOptions(zoneId, killCount) {
  return Array.from({ length: OPTION_COUNT }, () => {
    const encounter = rollEncounter(zoneId, killCount);
    return { monsterIds: encounter.monsterIds, isRare: encounter.isRare, uniqueTier: encounter.uniqueTier };
  });
}

// 몹 이름 색깔로 난이도를 보여주기 위한 전력비 - 그 조합(옵션) 안의 몹 전원의 전력치 합을 내 파티
// (본인+전투용병) 전력치로 나눈 값(클수록 위험). 한 마리씩 따로 계산하면 "몹이 여러 마리라 더 위험한"
// 상황이 반영되지 않아서, 같은 조합에 속한 몹 이름은 전부 그 조합의 합산 전력비를 공유함
function previewPayload(zonePreview, character, zone, lang) {
  const partyPower = Math.max(1, computePartyPower(character));
  return {
    zoneId: zonePreview.zoneId,
    refreshGoldCost: refreshGoldCost(zone),
    options: zonePreview.options.map((opt) => {
      const instances = opt.monsterIds.map((id) => buildMonsterInstance(id, zone, opt.uniqueTier, lang));
      const groupPower = instances.reduce((sum, inst) => sum + monsterPowerScore(inst), 0);
      const difficultyRatio = Math.round((groupPower / partyPower) * 1000) / 1000;
      return {
        isRare: opt.isRare,
        uniqueTier: opt.uniqueTier,
        monsters: opt.monsterIds.map((id) => {
          const def = MONSTERS[id];
          // 속성도 같이 보여줘야 유저가 상성(elementalMultiplier, data/rpg/elements.js)에 맞춰 장비를 미리 맞출 수 있음
          return { monsterId: id, name: getMonsterName(id, lang), tags: def ? def.tags : [], element: def ? def.element : 'none', difficultyRatio };
        }),
      };
    }),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, zoneId, refresh, lang } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });
  const zone = ZONES[zoneId];
  if (!zone) return res.status(400).json({ error: 'invalid zoneId' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const now = Date.now();
      if (zone.unlockZoneId && ((character.zoneClearCounts || {})[zone.unlockZoneId] || 0) < CASTLE_CLEAR_REQUIREMENT) {
        outcome = { error: 'zone_locked' }; return null;
      }

      const zonePreviews = { ...(character.zonePreviews || {}) };
      // 배포 전 예전 형태(지역 하나만 저장하던 zonePreview 단일 필드)가 남아있을 수도 있으니 무시하고
      // 이 지역 전용 항목만 봄(Array.isArray로 새 형태인지도 확인 - 아니면 그대로 터짐)
      const existing = zonePreviews[zoneId];
      const hasExisting = existing && Array.isArray(existing.options);

      if (refresh) {
        if (!hasExisting) { outcome = { error: 'no_preview_to_refresh' }; return null; }
        const cost = refreshGoldCost(zone);
        if ((character.gold || 0) < cost) { outcome = { error: 'not_enough_gold' }; return null; }

        const nextZonePreview = { zoneId, options: rollOptions(zoneId, (character.zoneKillCounts || {})[zoneId] || 0) };
        zonePreviews[zoneId] = nextZonePreview;
        const nextGold = character.gold - cost;
        outcome = { preview: previewPayload(nextZonePreview, character, zone, lang), gold: nextGold };
        return { ...character, zonePreviews, gold: nextGold, updatedAt: now };
      }

      // 새로고침이 아니면: 이미 본 지역이면 그대로 재사용(공짜, 다른 지역 갔다와도 유지), 아니면 무료로 새로 굴림
      if (hasExisting) { outcome = { preview: previewPayload(existing, character, zone, lang), gold: character.gold }; return null; }

      const nextZonePreview = { zoneId, options: rollOptions(zoneId, (character.zoneKillCounts || {})[zoneId] || 0) };
      zonePreviews[zoneId] = nextZonePreview;
      outcome = { preview: previewPayload(nextZonePreview, character, zone, lang), gold: character.gold };
      return { ...character, zonePreviews, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
