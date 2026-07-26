import { TOWNS } from './towns.js';

// 선술집에서 고용 가능한 용병 템플릿 - 파티 구성은 플레이어 자유(같은 역할로만 채워도 됨)
// mentalResist(0~100) - 공포 저항력. 전열에서 피격당할 때마다 이 수치가 낮을수록 "멘탈이 나가서"
// 후열로 도망칠 확률이 높아짐(rpg-combat.js의 MORALE_BREAK_BASE_CHANCE 참고, 전투 중 일시적 상태)
// minTownTier - 이 등급 이상 마을에서만 로테이션에 등장(town1은 tier1, town5는 tier5) - towns.js 참고
export const MERCENARY_TEMPLATES = {
  merc_archer_1: {
    id: 'merc_archer_1', name: '떠돌이 궁수', classMain: 'archer',
    baseLevel: 5, hireCost: 150, wagePerAdventure: 8, mentalResist: 55, minTownTier: 1,
  },
  merc_warrior_1: {
    id: 'merc_warrior_1', name: '떠돌이 전사', classMain: 'warrior',
    baseLevel: 5, hireCost: 150, wagePerAdventure: 8, mentalResist: 65, minTownTier: 1,
  },
  merc_mage_1: {
    id: 'merc_mage_1', name: '떠돌이 마법사', classMain: 'mage',
    baseLevel: 15, hireCost: 400, wagePerAdventure: 18, mentalResist: 50, minTownTier: 3,
  },
  merc_priest_1: {
    id: 'merc_priest_1', name: '떠돌이 성직자', classMain: 'priest',
    baseLevel: 15, hireCost: 400, wagePerAdventure: 18, mentalResist: 60, minTownTier: 3,
  },
  // 영지 시설 업그레이드 특화 용병 - 다른 용병과 똑같이 전투에도 데려갈 수 있고 전투로 레벨업함
  // (classMain에 따라 공/방이 정해짐). 차이는 territorySpecialty에 맞는 시설에 배치하면
  // 기여 속도에 SPECIALTY_BONUS_MULT 보너스가 추가로 붙는다는 것뿐(facilityAccrualRate 참고)
  merc_doctor_1: {
    id: 'merc_doctor_1', name: '떠돌이 군의관', classMain: 'priest',
    baseLevel: 8, hireCost: 250, wagePerAdventure: 12, mentalResist: 55, minTownTier: 2,
    territorySpecialty: 'hospital',
  },
  merc_engineer_1: {
    id: 'merc_engineer_1', name: '떠돌이 배관공', classMain: 'warrior',
    baseLevel: 8, hireCost: 250, wagePerAdventure: 12, mentalResist: 60, minTownTier: 2,
    territorySpecialty: 'farm', // 관개수로(배관) 정비 - 농장 특화
  },
};

// 고용 시 자동으로 붙는 랜덤 이름(나중에 사용자가 원하면 rename-mercenary.js로 직접 바꿀 수 있음)
export const MERC_RANDOM_NAMES = [
  '리안', '그레타', '셀리아', '도렌', '하윤', '유진', '란', '조엘',
  '비앙카', '다니엘', '에스텔', '가론', '밀라', '테오', '솔', '아영', '카일', '로사', '벤', '미라',
];
export function randomMercName() {
  return MERC_RANDOM_NAMES[Math.floor(Math.random() * MERC_RANDOM_NAMES.length)];
}

