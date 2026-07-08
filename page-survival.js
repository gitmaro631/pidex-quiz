import { t, getLang } from './util-i18n.js';
import { isSubscribed, setSubscription } from './util-storage.js';
import { syncSubscription } from './pi-sdk.js';
import { submitSurvivalScore, fetchSurvivalLeaderboard } from './firebase.js';
import { JUNGLE }     from './stories/jungle.js';
import { DESERT }     from './stories/desert.js';
import { MOUNTAIN }   from './stories/mountain.js';
import { UNDERWATER } from './stories/underwater.js';
import { SPACE }      from './stories/space.js';
import { ALIEN }      from './stories/alien.js';
import { ISLAND }     from './stories/island.js';
import { ARCTIC }     from './stories/arctic.js';
import { SAVANNA }    from './stories/savanna.js';
import { VOLCANO }    from './stories/volcano.js';
import { RADIATION }  from './stories/radiation.js';

const STORIES = {
  jungle: JUNGLE, desert: DESERT, mountain: MOUNTAIN,
  underwater: UNDERWATER, space: SPACE, alien: ALIEN,
  island: ISLAND, arctic: ARCTIC, savanna: SAVANNA,
  volcano: VOLCANO, radiation: RADIATION,
};

const MAPS = [
  { id: 'jungle',    emoji: '🌿', free: true,  available: true  },
  { id: 'desert',    emoji: '🏜️', free: true,  available: true  },
  { id: 'mountain',  emoji: '🏔️', free: true,  available: true  },
  { id: 'underwater',emoji: '🌊', free: false, available: true  },
  { id: 'space',     emoji: '🚀', free: false, available: true  },
  { id: 'alien',     emoji: '👽', free: false, available: false },
  { id: 'island',    emoji: '🏝️', free: false, available: false },
  { id: 'arctic',    emoji: '🧊', free: false, available: false },
  { id: 'savanna',   emoji: '🦁', free: false, available: false },
  { id: 'volcano',   emoji: '🌋', free: false, available: false },
  { id: 'radiation', emoji: '☢️', free: false, available: false },
];

const END_META = {
  success  : { icon: '🏕️', titleKey: 'end.success.title' },
  injury   : { icon: '💀', titleKey: 'end.injury.title'  },
  hunger   : { icon: '💀', titleKey: 'end.hunger.title'  },
  illness  : { icon: '☠️', titleKey: 'end.illness.title' },
  criminal : { icon: '⛓️', titleKey: 'end.criminal.title'},
};

