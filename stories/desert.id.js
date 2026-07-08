export default {
  items: {
    hat:    { label: 'Topi',         desc: 'Pelindung matahari · adat gurun' },
    mirror: { label: 'Cermin',       desc: 'Sinyal · menentukan arah' },
    cloth:  { label: 'Kain Lebar',   desc: 'Tenda · perisai badai pasir' },
  },
  scenes: {
    storm_end: {
      title: 'Setelah Badai',
      text: 'Badai pasir berakhir. Kamu membuka mata — pasir ke segala arah.\nKendaraan ekspedisi dan semua perlengkapan lenyap.\nMatahari tepat di atas kepala. Kulitmu sudah terasa terbakar.\nJauh di sana, terlihat dinding batu reruntuhan era Romawi.',
      choices: [
        'Gunakan posisi matahari sebagai kompas dan berjalan',
        'Berlindung di dinding reruntuhan dan nilai situasi',
        'Coba pantulkan sinar matahari dengan cermin',
      ],
      requireDescs: [null, null, 'Tidak ada cermin'],
    },
    mirror_signal_open: {
      title: 'Keajaiban',
      text: 'Kamu mengatur sudut pantulan dan cahaya pun memancar keluar.\nBeberapa menit kemudian, sebuah helikopter di kejauhan mulai berbelok.\nLima menit kemudian helikopter mendarat. Tim penyelamat.\n"Bagaimana kamu bisa memberi sinyal sepresisi itu dari sana?" Sebuah cermin kecil membelah gurun.',
      endText: 'Cermin kecil menjembatani gurun dan langit. Waktu pelarian — 23 menit.',
    },
    shadow_walk: {
      title: 'Kompas Matahari',
      text: 'Kamu menggunakan bayangan tongkat untuk menentukan arah. Timur laut seharusnya menuju jalan.\nTapi panas siang bolong sangat menyiksa. Sesuatu berkilau di kejauhan.\nOasis, atau fatamorgana?',
      choices: [
        'Berlari menuju kilau itu',
        '[Topi] Berjalan perlahan menuju punggung bukit yang teduh',
        '[Kain] Buat tenda darurat dan hindari panas',
      ],
      requireDescs: [null, 'Tidak ada pelindung matahari', 'Tidak ada kain untuk membuat tempat teduh'],
    },
    mirage_chase: {
      title: 'Fatamorgana',
      text: 'Kamu berlari, tapi tidak ada apa-apa di sana. Fatamorgana.\nKamu jatuh tersungkur. Mual mulai menyerang.\nTenaga benar-benar habis. Berdiri sendiri pun hampir tidak bisa.',
      choices: [
        'Merangkak menuju punggung bukit dengan sisa tenaga terakhir',
        '[Kain] Tutup diri dengan kain dan bersiap perjalanan malam',
      ],
      requireDescs: [null, 'Tidak ada cara membuat tempat teduh. Kamu pingsan.'],
    },
    cloth_shelter: {
      title: 'Tenda Pasir',
      text: 'Kamu membentangkan kain di antara dua batu sebagai tenda darurat.\nKamu tidur melewati panas siang yang menyengat.\nMalam tiba. Suhu turun dari 37°C ke 18°C.\nBintang-bintang memenuhi langit. Orion menunjukkan arah timur.',
      choices: ['Berjalan sepanjang malam menggunakan bintang sebagai kompas', 'Tunggu fajar lalu berangkat'],
    },
    night_march: {
      title: 'Malam Gurun',
      text: 'Kamu berjalan di bawah cahaya bintang. Udara sejuk.\nSekitar tiga jam kemudian, cahaya berkedip terlihat di kejauhan — seperti api unggun.',
      choices: ['Dekati cahaya itu', 'Abaikan cahaya dan terus berjalan menuju jalan'],
    },
    dawn_start: {
      title: 'Keberangkatan Fajar',
      text: 'Pukul lima pagi, cakrawala memerah.\nSuhu tubuh pulih. Di balik punggung bukit yang jauh, terlihat garis aspal hitam.',
      choices: ['Daki punggung bukit dan menuju jalan'],
    },
    shaded_march: {
      title: 'Ukiran Reruntuhan',
      text: 'Topi mengurangi pemborosan energi.\nSegera terlihat relief ukiran di dinding reruntuhan.\nPeta bintang dan tanda arah — penanda jalan yang ditinggalkan karavan kuno.\nTimur laut — menuju oasis.',
      choices: ['Pergi ke timur laut', 'Cari air di dalam reruntuhan'],
    },
    oasis_path: {
      title: 'Menuju Oasis',
      text: 'Dua jam berjalan dan pohon palem sudah terlihat.\nNyata. Langkah pun semakin cepat.',
      choices: ['Berlari'],
    },
    oasis_found: {
      title: 'Oasis',
      text: 'Ada sumur di bawah pohon kurma.\nKamu menarik air dan minum sepuasnya. Tenaga kembali.\nSekarang pilihannya — tunggu di sini, atau terus bergerak?',
      choices: ['Tunggu di oasis untuk diselamatkan', 'Minum sepuasnya lalu menuju jalan'],
    },
    oasis_wait: {
      title: 'Menunggu',
      text: 'Dua hari berlalu tapi tidak ada yang datang.\nAda air, tapi tidak ada makanan.\nKamu tidak bisa bertahan lebih lama. Harus bergerak.',
      choices: ['Kerahkan sisa tenaga terakhir menuju jalan'],
    },
    ruin_explore: {
      title: 'Reruntuhan Romawi',
      text: 'Ini adalah Porta Magna Romawi. Di dalam, tangga turun ke bawah tanah — fasilitas penyimpanan.\nDi bagian bawah, ada cistern kuno — masih ada airnya!',
      choices: [
        'Minum dan pulihkan diri, lalu tentukan arah',
        'Jelajahi lebih dalam ke reruntuhan',
      ],
    },
    ruin_deep: {
      title: 'Dua Orang',
      text: 'Cahaya masuk dari dalam aula yang dalam.\nDua laptop terbuka, dua orang duduk di sana.\nSatu berdiri dan berbicara. "Nama saya Nikos. Kami sedang melakukan survei geologi. Ini Cheng."\nCheng sudah mengeluarkan telepon satelit. "Saya akan hubungi penyelamat. Dua puluh menit."',
      choices: ['Dengan lega menunggu helikopter penyelamat'],
    },
    researcher_rescue: {
      title: 'Penyelamatan',
      text: 'Helikopter datang. Nikos dan Cheng tetap di sini untuk melanjutkan pengumpulan data.\n"Kami menyebutnya Protokol Gurun. Kamu bertahan bahkan dalam kondisi seperti ini."\nKeduanya melambaikan tangan dan menghilang kembali ke dalam reruntuhan.',
      endText: 'Dua orang tak terduga ada di dalam reruntuhan. Mereka muncul dan menghilang seperti takdir.',
    },
    ridge_overlook: {
      title: 'Pemandangan dari Punggung Bukit',
      text: 'Dari punggung bukit terlihat aspal jauh di sana.\nSekitar tiga jam jalan kaki. Tapi awan debu coklat mengepul di cakrawala.\nBadai lain akan datang.',
      choices: [
        'Sprint menuju jalan sebelum badai tiba',
        '[Kain] Bungkus diri dengan kain dan hadapi badai',
        'Sembunyi di celah batu',
      ],
      requireDescs: [null, 'Tidak ada yang bisa membungkus diri. Badai melanda.', null],
    },
    storm_race: {
      title: 'Berlomba dengan Badai',
      text: 'Kamu berlari, tapi badai lebih cepat.\nPasir menusuk mata dan kamu kehilangan arah.\nKeesokan paginya kamu terbangun tanpa sisa tenaga.',
      choices: ['Merangkak menuju jalan dengan cadangan terakhir'],
    },
    cloth_storm_survive: {
      title: 'Melewati Badai',
      text: 'Kamu menutup mata dan hidung dengan kain lalu berjongkok.\nDua jam kemudian badai berlalu. Tidak sebutir pasir pun masuk.\nJalan terasa semakin dekat.',
      choices: ['Menuju jalan'],
    },
    rock_shelter: {
      title: 'Celah Batu',
      text: 'Kamu bertahan dari badai. Tapi tenggorokan terasa terbakar.\nDi dalam celah, ada botol air yang setengah tertimbun. Ditinggalkan tim ekspedisi. Masih ada sedikit air di dalamnya.',
      choices: ['Minum dan menuju jalan'],
    },
    bedouin_camp: {
      title: 'Kamp Badui',
      text: 'Kamp nomaden Badui.\nKaravan unta akan berangkat ke desa di pinggir gurun dalam tiga hari.\nSang kepala suku memberi isyarat — mau ikut?',
      choices: [
        'Ikut dalam karavan',
        '[Topi] Berikan topi sebagai hadiah dan minta perjalanan lebih cepat',
      ],
      requireDescs: [null, 'Tidak ada yang bisa dipersembahkan'],
    },
    hat_gift: {
      title: 'Adat Gurun',
      text: 'Di gurun, topi adalah hadiah yang berharga.\nMata kepala suku berbinar disertai senyum. Ia menawarkan untanya yang terbaik.\nKamu tiba di desa dalam sehari.',
      choices: ['Tunggangi unta menuju desa'],
    },
    caravan_join: {
      title: 'Karavan',
      text: 'Matahari terbenam gurun yang terlihat dari atas punggung unta membuat air mata menetes.\nTiga hari kemudian, menara desa terlihat.',
      choices: ['Masuk ke desa'],
    },
    highway_sight: {
      title: 'Aspal',
      text: 'Aspal di bawah kakimu. Sepuluh menit kemudian sebuah truk mengangkat debu dan berhenti.\nPengemudi mengulurkan air. "Kamu datang dari mana?"',
      choices: ['Naik ke dalam truk'],
    },
    success_town: {
      title: 'Tiba di Desa',
      text: 'Anak-anak berlari menyambut saat kamu memasuki desa.\nSegelas air bersih. Sepotong roti. Hal-hal paling lezat di dunia.',
      endText: 'Gurun mengembalikanmu. Lebih kuat dari sebelumnya.',
    },
    success_highway: {
      title: 'Lolos',
      text: 'Kamu merasakan AC dari kursi penumpang truk.\nGurun mengecil di jendela belakang.',
      endText: 'Tiga hari di gurun. Selamat di atas aspal.',
    },
    desert_collapse: {
      title: 'Batas Kemampuan',
      text: 'Kamu tidak bisa bergerak lagi.\nPasir memenuhi pandangan. Kesadaran memudar.',
      endText: 'Panas gurun mengambil segalanya. Kurang satu langkah.',
    },
  },
};
