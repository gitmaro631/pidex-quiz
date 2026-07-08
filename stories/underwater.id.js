export default {
  items: {
    toolkit: { label: 'Kit Alat',           desc: 'Membuka palka · menyegel retakan' },
    flare:   { label: 'Suar Bawah Air',     desc: 'Sinyal · pencahayaan bawah air' },
    oxy:     { label: 'Oksigen Darurat',    desc: 'Memperpanjang napas · daya apung' },
  },
  scenes: {
    emergency_room: {
      title: 'Siaga Darurat',
      text: 'Gempa bumi berkekuatan 5,8 SR. Bagian B basis penelitian laut dalam Neptune-7 kebanjiran.\nAlarm berbunyi. Bagian C tempat kamu berada masih bertekanan.\nKapal selam darurat ada di dok Bagian A. Dua rute tersedia.',
      choices: [
        'Bergerak melalui koridor yang kebanjiran menuju Bagian A',
        '[Kit Alat] Buka panel kontrol dan pulihkan sistem darurat',
        'Keluar melalui palka pelarian darurat ke lambung luar',
      ],
      requireDescs: [null, 'Tidak ada alat untuk membuka penutup panel', null],
    },
    control_panel: {
      title: 'Panel Kontrol',
      text: 'Di dalam panel kontrol, terlihat katup manual.\nKamu mengaktifkan pompa penguras darurat — level air di koridor yang kebanjiran mulai turun.\nLift pun pulih. Dua puluh detik menuju Bagian A.',
      choices: ['Naik lift menuju dok Bagian A'],
    },
    flooded_corridor: {
      title: 'Koridor Banjir',
      text: 'Koridor terendam hingga pinggang. Level air terus naik.\nDi tengah jalan, langit-langit di atasmu runtuh. Jalan tertutup.\nKantong udara darurat terlihat.',
      choices: [
        '[Oksigen] Gunakan tangki oksigen sebagai daya apung dan mengambang naik melalui ventilasi',
        'Cari jalan lain di dalam kantong udara',
      ],
      requireDescs: ['Tidak ada oksigen. Kamu tenggelam.', null],
    },
    oxy_float: {
      title: 'Daya Apung Oksigen',
      text: 'Kamu membuka katup oksigen dan menarik tangki ke bawahmu.\nTangki dengan cepat menghasilkan daya apung. Kamu melesat ke atas.\nMelalui ventilasi langit-langit kamu muncul di Bagian A.',
      choices: ['Bergerak menuju dok'],
    },
    air_pocket: {
      title: 'Teman Tak Terduga',
      text: 'Sudah ada dua orang di kantong udara.\n"Nama saya Nikos. Tim peneliti geologi laut. Ini Cheng."\nCheng sedang mengeluarkan terminal satelit kedap air.\n"Kapal selam penyelamat sudah mendekat. Tunggu saja di sini."',
      choices: ['Tunggu penyelamatan bersama Nikos dan Cheng'],
    },
    pocket_rescue: {
      title: 'Kapal Selam Penyelamat',
      text: 'Tiga puluh menit kemudian, kapal selam penyelamat merapat.\nPalka terbuka. Nikos meraih tanganmu.\n"Kami akan menutup Neptune-7. Pergilah duluan."\nKeduanya tetap tinggal di basis.',
      endText: 'Dua orang ada di kantong udara yang kebanjiran. Seperti takdir, dan seperti misi.',
    },
    outer_hull: {
      title: 'Lambung Luar',
      text: 'Kamu membuka palka darurat. Tekanan berubah dan telingamu berdengung.\nKamu perlu bergerak menyusuri lambung luar. Kedalaman 180m. Gelap gulita di mana-mana.',
      choices: [
        '[Oksigen] Bernapas dari tangki dan bergerak menyusuri lambung menuju dok',
        '[Suar] Nyalakan suar di bawah air',
      ],
      requireDescs: ['Tidak ada oksigen di kedalaman 180m. Kamu tenggelam.', 'Tidak ada sinyal. Kembali ke basis.'],
    },
    flare_underwater: {
      title: 'Sinyal Bawah Air',
      text: 'Suar bawah air pun menyala. Bahkan di kedalaman 180m, cahaya menyebar.\nKapal selam penyelamat siaga mendeteksi cahaya tersebut.\nLima belas menit kemudian, sebuah palka terbuka.',
      choices: ['Naik ke kapal selam penyelamat'],
    },
    hull_swim: {
      title: 'Transit Lambung',
      text: 'Kamu memasang masker oksigen dan bergerak menyusuri lambung.\nPalka luar dok terlihat. Harus dibuka secara manual.',
      choices: [
        '[Kit Alat] Paksa buka palka dengan alat',
        '[Suar] Arahkan suar ke jendela dok',
      ],
      requireDescs: ['Palka tidak bisa terbuka. Oksigen habis.', 'Tidak ada. Hanya oksigen yang terkuras.'],
    },
    docking_bay: {
      title: 'Dok',
      text: 'Kamu berdiri di hadapan kapal selam darurat.\nKamu memasukkan kode darurat — ia pun menyala.\nPalka terbuka dan lautan dalam yang gelap pun terbentang.',
      choices: ['Kemudikan kapal selam darurat menuju permukaan'],
    },
    engine_room: {
      title: 'Ruang Mesin',
      text: 'Kamu menemukan generator darurat. Masih ada sedikit bahan bakar.\nKamu bisa mengarahkan daya ke pemancar sinyal darurat.',
      choices: ['[Kit Alat] Hubungkan kabel dan aktifkan pemancar sinyal'],
      requireDescs: ['Tidak ada alat untuk menghubungkan kabel'],
    },
    emergency_signal: {
      title: 'Sinyal Darurat',
      text: 'Sinyal berhasil dikirimkan ke permukaan.\nEnam jam kemudian sebuah kapal selam penyelamat merapat.',
      choices: ['Naik ke kapal selam penyelamat'],
    },
    success_sub: {
      title: 'Menembus Permukaan',
      text: 'Kamu menerobos ke permukaan. Cahaya matahari silau.\nSebuah kapal penjaga pantai menunggu 200 meter jauhnya.\n"Penyintas Neptune-7 dikonfirmasi!"',
      endText: 'Kamu naik hidup-hidup dari kedalaman 180 meter. Kamu tidak pernah tahu betapa indahnya cahaya.',
    },
    drowning: {
      title: 'Tenggelam',
      text: 'Oksigen habis. Air dingin yang gelap memenuhi paru-paru.',
      endText: 'Lautan dalam tidak mengizinkanmu bertahan tanpa oksigen.',
    },
  },
};
