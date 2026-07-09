import { initPiSDK, authenticate } from './pi-sdk.js';
import { detectCountry } from './util-i18n.js';
import { renderQuizPage }   from './page-quiz.js';
import { renderRankPage }   from './page-rank.js';
import { renderStatsPage }  from './page-stats.js';
import { renderSurveyPage } from './page-survey.js';
import { getScore, getLives, isSubscribed } from './util-storage.js';
import { initLang, t, getLang, setLang, SUPPORTED_LANGS } from './util-i18n.js';
import { renderHelpModal }    from './page-help.js';
import { renderOpinionPage }  from './page-opinion.js';
import { initFirebase, loadSurveyFromFirestore, updateLeaderboardCountry } from './firebase.js';
import { mergeSurveyFromCloud } from './util-storage.js';
const NOTICE = {
  version: '2026-07-09-merge',
  ko: "📢 새 탭이 추가되었습니다!\n\n🌿 생존 — 극한 환경에서 살아남는 텍스트 어드벤처\n🔍 트래커 — Pi 해킹 신고·지갑 조회·관심 지갑 추적\n\n하단 탭에서 바로 이용하세요!",
  en: "📢 New tabs added!\n\n🌿 Survival — Text adventure: survive in extreme environments\n🔍 Tracker — Pi hack reports, wallet lookup & watch list\n\nFind them in the bottom navigation!",
  zh: "📢 新增标签页！\n\n🌿 生存 — 极端环境下的文字冒险\n🔍 追踪 — Pi 黑客举报·钱包查询·关注列表\n\n在底部导航栏中即可使用！",
  id: "📢 Tab baru ditambahkan!\n\n🌿 Survival — Petualangan teks di lingkungan ekstrem\n🔍 Tracker — Laporan hack Pi, pencarian dompet & daftar pantau\n\nTemukan di navigasi bawah!",
  ja: "📢 新しいタブが追加されました！\n\n🌿 サバイバル — 極限環境でのテキストアドベンチャー\n🔍 トラッカー — Piハッキング報告・ウォレット照会・注目リスト\n\n下部のナビゲーションからご利用ください！",
  es: "📢 ¡Nuevas pestañas añadidas!\n\n🌿 Supervivencia — Aventura de texto en entornos extremos\n🔍 Rastreador — Denuncias de hackeos Pi, búsqueda de billetera y lista de seguimiento\n\n¡Encuéntralas en la barra de navegación inferior!",
  fr: "📢 Nouveaux onglets ajoutés !\n\n🌿 Survie — Aventure textuelle en environnements extrêmes\n🔍 Traqueur — Signalements de piratage Pi, recherche de portefeuille & liste de suivi\n\nTrouvez-les dans la barre de navigation inférieure !",
  vi: "📢 Đã thêm tab mới!\n\n🌿 Sinh tồn — Phiêu lưu văn bản trong môi trường khắc nghiệt\n🔍 Theo dõi — Báo cáo hack Pi, tra cứu ví & danh sách theo dõi\n\nTìm thấy chúng trong thanh điều hướng phía dưới!",
  pt: "📢 Novas abas adicionadas!\n\n🌿 Sobrevivência — Aventura em texto em ambientes extremos\n🔍 Rastreador — Denúncias de hack Pi, busca de carteira e lista de observação\n\nEncontre-as na barra de navegação inferior!",
  ms: "📢 Tab baharu ditambah!\n\n🌿 Survival — Pengembaraan teks dalam persekitaran ekstrem\n🔍 Penjejak — Laporan penggodaman Pi, carian dompet & senarai pantau\n\nJumpai mereka di navigasi bawah!",
  tl: "📢 Mga bagong tab na idinagdag!\n\n🌿 Survival — Text adventure sa matinding kapaligiran\n🔍 Tracker — Mga ulat ng Pi hack, paghahanap ng wallet at watch list\n\nHanapin sa ibabang navigation!",
  hi: "📢 नए टैब जोड़े गए!\n\n🌿 सर्वाइवल — चरम परिस्थितियों में जीवित रहने का टेक्स्ट एडवेंचर\n🔍 ट्रैकर — Pi हैक रिपोर्ट, वॉलेट खोज और वॉच लिस्ट\n\nनीचे नेविगेशन में पाएं!",
  ar: "📢 تمت إضافة تبويبات جديدة!\n\n🌿 البقاء — مغامرة نصية في بيئات قاسية\n🔍 المتتبع — تقارير اختراق Pi والبحث عن المحفظة وقائمة المراقبة\n\nاعثر عليها في شريط التنقل السفلي!",
  ru: "📢 Добавлены новые вкладки!\n\n🌿 Выживание — Текстовое приключение в экстремальных условиях\n🔍 Трекер — Отчёты о взломах Pi, поиск кошелька и список наблюдения\n\nНайдите их в нижней панели навигации!",
  bn: "📢 নতুন ট্যাব যোগ হয়েছে!\n\n🌿 সার্ভাইভাল — চরম পরিবেশে বেঁচে থাকার টেক্সট অ্যাডভেঞ্চার\n🔍 ট্র্যাকার — Pi হ্যাক রিপোর্ট, ওয়ালেট অনুসন্ধান ও ওয়াচ লিস্ট\n\nনিচের নেভিগেশনে খুঁজুন!",
  sw: "📢 Vichupo vipya vimeongezwa!\n\n🌿 Maisha — Mchezo wa maandishi katika mazingira magumu\n🔍 Mfuatiliaji — Ripoti za udanganyifu wa Pi, utafutaji wa pochi na orodha ya ufuatiliaji\n\nVipata kwenye urambazaji wa chini!",
  th: "📢 เพิ่มแท็บใหม่แล้ว!\n\n🌿 เอาชีวิตรอด — ผจญภัยแบบข้อความในสภาพแวดล้อมสุดโหด\n🔍 ติดตาม — รายงานการแฮ็ก Pi, ค้นหากระเป๋าเงิน & รายการเฝ้าดู\n\nค้นหาได้ที่แถบนำทางด้านล่าง!",
  tr: "📢 Yeni sekmeler eklendi!\n\n🌿 Hayatta Kal — Aşırı ortamlarda metin macerası\n🔍 İzleyici — Pi hack raporları, cüzdan sorgulama & izleme listesi\n\nAlt gezinti çubuğunda bulabilirsiniz!",
};

