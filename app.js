import { initPiSDK, authenticate, currentAccessToken } from './pi-sdk.js';
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
  version: '2026-07-23',
  ko: "📢 업데이트 안내 (2026-07-23)\n\n① 지갑이 0개일 때 클라우드 백업/복원 버튼이 안 보이던 문제를 수정했습니다 — 새 기기·재설치 시에도 복원 가능합니다.",
  en: "📢 Update Notice (2026-07-23)\n\n① Fixed an issue where the cloud backup/restore button didn't show when you had no wallets registered — you can now restore even on a new device or after reinstalling.",
  zh: "📢 更新通知 (2026-07-23)\n\n① 修复了钱包数量为0时云备份/恢复按钮不显示的问题 — 现在换新设备或重新安装后也可以恢复。",
  id: "📢 Pemberitahuan Pembaruan (2026-07-23)\n\n① Memperbaiki masalah tombol cadangan/pemulihan cloud yang tidak muncul saat belum ada dompet terdaftar — sekarang bisa dipulihkan meski di perangkat baru atau setelah instal ulang.",
  ja: "📢 アップデートのお知らせ (2026-07-23)\n\n① ウォレットが0件のときにクラウドバックアップ/復元ボタンが表示されなかった問題を修正しました — 新しい端末や再インストール後でも復元できます。",
  es: "📢 Aviso de actualización (2026-07-23)\n\n① Se corrigió un problema por el que el botón de copia de seguridad/restauración en la nube no aparecía cuando no había carteras registradas — ahora puedes restaurar incluso en un dispositivo nuevo o tras reinstalar.",
  fr: "📢 Avis de mise à jour (2026-07-23)\n\n① Correction d'un problème où le bouton de sauvegarde/restauration cloud n'apparaissait pas lorsqu'aucun portefeuille n'était enregistré — vous pouvez maintenant restaurer même sur un nouvel appareil ou après réinstallation.",
  vi: "📢 Thông báo cập nhật (2026-07-23)\n\n① Đã sửa lỗi nút sao lưu/khôi phục đám mây không hiện khi chưa có ví nào được đăng ký — giờ có thể khôi phục ngay cả trên thiết bị mới hoặc sau khi cài lại.",
  pt: "📢 Aviso de atualização (2026-07-23)\n\n① Corrigido um problema em que o botão de backup/restauração na nuvem não aparecia quando não havia carteiras registradas — agora é possível restaurar mesmo em um novo dispositivo ou após reinstalar.",
  ms: "📢 Notis Kemas Kini (2026-07-23)\n\n① Membetulkan isu butang sandaran/pemulihan awan yang tidak muncul apabila tiada dompet berdaftar — kini boleh dipulihkan walaupun pada peranti baharu atau selepas pemasangan semula.",
  tl: "📢 Abiso sa Update (2026-07-23)\n\n① Naayos ang isyu kung saan hindi lumalabas ang cloud backup/restore button kapag walang nakarehistrong wallet — maaari na ngayong i-restore kahit sa bagong device o pagkatapos mag-reinstall.",
  hi: "📢 अपडेट सूचना (2026-07-23)\n\n① कोई वॉलेट पंजीकृत न होने पर क्लाउड बैकअप/रीस्टोर बटन न दिखने की समस्या ठीक की गई — अब नए डिवाइस या रीइंस्टॉल के बाद भी रीस्टोर किया जा सकता है।",
  ar: "📢 إشعار التحديث (2026-07-23)\n\n① تم إصلاح مشكلة عدم ظهور زر النسخ الاحتياطي/الاستعادة السحابي عند عدم وجود محافظ مسجلة — يمكنك الآن الاستعادة حتى على جهاز جديد أو بعد إعادة التثبيت.",
  ru: "📢 Уведомление об обновлении (2026-07-23)\n\n① Исправлена проблема, из-за которой кнопка облачного резервного копирования/восстановления не отображалась при отсутствии зарегистрированных кошельков — теперь можно восстановить данные даже на новом устройстве или после переустановки.",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-23)\n\n① কোনো ওয়ালেট নিবন্ধিত না থাকলে ক্লাউড ব্যাকআপ/রিস্টোর বাটন না দেখানোর সমস্যা সমাধান করা হয়েছে — এখন নতুন ডিভাইসে বা পুনরায় ইনস্টলের পরেও পুনরুদ্ধার করা যাবে।",
  sw: "📢 Taarifa ya Sasisho (2026-07-23)\n\n① Imerekebisha tatizo la kitufe cha hifadhi/kurejesha wingu kutoonekana wakati hakuna pochi zilizosajiliwa — sasa unaweza kurejesha hata kwenye kifaa kipya au baada ya kusakinisha upya.",
  th: "📢 แจ้งอัปเดต (2026-07-23)\n\n① แก้ไขปัญหาปุ่มสำรอง/กู้คืนบนคลาวด์ไม่แสดงเมื่อยังไม่มีกระเป๋าเงินที่ลงทะเบียน — ตอนนี้สามารถกู้คืนได้แม้ในอุปกรณ์ใหม่หรือหลังติดตั้งใหม่",
  tr: "📢 Güncelleme Bildirimi (2026-07-23)\n\n① Kayıtlı cüzdan olmadığında bulut yedekleme/geri yükleme düğmesinin görünmediği sorun giderildi — artık yeni bir cihazda veya yeniden yüklemeden sonra da geri yükleme yapılabilir.",
};

