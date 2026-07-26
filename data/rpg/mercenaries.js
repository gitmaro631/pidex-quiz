import { TOWNS } from './towns.js';

// 선술집에서 고용 가능한 용병 템플릿 - 파티 구성은 플레이어 자유(같은 역할로만 채워도 됨)
// mentalResist(0~100) - 공포 저항력. 전열에서 피격당할 때마다 이 수치가 낮을수록 "멘탈이 나가서"
// 후열로 도망칠 확률이 높아짐(rpg-combat.js의 MORALE_BREAK_BASE_CHANCE 참고, 전투 중 일시적 상태)
// minTownTier - 이 등급 이상 마을에서만 로테이션에 등장(town1은 tier1, town5는 tier5) - towns.js 참고
export const MERCENARY_TEMPLATES = {
  merc_archer_1: {
    id: 'merc_archer_1', name: '노련한 궁수 리안', classMain: 'archer',
    baseLevel: 5, hireCost: 150, wagePerAdventure: 8, mentalResist: 55, minTownTier: 1,
  },
  merc_warrior_1: {
    id: 'merc_warrior_1', name: '용맹한 전사 그레타', classMain: 'warrior',
    baseLevel: 5, hireCost: 150, wagePerAdventure: 8, mentalResist: 65, minTownTier: 1,
  },
  merc_mage_1: {
    id: 'merc_mage_1', name: '노련한 마법사 셀리아', classMain: 'mage',
    baseLevel: 15, hireCost: 400, wagePerAdventure: 18, mentalResist: 50, minTownTier: 3,
  },
  merc_priest_1: {
    id: 'merc_priest_1', name: '노련한 성직자 도렌', classMain: 'priest',
    baseLevel: 15, hireCost: 400, wagePerAdventure: 18, mentalResist: 60, minTownTier: 3,
  },
};

export const MAX_PARTY_SIZE = 3; // 본인 포함 "전투 동행" 최대 인원(본인 1 + 전투용병 최대 2)
export const MAX_MERCENARIES = MAX_PARTY_SIZE - 1; // 동시에 전투(assignment:'active')에 데려갈 수 있는 용병 수
// 전투에 못 데려가는 잉여 용병은 영지에 남겨 일을 시킬 수 있음 - assignment:'territory'.
// 지금은 "개간" 하나뿐이고 산출도 골드 고정이지만, 나중에 영지를 세분화(건물/레벨/여러 일자리 종류,
// 재료 산출 등)할 걸 감안해서 일(job) 단위로 산출을 따로 갖게 설계함 - 새 일자리는 이 객체에
// { id, name, goldPerHour, ...나중에 재료 산출 등 필드 추가 } 형태로 항목만 추가하면 됨
export const MAX_TERRITORY_MERCENARIES = 4;
export const TERRITORY_JOBS = {
  clearing: { id: 'clearing', name: '개간', goldPerHour: 3 },
};

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
