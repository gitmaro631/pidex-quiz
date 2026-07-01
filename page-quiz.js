import { quizBeginner }  from './data/quiz-beginner.js';
import { quizMid }       from './data/quiz-mid.js';
import { quizAdvanced }  from './data/quiz-advanced.js';
import { surveyQuestions } from './data/survey.js';
import { t, tf, getLang } from './util-i18n.js';
import {
  getScore, addScore, getHighScore,
  getStreak, setStreak,
  getLives, loseLife, addLives, resetGame,
  recordAnswer, markAnswered, hasAnswered,
  hasSurveyDone, saveSurveyAnswer, saveSubAnswer, getSurveyAnswers, getSurveyCount,
  getRank, getNextRank,
  getMode, setMode, MODES,
  LIVES_SURVEY_MILESTONE,
  getMinerCorrectCount, incrementMinerCorrect,
} from './util-storage.js';
import { updateHeaderScore, updateHeaderLives, getCurrentUid } from './app.js';
import { submitLeaderboardScore, saveSurveyToFirestore } from './firebase.js';

const POINTS       = { beginner: 10, mid: 20, advanced: 30 };
const STREAK_BONUS = 5;

function quizQ(q)         { return tf(q.id + '.q',       q.q); }
function quizChoice(q, i) { return tf(q.id + '.c' + i,   q.choices[i]); }
function quizExplain(q)   { return tf(q.id + '.explain',  q.explanation); }

// ── 세션 상태 ─────────────────────────────────────────
let session  = null;
let username = 'Pioneer';

// ── 진입점 ────────────────────────────────────────────
export function renderQuizPage(container) {
  username = document.getElementById('header-username')?.textContent ?? 'Pioneer';
  const mode = getMode();
  if (mode) {
    renderModeHome(container);
  } else {
    renderModeSelect(container);
  }
}

// ── 모드 선택 화면 ────────────────────────────────────
function renderModeSelect(container) {
  container.innerHTML = `
    <div class="quiz-home">
      <div class="mode-select-title">${t('mode.select.title')}</div>
      <div class="mode-grid">

        <button class="mode-card mode-miner" data-mode="miner">
          <div class="mode-icon">⛏️</div>
          <div class="mode-name">Miner</div>
          <div class="mode-desc">${t('mode.miner.desc').replace(/\n/g, '<br>')}</div>
        </button>

        <button class="mode-card mode-pioneer" data-mode="pioneer">
          <div class="mode-icon">🚀</div>
          <div class="mode-name">Pioneer</div>
          <div class="mode-desc">${t('mode.pioneer.desc').replace(/\n/g, '<br>')}</div>
        </button>

        <button class="mode-card mode-validator" data-mode="validator">
          <div class="mode-icon">🔱</div>
          <div class="mode-name">Validator</div>
          <div class="mode-desc">${t('mode.validator.desc').replace(/\n/g, '<br>')}</div>
        </button>

      </div>
      <p class="mode-note">${t('mode.reset.note')}</p>
    </div>
  `;

  container.querySelectorAll('.mode-card').forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      updateHeaderLives();
      renderModeHome(container);
    });
  });
}

// ── 모드 홈 (세션 시작 전) ────────────────────────────
function renderModeHome(container) {
  const mode  = getMode();
  const cfg   = MODES[mode];
  const score = getScore();
  const rank  = getRank(score);
  const next  = getNextRank(score);
  const lives = getLives();

  const livesDisplay = lives === null
    ? t('mode.lives.none')
    : ('❤️'.repeat(Math.max(0, lives)) || '💀');

  const nextTxt = next
    ? t('quiz.next_rank').replace('{n}', next.min - score).replace('{label}', next.label)
    : t('quiz.max_rank');

  container.innerHTML = `
    <div class="quiz-home">
      <div class="rank-badge">
        <div class="mode-badge">${cfg.icon} ${cfg.label} 모드</div>
        <div class="rank-label">${rank.label}</div>
        <div class="rank-score">${score}점 · ${nextTxt}</div>
        <div class="rank-lives">${livesDisplay}</div>
      </div>

      <button class="btn-primary btn-start-session" id="btn-start">${t('quiz.start')}</button>
      <button class="btn-ghost btn-change-mode" id="btn-change-mode">${t('mode.change')}</button>
    </div>
  `;

  container.querySelector('#btn-start').addEventListener('click', () => startSession(container));
  container.querySelector('#btn-change-mode').addEventListener('click', () => renderModeSelect(container));
}

