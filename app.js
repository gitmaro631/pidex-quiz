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
  version: '2026-07-15-2',
  ko: "📢 업데이트 안내 (2026-07-15)\n\n① 생존 탭 전면 개편 — 첫 게임 '던전 탐험가' 오픈 (플레이마다 다른 전개)\n② 생명이 위험해지면 파이 코어팀이 깜짝 등장해 퀴즈로 회복 기회를 줍니다\n③ 더 많은 생존 게임이 순차적으로 추가될 예정입니다",
  en: "📢 Update Notice (2026-07-15)\n\n① Survival tab fully revamped — first game 'Dungeon Explorer' is open (plays out differently every time)\n② When your health gets critical, a Pi Core Team member makes a surprise appearance with a quiz for a recovery chance\n③ More survival games will be added over time",
  zh: "📢 更新通知 (2026-07-15)\n\n① 生存标签页全面改版 — 首个游戏「地下城探险家」开放（每次游玩展开都不同）\n② 生命值危急时，Pi核心团队成员会惊喜登场出题，给你恢复的机会\n③ 后续将陆续新增更多生存游戏",
  id: "📢 Pemberitahuan Pembaruan (2026-07-15)\n\n① Tab Survival dirombak total — game pertama 'Penjelajah Dungeon' sudah dibuka (berjalan berbeda setiap kali dimainkan)\n② Saat nyawa kritis, anggota Pi Core Team akan muncul mengejutkan dengan kuis untuk kesempatan pulih\n③ Lebih banyak game survival akan ditambahkan secara bertahap",
  ja: "📢 アップデートのお知らせ (2026-07-15)\n\n① サバイバルタブを全面刷新 — 第一弾「ダンジョン探検家」が公開（プレイのたびに展開が変わります）\n② 生命が危険になるとPiコアチームのメンバーがサプライズ登場してクイズで回復のチャンスをくれます\n③ 今後さらにサバイバルゲームが追加される予定です",
  es: "📢 Aviso de actualización (2026-07-15)\n\n① La pestaña de Supervivencia ha sido renovada por completo — el primer juego 'Explorador de Mazmorras' ya está disponible (se desarrolla de forma diferente cada vez)\n② Cuando tu vida está en peligro, un miembro del Pi Core Team aparece por sorpresa con una pregunta para darte una oportunidad de recuperación\n③ Se añadirán más juegos de supervivencia progresivamente",
  fr: "📢 Avis de mise à jour (2026-07-15)\n\n① L'onglet Survie a été entièrement repensé — le premier jeu « Explorateur de Donjon » est ouvert (se déroule différemment à chaque partie)\n② Lorsque votre vie est en danger, un membre du Pi Core Team apparaît par surprise avec un quiz pour une chance de récupération\n③ D'autres jeux de survie seront ajoutés progressivement",
  vi: "📢 Thông báo cập nhật (2026-07-15)\n\n① Tab Sinh tồn được đại tu toàn diện — trò chơi đầu tiên 'Nhà Thám Hiểm Dungeon' đã mở (diễn ra khác nhau mỗi lần chơi)\n② Khi sinh mệnh nguy cấp, một thành viên Pi Core Team sẽ bất ngờ xuất hiện với câu đố để cho cơ hội hồi phục\n③ Sẽ có thêm nhiều trò chơi sinh tồn được bổ sung dần",
  pt: "📢 Aviso de atualização (2026-07-15)\n\n① A aba de Sobrevivência foi totalmente renovada — o primeiro jogo 'Explorador de Masmorra' já está disponível (se desenrola de forma diferente a cada partida)\n② Quando sua vida fica crítica, um membro do Pi Core Team aparece de surpresa com um quiz para uma chance de recuperação\n③ Mais jogos de sobrevivência serão adicionados aos poucos",
  ms: "📢 Notis Kemas Kini (2026-07-15)\n\n① Tab Survival dirombak sepenuhnya — permainan pertama 'Peneroka Dungeon' kini dibuka (berlaku berbeza setiap kali dimainkan)\n② Apabila nyawa kritikal, ahli Pi Core Team akan muncul secara mengejutkan dengan kuiz untuk peluang pemulihan\n③ Lebih banyak permainan survival akan ditambah secara berperingkat",
  tl: "📢 Abiso sa Update (2026-07-15)\n\n① Ganap na na-revamp ang Survival tab — bukas na ang unang laro na 'Manlalakbay ng Dungeon' (iba-iba tuwing laruin)\n② Kapag kritikal na ang buhay, biglang lalabas ang isang miyembro ng Pi Core Team na may quiz para sa pagkakataong gumaling\n③ Magdaragdag pa ng mas maraming survival games sa hinaharap",
  hi: "📢 अपडेट सूचना (2026-07-15)\n\n① सर्वाइवल टैब का पूरी तरह से नवीनीकरण — पहला गेम 'डंजियन एक्सप्लोरर' खुल गया है (हर बार अलग तरीके से आगे बढ़ता है)\n② जब जीवन गंभीर स्थिति में पहुंचता है, तो Pi Core Team का एक सदस्य अचानक प्रकट होकर रिकवरी के मौके के लिए क्विज़ देता है\n③ समय के साथ और सर्वाइवल गेम जोड़े जाएंगे",
  ar: "📢 إشعار التحديث (2026-07-15)\n\n① تم تجديد تبويب البقاء بالكامل — تم فتح أول لعبة \"مستكشف الزنزانة\" (تختلف في كل مرة تلعب فيها)\n② عندما تصبح الحياة في خطر، يظهر أحد أعضاء فريق Pi Core Team بشكل مفاجئ مع سؤال لمنحك فرصة للتعافي\n③ سيتم إضافة المزيد من ألعاب البقاء تدريجيًا",
  ru: "📢 Уведомление об обновлении (2026-07-15)\n\n① Вкладка «Выживание» полностью обновлена — открыта первая игра «Исследователь Подземелья» (проходит по-разному каждый раз)\n② Когда жизнь становится критической, неожиданно появляется участник Pi Core Team с вопросом-викториной ради шанса на восстановление\n③ Со временем будут добавлены новые игры на выживание",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-15)\n\n① সার্ভাইভাল ট্যাব সম্পূর্ণ নতুন করে সাজানো হয়েছে — প্রথম গেম 'ডানজিয়ন এক্সপ্লোরার' চালু হয়েছে (প্রতিবার ভিন্নভাবে এগিয়ে যায়)\n② জীবন সংকটাপন্ন হলে Pi Core Team-এর একজন সদস্য হঠাৎ এসে কুইজ দিয়ে সেরে ওঠার সুযোগ দেয়\n③ ধীরে ধীরে আরও সার্ভাইভাল গেম যোগ করা হবে",
  sw: "📢 Taarifa ya Sasisho (2026-07-15)\n\n① Kichupo cha Survival kimebadilishwa kabisa — mchezo wa kwanza 'Mgunduzi wa Dungeon' umefunguliwa (unaenda tofauti kila unapochezwa)\n② Uhai unapokuwa hatarini, mwanachama wa Pi Core Team anatokea kwa mshangao na swali kwa ajili ya nafasi ya kupona\n③ Michezo zaidi ya survival itaongezwa hatua kwa hatua",
  th: "📢 แจ้งอัปเดต (2026-07-15)\n\n① แท็บเอาชีวิตรอดปรับโฉมใหม่ทั้งหมด — เกมแรก 'นักผจญภัยดันเจี้ยน' เปิดให้เล่นแล้ว (ดำเนินเรื่องต่างกันทุกครั้งที่เล่น)\n② เมื่อชีวิตอยู่ในขั้นวิกฤต สมาชิก Pi Core Team จะปรากฏตัวอย่างไม่คาดคิดพร้อมคำถามเพื่อโอกาสฟื้นตัว\n③ จะมีเกมเอาชีวิตรอดเพิ่มเติมทยอยตามมา",
  tr: "📢 Güncelleme Bildirimi (2026-07-15)\n\n① Hayatta Kalma sekmesi tamamen yenilendi — ilk oyun 'Zindan Kaşifi' açıldı (her oynayışta farklı gelişiyor)\n② Can kritik seviyeye düştüğünde bir Pi Core Team üyesi sürpriz şekilde belirip iyileşme şansı için bir soru soruyor\n③ Zamanla daha fazla hayatta kalma oyunu eklenecek",
};

