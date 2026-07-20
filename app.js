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
  version: '2026-07-21',
  ko: "📢 업데이트 안내 (2026-07-21)\n\n① \"거래 지갑\"을 \"지갑별칭\"으로 명칭 정리\n② 지갑 별칭 저장 방식을 하나로 통합 — 어디서 등록해도 항상 최신 별칭이 표시됩니다\n③ 세금계산: 방식(FIFO/이동평균) 먼저 선택 후 해당 지갑만 골라 계산하도록 개편",
  en: "📢 Update Notice (2026-07-21)\n\n① Renamed \"Trade Wallets\" to \"Wallet Alias\"\n② Unified wallet alias storage into one place — the latest alias always shows no matter where you registered it\n③ Tax Calculation: redesigned to select a method (FIFO/Moving Average) first, then pick only wallets tagged with that method",
  zh: "📢 更新通知 (2026-07-21)\n\n① 将\"交易钱包\"更名为\"钱包别名\"\n② 统一了钱包别名的存储方式 — 无论在哪里注册，都会显示最新别名\n③ 税务计算：改为先选择方式（FIFO/移动平均法），再只选择该方式下的钱包进行计算",
  id: "📢 Pemberitahuan Pembaruan (2026-07-21)\n\n① Mengganti nama \"Dompet Transaksi\" menjadi \"Alias Dompet\"\n② Menyatukan penyimpanan alias dompet ke satu tempat — alias terbaru selalu ditampilkan di mana pun didaftarkan\n③ Kalkulasi Pajak: dirombak agar memilih metode (FIFO/Rata-rata Bergerak) dulu, baru memilih dompet yang bertag metode tersebut",
  ja: "📢 アップデートのお知らせ (2026-07-21)\n\n① 「取引ウォレット」を「ウォレットエイリアス」に名称変更\n② ウォレットエイリアスの保存先を一本化 — どこで登録しても常に最新のエイリアスが表示されます\n③ 税金計算: 方式（FIFO/移動平均法）を先に選び、その方式のタグが付いたウォレットだけを選んで計算するよう改善",
  es: "📢 Aviso de actualización (2026-07-21)\n\n① Se renombró \"Carteras de Transacción\" a \"Alias de Cartera\"\n② Se unificó el almacenamiento de alias de cartera en un solo lugar — el alias más reciente siempre se muestra sin importar dónde lo registres\n③ Cálculo de Impuestos: rediseñado para elegir primero el método (FIFO/Promedio Móvil) y luego solo las carteras con esa etiqueta",
  fr: "📢 Avis de mise à jour (2026-07-21)\n\n① Renommé « Portefeuilles de Transaction » en « Alias de Portefeuille »\n② Unification du stockage des alias de portefeuille en un seul endroit — le dernier alias s'affiche toujours, peu importe où il a été enregistré\n③ Calcul Fiscal : repensé pour choisir d'abord la méthode (FIFO/Moyenne Mobile), puis sélectionner uniquement les portefeuilles portant cette étiquette",
  vi: "📢 Thông báo cập nhật (2026-07-21)\n\n① Đổi tên \"Ví Giao Dịch\" thành \"Biệt Danh Ví\"\n② Hợp nhất nơi lưu trữ biệt danh ví thành một chỗ — biệt danh mới nhất luôn hiển thị bất kể đăng ký ở đâu\n③ Tính Thuế: thiết kế lại để chọn phương pháp (FIFO/Bình Quân Gia Quyền) trước, sau đó chỉ chọn các ví có gắn nhãn đó",
  pt: "📢 Aviso de atualização (2026-07-21)\n\n① Renomeado \"Carteiras de Transação\" para \"Apelido de Carteira\"\n② Unificado o armazenamento de apelidos de carteira em um só lugar — o apelido mais recente sempre aparece, não importa onde foi registrado\n③ Cálculo de Impostos: reformulado para escolher o método (FIFO/Média Móvel) primeiro, depois selecionar apenas as carteiras com essa etiqueta",
  ms: "📢 Notis Kemas Kini (2026-07-21)\n\n① Menamakan semula \"Dompet Transaksi\" kepada \"Alias Dompet\"\n② Menyatukan storan alias dompet ke satu tempat — alias terkini sentiasa dipaparkan tidak kira di mana ia didaftarkan\n③ Pengiraan Cukai: direka semula untuk memilih kaedah (FIFO/Purata Bergerak) dahulu, kemudian hanya memilih dompet yang bertag kaedah tersebut",
  tl: "📢 Abiso sa Update (2026-07-21)\n\n① Pinalitan ang pangalan ng \"Wallet ng Transaksyon\" tungo sa \"Alyas ng Wallet\"\n② Pinag-isa ang imbakan ng alyas ng wallet sa isang lugar — laging ipinapakita ang pinakabagong alyas saan man ito na-register\n③ Kalkulasyon ng Buwis: binago para piliin muna ang method (FIFO/Moving Average), pagkatapos ay piliin lang ang mga wallet na naka-tag doon",
  hi: "📢 अपडेट सूचना (2026-07-21)\n\n① \"लेनदेन वॉलेट\" का नाम बदलकर \"वॉलेट उपनाम\" किया गया\n② वॉलेट उपनाम को एक ही जगह संग्रहीत करने के लिए एकीकृत किया गया — चाहे कहीं भी पंजीकृत करें, हमेशा नवीनतम उपनाम दिखेगा\n③ कर गणना: पहले विधि (FIFO/मूविंग एवरेज) चुनें, फिर उसी विधि वाले वॉलेट चुनकर गणना करें, इस तरह सुधारा गया",
  ar: "📢 إشعار التحديث (2026-07-21)\n\n① إعادة تسمية \"محافظ المعاملات\" إلى \"اسم مستعار للمحفظة\"\n② توحيد تخزين أسماء المحافظ المستعارة في مكان واحد — يظهر دائمًا أحدث اسم مستعار بغض النظر عن مكان تسجيله\n③ حساب الضرائب: أعيد تصميمه لاختيار الطريقة (FIFO/المتوسط المتحرك) أولاً، ثم اختيار المحافظ الموسومة بتلك الطريقة فقط",
  ru: "📢 Уведомление об обновлении (2026-07-21)\n\n① «Торговые кошельки» переименованы в «Псевдонимы кошельков»\n② Хранение псевдонимов кошельков объединено в одном месте — всегда отображается самый актуальный псевдоним, независимо от того, где он был зарегистрирован\n③ Расчёт налогов: переработан — сначала выбирается метод (FIFO/скользящее среднее), затем только кошельки с этой меткой",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-21)\n\n① \"লেনদেন ওয়ালেট\"-এর নাম পরিবর্তন করে \"ওয়ালেট ডাকনাম\" করা হয়েছে\n② ওয়ালেট ডাকনাম সংরক্ষণের স্থান একীভূত করা হয়েছে — যেখানেই নিবন্ধন করুন না কেন সবসময় সর্বশেষ ডাকনাম দেখাবে\n③ কর গণনা: প্রথমে পদ্ধতি (FIFO/মুভিং এভারেজ) নির্বাচন করে তারপর শুধু সেই পদ্ধতির ট্যাগ করা ওয়ালেট বেছে গণনা করার জন্য পুনর্নকশা করা হয়েছে",
  sw: "📢 Taarifa ya Sasisho (2026-07-21)\n\n① Imebadilisha jina \"Pochi za Miamala\" kuwa \"Jina Bandia la Pochi\"\n② Imeunganisha uhifadhi wa majina bandia ya pochi mahali pamoja — jina bandia la hivi karibuni huonyeshwa daima popote lilipandikizwa\n③ Hesabu ya Kodi: imebuniwa upya kuchagua mbinu (FIFO/Wastani Unaosonga) kwanza, kisha kuchagua pochi zenye lebo ya mbinu hiyo pekee",
  th: "📢 แจ้งอัปเดต (2026-07-21)\n\n① เปลี่ยนชื่อ \"กระเป๋าคู่ค้า\" เป็น \"ชื่อเล่นกระเป๋า\"\n② รวมที่จัดเก็บชื่อเล่นกระเป๋าให้เป็นที่เดียว — แสดงชื่อเล่นล่าสุดเสมอไม่ว่าจะลงทะเบียนจากที่ไหน\n③ คำนวณภาษี: ปรับปรุงให้เลือกวิธี (FIFO/ถัวเฉลี่ยเคลื่อนที่) ก่อน แล้วเลือกเฉพาะกระเป๋าที่แท็กวิธีนั้นมาคำนวณ",
  tr: "📢 Güncelleme Bildirimi (2026-07-21)\n\n① \"İşlem Cüzdanları\" adı \"Cüzdan Takma Adı\" olarak değiştirildi\n② Cüzdan takma adı depolaması tek bir yerde birleştirildi — nerede kaydedilirse edilsin her zaman en güncel takma ad gösterilir\n③ Vergi Hesaplama: önce yöntem (FIFO/Hareketli Ortalama) seçilip, ardından yalnızca o yöntemle etiketlenmiş cüzdanların seçilmesi şeklinde yeniden tasarlandı",
};

