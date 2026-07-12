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
  version: '2026-07-12',
  ko: "📢 업데이트 안내 (2026-07-12)\n\n① 지갑 별칭이 하나로 통합되었습니다 — 내 지갑 · 관심지갑 · 거래지갑 어디서 등록해도 같은 주소는 같은 별칭으로 표시됩니다\n② 클라우드 복원 시 별칭이 다르면 최신 별칭을 유지할지 선택할 수 있습니다",
  en: "📢 Update Notice (2026-07-12)\n\n① Wallet aliases are now unified — register from My Wallet, Watch List, or Trade Wallets and the same address shows the same alias everywhere\n② When restoring from cloud backup, you can choose to keep the latest alias if it differs",
  zh: "📢 更新通知 (2026-07-12)\n\n① 钱包别名已统一 — 无论在我的钱包、关注钱包还是交易钱包中注册，同一地址都会显示相同别名\n② 从云端恢复时，如别名不同可选择保留最新别名",
  id: "📢 Pemberitahuan Pembaruan (2026-07-12)\n\n① Alias dompet kini terpadu — daftar dari Dompet Saya, Daftar Pantau, atau Dompet Transaksi, alamat yang sama akan menampilkan alias yang sama\n② Saat memulihkan dari cloud, jika alias berbeda Anda bisa memilih mempertahankan alias terbaru",
  ja: "📢 アップデートのお知らせ (2026-07-12)\n\n① ウォレットのエイリアスが統合されました — マイウォレット・ウォッチリスト・取引ウォレットのどこで登録しても同じアドレスは同じエイリアスで表示されます\n② クラウド復元時にエイリアスが異なる場合、最新のエイリアスを維持するか選択できます",
  es: "📢 Aviso de actualización (2026-07-12)\n\n① Los alias de cartera ahora están unificados — regístrelos desde Mi Cartera, Lista de Seguimiento o Carteras de Transacción y la misma dirección mostrará el mismo alias en todas partes\n② Al restaurar desde la nube, si el alias difiere puede elegir mantener el más reciente",
  fr: "📢 Avis de mise à jour (2026-07-12)\n\n① Les alias de portefeuille sont désormais unifiés — enregistrez depuis Mon Portefeuille, la Liste de surveillance ou les Portefeuilles de Transaction, la même adresse affichera le même alias partout\n② Lors de la restauration depuis le cloud, si l'alias diffère, vous pouvez choisir de conserver le plus récent",
  vi: "📢 Thông báo cập nhật (2026-07-12)\n\n① Biệt danh ví giờ đã được hợp nhất — đăng ký từ Ví của tôi, Danh sách theo dõi hay Ví Giao Dịch, cùng một địa chỉ sẽ hiển thị cùng biệt danh ở mọi nơi\n② Khi khôi phục từ đám mây, nếu biệt danh khác bạn có thể chọn giữ biệt danh mới nhất",
  pt: "📢 Aviso de atualização (2026-07-12)\n\n① Os apelidos de carteira agora estão unificados — registre em Minha Carteira, Lista de Observação ou Carteiras de Transação, e o mesmo endereço mostrará o mesmo apelido em todo lugar\n② Ao restaurar da nuvem, se o apelido for diferente você pode optar por manter o mais recente",
  ms: "📢 Notis Kemas Kini (2026-07-12)\n\n① Alias dompet kini disatukan — daftar dari Dompet Saya, Senarai Pantauan atau Dompet Transaksi, alamat yang sama akan memaparkan alias yang sama\n② Semasa memulihkan dari awan, jika alias berbeza anda boleh pilih untuk kekalkan alias terkini",
  tl: "📢 Abiso sa Update (2026-07-12)\n\n① Pinagsama na ang alias ng wallet — magrehistro man sa My Wallet, Watch List, o Wallet ng Transaksyon, ang parehong address ay magpapakita ng parehong alias saanman\n② Kapag nagre-restore mula sa cloud, kung iba ang alias maaari kang pumili na panatilihin ang pinakabagong alias",
  hi: "📢 अपडेट सूचना (2026-07-12)\n\n① वॉलेट उपनाम अब एकीकृत हो गए हैं — माई वॉलेट, वॉचलिस्ट या लेनदेन वॉलेट में कहीं भी पंजीकृत करें, वही पता हर जगह वही उपनाम दिखाएगा\n② क्लाउड से पुनर्स्थापित करते समय, यदि उपनाम अलग है तो नवीनतम उपनाम रखने का विकल्प चुन सकते हैं",
  ar: "📢 إشعار التحديث (2026-07-12)\n\n① تم توحيد أسماء المحافظ المستعارة — سواء سجّلت من محفظتي أو قائمة المراقبة أو محافظ المعاملات، سيظهر نفس العنوان بنفس الاسم المستعار في كل مكان\n② عند الاستعادة من السحابة، إذا اختلف الاسم المستعار يمكنك اختيار الاحتفاظ بأحدثه",
  ru: "📢 Уведомление об обновлении (2026-07-12)\n\n① Псевдонимы кошельков теперь объединены — зарегистрируйте в Моём кошельке, Списке наблюдения или Торговых кошельках, и один и тот же адрес будет показывать один и тот же псевдоним везде\n② При восстановлении из облака, если псевдоним отличается, можно выбрать сохранить последний",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-12)\n\n① ওয়ালেট ডাকনাম এখন একীভূত করা হয়েছে — মাই ওয়ালেট, ওয়াচলিস্ট বা লেনদেন ওয়ালেট যেখান থেকেই নিবন্ধন করুন, একই ঠিকানা সব জায়গায় একই ডাকনাম দেখাবে\n② ক্লাউড থেকে পুনরুদ্ধার করার সময় ডাকনাম ভিন্ন হলে সর্বশেষ ডাকনাম রাখার বিকল্প বেছে নিতে পারবেন",
  sw: "📢 Taarifa ya Sasisho (2026-07-12)\n\n① Majina ya utani ya pochi sasa yameunganishwa — sajili kutoka Pochi Yangu, Orodha ya Ufuatiliaji, au Pochi za Miamala, anwani ile ile itaonyesha jina la utani lile lile kila mahali\n② Wakati wa kurejesha kutoka wingu, ikiwa jina la utani ni tofauti unaweza kuchagua kuweka jipya zaidi",
  th: "📢 แจ้งอัปเดต (2026-07-12)\n\n① ชื่อเล่นกระเป๋าเงินรวมเป็นหนึ่งแล้ว — ลงทะเบียนจากกระเป๋าของฉัน รายการเฝ้าดู หรือกระเป๋าคู่ค้า ที่อยู่เดียวกันจะแสดงชื่อเล่นเดียวกันทุกที่\n② เมื่อกู้คืนจากคลาวด์ หากชื่อเล่นต่างกันสามารถเลือกใช้ชื่อเล่นล่าสุดได้",
  tr: "📢 Güncelleme Bildirimi (2026-07-12)\n\n① Cüzdan takma adları artık birleştirildi — Cüzdanım, İzleme Listesi veya İşlem Cüzdanlarından kaydedin, aynı adres her yerde aynı takma adı gösterir\n② Buluttan geri yüklerken takma ad farklıysa en güncel olanı koruma seçeneğiniz var",
};

