export default {
  items: {
    knife:   { label: 'Pisau',      desc: 'Membuat jebakan · membuka jalur' },
    lighter: { label: 'Korek Api', desc: 'Menyalakan api · sinyal' },
    bottle:  { label: 'Botol Air', desc: 'Menyimpan air · filtrasi' },
  },
  scenes: {
    crash_site: {
      title: 'Lokasi Kecelakaan',
      text: 'Kamu membuka mata. Terjebak di reruntuhan helikopter. Bahu terasa nyeri, tapi tulang masih utuh. Asap yang semakin tebal memperingatkan kamu untuk segera pergi. Suara sungai terdengar dari arah barat.',
      choices: ['Bergerak menuju suara sungai', 'Geledah reruntuhan lebih dulu'],
    },
    wreck_search: {
      title: 'Menggeledah Reruntuhan',
      text: 'Di bawah kokpit kamu menemukan energy bar darurat. Tapi bau bahan bakar semakin kuat. Satu percikan api dan semuanya habis.',
      choices: ['Ambil energy bar dan segera keluar', 'Cari sedikit lagi'],
    },
    explosion: {
      title: 'Ledakan',
      text: 'Bahan bakar terbakar. Ledakan melontarkan tubuhmu menabrak pohon. Terdengar suara retak dari tulang rusuk.',
      endText: 'Tulang rusuk patah. Cedera terlalu parah untuk bertahan sendirian di dalam hutan.',
    },
    river_approach: {
      title: 'Tepi Sungai',
      text: 'Kamu tiba di sungai. Air keruh dan deras. Tenggorokan terasa terbakar. Minum tanpa filtrasi berisiko parasit.\n\nKamu melihat barang-barang yang dibawa. Pasti ada cara lain.',
      choices: [
        'Minum air sungai langsung',
        'Rebus air dengan korek api',
        'Isi botol dan terus bergerak',
        'Buat alat penyuling surya dengan botol dan korek api',
        'Tahan dahaga dan terus berjalan',
      ],
      requireDescs: [null, 'Tidak ada korek api', 'Tidak ada botol', 'Perlu botol dan korek api', null],
    },
    solar_still: {
      title: 'Penyuling Surya',
      text: 'Kamu memotong satu sisi botol dan meletakkannya di atas genangan air sebagai penyuling. Butuh waktu, tapi air bersih pun didapat.\n\nDalam prosesnya, permukaan botol yang berkilau memantulkan sinar matahari ke atas. Sesuatu di langit merespons. Tiga puluh menit kemudian — suara helikopter.',
      choices: ['Berlari ke tempat terbuka dan beri sinyal'],
    },
    early_rescue: {
      title: 'Penyelamatan Ajaib',
      text: 'Helikopter turun. Mata pilot membelalak.\n\n"Kamu... kami dengar kamu hilang kemarin. Bagaimana bisa secepat ini?"\n\nBotol air dan korek api — dua benda biasa yang menciptakan keajaiban yang luar biasa.',
      endText: 'Hari ke-1 — kombinasi botol dan korek api membuat pelarian di hari pertama menjadi mungkin.',
    },
    drink_raw: {
      title: 'Air Sungai Mentah',
      text: 'Kamu minum. Awalnya terasa baik-baik saja. Beberapa jam kemudian perut mulai melilit. Parasit.',
      choices: ['Tahan rasa sakit dan terus berjalan'],
    },
    boil_water: {
      title: 'Air Direbus',
      text: 'Kamu mengumpulkan kayu kering dan menyalakan api. Air sungai direbus hingga aman diminum. Bahan bakar korek api semakin berkurang.',
      choices: ['Ikuti aliran sungai ke hilir'],
    },
    day2_thirsty: {
      title: 'Dehidrasi',
      text: 'Tanda-tanda dehidrasi mulai muncul. Bibir pecah-pecah, kepala berdenyut.',
      choices: ['Cari anak sungai dan minum', 'Tahan dan terus bergerak'],
    },
    collapse: {
      title: 'Pingsan',
      text: 'Tubuh terasa memanas. Kaki tidak mau melangkah lagi.',
      endText: 'Pingsan akibat dehidrasi. Hutan tanpa air tidak bisa bertahan sehari pun.',
    },
    day2_path: {
      title: 'Hutan Hari Kedua',
      text: 'Pagi hari kedua. Seluruh tubuh terasa pegal. Anak sungai menghalangi jalan di depan. Rasa lapar yang sangat menyiksa.',
      choices: [
        'Seberangi anak sungai',
        'Buat jebakan dengan pisau untuk mendapat makanan',
        'Cari makanan dari tanaman sekitar',
        'Tampung air hujan di botol',
      ],
      requireDescs: [null, 'Tanpa pisau, jebakan tidak bisa dibuat', null, 'Tidak ada botol'],
    },
    rainwater: {
      title: 'Mengumpulkan Air Hujan',
      text: 'Kamu membentangkan botol untuk menampung tetes hujan yang jatuh dari daun. Air hujan yang bersih. Berguna di tempat yang tak terduga.',
      choices: ['Seberangi anak sungai'],
    },
    set_trap: {
      title: 'Memasang Jebakan',
      text: 'Kamu mengukir dahan dengan pisau untuk membuat perangkap. Seekor tikus kecil terjebak di pagi hari. Kamu memanggang dagingnya di atas api. Rasa lapar pun mereda.',
      choices: ['Seberangi anak sungai dan terus bergerak'],
    },
    forage: {
      title: 'Mencari Makanan',
      text: 'Kamu menemukan buah merah yang tampak menggoda. Warnanya bagus. Tapi banyak buah hutan yang beracun.',
      choices: ['Cium dulu lalu makan', 'Urungkan niat dan pergi ke sungai'],
    },
    forage_eat: {
      title: 'Buah Beracun',
      text: 'Sensasi terbakar di dalam mulut. Tanaman beracun. Kejang-kejang menjalar ke seluruh tubuh.',
      endText: 'Makan buah yang tidak dikenal di hutan adalah perjudian. Kesalahan yang fatal.',
    },
    river_cross: {
      title: 'Menyeberangi Anak Sungai',
      text: 'Kamu melangkah ke dalam anak sungai. Arusnya lebih deras dari perkiraan. Bagaimana cara menyeberang?',
      choices: [
        'Paksa saja langsung menyeberang',
        'Cari tempat dangkal dan memutar',
        'Buat tongkat dengan pisau untuk menyeberang dengan aman',
      ],
      requireDescs: [null, null, 'Tidak ada pisau'],
    },
    river_slip: {
      title: 'Terseret Arus',
      text: 'Kaki tergelincir. Kamu terseret 10 meter ke hilir. Susah payah meraih batu karang. Semua barang basah kuyup dan bahu terbentur.',
      choices: [
        'Nyalakan api dan keringkan diri',
        'Tetap basah dan terus bergerak',
      ],
      requireDescs: ['Tidak ada korek api', null],
    },
    river_safe: {
      title: 'Selamat Menyeberang',
      text: 'Butuh waktu, tapi berhasil menyeberang dengan selamat. Tenaga pun tersimpan.',
      choices: ['Terus bergerak'],
    },
    day3_fork: {
      title: 'Pagi Hari Ketiga',
      text: 'Hari ketiga. Hutan tampak sedikit menipis. Ada persimpangan jalan.\n\nAsap mengepul di sebelah kanan, jejak kaki telanjang membentang ke kiri.',
      choices: ['Pergi ke kanan menuju asap', 'Ikuti jejak kaki ke kiri'],
    },
    loggers_camp: {
      title: 'Kamp Penebang Liar',
      text: 'Sumber asap adalah kamp penebang kayu. Tiga pria bersenjata melihatmu. Tatapan mereka tidak bersahabat.\n\nKalau punya korek api, mungkin ada cara lain.',
      choices: [
        'Angkat tangan dan minta tolong',
        'Amati situasi dan diam-diam memutar',
        'Bakar semak di utara untuk menciptakan kekacauan',
      ],
      requireDescs: [null, null, 'Tidak ada korek api'],
    },
    loggers_betray: {
      title: 'Pengkhianatan',
      text: 'Sang pemimpin memberimu makan dan tempat tidur. Saat fajar kamu terbangun dalam keadaan terikat di suatu sudut hutan yang dalam.',
      endText: 'Dimanfaatkan oleh penebang liar. Kebaikan orang asing di tempat tak dikenal itu berbahaya.',
    },
    fire_diversion: {
      title: 'Pengalihan dengan Api',
      text: 'Kamu membakar semak di utara kamp dengan korek api. Para penebang berteriak dan berlari ke arah api. Kamu pun melewati tengah kamp — dan mengambil satu tas makanan dalam perjalanan keluar.\n\nKorek api yang tampaknya hanya untuk menyalakan api biasa, membuka jalan dengan cara yang paling tak terduga.',
      choices: ['Terus berlari'],
    },
    loggers_sneak: {
      title: 'Berhasil Memutar',
      text: 'Kamu merayap melewati kamp. Jalur tebangan yang dibuat para penebang terlihat jelas. Mengikutinya mempercepat langkahmu.',
      choices: ['Terus ikuti jalur'],
    },
    tribe_encounter: {
      title: 'Penduduk Asli',
      text: 'Pemilik jejak kaki itu muncul. Dua orang penduduk asli bersenjatakan tombak mengepungmu. Satu gerakan menentukan segalanya.',
      choices: [
        'Perlahan angkat tangan untuk menunjukkan tidak berbahaya',
        'Keluarkan korek api dan tunjukkan nyala apinya',
        'Cari kesempatan dan kabur',
      ],
      requireDescs: [null, 'Tidak ada korek api', null],
    },
    tribe_peace: {
      title: 'Kepercayaan',
      text: 'Setelah hening yang panjang, penduduk asli menurunkan tombaknya. Mereka membawamu ke desa dan memberi makan serta minum. Keesokan paginya, mereka menunjukkan arah yang harus dituju.',
      choices: ['Pergi ke arah yang ditunjukkan'],
    },
    tribe_gift: {
      title: 'Hadiah Api',
      text: 'Saat kamu menyerahkan korek api, mata penduduk asli itu berbinar. Mereka tertawa dan menyambutmu dengan hangat. Kamu mendapat makanan dan petunjuk arah, serta beristirahat semalam.',
      choices: ['Berangkat'],
    },
    tribe_run: {
      title: 'Melarikan Diri',
      text: 'Kamu berlari. Tombak nyaris menyerempet kepalamu. Suara penduduk asli menjauh — tapi kamu kehilangan arah. Butuh setengah hari untuk menemukan sungai kembali.',
      choices: ['Ikuti sungai ke hilir'],
    },
    researcher_event: {
      title: 'Peneliti Tak Terduga',
      text: 'Berjalan dengan tubuh yang kelelahan, kamu berjumpa dua pria di ujung hutan.\n\nSatu orang asing yang penuh energi terus bergumam sendiri tentang jaringan terdesentralisasi. Yang satu lagi pendiam tapi tatapannya tajam. Ransel mereka berisi peralatan satelit.\n\n"Nama saya Nikos. Ini Cheng." Perkenalan singkat, lalu tanpa banyak kata mereka menyerahkan secarik kertas berisi koordinat GPS.\n\n"Enam jam ke arah itu dan kamu akan menemukan jalan."\n\nKamu bertanya bagaimana mereka bisa ada di sini — tapi mereka hanya tersenyum dan menghilang ke dalam hutan.',
      choices: ['Ikuti koordinat'],
    },
    day4_final: {
      title: 'Hari Terakhir',
      text: 'Sore hari keempat. Hutan terbuka. Jalan aspal dan kendaraan terlihat di kejauhan. Kamu harus mengeluarkan sisa tenaga terakhir.',
      choices: [
        'Berlari sekuat tenaga menuju jalan',
        'Kirim sinyal asap',
        'Berteriak sekeras-kerasnya',
        'Pantulkan sinar matahari dengan botol sebagai sinyal',
      ],
      requireDescs: [null, 'Tidak ada korek api', null, 'Tidak ada botol'],
    },
    success_run: {
      title: 'Lari Total',
      text: 'Kamu menuangkan semua tenaga terakhir untuk berlari. Kamu mencapai jalan. Sebuah truk yang lewat pun berhenti.',
      endText: 'Bertahan hidup selama empat hari di hutan Amazon.',
    },
    success_signal: {
      title: 'Sinyal Asap',
      text: 'Kamu mengumpulkan daun kering dan membuat asap. Tiga puluh menit kemudian seseorang berlari dari arah jalan.',
      endText: 'Bertahan hidup selama empat hari di hutan Amazon.',
    },
    success_shout: {
      title: 'Teriakan Keras',
      text: 'Kamu berteriak hingga suara habis. Sebuah mobil di jalan berhenti dan seseorang turun.',
      endText: 'Bertahan hidup selama empat hari di hutan Amazon.',
    },
    success_mirror: {
      title: 'Sinyal Pantulan',
      text: 'Kamu menggunakan permukaan botol yang halus untuk memantulkan sinar matahari. Kendaraan di jalan berhenti dan pengemudinya berjalan ke arahmu.\n\nBotol kembali berperan di saat yang tak terduga.',
      endText: 'Bertahan hidup selama empat hari di hutan Amazon. Botol berguna hingga akhir.',
    },
  },
};