const NOTICE_PREV = {
  version: '2026-07-20',
  ko: "📢 업데이트 안내 (2026-07-20)\n\n① 트래커 탭에 \"세금계산\" 신규 메뉴 추가 — FIFO/이동평균법 자동 계산, 상대 지갑별 방식 태그, 세무서 제출용 보고서(기간·지갑 선택) 지원\n② 퀴즈 정답 표시 후 남은 목숨 하트가 실제보다 1개 많게 보이던 표시 오류 수정\n③ 세금계산의 수동 단가 데이터를 아이디별로 분리 저장하도록 개선 (같은 지갑이라도 남이 입력한 값에 영향받지 않음)",
  en: "📢 Update Notice (2026-07-20)\n\n① Added a new \"Tax Calculation\" menu to the Tracker tab — automatic FIFO/Moving-Average calculation, per-counterparty costing method tags, and a report for tax filing (with wallet/period selection)\n② Fixed a display bug where the remaining-lives heart count showed one more than actual after answering a quiz question\n③ Improved manual price data in Tax Calculation to be stored separately per account (no longer affected by values entered by others on the same wallet)",
  zh: "📢 更新通知 (2026-07-20)\n\n① Tracker标签页新增\"税务计算\"菜单 — 自动计算FIFO/移动平均法，按对方钱包设置计算方式标签，并支持报税用报告（可选择钱包和期间）\n② 修复了答题后剩余生命心形图标多显示一个的问题\n③ 改进了税务计算中手动单价数据的存储方式，现在按账号分开保存（同一钱包不再受他人输入值影响）",
  id: "📢 Pemberitahuan Pembaruan (2026-07-20)\n\n① Menambahkan menu baru \"Kalkulasi Pajak\" di tab Tracker — kalkulasi otomatis FIFO/Rata-rata Bergerak, tag metode perhitungan per dompet rekanan, dan laporan untuk pelaporan pajak (dengan pemilihan dompet/periode)\n② Memperbaiki bug tampilan di mana jumlah hati nyawa tersisa menunjukkan satu lebih banyak dari yang sebenarnya setelah menjawab kuis\n③ Meningkatkan penyimpanan data harga manual di Kalkulasi Pajak agar terpisah per akun (tidak lagi terpengaruh nilai yang dimasukkan orang lain pada dompet yang sama)",
  ja: "📢 アップデートのお知らせ (2026-07-20)\n\n① トラッカータブに新しい「税金計算」メニューを追加 — FIFO/移動平均法の自動計算、相手ウォレットごとの計算方式タグ、税務署提出用レポート（ウォレット・期間選択対応）\n② クイズ回答後に残りライフのハート表示が実際より1つ多く表示される不具合を修正\n③ 税金計算の手動単価データをアカウントごとに分離保存するよう改善（同じウォレットでも他人が入力した値の影響を受けなくなりました）",
  es: "📢 Aviso de actualización (2026-07-20)\n\n① Se añadió un nuevo menú \"Cálculo de Impuestos\" en la pestaña Tracker — cálculo automático FIFO/Promedio Móvil, etiquetas de método por cartera de contraparte, e informe para declaración de impuestos (con selección de cartera/período)\n② Se corrigió un error visual donde el conteo de corazones de vidas restantes mostraba uno más de lo real después de responder una pregunta\n③ Se mejoró el almacenamiento de precios manuales en Cálculo de Impuestos para que sea independiente por cuenta (ya no se ve afectado por valores ingresados por otros en la misma cartera)",
  fr: "📢 Avis de mise à jour (2026-07-20)\n\n① Ajout d'un nouveau menu « Calcul Fiscal » dans l'onglet Tracker — calcul automatique FIFO/Moyenne Mobile, étiquettes de méthode par portefeuille de contrepartie, et rapport pour déclaration fiscale (avec sélection de portefeuille/période)\n② Correction d'un bug d'affichage où le nombre de cœurs de vies restantes affichait un de plus que la réalité après avoir répondu à une question\n③ Amélioration du stockage des prix manuels dans le Calcul Fiscal, désormais séparé par compte (n'est plus affecté par les valeurs saisies par d'autres sur le même portefeuille)",
  vi: "📢 Thông báo cập nhật (2026-07-20)\n\n① Đã thêm menu \"Tính Thuế\" mới vào tab Tracker — tự động tính FIFO/Bình Quân Gia Quyền, gắn nhãn phương pháp theo từng ví đối tác, và báo cáo nộp thuế (có thể chọn ví/kỳ)\n② Đã sửa lỗi hiển thị số tim mạng sống còn lại nhiều hơn thực tế 1 sau khi trả lời câu hỏi\n③ Cải thiện cách lưu trữ dữ liệu giá thủ công trong Tính Thuế để tách riêng theo từng tài khoản (không còn bị ảnh hưởng bởi giá trị người khác nhập trên cùng một ví)",
  pt: "📢 Aviso de atualização (2026-07-20)\n\n① Adicionado novo menu \"Cálculo de Impostos\" na aba Tracker — cálculo automático FIFO/Média Móvel, etiquetas de método por carteira de contraparte, e relatório para declaração de impostos (com seleção de carteira/período)\n② Corrigido um erro de exibição em que o número de corações de vidas restantes mostrava um a mais que o real após responder uma pergunta\n③ Melhorado o armazenamento de preços manuais no Cálculo de Impostos para ser separado por conta (não é mais afetado por valores inseridos por outras pessoas na mesma carteira)",
  ms: "📢 Notis Kemas Kini (2026-07-20)\n\n① Menambah menu baharu \"Pengiraan Cukai\" pada tab Tracker — pengiraan automatik FIFO/Purata Bergerak, tag kaedah mengikut dompet rakan niaga, dan laporan untuk pemfailan cukai (dengan pemilihan dompet/tempoh)\n② Membetulkan pepijat paparan di mana bilangan hati nyawa yang tinggal menunjukkan satu lebih banyak daripada sebenar selepas menjawab soalan kuiz\n③ Menambah baik penyimpanan harga manual dalam Pengiraan Cukai supaya berasingan mengikut akaun (tidak lagi terjejas oleh nilai yang dimasukkan oleh orang lain pada dompet yang sama)",
  tl: "📢 Abiso sa Update (2026-07-20)\n\n① Nagdagdag ng bagong menu na \"Kalkulasyon ng Buwis\" sa Tracker tab — awtomatikong FIFO/Moving Average na kalkulasyon, tag ng costing method kada counterparty wallet, at ulat para sa pag-file ng buwis (may pagpili ng wallet/panahon)\n② Naayos ang display bug kung saan ang bilang ng heart ng natitirang buhay ay nagpapakita ng isa pang labis kaysa sa totoo pagkatapos sumagot ng tanong\n③ Pinabuting imbakan ng manual price sa Kalkulasyon ng Buwis para hiwalay bawat account (hindi na maaapektuhan ng value na inilagay ng iba sa parehong wallet)",
  hi: "📢 अपडेट सूचना (2026-07-20)\n\n① ट्रैकर टैब में नया \"कर गणना\" मेनू जोड़ा गया — स्वचालित FIFO/मूविंग एवरेज गणना, प्रति प्रतिपक्ष वॉलेट गणना विधि टैग, और कर फाइलिंग के लिए रिपोर्ट (वॉलेट/अवधि चयन सहित)\n② क्विज़ का उत्तर देने के बाद शेष जीवन के हृदय की संख्या वास्तविक से एक अधिक दिखने की समस्या ठीक की गई\n③ कर गणना में मैन्युअल कीमत डेटा को अकाउंट के हिसाब से अलग-अलग सहेजने के लिए सुधारा गया (अब वही वॉलेट होने पर भी दूसरों द्वारा डाले गए मान से प्रभावित नहीं होता)",
  ar: "📢 إشعار التحديث (2026-07-20)\n\n① تمت إضافة قائمة جديدة \"حساب الضرائب\" إلى تبويب Tracker — حساب تلقائي بطريقة FIFO/المتوسط المتحرك، وسم طريقة الحساب لكل محفظة مقابلة، وتقرير لتقديم الإقرار الضريبي (مع اختيار المحفظة/الفترة)\n② تم إصلاح خطأ في العرض كان يُظهر عدد قلوب الأرواح المتبقية أكبر بواحد من العدد الفعلي بعد الإجابة على سؤال\n③ تحسين تخزين الأسعار اليدوية في حساب الضرائب لتكون منفصلة لكل حساب (لم تعد تتأثر بالقيم التي يدخلها آخرون على نفس المحفظة)",
  ru: "📢 Уведомление об обновлении (2026-07-20)\n\n① В раздел Tracker добавлено новое меню «Расчёт налогов» — автоматический расчёт по FIFO/скользящему среднему, метки метода расчёта для каждого кошелька-контрагента, и отчёт для подачи в налоговую (с выбором кошелька/периода)\n② Исправлена ошибка отображения, из-за которой количество сердечек оставшихся жизней показывалось на одно больше, чем есть на самом деле, после ответа на вопрос\n③ Улучшено хранение вручную заданных цен в Расчёте налогов — теперь они хранятся отдельно для каждого аккаунта (больше не подвержены влиянию значений, введённых другими для того же кошелька)",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-07-20)\n\n① Tracker ট্যাবে নতুন \"কর গণনা\" মেনু যোগ করা হয়েছে — স্বয়ংক্রিয় FIFO/মুভিং এভারেজ গণনা, প্রতিটি প্রতিপক্ষ ওয়ালেটের জন্য পদ্ধতি ট্যাগ, এবং কর ফাইলিংয়ের জন্য প্রতিবেদন (ওয়ালেট/সময়কাল নির্বাচনসহ)\n② প্রশ্নের উত্তর দেওয়ার পর অবশিষ্ট জীবনের হৃদয় সংখ্যা প্রকৃতের চেয়ে একটি বেশি দেখানোর সমস্যা সমাধান করা হয়েছে\n③ কর গণনায় ম্যানুয়াল দাম ডেটা প্রতিটি অ্যাকাউন্টের জন্য আলাদাভাবে সংরক্ষণ করার জন্য উন্নত করা হয়েছে (একই ওয়ালেটে অন্যদের দেওয়া মান দ্বারা আর প্রভাবিত হবে না)",
  sw: "📢 Taarifa ya Sasisho (2026-07-20)\n\n① Imeongeza menyu mpya ya \"Hesabu ya Kodi\" katika kichupo cha Tracker — hesabu otomatiki ya FIFO/Wastani Unaosonga, lebo za mbinu kwa kila pochi ya mshirika, na ripoti kwa ajili ya kuwasilisha kodi (ikiwa na uchaguzi wa pochi/kipindi)\n② Imerekebisha hitilafu ya uonyeshaji ambapo idadi ya mioyo ya maisha yaliyobaki ilionyesha moja zaidi ya halisi baada ya kujibu swali\n③ Imeboresha uhifadhi wa bei za mkono katika Hesabu ya Kodi ili zihifadhiwe tofauti kwa kila akaunti (haziathiriwi tena na thamani zilizowekwa na wengine kwenye pochi ile ile)",
  th: "📢 แจ้งอัปเดต (2026-07-20)\n\n① เพิ่มเมนู \"คำนวณภาษี\" ใหม่ในแท็บ Tracker — คำนวณ FIFO/ถัวเฉลี่ยเคลื่อนที่อัตโนมัติ, แท็กวิธีคำนวณตามกระเป๋าคู่ค้าแต่ละใบ, และรายงานสำหรับยื่นภาษี (เลือกกระเป๋า/ช่วงเวลาได้)\n② แก้ไขข้อบกพร่องการแสดงผลที่จำนวนหัวใจชีวิตที่เหลือแสดงมากกว่าความจริงหนึ่งดวงหลังจากตอบคำถาม\n③ ปรับปรุงการจัดเก็บราคาแบบกำหนดเองในคำนวณภาษีให้แยกตามบัญชี (ไม่ได้รับผลกระทบจากค่าที่ผู้อื่นกรอกในกระเป๋าเดียวกันอีกต่อไป)",
  tr: "📢 Güncelleme Bildirimi (2026-07-20)\n\n① Tracker sekmesine yeni \"Vergi Hesaplama\" menüsü eklendi — otomatik FIFO/Hareketli Ortalama hesaplama, karşı taraf cüzdanı başına maliyet yöntemi etiketleri ve vergi beyanı için rapor (cüzdan/dönem seçimiyle)\n② Bir soruyu cevapladıktan sonra kalan can kalp sayısının gerçekte olduğundan bir fazla gösterildiği görüntüleme hatası düzeltildi\n③ Vergi Hesaplama'daki manuel fiyat verilerinin hesap bazında ayrı saklanması sağlandı (artık aynı cüzdanda başkalarının girdiği değerlerden etkilenmiyor)",
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