// ── 세션 시작 ─────────────────────────────────────────
function startSession(container) {
  const mode = getMode();
  const allQuestions = [...quizBeginner, ...quizMid, ...quizAdvanced];
  const pool = allQuestions.filter(q => !hasAnswered(q.id));

  if (pool.length === 0) {
    container.innerHTML = `<div class="quiz-empty">
      <p>${t('quiz.allDone')}</p>
      <button class="btn-primary" id="btn-back">${t('btn.again')}</button>
    </div>`;
    container.querySelector('#btn-back').addEventListener('click', () => renderModeHome(container));
    return;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
  const queue = buildQueue(shuffled);

  session = { mode, queue, index: 0, correct: 0, total: 0 };
  renderNextItem(container);
}

// ── 큐 빌드 (퀴즈 + 설문 혼합) ───────────────────────
function buildQueue(quizItems) {
  const queue = [];
  let quizCount = 0;

  const surveys = [...surveyQuestions]
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

// ── 다음 항목 렌더 ────────────────────────────────────
function renderNextItem(container) {
  if (!session || session.index >= session.queue.length) {
    renderSessionEnd(container);
    return;
  }
  const item = session.queue[session.index];
  if (item.type === 'quiz') renderQuestion(container, item.data);
  if (item.type === 'survey') {
    if (item.data.type === 'grouped') renderGroupedSurvey(container, item.data);
    else renderSurveyQuestion(container, item.data);
  }
}

// ── 퀴즈 문항 렌더 ───────────────────────────────────
function renderQuestion(container, q) {
  const mode  = session.mode;
  const lives = getLives();

  const livesHTML = mode === 'validator'
    ? `<span class="mode-badge-inline">🔱 Validator</span>`
    : `<span class="quiz-lives-inline">${'❤️'.repeat(Math.max(0, lives))}</span>`;

  const diffKey = getDiffKey(q.id);
  const pts = POINTS[diffKey] ?? 10;

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">
        <span>문제 ${session.index + 1} / ${session.queue.length}</span>
        ${livesHTML}
        <span class="quiz-pts-badge">+${pts}점</span>
      </div>
      <div class="quiz-question">${quizQ(q)}</div>
      <div class="quiz-choices">
        ${q.choices.map((c, i) => `
          <button class="choice-btn" data-index="${i}">
            <span class="choice-num">${['①','②','③','④'][i]}</span>
            <span class="choice-text">${quizChoice(q, i)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(container, q, parseInt(btn.dataset.index), pts));
  });
}

function getDiffKey(qId) {
  if (qId.startsWith('B')) return 'beginner';
  if (qId.startsWith('M')) return 'mid';
  return 'advanced';
}

// ── 정답 처리 ─────────────────────────────────────────
function handleAnswer(container, q, selectedIndex, pts) {
  const correct   = selectedIndex === q.answer;
  const mode      = session.mode;
  const streak    = getStreak();
  const newStreak = correct ? streak + 1 : 0;
  setStreak(newStreak);

  let earned    = 0;
  let livesLeft = getLives();
  let minerBonus = false;

  if (correct) {
    earned = pts;
    if (newStreak > 0 && newStreak % 3 === 0) earned += STREAK_BONUS;
    addScore(earned);
    session.correct++;

    if (mode === 'miner') {
      const cnt = incrementMinerCorrect();
      if (cnt % 10 === 0) {
        addLives(1);
        minerBonus = true;
      }
    }
  } else {
    if (mode === 'validator') {
      // Validator: 즉시 게임 오버
      recordAnswer(false);
      markAnswered(q.id);
      updateHeaderScore();
      renderValidatorFail(container, q, selectedIndex);
      return;
    }
    livesLeft = loseLife();
  }

  session.total++;
  recordAnswer(correct);
  markAnswered(q.id);
  updateHeaderScore();
  updateHeaderLives();

  container.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer)                 btn.classList.add('correct');
    if (i === selectedIndex && !correct) btn.classList.add('wrong');
  });

  const card = container.querySelector('.quiz-card');

  if (!correct && livesLeft <= 0) {
    card.insertAdjacentHTML('beforeend', `
      <div class="quiz-result result-wrong">
        <div class="result-icon">❌</div>
        <div class="result-msg">${t('quiz.wrong')} — ${t('gameover.title')} 💀</div>
        <div class="result-explanation">${quizExplain(q)}</div>
        <button class="btn-primary btn-next" id="btn-gameover">${t('quiz.see_result')}</button>
      </div>
    `);
    card.querySelector('#btn-gameover').addEventListener('click', () => renderGameOver(container));
    return;
  }

  const bonusMsg = minerBonus ? `<div class="streak-msg">${t('survey.life.bonus').replace('{n}', getMinerCorrectCount())}</div>` : '';

  card.insertAdjacentHTML('beforeend', `
    <div class="quiz-result ${correct ? 'result-correct' : 'result-wrong'}">
      <div class="result-icon">${correct ? '✅' : '❌'}</div>
      <div class="result-msg">${correct ? `${t('quiz.correct')} +${earned}점` : `${t('quiz.wrong')} — ❤️ ${'❤️'.repeat(livesLeft)}`}</div>
      ${newStreak >= 3 && correct ? `<div class="streak-msg">🔥 ${newStreak}연속 정답!</div>` : ''}
      ${bonusMsg}
      <div class="result-explanation">${quizExplain(q)}</div>
      <button class="btn-primary btn-next" id="btn-next">${t('btn.next')}</button>
    </div>
  `);
  card.querySelector('#btn-next').addEventListener('click', () => {
    session.index++;
    renderNextItem(container);
  });
}

// ── Validator 오답 즉시 종료 ──────────────────────────
function renderValidatorFail(container, q, selectedIndex) {
  container.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer)     btn.classList.add('correct');
    if (i === selectedIndex) btn.classList.add('wrong');
  });

  const card = container.querySelector('.quiz-card');
  card.insertAdjacentHTML('beforeend', `
    <div class="quiz-result result-wrong">
      <div class="result-icon">💀</div>
      <div class="result-msg">${t('mode.validator.fail')}</div>
      <div class="result-explanation">${quizExplain(q)}</div>
      <button class="btn-primary btn-next" id="btn-vfail">결과 보기</button>
    </div>
  `);
  card.querySelector('#btn-vfail').addEventListener('click', () => renderGameOver(container));
}

// ── 설문 문항 렌더 (단일) ─────────────────────────────
export function renderSurveyQuestion(container, s, onDone) {
  const isMulti    = s.type === 'multi';
  const isDropdown = s.type === 'dropdown';
  const existing   = getSurveyAnswers()[s.id];

  const placeholder = tf(s.id + '.placeholder', s.placeholder ?? t('S_COUNTRY.placeholder'));
  const choicesHTML = isDropdown
    ? `<select class="survey-select" name="survey">
        <option value="">${placeholder}</option>
        ${s.choices.map(c => `
          <option value="${c.value}" ${existing === c.value ? 'selected' : ''}>${tf(s.id + '.' + c.value, c.label)}</option>
        `).join('')}
      </select>`
    : s.choices.map((c) => {
        const checked = isMulti
          ? (Array.isArray(existing) && existing.includes(c.value))
          : existing === c.value;
        return `
          <label class="survey-choice">
            <input type="${isMulti ? 'checkbox' : 'radio'}" name="survey" value="${c.value}" ${checked ? 'checked' : ''} />
            <span>${tf(s.id + '.' + c.value, c.label)}</span>
          </label>
        `;
      }).join('');

  container.innerHTML = `
    <div class="survey-card">
      <div class="survey-badge">${t('survey.badge')}</div>
      <div class="survey-question">${tf(s.id + '.q', s.q)}</div>
      <div class="survey-choices ${isDropdown ? 'survey-choices-dropdown' : ''}">
        ${choicesHTML}
      </div>
      <button class="btn-primary btn-survey-submit" id="btn-survey">${t('survey.submit')}</button>
      ${onDone ? '' : `<button class="btn-ghost" id="btn-skip">${t('survey.skip')}</button>`}
    </div>
  `;

  container.querySelector('#btn-survey').addEventListener('click', () => {
    let checked;
    if (isDropdown) {
      const val = container.querySelector('select[name="survey"]')?.value;
      checked = val ? [val] : [];
    } else {
      const inputs = [...container.querySelectorAll('input[name="survey"]')];
      checked = inputs.filter(i => i.checked).map(i => i.value);
    }
    if (checked.length === 0) return;

    const answer = isMulti ? checked : checked[0];
    saveSurveyAnswer(s.id, answer);
    addScore(5);
    updateHeaderScore();

    const count = getSurveyCount();
    const mode  = getMode();
    if (count > 0 && count % LIVES_SURVEY_MILESTONE === 0) {
      if (mode === 'miner' || mode === 'pioneer') {
        addLives(1);
        showToast(t('survey.life.bonus').replace('{n}', count));
      }
    }
    updateHeaderLives();

    const uid = getCurrentUid();
    if (uid) saveSurveyToFirestore(uid, getSurveyAnswers(), getSurveyDone());

    if (onDone) {
      onDone();
      return;
    }
    session.index++;
    renderNextItem(container);
  });

  if (!onDone) {
    container.querySelector('#btn-skip')?.addEventListener('click', () => {
      session.index++;
      renderNextItem(container);
    });
  }
}

// ── 설문 문항 렌더 (노드 통합 카드) ──────────────────
export function renderGroupedSurvey(container, s, onDone) {
  const existing = getSurveyAnswers();

  const subQsHTML = s.subQuestions.map(sq => `
    <div class="survey-subq ${sq.showIf ? 'survey-subq-hidden' : ''}" data-sqid="${sq.id}" data-showif='${JSON.stringify(sq.showIf ?? null)}'>
      <div class="survey-subq-label">${tf(sq.id + '.q', sq.q)}</div>
      <div class="survey-choices">
        ${sq.choices.map(c => `
          <label class="survey-choice">
            <input type="radio" name="sq_${sq.id}" value="${c.value}" ${existing[sq.id] === c.value ? 'checked' : ''} />
            <span>${tf(sq.id + '.' + c.value, c.label)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  const ecoMsg = s.ecosystemMsg ? tf(s.id + '.ecosystemMsg', s.ecosystemMsg) : '';

  container.innerHTML = `
    <div class="survey-card">
      <div class="survey-badge">${t('survey.badge')}</div>
      ${ecoMsg ? `<div class="survey-ecosystem-msg">${ecoMsg}</div>` : ''}
      ${subQsHTML}
      <button class="btn-primary btn-survey-submit" id="btn-survey-group">${t('survey.submit')}</button>
      ${onDone ? '' : `<button class="btn-ghost" id="btn-skip-group">${t('survey.skip')}</button>`}
    </div>
  `;

  const firstSq = s.subQuestions[0];
  const firstChecked = container.querySelector(`input[name="sq_${firstSq.id}"]:checked`);
  if (firstChecked) updateGroupedVisibility(container, s, firstChecked.value);

  container.querySelectorAll(`input[name="sq_${firstSq.id}"]`).forEach(input => {
    input.addEventListener('change', () => updateGroupedVisibility(container, s, input.value));
  });

  container.querySelector('#btn-survey-group').addEventListener('click', () => {
    const subAnswers = {};
    let missingRequired = false;

    for (const sq of s.subQuestions) {
      const el = container.querySelector(`[data-sqid="${sq.id}"]`);
      if (el.classList.contains('survey-subq-hidden')) continue;
      const checked = container.querySelector(`input[name="sq_${sq.id}"]:checked`);
      if (!checked) { missingRequired = true; break; }
      subAnswers[sq.id] = checked.value;
    }

    if (missingRequired) return;

    for (const [id, val] of Object.entries(subAnswers)) {
      saveSubAnswer(id, val);
    }
    saveSurveyAnswer(s.id, 'done');
    addScore(5);
    updateHeaderScore();

    const count = getSurveyCount();
    const mode  = getMode();
    if (count > 0 && count % LIVES_SURVEY_MILESTONE === 0) {
      if (mode === 'miner' || mode === 'pioneer') {
        addLives(1);
        showToast(t('survey.life.bonus').replace('{n}', count));
      }
    }
    updateHeaderLives();

    const uid = getCurrentUid();
    if (uid) saveSurveyToFirestore(uid, getSurveyAnswers(), getSurveyDone());

    if (onDone) {
      onDone();
      return;
    }
    session.index++;
    renderNextItem(container);
  });

  if (!onDone) {
    container.querySelector('#btn-skip-group')?.addEventListener('click', () => {
      session.index++;
      renderNextItem(container);
    });
  }
}

function updateGroupedVisibility(container, s, q1Value) {
  s.subQuestions.forEach(sq => {
    if (!sq.showIf) return;
    const el = container.querySelector(`[data-sqid="${sq.id}"]`);
    el.classList.toggle('survey-subq-hidden', !sq.showIf.values.includes(q1Value));
  });
}

// ── 토스트 메시지 ─────────────────────────────────────
export function showToast(msg, ms = 2500) {
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// ── 세션 종료 ─────────────────────────────────────────
function renderSessionEnd(container) {
  const score = getScore();
  const rank  = getRank(score);
  const next  = getNextRank(score);
  const pct   = session.total > 0 ? Math.round(session.correct / session.total * 100) : 0;
  const lives = getLives();
  const mode  = session.mode;
  const cfg   = MODES[mode];

  const livesDisplay = lives === null ? '' : `<div class="session-lives">${'❤️'.repeat(Math.max(0, lives))}</div>`;

  container.innerHTML = `
    <div class="session-end">
      <div class="mode-badge">${cfg.icon} ${cfg.label}</div>
      <div class="session-rank">${rank.label}</div>
      <div class="session-score">${score}점</div>
      ${livesDisplay}
      <div class="session-stats">${t('quiz.session_stats').replace('{c}', session.correct).replace('{t}', session.total).replace('{p}', pct)}</div>
      ${next
        ? `<div class="session-next">${t('quiz.next_rank').replace('{n}', next.min - score).replace('{label}', next.label)}</div>`
        : `<div class="session-next">${t('quiz.max_rank')}</div>`}
      <div class="session-btns">
        <button class="btn-primary" id="btn-again">${t('btn.again')}</button>
        <button class="btn-secondary" id="btn-rank">${t('btn.rank')}</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-again').addEventListener('click', () => startSession(container));
  container.querySelector('#btn-rank').addEventListener('click', () => {
    import('./app.js').then(m => m.rerenderPage('rank'));
  });
  session = null;
}

// ── 게임 오버 (생명력 소진 / Validator 오답) ─────────
async function renderGameOver(container) {
  const finalScore = getScore();
  const rank       = getRank(finalScore);
  const highScore  = getHighScore();
  const mode       = session?.mode ?? getMode();
  const cfg        = MODES[mode];

  container.innerHTML = `
    <div class="game-over">
      <div class="mode-badge">${cfg.icon} ${cfg.label}</div>
      <div class="game-over-icon">${mode === 'validator' ? '🔱' : '💀'}</div>
      <div class="game-over-title">${t('gameover.title')}</div>
      <div class="game-over-score">${finalScore}점</div>
      <div class="game-over-rank">${rank.label}</div>
      ${finalScore > highScore
        ? `<div class="game-over-best">${t('gameover.best')}</div>`
        : `<div class="game-over-prev">${t('gameover.prev').replace('{n}', highScore)}</div>`}
      <p class="game-over-desc">${t('gameover.desc').replace(/\n/g, '<br>')}</p>
      <button class="btn-primary game-over-btn" id="btn-submit">${t('gameover.btn')}</button>
    </div>
  `;

  container.querySelector('#btn-submit').addEventListener('click', async () => {
    try {
      await submitLeaderboardScore(username, finalScore, mode);
    } catch (e) {
      console.warn('리더보드 등록 실패:', e);
    }
    resetGame();
    updateHeaderScore();
    updateHeaderLives();
    session = null;
    renderModeHome(container);
  });
}
