export default {
  items: {
    thermal:  { label: 'Pakaian Termal',    desc: 'Mencegah beku · menjaga suhu tubuh' },
    ice_pick: { label: 'Kapak Es',          desc: 'Mendaki dinding es · memancing di es' },
    radio:    { label: 'Radio Darurat',     desc: 'Mengirim sinyal penyelamatan' },
  },
  scenes: {
    blizzard_end: {
      title: 'Setelah Badai Salju',
      text: 'Kendaraan salju jatuh ke dalam celah es. Badai salju baru saja berhenti.\n−38°C. Angin memotong kulit.\nKamu ingat Stasiun Antartika Sejong berjarak 40km.\nKamu harus memanfaatkan jeda cuaca ini.',
      choices: [
        '[Radio] Hubungi stasiun dengan radio darurat',
        'Mulai bergerak menuju arah stasiun',
        '[Pakaian Termal] Bangun tempat perlindungan es dan bersiap menghadapi badai berikutnya',
      ],
      requireDescs: ['Tidak ada radio. Kamu sendirian.', null, 'Membangun tempat berlindung tanpa pakaian termal berisiko hipotermia'],
    },
    radio_call: {
      title: 'Kontak Radio',
      text: 'Suara menembus derau.\n"Stasiun di sini. Koordinat diterima. Kendaraan salju sedang meluncur — ETA 90 menit."\nKamu menggenggam radio dengan tangan yang gemetar.',
      choices: [
        '[Pakaian Termal] Pakai pakaian termal dan tunggu penyelamatan',
        'Mengubur diri di salju dan menunggu',
      ],
      requireDescs: ['Bertahan 90 menit tanpa pakaian termal sangat berbahaya.', null],
    },
    wait_rescue_thermal: {
      title: 'Penyelamatan Tiba',
      text: 'Pakaian termal menjaga suhu tubuh.\n85 menit kemudian, lampu depan kendaraan salju muncul. Awak stasiun berlari keluar.',
      endText: 'Bertahan 90 menit di suhu −38°C. Radio dan pakaian termal adalah penyelamat.',
    },
    wait_rescue_bare: {
      title: 'Di Ambang Batas',
      text: 'Setelah 30 menit tangan dan kaki kehilangan rasa.\nKesadaran memudar. Saat kendaraan salju tiba, kamu tidak bisa menggerakkan tangan.\nKamu nyaris tidak selamat.',
      endText: 'Kamu hidup — tapi bertahan tanpa pakaian termal adalah perjudian.',
    },
    ice_shelter: {
      title: 'Tempat Perlindungan Salju',
      text: 'Mengenakan pakaian termal kamu menggali tempat berlindung berbentuk igloo.\nSuhu di dalam naik ke −15°C. Kamu akan bertahan.\nKamu harus bergerak sebelum badai berikutnya.',
      choices: [
        '[Kapak Es] Bobol es dan lakukan mancing di bawah es untuk mendapat makanan',
        'Tunggu cuaca membaik lalu menuju stasiun',
      ],
      requireDescs: ['Tidak bisa membobol es', null],
    },
    ice_fishing: {
      title: 'Memancing Es Antartika',
      text: 'Kamu membobol es dan air jernih pun muncul dari bawah.\nKamu menangkap ikan. Mentah, tapi tenaga kembali.\nDi luar tempat berlindung, seekor penguin mengintip masuk.',
      choices: ['Ikuti penguin itu', 'Mulai bergerak menuju stasiun'],
    },
    penguin_follow: {
      title: 'Jejak Penguin',
      text: 'Penguin berjalan selama 30 menit untuk membawamu ke puncak tebing pantai.\nDi bawah, di antara celah-celah es — antena stasiun terlihat!\nPara penguin tahu jalur ini.',
      choices: [
        '[Kapak Es] Panjat turun tebing menuju stasiun',
        'Kelilingi medan es untuk menemukan pintu masuk stasiun',
      ],
      requireDescs: ['Tanpa kapak es, tebing tidak mungkin dilalui', null],
    },
    cliff_descent: {
      title: 'Turun Tebing',
      text: 'Kamu menancapkan kapak es ke dinding es dan turun perlahan.\nPintu masuk stasiun ada tepat di depanmu.\nKamu mengetuk dan pintu pun terbuka.',
      choices: ['Masuk ke dalam stasiun'],
    },
    ice_trek: {
      title: 'Perjalanan di Medan Es',
      text: 'Kamu berjalan melintasi dataran di suhu −30°C.\nTidak ada apa-apa selain putih hingga cakrawala.\nEmpat jam kemudian, terlihat struktur merah di kejauhan — stasiun itu.\nTapi kamu mendengar es retak di bawah kakimu.',
      choices: [
        '[Kapak Es] Periksa kondisi es dan bergerak dengan hati-hati',
        'Putar balik dan cari jalur memutar yang lebih panjang',
      ],
      requireDescs: ['Kamu melangkah tanpa memeriksa. Es pecah.', null],
    },
    safe_crossing: {
      title: 'Penyeberangan Aman',
      text: 'Kamu mengetuk dengan kapak es dan hanya menginjak es yang kokoh.\n20 menit kemudian kamu mencapai zona aman.\nStatsiun hanya 1km lagi.',
      choices: ['Berlari menuju stasiun'],
    },
    detour_path: {
      title: 'Jalan Memutar',
      text: 'Dua jam lagi berjalan. Tenaga benar-benar habis.\nStatsiun sudah terlihat. Kerahkan sisa tenaga terakhir.',
      choices: ['Ketuk pintu stasiun'],
    },
    ice_crack: {
      title: 'Celah Es',
      text: 'Es di bawah kakimu pecah.\nKamu jatuh ke dalam air yang sangat dingin.',
      endText: 'Es Antartika menyembunyikan bahaya yang tidak terlihat oleh mata.',
    },
    base_arrive: {
      title: 'Tiba di Stasiun',
      text: 'Pintu terbuka. Udara hangat membanjiri masuk.\n"Nama saya Nikos. Komandan stasiun. Ini Cheng. Kami baru saja akan mengorganisir tim pencarian."\nSecangkir cokelat panas diserahkan ke tanganmu.',
      endText: 'Kamu berjalan kembali dari suhu −38°C. Lampu-lampu stasiun tidak pernah seindah ini.',
    },
    hypothermia: {
      title: 'Hipotermia',
      text: 'Kamu menggigil — lalu berhenti. Kehangatan paradoksal hipotermia pun tiba.\nKamu jatuh di atas salju.',
      endText: 'Antartika tahu cara membuat orang mati dengan nyaman. Insulasi adalah segalanya.',
    },
  },
};