const NOTICE_PREV = {
  version: '2026-07-22',
  ko: "📢 업데이트 안내 (2026-07-22)\n\n① \"트래커\" 탭 이름을 \"지갑\"으로 변경 (하단 메뉴·도움말 등 전체 반영)\n② 지갑 탭 메뉴를 2줄로 고정 표시 — 좌우로 스크롤하지 않아도 전체 메뉴가 한눈에 보입니다\n③ \"장부\" 탭을 \"입출금내역\"으로 이름 변경\n④ 세금계산에 원화(KRW) 환산 옵션 추가, 기간 선택에 \"상장일\"/\"오늘\" 바로가기 버튼 추가\n⑤ 모바일에서 보고서 CSV 내보내기가 안 되던 문제 수정",
  en: "📢 Update Notice (2026-07-22)\n\n① Renamed the \"Tracker\" tab to \"Wallet\" (applied throughout the bottom nav, help, etc.)\n② Wallet tab menu now shows as 2 fixed rows — see the whole menu without scrolling sideways\n③ Renamed the \"Ledger\" tab to \"Deposits/Withdrawals\"\n④ Added a KRW conversion option to Tax Calculation, plus \"Listing Date\"/\"Today\" shortcut buttons for the date range\n⑤ Fixed an issue where exporting the report CSV didn't work on mobile",
  zh: "📢 更新通知 (2026-07-22)\n\n① 将\"追踪\"标签页更名为\"钱包\"（底部导航、帮助等全部同步更新）\n② 钱包标签菜单改为固定两行显示 — 无需左右滑动即可看到全部菜单\n③ 将\"账本\"标签页更名为\"存取记录\"\n④ 税务计算新增韩元(KRW)换算选项，日期范围新增\"上市日\"/\"今天\"快捷按钮\n⑤ 修复了在移动端无法导出报告CSV的问题",
  id: "📢 Pemberitahuan Pembaruan (2026-07-22)\n\n① Mengganti nama tab \"Tracker\" menjadi \"Dompet\" (diterapkan penuh di navigasi bawah, bantuan, dll.)\n② Menu tab Dompet kini ditampilkan sebagai 2 baris tetap — lihat semua menu tanpa perlu menggeser ke samping\n③ Mengganti nama tab \"Buku Besar\" menjadi \"Riwayat Setor/Tarik\"\n④ Menambahkan opsi konversi KRW pada Kalkulasi Pajak, plus tombol pintasan \"Tanggal Listing\"/\"Hari Ini\" untuk rentang tanggal\n⑤ Memperbaiki masalah ekspor CSV laporan yang tidak berfungsi di perangkat seluler",
  ja: "📢 アップデートのお知らせ (2026-07-22)\n\n① 「トラッカー」タブの名称を「ウォレット」に変更（下部ナビ・ヘルプなど全体に反映）\n② ウォレットタブのメニューを2段固定表示に変更 — 横スクロールしなくても全メニューが一目で見えます\n③ 「台帳」タブの名称を「入出金履歴」に変更\n④ 税金計算にウォン(KRW)換算オプションを追加、期間選択に「上場日」「今日」ショートカットボタンを追加\n⑤ モバイルでレポートCSVの書き出しができなかった問題を修正",
  es: "📢 Aviso de actualización (2026-07-22)\n\n① Se renombró la pestaña \"Tracker\" a \"Cartera\" (aplicado en la navegación inferior, ayuda, etc.)\n② El menú de la pestaña Cartera ahora se muestra en 2 filas fijas — ve todo el menú sin desplazarte lateralmente\n③ Se renombró la pestaña \"Libro Mayor\" a \"Depósitos/Retiros\"\n④ Se agregó una opción de conversión a KRW en el Cálculo de Impuestos, además de botones de acceso directo \"Fecha de Cotización\"/\"Hoy\" para el rango de fechas\n⑤ Se corrigió un problema por el que exportar el CSV del informe no funcionaba en móviles",
  fr: "📢 Avis de mise à jour (2026-07-22)\n\n① Renommé l'onglet « Tracker » en « Portefeuille » (appliqué à la navigation inférieure, l'aide, etc.)\n② Le menu de l'onglet Portefeuille s'affiche désormais sur 2 lignes fixes — voyez tout le menu sans défiler latéralement\n③ Renommé l'onglet « Grand Livre » en « Dépôts/Retraits »\n④ Ajout d'une option de conversion en KRW dans le Calcul Fiscal, ainsi que des boutons de raccourci « Date de Cotation »/« Aujourd'hui » pour la plage de dates\n⑤ Correction d'un problème empêchant l'exportation du CSV du rapport sur mobile",
  vi: "📢 Thông báo cập nhật (2026-07-22)\n\n① Đổi tên tab \"Tracker\" thành \"Ví\" (áp dụng toàn bộ ở thanh điều hướng dưới, trợ giúp, v.v.)\n② Menu tab Ví giờ hiển thị cố định thành 2 hàng — xem toàn bộ menu mà không cần cuộn ngang\n③ Đổi tên tab \"Sổ Cái\" thành \"Lịch Sử Nạp/Rút\"\n④ Thêm tùy chọn quy đổi KRW vào Tính Thuế, cùng nút tắt \"Ngày Niêm Yết\"/\"Hôm Nay\" cho khoảng thời gian\n⑤ Sửa lỗi xuất CSV báo cáo không hoạt động trên thiết bị di động",
  pt: "📢 Aviso de atualização (2026-07-22)\n\n① Renomeada a aba \"Tracker\" para \"Carteira\" (aplicado na navegação inferior, ajuda, etc.)\n② O menu da aba Carteira agora é exibido em 2 linhas fixas — veja todo o menu sem precisar rolar lateralmente\n③ Renomeada a aba \"Livro-razão\" para \"Depósitos/Saques\"\n④ Adicionada opção de conversão para KRW no Cálculo de Impostos, além de botões de atalho \"Data de Listagem\"/\"Hoje\" para o intervalo de datas\n⑤ Corrigido um problema em que a exportação do CSV do relatório não funcionava em dispositivos móveis",
  ms: "📢 Notis Kemas Kini (2026-07-22)\n\n① Menamakan semula tab \"Tracker\" kepada \"Dompet\" (diterapkan sepenuhnya pada navigasi bawah, bantuan, dll.)\n② Menu tab Dompet kini dipaparkan sebagai 2 baris tetap — lihat semua menu tanpa perlu leret ke sisi\n③ Menamakan semula tab \"Lejar\" kepada \"Sejarah Deposit/Pengeluaran\"\n④ Menambah pilihan penukaran KRW pada Pengiraan Cukai, serta butang pintasan \"Tarikh Penyenaraian\"/\"Hari Ini\" untuk julat tarikh\n⑤ Membetulkan isu eksport CSV laporan yang tidak berfungsi pada peranti mudah alih",
  tl: "📢 Abiso sa Update (2026-07-22)\n\n① Pinalitan ang pangalan ng tab na \"Tracker\" tungo sa \"Wallet\" (inilapat sa buong bottom nav, help, atbp.)\n② Ang menu ng Wallet tab ay ipinapakita na ngayon bilang 2 nakapirming hanay — makita ang buong menu nang hindi kinakailangang mag-scroll pahalang\n③ Pinalitan ang pangalan ng tab na \"Ledger\" tungo sa \"Deposito/Withdrawal\"\n④ Nagdagdag ng opsyon na pag-convert sa KRW sa Kalkulasyon ng Buwis, kasama ang mga shortcut button na \"Listing Date\"/\"Today\" para sa hanay ng petsa\n⑤ Naayos ang isyu kung saan hindi gumagana ang pag-export ng CSV ng ulat sa mobile",
  hi: "📢 अपडेट सूचना (2026-07-22)\n\n① \"ट्रैकर\" टैब का नाम बदलकर \"वॉलेट\" किया गया (निचले नेविगेशन, सहायता आदि में पूरी तरह लागू)\n② वॉलेट टैब का मेनू अब 2 स्थिर पंक्तियों में दिखता है — बग़ल में स्क्रॉल किए बिना पूरा मेनू देखें\n③ \"बहीखाता\" टैब का नाम बदलकर \"जमा/निकासी इतिहास\" किया गया\n④ कर गणना में KRW रूपांतरण विकल्प जोड़ा गया, साथ ही तिथि सीमा के लिए \"लिस्टिंग तिथि\"/\"आज\" शॉर्टकट बटन जोड़े गए\n⑤ मोबाइल पर रिपोर्ट CSV निर्यात न होने की समस्या ठीक की गई",
  ar: "📢 إشعار التحديث (2026-07-22)\n\n① إعادة تسمية تبويب \"المتتبع\" إلى \"المحفظة\" (مطبّق بالكامل في التنقل السفلي والمساعدة وغيرها)\n② قائمة تبويب المحفظة تظهر الآن في صفين ثابتين — شاهد القائمة بالكامل دون التمرير جانبيًا\n③ إعادة تسمية تبويب \"السجل\" إلى \"سجل الإيداع/السحب\"\n④ إضافة خيار تحويل إلى الوون الكوري (KRW) في حساب الضرائب، بالإضافة إلى أزرار اختصار \"تاريخ الإدراج\"/\"اليوم\" لنطاق التاريخ\n⑤ إصلاح مشكلة عدم عمل تصدير CSV للتقرير على الجوال",
  ru: "📢 Уведомление об обновлении (2026-07-22)\n\n① Вкладка «Трекер» переименована в «Кошелёк» (применено везде — нижняя навигация, справка и т.д.)\n② Меню вкладки Кошелёк теперь отображается в виде 2 фиксированных строк — весь список виден без горизонтальной прокрутки\n③ Вкладка «Гроссбух» переименована в «История пополнений/выводов»\n④ В Расчёт налогов добавлена опция конвертации в KRW, а также кнопки быстрого выбора «Дата листинга»/«Сегодня» для диапазона дат\n⑤ Исправлена проблема, из-за которой экспорт CSV отчёта не работал на мобильных устройствах",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-22)\n\n① \"ট্র্যাকার\" ট্যাবের নাম পরিবর্তন করে \"ওয়ালেট\" করা হয়েছে (নিচের নেভিগেশন, সাহায্য ইত্যাদিতে সম্পূর্ণভাবে প্রয়োগ করা হয়েছে)\n② ওয়ালেট ট্যাবের মেনু এখন ২টি স্থির সারিতে দেখানো হয় — পাশে স্ক্রল না করেই পুরো মেনু দেখুন\n③ \"খতিয়ান\" ট্যাবের নাম পরিবর্তন করে \"জমা/উত্তোলনের ইতিহাস\" করা হয়েছে\n④ কর গণনায় KRW রূপান্তর অপশন যোগ করা হয়েছে, সাথে তারিখ পরিসরের জন্য \"তালিকাভুক্তির তারিখ\"/\"আজ\" শর্টকাট বাটন যোগ করা হয়েছে\n⑤ মোবাইলে রিপোর্ট CSV এক্সপোর্ট না হওয়ার সমস্যা সমাধান করা হয়েছে",
  sw: "📢 Taarifa ya Sasisho (2026-07-22)\n\n① Imebadilisha jina la kichupo cha \"Tracker\" kuwa \"Pochi\" (imetumika kikamilifu kwenye urambazaji wa chini, msaada, n.k.)\n② Menyu ya kichupo cha Pochi sasa inaonyeshwa kama safu 2 zisizobadilika — ona menyu yote bila kutelezesha kando\n③ Imebadilisha jina la kichupo cha \"Kitabu cha Hesabu\" kuwa \"Historia ya Kuweka/Kutoa\"\n④ Imeongeza chaguo la ubadilishaji wa KRW kwenye Hesabu ya Kodi, pamoja na vitufe vya njia ya mkato \"Tarehe ya Kuorodheshwa\"/\"Leo\" kwa muda wa tarehe\n⑤ Imerekebisha tatizo la kutoweza kuhamisha CSV ya ripoti kwenye simu za mkononi",
  th: "📢 แจ้งอัปเดต (2026-07-22)\n\n① เปลี่ยนชื่อแท็บ \"Tracker\" เป็น \"กระเป๋าเงิน\" (ใช้ทั่วทั้งเมนูด้านล่าง วิธีใช้ ฯลฯ)\n② เมนูแท็บกระเป๋าเงินตอนนี้แสดงเป็น 2 แถวคงที่ — ดูเมนูทั้งหมดได้โดยไม่ต้องเลื่อนด้านข้าง\n③ เปลี่ยนชื่อแท็บ \"บัญชี\" เป็น \"ประวัติฝาก/ถอน\"\n④ เพิ่มตัวเลือกแปลงเป็น KRW ในการคำนวณภาษี พร้อมปุ่มลัด \"วันที่จดทะเบียน\"/\"วันนี้\" สำหรับช่วงวันที่\n⑤ แก้ไขปัญหาการส่งออก CSV รายงานที่ใช้งานไม่ได้บนมือถือ",
  tr: "📢 Güncelleme Bildirimi (2026-07-22)\n\n① \"Tracker\" sekmesinin adı \"Cüzdan\" olarak değiştirildi (alt gezinme, yardım vb. her yerde uygulandı)\n② Cüzdan sekmesi menüsü artık 2 sabit satır halinde gösteriliyor — yana kaydırmadan tüm menüyü görün\n③ \"Defter\" sekmesinin adı \"Yatırma/Çekme Geçmişi\" olarak değiştirildi\n④ Vergi Hesaplama'ya KRW dönüştürme seçeneği eklendi, ayrıca tarih aralığı için \"Listeleme Tarihi\"/\"Bugün\" kısayol düğmeleri eklendi\n⑤ Mobilde rapor CSV dışa aktarmanın çalışmadığı sorun giderildi",
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
    const r = await fetch(`/api/admin-stats?accessToken=${encodeURIComponent(currentAccessToken ?? '')}`);
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
      ${row('별칭지갑 등록 유저 수', current.tradeUsers, prev?.tradeUsers)}
      ${row('별칭지갑 개수', current.tradeCount, prev?.tradeCount)}
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