const NOTICE_PREV = {
  version: '2026-07-11',
  ko: "📢 업데이트 안내 (2026-07-11)\n\n① 지갑 클라우드 백업 · 복원 기능 추가 (5슬롯)\n② 거래 지갑 별칭 기능 추가 — 거래내역에 별칭 표시 (최대 100개)\n③ 트래커 상단 탭 가로 스크롤 지원",
  en: "📢 Update Notice (2026-07-11)\n\n① Added cloud backup/restore for wallets (5 slots)\n② Added Trade Wallet aliases — shown in transaction history (up to 100)\n③ Tracker's top tab bar now supports horizontal scrolling",
  zh: "📢 更新通知 (2026-07-11)\n\n① 新增钱包云备份/恢复功能（5个插槽）\n② 新增交易钱包别名功能 — 交易记录中显示别名（最多100个）\n③ 追踪器顶部标签栏支持横向滑动",
  id: "📢 Pemberitahuan Pembaruan (2026-07-11)\n\n① Ditambahkan fitur backup/pulihkan cloud untuk dompet (5 slot)\n② Ditambahkan alias Dompet Transaksi — ditampilkan di riwayat transaksi (hingga 100)\n③ Bilah tab atas Tracker kini mendukung gulir horizontal",
  ja: "📢 アップデートのお知らせ (2026-07-11)\n\n① ウォレットのクラウドバックアップ・復元機能を追加（5スロット）\n② 取引ウォレットのエイリアス機能を追加 — 取引履歴にエイリアス表示（最大100件）\n③ トラッカー上部のタブバーが横スクロールに対応",
  es: "📢 Aviso de actualización (2026-07-11)\n\n① Se añadió backup/restauración en la nube para carteras (5 ranuras)\n② Se añadió alias de Cartera de Transacción — se muestra en el historial de transacciones (hasta 100)\n③ La barra de pestañas superior del Rastreador ahora se puede desplazar horizontalmente",
  fr: "📢 Avis de mise à jour (2026-07-11)\n\n① Ajout de la sauvegarde/restauration cloud pour les portefeuilles (5 emplacements)\n② Ajout des alias de Portefeuille de Transaction — affichés dans l'historique des transactions (jusqu'à 100)\n③ La barre d'onglets du Traqueur peut désormais défiler horizontalement",
  vi: "📢 Thông báo cập nhật (2026-07-11)\n\n① Đã thêm sao lưu/khôi phục đám mây cho ví (5 khe)\n② Đã thêm biệt danh Ví Giao Dịch — hiển thị trong lịch sử giao dịch (tối đa 100)\n③ Thanh tab trên cùng của Theo dõi giờ có thể cuộn ngang",
  pt: "📢 Aviso de atualização (2026-07-11)\n\n① Adicionado backup/restauração em nuvem para carteiras (5 slots)\n② Adicionado alias de Carteira de Transação — exibido no histórico de transações (até 100)\n③ A barra de abas superior do Rastreador agora tem rolagem horizontal",
  ms: "📢 Notis Kemas Kini (2026-07-11)\n\n① Ditambah sandaran/pemulihan awan untuk dompet (5 slot)\n② Ditambah alias Dompet Transaksi — dipaparkan dalam sejarah transaksi (sehingga 100)\n③ Bar tab atas Penjejak kini menyokong tatal mendatar",
  tl: "📢 Abiso sa Update (2026-07-11)\n\n① Idinagdag ang cloud backup/restore para sa wallet (5 slot)\n② Idinagdag ang alias ng Wallet ng Transaksyon — makikita sa transaction history (hanggang 100)\n③ Ang tab bar sa itaas ng Tracker ay pwede nang i-scroll pahalang",
  hi: "📢 अपडेट सूचना (2026-07-11)\n\n① वॉलेट के लिए क्लाउड बैकअप/पुनर्स्थापन जोड़ा गया (5 स्लॉट)\n② लेनदेन वॉलेट उपनाम जोड़ा गया — लेनदेन इतिहास में उपनाम दिखता है (100 तक)\n③ ट्रैकर की ऊपरी टैब बार अब क्षैतिज स्क्रॉल करती है",
  ar: "📢 إشعار التحديث (2026-07-11)\n\n① تمت إضافة النسخ الاحتياطي/الاستعادة السحابية للمحافظ (5 خانات)\n② تمت إضافة أسماء محافظ المعاملات المستعارة — تظهر في سجل المعاملات (حتى 100)\n③ أصبح شريط علامات التبويب العلوي في المتتبع قابلاً للتمرير أفقياً",
  ru: "📢 Уведомление об обновлении (2026-07-11)\n\n① Добавлено облачное резервное копирование/восстановление кошельков (5 слотов)\n② Добавлены псевдонимы Торговых кошельков — отображаются в истории транзакций (до 100)\n③ Верхняя панель вкладок Трекера теперь прокручивается по горизонтали",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-11)\n\n① ওয়ালেটের জন্য ক্লাউড ব্যাকআপ/পুনরুদ্ধার যোগ করা হয়েছে (৫ স্লট)\n② লেনদেন ওয়ালেট ডাকনাম যোগ করা হয়েছে — লেনদেন তালিকায় ডাকনাম দেখা যায় (১০০ পর্যন্ত)\n③ ট্র্যাকারের উপরের ট্যাব বার এখন অনুভূমিকভাবে স্ক্রল করা যায়",
  sw: "📢 Taarifa ya Sasisho (2026-07-11)\n\n① Imeongeza hifadhi/kurejesha wingu kwa pochi (nafasi 5)\n② Imeongeza majina ya Pochi za Miamala — yanaonyeshwa kwenye historia ya miamala (hadi 100)\n③ Upau wa vichupo vya juu vya Mfuatiliaji sasa unaweza kusogezwa kwa mlalo",
  th: "📢 แจ้งอัปเดต (2026-07-11)\n\n① เพิ่มฟีเจอร์สำรอง/กู้คืนกระเป๋าเงินบนคลาวด์ (5 ช่อง)\n② เพิ่มชื่อเล่นกระเป๋าคู่ค้า — แสดงในรายการธุรกรรม (สูงสุด 100 รายการ)\n③ แถบแท็บด้านบนของตัวติดตามเลื่อนแนวนอนได้แล้ว",
  tr: "📢 Güncelleme Bildirimi (2026-07-11)\n\n① Cüzdanlar için bulut yedekleme/geri yükleme eklendi (5 slot)\n② İşlem Cüzdanı takma adları eklendi — işlem geçmişinde gösterilir (100'e kadar)\n③ İzleyicinin üst sekme çubuğu artık yatay kaydırmayı destekliyor",
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
const SURVIVAL_MAPS_LIST = ['jungle', 'desert', 'mountain', 'underwater', 'space'];

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
  const [hackSnap, pidexSnap, watchSnap, tradeSnap, reportSnap, opinionSnap, ...rest] = await Promise.all([
    safeGet(db, 'hack_pending_wallets'),
    safeGet(db, 'pidex_wallets'),
    safeGet(db, 'pidex_watch_list'),
    safeGet(db, 'pidex_trade_wallets'),
    safeGet(db, 'hack_reports'),
    safeGet(db, 'quiz_opinions'),
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
