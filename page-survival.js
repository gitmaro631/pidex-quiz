import { getLang, detectCountry, countryToFlag } from './util-i18n.js';
import { isSubscribed, setSubscription } from './util-storage.js';
import { createSubscriptionPayment, syncSubscription } from './pi-sdk.js';
import { submitSurvivalScore, fetchSurvivalLeaderboard } from './firebase.js';
import { DUNGEON_POOL } from './stories/dungeon.js';
import { quizBeginner } from './data/quiz-beginner.js';
import { quizMid }      from './data/quiz-mid.js';
import { quizAdvanced } from './data/quiz-advanced.js';

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// 퀴즈 문제 은행 재사용 (기존 크립토/DEX 상식 문제 — 한국어만 제공)
const ALL_QUIZ = [...quizBeginner, ...quizMid, ...quizAdvanced];

// 퀴즈를 내는 파이 코어팀 캐릭터 — 실존 인물을 가볍고 우호적인 카메오로만 등장시킴
const QUIZ_HOSTS = [
  {
    name: { ko: '니콜라스', en: 'Nicolas', id: 'Nicolas' },
    correct: {
      ko: '오, 정확해요! 계속 그렇게 가봐요.',
      en: 'Oh, exactly right! Keep going like that.',
      id: 'Oh, tepat sekali! Terus seperti itu.',
    },
    wrong: {
      ko: '어이쿠... 그건 좀 아쉬운데요? 다음엔 더 잘할 거예요.',
      en: 'Oops... that one stung a bit. You\'ll get the next one.',
      id: 'Aduh... itu agak meleset. Kamu pasti dapat yang berikutnya.',
    },
  },
  {
    name: { ko: '첸디아오', en: 'Chengdiao', id: 'Chengdiao' },
    correct: {
      ko: '좋아요, 정확히 맞췄네요!',
      en: 'Nice, you got it exactly right!',
      id: 'Bagus, kamu benar sekali!',
    },
    wrong: {
      ko: '음... 아깝네요! 그래도 탐험은 계속되니까요.',
      en: 'Hmm... so close! But the adventure continues.',
      id: 'Hmm... hampir! Tapi petualangan tetap berlanjut.',
    },
  },
];

// 게임 진행 텍스트(장면·선택지)는 한국어/영어/인도네시아어만 제공 — 그 외 언어는 영어로 대체.
const STORY_LANGS = ['ko', 'en', 'id'];
function storyLang() {
  const l = getLang();
  return STORY_LANGS.includes(l) ? l : 'en';
}
function sl(obj) {
  if (!obj) return null;
  const l = storyLang();
  return obj[l] || obj.en || obj.ko || null;
}

// 콘텐츠 풀 — 새 게임을 추가할 때 여기에 등록
const STORY_POOLS = {
  dungeon: DUNGEON_POOL,
};

// 3개 무료(구독 전 개방) + 2개는 구독해야 개방. 콘텐츠 준비된 게임만 available:true.
export const MAPS = [
  { id: 'dungeon',   emoji: '🗡️', free: true,  available: true  },
  { id: 'isekai',    emoji: '⚔️', free: true,  available: false },
  { id: 'zombie',    emoji: '🧟', free: true,  available: false },
  { id: 'ruins',     emoji: '🏺', free: false, available: false },
  { id: 'derelict',  emoji: '🛰️', free: false, available: false },
];

const END_META = {
  success  : { icon: '🏕️', titleKey: 'end.success.title' },
  injury   : { icon: '💀', titleKey: 'end.injury.title'  },
  hunger   : { icon: '💀', titleKey: 'end.hunger.title'  },
  illness  : { icon: '☠️', titleKey: 'end.illness.title' },
  criminal : { icon: '⛓️', titleKey: 'end.criminal.title'},
};

function getDb() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
  return firebase.firestore();
}

// ── 스테이지 콘텐츠를 최초 1회 Firestore에 저장(auto-seed), 이후엔 DB에서 읽어 사용 ──
const STORY_STAGES_COL = 'story_stages';

