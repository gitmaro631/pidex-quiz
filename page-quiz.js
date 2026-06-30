import { quizBeginner }  from './data/quiz-beginner.js';
import { quizMid }       from './data/quiz-mid.js';
import { quizAdvanced }  from './data/quiz-advanced.js';
import { surveyQuestions } from './data/survey.js';
import { t } from './util-i18n.js';
import {
  getScore, addScore, getHighScore,
  getStreak, setStreak,
  getLives, loseLife, addLives, resetGame,
  recordAnswer, markAnswered, hasAnswered,
  hasSurveyDone, saveSurveyAnswer, getSurveyAnswers,
  getRank, getNextRank,
  LIVES_STREAK_BONUS, LIVES_SURVEY_BONUS,
} from './util-storage.js';
import { updateHeaderScore, updateHeaderLives } from './app.js';
import { submitSurveyAnswers, submitLeaderboardScore } from './firebase.js';

const POINTS       = { beginner: 10, mid: 20, advanced: 30 };
const STREAK_BONUS = 5;  // 3연속 정답 시 +5점

// ── 세션 상태 ─────────────────────────────────────────
let session  = null;
let username = 'Pioneer';

// ── 진입점 ────────────────────────────────────────────
export function renderQuizPage(container) {
  username = document.getElementById('header-username')?.textContent ?? 'Pioneer';
  renderDifficultySelect(container);
}

// ── 난이도 선택 화면 ──────────────────────────────────
function renderDifficultySelect(container) {
  const score   = getScore();
  const rank    = getRank(score);
  const next    = getNextRank(score);
  const lives   = getLives();
  const nextTxt = next ? `다음 등급까지 ${next.min - score}점` : '최고 등급 달성!';

  container.innerHTML = `
    <div class="quiz-home">
      <div class="rank-badge">
        <div class="rank-label">${rank.label}</div>
        <div class="rank-score">${score}점 · ${nextTxt}</div>
        <div class="rank-lives">생명력 ${'❤️'.repeat(Math.max(0,lives)) || '💀'}</div>
      </div>

      <div class="difficulty-grid">
        <button class="diff-card diff-beginner" data-diff="beginner">
          <div class="diff-icon">🌱</div>
          <div>
            <div class="diff-name">초급</div>
            <div class="diff-pts">정답당 10점</div>
            <div class="diff-desc">기초 용어와 개념 · 설문 포함</div>
          </div>
        </button>
        <button class="diff-card diff-mid" data-diff="mid">
          <div class="diff-icon">📊</div>
          <div>
            <div class="diff-name">중급</div>
            <div class="diff-pts">정답당 20점</div>
            <div class="diff-desc">작동 원리와 전략</div>
          </div>
        </button>
        <button class="diff-card diff-advanced" data-diff="advanced">
          <div class="diff-icon">🔱</div>
          <div>
            <div class="diff-name">고급</div>
            <div class="diff-pts">정답당 30점</div>
            <div class="diff-desc">심화 분석과 응용</div>
          </div>
        </button>
      </div>

      <div class="lives-hint">
        ❤️ 오답 시 생명력 -1 &nbsp;|&nbsp;
        5연속 정답 시 +1 &nbsp;|&nbsp;
        설문 완료 시 +${LIVES_SURVEY_BONUS}
      </div>
    </div>
  `;

  container.querySelectorAll('.diff-card').forEach(btn => {
    btn.addEventListener('click', () => startSession(container, btn.dataset.diff));
  });
}

// ── 세션 시작 ─────────────────────────────────────────
function startSession(container, difficulty) {
  const allQuestions = {
    beginner: quizBeginner,
    mid:      quizMid,
    advanced: quizAdvanced,
  }[difficulty];

  const pool = allQuestions.filter(q => !hasAnswered(q.id));
  if (pool.length === 0) {
    container.innerHTML = `<div class="quiz-empty">
      <p>이 난이도 문항을 모두 풀었어요! 🎉</p>
      <p>다른 난이도에 도전해보세요.</p>
      <button class="btn-primary" id="btn-back">돌아가기</button>
    </div>`;
    container.querySelector('#btn-back').addEventListener('click', () => renderDifficultySelect(container));
    return;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);

  const queue = difficulty === 'beginner'
    ? buildBeginnerQueue(shuffled)
    : shuffled.map(q => ({ type: 'quiz', data: q }));

  session = { difficulty, queue, index: 0, correct: 0, total: 0 };
  renderNextItem(container);
}

