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
  version: '2026-07-10',
  ko: "📢 업데이트 안내\n\n① 지갑 주소 클릭 메뉴(관심지갑 추가·파이덱스 등록·복사)가 작동하지 않던 문제를 수정했습니다\n② 내 지갑·관심 지갑 목록도 서버에 저장됩니다 (지갑 30개·관심지갑 10개)\n③ 관심 지갑에도 별칭 수정 버튼이 추가되었습니다\n④ '랭킹보드' 화면이 정리되었습니다\n⑤ 노드 운영 설문 질문이 일부 언어에서 번역되지 않던 문제를 수정했습니다",
  en: "📢 Update Notice\n\n① Fixed the wallet address menu (add to watchlist · register to PiDEX · copy) not working\n② My Wallet and Watchlist are now stored on the server (30 wallets · 10 watched)\n③ Added an edit-alias button to the Watchlist\n④ Cleaned up the 'Leaderboard' screen\n⑤ Fixed a survey question (node operation) that wasn't translated in some languages",
  zh: "📢 更新通知\n\n① 修复了钱包地址菜单（加入关注钱包·注册到PiDEX·复制）不起作用的问题\n② 我的钱包和关注钱包列表现已存储在服务器上（钱包30个·关注钱包10个）\n③ 关注钱包新增了修改别名按钮\n④ 整理了\"排行榜\"页面\n⑤ 修复了节点运营调查问题在部分语言中未翻译的问题",
  id: "📢 Pemberitahuan Pembaruan\n\n① Memperbaiki menu alamat dompet (tambah ke daftar pantau · daftar ke PiDEX · salin) yang tidak berfungsi\n② Dompet Saya dan Daftar Pantau kini disimpan di server (30 dompet · 10 pantauan)\n③ Ditambahkan tombol edit alias di Daftar Pantau\n④ Tampilan 'Papan Peringkat' dirapikan\n⑤ Memperbaiki pertanyaan survei (operasi node) yang tidak diterjemahkan di beberapa bahasa",
  ja: "📢 アップデートのお知らせ\n\n① ウォレットアドレスメニュー（ウォッチリストに追加・PiDEXに登録・コピー）が動作しなかった問題を修正しました\n② マイウォレットとウォッチリストがサーバーに保存されるようになりました（ウォレット30個・ウォッチ10個）\n③ ウォッチリストにエイリアス編集ボタンを追加しました\n④ 「ランキングボード」画面を整理しました\n⑤ 一部言語で翻訳されていなかったノード運営アンケートの質問を修正しました",
  es: "📢 Aviso de actualización\n\n① Se corrigió el menú de dirección de cartera (añadir a lista de seguimiento · registrar en PiDEX · copiar) que no funcionaba\n② Mi Cartera y la Lista de Seguimiento ahora se guardan en el servidor (30 carteras · 10 en seguimiento)\n③ Se añadió un botón para editar el alias en la Lista de Seguimiento\n④ Se ordenó la pantalla de 'Ranking'\n⑤ Se corrigió una pregunta de la encuesta (operación de nodo) que no estaba traducida en algunos idiomas",
  fr: "📢 Avis de mise à jour\n\n① Correction du menu d'adresse de portefeuille (ajouter à la liste de surveillance · enregistrer sur PiDEX · copier) qui ne fonctionnait pas\n② Mon Portefeuille et la Liste de surveillance sont désormais enregistrés sur le serveur (30 portefeuilles · 10 surveillés)\n③ Ajout d'un bouton pour modifier l'alias dans la Liste de surveillance\n④ Nettoyage de l'écran 'Classement'\n⑤ Correction d'une question du sondage (exploitation de nœud) qui n'était pas traduite dans certaines langues",
  vi: "📢 Thông báo cập nhật\n\n① Đã sửa lỗi menu địa chỉ ví (thêm vào danh sách theo dõi · đăng ký PiDEX · sao chép) không hoạt động\n② Ví của tôi và Danh sách theo dõi giờ được lưu trên server (30 ví · 10 theo dõi)\n③ Đã thêm nút chỉnh sửa biệt danh trong Danh sách theo dõi\n④ Đã dọn dẹp lại màn hình 'Bảng xếp hạng'\n⑤ Đã sửa câu hỏi khảo sát (vận hành node) chưa được dịch ở một số ngôn ngữ",
  pt: "📢 Aviso de atualização\n\n① Corrigido o menu de endereço da carteira (adicionar à lista de observação · registrar no PiDEX · copiar) que não funcionava\n② Minha Carteira e a Lista de Observação agora são salvas no servidor (30 carteiras · 10 observadas)\n③ Adicionado botão de editar apelido na Lista de Observação\n④ Tela de 'Ranking' foi organizada\n⑤ Corrigida uma pergunta da pesquisa (operação de nó) que não estava traduzida em alguns idiomas",
  ms: "📢 Notis Kemas Kini\n\n① Membaiki menu alamat dompet (tambah ke senarai pantauan · daftar ke PiDEX · salin) yang tidak berfungsi\n② Dompet Saya dan Senarai Pantauan kini disimpan di server (30 dompet · 10 pantauan)\n③ Ditambah butang edit alias pada Senarai Pantauan\n④ Skrin 'Papan Kedudukan' telah dikemas kini\n⑤ Membaiki soalan tinjauan (operasi node) yang tidak diterjemahkan dalam beberapa bahasa",
  tl: "📢 Abiso sa Update\n\n① Naayos ang menu ng wallet address (idagdag sa watchlist · irehistro sa PiDEX · kopyahin) na hindi gumagana\n② Ang My Wallet at Watchlist ay naka-save na rin sa server (30 wallet · 10 pinapanood)\n③ Idinagdag ang edit alias button sa Watchlist\n④ Na-ayos ang 'Leaderboard' screen\n⑤ Naayos ang tanong sa survey (pagpapatakbo ng node) na hindi naisalin sa ilang wika",
  hi: "📢 अपडेट सूचना\n\n① वॉलेट पता मेनू (वॉचलिस्ट में जोड़ें · PiDEX में पंजीकृत करें · कॉपी करें) काम न करने की समस्या ठीक की गई\n② माई वॉलेट और वॉचलिस्ट अब सर्वर पर सहेजे जाते हैं (30 वॉलेट · 10 वॉच)\n③ वॉचलिस्ट में उपनाम संपादित करने का बटन जोड़ा गया\n④ 'रैंकिंगबोर्ड' स्क्रीन को व्यवस्थित किया गया\n⑤ कुछ भाषाओं में अनुवाद न होने वाले सर्वेक्षण प्रश्न (नोड संचालन) को ठीक किया गया",
  ar: "📢 إشعار التحديث\n\n① تم إصلاح قائمة عنوان المحفظة (إضافة إلى قائمة المراقبة · تسجيل في PiDEX · نسخ) التي لم تكن تعمل\n② محفظتي وقائمة المراقبة أصبحتا محفوظتين على الخادم الآن (30 محفظة · 10 مراقبة)\n③ تمت إضافة زر تعديل الاسم المستعار في قائمة المراقبة\n④ تم تنظيم شاشة 'لوحة الترتيب'\n⑤ تم إصلاح سؤال الاستطلاع (تشغيل العقدة) الذي لم يكن مترجماً في بعض اللغات",
  ru: "📢 Уведомление об обновлении\n\n① Исправлено меню адреса кошелька (добавить в список наблюдения · зарегистрировать в PiDEX · скопировать), которое не работало\n② «Мой кошелёк» и список наблюдения теперь сохраняются на сервере (30 кошельков · 10 отслеживаемых)\n③ В список наблюдения добавлена кнопка редактирования псевдонима\n④ Экран «Рейтинг» приведён в порядок\n⑤ Исправлен вопрос опроса (об эксплуатации ноды), который не был переведён на некоторые языки",
  bn: "📢 আপডেট বিজ্ঞপ্তি\n\n① ওয়ালেট ঠিকানার মেনু (ওয়াচলিস্টে যোগ করুন · PiDEX-এ নিবন্ধন করুন · কপি করুন) কাজ না করার সমস্যা সমাধান করা হয়েছে\n② মাই ওয়ালেট এবং ওয়াচলিস্ট এখন সার্ভারে সংরক্ষিত হয় (৩০টি ওয়ালেট · ১০টি ওয়াচ)\n③ ওয়াচলিস্টে ডাকনাম সম্পাদনার বাটন যোগ করা হয়েছে\n④ 'র‍্যাংকিং বোর্ড' স্ক্রিন গুছিয়ে ফেলা হয়েছে\n⑤ কিছু ভাষায় অনুবাদ না হওয়া সমীক্ষা প্রশ্ন (নোড পরিচালনা) ঠিক করা হয়েছে",
  sw: "📢 Taarifa ya Sasisho\n\n① Imerekebisha menyu ya anwani ya pochi (ongeza kwenye orodha ya ufuatiliaji · sajili kwenye PiDEX · nakili) ambayo haikufanya kazi\n② Pochi Yangu na Orodha ya Ufuatiliaji sasa zinahifadhiwa kwenye seva (pochi 30 · ufuatiliaji 10)\n③ Kimeongezwa kitufe cha kuhariri jina la utani kwenye Orodha ya Ufuatiliaji\n④ Skrini ya 'Ubao wa Nafasi' imepangwa upya\n⑤ Imerekebisha swali la uchunguzi (uendeshaji wa nodi) ambalo halikutafsiriwa katika baadhi ya lugha",
  th: "📢 แจ้งอัปเดต\n\n① แก้ไขเมนูที่อยู่กระเป๋าเงิน (เพิ่มในรายการเฝ้าดู · ลงทะเบียนใน PiDEX · คัดลอก) ที่ไม่ทำงาน\n② กระเป๋าของฉันและรายการเฝ้าดูตอนนี้บันทึกไว้บนเซิร์ฟเวอร์แล้ว (กระเป๋า 30 · เฝ้าดู 10)\n③ เพิ่มปุ่มแก้ไขชื่อเล่นในรายการเฝ้าดู\n④ จัดหน้าจอ 'แรงกิ้งบอร์ด' ให้เรียบร้อยขึ้น\n⑤ แก้ไขคำถามแบบสำรวจ (การดำเนินการโหนด) ที่ไม่ได้แปลในบางภาษา",
  tr: "📢 Güncelleme Bildirimi\n\n① Çalışmayan cüzdan adresi menüsü (izleme listesine ekle · PiDEX'e kaydet · kopyala) düzeltildi\n② Cüzdanım ve İzleme Listesi artık sunucuda saklanıyor (30 cüzdan · 10 izleme)\n③ İzleme Listesi'ne takma ad düzenleme düğmesi eklendi\n④ 'Skor Tablosu' ekranı düzenlendi\n⑤ Bazı dillerde çevrilmemiş olan anket sorusunu (node işletimi) düzelttik",
};

const NOTICE_PREV = {
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
  const surveyEl   = document.getElementById('nav-label-survey');
  const moreEl     = document.getElementById('nav-label-more');
  const rankEl     = document.getElementById('more-label-rank');
  const statsEl    = document.getElementById('more-label-stats');
  const opinionEl  = document.getElementById('more-label-opinion');
  if (quizEl)     quizEl.textContent     = t('nav.quiz');
  if (survivalEl) survivalEl.textContent = t('nav.survival');
  if (trackerEl)  trackerEl.textContent  = t('nav.tracker');
  if (surveyEl)   surveyEl.textContent   = t('nav.survey');
  if (moreEl)     moreEl.textContent     = t('nav.more');
  if (rankEl)     rankEl.textContent     = t('nav.rank');
  if (statsEl)    statsEl.textContent    = t('nav.stats');
  if (opinionEl)  opinionEl.textContent  = t('nav.opinion');
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