// ── 생존게임 로컬 번역 (pidex_quiz 18개 언어 중 11개 지원, 나머지는 영어 폴백) ──
const ST = {
  ko: {
    'map.title': '🗺️ 생존 맵 선택', 'map.sub': '플레이할 맵을 선택하세요', 'map.lock': '🔒 구독 필요', 'map.lock.soon': '🔒 출시 예정', 'map.soon': '준비 중',
    'map.jungle.name': '아마존 정글', 'map.jungle.desc': '헬기 추락 · 최대 4일',
    'map.desert.name': '사하라 사막', 'map.desert.desc': '유적 탐사 중 조난 · 3일',
    'map.mountain.name': '히말라야 고산', 'map.mountain.desc': '눈사태 · 해발 4800m',
    'map.underwater.name': '심해 기지', 'map.underwater.desc': '수심 180m · 지진 발생',
    'map.space.name': '우주 정거장', 'map.space.desc': 'ISS-2 · 소행성 충돌',
    'map.alien.name': '외계 행성', 'map.alien.desc': 'KEPLER-3 · 착륙선 고장',
    'map.island.name': '태평양 무인도', 'map.island.desc': '크루즈 침몰 · 절해고도',
    'map.arctic.name': '남극 설원', 'map.arctic.desc': '설상차 추락 · 영하 38도',
    'map.savanna.name': '아프리카 사바나', 'map.savanna.desc': '사파리 전복 · 사자 영역',
    'map.volcano.name': '화산섬', 'map.volcano.desc': '갑작스런 분화 · 탈출 시한',
    'map.radiation.name': '방사능 구역', 'map.radiation.desc': '군사 사고 · 15km 탈출',
    'item.title': '🎒 아이템 선택', 'item.sub': '2가지 아이템을 골라 생존을 시작하세요', 'item.start': '생존 시작',
    'end.success.title': '생존 성공!', 'end.injury.title': '부상으로 사망', 'end.hunger.title': '굶주림으로 사망',
    'end.illness.title': '질병으로 사망', 'end.criminal.title': '체포됨', 'end.default.title': '사망',
    'end.death.injury': '심각한 부상으로 사망했습니다.', 'end.death.hunger': '굶주림으로 사망했습니다.',
    'end.days': '생존 일수', 'end.days.unit': '일', 'end.pi': '획득 π',
    'end.retry': '🔄 다시 도전', 'end.home': '🗺️ 맵 선택',
    'lb.title': '생존 랭킹', 'lb.loading': '랭킹 불러오는 중...', 'lb.empty': '아직 기록이 없습니다.',
    'lb.fail': '랭킹 불러오기 실패', 'lb.head.rank': '순위', 'lb.head.pioneer': '파이오니어', 'lb.head.days': '일수', 'lb.head.pi': '획득 π',
    'sub.badge': '⭐ 구독 중', 'sub.free': '무료', 'sub.prompt': '구독하면 모든 맵 잠금 해제!',
    'sub.btn': '구독 (1π/월)', 'sub.restore': '구독 복원', 'sub.restoring': '복원 중...',
    'sub.memo': '생존게임 1개월 이용권', 'sub.success': '구독 완료!', 'sub.error': '결제 오류가 발생했습니다.',
    'sub.restore.none': '복원할 구독 기록이 없습니다.',
  },
  en: {
    'map.title': '🗺️ Choose Survival Map', 'map.sub': 'Select a map to start', 'map.lock': '🔒 Subscription Required', 'map.lock.soon': '🔒 Coming Soon', 'map.soon': 'Coming Soon',
    'map.jungle.name': 'Amazon Jungle', 'map.jungle.desc': 'Helicopter crash · Up to 4 days',
    'map.desert.name': 'Sahara Desert', 'map.desert.desc': 'Lost on expedition · 3 days',
    'map.mountain.name': 'Himalayan Peak', 'map.mountain.desc': 'Avalanche · 4800m altitude',
    'map.underwater.name': 'Deep Sea Base', 'map.underwater.desc': '180m depth · Earthquake',
    'map.space.name': 'Space Station', 'map.space.desc': 'ISS-2 · Asteroid impact',
    'map.alien.name': 'Alien Planet', 'map.alien.desc': 'KEPLER-3 · Lander malfunction',
    'map.island.name': 'Pacific Island', 'map.island.desc': 'Cruise sunk · Remote island',
    'map.arctic.name': 'Antarctic Tundra', 'map.arctic.desc': 'Snow vehicle crash · -38°C',
    'map.savanna.name': 'African Savanna', 'map.savanna.desc': 'Safari rollover · Lion territory',
    'map.volcano.name': 'Volcanic Island', 'map.volcano.desc': 'Sudden eruption · Escape deadline',
    'map.radiation.name': 'Radiation Zone', 'map.radiation.desc': 'Military accident · 15km escape',
    'item.title': '🎒 Choose Items', 'item.sub': 'Pick 2 items to start survival', 'item.start': 'Start Survival',
    'end.success.title': 'Survived!', 'end.injury.title': 'Died from Injury', 'end.hunger.title': 'Died from Hunger',
    'end.illness.title': 'Died from Illness', 'end.criminal.title': 'Arrested', 'end.default.title': 'Dead',
    'end.death.injury': 'You died from severe injuries.', 'end.death.hunger': 'You died of hunger.',
    'end.days': 'Days Survived', 'end.days.unit': ' days', 'end.pi': 'π Earned',
    'end.retry': '🔄 Try Again', 'end.home': '🗺️ Map Select',
    'lb.title': 'Survival Ranking', 'lb.loading': 'Loading ranking...', 'lb.empty': 'No records yet.',
    'lb.fail': 'Failed to load ranking', 'lb.head.rank': 'Rank', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Days', 'lb.head.pi': 'π Earned',
    'sub.badge': '⭐ Subscribed', 'sub.free': 'Free', 'sub.prompt': 'Subscribe to unlock all maps!',
    'sub.btn': 'Subscribe (1π/mo)', 'sub.restore': 'Restore Subscription', 'sub.restoring': 'Restoring...',
    'sub.memo': 'Survival Game 1-month pass', 'sub.success': 'Subscription activated!', 'sub.error': 'Payment error occurred.',
    'sub.restore.none': 'No subscription found to restore.',
  },
  zh: {
    'map.title': '🗺️ 选择生存地图', 'map.sub': '选择地图开始', 'map.lock': '🔒 需要订阅', 'map.lock.soon': '🔒 即将推出', 'map.soon': '即将推出',
    'map.jungle.name': '亚马逊丛林', 'map.jungle.desc': '直升机坠毁·最多4天',
    'map.desert.name': '撒哈拉沙漠', 'map.desert.desc': '探险迷路·3天',
    'map.mountain.name': '喜马拉雅山峰', 'map.mountain.desc': '雪崩·海拔4800米',
    'map.underwater.name': '深海基地', 'map.underwater.desc': '水深180米·地震',
    'map.space.name': '空间站', 'map.space.desc': 'ISS-2·小行星撞击',
    'map.alien.name': '外星球', 'map.alien.desc': 'KEPLER-3·着陆器故障',
    'map.island.name': '太平洋荒岛', 'map.island.desc': '游轮沉没·绝海孤岛',
    'map.arctic.name': '南极雪原', 'map.arctic.desc': '雪地车坠毁·零下38度',
    'map.savanna.name': '非洲草原', 'map.savanna.desc': '越野车翻车·狮子领地',
    'map.volcano.name': '火山岛', 'map.volcano.desc': '突然喷发·逃脱时限',
    'map.radiation.name': '辐射区', 'map.radiation.desc': '军事事故·逃脱15公里',
    'item.title': '🎒 选择道具', 'item.sub': '选择2件道具开始生存', 'item.start': '开始生存',
    'end.success.title': '生存成功！', 'end.injury.title': '因伤死亡', 'end.hunger.title': '因饥饿死亡',
    'end.illness.title': '因疾病死亡', 'end.criminal.title': '被逮捕', 'end.default.title': '死亡',
    'end.death.injury': '因重伤死亡。', 'end.death.hunger': '因饥饿死亡。',
    'end.days': '生存天数', 'end.days.unit': '天', 'end.pi': '获得π',
    'end.retry': '🔄 再试一次', 'end.home': '🗺️ 地图选择',
    'lb.title': '生存排名', 'lb.loading': '加载排名...', 'lb.empty': '暂无记录。',
    'lb.fail': '加载排名失败', 'lb.head.rank': '排名', 'lb.head.pioneer': '先锋', 'lb.head.days': '天数', 'lb.head.pi': '获得π',
    'sub.badge': '⭐ 已订阅', 'sub.free': '免费', 'sub.prompt': '订阅解锁所有地图！',
    'sub.btn': '订阅 (1π/月)', 'sub.restore': '恢复订阅', 'sub.restoring': '恢复中...',
    'sub.memo': '生存游戏1个月通行证', 'sub.success': '订阅激活！', 'sub.error': '支付错误。',
    'sub.restore.none': '未找到可恢复的订阅。',
  },
  id: {
    'map.title': '🗺️ Pilih Peta Survival', 'map.sub': 'Pilih peta untuk mulai', 'map.lock': '🔒 Perlu Langganan', 'map.lock.soon': '🔒 Segera Hadir', 'map.soon': 'Segera Hadir',
    'map.jungle.name': 'Hutan Amazon', 'map.jungle.desc': 'Helikopter jatuh · Maks 4 hari',
    'map.desert.name': 'Gurun Sahara', 'map.desert.desc': 'Tersesat saat ekspedisi · 3 hari',
    'map.mountain.name': 'Puncak Himalaya', 'map.mountain.desc': 'Longsor salju · 4800m',
    'map.underwater.name': 'Basis Laut Dalam', 'map.underwater.desc': 'Kedalaman 180m · Gempa',
    'map.space.name': 'Stasiun Luar Angkasa', 'map.space.desc': 'ISS-2 · Dampak asteroid',
    'map.alien.name': 'Planet Asing', 'map.alien.desc': 'KEPLER-3 · Pendarat rusak',
    'map.island.name': 'Pulau Terpencil', 'map.island.desc': 'Kapal tenggelam · Pulau terpencil',
    'map.arctic.name': 'Tundra Antartika', 'map.arctic.desc': 'Kendaraan salju jatuh · -38°C',
    'map.savanna.name': 'Sabana Afrika', 'map.savanna.desc': 'Safari terguling · Wilayah singa',
    'map.volcano.name': 'Pulau Vulkanik', 'map.volcano.desc': 'Letusan mendadak · Batas waktu',
    'map.radiation.name': 'Zona Radiasi', 'map.radiation.desc': 'Kecelakaan militer · Kabur 15km',
    'item.title': '🎒 Pilih Item', 'item.sub': 'Pilih 2 item untuk memulai', 'item.start': 'Mulai Survival',
    'end.success.title': 'Selamat!', 'end.injury.title': 'Mati karena Cedera', 'end.hunger.title': 'Mati karena Lapar',
    'end.illness.title': 'Mati karena Penyakit', 'end.criminal.title': 'Ditangkap', 'end.default.title': 'Mati',
    'end.death.injury': 'Kamu mati karena cedera parah.', 'end.death.hunger': 'Kamu mati karena kelaparan.',
    'end.days': 'Hari Bertahan', 'end.days.unit': ' hari', 'end.pi': 'π Diperoleh',
    'end.retry': '🔄 Coba Lagi', 'end.home': '🗺️ Pilih Peta',
    'lb.title': 'Peringkat Survival', 'lb.loading': 'Memuat peringkat...', 'lb.empty': 'Belum ada catatan.',
    'lb.fail': 'Gagal memuat peringkat', 'lb.head.rank': 'Peringkat', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Hari', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Berlangganan', 'sub.free': 'Gratis', 'sub.prompt': 'Berlangganan untuk membuka semua peta!',
    'sub.btn': 'Berlangganan (1π/bln)', 'sub.restore': 'Pulihkan Langganan', 'sub.restoring': 'Memulihkan...',
    'sub.memo': 'Langganan Survival 1 bulan', 'sub.success': 'Langganan aktif!', 'sub.error': 'Kesalahan pembayaran.',
    'sub.restore.none': 'Tidak ada langganan untuk dipulihkan.',
  },
  ja: {
    'map.title': '🗺️ サバイバルマップ選択', 'map.sub': 'マップを選んでください', 'map.lock': '🔒 サブスク必要', 'map.lock.soon': '🔒 近日公開', 'map.soon': '準備中',
    'map.jungle.name': 'アマゾンジャングル', 'map.jungle.desc': 'ヘリ墜落・最大4日',
    'map.desert.name': 'サハラ砂漠', 'map.desert.desc': '遺跡探索中に遭難・3日',
    'map.mountain.name': 'ヒマラヤ高山', 'map.mountain.desc': '雪崩・標高4800m',
    'map.underwater.name': '深海基地', 'map.underwater.desc': '水深180m・地震発生',
    'map.space.name': '宇宙ステーション', 'map.space.desc': 'ISS-2・小惑星衝突',
    'map.alien.name': '異星球', 'map.alien.desc': 'KEPLER-3・着陸船故障',
    'map.island.name': '太平洋無人島', 'map.island.desc': 'クルーズ沈没・絶海孤島',
    'map.arctic.name': '南極雪原', 'map.arctic.desc': 'スノーモービル墜落・零下38度',
    'map.savanna.name': 'アフリカサバンナ', 'map.savanna.desc': 'サファリ転覆・ライオン領域',
    'map.volcano.name': '火山島', 'map.volcano.desc': '突然の噴火・脱出期限',
    'map.radiation.name': '放射能区域', 'map.radiation.desc': '軍事事故・15km脱出',
    'item.title': '🎒 アイテム選択', 'item.sub': '2つのアイテムを選んでください', 'item.start': 'サバイバル開始',
    'end.success.title': '生存成功！', 'end.injury.title': '負傷により死亡', 'end.hunger.title': '飢えにより死亡',
    'end.illness.title': '病気により死亡', 'end.criminal.title': '逮捕された', 'end.default.title': '死亡',
    'end.death.injury': '重傷により死亡しました。', 'end.death.hunger': '飢えにより死亡しました。',
    'end.days': '生存日数', 'end.days.unit': '日', 'end.pi': '獲得π',
    'end.retry': '🔄 再挑戦', 'end.home': '🗺️ マップ選択',
    'lb.title': 'サバイバルランキング', 'lb.loading': 'ランキング読込中...', 'lb.empty': 'まだ記録がありません。',
    'lb.fail': 'ランキング読込失敗', 'lb.head.rank': '順位', 'lb.head.pioneer': 'パイオニア', 'lb.head.days': '日数', 'lb.head.pi': '獲得π',
    'sub.badge': '⭐ 購読中', 'sub.free': '無料', 'sub.prompt': '購読して全マップを解放！',
    'sub.btn': '購読 (1π/月)', 'sub.restore': '購読を復元', 'sub.restoring': '復元中...',
    'sub.memo': 'サバイバル1ヶ月利用券', 'sub.success': '購読完了！', 'sub.error': '決済エラーが発生しました。',
    'sub.restore.none': '復元できる購読がありません。',
  },
  vi: {
    'map.title': '🗺️ Chọn Bản Đồ Sinh Tồn', 'map.sub': 'Chọn bản đồ để bắt đầu', 'map.lock': '🔒 Cần Đăng Ký', 'map.lock.soon': '🔒 Sắp Ra Mắt', 'map.soon': 'Sắp Ra Mắt',
    'map.jungle.name': 'Rừng Amazon', 'map.jungle.desc': 'Trực thăng rơi · Tối đa 4 ngày',
    'map.desert.name': 'Sa Mạc Sahara', 'map.desert.desc': 'Lạc đường · 3 ngày',
    'map.mountain.name': 'Đỉnh Himalaya', 'map.mountain.desc': 'Lở tuyết · 4800m',
    'map.underwater.name': 'Căn Cứ Biển Sâu', 'map.underwater.desc': 'Sâu 180m · Động đất',
    'map.space.name': 'Trạm Vũ Trụ', 'map.space.desc': 'ISS-2 · Va chạm thiên thạch',
    'map.alien.name': 'Hành Tinh Ngoài Hành Tinh', 'map.alien.desc': 'KEPLER-3 · Tàu đổ bộ hỏng',
    'map.island.name': 'Đảo Hoang Thái Bình Dương', 'map.island.desc': 'Tàu chìm · Đảo hẻo lánh',
    'map.arctic.name': 'Băng Tuyết Nam Cực', 'map.arctic.desc': 'Xe tuyết rơi · -38°C',
    'map.savanna.name': 'Đồng Cỏ Châu Phi', 'map.savanna.desc': 'Safari lật · Lãnh thổ sư tử',
    'map.volcano.name': 'Đảo Núi Lửa', 'map.volcano.desc': 'Phun trào đột ngột · Giới hạn thoát',
    'map.radiation.name': 'Khu Phóng Xạ', 'map.radiation.desc': 'Tai nạn quân sự · Thoát 15km',
    'item.title': '🎒 Chọn Vật Phẩm', 'item.sub': 'Chọn 2 vật phẩm để bắt đầu', 'item.start': 'Bắt Đầu Sinh Tồn',
    'end.success.title': 'Sống Sót!', 'end.injury.title': 'Chết Vì Thương Tích', 'end.hunger.title': 'Chết Vì Đói',
    'end.illness.title': 'Chết Vì Bệnh', 'end.criminal.title': 'Bị Bắt', 'end.default.title': 'Chết',
    'end.death.injury': 'Bạn chết vì vết thương nặng.', 'end.death.hunger': 'Bạn chết vì đói.',
    'end.days': 'Ngày Sống Sót', 'end.days.unit': ' ngày', 'end.pi': 'π Kiếm Được',
    'end.retry': '🔄 Thử Lại', 'end.home': '🗺️ Chọn Bản Đồ',
    'lb.title': 'Bảng Xếp Hạng Sinh Tồn', 'lb.loading': 'Đang tải...', 'lb.empty': 'Chưa có kỷ lục.',
    'lb.fail': 'Không thể tải bảng xếp hạng', 'lb.head.rank': 'Hạng', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Ngày', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Đã Đăng Ký', 'sub.free': 'Miễn Phí', 'sub.prompt': 'Đăng ký để mở khóa tất cả bản đồ!',
    'sub.btn': 'Đăng Ký (1π/tháng)', 'sub.restore': 'Khôi Phục Đăng Ký', 'sub.restoring': 'Đang khôi phục...',
    'sub.memo': 'Gói 1 tháng Survival', 'sub.success': 'Đăng ký thành công!', 'sub.error': 'Lỗi thanh toán.',
    'sub.restore.none': 'Không tìm thấy đăng ký để khôi phục.',
  },
  es: {
    'map.title': '🗺️ Seleccionar Mapa de Supervivencia', 'map.sub': 'Elige un mapa para comenzar', 'map.lock': '🔒 Se requiere suscripción', 'map.lock.soon': '🔒 Próximamente', 'map.soon': 'Próximamente',
    'map.jungle.name': 'Selva Amazónica', 'map.jungle.desc': 'Helicóptero estrellado · Hasta 4 días',
    'map.desert.name': 'Desierto del Sahara', 'map.desert.desc': 'Perdido en expedición · 3 días',
    'map.mountain.name': 'Pico Himalaya', 'map.mountain.desc': 'Avalancha · 4800m de altitud',
    'map.underwater.name': 'Base Submarina', 'map.underwater.desc': '180m de profundidad · Terremoto',
    'map.space.name': 'Estación Espacial', 'map.space.desc': 'ISS-2 · Impacto asteroide',
    'map.alien.name': 'Planeta Alienígena', 'map.alien.desc': 'KEPLER-3 · Aterrizador averiado',
    'map.island.name': 'Isla del Pacífico', 'map.island.desc': 'Crucero hundido · Isla remota',
    'map.arctic.name': 'Tundra Antártica', 'map.arctic.desc': 'Vehículo de nieve estrellado · -38°C',
    'map.savanna.name': 'Sabana Africana', 'map.savanna.desc': 'Safari volcado · Territorio de leones',
    'map.volcano.name': 'Isla Volcánica', 'map.volcano.desc': 'Erupción repentina · Límite de escape',
    'map.radiation.name': 'Zona de Radiación', 'map.radiation.desc': 'Accidente militar · Escape 15km',
    'item.title': '🎒 Elige Objetos', 'item.sub': 'Selecciona 2 objetos para sobrevivir', 'item.start': 'Iniciar Supervivencia',
    'end.success.title': '¡Sobreviviste!', 'end.injury.title': 'Muerto por Lesión', 'end.hunger.title': 'Muerto por Hambre',
    'end.illness.title': 'Muerto por Enfermedad', 'end.criminal.title': 'Arrestado', 'end.default.title': 'Muerto',
    'end.death.injury': 'Moriste por heridas graves.', 'end.death.hunger': 'Moriste de hambre.',
    'end.days': 'Días Sobrevividos', 'end.days.unit': ' días', 'end.pi': 'π Ganados',
    'end.retry': '🔄 Intentar de Nuevo', 'end.home': '🗺️ Seleccionar Mapa',
    'lb.title': 'Ranking de Supervivencia', 'lb.loading': 'Cargando ranking...', 'lb.empty': 'Sin registros todavía.',
    'lb.fail': 'Error al cargar ranking', 'lb.head.rank': 'Rango', 'lb.head.pioneer': 'Pionero', 'lb.head.days': 'Días', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Suscrito', 'sub.free': 'Gratis', 'sub.prompt': '¡Suscríbete para desbloquear todos los mapas!',
    'sub.btn': 'Suscribirse (1π/mes)', 'sub.restore': 'Restaurar Suscripción', 'sub.restoring': 'Restaurando...',
    'sub.memo': 'Pase Survival 1 mes', 'sub.success': '¡Suscripción activada!', 'sub.error': 'Error de pago.',
    'sub.restore.none': 'No se encontró suscripción para restaurar.',
  },
  fr: {
    'map.title': '🗺️ Choisir une Carte de Survie', 'map.sub': 'Sélectionnez une carte pour commencer', 'map.lock': '🔒 Abonnement requis', 'map.lock.soon': '🔒 Bientôt', 'map.soon': 'Bientôt',
    'map.jungle.name': 'Jungle Amazonienne', 'map.jungle.desc': 'Hélicoptère écrasé · Jusqu\'à 4 jours',
    'map.desert.name': 'Désert du Sahara', 'map.desert.desc': 'Perdu en expédition · 3 jours',
    'map.mountain.name': 'Sommet Himalaya', 'map.mountain.desc': 'Avalanche · 4800m d\'altitude',
    'map.underwater.name': 'Base Sous-Marine', 'map.underwater.desc': '180m de profondeur · Séisme',
    'map.space.name': 'Station Spatiale', 'map.space.desc': 'ISS-2 · Impact d\'astéroïde',
    'map.alien.name': 'Planète Extraterrestre', 'map.alien.desc': 'KEPLER-3 · Atterrisseur en panne',
    'map.island.name': 'Île du Pacifique', 'map.island.desc': 'Croisière coulée · Île isolée',
    'map.arctic.name': 'Toundra Antarctique', 'map.arctic.desc': 'Véhicule neige écrasé · -38°C',
    'map.savanna.name': 'Savane Africaine', 'map.savanna.desc': 'Safari renversé · Territoire de lions',
    'map.volcano.name': 'Île Volcanique', 'map.volcano.desc': 'Éruption soudaine · Limite d\'évasion',
    'map.radiation.name': 'Zone de Radiation', 'map.radiation.desc': 'Accident militaire · Fuite 15km',
    'item.title': '🎒 Choisir des Objets', 'item.sub': 'Choisissez 2 objets pour survivre', 'item.start': 'Démarrer la Survie',
    'end.success.title': 'Survécu!', 'end.injury.title': 'Mort de Blessures', 'end.hunger.title': 'Mort de Faim',
    'end.illness.title': 'Mort de Maladie', 'end.criminal.title': 'Arrêté', 'end.default.title': 'Mort',
    'end.death.injury': 'Vous êtes mort de blessures graves.', 'end.death.hunger': 'Vous êtes mort de faim.',
    'end.days': 'Jours Survécus', 'end.days.unit': ' jours', 'end.pi': 'π Gagnés',
    'end.retry': '🔄 Réessayer', 'end.home': '🗺️ Sélection de Carte',
    'lb.title': 'Classement de Survie', 'lb.loading': 'Chargement...', 'lb.empty': 'Pas encore de records.',
    'lb.fail': 'Erreur de chargement', 'lb.head.rank': 'Rang', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Jours', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Abonné', 'sub.free': 'Gratuit', 'sub.prompt': 'Abonnez-vous pour débloquer toutes les cartes!',
    'sub.btn': "S'abonner (1π/mois)", 'sub.restore': "Restaurer l'Abonnement", 'sub.restoring': 'Restauration...',
    'sub.memo': "Pass Survie 1 mois", 'sub.success': "Abonnement activé!", 'sub.error': "Erreur de paiement.",
    'sub.restore.none': "Aucun abonnement à restaurer.",
  },
  pt: {
    'map.title': '🗺️ Escolher Mapa de Sobrevivência', 'map.sub': 'Selecione um mapa para começar', 'map.lock': '🔒 Assinatura Necessária', 'map.lock.soon': '🔒 Em Breve', 'map.soon': 'Em Breve',
    'map.jungle.name': 'Selva Amazônica', 'map.jungle.desc': 'Helicóptero caiu · Até 4 dias',
    'map.desert.name': 'Deserto do Saara', 'map.desert.desc': 'Perdido em expedição · 3 dias',
    'map.mountain.name': 'Pico Himalaia', 'map.mountain.desc': 'Avalanche · 4800m de altitude',
    'map.underwater.name': 'Base Submarina', 'map.underwater.desc': '180m de profundidade · Terremoto',
    'map.space.name': 'Estação Espacial', 'map.space.desc': 'ISS-2 · Impacto de asteroide',
    'map.alien.name': 'Planeta Alienígena', 'map.alien.desc': 'KEPLER-3 · Módulo de pouso quebrado',
    'map.island.name': 'Ilha do Pacífico', 'map.island.desc': 'Cruzeiro afundou · Ilha remota',
    'map.arctic.name': 'Tundra Antártica', 'map.arctic.desc': 'Veículo de neve caiu · -38°C',
    'map.savanna.name': 'Savana Africana', 'map.savanna.desc': 'Safari capotou · Território de leões',
    'map.volcano.name': 'Ilha Vulcânica', 'map.volcano.desc': 'Erupção repentina · Prazo de fuga',
    'map.radiation.name': 'Zona de Radiação', 'map.radiation.desc': 'Acidente militar · Fuga 15km',
    'item.title': '🎒 Escolher Itens', 'item.sub': 'Escolha 2 itens para sobreviver', 'item.start': 'Iniciar Sobrevivência',
    'end.success.title': 'Sobreviveu!', 'end.injury.title': 'Morreu por Lesão', 'end.hunger.title': 'Morreu de Fome',
    'end.illness.title': 'Morreu de Doença', 'end.criminal.title': 'Preso', 'end.default.title': 'Morto',
    'end.death.injury': 'Você morreu de ferimentos graves.', 'end.death.hunger': 'Você morreu de fome.',
    'end.days': 'Dias Sobrevividos', 'end.days.unit': ' dias', 'end.pi': 'π Ganhos',
    'end.retry': '🔄 Tentar Novamente', 'end.home': '🗺️ Selecionar Mapa',
    'lb.title': 'Ranking de Sobrevivência', 'lb.loading': 'Carregando...', 'lb.empty': 'Sem registros ainda.',
    'lb.fail': 'Falha ao carregar ranking', 'lb.head.rank': 'Rank', 'lb.head.pioneer': 'Pioneiro', 'lb.head.days': 'Dias', 'lb.head.pi': 'π',
    'sub.badge': '⭐ Assinante', 'sub.free': 'Grátis', 'sub.prompt': 'Assine para desbloquear todos os mapas!',
    'sub.btn': 'Assinar (1π/mês)', 'sub.restore': 'Restaurar Assinatura', 'sub.restoring': 'Restaurando...',
    'sub.memo': 'Passe Survival 1 mês', 'sub.success': 'Assinatura ativada!', 'sub.error': 'Erro de pagamento.',
    'sub.restore.none': 'Nenhuma assinatura para restaurar.',
  },
  hi: {
    'map.title': '🗺️ सर्वाइवल मैप चुनें', 'map.sub': 'शुरू करने के लिए एक मैप चुनें', 'map.lock': '🔒 सदस्यता आवश्यक', 'map.lock.soon': '🔒 जल्द आ रहा है', 'map.soon': 'जल्द आ रहा है',
    'map.jungle.name': 'अमेज़न जंगल', 'map.jungle.desc': 'हेलिकॉप्टर क्रैश · अधिकतम 4 दिन',
    'map.desert.name': 'सहारा रेगिस्तान', 'map.desert.desc': 'अभियान में खोया · 3 दिन',
    'map.mountain.name': 'हिमालय चोटी', 'map.mountain.desc': 'हिमस्खलन · 4800m ऊंचाई',
    'map.underwater.name': 'गहरे समुद्र की बेस', 'map.underwater.desc': '180m गहराई · भूकंप',
    'map.space.name': 'अंतरिक्ष स्टेशन', 'map.space.desc': 'ISS-2 · क्षुद्रग्रह प्रभाव',
    'map.alien.name': 'विदेशी ग्रह', 'map.alien.desc': 'KEPLER-3 · लैंडर खराब',
    'map.island.name': 'प्रशांत द्वीप', 'map.island.desc': 'क्रूज डूबी · दूरदराज द्वीप',
    'map.arctic.name': 'अंटार्कटिक टुंड्रा', 'map.arctic.desc': 'बर्फ वाहन दुर्घटना · -38°C',
    'map.savanna.name': 'अफ्रीकी सवाना', 'map.savanna.desc': 'सफारी पलटी · शेर क्षेत्र',
    'map.volcano.name': 'ज्वालामुखी द्वीप', 'map.volcano.desc': 'अचानक विस्फोट · भागने की समयसीमा',
    'map.radiation.name': 'विकिरण क्षेत्र', 'map.radiation.desc': 'सैन्य दुर्घटना · 15km भागना',
    'item.title': '🎒 आइटम चुनें', 'item.sub': 'जीवित रहने के लिए 2 आइटम चुनें', 'item.start': 'सर्वाइवल शुरू करें',
    'end.success.title': 'जीवित रहे!', 'end.injury.title': 'चोट से मृत्यु', 'end.hunger.title': 'भूख से मृत्यु',
    'end.illness.title': 'बीमारी से मृत्यु', 'end.criminal.title': 'गिरफ्तार', 'end.default.title': 'मृत',
    'end.death.injury': 'आप गंभीर चोटों से मर गए।', 'end.death.hunger': 'आप भूख से मर गए।',
    'end.days': 'जीवित रहे दिन', 'end.days.unit': ' दिन', 'end.pi': 'π अर्जित',
    'end.retry': '🔄 फिर प्रयास करें', 'end.home': '🗺️ मैप चुनें',
    'lb.title': 'सर्वाइवल रैंकिंग', 'lb.loading': 'लोड हो रहा है...', 'lb.empty': 'अभी कोई रिकॉर्ड नहीं।',
    'lb.fail': 'रैंकिंग लोड विफल', 'lb.head.rank': 'रैंक', 'lb.head.pioneer': 'पायनियर', 'lb.head.days': 'दिन', 'lb.head.pi': 'π',
    'sub.badge': '⭐ सदस्य', 'sub.free': 'मुफ़्त', 'sub.prompt': 'सभी मैप अनलॉक करने के लिए सदस्यता लें!',
    'sub.btn': 'सदस्यता (1π/माह)', 'sub.restore': 'सदस्यता पुनर्स्थापित करें', 'sub.restoring': 'पुनर्स्थापित हो रहा है...',
    'sub.memo': 'Survival 1 माह पास', 'sub.success': 'सदस्यता सक्रिय!', 'sub.error': 'भुगतान त्रुटि।',
    'sub.restore.none': 'कोई सदस्यता नहीं मिली।',
  },
  tl: {
    'map.title': '🗺️ Pumili ng Survival Map', 'map.sub': 'Pumili ng mapa para magsimula', 'map.lock': '🔒 Kailangan ng Subscription', 'map.lock.soon': '🔒 Malapit na', 'map.soon': 'Malapit na',
    'map.jungle.name': 'Amazon Jungle', 'map.jungle.desc': 'Helicopter crash · Hanggang 4 araw',
    'map.desert.name': 'Sahara Desert', 'map.desert.desc': 'Naliligaw sa ekspedisyon · 3 araw',
    'map.mountain.name': 'Himalayan Peak', 'map.mountain.desc': 'Avalanche · 4800m taas',
    'map.underwater.name': 'Deep Sea Base', 'map.underwater.desc': '180m lalim · Lindol',
    'map.space.name': 'Space Station', 'map.space.desc': 'ISS-2 · Asteroid impact',
    'map.alien.name': 'Alien Planet', 'map.alien.desc': 'KEPLER-3 · Sirang lander',
    'map.island.name': 'Pacific Island', 'map.island.desc': 'Nalubog ang cruise · Liblib na isla',
    'map.arctic.name': 'Antarctic Tundra', 'map.arctic.desc': 'Snow vehicle crash · -38°C',
    'map.savanna.name': 'African Savanna', 'map.savanna.desc': 'Nahulog ang safari · Teritoryo ng leon',
    'map.volcano.name': 'Volcanic Island', 'map.volcano.desc': 'Biglang pagsabog · Takdang oras',
    'map.radiation.name': 'Radiation Zone', 'map.radiation.desc': 'Aksidente sa militar · Tumakas ng 15km',
    'item.title': '🎒 Pumili ng Mga Item', 'item.sub': 'Pumili ng 2 item para mabuhay', 'item.start': 'Simulan ang Survival',
    'end.success.title': 'Nakaligtas!', 'end.injury.title': 'Namatay sa Sugat', 'end.hunger.title': 'Namatay sa Gutom',
    'end.illness.title': 'Namatay sa Sakit', 'end.criminal.title': 'Inaresto', 'end.default.title': 'Patay',
    'end.death.injury': 'Namatay ka sa matinding sugat.', 'end.death.hunger': 'Namatay ka sa gutom.',
    'end.days': 'Araw ng Survival', 'end.days.unit': ' araw', 'end.pi': 'π Nakuha',
    'end.retry': '🔄 Subukang Muli', 'end.home': '🗺️ Pumili ng Mapa',
    'lb.title': 'Survival Ranking', 'lb.loading': 'Naglo-load...', 'lb.empty': 'Wala pang rekord.',
    'lb.fail': 'Hindi ma-load ang ranking', 'lb.head.rank': 'Rank', 'lb.head.pioneer': 'Pioneer', 'lb.head.days': 'Araw', 'lb.head.pi': 'π',
    'sub.badge': '⭐ May Subscription', 'sub.free': 'Libre', 'sub.prompt': 'Mag-subscribe para ma-unlock ang lahat ng mapa!',
    'sub.btn': 'Mag-subscribe (1π/buwan)', 'sub.restore': 'I-restore ang Subscription', 'sub.restoring': 'Nire-restore...',
    'sub.memo': 'Survival 1-buwang pass', 'sub.success': 'Na-activate ang subscription!', 'sub.error': 'Error sa pagbabayad.',
    'sub.restore.none': 'Walang subscription na ma-restore.',
  },
};

