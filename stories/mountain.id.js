export default {
  items: {
    rope:  { label: 'Tali',              desc: 'Pengaman · rappel · mengikat' },
    flare: { label: 'Suar Sinyal',       desc: 'Sinyal penyelamatan · penghalau satwa liar' },
    tea:   { label: 'Teh Ketinggian',    desc: 'Meredakan altitude sickness · menghangatkan tubuh' },
  },
  scenes: {
    snowfield: {
      title: 'Setelah Longsoran Salju',
      text: 'Kamu membuka mata. 4.800 meter di atas permukaan laut.\nLongsoran salju menelan tim trekking.\nKamu sendirian. Harus turun melewati punggung bukit.\nAngin seperti pisau yang memotong.',
      choices: [
        'Turun menyusuri lereng',
        'Ikuti punggung bukit untuk membaca medan',
        '[Tali + Suar] Ikat suar ke tali dan tembakkan melintasi lembah',
      ],
      requireDescs: [null, null, 'Perlu tali dan suar'],
    },
    zipline_combo: {
      title: 'Zipline Darurat',
      text: 'Kamu mengikat suar ke tali dan menembakkannya ke batu di seberang lembah.\nBerhasil tersangkut. Tali pun menjadi tegang.\nKamu bergelantungan dan berayun ke seberang. Di sisi lain — tempat perlindungan darurat tim.\nRekan-rekan berlari menghampiri. "Bagaimana kamu bisa sampai di sini?!"',
      endText: 'Tali dan suar. Peralatan biasa secara terpisah — jalan keluar jika digabungkan.',
    },
    slope_descent: {
      title: 'Lereng Terjal',
      text: 'Lereng es. Satu langkah yang salah berarti jatuh ratusan meter.\nRetakan-retakan celah menganga di mana-mana.',
      choices: [
        '[Tali] Pasang tali pengaman dan turun perlahan',
        'Langsung saja turun',
      ],
      requireDescs: ['Tidak ada pengaman — terlalu berbahaya', null],
    },
    slip_fall: {
      title: 'Terjatuh',
      text: 'Kakimu tergelincir.\nKamu meluncur 20 meter seketika. Menabrak batu karang.\nKesadaran memudar.',
      endText: 'Himalaya tidak memberikan ruang untuk kelalaian. Satu langkah yang terlalu ringan.',
    },
    safe_descent: {
      title: 'Turun dengan Selamat',
      text: 'Tali membantumu turun dengan aman.\nDi bawah, terlihat jalur lembah yang sempit.\nAltitude sickness mulai muncul. Kepala berdenyut-denyut.',
      choices: [
        '[Teh Ketinggian] Minum teh untuk meredakan gejala',
        'Abaikan dan ikuti jalur lembah',
      ],
      requireDescs: ['Altitude sickness semakin parah', null],
    },
    tea_boost: {
      title: 'Kehangatan Teh',
      text: 'Kehangatan menjalar ke seluruh tubuh. Gejala altitude sickness mereda.\nPikiranmu menjernihkan. Asap terlihat di bawah lembah.\nAda seseorang yang tinggal di sana.',
      choices: ['Pergi ke arah asap'],
    },
    ridge_path: {
      title: 'Di Punggung Bukit',
      text: 'Dari punggung bukit terlihat menara stasiun cuaca di kejauhan.\nDi lereng seberang, ada sesuatu yang terlihat seperti atap kuil.\nAngin semakin kencang. Badai akan datang.',
      choices: [
        'Pergi ke menara stasiun cuaca',
        'Turun menuju kuil',
        '[Tali] Pasang tali pengaman dan seberangi punggung bukit dalam badai',
      ],
      requireDescs: [null, null, 'Tanpa tali, punggung bukit dalam badai adalah bunuh diri'],
    },
    weather_station: {
      title: 'Stasiun Cuaca',
      text: 'Kukira tidak berpenghuni. Pintu terbuka — ada dua orang di dalam.\n"Nama saya Nikos. Kami mengumpulkan data iklim. Ini Cheng."\nCheng sudah mengeluarkan telepon satelit. "Saya akan hubungi penyelamat. Empat puluh lima menit."\nKeduanya mengatakan akan tetap di sini untuk melanjutkan pengumpulan data setelah badai.',
      choices: ['Tunggu helikopter penyelamat'],
    },
    ridge_cross: {
      title: 'Menyeberangi Punggung Bukit',
      text: 'Kamu mengamankan diri ke batu seperti tim tali dan menyeberangi punggung bukit.\nBadai mengamuk tapi tali bertahan.\nDi sisi lain, atap kuil sudah ada di depan.',
      choices: ['Pergi ke kuil'],
    },
    valley_path: {
      title: 'Jalur Lembah',
      text: 'Tiga jam berjalan. Suara nyanyian terdengar dari kejauhan.\nAda jejak kaki di salju. Orang-orang melewati jalur ini.',
      choices: [
        'Ikuti suara nyanyian',
        '[Suar] Tembakkan sinyal penyelamatan',
      ],
      requireDescs: [null, 'Tidak ada cara memberi sinyal'],
    },
    snowstorm_caught: {
      title: 'Di Dalam Badai',
      text: 'Blizzard dahsyat memotong jarak pandang. Kamu kehilangan arah.\nHipotermia mulai muncul. Tangan dan kaki kehilangan rasa.',
      choices: [
        '[Suar] Tembakkan suar ke langit malam',
        'Gali ke dalam salju dan bivak',
      ],
      requireDescs: ['Kamu roboh diam-diam di tempat yang tidak dikenal.', null],
    },
    snow_bivouac: {
      title: 'Bivak Salju',
      text: 'Kamu menggali gua salju. Memblokir angin membawa sedikit kehangatan.\nMenjelang fajar badai berlalu.\nTapi altitude sickness semakin parah.',
      choices: [
        '[Teh Ketinggian] Minum teh dan tekan gejalanya',
        'Abaikan altitude sickness dan terus maju',
      ],
      requireDescs: ['Altitude sickness memburuk. Kesadaran memudar.', null],
    },
    tea_saves: {
      title: 'Secangkir Terakhir',
      text: 'Teh ketinggian yang panas memulihkan kesadaran.\nCahaya menembus salju — fajar.\nDi bawah, siluet kuil mulai terlihat.',
      choices: ['Turun menuju kuil'],
    },
    altitude_death: {
      title: 'Altitude Sickness',
      text: 'Segalanya memutih. Altitude sickness menekan otakmu.\nKamu roboh diam-diam di salju pada ketinggian 4.600 meter.',
      endText: 'Ketinggian mengalahkanmu. Selalu dekati gunung dengan rasa hormat.',
    },
    monastery_near: {
      title: 'Biara Tibet',
      text: 'Pintu kayu tua berderit terbuka.\nSeorang biarawan keluar, mengatupkan tangan, dan memandumu masuk.\nRuangan yang hangat. Aroma teh mentega yak.',
      choices: [
        'Minta bantuan dan hubungi penyelamat',
        '[Teh Ketinggian] Keluarkan teh ketinggian dan bagikan',
      ],
      requireDescs: [null, 'Tidak ada yang bisa dibagikan'],
    },
    tea_ceremony: {
      title: 'Persembahan Teh',
      text: 'Saat kamu mengeluarkan teh ketinggian, mata biarawan itu berbinar.\nDaun teh regional yang sama — varietas perdagangan kuno.\nKepala biarawan secara pribadi menawarkan untuk memandumu melalui jalur perdagangan menuju desa.\nJalur yang lebih cepat dari helikopter, katanya.',
      choices: ['Ikuti panduan biarawan'],
    },
    monk_help: {
      title: 'Telepon Satelit',
      text: 'Biarawan mengeluarkan telepon satelit kuno.\nTiga puluh menit kemudian, suara baling-baling helikopter penyelamat terdengar.',
      choices: ['Naik helikopter'],
    },
    flare_signal: {
      title: 'Sinyal Merah',
      text: 'Suar mewarnai hamparan salju menjadi merah.\nLima belas menit kemudian, helikopter pencari muncul dengan baling-baling yang berputar.',
      choices: ['Naik helikopter'],
    },
    success_heli: {
      title: 'Penyelamatan',
      text: 'Saat kamu memasang masker oksigen di dalam helikopter, dunia kembali jelas.\nMelalui jendela, puncak bersalju Himalaya mengecil.',
      endText: 'Gunung melepaskanmu. Kembalilah dalam keadaan hidup.',
    },
    success_monastery: {
      title: 'Meninggalkan Biara',
      text: 'Para biarawan mengatupkan tangan di pintu masuk biara.\nDi kejauhan, lampu kendaraan penyelamat terlihat.',
      endText: 'Biara Himalaya menampungmu. Seseorang yang turun dari 4.800 meter.',
    },
  },
};
