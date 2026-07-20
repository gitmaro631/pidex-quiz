import { t } from './util-i18n.js';

export function setupPullToRefresh(container, onRefresh) {
  window._ptrRefreshFn = onRefresh;

  const scrollEl = document.querySelector('.page-container');
  if (!scrollEl) return;

  let indicator = scrollEl.querySelector('.ptr-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';
    indicator.innerHTML = `<span class="ptr-arrow">↓</span><span class="ptr-text">${t('ptr_pull')}</span>`;
    scrollEl.prepend(indicator);
  } else {
    indicator.style.height = '0';
    indicator.style.opacity = '0';
    indicator.innerHTML = `<span class="ptr-arrow">↓</span><span class="ptr-text">${t('ptr_pull')}</span>`;
  }

  if (scrollEl._ptrAttached) return;
  scrollEl._ptrAttached = true;

  let startY = 0;
  let pulling = false;
  const THRESHOLD = 70;

  scrollEl.addEventListener('touchstart', e => {
    if (scrollEl.scrollTop === 0) startY = e.touches[0].clientY;
  }, { passive: true });

  scrollEl.addEventListener('touchmove', e => {
    if (!startY) return;
    const dist = e.touches[0].clientY - startY;
    if (dist > 0 && scrollEl.scrollTop === 0) {
      pulling = true;
      const ind = document.querySelector('.ptr-indicator');
      if (!ind) return;
      const progress = Math.min(dist / THRESHOLD, 1);
      ind.style.height = `${Math.min(dist * 0.5, 50)}px`;
      ind.style.opacity = progress;
      const arrow = ind.querySelector('.ptr-arrow');
      if (arrow) arrow.style.transform = `rotate(${progress * 180}deg)`;
    }
  }, { passive: true });

  scrollEl.addEventListener('touchend', e => {
    if (!startY) return;
    const dist = e.changedTouches[0].clientY - startY;
    const ind  = document.querySelector('.ptr-indicator');
    if (pulling && dist >= THRESHOLD) {
      if (ind) { ind.innerHTML = '<span class="ptr-spinner"></span>'; ind.style.height = '44px'; }
      window._ptrRefreshFn?.();
    } else {
      if (ind) { ind.style.height = '0'; ind.style.opacity = '0'; }
    }
    startY = 0;
    pulling = false;
  }, { passive: true });
}
