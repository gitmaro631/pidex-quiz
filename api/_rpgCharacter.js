import { turnCapForLevel } from './_rpgTurns.js';
import { computeCharacterCombatStats } from '../rpg-combat.js';
import { MERCENARY_TEMPLATES } from '../data/rpg/mercenaries.js';
import { CLASSES } from '../data/rpg/classes.js';

export const MAX_CHARACTER_SLOTS = 3;

export function isValidSlot(slot) {
  const n = Number(slot);
  return Number.isInteger(n) && n >= 1 && n <= MAX_CHARACTER_SLOTS;
}

// 계정(username)당 최대 3캐릭 - 슬롯별로 완전히 독립된 문서
export function characterDocPath(username, slot) {
  return `rpg_characters/${encodeURIComponent(username)}__${slot}`;
}

export function defaultCharacter(slot, now = Date.now()) {
  const base = {
    slot,
    level: 1,
    xp: 0,
    statPoints: 0,
    stats: { str: 5, int: 5, agi: 5, vit: 5, wis: 5 },
    classMain: null,
    classSub: null,
    equipment: {
      weapon: null, armor: null, head: null, hands: null, feet: null, ring: null, necklace: null,
      weaponDurability: 100, armorDurability: 100, // 착용중인 무기/방어구만 내구도 추적(교체시 초기화)
    },
    inventory: [],
    inventorySlotBonus: 0,
    currentTown: 'town1',
    gold: 0,
    turnPoints: turnCapForLevel(1),
    turnPointsUpdatedAt: now,
    stance: 'stable',
    potionRules: [],
    zoneKillCounts: {},
    visitedZones: [],
    questFlags: {},
    loreUnlocked: [],
    injuries: {
      arm: { severity: 0, turnsLeft: 0 },
      leg: { severity: 0, turnsLeft: 0 },
    },
    mercenaries: [], // 선술집에서 고용한 용병(완전한 캐릭터 형태로 저장 - createMercenaryInstance 참고)
    formationRow: null, // null이면 장착 무기로 자동 결정(활=후열, 그 외=전열) - rpg-combat.js의 effectiveFormationRow 참고
    lastTerritoryCollectAt: now, // 영지에서 일하는 용병들의 수입 정산 기준 시각(지연계산, collect-territory-income.js 참고)
    skillLevels: {}, // 직업훈련소에서 배운 스킬 단계({ [skillId]: 1~3 }) - 없으면(0) 전투에서 그 스킬을 못 씀
    identifiedItems: [], // 한 번 감정(확인)된 아이템id 목록 - 이후로는 항상 실제 스탯이 보임
    zoneClearCounts: {}, // 지역별 모험 승리 누적(레어 pity용 zoneKillCounts와 별개) - 100 이상이면 성 도전 가능
    lastCastleIncomeClaimDate: null, // 성주 일일 수입 정산일(YYYY-MM-DD) - claim-castle-income.js 참고
    createdAt: now,
    updatedAt: now,
  };
  const combatStats = computeCharacterCombatStats(base);
  return {
    ...base,
    currentHp: combatStats.maxHp,
    currentMp: combatStats.maxMp,
    currentStamina: combatStats.maxStamina,
  };
}

// 선술집 고용 시 용병 템플릿으로부터 "완전한 캐릭터"에 준하는 인스턴스를 만듦 - 레벨/스탯/장비/부상/
// 포션룰까지 본인 캐릭터와 동일한 구조를 가져서 rpg-combat.js의 party 전투 로직이 공용으로 처리 가능
export function createMercenaryInstance(templateId, now = Date.now()) {
  const template = MERCENARY_TEMPLATES[templateId];
  if (!template) return null;
  const cls = CLASSES[template.classMain];
  const isMelee = cls.weaponTypes.some((t) => t !== 'bow'); // 근접 무기 위주 직업이면 기본 전열
  const weaponId = template.classMain === 'archer' ? 'weapon_basic_bow' : 'weapon_basic_sword';
  const armorId = 'armor_basic'; // 요구 힘 5로 기본 스탯(5)에서 바로 착용 가능

  const instance = {
    id: `${templateId}_${now}`,
    templateId,
    name: template.name,
    level: template.baseLevel,
    xp: 0,
    statPoints: 0,
    stats: { str: 5, int: 5, agi: 5, vit: 5, wis: 5 },
    classMain: template.classMain,
    classSub: null,
    equipment: {
      weapon: weaponId, armor: armorId, head: null, hands: null, feet: null, ring: null, necklace: null,
      weaponDurability: 100, armorDurability: 100,
    },
    wagePerAdventure: template.wagePerAdventure,
    mentalResist: template.mentalResist || 50,
    formationRow: isMelee ? 'front' : 'back',
    stance: 'stable',
    potionRules: [],
    injuries: {
      arm: { severity: 0, turnsLeft: 0 },
      leg: { severity: 0, turnsLeft: 0 },
    },
    hospitalized: false, // true면 병원에서 요양 중 - 모험에 동행하지 않고 보수도 안 나가지만 계속 회복은 됨
    // assignment: 'active'(전투 동행, 최대 2명) | 'territory'(영지에서 일함) - hire-mercenary.js가 자리를 봐서 결정
    assignment: 'territory',
    job: 'clearing',
    hiredAt: now,
  };
  // 레벨이 1이 아닐 수 있으니(baseLevel) 매번 계산하는 combatStats 기준으로 초기 체력/마나/스테미나 채움
  const combatStats = computeCharacterCombatStats(instance);
  return {
    ...instance,
    currentHp: combatStats.maxHp,
    currentMp: combatStats.maxMp,
    currentStamina: combatStats.maxStamina,
  };
}
