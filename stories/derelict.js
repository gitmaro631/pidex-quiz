// 표류 우주선 — 스테이지별 후보 장면 풀. dungeon.js와 동일한 구조.
export const DERELICT_POOL = {
  id: 'derelict',
  items: {
    wrench: {
      ko: { label: '렌치',      desc: '기계와 장치를 수리함' },
      en: { label: 'Wrench',    desc: 'Repairs machinery and devices' },
      id: { label: 'Kunci Inggris', desc: 'Memperbaiki mesin dan perangkat' },
    },
    oxygen_tank: {
      ko: { label: '산소통',    desc: '진공·저산소 구역에서 생명 유지' },
      en: { label: 'Oxygen Tank', desc: 'Keeps you alive in vacuum/low-oxygen zones' },
      id: { label: 'Tabung Oksigen', desc: 'Menjaga hidup di zona vakum/oksigen rendah' },
    },
    multitool: {
      ko: { label: '다용도 공구', desc: '문과 시스템을 해킹·강제 개방' },
      en: { label: 'Multitool',   desc: 'Hacks or forces open doors and systems' },
      id: { label: 'Multitool',   desc: 'Meretas atau membuka paksa pintu dan sistem' },
    },
  },

  stages: [

    // ── Stage 0: 비상 각성 ───────────────────────────
    [
      {
        ko: { title: '비상 각성', text: '경보음에 눈을 떴다. 냉동수면 캡슐이 절반쯤 파손되어 있다.\n선체 곳곳에서 스파크가 튄다.' },
        en: { title: 'Emergency Wake-Up', text: 'You wake to an alarm. Your cryo-pod is half-damaged.\nSparks fly throughout the hull.' },
        id: { title: 'Bangun Darurat', text: 'Kau terbangun karena alarm. Pod krio-mu setengah rusak.\nPercikan api terbang di seluruh lambung kapal.' },
        effect: { health: -5 },
        choices: [
          { ko: '[다용도 공구] 캡슐 잠금을 강제로 해제한다', en: '[Multitool] Force the pod lock open', id: '[Multitool] Buka paksa kunci pod',
            requires: 'multitool', effect: {}, pi: 5 },
          { ko: '침착하게 수동 해제 절차를 따른다', en: 'Calmly follow the manual release procedure', id: 'Dengan tenang ikuti prosedur pelepasan manual',
            effect: { hunger: -10 } },
          { ko: '힘으로 캡슐 문을 뜯어낸다', en: 'Force the pod door off with brute strength', id: 'Melepas pintu pod dengan tenaga kasar',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '선내 방송', text: '고장난 스피커에서 끊기는 선내 방송이 흘러나온다.\n"...선체 손상... 산소 농도 저하... 생존자는..."' },
        en: { title: 'The Ship\'s Broadcast', text: 'A broken speaker crackles with a ship-wide broadcast.\n"...hull breach... oxygen levels dropping... survivors should..."' },
        id: { title: 'Siaran Kapal', text: 'Speaker yang rusak mengeluarkan siaran seluruh kapal yang terputus-putus.\n"...kerusakan lambung... kadar oksigen menurun... penyintas harap..."' },
        effect: { hunger: -5 },
        choices: [
          { ko: '방송 내용을 끝까지 들어본다', en: 'Listen to the full broadcast', id: 'Dengarkan siaran sampai selesai', effect: {}, pi: 8 },
          { ko: '[산소통] 산소통부터 챙겨 멘다', en: '[Oxygen Tank] Grab and equip the oxygen tank first', id: '[Tabung Oksigen] Ambil dan pakai tabung oksigen dulu',
            requires: 'oxygen_tank', effect: {}, pi: 5 },
          { ko: '방송을 무시하고 즉시 움직인다', en: 'Ignore the broadcast and move immediately', id: 'Abaikan siaran dan langsung bergerak',
            effect: { health: -5 } },
        ],
      },
      {
        ko: { title: '동료 승무원의 캡슐', text: '옆 캡슐 창 너머로 동료 승무원이 보인다.\n캡슐 화면에 오류 코드가 깜빡인다.' },
        en: { title: 'A Crewmate\'s Pod', text: 'Through the window of the next pod, you see a fellow crew member.\nAn error code blinks on the pod\'s display.' },
        id: { title: 'Pod Rekan Kru', text: 'Melalui jendela pod di sebelah, kau melihat rekan kru.\nKode error berkedip di layar pod.' },
        effect: {},
        choices: [
          { ko: '[렌치] 렌치로 캡슐을 두드려 깨운다', en: '[Wrench] Tap the pod with the wrench to wake them', id: '[Kunci Inggris] Ketuk pod dengan kunci inggris untuk membangunkan',
            requires: 'wrench', effect: {}, pi: 10 },
          { ko: '수동으로 캡슐을 열어본다', en: 'Try opening the pod manually', id: 'Coba buka pod secara manual',
            effect: { hunger: -10 }, pi: 8 },
          { ko: '시간이 없어 일단 지나친다', en: 'No time, move past for now', id: 'Tidak ada waktu, lewati dulu',
            effect: {} },
        ],
      },
    ],

    // ── Stage 1: 격리된 구역 ─────────────────────────
    [
      {
        ko: { title: '봉인된 격벽', text: '자동 봉쇄된 격벽이 다음 구역으로 가는 길을 막고 있다.\n제어판이 빨갛게 점멸한다.' },
        en: { title: 'The Sealed Bulkhead', text: 'An automatically sealed bulkhead blocks the way to the next section.\nThe control panel blinks red.' },
        id: { title: 'Sekat Tertutup', text: 'Sekat yang tertutup otomatis menghalangi jalan ke bagian berikutnya.\nPanel kontrol berkedip merah.' },
        effect: {},
        choices: [
          { ko: '[다용도 공구] 공구로 제어판을 해킹한다', en: '[Multitool] Hack the control panel with the multitool', id: '[Multitool] Retas panel kontrol dengan multitool',
            requires: 'multitool', effect: {}, pi: 8 },
          { ko: '[렌치] 렌치로 수동 개폐 장치를 돌린다', en: '[Wrench] Turn the manual release with the wrench', id: '[Kunci Inggris] Putar pelepas manual dengan kunci inggris',
            requires: 'wrench', effect: {}, pi: 8 },
          { ko: '환기구를 통해 우회한다', en: 'Go around through the vents', id: 'Memutar lewat ventilasi',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '깜빡이는 비상등', text: '구역 전체의 조명이 불안정하게 깜빡인다.\n어둠 속에서 뭔가 움직이는 그림자가 스친다.' },
        en: { title: 'The Flickering Emergency Lights', text: 'Lights throughout the section flicker unstably.\nA moving shadow flits through the darkness.' },
        id: { title: 'Lampu Darurat yang Berkedip', text: 'Lampu di seluruh bagian berkedip tidak stabil.\nBayangan yang bergerak melintas dalam kegelapan.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '벽에 붙어 조용히 이동한다', en: 'Hug the wall and move quietly', id: 'Menempel dinding dan bergerak diam-diam',
            effect: { hunger: -10 } },
          { ko: '[렌치] 렌치를 쥐고 경계하며 나아간다', en: '[Wrench] Advance cautiously with the wrench ready', id: '[Kunci Inggris] Maju waspada dengan kunci inggris siap',
            requires: 'wrench', effect: {}, pi: 8 },
          { ko: '조명을 무시하고 빠르게 지나간다', en: 'Ignore the lights and move through quickly', id: 'Abaikan lampu dan lewat dengan cepat',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '감압된 통로', text: '이 구역은 이미 부분적으로 감압되어 공기가 희박하다.\n숨이 점점 가빠온다.' },
        en: { title: 'The Depressurized Corridor', text: 'This section is already partially depressurized, air thin.\nYour breathing grows ragged.' },
        id: { title: 'Koridor Terdekompresi', text: 'Bagian ini sudah sebagian terdekompresi, udaranya tipis.\nNapasmu makin memburu.' },
        effect: { health: -5 },
        choices: [
          { ko: '[산소통] 산소통을 연결하고 지나간다', en: '[Oxygen Tank] Hook up the oxygen tank and proceed', id: '[Tabung Oksigen] Sambungkan tabung oksigen dan lanjut',
            requires: 'oxygen_tank', effect: {}, pi: 10 },
          { ko: '숨을 참고 최대한 빨리 지나간다', en: 'Hold your breath and move as fast as possible', id: 'Tahan napas dan bergerak secepat mungkin',
            effect: { health: -15 } },
          { ko: '되돌아가 다른 경로를 찾는다', en: 'Turn back to find another route', id: 'Kembali untuk mencari rute lain',
            effect: { hunger: -15 } },
        ],
      },
    ],

    // ── Stage 2: 이상 생명체 ─────────────────────────
    [
      {
        ko: { title: '정체불명의 생명체', text: '화물칸에서 정체를 알 수 없는 생명체와 마주쳤다.\n지구의 그 어떤 생물과도 닮지 않았다.' },
        en: { title: 'The Unknown Creature', text: 'In the cargo bay, you encounter an unidentifiable creature.\nIt resembles nothing from Earth.' },
        id: { title: 'Makhluk Tak Dikenal', text: 'Di ruang kargo, kau bertemu makhluk yang tak dapat diidentifikasi.\nTidak menyerupai apa pun dari Bumi.' },
        effect: {},
        choices: [
          { ko: '천천히 뒷걸음질치며 눈을 마주치지 않는다', en: 'Slowly back away without meeting its eyes', id: 'Mundur perlahan tanpa menatap matanya',
            effect: { hunger: -10 } },
          { ko: '[렌치] 렌치를 무기 삼아 대비한다', en: '[Wrench] Ready the wrench as a weapon', id: '[Kunci Inggris] Siapkan kunci inggris sebagai senjata',
            requires: 'wrench', effect: { health: -5 }, pi: 12 },
          { ko: '화물 뒤로 몸을 숨긴다', en: 'Hide behind the cargo', id: 'Bersembunyi di balik kargo',
            effect: {}, pi: 5 },
        ],
      },
      {
        ko: { title: '벽을 타고 움직이는 소리', text: '벽과 배관을 타고 뭔가 빠르게 움직이는 소리가 들린다.\n방향을 종잡을 수가 없다.' },
        en: { title: 'Something Moving Through the Walls', text: 'You hear something moving fast through the walls and pipes.\nYou can\'t pin down its direction.' },
        id: { title: 'Sesuatu Bergerak di Dinding', text: 'Kau mendengar sesuatu bergerak cepat melalui dinding dan pipa.\nKau tak bisa menentukan arahnya.' },
        effect: { health: -5 },
        choices: [
          { ko: '[다용도 공구] 배관 밸브를 잠가 움직임을 막는다', en: '[Multitool] Seal the pipe valves to block its movement', id: '[Multitool] Tutup katup pipa untuk menghentikan pergerakannya',
            requires: 'multitool', effect: {}, pi: 12 },
          { ko: '조용한 곳을 찾아 숨죽인다', en: 'Find a quiet spot and hold your breath', id: 'Cari tempat sunyi dan tahan napas',
            effect: { hunger: -10 } },
          { ko: '무작정 반대 방향으로 뛴다', en: 'Just run in the opposite direction', id: 'Berlari ke arah berlawanan',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '알 수 없는 포자', text: '공기 중에 이상한 포자 같은 것이 떠다니기 시작한다.\n닿으면 무슨 일이 생길지 알 수 없다.' },
        en: { title: 'Strange Spores', text: 'Strange spore-like particles begin drifting through the air.\nWhat happens if they touch you is unknown.' },
        id: { title: 'Spora Aneh', text: 'Partikel mirip spora aneh mulai melayang di udara.\nTak diketahui apa yang terjadi jika tersentuh.' },
        effect: {},
        choices: [
          { ko: '[산소통] 산소통 마스크로 호흡을 차단한다', en: '[Oxygen Tank] Block your breathing with the oxygen mask', id: '[Tabung Oksigen] Halangi pernapasan dengan masker oksigen',
            requires: 'oxygen_tank', effect: {}, pi: 12 },
          { ko: '숨을 참고 빠르게 벗어난다', en: 'Hold your breath and get out quickly', id: 'Tahan napas dan cepat menjauh',
            effect: { health: -10 } },
          { ko: '옷으로 코와 입을 막고 지나간다', en: 'Cover nose and mouth with cloth and pass through', id: 'Tutup hidung dan mulut dengan kain lalu lewat',
            effect: { hunger: -10 } },
        ],
      },
    ],

    // ── Stage 3: 동력실 ──────────────────────────────
    [
      {
        ko: { title: '불안정한 원자로', text: '동력실의 원자로 게이지가 위험 수치를 가리키고 있다.\n방치하면 곧 폭발할 것 같다.' },
        en: { title: 'The Unstable Reactor', text: 'The reactor gauge in the power room reads danger levels.\nLeft unchecked, it may explode soon.' },
        id: { title: 'Reaktor Tidak Stabil', text: 'Alat pengukur reaktor di ruang daya menunjukkan level berbahaya.\nJika dibiarkan, mungkin akan segera meledak.' },
        effect: {},
        choices: [
          { ko: '[렌치] 렌치로 밸브를 조여 안정시킨다', en: '[Wrench] Tighten the valve with the wrench to stabilize it', id: '[Kunci Inggris] Kencangkan katup dengan kunci inggris untuk menstabilkan',
            requires: 'wrench', effect: {}, pi: 15 },
          { ko: '수동으로 냉각수를 방출한다', en: 'Manually vent the coolant', id: 'Buang cairan pendingin secara manual',
            effect: { hunger: -10 }, pi: 10 },
          { ko: '원자로 구역을 봉쇄하고 도망친다', en: 'Seal off the reactor section and flee', id: 'Segel bagian reaktor dan kabur',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '끊어진 배선', text: '동력을 나눠주는 주 배선이 끊어져 있다.\n연결하지 않으면 남은 구역들이 모두 정전될 것이다.' },
        en: { title: 'The Severed Wiring', text: 'The main wiring distributing power is severed.\nWithout reconnecting it, the remaining sections will lose power.' },
        id: { title: 'Kabel yang Terputus', text: 'Kabel utama pendistribusi daya terputus.\nTanpa menyambungnya, bagian yang tersisa akan kehilangan daya.' },
        effect: {},
        choices: [
          { ko: '[다용도 공구] 공구로 배선을 정밀하게 잇는다', en: '[Multitool] Precisely splice the wiring with the multitool', id: '[Multitool] Sambungkan kabel dengan presisi menggunakan multitool',
            requires: 'multitool', effect: {}, pi: 15 },
          { ko: '임시방편으로 손을 봐서 이어붙인다', en: 'Patch it together as a temporary fix', id: 'Sambung sementara sebagai perbaikan darurat',
            effect: { health: -10 }, pi: 10 },
          { ko: '위험해서 손대지 않고 넘어간다', en: 'Too risky, leave it alone and move on', id: 'Terlalu berisiko, biarkan dan lanjut',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '작동하는 로봇 팔', text: '오작동한 정비 로봇 팔이 무작위로 휘둘러지고 있다.\n지나가려면 타이밍을 잘 봐야 한다.' },
        en: { title: 'The Malfunctioning Robot Arm', text: 'A malfunctioning maintenance robot arm swings around randomly.\nYou\'ll need to time it right to pass.' },
        id: { title: 'Lengan Robot yang Rusak', text: 'Lengan robot perawatan yang rusak berayun secara acak.\nKau perlu memperhitungkan waktu yang tepat untuk lewat.' },
        effect: {},
        choices: [
          { ko: '[렌치] 렌치로 로봇 팔을 정지시킨다', en: '[Wrench] Stop the robot arm with the wrench', id: '[Kunci Inggris] Hentikan lengan robot dengan kunci inggris',
            requires: 'wrench', effect: {}, pi: 12 },
          { ko: '타이밍을 재서 재빨리 지나간다', en: 'Time it carefully and dash through', id: 'Perhitungkan waktu dan berlari melewatinya',
            effect: { health: -15 } },
          { ko: '전원 차단 스위치를 찾아본다', en: 'Look for the power cutoff switch', id: 'Cari saklar pemutus daya',
            effect: { hunger: -15 } },
        ],
      },
    ],

    // ── Stage 4: AI 교신 ─────────────────────────────
    [
      {
        ko: { title: '손상된 선내 AI', text: '선내 AI가 지지직거리며 응답한다.\n"...일부 기억 장치가... 손상되었습니다..."' },
        en: { title: 'The Damaged Ship AI', text: 'The ship\'s AI responds with static.\n"...some memory banks... have been damaged..."' },
        id: { title: 'AI Kapal yang Rusak', text: 'AI kapal merespons dengan suara berisik.\n"...beberapa memori... telah rusak..."' },
        effect: {},
        choices: [
          { ko: '[다용도 공구] 공구로 AI 코어를 임시 복구한다', en: '[Multitool] Temporarily repair the AI core with the multitool', id: '[Multitool] Perbaiki sementara inti AI dengan multitool',
            requires: 'multitool', effect: {}, pi: 15 },
          { ko: '남은 기능만이라도 물어본다', en: 'Ask about whatever functions remain', id: 'Tanyakan fungsi apa saja yang masih tersisa',
            effect: { hunger: -10 }, pi: 10 },
          { ko: 'AI를 믿지 못하고 무시한다', en: 'Distrust the AI and ignore it', id: 'Tidak percaya AI dan mengabaikannya',
            effect: {} },
        ],
      },
      {
        ko: { title: '다른 생존자와의 교신', text: '갑자기 통신기에 다른 생존자의 목소리가 잡힌다.\n"거기 누구 있어요?! 저는 엔지니어 구역에 있어요!"' },
        en: { title: 'Contact with Another Survivor', text: 'Suddenly, another survivor\'s voice crackles over the comms.\n"Is anyone there?! I\'m in the engineering section!"' },
        id: { title: 'Kontak dengan Penyintas Lain', text: 'Tiba-tiba, suara penyintas lain terdengar berisik di komunikator.\n"Ada orang di sana?! Aku di bagian teknik!"' },
        effect: {},
        choices: [
          { ko: '위치를 공유하고 합류를 약속한다', en: 'Share your location and promise to meet up', id: 'Bagikan lokasi dan janji akan bertemu', effect: {}, pi: 12 },
          { ko: '상대의 상태부터 자세히 물어본다', en: 'Ask in detail about their condition first', id: 'Tanyakan kondisi mereka secara detail dulu',
            effect: { hunger: -10 }, pi: 10 },
          { ko: '신원이 의심스러워 조용히 통신을 끊는다', en: 'Suspicious of their identity, quietly cut the comms', id: 'Curiga identitasnya, diam-diam putuskan komunikasi',
            effect: {} },
        ],
      },
      {
        ko: { title: '탈출정 좌표', text: 'AI가 마지막 힘을 짜내 탈출정의 좌표를 알려준다.\n"...행운을... 빕니다..."' },
        en: { title: 'Escape Pod Coordinates', text: 'With its last strength, the AI gives you the escape pod\'s coordinates.\n"...good luck..."' },
        id: { title: 'Koordinat Kapsul Pelarian', text: 'Dengan kekuatan terakhirnya, AI memberikan koordinat kapsul pelarian.\n"...semoga beruntung..."' },
        effect: {},
        choices: [
          { ko: '좌표를 새기고 감사 인사를 전한다', en: 'Memorize the coordinates and give thanks', id: 'Ingat koordinatnya dan ucapkan terima kasih', effect: {}, pi: 15 },
          { ko: '[다용도 공구] 공구로 AI 코어를 백업해 챙긴다', en: '[Multitool] Back up the AI core with the multitool', id: '[Multitool] Cadangkan inti AI dengan multitool',
            requires: 'multitool', effect: {}, pi: 15 },
          { ko: '서둘러 좌표를 향해 달려간다', en: 'Hurry off toward the coordinates', id: 'Bergegas menuju koordinat',
            effect: { hunger: -10 } },
        ],
      },
    ],

    // ── Stage 5: 진공 구역 ───────────────────────────
    [
      {
        ko: { title: '뚫린 선체', text: '선체 일부가 완전히 뚫려 우주 공간이 그대로 보인다.\n이 구간을 지나려면 진공에 노출돼야 한다.' },
        en: { title: 'The Breached Hull', text: 'Part of the hull is completely breached, open space visible.\nCrossing this section means exposure to vacuum.' },
        id: { title: 'Lambung yang Bocor', text: 'Sebagian lambung bocor total, ruang angkasa terlihat langsung.\nMenyeberangi bagian ini berarti terpapar vakum.' },
        effect: {},
        choices: [
          { ko: '[산소통] 산소통을 최대로 채우고 건넌다', en: '[Oxygen Tank] Fill the oxygen tank fully and cross', id: '[Tabung Oksigen] Isi penuh tabung oksigen dan menyeberang',
            requires: 'oxygen_tank', effect: {}, pi: 15 },
          { ko: '숨을 참고 최대한 빨리 건넌다', en: 'Hold your breath and cross as fast as possible', id: 'Tahan napas dan menyeberang secepat mungkin',
            effect: { health: -20 } },
          { ko: '우회로가 있는지 다시 확인한다', en: 'Check again for a detour', id: 'Periksa lagi apakah ada jalan memutar',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '떠다니는 잔해', text: '진공 구역에 부서진 장비 파편들이 둥둥 떠다닌다.\n잘못 부딪히면 큰 부상을 입을 수 있다.' },
        en: { title: 'Floating Debris', text: 'Broken equipment fragments float through the vacuum section.\nA bad collision could cause serious injury.' },
        id: { title: 'Puing yang Melayang', text: 'Pecahan peralatan rusak melayang di bagian vakum.\nTabrakan yang buruk bisa menyebabkan cedera serius.' },
        effect: {},
        choices: [
          { ko: '천천히 파편을 피해가며 이동한다', en: 'Move slowly, dodging the debris', id: 'Bergerak perlahan sambil menghindari puing',
            effect: { hunger: -15 } },
          { ko: '[산소통] 산소통 덕에 여유 있게 우회한다', en: '[Oxygen Tank] Take your time thanks to the oxygen tank', id: '[Tabung Oksigen] Berputar dengan tenang berkat tabung oksigen',
            requires: 'oxygen_tank', effect: {}, pi: 12 },
          { ko: '빠르게 돌파하려다 파편에 부딪힌다', en: 'Try to rush through and get hit by debris', id: 'Coba menerobos cepat dan tertabrak puing',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '고장난 산소 재생기', text: '진공 구역 끝의 산소 재생기가 완전히 고장 나 있다.\n다음 구역으로 가려면 이걸 지나야 한다.' },
        en: { title: 'The Broken Oxygen Recycler', text: 'The oxygen recycler at the end of the vacuum section is completely broken.\nYou must pass it to reach the next section.' },
        id: { title: 'Daur Ulang Oksigen yang Rusak', text: 'Daur ulang oksigen di ujung bagian vakum rusak total.\nKau harus melewatinya untuk mencapai bagian berikutnya.' },
        effect: { health: -5 },
        choices: [
          { ko: '[렌치] 렌치로 재생기를 응급 수리한다', en: '[Wrench] Emergency-repair the recycler with the wrench', id: '[Kunci Inggris] Perbaiki darurat daur ulang dengan kunci inggris',
            requires: 'wrench', effect: {}, pi: 15 },
          { ko: '고치는 걸 포기하고 빠르게 지나간다', en: 'Give up fixing it and pass through quickly', id: 'Menyerah memperbaiki dan lewat dengan cepat',
            effect: { health: -10 } },
          { ko: '남은 산소를 아끼며 천천히 나아간다', en: 'Conserve remaining oxygen and move slowly', id: 'Menghemat oksigen tersisa dan bergerak perlahan',
            effect: { hunger: -15 } },
        ],
      },
    ],

    // ── Stage 6: 감염된 크루원 ───────────────────────
    [
      {
        ko: { title: '변해버린 동료', text: '먼저 마주쳤던 동료 승무원이 이상하게 변해 있다.\n눈빛이 낯설고, 움직임이 부자연스럽다.' },
        en: { title: 'The Changed Crewmate', text: 'The crewmate you met earlier has changed strangely.\nTheir eyes are unfamiliar, movements unnatural.' },
        id: { title: 'Rekan Kru yang Berubah', text: 'Rekan kru yang kau temui sebelumnya telah berubah aneh.\nMatanya asing, gerakannya tidak wajar.' },
        effect: {},
        choices: [
          { ko: '조심스레 말을 걸어본다', en: 'Cautiously try talking to them', id: 'Hati-hati coba ajak bicara', effect: { health: -10 }, pi: 15 },
          { ko: '[산소통] 격리 구역으로 유인해 봉쇄한다', en: '[Oxygen Tank] Lure them to a quarantine section and seal it', id: '[Tabung Oksigen] Pancing ke zona karantina dan segel',
            requires: 'oxygen_tank', effect: {}, pi: 15 },
          { ko: '눈물을 삼키며 조용히 물러난다', en: 'Swallow your tears and quietly step back', id: 'Menahan air mata dan mundur diam-diam',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '마지막 이성의 순간', text: '감염된 동료가 한순간 제정신이 든 듯 말한다.\n"...날 두고 가... 어서..."' },
        en: { title: 'A Final Moment of Clarity', text: 'The infected crewmate seems to regain their senses for a moment.\n"...leave me... go..."' },
        id: { title: 'Momen Terakhir Kesadaran', text: 'Rekan yang terinfeksi tampak sadar sesaat.\n"...tinggalkan aku... pergi..."' },
        effect: {},
        choices: [
          { ko: '마지막 인사를 하고 떠난다', en: 'Say a final farewell and leave', id: 'Ucapkan salam perpisahan terakhir dan pergi', effect: { hunger: -5 }, pi: 15 },
          { ko: '[다용도 공구] 공구로 치료 방법을 찾아본다', en: '[Multitool] Search for a cure with the multitool', id: '[Multitool] Cari cara pengobatan dengan multitool',
            requires: 'multitool', effect: { health: -5 }, pi: 18 },
          { ko: '차마 떠나지 못하고 곁에 머문다', en: 'Unable to leave, stay by their side', id: 'Tak sanggup pergi, tetap di sisinya',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '감염된 무리', text: '변해버린 승무원 여럿이 통로를 가로막고 있다.\n하나같이 초점 없는 눈으로 이쪽을 향한다.' },
        en: { title: 'A Group of the Infected', text: 'Several changed crew members block the corridor.\nAll of them turn unfocused eyes your way.' },
        id: { title: 'Kelompok yang Terinfeksi', text: 'Beberapa kru yang berubah menghalangi koridor.\nSemua mengarahkan mata kosong ke arahmu.' },
        effect: {},
        choices: [
          { ko: '[다용도 공구] 문 시스템을 해킹해 가둔다', en: '[Multitool] Hack the door system to trap them', id: '[Multitool] Retas sistem pintu untuk menjebak mereka',
            requires: 'multitool', effect: {}, pi: 18 },
          { ko: '조용히 환기구로 우회한다', en: 'Quietly go around through the vents', id: 'Diam-diam memutar lewat ventilasi',
            effect: { hunger: -15 } },
          { ko: '[렌치] 렌치를 휘두르며 돌파한다', en: '[Wrench] Swing the wrench and break through', id: '[Kunci Inggris] Ayunkan kunci inggris dan terobos',
            requires: 'wrench', effect: { health: -15 }, pi: 15 },
        ],
      },
    ],

    // ── Stage 7: 탈출정 앞 ───────────────────────────
    [
      {
        ko: { title: '탈출정 격납고', text: '드디어 탈출정 격납고에 도착했다.\n하지만 격납고 문이 절반쯤 파손되어 열리지 않는다.' },
        en: { title: 'The Escape Pod Bay', text: 'You finally reach the escape pod bay.\nBut the bay door is half-damaged and won\'t open.' },
        id: { title: 'Hanggar Kapsul Pelarian', text: 'Kau akhirnya tiba di hanggar kapsul pelarian.\nTapi pintu hanggar setengah rusak dan tidak mau terbuka.' },
        effect: {},
        choices: [
          { ko: '[다용도 공구] 공구로 문을 강제로 연다', en: '[Multitool] Force the door open with the multitool', id: '[Multitool] Buka paksa pintu dengan multitool',
            requires: 'multitool', effect: {}, pi: 18 },
          { ko: '[렌치] 렌치로 힘겹게 문을 비틀어 연다', en: '[Wrench] Struggle to pry the door open with the wrench', id: '[Kunci Inggris] Berjuang mencongkel pintu dengan kunci inggris',
            requires: 'wrench', effect: { health: -10 }, pi: 15 },
          { ko: '틈새를 억지로 벌려 몸을 밀어 넣는다', en: 'Force the gap wider and squeeze through', id: 'Memaksa celah lebih lebar dan menyelinap masuk',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '단 하나의 탈출정', text: '남은 탈출정은 단 하나뿐이다.\n통신기 너머로 다른 생존자의 다급한 목소리가 들린다.' },
        en: { title: 'The One Remaining Pod', text: 'Only one escape pod remains.\nOver the comms, another survivor\'s urgent voice comes through.' },
        id: { title: 'Satu Kapsul yang Tersisa', text: 'Hanya tersisa satu kapsul pelarian.\nMelalui komunikator, terdengar suara mendesak penyintas lain.' },
        effect: {},
        choices: [
          { ko: '다른 생존자를 기다렸다가 함께 탄다', en: 'Wait for the other survivor and board together', id: 'Tunggu penyintas lain dan naik bersama', effect: { hunger: -15 }, pi: 20 },
          { ko: '좌표만 알려주고 먼저 출발한다', en: 'Just share the coordinates and launch first', id: 'Beri tahu koordinat saja dan berangkat duluan',
            effect: {}, pi: 12 },
          { ko: '탈출정을 나눠 쓸 방법을 찾는다', en: 'Look for a way to share the pod', id: 'Cari cara untuk berbagi kapsul',
            effect: { health: -5 }, pi: 15 },
        ],
      },
      {
        ko: { title: '마지막 경보', text: '선내 방송이 마지막 경고를 알린다.\n"선체 완전 붕괴까지... 남은 시간이 얼마 없습니다."' },
        en: { title: 'The Final Alarm', text: 'A ship-wide broadcast issues one last warning.\n"Time until total hull collapse... is running very short."' },
        id: { title: 'Alarm Terakhir', text: 'Siaran seluruh kapal mengeluarkan peringatan terakhir.\n"Waktu hingga keruntuhan total lambung kapal... hampir habis."' },
        effect: { health: -5, hunger: -10 },
        choices: [
          { ko: '남은 힘을 다해 탈출정으로 뛰어든다', en: 'Use all remaining strength to dive for the pod', id: 'Gunakan sisa tenaga untuk melompat ke kapsul', effect: {}, pi: 18 },
          { ko: '[산소통] 산소통 덕에 침착하게 탑승 절차를 밟는다', en: '[Oxygen Tank] Calmly follow boarding procedure thanks to the oxygen tank', id: '[Tabung Oksigen] Tenang mengikuti prosedur naik berkat tabung oksigen',
            requires: 'oxygen_tank', effect: {}, pi: 15 },
          { ko: '마지막으로 선내를 한 번 둘러본다', en: 'Take one last look around the ship', id: 'Melihat sekeliling kapal untuk terakhir kalinya',
            effect: { health: -10 }, pi: 10 },
        ],
      },
    ],

    // ── Stage 8: 엔딩 ────────────────────────────────
    [
      {
        ko: { title: '탈출 성공', text: '탈출정이 표류 우주선을 벗어나 궤도로 진입했다.\n뒤로 멀어지는 선체가 서서히 어둠 속으로 사라진다.' },
        en: { title: 'Escaped', text: 'The escape pod clears the derelict ship and enters orbit.\nThe hull grows smaller behind you, fading into darkness.' },
        id: { title: 'Berhasil Kabur', text: 'Kapsul pelarian meninggalkan kapal terlantar dan memasuki orbit.\nLambung kapal mengecil di belakang, menghilang dalam kegelapan.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '차가운 우주 속에서, 살아남았다는 온기만이 유일한 위안이었다.',
          en: 'In the cold of space, the warmth of surviving was the only comfort.',
          id: 'Di dinginnya angkasa, kehangatan bertahan hidup adalah satu-satunya penghiburan.',
        },
      },
      {
        ko: { title: '구조 신호 응답', text: '탈출정의 구조 신호에 근처를 지나던 순찰선이 응답했다.\n"확인. 구조하러 갑니다."' },
        en: { title: 'Rescue Signal Answered', text: 'A passing patrol ship responds to your escape pod\'s distress signal.\n"Confirmed. Coming to rescue you."' },
        id: { title: 'Sinyal Penyelamatan Dijawab', text: 'Kapal patroli yang lewat menjawab sinyal darurat kapsul pelarianmu.\n"Dikonfirmasi. Kami datang untuk menyelamatkanmu."' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '망망대해 같은 우주에서, 누군가 들어준다는 것만으로 충분했다.',
          en: 'In an ocean of stars, simply being heard by someone was enough.',
          id: 'Di lautan bintang, sekadar didengar oleh seseorang saja sudah cukup.',
        },
      },
      {
        ko: { title: '홀로 남은 항해', text: '탈출정 안에는 아무도 없다. 오직 당신 혼자뿐이다.\n하지만 저 멀리 낯익은 별자리가 보인다 — 고향이다.' },
        en: { title: 'The Lonely Voyage', text: 'The escape pod is empty except for you.\nBut in the distance, a familiar constellation appears — home.' },
        id: { title: 'Perjalanan yang Sepi', text: 'Kapsul pelarian kosong kecuali dirimu.\nTapi di kejauhan, terlihat konstelasi yang familiar — rumah.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '혼자 남았지만, 살아서 돌아갈 곳이 있다는 것만으로 충분했다.',
          en: 'Alone, but simply having somewhere alive to return to was enough.',
          id: 'Sendirian, tapi sekadar memiliki tempat untuk kembali hidup-hidup saja sudah cukup.',
        },
      },
    ],
  ],
};