function ts(key) {
  const lang = getLang();
  return ST[lang]?.[key] ?? ST.en?.[key] ?? key;
}

export function renderSurvivalPage(container, username) {
  let storyEn = null;

  const state = {
    username: username || 'Pioneer',
    map: null,
    story: null,
    health: 100,
    hunger: 100,
    items: [],
    day: 1,
    sceneId: null,
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
    if (d) d.textContent = 'Day ' + state.day;
    const p = container.querySelector('#sv-stat-pi');
    if (p) p.textContent = '⬡ ' + state.piEarned + 'π';
  }

  function renderItems() {
    const el = container.querySelector('#sv-item-strip');
    if (!el) return;
    el.innerHTML = state.items.map(id => {
      const it = state.story.items[id];
      const enIt = storyEn?.items?.[id];
      return it ? `<span class="sv-item-chip">${it.emoji} ${enIt?.label || it.label}</span>` : '';
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
          <div class="sv-map-emoji">${map.emoji}</div>
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
    state.map   = mapId;
    state.story = STORIES[mapId];
    storyEn = null;
    const _lang = getLang();
    if (_lang !== 'ko') {
      try {
        const mod = await import(`./stories/${mapId}.${_lang}.js`);
        storyEn = mod.default;
      } catch {
        try {
          const mod = await import(`./stories/${mapId}.en.js`);
          storyEn = mod.default;
        } catch {}
      }
    }
    const items = Object.entries(state.story.items);

    container.innerHTML = `
      <div class="sv-screen">
        <h2 class="sv-screen-title">${ts('item.title')}</h2>
        <p class="sv-screen-sub">${ts('item.sub')}</p>
        <div class="sv-item-pick-grid" id="sv-item-grid">
          ${items.map(([id, it]) => {
            const enIt = storyEn?.items?.[id];
            return `
              <div class="sv-item-pick-card" data-id="${id}">
                <div class="sv-ip-emoji">${it.emoji}</div>
                <div class="sv-ip-label">${enIt?.label || it.label}</div>
                <div class="sv-ip-desc">${enIt?.desc || it.desc}</div>
              </div>`;
          }).join('')}
        </div>
        <button class="btn-primary" id="sv-btn-start" disabled>${ts('item.start')}</button>
      </div>`;

    let selected = [];
    container.querySelectorAll('.sv-item-pick-card').forEach(card => {
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
    state.day      = 1;
    state.piEarned = 0;
    state.sceneId  = state.story.startScene;

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
            <div class="sv-stat-track"><div class="sv-stat-fill sv-hunger" id="sv-fill-hunger"></div></div>
            <span class="sv-stat-num" id="hunger-val">100</span>
          </div>
          <div class="sv-stat-right">
            <span id="sv-stat-day">Day 1</span>
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
    loadScene(state.story.startScene);
  }

  function loadScene(sceneId) {
    const scene = state.story.scenes[sceneId];
    if (!scene) return;
    state.sceneId = sceneId;
    state.day     = scene.day;
    applyEffect(scene.effect);
    updateStats();

    if (!scene.isEnd && (state.health <= 0 || state.hunger <= 0)) {
      const type = state.health <= 0 ? 'injury' : 'hunger';
      showEnd(false, type, type === 'injury' ? ts('end.death.injury') : ts('end.death.hunger'));
      return;
    }

    const en = storyEn?.scenes?.[sceneId];
    const titleEl = container.querySelector('#sv-scene-title');
    const textEl  = container.querySelector('#sv-scene-text');
    if (titleEl) titleEl.textContent = en?.title || scene.title;
    if (textEl) {
      textEl.style.opacity = '0';
      textEl.style.whiteSpace = 'pre-line';
      textEl.textContent = en?.text || scene.text || '';
      requestAnimationFrame(() => {
        textEl.style.transition = 'opacity 0.4s';
        textEl.style.opacity    = '1';
      });
    }

    if (scene.isEnd) {
      if (scene.pi) { state.piEarned += scene.pi; updateStats(); }
      const endText = en?.endText || scene.endText;
      setTimeout(() => showEnd(scene.endType === 'success', scene.endType, endText), 900);
      return;
    }
    renderChoices(scene.choices || []);
  }

  function renderChoices(choices) {
    const box = container.querySelector('#sv-choices-box');
    if (!box) return;
    const enScene = storyEn?.scenes?.[state.sceneId];
    box.innerHTML = choices.map((c, i) => {
      const ok         = hasRequired(c.requires);
      const piLabel    = c.pi ? `<span class="sv-choice-pi">+${c.pi}π</span>` : '';
      const choiceText = enScene?.choices?.[i] || c.text;
      const reqDesc    = enScene?.requireDescs?.[i] ?? c.requireDesc;
      const reqHint    = !ok && reqDesc ? `<span class="sv-choice-req">${reqDesc}</span>` : '';
      return `
        <button class="sv-choice-btn ${ok ? '' : 'disabled'}" data-idx="${i}" ${ok ? '' : 'disabled'}>
          <span class="sv-choice-text">${choiceText}</span>
          ${piLabel}${reqHint}
        </button>`;
    }).join('');

    box.querySelectorAll('.sv-choice-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        box.querySelectorAll('.sv-choice-btn').forEach(b => b.disabled = true);
        makeChoice(choices[parseInt(btn.dataset.idx)]);
      });
    });
  }

  function makeChoice(choice) {
    if (choice.pi) { state.piEarned += choice.pi; updateStats(); }
    applyEffect(choice.effect);
    updateStats();
    setTimeout(() => loadScene(choice.next), 250);
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
            <div class="sv-end-stat"><span>${ts('end.days')}</span><strong>${state.day}${ts('end.days.unit')}</strong></div>
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
    try { await submitSurvivalScore(state.username, state.map, state.day, state.piEarned); }
    catch (e) { console.warn('랭킹 등록 실패:', e); }
    loadLeaderboard();
  }

  async function loadLeaderboard() {
    const sec = container.querySelector('#sv-lb-section');
    if (!sec) return;
    const mapName = ts('map.' + state.map + '.name');
    const lbTitle = `${ts('lb.title')} — ${mapName}`;
    try {
      const rows = await fetchSurvivalLeaderboard(state.map);
      if (!rows.length) {
        sec.innerHTML = `<div class="sv-lb-title">${lbTitle}</div><p class="sv-lb-empty">${ts('lb.empty')}</p>`;
        return;
      }
      sec.innerHTML = `
        <div class="sv-lb-title">${lbTitle}</div>
        <div class="sv-lb-table">
          <div class="sv-lb-head">
            <span>${ts('lb.head.rank')}</span>
            <span>${ts('lb.head.pioneer')}</span>
            <span>${ts('lb.head.days')}</span>
            <span>${ts('lb.head.pi')}</span>
          </div>
          ${rows.map((r, i) => `
            <div class="sv-lb-row ${r.username === state.username ? 'sv-lb-me' : ''}">
              <span>${i + 1}</span>
              <span>${r.username}</span>
              <span>${r.days}</span>
              <span>⬡ ${r.pi_earned || 0}π</span>
            </div>`).join('')}
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
            <ul style="margin:0 0 14px;padding:0 0 0 18px;font-size:13px;line-height:1.8;color:var(--text-muted);">
              <li>🌊 심해 기지 · 🚀 우주 정거장 플레이</li>
              <li>향후 추가될 모든 맵 자동 개방</li>
              <li>퀴즈파이 구독과 공유</li>
            </ul>
            <p style="font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:8px;">🔗 생존게임·트래커 앱에서 구독 후 공유됩니다</p>
            <button class="btn-outline" id="sv-btn-do-restore" style="width:100%;">${ts('sub.restore')}</button>
            <p id="sv-sub-msg" style="font-size:12px;text-align:center;margin-top:8px;min-height:16px;"></p>
          `}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#sv-sub-close').onclick = () => overlay.remove();

    const doRestore = overlay.querySelector('#sv-btn-do-restore');
    const msg = overlay.querySelector('#sv-sub-msg');

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