const NOTICE_PREV = {
  version: '2026-07-15',
  ko: "📢 업데이트 안내 (2026-07-15)\n\n① 내 지갑 탭에 '장부' 기능 추가 — 월별/연별 입출금 내역 자동 정리\n② 상대 지갑 다중 선택 가능 — 여러 지갑과의 거래를 합계/개별로 비교\n③ 일봉 종가 기준 참고 환산가 표시",
  en: "📢 Update Notice (2026-07-15)\n\n① Added a 'Ledger' feature to My Wallet — automatically organizes monthly/yearly in/out history\n② You can now select multiple counterparty wallets — compare transactions combined or individually\n③ Shows a reference value converted using daily closing prices",
  zh: "📢 更新通知 (2026-07-15)\n\n① 我的钱包新增“账本”功能 — 自动整理月度/年度收支记录\n② 现可多选对方钱包 — 按合计或个别比较交易\n③ 显示基于日K线收盘价的参考换算金额",
  id: "📢 Pemberitahuan Pembaruan (2026-07-15)\n\n① Menambahkan fitur 'Buku Besar' di Dompet Saya — mengatur riwayat masuk/keluar bulanan/tahunan secara otomatis\n② Kini bisa memilih beberapa dompet rekanan sekaligus — bandingkan transaksi secara gabungan atau individual\n③ Menampilkan nilai referensi berdasarkan harga penutupan harian",
  ja: "📢 アップデートのお知らせ (2026-07-15)\n\n① マイウォレットに「台帳」機能を追加 — 月別・年別の入出金履歴を自動整理\n② 相手ウォレットを複数選択可能に — 合計・個別で取引を比較\n③ 日足終値を基にした参考換算額を表示",
  es: "📢 Aviso de actualización (2026-07-15)\n\n① Se añadió la función 'Libro Mayor' a Mi Cartera — organiza automáticamente el historial de entrada/salida mensual/anual\n② Ahora puede seleccionar varias carteras de contraparte — comparar transacciones combinadas o individualmente\n③ Muestra un valor de referencia convertido según el precio de cierre diario",
  fr: "📢 Avis de mise à jour (2026-07-15)\n\n① Ajout de la fonction « Grand Livre » à Mon Portefeuille — organise automatiquement l'historique des entrées/sorties mensuel/annuel\n② Vous pouvez désormais sélectionner plusieurs portefeuilles de contrepartie — comparer les transactions de façon combinée ou individuelle\n③ Affiche une valeur de référence convertie selon le cours de clôture journalier",
  vi: "📢 Thông báo cập nhật (2026-07-15)\n\n① Đã thêm tính năng 'Sổ Cái' vào Ví của tôi — tự động sắp xếp lịch sử vào/ra theo tháng/năm\n② Giờ đây có thể chọn nhiều ví đối tác — so sánh giao dịch theo tổng hợp hoặc riêng lẻ\n③ Hiển thị giá trị tham khảo quy đổi theo giá đóng cửa hàng ngày",
  pt: "📢 Aviso de atualização (2026-07-15)\n\n① Adicionada a função 'Livro-razão' em Minha Carteira — organiza automaticamente o histórico de entrada/saída mensal/anual\n② Agora você pode selecionar várias carteiras de contraparte — comparar transações de forma combinada ou individual\n③ Exibe um valor de referência convertido pelo preço de fechamento diário",
  ms: "📢 Notis Kemas Kini (2026-07-15)\n\n① Menambah ciri 'Lejar' pada Dompet Saya — menyusun sejarah masuk/keluar bulanan/tahunan secara automatik\n② Kini boleh memilih beberapa dompet rakan niaga — bandingkan transaksi secara gabungan atau individu\n③ Memaparkan nilai rujukan yang ditukar berdasarkan harga penutupan harian",
  tl: "📢 Abiso sa Update (2026-07-15)\n\n① Idinagdag ang feature na 'Talaan' sa My Wallet — awtomatikong inaayos ang buwanan/taunang kasaysayan ng papasok/palabas\n② Maaari nang pumili ng maraming katapat na wallet — ikumpara ang mga transaksyon nang kombinado o indibidwal\n③ Ipinapakita ang reference value batay sa closing price araw-araw",
  hi: "📢 अपडेट सूचना (2026-07-15)\n\n① माई वॉलेट में 'बहीखाता' सुविधा जोड़ी गई — मासिक/वार्षिक आवक/जावक इतिहास को स्वचालित रूप से व्यवस्थित करता है\n② अब कई प्रतिपक्ष वॉलेट चुने जा सकते हैं — संयुक्त या व्यक्तिगत रूप से लेनदेन की तुलना करें\n③ दैनिक क्लोजिंग प्राइस के आधार पर संदर्भ मूल्य दिखाता है",
  ar: "📢 إشعار التحديث (2026-07-15)\n\n① تمت إضافة ميزة \"السجل\" إلى محفظتي — ينظم تلقائيًا سجل الوارد/الصادر الشهري/السنوي\n② يمكنك الآن تحديد عدة محافظ مقابلة — قارن المعاملات إجمالاً أو فرديًا\n③ يعرض قيمة مرجعية محولة بناءً على سعر الإغلاق اليومي",
  ru: "📢 Уведомление об обновлении (2026-07-15)\n\n① В Мой кошелёк добавлена функция «Гроссбух» — автоматически систематизирует историю поступлений/списаний по месяцам/годам\n② Теперь можно выбрать несколько кошельков-контрагентов — сравнивать транзакции в сумме или по отдельности\n③ Отображается справочная стоимость, пересчитанная по дневной цене закрытия",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-15)\n\n① মাই ওয়ালেটে 'খতিয়ান' বৈশিষ্ট্য যোগ করা হয়েছে — মাসিক/বার্ষিক আসা/যাওয়ার ইতিহাস স্বয়ংক্রিয়ভাবে সাজায়\n② এখন একাধিক প্রতিপক্ষ ওয়ালেট নির্বাচন করা যায় — সম্মিলিত বা পৃথকভাবে লেনদেন তুলনা করুন\n③ দৈনিক ক্লোজিং প্রাইস অনুযায়ী রেফারেন্স মূল্য দেখায়",
  sw: "📢 Taarifa ya Sasisho (2026-07-15)\n\n① Imeongeza kipengele cha 'Kitabu cha Hesabu' katika Pochi Yangu — hupanga kiotomatiki historia ya kila mwezi/mwaka ya ndani/nje\n② Sasa unaweza kuchagua pochi kadhaa za mshirika — linganisha miamala kwa jumla au kibinafsi\n③ Huonyesha thamani ya rejeleo iliyobadilishwa kulingana na bei ya kufunga ya kila siku",
  th: "📢 แจ้งอัปเดต (2026-07-15)\n\n① เพิ่มฟีเจอร์ 'บัญชี' ในกระเป๋าของฉัน — จัดระเบียบประวัติเข้า/ออกรายเดือน/รายปีโดยอัตโนมัติ\n② เลือกกระเป๋าคู่ค้าได้หลายรายการแล้ว — เปรียบเทียบธุรกรรมแบบรวมหรือแยกราย\n③ แสดงมูลค่าอ้างอิงที่แปลงตามราคาปิดรายวัน",
  tr: "📢 Güncelleme Bildirimi (2026-07-15)\n\n① Cüzdanım'a 'Defter' özelliği eklendi — aylık/yıllık giriş/çıkış geçmişini otomatik olarak düzenler\n② Artık birden fazla karşı taraf cüzdanı seçilebilir — işlemleri toplu veya bireysel olarak karşılaştırın\n③ Günlük kapanış fiyatına göre dönüştürülmüş referans değeri gösterir",
};


