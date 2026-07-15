// 좀비 아포칼립스 탈출 — 스테이지별 후보 장면 풀. dungeon.js와 동일한 구조.
export const ZOMBIE_POOL = {
  id: 'zombie',
  items: {
    pistol: {
      ko: { label: '권총',      desc: '위협을 확실하게 제거' },
      en: { label: 'Pistol',    desc: 'Deals with threats decisively' },
      id: { label: 'Pistol',    desc: 'Menangani ancaman secara pasti' },
    },
    medkit: {
      ko: { label: '구급상자',  desc: '상처를 빠르게 치료' },
      en: { label: 'Medkit',    desc: 'Quickly treats wounds' },
      id: { label: 'Kotak P3K', desc: 'Mengobati luka dengan cepat' },
    },
    crowbar: {
      ko: { label: '쇠지렛대',  desc: '막힌 문과 장애물을 돌파' },
      en: { label: 'Crowbar',   desc: 'Breaks through locked doors and obstacles' },
      id: { label: 'Linggis',   desc: 'Menembus pintu dan rintangan yang terkunci' },
    },
  },

  stages: [

    // ── Stage 0: 발발 ────────────────────────────────
    [
      {
        ko: { title: '아파트의 비명', text: '복도에서 들려온 비명에 잠이 깼다.\n창밖을 보니 사람들이 서로를 물어뜯고 있다.' },
        en: { title: 'Screams in the Hallway', text: 'You wake to screams from the hallway.\nLooking outside, people are biting each other.' },
        id: { title: 'Jeritan di Koridor', text: 'Kau terbangun karena jeritan dari koridor.\nMelihat ke luar, orang-orang saling menggigit.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[쇠지렛대] 비상계단 문을 부수고 나간다', en: '[Crowbar] Break the emergency stairwell door open', id: '[Linggis] Dobrak pintu tangga darurat',
            requires: 'crowbar', effect: {}, pi: 5 },
          { ko: '문을 잠그고 잠시 상황을 지켜본다', en: 'Lock the door and watch the situation for a moment', id: 'Kunci pintu dan amati situasi sejenak',
            effect: { hunger: -10 } },
          { ko: '무작정 복도로 뛰쳐나간다', en: 'Rush blindly into the hallway', id: 'Berlari membabi buta ke koridor',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '이웃의 도움 요청', text: '옆집 문을 두드리는 소리가 들린다.\n"제발요, 문 좀 열어주세요!"' },
        en: { title: 'A Neighbor Begs for Help', text: 'You hear pounding on the next door.\n"Please, someone open the door!"' },
        id: { title: 'Tetangga Minta Tolong', text: 'Kau mendengar gedoran di pintu sebelah.\n"Tolong, ada yang mau buka pintu?!"' },
        effect: {},
        choices: [
          { ko: '위험을 무릅쓰고 문을 열어준다', en: 'Risk it and open the door', id: 'Nekat membuka pintu', effect: { health: -10 }, pi: 10 },
          { ko: '[권총] 권총을 들고 조심스레 확인한다', en: '[Pistol] Check carefully with pistol drawn', id: '[Pistol] Periksa hati-hati dengan pistol terhunus',
            requires: 'pistol', effect: {}, pi: 8 },
          { ko: '못 들은 척 조용히 있는다', en: 'Pretend not to hear and stay quiet', id: 'Berpura-pura tidak dengar dan diam saja',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '뉴스 속보', text: 'TV에서 마지막 속보가 흘러나온다.\n"시민 여러분은 즉시 대피소로 이동하십시오." 그리고 화면이 끊긴다.' },
        en: { title: 'The Final Broadcast', text: 'A last news broadcast plays on TV.\n"All citizens must evacuate to shelters immediately." Then the screen cuts out.' },
        id: { title: 'Siaran Terakhir', text: 'Siaran berita terakhir muncul di TV.\n"Seluruh warga harap segera mengungsi ke tempat perlindungan." Lalu layar mati.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '짐을 최소한으로 챙겨 서둘러 나선다', en: 'Pack the bare minimum and hurry out', id: 'Bawa barang seminimal mungkin dan buru-buru pergi',
            effect: {}, pi: 8 },
          { ko: '먹을 것과 물을 최대한 챙긴다', en: 'Pack as much food and water as possible', id: 'Bawa makanan dan air sebanyak mungkin',
            effect: { hunger: 15 }, pi: -2 },
          { ko: '냉정하게 짐을 정리할 시간을 갖는다', en: 'Take time to calmly organize your things', id: 'Luangkan waktu untuk berkemas dengan tenang',
            effect: { health: -5 } },
        ],
      },
    ],

    // ── Stage 1: 골목 ────────────────────────────────
    [
      {
        ko: { title: '좁은 골목길', text: '건물 사이 좁은 골목이 유일한 탈출로다.\n안쪽에서 뭔가 끄는 듯한 발소리가 들린다.' },
        en: { title: 'The Narrow Alley', text: 'A narrow alley between buildings is the only way out.\nA dragging footstep sound comes from within.' },
        id: { title: 'Gang Sempit', text: 'Gang sempit di antara gedung adalah satu-satunya jalan keluar.\nTerdengar suara langkah kaki yang diseret dari dalam.' },
        effect: {},
        choices: [
          { ko: '[권총] 소리 나는 쪽을 조준하며 나아간다', en: '[Pistol] Advance while aiming toward the sound', id: '[Pistol] Maju sambil membidik ke arah suara',
            requires: 'pistol', effect: {}, pi: 8 },
          { ko: '벽에 붙어 조심스레 지나간다', en: 'Hug the wall and pass carefully', id: 'Menempel dinding dan lewat hati-hati',
            effect: { hunger: -10 } },
          { ko: '돌을 던져 반대쪽으로 유인한다', en: 'Throw a rock to lure it away', id: 'Lempar batu untuk memancingnya menjauh',
            effect: { hunger: -5 }, pi: 5 },
        ],
      },
      {
        ko: { title: '쓰레기통 뒤의 생존자', text: '쓰레기통 뒤에 숨어 떨고 있는 생존자를 발견했다.\n다리에 상처를 입고 절뚝인다.' },
        en: { title: 'Survivor Behind the Dumpster', text: 'You find a survivor hiding behind a dumpster, trembling.\nThey limp with an injured leg.' },
        id: { title: 'Penyintas di Balik Tempat Sampah', text: 'Kau menemukan penyintas bersembunyi di balik tempat sampah, gemetar.\nDia pincang karena kaki terluka.' },
        effect: {},
        choices: [
          { ko: '[구급상자] 상처를 치료해준다', en: '[Medkit] Treat their wound', id: '[Kotak P3K] Obati lukanya',
            requires: 'medkit', effect: {}, pi: 12 },
          { ko: '부축해서 함께 데려간다', en: 'Support them and bring them along', id: 'Bopong dan bawa bersama',
            effect: { hunger: -10 }, pi: 8 },
          { ko: '어쩔 수 없이 혼자 움직인다', en: 'Reluctantly move on alone', id: 'Terpaksa bergerak sendirian',
            effect: {} },
        ],
      },
      {
        ko: { title: '막다른 골목', text: '골목 끝이 철조망으로 막혀 있다.\n저 너머로 큰길이 보이는데, 넘어가기가 만만치 않다.' },
        en: { title: 'The Dead End', text: 'The end of the alley is blocked by a chain-link fence.\nBeyond it lies the main street, but climbing over won\'t be easy.' },
        id: { title: 'Jalan Buntu', text: 'Ujung gang terhalang pagar kawat.\nDi baliknya terlihat jalan utama, tapi memanjatnya tidak mudah.' },
        effect: {},
        choices: [
          { ko: '[쇠지렛대] 지렛대로 철조망을 뜯는다', en: '[Crowbar] Pry the fence open with the crowbar', id: '[Linggis] Congkel pagar dengan linggis',
            requires: 'crowbar', effect: {}, pi: 10 },
          { ko: '힘겹게 철조망을 타고 넘는다', en: 'Struggle to climb over the fence', id: 'Berjuang memanjat pagar',
            effect: { health: -15 } },
          { ko: '다른 길을 찾아 되돌아간다', en: 'Turn back to find another way', id: 'Kembali untuk mencari jalan lain',
            effect: { hunger: -15 } },
        ],
      },
    ],

    // ── Stage 2: 편의점 ──────────────────────────────
    [
      {
        ko: { title: '털린 편의점', text: '이미 여러 번 약탈당한 편의점이다.\n그래도 구석에 남은 물건이 있을지 모른다.' },
        en: { title: 'The Looted Convenience Store', text: 'The store has already been ransacked several times.\nBut there might still be something left in a corner.' },
        id: { title: 'Minimarket yang Dijarah', text: 'Toko ini sudah dijarah berkali-kali.\nTapi mungkin masih ada sesuatu tersisa di sudut.' },
        effect: {},
        choices: [
          { ko: '선반 아래까지 꼼꼼히 뒤진다', en: 'Search thoroughly, even under the shelves', id: 'Geledah teliti sampai bawah rak',
            effect: { hunger: -5 }, pi: 10 },
          { ko: '창고 안쪽까지 살펴본다', en: 'Check inside the back storeroom', id: 'Periksa sampai ke gudang belakang',
            effect: { health: -10 }, pi: 12 },
          { ko: '빠르게 눈에 띄는 것만 챙긴다', en: 'Quickly grab only what\'s visible', id: 'Cepat ambil yang terlihat saja',
            effect: {}, pi: 5 },
        ],
      },
      {
        ko: { title: '진열대 뒤의 좀비', text: '진열대를 살피다 뒤에서 좀비 하나와 마주쳤다.\n점원 복장을 한 채로 신음한다.' },
        en: { title: 'A Zombie Behind the Shelf', text: 'While checking the shelves, you come face to face with a zombie.\nIt groans, still wearing a clerk\'s uniform.' },
        id: { title: 'Zombi di Balik Rak', text: 'Saat memeriksa rak, kau berhadapan dengan zombi.\nIa mengerang, masih mengenakan seragam pelayan toko.' },
        effect: {},
        choices: [
          { ko: '[권총] 침착하게 조준해서 처리한다', en: '[Pistol] Calmly aim and take it down', id: '[Pistol] Bidik dengan tenang dan lumpuhkan',
            requires: 'pistol', effect: {}, pi: 12 },
          { ko: '[쇠지렛대] 지렛대를 휘둘러 제압한다', en: '[Crowbar] Swing the crowbar to subdue it', id: '[Linggis] Ayunkan linggis untuk melumpuhkan',
            requires: 'crowbar', effect: { health: -5 }, pi: 12 },
          { ko: '조용히 뒷걸음질쳐 벗어난다', en: 'Quietly back away and escape', id: 'Diam-diam mundur dan kabur',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '금고 속 비상식량', text: '카운터 뒤 작은 금고에 비상식량이 있다는 메모를 발견했다.\n비밀번호는 적혀 있지 않다.' },
        en: { title: 'Emergency Rations in the Safe', text: 'You find a note saying there\'s emergency food in a small safe behind the counter.\nNo password is written.' },
        id: { title: 'Ransum Darurat di Brankas', text: 'Kau menemukan catatan tentang makanan darurat di brankas kecil di balik meja kasir.\nTidak ada kata sandi tertulis.' },
        effect: {},
        choices: [
          { ko: '[쇠지렛대] 지렛대로 금고를 강제로 연다', en: '[Crowbar] Force the safe open with the crowbar', id: '[Linggis] Congkel paksa brankas dengan linggis',
            requires: 'crowbar', effect: {}, pi: 15 },
          { ko: '주변에서 비밀번호 힌트를 찾아본다', en: 'Search nearby for a password hint', id: 'Cari petunjuk kata sandi di sekitar',
            effect: { hunger: -10 }, pi: 10 },
          { ko: '포기하고 다른 곳을 찾는다', en: 'Give up and search elsewhere', id: 'Menyerah dan cari tempat lain',
            effect: {} },
        ],
      },
    ],

    // ── Stage 3: 지하철역 ────────────────────────────
    [
      {
        ko: { title: '어두운 지하철역', text: '정전된 지하철역은 칠흑같이 어둡다.\n저 멀리서 여러 발소리가 뒤섞여 들린다.' },
        en: { title: 'The Dark Subway Station', text: 'The power-out subway station is pitch black.\nMultiple footsteps mix together in the distance.' },
        id: { title: 'Stasiun Kereta yang Gelap', text: 'Stasiun kereta bawah tanah yang mati listrik gelap gulita.\nBeberapa suara langkah kaki bercampur dari kejauhan.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '벽을 짚으며 최대한 조용히 이동한다', en: 'Feel along the wall and move as quietly as possible', id: 'Meraba dinding dan bergerak sepelan mungkin',
            effect: { hunger: -10 } },
          { ko: '[권총] 만일을 대비해 권총을 쥐고 나아간다', en: '[Pistol] Advance with pistol ready just in case', id: '[Pistol] Maju dengan pistol siap sedia',
            requires: 'pistol', effect: {}, pi: 10 },
          { ko: '뛰어서 반대편 출구로 향한다', en: 'Run for the exit on the other side', id: 'Berlari menuju pintu keluar seberang',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '멈춰선 열차', text: '선로에 멈춰선 열차 안에 사람들의 그림자가 보인다.\n창문을 두드리는 손자국이 가득하다.' },
        en: { title: 'The Stalled Train', text: 'Shadows of people are visible inside a train stalled on the tracks.\nThe windows are covered in handprints from pounding.' },
        id: { title: 'Kereta yang Berhenti', text: 'Bayangan orang terlihat di dalam kereta yang berhenti di rel.\nJendelanya penuh bekas tangan dari gedoran.' },
        effect: {},
        choices: [
          { ko: '열차를 피해 선로를 따라 걷는다', en: 'Avoid the train and walk along the tracks', id: 'Hindari kereta dan berjalan di sepanjang rel',
            effect: { hunger: -10 } },
          { ko: '[구급상자] 안에 생존자가 있는지 확인한다', en: '[Medkit] Check if there are survivors inside', id: '[Kotak P3K] Periksa apakah ada penyintas di dalam',
            requires: 'medkit', effect: {}, pi: 12 },
          { ko: '서둘러 반대 방향으로 도망친다', en: 'Hurry away in the opposite direction', id: 'Buru-buru lari ke arah berlawanan',
            effect: { health: -5 } },
        ],
      },
      {
        ko: { title: '역무원의 비상 열쇠', text: '쓰러진 역무원 곁에 비상 게이트 열쇠가 떨어져 있다.\n다른 통로로 빠르게 갈 수 있을 것 같다.' },
        en: { title: 'The Station Worker\'s Emergency Key', text: 'An emergency gate key lies beside a fallen station worker.\nIt could let you reach another passage quickly.' },
        id: { title: 'Kunci Darurat Petugas Stasiun', text: 'Kunci gerbang darurat tergeletak di samping petugas stasiun yang tumbang.\nIni bisa membawamu ke lorong lain dengan cepat.' },
        effect: { health: -5 },
        choices: [
          { ko: '조심스레 열쇠를 챙긴다', en: 'Carefully take the key', id: 'Hati-hati ambil kuncinya', effect: {}, pi: 12 },
          { ko: '[쇠지렛대] 그냥 지렛대로 게이트를 부순다', en: '[Crowbar] Just break the gate with the crowbar instead', id: '[Linggis] Langsung dobrak gerbang dengan linggis',
            requires: 'crowbar', effect: {}, pi: 10 },
          { ko: '위험해 보여 포기하고 돌아간다', en: 'It looks too risky, give up and turn back', id: 'Terlihat terlalu berisiko, menyerah dan kembali',
            effect: { hunger: -10 } },
        ],
      },
    ],

    // ── Stage 4: 생존자 캠프 ─────────────────────────
    [
      {
        ko: { title: '임시 생존자 캠프', text: '학교 운동장에 임시 캠프가 차려져 있다.\n경계는 삼엄하지만 다들 지쳐 보인다.' },
        en: { title: 'The Makeshift Survivor Camp', text: 'A makeshift camp is set up in a school yard.\nSecurity is tight, but everyone looks exhausted.' },
        id: { title: 'Kamp Penyintas Sementara', text: 'Kamp sementara didirikan di halaman sekolah.\nPenjagaan ketat, tapi semua orang terlihat kelelahan.' },
        effect: {},
        choices: [
          { ko: '물자를 나눠 받고 잠시 쉰다', en: 'Get some supplies and rest a while', id: 'Terima persediaan dan istirahat sejenak',
            effect: { hunger: 15, health: 10 } },
          { ko: '캠프 경비를 도와주고 신뢰를 얻는다', en: 'Help with camp security to earn trust', id: 'Bantu keamanan kamp untuk dapat kepercayaan',
            effect: { hunger: -10 }, pi: 10 },
          { ko: '오래 머물지 않고 정보만 얻는다', en: 'Don\'t stay long, just gather information', id: 'Tidak lama-lama, hanya kumpulkan informasi',
            effect: {}, pi: 5 },
        ],
      },
      {
        ko: { title: '물자를 노리는 무리', text: '캠프 한쪽에서 다른 생존자 무리와 물자를 두고 다툼이 벌어진다.\n분위기가 험악해진다.' },
        en: { title: 'A Group Eyeing Supplies', text: 'A dispute breaks out over supplies with another group of survivors at the camp.\nThe mood turns hostile.' },
        id: { title: 'Kelompok yang Mengincar Persediaan', text: 'Perselisihan pecah soal persediaan dengan kelompok penyintas lain di kamp.\nSuasana menjadi tegang.' },
        effect: {},
        choices: [
          { ko: '중재에 나서 갈등을 진정시킨다', en: 'Step in to mediate and calm the conflict', id: 'Turun tangan menengahi dan meredakan konflik',
            effect: { hunger: -10 }, pi: 12 },
          { ko: '[권총] 조용히 무기를 보여 억제한다', en: '[Pistol] Quietly show the weapon to deter them', id: '[Pistol] Diam-diam tunjukkan senjata untuk menahan mereka',
            requires: 'pistol', effect: {}, pi: 10 },
          { ko: '휘말리지 않고 자리를 피한다', en: 'Avoid getting involved and leave', id: 'Hindari terlibat dan pergi',
            effect: {} },
        ],
      },
      {
        ko: { title: '의사의 부탁', text: '캠프의 의사가 부족한 의료품에 한숨을 쉰다.\n"근처 병원에서 약품을 구해올 수 있을까요?"' },
        en: { title: 'The Doctor\'s Request', text: 'The camp doctor sighs over the lack of medical supplies.\n"Could you get medicine from the hospital nearby?"' },
        id: { title: 'Permintaan Sang Dokter', text: 'Dokter kamp menghela napas karena kekurangan obat.\n"Bisakah kau ambilkan obat dari rumah sakit terdekat?"' },
        effect: {},
        choices: [
          { ko: '수락하고 병원으로 향한다', en: 'Accept and head to the hospital', id: 'Terima dan menuju rumah sakit', effect: {}, pi: 12 },
          { ko: '[구급상자] 가진 구급상자를 먼저 나눠준다', en: '[Medkit] Share your own medkit first', id: '[Kotak P3K] Bagikan kotak P3K milikmu dulu',
            requires: 'medkit', effect: {}, pi: 15 },
          { ko: '너무 위험하다며 거절한다', en: 'Decline, saying it\'s too dangerous', id: 'Tolak karena terlalu berbahaya',
            effect: {} },
        ],
      },
    ],

    // ── Stage 5: 폐쇄된 병원 ─────────────────────────
    [
      {
        ko: { title: '폐쇄된 병원', text: '병원 정문에 "출입 금지" 팻말과 쇠사슬이 감겨 있다.\n안에서 희미한 신음이 새어 나온다.' },
        en: { title: 'The Sealed Hospital', text: 'The hospital\'s main entrance has a "No Entry" sign wrapped in chains.\nFaint groans leak from inside.' },
        id: { title: 'Rumah Sakit Tertutup', text: 'Pintu utama rumah sakit dililit rantai dengan papan "Dilarang Masuk".\nErangan samar bocor dari dalam.' },
        effect: {},
        choices: [
          { ko: '[쇠지렛대] 쇠사슬을 끊고 들어간다', en: '[Crowbar] Break the chains and go in', id: '[Linggis] Putuskan rantai dan masuk',
            requires: 'crowbar', effect: {}, pi: 12 },
          { ko: '다른 입구를 찾아 돌아간다', en: 'Go around to find another entrance', id: 'Berkeliling mencari pintu masuk lain',
            effect: { hunger: -15 } },
          { ko: '억지로 쇠사슬을 잡아당긴다', en: 'Force the chains open by pulling', id: 'Memaksa menarik rantai',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '약제실', text: '약제실 선반에 필요한 약품이 남아있다.\n하지만 안쪽에서 뭔가 부스럭거리는 소리가 난다.' },
        en: { title: 'The Pharmacy Room', text: 'Needed medicine remains on the pharmacy shelves.\nBut something rustles from deeper inside.' },
        id: { title: 'Ruang Farmasi', text: 'Obat yang dibutuhkan masih ada di rak farmasi.\nTapi sesuatu bergemerisik dari dalam.' },
        effect: {},
        choices: [
          { ko: '[권총] 소리 나는 쪽을 경계하며 약을 챙긴다', en: '[Pistol] Grab the medicine while watching the noise', id: '[Pistol] Ambil obat sambil waspada pada suara itu',
            requires: 'pistol', effect: {}, pi: 15 },
          { ko: '최대한 빠르게 필요한 것만 챙긴다', en: 'Quickly grab only what\'s needed', id: 'Cepat ambil hanya yang diperlukan',
            effect: { hunger: -10 }, pi: 10 },
          { ko: '소리가 무서워 포기하고 나온다', en: 'Too scared, give up and leave', id: 'Terlalu takut, menyerah dan keluar',
            effect: {} },
        ],
      },
      {
        ko: { title: '갇힌 환자', text: '병실에 갇힌 채 살려달라 외치는 환자를 발견했다.\n문이 밖에서 잠겨 있다.' },
        en: { title: 'The Trapped Patient', text: 'You find a patient trapped in a room, crying for help.\nThe door is locked from outside.' },
        id: { title: 'Pasien yang Terjebak', text: 'Kau menemukan pasien terjebak di kamar, berteriak minta tolong.\nPintu terkunci dari luar.' },
        effect: {},
        choices: [
          { ko: '[쇠지렛대] 문을 부수고 구해준다', en: '[Crowbar] Break the door and save them', id: '[Linggis] Dobrak pintu dan selamatkan',
            requires: 'crowbar', effect: {}, pi: 15 },
          { ko: '[구급상자] 문틈으로 응급처치 물품을 건넨다', en: '[Medkit] Pass emergency supplies through the gap', id: '[Kotak P3K] Berikan perlengkapan darurat lewat celah',
            requires: 'medkit', effect: {}, pi: 10 },
          { ko: '시간이 없어 어쩔 수 없이 지나친다', en: 'No time, reluctantly pass by', id: 'Tidak ada waktu, terpaksa lewat',
            effect: { hunger: -5 } },
        ],
      },
    ],

    // ── Stage 6: 다리 봉쇄 ───────────────────────────
    [
      {
        ko: { title: '군의 다리 봉쇄', text: '도시를 벗어나는 다리를 군인들이 막고 있다.\n"통제 구역입니다. 더 이상 접근하지 마십시오."' },
        en: { title: 'The Military Bridge Blockade', text: 'Soldiers block the bridge leading out of the city.\n"This is a restricted zone. Do not approach further."' },
        id: { title: 'Blokade Jembatan Militer', text: 'Tentara menghalangi jembatan menuju keluar kota.\n"Ini zona terlarang. Jangan mendekat lagi."' },
        effect: {},
        choices: [
          { ko: '침착하게 신분을 밝히고 통과를 요청한다', en: 'Calmly identify yourself and request passage', id: 'Dengan tenang perkenalkan diri dan minta izin lewat',
            effect: { hunger: -5 }, pi: 12 },
          { ko: '몰래 강기슭을 따라 우회한다', en: 'Sneak around along the riverbank', id: 'Menyelinap memutar di sepanjang tepi sungai',
            effect: { health: -10 }, pi: 8 },
          { ko: '혼란한 틈을 타 다리로 뛰어든다', en: 'Dash onto the bridge amid the chaos', id: 'Menerobos ke jembatan di tengah kekacauan',
            effect: { health: -15 }, pi: 10 },
        ],
      },
      {
        ko: { title: '다리 위의 아수라장', text: '다리 위는 먼저 도착한 사람들로 아수라장이다.\n뒤에서 좀비 무리가 다가오는 게 보인다.' },
        en: { title: 'Chaos on the Bridge', text: 'The bridge is chaos, packed with people who arrived first.\nA horde of zombies can be seen approaching from behind.' },
        id: { title: 'Kekacauan di Jembatan', text: 'Jembatan penuh kekacauan oleh orang-orang yang tiba lebih dulu.\nGerombolan zombi terlihat mendekat dari belakang.' },
        effect: { hunger: -10 },
        choices: [
          { ko: '사람들을 도와 질서를 잡으려 한다', en: 'Try to help people and restore order', id: 'Coba bantu orang-orang menertibkan keadaan',
            effect: { health: -10 }, pi: 15 },
          { ko: '[권총] 위협사격으로 길을 튼다', en: '[Pistol] Fire a warning shot to clear a path', id: '[Pistol] Tembakan peringatan untuk membuka jalan',
            requires: 'pistol', effect: {}, pi: 12 },
          { ko: '군중을 헤치고 먼저 건넌다', en: 'Push through the crowd and cross first', id: 'Menerobos kerumunan dan menyeberang duluan',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '무너지는 다리', text: '좀비 무리의 무게에 다리 일부가 흔들리기 시작한다.\n건너는 사람들의 비명이 커진다.' },
        en: { title: 'The Collapsing Bridge', text: 'Part of the bridge begins to shake under the weight of the zombie horde.\nScreams grow louder among those crossing.' },
        id: { title: 'Jembatan yang Runtuh', text: 'Sebagian jembatan mulai bergetar karena beban gerombolan zombi.\nJeritan orang yang menyeberang makin keras.' },
        effect: { health: -10 },
        choices: [
          { ko: '전력으로 질주해 건너간다', en: 'Sprint across with everything you have', id: 'Berlari sekencang mungkin menyeberang',
            effect: { health: -10 }, pi: 12 },
          { ko: '다른 사람들을 먼저 보내고 뒤따른다', en: 'Let others go first, then follow', id: 'Biarkan yang lain lebih dulu, lalu ikuti',
            effect: { hunger: -10 }, pi: 15 },
          { ko: '[쇠지렛대] 난간을 붙잡고 버티며 건넌다', en: '[Crowbar] Use the crowbar as a grip on the railing to cross', id: '[Linggis] Gunakan linggis untuk berpegangan di pagar sambil menyeberang',
            requires: 'crowbar', effect: {}, pi: 12 },
        ],
      },
    ],

    // ── Stage 7: 헬기장 도착 전 ──────────────────────
    [
      {
        ko: { title: '헬기장이 보인다', text: '저 멀리 대피 헬기의 프로펠러 소리가 들린다.\n하지만 마지막 탑승 인원이 얼마 남지 않았다는 안내가 들려온다.' },
        en: { title: 'The Helipad Comes Into View', text: 'You can hear the evacuation helicopter\'s rotors in the distance.\nBut an announcement says only a few boarding spots remain.' },
        id: { title: 'Helipad Terlihat', text: 'Terdengar suara baling-baling helikopter evakuasi dari kejauhan.\nTapi ada pengumuman hanya tersisa sedikit tempat duduk.' },
        effect: {},
        choices: [
          { ko: '전력으로 헬기장까지 달린다', en: 'Sprint for the helipad with everything left', id: 'Berlari sekuat tenaga menuju helipad',
            effect: { health: -10, hunger: -10 }, pi: 15 },
          { ko: '부상자를 먼저 부축해 함께 향한다', en: 'Support the injured and head there together', id: 'Bopong yang terluka dan pergi bersama',
            effect: { hunger: -15 }, pi: 18 },
          { ko: '침착하게 안전한 경로로 접근한다', en: 'Calmly approach via a safe route', id: 'Dengan tenang mendekat lewat jalur aman',
            effect: { hunger: -10 }, pi: 10 },
        ],
      },
      {
        ko: { title: '마지막 좀비 무리', text: '헬기장 바로 앞을 좀비 무리가 가로막고 있다.\n조종사가 다급히 손짓하며 서두르라 외친다.' },
        en: { title: 'The Final Horde', text: 'A horde of zombies blocks the way right in front of the helipad.\nThe pilot waves urgently, shouting to hurry.' },
        id: { title: 'Gerombolan Terakhir', text: 'Gerombolan zombi menghalangi jalan tepat di depan helipad.\nPilot melambai mendesak, berteriak agar buru-buru.' },
        effect: {},
        choices: [
          { ko: '[권총] 남은 탄환으로 길을 뚫는다', en: '[Pistol] Use your remaining rounds to clear a path', id: '[Pistol] Gunakan peluru tersisa untuk membuka jalan',
            requires: 'pistol', effect: { hunger: -5 }, pi: 18 },
          { ko: '[쇠지렛대] 지렛대를 휘두르며 돌파한다', en: '[Crowbar] Swing the crowbar and break through', id: '[Linggis] Ayunkan linggis dan terobos',
            requires: 'crowbar', effect: { health: -15 }, pi: 15 },
          { ko: '멀리 돌아 반대편에서 접근한다', en: 'Circle far around and approach from the other side', id: 'Berputar jauh dan mendekat dari sisi lain',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '마지막 한 자리', text: '헬기에 자리가 딱 하나 남았다.\n곁에는 다리를 다친 노인이 힘겹게 서 있다.' },
        en: { title: 'The Last Seat', text: 'Exactly one seat remains on the helicopter.\nBeside you, an elderly person with an injured leg struggles to stand.' },
        id: { title: 'Kursi Terakhir', text: 'Tepat tersisa satu kursi di helikopter.\nDi sampingmu, seorang lansia dengan kaki terluka berjuang berdiri.' },
        effect: {},
        choices: [
          { ko: '노인에게 자리를 양보한다', en: 'Give up your seat for the elderly person', id: 'Berikan kursimu untuk sang lansia', effect: {}, pi: 20 },
          { ko: '[구급상자] 노인을 치료해 함께 탈 방법을 찾는다', en: '[Medkit] Treat them and find a way to board together', id: '[Kotak P3K] Obati mereka dan cari cara naik bersama',
            requires: 'medkit', effect: {}, pi: 18 },
          { ko: '미안함을 느끼며 자리에 오른다', en: 'Board the seat, feeling guilty', id: 'Naik ke kursi sambil merasa bersalah',
            effect: { health: -5 }, pi: 10 },
        ],
      },
    ],

    // ── Stage 8: 엔딩 ────────────────────────────────
    [
      {
        ko: { title: '탈출 성공', text: '헬기가 도시를 벗어나 하늘로 떠올랐다.\n아래로 멀어지는 폐허가 된 도시가 보인다.' },
        en: { title: 'Escaped', text: 'The helicopter lifts off, leaving the city behind.\nBelow, the ruined city grows smaller.' },
        id: { title: 'Berhasil Kabur', text: 'Helikopter lepas landas, meninggalkan kota di belakang.\nDi bawah, kota yang hancur semakin mengecil.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '모든 것을 잃었지만, 살아남았다는 사실만으로도 충분했다.',
          en: 'You lost everything, but simply surviving was enough.',
          id: 'Kau kehilangan segalanya, tapi sekadar bertahan hidup saja sudah cukup.',
        },
      },
      {
        ko: { title: '함께 탈출한 사람들', text: '헬기 안에는 여정 중 만난 사람들의 얼굴이 보인다.\n낯선 이들이었지만, 이제는 전우 같은 사이가 되었다.' },
        en: { title: 'Those Who Escaped Together', text: 'Inside the helicopter are the faces of people met along the way.\nOnce strangers, now they feel like comrades.' },
        id: { title: 'Mereka yang Kabur Bersama', text: 'Di dalam helikopter terlihat wajah-wajah yang ditemui sepanjang perjalanan.\nDulu orang asing, kini terasa seperti rekan seperjuangan.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '혼자였다면 여기까지 오지 못했을 것이다.',
          en: 'Alone, you never would have made it this far.',
          id: 'Jika sendirian, kau tak akan sampai sejauh ini.',
        },
      },
      {
        ko: { title: '새로운 안식처', text: '헬기가 도착한 곳은 바다 위 격리 시설이었다.\n좀비는 없지만, 또 다른 시작이 기다리고 있다.' },
        en: { title: 'A New Refuge', text: 'The helicopter arrives at a quarantine facility out at sea.\nNo zombies here, but another beginning awaits.' },
        id: { title: 'Tempat Perlindungan Baru', text: 'Helikopter tiba di fasilitas karantina di laut.\nTak ada zombi di sini, tapi awal yang baru menanti.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '폐허가 된 도시를 뒤로하고, 다시 살아갈 이유를 찾았다.',
          en: 'Leaving the ruined city behind, you found a reason to keep living.',
          id: 'Meninggalkan kota yang hancur, kau menemukan alasan untuk terus hidup.',
        },
      },
    ],
  ],
};