const NOTICE_PREV = {
  version: '2026-07-09',
  ko: "📢 업데이트 안내\n\n💬 의견 탭이 추가되었습니다!\n\n앱에 대한 건의·칭찬·불만 등 자유롭게 남겨주세요.\n다른 유저의 의견에 👍 공감도 할 수 있습니다.",
  en: "📢 Update Notice\n\n💬 Opinion tab is now available!\n\nShare your thoughts — suggestions, praise, or feedback.\nYou can also 👍 like other users' opinions.",
  zh: "📢 更新通知\n\n💬 新增意见标签页！\n\n欢迎分享您的建议、称赞或意见。\n也可以为其他用户的意见点 👍 赞。",
  id: "📢 Pemberitahuan Pembaruan\n\n💬 Tab Opini kini tersedia!\n\nBagikan saran, pujian, atau masukan Anda.\nAnda juga bisa 👍 menyukai opini pengguna lain.",
  ja: "📢 アップデートのお知らせ\n\n💬 意見タブが追加されました！\n\nアプリへのご意見・ご要望・感想をお気軽にどうぞ。\n他のユーザーの意見に 👍 共感もできます。",
  es: "📢 Aviso de actualización\n\n💬 ¡Nueva pestaña de Opiniones!\n\nComparte sugerencias, elogios o comentarios libremente.\nTambién puedes dar 👍 a las opiniones de otros.",
  fr: "📢 Avis de mise à jour\n\n💬 L'onglet Opinions est disponible !\n\nPartagez vos suggestions, compliments ou retours librement.\nVous pouvez aussi 👍 aimer les opinions des autres.",
  vi: "📢 Thông báo cập nhật\n\n💬 Tab Ý kiến đã được thêm vào!\n\nHãy chia sẻ góp ý, lời khen hoặc phản hồi tự do.\nBạn cũng có thể 👍 đồng cảm với ý kiến của người khác.",
  pt: "📢 Aviso de atualização\n\n💬 Aba de Opiniões disponível!\n\nCompartilhe sugestões, elogios ou feedbacks livremente.\nVocê também pode 👍 curtir as opiniões de outros.",
  ms: "📢 Notis Kemas Kini\n\n💬 Tab Pendapat kini tersedia!\n\nKongsi cadangan, pujian atau maklum balas anda.\nAnda juga boleh 👍 sokong pendapat pengguna lain.",
  tl: "📢 Abiso sa Update\n\n💬 May bagong Opinion tab na!\n\nIbahagi ang iyong mungkahi, papuri, o feedback.\nMaaari ka ring 👍 mag-like sa mga opinyon ng iba.",
  hi: "📢 अपडेट सूचना\n\n💬 ओपिनियन टैब जोड़ा गया!\n\nअपने सुझाव, प्रशंसा या प्रतिक्रिया स्वतंत्र रूप से साझा करें।\nआप दूसरों की राय को 👍 पसंद भी कर सकते हैं।",
  ar: "📢 إشعار التحديث\n\n💬 تمت إضافة تبويب الآراء!\n\nشارك اقتراحاتك أو إطراءك أو ملاحظاتك بحرية.\nيمكنك أيضاً 👍 الإعجاب بآراء الآخرين.",
  ru: "📢 Уведомление об обновлении\n\n💬 Добавлена вкладка «Мнения»!\n\nСвободно делитесь предложениями, похвалой или отзывами.\nВы также можете 👍 поддержать мнения других пользователей.",
  bn: "📢 আপডেট বিজ্ঞপ্তি\n\n💬 মতামত ট্যাব যোগ হয়েছে!\n\nআপনার পরামর্শ, প্রশংসা বা মতামত স্বাধীনভাবে শেয়ার করুন।\nঅন্যদের মতামতে 👍 সমর্থনও করতে পারবেন।",
  sw: "📢 Taarifa ya Sasisho\n\n💬 Kichupo cha Maoni kimeongezwa!\n\nShiriki mapendekezo, sifa au maoni yako kwa uhuru.\nUnaweza pia 👍 kupendeza maoni ya watumiaji wengine.",
  th: "📢 แจ้งอัปเดต\n\n💬 เพิ่มแท็บความคิดเห็นแล้ว!\n\nแสดงความคิดเห็น ข้อเสนอแนะ หรือคำชมได้อย่างอิสระ\nคุณยังสามารถ 👍 กดถูกใจความคิดเห็นของผู้อื่นได้",
  tr: "📢 Güncelleme Bildirimi\n\n💬 Görüş sekmesi eklendi!\n\nÖneri, övgü veya geri bildirimlerinizi özgürce paylaşın.\nDiğer kullanıcıların görüşlerini 👍 beğenebilirsiniz.",
};

