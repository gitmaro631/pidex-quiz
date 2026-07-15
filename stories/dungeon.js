// 던전 탐험가 — 스테이지별 후보 장면 풀(재플레이마다 무작위로 하나씩 뽑힘).
// 게임 진행 텍스트는 한국어/영어/인도네시아어만 작성 — 그 외 언어는 영어로 자동 대체됨.
// 이 데이터는 최초 플레이 시 Firestore(story_stages/dungeon)에 자동으로 저장되고,
// 이후에는 DB에서 읽어와 스테이지마다 참조함.
export const DUNGEON_POOL = {
  id: 'dungeon',
  items: {
    torch: {
      ko: { label: '횃불',  desc: '어둠 속을 밝혀 함정과 매복을 미리 봄' },
      en: { label: 'Torch', desc: 'Lights the dark, spots traps and ambushes early' },
      id: { label: 'Obor',  desc: 'Menerangi kegelapan, melihat jebakan lebih awal' },
    },
    sword: {
      ko: { label: '검',    desc: '몬스터와 정면으로 싸울 수 있음' },
      en: { label: 'Sword', desc: 'Lets you fight monsters head-on' },
      id: { label: 'Pedang',desc: 'Bisa melawan monster secara langsung' },
    },
    rope: {
      ko: { label: '밧줄',  desc: '틈새와 절벽을 안전하게 건넘' },
      en: { label: 'Rope',  desc: 'Safely cross gaps and cliffs' },
      id: { label: 'Tali',  desc: 'Menyeberangi celah dan tebing dengan aman' },
    },
  },

  // stages[i] = 스테이지 i의 후보 장면 배열. 마지막 배열은 엔딩 전용.
  stages: [

    // ── Stage 0: 무너진 입구 ─────────────────────────
    [
      {
        ko: { title: '무너진 입구', text: '보물 지도를 따라 들어온 순간, 등 뒤로 천장이 무너져 내렸다.\n돌아갈 길은 없다. 앞은 완전한 어둠뿐이다.' },
        en: { title: 'Collapsed Entrance', text: 'The ceiling caved in behind you the moment you followed the map inside.\nThere is no way back. Only darkness ahead.' },
        id: { title: 'Pintu Masuk Runtuh', text: 'Langit-langit runtuh di belakangmu begitu kau mengikuti peta masuk.\nTidak ada jalan kembali. Hanya kegelapan di depan.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[횃불] 횃불을 밝혀 조심스럽게 나아간다', en: '[Torch] Light the torch and move carefully', id: '[Obor] Nyalakan obor dan melangkah hati-hati',
            requires: 'torch', pi: 5, effect: {} },
          { ko: '벽을 더듬으며 어둠 속으로 들어간다', en: 'Feel along the wall into the darkness', id: 'Meraba dinding menuju kegelapan',
            effect: { health: -10 } },
          { ko: '숨을 고르고 발소리부터 죽여 움직인다', en: 'Steady your breath and move quietly', id: 'Tenangkan napas dan bergerak diam-diam',
            effect: { hunger: -5 } },
        ],
      },
      {
        ko: { title: '녹슨 철문', text: '입구 안쪽엔 오래전에 잠긴 철문이 있다.\n문 틈으로 차가운 공기가 새어 나온다. 뭔가 안에서 기다리고 있는 것 같다.' },
        en: { title: 'Rusted Iron Door', text: 'A long-sealed iron door blocks the way in.\nCold air leaks through the gap. Something feels like it is waiting inside.' },
        id: { title: 'Pintu Besi Berkarat', text: 'Sebuah pintu besi yang lama terkunci menghalangi jalan.\nUdara dingin bocor dari celahnya. Sesuatu seperti sedang menunggu di dalam.' },
        effect: { health: -5 },
        choices: [
          { ko: '[검] 검으로 경첩을 부순다', en: '[Sword] Break the hinges with your sword', id: '[Pedang] Hancurkan engsel dengan pedang',
            requires: 'sword', pi: 5, effect: {} },
          { ko: '몸으로 문을 밀어붙인다', en: 'Force the door open with your body', id: 'Dorong pintu dengan tubuhmu',
            effect: { health: -10 } },
          { ko: '자물쇠 구조를 살펴 조심스럽게 연다', en: 'Study the lock and open it carefully', id: 'Amati kuncinya dan buka perlahan',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '갈림길', text: '통로가 셋으로 갈라진다. 하나는 축축하고, 하나는 뜨겁고, 하나는 조용하다.\n조용한 쪽이 오히려 더 불안하게 느껴진다.' },
        en: { title: 'The Fork', text: 'The passage splits into three. One is damp, one is hot, one is silent.\nThe silent one feels the most unsettling.' },
        id: { title: 'Persimpangan', text: 'Lorong terbagi tiga. Satu lembap, satu panas, satu sunyi.\nYang sunyi justru terasa paling mengkhawatirkan.' },
        effect: {},
        choices: [
          { ko: '조용한 통로를 택한다', en: 'Take the silent passage', id: 'Pilih lorong yang sunyi', effect: { hunger: -5 }, pi: 5 },
          { ko: '축축한 통로를 택한다', en: 'Take the damp passage', id: 'Pilih lorong yang lembap', effect: { health: -5 } },
          { ko: '뜨거운 통로를 택한다', en: 'Take the hot passage', id: 'Pilih lorong yang panas', effect: { hunger: -10 } },
        ],
      },
    ],

    // ── Stage 1: 함정 방 ────────────────────────────
    [
      {
        ko: { title: '가시 바닥', text: '바닥 타일 일부가 미묘하게 색이 다르다.\n밟는 순간 아래로 가시가 튀어나올 것 같다.' },
        en: { title: 'Spiked Floor', text: 'Some floor tiles are a subtly different color.\nStep on the wrong one and spikes will surely spring up.' },
        id: { title: 'Lantai Berduri', text: 'Beberapa ubin lantai berwarna sedikit berbeda.\nJika salah injak, duri pasti akan muncul.' },
        effect: {},
        choices: [
          { ko: '[밧줄] 밧줄을 걸어 천장을 타고 건넌다', en: '[Rope] Rig the rope and swing across via the ceiling', id: '[Tali] Pasang tali dan menyeberang lewat langit-langit',
            requires: 'rope', pi: 8, effect: {} },
          { ko: '색이 다른 타일을 피해 조심조심 걷는다', en: 'Carefully step around the odd-colored tiles', id: 'Melangkah hati-hati menghindari ubin yang aneh',
            effect: { hunger: -10 } },
          { ko: '그냥 빠르게 뛰어 건넌다', en: 'Just sprint across quickly', id: 'Langsung berlari cepat menyeberang',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '화살 함정 복도', text: '벽에 작은 구멍들이 줄지어 뚫려 있다.\n지난번 탐험가의 것으로 보이는 뼈가 복도 중간에 널려 있다.' },
        en: { title: 'Arrow Trap Corridor', text: 'Small holes line the walls in rows.\nBones — likely from a past explorer — lie scattered in the middle of the hall.' },
        id: { title: 'Koridor Jebakan Panah', text: 'Lubang-lubang kecil berbaris di dinding.\nTulang-belulang — tampaknya penjelajah sebelumnya — berserakan di tengah lorong.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[횃불] 횃불로 구멍의 패턴을 미리 확인한다', en: '[Torch] Use the torch to spot the firing pattern first', id: '[Obor] Gunakan obor untuk melihat pola tembakan dulu',
            requires: 'torch', pi: 8, effect: {} },
          { ko: '뼈를 피해 벽에 바짝 붙어 걷는다', en: 'Hug the wall, avoiding the bones', id: 'Menempel di dinding, menghindari tulang',
            effect: { health: -10 } },
          { ko: '한 번에 전력으로 질주한다', en: 'Sprint through at full speed', id: 'Berlari sekencang mungkin melewatinya',
            effect: { health: -15, hunger: -5 } },
        ],
      },
      {
        ko: { title: '무너지는 다리', text: '깊은 균열 위로 낡은 돌다리가 걸쳐 있다.\n다리 중간이 이미 살짝 갈라져 있다.' },
        en: { title: 'Crumbling Bridge', text: 'An old stone bridge spans a deep crack.\nIt is already cracked halfway across.' },
        id: { title: 'Jembatan Runtuh', text: 'Jembatan batu tua membentang di atas celah dalam.\nBagian tengahnya sudah retak.' },
        effect: {},
        choices: [
          { ko: '[밧줄] 밧줄로 몸을 고정하고 건넌다', en: '[Rope] Secure yourself with the rope and cross', id: '[Tali] Amankan diri dengan tali lalu menyeberang',
            requires: 'rope', pi: 8, effect: {} },
          { ko: '무게를 최대한 분산시켜 천천히 건넌다', en: 'Cross slowly, spreading your weight', id: 'Menyeberang perlahan sambil menyebar berat tubuh',
            effect: { hunger: -10 } },
          { ko: '갈라진 부분을 뛰어넘는다', en: 'Leap over the cracked section', id: 'Melompati bagian yang retak',
            effect: { health: -15 } },
        ],
      },
    ],

    // ── Stage 2: 고블린 매복 ─────────────────────────
    [
      {
        ko: { title: '고블린 매복', text: '그림자 속에서 고블린 셋이 튀어나왔다.\n녹슨 창을 든 손이 떨리고 있다 — 저들도 겁먹은 것 같다.' },
        en: { title: 'Goblin Ambush', text: 'Three goblins leap from the shadows.\nTheir rusty spears shake in their hands — they seem just as scared.' },
        id: { title: 'Penyergapan Goblin', text: 'Tiga goblin melompat dari bayangan.\nTombak berkarat di tangan mereka gemetar — sepertinya mereka juga takut.' },
        effect: {},
        choices: [
          { ko: '[검] 앞장서서 맞서 싸운다', en: '[Sword] Stand and fight them head-on', id: '[Pedang] Berdiri dan lawan mereka langsung',
            requires: 'sword', pi: 10, effect: { health: -5 } },
          { ko: '금화 몇 개를 던져주고 지나간다', en: 'Toss a few coins and walk past', id: 'Lempar beberapa koin lalu berlalu',
            effect: { hunger: -5 }, pi: -5 },
          { ko: '뒤돌아 좁은 틈으로 도망친다', en: 'Turn and flee through a narrow gap', id: 'Berbalik dan lari melalui celah sempit',
            effect: { health: -10, hunger: -10 } },
        ],
      },
      {
        ko: { title: '덫에 걸린 고블린', text: '고블린 한 마리가 스스로 놓은 덫에 걸려 버둥대고 있다.\n동료들은 이미 도망친 듯하다.' },
        en: { title: 'Trapped Goblin', text: 'A lone goblin is struggling, caught in its own trap.\nIts companions seem to have already fled.' },
        id: { title: 'Goblin Terjebak', text: 'Seekor goblin meronta, terjebak dalam perangkapnya sendiri.\nTemannya sepertinya sudah kabur.' },
        effect: {},
        choices: [
          { ko: '풀어주고 길을 묻는다', en: 'Free it and ask for directions', id: 'Bebaskan dan tanyakan arah', effect: {}, pi: 10 },
          { ko: '[검] 처치하고 지나간다', en: '[Sword] Finish it off and move on', id: '[Pedang] Habisi dan lanjutkan',
            requires: 'sword', pi: 5, effect: {} },
          { ko: '못 본 척 지나간다', en: 'Ignore it and pass by', id: 'Abaikan dan lewati saja', effect: { hunger: -5 } },
        ],
      },
      {
        ko: { title: '고블린 야영지', text: '작은 모닥불 주위로 고블린들이 잠들어 있다.\n한쪽 구석에 상자 하나가 놓여 있다.' },
        en: { title: 'Goblin Campsite', text: 'Goblins sleep around a small campfire.\nA chest sits in the corner.' },
        id: { title: 'Perkemahan Goblin', text: 'Para goblin tertidur mengelilingi api unggun kecil.\nSebuah peti berada di sudut.' },
        effect: {},
        choices: [
          { ko: '조용히 상자만 챙겨 빠져나온다', en: 'Quietly grab the chest and slip away', id: 'Diam-diam ambil peti dan menyelinap pergi',
            effect: { hunger: -5 }, pi: 12 },
          { ko: '[검] 자는 틈을 타 기습한다', en: '[Sword] Ambush them while they sleep', id: '[Pedang] Serang mereka saat tertidur',
            requires: 'sword', pi: 15, effect: {} },
          { ko: '들키지 않게 멀리 돌아간다', en: 'Take a long detour to avoid them', id: 'Mengambil jalan memutar untuk menghindari mereka',
            effect: { hunger: -15 } },
        ],
      },
    ],

    // ── Stage 3: 지하 강 ─────────────────────────────
    [
      {
        ko: { title: '지하 강', text: '검은 지하수가 넓게 흐르고 있다.\n건너편 벽에 오래된 다리의 잔해가 보인다.' },
        en: { title: 'Underground River', text: 'A wide black underground river flows before you.\nThe remains of an old bridge are visible on the far wall.' },
        id: { title: 'Sungai Bawah Tanah', text: 'Sungai bawah tanah yang gelap mengalir luas di depanmu.\nSisa jembatan tua terlihat di dinding seberang.' },
        effect: {},
        choices: [
          { ko: '[밧줄] 부서진 다리에 밧줄을 걸어 건넌다', en: '[Rope] Rig the rope to the broken bridge and cross', id: '[Tali] Pasang tali ke jembatan rusak dan menyeberang',
            requires: 'rope', pi: 8, effect: {} },
          { ko: '차가운 물살을 헤엄쳐 건넌다', en: 'Swim across the freezing current', id: 'Berenang menyeberangi arus yang dingin',
            effect: { health: -10, hunger: -10 } },
          { ko: '상류로 돌아가 얕은 곳을 찾는다', en: 'Head upstream to find a shallow crossing', id: 'Menuju ke hulu mencari titik dangkal',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '눈먼 물고기 떼', text: '강물 속에서 무언가 하얗고 눈먼 물고기들이 꿈틀댄다.\n해롭지는 않아 보이지만 소름이 돋는다.' },
        en: { title: 'Blind Fish Swarm', text: 'Pale, eyeless fish writhe in the water.\nThey seem harmless, but it is unsettling all the same.' },
        id: { title: 'Kawanan Ikan Buta', text: 'Ikan pucat tanpa mata menggeliat di dalam air.\nTerlihat tidak berbahaya, tapi tetap membuat merinding.' },
        effect: {},
        choices: [
          { ko: '[밧줄] 로프를 이용해 물에 닿지 않고 건넌다', en: '[Rope] Cross without touching the water using the rope', id: '[Tali] Menyeberang tanpa menyentuh air memakai tali',
            requires: 'rope', pi: 8, effect: {} },
          { ko: '몇 마리 잡아 챙기고 건넌다', en: 'Catch a few for food, then cross', id: 'Tangkap beberapa untuk makanan, lalu menyeberang',
            effect: { hunger: 10, health: -5 } },
          { ko: '숨을 참고 빠르게 헤엄쳐 지나간다', en: 'Hold your breath and swim through quickly', id: 'Tahan napas dan berenang cepat melewatinya',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '갈라진 수로', text: '강이 두 갈래로 갈라진다. 하나는 잔잔하고, 하나는 소용돌이친다.\n소용돌이 너머로 희미한 빛이 보인다.' },
        en: { title: 'Split Channel', text: 'The river splits in two. One side is calm, the other swirls violently.\nA faint light glimmers beyond the swirling side.' },
        id: { title: 'Aliran Bercabang', text: 'Sungai terbagi dua. Satu sisi tenang, satu berputar ganas.\nCahaya samar terlihat di balik sisi yang berputar.' },
        effect: {},
        choices: [
          { ko: '잔잔한 쪽으로 안전하게 건넌다', en: 'Cross safely on the calm side', id: 'Menyeberang dengan aman di sisi yang tenang',
            effect: { hunger: -10 } },
          { ko: '[밧줄] 밧줄을 걸고 소용돌이를 가로지른다', en: '[Rope] Rope up and cross through the swirling water', id: '[Tali] Pasang tali dan menyeberangi arus berputar',
            requires: 'rope', pi: 12, effect: {} },
          { ko: '위험을 무릅쓰고 소용돌이로 뛰어든다', en: 'Risk it and dive into the swirling water', id: 'Nekat terjun ke dalam arus berputar',
            effect: { health: -20 }, pi: 5 },
        ],
      },
    ],

    // ── Stage 4: 은둔자 상인 ─────────────────────────
    [
      {
        ko: { title: '은둔자 상인', text: '누더기를 걸친 노인이 낡은 좌판 앞에 앉아 있다.\n"살 텐가, 아니면 그냥 지나갈 텐가?"' },
        en: { title: 'Reclusive Merchant', text: 'An old man in tattered robes sits behind a worn stall.\n"Buying, or just passing through?"' },
        id: { title: 'Pedagang Pertapa', text: 'Seorang lelaki tua berjubah lusuh duduk di balik lapaknya.\n"Mau beli, atau cuma lewat?"' },
        effect: {},
        choices: [
          { ko: '체력 물약을 산다 (5π)', en: 'Buy a healing potion (5π)', id: 'Beli ramuan penyembuh (5π)',
            pi: -5, effect: { health: 20 } },
          { ko: '식량을 산다 (3π)', en: 'Buy food supplies (3π)', id: 'Beli persediaan makanan (3π)',
            pi: -3, effect: { hunger: 20 } },
          { ko: '아무것도 사지 않고 지나간다', en: 'Buy nothing and move on', id: 'Tidak membeli apa-apa dan lanjut',
            effect: { hunger: -5 } },
        ],
      },
      {
        ko: { title: '거래의 방', text: '상인이 낡은 지도 조각을 흔들어 보인다.\n"이걸 원한다면, 대가가 필요하지."' },
        en: { title: 'The Trading Room', text: 'The merchant waves a worn map fragment.\n"If you want this, it\'ll cost you."' },
        id: { title: 'Ruang Perdagangan', text: 'Pedagang itu mengibaskan potongan peta usang.\n"Kalau mau ini, ada harganya."' },
        effect: {},
        choices: [
          { ko: '금화로 지도 조각을 산다 (8π)', en: 'Pay for the map fragment (8π)', id: 'Bayar untuk potongan peta (8π)',
            pi: -8, effect: {} },
          { ko: '거절하고 감으로 나아간다', en: 'Refuse and press on by instinct', id: 'Tolak dan lanjut mengandalkan insting',
            effect: { hunger: -10 } },
          { ko: '흥정을 시도한다', en: 'Try to haggle', id: 'Coba menawar', effect: {}, pi: -3 },
        ],
      },
      {
        ko: { title: '수상한 유령상인', text: '반투명한 상인이 좌판 뒤에서 미소짓는다.\n"산 자의 금화는 받지 않아. 다른 걸 내놓게."' },
        en: { title: 'The Ghostly Merchant', text: 'A translucent merchant smiles behind the stall.\n"I don\'t take coin from the living. Offer something else."' },
        id: { title: 'Pedagang Hantu', text: 'Pedagang tembus pandang tersenyum di balik lapaknya.\n"Aku tak menerima koin dari yang hidup. Tawarkan yang lain."' },
        effect: {},
        choices: [
          { ko: '체력을 조금 나눠준다', en: 'Offer a bit of your vitality', id: 'Berikan sedikit vitalitasmu',
            effect: { health: -10 }, pi: 15 },
          { ko: '식량을 나눠준다', en: 'Offer some of your food', id: 'Berikan sebagian makananmu',
            effect: { hunger: -15 }, pi: 10 },
          { ko: '정중히 거절하고 물러난다', en: 'Politely decline and step back', id: 'Menolak dengan sopan dan mundur',
            effect: {} },
        ],
      },
    ],

    // ── Stage 5: 룬 문양 자물쇠 ──────────────────────
    [
      {
        ko: { title: '룬 문양 문', text: '거대한 돌문에 빛나는 룬 문양이 새겨져 있다.\n잘못 건드리면 무슨 일이 벌어질지 모른다.' },
        en: { title: 'The Rune Door', text: 'A massive stone door is carved with glowing runes.\nTouch the wrong one, and who knows what happens.' },
        id: { title: 'Pintu Berukir Rune', text: 'Pintu batu raksasa terukir rune yang bercahaya.\nSalah sentuh, entah apa yang akan terjadi.' },
        effect: {},
        choices: [
          { ko: '[횃불] 불빛으로 룬을 자세히 살펴 순서를 찾는다', en: '[Torch] Study the runes closely by torchlight to find the order', id: '[Obor] Amati rune dengan cahaya obor untuk menemukan urutannya',
            requires: 'torch', pi: 10, effect: {} },
          { ko: '직감으로 룬을 눌러본다', en: 'Press the runes based on a hunch', id: 'Menekan rune berdasarkan firasat',
            effect: { health: -15 }, pi: 5 },
          { ko: '문 옆의 다른 틈을 찾아본다', en: 'Search for another way around the door', id: 'Mencari jalan lain di sekitar pintu',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '수수께끼의 조각상', text: '세 개의 조각상이 나란히 서 있다.\n받침대에 "정직한 자만이 지나간다"라고 새겨져 있다.' },
        en: { title: 'The Riddling Statues', text: 'Three statues stand in a row.\nThe base reads: "Only the honest may pass."' },
        id: { title: 'Patung Teka-teki', text: 'Tiga patung berdiri berjajar.\nAlasnya bertuliskan: "Hanya yang jujur boleh lewat."' },
        effect: {},
        choices: [
          { ko: '가운데 조각상 앞에 선다', en: 'Stand before the middle statue', id: 'Berdiri di depan patung tengah', effect: {}, pi: 8 },
          { ko: '왼쪽 조각상 앞에 선다', en: 'Stand before the left statue', id: 'Berdiri di depan patung kiri', effect: { hunger: -10 } },
          { ko: '조각상을 무시하고 지나간다', en: 'Ignore the statues and walk past', id: 'Abaikan patung-patung itu dan lewat',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '메아리치는 방', text: '방에 들어서자 자신의 발소리가 몇 배로 울린다.\n어딘가에서 무언가 그 소리에 반응하는 듯하다.' },
        en: { title: 'The Echoing Chamber', text: 'Your footsteps echo many times over as you enter.\nSomething, somewhere, seems to react to the sound.' },
        id: { title: 'Ruang Bergema', text: 'Langkah kakimu bergema berkali-kali saat memasuki ruangan.\nSesuatu, entah di mana, sepertinya bereaksi terhadap suara itu.' },
        effect: {},
        choices: [
          { ko: '조용히 벽을 따라 이동한다', en: 'Move quietly along the wall', id: 'Bergerak diam-diam di sepanjang dinding',
            effect: { hunger: -10 } },
          { ko: '[검] 검을 뽑아 들고 정면으로 나아간다', en: '[Sword] Draw your sword and advance head-on', id: '[Pedang] Hunus pedang dan maju langsung',
            requires: 'sword', pi: 10, effect: {} },
          { ko: '빠르게 뛰어서 방을 가로지른다', en: 'Sprint quickly across the room', id: 'Berlari cepat melintasi ruangan',
            effect: { health: -10 } },
        ],
      },
    ],

    // ── Stage 6: 수호자 ──────────────────────────────
    [
      {
        ko: { title: '돌 골렘 수호자', text: '거대한 돌 골렘이 보물방 앞을 가로막고 서 있다.\n눈에서 붉은 빛이 서서히 켜진다.' },
        en: { title: 'The Stone Golem Guardian', text: 'A massive stone golem blocks the way to the treasure room.\nRed light slowly kindles in its eyes.' },
        id: { title: 'Golem Batu Penjaga', text: 'Golem batu raksasa menghalangi jalan ke ruang harta.\nCahaya merah perlahan menyala di matanya.' },
        effect: {},
        choices: [
          { ko: '[검] 정면으로 맞서 싸운다', en: '[Sword] Fight it head-on', id: '[Pedang] Lawan langsung',
            requires: 'sword', pi: 20, effect: { health: -15 } },
          { ko: '골렘의 발밑 균열을 노려 무너뜨린다', en: 'Aim for the crack beneath it to bring it down', id: 'Bidik retakan di bawahnya untuk merobohkannya',
            effect: { hunger: -15 }, pi: 12 },
          { ko: '골렘이 움직이기 전에 옆을 스쳐 지나간다', en: 'Slip past before it fully awakens', id: 'Menyelinap lewat sebelum ia benar-benar bangun',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '어린 용', text: '보물 더미 위에 작은 용 한 마리가 잠들어 있다.\n아직 어려 보이지만, 콧김만으로도 뜨겁다.' },
        en: { title: 'The Young Dragon', text: 'A small dragon sleeps atop a pile of treasure.\nStill young, but its breath alone is scorching.' },
        id: { title: 'Naga Muda', text: 'Seekor naga kecil tertidur di atas tumpukan harta.\nMasih muda, tapi napasnya saja sudah membakar.' },
        effect: {},
        choices: [
          { ko: '조용히 보물 일부만 챙긴다', en: 'Quietly take only some of the treasure', id: 'Diam-diam ambil sebagian hartanya saja',
            effect: { hunger: -10 }, pi: 15 },
          { ko: '[검] 잠든 틈을 타 공격한다', en: '[Sword] Strike while it sleeps', id: '[Pedang] Serang saat ia tertidur',
            requires: 'sword', pi: 20, effect: { health: -10 } },
          { ko: '조용히 물러나 다른 길을 찾는다', en: 'Quietly retreat and find another way', id: 'Mundur diam-diam dan cari jalan lain',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '망령 기사', text: '녹슨 갑주를 입은 기사의 망령이 길을 막는다.\n"이 문을 지나려면 나를 넘어서야 한다."' },
        en: { title: 'The Spectral Knight', text: 'A ghostly knight in rusted armor blocks the way.\n"To pass this door, you must best me."' },
        id: { title: 'Ksatria Hantu', text: 'Hantu ksatria berzirah berkarat menghalangi jalan.\n"Untuk lewat pintu ini, kau harus mengalahkanku."' },
        effect: {},
        choices: [
          { ko: '[검] 정정당당히 결투에 응한다', en: '[Sword] Accept the duel with honor', id: '[Pedang] Terima duel dengan terhormat',
            requires: 'sword', pi: 20, effect: { health: -10 } },
          { ko: '망령의 사연을 물어 마음을 달랜다', en: 'Ask about its story and offer comfort', id: 'Tanyakan kisahnya dan tenangkan hatinya',
            effect: { hunger: -10 }, pi: 15 },
          { ko: '틈을 노려 재빨리 지나친다', en: 'Watch for an opening and dash past', id: 'Menunggu celah dan berlari melewatinya',
            effect: { health: -15 } },
        ],
      },
    ],

    // ── Stage 7: 보물방 선택 ─────────────────────────
    [
      {
        ko: { title: '보물의 방', text: '드디어 도착한 보물의 방. 금은보화가 산더미다.\n하지만 천장에서 희미하게 돌가루가 떨어지기 시작한다.' },
        en: { title: 'The Treasure Room', text: 'You finally reach the treasure room. Gold and jewels pile high.\nBut fine dust begins falling faintly from the ceiling.' },
        id: { title: 'Ruang Harta', text: 'Akhirnya tiba di ruang harta. Emas dan permata menumpuk tinggi.\nNamun debu halus mulai berjatuhan samar dari langit-langit.' },
        effect: {},
        choices: [
          { ko: '눈에 띄는 것만 빠르게 챙긴다', en: 'Grab only what catches your eye, quickly', id: 'Ambil cepat hanya yang mencolok mata',
            effect: { hunger: -5 }, pi: 20 },
          { ko: '욕심을 버리고 최소한만 챙긴다', en: 'Resist greed and take only the essentials', id: 'Tahan keserakahan, ambil seperlunya saja',
            effect: {}, pi: 10 },
          { ko: '가방 가득 최대한 많이 챙긴다', en: 'Fill your bag with as much as possible', id: 'Penuhi tasmu dengan sebanyak mungkin',
            effect: { health: -15 }, pi: 30 },
        ],
      },
      {
        ko: { title: '갇힌 동료', text: '보물방 한쪽에 갇혀 있는 다른 탐험가를 발견했다.\n"저를 꺼내주시면, 탈출로를 알려드리겠습니다."' },
        en: { title: 'The Trapped Fellow', text: 'You find another explorer trapped in the corner of the room.\n"Free me, and I\'ll show you the way out."' },
        id: { title: 'Sesama yang Terjebak', text: 'Kau menemukan penjelajah lain yang terjebak di sudut ruangan.\n"Bebaskan aku, dan kutunjukkan jalan keluar."' },
        effect: {},
        choices: [
          { ko: '망설임 없이 구해준다', en: 'Free them without hesitation', id: 'Bebaskan tanpa ragu', effect: { hunger: -5 }, pi: 15 },
          { ko: '보물을 먼저 챙긴 뒤 구해준다', en: 'Grab treasure first, then free them', id: 'Ambil harta dulu, baru bebaskan mereka',
            effect: {}, pi: 20 },
          { ko: '혼자 조용히 빠져나간다', en: 'Slip away alone, quietly', id: 'Menyelinap pergi sendirian',
            effect: { hunger: -10 }, pi: 10 },
        ],
      },
      {
        ko: { title: '흔들리는 던전', text: '보물방에 들어서자마자 던전 전체가 진동하기 시작한다.\n무언가 무너지려 하고 있다.' },
        en: { title: 'The Trembling Dungeon', text: 'The moment you enter, the whole dungeon starts to shake.\nSomething is about to collapse.' },
        id: { title: 'Dungeon Bergetar', text: 'Begitu memasuki ruangan, seluruh dungeon mulai bergetar.\nSesuatu akan segera runtuh.' },
        effect: { hunger: -10 },
        choices: [
          { ko: '가까운 보물만 낚아채고 뛴다', en: 'Snatch the nearest treasure and run', id: 'Sambar harta terdekat lalu lari',
            effect: { health: -10 }, pi: 18 },
          { ko: '아무것도 챙기지 않고 즉시 탈출한다', en: 'Take nothing and escape immediately', id: 'Tidak mengambil apa pun dan langsung kabur',
            effect: {}, pi: 0 },
          { ko: '위험을 무릅쓰고 가방을 가득 채운다', en: 'Risk it and fill your bag completely', id: 'Nekat memenuhi seluruh tasmu',
            effect: { health: -25 }, pi: 35 },
        ],
      },
    ],

    // ── Stage 8: 엔딩 ────────────────────────────────
    [
      {
        ko: { title: '탈출 성공', text: '무너지는 던전을 뒤로하고 마침내 지상의 빛을 마주했다.\n손에 쥔 보물이 그간의 위험을 증명한다.' },
        en: { title: 'Escaped', text: 'Leaving the collapsing dungeon behind, you finally see daylight.\nThe treasure in your hands proves every risk was worth it.' },
        id: { title: 'Berhasil Kabur', text: 'Meninggalkan dungeon yang runtuh, kau akhirnya melihat cahaya matahari.\nHarta di tanganmu membuktikan semua risiko itu sepadan.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '지도 한 장이 인생을 바꿨다. 하지만 다음번엔 좀 더 신중해지기로 한다.',
          en: 'One map changed everything. Next time, you decide to be more careful.',
          id: 'Satu peta mengubah segalanya. Lain kali, kau memutuskan untuk lebih berhati-hati.',
        },
      },
      {
        ko: { title: '숨겨진 통로', text: '보물방 뒤편에서 발견한 비밀 통로가 곧장 지상으로 이어져 있었다.\n예상보다 훨씬 수월한 탈출이었다.' },
        en: { title: 'The Hidden Passage', text: 'A secret passage behind the treasure room led straight to the surface.\nThe escape was far easier than expected.' },
        id: { title: 'Lorong Tersembunyi', text: 'Lorong rahasia di balik ruang harta langsung menuju permukaan.\nJalan keluar ini jauh lebih mudah dari dugaan.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '던전은 언제나 나가는 길을 하나쯤 숨겨두는 법이다.',
          en: 'A dungeon always hides at least one way out.',
          id: 'Sebuah dungeon selalu menyembunyikan setidaknya satu jalan keluar.',
        },
      },
      {
        ko: { title: '동료와 함께', text: '구해준 동료가 지름길을 알고 있었다.\n둘이서 나눈 보물이지만, 혼자였다면 못 나왔을 것이다.' },
        en: { title: 'With a Companion', text: 'The fellow you freed knew a shortcut.\nThe treasure is split two ways, but you wouldn\'t have made it out alone.' },
        id: { title: 'Bersama Rekan', text: 'Rekan yang kau bebaskan tahu jalan pintas.\nHarta terbagi dua, tapi kau tak akan berhasil keluar sendirian.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '혼자 짊어진 위험보다, 나눈 보상이 더 오래 남았다.',
          en: 'A shared reward outlasts a risk carried alone.',
          id: 'Imbalan yang dibagi bertahan lebih lama daripada risiko yang ditanggung sendirian.',
        },
      },
    ],
  ],
};
