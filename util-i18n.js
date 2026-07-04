import ko from './locales/ko.js';
import en from './locales/en.js';
import id from './locales/id.js';
import vi from './locales/vi.js';
import zh from './locales/zh.js';
import ja from './locales/ja.js';
import tl from './locales/tl.js';
import hi from './locales/hi.js';
import bn from './locales/bn.js';
import th from './locales/th.js';
import ms from './locales/ms.js';
import es from './locales/es.js';
import pt from './locales/pt.js';
import fr from './locales/fr.js';
import ru from './locales/ru.js';
import tr from './locales/tr.js';
import ar from './locales/ar.js';
import sw from './locales/sw.js';

// ── 지원 언어 목록 ────────────────────────────────────
export const SUPPORTED_LANGS = [
  { code: 'ko', label: '한국어',     flag: '🇰🇷' },
  { code: 'en', label: 'English',    flag: '🌐' },
  { code: 'id', label: 'Indonesia',  flag: '🇮🇩' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ja', label: '日本語',      flag: '🇯🇵' },
  { code: 'tl', label: 'Filipino',   flag: '🇵🇭' },
  { code: 'hi', label: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা',       flag: '🇧🇩' },
  { code: 'th', label: 'ภาษาไทย',    flag: '🇹🇭' },
  { code: 'ms', label: 'Melayu',     flag: '🇲🇾' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { code: 'sw', label: 'Kiswahili',  flag: '🌍' },
];

const T = { ko, en, id, vi, zh, ja, tl, hi, bn, th, ms, es, pt, fr, ru, tr, ar, sw };

let currentLang = 'ko';

export function detectLang() {
  const saved = localStorage.getItem('quiz_lang');
  if (saved) return saved;
  const nav = navigator.language?.toLowerCase() ?? 'en';
  const primary = nav.split('-')[0];
  if (primary === 'fil') return 'tl';
  return SUPPORTED_LANGS.find(l => l.code === primary) ? primary : 'en';
}

export function getLang() { return currentLang; }

export function setLang(code) {
  currentLang = code;
  localStorage.setItem('quiz_lang', code);
  document.documentElement.lang = code;
  document.documentElement.dir = 'ltr';
}

export function initLang() {
  setLang(detectLang());
}

// ── 국가 감지 & 국기 ──────────────────────────────────
export function detectCountry() {
  const langs = navigator.languages?.length ? [...navigator.languages] : [navigator.language || ''];
  for (const locale of langs) {
    const parts = locale.split('-');
    if (parts.length >= 2) {
      const code = parts[parts.length - 1].toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) return code;
    }
  }
  return '';
}

export function countryToFlag(code) {
  if (!code || code.length !== 2) return '';
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

// 번역 조회 — 없으면 key 반환
export function t(key) {
  return T[currentLang]?.[key] ?? T.en?.[key] ?? T.ko?.[key] ?? key;
}

// 번역 조회 — 없으면 fallback(원문) 반환
export function tf(key, fallback) {
  if (T[currentLang]?.[key] !== undefined) return T[currentLang][key];
  if (currentLang === 'ko') return fallback;
  return T.en?.[key] ?? fallback;
}
