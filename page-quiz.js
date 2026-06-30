import { quizBeginner }  from './data/quiz-beginner.js';
import { quizMid }       from './data/quiz-mid.js';
import { quizAdvanced }  from './data/quiz-advanced.js';
import { surveyQuestions } from './data/survey.js';
import {
  getScore, addScore, getStreak, setStreak,
  recordAnswer, markAnswered, hasAnswered,
  hasSurveyDone, saveSurveyAnswer, getSurveyAnswers,
  getRank, getNextRank,
} from './util-storage.js';
import { updateHeaderScore } from './app.js';
import { submitSurveyAnswers } from './firebase.js';

const POINTS   = { beginner: 10, mid: 20, advanced: 30 };
const STREAK_BONUS = 5; // 3연속 정답 시 추가

// ── 세션 상태 ─────────────────────────────────────────
let session = null;

// ── 진입점 ────────────────────────────────────────────
export function renderQuizPage(container) {
  renderDifficultySelect(container);
}

// ── 난이도 선택 화면 ──────────────────────────────────
function renderDifficultySelect(container) {
  const score   = getScore();
  const rank    = getRank(score);
  const next    = getNextRank(score);
  const nextTxt = next ? `다음 등급까지 ${next.min - score}점` : '최고 등급 달성!';

  container.innerHTML = `
    <div class="quiz-home">
      <div class="rank-badge">
        <div class="rank-label">${rank.label}</div>
        <div class="rank-score">${score}점 · ${nextTxt}</div>
      </div>

      <div class="difficulty-grid">
        <button class="diff-card diff-beginner" data-diff="beginner">
          <div class="diff-icon">🌱</div>
          <div class="diff-name">초급</div>
          <div class="diff-pts">정답당 10점</div>
          <div class="diff-desc">기초 용어와 개념</div>
        </button>
        <button class="diff-card diff-mid" data-diff="mid">
          <div class="diff-icon">📊</div>
          <div class="diff-name">중급</div>
          <div class="diff-pts">정답당 20점</div>
          <div class="diff-desc">작동 원리와 전략</div>
        </button>
        <button class="diff-card diff-advanced" data-diff="advanced">
          <div class="diff-icon">🔱</div>
          <div class="diff-name">고급</div>
          <div class="diff-pts">정답당 30점</div>
          <div class="diff-desc">심화 분석과 응용</div>
        </button>
      </div>

      <p class="quiz-home-note">3연속 정답 시 보너스 +${STREAK_BONUS}점</p>
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

  // 아직 안 풀었거나 날짜 기반으로 섞기
  const pool = allQuestions.filter(q => !hasAnswered(q.id));
  if (pool.length === 0) {
    container.innerHTML = `<div class="quiz-empty">
      <p>초급 문항을 모두 풀었어요! 🎉</p>
      <p>중급이나 고급에 도전해보세요.</p>
      <button class="btn-primary" id="btn-back">돌아가기</button>
    </div>`;
    container.querySelector('#btn-back').addEventListener('click', () => renderDifficultySelect(container));
    return;
  }

  // 최대 10문제 (초급이면 설문 삽입 위치 고려)
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);

  // 초급이면 설문 문항 끼워넣기
  const queue = difficulty === 'beginner'
    ? buildBeginnerQueue(shuffled)
    : shuffled.map(q => ({ type: 'quiz', data: q }));

  session = { difficulty, queue, index: 0, correct: 0, total: 0 };
  renderNextItem(container);
}

// ── 초급 큐 생성 (퀴즈 + 설문 혼합) ──────────────────
function buildBeginnerQueue(quizItems) {
  const queue = [];
  let quizCount = 0;

  // 설문을 insertAfter 기준으로 정렬
  const surveys = [...surveyQuestions]
    .filter(s => !s.dependsOn || checkDependency(s))
    .sort((a, b) => (a.insertAfter ?? 99) - (b.insertAfter ?? 99));

  let surveyIdx = 0;

  for (const q of quizItems) {
    queue.push({ type: 'quiz', data: q });
    quizCount++;

    // 이 퀴즈 번호 이후에 삽입할 설문 추가
    while (surveyIdx < surveys.length && surveys[surveyIdx].insertAfter <= quizCount) {
      const s = surveys[surveyIdx];
      if (!hasSurveyDone(s.id)) {
        queue.push({ type: 'survey', data: s });
      }
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
  const pts = POINTS[session.difficulty];
  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">
        문제 ${session.index + 1} / ${session.queue.length}
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
  const correct  = selectedIndex === q.answer;
  const pts      = POINTS[session.difficulty];
  const streak   = getStreak();
  const newStreak = correct ? streak + 1 : 0;
  setStreak(newStreak);

  let earned = 0;
  if (correct) {
    earned = pts;
    if (newStreak > 0 && newStreak % 3 === 0) earned += STREAK_BONUS;
    addScore(earned);
    session.correct++;
  }
  session.total++;
  recordAnswer(correct);
  markAnswered(q.id);
  updateHeaderScore();

  // 결과 표시
  const choiceBtns = container.querySelectorAll('.choice-btn');
  choiceBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer)     btn.classList.add('correct');
    if (i === selectedIndex && !correct) btn.classList.add('wrong');
  });

  const card = container.querySelector('.quiz-card');
  const resultHtml = `
    <div class="quiz-result ${correct ? 'result-correct' : 'result-wrong'}">
      <div class="result-icon">${correct ? '✅' : '❌'}</div>
      <div class="result-msg">${correct ? `정답! +${earned}점` : '오답'}</div>
      ${newStreak >= 3 ? `<div class="streak-msg">🔥 ${newStreak}연속 정답!</div>` : ''}
      <div class="result-explanation">${q.explanation}</div>
      <button class="btn-primary btn-next" id="btn-next">다음 →</button>
    </div>
  `;
  card.insertAdjacentHTML('beforeend', resultHtml);
  card.querySelector('#btn-next').addEventListener('click', () => {
    session.index++;
    renderNextItem(container);
  });
}

// ── 설문 문항 렌더 ────────────────────────────────────
function renderSurveyQuestion(container, s) {
  const isMulti = s.type === 'multi';
  container.innerHTML = `
    <div class="survey-card">
      <div class="survey-badge">📋 커뮤니티 설문 +5점</div>
      <div class="survey-question">${s.q}</div>
      <div class="survey-choices">
        ${s.choices.map((c, i) => `
          <label class="survey-choice ${isMulti ? 'multi' : 'single'}">
            <input type="${isMulti ? 'checkbox' : 'radio'}" name="survey" value="${c.value}" />
            <span>${c.label}</span>
          </label>
        `).join('')}
      </div>
      <button class="btn-primary btn-survey-submit" id="btn-survey">답변 제출</button>
      <button class="btn-ghost btn-survey-skip" id="btn-skip">건너뛰기</button>
    </div>
  `;

  container.querySelector('#btn-survey').addEventListener('click', () => {
    const inputs = [...container.querySelectorAll('input[name="survey"]')];
    const checked = inputs.filter(i => i.checked).map(i => i.value);
    if (checked.length === 0) return;
    const answer = isMulti ? checked : checked[0];
    saveSurveyAnswer(s.id, answer);
    addScore(5);
    updateHeaderScore();
    // Firebase에 전체 설문 응답 제출 (완료 시점)
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

// ── 세션 종료 화면 ────────────────────────────────────
function renderSessionEnd(container) {
  const score    = getScore();
  const rank     = getRank(score);
  const next     = getNextRank(score);
  const pct      = session.total > 0 ? Math.round(session.correct / session.total * 100) : 0;

  container.innerHTML = `
    <div class="session-end">
      <div class="session-rank">${rank.label}</div>
      <div class="session-score">${score}점</div>
      <div class="session-stats">
        이번 세션: ${session.correct}/${session.total} 정답 (${pct}%)
      </div>
      ${next ? `<div class="session-next">다음 등급 <b>${next.label}</b>까지 <b>${next.min - score}점</b></div>` : '<div class="session-next">🎉 최고 등급!</div>'}
      <div class="session-btns">
        <button class="btn-primary" id="btn-again">한 번 더</button>
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
