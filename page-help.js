import { t, getLang } from './util-i18n.js';
import { createDonation, createSubscriptionPayment, currentUser } from './pi-sdk.js';
import { isSubscribed, setSubscription, getSubscriptionExpiry } from './util-storage.js';
import { updateHeaderUsername } from './app.js';

const SUB_STRINGS = {
  ko: {
    title: '⭐ 월간 이용권',
    desc: '1π · 1개월 이용권\n✓ 이용권 혜택은 추후 공지 예정\n✓ 유효기간 30일',
    expiry: '만료일',
    buyBtn: '1π 이용권 구매 (1개월)',
    restoreBtn: '이용권 복구',
    ok: '이용권이 활성화되었습니다!',
    restoreOk: '이용권 복구 완료!',
    restoreAlready: '이미 이용권이 활성화되어 있습니다.',
    restoreNone: '서버에 이용권 정보가 없습니다.',
    restoreErr: '서버 연결 오류. 잠시 후 다시 시도해 주세요.',
    err: 'Pi Browser에서만 결제가 가능합니다.',
  },
  en: {
    title: '⭐ Monthly Pass',
    desc: '1π · 1-month pass\n✓ Benefits to be announced\n✓ Valid for 30 days',
    expiry: 'Expires',
    buyBtn: 'Buy 1-Month Pass · 1π',
    restoreBtn: 'Restore Pass',
    ok: 'Pass activated!',
    restoreOk: 'Pass restored!',
    restoreAlready: 'Pass is already active.',
    restoreNone: 'No pass found on server.',
    restoreErr: 'Server error. Please try again later.',
    err: 'Payment is only available inside Pi Browser.',
  },
  id: {
    title: '⭐ Paket Bulanan',
    desc: '1π · Paket 1 bulan\n✓ Manfaat akan diumumkan\n✓ Berlaku 30 hari',
    expiry: 'Kedaluwarsa',
    buyBtn: 'Beli Paket 1 Bulan · 1π',
    restoreBtn: 'Pulihkan Paket',
    ok: 'Paket diaktifkan!',
    restoreOk: 'Paket berhasil dipulihkan!',
    restoreAlready: 'Paket sudah aktif.',
    restoreNone: 'Tidak ada paket di server.',
    restoreErr: 'Kesalahan server. Coba lagi nanti.',
    err: 'Pembayaran hanya tersedia di Pi Browser.',
  },
  vi: {
    title: '⭐ Gói Tháng',
    desc: '1π · Gói 1 tháng\n✓ Quyền lợi sẽ được thông báo\n✓ Hiệu lực 30 ngày',
    expiry: 'Hết hạn',
    buyBtn: 'Mua Gói 1 Tháng · 1π',
    restoreBtn: 'Khôi phục Gói',
    ok: 'Gói đã được kích hoạt!',
    restoreOk: 'Khôi phục gói thành công!',
    restoreAlready: 'Gói đã được kích hoạt.',
    restoreNone: 'Không tìm thấy gói trên máy chủ.',
    restoreErr: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    err: 'Thanh toán chỉ khả dụng trong Pi Browser.',
  },
  zh: {
    title: '⭐ 月度使用权',
    desc: '1π · 1个月使用权\n✓ 权益即将公告\n✓ 有效期30天',
    expiry: '到期日',
    buyBtn: '购买1个月使用权 · 1π',
    restoreBtn: '恢复使用权',
    ok: '使用权已激活！',
    restoreOk: '使用权恢复完成！',
    restoreAlready: '使用权已激活。',
    restoreNone: '服务器上没有使用权信息。',
    restoreErr: '服务器错误，请稍后重试。',
    err: '仅可在Pi Browser内付款。',
  },
  ja: {
    title: '⭐ 月間利用券',
    desc: '1π · 1ヶ月利用券\n✓ 特典は追って公開予定\n✓ 有効期間30日',
    expiry: '有効期限',
    buyBtn: '1ヶ月利用券を購入 · 1π',
    restoreBtn: '利用券を復元',
    ok: '利用券が有効になりました！',
    restoreOk: '利用券の復元完了！',
    restoreAlready: '利用券はすでに有効です。',
    restoreNone: 'サーバーに利用券情報がありません。',
    restoreErr: 'サーバーエラー。しばらくしてから再試行してください。',
    err: 'Pi Browser内でのみお支払いが可能です。',
  },
  tl: {
    title: '⭐ Buwanang Pass',
    desc: '1π · Pass na 1 buwan\n✓ Mga benepisyo ay iaanunsyo\n✓ Valid ng 30 araw',
    expiry: 'Mag-e-expire',
    buyBtn: 'Bilhin ang 1 Buwang Pass · 1π',
    restoreBtn: 'I-restore ang Pass',
    ok: 'Na-activate ang pass!',
    restoreOk: 'Na-restore ang pass!',
    restoreAlready: 'Aktibo na ang pass.',
    restoreNone: 'Walang pass na nahanap sa server.',
    restoreErr: 'Server error. Subukan muli mamaya.',
    err: 'Available lang ang bayad sa loob ng Pi Browser.',
  },
  hi: {
    title: '⭐ मासिक पास',
    desc: '1π · 1 माह का पास\n✓ लाभ जल्द घोषित किए जाएंगे\n✓ 30 दिन के लिए वैध',
    expiry: 'समाप्ति',
    buyBtn: '1 माह का पास खरीदें · 1π',
    restoreBtn: 'पास पुनर्स्थापित करें',
    ok: 'पास सक्रिय हो गया!',
    restoreOk: 'पास पुनर्स्थापित हुआ!',
    restoreAlready: 'पास पहले से सक्रिय है।',
    restoreNone: 'सर्वर पर कोई पास नहीं मिला।',
    restoreErr: 'सर्वर त्रुटि। बाद में पुनः प्रयास करें।',
    err: 'भुगतान केवल Pi Browser में उपलब्ध है।',
  },
  es: {
    title: '⭐ Pase Mensual',
    desc: '1π · Pase de 1 mes\n✓ Beneficios próximamente\n✓ Válido 30 días',
    expiry: 'Vence el',
    buyBtn: 'Comprar Pase 1 Mes · 1π',
    restoreBtn: 'Restaurar Pase',
    ok: '¡Pase activado!',
    restoreOk: '¡Pase restaurado!',
    restoreAlready: 'El pase ya está activo.',
    restoreNone: 'No se encontró pase en el servidor.',
    restoreErr: 'Error de servidor. Inténtalo de nuevo más tarde.',
    err: 'El pago solo está disponible dentro de Pi Browser.',
  },
  pt: {
    title: '⭐ Passe Mensal',
    desc: '1π · Passe de 1 mês\n✓ Benefícios a serem anunciados\n✓ Válido por 30 dias',
    expiry: 'Expira em',
    buyBtn: 'Comprar Passe 1 Mês · 1π',
    restoreBtn: 'Restaurar Passe',
    ok: 'Passe ativado!',
    restoreOk: 'Passe restaurado!',
    restoreAlready: 'O passe já está ativo.',
    restoreNone: 'Nenhum passe encontrado no servidor.',
    restoreErr: 'Erro no servidor. Tente novamente mais tarde.',
    err: 'O pagamento só está disponível no Pi Browser.',
  },
  fr: {
    title: '⭐ Pass Mensuel',
    desc: '1π · Pass d\'1 mois\n✓ Avantages à venir\n✓ Valable 30 jours',
    expiry: 'Expire le',
    buyBtn: 'Acheter Pass 1 Mois · 1π',
    restoreBtn: 'Restaurer le Pass',
    ok: 'Pass activé !',
    restoreOk: 'Pass restauré !',
    restoreAlready: 'Le pass est déjà actif.',
    restoreNone: 'Aucun pass trouvé sur le serveur.',
    restoreErr: 'Erreur serveur. Veuillez réessayer plus tard.',
    err: 'Le paiement n\'est disponible que dans Pi Browser.',
  },
  ru: {
    title: '⭐ Месячный Пропуск',
    desc: '1π · Пропуск на 1 месяц\n✓ Преимущества будут объявлены\n✓ Действителен 30 дней',
    expiry: 'Истекает',
    buyBtn: 'Купить пропуск на 1 месяц · 1π',
    restoreBtn: 'Восстановить пропуск',
    ok: 'Пропуск активирован!',
    restoreOk: 'Пропуск восстановлен!',
    restoreAlready: 'Пропуск уже активен.',
    restoreNone: 'Пропуск не найден на сервере.',
    restoreErr: 'Ошибка сервера. Повторите попытку позже.',
    err: 'Оплата доступна только в Pi Browser.',
  },
  tr: {
    title: '⭐ Aylık Geçiş',
    desc: '1π · 1 aylık geçiş\n✓ Avantajlar yakında açıklanacak\n✓ 30 gün geçerli',
    expiry: 'Sona erme',
    buyBtn: '1 Aylık Geçiş Satın Al · 1π',
    restoreBtn: 'Geçişi Geri Yükle',
    ok: 'Geçiş etkinleştirildi!',
    restoreOk: 'Geçiş geri yüklendi!',
    restoreAlready: 'Geçiş zaten aktif.',
    restoreNone: 'Sunucuda geçiş bulunamadı.',
    restoreErr: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
    err: 'Ödeme yalnızca Pi Browser içinde mevcuttur.',
  },
  ar: {
    title: '⭐ تصريح شهري',
    desc: '1π · تصريح لمدة شهر\n✓ المزايا ستُعلَن قريباً\n✓ صالح 30 يوماً',
    expiry: 'ينتهي في',
    buyBtn: 'شراء تصريح شهر · 1π',
    restoreBtn: 'استعادة التصريح',
    ok: 'تم تفعيل التصريح!',
    restoreOk: 'تم استعادة التصريح!',
    restoreAlready: 'التصريح مفعّل بالفعل.',
    restoreNone: 'لم يُعثر على تصريح في الخادم.',
    restoreErr: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
    err: 'الدفع متاح فقط داخل Pi Browser.',
  },
  bn: {
    title: '⭐ মাসিক পাস',
    desc: '1π · ১ মাসের পাস\n✓ সুবিধা শীঘ্রই ঘোষণা করা হবে\n✓ ৩০ দিনের জন্য বৈধ',
    expiry: 'মেয়াদ শেষ',
    buyBtn: '১ মাসের পাস কিনুন · 1π',
    restoreBtn: 'পাস পুনরুদ্ধার করুন',
    ok: 'পাস সক্রিয় হয়েছে!',
    restoreOk: 'পাস পুনরুদ্ধার হয়েছে!',
    restoreAlready: 'পাস ইতিমধ্যে সক্রিয় আছে।',
    restoreNone: 'সার্ভারে কোনো পাস পাওয়া যায়নি।',
    restoreErr: 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।',
    err: 'পেমেন্ট শুধুমাত্র Pi Browser-এর ভেতরে উপলব্ধ।',
  },
  th: {
    title: '⭐ พาสรายเดือน',
    desc: '1π · พาส 1 เดือน\n✓ สิทธิประโยชน์จะประกาศเร็วๆ นี้\n✓ ใช้ได้ 30 วัน',
    expiry: 'หมดอายุ',
    buyBtn: 'ซื้อพาส 1 เดือน · 1π',
    restoreBtn: 'กู้คืนพาส',
    ok: 'เปิดใช้พาสแล้ว!',
    restoreOk: 'กู้คืนพาสสำเร็จ!',
    restoreAlready: 'พาสเปิดใช้งานอยู่แล้ว',
    restoreNone: 'ไม่พบพาสบนเซิร์ฟเวอร์',
    restoreErr: 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง',
    err: 'ชำระเงินได้เฉพาะใน Pi Browser เท่านั้น',
  },
  ms: {
    title: '⭐ Pas Bulanan',
    desc: '1π · Pas 1 bulan\n✓ Faedah akan diumumkan\n✓ Sah selama 30 hari',
    expiry: 'Tamat',
    buyBtn: 'Beli Pas 1 Bulan · 1π',
    restoreBtn: 'Pulihkan Pas',
    ok: 'Pas diaktifkan!',
    restoreOk: 'Pas berjaya dipulihkan!',
    restoreAlready: 'Pas sudah aktif.',
    restoreNone: 'Tiada pas dijumpai di pelayan.',
    restoreErr: 'Ralat pelayan. Sila cuba lagi kemudian.',
    err: 'Pembayaran hanya tersedia di dalam Pi Browser.',
  },
  sw: {
    title: '⭐ Pasi ya Kila Mwezi',
    desc: '1π · Pasi ya mwezi 1\n✓ Faida zitatangazwa hivi karibuni\n✓ Inatumika kwa siku 30',
    expiry: 'Inaisha',
    buyBtn: 'Nunua Pasi ya Mwezi 1 · 1π',
    restoreBtn: 'Rejesha Pasi',
    ok: 'Pasi imeamilishwa!',
    restoreOk: 'Pasi imerejeshlewa!',
    restoreAlready: 'Pasi tayari iko hai.',
    restoreNone: 'Hakuna pasi iliyopatikana kwenye seva.',
    restoreErr: 'Hitilafu ya seva. Tafadhali jaribu tena baadaye.',
    err: 'Malipo yanapatikana tu ndani ya Pi Browser.',
  },
};
function getSubStrings() {
  const lang = getLang();
  return SUB_STRINGS[lang] || SUB_STRINGS['en'];
}

