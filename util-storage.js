// ── 모드 정의 ──────────────────────────────────────────
export const MODES = {
  miner:     { key: 'miner',     label: 'Miner',     icon: '⛏️',  lives: 2, surveyMilestone: 4 },
  pioneer:   { key: 'pioneer',   label: 'Pioneer',   icon: '🚀',  lives: 2, surveyMilestone: 4 },
  validator: { key: 'validator', label: 'Validator', icon: '🔱',  lives: null },
};

// ── 키 정의 ───────────────────────────────────────────
const KEYS = {
  MODE:                  'quiz_mode',
  SCORE:                 'quiz_score',
  HIGH_SCORE:            'quiz_high_score',
  LIVES:                 'quiz_lives',
  ANSWERED:              'quiz_answered',
  SURVEY_DONE:           'survey_done',
  SURVEY_ANSWERS:        'survey_answers',
  STREAK:                'quiz_streak',
  TOTAL_CORRECT:         'quiz_correct',
  TOTAL_SEEN:            'quiz_seen',
  STATS_VIEW_TIME:       'stats_view_time',
  LEADERBOARD_VIEW_TIME: 'lb_view_time',
  MINER_CORRECT_COUNT:   'miner_correct',
  SESSION:               'quiz_session',
};

export const LIVES_SURVEY_MILESTONE = 4;

// ── 모드 ──────────────────────────────────────────────
export function getMode() {
  return localStorage.getItem(KEYS.MODE) ?? null;
}

export function setMode(modeKey) {
  localStorage.setItem(KEYS.MODE, modeKey);
  const cfg = MODES[modeKey];
  localStorage.setItem(KEYS.SCORE, '0');
  localStorage.setItem(KEYS.STREAK, '0');
  if (cfg.lives !== null) {
    const bonus = (modeKey === 'miner' || modeKey === 'pioneer') ? getSurveyBonusLives() : 0;
    localStorage.setItem(KEYS.LIVES, String(cfg.lives + bonus));
  } else {
    localStorage.removeItem(KEYS.LIVES);
  }
}

// ── 점수 ──────────────────────────────────────────────
export function getScore() {
  return parseInt(localStorage.getItem(KEYS.SCORE) ?? '0');
}

export function addScore(points) {
  const score = getScore() + points;
  localStorage.setItem(KEYS.SCORE, String(score));
  return score;
}

export function getHighScore() {
  return parseInt(localStorage.getItem(KEYS.HIGH_SCORE) ?? '0');
}

function updateHighScore(score) {
  if (score > getHighScore()) {
    localStorage.setItem(KEYS.HIGH_SCORE, String(score));
  }
}

// ── 생명력 ────────────────────────────────────────────
export function getLives() {
  const mode = getMode();
  if (mode === 'validator') return null;
  const v = localStorage.getItem(KEYS.LIVES);
  return v === null ? (MODES[mode]?.lives ?? 2) : parseInt(v);
}

export function setLives(n) {
  localStorage.setItem(KEYS.LIVES, String(Math.max(0, n)));
}

export function addLives(n) {
  const lives = getLives();
  if (lives === null) return null;
  setLives(lives + n);
  return getLives();
}

export function loseLife() {
  const lives = getLives();
  if (lives === null) return null;
  setLives(lives - 1);
  return getLives();
}

// ── 설문 영구 보너스 하트 (Miner·Pioneer: 4개당 +1, 최대 +2) ──
// 설문 완료 수에서 직접 계산 → 기기 변경 후 Firebase 동기화 시 자동 반영
export function getSurveyBonusLives() {
  return Math.min(2, Math.floor(getSurveyCount() / LIVES_SURVEY_MILESTONE));
}

// ── Miner 누적 정답 카운트 (10개마다 생명 +1) ─────────
export function getMinerCorrectCount() {
  return parseInt(localStorage.getItem(KEYS.MINER_CORRECT_COUNT) ?? '0');
}

export function incrementMinerCorrect() {
  const n = getMinerCorrectCount() + 1;
  localStorage.setItem(KEYS.MINER_CORRECT_COUNT, String(n));
  return n;
}

// ── 스트릭 ────────────────────────────────────────────
export function getStreak() {
  return parseInt(localStorage.getItem(KEYS.STREAK) ?? '0');
}

export function setStreak(n) {
  localStorage.setItem(KEYS.STREAK, String(n));
}

// ── 정답 통계 ─────────────────────────────────────────
export function getStats() {
  return {
    correct: parseInt(localStorage.getItem(KEYS.TOTAL_CORRECT) ?? '0'),
    seen:    parseInt(localStorage.getItem(KEYS.TOTAL_SEEN)    ?? '0'),
  };
}

export function recordAnswer(correct) {
  const { correct: c, seen: s } = getStats();
  localStorage.setItem(KEYS.TOTAL_CORRECT, String(c + (correct ? 1 : 0)));
  localStorage.setItem(KEYS.TOTAL_SEEN,    String(s + 1));
}

// ── 답변한 문제 ID 추적 ───────────────────────────────
export function getAnsweredIds() {
  return new Set(JSON.parse(localStorage.getItem(KEYS.ANSWERED) ?? '[]'));
}