// ── 공지 팝업 ────────────────────────────────────────
const _NOTICE_COL = 'notices_pidex_quiz';

async function fetchAllNotices() {
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
  return notices;
}

async function showNoticeIfNeeded() {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const notices = await fetchAllNotices();
  if (!notices.length) return;
  const latest = notices[notices.length - 1];
  const skipUntil   = parseInt(localStorage.getItem(SKIP_KEY) || '0', 10);
  const skipVersion = localStorage.getItem(VERSION_KEY) || '';
  if (skipVersion === latest.version && Date.now() < skipUntil) return;
  _showNoticePopup(notices, notices.length - 1);
}

// 관리자가 QuizPi 로고를 클릭하면 스킵 여부와 무관하게 공지창(통계 탭 포함)을 바로 연다.
async function openNoticePopupManually() {
  const notices = await fetchAllNotices();
  if (!notices.length) return;
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
  const isAdmin = currentUsername === ADMIN_USERNAME;
  document.getElementById('notice-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'notice-overlay';
  overlay.className = 'notice-overlay';
  overlay.innerHTML = `
    <div class="notice-box">
      ${isAdmin ? `
      <div style="display:flex;gap:4px;margin-bottom:10px;">
        <button class="admin-notice-tab active" data-tab="notice" style="flex:1;padding:6px;border:none;border-radius:6px;background:var(--primary,#6c5ce7);color:#fff;font-size:12px;cursor:pointer;">📢 공지</button>
        <button class="admin-notice-tab" data-tab="stats" style="flex:1;padding:6px;border:none;border-radius:6px;background:rgba(255,255,255,0.08);color:#ccc;font-size:12px;cursor:pointer;">📊 통계</button>
        <button class="admin-notice-tab" data-tab="messages" style="flex:1;padding:6px;border:none;border-radius:6px;background:rgba(255,255,255,0.08);color:#ccc;font-size:12px;cursor:pointer;">${t('admin_tab_messages')}</button>
      </div>` : ''}
      <div id="notice-panel-notice">
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
      ${isAdmin ? `<div id="notice-panel-stats" class="hidden" style="max-height:60vh;overflow-y:auto;background:var(--surface2,#22263a);border-radius:10px;padding:12px;"></div>` : ''}
      ${isAdmin ? `<div id="notice-panel-messages" class="hidden" style="max-height:60vh;overflow-y:auto;background:var(--surface2,#22263a);border-radius:10px;padding:12px;"></div>` : ''}
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

  if (isAdmin) {
    const tabs         = overlay.querySelectorAll('.admin-notice-tab');
    const noticePanel  = overlay.querySelector('#notice-panel-notice');
    const statsPanel   = overlay.querySelector('#notice-panel-stats');
    const messagesPanel = overlay.querySelector('#notice-panel-messages');
    const panels = { notice: noticePanel, stats: statsPanel, messages: messagesPanel };
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(b => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.style.background = on ? 'var(--primary,#6c5ce7)' : 'rgba(255,255,255,0.08)';
          b.style.color = on ? '#fff' : '#ccc';
        });
        const activeTab = btn.dataset.tab;
        Object.entries(panels).forEach(([key, el]) => el.classList.toggle('hidden', key !== activeTab));
        if (activeTab === 'stats' && !statsPanel.dataset.loaded) {
          statsPanel.dataset.loaded = '1';
          loadAndRenderAdminStats(statsPanel);
        }
        if (activeTab === 'messages' && !messagesPanel.dataset.loaded) {
          messagesPanel.dataset.loaded = '1';
          loadAndRenderAdminMessages(messagesPanel);
        }
      });
    });
  }
}

// ── 관리자에게 메시지 보내기 (헤더 아이디 클릭) ───────────────
const MESSAGES_COL = 'admin_messages';

function openAdminMessageDialog() {
  const username = currentUsername || _headerUsername;
  if (!username || username === ADMIN_USERNAME) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:340px;">
      <div class="modal-header"><span>${t('msg_dialog_title')}</span><button class="modal-close" id="am-x">✕</button></div>
      <div id="am-body" style="padding:16px;">
        <textarea id="am-text" rows="5" class="form-input" placeholder="${t('msg_dialog_placeholder')}" style="width:100%;resize:vertical;"></textarea>
        <p id="am-err" style="color:#f87171;font-size:11px;min-height:16px;margin-top:4px;"></p>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn-outline" id="am-cancel" style="flex:1;">${t('msg_cancel')}</button>
          <button class="btn-primary" id="am-send" style="flex:1;">${t('msg_send')}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#am-x').onclick = close;
  overlay.querySelector('#am-cancel').onclick = close;
  overlay.querySelector('#am-send').onclick = async () => {
    const text  = overlay.querySelector('#am-text').value.trim();
    const errEl = overlay.querySelector('#am-err');
    const btn   = overlay.querySelector('#am-send');
    if (!text) { errEl.textContent = t('msg_required'); return; }
    if (typeof firebase === 'undefined' || !firebase.apps.length) { errEl.textContent = t('msg_error'); return; }
    btn.disabled = true;
    try {
      const db = firebase.firestore();
      await db.collection(MESSAGES_COL).add({
        username, app: 'pidex_quiz', text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      overlay.querySelector('#am-body').innerHTML = `<p style="text-align:center;padding:20px 0;color:#22c55e;">✅ ${t('msg_sent')}</p>`;
      setTimeout(close, 900);
    } catch {
      errEl.textContent = t('msg_send_fail');
      btn.disabled = false;
    }
  };
}

async function loadAndRenderAdminMessages(el) {
  el.innerHTML = `<p style="color:#888;font-size:13px;padding:16px 0;text-align:center;">${t('admin_msg_loading')}</p>`;
  try {
    if (typeof firebase === 'undefined' || !firebase.apps.length) throw new Error('no db');
    const db = firebase.firestore();
    const snap = await db.collection(MESSAGES_COL).orderBy('createdAt', 'desc').limit(100).get();
    if (snap.empty) { el.innerHTML = `<p style="color:#888;font-size:13px;padding:16px 0;text-align:center;">${t('admin_msg_empty')}</p>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const m = d.data();
      const date = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : '';
      return `
        <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:3px;">
            <span>👤 ${m.username || '?'} · ${m.app === 'pidex_app' ? '파이덱스' : '퀴즈파이'}</span>
            <span>${date}</span>
          </div>
          <div style="font-size:13px;color:#eee;white-space:pre-wrap;">${(m.text || '').replace(/</g,'&lt;')}</div>
        </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = `<p style="color:#f87171;font-size:13px;padding:16px 0;">${t('admin_msg_load_fail')}: ${e.message}</p>`;
  }
}

// ── 관리자 전용 통계 (공지창 "통계" 탭) ─────────────────────
const ADMIN_USERNAME    = 'cam1998pi';
const STATS_HISTORY_COL = 'admin_stats_history';
const QUIZ_MODES_LIST   = ['miner', 'pioneer', 'validator'];
const SURVIVAL_MAPS_LIST = ['dungeon', 'isekai', 'arbbot', 'zombie', 'ruins', 'derelict'];

async function safeGet(db, col) {
  try { return await db.collection(col).get(); } catch { return null; }
}
function sumField(snap, field) {
  if (!snap) return 0;
  return snap.docs.reduce((s, d) => s + (d.data()[field]?.length || 0), 0);
}
function userIdsOf(snap) {
  return snap ? snap.docs.map(d => d.id) : [];
}

async function computeAdminStats(db) {
  const [hackSnap, pidexSnap, watchSnap, tradeSnap, reportSnap, opinionSnap, surveySnap, ...rest] = await Promise.all([
    safeGet(db, 'hack_pending_wallets'),
    safeGet(db, 'pidex_wallets'),
    safeGet(db, 'pidex_watch_list'),
    safeGet(db, 'pidex_trade_wallets'),
    safeGet(db, 'hack_reports'),
    safeGet(db, 'quiz_opinions'),
    safeGet(db, 'surveys'),
    ...QUIZ_MODES_LIST.map(m => safeGet(db, `leaderboard_${m}`)),
    ...SURVIVAL_MAPS_LIST.map(m => safeGet(db, `survival_${m}`)),
  ]);
  const leaderboardSnaps = rest.slice(0, QUIZ_MODES_LIST.length);
  const survivalSnaps    = rest.slice(QUIZ_MODES_LIST.length);

  const walletUsers = new Set([...userIdsOf(hackSnap), ...userIdsOf(pidexSnap)]);
  const quizUsers = new Set();
  leaderboardSnaps.forEach(snap => userIdsOf(snap).forEach(id => quizUsers.add(id)));
  const survivalUsers = new Set();
  survivalSnaps.forEach(snap => userIdsOf(snap).forEach(id => survivalUsers.add(id)));

  return {
    walletUsers: walletUsers.size,
    walletCount: sumField(hackSnap, 'wallets') + sumField(pidexSnap, 'wallets'),
    watchUsers: watchSnap ? watchSnap.size : 0,
    watchCount: sumField(watchSnap, 'watchList'),
    tradeUsers: tradeSnap ? tradeSnap.size : 0,
    tradeCount: sumField(tradeSnap, 'mainnet'),
    reportCount: reportSnap ? reportSnap.size : 0,
    opinionCount: opinionSnap ? opinionSnap.size : 0,
    quizUsers: quizUsers.size,
    survivalUsers: survivalUsers.size,
    surveyUsers: surveySnap ? surveySnap.size : 0,
  };
}

async function loadAdminStatsWithGrowth(db) {
  const current = await computeAdminStats(db);
  let prev = null;
  try {
    const histSnap = await db.collection(STATS_HISTORY_COL).orderBy('date', 'desc').limit(2).get();
    const docs  = histSnap.docs.map(d => d.data());
    const today = new Date().toISOString().slice(0, 10);
    prev = docs.find(d => d.date !== today) || null;
    await db.collection(STATS_HISTORY_COL).doc(today).set({
      date: today, ...current, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch { /* 기록 실패해도 현재 통계는 보여줌 */ }
  return { current, prev };
}

// 관리자가 통계 탭을 안 열어도, 아무 유저나 접속하면 그날 스냅샷이 자동으로 한 번 기록됨
async function maybeRecordDailyStatsSnapshot() {
  try {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    const db    = firebase.firestore();
    const today = new Date().toISOString().slice(0, 10);
    const ref   = db.collection(STATS_HISTORY_COL).doc(today);
    const snap  = await ref.get();
    if (snap.exists) return;
    const current = await computeAdminStats(db);
    await ref.set({ date: today, ...current, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch { /* 조용히 무시 — 일반 유저 경험에 영향 없어야 함 */ }
}

async function fetchSubscriberCount() {
  try {
    const r = await fetch(`/api/admin-stats?username=${encodeURIComponent(ADMIN_USERNAME)}`);
    if (!r.ok) return null;
    const data = await r.json();
    return data.subscriberCount ?? null;
  } catch { return null; }
}

async function loadAndRenderAdminStats(el) {
  el.innerHTML = `<p style="color:#888;font-size:13px;padding:16px 0;text-align:center;">불러오는 중...</p>`;
  try {
    const db = firebase.firestore();
    const [{ current, prev }, subscriberCount] = await Promise.all([
      loadAdminStatsWithGrowth(db),
      fetchSubscriberCount(),
    ]);
    const row = (label, value, prevValue) => {
      const delta = (prevValue != null) ? value - prevValue : null;
      const deltaStr = delta == null ? '' :
        (delta > 0 ? ` <span style="color:#22c55e;">+${delta}</span>` :
         delta < 0 ? ` <span style="color:#f87171;">${delta}</span>` :
                      ` <span style="color:#888;">±0</span>`);
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">
        <span style="color:#ccc;">${label}</span><span style="font-weight:600;">${value}${deltaStr}</span>
      </div>`;
    };
    el.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:8px;">${prev ? `지난 확인(${prev.date}) 대비 증감` : '첫 확인 — 다음부터 증감이 표시돼요'}</div>
      ${row('지갑 등록 유저 수 (두 앱 합산)', current.walletUsers, prev?.walletUsers)}
      ${row('등록된 지갑 개수 (두 앱 합산)', current.walletCount, prev?.walletCount)}
      ${row('관심지갑 등록 유저 수', current.watchUsers, prev?.watchUsers)}
      ${row('관심지갑 개수', current.watchCount, prev?.watchCount)}
      ${row('거래지갑 등록 유저 수', current.tradeUsers, prev?.tradeUsers)}
      ${row('거래지갑 개수', current.tradeCount, prev?.tradeCount)}
      ${row('해킹 신고 건수', current.reportCount, prev?.reportCount)}
      ${row('의견 게시글 수', current.opinionCount, prev?.opinionCount)}
      ${row('퀴즈 참여 유저 수', current.quizUsers, prev?.quizUsers)}
      ${row('생존게임 참여 유저 수', current.survivalUsers, prev?.survivalUsers)}
      ${row('설문조사 참여 유저 수', current.surveyUsers, prev?.surveyUsers)}
      ${row('구독자 수 (퀴즈파이 앱)', subscriberCount ?? '?', null)}
    `;
  } catch (e) {
    el.innerHTML = `<p style="color:#f87171;font-size:13px;padding:16px 0;">통계 로드 실패: ${e.message}</p>`;
  }
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
let _headerUsernameClickBound = false;
export function updateHeaderUsername(name) {
  if (name) _headerUsername = name;
  const el = document.getElementById('header-username');
  if (el) {
    el.textContent = isSubscribed() ? `⭐ ${_headerUsername}` : _headerUsername;
    if (!_headerUsernameClickBound) {
      _headerUsernameClickBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => openAdminMessageDialog());
    }
  }
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
    maybeRecordDailyStatsSnapshot();
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

  // 관리자 모드에서만: 좌측 상단 "QuizPi π" 클릭 시 공지창(관리자 통계 탭 포함) 오픈
  document.getElementById('header-title')?.addEventListener('click', () => {
    if (currentUsername === ADMIN_USERNAME) openNoticePopupManually();
  });

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
