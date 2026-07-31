import { TOWNS } from './towns.js';
import { CLASSES } from './classes.js';

// 선술집에서 고용 가능한 용병 템플릿 - "구현된 캐릭터"(CLASSES)로부터 자동 생성됨. 나중에 새 직업을
// classes.js에 추가하면 별도 작업 없이 그 직업도 자동으로 용병 후보가 됨(고유 밸런스가 필요하면
// MERC_CLASS_CONFIG에 항목 추가, 없으면 MERC_CLASS_CONFIG_DEFAULT 사용).
// mentalResist(0~100) - 공포 저항력. 전열에서 피격당할 때마다 이 수치가 낮을수록 "멘탈이 나가서"
// 후열로 도망칠 확률이 높아짐(rpg-combat.js의 MORALE_BREAK_BASE_CHANCE 참고, 전투 중 일시적 상태)
// minTownTier - 이 등급 이상 마을에서만 로테이션에 등장(town1은 tier1, town5는 tier5) - towns.js 참고
// 고용비(hireCost)는 선술집에서 고용할 때 한 번만 내는 비용 - 이후로는 어떤 형태로도(모험 보수/영지
// 상주 급여/해고 환급) 추가 비용이 나가지 않음
const MERC_BASE_LEVEL = 5;
const MERC_CLASS_CONFIG = {
  warrior: { hireCost: 150, mentalResist: 65, minTownTier: 1 },
  archer: { hireCost: 150, mentalResist: 55, minTownTier: 1 },
  mage: { hireCost: 400, mentalResist: 50, minTownTier: 3 },
  // 컨셉상 순수 힐러 - combatRole 선택지를 무시하고 전투에서 항상 서포트로 취급(rpg-combat.js resolveCombat 참고)
  priest: { hireCost: 400, mentalResist: 60, minTownTier: 3, fixedCombatRole: 'support' },
  paladin: { hireCost: 350, mentalResist: 70, minTownTier: 3 },
  dark_knight: { hireCost: 350, mentalResist: 55, minTownTier: 3 },
};
const MERC_CLASS_CONFIG_DEFAULT = { hireCost: 200, mentalResist: 55, minTownTier: 1 };

export const MERCENARY_TEMPLATES = Object.fromEntries(
  Object.values(CLASSES).map((cls) => {
    const cfg = MERC_CLASS_CONFIG[cls.id] || MERC_CLASS_CONFIG_DEFAULT;
    const id = `merc_${cls.id}`;
    return [id, {
      id, name: `떠돌이 ${cls.name}`, classMain: cls.id,
      baseLevel: MERC_BASE_LEVEL, hireCost: cfg.hireCost, mentalResist: cfg.mentalResist, minTownTier: cfg.minTownTier,
      fixedCombatRole: cfg.fixedCombatRole || null,
    }];
  }),
);

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
  // 병원 - 레벨마다 부상 치료 비용/시간이 줄어듦(의사/붕대 골드비용, 영지에서 쉬기 턴비용, 입원비 전부 해당)
  hospital: { id: 'hospital', name: '병원', goldPerDay: 0, statKey: 'healCostReduction', bonusPctPerLevel: 4 },
  // 사기진작소 - 레벨마다 멘탈저항(공포로 후열로 밀려날 확률을 낮추는 수치)이 고정치로 올라감
  // (facilities.js의 moraleResistBonus 참고, 다른 시설처럼 %배율이 아니라 flat 가산). 훈련소/방벽과
  // 같은 원칙으로 본인+고용한 용병 전원에게 적용됨
  morale: { id: 'morale', name: '사기진작소', goldPerDay: 0, statKey: 'mentalResist', bonusPctPerLevel: 3 },
  // 연공실 - 레벨마다 최대 마나/스테미나가 %만큼 늘어남. 성기사(스태미나+마나 혼합)·마법사·성직자처럼
  // 마나 의존도가 높은 직업이나, 체력 대신 스테미나로 스킬을 쓰는 물리 직업 전부에게 도움이 됨.
  // 훈련소/방벽과 같은 원칙(본인+용병 전원 적용, computeCharacterCombatStats 참고)
  sanctum: { id: 'sanctum', name: '연공실', goldPerDay: 0, statKey: 'mp', bonusPctPerLevel: 2 },
  // 연무장 - 무기/스킬 없이 쓰는 직업별 기본공격(맨손 강타, 짱돌 던지기, 마력 파동 등 improvisedAttack -
  // classes.js 참고)의 위력/명중률을 올려줌. 레벨마다 위력 %만큼, 명중은 그 절반만큼(D&D식 명중굴림 보정치라
  // 값이 작아야 함) 오름(rpg-combat.js의 performAttack 참고)
  basics: { id: 'basics', name: '연무장', goldPerDay: 0, statKey: 'improvisedPower', bonusPctPerLevel: 4 },
};

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