async function ensureStagesSeeded(gameId) {
  const pool = STORY_POOLS[gameId];
  if (!pool) return;
  const db = getDb();
  if (!db) return;
  const ref = db.collection(STORY_STAGES_COL).doc(gameId);
  try {
    const doc = await ref.get();
    if (doc.exists) return;
    const batch = db.batch();
    batch.set(ref, {
      items: pool.items,
      stageCount: pool.stages.length,
      seededAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    pool.stages.forEach((variants, i) => {
      batch.set(ref.collection('stages').doc(String(i)), { variants });
    });
    await batch.commit();
  } catch { /* 시딩 실패해도 아래 fetch에서 로컬 풀로 폴백함 */ }
}

async function fetchGameData(gameId) {
  const pool = STORY_POOLS[gameId];
  const db = getDb();
  if (!db) return pool; // DB 연결 안 되면 로컬 풀 그대로 사용 (오프라인/로그인 전 등)
  try {
    const metaDoc = await db.collection(STORY_STAGES_COL).doc(gameId).get();
    if (!metaDoc.exists) return pool;
    const stagesSnap = await db.collection(STORY_STAGES_COL).doc(gameId).collection('stages').get();
    const stages = stagesSnap.docs
      .map(d => ({ idx: parseInt(d.id, 10), variants: d.data().variants }))
      .sort((a, b) => a.idx - b.idx)
      .map(s => s.variants);
    if (stages.length !== metaDoc.data().stageCount) return pool; // 불완전하면 로컬 풀로 폴백
    return { id: gameId, items: metaDoc.data().items, stages };
  } catch {
    return pool;
  }
}

function pickVariant(variants) {
  return variants[Math.floor(Math.random() * variants.length)];
}

// ── UI 문자열 (18개 언어 전체 — 게임 진행 텍스트와는 별개) ──
const ST = {
  ko: {
    'map.title': '🗺️ 생존 맵 선택', 'map.sub': '플레이할 맵을 선택하세요', 'map.lock': '🔒 구독 필요', 'map.lock.soon': '🔒 출시 예정', 'map.soon': '준비 중',
    'map.dungeon.name': '던전 탐험가', 'map.dungeon.desc': '무너진 고대 던전 · 보물을 찾아라',
    'map.isekai.name': '이세계 용병', 'map.isekai.desc': '소환된 다른 세계 · 용병 생활',
    'map.zombie.name': '좀비 아포칼립스', 'map.zombie.desc': '폐허가 된 도시 · 탈출 루트를 찾아라',
    'map.ruins.name': '고대 유적 탐사대', 'map.ruins.desc': '잊혀진 유적 · 함정과 유물',
    'map.derelict.name': '표류 우주선', 'map.derelict.desc': '고장난 우주선 · 탈출선까지',
    'item.title': '🎒 아이템 선택', 'item.sub': '2가지 아이템을 골라 시작하세요', 'item.start': '시작하기',
    'end.success.title': '탈출 성공!', 'end.injury.title': '부상으로 사망', 'end.hunger.title': '굶주림으로 사망',
    'end.illness.title': '질병으로 사망', 'end.criminal.title': '갇혀버림', 'end.default.title': '사망',
    'end.death.injury': '심각한 부상으로 사망했습니다.', 'end.death.hunger': '굶주림으로 사망했습니다.',
    'end.days': '진행 단계', 'end.days.unit': '단계', 'end.pi': '획득 π',
    'end.retry': '🔄 다시 도전', 'end.home': '🗺️ 맵 선택',
    'lb.title': '생존 랭킹', 'lb.loading': '랭킹 불러오는 중...', 'lb.empty': '아직 기록이 없습니다.',
    'lb.fail': '랭킹 불러오기 실패', 'lb.submit.fail': '랭킹 등록 실패', 'lb.head.rank': '순위', 'lb.head.pioneer': '파이오니어', 'lb.head.days': '단계', 'lb.head.pi': '획득 π',
    'sub.badge': '⭐ 구독 중', 'sub.free': '무료', 'sub.prompt': '구독하면 모든 맵 잠금 해제!',
    'sub.btn': '구독 (1π/월)', 'sub.restore': '구독 복원', 'sub.restoring': '복원 중...',
    'sub.memo': '생존게임 1개월 이용권', 'sub.success': '구독 완료!', 'sub.error': '결제 오류가 발생했습니다.',
    'sub.restore.none': '복원할 구독 기록이 없습니다.',
  },
  en: {
    'map.title': '🗺️ Choose Survival Map', 'map.sub': 'Select a map to start', 'map.lock': '🔒 Subscription Required', 'map.lock.soon': '🔒 Coming Soon', 'map.soon': 'Coming Soon',
    'map.dungeon.name': 'Dungeon Explorer', 'map.dungeon.desc': 'A collapsed ancient dungeon · Find the treasure',
    'map.isekai.name': 'Otherworld Mercenary', 'map.isekai.desc': 'Summoned to another world · Life as a mercenary',
    'map.zombie.name': 'Zombie Apocalypse', 'map.zombie.desc': 'A ruined city · Find the escape route',
    'map.ruins.name': 'Ancient Ruins Expedition', 'map.ruins.desc': 'Forgotten ruins · Traps and relics',
    'map.derelict.name': 'Derelict Starship', 'map.derelict.desc': 'A broken-down ship · Reach the escape pod',
    'item.title': '🎒 Choose Items', 'item.sub': 'Pick 2 items to start', 'item.start': 'Start',
    'end.success.title': 'Escaped!', 'end.injury.title': 'Died from Injury', 'end.hunger.title': 'Died from Hunger',
    'end.illness.title': 'Died from Illness', 'end.criminal.title': 'Trapped Forever', 'end.default.title': 'Dead',
    'end.death.injury': 'You died from severe injuries.', 'end.death.hunger': 'You died of hunger.',
    'end.days': 'Stages Cleared', 'end.days.unit': '', 'end.pi': 'π Earned',
    'end.retry': '🔄 Try Again', 'end.home': '🗺️ Map Select',
    'lb.title': 'Survival Ranking', 'lb.loading': 'Loading ranking...', 'lb.empty': 'No records yet.',
    'lb.fail': 'Failed to load ranking', 'lb.submit.fail': 'Failed to register ranking', 'lb.head.rank': 'Rank', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Stages', 'lb.head.pi': 'π Earned',
    'sub.badge': '⭐ Subscribed', 'sub.free': 'Free', 'sub.prompt': 'Subscribe to unlock all maps!',
    'sub.btn': 'Subscribe (1π/mo)', 'sub.restore': 'Restore Subscription', 'sub.restoring': 'Restoring...',
    'sub.memo': 'Survival Game 1-month pass', 'sub.success': 'Subscription activated!', 'sub.error': 'Payment error occurred.',
    'sub.restore.none': 'No subscription found to restore.',
  },
  zh: {
    'map.title': '🗺️ 选择生存地图', 'map.sub': '选择地图开始', 'map.lock': '🔒 需要订阅', 'map.lock.soon': '🔒 即将推出', 'map.soon': '即将推出',
    'map.dungeon.name': '地下城探险家', 'map.dungeon.desc': '崩塌的古代地下城 · 寻找宝藏',
    'map.isekai.name': '异世界佣兵', 'map.isekai.desc': '被召唤到异世界 · 佣兵生活',
    'map.zombie.name': '僵尸末日', 'map.zombie.desc': '废墟都市 · 寻找逃生路线',
    'map.ruins.name': '古代遗迹探险队', 'map.ruins.desc': '被遗忘的遗迹 · 陷阱与遗物',
    'map.derelict.name': '漂流宇宙飞船', 'map.derelict.desc': '故障飞船 · 前往逃生舱',
    'item.title': '🎒 选择道具', 'item.sub': '选择2件道具开始', 'item.start': '开始',
    'end.success.title': '逃脱成功！', 'end.injury.title': '因伤死亡', 'end.hunger.title': '因饥饿死亡',
    'end.illness.title': '因疾病死亡', 'end.criminal.title': '永远被困', 'end.default.title': '死亡',
    'end.death.injury': '因重伤死亡。', 'end.death.hunger': '因饥饿死亡。',
    'end.days': '通过阶段', 'end.days.unit': '', 'end.pi': '获得π',
    'end.retry': '🔄 再试一次', 'end.home': '🗺️ 地图选择',
    'lb.title': '生存排名', 'lb.loading': '加载排名...', 'lb.empty': '暂无记录。',
    'lb.fail': '加载排名失败', 'lb.submit.fail': '排名注册失败', 'lb.head.rank': '排名', 'lb.head.pioneer': '先锋', 'lb.head.days': '阶段', 'lb.head.pi': '获得π',
    'sub.badge': '⭐ 已订阅', 'sub.free': '免费', 'sub.prompt': '订阅解锁所有地图！',
    'sub.btn': '订阅 (1π/月)', 'sub.restore': '恢复订阅', 'sub.restoring': '恢复中...',
    'sub.memo': '生存游戏1个月通行证', 'sub.success': '订阅激活！', 'sub.error': '支付错误。',
    'sub.restore.none': '未找到可恢复的订阅。',
  },
  id: {
    'map.title': '🗺️ Pilih Peta Survival', 'map.sub': 'Pilih peta untuk mulai', 'map.lock': '🔒 Perlu Langganan', 'map.lock.soon': '🔒 Segera Hadir', 'map.soon': 'Segera Hadir',
    'map.dungeon.name': 'Penjelajah Dungeon', 'map.dungeon.desc': 'Dungeon kuno yang runtuh · Temukan harta karun',
    'map.isekai.name': 'Tentara Bayaran Dunia Lain', 'map.isekai.desc': 'Terpanggil ke dunia lain · Hidup sebagai tentara bayaran',
    'map.zombie.name': 'Kiamat Zombie', 'map.zombie.desc': 'Kota yang hancur · Cari jalur pelarian',
    'map.ruins.name': 'Ekspedisi Reruntuhan Kuno', 'map.ruins.desc': 'Reruntuhan terlupakan · Jebakan dan relik',
    'map.derelict.name': 'Kapal Luar Angkasa Terlantar', 'map.derelict.desc': 'Kapal rusak · Menuju kapsul pelarian',
    'item.title': '🎒 Pilih Item', 'item.sub': 'Pilih 2 item untuk mulai', 'item.start': 'Mulai',
    'end.success.title': 'Berhasil Kabur!', 'end.injury.title': 'Mati karena Cedera', 'end.hunger.title': 'Mati karena Lapar',
    'end.illness.title': 'Mati karena Penyakit', 'end.criminal.title': 'Terjebak Selamanya', 'end.default.title': 'Mati',
    'end.death.injury': 'Kamu mati karena cedera parah.', 'end.death.hunger': 'Kamu mati karena kelaparan.',
    'end.days': 'Tahap Terlewati', 'end.days.unit': '', 'end.pi': 'π Diperoleh',
    'end.retry': '🔄 Coba Lagi', 'end.home': '🗺️ Pilih Peta',
    'lb.title': 'Peringkat Survival', 'lb.loading': 'Memuat peringkat...', 'lb.empty': 'Belum ada catatan.',
    'lb.fail': 'Gagal memuat peringkat', 'lb.submit.fail': 'Gagal mendaftarkan peringkat', 'lb.head.rank': 'Peringkat', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Tahap', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Berlangganan', 'sub.free': 'Gratis', 'sub.prompt': 'Berlangganan untuk membuka semua peta!',
    'sub.btn': 'Berlangganan (1π/bln)', 'sub.restore': 'Pulihkan Langganan', 'sub.restoring': 'Memulihkan...',
    'sub.memo': 'Langganan Survival 1 bulan', 'sub.success': 'Langganan aktif!', 'sub.error': 'Kesalahan pembayaran.',
    'sub.restore.none': 'Tidak ada langganan untuk dipulihkan.',
  },
  ja: {
    'map.title': '🗺️ サバイバルマップ選択', 'map.sub': 'マップを選んでください', 'map.lock': '🔒 サブスク必要', 'map.lock.soon': '🔒 近日公開', 'map.soon': '準備中',
    'map.dungeon.name': 'ダンジョン探検家', 'map.dungeon.desc': '崩れた古代ダンジョン・宝を探せ',
    'map.isekai.name': '異世界傭兵', 'map.isekai.desc': '異世界に召喚・傭兵生活',
    'map.zombie.name': 'ゾンビ黙示録', 'map.zombie.desc': '廃墟の都市・脱出ルートを探せ',
    'map.ruins.name': '古代遺跡探検隊', 'map.ruins.desc': '忘れられた遺跡・罠と遺物',
    'map.derelict.name': '漂流宇宙船', 'map.derelict.desc': '故障した宇宙船・脱出ポッドへ',
    'item.title': '🎒 アイテム選択', 'item.sub': '2つのアイテムを選んでください', 'item.start': 'スタート',
    'end.success.title': '脱出成功！', 'end.injury.title': '負傷により死亡', 'end.hunger.title': '飢えにより死亡',
    'end.illness.title': '病気により死亡', 'end.criminal.title': '永遠に囚われる', 'end.default.title': '死亡',
    'end.death.injury': '重傷により死亡しました。', 'end.death.hunger': '飢えにより死亡しました。',
    'end.days': 'クリア段階', 'end.days.unit': '', 'end.pi': '獲得π',
    'end.retry': '🔄 再挑戦', 'end.home': '🗺️ マップ選択',
    'lb.title': 'サバイバルランキング', 'lb.loading': 'ランキング読込中...', 'lb.empty': 'まだ記録がありません。',
    'lb.fail': 'ランキング読込失敗', 'lb.submit.fail': 'ランキング登録失敗', 'lb.head.rank': '順位', 'lb.head.pioneer': 'パイオニア', 'lb.head.days': '段階', 'lb.head.pi': '獲得π',
    'sub.badge': '⭐ 購読中', 'sub.free': '無料', 'sub.prompt': '購読して全マップを解放！',
    'sub.btn': '購読 (1π/月)', 'sub.restore': '購読を復元', 'sub.restoring': '復元中...',
    'sub.memo': 'サバイバル1ヶ月利用券', 'sub.success': '購読完了！', 'sub.error': '決済エラーが発生しました。',
    'sub.restore.none': '復元できる購読がありません。',
  },
  es: {
    'map.title': '🗺️ Elegir Mapa de Supervivencia', 'map.sub': 'Selecciona un mapa para comenzar', 'map.lock': '🔒 Se requiere suscripción', 'map.lock.soon': '🔒 Próximamente', 'map.soon': 'Próximamente',
    'map.dungeon.name': 'Explorador de Mazmorras', 'map.dungeon.desc': 'Una mazmorra antigua colapsada · Encuentra el tesoro',
    'map.isekai.name': 'Mercenario de Otro Mundo', 'map.isekai.desc': 'Invocado a otro mundo · Vida de mercenario',
    'map.zombie.name': 'Apocalipsis Zombi', 'map.zombie.desc': 'Una ciudad en ruinas · Encuentra la ruta de escape',
    'map.ruins.name': 'Expedición a Ruinas Antiguas', 'map.ruins.desc': 'Ruinas olvidadas · Trampas y reliquias',
    'map.derelict.name': 'Nave Abandonada', 'map.derelict.desc': 'Nave averiada · Llega a la cápsula de escape',
    'item.title': '🎒 Elegir Objetos', 'item.sub': 'Elige 2 objetos para comenzar', 'item.start': 'Comenzar',
    'end.success.title': '¡Escapaste!', 'end.injury.title': 'Muerto por Lesión', 'end.hunger.title': 'Muerto por Hambre',
    'end.illness.title': 'Muerto por Enfermedad', 'end.criminal.title': 'Atrapado para Siempre', 'end.default.title': 'Muerto',
    'end.death.injury': 'Moriste por heridas graves.', 'end.death.hunger': 'Moriste de hambre.',
    'end.days': 'Etapas Superadas', 'end.days.unit': '', 'end.pi': 'π Ganados',
    'end.retry': '🔄 Intentar de Nuevo', 'end.home': '🗺️ Seleccionar Mapa',
    'lb.title': 'Ranking de Supervivencia', 'lb.loading': 'Cargando ranking...', 'lb.empty': 'Sin registros todavía.',
    'lb.fail': 'Error al cargar ranking', 'lb.submit.fail': 'Error al registrar el ranking', 'lb.head.rank': 'Rango', 'lb.head.pioneer': 'Pionero', 'lb.head.days': 'Etapas', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Suscrito', 'sub.free': 'Gratis', 'sub.prompt': '¡Suscríbete para desbloquear todos los mapas!',
    'sub.btn': 'Suscribirse (1π/mes)', 'sub.restore': 'Restaurar Suscripción', 'sub.restoring': 'Restaurando...',
    'sub.memo': 'Pase Survival 1 mes', 'sub.success': '¡Suscripción activada!', 'sub.error': 'Error de pago.',
    'sub.restore.none': 'No se encontró suscripción para restaurar.',
  },
  fr: {
    'map.title': '🗺️ Choisir une Carte de Survie', 'map.sub': 'Sélectionnez une carte pour commencer', 'map.lock': '🔒 Abonnement requis', 'map.lock.soon': '🔒 Bientôt', 'map.soon': 'Bientôt',
    'map.dungeon.name': 'Explorateur de Donjon', 'map.dungeon.desc': 'Un donjon antique effondré · Trouvez le trésor',
    'map.isekai.name': 'Mercenaire d\'un Autre Monde', 'map.isekai.desc': 'Invoqué dans un autre monde · Vie de mercenaire',
    'map.zombie.name': 'Apocalypse Zombie', 'map.zombie.desc': 'Une ville en ruines · Trouvez la sortie',
    'map.ruins.name': 'Expédition aux Ruines Antiques', 'map.ruins.desc': 'Ruines oubliées · Pièges et reliques',
    'map.derelict.name': 'Vaisseau Abandonné', 'map.derelict.desc': 'Vaisseau en panne · Atteindre la capsule de secours',
    'item.title': '🎒 Choisir des Objets', 'item.sub': 'Choisissez 2 objets pour commencer', 'item.start': 'Commencer',
    'end.success.title': 'Évadé!', 'end.injury.title': 'Mort de Blessures', 'end.hunger.title': 'Mort de Faim',
    'end.illness.title': 'Mort de Maladie', 'end.criminal.title': 'Piégé pour Toujours', 'end.default.title': 'Mort',
    'end.death.injury': 'Vous êtes mort de blessures graves.', 'end.death.hunger': 'Vous êtes mort de faim.',
    'end.days': 'Étapes Franchies', 'end.days.unit': '', 'end.pi': 'π Gagnés',
    'end.retry': '🔄 Réessayer', 'end.home': '🗺️ Sélection de Carte',
    'lb.title': 'Classement de Survie', 'lb.loading': 'Chargement...', 'lb.empty': 'Pas encore de records.',
    'lb.fail': 'Erreur de chargement', 'lb.submit.fail': "Échec de l'enregistrement du classement", 'lb.head.rank': 'Rang', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Étapes', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Abonné', 'sub.free': 'Gratuit', 'sub.prompt': 'Abonnez-vous pour débloquer toutes les cartes!',
    'sub.btn': "S'abonner (1π/mois)", 'sub.restore': "Restaurer l'Abonnement", 'sub.restoring': 'Restauration...',
    'sub.memo': "Pass Survie 1 mois", 'sub.success': "Abonnement activé!", 'sub.error': "Erreur de paiement.",
    'sub.restore.none': "Aucun abonnement à restaurer.",
  },
  vi: {
    'map.title': '🗺️ Chọn Bản Đồ Sinh Tồn', 'map.sub': 'Chọn bản đồ để bắt đầu', 'map.lock': '🔒 Cần Đăng Ký', 'map.lock.soon': '🔒 Sắp Ra Mắt', 'map.soon': 'Sắp Ra Mắt',
    'map.dungeon.name': 'Nhà Thám Hiểm Dungeon', 'map.dungeon.desc': 'Dungeon cổ đại sụp đổ · Tìm kho báu',
    'map.isekai.name': 'Lính Đánh Thuê Dị Giới', 'map.isekai.desc': 'Bị triệu hồi đến thế giới khác · Cuộc sống lính đánh thuê',
    'map.zombie.name': 'Ngày Tận Thế Zombie', 'map.zombie.desc': 'Thành phố đổ nát · Tìm lối thoát',
    'map.ruins.name': 'Đoàn Thám Hiểm Di Tích Cổ', 'map.ruins.desc': 'Di tích bị lãng quên · Bẫy và cổ vật',
    'map.derelict.name': 'Tàu Vũ Trụ Trôi Dạt', 'map.derelict.desc': 'Tàu hỏng · Đến khoang thoát hiểm',
    'item.title': '🎒 Chọn Vật Phẩm', 'item.sub': 'Chọn 2 vật phẩm để bắt đầu', 'item.start': 'Bắt Đầu',
    'end.success.title': 'Đã Thoát!', 'end.injury.title': 'Chết Vì Thương Tích', 'end.hunger.title': 'Chết Vì Đói',
    'end.illness.title': 'Chết Vì Bệnh', 'end.criminal.title': 'Bị Mắc Kẹt Mãi Mãi', 'end.default.title': 'Chết',
    'end.death.injury': 'Bạn chết vì vết thương nặng.', 'end.death.hunger': 'Bạn chết vì đói.',
    'end.days': 'Giai Đoạn Vượt Qua', 'end.days.unit': '', 'end.pi': 'π Kiếm Được',
    'end.retry': '🔄 Thử Lại', 'end.home': '🗺️ Chọn Bản Đồ',
    'lb.title': 'Bảng Xếp Hạng Sinh Tồn', 'lb.loading': 'Đang tải...', 'lb.empty': 'Chưa có kỷ lục.',
    'lb.fail': 'Không thể tải bảng xếp hạng', 'lb.submit.fail': 'Đăng ký xếp hạng thất bại', 'lb.head.rank': 'Hạng', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Giai đoạn', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Đã Đăng Ký', 'sub.free': 'Miễn Phí', 'sub.prompt': 'Đăng ký để mở khóa tất cả bản đồ!',
    'sub.btn': 'Đăng Ký (1π/tháng)', 'sub.restore': 'Khôi Phục Đăng Ký', 'sub.restoring': 'Đang khôi phục...',
    'sub.memo': 'Gói 1 tháng Survival', 'sub.success': 'Đăng ký thành công!', 'sub.error': 'Lỗi thanh toán.',
    'sub.restore.none': 'Không tìm thấy đăng ký để khôi phục.',
  },
  pt: {
    'map.title': '🗺️ Escolher Mapa de Sobrevivência', 'map.sub': 'Selecione um mapa para começar', 'map.lock': '🔒 Assinatura Necessária', 'map.lock.soon': '🔒 Em Breve', 'map.soon': 'Em Breve',
    'map.dungeon.name': 'Explorador de Masmorra', 'map.dungeon.desc': 'Uma masmorra antiga desmoronada · Encontre o tesouro',
    'map.isekai.name': 'Mercenário de Outro Mundo', 'map.isekai.desc': 'Invocado para outro mundo · Vida de mercenário',
    'map.zombie.name': 'Apocalipse Zumbi', 'map.zombie.desc': 'Uma cidade em ruínas · Encontre a rota de fuga',
    'map.ruins.name': 'Expedição às Ruínas Antigas', 'map.ruins.desc': 'Ruínas esquecidas · Armadilhas e relíquias',
    'map.derelict.name': 'Nave Abandonada', 'map.derelict.desc': 'Nave quebrada · Chegue à cápsula de fuga',
    'item.title': '🎒 Escolher Itens', 'item.sub': 'Escolha 2 itens para começar', 'item.start': 'Começar',
    'end.success.title': 'Escapou!', 'end.injury.title': 'Morreu por Lesão', 'end.hunger.title': 'Morreu de Fome',
    'end.illness.title': 'Morreu de Doença', 'end.criminal.title': 'Preso Para Sempre', 'end.default.title': 'Morto',
    'end.death.injury': 'Você morreu de ferimentos graves.', 'end.death.hunger': 'Você morreu de fome.',
    'end.days': 'Etapas Concluídas', 'end.days.unit': '', 'end.pi': 'π Ganhos',
    'end.retry': '🔄 Tentar Novamente', 'end.home': '🗺️ Selecionar Mapa',
    'lb.title': 'Ranking de Sobrevivência', 'lb.loading': 'Carregando...', 'lb.empty': 'Sem registros ainda.',
    'lb.fail': 'Falha ao carregar ranking', 'lb.submit.fail': 'Falha ao registrar o ranking', 'lb.head.rank': 'Rank', 'lb.head.pioneer': 'Pioneiro', 'lb.head.days': 'Etapas', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Assinante', 'sub.free': 'Grátis', 'sub.prompt': 'Assine para desbloquear todos os mapas!',
    'sub.btn': 'Assinar (1π/mês)', 'sub.restore': 'Restaurar Assinatura', 'sub.restoring': 'Restaurando...',
    'sub.memo': 'Passe Survival 1 mês', 'sub.success': 'Assinatura ativada!', 'sub.error': 'Erro de pagamento.',
    'sub.restore.none': 'Nenhuma assinatura para restaurar.',
  },
  ms: {
    'map.title': '🗺️ Pilih Peta Survival', 'map.sub': 'Pilih peta untuk mula', 'map.lock': '🔒 Perlu Langganan', 'map.lock.soon': '🔒 Akan Datang', 'map.soon': 'Akan Datang',
    'map.dungeon.name': 'Peneroka Dungeon', 'map.dungeon.desc': 'Dungeon purba yang runtuh · Cari harta karun',
    'map.isekai.name': 'Askar Upahan Dunia Lain', 'map.isekai.desc': 'Dipanggil ke dunia lain · Kehidupan askar upahan',
    'map.zombie.name': 'Wabak Zombi', 'map.zombie.desc': 'Bandar musnah · Cari laluan melarikan diri',
    'map.ruins.name': 'Ekspedisi Runtuhan Purba', 'map.ruins.desc': 'Runtuhan dilupakan · Perangkap dan relik',
    'map.derelict.name': 'Kapal Angkasa Terbiar', 'map.derelict.desc': 'Kapal rosak · Menuju kapsul pelarian',
    'item.title': '🎒 Pilih Item', 'item.sub': 'Pilih 2 item untuk mula', 'item.start': 'Mula',
    'end.success.title': 'Berjaya Lari!', 'end.injury.title': 'Mati kerana Kecederaan', 'end.hunger.title': 'Mati kerana Lapar',
    'end.illness.title': 'Mati kerana Penyakit', 'end.criminal.title': 'Terperangkap Selamanya', 'end.default.title': 'Mati',
    'end.death.injury': 'Anda mati kerana kecederaan teruk.', 'end.death.hunger': 'Anda mati kerana kelaparan.',
    'end.days': 'Peringkat Dilalui', 'end.days.unit': '', 'end.pi': 'π Diperoleh',
    'end.retry': '🔄 Cuba Lagi', 'end.home': '🗺️ Pilih Peta',
    'lb.title': 'Kedudukan Survival', 'lb.loading': 'Memuatkan kedudukan...', 'lb.empty': 'Belum ada rekod.',
    'lb.fail': 'Gagal memuatkan kedudukan', 'lb.submit.fail': 'Gagal mendaftarkan kedudukan', 'lb.head.rank': 'Kedudukan', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Peringkat', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Melanggan', 'sub.free': 'Percuma', 'sub.prompt': 'Langgan untuk buka semua peta!',
    'sub.btn': 'Langgan (1π/bln)', 'sub.restore': 'Pulihkan Langganan', 'sub.restoring': 'Memulihkan...',
    'sub.memo': 'Pas Survival 1 bulan', 'sub.success': 'Langganan diaktifkan!', 'sub.error': 'Ralat pembayaran.',
    'sub.restore.none': 'Tiada langganan untuk dipulihkan.',
  },
  tl: {
    'map.title': '🗺️ Pumili ng Survival Map', 'map.sub': 'Pumili ng mapa para magsimula', 'map.lock': '🔒 Kailangan ng Subscription', 'map.lock.soon': '🔒 Malapit na', 'map.soon': 'Malapit na',
    'map.dungeon.name': 'Manlalakbay ng Dungeon', 'map.dungeon.desc': 'Isang gumuhong sinaunang dungeon · Hanapin ang kayamanan',
    'map.isekai.name': 'Mersenaryo ng Ibang Mundo', 'map.isekai.desc': 'Na-summon sa ibang mundo · Buhay bilang mersenaryo',
    'map.zombie.name': 'Zombie Apocalypse', 'map.zombie.desc': 'Isang wasak na lungsod · Hanapin ang ruta ng pagtakas',
    'map.ruins.name': 'Ekspedisyon sa Sinaunang Guho', 'map.ruins.desc': 'Nakalimutang guho · Bitag at relikya',
    'map.derelict.name': 'Naliligaw na Spaceship', 'map.derelict.desc': 'Sirang barko · Abutin ang escape pod',
    'item.title': '🎒 Pumili ng Mga Item', 'item.sub': 'Pumili ng 2 item para magsimula', 'item.start': 'Simulan',
    'end.success.title': 'Nakatakas!', 'end.injury.title': 'Namatay sa Sugat', 'end.hunger.title': 'Namatay sa Gutom',
    'end.illness.title': 'Namatay sa Sakit', 'end.criminal.title': 'Habang Buhay na Nakakulong', 'end.default.title': 'Patay',
    'end.death.injury': 'Namatay ka sa matinding sugat.', 'end.death.hunger': 'Namatay ka sa gutom.',
    'end.days': 'Natapos na Yugto', 'end.days.unit': '', 'end.pi': 'π Nakuha',
    'end.retry': '🔄 Subukang Muli', 'end.home': '🗺️ Pumili ng Mapa',
    'lb.title': 'Survival Ranking', 'lb.loading': 'Naglo-load...', 'lb.empty': 'Wala pang rekord.',
    'lb.fail': 'Hindi ma-load ang ranking', 'lb.submit.fail': 'Nabigo ang pagpaparehistro ng ranking', 'lb.head.rank': 'Rank', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Yugto', 'lb.head.pi': 'π',
    'sub.badge': '⭐ May Subscription', 'sub.free': 'Libre', 'sub.prompt': 'Mag-subscribe para ma-unlock ang lahat ng mapa!',
    'sub.btn': 'Mag-subscribe (1π/buwan)', 'sub.restore': 'I-restore ang Subscription', 'sub.restoring': 'Nire-restore...',
    'sub.memo': 'Survival 1-buwang pass', 'sub.success': 'Na-activate ang subscription!', 'sub.error': 'Error sa pagbabayad.',
    'sub.restore.none': 'Walang subscription na ma-restore.',
  },
  hi: {
    'map.title': '🗺️ सर्वाइवल मैप चुनें', 'map.sub': 'शुरू करने के लिए एक मैप चुनें', 'map.lock': '🔒 सदस्यता आवश्यक', 'map.lock.soon': '🔒 जल्द आ रहा है', 'map.soon': 'जल्द आ रहा है',
    'map.dungeon.name': 'डंजियन एक्सप्लोरर', 'map.dungeon.desc': 'ढहा हुआ प्राचीन डंजियन · खजाना खोजें',
    'map.isekai.name': 'दूसरी दुनिया का भाड़े का सैनिक', 'map.isekai.desc': 'दूसरी दुनिया में बुलाया गया · भाड़े के सैनिक का जीवन',
    'map.zombie.name': 'जॉम्बी एपोकैलिप्स', 'map.zombie.desc': 'बर्बाद शहर · भागने का रास्ता खोजें',
    'map.ruins.name': 'प्राचीन खंडहर अभियान', 'map.ruins.desc': 'भूले-बिसरे खंडहर · जाल और अवशेष',
    'map.derelict.name': 'बहता हुआ अंतरिक्ष यान', 'map.derelict.desc': 'खराब यान · एस्केप पॉड तक पहुंचें',
    'item.title': '🎒 आइटम चुनें', 'item.sub': 'शुरू करने के लिए 2 आइटम चुनें', 'item.start': 'शुरू करें',
    'end.success.title': 'भाग निकले!', 'end.injury.title': 'चोट से मृत्यु', 'end.hunger.title': 'भूख से मृत्यु',
    'end.illness.title': 'बीमारी से मृत्यु', 'end.criminal.title': 'हमेशा के लिए फंस गए', 'end.default.title': 'मृत',
    'end.death.injury': 'आप गंभीर चोटों से मर गए।', 'end.death.hunger': 'आप भूख से मर गए।',
    'end.days': 'पूर्ण चरण', 'end.days.unit': '', 'end.pi': 'π अर्जित',
    'end.retry': '🔄 फिर प्रयास करें', 'end.home': '🗺️ मैप चुनें',
    'lb.title': 'सर्वाइवल रैंकिंग', 'lb.loading': 'लोड हो रहा है...', 'lb.empty': 'अभी कोई रिकॉर्ड नहीं।',
    'lb.fail': 'रैंकिंग लोड विफल', 'lb.submit.fail': 'रैंकिंग पंजीकरण विफल', 'lb.head.rank': 'रैंक', 'lb.head.pioneer': 'पायनियर', 'lb.head.days': 'चरण', 'lb.head.pi': 'π',
    'sub.badge': '⭐ सदस्य', 'sub.free': 'मुफ़्त', 'sub.prompt': 'सभी मैप अनलॉक करने के लिए सदस्यता लें!',
    'sub.btn': 'सदस्यता (1π/माह)', 'sub.restore': 'सदस्यता पुनर्स्थापित करें', 'sub.restoring': 'पुनर्स्थापित हो रहा है...',
    'sub.memo': 'Survival 1 माह पास', 'sub.success': 'सदस्यता सक्रिय!', 'sub.error': 'भुगतान त्रुटि।',
    'sub.restore.none': 'कोई सदस्यता नहीं मिली।',
  },
  ar: {
    'map.title': '🗺️ اختر خريطة البقاء', 'map.sub': 'اختر خريطة للبدء', 'map.lock': '🔒 يتطلب اشتراكًا', 'map.lock.soon': '🔒 قريبًا', 'map.soon': 'قريبًا',
    'map.dungeon.name': 'مستكشف الزنزانة', 'map.dungeon.desc': 'زنزانة قديمة منهارة · ابحث عن الكنز',
    'map.isekai.name': 'مرتزق عالم آخر', 'map.isekai.desc': 'استُدعي إلى عالم آخر · حياة مرتزق',
    'map.zombie.name': 'نهاية الزومبي', 'map.zombie.desc': 'مدينة مدمرة · ابحث عن طريق الهروب',
    'map.ruins.name': 'بعثة الأطلال القديمة', 'map.ruins.desc': 'أطلال منسية · فخاخ وآثار',
    'map.derelict.name': 'سفينة فضائية متروكة', 'map.derelict.desc': 'سفينة معطلة · الوصول إلى كبسولة الهروب',
    'item.title': '🎒 اختر الأدوات', 'item.sub': 'اختر أداتين للبدء', 'item.start': 'ابدأ',
    'end.success.title': 'نجت الهروب!', 'end.injury.title': 'مات بسبب إصابة', 'end.hunger.title': 'مات بسبب الجوع',
    'end.illness.title': 'مات بسبب مرض', 'end.criminal.title': 'محاصر إلى الأبد', 'end.default.title': 'ميت',
    'end.death.injury': 'مت بسبب إصابات خطيرة.', 'end.death.hunger': 'مت بسبب الجوع.',
    'end.days': 'المراحل المكتملة', 'end.days.unit': '', 'end.pi': 'π المكتسب',
    'end.retry': '🔄 حاول مرة أخرى', 'end.home': '🗺️ اختيار الخريطة',
    'lb.title': 'ترتيب البقاء', 'lb.loading': 'جارٍ تحميل الترتيب...', 'lb.empty': 'لا توجد سجلات بعد.',
    'lb.fail': 'فشل تحميل الترتيب', 'lb.submit.fail': 'فشل تسجيل الترتيب', 'lb.head.rank': 'الترتيب', 'lb.head.pioneer': 'الرائد', 'lb.head.days': 'المراحل', 'lb.head.pi': 'π',
    'sub.badge': '⭐ مشترك', 'sub.free': 'مجاني', 'sub.prompt': 'اشترك لفتح جميع الخرائط!',
    'sub.btn': 'اشترك (1π/شهر)', 'sub.restore': 'استعادة الاشتراك', 'sub.restoring': 'جارٍ الاستعادة...',
    'sub.memo': 'اشتراك شهر واحد للبقاء', 'sub.success': 'تم تفعيل الاشتراك!', 'sub.error': 'حدث خطأ في الدفع.',
    'sub.restore.none': 'لم يتم العثور على اشتراك لاستعادته.',
  },
  ru: {
    'map.title': '🗺️ Выберите карту выживания', 'map.sub': 'Выберите карту, чтобы начать', 'map.lock': '🔒 Требуется подписка', 'map.lock.soon': '🔒 Скоро', 'map.soon': 'Скоро',
    'map.dungeon.name': 'Исследователь Подземелья', 'map.dungeon.desc': 'Обрушившееся древнее подземелье · Найдите сокровище',
    'map.isekai.name': 'Наёмник Другого Мира', 'map.isekai.desc': 'Призван в другой мир · Жизнь наёмника',
    'map.zombie.name': 'Зомби-апокалипсис', 'map.zombie.desc': 'Разрушенный город · Найдите путь к спасению',
    'map.ruins.name': 'Экспедиция к Древним Руинам', 'map.ruins.desc': 'Забытые руины · Ловушки и реликвии',
    'map.derelict.name': 'Заброшенный Звездолёт', 'map.derelict.desc': 'Сломанный корабль · Доберитесь до спасательной капсулы',
    'item.title': '🎒 Выберите предметы', 'item.sub': 'Выберите 2 предмета для начала', 'item.start': 'Начать',
    'end.success.title': 'Побег удался!', 'end.injury.title': 'Умер от травмы', 'end.hunger.title': 'Умер от голода',
    'end.illness.title': 'Умер от болезни', 'end.criminal.title': 'Заперт навсегда', 'end.default.title': 'Мёртв',
    'end.death.injury': 'Вы умерли от тяжёлых травм.', 'end.death.hunger': 'Вы умерли от голода.',
    'end.days': 'Пройдено этапов', 'end.days.unit': '', 'end.pi': 'π заработано',
    'end.retry': '🔄 Попробовать снова', 'end.home': '🗺️ Выбор карты',
    'lb.title': 'Рейтинг выживания', 'lb.loading': 'Загрузка рейтинга...', 'lb.empty': 'Пока нет записей.',
    'lb.fail': 'Не удалось загрузить рейтинг', 'lb.submit.fail': 'Не удалось зарегистрировать рейтинг', 'lb.head.rank': 'Ранг', 'lb.head.pioneer': 'Пионер', 'lb.head.days': 'Этапы', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Подписан', 'sub.free': 'Бесплатно', 'sub.prompt': 'Подпишитесь, чтобы открыть все карты!',
    'sub.btn': 'Подписаться (1π/мес)', 'sub.restore': 'Восстановить подписку', 'sub.restoring': 'Восстановление...',
    'sub.memo': 'Пропуск на 1 месяц Survival', 'sub.success': 'Подписка активирована!', 'sub.error': 'Произошла ошибка оплаты.',
    'sub.restore.none': 'Подписка для восстановления не найдена.',
  },
  bn: {
    'map.title': '🗺️ সার্ভাইভাল ম্যাপ বেছে নিন', 'map.sub': 'শুরু করতে একটি ম্যাপ নির্বাচন করুন', 'map.lock': '🔒 সাবস্ক্রিপশন প্রয়োজন', 'map.lock.soon': '🔒 শীঘ্রই আসছে', 'map.soon': 'শীঘ্রই আসছে',
    'map.dungeon.name': 'ডানজিয়ন এক্সপ্লোরার', 'map.dungeon.desc': 'ধসে পড়া প্রাচীন ডানজিয়ন · ধন খুঁজুন',
    'map.isekai.name': 'অন্য জগতের ভাড়াটে সৈনিক', 'map.isekai.desc': 'অন্য জগতে ডাকা হয়েছে · ভাড়াটে জীবন',
    'map.zombie.name': 'জম্বি অ্যাপোক্যালিপ্স', 'map.zombie.desc': 'ধ্বংসপ্রাপ্ত শহর · পালানোর পথ খুঁজুন',
    'map.ruins.name': 'প্রাচীন ধ্বংসাবশেষ অভিযান', 'map.ruins.desc': 'বিস্মৃত ধ্বংসাবশেষ · ফাঁদ এবং নিদর্শন',
    'map.derelict.name': 'ভাসমান মহাকাশযান', 'map.derelict.desc': 'বিকল জাহাজ · এস্কেপ পডে পৌঁছান',
    'item.title': '🎒 আইটেম বেছে নিন', 'item.sub': 'শুরু করতে ২টি আইটেম বেছে নিন', 'item.start': 'শুরু করুন',
    'end.success.title': 'পালাতে সফল!', 'end.injury.title': 'আঘাতে মৃত্যু', 'end.hunger.title': 'ক্ষুধায় মৃত্যু',
    'end.illness.title': 'রোগে মৃত্যু', 'end.criminal.title': 'চিরকাল আটকা', 'end.default.title': 'মৃত',
    'end.death.injury': 'আপনি গুরুতর আঘাতে মারা গেছেন।', 'end.death.hunger': 'আপনি ক্ষুধায় মারা গেছেন।',
    'end.days': 'সম্পন্ন ধাপ', 'end.days.unit': '', 'end.pi': 'π অর্জিত',
    'end.retry': '🔄 আবার চেষ্টা করুন', 'end.home': '🗺️ ম্যাপ নির্বাচন',
    'lb.title': 'সার্ভাইভাল র‍্যাঙ্কিং', 'lb.loading': 'র‍্যাঙ্কিং লোড হচ্ছে...', 'lb.empty': 'এখনও কোনো রেকর্ড নেই।',
    'lb.fail': 'র‍্যাঙ্কিং লোড ব্যর্থ', 'lb.submit.fail': 'র‍্যাঙ্কিং নিবন্ধন ব্যর্থ', 'lb.head.rank': 'র‍্যাঙ্ক', 'lb.head.pioneer': 'পাইওনিয়ার', 'lb.head.days': 'ধাপ', 'lb.head.pi': 'π',
    'sub.badge': '⭐ সাবস্ক্রাইবড', 'sub.free': 'ফ্রি', 'sub.prompt': 'সব ম্যাপ আনলক করতে সাবস্ক্রাইব করুন!',
    'sub.btn': 'সাবস্ক্রাইব (1π/মাস)', 'sub.restore': 'সাবস্ক্রিপশন পুনরুদ্ধার করুন', 'sub.restoring': 'পুনরুদ্ধার হচ্ছে...',
    'sub.memo': 'সার্ভাইভাল ১ মাসের পাস', 'sub.success': 'সাবস্ক্রিপশন সক্রিয়!', 'sub.error': 'পেমেন্ট ত্রুটি ঘটেছে।',
    'sub.restore.none': 'পুনরুদ্ধারের জন্য কোনো সাবস্ক্রিপশন পাওয়া যায়নি।',
  },
  sw: {
    'map.title': '🗺️ Chagua Ramani ya Kuishi', 'map.sub': 'Chagua ramani ili kuanza', 'map.lock': '🔒 Uandikishaji Unahitajika', 'map.lock.soon': '🔒 Inakuja Hivi Karibuni', 'map.soon': 'Inakuja Hivi Karibuni',
    'map.dungeon.name': 'Mgunduzi wa Dungeon', 'map.dungeon.desc': 'Dungeon ya kale iliyoanguka · Tafuta hazina',
    'map.isekai.name': 'Askari wa Kukodi wa Ulimwengu Mwingine', 'map.isekai.desc': 'Aliitwa kwenda ulimwengu mwingine · Maisha ya askari wa kukodi',
    'map.zombie.name': 'Mwisho wa Zombi', 'map.zombie.desc': 'Jiji lililoharibiwa · Tafuta njia ya kutoroka',
    'map.ruins.name': 'Msafara wa Magofu ya Kale', 'map.ruins.desc': 'Magofu yaliyosahaulika · Mitego na masalio',
    'map.derelict.name': 'Chombo cha Anga Kilichotelekezwa', 'map.derelict.desc': 'Chombo kilichoharibika · Fika kwenye kapsuli ya kutoroka',
    'item.title': '🎒 Chagua Vitu', 'item.sub': 'Chagua vitu 2 ili kuanza', 'item.start': 'Anza',
    'end.success.title': 'Umetoroka!', 'end.injury.title': 'Alikufa kwa Jeraha', 'end.hunger.title': 'Alikufa kwa Njaa',
    'end.illness.title': 'Alikufa kwa Ugonjwa', 'end.criminal.title': 'Amenaswa Milele', 'end.default.title': 'Amekufa',
    'end.death.injury': 'Ulikufa kwa majeraha makubwa.', 'end.death.hunger': 'Ulikufa kwa njaa.',
    'end.days': 'Hatua Zilizokamilika', 'end.days.unit': '', 'end.pi': 'π Iliyopatikana',
    'end.retry': '🔄 Jaribu Tena', 'end.home': '🗺️ Chagua Ramani',
    'lb.title': 'Nafasi ya Kuishi', 'lb.loading': 'Inapakia nafasi...', 'lb.empty': 'Bado hakuna rekodi.',
    'lb.fail': 'Imeshindwa kupakia nafasi', 'lb.submit.fail': 'Imeshindwa kusajili nafasi', 'lb.head.rank': 'Nafasi', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Hatua', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Umejisajili', 'sub.free': 'Bure', 'sub.prompt': 'Jisajili ili kufungua ramani zote!',
    'sub.btn': 'Jisajili (1π/mwezi)', 'sub.restore': 'Rejesha Usajili', 'sub.restoring': 'Inarejesha...',
    'sub.memo': 'Pasi ya Mwezi 1 ya Survival', 'sub.success': 'Usajili umewashwa!', 'sub.error': 'Hitilafu ya malipo imetokea.',
    'sub.restore.none': 'Hakuna usajili uliopatikana wa kurejesha.',
  },
  th: {
    'map.title': '🗺️ เลือกแผนที่เอาชีวิตรอด', 'map.sub': 'เลือกแผนที่เพื่อเริ่ม', 'map.lock': '🔒 ต้องสมัครสมาชิก', 'map.lock.soon': '🔒 เร็วๆ นี้', 'map.soon': 'เร็วๆ นี้',
    'map.dungeon.name': 'นักผจญภัยดันเจี้ยน', 'map.dungeon.desc': 'ดันเจี้ยนโบราณที่พังทลาย · ตามหาสมบัติ',
    'map.isekai.name': 'ทหารรับจ้างต่างโลก', 'map.isekai.desc': 'ถูกเรียกไปยังโลกอื่น · ชีวิตทหารรับจ้าง',
    'map.zombie.name': 'วันสิ้นโลกซอมบี้', 'map.zombie.desc': 'เมืองที่พังยับเยิน · ตามหาเส้นทางหนี',
    'map.ruins.name': 'ทีมสำรวจซากปรักหักพังโบราณ', 'map.ruins.desc': 'ซากปรักหักพังที่ถูกลืม · กับดักและโบราณวัตถุ',
    'map.derelict.name': 'ยานอวกาศล่องลอย', 'map.derelict.desc': 'ยานที่เสียหาย · ไปให้ถึงแคปซูลหนีภัย',
    'item.title': '🎒 เลือกไอเทม', 'item.sub': 'เลือก 2 ไอเทมเพื่อเริ่ม', 'item.start': 'เริ่ม',
    'end.success.title': 'หนีสำเร็จ!', 'end.injury.title': 'เสียชีวิตจากบาดแผล', 'end.hunger.title': 'เสียชีวิตจากความหิว',
    'end.illness.title': 'เสียชีวิตจากโรค', 'end.criminal.title': 'ติดอยู่ตลอดไป', 'end.default.title': 'เสียชีวิต',
    'end.death.injury': 'คุณเสียชีวิตจากบาดแผลสาหัส', 'end.death.hunger': 'คุณเสียชีวิตจากความหิว',
    'end.days': 'ด่านที่ผ่าน', 'end.days.unit': '', 'end.pi': 'π ที่ได้รับ',
    'end.retry': '🔄 ลองอีกครั้ง', 'end.home': '🗺️ เลือกแผนที่',
    'lb.title': 'อันดับการเอาชีวิตรอด', 'lb.loading': 'กำลังโหลดอันดับ...', 'lb.empty': 'ยังไม่มีสถิติ',
    'lb.fail': 'โหลดอันดับไม่สำเร็จ', 'lb.submit.fail': 'ลงทะเบียนอันดับไม่สำเร็จ', 'lb.head.rank': 'อันดับ', 'lb.head.pioneer': 'ไพโอเนียร์', 'lb.head.days': 'ด่าน', 'lb.head.pi': 'π',
    'sub.badge': '⭐ สมัครสมาชิกแล้ว', 'sub.free': 'ฟรี', 'sub.prompt': 'สมัครสมาชิกเพื่อปลดล็อกแผนที่ทั้งหมด!',
    'sub.btn': 'สมัครสมาชิก (1π/เดือน)', 'sub.restore': 'กู้คืนการสมัครสมาชิก', 'sub.restoring': 'กำลังกู้คืน...',
    'sub.memo': 'บัตรผ่าน Survival 1 เดือน', 'sub.success': 'เปิดใช้งานการสมัครสมาชิกแล้ว!', 'sub.error': 'เกิดข้อผิดพลาดในการชำระเงิน',
    'sub.restore.none': 'ไม่พบการสมัครสมาชิกที่จะกู้คืน',
  },
  tr: {
    'map.title': '🗺️ Hayatta Kalma Haritası Seç', 'map.sub': 'Başlamak için bir harita seçin', 'map.lock': '🔒 Abonelik Gerekli', 'map.lock.soon': '🔒 Yakında', 'map.soon': 'Yakında',
    'map.dungeon.name': 'Zindan Kaşifi', 'map.dungeon.desc': 'Çökmüş antik bir zindan · Hazineyi bul',
    'map.isekai.name': 'Başka Dünyanın Paralı Askeri', 'map.isekai.desc': 'Başka bir dünyaya çağrıldı · Paralı asker hayatı',
    'map.zombie.name': 'Zombi Kıyameti', 'map.zombie.desc': 'Harap olmuş bir şehir · Kaçış rotasını bul',
    'map.ruins.name': 'Antik Harabeler Keşif Gezisi', 'map.ruins.desc': 'Unutulmuş harabeler · Tuzaklar ve kalıntılar',
    'map.derelict.name': 'Terk Edilmiş Uzay Gemisi', 'map.derelict.desc': 'Bozuk gemi · Kaçış kapsülüne ulaş',
    'item.title': '🎒 Eşya Seç', 'item.sub': 'Başlamak için 2 eşya seçin', 'item.start': 'Başla',
    'end.success.title': 'Kaçtın!', 'end.injury.title': 'Yaralanmadan Öldü', 'end.hunger.title': 'Açlıktan Öldü',
    'end.illness.title': 'Hastalıktan Öldü', 'end.criminal.title': 'Sonsuza Dek Kapana Kısıldı', 'end.default.title': 'Öldü',
    'end.death.injury': 'Ağır yaralardan öldün.', 'end.death.hunger': 'Açlıktan öldün.',
    'end.days': 'Tamamlanan Aşama', 'end.days.unit': '', 'end.pi': 'Kazanılan π',
    'end.retry': '🔄 Tekrar Dene', 'end.home': '🗺️ Harita Seçimi',
    'lb.title': 'Hayatta Kalma Sıralaması', 'lb.loading': 'Sıralama yükleniyor...', 'lb.empty': 'Henüz kayıt yok.',
    'lb.fail': 'Sıralama yüklenemedi', 'lb.submit.fail': 'Sıralama kaydedilemedi', 'lb.head.rank': 'Sıra', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Aşama', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Abone', 'sub.free': 'Ücretsiz', 'sub.prompt': 'Tüm haritaların kilidini açmak için abone olun!',
    'sub.btn': 'Abone Ol (1π/ay)', 'sub.restore': 'Aboneliği Geri Yükle', 'sub.restoring': 'Geri yükleniyor...',
    'sub.memo': 'Survival 1 aylık pass', 'sub.success': 'Abonelik etkinleştirildi!', 'sub.error': 'Ödeme hatası oluştu.',
    'sub.restore.none': 'Geri yüklenecek abonelik bulunamadı.',
  },
};

export function ts(key) {
  const lang = getLang();
  return ST[lang]?.[key] ?? ST.en?.[key] ?? key;
}

export function renderSurvivalPage(container, username) {
  const state = {
    username: username || 'Pioneer',
    map: null,
    game: null,     // { id, items, stages } — fetch된 게임 데이터
    health: 100,
    hunger: 100,
    items: [],
    stageIdx: 0,
    piEarned: 0,
  };

  function hasRequired(requires) {
    if (!requires) return true;
    if (Array.isArray(requires)) return requires.every(r => state.items.includes(r));
    return state.items.includes(requires);
  }

  function applyEffect(effect) {
    if (!effect) return;
    if (effect.health) state.health = Math.min(100, Math.max(0, state.health + effect.health));
    if (effect.hunger) state.hunger = Math.min(100, Math.max(0, state.hunger + effect.hunger));
  }

  function updateStatBar(id, val, fillId) {
    const el = container.querySelector('#' + fillId);
    const vl = container.querySelector('#' + id + '-val');
    if (!el || !vl) return;
    const pct = Math.max(0, Math.min(100, val));
    el.style.width = pct + '%';
    vl.textContent = Math.round(pct);
    el.className = 'sv-stat-fill ' + (pct < 30 ? 'danger' : pct < 60 ? 'warn' : '');
  }

  function updateStats() {
    updateStatBar('health', state.health, 'sv-fill-health');
    updateStatBar('hunger', state.hunger, 'sv-fill-hunger');
    const d = container.querySelector('#sv-stat-day');
    if (d) d.textContent = 'Stage ' + (state.stageIdx + 1);
    const p = container.querySelector('#sv-stat-pi');
    if (p) p.textContent = '⬡ ' + state.piEarned + 'π';
  }

  function renderItems() {
    const el = container.querySelector('#sv-item-strip');
    if (!el) return;
    el.innerHTML = state.items.map(id => {
      const it = state.game.items[id];
      const l = sl(it);
      return it ? `<span class="sv-item-chip">${it.emoji || ''} ${l?.label || ''}</span>` : '';
    }).join('');
  }

  function showMapSelect() {
    const sub = isSubscribed();
    const subBanner = sub ? '' : `
      <div class="sv-sub-banner">
        <span>${ts('sub.prompt')}</span>
        <button class="sv-sub-banner-btn" id="sv-btn-sub-banner">${ts('sub.btn').split(' ')[0]}</button>
      </div>`;

    const cardsHtml = MAPS.map(map => {
      const canPlay  = map.available && (map.free || sub);
      const isLocked = map.available && !map.free && !sub;
      const isSoon   = !map.available;
      let badgeHtml = '', cardClass = '';
      if (isLocked) { badgeHtml = `<span class="sv-map-badge">${ts('map.lock')}</span>`; cardClass = 'locked'; }
      else if (isSoon && !map.free) { badgeHtml = `<span class="sv-map-badge">${ts('map.lock.soon')}</span>`; cardClass = 'soon'; }
      else if (isSoon) { badgeHtml = `<span class="sv-map-badge" style="color:var(--muted)">${ts('map.soon')}</span>`; cardClass = 'soon'; }
      return `
        <div class="sv-map-card ${cardClass}" data-id="${map.id}" data-locked="${isLocked}" data-can="${canPlay}">
          <div class="sv-map-icon">${map.emoji}</div>
          <div class="sv-map-info">
            <div class="sv-map-name">${ts('map.' + map.id + '.name')}</div>
            <div class="sv-map-desc">${isSoon ? ts('map.soon') : ts('map.' + map.id + '.desc')}</div>
          </div>
          ${badgeHtml}
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="sv-screen">
        <h2 class="sv-screen-title">${ts('map.title')}</h2>
        <p class="sv-screen-sub">${ts('map.sub')}</p>
        ${subBanner}
        <div class="sv-map-grid">${cardsHtml}</div>
      </div>`;

    container.querySelector('#sv-btn-sub-banner')?.addEventListener('click', showSubModal);

    container.querySelectorAll('.sv-map-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') { showSubModal(); return; }
        if (card.dataset.can !== 'true') return;
        showItemSelect(card.dataset.id);
      });
    });
  }

  async function showItemSelect(mapId) {
    state.map = mapId;
    container.innerHTML = `<div class="sv-screen"><p class="sv-screen-sub">${ts('map.sub')}...</p></div>`;

    await ensureStagesSeeded(mapId);
    state.game = await fetchGameData(mapId);
    if (!state.game) { showMapSelect(); return; }

    const items = Object.entries(state.game.items);

    container.innerHTML = `
      <div class="sv-screen">
        <h2 class="sv-screen-title">${ts('item.title')}</h2>
        <p class="sv-screen-sub">${ts('item.sub')}</p>
        <div class="sv-item-grid" id="sv-item-grid">
          ${items.map(([id, it]) => {
            const l = sl(it);
            return `
              <div class="sv-item-card" data-id="${id}">
                <div class="sv-item-icon">${it.emoji || ''}</div>
                <div class="sv-item-name">${l?.label || ''}</div>
                <div class="sv-item-desc">${l?.desc || ''}</div>
              </div>`;
          }).join('')}
        </div>
        <button class="btn-primary" id="sv-btn-start" disabled>${ts('item.start')}</button>
      </div>`;

    let selected = [];
    container.querySelectorAll('.sv-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (card.classList.contains('selected')) {
          card.classList.remove('selected');
          selected = selected.filter(s => s !== id);
        } else if (selected.length < 2) {
          card.classList.add('selected');
          selected.push(id);
        }
        container.querySelector('#sv-btn-start').disabled = selected.length !== 2;
      });
    });
    container.querySelector('#sv-btn-start').addEventListener('click', () => startGame(selected));
  }

  function startGame(items) {
    state.health   = 100;
    state.hunger   = 100;
    state.items    = [...items];
    state.stageIdx = 0;
    state.piEarned = 0;
    state.quizUsesLeft = 2; // 생명이 위험할 때 회복 기회로 주는 퀴즈 — 플레이당 최대 2회
    state.quizHostIdx  = 0;

    container.innerHTML = `
      <div class="sv-game-wrap">
        <div class="sv-stat-bar">
          <div class="sv-stat-group">
            <span class="sv-stat-icon">❤️</span>
            <div class="sv-stat-track"><div class="sv-stat-fill" id="sv-fill-health"></div></div>
            <span class="sv-stat-num" id="health-val">100</span>
          </div>
          <div class="sv-stat-group">
            <span class="sv-stat-icon">🍖</span>
            <div class="sv-stat-track"><div class="sv-stat-fill hunger" id="sv-fill-hunger"></div></div>
            <span class="sv-stat-num" id="hunger-val">100</span>
          </div>
          <div class="sv-stat-right">
            <span id="sv-stat-day">Stage 1</span>
            <span id="sv-stat-pi">⬡ 0π</span>
          </div>
        </div>
        <div class="sv-item-strip" id="sv-item-strip"></div>
        <div class="sv-scene-box" id="sv-scene-box">
          <div class="sv-scene-title" id="sv-scene-title"></div>
          <div class="sv-scene-text"  id="sv-scene-text"></div>
        </div>
        <div class="sv-choices-box" id="sv-choices-box"></div>
      </div>`;

    updateStats();
    renderItems();
    loadStage(0);
  }

  function loadStage(stageIdx) {
    const variants = state.game?.stages?.[stageIdx];
    if (!variants || !variants.length) {
      const box = container.querySelector('#sv-choices-box');
      if (box) box.innerHTML = `<p style="color:#f87171;padding:12px;">⚠️ Stage ${stageIdx} data missing (game=${!!state.game}, stages=${state.game?.stages?.length}). Please screenshot this and report it.</p>`;
      return;
    }
    state.stageIdx = stageIdx;
    let variant;
    try {
      variant = pickVariant(variants);
    } catch (e) {
      const box = container.querySelector('#sv-choices-box');
      if (box) box.innerHTML = `<p style="color:#f87171;padding:12px;">⚠️ pickVariant error: ${e.message}. Please screenshot this and report it.</p>`;
      return;
    }
    state.currentVariant = variant;
    applyEffect(variant.effect);
    // 시간 경과에 따른 기본 소모 — 안전한 선택만 골라도 자원이 계속 줄어들게 해서
    // 난이도를 확보하고 랭킹(도달 스테이지)이 실제로 변별력을 갖게 함
    if (!variant.isEnd) applyEffect({ health: -3, hunger: -8 });
    updateStats();

    // 생명이 많이 깎였을 때(위험 상태) 퀴즈로 회복 기회를 줌 — 플레이당 최대 2회
    const HEALTH_QUIZ_THRESHOLD = 30;
    if (!variant.isEnd && state.health > 0 && state.health <= HEALTH_QUIZ_THRESHOLD && state.quizUsesLeft > 0) {
      state.quizUsesLeft--;
      showHealthQuiz(() => proceedAfterEffect(variant, stageIdx));
      return;
    }
    proceedAfterEffect(variant, stageIdx);
  }

  function proceedAfterEffect(variant, stageIdx) {
    if (!variant.isEnd && (state.health <= 0 || state.hunger <= 0)) {
      const type = state.health <= 0 ? 'injury' : 'hunger';
      showEnd(false, type, type === 'injury' ? ts('end.death.injury') : ts('end.death.hunger'));
      return;
    }

    const l = sl(variant);
    const titleEl = container.querySelector('#sv-scene-title');
    const textEl  = container.querySelector('#sv-scene-text');
    if (titleEl) titleEl.textContent = l?.title || '';
    if (textEl) {
      textEl.style.opacity = '0';
      textEl.style.whiteSpace = 'pre-line';
      textEl.textContent = l?.text || '';
      requestAnimationFrame(() => {
        textEl.style.transition = 'opacity 0.4s';
        textEl.style.opacity    = '1';
      });
    }

    if (variant.isEnd) {
      if (variant.pi) { state.piEarned += variant.pi; updateStats(); }
      const endText = variant.endTexts ? (variant.endTexts[storyLang()] || variant.endTexts.en) : '';
      setTimeout(() => showEnd(true, variant.endType || 'success', endText), 900);
      return;
    }
    renderChoices(variant.choices || []);
  }

  function showHealthQuiz(onDone) {
    const host = QUIZ_HOSTS[state.quizHostIdx % QUIZ_HOSTS.length];
    state.quizHostIdx++;
    const q = ALL_QUIZ[Math.floor(Math.random() * ALL_QUIZ.length)];
    const lang = storyLang();
    const titleEl = container.querySelector('#sv-scene-title');
    const textEl  = container.querySelector('#sv-scene-text');
    const box     = container.querySelector('#sv-choices-box');
    if (titleEl) titleEl.textContent = `🧠 ${host.name[lang] || host.name.en}`;
    if (textEl) {
      textEl.style.whiteSpace = 'pre-line';
      textEl.style.opacity = '1';
      textEl.textContent = q.q;
    }
    if (!box) return;
    box.innerHTML = q.choices.map((c, i) => `
      <button class="sv-choice-btn" data-qi="${i}">
        <span class="sv-choice-text">${esc(c)}</span>
      </button>`).join('');

    box.querySelectorAll('[data-qi]').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          box.querySelectorAll('[data-qi]').forEach(b => b.disabled = true);
          const correct = parseInt(btn.dataset.qi, 10) === q.answer;
          const line = (correct ? host.correct[lang] : host.wrong[lang]) || (correct ? host.correct.en : host.wrong.en);
          if (correct) { applyEffect({ health: 30 }); state.piEarned += 5; }
          else { applyEffect({ hunger: -5 }); }
          updateStats();
          if (textEl) textEl.textContent = line;
          box.innerHTML = `<p style="padding:8px 12px;color:${correct ? '#22c55e' : '#f0b429'};">${correct ? '✅' : '😅'} ${esc(q.explanation || '')}</p>`;
          setTimeout(onDone, 1600);
        } catch (e) {
          box.innerHTML = `<p style="color:#f87171;padding:12px;">⚠️ Quiz error: ${e.message}. Please screenshot this and report it.</p>`;
        }
      });
    });
  }

  function renderChoices(choices) {
    const box = container.querySelector('#sv-choices-box');
    if (!box) return;
    box.innerHTML = choices.map((c, i) => {
      const ok      = hasRequired(c.requires);
      const piLabel = c.pi ? `<span class="sv-choice-pi">${c.pi > 0 ? '+' : ''}${c.pi}π</span>` : '';
      const text    = c[storyLang()] || c.en || c.ko;
      const reqHint = !ok ? `<span class="sv-choice-req"></span>` : '';
      return `
        <button class="sv-choice-btn ${ok ? '' : 'disabled'}" data-idx="${i}" ${ok ? '' : 'disabled'}>
          <span class="sv-choice-text">${text}</span>
          ${piLabel}${reqHint}
        </button>`;
    }).join('');

    box.querySelectorAll('.sv-choice-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          box.querySelectorAll('.sv-choice-btn').forEach(b => b.disabled = true);
          makeChoice(choices[parseInt(btn.dataset.idx)]);
        } catch (e) {
          box.innerHTML = `<p style="color:#f87171;padding:12px;">⚠️ Choice error: ${e.message}. Please screenshot this and report it.</p>`;
        }
      });
    });
  }

  function makeChoice(choice) {
    if (choice.pi) { state.piEarned += choice.pi; updateStats(); }
    applyEffect(choice.effect);
    updateStats();
    const nextIdx = state.stageIdx + 1;
    setTimeout(() => {
      try { loadStage(nextIdx); }
      catch (e) {
        const box = container.querySelector('#sv-choices-box');
        if (box) box.innerHTML = `<p style="color:#f87171;padding:12px;">⚠️ loadStage error: ${e.message}. Please screenshot this and report it.</p>`;
      }
    }, 250);
  }

  function showEnd(isSuccess, endType, endText) {
    const meta = END_META[endType] || { icon: '💀', titleKey: 'end.default.title' };
    container.innerHTML = `
      <div class="sv-screen sv-end-screen ${isSuccess ? 'success' : 'fail'}">
        <div class="sv-end-icon">${meta.icon}</div>
        <h2 class="sv-end-title">${ts(meta.titleKey)}</h2>
        <p class="sv-end-text">${endText || ''}</p>
        ${isSuccess ? `
          <div class="sv-end-stats">
            <div class="sv-end-stat"><span>${ts('end.days')}</span><strong>${state.stageIdx + 1}${ts('end.days.unit')}</strong></div>
            <div class="sv-end-stat"><span>${ts('end.pi')}</span><strong>⬡ ${state.piEarned}π</strong></div>
          </div>` : ''}
        <div id="sv-lb-section">
          <div class="sv-lb-loading">${ts('lb.loading')}</div>
        </div>
        <div class="sv-end-btns">
          <button class="btn-outline" id="sv-btn-retry">${ts('end.retry')}</button>
          <button class="btn-primary" id="sv-btn-home">${ts('end.home')}</button>
        </div>
      </div>`;

    container.querySelector('#sv-btn-retry').addEventListener('click', () => showItemSelect(state.map));
    container.querySelector('#sv-btn-home').addEventListener('click', () => showMapSelect());

    if (isSuccess) submitAndShowLeaderboard();
    else           loadLeaderboard();
  }

  async function submitAndShowLeaderboard() {
    let submitFailed = false;
    try { await submitSurvivalScore(state.username, state.map, state.stageIdx + 1, state.piEarned, detectCountry()); }
    catch (e) { console.warn('랭킹 등록 실패:', e); submitFailed = true; }
    loadLeaderboard(submitFailed);
  }

  async function loadLeaderboard(submitFailed = false) {
    const sec = container.querySelector('#sv-lb-section');
    if (!sec) return;
    const mapName = ts('map.' + state.map + '.name');
    const lbTitle = `${ts('lb.title')} — ${mapName}`;
    const submitFailHtml = submitFailed ? `<p class="sv-lb-empty" style="color:#f87171;">⚠️ ${ts('lb.submit.fail')}</p>` : '';
    try {
      const rows = await fetchSurvivalLeaderboard(state.map);
      if (!rows.length) {
        sec.innerHTML = `<div class="sv-lb-title">${lbTitle}</div>${submitFailHtml}<p class="sv-lb-empty">${ts('lb.empty')}</p>`;
        return;
      }
      sec.innerHTML = `
        <div class="sv-lb-title">${lbTitle}</div>
        ${submitFailHtml}
        <div class="sv-lb-table">
          <div class="sv-lb-head">
            <span>${ts('lb.head.rank')}</span>
            <span>${ts('lb.head.pioneer')}</span>
            <span>${ts('lb.head.days')}</span>
            <span>${ts('lb.head.pi')}</span>
          </div>
          ${rows.map((r, i) => {
            const flag = r.country ? countryToFlag(r.country) : '';
            return `
            <div class="sv-lb-row ${r.username === state.username ? 'sv-lb-me' : ''}">
              <span>${i + 1}</span>
              <span>${flag ? `${flag} ` : ''}${r.username}</span>
              <span>${r.days}</span>
              <span>⬡ ${r.pi_earned || 0}π</span>
            </div>`;
          }).join('')}
        </div>`;
    } catch {
      sec.innerHTML = `<p class="sv-lb-empty">${ts('lb.fail')}</p>`;
    }
  }

  function showSubModal() {
    const sub = isSubscribed();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;">
        <div class="modal-header">
          <span>🌍 ${ts('sub.prompt')}</span>
          <button class="modal-close" id="sv-sub-close">✕</button>
        </div>
        <div style="padding:16px;">
          ${sub ? `<p style="color:var(--accent);text-align:center;padding:12px 0;">${ts('sub.badge')}</p>` : `
            <button class="btn-primary" id="sv-btn-do-sub" style="width:100%;margin-bottom:8px;">${ts('sub.btn')}</button>
            <button class="btn-outline" id="sv-btn-do-restore" style="width:100%;">${ts('sub.restore')}</button>
            <p id="sv-sub-msg" style="font-size:12px;text-align:center;margin-top:8px;min-height:16px;"></p>
          `}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#sv-sub-close').onclick = () => overlay.remove();

    const doSub = overlay.querySelector('#sv-btn-do-sub');
    const doRestore = overlay.querySelector('#sv-btn-do-restore');
    const msg = overlay.querySelector('#sv-sub-msg');

    doSub?.addEventListener('click', async () => {
      doSub.disabled = true;
      doSub.textContent = '...';
      try {
        await createSubscriptionPayment();
        setSubscription();
        overlay.remove();
        showMapSelect();
      } catch (err) {
        if (err?.message !== 'cancelled') {
          if (msg) msg.textContent = ts('sub.error');
        }
        doSub.disabled = false;
        doSub.textContent = ts('sub.btn');
      }
    });

    doRestore?.addEventListener('click', async () => {
      doRestore.disabled = true;
      doRestore.textContent = ts('sub.restoring');
      try {
        await syncSubscription(state.username);
        if (isSubscribed()) {
          overlay.remove();
          showMapSelect();
        } else {
          if (msg) msg.textContent = ts('sub.restore.none');
          doRestore.disabled = false;
          doRestore.textContent = ts('sub.restore');
        }
      } catch {
        if (msg) msg.textContent = ts('sub.restore.none');
        doRestore.disabled = false;
        doRestore.textContent = ts('sub.restore');
      }
    });
  }

  showMapSelect();
}
