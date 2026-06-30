// ── 키 정의 ───────────────────────────────────────────
const KEYS = {
  SCORE:           'quiz_score',
  ANSWERED:        'quiz_answered',   // Set of answered question IDs
  SURVEY_DONE:     'survey_done',     // Set of answered survey IDs
  SURVEY_ANSWERS:  'survey_answers',  // { surveyId: answer }
  STREAK:          'quiz_streak',
  TOTAL_CORRECT:   'quiz_correct',
  TOTAL_SEEN:      'quiz_seen',
};

// ── 점수 & 스트릭 ─────────────────────────────────────
export function getScore() {
  return parseInt(localStorage.getItem(KEYS.SCORE) ?? '0');
}

export function addScore(points) {
  const score = getScore() + points;
  localStorage.setItem(KEYS.SCORE, String(score));
  return score;
}

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

// ── 답변한 문제 ID 추적 (중복 방지) ──────────────────
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