const CONTACT_STRINGS = {
  ko: { title:'📮 문의 및 피드백', desc:'사용 중 문의사항이나 피드백은 유튜브 채널 댓글로 남겨주세요.', copyBtn:'복사', copied:'복사됨', copyNote:'위 주소를 복사 후 유튜브에서 검색해주세요.' },
  en: { title:'📮 Contact & Feedback', desc:'Leave questions or feedback in the YouTube channel comments.', copyBtn:'Copy', copied:'Copied!', copyNote:'Copy the URL above and search in YouTube.' },
  id: { title:'📮 Kontak & Masukan', desc:'Tinggalkan pertanyaan atau masukan di kolom komentar YouTube.', copyBtn:'Salin', copied:'Tersalin!', copyNote:'Salin URL di atas lalu cari di YouTube.' },
  vi: { title:'📮 Liên hệ & Phản hồi', desc:'Hãy để lại câu hỏi hoặc phản hồi trong phần bình luận kênh YouTube.', copyBtn:'Sao chép', copied:'Đã sao chép!', copyNote:'Sao chép URL phía trên và tìm kiếm trên YouTube.' },
  zh: { title:'📮 联系及反馈', desc:'如有使用问题或反馈，请在YouTube频道评论区留言。', copyBtn:'复制', copied:'已复制！', copyNote:'复制上方地址后在YouTube搜索。' },
  ja: { title:'📮 お問い合わせとフィードバック', desc:'ご不明な点やフィードバックはYouTubeチャンネルのコメント欄にお寄せください。', copyBtn:'コピー', copied:'コピーしました！', copyNote:'上記URLをコピーしてYouTubeで検索してください。' },
  tl: { title:'📮 Makipag-ugnayan at Feedback', desc:'Mag-iwan ng mga tanong o feedback sa mga komento ng YouTube channel.', copyBtn:'Kopyahin', copied:'Nakopya na!', copyNote:'Kopyahin ang URL sa itaas at hanapin sa YouTube.' },
  hi: { title:'📮 संपर्क और फीडबैक', desc:'प्रश्न या फीडबैक YouTube चैनल के कमेंट में छोड़ें।', copyBtn:'कॉपी करें', copied:'कॉपी हो गया!', copyNote:'ऊपर का URL कॉपी करें और YouTube पर खोजें।' },
  bn: { title:'📮 যোগাযোগ ও মতামত', desc:'YouTube চ্যানেলের মন্তব্যে প্রশ্ন বা মতামত রাখুন।', copyBtn:'কপি করুন', copied:'কপি হয়েছে!', copyNote:'উপরের URL কপি করুন এবং YouTube-এ খুঁজুন।' },
  th: { title:'📮 ติดต่อและข้อเสนอแนะ', desc:'ฝากคำถามหรือข้อเสนอแนะในคอมเมนต์ช่อง YouTube', copyBtn:'คัดลอก', copied:'คัดลอกแล้ว!', copyNote:'คัดลอก URL ด้านบนแล้วค้นหาใน YouTube' },
  ms: { title:'📮 Hubungi & Maklum Balas', desc:'Tinggalkan soalan atau maklum balas dalam komen saluran YouTube.', copyBtn:'Salin', copied:'Disalin!', copyNote:'Salin URL di atas dan cari di YouTube.' },
  es: { title:'📮 Contacto y Comentarios', desc:'Deje preguntas o comentarios en los comentarios del canal de YouTube.', copyBtn:'Copiar', copied:'¡Copiado!', copyNote:'Copie la URL de arriba y búsquela en YouTube.' },
  pt: { title:'📮 Contato e Feedback', desc:'Deixe perguntas ou feedback nos comentários do canal do YouTube.', copyBtn:'Copiar', copied:'Copiado!', copyNote:'Copie a URL acima e pesquise no YouTube.' },
  fr: { title:'📮 Contact et Retours', desc:'Laissez vos questions ou commentaires dans les commentaires de la chaîne YouTube.', copyBtn:'Copier', copied:'Copié !', copyNote:"Copiez l'URL ci-dessus et recherchez sur YouTube." },
  ru: { title:'📮 Связь и Отзывы', desc:'Оставляйте вопросы или отзывы в комментариях YouTube-канала.', copyBtn:'Копировать', copied:'Скопировано!', copyNote:'Скопируйте URL выше и найдите на YouTube.' },
  tr: { title:'📮 İletişim ve Geri Bildirim', desc:'Sorularınızı veya geri bildiriminizi YouTube kanal yorumlarına bırakın.', copyBtn:'Kopyala', copied:'Kopyalandı!', copyNote:"Yukarıdaki URL'yi kopyalayıp YouTube'da arayın." },
  ar: { title:'📮 التواصل والملاحظات', desc:'اترك أسئلتك أو ملاحظاتك في تعليقات قناة YouTube.', copyBtn:'نسخ', copied:'تم النسخ!', copyNote:'انسخ الرابط أعلاه وابحث عنه في YouTube.' },
  sw: { title:'📮 Mawasiliano na Maoni', desc:'Acha maswali au maoni katika maoni ya channel ya YouTube.', copyBtn:'Nakili', copied:'Imenakiliwa!', copyNote:'Nakili URL hapo juu na utafute kwenye YouTube.' },
};

