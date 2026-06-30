import { surveyQuestions } from './data/survey.js';
import { hasSurveyDone } from './util-storage.js';
import { renderSurveyQuestion, renderGroupedSurvey } from './page-quiz.js';
import { t, tf } from './util-i18n.js';

export function renderSurveyPage(container) {
  renderSurveyList(container);
}

function renderSurveyList(container) {
  const items = surveyQuestions.map(s => {
    const done = hasSurveyDone(s.id);
    return `
      <div class="survey-list-item ${done ? 'survey-done' : ''}" data-id="${s.id}">
        <div class="survey-list-status">${done ? '✅' : '⬜'}</div>
        <div class="survey-list-q">${tf(s.id + '.q', s.q)}</div>
        <button class="btn-survey-action ${done ? 'btn-ghost' : 'btn-primary'}" data-id="${s.id}">
          ${done ? t('survey.edit') : t('survey.write')}
        </button>
      </div>
    `;
  }).join('');

  const doneCount = surveyQuestions.filter(s => hasSurveyDone(s.id)).length;

  container.innerHTML = `
    <div class="survey-page">
      <div class="survey-page-header">
        <h2 class="survey-page-title">${t('survey.page.title')}</h2>
        <div class="survey-page-progress">${doneCount} / ${surveyQuestions.length}</div>
      </div>
      <p class="survey-page-desc">${t('survey.page.desc')}</p>
      <div class="survey-list">
        ${items}
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-survey-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = surveyQuestions.find(q => q.id === btn.dataset.id);
      if (!s) return;
      renderSurveyForm(container, s);
    });
  });
}

function renderSurveyForm(container, s) {
  const wrapper = document.createElement('div');
  wrapper.className = 'survey-form-overlay';

  const inner = document.createElement('div');
  inner.className = 'survey-form-inner';
  wrapper.appendChild(inner);
  container.appendChild(wrapper);

  const onDone = () => {
    wrapper.remove();
    renderSurveyList(container);
  };

  if (s.type === 'grouped') {
    renderGroupedSurvey(inner, s, onDone);
  } else {
    renderSurveyQuestion(inner, s, onDone);
  }

  // 뒤로가기 버튼 추가
  const backBtn = document.createElement('button');
  backBtn.className = 'btn-ghost survey-form-back';
  backBtn.textContent = t('survey.back');
  backBtn.addEventListener('click', () => {
    wrapper.remove();
    renderSurveyList(container);
  });
  inner.prepend(backBtn);
}