export const MAX_PARTY_SIZE = 3; // 본인 포함 "전투 동행" 최대 인원(본인 1 + 전투용병 최대 2)
export const MAX_MERCENARIES = MAX_PARTY_SIZE - 1; // 동시에 전투(assignment:'active')에 데려갈 수 있는 용병 수
// 전투에 못 데려가는 잉여 용병은 영지에 남겨 일을 시킬 수 있음 - assignment:'territory'.
// 영지 경제는 실시간이 아니라 "영지일"(턴포인트 10소모 = 영지 1일, rpg-territory.js의
// TURNS_PER_TERRITORY_DAY 참고) 단위로 정산됨 - 플레이를 안 하면 영지도 그대로 멈춰있음.
// 각 일자리는 그 자체로 "시설"이기도 함 - 용병을 배치한 누적 영지일이 쌓일수록 시설 레벨이
// 올라가고(data/rpg/facilities.js의 facilityLevelForDays 참고), 레벨마다 statKey가 가리키는
// 스탯에 영구 % 보너스가 붙음(전역 적용 - computeCharacterCombatStats/rpg-territory.js 참고).
export const MAX_TERRITORY_MERCENARIES = 4;
export const TERRITORY_JOBS = {
  clearing: { id: 'clearing', name: '개간지', goldPerDay: 15, statKey: 'gold', bonusPctPerLevel: 2 },
  training: { id: 'training', name: '훈련소', goldPerDay: 0, statKey: 'atk', bonusPctPerLevel: 1.5 },
  ramparts: { id: 'ramparts', name: '방벽', goldPerDay: 0, statKey: 'def', bonusPctPerLevel: 1.5 },
  // 밭/농사 - 다른 시설과 달리 골드/전투스탯이 아니라 "식량"을 생산함(rpg-territory.js 참고,
  // bonusPctPerLevel은 여기선 식량 생산량에 적용됨). 식량이 부족하면 그 부족분을 골드로 사와야 함
  // (foodEmergencyCost) - 영지 일자리들이 서로 맞물리는 핵심 연결고리
  farm: { id: 'farm', name: '농장', goldPerDay: 0, statKey: 'food', bonusPctPerLevel: 2 },
  // 병원 - 레벨마다 부상 치료 비용/시간이 줄어듦(의사/붕대 골드비용, 영지에서 쉬기 턴비용, 입원비 전부 해당)
  hospital: { id: 'hospital', name: '병원', goldPerDay: 0, statKey: 'healCostReduction', bonusPctPerLevel: 4 },
};

export const SPECIALTY_BONUS_MULT = 1.5; // territorySpecialty가 맞는 시설에 배치하면 기여 속도 50% 추가

export const FOOD_PER_DAY_PER_FARMER = 3; // 농부 1명(레벨5 기준) 영지 1일당 식량 생산
export const FOOD_CONSUMPTION_PER_DAY_PER_WORKER = 1; // 농장을 제외한 영지 근무자 1명당 영지 1일당 식량 소비
export const GOLD_PER_MISSING_FOOD = 3; // 식량이 부족하면 부족분 1당 이 골드를 대신 지출(비상 식량 구매)
export const WAGE_PER_MERC_PER_DAY = 2; // 영지에 배치된 용병 1명당 영지 1일당 상주 급여(고용비/모험 보수와 별개)

// 종자 흡수 - 다른 용병을 "종자"로 붙이면 그 용병은 사라지고(되돌릴 수 없음, 1회만 가능),
// 흡수한 쪽이 종자의 직업을 부직업처럼 얻음(스킬 50% 위력) + 스탯 일부(10%, 흡수 시점 고정)를 받고
// 고용가치도 살짝 오름(캐릭터 삭제시 자산환산에 반영)
export const SQUIRE_SKILL_POWER_MULT = 0.5;
export const SQUIRE_STAT_BONUS_PCT = 0.10;
export const SQUIRE_HIRE_COST_BONUS_PCT = 0.5;

// 유저 캐릭터 본인도 영지 시설에 배치 가능(character.territoryJob) - 용병보다 기여도가 약간 더 높음
export const PLAYER_TERRITORY_BONUS_MULT = 1.2;

export const DAILY_ROSTER_SIZE = 2; // 선술집이 하루에 노출하는 용병 수(템플릿이 늘어나도 이 수만큼만 보임)

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// 마을별 선술집 용병 구성 - 그 마을 등급(tier) 이하 템플릿만 로테이션 대상, 날짜(UTC, claim-daily-bonus.js와
// 동일한 date-key 규칙)가 바뀌면 갱신됨. 서버(hire-mercenary.js 검증)/클라이언트(tavernHireHtml 표시)
// 양쪽에서 이 함수 하나로 동일하게 계산
export function dailyTavernRoster(townId, now = Date.now()) {
  const townTier = (TOWNS[townId] || {}).tier || 1;
  const dateKey = new Date(now).toISOString().slice(0, 10);
  const allIds = Object.values(MERCENARY_TEMPLATES).filter((t) => (t.minTownTier || 1) <= townTier).map((t) => t.id);
  const seed = simpleHash(`${dateKey}:${townId}`);
  const shuffled = [...allIds].sort((a, b) => simpleHash(`${seed}:${a}`) - simpleHash(`${seed}:${b}`));
  return shuffled.slice(0, Math.min(DAILY_ROSTER_SIZE, shuffled.length));
}