const HELP_CONTENT = {
  ko: {
    title: '도움말',
    sections: [
      {
        title: '🎮 게임 방법',
        items: [
          '게임 모드(⛏️ Miner · 🚀 Pioneer · 🔱 Validator)를 선택하고 퀴즈를 시작하세요.',
          '4지선다 문제에서 정답을 고르세요.',
          '정답 선택 후 해설을 확인하고 다음 문제로 넘어가세요.',
          '한 번 푼 문제는 다시 출제되지 않습니다.',
          '모드 진행 중 \'포기하기\' 버튼으로 현재 점수를 랭킹에 등록하고 모드를 재선택할 수 있습니다.',
        ],
      },
      {
        title: '❤️ 생명력 시스템 (모드별)',
        items: [
          '⛏️ Miner: 기본 2개 · 오답 시 -1 · 설문 4개 완료당 영구 +1 (최대 +2) · 퀴즈 10개 정답당 +1 · 통계/랭킹 조회 시 +1 (1시간마다)',
          '🚀 Pioneer: 기본 2개 · 오답 시 -1 · 설문 4개 완료당 영구 +1 (최대 +2)',
          '🔱 Validator: 생명 없음 · 오답 1개로 즉시 게임 종료',
          '생명력이 0이 되면 점수가 랭킹보드에 기록되고 새 게임이 시작됩니다.',
        ],
      },
      {
        title: '⭐ 점수 시스템',
        items: [
          '초급 정답: +10점',
          '중급 정답: +20점',
          '고급 정답: +30점',
          '3연속 정답 보너스: +5점 추가',
          '설문 참여: +5점',
        ],
      },
      {
        title: '🏅 등급 시스템',
        items: [
          '🌱 탐색자: 0~200점',
          '📊 분석가: 201~500점',
          '⚡ 트레이더: 501~1000점',
          '🏦 마켓메이커: 1001~2000점',
          '🔱 전략가: 2001점 이상',
        ],
      },
      {
        title: '📋 커뮤니티 설문',
        items: [
          '초급 퀴즈 중간에 커뮤니티 설문이 나타납니다.',
          '설문은 Pi 파이오니어 현황 파악을 위한 것으로, 답변은 익명으로 처리됩니다.',
          '노드 관련 설문은 한 화면에서 한 번에 작성할 수 있습니다.',
          '건너뛰기 버튼으로 설문을 생략할 수 있습니다.',
        ],
      },
      {
        title: '🌐 다국어 지원',
        items: [
          '앱 소개 화면에서 언어를 변경할 수 있습니다.',
          '설문 항목과 UI는 선택한 언어로 표시됩니다.',
          '퀴즈 문항은 현재 한국어로만 제공됩니다. (추후 다국어 지원 예정)',
        ],
      },
      {
        title: '❓ 자주 묻는 질문',
        items: [
          'Q: Pi Browser가 없으면 사용 못하나요?\nA: 네, Pi Browser에서만 Pi SDK 로그인이 가능합니다.',
          'Q: 게임이 끝나면 기존 답변 기록은 사라지나요?\nA: 아니요. 점수·생명력만 초기화되고, 푼 문제 기록과 설문 답변은 유지됩니다.',
          'Q: 랭킹보드에 내 점수가 보이지 않아요.\nA: Firestore 인덱스 생성에 약간 시간이 걸릴 수 있습니다. 잠시 후 새로고침해 보세요.',
        ],
      },
    ],
    donation: {
      title: '💙 유틸 제작 지원',
      desc: '앱이 도움이 됐다면 소중한 후원 부탁드려요.<br>후원금은 앱 개발·운영·업데이트에 사용됩니다.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `${amount}π 후원 감사합니다! 💙`,
      errorMsg: 'Pi Browser에서만 후원이 가능합니다.',
    },
  },
  en: {
    title: 'Help',
    sections: [
      {
        title: '🎮 How to Play',
        items: [
          'Select a game mode (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) and start the quiz.',
          'Pick the correct answer from 4 options.',
          'After answering, read the explanation and move to the next question.',
          'Questions you\'ve already answered won\'t appear again.',
          'Use the \'Give Up\' button to submit your current score to the leaderboard and switch modes.',
        ],
      },
      {
        title: '❤️ Lives System (per mode)',
        items: [
          '⛏️ Miner: 2 starting lives · Wrong answer -1 · +1 permanent per 4 surveys (max +2) · +1 per 10 correct answers · +1 per stats/ranking view (every 1 hr)',
          '🚀 Pioneer: 2 starting lives · Wrong answer -1 · +1 permanent per 4 surveys (max +2)',
          '🔱 Validator: No lives · One wrong answer ends the game immediately',
          'When lives reach 0, your score is recorded to the leaderboard and a new game begins.',
        ],
      },
      {
        title: '⭐ Scoring',
        items: [
          'Beginner correct: +10 pts',
          'Intermediate correct: +20 pts',
          'Advanced correct: +30 pts',
          '3-streak bonus: +5 pts extra',
          'Survey participation: +5 pts',
        ],
      },
      {
        title: '🏅 Rank Tiers',
        items: [
          '🌱 Explorer: 0–200 pts',
          '📊 Analyst: 201–500 pts',
          '⚡ Trader: 501–1,000 pts',
          '🏦 Market Maker: 1,001–2,000 pts',
          '🔱 Strategist: 2,001+ pts',
        ],
      },
      {
        title: '📋 Community Survey',
        items: [
          'Surveys appear during Beginner quizzes.',
          'Answers are anonymous and used for Pi ecosystem research.',
          'Node-related questions are grouped into a single card.',
          'You can always skip a survey question.',
        ],
      },
      {
        title: '🌐 Multi-language',
        items: [
          'Change language on the app intro screen.',
          'Survey questions and UI adapt to your chosen language.',
          'Quiz questions are currently Korean only (more languages coming soon).',
        ],
      },
      {
        title: '❓ FAQ',
        items: [
          'Q: Do I need Pi Browser?\nA: Yes — Pi SDK login only works inside Pi Browser.',
          'Q: When the game ends, do I lose my answered questions?\nA: No. Only score and lives reset. Your question history and survey answers are kept.',
          'Q: My score isn\'t showing on the leaderboard.\nA: Firestore may take a moment to create the required index. Refresh after a minute.',
        ],
      },
    ],
    donation: {
      title: '💙 Support Development',
      desc: 'If you enjoy the app, a small tip goes a long way.<br>All support goes toward app development and updates.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Thank you for the ${amount}π tip! 💙`,
      errorMsg: 'Donations are only available inside Pi Browser.',
    },
  },
  id: {
    title: 'Bantuan',
    sections: [
      {
        title: '🎮 Cara Bermain',
        items: [
          'Pilih mode permainan (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) dan mulailah.',
          'Pilih jawaban yang benar dari 4 pilihan.',
          'Setelah menjawab, baca penjelasan dan lanjut ke soal berikutnya.',
          'Soal yang sudah dijawab tidak akan muncul lagi.',
          'Gunakan tombol \'Menyerah\' untuk mengirim skor ke papan peringkat dan ganti mode.',
        ],
      },
      {
        title: '❤️ Sistem Nyawa (per mode)',
        items: [
          '⛏️ Miner: 2 nyawa awal · Jawaban salah -1 · +1 permanen per 4 survei (maks +2) · +1 per 10 jawaban benar · +1 per lihat statistik/ranking (tiap 1 jam)',
          '🚀 Pioneer: 2 nyawa awal · Jawaban salah -1 · +1 permanen per 4 survei (maks +2)',
          '🔱 Validator: Tanpa nyawa · Satu jawaban salah langsung mengakhiri permainan',
          'Jika nyawa habis, skor disimpan ke papan peringkat dan permainan baru dimulai.',
        ],
      },
      {
        title: '⭐ Skor',
        items: [
          'Pemula benar: +10 poin',
          'Menengah benar: +20 poin',
          'Mahir benar: +30 poin',
          'Bonus 3 berturut-turut: +5 poin ekstra',
          'Partisipasi survei: +5 poin',
        ],
      },
      {
        title: '🏅 Tingkatan',
        items: [
          '🌱 Penjelajah: 0–200 poin',
          '📊 Analis: 201–500 poin',
          '⚡ Trader: 501–1.000 poin',
          '🏦 Market Maker: 1.001–2.000 poin',
          '🔱 Strategis: 2.001+ poin',
        ],
      },
      {
        title: '📋 Survei Komunitas',
        items: [
          'Survei muncul saat kuis Pemula.',
          'Jawaban bersifat anonim untuk riset ekosistem Pi.',
          'Pertanyaan tentang node dikelompokkan dalam satu kartu.',
          'Kamu bisa melewati survei kapan saja.',
        ],
      },
    ],
    donation: {
      title: '💙 Dukung Pengembangan',
      desc: 'Jika aplikasi ini bermanfaat, dukunganmu sangat berarti.<br>Semua dukungan digunakan untuk pengembangan aplikasi.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Terima kasih atas ${amount}π! 💙`,
      errorMsg: 'Donasi hanya tersedia di dalam Pi Browser.',
    },
  },
  vi: {
    title: 'Trợ giúp',
    sections: [
      {
        title: '🎮 Cách chơi',
        items: [
          'Chọn chế độ chơi (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) và bắt đầu.',
          'Chọn đáp án đúng trong 4 lựa chọn.',
          'Sau khi trả lời, đọc giải thích và chuyển sang câu hỏi tiếp theo.',
          'Các câu đã trả lời sẽ không xuất hiện lại.',
          'Dùng nút \'Bỏ cuộc\' để ghi điểm hiện tại lên bảng xếp hạng và đổi chế độ.',
        ],
      },
      {
        title: '❤️ Hệ thống mạng sống (theo chế độ)',
        items: [
          '⛏️ Miner: 2 mạng ban đầu · Sai -1 · +1 vĩnh viễn mỗi 4 khảo sát (tối đa +2) · +1 mỗi 10 câu đúng · +1 khi xem thống kê/bảng xếp hạng (mỗi 1 giờ)',
          '🚀 Pioneer: 2 mạng ban đầu · Sai -1 · +1 vĩnh viễn mỗi 4 khảo sát (tối đa +2)',
          '🔱 Validator: Không có mạng · Một câu sai là kết thúc ngay',
          'Khi hết mạng, điểm được ghi lên bảng xếp hạng và trò chơi mới bắt đầu.',
        ],
      },
      {
        title: '⭐ Tính điểm',
        items: [
          'Cơ bản đúng: +10 điểm',
          'Trung cấp đúng: +20 điểm',
          'Nâng cao đúng: +30 điểm',
          'Thưởng 3 liên tiếp: +5 điểm',
          'Tham gia khảo sát: +5 điểm',
        ],
      },
      {
        title: '🏅 Cấp bậc',
        items: [
          '🌱 Explorer: 0–200 điểm',
          '📊 Analyst: 201–500 điểm',
          '⚡ Trader: 501–1.000 điểm',
          '🏦 Market Maker: 1.001–2.000 điểm',
          '🔱 Strategist: 2.001+ điểm',
        ],
      },
      {
        title: '📋 Khảo sát cộng đồng',
        items: [
          'Khảo sát xuất hiện trong các câu hỏi Cơ bản.',
          'Câu trả lời ẩn danh, dùng cho nghiên cứu hệ sinh thái Pi.',
          'Câu hỏi về node được nhóm thành một thẻ duy nhất.',
          'Bạn có thể bỏ qua câu hỏi khảo sát bất cứ lúc nào.',
        ],
      },
      {
        title: '🌐 Đa ngôn ngữ',
        items: [
          'Thay đổi ngôn ngữ trên màn hình giới thiệu ứng dụng.',
          'Câu hỏi khảo sát và giao diện thích ứng theo ngôn ngữ bạn chọn.',
          'Câu hỏi quiz hiện chỉ có tiếng Hàn (sẽ bổ sung thêm ngôn ngữ).',
        ],
      },
      {
        title: '❓ Câu hỏi thường gặp',
        items: [
          'H: Tôi có cần Pi Browser không?\nT: Có — đăng nhập Pi SDK chỉ hoạt động trong Pi Browser.',
          'H: Khi trò chơi kết thúc, tôi có mất câu hỏi đã trả lời không?\nT: Không. Chỉ điểm và mạng được đặt lại. Lịch sử câu hỏi và khảo sát vẫn được giữ.',
          'H: Điểm của tôi không hiển thị trên bảng xếp hạng.\nT: Firestore có thể mất chút thời gian để tạo chỉ mục. Làm mới sau một phút.',
        ],
      },
    ],
    donation: {
      title: '💙 Ủng hộ phát triển',
      desc: 'Nếu bạn thích ứng dụng, một khoản nhỏ sẽ rất có ý nghĩa.<br>Tất cả sự ủng hộ dành cho phát triển ứng dụng.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Cảm ơn bạn đã ủng hộ ${amount}π! 💙`,
      errorMsg: 'Quyên góp chỉ khả dụng trong Pi Browser.',
    },
  },
  zh: {
    title: '帮助',
    sections: [
      {
        title: '🎮 游戏方法',
        items: [
          '选择游戏模式（⛏️ Miner · 🚀 Pioneer · 🔱 Validator）并开始测验。',
          '从4个选项中选出正确答案。',
          '回答后，阅读解析并进入下一题。',
          '已回答的问题不会再次出现。',
          '使用"放弃"按钮将当前分数提交至排行榜并切换模式。',
        ],
      },
      {
        title: '❤️ 生命系统（按模式）',
        items: [
          '⛏️ Miner：初始2条命 · 答错-1 · 每完成4份问卷永久+1（最多+2）· 每答对10题+1 · 每次查看统计/排行榜+1（每1小时）',
          '🚀 Pioneer：初始2条命 · 答错-1 · 每完成4份问卷永久+1（最多+2）',
          '🔱 Validator：无生命 · 答错1题立即结束游戏',
          '生命归零时，分数记入排行榜，新游戏开始。',
        ],
      },
      {
        title: '⭐ 得分系统',
        items: [
          '初级答对：+10分',
          '中级答对：+20分',
          '高级答对：+30分',
          '3连击奖励：额外+5分',
          '参与问卷：+5分',
        ],
      },
      {
        title: '🏅 段位',
        items: [
          '🌱 探索者：0–200分',
          '📊 分析师：201–500分',
          '⚡ 交易者：501–1,000分',
          '🏦 做市商：1,001–2,000分',
          '🔱 策略家：2,001+分',
        ],
      },
      {
        title: '📋 社区问卷',
        items: [
          '问卷在初级测验中出现。',
          '回答匿名，用于Pi生态系统研究。',
          '节点相关问题归为一张卡片。',
          '您可以随时跳过问卷问题。',
        ],
      },
      {
        title: '🌐 多语言',
        items: [
          '在应用介绍页面更改语言。',
          '问卷问题和界面根据所选语言调整。',
          '测验题目目前仅有韩文（更多语言即将推出）。',
        ],
      },
      {
        title: '❓ 常见问题',
        items: [
          'Q：我需要Pi Browser吗？\nA：是的——Pi SDK登录只能在Pi Browser中使用。',
          'Q：游戏结束后，我会失去已回答的问题吗？\nA：不会。只有分数和生命重置。您的题目历史和问卷答案将保留。',
          'Q：我的分数未显示在排行榜上。\nA：Firestore可能需要一点时间创建所需索引。一分钟后刷新。',
        ],
      },
    ],
    donation: {
      title: '💙 支持开发',
      desc: '如果您喜欢本应用，小额打赏将大有帮助。<br>所有支持用于应用开发和更新。',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `感谢您的 ${amount}π 打赏！💙`,
      errorMsg: '捐款仅在Pi Browser内可用。',
    },
  },
  ja: {
    title: 'ヘルプ',
    sections: [
      {
        title: '🎮 ゲームの遊び方',
        items: [
          'ゲームモード（⛏️ Miner · 🚀 Pioneer · 🔱 Validator）を選んでクイズを始めましょう。',
          '4択問題から正解を選んでください。',
          '回答後、解説を確認して次の問題へ進みます。',
          '一度回答した問題は再出題されません。',
          '「ギブアップ」ボタンで現在のスコアをランキングに登録し、モードを変更できます。',
        ],
      },
      {
        title: '❤️ ライフシステム（モード別）',
        items: [
          '⛏️ Miner：初期2個 · 不正解-1 · アンケート4回完了で永久+1（最大+2）· 正解10問で+1 · 統計/ランキング閲覧で+1（1時間ごと）',
          '🚀 Pioneer：初期2個 · 不正解-1 · アンケート4回完了で永久+1（最大+2）',
          '🔱 Validator：ライフなし · 不正解1問で即ゲーム終了',
          'ライフが0になるとスコアがリーダーボードに記録され、新しいゲームが始まります。',
        ],
      },
      {
        title: '⭐ スコアシステム',
        items: [
          '初級正解：+10pt',
          '中級正解：+20pt',
          '上級正解：+30pt',
          '3連続ボーナス：+5pt',
          'アンケート参加：+5pt',
        ],
      },
      {
        title: '🏅 ランクティア',
        items: [
          '🌱 Explorer：0–200pt',
          '📊 Analyst：201–500pt',
          '⚡ Trader：501–1,000pt',
          '🏦 Market Maker：1,001–2,000pt',
          '🔱 Strategist：2,001+pt',
        ],
      },
      {
        title: '📋 コミュニティアンケート',
        items: [
          'アンケートは初級クイズ中に表示されます。',
          '回答は匿名で、Piエコシステムの研究に使用されます。',
          'ノード関連の質問は1枚のカードにまとめられています。',
          'アンケートはいつでもスキップできます。',
        ],
      },
      {
        title: '🌐 多言語対応',
        items: [
          'アプリのイントロ画面で言語を変更できます。',
          'アンケートとUIは選択した言語に対応します。',
          'クイズ問題は現在韓国語のみです（今後追加予定）。',
        ],
      },
      {
        title: '❓ よくある質問',
        items: [
          'Q：Pi Browserは必要ですか？\nA：はい。Pi SDKログインはPi Browser内でのみ機能します。',
          'Q：ゲーム終了後、回答済みの問題は消えますか？\nA：いいえ。スコアとライフのみリセットされます。問題履歴とアンケート回答は保持されます。',
          'Q：スコアがランキングに表示されません。\nA：Firestoreがインデックスを作成するのに少し時間がかかる場合があります。1分後に更新してください。',
        ],
      },
    ],
    donation: {
      title: '💙 開発をサポート',
      desc: 'アプリが気に入ったら、少額のチップが大きな支えになります。<br>すべてのサポートはアプリ開発と更新に充てられます。',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `${amount}πのチップをありがとうございます！💙`,
      errorMsg: '寄付はPi Browser内でのみ利用できます。',
    },
  },
  tl: {
    title: 'Tulong',
    sections: [
      {
        title: '🎮 Paano Maglaro',
        items: [
          'Pumili ng game mode (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) at simulan ang quiz.',
          'Piliin ang tamang sagot mula sa 4 na pagpipilian.',
          'Pagkatapos sagutin, basahin ang paliwanag at pumunta sa susunod na tanong.',
          'Ang mga tanong na nasagot na ay hindi na lalabas muli.',
          'Gamitin ang button na \'Sumuko\' para isumite ang iyong kasalukuyang puntos sa leaderboard at magpalit ng mode.',
        ],
      },
      {
        title: '❤️ Sistema ng Buhay (bawat mode)',
        items: [
          '⛏️ Miner: 2 buhay sa simula · Mali -1 · +1 permanente bawat 4 survey (max +2) · +1 bawat 10 tamang sagot · +1 sa bawat pagtingin ng stats/ranking (bawat 1 oras)',
          '🚀 Pioneer: 2 buhay sa simula · Mali -1 · +1 permanente bawat 4 survey (max +2)',
          '🔱 Validator: Walang buhay · Isang maling sagot ay magtatapos agad ng laro',
          'Kapag naubos ang buhay, naitala ang puntos sa leaderboard at nagsisimula ang bagong laro.',
        ],
      },
      {
        title: '⭐ Puntos',
        items: [
          'Baguhan tama: +10 puntos',
          'Katamtaman tama: +20 puntos',
          'Advanced tama: +30 puntos',
          'Bonus 3-streak: +5 puntos',
          'Pakikilahok sa survey: +5 puntos',
        ],
      },
      {
        title: '🏅 Mga Antas',
        items: [
          '🌱 Explorer: 0–200 puntos',
          '📊 Analyst: 201–500 puntos',
          '⚡ Trader: 501–1,000 puntos',
          '🏦 Market Maker: 1,001–2,000 puntos',
          '🔱 Strategist: 2,001+ puntos',
        ],
      },
      {
        title: '📋 Survey ng Komunidad',
        items: [
          'Lumalabas ang survey sa panahon ng Baguhan na quiz.',
          'Ang mga sagot ay anonymous at ginagamit para sa pananaliksik ng Pi ecosystem.',
          'Ang mga tanong tungkol sa node ay pinagsama sa isang card.',
          'Maaari kang laktawan ang isang tanong sa survey anumang oras.',
        ],
      },
      {
        title: '🌐 Multi-wika',
        items: [
          'Baguhin ang wika sa intro screen ng app.',
          'Ang mga tanong sa survey at UI ay nag-aayon sa iyong piniling wika.',
          'Ang mga tanong sa quiz ay Korean lamang sa kasalukuyan (dumarating ang mas maraming wika).',
        ],
      },
      {
        title: '❓ FAQ',
        items: [
          'T: Kailangan ko ba ng Pi Browser?\nS: Oo — ang Pi SDK login ay gumagana lamang sa loob ng Pi Browser.',
          'T: Kapag natapos ang laro, mawawala ba ang aking mga nasagutang tanong?\nS: Hindi. Ang puntos at buhay lamang ang nire-reset. Ang iyong kasaysayan ng tanong at mga sagot sa survey ay pinapanatili.',
          'T: Hindi lumalabas ang aking puntos sa leaderboard.\nS: Maaaring kailangan ng Firestore ng ilang sandali para likhain ang kinakailangang index. I-refresh pagkatapos ng isang minuto.',
        ],
      },
    ],
    donation: {
      title: '💙 Suportahan ang Pagbuo',
      desc: 'Kung nagustuhan mo ang app, ang maliit na tip ay malaking tulong.<br>Lahat ng suporta ay napupunta sa pagbuo at pag-update ng app.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Salamat sa ${amount}π na tip! 💙`,
      errorMsg: 'Ang mga donasyon ay available lamang sa loob ng Pi Browser.',
    },
  },
  hi: {
    title: 'सहायता',
    sections: [
      {
        title: '🎮 खेलने का तरीका',
        items: [
          'गेम मोड (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) चुनें और क्विज़ शुरू करें।',
          '4 विकल्पों में से सही उत्तर चुनें।',
          'उत्तर देने के बाद, व्याख्या पढ़ें और अगले प्रश्न पर जाएं।',
          'जो प्रश्न एक बार हल हो चुके हैं वे दोबारा नहीं आएंगे।',
          '\'हार मानें\' बटन का उपयोग करके वर्तमान स्कोर लीडरबोर्ड पर सबमिट करें और मोड बदलें।',
        ],
      },
      {
        title: '❤️ जीवन प्रणाली (मोड के अनुसार)',
        items: [
          '⛏️ Miner: शुरुआत में 2 जीवन · गलत उत्तर -1 · हर 4 सर्वेक्षण पर स्थायी +1 (अधिकतम +2) · हर 10 सही उत्तर पर +1 · हर बार stats/ranking देखने पर +1 (हर 1 घंटे)',
          '🚀 Pioneer: शुरुआत में 2 जीवन · गलत उत्तर -1 · हर 4 सर्वेक्षण पर स्थायी +1 (अधिकतम +2)',
          '🔱 Validator: कोई जीवन नहीं · एक गलत उत्तर से तुरंत गेम समाप्त',
          'जब जीवन 0 हो जाए तो स्कोर लीडरबोर्ड में दर्ज हो जाता है और नया गेम शुरू होता है।',
        ],
      },
      {
        title: '⭐ स्कोर',
        items: [
          'शुरुआती सही: +10 अंक',
          'मध्यम सही: +20 अंक',
          'उन्नत सही: +30 अंक',
          '3-स्ट्रीक बोनस: +5 अतिरिक्त अंक',
          'सर्वेक्षण भागीदारी: +5 अंक',
        ],
      },
      {
        title: '🏅 रैंक स्तर',
        items: [
          '🌱 Explorer: 0–200 अंक',
          '📊 Analyst: 201–500 अंक',
          '⚡ Trader: 501–1,000 अंक',
          '🏦 Market Maker: 1,001–2,000 अंक',
          '🔱 Strategist: 2,001+ अंक',
        ],
      },
      {
        title: '📋 समुदाय सर्वेक्षण',
        items: [
          'सर्वेक्षण शुरुआती क्विज़ के दौरान दिखाई देते हैं।',
          'उत्तर गुमनाम हैं और Pi इकोसिस्टम अनुसंधान के लिए उपयोग किए जाते हैं।',
          'नोड से संबंधित प्रश्न एक ही कार्ड में समूहीकृत हैं।',
          'आप कभी भी सर्वेक्षण प्रश्न छोड़ सकते हैं।',
        ],
      },
      {
        title: '🌐 बहु-भाषा',
        items: [
          'ऐप इंट्रो स्क्रीन पर भाषा बदलें।',
          'सर्वेक्षण प्रश्न और UI आपकी चुनी हुई भाषा के अनुसार अनुकूलित होते हैं।',
          'क्विज़ प्रश्न अभी केवल कोरियाई में हैं (और भाषाएं जल्द आ रही हैं)।',
        ],
      },
      {
        title: '❓ अक्सर पूछे जाने वाले प्रश्न',
        items: [
          'प्र: क्या मुझे Pi Browser चाहिए?\nउ: हां — Pi SDK लॉगिन केवल Pi Browser के अंदर काम करता है।',
          'प्र: जब गेम समाप्त होता है, तो क्या मेरे उत्तरित प्रश्न खो जाते हैं?\nउ: नहीं। केवल स्कोर और जीवन रीसेट होते हैं। आपका प्रश्न इतिहास और सर्वेक्षण उत्तर सुरक्षित रहते हैं।',
          'प्र: मेरा स्कोर लीडरबोर्ड पर नहीं दिख रहा।\nउ: Firestore को आवश्यक इंडेक्स बनाने में थोड़ा समय लग सकता है। एक मिनट बाद रिफ्रेश करें।',
        ],
      },
    ],
    donation: {
      title: '💙 विकास का समर्थन करें',
      desc: 'यदि आप ऐप का आनंद लेते हैं, तो एक छोटी सी टिप बहुत काम आती है।<br>सभी समर्थन ऐप विकास और अपडेट के लिए जाता है।',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `${amount}π टिप के लिए धन्यवाद! 💙`,
      errorMsg: 'दान केवल Pi Browser के अंदर उपलब्ध है।',
    },
  },
  bn: {
    title: 'সাহায্য',
    sections: [
      {
        title: '🎮 খেলার নিয়ম',
        items: [
          'গেম মোড (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) বেছে নিন এবং কুইজ শুরু করুন।',
          '৪টি বিকল্প থেকে সঠিক উত্তর বেছে নিন।',
          'উত্তর দেওয়ার পরে, ব্যাখ্যা পড়ুন এবং পরবর্তী প্রশ্নে যান।',
          'একবার উত্তর দেওয়া প্রশ্ন আর আসবে না।',
          '\'হাল ছাড়ুন\' বাটন ব্যবহার করে বর্তমান স্কোর লিডারবোর্ডে জমা দিন এবং মোড পরিবর্তন করুন।',
        ],
      },
      {
        title: '❤️ জীবন ব্যবস্থা (মোড অনুযায়ী)',
        items: [
          '⛏️ Miner: শুরুতে ২টি জীবন · ভুল উত্তরে -১ · প্রতি ৪টি জরিপে স্থায়ী +১ (সর্বোচ্চ +২) · প্রতি ১০টি সঠিক উত্তরে +১ · প্রতিবার stats/ranking দেখলে +১ (প্রতি ১ ঘণ্টা)',
          '🚀 Pioneer: শুরুতে ২টি জীবন · ভুল উত্তরে -১ · প্রতি ৪টি জরিপে স্থায়ী +১ (সর্বোচ্চ +২)',
          '🔱 Validator: কোনো জীবন নেই · একটি ভুল উত্তরেই গেম শেষ',
          'জীবন ০ হলে স্কোর লিডারবোর্ডে নথিভুক্ত হয় এবং নতুন গেম শুরু হয়।',
        ],
      },
      {
        title: '⭐ স্কোর সিস্টেম',
        items: [
          'শুরুর স্তর সঠিক: +১০ পয়েন্ট',
          'মাঝারি স্তর সঠিক: +২০ পয়েন্ট',
          'উন্নত স্তর সঠিক: +৩০ পয়েন্ট',
          '৩-স্ট্রিক বোনাস: +৫ পয়েন্ট',
          'জরিপে অংশগ্রহণ: +৫ পয়েন্ট',
        ],
      },
      {
        title: '🏅 র্যাংক স্তর',
        items: [
          '🌱 Explorer: ০–২০০ পয়েন্ট',
          '📊 Analyst: ২০১–৫০০ পয়েন্ট',
          '⚡ Trader: ৫০১–১,০০০ পয়েন্ট',
          '🏦 Market Maker: ১,০০১–২,০০০ পয়েন্ট',
          '🔱 Strategist: ২,০০১+ পয়েন্ট',
        ],
      },
      {
        title: '📋 কমিউনিটি জরিপ',
        items: [
          'শুরুর স্তরের কুইজে জরিপ দেখা যায়।',
          'উত্তর বেনামী এবং Pi ইকোসিস্টেম গবেষণায় ব্যবহৃত হয়।',
          'নোড সম্পর্কিত প্রশ্নগুলো একটি কার্ডে একত্রিত।',
          'আপনি যেকোনো সময় জরিপ প্রশ্ন এড়িয়ে যেতে পারেন।',
        ],
      },
      {
        title: '🌐 বহু-ভাষা',
        items: [
          'অ্যাপের ইন্ট্রো স্ক্রিনে ভাষা পরিবর্তন করুন।',
          'জরিপের প্রশ্ন এবং UI আপনার বেছে নেওয়া ভাষায় মানিয়ে নেয়।',
          'কুইজ প্রশ্নগুলো এখন শুধু কোরিয়ান ভাষায় (শীঘ্রই আরো ভাষা যুক্ত হবে)।',
        ],
      },
      {
        title: '❓ সাধারণ প্রশ্ন',
        items: [
          'প্র: আমার কি Pi Browser দরকার?\nউ: হ্যাঁ — Pi SDK লগইন শুধুমাত্র Pi Browser-এর ভেতরে কাজ করে।',
          'প্র: গেম শেষ হলে কি আমার উত্তর দেওয়া প্রশ্ন হারিয়ে যাবে?\nউ: না। শুধু স্কোর এবং জীবন রিসেট হয়। আপনার প্রশ্নের ইতিহাস এবং জরিপের উত্তর সংরক্ষিত থাকে।',
          'প্র: আমার স্কোর লিডারবোর্ডে দেখাচ্ছে না।\nউ: Firestore-এর প্রয়োজনীয় ইন্ডেক্স তৈরি করতে একটু সময় লাগতে পারে। এক মিনিট পরে রিফ্রেশ করুন।',
        ],
      },
    ],
    donation: {
      title: '💙 উন্নয়নে সহায়তা করুন',
      desc: 'আপনি যদি অ্যাপটি উপভোগ করেন, ছোট একটি টিপ অনেক সাহায্য করে।<br>সব সহায়তা অ্যাপ উন্নয়ন ও আপডেটে ব্যবহৃত হয়।',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `${amount}π টিপের জন্য ধন্যবাদ! 💙`,
      errorMsg: 'দান শুধুমাত্র Pi Browser-এর ভেতরে পাওয়া যায়।',
    },
  },
  th: {
    title: 'ช่วยเหลือ',
    sections: [
      {
        title: '🎮 วิธีเล่น',
        items: [
          'เลือกโหมดเกม (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) และเริ่มทำแบบทดสอบ',
          'เลือกคำตอบที่ถูกต้องจาก 4 ตัวเลือก',
          'หลังจากตอบแล้ว อ่านคำอธิบายและไปยังคำถามถัดไป',
          'คำถามที่ตอบแล้วจะไม่ปรากฏอีก',
          'ใช้ปุ่ม \'ยอมแพ้\' เพื่อส่งคะแนนปัจจุบันไปยังลีดเดอร์บอร์ดและเปลี่ยนโหมด',
        ],
      },
      {
        title: '❤️ ระบบชีวิต (ตามโหมด)',
        items: [
          '⛏️ Miner: เริ่มต้น 2 ชีวิต · ตอบผิด -1 · +1 ถาวรทุก 4 แบบสำรวจ (สูงสุด +2) · +1 ทุก 10 คำตอบที่ถูก · +1 ทุกครั้งที่ดู stats/ranking (ทุก 1 ชั่วโมง)',
          '🚀 Pioneer: เริ่มต้น 2 ชีวิต · ตอบผิด -1 · +1 ถาวรทุก 4 แบบสำรวจ (สูงสุด +2)',
          '🔱 Validator: ไม่มีชีวิต · ตอบผิดครั้งเดียวจบเกมทันที',
          'เมื่อชีวิตหมด คะแนนจะถูกบันทึกในลีดเดอร์บอร์ดและเริ่มเกมใหม่',
        ],
      },
      {
        title: '⭐ คะแนน',
        items: [
          'ระดับต้น ตอบถูก: +10 คะแนน',
          'ระดับกลาง ตอบถูก: +20 คะแนน',
          'ระดับสูง ตอบถูก: +30 คะแนน',
          'โบนัส 3 ต่อเนื่อง: +5 คะแนน',
          'เข้าร่วมแบบสำรวจ: +5 คะแนน',
        ],
      },
      {
        title: '🏅 ระดับยศ',
        items: [
          '🌱 Explorer: 0–200 คะแนน',
          '📊 Analyst: 201–500 คะแนน',
          '⚡ Trader: 501–1,000 คะแนน',
          '🏦 Market Maker: 1,001–2,000 คะแนน',
          '🔱 Strategist: 2,001+ คะแนน',
        ],
      },
      {
        title: '📋 แบบสำรวจชุมชน',
        items: [
          'แบบสำรวจปรากฏระหว่างคำถามระดับต้น',
          'คำตอบไม่ระบุตัวตน ใช้สำหรับการวิจัยระบบนิเวศ Pi',
          'คำถามเกี่ยวกับ Node จะถูกรวมในการ์ดเดียว',
          'คุณสามารถข้ามคำถามแบบสำรวจได้เสมอ',
        ],
      },
      {
        title: '🌐 หลายภาษา',
        items: [
          'เปลี่ยนภาษาได้ที่หน้าจอแนะนำแอป',
          'คำถามแบบสำรวจและ UI ปรับตามภาษาที่เลือก',
          'คำถามแบบทดสอบปัจจุบันเป็นภาษาเกาหลีเท่านั้น (กำลังเพิ่มภาษาอื่น)',
        ],
      },
      {
        title: '❓ คำถามที่พบบ่อย',
        items: [
          'ถ: ต้องใช้ Pi Browser ไหม?\nต: ใช่ — การเข้าสู่ระบบ Pi SDK ใช้งานได้ภายใน Pi Browser เท่านั้น',
          'ถ: เมื่อเกมจบ คำถามที่ตอบแล้วจะหายไปไหม?\nต: ไม่ เฉพาะคะแนนและชีวิตเท่านั้นที่รีเซ็ต ประวัติคำถามและคำตอบแบบสำรวจยังคงอยู่',
          'ถ: คะแนนของฉันไม่แสดงในลีดเดอร์บอร์ด\nต: Firestore อาจต้องใช้เวลาสักครู่เพื่อสร้างดัชนีที่จำเป็น ลองรีเฟรชหลังจากหนึ่งนาที',
        ],
      },
    ],
    donation: {
      title: '💙 สนับสนุนการพัฒนา',
      desc: 'หากคุณชอบแอปนี้ ทิปเล็กน้อยช่วยได้มาก<br>การสนับสนุนทั้งหมดใช้สำหรับการพัฒนาและอัปเดตแอป',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `ขอบคุณสำหรับทิป ${amount}π! 💙`,
      errorMsg: 'การบริจาคใช้ได้ภายใน Pi Browser เท่านั้น',
    },
  },
  ms: {
    title: 'Bantuan',
    sections: [
      {
        title: '🎮 Cara Bermain',
        items: [
          'Pilih mod permainan (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) dan mulakan kuiz.',
          'Pilih jawapan yang betul daripada 4 pilihan.',
          'Selepas menjawab, baca penjelasan dan teruskan ke soalan seterusnya.',
          'Soalan yang telah dijawab tidak akan muncul lagi.',
          'Gunakan butang \'Menyerah\' untuk menghantar skor semasa ke papan pendahulu dan tukar mod.',
        ],
      },
      {
        title: '❤️ Sistem Nyawa (mengikut mod)',
        items: [
          '⛏️ Miner: 2 nyawa permulaan · Jawab salah -1 · +1 kekal setiap 4 tinjauan (maks +2) · +1 setiap 10 jawapan betul · +1 setiap kali lihat stats/ranking (setiap 1 jam)',
          '🚀 Pioneer: 2 nyawa permulaan · Jawab salah -1 · +1 kekal setiap 4 tinjauan (maks +2)',
          '🔱 Validator: Tiada nyawa · Satu jawapan salah terus tamatkan permainan',
          'Apabila nyawa habis, skor direkodkan ke papan pendahulu dan permainan baru bermula.',
        ],
      },
      {
        title: '⭐ Pemarkahan',
        items: [
          'Pemula betul: +10 mata',
          'Pertengahan betul: +20 mata',
          'Lanjutan betul: +30 mata',
          'Bonus 3 berturut-turut: +5 mata',
          'Penyertaan tinjauan: +5 mata',
        ],
      },
      {
        title: '🏅 Tahap Pangkat',
        items: [
          '🌱 Explorer: 0–200 mata',
          '📊 Analyst: 201–500 mata',
          '⚡ Trader: 501–1,000 mata',
          '🏦 Market Maker: 1,001–2,000 mata',
          '🔱 Strategist: 2,001+ mata',
        ],
      },
      {
        title: '📋 Tinjauan Komuniti',
        items: [
          'Tinjauan muncul semasa kuiz Pemula.',
          'Jawapan adalah tanpa nama dan digunakan untuk penyelidikan ekosistem Pi.',
          'Soalan berkaitan nod dikumpulkan dalam satu kad.',
          'Anda boleh langkau soalan tinjauan pada bila-bila masa.',
        ],
      },
      {
        title: '🌐 Pelbagai Bahasa',
        items: [
          'Tukar bahasa di skrin intro aplikasi.',
          'Soalan tinjauan dan UI disesuaikan dengan bahasa yang dipilih.',
          'Soalan kuiz kini hanya dalam bahasa Korea (bahasa lain akan ditambah).',
        ],
      },
      {
        title: '❓ Soalan Lazim',
        items: [
          'S: Adakah saya perlu Pi Browser?\nJ: Ya — log masuk Pi SDK hanya berfungsi di dalam Pi Browser.',
          'S: Apabila permainan tamat, adakah soalan yang telah dijawab hilang?\nJ: Tidak. Hanya skor dan nyawa yang ditetapkan semula. Sejarah soalan dan jawapan tinjauan anda disimpan.',
          'S: Skor saya tidak muncul di papan pendahulu.\nJ: Firestore mungkin memerlukan sedikit masa untuk mencipta indeks yang diperlukan. Muat semula selepas seminit.',
        ],
      },
    ],
    donation: {
      title: '💙 Sokong Pembangunan',
      desc: 'Jika anda menikmati aplikasi ini, tip kecil sangat bermakna.<br>Semua sokongan digunakan untuk pembangunan dan kemas kini aplikasi.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Terima kasih atas tip ${amount}π! 💙`,
      errorMsg: 'Derma hanya tersedia di dalam Pi Browser.',
    },
  },
  es: {
    title: 'Ayuda',
    sections: [
      {
        title: '🎮 Cómo Jugar',
        items: [
          'Selecciona un modo de juego (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) e inicia el cuestionario.',
          'Elige la respuesta correcta entre 4 opciones.',
          'Después de responder, lee la explicación y pasa a la siguiente pregunta.',
          'Las preguntas ya respondidas no volverán a aparecer.',
          'Usa el botón \'Rendirse\' para enviar tu puntuación actual al marcador y cambiar de modo.',
        ],
      },
      {
        title: '❤️ Sistema de Vidas (por modo)',
        items: [
          '⛏️ Miner: 2 vidas iniciales · Respuesta incorrecta -1 · +1 permanente por cada 4 encuestas (máx +2) · +1 por cada 10 respuestas correctas · +1 al ver stats/ranking (cada 1 hora)',
          '🚀 Pioneer: 2 vidas iniciales · Respuesta incorrecta -1 · +1 permanente por cada 4 encuestas (máx +2)',
          '🔱 Validator: Sin vidas · Una respuesta incorrecta termina el juego inmediatamente',
          'Cuando las vidas llegan a 0, la puntuación se registra en el marcador y comienza un nuevo juego.',
        ],
      },
      {
        title: '⭐ Puntuación',
        items: [
          'Principiante correcto: +10 pts',
          'Intermedio correcto: +20 pts',
          'Avanzado correcto: +30 pts',
          'Bonus racha de 3: +5 pts extra',
          'Participación en encuesta: +5 pts',
        ],
      },
      {
        title: '🏅 Niveles de Rango',
        items: [
          '🌱 Explorer: 0–200 pts',
          '📊 Analyst: 201–500 pts',
          '⚡ Trader: 501–1.000 pts',
          '🏦 Market Maker: 1.001–2.000 pts',
          '🔱 Strategist: 2.001+ pts',
        ],
      },
      {
        title: '📋 Encuesta Comunitaria',
        items: [
          'Las encuestas aparecen durante los cuestionarios de Principiante.',
          'Las respuestas son anónimas y se usan para investigación del ecosistema Pi.',
          'Las preguntas relacionadas con nodos se agrupan en una tarjeta.',
          'Siempre puedes omitir una pregunta de encuesta.',
        ],
      },
      {
        title: '🌐 Multiidioma',
        items: [
          'Cambia el idioma en la pantalla de introducción de la app.',
          'Las preguntas de encuesta y la UI se adaptan al idioma elegido.',
          'Las preguntas del cuestionario son actualmente solo en coreano (más idiomas próximamente).',
        ],
      },
      {
        title: '❓ Preguntas Frecuentes',
        items: [
          'P: ¿Necesito Pi Browser?\nR: Sí — el inicio de sesión de Pi SDK solo funciona dentro de Pi Browser.',
          'P: Cuando termina el juego, ¿pierdo las preguntas respondidas?\nR: No. Solo se reinician la puntuación y las vidas. Tu historial de preguntas y respuestas de encuesta se conservan.',
          'P: Mi puntuación no aparece en el marcador.\nR: Firestore puede tardar un momento en crear el índice requerido. Actualiza después de un minuto.',
        ],
      },
    ],
    donation: {
      title: '💙 Apoya el Desarrollo',
      desc: 'Si disfrutas la app, una pequeña propina es de gran ayuda.<br>Todo el apoyo va hacia el desarrollo y actualizaciones de la app.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `¡Gracias por la propina de ${amount}π! 💙`,
      errorMsg: 'Las donaciones solo están disponibles dentro de Pi Browser.',
    },
  },
  pt: {
    title: 'Ajuda',
    sections: [
      {
        title: '🎮 Como Jogar',
        items: [
          'Selecione um modo de jogo (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) e inicie o quiz.',
          'Escolha a resposta correta entre 4 opções.',
          'Após responder, leia a explicação e vá para a próxima pergunta.',
          'As perguntas já respondidas não aparecerão novamente.',
          'Use o botão \'Desistir\' para enviar sua pontuação atual ao placar e trocar de modo.',
        ],
      },
      {
        title: '❤️ Sistema de Vidas (por modo)',
        items: [
          '⛏️ Miner: 2 vidas iniciais · Resposta errada -1 · +1 permanente a cada 4 pesquisas (máx +2) · +1 a cada 10 respostas corretas · +1 ao ver stats/ranking (a cada 1 hora)',
          '🚀 Pioneer: 2 vidas iniciais · Resposta errada -1 · +1 permanente a cada 4 pesquisas (máx +2)',
          '🔱 Validator: Sem vidas · Uma resposta errada encerra o jogo imediatamente',
          'Quando as vidas chegam a 0, a pontuação é registrada no placar e um novo jogo começa.',
        ],
      },
      {
        title: '⭐ Pontuação',
        items: [
          'Iniciante correto: +10 pts',
          'Intermediário correto: +20 pts',
          'Avançado correto: +30 pts',
          'Bônus sequência de 3: +5 pts extra',
          'Participação em pesquisa: +5 pts',
        ],
      },
      {
        title: '🏅 Níveis de Rank',
        items: [
          '🌱 Explorer: 0–200 pts',
          '📊 Analyst: 201–500 pts',
          '⚡ Trader: 501–1.000 pts',
          '🏦 Market Maker: 1.001–2.000 pts',
          '🔱 Strategist: 2.001+ pts',
        ],
      },
      {
        title: '📋 Pesquisa da Comunidade',
        items: [
          'Pesquisas aparecem durante os quizzes de Iniciante.',
          'As respostas são anônimas e usadas para pesquisa do ecossistema Pi.',
          'Perguntas relacionadas a nós são agrupadas em um único cartão.',
          'Você sempre pode pular uma pergunta da pesquisa.',
        ],
      },
      {
        title: '🌐 Multi-idioma',
        items: [
          'Mude o idioma na tela de introdução do app.',
          'As perguntas da pesquisa e a UI se adaptam ao idioma escolhido.',
          'As perguntas do quiz são atualmente apenas em coreano (mais idiomas em breve).',
        ],
      },
      {
        title: '❓ Perguntas Frequentes',
        items: [
          'P: Preciso do Pi Browser?\nR: Sim — o login do Pi SDK só funciona dentro do Pi Browser.',
          'P: Quando o jogo termina, perco as perguntas respondidas?\nR: Não. Apenas pontuação e vidas são redefinidas. Seu histórico de perguntas e respostas de pesquisa são mantidos.',
          'P: Minha pontuação não está aparecendo no placar.\nR: O Firestore pode levar um momento para criar o índice necessário. Atualize após um minuto.',
        ],
      },
    ],
    donation: {
      title: '💙 Apoie o Desenvolvimento',
      desc: 'Se você gosta do app, uma pequena gorjeta vai longe.<br>Todo o suporte vai para o desenvolvimento e atualizações do app.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Obrigado pela gorjeta de ${amount}π! 💙`,
      errorMsg: 'Doações estão disponíveis apenas dentro do Pi Browser.',
    },
  },
  fr: {
    title: 'Aide',
    sections: [
      {
        title: '🎮 Comment Jouer',
        items: [
          'Choisissez un mode de jeu (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) et commencez le quiz.',
          'Choisissez la bonne réponse parmi 4 options.',
          'Après avoir répondu, lisez l\'explication et passez à la question suivante.',
          'Les questions déjà répondues n\'apparaîtront plus.',
          'Utilisez le bouton \'Abandonner\' pour soumettre votre score actuel au classement et changer de mode.',
        ],
      },
      {
        title: '❤️ Système de Vies (par mode)',
        items: [
          '⛏️ Miner : 2 vies de départ · Mauvaise réponse -1 · +1 permanent par 4 sondages (max +2) · +1 par 10 bonnes réponses · +1 à chaque vue des stats/classement (toutes les 1 heure)',
          '🚀 Pioneer : 2 vies de départ · Mauvaise réponse -1 · +1 permanent par 4 sondages (max +2)',
          '🔱 Validator : Pas de vies · Une mauvaise réponse termine immédiatement le jeu',
          'Quand les vies atteignent 0, le score est enregistré dans le classement et un nouveau jeu commence.',
        ],
      },
      {
        title: '⭐ Système de Points',
        items: [
          'Débutant correct : +10 pts',
          'Intermédiaire correct : +20 pts',
          'Avancé correct : +30 pts',
          'Bonus série de 3 : +5 pts supplémentaires',
          'Participation au sondage : +5 pts',
        ],
      },
      {
        title: '🏅 Niveaux de Rang',
        items: [
          '🌱 Explorer : 0–200 pts',
          '📊 Analyst : 201–500 pts',
          '⚡ Trader : 501–1 000 pts',
          '🏦 Market Maker : 1 001–2 000 pts',
          '🔱 Strategist : 2 001+ pts',
        ],
      },
      {
        title: '📋 Sondage Communautaire',
        items: [
          'Les sondages apparaissent pendant les quiz Débutant.',
          'Les réponses sont anonymes et utilisées pour la recherche sur l\'écosystème Pi.',
          'Les questions liées aux nœuds sont regroupées dans une seule carte.',
          'Vous pouvez toujours ignorer une question de sondage.',
        ],
      },
      {
        title: '🌐 Multi-langue',
        items: [
          'Changez de langue sur l\'écran d\'introduction de l\'application.',
          'Les questions de sondage et l\'interface s\'adaptent à la langue choisie.',
          'Les questions du quiz sont actuellement en coréen uniquement (d\'autres langues arrivent bientôt).',
        ],
      },
      {
        title: '❓ FAQ',
        items: [
          'Q : Ai-je besoin de Pi Browser ?\nR : Oui — la connexion Pi SDK ne fonctionne qu\'à l\'intérieur de Pi Browser.',
          'Q : Quand le jeu se termine, est-ce que je perds mes questions répondues ?\nR : Non. Seuls le score et les vies sont réinitialisés. Votre historique de questions et vos réponses aux sondages sont conservés.',
          'Q : Mon score n\'apparaît pas dans le classement.\nR : Firestore peut mettre un moment à créer l\'index requis. Actualisez après une minute.',
        ],
      },
    ],
    donation: {
      title: '💙 Soutenir le Développement',
      desc: 'Si vous aimez l\'application, un petit pourboire est très utile.<br>Tout le soutien est consacré au développement et aux mises à jour de l\'application.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Merci pour le pourboire de ${amount}π ! 💙`,
      errorMsg: 'Les dons ne sont disponibles qu\'à l\'intérieur de Pi Browser.',
    },
  },
  ru: {
    title: 'Помощь',
    sections: [
      {
        title: '🎮 Как играть',
        items: [
          'Выберите режим игры (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) и начните викторину.',
          'Выберите правильный ответ из 4 вариантов.',
          'После ответа прочитайте объяснение и перейдите к следующему вопросу.',
          'Уже отвеченные вопросы больше не появятся.',
          'Нажмите кнопку «Сдаться», чтобы отправить текущий счёт в таблицу лидеров и сменить режим.',
        ],
      },
      {
        title: '❤️ Система жизней (по режимам)',
        items: [
          '⛏️ Miner: 2 жизни в начале · За неверный ответ -1 · +1 навсегда за каждые 4 опроса (макс +2) · +1 за каждые 10 правильных ответов · +1 при просмотре статистики/рейтинга (раз в 1 час)',
          '🚀 Pioneer: 2 жизни в начале · За неверный ответ -1 · +1 навсегда за каждые 4 опроса (макс +2)',
          '🔱 Validator: Жизней нет · Один неверный ответ сразу завершает игру',
          'Когда жизни заканчиваются, счёт записывается в таблицу лидеров и начинается новая игра.',
        ],
      },
      {
        title: '⭐ Система очков',
        items: [
          'Начальный уровень верно: +10 очков',
          'Средний уровень верно: +20 очков',
          'Продвинутый уровень верно: +30 очков',
          'Бонус за 3 подряд: +5 очков',
          'Участие в опросе: +5 очков',
        ],
      },
      {
        title: '🏅 Уровни ранга',
        items: [
          '🌱 Explorer: 0–200 очков',
          '📊 Analyst: 201–500 очков',
          '⚡ Trader: 501–1 000 очков',
          '🏦 Market Maker: 1 001–2 000 очков',
          '🔱 Strategist: 2 001+ очков',
        ],
      },
      {
        title: '📋 Общественный опрос',
        items: [
          'Опросы появляются во время викторин начального уровня.',
          'Ответы анонимны и используются для исследования экосистемы Pi.',
          'Вопросы, связанные с нодами, объединены в одну карточку.',
          'Вы всегда можете пропустить вопрос опроса.',
        ],
      },
      {
        title: '🌐 Мультиязычность',
        items: [
          'Изменить язык можно на вступительном экране приложения.',
          'Вопросы опроса и интерфейс адаптируются к выбранному языку.',
          'Вопросы викторины пока только на корейском (другие языки скоро появятся).',
        ],
      },
      {
        title: '❓ Часто задаваемые вопросы',
        items: [
          'В: Нужен ли Pi Browser?\nО: Да — вход через Pi SDK работает только внутри Pi Browser.',
          'В: Когда игра заканчивается, я теряю отвеченные вопросы?\nО: Нет. Сбрасываются только очки и жизни. История вопросов и ответы на опросы сохраняются.',
          'В: Мой счёт не отображается в таблице лидеров.\nО: Firestore может потребоваться время для создания необходимого индекса. Обновите страницу через минуту.',
        ],
      },
    ],
    donation: {
      title: '💙 Поддержите разработку',
      desc: 'Если вам нравится приложение, небольшой чаевые помогут развитию.<br>Вся поддержка идёт на разработку и обновление приложения.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Спасибо за чаевые ${amount}π! 💙`,
      errorMsg: 'Пожертвования доступны только внутри Pi Browser.',
    },
  },
  tr: {
    title: 'Yardım',
    sections: [
      {
        title: '🎮 Nasıl Oynanır',
        items: [
          'Oyun modu seçin (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) ve testi başlatın.',
          '4 seçenekten doğru cevabı seçin.',
          'Cevapladıktan sonra açıklamayı okuyun ve sonraki soruya geçin.',
          'Daha önce cevaplanan sorular tekrar çıkmaz.',
          'Mevcut puanınızı liderlik tablosuna göndermek ve mod değiştirmek için \'Vazgeç\' düğmesini kullanın.',
        ],
      },
      {
        title: '❤️ Yaşam Sistemi (moda göre)',
        items: [
          '⛏️ Miner: 2 başlangıç canı · Yanlış cevap -1 · Her 4 ankette kalıcı +1 (maks +2) · Her 10 doğru cevap +1 · Her istatistik/sıralama görüntülemesinde +1 (her 1 saatte)',
          '🚀 Pioneer: 2 başlangıç canı · Yanlış cevap -1 · Her 4 ankette kalıcı +1 (maks +2)',
          '🔱 Validator: Can yok · Tek yanlış cevap oyunu anında bitirir',
          'Canlar 0\'a düştüğünde puan liderlik tablosuna kaydedilir ve yeni oyun başlar.',
        ],
      },
      {
        title: '⭐ Puanlama',
        items: [
          'Başlangıç doğru: +10 puan',
          'Orta seviye doğru: +20 puan',
          'İleri seviye doğru: +30 puan',
          '3 seri bonusu: +5 ekstra puan',
          'Ankete katılım: +5 puan',
        ],
      },
      {
        title: '🏅 Rütbe Seviyeleri',
        items: [
          '🌱 Explorer: 0–200 puan',
          '📊 Analyst: 201–500 puan',
          '⚡ Trader: 501–1.000 puan',
          '🏦 Market Maker: 1.001–2.000 puan',
          '🔱 Strategist: 2.001+ puan',
        ],
      },
      {
        title: '📋 Topluluk Anketi',
        items: [
          'Anketler Başlangıç testleri sırasında görünür.',
          'Cevaplar anonimdir ve Pi ekosistemi araştırması için kullanılır.',
          'Node ile ilgili sorular tek bir kartta gruplandırılır.',
          'Anket sorularını her zaman atlayabilirsiniz.',
        ],
      },
      {
        title: '🌐 Çok Dilli',
        items: [
          'Uygulama giriş ekranından dil değiştirebilirsiniz.',
          'Anket soruları ve arayüz seçilen dile göre uyarlanır.',
          'Test soruları şu an yalnızca Korece (daha fazla dil yakında geliyor).',
        ],
      },
      {
        title: '❓ Sıkça Sorulan Sorular',
        items: [
          'S: Pi Browser\'a ihtiyacım var mı?\nC: Evet — Pi SDK girişi yalnızca Pi Browser içinde çalışır.',
          'S: Oyun bittiğinde cevapladığım sorular kaybolur mu?\nC: Hayır. Yalnızca puan ve canlar sıfırlanır. Soru geçmişiniz ve anket cevaplarınız korunur.',
          'S: Puanım liderlik tablosunda görünmüyor.\nC: Firestore\'un gerekli dizini oluşturması biraz zaman alabilir. Bir dakika sonra yenileyin.',
        ],
      },
    ],
    donation: {
      title: '💙 Geliştirmeyi Destekle',
      desc: 'Uygulamayı beğendiyseniz, küçük bir bahşiş büyük yardım olur.<br>Tüm destek uygulama geliştirme ve güncellemelere gider.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `${amount}π bahşiş için teşekkürler! 💙`,
      errorMsg: 'Bağışlar yalnızca Pi Browser içinde mevcuttur.',
    },
  },
  ar: {
    title: 'مساعدة',
    sections: [
      {
        title: '🎮 طريقة اللعب',
        items: [
          'اختر وضع اللعبة (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) وابدأ الاختبار.',
          'اختر الإجابة الصحيحة من بين 4 خيارات.',
          'بعد الإجابة، اقرأ الشرح وانتقل إلى السؤال التالي.',
          'الأسئلة التي أجبت عليها لن تظهر مجدداً.',
          'استخدم زر \'الاستسلام\' لإرسال نقاطك الحالية إلى لوحة المتصدرين وتغيير الوضع.',
        ],
      },
      {
        title: '❤️ نظام الأرواح (حسب الوضع)',
        items: [
          '⛏️ Miner: روحان في البداية · إجابة خاطئة -1 · +1 دائم لكل 4 استطلاعات (بحد +2) · +1 لكل 10 إجابات صحيحة · +1 عند مشاهدة الإحصاءات/الترتيب (كل ساعة)',
          '🚀 Pioneer: روحان في البداية · إجابة خاطئة -1 · +1 دائم لكل 4 استطلاعات (بحد +2)',
          '🔱 Validator: لا أرواح · إجابة خاطئة واحدة تنهي اللعبة فوراً',
          'عندما تصل الأرواح إلى 0، يُسجَّل النقاط في لوحة المتصدرين وتبدأ لعبة جديدة.',
        ],
      },
      {
        title: '⭐ نظام النقاط',
        items: [
          'مبتدئ صحيح: +10 نقاط',
          'متوسط صحيح: +20 نقطة',
          'متقدم صحيح: +30 نقطة',
          'مكافأة 3 متتالية: +5 نقاط إضافية',
          'المشاركة في الاستطلاع: +5 نقاط',
        ],
      },
      {
        title: '🏅 مستويات الرتبة',
        items: [
          '🌱 Explorer: 0–200 نقطة',
          '📊 Analyst: 201–500 نقطة',
          '⚡ Trader: 501–1,000 نقطة',
          '🏦 Market Maker: 1,001–2,000 نقطة',
          '🔱 Strategist: 2,001+ نقطة',
        ],
      },
      {
        title: '📋 استطلاع المجتمع',
        items: [
          'تظهر الاستطلاعات خلال اختبارات المبتدئين.',
          'الإجابات مجهولة الهوية وتُستخدم لأبحاث نظام Pi البيئي.',
          'أسئلة العقد مجمّعة في بطاقة واحدة.',
          'يمكنك دائماً تخطي سؤال الاستطلاع.',
        ],
      },
      {
        title: '🌐 متعدد اللغات',
        items: [
          'غيّر اللغة من شاشة مقدمة التطبيق.',
          'أسئلة الاستطلاع والواجهة تتكيف مع اللغة المختارة.',
          'أسئلة الاختبار حالياً بالكورية فقط (المزيد من اللغات قادمة قريباً).',
        ],
      },
      {
        title: '❓ الأسئلة الشائعة',
        items: [
          'س: هل أحتاج إلى Pi Browser؟\nج: نعم — تسجيل الدخول بـ Pi SDK يعمل فقط داخل Pi Browser.',
          'س: عندما تنتهي اللعبة، هل أفقد الأسئلة التي أجبت عليها؟\nج: لا. يُعاد ضبط النقاط والأرواح فقط. يتم الاحتفاظ بسجل الأسئلة وإجابات الاستطلاع.',
          'س: نقاطي لا تظهر في لوحة المتصدرين.\nج: قد يحتاج Firestore لحظة لإنشاء الفهرس المطلوب. أعد التحميل بعد دقيقة.',
        ],
      },
    ],
    donation: {
      title: '💙 ادعم التطوير',
      desc: 'إذا أعجبك التطبيق، فإن إكرامية صغيرة تُحدث فرقاً كبيراً.<br>جميع الدعم يذهب لتطوير وتحديث التطبيق.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `شكراً على إكرامية ${amount}π! 💙`,
      errorMsg: 'التبرعات متاحة فقط داخل Pi Browser.',
    },
  },
  sw: {
    title: 'Msaada',
    sections: [
      {
        title: '🎮 Jinsi ya Kucheza',
        items: [
          'Chagua hali ya mchezo (⛏️ Miner · 🚀 Pioneer · 🔱 Validator) na uanze maswali.',
          'Chagua jibu sahihi kutoka kwa chaguzi 4.',
          'Baada ya kujibu, soma maelezo na endelea na swali lijalo.',
          'Maswali uliyojibu hayataonekana tena.',
          'Tumia kitufe cha \'Jiachilie\' kutuma alama zako za sasa kwenye orodha ya viongozi na kubadilisha hali.',
        ],
      },
      {
        title: '❤️ Mfumo wa Maisha (kwa hali)',
        items: [
          '⛏️ Miner: Maisha 2 mwanzoni · Jibu baya -1 · +1 ya kudumu kwa kila tafiti 4 (maks +2) · +1 kwa kila majibu sahihi 10 · +1 kila kuona takwimu/orodha (kila saa 1)',
          '🚀 Pioneer: Maisha 2 mwanzoni · Jibu baya -1 · +1 ya kudumu kwa kila tafiti 4 (maks +2)',
          '🔱 Validator: Hakuna maisha · Jibu moja baya linamaliza mchezo mara moja',
          'Maisha yanapofika 0, alama zinarekodiwa kwenye orodha ya viongozi na mchezo mpya unaanza.',
        ],
      },
      {
        title: '⭐ Alama',
        items: [
          'Mwanzo sahihi: +10 alama',
          'Kati sahihi: +20 alama',
          'Juu sahihi: +30 alama',
          'Bonasi mfululizo wa 3: +5 alama',
          'Kushiriki katika tafiti: +5 alama',
        ],
      },
      {
        title: '🏅 Viwango vya Cheo',
        items: [
          '🌱 Explorer: 0–200 alama',
          '📊 Analyst: 201–500 alama',
          '⚡ Trader: 501–1,000 alama',
          '🏦 Market Maker: 1,001–2,000 alama',
          '🔱 Strategist: 2,001+ alama',
        ],
      },
      {
        title: '📋 Tafiti ya Jamii',
        items: [
          'Tafiti zinaonekana wakati wa maswali ya Mwanzo.',
          'Majibu ni ya siri na yanatumika kwa utafiti wa mfumo wa Pi.',
          'Maswali yanayohusiana na node yamewekwa pamoja katika kadi moja.',
          'Unaweza kuruka swali la tafiti wakati wowote.',
        ],
      },
      {
        title: '🌐 Lugha Nyingi',
        items: [
          'Badilisha lugha kwenye skrini ya utangulizi wa programu.',
          'Maswali ya tafiti na kiolesura vinajirekebisha kulingana na lugha uliyochagua.',
          'Maswali ya maswali kwa sasa ni kwa Kikorea tu (lugha zaidi zinakuja hivi karibuni).',
        ],
      },
      {
        title: '❓ Maswali Yanayoulizwa Mara Kwa Mara',
        items: [
          'S: Je, ninahitaji Pi Browser?\nJ: Ndiyo — kuingia kwa Pi SDK kunafanya kazi tu ndani ya Pi Browser.',
          'S: Mchezo ukiisha, je, ninapoteza maswali niliyojibu?\nJ: Hapana. Ni alama na maisha tu yanayowekwa upya. Historia ya maswali yako na majibu ya tafiti yanabaki.',
          'S: Alama zangu hazionyeshwi kwenye orodha ya viongozi.\nJ: Firestore inaweza kuchukua muda kuunda faharasa inayohitajika. Onyesha upya baada ya dakika moja.',
        ],
      },
    ],
    donation: {
      title: '💙 Unga Mkono Maendeleo',
      desc: 'Ukipenda programu, kidogo cha ncha kunasaidia sana.<br>Msaada wote unaenda kwa maendeleo na masasisho ya programu.',
      btns: ['1 Pi', '5 Pi', '10 Pi'],
      successMsg: (amount) => `Asante kwa ncha ya ${amount}π! 💙`,
      errorMsg: 'Michango inapatikana tu ndani ya Pi Browser.',
    },
  },

};

