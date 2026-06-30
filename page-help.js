import { t, getLang } from './util-i18n.js';
import { createDonation } from './pi-sdk.js';

const HELP_CONTENT = {
  ko: {
    title: '도움말',
    sections: [
      {
        title: '🎮 게임 방법',
        items: [
          '난이도(초급·중급·고급)를 선택하고 퀴즈를 시작하세요.',
          '4지선다 문제에서 정답을 고르세요.',
          '정답 선택 후 해설을 확인하고 다음 문제로 넘어가세요.',
          '한 번 푼 문제는 다시 출제되지 않습니다.',
        ],
      },
      {
        title: '❤️ 생명력 시스템',
        items: [
          '처음에 생명력 2개로 시작합니다.',
          '오답을 선택하면 생명력 1개가 줄어듭니다.',
          '설문에 5개 참여할 때마다 생명력 1개가 추가됩니다.',
          '커뮤니티 통계 화면을 조회하면 1시간에 한 번 생명력 1개가 추가됩니다.',
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
          'Q: 생명력이 0이 되면 기존 답변 기록은 사라지나요?\nA: 아니요. 점수·생명력만 초기화되고, 푼 문제 기록과 설문 답변은 유지됩니다.',
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
          'Choose a difficulty level (Beginner, Intermediate, Advanced) and start.',
          'Pick the correct answer from 4 options.',
          'After answering, read the explanation and move to the next question.',
          'Questions you\'ve already answered won\'t appear again.',
        ],
      },
      {
        title: '❤️ Lives System',
        items: [
          'You start with 2 lives.',
          'Each wrong answer costs 1 life.',
          'Every 5 surveys completed earns +1 life.',
          'Viewing the community stats page earns +1 life (once per hour).',
          'When lives hit 0, your score is saved to the leaderboard and a new game starts.',
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
          'Q: If I run out of lives, do I lose my answered questions?\nA: No. Only score and lives reset. Your question history and survey answers are kept.',
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
          'Pilih tingkat kesulitan (Pemula, Menengah, Mahir) dan mulailah.',
          'Pilih jawaban yang benar dari 4 pilihan.',
          'Setelah menjawab, baca penjelasan dan lanjut ke soal berikutnya.',
          'Soal yang sudah dijawab tidak akan muncul lagi.',
        ],
      },
      {
        title: '❤️ Sistem Nyawa',
        items: [
          'Mulai dengan 2 nyawa.',
          'Setiap jawaban salah mengurangi 1 nyawa.',
          'Setiap 5 survei selesai mendapatkan +1 nyawa.',
          'Melihat halaman statistik komunitas memberikan +1 nyawa (sekali per jam).',
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
  return HELP_CONTENT[lang] || HELP_CONTENT['en'];
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

      </div>
    </div>
  `;

  document.body.appendChild(modal);

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


  return modal;
}
