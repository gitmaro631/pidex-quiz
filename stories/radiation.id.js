export default {
  items: {
    dosimeter: { label: 'Dosimeter',     desc: 'Mengukur radiasi · mendeteksi jalur aman' },
    hazmat:    { label: 'Pakaian Hazmat', desc: 'Masuk zona panas dengan aman · menemukan kendaraan' },
    iodine:    { label: 'Yodium',        desc: 'Mengurangi paparan radiasi · memulihkan kesehatan' },
  },
  scenes: {
    zone_entry: {
      title: 'Zona Eksklusi',
      text: 'Kecelakaan eksperimen militer telah menutup radius 20km.\nKendaraanmu mati karena EMP. Radio tidak berfungsi.\nReruntuhan terbengkalai berjajar seperti Pripyat era Soviet.\n15km menuju pos pemeriksaan luar. Radiasi sedang diukur.',
      choices: [
        '[Dosimeter] Ukur arah aman dengan dosimeter',
        '[Pakaian Hazmat] Pakai pakaian hazmat dan masuk zona pabrik utara',
        'Ikuti pinggiran reruntuhan menuju pos pemeriksaan',
      ],
      requireDescs: ['Level radiasi tidak diketahui. Tidak tahu mana yang aman.', 'Zona pabrik tanpa pakaian hazmat adalah radiasi mematikan.', null],
    },
    safe_path_found: {
      title: 'Rute Aman',
      text: 'Dosimeter berbunyi alarm. Utara berbahaya. Timur relatif rendah.\nMelalui hutan timur menuju pos pemeriksaan adalah 8km.\nTanpa dosimeter kamu tidak akan pernah tahu rute ini.',
      choices: [
        '[Yodium] Minum yodium dan masuki rute hutan',
        'Hati-hati melewati rute hutan',
      ],
      requireDescs: ['Rute hutan berbahaya tanpa yodium', null],
    },
    forest_shortcut: {
      title: 'Rute Hutan',
      text: 'Pohon-pohon tumbuh dalam bentuk yang aneh. Senyap.\nKamu hanya menginjak tanah yang menunjukkan angka rendah di dosimeter.\n3 jam kemudian, pagar pos pemeriksaan terlihat.',
      choices: ['Berlari menuju pos pemeriksaan'],
    },
    factory_zone: {
      title: 'Zona Pabrik',
      text: 'Pakaian hazmat memblokir radiasi.\nDi dalam pabrik yang ditinggalkan, ada kendaraan yang masih berfungsi.\nBaterai masih hidup — seseorang baru-baru ini ada di sini.',
      choices: [
        'Kendarai menuju pos pemeriksaan',
        'Cari lebih lanjut di pabrik',
      ],
    },
    factory_search: {
      title: 'Di Dalam Pabrik',
      text: 'Ada radio di rak. Kamu menyetel frekuensinya.\n"...Pos pemeriksaan militer di sini. Balas kalau ada yang mendengar ini."\nKamu mengirimkan lokasi.',
      choices: [
        'Tunggu tim penyelamat di pabrik',
        'Kendarai keluar sendiri',
      ],
    },
    vehicle_escape: {
      title: 'Melarikan Diri dengan Kendaraan',
      text: 'Jeep militer yang berdebu pun menyala.\nKamu memacu kendaraan ke pos pemeriksaan.\nPara tentara berlari menghampiri di barikade.',
      endText: 'Pakaian hazmat membuka zona panas. Kendaraan menyelesaikan pelarian.',
    },
    outskirts_path: {
      title: 'Perjalanan di Pinggiran',
      text: 'Kamu memutar di pinggiran reruntuhan.\nKontaminasi lebih rendah, tapi waktu paparan semakin bertambah.\nSebuah kontainer penelitian terlihat.',
      choices: [
        'Masuk ke dalam kontainer',
        'Terus bergerak menuju pos pemeriksaan',
      ],
    },
    research_container: {
      title: 'Kontainer Penelitian',
      text: '"Nama saya Nikos. Tim peneliti lingkungan radiasi. Ini Cheng."\n"Kami punya pakaian hazmat cadangan. Kami juga punya kendaraan."\nCheng menyerahkan kunci dan memberitahu rute menuju pos pemeriksaan.',
      choices: ['Lolos bersama-sama'],
    },
    success_researcher_escape: {
      title: 'Lolos',
      text: 'Kamu tiba di pos pemeriksaan dengan kendaraan Nikos dan Cheng.\n"Kami perlu menyelesaikan penelitian. Data ini penting." Keduanya kembali ke dalam zona.',
      endText: 'Ada orang bahkan di zona radiasi. Teman tak terduga membuka jalan keluar.',
    },
    daylong_march: {
      title: 'Perjalanan Seharian',
      text: 'Radiasi terus terakumulasi saat kamu berjalan.\nMual mulai muncul.',
      choices: [
        '[Yodium] Minum yodium untuk mengurangi paparan',
        'Jangan berhenti — terus bergerak',
      ],
      requireDescs: ['Tidak ada yodium. Gejala memburuk.', null],
    },
    iodine_recovery: {
      title: 'Yodium',
      text: 'Gejala mereda. Tubuh kembali sedikit pulih.\nPagar pos pemeriksaan mulai terlihat.',
      choices: ['Pergi ke pos pemeriksaan'],
    },
    push_through: {
      title: 'Terobos',
      text: 'Kamu berjalan menembus rasa mual.\nPagarnya sudah terlihat. Kerahkan sisa tenaga terakhir.\nPara tentara berlari menghampiri.',
      choices: ['Tiba tepat sebelum pingsan'],
    },
    radiation_sickness: {
      title: 'Penyakit Radiasi',
      text: 'Mual, sakit kepala, kejang-kejang.\nKamu tidak bisa berjalan lagi.',
      endText: 'Radiasi tidak terlihat. Itulah yang membuatnya lebih menakutkan.',
    },
    success_checkpoint: {
      title: 'Pos Pemeriksaan',
      text: 'Kamu berteriak melewati pagar.\nPara tentara berlari keluar. Mereka memakaikan pakaian hazmat dan memasukkanmu ke kendaraan.\nKamu menjalani pemindaian seluruh tubuh di stasiun dekontaminasi.\n"Kamu beruntung."',
      endText: 'Kamu melawan musuh yang tidak terlihat. Keputusan yang tepat lebih cepat dari radiasi.',
    },
    success_factory_rescue: {
      title: 'Tim Penyelamat Tiba',
      text: '20 menit kemudian, para tentara berpakaian hazmat masuk.\n"Bagaimana kamu bisa masuk ke sini?"\nKamu dievakuasi dengan helikopter.',
      endText: 'Satu transmisi radio menjadi jalan keluar. Pakaian hazmat membuat kesempatan itu menjadi mungkin.',
    },
  },
};
