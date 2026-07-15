// 삼각차익봇 바이브코딩 — 실제 개발 과정을 뼈대로 한 스테이지별 후보 장면 풀.
// health = 여유자금(자본금), hunger = 집중력(개발 체력)으로 재해석해서 사용.
export const ARBBOT_POOL = {
  id: 'arbbot',
  items: {
    sdk_docs: {
      ko: { label: 'SDK 공식 문서',   desc: '기술적인 문제를 정확히 해결하도록 도와줌' },
      en: { label: 'SDK Docs',        desc: 'Helps you solve technical problems accurately' },
      id: { label: 'Dokumen SDK',     desc: 'Membantu menyelesaikan masalah teknis dengan tepat' },
    },
    ai_partner: {
      ko: { label: '바이브코딩 파트너', desc: '막힐 때마다 원인을 빠르게 같이 찾아줌' },
      en: { label: 'Vibe-Coding Partner', desc: 'Quickly helps find the cause whenever you\'re stuck' },
      id: { label: 'Rekan Vibe-Coding', desc: 'Membantu menemukan penyebab masalah dengan cepat' },
    },
    test_funds: {
      ko: { label: '테스트넷 여유 자금', desc: '실전 배포 전 충분히 실험할 여유를 줌' },
      en: { label: 'Testnet Funds',      desc: 'Gives you room to experiment before going live' },
      id: { label: 'Dana Testnet',       desc: 'Memberi ruang untuk bereksperimen sebelum rilis' },
    },
  },

  stages: [

    // ── Stage 0: 네트워크 선택 ───────────────────────
    [
      {
        ko: { title: '첫 줄부터 막막하다', text: '바이브코딩도, 코드도 처음이다. 삼각차익봇을 어느 네트워크에 연결할지부터 정해야 한다.\n실수하면 진짜 돈이 걸린 메인넷일 수도 있다는 사실이 무겁게 느껴진다.' },
        en: { title: 'Lost From Line One', text: 'This is your first time vibe-coding, and your first time with code at all. You must decide which network to connect the arbitrage bot to.\nThe fact that a mistake could mean real money on mainnet weighs heavily.' },
        id: { title: 'Bingung Sejak Awal', text: 'Ini pertama kalinya kau vibe-coding, dan pertama kalinya menyentuh kode sama sekali. Kau harus memutuskan jaringan mana untuk menghubungkan bot arbitrase.\nFakta bahwa kesalahan bisa berarti uang sungguhan di mainnet terasa berat.' },
        effect: {},
        choices: [
          { ko: '[바이브코딩 파트너] 함께 파이 테스트넷부터 연결해본다', en: '[Vibe-Coding Partner] Connect to Pi testnet together first', id: '[Rekan Vibe-Coding] Sambungkan ke Pi testnet bersama dulu',
            requires: 'ai_partner', effect: {}, pi: 8 },
          { ko: '[SDK 공식 문서] 문서를 정독하고 테스트넷으로 시작한다', en: '[SDK Docs] Read the docs carefully and start on testnet', id: '[Dokumen SDK] Baca dokumen dengan teliti dan mulai di testnet',
            requires: 'sdk_docs', effect: {}, pi: 8 },
          { ko: '겁 없이 바로 메인넷에 연결해본다', en: 'Fearlessly connect straight to mainnet', id: 'Tanpa takut langsung sambungkan ke mainnet',
            effect: { health: -15 } },
        ],
      },
      {
        ko: { title: '테스트넷이라는 단어', text: '검색해보니 "테스트넷"이라는 게 있다는 걸 처음 알았다.\n실제 돈 없이 연습할 수 있는 환경이라는데, 진짜 그런 게 있을까 싶다.' },
        en: { title: 'The Word "Testnet"', text: 'A search reveals the existence of something called a "testnet" for the first time.\nApparently you can practice without real money — hard to believe it\'s really that simple.' },
        id: { title: 'Kata "Testnet"', text: 'Pencarian mengungkap keberadaan sesuatu bernama "testnet" untuk pertama kalinya.\nKatanya kau bisa berlatih tanpa uang sungguhan — sulit dipercaya semudah itu.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '일단 테스트넷 계정부터 만들어본다', en: 'Just try creating a testnet account first', id: 'Coba buat akun testnet dulu', effect: {}, pi: 8 },
          { ko: '[SDK 공식 문서] 문서에서 네트워크 종류를 꼼꼼히 비교한다', en: '[SDK Docs] Carefully compare network types in the docs', id: '[Dokumen SDK] Bandingkan jenis jaringan dengan teliti di dokumen',
            requires: 'sdk_docs', effect: {}, pi: 10 },
          { ko: '테스트넷이 뭔지도 모른 채 메인넷 코드를 그대로 베낀다', en: 'Copy mainnet code without even knowing what testnet is', id: 'Menyalin kode mainnet tanpa tahu apa itu testnet',
            effect: { health: -10 } },
        ],
      },
    ],

    // ── Stage 1: 경로 설정 ───────────────────────────
    [
      {
        ko: { title: '어떤 경로를 찾게 할까', text: '봇이 어떤 차익 경로를 탐색하게 할지 정해야 한다.\nA→B→C→A처럼 도는 단순한 구조부터 떠오른다.' },
        en: { title: 'Which Path Should It Search?', text: 'You must decide which arbitrage paths the bot should search for.\nA simple loop like A→B→C→A comes to mind first.' },
        id: { title: 'Jalur Mana yang Dicari?', text: 'Kau harus memutuskan jalur arbitrase mana yang harus dicari bot.\nLoop sederhana seperti A→B→C→A terlintas pertama kali.' },
        effect: {},
        choices: [
          { ko: '단순한 3각 차익 경로부터 구현한다', en: 'Implement simple triangular arbitrage first', id: 'Implementasikan arbitrase segitiga sederhana dulu', effect: {}, pi: 10 },
          { ko: '[SDK 공식 문서] 조건을 걸어 4각 차익까지 확장한다', en: '[SDK Docs] Add conditions to extend to quadrangular arbitrage', id: '[Dokumen SDK] Tambahkan kondisi untuk perluas ke arbitrase segi empat',
            requires: 'sdk_docs', effect: {}, pi: 15 },
          { ko: '가능한 모든 경로 조합을 다 찾게 만든다', en: 'Make it search every possible path combination', id: 'Buat mencari semua kombinasi jalur yang mungkin',
            effect: { hunger: -20 } },
        ],
      },
      {
        ko: { title: '경로가 너무 많다', text: '토큰 종류가 늘어날수록 가능한 경로의 수가 기하급수적으로 늘어난다는 걸 깨달았다.\n다 계산하려다간 봇이 멈출 것 같다.' },
        en: { title: 'Too Many Paths', text: 'You realize the number of possible paths grows exponentially as token types increase.\nTrying to compute them all might freeze the bot.' },
        id: { title: 'Terlalu Banyak Jalur', text: 'Kau menyadari jumlah jalur yang mungkin bertambah secara eksponensial seiring bertambahnya jenis token.\nMencoba menghitung semuanya bisa membuat bot macet.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[바이브코딩 파트너] 함께 조건을 걸어 4각 차익까지만 제한한다', en: '[Vibe-Coding Partner] Together, limit it to quadrangular arbitrage with conditions', id: '[Rekan Vibe-Coding] Bersama, batasi hanya arbitrase segi empat dengan kondisi',
            requires: 'ai_partner', effect: {}, pi: 15 },
          { ko: '단순하게 3각 차익만 남기고 나머지는 포기한다', en: 'Simplify to only triangular arbitrage, drop the rest', id: 'Sederhanakan hanya arbitrase segitiga, lepaskan sisanya',
            effect: {}, pi: 8 },
          { ko: '일단 다 계산하도록 두고 지켜본다', en: 'Just let it compute everything and watch what happens', id: 'Biarkan menghitung semuanya dan lihat apa yang terjadi',
            effect: { hunger: -15 } },
        ],
      },
    ],

    // ── Stage 2: 고정 수수료 에러 ────────────────────
    [
      {
        ko: { title: '수수료를 고정값으로 넣었더니', text: '네트워크 수수료를 코드에 숫자로 딱 박아뒀는데, 트랜잭션이 자꾸 실패한다.\n에러 로그만 잔뜩 쌓인다.' },
        en: { title: 'Hardcoding the Fee Broke Everything', text: 'You hardcoded the network fee as a fixed number, but transactions keep failing.\nError logs pile up.' },
        id: { title: 'Fee Tetap Membuat Semua Rusak', text: 'Kau mengunci biaya jaringan sebagai angka tetap dalam kode, tapi transaksi terus gagal.\nLog error menumpuk.' },
        effect: { health: -5 },
        choices: [
          { ko: '[바이브코딩 파트너] 함께 원인을 찾아 동적 조회로 바꾼다', en: '[Vibe-Coding Partner] Find the cause together and switch to a dynamic fee query', id: '[Rekan Vibe-Coding] Temukan penyebabnya bersama dan ganti ke kueri fee dinamis',
            requires: 'ai_partner', effect: {}, pi: 15 },
          { ko: '일단 수수료 값을 넉넉하게 늘려서 넘어간다', en: 'Just bump the fee value up generously for now', id: 'Naikkan nilai fee secara berlebihan untuk sementara',
            effect: { health: -10 } },
          { ko: '밤새 로그를 하나하나 뒤져가며 원인을 찾는다', en: 'Dig through the logs all night to find the cause yourself', id: 'Gali log sepanjang malam untuk menemukan penyebabnya sendiri',
            effect: { hunger: -20 }, pi: 10 },
        ],
      },
      {
        ko: { title: '네트워크가 붐빌 때만 터진다', text: '평소엔 잘 되다가 네트워크가 붐빌 때만 트랜잭션이 실패한다는 걸 알아챘다.\n수수료와 관련 있을 것 같은 느낌이 든다.' },
        en: { title: 'It Only Fails When the Network Is Busy', text: 'You notice transactions only fail when the network is congested.\nIt feels related to fees somehow.' },
        id: { title: 'Hanya Gagal Saat Jaringan Sibuk', text: 'Kau menyadari transaksi hanya gagal ketika jaringan padat.\nRasanya ada kaitannya dengan biaya.' },
        effect: {},
        choices: [
          { ko: '[SDK 공식 문서] 문서에서 동적 수수료 조회 방법을 찾는다', en: '[SDK Docs] Find how to dynamically query fees in the docs', id: '[Dokumen SDK] Cari cara mengambil fee secara dinamis di dokumen',
            requires: 'sdk_docs', effect: {}, pi: 15 },
          { ko: '수수료를 아예 넉넉히 최대치로 고정한다', en: 'Just fix the fee at a generously high maximum', id: 'Tetapkan fee pada nilai maksimum yang berlebihan',
            effect: { health: -15 } },
          { ko: '커뮤니티에 물어보고 힌트를 얻는다', en: 'Ask the community and get a hint', id: 'Bertanya ke komunitas dan dapatkan petunjuk',
            effect: { hunger: -10 }, pi: 10 },
        ],
      },
    ],

    // ── Stage 3: 병렬 풀 조회 과부하 ─────────────────
    [
      {
        ko: { title: '서버가 응답을 멈췄다', text: '풀 정보를 빨리 가져오려고 병렬로 잔뜩 요청을 날렸더니,\n어느 순간부터 서버가 아예 응답을 주지 않는다.' },
        en: { title: 'The Server Stopped Responding', text: 'You fired off a flood of parallel requests to fetch pool data quickly,\nand at some point the server stopped responding entirely.' },
        id: { title: 'Server Berhenti Merespons', text: 'Kau mengirim banyak permintaan paralel untuk mengambil data pool dengan cepat,\ndan pada suatu titik server berhenti merespons sama sekali.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[바이브코딩 파트너] 함께 쿨다운과 요청량 제한을 넣는다', en: '[Vibe-Coding Partner] Add a cooldown and request throttling together', id: '[Rekan Vibe-Coding] Tambahkan cooldown dan pembatasan permintaan bersama',
            requires: 'ai_partner', effect: {}, pi: 15 },
          { ko: '무작정 재시도 로직만 덕지덕지 추가한다', en: 'Just slap on retry logic everywhere', id: 'Tambahkan logika retry di mana-mana',
            effect: { hunger: -15 } },
          { ko: '병렬 요청 수를 직접 줄여가며 실험한다', en: 'Manually reduce the number of parallel requests through trial', id: 'Kurangi jumlah permintaan paralel secara manual lewat percobaan',
            effect: { hunger: -10 }, pi: 8 },
        ],
      },
      {
        ko: { title: '차단당한 것 같다', text: '거래소/노드 쪽에서 과도한 요청으로 임시 차단을 당한 것 같다.\n한동안 어떤 요청도 통하지 않는다.' },
        en: { title: 'You Might Have Been Rate-Limited', text: 'It seems the exchange/node side temporarily blocked you for excessive requests.\nNo requests go through for a while.' },
        id: { title: 'Mungkin Kena Rate Limit', text: 'Sepertinya pihak exchange/node memblokirmu sementara karena permintaan berlebihan.\nTidak ada permintaan yang berhasil untuk sementara.' },
        effect: { health: -5, hunger: -5 },
        choices: [
          { ko: '[SDK 공식 문서] 문서에서 권장 요청 주기를 확인한다', en: '[SDK Docs] Check the recommended request interval in the docs', id: '[Dokumen SDK] Periksa interval permintaan yang disarankan di dokumen',
            requires: 'sdk_docs', effect: {}, pi: 12 },
          { ko: '서버 응답이 없으면 대기했다가 다시 시도하는 쿨다운을 넣는다', en: 'Add a cooldown that waits and retries when there\'s no response', id: 'Tambahkan cooldown yang menunggu dan mencoba lagi saat tak ada respons',
            effect: {}, pi: 12 },
          { ko: '그냥 요청 자체를 계속 반복해서 밀어붙인다', en: 'Just keep hammering with repeated requests', id: 'Terus memaksa dengan permintaan berulang',
            effect: { health: -15 } },
        ],
      },
    ],

    // ── Stage 4: 메인넷에서 경로를 못 찾음 ──────────
    [
      {
        ko: { title: '메인넷에선 경로가 안 잡힌다', text: '테스트넷에서는 완벽하게 작동했는데, 스텔라 메인넷에 올리니 차익 경로가 하나도 안 잡힌다.\n뭔가 근본적으로 다른 것 같다.' },
        en: { title: 'No Paths Found on Mainnet', text: 'It worked perfectly on testnet, but on Stellar mainnet not a single arbitrage path is found.\nSomething feels fundamentally different.' },
        id: { title: 'Tidak Ada Jalur di Mainnet', text: 'Bekerja sempurna di testnet, tapi di Stellar mainnet tak satu pun jalur arbitrase ditemukan.\nAda sesuatu yang terasa berbeda secara mendasar.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[바이브코딩 파트너] 함께 경쟁봇과 풀 상태를 분석한다', en: '[Vibe-Coding Partner] Analyze competing bots and pool states together', id: '[Rekan Vibe-Coding] Analisis bot pesaing dan kondisi pool bersama',
            requires: 'ai_partner', effect: {}, pi: 15 },
          { ko: '값을 이것저것 바꿔가며 무작정 재시도한다', en: 'Randomly tweak values and keep retrying', id: 'Mengubah nilai secara acak dan terus mencoba',
            effect: { hunger: -20 } },
          { ko: '마켓메이킹/유동성 공급 쪽으로 전략을 확장해본다', en: 'Try expanding the strategy toward market-making/liquidity provision', id: 'Coba perluas strategi ke arah market-making/penyediaan likuiditas',
            effect: { health: -15 }, pi: 20 },
        ],
      },
      {
        ko: { title: '풀이 너무 안정적이다', text: '풀 비율을 하나하나 뜯어보니, 이미 다들 이상적인 균형에 가깝게 맞춰져 있다.\n차익 거리가 날 틈이 거의 없어 보인다.' },
        en: { title: 'The Pools Are Too Stable', text: 'Digging into the pool ratios, they\'re already close to an ideal balance.\nThere\'s barely any room for arbitrage.' },
        id: { title: 'Pool Terlalu Stabil', text: 'Menggali rasio pool, ternyata sudah mendekati keseimbangan ideal.\nHampir tidak ada ruang untuk arbitrase.' },
        effect: {},
        choices: [
          { ko: '경쟁봇들이 이미 자리 잡고 있다는 결론을 내린다', en: 'Conclude that competing bots have already claimed the space', id: 'Menyimpulkan bot pesaing sudah menguasai ruang itu', effect: { hunger: -10 }, pi: 15 },
          { ko: '[SDK 공식 문서] 문서를 참고해 풀 예치 수익 구조를 공부한다', en: '[SDK Docs] Study pool deposit yield structures using the docs', id: '[Dokumen SDK] Pelajari struktur imbal hasil deposit pool lewat dokumen',
            requires: 'sdk_docs', effect: {}, pi: 15 },
          { ko: '포기하고 다른 체인으로 눈을 돌린다', en: 'Give up and look toward a different chain', id: 'Menyerah dan melirik chain lain',
            effect: { health: -10 } },
        ],
      },
    ],

    // ── Stage 5: 트러스트라인 필요 ───────────────────
    [
      {
        ko: { title: '스왑이 자꾸 실패한다', text: '차익 경로의 첫 코인을 바꿔봤더니 스왑이 계속 실패한다.\n에러 메시지에 낯선 용어가 보인다 — "트러스트라인 없음".' },
        en: { title: 'The Swap Keeps Failing', text: 'You try changing the first coin in the arbitrage path, but the swap keeps failing.\nThe error message shows an unfamiliar term — "no trustline".' },
        id: { title: 'Swap Terus Gagal', text: 'Kau coba ganti koin pertama di jalur arbitrase, tapi swap terus gagal.\nPesan error menunjukkan istilah asing — "tidak ada trustline".' },
        effect: { hunger: -5 },
        choices: [
          { ko: '[SDK 공식 문서] 문서를 참고해 트러스트라인부터 정확히 생성한다', en: '[SDK Docs] Reference the docs to properly create a trustline first', id: '[Dokumen SDK] Rujuk dokumen untuk membuat trustline dengan benar dulu',
            requires: 'sdk_docs', effect: {}, pi: 15 },
          { ko: '여기저기 코드를 복사해가며 트러스트라인을 시도한다', en: 'Try creating a trustline by copying code from various places', id: 'Coba buat trustline dengan menyalin kode dari berbagai tempat',
            effect: { hunger: -15 }, pi: 8 },
          { ko: '이 코인은 포기하고 다른 경로만 쓴다', en: 'Give up on this coin and only use other paths', id: 'Menyerah pada koin ini dan hanya pakai jalur lain',
            effect: {}, pi: 5 },
        ],
      },
      {
        ko: { title: '새 토큰은 그냥 거래가 안 된다', text: '지갑에 새로운 토큰을 받으려 했더니 아예 거부당했다.\n"토큰을 받으려면 먼저 뭔가 등록해야 한다"는 설명이 어렴풋이 기억난다.' },
        en: { title: 'New Tokens Just Won\'t Trade', text: 'You try to receive a new token in the wallet, but it\'s outright rejected.\nYou vaguely recall something about needing to register before receiving a token.' },
        id: { title: 'Token Baru Tak Bisa Diperdagangkan', text: 'Kau coba menerima token baru di wallet, tapi ditolak mentah-mentah.\nKau samar-samar ingat sesuatu tentang perlu registrasi sebelum menerima token.' },
        effect: {},
        choices: [
          { ko: '[바이브코딩 파트너] 함께 트러스트라인 개념부터 이해하고 구현한다', en: '[Vibe-Coding Partner] Understand and implement the trustline concept together', id: '[Rekan Vibe-Coding] Pahami dan implementasikan konsep trustline bersama',
            requires: 'ai_partner', effect: {}, pi: 15 },
          { ko: '오류 메시지를 검색해가며 혼자 알아낸다', en: 'Search the error message and figure it out alone', id: 'Cari pesan error dan cari tahu sendiri',
            effect: { hunger: -15 }, pi: 10 },
          { ko: '새 토큰 지원은 나중으로 미룬다', en: 'Postpone support for new tokens for later', id: 'Menunda dukungan token baru untuk nanti',
            effect: {} },
        ],
      },
    ],

    // ── Stage 6: 자금 허용한도 미설정 ────────────────
    [
      {
        ko: { title: '한도를 안 걸어뒀다는 걸 깨달았다', text: '트러스트라인과 스왑 코드를 다시 보다가, 자금 허용 한도를 하나도 설정 안 했다는 걸 뒤늦게 알아챘다.\n등골이 서늘해진다.' },
        en: { title: 'Realizing There\'s No Spending Limit', text: 'Reviewing the trustline and swap code again, you belatedly realize you never set any spending allowance limits.\nA chill runs down your spine.' },
        id: { title: 'Menyadari Tidak Ada Batas Pengeluaran', text: 'Meninjau ulang kode trustline dan swap, kau baru sadar tak pernah mengatur batas izin pengeluaran.\nBulu kudukmu berdiri.' },
        effect: { health: -5 },
        choices: [
          { ko: '[바이브코딩 파트너] 즉시 함께 한도를 걸어 리스크를 차단한다', en: '[Vibe-Coding Partner] Immediately set limits together to block the risk', id: '[Rekan Vibe-Coding] Segera atur batas bersama untuk memblokir risiko',
            requires: 'ai_partner', effect: {}, pi: 18 },
          { ko: '괜찮겠지 하고 일단 그대로 둔다', en: 'Assume it\'s probably fine and leave it as is', id: 'Menganggap mungkin tidak apa-apa dan biarkan saja',
            effect: { health: -20 } },
          { ko: '전액 다시 점검하며 한도를 하나하나 재설정한다', en: 'Review everything and reset each limit one by one', id: 'Tinjau ulang semuanya dan atur ulang setiap batas satu per satu',
            effect: { hunger: -15 }, pi: 12 },
        ],
      },
      {
        ko: { title: '허용한도가 뭔지 검색해본다', text: '"approve", "allowance" 같은 단어들이 낯설게 느껴진다.\n검색해보니 이걸 안 걸면 가용자금이 예기치 않게 빠져나갈 수도 있다고 한다.' },
        en: { title: 'Looking Up What "Allowance" Means', text: 'Words like "approve" and "allowance" feel unfamiliar.\nA search reveals that without this, available funds could unexpectedly drain away.' },
        id: { title: 'Mencari Tahu Arti "Allowance"', text: 'Kata-kata seperti "approve" dan "allowance" terasa asing.\nPencarian mengungkap bahwa tanpa ini, dana yang tersedia bisa terkuras tak terduga.' },
        effect: {},
        choices: [
          { ko: '[SDK 공식 문서] 문서에서 허용한도 설정법을 정확히 찾는다', en: '[SDK Docs] Find the exact way to set allowances in the docs', id: '[Dokumen SDK] Temukan cara pasti mengatur allowance di dokumen',
            requires: 'sdk_docs', effect: {}, pi: 18 },
          { ko: '일단 넉넉하게 무제한으로 설정해버린다', en: 'Just set it to unlimited for convenience', id: 'Atur saja jadi tak terbatas demi kemudahan',
            effect: { health: -15 } },
          { ko: '필요한 만큼만 딱 소액으로 설정한다', en: 'Set it to only the small amount actually needed', id: 'Atur hanya sejumlah kecil yang benar-benar dibutuhkan',
            effect: { hunger: -10 }, pi: 15 },
        ],
      },
    ],

    // ── Stage 7: 배포 전 마지막 점검 ─────────────────
    [
      {
        ko: { title: '실전 배포를 앞두고', text: '이제 메인넷에 실제로 올릴 시간이 다가온다.\n지금까지 겪은 문제들을 떠올리니 마지막 점검이 중요하다는 생각이 든다.' },
        en: { title: 'Before Going Live', text: 'The time to actually deploy on mainnet approaches.\nRecalling all the problems so far, a final check feels crucial.' },
        id: { title: 'Sebelum Rilis Nyata', text: 'Waktu untuk benar-benar rilis di mainnet semakin dekat.\nMengingat semua masalah sejauh ini, pengecekan terakhir terasa krusial.' },
        effect: {},
        choices: [
          { ko: '[테스트넷 여유 자금] 테스트넷에서 모든 시나리오를 다시 한번 돌려본다', en: '[Testnet Funds] Run through every scenario again on testnet', id: '[Dana Testnet] Jalankan lagi semua skenario di testnet',
            requires: 'test_funds', effect: {}, pi: 20 },
          { ko: '시간이 없으니 주요 기능만 빠르게 확인하고 배포한다', en: 'No time left — quickly check main features and deploy', id: 'Tidak ada waktu — cepat periksa fitur utama dan rilis',
            effect: { health: -15 } },
          { ko: '커뮤니티에 코드를 공유해 피드백을 받은 뒤 배포한다', en: 'Share the code with the community for feedback before deploying', id: 'Bagikan kode ke komunitas untuk masukan sebelum rilis',
            effect: { hunger: -15 }, pi: 15 },
        ],
      },
      {
        ko: { title: '체크리스트를 만들어본다', text: '지금까지 겪은 사건들 — 고정 수수료, 병렬 과부하, 트러스트라인, 허용한도 —\n을 하나씩 체크리스트로 정리해본다.' },
        en: { title: 'Making a Checklist', text: 'You organize everything you\'ve experienced so far — fixed fees, parallel overload, trustlines, allowances —\ninto a checklist, one by one.' },
        id: { title: 'Membuat Daftar Periksa', text: 'Kau menyusun semua yang telah dialami — fee tetap, kelebihan beban paralel, trustline, allowance —\nmenjadi daftar periksa, satu per satu.' },
        effect: { hunger: -5 },
        choices: [
          { ko: '체크리스트를 하나씩 테스트넷에서 검증한다', en: 'Verify the checklist item by item on testnet', id: 'Verifikasi daftar periksa satu per satu di testnet', effect: {}, pi: 18 },
          { ko: '[바이브코딩 파트너] 함께 체크리스트를 검토하고 놓친 걸 찾는다', en: '[Vibe-Coding Partner] Review the checklist together and find what\'s missing', id: '[Rekan Vibe-Coding] Tinjau daftar bersama dan temukan yang terlewat',
            requires: 'ai_partner', effect: {}, pi: 18 },
          { ko: '체크리스트가 다 됐다고 믿고 바로 배포한다', en: 'Trust the checklist is complete and deploy immediately', id: 'Percaya daftar sudah lengkap dan langsung rilis',
            effect: { health: -10 } },
        ],
      },
    ],

    // ── Stage 8: 엔딩 ────────────────────────────────
    [
      {
        ko: { title: '첫 실전 거래 성공', text: '드디어 메인넷에서 봇이 첫 차익 거래를 성공적으로 체결했다.\n작은 수익이지만, 처음부터 끝까지 직접 만든 결과라 더 값지다.' },
        en: { title: 'First Live Trade Succeeds', text: 'The bot finally executes its first successful arbitrage trade on mainnet.\nThe profit is small, but it means more since you built it from scratch.' },
        id: { title: 'Perdagangan Langsung Pertama Berhasil', text: 'Bot akhirnya berhasil mengeksekusi perdagangan arbitrase pertamanya di mainnet.\nKeuntungannya kecil, tapi lebih berarti karena kau membangunnya dari nol.' },
        isEnd: true, endType: 'success', pi: 20,
        endTexts: {
          ko: '코드 한 줄 모르던 사람이, 결국 실전에서 작동하는 봇을 만들어냈다.',
          en: 'Someone who knew no code ended up building a bot that actually works in production.',
          id: 'Seseorang yang tak tahu kode sama sekali akhirnya berhasil membangun bot yang benar-benar berjalan di produksi.',
        },
      },
      {
        ko: { title: '커뮤니티의 반응', text: '개발 과정을 커뮤니티에 공유했더니 예상보다 큰 관심을 받았다.\n"저도 이런 거 만들어보고 싶어요"라는 댓글이 달린다.' },
        en: { title: 'Community Response', text: 'Sharing the development process with the community draws more attention than expected.\nA comment reads: "I want to build something like this too."' },
        id: { title: 'Respons Komunitas', text: 'Membagikan proses pengembangan ke komunitas menarik perhatian lebih dari dugaan.\nSebuah komentar berbunyi: "Aku juga ingin membuat sesuatu seperti ini."' },
        isEnd: true, endType: 'success', pi: 20,
        endTexts: {
          ko: '삽질의 기록이, 누군가에게는 지도가 되었다.',
          en: 'A record of struggle became a map for someone else.',
          id: 'Catatan perjuangan itu menjadi peta bagi orang lain.',
        },
      },
      {
        ko: { title: '작지만 꾸준한 시작', text: '큰 수익은 아니지만, 봇은 안정적으로 계속 돌아가고 있다.\n버그를 하나씩 고칠 때마다 조금씩 더 나아지는 게 느껴진다.' },
        en: { title: 'A Small but Steady Start', text: 'Not a huge profit, but the bot keeps running steadily.\nEach bug fixed makes it feel a little better each time.' },
        id: { title: 'Awal yang Kecil tapi Stabil', text: 'Bukan keuntungan besar, tapi bot terus berjalan stabil.\nSetiap bug yang diperbaiki terasa membuatnya sedikit lebih baik.' },
        isEnd: true, endType: 'success', pi: 20,
        endTexts: {
          ko: '완벽하지 않아도 괜찮다. 계속 고쳐나가는 것 자체가 실력이 된다.',
          en: 'It doesn\'t have to be perfect. The act of continuously improving is itself the skill.',
          id: 'Tidak harus sempurna. Tindakan terus memperbaiki itu sendiri adalah keahlian.',
        },
      },
    ],
  ],
};
