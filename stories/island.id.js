export default {
  items: {
    rope:  { label: 'Tali',    desc: 'Membuat rakit · mengikat' },
    knife: { label: 'Pisau',   desc: 'Makanan · membuat alat' },
    flare: { label: 'Suar',    desc: 'Sinyal penyelamatan' },
  },
  scenes: {
    beach_wakeup: {
      title: 'Terdampar',
      text: 'Kapal pesiar menabrak karang.\nKamu tersadar di pantai asing.\nEntah di mana di Samudra Pasifik. Lautan ke segala arah.\nJauh di cakrawala, ada sesuatu yang lewat — sebuah kapal kargo.',
      choices: [
        '[Suar] Tembakkan suar ke kapal kargo yang lewat',
        'Jelajahi pedalaman pulau',
        'Cari korban atau perbekalan di sepanjang pantai',
      ],
      requireDescs: ['Tidak ada cara memberi sinyal sebelum kapal menghilang', null, null],
    },
    flare_ship: {
      title: 'Sinyal Berhasil',
      text: 'Suar memancarkan cahaya merah.\nLima menit kemudian kapal kargo mengubah haluan.\nSebuah sekoci turun. Seorang pelaut mengulurkan tangan.\n"Kamu dari mana?"',
      endText: 'Kalau tidak terlihat, kamu tidak akan diselamatkan. Satu suar mengubah segalanya.',
    },
    beach_search: {
      title: 'Mencari di Pantai',
      text: 'Puing-puing terdampar di tepi pantai.\nPelampung, wadah plastik, papan kayu.\nDan dua orang — masih hidup.',
      choices: ['Dekati dua orang itu'],
    },
    survivor_meet: {
      title: 'Para Penyintas',
      text: '"Nama saya Nikos. Ini Cheng — kami tim peneliti ekologi laut.\nSebenarnya, pulau ini sedang kami survei. Kami punya telepon satelit."\nCheng mengeluarkannya. Baterai tinggal 5%.\nSatu panggilan tersisa.',
      choices: ['Hubungi penjaga pantai untuk penyelamatan'],
    },
    sat_phone_rescue: {
      title: 'Telepon Satelit',
      text: 'Tersambung. Lokasi terkirim.\n"Kami akan tiba dalam tiga jam."\nNikos dan Cheng tetap di sini untuk menyelesaikan pengumpulan data.',
      endText: 'Ada sekutu tak terduga di pulau ini. Manusia adalah jawabannya.',
    },
    explore_inland: {
      title: 'Pedalaman Pulau',
      text: 'Kamu menerobos kebun kelapa.\nKamu menemukan mata air pegunungan yang jernih. Tenggorokan kembali hidup.\nDari tempat yang lebih tinggi seluruh pulau terlihat.\nDi pantai utara, ada struktur yang tampak seperti pondok.',
      choices: [
        '[Pisau] Petik kelapa dan dapatkan makanan',
        'Pergi ke pondok di utara',
        'Buat rakit dan persiapkan pelarian',
      ],
      requireDescs: ['Tidak bisa dipetik dengan tangan kosong', null, null],
    },
    coconut_food: {
      title: 'Kelapa',
      text: 'Daging dan air kelapa memulihkan tenaga.\nSekarang kamu perlu mencari jalan keluar.',
      choices: [
        '[Tali] Ikat papan menjadi rakit dan coba melarikan diri',
        'Buat sinyal asap dari tempat tinggi',
      ],
      requireDescs: ['Tidak ada tali — papan berserakan', null],
    },
    old_hut: {
      title: 'Pondok Tua',
      text: 'Pondok nelayan tua.\nDi dalam ada jaring usang dan korek api.\nDan jalur yang menuju ke titik tertinggi pulau.',
      choices: [
        '[Pisau] Tangkap ikan dengan jaring',
        'Gunakan korek api untuk menyalakan api sinyal',
      ],
      requireDescs: ['Tidak bisa menyiapkan jaring tanpa pisau', null],
    },
    fishing: {
      title: 'Memancing',
      text: 'Kamu menangkap ikan. Perut kenyang menjernihkan pikiran.\nKamu bisa bertahan sampai besok.',
      choices: [
        '[Tali] Mulai ikat papan menjadi rakit',
        'Terus nyalakan api sinyal',
      ],
      requireDescs: ['Tidak ada tali', null],
    },
    signal_smoke: {
      title: 'Api Sinyal',
      text: 'Kamu menyalakan api di batu tertinggi.\nKamu menunggu seharian.\nSore hari berikutnya, sebuah perahu nelayan di kejauhan berbelok menuju asap.',
      choices: ['Turun ke pantai dan lambaikan tangan'],
    },
    raft_build: {
      title: 'Membuat Rakit',
      text: 'Kamu mengikat papan-papan dengan tali.\nKamu membuat layar dari daun kelapa.\nKamu harus berangkat sebelum ombak semakin besar.',
      choices: ['Luncurkan rakit dan melaju melawan angin'],
    },
    ocean_drift: {
      title: 'Terapung di Lautan',
      text: 'Dua hari terapung.\nMelawan dahaga untuk bertahan hidup.\nCahaya kapal terlihat di kejauhan.',
      choices: [
        '[Suar] Tembakkan suar',
        '[Pisau] Tangkap ikan mentah untuk mengatasi dehidrasi',
      ],
      requireDescs: ['Tidak ada sinyal. Kapal berlalu.', 'Dehidrasi semakin parah.'],
    },
    raw_fish_survive: {
      title: 'Ikan Mentah',
      text: 'Kamu bertahan dengan ikan mentah untuk mengatasi dehidrasi.\nKeesokan paginya, muncul siluet pulau. Pulau yang berbeda.\nKemungkinan ada orang di sana.',
      choices: ['Menuju pulau itu'],
    },
    success_rescue: {
      title: 'Penyelamatan',
      text: 'Kapal berhenti. Tangga diturunkan.\n"Apa yang terjadi padamu?" Seorang pelaut mengulurkan selimut.',
      endText: 'Bertahan tiga hari di tengah lautan. Lautan sangat luas dan manusia sangat kecil — tapi kamu tidak menyerah.',
    },
    success_boat: {
      title: 'Penyelamatan',
      text: 'Perahu nelayan datang mendekat. Seorang pelaut mengulurkan tangan.\nSemangkuk sup hangat adalah seluruh dunia saat itu.',
      endText: 'Kamu kembali dari pulau tak berpenghuni. Satu cahaya memisahkan hidup dan mati.',
    },
    ocean_death: {
      title: 'Hilang di Lautan',
      text: 'Dehidrasi dan kelaparan merenggut kesadaranmu.\nRakit hanyut terbawa arus.',
      endText: 'Lautan tidak mengembalikan mereka yang tidak siap.',
    },
  },
};
