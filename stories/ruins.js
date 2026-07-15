// 고대 유적 탐사대 — 스테이지별 후보 장면 풀. dungeon.js와 동일한 구조.
export const RUINS_POOL = {
  id: 'ruins',
  items: {
    lantern: {
      ko: { label: '랜턴',    desc: '어두운 유적 내부를 밝힘' },
      en: { label: 'Lantern', desc: 'Lights the dark interior of the ruins' },
      id: { label: 'Lentera', desc: 'Menerangi bagian dalam reruntuhan yang gelap' },
    },
    pickaxe: {
      ko: { label: '곡괭이',  desc: '막힌 돌벽과 잔해를 부숨' },
      en: { label: 'Pickaxe', desc: 'Breaks through blocked stone walls and rubble' },
      id: { label: 'Beliung', desc: 'Menghancurkan dinding batu dan puing yang menghalangi' },
    },
    compass: {
      ko: { label: '나침반',  desc: '길을 잃지 않고 함정을 피함' },
      en: { label: 'Compass', desc: 'Avoids getting lost and evades traps' },
      id: { label: 'Kompas',  desc: 'Menghindari tersesat dan jebakan' },
    },
  },

  stages: [

    // ── Stage 0: 폐허 진입 ───────────────────────────
    [
      {
        ko: { title: '모래에 묻힌 입구', text: '몇 세대 동안 아무도 찾지 못한 유적의 입구를 마침내 발견했다.\n모래바람이 거세게 불며 시야를 가린다.' },
        en: { title: 'The Sand-Buried Entrance', text: 'You finally find the entrance to ruins no one has found in generations.\nA fierce sandstorm blurs your view.' },
        id: { title: 'Pintu Masuk Terkubur Pasir', text: 'Kau akhirnya menemukan pintu masuk reruntuhan yang tak ditemukan siapa pun selama beberapa generasi.\nBadai pasir yang ganas mengaburkan pandangan.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[랜턴] 랜턴을 밝히고 안으로 들어간다', en: '[Lantern] Light the lantern and go inside', id: '[Lentera] Nyalakan lentera dan masuk ke dalam',
            requires: 'lantern', effect: {}, pi: 5 },
          { ko: '모래바람이 잦아들 때까지 기다린다', en: 'Wait for the sandstorm to die down', id: 'Menunggu badai pasir mereda',
            effect: { hunger: -10 } },
          { ko: '바람을 뚫고 무작정 들어간다', en: 'Push through the wind blindly', id: 'Menerobos angin tanpa berpikir panjang',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '무너진 첫 관문', text: '입구의 첫 관문이 절반쯤 무너져 있다.\n틈 사이로 오래된 공기가 새어 나온다.' },
        en: { title: 'The Collapsed First Gate', text: 'The first gate at the entrance is half-collapsed.\nAncient air seeps through the gap.' },
        id: { title: 'Gerbang Pertama yang Runtuh', text: 'Gerbang pertama di pintu masuk setengah runtuh.\nUdara kuno bocor dari celahnya.' },
        effect: {},
        choices: [
          { ko: '[곡괭이] 곡괭이로 잔해를 치운다', en: '[Pickaxe] Clear the rubble with the pickaxe', id: '[Beliung] Bersihkan puing dengan beliung',
            requires: 'pickaxe', effect: {}, pi: 8 },
          { ko: '좁은 틈으로 몸을 밀어 넣는다', en: 'Squeeze your body through the narrow gap', id: 'Memaksakan tubuh lewat celah sempit',
            effect: { health: -10 } },
          { ko: '다른 입구가 있는지 주변을 살핀다', en: 'Look around for another entrance', id: 'Mencari pintu masuk lain di sekitar',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '고대의 경고문', text: '입구 벽에 고대 문자로 새겨진 경고문이 있다.\n"욕심을 가진 자는 돌아가지 못하리라."' },
        en: { title: 'The Ancient Warning', text: 'A warning is carved in ancient script on the entrance wall.\n"Those who covet shall not return."' },
        id: { title: 'Peringatan Kuno', text: 'Sebuah peringatan terukir dalam aksara kuno di dinding pintu masuk.\n"Yang tamak takkan kembali."' },
        effect: {},
        choices: [
          { ko: '[나침반] 나침반으로 안전한 경로부터 확인한다', en: '[Compass] Check the safe route with the compass first', id: '[Kompas] Periksa jalur aman dengan kompas dulu',
            requires: 'compass', effect: {}, pi: 8 },
          { ko: '경고를 마음에 새기고 조심스레 들어간다', en: 'Take the warning to heart and enter carefully', id: 'Ingat peringatan itu dan masuk hati-hati',
            effect: { hunger: -5 }, pi: 5 },
          { ko: '미신이라 여기고 무시한다', en: 'Dismiss it as superstition', id: 'Anggap itu takhayul dan abaikan',
            effect: { health: -5 } },
        ],
      },
    ],

    // ── Stage 1: 모래 함정 ───────────────────────────
    [
      {
        ko: { title: '유사(流沙)의 방', text: '바닥 전체가 미세하게 움직이고 있다.\n한 발 잘못 디디면 순식간에 빨려 들어갈 것 같다.' },
        en: { title: 'The Quicksand Room', text: 'The entire floor shifts subtly.\nOne wrong step and you\'d be swallowed instantly.' },
        id: { title: 'Ruang Pasir Hisap', text: 'Seluruh lantai bergeser secara halus.\nSalah satu langkah saja bisa membuatmu tertelan seketika.' },
        effect: {},
        choices: [
          { ko: '[나침반] 나침반이 가리키는 안전한 길로 간다', en: '[Compass] Follow the safe path the compass points to', id: '[Kompas] Ikuti jalur aman yang ditunjukkan kompas',
            requires: 'compass', effect: {}, pi: 8 },
          { ko: '천천히 무게를 분산시키며 건넌다', en: 'Cross slowly, distributing your weight', id: 'Menyeberang perlahan sambil menyebar berat tubuh',
            effect: { hunger: -10 } },
          { ko: '빠르게 뛰어서 건넌다', en: 'Sprint across quickly', id: 'Berlari cepat menyeberang',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '무너지는 천장', text: '위쪽 천장 돌들이 조금씩 떨어지기 시작한다.\n서두르지 않으면 완전히 막힐 것 같다.' },
        en: { title: 'The Falling Ceiling', text: 'Stones from the ceiling above begin falling little by little.\nWithout haste, the path may be completely blocked.' },
        id: { title: 'Langit-langit yang Runtuh', text: 'Batu-batu dari langit-langit mulai berjatuhan sedikit demi sedikit.\nTanpa buru-buru, jalan bisa tertutup total.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[곡괭이] 곡괭이로 무너진 잔해를 뚫는다', en: '[Pickaxe] Break through the fallen rubble with the pickaxe', id: '[Beliung] Tembus puing yang runtuh dengan beliung',
            requires: 'pickaxe', effect: {}, pi: 10 },
          { ko: '틈이 남은 곳을 재빨리 찾아 지나간다', en: 'Quickly find a remaining gap and pass through', id: 'Cepat cari celah tersisa dan lewat',
            effect: { health: -15 } },
          { ko: '돌더미가 안정될 때까지 기다린다', en: 'Wait for the rubble to settle', id: 'Menunggu puing stabil',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '숨겨진 압력판', text: '바닥에 미세하게 다른 색의 돌판이 깔려 있다.\n밟으면 뭔가 작동할 것 같은 불길한 느낌이다.' },
        en: { title: 'The Hidden Pressure Plate', text: 'Subtly different colored stone tiles line the floor.\nStepping on one feels like it would trigger something ominous.' },
        id: { title: 'Pelat Tekanan Tersembunyi', text: 'Ubin batu berwarna sedikit berbeda tersusun di lantai.\nMenginjaknya terasa akan memicu sesuatu yang mengerikan.' },
        effect: {},
        choices: [
          { ko: '[랜턴] 랜턴으로 압력판을 미리 확인한다', en: '[Lantern] Spot the pressure plates ahead of time with the lantern', id: '[Lentera] Kenali pelat tekanan lebih dulu dengan lentera',
            requires: 'lantern', effect: {}, pi: 10 },
          { ko: '판을 하나하나 조심스레 피해 걷는다', en: 'Carefully step around each plate', id: 'Melangkah hati-hati menghindari setiap pelat',
            effect: { hunger: -15 } },
          { ko: '위험을 감수하고 그냥 걷는다', en: 'Risk it and just walk normally', id: 'Nekat dan berjalan seperti biasa',
            effect: { health: -15 } },
        ],
      },
    ],

    // ── Stage 2: 벽화의 방 ───────────────────────────
    [
      {
        ko: { title: '고대 벽화', text: '벽 가득 고대인들의 생활을 그린 벽화가 펼쳐져 있다.\n한쪽 벽화만 유독 훼손되어 있다.' },
        en: { title: 'The Ancient Mural', text: 'The walls are covered in murals depicting ancient life.\nOne section is oddly damaged.' },
        id: { title: 'Mural Kuno', text: 'Dinding dipenuhi mural yang menggambarkan kehidupan kuno.\nSatu bagian rusak secara aneh.' },
        effect: {},
        choices: [
          { ko: '훼손된 부분을 자세히 조사한다', en: 'Examine the damaged section closely', id: 'Periksa bagian yang rusak dengan teliti',
            effect: { hunger: -5 }, pi: 10 },
          { ko: '[랜턴] 랜턴으로 벽화 전체를 밝혀 살핀다', en: '[Lantern] Light up the whole mural with the lantern', id: '[Lentera] Terangi seluruh mural dengan lentera',
            requires: 'lantern', effect: {}, pi: 10 },
          { ko: '벽화는 무시하고 다음 방으로 향한다', en: 'Ignore the mural and head to the next room', id: 'Abaikan mural dan menuju ruangan berikutnya',
            effect: {} },
        ],
      },
      {
        ko: { title: '수수께끼의 문장', text: '벽화 아래 고대어 문장이 새겨져 있다.\n"별이 가리키는 곳에 답이 있다."' },
        en: { title: 'The Riddling Inscription', text: 'An ancient inscription is carved beneath the mural.\n"The answer lies where the stars point."' },
        id: { title: 'Inskripsi Teka-teki', text: 'Sebuah inskripsi kuno terukir di bawah mural.\n"Jawabannya ada di tempat yang ditunjuk bintang."' },
        effect: {},
        choices: [
          { ko: '[나침반] 나침반의 별자리 눈금을 맞춰본다', en: '[Compass] Align the compass\'s star markings', id: '[Kompas] Sejajarkan penanda bintang di kompas',
            requires: 'compass', effect: {}, pi: 12 },
          { ko: '천장의 별자리 그림을 찾아본다', en: 'Search the ceiling for a star map', id: 'Cari peta bintang di langit-langit',
            effect: { hunger: -10 }, pi: 8 },
          { ko: '대충 짐작으로 다음 길을 고른다', en: 'Just guess the next path', id: 'Menebak jalan berikutnya asal-asalan',
            effect: { health: -10 } },
        ],
      },
      {
        ko: { title: '숨겨진 벽 뒤 공간', text: '벽화 하나가 유독 이상하게 튀어나와 있다.\n뒤에 빈 공간이 있는 것 같다.' },
        en: { title: 'The Hidden Space Behind the Wall', text: 'One section of the mural sticks out oddly.\nThere seems to be an empty space behind it.' },
        id: { title: 'Ruang Tersembunyi di Balik Dinding', text: 'Satu bagian mural menonjol secara aneh.\nSepertinya ada ruang kosong di baliknya.' },
        effect: {},
        choices: [
          { ko: '[곡괭이] 곡괭이로 벽을 두드려 확인한다', en: '[Pickaxe] Tap the wall with the pickaxe to check', id: '[Beliung] Ketuk dinding dengan beliung untuk memeriksa',
            requires: 'pickaxe', effect: {}, pi: 12 },
          { ko: '손으로 벽을 눌러보며 찾는다', en: 'Search by pressing the wall with your hands', id: 'Cari dengan menekan dinding dengan tangan',
            effect: { health: -10 }, pi: 8 },
          { ko: '괜한 함정일까 봐 그냥 지나간다', en: 'Fearing a trap, just pass by', id: 'Takut jebakan, lewati saja',
            effect: {} },
        ],
      },
    ],

    // ── Stage 3: 지하 수로 ───────────────────────────
    [
      {
        ko: { title: '지하 수로', text: '고대인들이 만든 관개 수로가 지하로 이어진다.\n물살이 생각보다 거세다.' },
        en: { title: 'The Underground Canal', text: 'An ancient irrigation canal leads underground.\nThe current is stronger than expected.' },
        id: { title: 'Kanal Bawah Tanah', text: 'Kanal irigasi kuno mengarah ke bawah tanah.\nArusnya lebih deras dari dugaan.' },
        effect: {},
        choices: [
          { ko: '[나침반] 나침반으로 물살이 약한 쪽을 찾는다', en: '[Compass] Use the compass to find where the current is weaker', id: '[Kompas] Gunakan kompas untuk cari arus yang lebih lemah',
            requires: 'compass', effect: {}, pi: 10 },
          { ko: '물살을 헤치고 건넌다', en: 'Push through the current and cross', id: 'Menerobos arus dan menyeberang',
            effect: { health: -10, hunger: -10 } },
          { ko: '수로를 따라 우회로를 찾는다', en: 'Follow the canal to find a detour', id: 'Ikuti kanal untuk cari jalan memutar',
            effect: { hunger: -15 } },
        ],
      },
      {
        ko: { title: '막힌 수문', text: '오래된 수문이 녹슬어 완전히 막혀 있다.\n물이 점점 차오르고 있다.' },
        en: { title: 'The Blocked Sluice Gate', text: 'An old sluice gate is completely blocked with rust.\nWater is slowly rising.' },
        id: { title: 'Pintu Air yang Tersumbat', text: 'Pintu air tua tersumbat karat sepenuhnya.\nAir perlahan naik.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[곡괭이] 곡괭이로 녹슨 수문을 부순다', en: '[Pickaxe] Break the rusted gate with the pickaxe', id: '[Beliung] Hancurkan pintu berkarat dengan beliung',
            requires: 'pickaxe', effect: {}, pi: 12 },
          { ko: '차오르는 물을 피해 높은 곳으로 대피한다', en: 'Retreat to higher ground away from the rising water', id: 'Mengungsi ke tempat lebih tinggi menghindari air naik',
            effect: { hunger: -10 } },
          { ko: '수문 틈으로 억지로 몸을 밀어 넣는다', en: 'Force your body through the gate\'s gap', id: 'Memaksakan tubuh lewat celah pintu air',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '수로 속 유물', text: '흙탕물 속에서 반짝이는 무언가가 보인다.\n건지려면 물속으로 들어가야 한다.' },
        en: { title: 'A Relic in the Canal', text: 'Something glimmers in the murky water.\nRetrieving it means going into the water.' },
        id: { title: 'Relik di Kanal', text: 'Sesuatu berkilau di air keruh.\nUntuk mengambilnya, kau harus masuk ke air.' },
        effect: {},
        choices: [
          { ko: '물속으로 들어가 유물을 건진다', en: 'Go into the water to retrieve the relic', id: 'Masuk ke air untuk mengambil relik', effect: { health: -10 }, pi: 15 },
          { ko: '[곡괭이] 곡괭이로 끌어당겨 건진다', en: '[Pickaxe] Use the pickaxe to pull it out', id: '[Beliung] Gunakan beliung untuk menariknya keluar',
            requires: 'pickaxe', effect: {}, pi: 15 },
          { ko: '위험하니 포기하고 지나간다', en: 'Too risky, give up and move on', id: 'Terlalu berisiko, menyerah dan lanjut',
            effect: {} },
        ],
      },
    ],

    // ── Stage 4: 유목민 안내인 ───────────────────────
    [
      {
        ko: { title: '유적 속 유목민', text: '뜻밖에도 유적 안쪽에서 살고 있는 유목민 노인을 만났다.\n"이곳을 오래 지켜봐 온 사람이오."' },
        en: { title: 'The Nomad in the Ruins', text: 'Unexpectedly, you meet an elderly nomad living deep in the ruins.\n"I\'ve watched over this place for a long time."' },
        id: { title: 'Nomaden di Reruntuhan', text: 'Tak disangka, kau bertemu seorang nomaden tua yang tinggal jauh di dalam reruntuhan.\n"Aku sudah lama menjaga tempat ini."' },
        effect: {},
        choices: [
          { ko: '정중히 인사하고 조언을 구한다', en: 'Greet them politely and ask for advice', id: 'Sapa dengan sopan dan minta nasihat', effect: {}, pi: 10 },
          { ko: '식량을 나누며 이야기를 듣는다', en: 'Share food while listening to their story', id: 'Berbagi makanan sambil dengar ceritanya',
            effect: { hunger: -10 }, pi: 12 },
          { ko: '경계하며 거리를 둔다', en: 'Stay wary and keep your distance', id: 'Tetap waspada dan menjaga jarak',
            effect: {} },
        ],
      },
      {
        ko: { title: '지도 조각의 거래', text: '유목민이 낡은 지도 조각을 보여준다.\n"이게 필요하다면, 대가가 있어야지."' },
        en: { title: 'Trading for a Map Fragment', text: 'The nomad shows you a worn map fragment.\n"If you need this, there must be something in return."' },
        id: { title: 'Menukar Potongan Peta', text: 'Sang nomaden menunjukkan potongan peta usang.\n"Jika kau butuh ini, harus ada imbalannya."' },
        effect: {},
        choices: [
          { ko: '지도 조각을 산다 (8π)', en: 'Buy the map fragment (8π)', id: 'Beli potongan peta itu (8π)', pi: -8, effect: {} },
          { ko: '[나침반] 자신의 나침반과 교환을 제안한다', en: '[Compass] Offer to trade your compass', id: '[Kompas] Tawarkan tukar dengan kompas milikmu',
            requires: 'compass', effect: {}, pi: 5 },
          { ko: '거절하고 스스로 길을 찾기로 한다', en: 'Decline and decide to find the way yourself', id: 'Tolak dan putuskan mencari jalan sendiri',
            effect: { hunger: -10 } },
        ],
      },
      {
        ko: { title: '유목민의 경고', text: '유목민이 근심스러운 얼굴로 경고한다.\n"성물의 방에 들어가려는 자는 대개 돌아오지 못했소."' },
        en: { title: 'The Nomad\'s Warning', text: 'The nomad warns you with a worried face.\n"Those who sought the relic chamber rarely returned."' },
        id: { title: 'Peringatan Sang Nomaden', text: 'Sang nomaden memperingatkanmu dengan wajah cemas.\n"Mereka yang mencari ruang relik jarang kembali."' },
        effect: {},
        choices: [
          { ko: '경고를 새겨듣고 더 신중해지기로 한다', en: 'Heed the warning and resolve to be more careful', id: 'Dengarkan peringatan dan putuskan lebih hati-hati',
            effect: {}, pi: 10 },
          { ko: '자세한 이유를 캐묻는다', en: 'Press for more details on why', id: 'Menanyakan alasan lebih detail',
            effect: { hunger: -10 }, pi: 12 },
          { ko: '두려움 없이 그냥 나아가겠다고 답한다', en: 'Answer that you\'ll press on without fear', id: 'Menjawab akan tetap maju tanpa rasa takut',
            effect: { health: -5 } },
        ],
      },
    ],

    // ── Stage 5: 저주받은 방 ─────────────────────────
    [
      {
        ko: { title: '저주받은 석상들', text: '방 안에 늘어선 석상들의 눈이 붉게 빛난다.\n공기가 차갑고 무겁게 가라앉아 있다.' },
        en: { title: 'The Cursed Statues', text: 'The eyes of the statues lining the room glow red.\nThe air feels cold and heavy.' },
        id: { title: 'Patung-patung Terkutuk', text: 'Mata patung-patung yang berjajar di ruangan bersinar merah.\nUdaranya terasa dingin dan berat.' },
        effect: { health: -5 },
        choices: [
          { ko: '[랜턴] 랜턴 빛으로 저주의 근원을 찾는다', en: '[Lantern] Find the source of the curse with the lantern\'s light', id: '[Lentera] Cari sumber kutukan dengan cahaya lentera',
            requires: 'lantern', effect: {}, pi: 12 },
          { ko: '눈을 마주치지 않고 조용히 지나간다', en: 'Pass quietly without meeting their eyes', id: 'Lewat diam-diam tanpa menatap mata mereka',
            effect: { hunger: -10 } },
          { ko: '[곡괭이] 가장 가까운 석상을 부순다', en: '[Pickaxe] Smash the nearest statue', id: '[Beliung] Hancurkan patung terdekat',
            requires: 'pickaxe', effect: { health: -10 }, pi: 15 },
        ],
      },
      {
        ko: { title: '속삭이는 목소리', text: '어디선가 옛 언어로 속삭이는 목소리가 들려온다.\n뭔가를 계속 요구하는 듯한 어조다.' },
        en: { title: 'The Whispering Voice', text: 'A voice whispers in an old language from somewhere.\nIt sounds like it keeps demanding something.' },
        id: { title: 'Suara yang Berbisik', text: 'Sebuah suara berbisik dalam bahasa kuno dari suatu tempat.\nTerdengar seperti terus menuntut sesuatu.' },
        effect: {},
        choices: [
          { ko: '가진 것 중 하나를 바친다', en: 'Offer one of your belongings', id: 'Persembahkan salah satu barangmu', effect: {}, pi: -5 },
          { ko: '목소리를 무시하고 지나간다', en: 'Ignore the voice and move on', id: 'Abaikan suara itu dan lanjut',
            effect: { health: -10 } },
          { ko: '[나침반] 나침반이 흔들리는 방향을 따라간다', en: '[Compass] Follow the direction the compass wavers toward', id: '[Kompas] Ikuti arah kompas yang bergetar',
            requires: 'compass', effect: {}, pi: 12 },
        ],
      },
      {
        ko: { title: '핏빛 제단', text: '방 중앙에 낡은 제단이 있고, 그 위에 작은 유물이 놓여 있다.\n제단 주위 바닥엔 오래된 핏자국이 남아있다.' },
        en: { title: 'The Blood-Stained Altar', text: 'An old altar stands at the center, holding a small relic.\nOld bloodstains remain on the floor around it.' },
        id: { title: 'Altar Bernoda Darah', text: 'Sebuah altar tua berdiri di tengah, menampung relik kecil.\nNoda darah lama masih ada di lantai sekitarnya.' },
        effect: {},
        choices: [
          { ko: '조심스레 유물만 챙기고 물러난다', en: 'Carefully take only the relic and step back', id: 'Hati-hati ambil relik saja dan mundur', effect: { health: -5 }, pi: 15 },
          { ko: '제단에 예를 표하고 유물을 가져간다', en: 'Pay respects to the altar and take the relic', id: 'Beri penghormatan ke altar dan ambil relik',
            effect: {}, pi: 12 },
          { ko: '불길해서 아무것도 건드리지 않는다', en: 'Too ominous, touch nothing', id: 'Terlalu mengerikan, tidak menyentuh apa pun',
            effect: {} },
        ],
      },
    ],

    // ── Stage 6: 고대 수호자 ─────────────────────────
    [
      {
        ko: { title: '움직이는 미라 수호자', text: '깊은 곳을 지키던 미라가 눈을 뜨고 일어선다.\n오래 잠들어 있던 존재의 분노가 느껴진다.' },
        en: { title: 'The Awakening Mummy Guardian', text: 'A mummy guarding the depths opens its eyes and rises.\nYou feel the wrath of something long dormant.' },
        id: { title: 'Mumi Penjaga yang Bangkit', text: 'Mumi penjaga kedalaman membuka mata dan bangkit.\nKau merasakan kemarahan sesuatu yang lama tertidur.' },
        effect: {},
        choices: [
          { ko: '[곡괭이] 붕대를 곡괭이로 끊어 무력화한다', en: '[Pickaxe] Sever its bandages with the pickaxe to disable it', id: '[Beliung] Potong perbannya dengan beliung untuk melumpuhkan',
            requires: 'pickaxe', effect: { health: -10 }, pi: 18 },
          { ko: '경의를 표하며 침입을 사과한다', en: 'Pay respects and apologize for intruding', id: 'Beri hormat dan minta maaf atas gangguan',
            effect: {}, pi: 15 },
          { ko: '전력으로 도망친다', en: 'Flee with everything you have', id: 'Kabur sekuat tenaga',
            effect: { health: -15, hunger: -10 } },
        ],
      },
      {
        ko: { title: '기계 장치 수호자', text: '고대 기계로 만들어진 수호자가 삐걱대며 작동한다.\n관절 부위에 낡은 톱니가 드러나 있다.' },
        en: { title: 'The Mechanical Guardian', text: 'A guardian made of ancient machinery creaks to life.\nOld gears are exposed at its joints.' },
        id: { title: 'Penjaga Mekanis', text: 'Penjaga yang terbuat dari mesin kuno berderit hidup.\nGigi roda tua terlihat di sendi-sendinya.' },
        effect: {},
        choices: [
          { ko: '[곡괭이] 관절의 톱니를 부순다', en: '[Pickaxe] Smash the gears at its joints', id: '[Beliung] Hancurkan gigi roda di sendinya',
            requires: 'pickaxe', effect: {}, pi: 18 },
          { ko: '작동 패턴을 관찰해 빈틈을 노린다', en: 'Observe its pattern and find an opening', id: 'Amati polanya dan cari celah',
            effect: { hunger: -15 }, pi: 15 },
          { ko: '기계 장치를 피해 옆으로 달려간다', en: 'Dodge the machine and run past it', id: 'Hindari mesin itu dan berlari melewatinya',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '환영을 보여주는 수호자', text: '형체 없는 수호자가 가장 두려운 환영을 보여준다.\n현실인지 환상인지 구분이 안 간다.' },
        en: { title: 'The Illusion-Casting Guardian', text: 'A formless guardian shows you your deepest fears as illusions.\nYou can\'t tell reality from illusion.' },
        id: { title: 'Penjaga Pemberi Ilusi', text: 'Penjaga tanpa wujud menunjukkan ketakutan terdalammu sebagai ilusi.\nKau tak bisa membedakan kenyataan dari ilusi.' },
        effect: { health: -10 },
        choices: [
          { ko: '[랜턴] 랜턴 빛으로 환영을 몰아낸다', en: '[Lantern] Drive away the illusions with the lantern\'s light', id: '[Lentera] Usir ilusi dengan cahaya lentera',
            requires: 'lantern', effect: {}, pi: 18 },
          { ko: '눈을 감고 정신을 집중한다', en: 'Close your eyes and focus your mind', id: 'Tutup mata dan fokuskan pikiran',
            effect: { hunger: -10 }, pi: 12 },
          { ko: '환영에 휘둘려 방향을 잃는다', en: 'Get swept up by the illusion and lose direction', id: 'Terbawa ilusi dan kehilangan arah',
            effect: { health: -15 } },
        ],
      },
    ],

    // ── Stage 7: 성물의 방 ───────────────────────────
    [
      {
        ko: { title: '성물의 방', text: '드디어 도착한 성물의 방. 눈부신 유물이 받침대 위에 놓여 있다.\n천장에서 미세한 모래가 흘러내리기 시작한다.' },
        en: { title: 'The Relic Chamber', text: 'You finally reach the relic chamber. A dazzling relic sits on a pedestal.\nFine sand begins trickling from the ceiling.' },
        id: { title: 'Ruang Relik', text: 'Akhirnya tiba di ruang relik. Relik yang memukau berada di atas alas.\nPasir halus mulai jatuh dari langit-langit.' },
        effect: {},
        choices: [
          { ko: '유물만 조심스레 챙긴다', en: 'Carefully take only the relic', id: 'Hati-hati ambil reliknya saja', effect: { hunger: -5 }, pi: 20 },
          { ko: '주변의 다른 보물도 함께 챙긴다', en: 'Also grab other treasures nearby', id: 'Ambil juga harta lain di sekitarnya',
            effect: { health: -15 }, pi: 30 },
          { ko: '유물의 유래를 먼저 살핀 뒤 챙긴다', en: 'Study the relic\'s origin first, then take it', id: 'Pelajari dulu asal-usul relik, baru diambil',
            effect: {}, pi: 15 },
        ],
      },
      {
        ko: { title: '동료 탐사대의 흔적', text: '방 한쪽에 오래된 탐사대의 유해와 기록이 남아있다.\n기록에는 탈출 경로가 적혀 있다.' },
        en: { title: 'Traces of a Past Expedition', text: 'The remains and records of an old expedition team lie in the corner.\nThe records describe an escape route.' },
        id: { title: 'Jejak Ekspedisi Sebelumnya', text: 'Sisa-sisa dan catatan tim ekspedisi lama tergeletak di sudut.\nCatatan itu menjelaskan rute pelarian.' },
        effect: {},
        choices: [
          { ko: '기록을 챙기고 경의를 표한다', en: 'Take the records and pay your respects', id: 'Ambil catatan dan beri penghormatan', effect: { hunger: -5 }, pi: 18 },
          { ko: '[나침반] 나침반으로 기록의 경로를 검증한다', en: '[Compass] Verify the route with your compass', id: '[Kompas] Verifikasi rute dengan kompas',
            requires: 'compass', effect: {}, pi: 18 },
          { ko: '안타까움을 뒤로하고 서둘러 나선다', en: 'Set your sorrow aside and hurry out', id: 'Menyisihkan kesedihan dan bergegas keluar',
            effect: { hunger: -10 }, pi: 10 },
        ],
      },
      {
        ko: { title: '무너지는 유적', text: '유물을 집어 든 순간, 유적 전체가 진동하기 시작한다.\n입구 쪽에서 모래가 쏟아져 들어온다.' },
        en: { title: 'The Collapsing Ruins', text: 'The moment you take the relic, the whole ruin begins to shake.\nSand pours in from the entrance.' },
        id: { title: 'Reruntuhan yang Runtuh', text: 'Begitu mengambil relik, seluruh reruntuhan mulai bergetar.\nPasir mengalir masuk dari arah pintu masuk.' },
        effect: { hunger: -10 },
        choices: [
          { ko: '[곡괭이] 곡괭이로 새 탈출로를 뚫는다', en: '[Pickaxe] Break open a new escape route with the pickaxe', id: '[Beliung] Buka jalan keluar baru dengan beliung',
            requires: 'pickaxe', effect: {}, pi: 20 },
          { ko: '왔던 길을 전력으로 되돌아간다', en: 'Sprint back the way you came', id: 'Berlari kembali lewat jalan yang tadi dilalui',
            effect: { health: -15 }, pi: 15 },
          { ko: '[나침반] 나침반으로 가장 가까운 출구를 찾는다', en: '[Compass] Find the nearest exit with the compass', id: '[Kompas] Cari jalan keluar terdekat dengan kompas',
            requires: 'compass', effect: { health: -5 }, pi: 18 },
        ],
      },
    ],

    // ── Stage 8: 엔딩 ────────────────────────────────
    [
      {
        ko: { title: '탐사 성공', text: '무너지는 유적을 뒤로하고 지상으로 빠져나왔다.\n손에 쥔 유물이 햇빛에 반짝인다.' },
        en: { title: 'Expedition Successful', text: 'You escape to the surface, leaving the collapsing ruins behind.\nThe relic in your hands glints in the sunlight.' },
        id: { title: 'Ekspedisi Berhasil', text: 'Kau kabur ke permukaan, meninggalkan reruntuhan yang runtuh.\nRelik di tanganmu berkilau di bawah sinar matahari.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '몇 세대 만에 처음으로, 이 유적의 비밀이 세상에 알려지게 되었다.',
          en: 'For the first time in generations, this ruin\'s secret will finally be known to the world.',
          id: 'Untuk pertama kalinya dalam beberapa generasi, rahasia reruntuhan ini akhirnya akan diketahui dunia.',
        },
      },
      {
        ko: { title: '유목민과의 작별', text: '입구에서 기다리던 유목민이 미소 지으며 손을 흔든다.\n"당신이라면 해낼 줄 알았소."' },
        en: { title: 'Farewell to the Nomad', text: 'The nomad, waiting at the entrance, smiles and waves.\n"I knew you could do it."' },
        id: { title: 'Perpisahan dengan Sang Nomaden', text: 'Sang nomaden yang menunggu di pintu masuk tersenyum dan melambai.\n"Aku tahu kau bisa melakukannya."' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '홀로 시작한 탐사였지만, 예상치 못한 인연 덕분에 무사히 끝났다.',
          en: 'The expedition began alone, but an unexpected bond brought it to a safe end.',
          id: 'Ekspedisi ini dimulai sendirian, tapi ikatan tak terduga membawanya berakhir dengan selamat.',
        },
      },
      {
        ko: { title: '학계에 남을 발견', text: '탈출에 성공하자마자 학계에 이 발견을 보고했다.\n이 유적은 곧 역사서에 새로운 장을 남길 것이다.' },
        en: { title: 'A Discovery for the History Books', text: 'The moment you escape, you report the discovery to the academic world.\nThis ruin will soon write a new chapter in history.' },
        id: { title: 'Penemuan untuk Buku Sejarah', text: 'Begitu berhasil kabur, kau melaporkan penemuan ini ke dunia akademis.\nReruntuhan ini akan segera menulis babak baru dalam sejarah.' },
        isEnd: true, endType: 'success', pi: 15,
        endTexts: {
          ko: '위험한 탐사였지만, 역사에 이름을 남기기에 충분했다.',
          en: 'It was a dangerous expedition, but enough to leave your name in history.',
          id: 'Ini ekspedisi yang berbahaya, tapi cukup untuk mengukir namamu dalam sejarah.',
        },
      },
    ],
  ],
};