// ── 초급 큐 (퀴즈 + 설문 혼합) ───────────────────────
function buildBeginnerQueue(quizItems) {
  const queue = [];
  let quizCount = 0;

  const surveys = [...surveyQuestions]
    .filter(s => !s.dependsOn || checkDependency(s))
    .sort((a, b) => (a.insertAfter ?? 99) - (b.insertAfter ?? 99));

  let surveyIdx = 0;

  for (const q of quizItems) {
    queue.push({ type: 'quiz', data: q });
    quizCount++;
    while (surveyIdx < surveys.length && surveys[surveyIdx].insertAfter <= quizCount) {
      const s = surveys[surveyIdx];
      if (!hasSurveyDone(s.id)) queue.push({ type: 'survey', data: s });
      surveyIdx++;
    }
  }

  return queue;
}

function checkDependency(survey) {
  if (!survey.dependsOn) return true;
  const answers = getSurveyAnswers();
  return answers[survey.dependsOn.id] === survey.dependsOn.value;
}

// ── 다음 항목 렌더 ────────────────────────────────────
function renderNextItem(container) {
  if (!session || session.index >= session.queue.length) {
    renderSessionEnd(container);
    return;
  }
  const item = session.queue[session.index];
  if (item.type === 'quiz')   renderQuestion(container, item.data);
  if (item.type === 'survey') renderSurveyQuestion(container, item.data);
}

