// ── 키 정의 ───────────────────────────────────────────
const KEYS = {
  SCORE:           'quiz_score',
  HIGH_SCORE:      'quiz_high_score',
  LIVES:           'quiz_lives',
  ANSWERED:        'quiz_answered',
  SURVEY_DONE:     'survey_done',
  SURVEY_ANSWERS:  'survey_answers',
  STREAK:          'quiz_streak',
  TOTAL_CORRECT:   'quiz_correct',
  TOTAL_SEEN:      'quiz_seen',
  STATS_VIEW_TIME: 'stats_view_time',
};

export const LIVES_INITIAL          = 2;
export const LIVES_SURVEY_MILESTONE = 5;  // 설문 5개 완료마다 +1 생명

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
  const v = localStorage.getItem(KEYS.LIVES);
  return v === null ? LIVES_INITIAL : parseInt(v);
}

export function setLives(n) {
  localStorage.setItem(KEYS.LIVES, String(Math.max(0, n)));
}

export function addLives(n) {
  const newVal = getLives() + n;
  setLives(newVal);
  return getLives();
}

export function loseLife() {
  const newVal = getLives() - 1;
  setLives(newVal);
  return getLives();
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

// 그룹 설문의 하위 답변 저장 (완료 카운트에 포함되지 않음)
export function saveSubAnswer(id, answer) {
  const answers = getSurveyAnswers();
  answers[id] = answer;
  localStorage.setItem(KEYS.SURVEY_ANSWERS, JSON.stringify(answers));
}

export function getSurveyCount() {
  return getSurveyDone().size;
}

export function getLastStatsViewTime() {
  return parseInt(localStorage.getItem(KEYS.STATS_VIEW_TIME) ?? '0');
}

export function setLastStatsViewTime() {
  localStorage.setItem(KEYS.STATS_VIEW_TIME, String(Date.now()));
}

// ── 게임 리셋 (생명 소진 시) ──────────────────────────
export function resetGame() {
  const score = getScore();
  updateHighScore(score);
  // 점수·생명·스트릭만 리셋 (풀었던 문제·설문 기록은 유지)
  localStorage.setItem(KEYS.SCORE,  '0');
  localStorage.setItem(KEYS.LIVES,  String(LIVES_INITIAL));
  localStorage.setItem(KEYS.STREAK, '0');
}

// ── 등급 계산 ─────────────────────────────────────────
const RANKS = [
  { min: 0,    label: '🌱 탐색자',    labelEn: 'Explorer' },
  { min: 201,  label: '📊 분석가',    labelEn: 'Analyst' },
  { min: 501,  label: '⚡ 트레이더',  labelEn: 'Trader' },
  { min: 1001, label: '🏦 마켓메이커', labelEn: 'Market Maker' },
  { min: 2001, label: '🔱 전략가',    labelEn: 'Strategist' },
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
