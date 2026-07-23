// 하루 1회 랭킹 보너스는 "계정" 단위로 제한(캐릭터별로 따로 받으면 3캐릭×30턴으로 악용 가능하므로)
// 어느 캐릭터가 보너스를 받을지는 클라이언트가 slot으로 지정
import { verifyPiUser } from '../_verifyPiUser.js';
import { firestoreListCollection, withMultiDocTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { computeCurrentTurns, turnCapForLevel, RANKING_BONUS_TURNS, RANKING_BONUS_RANK_CUTOFF } from '../_rpgTurns.js';

const QUIZ_LEADERBOARD_MODES = ['miner', 'pioneer', 'validator'];

function accountDocPath(username) {
  return `rpg_accounts/${encodeURIComponent(username)}`;
}

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}

// 모드 하나의 리더보드 컬렉션에서 username의 순위(1-base)를 구한다. 없으면 null.
async function rankInMode(mode, username) {
  const rows = await firestoreListCollection(`leaderboard_${mode}`);
  const best = new Map();
  for (const row of rows) {
    if (!row.username) continue;
    if (!best.has(row.username) || row.score > best.get(row.username).score) best.set(row.username, row);
  }
  const sorted = [...best.values()].sort((a, b) => b.score - a.score);
  const idx = sorted.findIndex((r) => r.username === username);
  return idx === -1 ? null : idx + 1;
}

// 세 모드 중 하나라도 100위권이면 보너스 대상
async function qualifiesForRankingBonus(username) {
  const ranks = await Promise.all(QUIZ_LEADERBOARD_MODES.map((mode) => rankInMode(mode, username)));
  return ranks.some((rank) => rank !== null && rank <= RANKING_BONUS_RANK_CUTOFF);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot)) return res.status(400).json({ error: 'invalid_slot' });

  const today = todayKeyUTC();
  const accPath = accountDocPath(username);
  const charPath = characterDocPath(username, slot);

  let outcome = null;
  try {
    await withMultiDocTransaction([accPath, charPath], async (docs) => {
      const account = docs[accPath] || { lastRankingBonusDate: null, createdAt: Date.now() };
      const character = docs[charPath] || defaultCharacter(slot);

      if (account.lastRankingBonusDate === today) {
        const currentTurns = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level);
        outcome = { granted: false, alreadyClaimedToday: true, turnPoints: currentTurns };
        return {};
      }

      const qualifies = await qualifiesForRankingBonus(username);
      const bonus = qualifies ? RANKING_BONUS_TURNS : 0;
      const now = Date.now();
      const base = computeCurrentTurns(character.turnPoints, character.turnPointsUpdatedAt, character.level, now);

      outcome = {
        granted: qualifies,
        bonusTurns: bonus,
        turnPoints: base + bonus,
        turnPointsCap: turnCapForLevel(character.level),
      };

      return {
        [accPath]: { ...account, lastRankingBonusDate: today, updatedAt: now },
        [charPath]: { ...character, turnPoints: base + bonus, turnPointsUpdatedAt: now, updatedAt: now },
      };
    });

    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