export function markAnswered(id) {
  const ids = getAnsweredIds();
  ids.add(id);
  localStorage.setItem(KEYS.ANSWERED, JSON.stringify([...ids]));
}

export function hasAnswered(id) {
  return getAnsweredIds().has(id);
}

// ── 설문 ──────────────────────────────────────────────
export function getSurveyAnswers() {
  return JSON.parse(localStorage.getItem(KEYS.SURVEY_ANSWERS) ?? '{}');
}

export function saveSurveyAnswer(surveyId, answer) {
  const answers = getSurveyAnswers();
  answers[surveyId] = answer;
  localStorage.setItem(KEYS.SURVEY_ANSWERS, JSON.stringify(answers));
  const done = getSurveyDone();
  done.add(surveyId);
  localStorage.setItem(KEYS.SURVEY_DONE, JSON.stringify([...done]));
}

export function getSurveyDone() {
  return new Set(JSON.parse(localStorage.getItem(KEYS.SURVEY_DONE) ?? '[]'));
}

export function hasSurveyDone(surveyId) {
  return getSurveyDone().has(surveyId);
}

export function saveSubAnswer(id, answer) {
  const answers = getSurveyAnswers();
  answers[id] = answer;
  localStorage.setItem(KEYS.SURVEY_ANSWERS, JSON.stringify(answers));
}

export function getSurveyCount() {
  return getSurveyDone().size;
}

// ── 세션 저장/복원 (진행 중 나가기/재개용) ────────────
export function saveSession(s) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify({
    mode:     s.mode,
    queueIds: s.queue.map(item => ({ type: item.type, id: item.data.id })),
    index:    s.index,
    correct:  s.correct,
    total:    s.total,
  }));
}

export function loadSession() {
  try { return JSON.parse(localStorage.getItem(KEYS.SESSION) ?? 'null'); }
  catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(KEYS.SESSION);
}

// 외부(Firestore)에서 불러온 설문 데이터를 로컬에 병합
export function mergeSurveyFromCloud(answers, completedIds) {
  if (!answers || !completedIds) return;
  const localAnswers = getSurveyAnswers();
  const localDone    = getSurveyDone();
  const merged = { ...answers, ...localAnswers };
  const mergedDone = new Set([...completedIds, ...localDone]);
  localStorage.setItem(KEYS.SURVEY_ANSWERS, JSON.stringify(merged));
  localStorage.setItem(KEYS.SURVEY_DONE, JSON.stringify([...mergedDone]));
}

// ── 뷰 타임 (생명 쿨다운) ────────────────────────────
export function getLastStatsViewTime() {
  return parseInt(localStorage.getItem(KEYS.STATS_VIEW_TIME) ?? '0');
}

export function setLastStatsViewTime() {
  localStorage.setItem(KEYS.STATS_VIEW_TIME, String(Date.now()));
}

export function getLastLeaderboardViewTime() {
  return parseInt(localStorage.getItem(KEYS.LEADERBOARD_VIEW_TIME) ?? '0');
}

export function setLastLeaderboardViewTime() {
  localStorage.setItem(KEYS.LEADERBOARD_VIEW_TIME, String(Date.now()));
}

// ── 게임 리셋 (생명 소진 시) ──────────────────────────
export function resetGame() {
  const score = getScore();
  updateHighScore(score);
  const mode = getMode();
  const cfg  = MODES[mode];
  localStorage.setItem(KEYS.SCORE,  '0');
  localStorage.setItem(KEYS.STREAK, '0');
  if (cfg?.lives !== null && cfg?.lives !== undefined) {
    const bonus = (mode === 'miner' || mode === 'pioneer') ? getSurveyBonusLives() : 0;
    localStorage.setItem(KEYS.LIVES, String(cfg.lives + bonus));
  }
}

// ── 등급 계산 ─────────────────────────────────────────
export const RANKS = [
  { min: 0,    key: 'rank.grade.explorer',   label: '🌱 탐색자',    labelEn: 'Explorer' },
  { min: 201,  key: 'rank.grade.analyst',    label: '📊 분석가',    labelEn: 'Analyst' },
  { min: 501,  key: 'rank.grade.trader',     label: '⚡ 트레이더',  labelEn: 'Trader' },
  { min: 1001, key: 'rank.grade.maker',      label: '🏦 마켓메이커', labelEn: 'Market Maker' },
  { min: 2001, key: 'rank.grade.strategist', label: '🔱 전략가',    labelEn: 'Strategist' },
];

export function getRank(score) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.min) rank = r;
  }
  return rank;
}

export function getNextRank(score) {
  for (const r of RANKS) {
    if (score < r.min) return r;
  }
  return null;
}

// ── 구독 ──────────────────────────────────────────────
const SUB_KEY = 'quiz_sub_expiry';
export function isSubscribed() {
  const expiry = localStorage.getItem(SUB_KEY);
  return expiry ? new Date(expiry) > new Date() : false;
}
export function setSubscription(months = 1) {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  localStorage.setItem(SUB_KEY, expiry.toISOString());
}
export function getSubscriptionExpiry() {
  return localStorage.getItem(SUB_KEY);
}
