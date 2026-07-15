// 이세계 용병 — 스테이지별 후보 장면 풀. dungeon.js와 동일한 구조.
export const ISEKAI_POOL = {
  id: 'isekai',
  items: {
    blade: {
      ko: { label: '검',        desc: '전투에서 확실한 우위' },
      en: { label: 'Blade',     desc: 'A clear edge in combat' },
      id: { label: 'Pedang',    desc: 'Keunggulan jelas dalam pertarungan' },
    },
    charm: {
      ko: { label: '마법 부적', desc: '마법 함정과 저주를 막아줌' },
      en: { label: 'Charm',     desc: 'Wards off magical traps and curses' },
      id: { label: 'Jimat',     desc: 'Menangkal jebakan sihir dan kutukan' },
    },
    map: {
      ko: { label: '이세계 지도', desc: '길을 잃지 않고 빠르게 이동' },
      en: { label: 'World Map',   desc: 'Move quickly without getting lost' },
      id: { label: 'Peta Dunia',  desc: 'Bergerak cepat tanpa tersesat' },
    },
  },

  stages: [

    // ── Stage 0: 소환 ────────────────────────────────
    [
      {
        ko: { title: '갑작스런 소환', text: '눈을 떠보니 낯선 궁전 바닥, 마법진 한가운데였다.\n왕관을 쓴 소녀가 다급하게 말한다. "용사님, 도와주세요!"' },
        en: { title: 'The Sudden Summoning', text: 'You open your eyes on the floor of a strange palace, in the middle of a magic circle.\nA girl wearing a crown speaks urgently. "Hero, please help us!"' },
        id: { title: 'Panggilan Mendadak', text: 'Kau membuka mata di lantai istana asing, di tengah lingkaran sihir.\nSeorang gadis bermahkota berbicara mendesak. "Pahlawan, tolong bantu kami!"' },
        effect: { hunger: -5 },
        choices: [
          { ko: '침착하게 상황부터 설명해 달라고 한다', en: 'Calmly ask her to explain the situation first', id: 'Dengan tenang minta dia jelaskan situasinya dulu',
            effect: {}, pi: 5 },
          { ko: '일단 검부터 챙긴다', en: 'Grab a blade first, just in case', id: 'Ambil pedang dulu untuk berjaga-jaga',
            requires: 'blade', effect: {}, pi: 5 },
          { ko: '당황해서 뒷걸음질 친다', en: 'Panic and stumble backward', id: 'Panik dan mundur tersandung',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '계약의 마법진', text: '바닥의 마법진이 빛나며 계약서 한 장이 떠오른다.\n"용병으로서 이 세계를 도와주시겠습니까?" 라는 문구가 적혀 있다.' },
        en: { title: 'The Contract Circle', text: 'The magic circle on the floor glows, and a contract floats up.\nIt reads: "Will you help this world as a mercenary?"' },
        id: { title: 'Lingkaran Kontrak', text: 'Lingkaran sihir di lantai bersinar, dan sebuah kontrak melayang.\nTertulis: "Maukah kau membantu dunia ini sebagai tentara bayaran?"' },
        effect: {},
        choices: [
          { ko: '조건을 꼼꼼히 읽고 서명한다', en: 'Read the terms carefully and sign', id: 'Baca syaratnya dengan teliti lalu tanda tangan',
            effect: { hunger: -5 }, pi: 8 },
          { ko: '[지도] 세계 지도부터 요청한다', en: '[World Map] Ask for a map of the world first', id: '[Peta Dunia] Minta peta dunia terlebih dahulu',
            requires: 'map', effect: {}, pi: 5 },
          { ko: '일단 서명부터 하고 본다', en: 'Just sign first and figure it out later', id: 'Tanda tangan dulu, urus belakangan',
            effect: { health: -5 } },
        ],
      },
      {
        ko: { title: '의심 많은 대신', text: '왕궁의 대신이 팔짱을 끼고 노려본다.\n"이런 낯선 자를 정말 믿어도 되는 겁니까, 공주님?"' },
        en: { title: 'The Suspicious Minister', text: 'A palace minister glares with arms crossed.\n"Can we really trust a stranger like this, Princess?"' },
        id: { title: 'Menteri yang Curiga', text: 'Seorang menteri istana menatap tajam dengan tangan bersilang.\n"Bisakah kita benar-benar percaya pada orang asing seperti ini, Tuan Putri?"' },
        effect: { health: -5 },
        choices: [
          { ko: '정중하게 자기소개를 한다', en: 'Introduce yourself politely', id: 'Perkenalkan diri dengan sopan', effect: {}, pi: 8 },
          { ko: '[마법 부적] 부적을 보여주며 신뢰를 얻는다', en: '[Charm] Show the charm to earn trust', id: '[Jimat] Tunjukkan jimat untuk mendapat kepercayaan',
            requires: 'charm', effect: {}, pi: 8 },
          { ko: '대신의 도발을 무시한다', en: 'Ignore the minister\'s provocation', id: 'Abaikan provokasi menteri itu',
            effect: { hunger: -10 } },
        ],
      },
    ],

    // ── Stage 1: 마을 도착 ───────────────────────────
    [
      {
        ko: { title: '변방 마을', text: '전송된 곳은 몬스터에게 시달리는 변방 마을이었다.\n주민들이 겁에 질린 눈으로 당신을 쳐다본다.' },
        en: { title: 'The Border Village', text: 'You are teleported to a border village plagued by monsters.\nThe villagers stare at you with frightened eyes.' },
        id: { title: 'Desa Perbatasan', text: 'Kau diteleportasi ke desa perbatasan yang dihantui monster.\nPara penduduk menatapmu dengan mata ketakutan.' },
        effect: {},
        choices: [
          { ko: '촌장을 찾아가 자초지종을 듣는다', en: 'Find the village chief and hear the story', id: 'Temui kepala desa dan dengar ceritanya',
            effect: { hunger: -5 }, pi: 8 },
          { ko: '[지도] 지도로 몬스터 출몰 지역부터 파악한다', en: '[World Map] Use the map to find where monsters appear', id: '[Peta Dunia] Gunakan peta untuk cari lokasi monster',
            requires: 'map', effect: {}, pi: 8 },
          { ko: '일단 마을을 순찰하며 살펴본다', en: 'Patrol the village to look around first', id: 'Berkeliling desa dulu untuk mengamati',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '겁먹은 아이', text: '한 아이가 다가와 옷자락을 붙잡는다.\n"우리 형이 숲에 갔다가 안 돌아왔어요..."' },
        en: { title: 'The Frightened Child', text: 'A child approaches and tugs at your sleeve.\n"My brother went into the forest and never came back..."' },
        id: { title: 'Anak yang Ketakutan', text: 'Seorang anak mendekat dan menarik lengan bajumu.\n"Kakakku pergi ke hutan dan tidak pernah kembali..."' },
        effect: { hunger: -5 },
        choices: [
          { ko: '아이를 안심시키고 형을 찾아주겠다 약속한다', en: 'Comfort the child and promise to find the brother', id: 'Tenangkan anak itu dan janji cari kakaknya',
            effect: {}, pi: 10 },
          { ko: '[검] 곧장 숲으로 향한다', en: '[Blade] Head straight for the forest', id: '[Pedang] Langsung menuju hutan',
            requires: 'blade', effect: {}, pi: 8 },
          { ko: '지금은 여유가 없다고 거절한다', en: 'Decline, saying you have no time now', id: 'Menolak karena belum ada waktu sekarang',
            effect: {}, pi: -5 },
        ],
      },
      {
        ko: { title: '용병 길드 지부', text: '작은 마을에도 용병 길드 지부가 있다.\n게시판에 몬스터 토벌 의뢰서가 잔뜩 붙어 있다.' },
        en: { title: 'The Mercenary Guild Branch', text: 'Even this small village has a mercenary guild branch.\nThe board is covered in monster subjugation requests.' },
        id: { title: 'Cabang Serikat Tentara Bayaran', text: 'Bahkan desa kecil ini punya cabang serikat tentara bayaran.\nPapan pengumumannya penuh permintaan penumpasan monster.' },
        effect: {},
        choices: [
          { ko: '가장 급한 의뢰부터 확인한다', en: 'Check the most urgent request first', id: 'Periksa permintaan paling mendesak dulu',
            effect: { hunger: -5 }, pi: 8 },
          { ko: '길드 마스터에게 인사하고 등록한다', en: 'Greet the guildmaster and register', id: 'Sapa ketua serikat dan mendaftar',
            effect: {}, pi: 5 },
          { ko: '보수가 가장 높은 의뢰를 고른다', en: 'Pick the highest-paying request', id: 'Pilih permintaan dengan bayaran tertinggi',
            effect: { health: -10 }, pi: 12 },
        ],
      },
    ],

    // ── Stage 2: 몬스터 조우 ─────────────────────────
    [
      {
        ko: { title: '숲의 늑대 무리', text: '숲 초입에서 늑대 무리가 이빨을 드러낸다.\n눈빛에 예사롭지 않은 마력이 느껴진다.' },
        en: { title: 'Wolf Pack in the Forest', text: 'At the forest\'s edge, a pack of wolves bares its teeth.\nTheir eyes carry an unusual trace of magic.' },
        id: { title: 'Kawanan Serigala di Hutan', text: 'Di tepi hutan, sekawanan serigala memperlihatkan taringnya.\nMata mereka menyimpan jejak sihir yang tak biasa.' },
        effect: {},
        choices: [
          { ko: '[검] 앞장서서 맞서 싸운다', en: '[Blade] Stand and fight them head-on', id: '[Pedang] Berdiri dan lawan langsung',
            requires: 'blade', effect: { health: -5 }, pi: 12 },
          { ko: '[마법 부적] 부적으로 마력을 눌러 진정시킨다', en: '[Charm] Use the charm to calm their magic', id: '[Jimat] Gunakan jimat untuk menenangkan sihir mereka',
            requires: 'charm', effect: {}, pi: 12 },
          { ko: '나무 위로 올라가 피한다', en: 'Climb a tree to avoid them', id: 'Panjat pohon untuk menghindar',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '고블린 정찰대', text: '고블린 정찰대가 순찰로를 막고 서 있다.\n숫자는 적지만 조직적으로 움직인다.' },
        en: { title: 'Goblin Scout Party', text: 'A goblin scout party blocks the patrol path.\nFew in number, but they move with discipline.' },
        id: { title: 'Regu Pengintai Goblin', text: 'Regu pengintai goblin menghalangi jalur patroli.\nJumlahnya sedikit, tapi bergerak dengan disiplin.' },
        effect: {},
        choices: [
          { ko: '대장으로 보이는 놈만 노려 협상한다', en: 'Target the apparent leader and negotiate', id: 'Incar yang terlihat sebagai pemimpin dan berunding',
            effect: { hunger: -5 }, pi: 10 },
          { ko: '[검] 정면 돌파한다', en: '[Blade] Break through head-on', id: '[Pedang] Terobos langsung',
            requires: 'blade', effect: { health: -10 }, pi: 12 },
          { ko: '조용히 우회로를 찾는다', en: 'Quietly search for a detour', id: 'Cari jalan memutar diam-diam',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '저주받은 사슴', text: '검은 안개를 두른 사슴 한 마리가 길을 막는다.\n닿기만 해도 저주가 옮을 것 같은 기운이 감돈다.' },
        en: { title: 'The Cursed Stag', text: 'A stag wreathed in black mist blocks the road.\nIt feels like the curse could spread with a single touch.' },
        id: { title: 'Rusa Terkutuk', text: 'Seekor rusa berselimut kabut hitam menghalangi jalan.\nTerasa seperti kutukannya bisa menular hanya dengan sentuhan.' },
        effect: {},
        choices: [
          { ko: '[마법 부적] 부적으로 저주를 정화한다', en: '[Charm] Purify the curse with the charm', id: '[Jimat] Sucikan kutukan dengan jimat',
            requires: 'charm', effect: {}, pi: 15 },
          { ko: '멀리서 지켜만 보고 지나간다', en: 'Watch from a distance and move past', id: 'Amati dari jauh dan lewati saja',
            effect: { hunger: -10 } },
          { ko: '[검] 위험을 감수하고 처치한다', en: '[Blade] Risk it and strike it down', id: '[Pedang] Nekat dan tebas',
            requires: 'blade', effect: { health: -15 }, pi: 12 },
        ],
      },
    ],

    // ── Stage 3: 길드 의뢰 ───────────────────────────
    [
      {
        ko: { title: '호위 의뢰', text: '상단이 마물 출몰 지역을 지나야 한다며 호위를 요청한다.\n"보수는 넉넉히 드리겠습니다."' },
        en: { title: 'The Escort Request', text: 'A merchant caravan needs to pass through monster territory and requests an escort.\n"We\'ll pay you well."' },
        id: { title: 'Permintaan Pengawalan', text: 'Sebuah karavan pedagang perlu melewati wilayah monster dan meminta pengawalan.\n"Kami akan membayar dengan baik."' },
        effect: {},
        choices: [
          { ko: '의뢰를 수락한다', en: 'Accept the request', id: 'Terima permintaan itu', effect: { hunger: -10 }, pi: 15 },
          { ko: '보수를 흥정한 뒤 수락한다', en: 'Negotiate the pay, then accept', id: 'Tawar bayarannya, lalu terima',
            effect: {}, pi: 10 },
          { ko: '너무 위험해 보여 거절한다', en: 'Decline, it looks too dangerous', id: 'Tolak karena terlihat terlalu berbahaya',
            effect: {} },
        ],
      },
      {
        ko: { title: '실종자 수색 의뢰', text: '숲으로 약초를 캐러 간 마을 사람이 사흘째 돌아오지 않았다.\n가족이 눈물로 호소한다.' },
        en: { title: 'The Missing Person Request', text: 'A villager who went herb-gathering in the forest hasn\'t returned in three days.\nThe family pleads through tears.' },
        id: { title: 'Permintaan Pencarian Orang Hilang', text: 'Seorang warga desa yang pergi mencari herba di hutan belum kembali selama tiga hari.\nKeluarganya memohon sambil menangis.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[지도] 지도로 수색 범위를 좁혀 찾는다', en: '[World Map] Use the map to narrow the search', id: '[Peta Dunia] Gunakan peta untuk mempersempit pencarian',
            requires: 'map', effect: {}, pi: 15 },
          { ko: '숲을 샅샅이 뒤진다', en: 'Search the forest thoroughly', id: 'Geledah hutan dengan teliti',
            effect: { hunger: -15 }, pi: 10 },
          { ko: '다른 용병에게 넘긴다', en: 'Hand it off to another mercenary', id: 'Serahkan ke tentara bayaran lain',
            effect: {} },
        ],
      },
      {
        ko: { title: '이상한 소문 조사', text: '마을에 밤마다 이상한 빛이 보인다는 소문이 돈다.\n다들 무섭다며 다가가길 꺼린다.' },
        en: { title: 'Investigating a Strange Rumor', text: 'Rumors spread of a strange light seen every night in the village.\nEveryone is too afraid to go near it.' },
        id: { title: 'Menyelidiki Rumor Aneh', text: 'Rumor beredar tentang cahaya aneh yang terlihat setiap malam di desa.\nSemua orang terlalu takut untuk mendekat.' },
        effect: {},
        choices: [
          { ko: '밤에 직접 잠복해서 지켜본다', en: 'Stake out the area yourself at night', id: 'Mengintai sendiri di malam hari',
            effect: { hunger: -10 }, pi: 12 },
          { ko: '[마법 부적] 부적으로 정체를 감지한다', en: '[Charm] Use the charm to sense what it is', id: '[Jimat] Gunakan jimat untuk mendeteksi wujudnya',
            requires: 'charm', effect: {}, pi: 12 },
          { ko: '그냥 소문으로 치부하고 넘어간다', en: 'Dismiss it as just a rumor', id: 'Anggap saja itu cuma rumor',
            effect: {} },
        ],
      },
    ],

    // ── Stage 4: 주점과 동료 ─────────────────────────
    [
      {
        ko: { title: '용병 주점', text: '하루 일과를 마치고 들른 주점은 시끌벅적하다.\n한쪽 구석에서 낯익은 얼굴이 손을 흔든다.' },
        en: { title: 'The Mercenary Tavern', text: 'The tavern you stop by after a day\'s work is lively and loud.\nA familiar face waves from a corner.' },
        id: { title: 'Kedai Tentara Bayaran', text: 'Kedai yang kau singgahi setelah seharian bekerja ramai dan riuh.\nWajah yang dikenal melambai dari sudut ruangan.' },
        effect: {},
        choices: [
          { ko: '식사를 하며 정보를 나눈다 (3π)', en: 'Share a meal and swap information (3π)', id: 'Makan sambil bertukar informasi (3π)',
            pi: -3, effect: { hunger: 20 } },
          { ko: '동료의 술값을 대신 내준다 (5π)', en: 'Pay for a companion\'s drink (5π)', id: 'Bayarkan minuman untuk rekan (5π)',
            pi: -5, effect: { health: 10 } },
          { ko: '조용히 혼자 쉰다', en: 'Rest quietly by yourself', id: 'Beristirahat sendirian dengan tenang',
            effect: { hunger: 10 } },
        ],
      },
      {
        ko: { title: '수상한 정보상', text: '후드를 깊게 눌러쓴 정보상이 다가온다.\n"흥미로운 정보가 있는데, 관심 있으신가요?"' },
        en: { title: 'The Suspicious Informant', text: 'An informant with a deeply pulled hood approaches.\n"I have some interesting information — are you interested?"' },
        id: { title: 'Informan yang Mencurigakan', text: 'Seorang informan dengan tudung tertarik dalam mendekat.\n"Ada informasi menarik, kau tertarik?"' },
        effect: {},
        choices: [
          { ko: '정보를 산다 (5π)', en: 'Buy the information (5π)', id: 'Beli informasinya (5π)', pi: -5, effect: {} },
          { ko: '경계하며 거절한다', en: 'Decline warily', id: 'Tolak dengan waspada', effect: { hunger: -5 } },
          { ko: '[마법 부적] 부적으로 정체를 확인한 뒤 듣는다', en: '[Charm] Check their identity with the charm first', id: '[Jimat] Periksa identitasnya dengan jimat dulu',
            requires: 'charm', effect: {}, pi: 5 },
        ],
      },
      {
        ko: { title: '옛 전우와의 재회', text: '함께 소환됐던 다른 용사 한 명을 우연히 마주쳤다.\n그는 이미 이 세계에 완전히 적응한 듯하다.' },
        en: { title: 'Reunion with an Old Comrade', text: 'You run into another hero who was summoned alongside you.\nThey seem to have fully adapted to this world already.' },
        id: { title: 'Reuni dengan Rekan Lama', text: 'Kau bertemu tanpa sengaja dengan pahlawan lain yang dipanggil bersamamu.\nDia tampak sudah sepenuhnya beradaptasi dengan dunia ini.' },
        effect: {},
        choices: [
          { ko: '그동안의 이야기를 나눈다', en: 'Catch up on what\'s happened', id: 'Berbagi cerita tentang apa yang terjadi', effect: { hunger: -5 }, pi: 10 },
          { ko: '함께 임무를 하자고 제안한다', en: 'Suggest teaming up for missions', id: 'Ajak bekerja sama dalam misi',
            effect: {}, pi: 8 },
          { ko: '괜히 서먹해서 인사만 하고 헤어진다', en: 'Feel awkward, just say hi and part ways', id: 'Merasa canggung, hanya menyapa lalu berpisah',
            effect: {} },
        ],
      },
    ],

    // ── Stage 5: 마법 유적 ───────────────────────────
    [
      {
        ko: { title: '봉인된 유적', text: '의뢰를 따라온 곳은 고대 마법사의 유적이었다.\n입구에 복잡한 마법 문양이 새겨져 있다.' },
        en: { title: 'The Sealed Ruins', text: 'The request leads you to the ruins of an ancient mage.\nComplex magical sigils are carved at the entrance.' },
        id: { title: 'Reruntuhan Tersegel', text: 'Permintaan itu membawamu ke reruntuhan penyihir kuno.\nSimbol sihir yang rumit terukir di pintu masuk.' },
        effect: {},
        choices: [
          { ko: '[마법 부적] 부적으로 문양을 해석한다', en: '[Charm] Interpret the sigils with the charm', id: '[Jimat] Tafsirkan simbolnya dengan jimat',
            requires: 'charm', effect: {}, pi: 12 },
          { ko: '직감으로 문양을 눌러본다', en: 'Press the sigils based on instinct', id: 'Menekan simbol berdasarkan insting',
            effect: { health: -15 } },
          { ko: '다른 입구가 있는지 둘러본다', en: 'Look around for another entrance', id: 'Mencari pintu masuk lain di sekitar',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '메아리치는 회랑', text: '회랑에 들어서자 발소리가 이상하게 겹쳐 울린다.\n마치 누군가 뒤따라오는 것처럼.' },
        en: { title: 'The Echoing Corridor', text: 'Entering the corridor, your footsteps echo strangely, overlapping.\nAs if someone is following behind you.' },
        id: { title: 'Koridor Bergema', text: 'Memasuki koridor, langkah kakimu bergema aneh, saling tumpang tindih.\nSeolah ada yang mengikuti di belakang.' },
        effect: {},
        choices: [
          { ko: '[검] 검을 뽑아 들고 경계하며 나아간다', en: '[Blade] Draw your blade and advance cautiously', id: '[Pedang] Hunus pedang dan maju waspada',
            requires: 'blade', effect: {}, pi: 10 },
          { ko: '뒤돌아보지 않고 그대로 걷는다', en: 'Keep walking without looking back', id: 'Terus berjalan tanpa menoleh',
            effect: { hunger: -10 } },
          { ko: '벽에 등을 붙이고 잠시 멈춘다', en: 'Press your back to the wall and pause', id: 'Bersandar di dinding dan berhenti sejenak',
            effect: { health: -5 } },
        ],
      },
      {
        ko: { title: '시험의 방', text: '세 개의 받침대 위에 각각 다른 보석이 놓여 있다.\n"진실을 고르는 자만이 나아갈 수 있다"고 적혀 있다.' },
        en: { title: 'The Trial Chamber', text: 'Three pedestals each hold a different gem.\nAn inscription reads: "Only one who chooses truth may proceed."' },
        id: { title: 'Ruang Ujian', text: 'Tiga alas masing-masing menampilkan permata berbeda.\nTertulis: "Hanya yang memilih kebenaran yang boleh melanjutkan."' },
        effect: {},
        choices: [
          { ko: '가장 평범해 보이는 보석을 고른다', en: 'Choose the most ordinary-looking gem', id: 'Pilih permata yang paling biasa', effect: {}, pi: 12 },
          { ko: '[지도] 지도의 힌트를 참고해 고른다', en: '[World Map] Refer to a hint on the map', id: '[Peta Dunia] Merujuk petunjuk di peta',
            requires: 'map', effect: {}, pi: 12 },
          { ko: '가장 화려한 보석을 고른다', en: 'Choose the most dazzling gem', id: 'Pilih permata yang paling berkilau',
            effect: { health: -15 } },
        ],
      },
    ],

    // ── Stage 6: 어둠의 기사 ─────────────────────────
    [
      {
        ko: { title: '어둠의 기사', text: '유적 깊은 곳에서 검은 갑주의 기사가 앞을 막는다.\n"이 세계의 균형을 어지럽히는 자는 통과할 수 없다."' },
        en: { title: 'The Dark Knight', text: 'Deep in the ruins, a knight in black armor blocks the way.\n"One who disturbs this world\'s balance may not pass."' },
        id: { title: 'Ksatria Kegelapan', text: 'Jauh di dalam reruntuhan, seorang ksatria berzirah hitam menghalangi jalan.\n"Yang mengganggu keseimbangan dunia ini tak boleh lewat."' },
        effect: {},
        choices: [
          { ko: '[검] 정면으로 결투를 신청한다', en: '[Blade] Challenge him to a duel head-on', id: '[Pedang] Tantang duel langsung',
            requires: 'blade', effect: { health: -15 }, pi: 20 },
          { ko: '[마법 부적] 부적으로 저주를 풀어준다', en: '[Charm] Use the charm to break his curse', id: '[Jimat] Gunakan jimat untuk melepas kutukannya',
            requires: 'charm', effect: {}, pi: 20 },
          { ko: '대화로 오해를 풀려 한다', en: 'Try to resolve the misunderstanding by talking', id: 'Coba selesaikan kesalahpahaman lewat percakapan',
            effect: { hunger: -15 }, pi: 10 },
        ],
      },
      {
        ko: { title: '폭주하는 골렘', text: '유적을 지키던 마법 골렘이 갑자기 폭주하기 시작한다.\n눈이 붉게 물들며 사방을 부수기 시작한다.' },
        en: { title: 'The Rampaging Golem', text: 'The magical golem guarding the ruins suddenly goes berserk.\nIts eyes turn red as it smashes everything around it.' },
        id: { title: 'Golem yang Mengamuk', text: 'Golem sihir penjaga reruntuhan tiba-tiba mengamuk.\nMatanya berubah merah sambil menghancurkan segalanya.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[마법 부적] 부적으로 폭주를 진정시킨다', en: '[Charm] Calm the rampage with the charm', id: '[Jimat] Tenangkan amukan dengan jimat',
            requires: 'charm', effect: {}, pi: 18 },
          { ko: '[검] 핵심부를 노려 파괴한다', en: '[Blade] Aim for its core and destroy it', id: '[Pedang] Bidik intinya dan hancurkan',
            requires: 'blade', effect: { health: -15 }, pi: 18 },
          { ko: '일단 몸을 피한다', en: 'Just get out of the way', id: 'Menghindar dulu',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '배신한 대신', text: '아까 그 의심 많던 대신이 다크 로드와 손잡고 있었다.\n"용사 놀음은 여기까지다!"' },
        en: { title: 'The Treacherous Minister', text: 'The suspicious minister from before was in league with the Dark Lord all along.\n"Your hero act ends here!"' },
        id: { title: 'Menteri Pengkhianat', text: 'Menteri yang curiga tadi ternyata bersekutu dengan Sang Penguasa Kegelapan.\n"Peran pahlawanmu berakhir di sini!"' },
        effect: {},
        choices: [
          { ko: '[검] 배신자와 맞서 싸운다', en: '[Blade] Fight the traitor', id: '[Pedang] Lawan sang pengkhianat',
            requires: 'blade', effect: { health: -15 }, pi: 20 },
          { ko: '증거를 모아 공주에게 알리려 한다', en: 'Gather evidence to tell the princess', id: 'Kumpulkan bukti untuk lapor ke sang putri',
            effect: { hunger: -15 }, pi: 15 },
          { ko: '침착하게 협상을 시도한다', en: 'Calmly attempt to negotiate', id: 'Dengan tenang coba berunding',
            effect: {}, pi: 8 },
        ],
      },
    ],

    // ── Stage 7: 결전 전 선택 ────────────────────────
    [
      {
        ko: { title: '결전을 앞두고', text: '드디어 다크 로드의 성 앞에 도착했다.\n공주가 걱정스러운 얼굴로 마지막 인사를 건넨다.' },
        en: { title: 'Before the Final Battle', text: 'You finally arrive before the Dark Lord\'s castle.\nThe princess offers a worried farewell.' },
        id: { title: 'Sebelum Pertempuran Terakhir', text: 'Kau akhirnya tiba di depan kastil Sang Penguasa Kegelapan.\nSang putri memberi salam perpisahan dengan wajah cemas.' },
        effect: {},
        choices: [
          { ko: '혼자서 정면으로 돌입한다', en: 'Charge in alone, head-on', id: 'Menyerbu sendirian secara langsung',
            effect: { health: -15 }, pi: 20 },
          { ko: '옛 전우를 불러 함께 간다', en: 'Call your old comrade to go together', id: 'Panggil rekan lama untuk pergi bersama',
            effect: { hunger: -10 }, pi: 15 },
          { ko: '주민들의 도움을 받아 우회로로 잠입한다', en: 'Get villagers\' help to sneak in a back way', id: 'Minta bantuan warga untuk menyusup lewat jalan lain',
            effect: {}, pi: 12 },
        ],
      },
      {
        ko: { title: '무너진 성벽', text: '성벽 일부가 이미 무너져 있다. 다크 로드의 힘이 폭주하는 흔적이다.\n서두르지 않으면 성 전체가 무너질 것 같다.' },
        en: { title: 'The Crumbling Wall', text: 'Part of the castle wall has already collapsed — a sign of the Dark Lord\'s power running wild.\nWithout haste, the whole castle may fall.' },
        id: { title: 'Tembok yang Runtuh', text: 'Sebagian tembok kastil sudah runtuh — tanda kekuatan Sang Penguasa Kegelapan mengamuk.\nTanpa buru-buru, seluruh kastil bisa runtuh.' },
        effect: { hunger: -10 },
        choices: [
          { ko: '[지도] 지도로 가장 빠른 길을 찾는다', en: '[World Map] Use the map to find the fastest route', id: '[Peta Dunia] Gunakan peta untuk cari jalan tercepat',
            requires: 'map', effect: {}, pi: 18 },
          { ko: '무너지는 잔해를 뚫고 달린다', en: 'Run straight through the collapsing debris', id: 'Berlari menerobos reruntuhan',
            effect: { health: -20 }, pi: 15 },
          { ko: '침착하게 안전한 길을 찾는다', en: 'Calmly search for a safe path', id: 'Dengan tenang cari jalan yang aman',
            effect: { hunger: -10 }, pi: 8 },
        ],
      },
      {
        ko: { title: '마지막 조언', text: '길드 마스터가 귓속말로 다크 로드의 약점을 알려준다.\n"심장 옆의 검은 보석을 노려라."' },
        en: { title: 'Final Advice', text: 'The guildmaster whispers the Dark Lord\'s weakness.\n"Aim for the black gem beside his heart."' },
        id: { title: 'Nasihat Terakhir', text: 'Ketua serikat berbisik tentang kelemahan Sang Penguasa Kegelapan.\n"Bidik permata hitam di samping jantungnya."' },
        effect: {},
        choices: [
          { ko: '조언을 새기고 각오를 다진다', en: 'Take the advice to heart and steel your resolve', id: 'Simpan nasihat itu dan kuatkan tekad',
            effect: { hunger: -5 }, pi: 15 },
          { ko: '[검] 검을 점검하며 만반의 준비를 한다', en: '[Blade] Check your blade and prepare fully', id: '[Pedang] Periksa pedang dan siapkan diri sepenuhnya',
            requires: 'blade', effect: {}, pi: 15 },
          { ko: '불안한 마음을 애써 감춘다', en: 'Try hard to hide your unease', id: 'Berusaha menyembunyikan kegelisahan',
            effect: { health: -5 } },
        ],
      },
    ],

    // ── Stage 8: 엔딩 ────────────────────────────────
    [
      {
        ko: { title: '균형의 회복', text: '다크 로드를 물리치자 세계에 다시 빛이 돌아왔다.\n공주가 눈물을 흘리며 감사 인사를 전한다.' },
        en: { title: 'Balance Restored', text: 'With the Dark Lord defeated, light returns to the world.\nThe princess thanks you through tears.' },
        id: { title: 'Keseimbangan Pulih', text: 'Dengan kalahnya Sang Penguasa Kegelapan, cahaya kembali ke dunia.\nSang putri berterima kasih sambil menangis.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '용병으로 소환됐지만, 결국 이 세계의 영웅이 되었다.',
          en: 'Summoned as a mercenary, you became this world\'s hero in the end.',
          id: 'Dipanggil sebagai tentara bayaran, kau akhirnya menjadi pahlawan dunia ini.',
        },
      },
      {
        ko: { title: '고향으로 가는 문', text: '임무를 마치자 원래 세계로 돌아갈 수 있는 문이 열렸다.\n전우들이 아쉬운 얼굴로 배웅한다.' },
        en: { title: 'The Door Home', text: 'With the mission complete, a door back to your original world opens.\nYour comrades see you off with sad faces.' },
        id: { title: 'Pintu Menuju Rumah', text: 'Setelah misi selesai, pintu kembali ke dunia asalmu terbuka.\nPara rekan mengantarmu dengan wajah sedih.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '용병 일은 끝났지만, 이 세계에서의 기억은 평생 남을 것이다.',
          en: 'The mercenary work is over, but the memories of this world will last a lifetime.',
          id: 'Pekerjaan tentara bayaran berakhir, tapi kenangan di dunia ini akan bertahan seumur hidup.',
        },
      },
      {
        ko: { title: '새로운 시작', text: '다크 로드를 물리쳤지만, 이 세계에 남기로 결심했다.\n용병 길드 마스터가 새 사무실 열쇠를 건넨다.' },
        en: { title: 'A New Beginning', text: 'The Dark Lord is defeated, but you decide to stay in this world.\nThe guildmaster hands you keys to a new office.' },
        id: { title: 'Awal yang Baru', text: 'Sang Penguasa Kegelapan telah dikalahkan, tapi kau memutuskan tinggal di dunia ini.\nKetua serikat menyerahkan kunci kantor baru.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '용병으로 시작했지만, 이제 이 세계가 진짜 집이 되었다.',
          en: 'You started as a mercenary, but now this world has become your true home.',
          id: 'Kau memulai sebagai tentara bayaran, tapi kini dunia ini menjadi rumah sejatimu.',
        },
      },
    ],
  ],
};
