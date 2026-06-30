import { getScore, getRank, getStats } from './util-storage.js';

// ── 결과 카드 텍스트 생성 ─────────────────────────────
export function buildShareText(username) {
  const score = getScore();
  const rank  = getRank(score);
  const { correct, seen } = getStats();
  const pct = seen > 0 ? Math.round(correct / seen * 100) : 0;

  return `📊 PiDEX 퀴즈 결과
${rank.label} (${rank.labelEn})
총점: ${score}점 | 정답률: ${pct}%
Pioneer: ${username}
pidex-quiz.vercel.app`;
}

// ── 네이티브 공유 or 클립보드 복사 ───────────────────
export async function shareResult(username) {
  const text = buildShareText(username);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'PiDEX 퀴즈 결과', text });
      return 'shared';
    } catch (_) {}
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