function getContent() {
  const lang = getLang();
  const base = HELP_CONTENT[lang] || HELP_CONTENT['en'];
  const contact = CONTACT_STRINGS[lang] || CONTACT_STRINGS['en'];
  return { ...base, contact };
}

export function renderHelpModal(onClose) {
  const c = getContent();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box help-modal">
      <div class="modal-header">
        <h2>${c.title}</h2>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div class="modal-body">
        ${c.sections.map(s => `
          <div class="help-section">
            <h3 class="help-section-title">${s.title}</h3>
            <ul class="help-list">
              ${s.items.map(item => `
                <li>${item.replace(/\n/g, '<br>')}</li>
              `).join('')}
            </ul>
          </div>
        `).join('')}

        <div class="contact-card">
          <div class="contact-title">${c.contact.title}</div>
          <p class="contact-desc">${c.contact.desc}</p>
          <div class="youtube-link">
            <span class="yt-icon">▶</span>
            <span class="yt-text">
              <span class="yt-label">Hidden Strokes</span>
              <span class="yt-sub">youtube.com/@hiddenstrokes-j5w</span>
            </span>
          </div>
          <div class="copy-url-row">
            <span class="copy-url-text">youtube.com/@hiddenstrokes-j5w</span>
            <button class="btn-outline btn-sm" id="btn-copy-yt-help">${c.contact.copyBtn}</button>
          </div>
          <p class="contact-desc" style="margin-top:6px;font-size:11px;">${c.contact.copyNote}</p>
        </div>

        <div class="help-donation" id="help-sub-section">
          <h3 class="help-section-title">${getSubStrings().title}</h3>
          ${isSubscribed()
            ? `<p class="donation-desc">${getSubStrings().expiry}: ${new Date(getSubscriptionExpiry()).toLocaleDateString()}</p>`
            : `<p class="donation-desc">${getSubStrings().desc}</p>
               <button class="donation-btn" id="help-sub-btn" style="width:100%;margin-bottom:6px;">${getSubStrings().buyBtn}</button>`
          }
          <button class="restore-btn" id="help-restore-btn" style="width:100%;background:#4a5568;font-size:0.82rem;">${getSubStrings().restoreBtn}</button>
          <p class="donation-result" id="help-sub-result"></p>
        </div>

        <div class="help-donation">
          <h3 class="help-section-title">${c.donation.title}</h3>
          <p class="donation-desc">${c.donation.desc}</p>
          <div class="donation-btns">
            ${[1, 5, 10].map((amount, i) => `
              <button class="donation-btn" data-amount="${amount}">${c.donation.btns[i]}</button>
            `).join('')}
          </div>
          <p class="donation-result" id="donation-result"></p>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#btn-copy-yt-help').addEventListener('click', () => {
    navigator.clipboard.writeText('youtube.com/@hiddenstrokes-j5w').then(() => {
      const btn = modal.querySelector('#btn-copy-yt-help');
      btn.textContent = c.contact.copied;
      setTimeout(() => { btn.textContent = c.contact.copyBtn; }, 2000);
    });
  });

  modal.querySelector('#modal-close').addEventListener('click', () => {
    modal.remove();
    onClose?.();
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.remove();
      onClose?.();
    }
  });

  const subBtn = modal.querySelector('#help-sub-btn');
  if (subBtn) {
    subBtn.addEventListener('click', async () => {
      const s = getSubStrings();
      const resultEl = modal.querySelector('#help-sub-result');
      subBtn.disabled = true;
      resultEl.textContent = '';
      resultEl.className = 'donation-result';
      try {
        await createSubscriptionPayment();
        setSubscription(1);
        const _uid = currentUser?.uid;
        const _exp = getSubscriptionExpiry();
        if (_uid && _exp) {
          fetch('/api/subscription/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: _uid, expiry: _exp }),
          }).catch(() => {});
        }
        resultEl.textContent = s.ok;
        resultEl.classList.add('donation-success');
        updateHeaderUsername();
        modal.querySelector('#help-sub-section').innerHTML = `
          <h3 class="help-section-title">${s.title}</h3>
          <p class="donation-desc">${s.expiry}: ${new Date(getSubscriptionExpiry()).toLocaleDateString()}</p>
          <p class="donation-result donation-success">${s.ok}</p>
        `;
      } catch (err) {
        if (err.message !== 'cancelled') {
          resultEl.textContent = s.err;
          resultEl.classList.add('donation-error');
        }
        subBtn.disabled = false;
      }
    });
  }

  const restoreBtn = modal.querySelector('#help-restore-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      const s = getSubStrings();
      const resultEl = modal.querySelector('#help-sub-result');
      restoreBtn.disabled = true;
      resultEl.textContent = '';
      resultEl.className = 'donation-result';
      try {
        const username = currentUser?.username;
        if (!username) throw new Error('no username');

        // 1. 로컬 먼저 확인
        const localExpiry = localStorage.getItem('quiz_sub_expiry');
        if (localExpiry && new Date(localExpiry) > new Date()) {
          resultEl.textContent = s.restoreAlready;
          resultEl.classList.add('donation-success');
          restoreBtn.disabled = false;
          return;
        }

        // 2. 로컬 없으면 서버 확인
        const statusRes = await fetch(`/api/subscription/status?username=${encodeURIComponent(username)}`);
        if (!statusRes.ok) throw new Error('server_error');
        const status = await statusRes.json();
        if (status.active && status.expiry) {
          localStorage.setItem('quiz_sub_expiry', status.expiry);
          resultEl.textContent = s.restoreOk;
          resultEl.classList.add('donation-success');
          updateHeaderUsername();
          restoreBtn.disabled = false;
        } else {
          resultEl.textContent = s.restoreNone;
          resultEl.classList.add('donation-error');
          restoreBtn.disabled = false;
        }
      } catch (err) {
        const s2 = getSubStrings();
        resultEl.textContent = err?.message === 'server_error' ? s2.restoreErr : s2.restoreNone;
        resultEl.classList.add('donation-error');
        restoreBtn.disabled = false;
      }
    });
  }

  modal.querySelectorAll('.donation-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const amount = parseInt(btn.dataset.amount);
      const resultEl = modal.querySelector('#donation-result');
      modal.querySelectorAll('.donation-btn').forEach(b => b.disabled = true);
      try {
        await createDonation(amount);
        resultEl.textContent = c.donation.successMsg(amount);
        resultEl.className = 'donation-result donation-success';
      } catch (err) {
        if (err.message === 'cancelled') {
          resultEl.textContent = '';
        } else {
          resultEl.textContent = c.donation.errorMsg;
          resultEl.className = 'donation-result donation-error';
        }
      } finally {
        modal.querySelectorAll('.donation-btn').forEach(b => b.disabled = false);
      }
    });
  });

  return modal;
}