// ── 퀴즈 문항 렌더 ───────────────────────────────────
function renderQuestion(container, q) {
  const pts   = POINTS[session.difficulty];
  const lives = getLives();

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">
        <span>문제 ${session.index + 1} / ${session.queue.length}</span>
        <span class="quiz-lives-inline">${'❤️'.repeat(Math.max(0,lives))}</span>
        <span class="quiz-pts-badge">+${pts}점</span>
      </div>
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-choices">
        ${q.choices.map((c, i) => `
          <button class="choice-btn" data-index="${i}">
            <span class="choice-num">${['①','②','③','④'][i]}</span>
            <span class="choice-text">${c}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(container, q, parseInt(btn.dataset.index)));
  });
}

// ── 정답 처리 ─────────────────────────────────────────
function handleAnswer(container, q, selectedIndex) {
  const correct    = selectedIndex === q.answer;
  const pts        = POINTS[session.difficulty];
  const streak     = getStreak();
  const newStreak  = correct ? streak + 1 : 0;
  setStreak(newStreak);

  let earned      = 0;
  let lifeMsg     = '';
  let livesLeft   = getLives();

  if (correct) {
    earned = pts;
    if (newStreak > 0 && newStreak % 3 === 0) earned += STREAK_BONUS;
    addScore(earned);
    session.correct++;

    // 5연속 정답 시 생명 +1
    if (newStreak > 0 && newStreak % LIVES_STREAK_BONUS === 0) {
      livesLeft = addLives(1);
      lifeMsg = `❤️ ${LIVES_STREAK_BONUS}연속 정답! 생명력 +1`;
    }
  } else {
    livesLeft = loseLife();
  }

  session.total++;
  recordAnswer(correct);
  markAnswered(q.id);
  updateHeaderScore();
  updateHeaderLives();

  // 버튼 시각 피드백
  container.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer)                       btn.classList.add('correct');
    if (i === selectedIndex && !correct)       btn.classList.add('wrong');
  });

  const card = container.querySelector('.quiz-card');

  // 생명 0이면 → 정답 표시 후 게임오버
  if (!correct && livesLeft <= 0) {
    card.insertAdjacentHTML('beforeend', `
      <div class="quiz-result result-wrong">
        <div class="result-icon">❌</div>
        <div class="result-msg">오답 — 생명력 소진! 💀</div>
        <div class="result-explanation">${q.explanation}</div>
        <button class="btn-primary btn-next" id="btn-gameover">결과 보기</button>
      </div>
    `);
    card.querySelector('#btn-gameover').addEventListener('click', () => renderGameOver(container));
    return;
  }

  card.insertAdjacentHTML('beforeend', `
    <div class="quiz-result ${correct ? 'result-correct' : 'result-wrong'}">
      <div class="result-icon">${correct ? '✅' : '❌'}</div>
      <div class="result-msg">${correct ? `정답! +${earned}점` : `오답 — 생명력 남음 ${'❤️'.repeat(livesLeft)}`}</div>
      ${lifeMsg  ? `<div class="streak-msg">${lifeMsg}</div>` : ''}
      ${newStreak >= 3 && correct && newStreak % LIVES_STREAK_BONUS !== 0
        ? `<div class="streak-msg">🔥 ${newStreak}연속 정답!</div>` : ''}
      <div class="result-explanation">${q.explanation}</div>
      <button class="btn-primary btn-next" id="btn-next">다음 →</button>
    </div>
  `);
  card.querySelector('#btn-next').addEventListener('click', () => {
    session.index++;
    renderNextItem(container);
  });
}

// ── 설문 문항 렌더 ────────────────────────────────────
function renderSurveyQuestion(container, s) {
  const isMulti = s.type === 'multi';
  const qText   = (t(s.id + '.q') !== s.id + '.q') ? t(s.id + '.q') : s.q;

  container.innerHTML = `
    <div class="survey-card">
      <div class="survey-badge">${t('survey.badge')}</div>
      <div class="survey-question">${qText}</div>
      <div class="survey-choices">
        ${s.choices.map((c) => {
          const choiceKey = s.id + '.c.' + c.value;
          const choiceLabel = (t(choiceKey) !== choiceKey) ? t(choiceKey) : c.label;
          return `
            <label class="survey-choice">
              <input type="${isMulti ? 'checkbox' : 'radio'}" name="survey" value="${c.value}" />
              <span>${choiceLabel}</span>
            </label>
          `;
        }).join('')}
      </div>
      <button class="btn-primary btn-survey-submit" id="btn-survey">${t('survey.submit')}</button>
      <button class="btn-ghost" id="btn-skip">${t('survey.skip')}</button>
    </div>
  `;

  container.querySelector('#btn-survey').addEventListener('click', () => {
    const inputs  = [...container.querySelectorAll('input[name="survey"]')];
    const checked = inputs.filter(i => i.checked).map(i => i.value);
    if (checked.length === 0) return;

    const answer = isMulti ? checked : checked[0];
    saveSurveyAnswer(s.id, answer);
    addScore(5);
    addLives(LIVES_SURVEY_BONUS);
    updateHeaderScore();
    updateHeaderLives();

    if (hasSurveyDone('S_INFO_SOURCE')) {
      submitSurveyAnswers(getSurveyAnswers());
    }
    session.index++;
    renderNextItem(container);
  });

  container.querySelector('#btn-skip').addEventListener('click', () => {
    session.index++;
    renderNextItem(container);
  });
}

// ── 세션 종료 ─────────────────────────────────────────
function renderSessionEnd(container) {
  const score = getScore();
  const rank  = getRank(score);
  const next  = getNextRank(score);
  const pct   = session.total > 0 ? Math.round(session.correct / session.total * 100) : 0;
  const lives = getLives();

  container.innerHTML = `
    <div class="session-end">
      <div class="session-rank">${rank.label}</div>
      <div class="session-score">${score}점</div>
      <div class="session-lives">생명력 ${'❤️'.repeat(Math.max(0,lives))}</div>
      <div class="session-stats">이번 세션: ${session.correct}/${session.total} 정답 (${pct}%)</div>
      ${next ? `<div class="session-next">다음 등급 <b>${next.label}</b>까지 <b>${next.min - score}점</b></div>`
             : '<div class="session-next">🎉 최고 등급!</div>'}
      <div class="session-btns">
        <button class="btn-primary" id="btn-again">계속하기</button>
        <button class="btn-secondary" id="btn-rank">내 등급 보기</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-again').addEventListener('click', () => renderDifficultySelect(container));
  container.querySelector('#btn-rank').addEventListener('click', () => {
    import('./app.js').then(m => m.rerenderPage('rank'));
  });
  session = null;
}

// ── 게임 오버 (생명력 소진) ───────────────────────────
async function renderGameOver(container) {
  const finalScore = getScore();
  const rank       = getRank(finalScore);
  const highScore  = getHighScore();

  container.innerHTML = `
    <div class="game-over">
      <div class="game-over-icon">💀</div>
      <div class="game-over-title">생명력 소진!</div>
      <div class="game-over-score">${finalScore}점</div>
      <div class="game-over-rank">${rank.label}</div>
      ${finalScore > highScore
        ? `<div class="game-over-best">🎉 개인 최고 기록!</div>`
        : `<div class="game-over-prev">개인 최고: ${highScore}점</div>`}
      <p class="game-over-desc">이 점수가 리더보드에 등록되고<br>게임이 처음부터 시작됩니다</p>
      <button class="btn-primary game-over-btn" id="btn-submit">리더보드 등록 후 재시작</button>
    </div>
  `;

  container.querySelector('#btn-submit').addEventListener('click', async () => {
    try {
      await submitLeaderboardScore(username, finalScore);
    } catch (e) {
      console.warn('리더보드 등록 실패:', e);
    }
    resetGame();
    updateHeaderScore();
    updateHeaderLives();
    session = null;
    renderDifficultySelect(container);
  });
}
