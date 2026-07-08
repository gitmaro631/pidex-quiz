import { t } from './util-i18n.js';
import { initFirebase, submitOpinion, fetchOpinions, toggleOpinionLike, updateOpinion, deleteOpinion, setOpinionAdminHidden } from './firebase.js';

const ADMIN_USERNAME = 'cam1998pi';
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

      <div class="opinion-list-header">
        <button id="opinion-refresh" class="opinion-refresh-btn" title="새로고침">🔄</button>
      </div>

      <div id="opinion-list" class="opinion-list">
        <div class="opinion-loading">${t('opinion.loading')}</div>
      </div>
    </div>
  `;

  const textarea    = container.querySelector('#opinion-input');
  const charCount   = container.querySelector('#opinion-charcount');
  const submitBtn   = container.querySelector('#opinion-submit');
  const listEl      = container.querySelector('#opinion-list');
  const refreshBtn  = container.querySelector('#opinion-refresh');

  refreshBtn?.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳';
    await loadOpinions(listEl, username);
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄';
  });

  textarea?.addEventListener('input', () => {
    charCount.textContent = `${textarea.value.length} / ${MAX_CHARS}`;
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
    bindOpinionEvents(listEl, username);
  } catch {
    listEl.innerHTML = `<p class="opinion-empty">${t('opinion.load_fail')}</p>`;
  }
}

function bindOpinionEvents(listEl, username) {
  // 공감
  listEl.querySelectorAll('.opinion-like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!username || btn.dataset.author === username) return;
      btn.disabled = true;
      try {
        await toggleOpinionLike(btn.dataset.id, username, btn.dataset.liked === 'true');
        await loadOpinions(listEl, username);
      } catch { btn.disabled = false; }
    });
  });

  // 수정
  listEl.querySelectorAll('.opinion-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.opinion-item');
      const textEl = item.querySelector('.opinion-text');
      const docId  = btn.dataset.id;
      const orig   = item.querySelector('.opinion-text').textContent;

      item.querySelector('.opinion-actions').classList.add('hidden');
      textEl.outerHTML = `
        <div class="opinion-edit-wrap">
          <textarea class="opinion-textarea opinion-edit-ta" maxlength="${MAX_CHARS}">${escapeHtml(orig)}</textarea>
          <div class="opinion-edit-btns">
            <button class="btn-outline btn-sm opinion-edit-cancel">${t('opinion.edit_cancel')}</button>
            <button class="btn-primary btn-sm opinion-edit-save" data-id="${docId}">${t('opinion.edit_save')}</button>
          </div>
        </div>`;

      item.querySelector('.opinion-edit-cancel').addEventListener('click', () => loadOpinions(listEl, username));
      item.querySelector('.opinion-edit-save').addEventListener('click', async (e) => {
        const saveBtn = e.currentTarget;
        const newText = item.querySelector('.opinion-edit-ta').value.trim();
        if (!newText) return;
        saveBtn.disabled = true;
        try {
          await updateOpinion(docId, newText);
          await loadOpinions(listEl, username);
        } catch {
          alert(t('opinion.edit_fail'));
          saveBtn.disabled = false;
        }
      });
    });
  });

  // 삭제
  listEl.querySelectorAll('.opinion-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('opinion.delete_confirm'))) return;
      btn.disabled = true;
      try {
        await deleteOpinion(btn.dataset.id);
        await loadOpinions(listEl, username);
      } catch {
        alert(t('opinion.delete_fail'));
        btn.disabled = false;
      }
    });
  });

  // 관리자 숨김/해제
  listEl.querySelectorAll('.opinion-admin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const hide = btn.dataset.hidden !== 'true';
      btn.disabled = true;
      try {
        await setOpinionAdminHidden(btn.dataset.id, hide);
        await loadOpinions(listEl, username);
      } catch {
        btn.disabled = false;
      }
    });
  });
}

function renderOpinionItem(op, username) {
  const isLiked   = username && (op.likedBy ?? []).includes(username);
  const isOwn     = op.author === username;
  const isAdmin   = username === ADMIN_USERNAME;
  const isHidden  = !!op.adminHidden;
  const timeStr   = op.createdAt?.toDate ? op.createdAt.toDate().toLocaleDateString() : '';

  const bodyHtml = isHidden
    ? `<p class="opinion-text opinion-hidden-msg">${t('opinion.admin_hidden')}</p>`
    : `<p class="opinion-text">${escapeHtml(op.text)}</p>`;

  return `
    <div class="opinion-item${isHidden ? ' opinion-item-hidden' : ''}">
      <div class="opinion-meta">
        <span class="opinion-author">@${op.author}</span>
        <span class="opinion-time">${timeStr}</span>
      </div>
      ${bodyHtml}
      <div class="opinion-actions">
        <button class="opinion-like-btn${isLiked ? ' liked' : ''}"
          data-id="${op.id}" data-liked="${isLiked}" data-author="${op.author}"
          ${isOwn || !username || isHidden ? 'disabled' : ''}>
          👍 ${op.likes ?? 0}
        </button>
        ${isOwn && !isHidden ? `
          <button class="opinion-edit-btn" data-id="${op.id}">✏️</button>
          <button class="opinion-del-btn" data-id="${op.id}">🗑️</button>
        ` : ''}
        ${isAdmin ? `
          <button class="opinion-admin-btn" data-id="${op.id}" data-hidden="${isHidden}">
            ${isHidden ? '👁️' : '🚫'}
          </button>
        ` : ''}
      </div>
    </div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
