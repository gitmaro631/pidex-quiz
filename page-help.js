import { t, getLang } from './util-i18n.js';
import { createDonation } from './pi-sdk.js';

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
          '⛏️ Miner: 기본 2개 · 오답 시 -1 · 설문 4개 완료당 +1 · 퀴즈 10개 정답당 +1 · 통계/랭킹 조회 시 +1 (1시간마다)',
          '🚀 Pioneer: 기본 2개 · 오답 시 -1 · 설문 4개 완료당 +1',
          '🔱 Validator: 생명 없음 · 오답 1개로 즉시 게임 종료',
          '생명력이 0이 되면 점수가 리더보드에 기록되고 새 게임이 시작됩니다.',
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
          'Q: 리더보드에 내 점수가 보이지 않아요.\nA: Firestore 인덱스 생성에 약간 시간이 걸릴 수 있습니다. 잠시 후 새로고침해 보세요.',
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
          '⛏️ Miner: 2 starting lives · Wrong answer -1 · +1 per 4 surveys · +1 per 10 correct answers · +1 per stats/ranking view (every 1 hr)',
          '🚀 Pioneer: 2 starting lives · Wrong answer -1 · +1 per 4 surveys',
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
          '⛏️ Miner: 2 nyawa awal · Jawaban salah -1 · +1 per 4 survei · +1 per 10 jawaban benar · +1 per lihat statistik/ranking (tiap 1 jam)',
          '🚀 Pioneer: 2 nyawa awal · Jawaban salah -1 · +1 per 4 survei',
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
