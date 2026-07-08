export default {
  items: {
    patch:  { label: 'Tambalan Perbaikan', desc: 'Penyegelan tekanan sementara' },
    tether: { label: 'Tali Pengaman',      desc: 'Pergerakan di luar angkasa · pengait' },
    tablet: { label: 'Tablet Data',        desc: 'Akses sistem · navigasi' },
  },
  scenes: {
    impact_alert: {
      title: 'Siaga Benturan',
      text: 'Benturan mengguncang stasiun. Puing-puing asteroid.\nKoridor penghubung B-7 di ISS-2 rusak.\nKapsul pelarian ada di Bagian D. Kamu perlu melewati B-7.\nTekanan bocor. Tidak ada waktu.',
      choices: [
        '[Tambalan] Segel sementara kebocoran dan lewati koridor',
        'Pergi ke ruang komunikasi dan kirim sinyal mayday',
        'Masuk airlock ke luar angkasa',
      ],
      requireDescs: ['Tekanan terus bocor. Tidak bisa lewat.', null, null],
    },
    patched_corridor: {
      title: 'Penyegelan Sementara',
      text: 'Kamu menempelkan tambalan perbaikan di atas retakan. Tekanan stabil.\nKamu bergerak cepat melewati koridor dan berdiri di pintu masuk Bagian D.\nPintu kapsul pelarian terlihat.',
      choices: ['Naik ke kapsul pelarian'],
    },
    comms_room: {
      title: 'Ruang Komunikasi',
      text: 'Sistem komunikasi setengah rusak.\nMengirim sinyal mayday standar butuh setidaknya 72 jam untuk mendapat respons.\nTapi kalau punya tablet, mungkin ada cara lain.',
      choices: [
        '[Tablet] Retas beacon navigasi autopilot dan perkuat sinyal',
        'Kirim sinyal mayday standar dan bergerak menuju kapsul pelarian',
      ],
      requireDescs: ['Sinyal standar terkirim. 72 jam untuk respons.', null],
    },
    tablet_hack: {
      title: 'Amplifikasi Beacon',
      text: 'Kamu mengakses protokol beacon satelit navigasi melalui tablet.\nKamu memperkuat kekuatan sinyal 100×.\nDua belas menit kemudian, ada respons. "Pusat Kendali Misi di sini, ini Nikos. Bergerak ke kapsul. Persiapan pemulihan sedang berlangsung."',
      choices: ['Bergerak menuju kapsul pelarian'],
    },
    airlock_approach: {
      title: 'Airlock',
      text: 'Kamu berdiri di airlock. Ada rute: keluar ke luar angkasa dan menyusuri lambung luar kembali ke airlock Bagian D.\nTapi pergi tanpa tali pengaman berarti terdampar.',
      choices: [
        '[Tali Pengaman] Kaitkan tali dan mulai EVA',
        'Terlalu berisiko. Pergi ke ruang komunikasi.',
      ],
      requireDescs: ['Tanpa tali pengaman kamu akan terdampar di luar angkasa.', null],
    },
    spacewalk: {
      title: 'Jalan-Jalan di Luar Angkasa',
      text: 'Airlock terbuka. Bumi terhampar di hadapan mata.\nKamu mengaitkan tali pengaman ke rel lambung luar dan bergerak.\n300 meter menyusuri lambung menuju airlock Bagian D.\nMelalui jendela, siang dan malam bumi silih berganti.',
      choices: ['Masuk ke airlock Bagian D'],
    },
    main_corridor: {
      title: 'Koridor Utama',
      text: 'Bergerak di koridor, peringatan tekanan lain berbunyi di dekat zona kerusakan B-7.\nSeluruh koridor akan kehilangan tekanan segera.',
      choices: [
        '[Tambalan] Segel retakan baru',
        'Sprint menuju Bagian D',
      ],
      requireDescs: ['Tidak bisa disegel. Tekanan turun cepat.', null],
    },
    corridor_dash: {
      title: 'Sprint',
      text: 'Kamu sprint melewati koridor yang kehilangan tekanan.\nTelingamu berdengung. Pintu Bagian D terlihat.\nDengan sisa tenaga terakhir kamu menarik pintu terbuka.',
      choices: ['Naik ke kapsul pelarian'],
    },
    oxygen_depleting: {
      title: 'Oksigen Menipis',
      text: 'Kamu menunggu di airlock, tapi tekanan terus turun.\nKesadaran memudar.',
      endText: 'Luar angkasa tidak mengizinkan menunggu tanpa oksigen.',
    },
    escape_pod_launch: {
      title: 'Kapsul Pelarian',
      text: 'Kamu masuk ke kapsul. Kamu memasukkan urutan peluncuran.\nPusat Kendali Misi: "Kapsul pelarian dikonfirmasi. Izin masuk kembali diberikan."\nHitung mundur dimulai.',
      choices: ['Tekan tombol peluncuran'],
    },
    success_reentry: {
      title: 'Masuk Kembali ke Atmosfer',
      text: 'Api berkilat di jendela kapsul. Masuk kembali ke atmosfer.\nParasut mengembang. Lautan di bawah.\nSebuah perahu mendekat dari kapal angkatan laut.',
      endText: 'Bumi tidak pernah seindah ini. Kamu kembali hidup-hidup.',
    },
    vacuum_death: {
      title: 'Vakum',
      text: 'Tekanan turun ke nol. Seketika itu juga.',
      endText: 'Luar angkasa tidak memberi kesalahan kesempatan kedua.',
    },
  },
};
