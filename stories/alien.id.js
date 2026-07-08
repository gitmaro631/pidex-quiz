export default {
  items: {
    crystal:    { label: 'Kristal Resonansi', desc: 'Amplifikasi frekuensi · komunikasi tak dikenal' },
    suit_patch: { label: 'Kit Perbaikan Pakaian', desc: 'Menjaga tekanan · mobilitas' },
    beacon:     { label: 'Beacon Darurat',    desc: 'Sinyal penyelamatan ke kapal induk' },
  },
  scenes: {
    crashed_lander: {
      title: 'Pendaratan KEPLER-3',
      text: 'Mesin lander gagal. Pendaratan darurat.\nPermukaan planet KEPLER-3. Atmosfer tidak bisa dihirup tapi tekanan bertahan.\nKapal induk meninggalkan orbit ini dalam 72 jam.\nLog hologram dari tim ekspedisi sebelumnya berkedip di dalam lander.',
      choices: [
        'Putar log hologram',
        'Segera aktifkan beacon dan kirim sinyal mayday',
        'Jelajahi di luar lander',
      ],
    },
    holo_log: {
      title: 'Log Ekspedisi Sebelumnya',
      text: 'Dua wajah muncul dalam hologram.\n"Nama saya Nikos. Komandan ekspedisi pertama. Kristal resonansi di planet ini adalah bahasa kehidupan alien.\nJangan ambil satu — atau, jika kamu sudah memilikinya, itu akan menjadi kuncimu.\nCheng yang menemukannya. Kristal itu menyesuaikan diri dengan frekuensi komunikasi mereka."\nLog pun terputus.',
      choices: [
        '[Kristal] Keluarkan kristal dan sambungkan ke beacon',
        'Aktifkan beacon dan pergi menjelajah',
      ],
      requireDescs: ['Tidak ada kristal. Aktifkan beacon saja.', null],
    },
    crystal_beacon: {
      title: 'Amplifikasi Resonansi',
      text: 'Saat kamu menempelkan kristal ke antena beacon, frekuensi meledak keluar.\nSinyal yang biasanya butuh 72 jam mencapai kapal induk dalam 4 menit.\n"Kapal induk di sini. Posisi lander dikonfirmasi. Shuttle pemulihan diluncurkan. ETA 90 menit."\nKristal bergetar — seolah-olah sesuatu telah merespons.',
      endText: 'Kristal resonansi melayani dua tujuan. Jembatan ke kapal induk, dan sapaan pertama ke planet ini.',
    },
    beacon_deploy: {
      title: 'Beacon Aktif',
      text: 'Kamu mengaktifkan beacon. Transmisi sinyal dimulai.\nTapi kekuatan penerimaan terlalu rendah. Butuh setidaknya 40 jam untuk mencapai kapal induk.\nWaktu semakin habis.',
      choices: [
        '[Kristal] Perkuat sinyal dengan kristal',
        'Biarkan sinyal berjalan dan pergi menjelajah',
        '[Perbaikan Pakaian] Perbaiki lander dan naikkan antena lebih tinggi',
      ],
      requireDescs: ['Kekuatan sinyal tidak cukup. Harus menunggu lebih lama.', null, 'Tidak ada alat perbaikan'],
    },
    antenna_boost: {
      title: 'Perbaikan Antena',
      text: 'Kamu menaikkan antena eksternal dengan kit perbaikan.\nKekuatan sinyal tiga kali lipat.\nAda respons dari kapal induk. "Dikonfirmasi. Shuttle pemulihan diluncurkan. ETA 6 jam."',
      choices: ['Tunggu di lander untuk kapal induk'],
    },
    surface_explore: {
      title: 'Permukaan Planet',
      text: 'Dataran berwarna ungu. Cahaya meresap dari bebatuan.\nMaterial yang sama dengan kristal resonansi.\nSesuatu bergerak di kejauhan. Sebuah bentuk kehidupan.',
      choices: [
        '[Kristal] Keluarkan kristal dan perlahan dekati bentuk kehidupan itu',
        'Hindari bentuk kehidupan itu dan kembali ke lander',
        'Angkat tangan ke arah bentuk kehidupan itu',
      ],
      requireDescs: ['Tidak ada kristal. Bentuk kehidupan terasa mengancam — kamu mundur.', null, null],
    },
    alien_contact: {
      title: 'Kontak Pertama',
      text: 'Kamu mengulurkan kristal dan bentuk kehidupan itu berhenti.\nIa juga memiliki satu. Dua kristal saling bertukar getaran.\nGambar-gambar masuk ke pikiranmu — lander, kapal induk, orbit, jalur yang terhubung langsung.\nMereka ingin memandumu.',
      choices: ['Ikuti panduan bentuk kehidupan itu'],
    },
    alien_guide: {
      title: 'Dipandu',
      text: 'Bentuk kehidupan itu membawamu ke puncak sebuah bukit.\nDi sana berdiri struktur amplifikasi sinyal yang masif. Milik mereka.\nSaat kamu menempelkan kristal ke struktur itu, sinyal melesat ke atas.\n"Kapal induk di sini. Sinyal kuat apa itu? Posisi lander dikonfirmasi. Segera mengambil."',
      endText: 'Kontak alien pertama umat manusia. Salurannya adalah satu kristal resonansi. Dan keberanian.',
    },
    alien_hostile: {
      title: 'Kesalahpahaman',
      text: 'Bentuk kehidupan itu mengeluarkan suara alarm. Sekelompok bergerumul.\nMereka mencoba merobek pakaianmu.',
      endText: 'Gerakan tanpa senjata atau kristal dibaca sebagai ancaman. Mendekati tanpa komunikasi itu berbahaya.',
    },
    back_to_lander: {
      title: 'Kembali ke Lander',
      text: 'Kamu kembali ke lander. Beacon berkedip-kedip.\nSinyal belum mencapai kapal induk.\nOksigen tersisa — 20 jam.',
      choices: [
        '[Kristal] Perkuat beacon dengan kristal sekarang',
        '[Perbaikan Pakaian] Perbaiki antena lander dan naikkan',
        'Tunggu sinyal tembus',
      ],
      requireDescs: ['Tidak ada kristal. Tunggu sinyal.', 'Tidak ada alat perbaikan. Menunggu.', null],
    },
    wait_pickup: {
      title: 'Menunggu',
      text: 'Enam jam kemudian, shuttle pemulihan mendarat.\nPilot membuka palka. "Kamu masih hidup!"',
      choices: ['Naik ke shuttle'],
    },
    wait_timeout: {
      title: 'Waktu Habis',
      text: 'Kapal induk meninggalkan orbit. Sinyal tidak pernah tembus.\nOksigen habis.',
      endText: 'Jendela 72 jam tertutup. Waktu adalah segalanya.',
    },
    success_pickup: {
      title: 'Kembali',
      text: 'Shuttle merapat dengan kapal induk.\nAwak kapal bertepuk tangan.\nPlanet KEPLER-3 mengecil melalui jendela.',
      endText: 'Kamu kembali hidup-hidup dari planet yang tidak dikenal. Luar angkasa sangat luas, manusia sangat kecil — tapi ulet.',
    },
  },
};
