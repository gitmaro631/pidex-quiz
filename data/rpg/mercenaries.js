// 선술집에서 고용 가능한 용병 템플릿 - 본인 직업과 "상호보완적"인 직업만 고용 가능
// (근접 직업 캐릭터는 원거리/마법 용병을, 원거리 캐릭터는 근접 용병을 고용) - hire-mercenary.js가 검증
// mentalResist(0~100) - 공포 저항력. 전열에서 피격당할 때마다 이 수치가 낮을수록 "멘탈이 나가서"
// 후열로 도망칠 확률이 높아짐(rpg-combat.js의 MORALE_BREAK_BASE_CHANCE 참고, 전투 중 일시적 상태)
export const MERCENARY_TEMPLATES = {
  merc_archer_1: {
    id: 'merc_archer_1', name: '노련한 궁수 리안', classMain: 'archer',
    baseLevel: 5, hireCost: 150, wagePerAdventure: 8, mentalResist: 55,
  },
  merc_warrior_1: {
    id: 'merc_warrior_1', name: '용맹한 전사 그레타', classMain: 'warrior',
    baseLevel: 5, hireCost: 150, wagePerAdventure: 8, mentalResist: 65,
  },
};

export const MAX_PARTY_SIZE = 3; // 본인 포함 최대 인원(본인 1 + 용병 최대 2)
export const MAX_MERCENARIES = MAX_PARTY_SIZE - 1;
