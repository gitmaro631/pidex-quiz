export default {
  items: {
    spear:    { label: 'Tombak',      desc: 'Ancaman · berburu · obor darurat' },
    water_bag:{ label: 'Kantong Air', desc: 'Menyimpan air · barter dengan suku' },
    fire_kit: { label: 'Kit Api',     desc: 'Menyalakan api · sinyal asap' },
  },
  scenes: {
    jeep_crash: {
      title: 'Kecelakaan Safari',
      text: 'Jeep safari terguling saat roda tersangkut di retakan tanah yang kering.\nTengah Taman Nasional Maasai Mara.\nPemandu pingsan. Radio rusak.\nJauh di sana, kawanan singa beristirahat di bawah naungan pohon akasia.',
      choices: [
        '[Kit Api] Nyalakan rumput kering dan kirim sinyal asap',
        'Pergi ke arah sungai',
        'Berlindung di atas pohon akasia',
      ],
      requireDescs: ['Tidak ada cara menyalakan api', null, null],
    },
    signal_smoke: {
      title: 'Sinyal Asap',
      text: 'Seikat rumput kering terbakar.\nKolom asap mengepul tinggi ke langit.\nSepuluh menit kemudian, helikopter patroli taman berbelok dan mendekat.',
      endText: 'Sabana melihat mereka yang muncul pertama kali. Satu sinyal memisahkan hidup dan mati.',
    },
    tree_refuge: {
      title: 'Pohon Akasia',
      text: 'Kamu memanjat pohon. Singa-singa mengitari jeep di bawah.\nDari ketinggian terlihat sungai berkilau di utara.\nDi selatan, atap desa Maasai.',
      choices: [
        'Pergi ke arah desa',
        'Pergi ke arah sungai',
      ],
    },
    river_direction: {
      title: 'Menuju Sungai',
      text: 'Suara sungai terdengar. Saat bergerak, seekor singa menghalangi jalan.\nKamu sudah bertatapan mata. Jangan berlari.',
      choices: [
        '[Tombak] Arahkan tombak ke depan dan mundur perlahan',
        '[Kit Api] Pukul batu api untuk menakuti singa',
        'Sprint dan panjat pohon terdekat',
      ],
      requireDescs: ['Tangan kosong menghadapi singa. Ia menyerang.', 'Tidak ada api. Singa menyerang.', null],
    },
    lion_standoff: {
      title: 'Kebuntuan',
      text: 'Kamu mengarahkan tombak sejajar dan mempertahankan kontak mata.\nSatu menit terasa seperti selamanya.\nSinga yang pertama memutuskan kontak mata. Ia perlahan mundur.\nTanpa tombak pasti berbeda.',
      choices: ['Terus bergerak menuju sungai'],
    },
    fire_lion: {
      title: 'Ancaman Api',
      text: 'Percikan api meledak tepat di depan muka singa.\nSinga mundur. Ia takut api.',
      choices: ['Terus bergerak menuju sungai'],
    },
    lion_tree_climb: {
      title: 'Panjat Pohon',
      text: 'Kamu nyaris berhasil naik, tapi cakar singa menyambar kakimu.\nSinga menunggu satu jam sebelum pergi.',
      choices: ['Terus bergerak menuju sungai'],
    },
    lion_death: {
      title: 'Singa',
      text: 'Singa menerjang. Seketika itu juga.',
      endText: 'Sabana adalah kerajaan predator. Tangan kosong berarti kekalahan.',
    },
    river_bank: {
      title: 'Tepi Sungai',
      text: 'Kamu tiba di sungai dan minum.\nTapi ada buaya di tepi seberang.\nDi hulu mungkin ada desa Maasai.',
      choices: [
        '[Tombak] Ancam buaya dan sebrangi sungai',
        'Ikuti sungai ke hulu untuk menemukan desa',
      ],
      requireDescs: ['Tidak ada cara menghadapi buaya', null],
    },
    croc_crossing: {
      title: 'Menyeberangi Sungai',
      text: 'Kamu memukul permukaan air keras-keras dengan tombak saat menyeberangi sungai.\nBuaya-buaya pun menyelam.\nLututmu gemetar saat tiba di sisi lain.',
      choices: ['Pergi ke arah desa'],
    },
    maasai_approach: {
      title: 'Desa Maasai',
      text: 'Seorang pejuang berdiri di pintu masuk desa.\nIa menghalangi jalan dengan tombak terangkat.\nKamu perlu mencoba berkomunikasi.',
      choices: [
        '[Kantong Air] Sodorkan kantong air dan minta air minum',
        'Angkat kedua tangan sebagai tanda damai',
      ],
      requireDescs: ['Tidak ada yang bisa disodorkan. Pejuang menghalangi.', null],
    },
    water_exchange: {
      title: 'Barter Air',
      text: 'Kamu menyodorkan kantong air dan ekspresi pejuang itu melunak.\nKamu dibawa masuk ke desa.\nSang tetua mengeluarkan radio dan menghubungimu ke pihak berwenang taman.',
      choices: ['Tunggu penyelamatan'],
    },
    peaceful_approach: {
      title: 'Pertukaran',
      text: 'Kamu mengangkat kedua tangan. Pejuang memperhatikan sejenak, lalu mengangguk.\nKamu masuk ke desa.',
      choices: ['Minta bantuan'],
    },
    researcher_camp: {
      title: 'Kamp Peneliti',
      text: 'Dua tenda di dekat sungai.\n"Nama saya Nikos. Tim peneliti ekologi satwa liar. Ini Cheng."\nCheng mengangkat telepon satelit. "Saya akan hubungi pihak berwenang taman."',
      choices: ['Tunggu penyelamatan'],
    },
    success_rescue_camp: {
      title: 'Penyelamatan',
      text: '30 menit kemudian kendaraan patroli taman tiba.\nNikos dan Cheng tetap di sini untuk melanjutkan penelitian mereka.\n"Jangan datang tanpa pemandu lain kali."',
      endText: 'Dua peneliti ada di tengah sabana. Pertemuan tak terduga menjadi penyelamat.',
    },
    night_savanna: {
      title: 'Malam di Sabana',
      text: 'Kegelapan turun. Suara hyena datang dari segala arah.\nTanpa api, sangat sulit untuk bertahan.',
      choices: [
        '[Kit Api + Tombak] Nyalakan tombak sebagai obor',
        'Habiskan malam di atas pohon',
      ],
      requireDescs: ['Perlu api dan tombak', null],
    },
    torch_march: {
      title: 'Maret dengan Obor',
      text: 'Kamu menyalakan ujung tombak. Jadilah obor.\nHyena-hyena kabur dari api.\nKamu berjalan hingga fajar dan tiba di desa.',
      choices: ['Masuk ke desa'],
    },
    tree_night: {
      title: 'Malam di Pohon',
      text: 'Pagi tiba. Hyena-hyena pergi.\nKamu berangkat menuju desa dengan langkah yang kelelahan.',
      choices: ['Pergi ke arah desa'],
    },
    success_village: {
      title: 'Desa',
      text: 'Kamu dijamu dengan makanan tradisional Maasai.\nKendaraan pihak berwenang taman datang menjemputmu.',
      endText: 'Kamu melewati kerajaan singa, buaya, dan hyena. Kamu masih hidup.',
    },
    dehydration: {
      title: 'Dehidrasi',
      text: 'Panas musim kemarau menyedot setiap tetes kelembapan.\nKamu pingsan.',
      endText: 'Di sabana, air adalah kehidupan. Kantong air sudah kosong.',
    },
  },
};