// ── 공지 팝업 ────────────────────────────────────────
const _NOTICE_COL = 'notices_pidex_quiz';

async function showNoticeIfNeeded() {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  let notices = [];
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      const db = firebase.firestore();
      for (const n of [NOTICE_PREV, NOTICE]) {
        if (!n) continue;
        const ref  = db.collection(_NOTICE_COL).doc(n.version);
        const snap = await ref.get();
        if (!snap.exists) await ref.set({ ...n, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      const q = await db.collection(_NOTICE_COL).orderBy('createdAt', 'asc').get();
      notices = q.docs.map(d => d.data());
    }
  } catch {}
  if (!notices.length) notices = [NOTICE_PREV, NOTICE].filter(Boolean);
  if (!notices.length) return;
  const latest = notices[notices.length - 1];
  const skipUntil   = parseInt(localStorage.getItem(SKIP_KEY) || '0', 10);
  const skipVersion = localStorage.getItem(VERSION_KEY) || '';
  if (skipVersion === latest.version && Date.now() < skipUntil) return;
  _showNoticePopup(notices, notices.length - 1);
}

function _showNoticePopup(notices, idx) {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const latest  = notices[notices.length - 1];
  const notice  = notices[idx];
  const lang    = getLang();
  const text    = notice[lang] || notice.en;
  const total   = notices.length;
  document.getElementById('notice-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'notice-overlay';
  overlay.className = 'notice-overlay';
  overlay.innerHTML = `
    <div class="notice-box">
      <div class="notice-body">${text.replace(/\n/g, '<br>')}</div>
      ${total > 1 ? `
      <div class="notice-nav">
        <button class="notice-nav-btn" id="notice-prev"${idx === 0 ? ' disabled' : ''}>←</button>
        <span class="notice-nav-page">${idx + 1} / ${total}</span>
        <button class="notice-nav-btn" id="notice-next"${idx === total - 1 ? ' disabled' : ''}>→</button>
      </div>` : ''}
      <label class="notice-skip-label">
        <input type="checkbox" id="notice-skip-check">
        <span>${t('notice_skip_week')}</span>
      </label>
      <button class="notice-close-btn" id="notice-close-btn">${t('notice_confirm')}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#notice-prev')?.addEventListener('click', () => { overlay.remove(); _showNoticePopup(notices, idx - 1); });
  overlay.querySelector('#notice-next')?.addEventListener('click', () => { overlay.remove(); _showNoticePopup(notices, idx + 1); });
  overlay.querySelector('#notice-close-btn').addEventListener('click', () => {
    if (overlay.querySelector('#notice-skip-check').checked) {
      localStorage.setItem(SKIP_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      localStorage.setItem(VERSION_KEY, latest.version);
    }
    overlay.remove();
  });
}

// ── 현재 로그인한 Pi UID / Username ─────────────────────────
let currentUid = null;
export let currentUsername = '';
export function getCurrentUid() { return currentUid; }
export function getCurrentUsername() { return currentUsername; }

// ── 페이지 라우팅 ──────────────────────────────────────────
let activePage = 'quiz';
const renderedPages = new Set();
const MORE_PAGES = new Set(['rank', 'stats', 'survey']);

const PAGE_RENDERERS = {
  quiz:     (el) => renderQuizPage(el),
  survival: async (el) => {
    const { renderSurvivalPage } = await import('./page-survival.js');
    renderSurvivalPage(el, currentUsername);
  },
  tracker: async (el) => {
    const { renderTrackerPage } = await import('./page-tracker.js');
    renderTrackerPage(el, currentUsername, currentUid);
  },
  survey:   (el) => renderSurveyPage(el),
  rank:     (el) => renderRankPage(el),
  stats:    (el) => renderStatsPage(el),
  opinion:  (el) => renderOpinionPage(el),
};

function switchPage(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const pageEl = document.getElementById(`page-${pageKey}`);
  if (pageEl) pageEl.classList.remove('hidden');

  // 네비 하이라이트: rank/stats/survey는 더보기 버튼 표시
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (MORE_PAGES.has(pageKey)) {
    document.getElementById('btn-more-tab')?.classList.add('active');
  } else {
    document.querySelector(`.nav-tab[data-page="${pageKey}"]`)?.classList.add('active');
  }

  activePage = pageKey;

  // quiz 탭일 때만 lives/score 표시
  const statusEl = document.getElementById('header-status');
  if (statusEl) statusEl.style.display = pageKey === 'quiz' ? '' : 'none';

  if (pageKey === 'opinion') renderedPages.delete('opinion');
  if (!renderedPages.has(pageKey)) {
    renderedPages.add(pageKey);
    PAGE_RENDERERS[pageKey]?.(pageEl);
  }
}

export function rerenderPage(pageKey) {
  renderedPages.delete(pageKey);
  switchPage(pageKey);
}

// ── 헤더 업데이트 ─────────────────────────────────────────
let _headerUsername = 'Pioneer';
export function updateHeaderUsername(name) {
  if (name) _headerUsername = name;
  const el = document.getElementById('header-username');
  if (el) el.textContent = isSubscribed() ? `⭐ ${_headerUsername}` : _headerUsername;
}

export function updateHeaderScore() {
  const el = document.getElementById('header-score');
  if (el) el.textContent = `${getScore()}${t('quiz.score_unit')}`;
}

export function updateHeaderLives() {
  const el = document.getElementById('header-lives');
  if (!el) return;
  const n = getLives();
  if (n === null) {
    el.textContent = '🔱';
  } else {
    el.textContent = '❤️'.repeat(Math.max(0, n)) || '💀';
  }
}

function applyNavLabels() {
  const quizEl     = document.getElementById('nav-label-quiz');
  const survivalEl = document.getElementById('nav-label-survival');
  const trackerEl  = document.getElementById('nav-label-tracker');
  const opinionEl  = document.getElementById('nav-label-opinion');
  const moreEl     = document.getElementById('nav-label-more');
  const rankEl     = document.getElementById('more-label-rank');
  const statsEl    = document.getElementById('more-label-stats');
  const surveyEl   = document.getElementById('more-label-survey');
  if (quizEl)     quizEl.textContent     = t('nav.quiz');
  if (survivalEl) survivalEl.textContent = t('nav.survival');
  if (trackerEl)  trackerEl.textContent  = t('nav.tracker');
  if (opinionEl)  opinionEl.textContent  = t('nav.opinion');
  if (moreEl)     moreEl.textContent     = t('nav.more');
  if (rankEl)     rankEl.textContent     = t('nav.rank');
  if (statsEl)    statsEl.textContent    = t('nav.stats');
  if (surveyEl)   surveyEl.textContent   = t('nav.survey');
  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.textContent = `❓ ${t('btn.help')}`;
}

// ── 로그인 ────────────────────────────────────────────────
async function doLogin() {
  const btn   = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.textContent = t('login.connecting');
  if (errEl) errEl.style.display = 'none';
  try {
    const auth = await authenticate();
    const user = auth.user;
    currentUid      = user?.uid ?? user?.username ?? null;
    currentUsername = user?.username ?? 'Pioneer';

    updateHeaderUsername(currentUsername);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    if (currentUid) {
      initFirebase();
      const cloudData = await loadSurveyFromFirestore(currentUid);
      if (cloudData) {
        mergeSurveyFromCloud(cloudData.answers, cloudData.completedIds);
      }
      const country = detectCountry();
      if (country && currentUsername) {
        updateLeaderboardCountry(currentUsername, country).catch(console.warn);
      }
    }

    updateHeaderScore();
    updateHeaderLives();
    applyNavLabels();
    switchPage('quiz');
    showNoticeIfNeeded();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = t('login.btn');
    if (errEl) { errEl.textContent = t('login.fail'); errEl.style.display = 'block'; }
    console.error(e);
  }
}

// ── 언어 선택 ─────────────────────────────────────────────
function buildLangPicker() {
  const btn      = document.getElementById('btn-lang');
  const dropdown = document.getElementById('lang-dropdown');
  if (!btn || !dropdown) return;

  function updateBtn() {
    const cur = SUPPORTED_LANGS.find(l => l.code === getLang()) ?? SUPPORTED_LANGS[0];
    btn.innerHTML = `<span>${cur.flag}</span><span>${cur.label}</span><span class="lang-arrow">▾</span>`;
  }
  updateBtn();

  dropdown.innerHTML = SUPPORTED_LANGS.map(l => `
    <button class="lang-option ${l.code === getLang() ? 'active' : ''}" data-lang="${l.code}">
      ${l.flag} ${l.label}
    </button>
  `).join('');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));

  dropdown.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setLang(opt.dataset.lang);
      dropdown.classList.remove('open');
      dropdown.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      updateBtn();
      applyNavLabels();
      // survival/tracker는 언어 변경 시 다시 렌더
      if (activePage === 'survival' || activePage === 'tracker') {
        renderedPages.delete(activePage);
        switchPage(activePage);
      } else {
        rerenderPage(activePage);
      }
    });
  });
}

// ── 더보기 시트 ────────────────────────────────────────────
function openMoreSheet() {
  const sheet = document.getElementById('more-sheet');
  if (sheet) sheet.classList.remove('hidden');
}

function closeMoreSheet() {
  const sheet = document.getElementById('more-sheet');
  if (sheet) sheet.classList.add('hidden');
}

// ── 유틸모음 오버레이 ────────────────────────────────────────
function renderUtilsOverlay() {
  const panel = document.getElementById('utils-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="utils-header">
      <span class="utils-title">🚀 Pi Hub</span>
      <button class="utils-close-btn" id="utils-close-btn">${t('btn.close')} ✕</button>
    </div>
    <div class="utils-body">

    <a class="util-card" href="#" onclick="window.open('https://apppidexutillaac6961.pinet.com/', '_hub_'+Date.now());return false;">
      <div class="util-card-icon">
        <img src="icons/pidex-util.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="PiDEX Util">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">PiDEX Util</div>
        <div class="util-card-tags">
          <span class="util-tag">Arbitrage Finder</span>
          <span class="util-tag">LP Calculator</span>
          <span class="util-tag">Swap Simulator</span>
        </div>
        <div class="util-card-desc">${t('hub.pidex.desc')}</div>
        <div class="util-card-link">${t('hub.open')}</div>
      </div>
    </a>
    </div>
  `;

  panel.querySelector('#utils-close-btn').addEventListener('click', () => {
    document.getElementById('utils-overlay').classList.add('hidden');
  });
}

// ── 초기화 ────────────────────────────────────────────────
function initLoginScreen() {
  const titleEl = document.getElementById('login-title');
  const subEl   = document.getElementById('login-sub');
  const btn     = document.getElementById('btn-login');
  const note    = document.getElementById('login-note');
  if (titleEl) titleEl.textContent = t('app.title');
  if (subEl)   subEl.textContent   = t('login.sub');
  if (btn)     btn.textContent     = t('login.btn');
  if (note)    note.textContent    = t('login.note');
}

async function init() {
  initLang();
  initLoginScreen();
  try { await initPiSDK(); } catch (e) { console.warn('Pi SDK init:', e); }

  // 네비 탭 (quiz/survival/tracker/opinion)
  document.querySelectorAll('.nav-tab[data-page]').forEach(btn => {
    btn.addEventListener('click', () => rerenderPage(btn.dataset.page));
  });

  // 더보기 버튼
  document.getElementById('btn-more-tab')?.addEventListener('click', openMoreSheet);

  // 더보기 시트 배경 클릭 닫기
  document.getElementById('more-sheet-bg')?.addEventListener('click', closeMoreSheet);

  // 더보기 시트 아이템 (rank/stats/survey)
  document.querySelectorAll('.more-sheet-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeMoreSheet();
      rerenderPage(btn.dataset.page);
    });
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);

  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.addEventListener('click', () => renderHelpModal());

  const utilsOverlayBtn = document.getElementById('btn-intro-overlay');
  if (utilsOverlayBtn) utilsOverlayBtn.addEventListener('click', () => {
    const overlay = document.getElementById('utils-overlay');
    overlay.classList.toggle('hidden');
    if (!overlay.classList.contains('hidden')) renderUtilsOverlay();
  });

  document.getElementById('utils-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('utils-overlay')) {
      document.getElementById('utils-overlay').classList.add('hidden');
    }
  });

  buildLangPicker();

  window.addEventListener('sub:synced', () => updateHeaderUsername());
}

init();
