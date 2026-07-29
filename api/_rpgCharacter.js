import { turnCapForLevel } from './_rpgTurns.js';
import { computeCharacterCombatStats } from '../rpg-combat.js';
import { MERCENARY_TEMPLATES, randomMercName } from '../data/rpg/mercenaries.js';
import { CLASSES } from '../data/rpg/classes.js';
import { encodeFirestorePathSegment } from './_firestore.js';
import { isAdminUsername } from './_rpgAdmin.js';

export const MAX_CHARACTER_SLOTS = 5;
// 관리자 계정은 테스트용으로 슬롯 하나를 더 씀(기본 5개 + 테스트슬롯 1개) - 다른 유저는 여전히 5개 한도
export const ADMIN_EXTRA_TEST_SLOTS = 1;

export function maxCharacterSlotsFor(username) {
  return MAX_CHARACTER_SLOTS + (isAdminUsername(username) ? ADMIN_EXTRA_TEST_SLOTS : 0);
}

// username을 안 넘기면(기존 호출부 다수) 관리자 여부를 모르니 기본 5개 한도로 보수적으로 판정 -
// 관리자의 6번째 슬롯을 실제로 쓰게 하려면 호출부에서 isValidSlot(slot, username)으로 넘겨야 함
export function isValidSlot(slot, username) {
  const n = Number(slot);
  return Number.isInteger(n) && n >= 1 && n <= maxCharacterSlotsFor(username);
}

// 계정(username)당 최대 5캐릭(MAX_CHARACTER_SLOTS) - 슬롯별로 완전히 독립된 문서
export function characterDocPath(username, slot) {
  return `rpg_characters/${encodeFirestorePathSegment(username)}__${slot}`;
}

// 캐릭터 슬롯과 무관하게 "계정" 단위로 저장하는 문서(일일 랭킹 보너스, 설문 완료 보너스 등 - 캐릭터별로
// 따로 받으면 3캐릭 만들어서 악용 가능하므로 계정 단위로 한 번만 기록)
export function accountDocPath(username) {
  return `rpg_accounts/${encodeFirestorePathSegment(username)}`;
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
    // 장비 슬롯: weapon(무기) / shield(방패, 물리직업 전용) / armor_top(상의) / armor_bottom(하의) /
    // ring(반지) / necklace(목걸이). durability/강화단계는 내구도 추적 대상 4종(무기/방패/상의/하의)만 존재
    equipment: {
      weapon: null, shield: null, armor_top: null, armor_bottom: null, ring: null, necklace: null,
      weaponDurability: 100, shieldDurability: 100, armor_topDurability: 100, armor_bottomDurability: 100,
    },
    inventory: [],
    inventorySlotBonus: 0, // 등급제 도입 전 필드(하위호환용) - 신규 캐릭터는 항상 0, 새 가방은 bagBonusByTier로만 쌓임
    bagBonusByTier: {}, // 가방 등급(1~5)별 누적 - 등급마다 최대 10칸(BAG_TIER_CAPS)까지만 반영됨
    currentTown: 'town1',
    gold: 0,
    turnPoints: turnCapForLevel(1),
    turnPointsUpdatedAt: now,
    stance: 'stable',
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
    totalTurnsSpent: 0, // 지금까지 소모한 턴포인트 누적(레벨업으로도 안 줄어듦) - "영지일" 경계 판정용(rpg-territory.js)
    territoryDayCheckpoint: 0, // 마지막으로 영지 경제를 정산한 시점의 영지일 수 - adventure.js가 매 모험마다 갱신
    facilityDays: { clearing: 0, training: 0, ramparts: 0, farm: 0, morale: 0, sanctum: 0 }, // 시설별 누적 배치 영지일(레벨업 재료)
    facilityLevels: { clearing: 0, training: 0, ramparts: 0, farm: 0, morale: 0, sanctum: 0 }, // facilityDays로부터 계산된 현재 레벨(전역 보너스 % 산정용, data/rpg/facilities.js 참고)
    foodStock: 0, // 농장이 생산하는 식량 재고 - 농장 외 영지 근무자들의 영지일당 소비를 감당(부족하면 골드로 대신 지출)
    skillLevels: {}, // 직업훈련소에서 배운 스킬 단계({ [skillId]: 1~3 }) - 없으면(0) 전투에서 그 스킬을 못 씀
    repairSkillLevel: 0, // 대장간에서 배우는 셀프 수리 스킬(0~4) - 단계에 따라 셀프 수리 가능 등급이 오름
    identifiedItems: [], // 한 번 감정(확인)된 아이템id 목록 - 이후로는 항상 실제 스탯이 보임
    zoneClearCounts: {}, // 지역별 모험 승리 누적(레어 pity용 zoneKillCounts와 별개) - 100 이상이면 성 도전 가능
    lastCastleIncomeClaimDate: null, // 성주 일일 수입 정산일(YYYY-MM-DD) - claim-castle-income.js 참고
    zonePreviews: {}, // 지역별 미리보기 몹 구성({ [zoneId]: {options,...} }) - 처음 보는 지역은 무료,
    // 이미 본 지역은 그대로 재사용(다른 지역 갔다와도 유지됨) - 마음에 안 들면 골드를 써서 새로고침(preview-zone.js)
    surveyBonusUnlocked: false, // 설문조사 전부 완료 시 턴 상한 보너스(character.js가 주기적으로 갱신)
    surveyBonusCheckedAt: 0,
    pinnedItemIds: [], // 인벤토리 화면에서 상단고정한 아이템id 목록(앞쪽일수록 상단) - set-pinned-items.js가 갱신
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
  const isMelee = !cls.weaponTypes.includes('bow'); // 근접 무기 위주 직업이면 기본 전열
  const weaponId = template.classMain === 'archer' ? 'weapon_basic_bow' : 'weapon_basic_sword';
  const armorTopId = 'armor_basic'; // 요구 힘 5로 기본 스탯(5)에서 바로 착용 가능

  const instance = {
    id: `${templateId}_${now}`,
    templateId,
    name: randomMercName(), // 고용 시 자동으로 랜덤 이름 - 나중에 rename-mercenary.js로 직접 바꿀 수 있음
    level: template.baseLevel,
    xp: 0,
    statPoints: 0,
    stats: { str: 5, int: 5, agi: 5, vit: 5, wis: 5 },
    classMain: template.classMain,
    classSub: null,
    equipment: {
      weapon: weaponId, shield: null, armor_top: armorTopId, armor_bottom: null, ring: null, necklace: null,
      weaponDurability: 100, shieldDurability: 100, armor_topDurability: 100, armor_bottomDurability: 100,
    },
    wagePerAdventure: template.wagePerAdventure,
    mentalResist: template.mentalResist || 50,
    formationRow: isMelee ? 'front' : 'back',
    stance: 'stable',
    // 유저 본인 stance와 완전히 독립된, 용병 개인의 타겟 우선순위/전투역할 - set-mercenary-combat-settings.js로 변경.
    // 'fight'(죽기 직전까지 계속 공격) | 'support'(방어태세/힐 등으로 자기·아군 보조) - 힐러 컨셉 용병은
    // MERCENARY_TEMPLATES의 fixedCombatRole이 이 값을 무시하고 항상 'support'로 강제함(rpg-combat.js resolveCombat 참고)
    combatRole: 'fight',
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
