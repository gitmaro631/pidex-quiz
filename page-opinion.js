import { t } from './util-i18n.js';
import { initFirebase, submitOpinion, fetchOpinions, toggleOpinionLike } from './firebase.js';
import { setupPullToRefresh } from './util-ptr.js';

const MAX_CHARS = 150;

export async function renderOpinionPage(container) {
  setupPullToRefresh(container, () => renderOpinionPage(container));

  const username = document.getElementById('header-username')?.textContent?.trim() || null;

  container.innerHTML = `
    <div class="opinion-page">
      <div class="opinion-write-card">
        <textarea id="opinion-input" class="opinion-textarea"
          placeholder="${t('opinion.placeholder')}"
          maxlength="${MAX_CHARS}"
          ${!username ? 'disabled' : ''}></textarea>
        <div class="opinion-write-footer">
          <span id="opinion-charcount" class="opinion-charcount">0 / ${MAX_CHARS}</span>
          <button id="opinion-submit" class="btn-primary btn-sm opinion-submit-btn"
            ${!username ? 'disabled' : ''}>
            ${t('opinion.submit')}
          </button>
        </div>
        ${!username ? `<p class="opinion-login-note">${t('opinion.login_required')}</p>` : ''}
      </div>

      <div id="opinion-list" class="opinion-list">
        <div class="opinion-loading">${t('opinion.loading')}</div>
      </div>
    </div>
  `;

  const textarea   = container.querySelector('#opinion-input');
  const charCount  = container.querySelector('#opinion-charcount');
  const submitBtn  = container.querySelector('#opinion-submit');
  const listEl     = container.querySelector('#opinion-list');

  textarea?.addEventListener('input', () => {
    const len = textarea.value.length;
    charCount.textContent = `${len} / ${MAX_CHARS}`;
  });

  submitBtn?.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    submitBtn.disabled = true;
    submitBtn.textContent = '...';
    try {
      initFirebase();
      await submitOpinion(username, text);
      textarea.value = '';
      charCount.textContent = `0 / ${MAX_CHARS}`;
      await loadOpinions(listEl, username);
    } catch {
      alert(t('opinion.submit_fail'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t('opinion.submit');
    }
  });

  await loadOpinions(listEl, username);
}

async function loadOpinions(listEl, username) {
  listEl.innerHTML = `<div class="opinion-loading">${t('opinion.loading')}</div>`;
  try {
    initFirebase();
    const opinions = await fetchOpinions();
    if (!opinions.length) {
      listEl.innerHTML = `<p class="opinion-empty">${t('opinion.empty')}</p>`;
      return;
    }
    listEl.innerHTML = opinions.map(op => renderOpinionItem(op, username)).join('');
    listEl.querySelectorAll('.opinion-like-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!username) return;
        const docId   = btn.dataset.id;
        const isLiked = btn.dataset.liked === 'true';
        if (btn.dataset.author === username) return;
        btn.disabled = true;
        try {
          await toggleOpinionLike(docId, username, isLiked);
          const opinions = await fetchOpinions();
          listEl.innerHTML = opinions.map(op => renderOpinionItem(op, username)).join('');
          listEl.querySelectorAll('.opinion-like-btn').forEach(b => {
            b.addEventListener('click', async () => {
              if (!username || b.dataset.author === username) return;
              b.disabled = true;
              try {
                await toggleOpinionLike(b.dataset.id, username, b.dataset.liked === 'true');
                await loadOpinions(listEl, username);
              } catch { b.disabled = false; }
            });
          });
        } catch { btn.disabled = false; }
      });
    });
  } catch {
    listEl.innerHTML = `<p class="opinion-empty">${t('opinion.load_fail')}</p>`;
  }
}

function renderOpinionItem(op, username) {
  const isLiked   = username && (op.likedBy ?? []).includes(username);
  const isOwn     = op.author === username;
  const timeStr   = op.createdAt?.toDate
    ? op.createdAt.toDate().toLocaleDateString()
    : '';
  return `
    <div class="opinion-item">
      <div class="opinion-meta">
        <span class="opinion-author">@${op.author}</span>
        <span class="opinion-time">${timeStr}</span>
      </div>
      <p class="opinion-text">${escapeHtml(op.text)}</p>
      <div class="opinion-actions">
        <button class="opinion-like-btn${isLiked ? ' liked' : ''}${isOwn ? ' own' : ''}"
          data-id="${op.id}" data-liked="${isLiked}" data-author="${op.author}"
          ${isOwn || !username ? 'disabled' : ''}>
          👍 ${op.likes ?? 0}
        </button>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
