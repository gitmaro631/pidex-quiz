export default {
  items: {
    gas_mask: { label: 'Masker Gas',     desc: 'Memblokir gas vulkanik' },
    rope:     { label: 'Tali',           desc: 'Rappel tebing · menyeberangi medan lava' },
    mirror:   { label: 'Cermin Sinyal',  desc: 'Sinyal ke kapal yang lewat' },
  },
  scenes: {
    eruption_caught: {
      title: 'Letusan',
      text: 'Dentuman menggelegar dari pusat pulau.\nLetusan tiba-tiba. Kamu sedang di sini untuk survei penelitian.\nLava mengalir menuruni lereng timur.\nKamu harus mencapai pantai. Dua rute tersedia.',
      choices: [
        'Ikuti jalur pantai utara',
        '[Tali] Rappel langsung turun dari tebing barat ke pantai',
        '[Cermin] Beri sinyal segera ke kapal yang lewat di laut',
      ],
      requireDescs: [null, 'Tebing terlalu berbahaya tanpa tali', 'Tidak ada cara memberi sinyal'],
    },
    mirror_signal_sea: {
      title: 'Sinyal Laut',
      text: 'Kamu memantulkan cahaya dari tebing pantai dengan cermin.\n5 menit kemudian, sebuah perahu nelayan 2km jauhnya mengubah haluan.\nSebuah perahu diturunkan. "Ada apa? Pulau ini berasap."',
      endText: 'Cermin menghubungkan pulau dan laut. Lolos 20 menit setelah letusan dimulai.',
    },
    cliff_rappel: {
      title: 'Rappel Tebing',
      text: 'Kamu mengaitkan tali ke batu dan rappel turun.\nDi bawah, ada gua pantai kecil.\nOmbak tidak masuk ke dalam — aman.',
      choices: [
        '[Cermin] Beri sinyal ke kapal yang lewat dari pintu gua',
        'Beristirahat di gua dan pikirkan langkah selanjutnya',
      ],
      requireDescs: ['Tidak ada sinyal. Tunggu perahu.', null],
    },
    cove_signal: {
      title: 'Sinyal dari Gua',
      text: 'Kamu memainkan cermin di sela-sela ombak.\nSebuah perahu nelayan berbalik arah.\n"Letusan sudah mulai dan kamu masih ada di pulau?!"',
      endText: 'Gua tersembunyi di bawah tebing adalah tempat berlindung. Tali dan cermin adalah penyelamat.',
    },
    cove_shelter: {
      title: 'Gua Pantai',
      text: 'Bagian dalam gua terasa sejuk.\nSuara ombak bercampur dengan ledakan yang jauh.\nLava memblokir arah timur. Kamu harus menuju pantai barat.',
      choices: ['Bergerak menyusuri pantai menuju pesisir barat'],
    },
    coast_path: {
      title: 'Jalur Pantai',
      text: 'Kamu bergerak menyusuri pantai utara.\nTiba-tiba gas vulkanik menggulung masuk.\nBau belerang. Mata perih dan batuk-batuk.',
      choices: [
        '[Masker Gas] Pakai masker dan terobos maju',
        'Tutup hidung dengan baju dan sprint menembus gas',
        'Putar balik dan cari rute lain',
      ],
      requireDescs: ['Tidak ada cara memblokir gas. Paru-paru terasa terbakar.', null, null],
    },
    gas_passage: {
      title: 'Melewati Gas',
      text: 'Masker gas memblokir segalanya.\n10 menit kemudian kamu keluar menghirup udara segar.\nPantai barat sudah tepat di depan.',
      choices: ['Pergi ke pantai barat'],
    },
    dash_through_gas: {
      title: 'Sprint Total',
      text: 'Kamu menahan napas dan berlari. 30 detik terasa terlalu lama.\nKamu mencapai pantai tapi tidak bisa berhenti batuk.\nParu-paru rusak.',
      choices: ['Beri sinyal dari pantai'],
    },
    inland_detour: {
      title: 'Memutar Melalui Daratan',
      text: 'Kamu memutar melewati medan lava. Panasnya luar biasa.\nTerlihat pondok penelitian. Ada dua orang di dalam.',
      choices: ['Pergi ke pondok'],
    },
    volcanologist_meet: {
      title: 'Para Vulkanolog',
      text: '"Nama saya Nikos. Vulkanolog. Ini Cheng."\n"Kami juga harus evakuasi. Kami punya perahu karet. Ayo ikut."\nCheng mengeluarkan dua masker gas tambahan.',
      choices: ['Lolos dengan perahu'],
    },
    west_coast: {
      title: 'Pantai Barat',
      text: 'Kamu mencapai pantai barat.\nPerahu-perahu nelayan terlihat jauh di balik ombak.\nKamu perlu memberi sinyal.',
      choices: [
        '[Cermin] Beri sinyal ke perahu nelayan dengan cermin',
        '[Masker Gas + Tali] Pakai masker gas, rappel tebing, dan lompat ke ombak',
        'Tunggu perahu di pantai',
      ],
      requireDescs: ['Tidak ada sinyal. Perahu berlalu.', 'Perlu masker gas dan tali', null],
    },
    ocean_swim: {
      title: 'Melarikan Diri ke Laut',
      text: 'Kamu mengamankan tali ke tebing dan turun ke ombak.\nKamu berenang dengan masker gas memblokir gas.\nSebuah perahu nelayan semakin mendekat.',
      choices: ['Pegang perahu nelayan itu'],
    },
    wait_coast: {
      title: 'Menunggu',
      text: 'Keesokan harinya, sebuah perahu mendekat.\n"Kami datang untuk memeriksa — ada banyak asap dari pulau ini."',
      choices: ['Naik ke perahu'],
    },
    gas_death: {
      title: 'Gas Vulkanik',
      text: 'Gas belerang memenuhi paru-paru.\nTidak ada masker gas.',
      endText: 'Gas vulkanik menyerang paru-paru sebelum baunya tercium.',
    },
    lava_death: {
      title: 'Lava',
      text: 'Lava memblokir jalan. Sudah terlambat.',
      endText: 'Lava tidak menunggu.',
    },
    success_boat_escape: {
      title: 'Lolos',
      text: 'Kamu keluar dari pulau dengan perahu karet.\nMenoleh ke belakang, pusat pulau menyemburkan kolom api.\n"Data sudah semua didapat." Cheng mengangkat tablet.',
      endText: 'Kamu keluar dari pulau vulkanik yang sedang meletus. Beserta datanya.',
    },
    success_rescue_boat: {
      title: 'Penyelamatan di Laut',
      text: 'Kamu memandangi pulau dari geladak.\nLava sedang menulis ulang garis pantai.\nSatu jam lagi dan tidak akan ada jalan keluar.',
      endText: 'Pulau vulkanik hidup dalam waktu geologis. Waktu manusia hanyalah celah di antaranya.',
    },
  },
};
