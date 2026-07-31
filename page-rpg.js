import { currentAccessToken, createGoldPurchasePayment } from './pi-sdk.js';
import { showToast } from './page-quiz.js';
import { t, ti, getLang } from './util-i18n.js';
import {
  getClassName, getSkillName, getMonsterName, getMonsterSkillName, getItemName, getSetBonusName,
  getFullSetName, getZoneName, getTownName, getNpcName, getNpcDialogue, getMercTemplateName,
  getQuestName, getQuestDesc,
} from './rpg-i18n.js';
import { setupPullToRefresh } from './util-ptr.js';
import { getQuizRefillProgress, resetQuizRefillProgress } from './util-storage.js';
import { ITEMS, RARITY_ITEM_LEVEL, SET_BONUSES, ZONE_SET_ITEMS, BAG_TIER_CAPS } from './data/rpg/items.js';
import { ZONES } from './data/rpg/zones.js';
import { CLASSES } from './data/rpg/classes.js';
import { MONSTERS } from './data/rpg/monsters.js';
import { xpToNextLevel, SUB_CLASS_UNLOCK_LEVEL } from './rpg-progression.js';
import { TOWNS } from './data/rpg/towns.js';
import { NPCS } from './data/rpg/npcs.js';
import { QUESTS } from './data/rpg/quests.js';
import { checkQuestCondition } from './rpg-quests.js';
import { LORE_ENTRIES } from './data/rpg/lore.js';
import { computeCharacterCombatStats, monsterDifficultyTier, COMBAT_MISS_PHRASES, effectiveStats, TWO_HANDED_WEAPON_TYPES } from './rpg-combat.js';
import {
  MERCENARY_TEMPLATES, MAX_MERCENARIES, MAX_TERRITORY_MERCENARIES, TERRITORY_JOBS, dailyTavernRoster, PLAYER_TERRITORY_BONUS_MULT,
  FOOD_PER_DAY_PER_FARMER, FOOD_CONSUMPTION_PER_DAY_PER_WORKER, GOLD_PER_MISSING_FOOD, WAGE_PER_MERC_PER_DAY,
} from './data/rpg/mercenaries.js';
import { CLASS_ESSENCE_ITEM, MAX_SKILL_TIER, TRAINING_TIER_COSTS } from './data/rpg/training.js';
import { MAX_ENHANCE_LEVEL, ENHANCE_LEVEL_COSTS, MAX_REPAIR_SKILL_LEVEL, REPAIR_SKILL_COSTS, REPAIR_SKILL_RARITY_CAP, rarityAllowedBySkill } from './data/rpg/enhancement.js';
import { CASTLE_CLEAR_REQUIREMENT, GOLD_INCOME_PER_TIER, MATERIAL_BONUS_MIN_TIER, MATERIAL_BONUS_QTY } from './data/rpg/castle.js';
import { computeCureCost, REST_HEAL_TURN_COST_BY_SEVERITY, HP_REST_HEAL_FULL_TURNS } from './data/rpg/injuries.js';
import { allowedFormationRows } from './rpg-combat.js';
import { facilityProgress, facilityAccrualRate, facilityBonusMultiplier, MAX_MERCS_PER_FACILITY, BASELINE_MERC_LEVEL } from './data/rpg/facilities.js';
import { CRAFT_RECIPES } from './data/rpg/craft-recipes.js';

// api/ 아래 파일은 Vercel이 서버 함수 전용으로 취급해서 브라우저가 직접 fetch 못 함(404) -
// 그래서 api/_rpgInventory.js를 import하는 대신, 이 로직들을 그대로 복제해서 씀
// (서버쪽 api/_rpgInventory.js와 반드시 같은 값/공식으로 유지할 것)
const BASE_INVENTORY_CAPACITY = 20;
function capacityForCharacter(character) {
  const bagBonusByTier = character.bagBonusByTier || {};
  const bagTotal = Object.keys(BAG_TIER_CAPS).reduce((sum, tier) => sum + Math.min(bagBonusByTier[tier] || 0, BAG_TIER_CAPS[tier]), 0);
  return BASE_INVENTORY_CAPACITY + bagTotal + (character.inventorySlotBonus || 0);
}
const BASE_WEIGHT_LIMIT = 30;
const WEIGHT_PER_STR = 4;
function weightLimitForCharacter(character) {
  const str = (character.stats && character.stats.str) || 0;
  return BASE_WEIGHT_LIMIT + str * WEIGHT_PER_STR;
}
function inventoryWeight(inventory) {
  return (inventory || []).reduce((sum, e) => sum + ((ITEMS[e.itemId] && ITEMS[e.itemId].weight) || 0) * e.qty, 0);
}

const ELEMENT_NAMES = { water: '물', fire: '불', air: '대기', earth: '흙', dark: '어둠', holy: '신성', none: '무속성', all: '전속성' };
function bodyPartName(part) { return t(`rpg.ui.bodyPart.${part}`); }

const IDENTIFIABLE_TYPES = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
// 아이템 등급이 내 레벨보다 높으면 미확인 상태 - 감정 스크롤을 쓰거나, 본인/활성 용병 중 지혜가
// 충분한 누군가가 있으면 자동으로 실제 스탯이 보임(identifiedItems에 한 번 기록되면 계속 보임)
function isItemIdentified(item) {
  if (!IDENTIFIABLE_TYPES.includes(item.type)) return true;
  const requiredLevel = RARITY_ITEM_LEVEL[item.rarity] || 1;
  if (requiredLevel <= (character.level || 1)) return true;
  if ((character.identifiedItems || []).includes(item.id)) return true;
  return false;
}

// 상점/인벤토리에 표시할 장비 스탯 요약 (ATK/DEF/HP/스탯 보너스 + 속성 + 특수효과)
function itemStatsLabel(item) {
  if (!isItemIdentified(item)) return ' (❓ 미확인 - 감정 필요)';
  const parts = [];
  if (item.atkBonus) parts.push(`공격력+${item.atkBonus}`);
  if (item.defBonus) parts.push(`방어력+${item.defBonus}`);
  if (item.hpBonus) parts.push(`최대체력+${item.hpBonus}`);
  if (item.strBonus) parts.push(`힘+${item.strBonus}`);
  if (item.agiBonus) parts.push(`민첩+${item.agiBonus}`);
  if (item.intBonus) parts.push(`지능+${item.intBonus}`);
  if (item.wisBonus) parts.push(`지혜+${item.wisBonus}`);
  if (item.element && item.element !== 'none') parts.push(`속성:${ELEMENT_NAMES[item.element] || item.element}`);
  if (item.elementDefense) parts.push(`${ELEMENT_NAMES[item.elementDefense] || item.elementDefense}속성방어`);
  if (item.severeInjuryResist) parts.push(`중상방어+${Math.round(item.severeInjuryResist * 100)}%`);
  if (item.doubleAttackChance) parts.push(`2연타 확률+${Math.round(item.doubleAttackChance * 100)}%`);
  if (item.armorClass) parts.push({ heavy: '중갑', light: '경갑', cloth: '천갑' }[item.armorClass] || item.armorClass);
  if (item.strRequirement) parts.push(`요구 힘 ${item.strRequirement}`);
  if (item.wisRequirement) parts.push(`요구 지혜 ${item.wisRequirement}`);
  if (typeof item.weight === 'number' && item.weight > 0) parts.push(`무게${item.weight}`);
  const statsStr = parts.length ? ` (${parts.join(', ')})` : '';
  const setStr = item.setId ? ` <button class="rpg-set-info-btn" data-set="${item.setId}">🧩${getSetBonusName(item.setId, getLang())}</button>` : '';
  return statsStr + setStr;
}

// 아이템 자체가 주는 보너스만 "+수치" 목록으로(장착 확인창에서 새 장비가 더하는 부분/기존 장비가
// 빠지면서 없어지는 부분을 나란히 보여주는 데 씀) - itemStatsLabel과 같은 필드를 재사용
function itemBonusParts(item) {
  const parts = [];
  if (item.atkBonus) parts.push(`공격력+${item.atkBonus}`);
  if (item.defBonus) parts.push(`방어력+${item.defBonus}`);
  if (item.hpBonus) parts.push(`최대체력+${item.hpBonus}`);
  if (item.strBonus) parts.push(`힘+${item.strBonus}`);
  if (item.agiBonus) parts.push(`민첩+${item.agiBonus}`);
  if (item.intBonus) parts.push(`지능+${item.intBonus}`);
  if (item.wisBonus) parts.push(`지혜+${item.wisBonus}`);
  if (item.severeInjuryResist) parts.push(`중상방어+${Math.round(item.severeInjuryResist * 100)}%`);
  if (item.doubleAttackChance) parts.push(`2연타 확률+${Math.round(item.doubleAttackChance * 100)}%`);
  return parts;
}

// 장착 시 직업과 안 맞아서 붙는 패널티 경고(하드 블록인 방어구 제한과는 별개 - 그건 confirmDisabled로 처리됨).
// 무기가 직업 숙련 무기가 아니면 명중/피해 패널티, 캐스터가 방패를 끼면 방어력 기여가 크게 깎임(rpg-combat.js 참고)
function equipPenaltyWarning(item, classDef) {
  if (item.type === 'weapon' && item.weaponType && !classDef.weaponTypes.includes(item.weaponType)) {
    return '⚠️ 직업 비숙련 무기 - 명중 -4, 피해량 70%로 감소';
  }
  if (item.type === 'shield' && classDef.resourceType !== 'stamina') {
    return '⚠️ 이 직업은 방패를 다루기 어려움 - 방어력 기여 60% 감소';
  }
  return null;
}

// 영지일 경계를 넘어 정산이 일어났을 때(adventure.js의 territoryNotice) 보여주는 공지 배너 -
// "확인" 버튼 또는 배경(다른 부분) 클릭으로 닫힘
function showTerritoryNotice(container, notice) {
  if (!notice) return;
  const lines = [];
  if (notice.goldIncome > 0) lines.push(`🌾 개간지 수입 +${notice.goldIncome}골드`);
  if (notice.wagePaid > 0) lines.push(`👥 용병 상주 급여 -${notice.wagePaid}골드`);
  if (notice.foodEmergencyCost > 0) lines.push(`🍚 식량 부족으로 비상 구매 -${notice.foodEmergencyCost}골드`);
  const levelLines = (notice.leveledUp || []).map((l) => `🎉 ${FACILITY_ICONS[l.jobId] || ''} ${getTerritoryJobName(l.jobId, getLang())}이(가) Lv.${l.level}(으)로 성장했습니다!`);
  const overlay = document.createElement('div');
  overlay.className = 'rpg-notice-overlay';
  overlay.innerHTML = `
    <div class="rpg-notice-box">
      <h4>🏯 영지 정산 (${notice.daysProcessed}일 경과)</h4>
      ${lines.length ? `<p>${lines.join('<br>')}</p>` : '<p class="rpg-hint">이번엔 골드 변동이 없었어요.</p>'}
      ${levelLines.length ? `<p>${levelLines.join('<br>')}</p>` : ''}
      <p class="rpg-hint">순변동: ${notice.goldDelta >= 0 ? '+' : ''}${notice.goldDelta}골드</p>
      <button class="rpg-notice-close">확인</button>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.rpg-notice-close').addEventListener('click', close);
  container.appendChild(overlay);
}

// 세트 아이템 클릭시(🧩버튼) 이 세트가 반지+목걸이 뭐로 구성되는지, 세트 효과가 뭔지 보여줌
function showSetInfo(setId) {
  const setDef = SET_BONUSES[setId];
  if (!setDef) return;
  const [ringId, necklaceId] = ZONE_SET_ITEMS[setDef.zoneId] || [];
  const pieceNames = [ringId, necklaceId].filter(Boolean).map((id) => getItemName(id, getLang()));
  const bonusText = itemStatsLabel({ ...setDef.bonus }).replace(/^ \(|\)$/g, '');
  alert(`${getSetBonusName(setId, getLang())}\n\n구성: ${pieceNames.join(' + ')}\n둘 다 착용시 세트 효과: ${bonusText || '없음'}`);
}

// 장착/해제 전후 전투 스탯 변화를 사람이 읽을 수 있는 문장으로(토스트 알림용, 한 줄 요약)
function statsDeltaMessage(before, after) {
  const lines = [];
  if (before.atk !== after.atk) lines.push(`공격력 ${before.atk}→${after.atk} (${after.atk > before.atk ? '+' : ''}${after.atk - before.atk})`);
  if (before.def !== after.def) lines.push(`방어력 ${before.def}→${after.def} (${after.def > before.def ? '+' : ''}${after.def - before.def})`);
  if (before.maxHp !== after.maxHp) lines.push(`최대체력 ${before.maxHp}→${after.maxHp} (${after.maxHp > before.maxHp ? '+' : ''}${after.maxHp - before.maxHp})`);
  if (before.element !== after.element) lines.push(`공격 속성: ${ELEMENT_NAMES[before.element]} → ${ELEMENT_NAMES[after.element]}`);
  return lines.length ? lines.join(' · ') : '스탯 변화 없음';
}

// 착용 확인창용 - 자주 보게 되니 표 형태로 깔끔하게, 오르면 초록/+, 내리면 빨강/-만 표시(변화 없는 항목은 생략)
const STAT_DELTA_LABELS = { atk: '공격력', def: '방어력', maxHp: '최대체력', attackBonus: '명중', ac: '회피(AC)' };
function statsDeltaRowsHtml(before, after) {
  const rows = Object.entries(STAT_DELTA_LABELS)
    .filter(([key]) => before[key] !== after[key])
    .map(([key, label]) => {
      const diff = after[key] - before[key];
      const cls = diff > 0 ? 'rpg-stat-up' : 'rpg-stat-down';
      return `<div class="rpg-stat-delta-row"><span>${label}</span><span>${before[key]} → ${after[key]}</span><span class="${cls}">${diff > 0 ? '+' : ''}${diff}</span></div>`;
    });
  if (before.element !== after.element) {
    rows.push(`<div class="rpg-stat-delta-row"><span>속성</span><span>${ELEMENT_NAMES[before.element]} → ${ELEMENT_NAMES[after.element]}</span><span></span></div>`);
  }
  return rows.length ? `<div class="rpg-stat-delta-table">${rows.join('')}</div>` : '<p class="rpg-hint">스탯 변화 없음</p>';
}

// 착용/구매처럼 되돌리기 애매한 행동 전에 조건 충족 여부·스탯 변화를 미리 보여주고, "확인"을 눌러야
// 실제로 실행됨(취소하거나 바깥을 누르면 아무 일도 안 일어남) - showTerritoryNotice와 같은 오버레이 패턴
function showConfirmOverlay(container, { title, bodyHtml, confirmLabel = '확인', confirmDisabled = false, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'rpg-notice-overlay';
  overlay.innerHTML = `
    <div class="rpg-notice-box">
      <h4>${title}</h4>
      ${bodyHtml}
      <div class="rpg-confirm-actions">
        <button class="rpg-confirm-btn" ${confirmDisabled ? 'disabled' : ''}>${confirmLabel}</button>
        <button class="rpg-cancel-btn">취소</button>
      </div>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.rpg-cancel-btn').addEventListener('click', close);
  overlay.querySelector('.rpg-confirm-btn').addEventListener('click', async () => {
    close();
    await onConfirm();
  });
  container.appendChild(overlay);
}

// 확인 버튼 하나만 있는 안내창(선택지 없음) - 확인 버튼 또는 바깥 영역 클릭으로 닫힘.
// 가방 정리 안내처럼 "행동 자체를 막는" 상황에 씀(닫아도 원래 하려던 행동은 그대로 취소된 상태)
function showAlertOverlay(container, { title, bodyHtml, confirmLabel = '확인' }) {
  const overlay = document.createElement('div');
  overlay.className = 'rpg-notice-overlay';
  overlay.innerHTML = `
    <div class="rpg-notice-box">
      <h4>${title}</h4>
      ${bodyHtml}
      <div class="rpg-confirm-actions">
        <button class="rpg-confirm-btn">${confirmLabel}</button>
      </div>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.rpg-confirm-btn').addEventListener('click', close);
  container.appendChild(overlay);
}

// 가방이 칸/무게 한도를 넘어 사냥·마을이동·구매 등이 막혔을 때 공용으로 쓰는 에러 처리 -
// inventory_over_capacity만 안내창으로, 나머지는 기존처럼 토스트로 보여줌
function handleActionError(container, e) {
  if (e.message === 'inventory_over_capacity') {
    showAlertOverlay(container, {
      title: '가방을 정리해주세요',
      bodyHtml: '<p>가방이 칸 또는 무게 한도를 넘었습니다. 인벤토리 탭에서 아이템을 팔거나(NPC판매) 상자에 맡겨 한도 아래로 정리해야 사냥·마을이동·구매를 계속할 수 있어요.</p>',
    });
    return;
  }
  showToast(friendlyError(e));
}

let character = null;
let activeSlot = null;
let activeTab = 'adventure';
let myUsername = null;
// 인벤토리 탭 - 페이지네이션(10개씩, 화면 전용) + 상단고정(핀) 상태(character.pinnedItemIds로 영속화 -
// loadCharacter가 로드 시 동기화, set-pinned-items.js가 저장). 앞쪽일수록 상단, 마지막으로 누른 게 맨 앞
const INVENTORY_PAGE_SIZE = 10;
let inventoryPage = 0;
let pinnedItemIds = [];
// 고정(핀)된 아이템은 항상 최상단 유지 - 정렬 모드는 그 아래 나머지 아이템들에만 적용됨
const INVENTORY_SORT_MODES = {
  default: { labelKey: 'rpg.ui.inventory.sortDefault', types: null },
  armor: { labelKey: 'rpg.ui.inventory.sortArmor', types: ['armor_top', 'armor_bottom', 'shield'] },
  weapon: { labelKey: 'rpg.ui.inventory.sortWeapon', types: ['weapon'] },
  consumable: { labelKey: 'rpg.ui.inventory.sortConsumable', types: ['consumable', 'bag'] },
};
let inventorySortMode = 'default';

// RPG API는 서버리스 함수 개수 제한(Vercel Hobby 12개) 때문에 api/rpg.js 하나로 통합돼있음 -
// action 필드로 내부 라우팅됨(api/_rpg/*.js, api/rpg.js 참고)
async function apiPostRaw(action, body) {
  const res = await fetch('/api/rpg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: currentAccessToken, action, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request_failed (HTTP ${res.status})`);
  return data;
}

// 현재 선택된 캐릭터 슬롯을 자동으로 실어보내는 헬퍼 - 캐릭터 선택 전(activeSlot null)에는 쓰지 않음
async function apiPost(action, body) {
  return apiPostRaw(action, { slot: activeSlot, ...body });
}

async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`/api/rpg?${qs}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request_failed (HTTP ${res.status})`);
  return data;
}

const ERROR_MESSAGES = {
  not_enough_turns: '턴포인트가 부족합니다.',
  no_torch: '횃불이 없습니다. 상점에서 구매하세요.',
  invalid_zone: '알 수 없는 지역입니다.',
  zone_locked: '이전 마을 최상위 사냥터의 성 도전 자격(100회 공략)을 먼저 채워야 합니다.',
  not_enough_gold: '골드가 부족합니다.',
  invalid_gold_amount: '판매할 골드 수량을 확인하세요(최소 100).',
  invalid_price: '희망 테스트파이 가격을 확인하세요.',
  too_many_listings: '이미 등록한 판매가 너무 많습니다(최대 5개). 먼저 취소하거나 판매를 기다려주세요.',
  listing_not_found: '해당 판매 등록을 찾을 수 없습니다.',
  not_your_listing: '본인이 등록한 판매만 취소할 수 있습니다.',
  listing_not_cancellable: '이미 팔렸거나 취소된 등록입니다.',
  listing_unavailable: '이미 다른 사람이 구매를 진행 중이거나 팔린 등록입니다.',
  cannot_buy_own_listing: '본인이 등록한 판매는 구매할 수 없습니다.',
  bag_tier_maxed: '이 등급 가방은 이미 한도를 다 채웠습니다. 다음 등급 가방이 필요합니다.',
  refill_on_cooldown: '턴 회복은 1시간에 한 번만 가능합니다.',
  not_enough_quiz_answers: '퀴즈를 더 풀어야 턴을 채울 수 있습니다.',
  turns_not_empty: '턴이 아직 남아있어서 채울 필요가 없습니다.',
  not_purchasable: '구매할 수 없는 아이템입니다.',
  not_enough_items: '아이템 수량이 부족합니다.',
  item_not_owned: '보유하지 않은 아이템입니다.',
  not_usable: '사용할 수 없는 아이템입니다.',
  wrong_weapon_type: '이 직업으로는 장착할 수 없는 무기입니다.',
  not_equippable: '장착할 수 없는 아이템입니다.',
  nothing_equipped: '장착된 아이템이 없습니다.',
  inventory_full: '인벤토리가 가득 찼습니다.',
  overweight: '짐이 너무 무거워서 더 들 수 없습니다. 힘을 올리거나 짐을 정리하세요.',
  armor_class_restricted: '이 직업은 착용할 수 없는 방어구 종류입니다.',
  repair_skill_too_low: '수리스킬 단계가 부족해 이 등급은 셀프 수리할 수 없습니다.',
  not_enough_strength: '힘이 부족해 착용할 수 없습니다.',
  not_enough_wisdom: '지혜가 부족해 착용할 수 없습니다.',
  invalid_skill: '알 수 없는 스킬입니다.',
  max_tier_reached: '이미 최고 단계입니다.',
  not_enough_clears: '아직 그 지역 성에 도전할 자격이 되지 않습니다 (100회 공략 필요).',
  already_owner: '이미 이 성을 차지하고 있습니다.',
  castle_not_found: '아직 아무도 차지하지 않은 성입니다.',
  not_castle_owner: '이 성의 성주만 방어력을 갱신할 수 있습니다.',
  not_enough_material: '재료가 부족합니다.',
  invalid_recipe: '알 수 없는 제작 레시피입니다.',
  wrong_town: '이 레시피는 재료가 나오는 지역이 속한 마을에서만 제작할 수 있습니다.',
  no_mild_injury: '붕대로 치료할 수 있는 경상이 없습니다.',
  no_injury: '치료할 부상이 없습니다.',
  no_hp_missing: '이미 체력이 가득 찼습니다.',
  already_hospitalized: '이미 입원 중입니다.',
  not_in_today_roster: '오늘 선술집에 없는 용병입니다. 목록이 갱신됐을 수 있어요.',
  party_full: '파티가 가득 찼습니다.',
  unknown_mercenary: '알 수 없는 용병입니다.',
  mercenary_not_found: '고용하지 않은 용병입니다.',
  invalid_mercenary: '잘못된 용병 요청입니다.',
  invalid_formation: '잘못된 진형 값입니다.',
  formation_not_allowed: '이 직업/무기로는 그 위치를 선택할 수 없습니다.',
  invalid_job: '알 수 없는 일자리입니다.',
  facility_full: '그 시설은 이미 인원이 가득 찼습니다 (최대 3명).',
  invalid_name: '이름은 1~12자로 입력해주세요.',
  invalid_squire: '잘못된 종자 지정입니다.',
  squire_already_absorbed: '이미 종자를 흡수한 용병입니다.',
  no_class_selected: '직업을 먼저 선택해야 합니다.',
  invalid_class: '알 수 없는 직업입니다.',
  class_already_chosen: '이미 직업을 선택했습니다.',
  subclass_already_chosen: '이미 부직업을 선택했습니다.',
  level_too_low: `레벨 ${SUB_CLASS_UNLOCK_LEVEL} 이상부터 부직업을 선택할 수 있습니다.`,
  same_as_main_class: '주직업과 같은 직업은 부직업으로 선택할 수 없습니다.',
  not_enough_stat_points: '분배 가능한 스탯포인트가 부족합니다.',
  invalid_stat: '알 수 없는 스탯입니다.',
  invalid_listing: '거래 등록 정보가 올바르지 않습니다.',
  not_enough_stock: '남은 수량이 부족합니다.',
  listing_not_found: '이미 판매되었거나 취소된 거래입니다.',
  cannot_buy_own_listing: '자신의 거래는 구매할 수 없습니다.',
  invalid_slot: '잘못된 캐릭터 슬롯입니다.',
  invalid_equip_slot: '잘못된 장비 슬롯입니다.',
  slot_occupied: '이미 캐릭터가 있는 슬롯입니다.',
  character_not_found: '캐릭터 정보를 찾을 수 없습니다.',
  invalid_town: '알 수 없는 마을입니다.',
  already_there: '이미 그 마을에 있습니다.',
  no_preview_to_refresh: '먼저 지역에 들어가야 새로고침할 수 있습니다.',
  invalid_direction: '잘못된 요청입니다.',
  invalid_amount: '금액/수량을 확인해주세요.',
  choose_one_resource_type: '골드와 아이템은 한 번에 하나만 처리할 수 있습니다.',
  unknown_item: '알 수 없는 아이템입니다.',
  not_enough_stored_gold: '보관함에 골드가 부족합니다.',
  not_enough_stored_items: '보관함에 아이템이 부족합니다.',
  already_full_durability: '이미 내구도가 가득 찼습니다.',
  invalid_quest: '알 수 없는 퀘스트입니다.',
  quest_already_done: '이미 완료한 퀘스트입니다.',
  quest_condition_not_met: '아직 퀘스트 조건을 만족하지 못했습니다.',
  invalid_message: '메시지를 확인해주세요 (150자 이내).',
  inventory_over_capacity: '가방이 칸/무게 한도를 넘었습니다. 정리 후 다시 시도하세요.',
};

function friendlyError(err) {
  return ERROR_MESSAGES[err.message] || '오류가 발생했습니다. 다시 시도해주세요.';
}

async function loadCharacter() {
  character = await apiPost('character', {});
  pinnedItemIds = character.pinnedItemIds || []; // 서버에 저장된 상단고정 순서를 화면 상태와 동기화
  return character;
}

export async function renderRpgPage(container, _username) {
  if (_username) myUsername = _username;
  setupPullToRefresh(container, () => renderRpgPage(container));
  container.innerHTML = `<div class="rpg-loading">불러오는 중...</div>`;

  if (activeSlot === null) {
    await renderCharacterSelect(container);
    return;
  }

  try {
    await loadCharacter();
    // 그날 첫 접속이면 서버가 알아서 판단해서 지급(하루 1회, 중복호출은 안전) - 계정당 1회이므로 지금 선택된 캐릭터가 받음
    apiPost('claim-daily-bonus', {}).then((r) => {
      if (r.granted) showToast(`퀴즈 랭킹 100위권 보너스 +${r.bonusTurns} 턴포인트!`);
    }).catch(() => {});
  } catch (e) {
    container.innerHTML = `<div class="rpg-loading">캐릭터 정보를 불러오지 못했습니다.</div>`;
    return;
  }

  if (!character.classMain) {
    renderClassSelect(container);
    return;
  }

  maybeShowSurveyLapsedNotice(container);
  maybeShowQuizRefillNotice(container);
  renderMain(container);
}

// 설문 문항이 추가/변경돼서 턴 상한 보너스가 해제됐을 때 한 번 안내(character.js가 이 전환을 감지한
// 첫 응답에만 surveyBonusLapsed:true를 내려줌 - 그 다음부턴 자연히 다시 안 뜸)
const QUIZ_TURN_REFILL_REQUIRED = 3; // claim-quiz-turn-refill.js의 REQUIRED_QUIZ_ANSWERS와 맞출 것
function maybeShowSurveyLapsedNotice(container) {
  if (!character.surveyBonusLapsed) return;
  showConfirmOverlay(container, {
    title: '📋 설문조사가 변경됐어요',
    bodyHtml: '<p>설문 문항이 추가되거나 바뀌어서 턴 상한 보너스가 해제됐습니다. 설문을 다시 완료하면 보너스가 돌아와요.</p>',
    confirmLabel: '확인',
    onConfirm: () => {},
  });
}

// 턴이 다 떨어졌을 때 - 1시간에 한 번, 퀴즈 몇 문제를 풀면 턴을 가득 채울 수 있다는 걸 안내(진행도는
// util-storage.js가 퀴즈 답할 때마다 세는 로컬 카운터). 쿨다운/자격 여부는 서버가 최종 판정함
function maybeShowQuizRefillNotice(container) {
  if ((character.turnPoints || 0) > 0) return;
  const progress = Math.min(getQuizRefillProgress(), QUIZ_TURN_REFILL_REQUIRED);
  const ready = progress >= QUIZ_TURN_REFILL_REQUIRED;
  showConfirmOverlay(container, {
    title: '⏳ 턴이 다 떨어졌어요',
    bodyHtml: `
      <p>1시간에 한 번, 퀴즈를 ${QUIZ_TURN_REFILL_REQUIRED}문제 풀면 턴을 가득 채울 수 있어요.</p>
      <p class="rpg-hint">지금까지 ${progress}/${QUIZ_TURN_REFILL_REQUIRED}문제 풀었어요.</p>
    `,
    confirmLabel: ready ? '턴 채우기' : '확인',
    onConfirm: async () => {
      if (!ready) return;
      try {
        const r = await apiPost('claim-quiz-turn-refill', { quizAnswersSolved: progress });
        character.turnPoints = r.turnPoints;
        resetQuizRefillProgress();
        const bar = container.querySelector('.rpg-statusbar');
        if (bar) bar.outerHTML = statusBarHtml();
        showToast('턴을 가득 채웠습니다!');
      } catch (e) { showToast(friendlyError(e)); }
    },
  });
}

// ── 캐릭터 선택 화면 (계정당 최대 5캐릭 - api/_rpgCharacter.js의 MAX_CHARACTER_SLOTS 참고) ──────────────
async function renderCharacterSelect(container) {
  container.innerHTML = `<div class="rpg-loading">${t('rpg.ui.charSelect.loading')}</div>`;
  let slots;
  try {
    const res = await apiPostRaw('list-characters', {});
    slots = res.slots;
  } catch (e) {
    container.innerHTML = `<div class="rpg-loading">${t('rpg.ui.charSelect.loadFail')}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="rpg-page">
      <h3>${t('rpg.ui.charSelect.title')}</h3>
      <p class="rpg-hint">${t('rpg.ui.charSelect.hint')}</p>
      <div class="rpg-class-cards">
        ${slots.map((s) => {
          // 직업을 아직 선택 안 한 캐릭터는(뒤로가기로 나온 경우 등) 실제로는 아무것도 안 정해진
          // 상태라 "새 캐릭터 생성"과 똑같이 취급함(선택을 안 했으니 눈에 보이는 변화도 없어야 함)
          const isBlank = !s.exists || !s.classMain;
          const slotLabel = ti(s.isTestSlot ? 'rpg.ui.charSelect.testSlotLabel' : 'rpg.ui.charSelect.slotLabel', getLang(), { slot: s.slot });
          return isBlank ? `
          <div class="rpg-slot-block">
            <button class="rpg-slot-btn" data-slot="${s.slot}">
              <div class="rpg-class-name">${slotLabel} — ${t('rpg.ui.charSelect.newCharacter')}</div>
            </button>
          </div>
        ` : `
          <div class="rpg-slot-block">
            <button class="rpg-slot-btn" data-slot="${s.slot}">
              <div class="rpg-class-name">${slotLabel} — Lv.${s.level} ${getClassName(s.classMain, getLang())}</div>
              <div class="rpg-class-skills">${s.gold}골드</div>
            </button>
            <button class="rpg-slot-delete-btn" data-slot="${s.slot}">${t('rpg.ui.charSelect.deleteBtn')}</button>
          </div>
        `;
        }).join('')}
      </div>
    </div>
  `;
  container.querySelectorAll('.rpg-slot-btn').forEach((btn, i) => btn.addEventListener('click', async () => {
    const slot = Number(btn.dataset.slot);
    const slotInfo = slots[i];
    if (!slotInfo.exists) {
      try {
        await apiPostRaw('create-character', { slot });
      } catch (e) {
        showToast(friendlyError(e));
        return;
      }
    }
    activeSlot = slot;
    renderRpgPage(container);
  }));
  container.querySelectorAll('.rpg-slot-delete-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const slot = Number(btn.dataset.slot);
    if (!confirm(ti('rpg.ui.charSelect.deleteConfirm', getLang(), { slot }))) return;
    try {
      const r = await apiPostRaw('delete-character', { slot });
      showToast(r.refund > 0
        ? ti('rpg.ui.charSelect.deletedWithRefund', getLang(), { town: getTownName(r.refundTown, getLang()), refund: r.refund })
        : t('rpg.ui.charSelect.deleted'));
      renderCharacterSelect(container);
    } catch (e) {
      showToast(friendlyError(e));
    }
  }));
}

function renderClassSelect(container) {
  container.innerHTML = `
    <div class="rpg-class-select">
      <button class="rpg-back-to-slots-btn">${t('rpg.ui.classSelect.back')}</button>
      <h3>${t('rpg.ui.classSelect.title')}</h3>
      <p class="rpg-hint">${t('rpg.ui.classSelect.hint')}</p>
      <div class="rpg-class-cards">
        ${Object.values(CLASSES).map((c) => `
          <button class="rpg-class-card" data-class="${c.id}">
            <div class="rpg-class-name">${getClassName(c.id, getLang())}</div>
            <div class="rpg-class-skills">${c.skills.map((s) => getSkillName(c.id, s.id, getLang())).join(', ')}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  container.querySelector('.rpg-back-to-slots-btn').addEventListener('click', () => {
    // 직업을 아직 안 골랐으니 서버에는 아무 변화도 없음 - 그냥 캐릭터 선택 화면으로 돌아감
    activeSlot = null;
    renderRpgPage(container);
  });
  container.querySelectorAll('.rpg-class-card').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await apiPost('choose-class', { classId: btn.dataset.class });
        await loadCharacter();
        renderMain(container);
      } catch (e) {
        showToast(friendlyError(e));
      }
    });
  });
}

function statusBarHtml() {
  return `
    <div class="rpg-statusbar">
      <span>Lv.${character.level}</span>
      <span>턴 ${character.turnPoints}/${character.turnPointsCap}</span>
      <span>HP ${character.currentHp}/${character.maxHp ?? '?'}</span>
      <span>MP ${character.currentMp}</span>
      <span>골드 ${character.gold}</span>
      <button class="rpg-switch-char-btn">${t('rpg.ui.statusbar.switchChar')}</button>
    </div>
  `;
}


function renderMain(container) {
  container.innerHTML = `
    <div class="rpg-page">
      ${statusBarHtml()}
      <div class="rpg-tabs">
        <button class="rpg-tab" data-tab="adventure">${t('rpg.ui.tabs.adventure')}</button>
        <button class="rpg-tab" data-tab="town">${t('rpg.ui.tabs.town')}</button>
        <button class="rpg-tab" data-tab="shop">${t('rpg.ui.tabs.shop')}</button>
        <button class="rpg-tab" data-tab="market">${t('rpg.ui.tabs.market')}</button>
        <button class="rpg-tab" data-tab="storage">${t('rpg.ui.tabs.storage')}</button>
        <button class="rpg-tab" data-tab="territory">${t('rpg.ui.tabs.territory')}</button>
        <button class="rpg-tab" data-tab="inventory">${t('rpg.ui.tabs.inventory')}</button>
        <button class="rpg-tab" data-tab="character">${t('rpg.ui.tabs.character')}</button>
      </div>
      <div class="rpg-tab-content"></div>
    </div>
  `;
  // 상태바가 outerHTML로 자주 다시 그려지므로, 캐릭터 변경 버튼은 container에 위임 바인딩
  container.addEventListener('click', (e) => {
    if (e.target.closest('.rpg-switch-char-btn')) {
      activeSlot = null;
      renderRpgPage(container);
    }
    const setBtn = e.target.closest('.rpg-set-info-btn');
    if (setBtn) showSetInfo(setBtn.dataset.set);
  });
  container.querySelectorAll('.rpg-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderMain(container);
    });
  });
  const content = container.querySelector('.rpg-tab-content');
  if (activeTab === 'adventure') renderAdventureTab(content, container);
  else if (activeTab === 'town') renderTownTab(content, container);
  else if (activeTab === 'shop') renderShopTab(content, container);
  else if (activeTab === 'market') renderMarketTab(content, container);
  else if (activeTab === 'storage') renderStorageTab(content, container);
  else if (activeTab === 'territory') renderTerritoryTab(content, container);
  else if (activeTab === 'inventory') renderInventoryTab(content, container);
  else if (activeTab === 'character') renderCharacterTab(content, container);
}

// ── 모험 탭 - 지역 목록(현재 마을 소속 + 던전)만 보여줌. 마을 이동은 마을 탭에서 ─────
const MONSTER_TAG_ICONS = { beast: '🐾', humanoid: '🗡️', undead: '💀', demon: '😈' };
// 몹 속성 표시 - 유저가 상성(data/rpg/elements.js)에 맞는 무기/장신구를 미리 챙길 수 있게 사냥터 미리보기에 노출
const ELEMENT_ICONS = { water: '💧', fire: '🔥', air: '🌪️', earth: '🪨', dark: '🌑', holy: '✨', none: '' };
// 몹 전력비(difficultyRatio, preview-zone.js가 계산)를 색으로 - rpg-combat.js의 MONSTER_DIFFICULTY_TIERS와
// 같은 기준을 그대로 재사용(경험치/골드 배율도 이 기준과 일치함)
function monsterDifficultyColor(ratio) {
  return monsterDifficultyTier(ratio ?? 0).color;
}

function renderAdventureTab(content, container) {
  const townName = character.currentTown ? getTownName(character.currentTown, getLang()) : t('rpg.ui.adventure.noTown');
  const townZones = Object.values(ZONES).filter((z) => z.town === character.currentTown || z.town === null);
  content.innerHTML = `
    <p class="rpg-hint">${ti('rpg.ui.adventure.currentLocation', getLang(), { town: townName })}</p>
    <div class="rpg-zone-list">
      ${townZones.map((z) => {
        const clears = (character.zoneClearCounts || {})[z.id] || 0;
        const eligible = clears >= CASTLE_CLEAR_REQUIREMENT;
        const unlockClears = z.unlockZoneId ? ((character.zoneClearCounts || {})[z.unlockZoneId] || 0) : null;
        const locked = z.unlockZoneId && unlockClears < CASTLE_CLEAR_REQUIREMENT;
        return `
        <div class="rpg-zone-block">
          <button class="rpg-zone-btn" data-zone="${z.id}" ${locked ? 'disabled' : ''}>
            <div class="rpg-zone-name">${getZoneName(z.id, getLang())}${locked ? ' 🔒' : ''}</div>
            <div class="rpg-zone-tier">Tier ${z.tier}${z.requiresTorch ? t('rpg.ui.adventure.requiresTorch') : ''}</div>
            ${locked ? `<div class="rpg-zone-tier">${ti('rpg.ui.adventure.unlockAfter', getLang(), { zone: getZoneName(z.unlockZoneId, getLang()), clears: unlockClears, req: CASTLE_CLEAR_REQUIREMENT })}</div>` : ''}
          </button>
          ${eligible ? `<p class="rpg-hint"><button class="rpg-castle-challenge-btn" data-zone="${z.id}">${t('rpg.ui.adventure.challengeCastle')}</button></p>` : ''}
        </div>
      `;
      }).join('')}
    </div>
    <p class="rpg-hint"><button class="rpg-castle-income-btn">${t('rpg.ui.adventure.claimIncome')}</button></p>
  `;
  content.querySelectorAll('.rpg-castle-challenge-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-castle', { zoneId: btn.dataset.zone });
      if (r.wasEmpty) {
        showToast(ti('rpg.ui.castle.claimedEmpty', getLang(), { zone: getZoneName(r.zoneId, getLang()) }));
      } else if (r.won) {
        showToast(ti('rpg.ui.castle.claimedWon', getLang(), { owner: r.previousOwnerName, zone: getZoneName(r.zoneId, getLang()), challenger: r.challengerRoll, defender: r.defenderRoll }));
      } else {
        showToast(ti('rpg.ui.castle.challengeFail', getLang(), { challenger: r.challengerRoll, defender: r.defenderRoll }));
      }
    } catch (e) { showToast(friendlyError(e)); }
  }));
  const incomeBtn = content.querySelector('.rpg-castle-income-btn');
  if (incomeBtn) incomeBtn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-castle-income', {});
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      if (r.alreadyClaimed) showToast(t('rpg.ui.castle.alreadyClaimed'));
      else if (r.income > 0) showToast(ti('rpg.ui.castle.incomeClaimed', getLang(), { income: r.income, count: r.ownedZones.length }));
      else showToast(t('rpg.ui.castle.noOwnedCastle'));
    } catch (e) { showToast(friendlyError(e)); }
  });
  content.querySelectorAll('.rpg-zone-btn').forEach((btn) => {
    btn.addEventListener('click', () => enterZonePreview(content, container, btn.dataset.zone));
  });
}

// 지역 클릭 시 - 바로 전투가 아니라 몹 구성을 먼저 보여줌("필드에 들어간" 느낌). 처음 보는 건 무료
async function enterZonePreview(content, container, zoneId) {
  content.innerHTML = `<div class="rpg-loading">${t('rpg.ui.castle.enteringZone')}</div>`;
  try {
    const r = await apiPost('preview-zone', { zoneId });
    renderZonePreviewScreen(content, container, r.preview);
  } catch (e) {
    content.innerHTML = `<div class="rpg-loading">${friendlyError(e)}</div><p><button class="rpg-zone-back-btn">${t('rpg.ui.zonePreview.backToList')}</button></p>`;
    const backBtn = content.querySelector('.rpg-zone-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => renderAdventureTab(content, container));
  }
}

// 성 화면 - "성 입장" 버튼을 눌러야 들어오는 별도 메뉴. 여기서 보상/현재 성주/도전·방어력갱신을 다 보여줌
async function renderCastleScreen(content, container, zoneId) {
  content.innerHTML = `<div class="rpg-loading">${t('rpg.ui.castle.entering')}</div>`;
  let castleInfo;
  try {
    castleInfo = await apiPost('castle-status', { zoneId });
  } catch (e) {
    content.innerHTML = `<div class="rpg-loading">${friendlyError(e)}</div>`;
    return;
  }

  const zone = ZONES[zoneId];
  const dailyGold = zone.tier * GOLD_INCOME_PER_TIER;
  const materialNote = zone.tier >= MATERIAL_BONUS_MIN_TIER ? ti('rpg.ui.castle.materialBonusNote', getLang(), { qty: MATERIAL_BONUS_QTY }) : '';
  const castle = castleInfo.castle;
  const isMine = castle && castle.ownerUsername === myUsername && castle.ownerSlot === activeSlot;

  let statusLine;
  let actionBtn;
  if (!castle) {
    statusLine = t('rpg.ui.castle.emptyHint');
    actionBtn = `<button class="rpg-castle-challenge-btn" data-zone="${zoneId}">${t('rpg.ui.castle.challengeBtn')}</button>`;
  } else if (isMine) {
    statusLine = ti('rpg.ui.castle.ownerSelf', getLang(), { power: Math.round(castle.defensePower || 0) });
    actionBtn = `<button class="rpg-castle-refresh-btn" data-zone="${zoneId}">${t('rpg.ui.castle.refreshBtn')}</button>`;
  } else {
    statusLine = ti('rpg.ui.castle.ownerOther', getLang(), { owner: castle.ownerName || castle.ownerUsername, power: Math.round(castle.defensePower || 0) });
    actionBtn = `<button class="rpg-castle-challenge-btn" data-zone="${zoneId}">${t('rpg.ui.castle.challengeBtn')}</button>`;
  }

  // 야전의무실 - 부상 치료는 안 되고(휴게소는 보류), 턴을 써서 순수 체력만 회복. 본인+용병 전부 대상
  const selfStats = computeCharacterCombatStats(character);
  const infirmaryRows = [
    hpRestRowHtml('나', null, character.currentHp, selfStats.maxHp),
    ...(character.mercenaries || []).map((m) => hpRestRowHtml(m.name, m.id, m.currentHp, computeCharacterCombatStats(m).maxHp)),
  ].filter(Boolean).join('');

  content.innerHTML = `
    <p><button class="rpg-castle-back-btn">${t('rpg.ui.castle.backToHunting')}</button></p>
    <div class="rpg-castle-section">
      <h4>🏰 ${getZoneName(zoneId, getLang())}의 성</h4>
      <p class="rpg-hint">${ti('rpg.ui.castle.dailyIncomeLabel', getLang(), { gold: dailyGold })}${materialNote}</p>
      <p class="rpg-hint">${statusLine}</p>
      <p>${actionBtn}</p>
    </div>
    <div class="rpg-castle-section">
      <h4>${t('rpg.ui.castle.infirmaryTitle')}</h4>
      <p class="rpg-hint">${t('rpg.ui.castle.infirmaryHint')}</p>
      ${infirmaryRows || `<p class="rpg-hint">${t('rpg.ui.castle.noInjured')}</p>`}
    </div>
  `;
  content.querySelector('.rpg-castle-back-btn').addEventListener('click', () => enterZonePreview(content, container, zoneId));
  content.querySelectorAll('.rpg-rest-heal-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const mercId = btn.dataset.merc || null;
    try {
      const r = await apiPost('rest-heal', mercId ? { part: 'hp', mercId } : { part: 'hp' });
      character.turnPoints = r.turnPoints;
      if (mercId) {
        const merc = (character.mercenaries || []).find((m) => m.id === mercId);
        if (merc) merc.currentHp = r.currentHp;
      } else {
        character.currentHp = r.currentHp;
      }
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      showToast(ti('rpg.ui.castle.healed', getLang(), { cost: r.cost }));
      renderCastleScreen(content, container, zoneId);
    } catch (e) { showToast(friendlyError(e)); }
  }));

  const castleChallengeBtn = content.querySelector('.rpg-castle-challenge-btn');
  if (castleChallengeBtn) castleChallengeBtn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-castle', { zoneId });
      if (r.wasEmpty) showToast(ti('rpg.ui.castle.claimedEmpty', getLang(), { zone: getZoneName(r.zoneId, getLang()) }));
      else if (r.won) showToast(ti('rpg.ui.castle.claimedWon', getLang(), { owner: r.previousOwnerName, zone: getZoneName(r.zoneId, getLang()), challenger: r.challengerRoll, defender: r.defenderRoll }));
      else showToast(ti('rpg.ui.castle.challengeFail', getLang(), { challenger: r.challengerRoll, defender: r.defenderRoll }));
      renderCastleScreen(content, container, zoneId);
    } catch (e) { showToast(friendlyError(e)); }
  });
  const castleRefreshBtn = content.querySelector('.rpg-castle-refresh-btn');
  if (castleRefreshBtn) castleRefreshBtn.addEventListener('click', async () => {
    try {
      const r = await apiPost('refresh-castle-defense', { zoneId });
      showToast(ti('rpg.ui.castle.defenseRefreshed', getLang(), { prev: r.previousDefensePower, next: r.defensePower }));
      renderCastleScreen(content, container, zoneId);
    } catch (e) { showToast(friendlyError(e)); }
  });
}

// 필드 진입 화면 - 서로 다른 랜덤 몹 구성 후보 여러 개를 한 번에 보여주고, 그중 하나를 골라 그 조합
// 그대로 전투를 시작함("여러 조합 중에 골라서 들어간다"). 새로고침은 골드를 써서 후보 전체를 다시 굴림
// (다른 지역에 갔다와도 이 지역 미리보기는 그대로 유지됨 - 지역별로 따로 저장)
function renderZonePreviewScreen(content, container, preview) {
  const zone = ZONES[preview.zoneId];
  const clears = (character.zoneClearCounts || {})[preview.zoneId] || 0;
  const castleEligible = clears >= CASTLE_CLEAR_REQUIREMENT;
  content.innerHTML = `
    <p><button class="rpg-zone-back-btn">${t('rpg.ui.zonePreview.backToList')}</button></p>
    <h4>${ti('rpg.ui.zonePreview.enteredZone', getLang(), { zone: getZoneName(zone.id, getLang()) })}</h4>
    <p class="rpg-hint">${t('rpg.ui.zonePreview.pickHint')}</p>
    <div class="rpg-encounter-option-list">
      ${preview.options.map((opt, idx) => `
        <button class="rpg-encounter-option-btn" data-zone="${preview.zoneId}" data-option="${idx}">
          ${opt.isRare ? `<span class="rpg-encounter-rare-tag">${t('rpg.ui.zonePreview.rare')}</span>` : ''}
          <div class="rpg-encounter-option-monsters">
            ${opt.monsters.map((m) => `
              <span class="rpg-encounter-icon">${MONSTER_TAG_ICONS[(m.tags || [])[0]] || '❓'}</span>
              <span class="rpg-encounter-name" style="color: ${monsterDifficultyColor(m.difficultyRatio)}">${getMonsterName(m.monsterId, getLang())}${m.element && m.element !== 'none' ? ` ${ELEMENT_ICONS[m.element] || ''}` : ''}</span>
            `).join(' · ')}
          </div>
        </button>
      `).join('')}
    </div>
    <p class="rpg-hint">
      <button class="rpg-refresh-encounter-btn" data-zone="${preview.zoneId}" ${character.gold >= preview.refreshGoldCost ? '' : 'disabled'}>${ti('rpg.ui.zonePreview.refresh', getLang(), { cost: preview.refreshGoldCost })}</button>
    </p>
    ${combatLogSpeedControlHtml()}
    <div class="rpg-combat-log"></div>
    ${castleEligible ? `<p><button class="rpg-castle-enter-btn" data-zone="${preview.zoneId}">${t('rpg.ui.zonePreview.castleEnter')}</button></p>` : ''}
  `;
  const log = content.querySelector('.rpg-combat-log');
  wireCombatLogSpeedControl(content);
  content.querySelector('.rpg-zone-back-btn').addEventListener('click', () => renderAdventureTab(content, container));
  const castleEnterBtn = content.querySelector('.rpg-castle-enter-btn');
  if (castleEnterBtn) castleEnterBtn.addEventListener('click', () => renderCastleScreen(content, container, preview.zoneId));
  content.querySelector('.rpg-refresh-encounter-btn').addEventListener('click', async () => {
    try {
      const r = await apiPost('preview-zone', { zoneId: preview.zoneId, refresh: true });
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderZonePreviewScreen(content, container, r.preview);
    } catch (e) { showToast(friendlyError(e)); }
  });
  content.querySelectorAll('.rpg-encounter-option-btn').forEach((btn) => btn.addEventListener('click', async () => {
    log.innerHTML = `<div class="rpg-loading">${t('rpg.ui.zonePreview.inCombat')}</div>`;
    try {
      const result = await apiPost('adventure', { zoneId: btn.dataset.zone, optionIndex: Number(btn.dataset.option) });
      await loadCharacter(); // 레벨업으로 maxHp 등이 바뀌었을 수 있어 서버 최신값으로 새로고침

      // 다른 탭으로 넘어가면 content.innerHTML이 통째로 바뀌면서 log가 화면에서 떨어져 나감(에러는
      // 안 나지만 안 보이는 곳에서 계속 재생되다가 나중에 엉뚱한 화면에 팝업이 뜨는 등 어색해짐) -
      // 그런 경우 여기서 조용히 멈춤(캐릭터 상태 자체는 이미 loadCharacter로 반영이 끝난 뒤라 안전함)
      if (!log.isConnected) return;

      await playCombatLog(log, result.log);
      if (!log.isConnected) return;
      log.insertAdjacentHTML('beforeend', `
        <div class="rpg-log-summary">
          ${result.victory ? t('rpg.ui.zonePreview.victory') : t('rpg.ui.zonePreview.defeat')} · 경험치 +${result.xpGain} · 골드 +${result.goldGain}
          ${result.levelsGained ? ti('rpg.ui.zonePreview.levelUp', getLang(), { level: result.level }) : ''}
          ${result.loot.length ? ti('rpg.ui.zonePreview.loot', getLang(), { items: result.loot.map((d) => `${getItemName(d.itemId, getLang())} x${d.qty}`).join(', ') }) : ''}
        </div>
        ${loreUnlockHtml(result.newLore)}
      `);
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      showTerritoryNotice(container, result.territoryNotice);
    } catch (e) {
      if (e.message === 'inventory_over_capacity') {
        if (log.isConnected) log.innerHTML = '';
        handleActionError(container, e);
      } else if (log.isConnected) {
        log.innerHTML = `<div class="rpg-loading">${friendlyError(e)}</div>`;
      }
    }
  }));
}

// 전투 로그에서 강타/특수기/치명타/추가타처럼 눈에 띄어야 할 메시지를 구분하기 위한 키워드 모음.
// 로그가 구조화된 데이터가 아니라 문장이라, 직업/몹 스킬 이름을 전부 모아서 문장에 포함되는지로 판별함.
// 함수로 둬서(모듈 로드 시 한 번만 굳는 상수가 아니라) 호출 시점의 언어(getLang())를 반영함
function getAllSkillNames() {
  const lang = getLang();
  return [
    ...Object.values(CLASSES).flatMap((c) => c.skills.map((s) => getSkillName(c.id, s.id, lang))),
    ...Object.values(MONSTERS).flatMap((m) => (m.skills || []).map((s) => getMonsterSkillName(m.id, s.id, lang))),
  ];
}
// 5가지로 구분: 치명타(빨강) > 추가타(보라) > 스킬/강타(청록) > 회복(초록) > 빗나감/회피(회색)
// - 겹치면 앞쪽(치명타 등)이 우선, CSS에서도 같은 순서로 선언해 우선순위를 맞춤
function classifyCombatLogLine(line) {
  const classes = [];
  if (line.includes('💥치명타')) classes.push('rpg-log-crit');
  if (line.includes('(추가타!)')) classes.push('rpg-log-extra');
  if (getAllSkillNames().some((name) => line.includes(name))) classes.push('rpg-log-skill');
  if (line.includes('회복했다')) classes.push('rpg-log-heal');
  if (COMBAT_MISS_PHRASES.some((phrase) => line.includes(phrase))) classes.push('rpg-log-miss');
  return classes;
}

// 전투 메시지 재생 속도 - 기기(브라우저)에 저장해서 다음 전투에도 그대로 유지됨. 기본값은 "천천히"
const COMBAT_LOG_SPEED_KEY = 'rpg_combat_log_speed';
const COMBAT_LOG_SPEEDS = { slow: { label: '느리게', mult: 3 }, normal: { label: '보통', mult: 1.5 }, fast: { label: '빠르게', mult: 0.8 } };
function getCombatLogSpeed() {
  const saved = localStorage.getItem(COMBAT_LOG_SPEED_KEY);
  return COMBAT_LOG_SPEEDS[saved] ? saved : 'slow';
}
function combatLogSpeedControlHtml() {
  const current = getCombatLogSpeed();
  return `
    <div class="rpg-log-speed-control">
      <span class="rpg-hint">전투 메시지 속도:</span>
      ${Object.entries(COMBAT_LOG_SPEEDS).map(([key, def]) => `
        <button class="rpg-log-speed-btn${key === current ? ' rpg-log-speed-btn-active' : ''}" data-speed="${key}">${def.label}</button>
      `).join('')}
    </div>
  `;
}
function wireCombatLogSpeedControl(root) {
  root.querySelectorAll('.rpg-log-speed-btn').forEach((btn) => btn.addEventListener('click', () => {
    localStorage.setItem(COMBAT_LOG_SPEED_KEY, btn.dataset.speed);
    root.querySelectorAll('.rpg-log-speed-btn').forEach((b) => b.classList.toggle('rpg-log-speed-btn-active', b === btn));
  }));
}

// 전투 로그를 한 번에 쏟아내지 않고 한 줄씩 순차 출력 - 결과를 바로 던지는 대신 진행 과정을
// 보는 느낌을 주기 위함(전열 붕괴/위험수위 경고 등의 긴장감이 이 페이싱으로 살아남).
// 줄 수가 많은(레전더리급 장기전) 전투는 한 줄당 지연을 줄여 전체 재생시간을 비슷하게 맞추되,
// 그 위에 유저가 고른 속도 배율(기본 "느리게")을 곱해서 최종 지연을 정함
// 근본 해결책: 내부 스크롤 박스로 "최신 줄"을 따라가게 하는 대신, 전투 시작 시 화면을 딱 한 번만
// 로그 상단으로 스크롤해두고(.rpg-combat-log에 min-height로 아래 공간을 미리 확보해둔 상태) 그 뒤로는
// 스크롤 위치를 전혀 건드리지 않음 - 줄이 위에서부터 차례로 쌓이기만 하고 화면이 안 움직이니 느긋하게 볼 수 있음
async function playCombatLog(logEl, lines) {
  logEl.innerHTML = '<div class="rpg-log-lines"></div>';
  const linesEl = logEl.querySelector('.rpg-log-lines');
  // 레이아웃이 자리잡은 뒤 스크롤되게 requestAnimationFrame으로 한 틱 미룸 - 이후로는 다시 스크롤하지 않음
  await new Promise((resolve) => requestAnimationFrame(() => { logEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); resolve(); }));
  const speedMult = COMBAT_LOG_SPEEDS[getCombatLogSpeed()].mult;
  const delay = Math.max(300, Math.min(1200, 6000 / Math.max(lines.length, 1))) * speedMult;
  for (const line of lines) {
    if (!logEl.isConnected) return; // 재생 도중 다른 탭으로 넘어갔으면 조용히 멈춤
    const p = document.createElement('p');
    p.textContent = line;
    classifyCombatLogLine(line).forEach((cls) => p.classList.add(cls));
    linesEl.appendChild(p);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// ── 새로 언락된 탐험일지(로어) 알림 ───────────────────
function loreUnlockHtml(newLore) {
  if (!newLore || !newLore.length) return '';
  return newLore.map((entry) => `
    <div class="rpg-lore-unlock">
      <b>${ti('rpg.ui.lore.unlockTitle', getLang(), { title: getLoreTitle(entry.id, getLang()) })}</b><br>${getLoreText(entry.id, getLang())}
    </div>
  `).join('');
}

// ── 퀘스트 한 줄(NPC 카드 안에서 사용) ────────────────
function questRowHtml(questId) {
  const quest = QUESTS[questId];
  if (!quest) return '';
  const done = (character.questFlags || {})[questId] === 'done';
  const met = !done && checkQuestCondition(character, quest.condition);
  return `
    <div class="rpg-shop-row">
      <span>${getQuestName(questId, getLang())} — ${getQuestDesc(questId, getLang())}${done ? ' ✅' : ''}</span>
      ${!done ? `<button class="rpg-quest-claim-btn" data-quest="${questId}" ${met ? '' : 'disabled'}>${t('rpg.ui.quest.claimBtn')}</button>` : ''}
    </div>
  `;
}

// ── 의사 NPC 치료 UI(경상/중상 관계없이 즉시 완치, 비용은 남은 회복턴에 비례, 골드 지불) ─────
// 본인뿐 아니라 고용한 용병들의 부상도 여기서 같이 치료 가능(mercId 데이터속성으로 구분).
// 턴을 소모해 쉬면서 회복하는 쪽(무료, 느림)은 영지 탭 쪽 담당(territoryRestRowHtml/territoryHpRestRowHtml 참고)
function cureRowHtml(name, part, injury, mercId) {
  const severityLabel = injury.severity === 2 ? t('rpg.ui.doctor.severityMajor') : t('rpg.ui.doctor.severityMinor');
  const mercAttr = mercId ? ` data-merc="${mercId}"` : '';
  const cost = computeCureCost(injury);
  return `
    <div class="rpg-shop-row">
      <span>${ti('rpg.ui.doctor.statusLabel', getLang(), { name, part: bodyPartName(part), severity: severityLabel, turns: injury.turnsLeft })}</span>
      <span><button class="rpg-cure-btn" data-part="${part}"${mercAttr}>${ti('rpg.ui.doctor.cureBtn', getLang(), { cost })}</button></span>
    </div>
  `;
}
function doctorCureHtml() {
  const rows = [];
  const injuries = character.injuries || {};
  ['arm', 'leg'].filter((p) => (injuries[p] || {}).severity > 0)
    .forEach((part) => rows.push(cureRowHtml(t('rpg.ui.common.self'), part, injuries[part], null)));
  (character.mercenaries || []).forEach((m) => {
    const mInjuries = m.injuries || {};
    ['arm', 'leg'].filter((p) => (mInjuries[p] || {}).severity > 0)
      .forEach((part) => rows.push(cureRowHtml(m.name, part, mInjuries[part], m.id)));
  });
  if (!rows.length) return `<p class="rpg-hint">${t('rpg.ui.doctor.noInjured')}</p>`;
  return rows.join('');
}
// ── 영지 탭 - 턴 소모로 쉬며 회복(부상/체력 무관하게 무료지만 느림, 골드 지불 즉시완치는 마을 의사 담당) ──
function territoryRestRowHtml(name, part, injury, mercId) {
  const severityLabel = injury.severity === 2 ? t('rpg.ui.doctor.severityMajor') : t('rpg.ui.doctor.severityMinor');
  const mercAttr = mercId ? ` data-merc="${mercId}"` : '';
  const restCost = REST_HEAL_TURN_COST_BY_SEVERITY[injury.severity] || 2;
  return `
    <div class="rpg-shop-row">
      <span>${ti('rpg.ui.doctor.statusLabel', getLang(), { name, part: bodyPartName(part), severity: severityLabel, turns: injury.turnsLeft })}</span>
      <span><button class="rpg-rest-heal-btn" data-part="${part}"${mercAttr}>${ti('rpg.ui.territory.restHealBtn', getLang(), { cost: restCost })}</button></span>
    </div>
  `;
}
// 체력(HP) 자체 회복 - 부상과 무관하게 깎인 체력을 턴을 써서 채움(부상 치료보다 턴 소모 적음).
// 항상 표시(용병을 고용해야만 보이는 게 아니라 본인 것도 상시 표시), 체력이 꽉 찼으면 숨김
function hpRestRowHtml(name, mercId, currentHp, maxHp) {
  if (currentHp >= maxHp) return '';
  const missingPct = (maxHp - currentHp) / maxHp;
  const hospitalMult = Math.max(0.2, 1 - (TERRITORY_JOBS.hospital.bonusPctPerLevel * ((character.facilityLevels || {}).hospital || 0)) / 100);
  const restCost = Math.max(1, Math.round(missingPct * HP_REST_HEAL_FULL_TURNS * hospitalMult));
  const mercAttr = mercId ? ` data-merc="${mercId}"` : '';
  return `
    <div class="rpg-shop-row">
      <span>${ti('rpg.ui.territory.hpLabel', getLang(), { name, current: currentHp, max: maxHp })}</span>
      <span><button class="rpg-rest-heal-btn" data-part="hp"${mercAttr}>${ti('rpg.ui.territory.hpRestBtn', getLang(), { cost: restCost })}</button></span>
    </div>
  `;
}
function territoryRestHtml() {
  const rows = [];
  const injuries = character.injuries || {};
  ['arm', 'leg'].filter((p) => (injuries[p] || {}).severity > 0)
    .forEach((part) => rows.push(territoryRestRowHtml(t('rpg.ui.common.self'), part, injuries[part], null)));
  const selfStats = computeCharacterCombatStats(character);
  rows.push(hpRestRowHtml(t('rpg.ui.common.self'), null, character.currentHp, selfStats.maxHp));
  (character.mercenaries || []).forEach((m) => {
    const mInjuries = m.injuries || {};
    ['arm', 'leg'].filter((p) => (mInjuries[p] || {}).severity > 0)
      .forEach((part) => rows.push(territoryRestRowHtml(m.name, part, mInjuries[part], m.id)));
    const mStats = computeCharacterCombatStats(m);
    rows.push(hpRestRowHtml(m.name, m.id, m.currentHp, mStats.maxHp));
  });
  const nonEmptyRows = rows.filter(Boolean);
  if (!nonEmptyRows.length) return `<div class="rpg-territory-rest"><h4>${t('rpg.ui.territory.restTitle')}</h4><p class="rpg-hint">${t('rpg.ui.territory.restNone')}</p></div>`;
  return `<div class="rpg-territory-rest"><h4>${t('rpg.ui.territory.restTitle')}</h4>${nonEmptyRows.join('')}</div>`;
}

// ── 직업 교관 NPC - 스킬 훈련 UI. 미습득 스킬은 전투에서 안 나가니 먼저 배워야 함 ─────
function trainerHtml() {
  if (!character.classMain) return `<p class="rpg-hint">${t('rpg.ui.trainer.noClass')}</p>`;
  const cls = CLASSES[character.classMain];
  const essenceItemId = CLASS_ESSENCE_ITEM[character.classMain];
  const owned = (character.inventory || []).find((e) => e.itemId === essenceItemId);
  const ownedQty = owned ? owned.qty : 0;
  const skillLevels = character.skillLevels || {};
  return `
    <p class="rpg-hint">${ti('rpg.ui.trainer.ownedMaterial', getLang(), { item: getItemName(essenceItemId, getLang()), qty: ownedQty })}</p>
    ${cls.skills.map((s) => {
      const tier = skillLevels[s.id] || 0;
      const maxed = tier >= MAX_SKILL_TIER;
      const cost = maxed ? null : TRAINING_TIER_COSTS[tier + 1];
      const label = tier === 0 ? t('rpg.ui.trainer.learnBtn') : t('rpg.ui.trainer.levelUpBtn');
      return `
        <div class="rpg-shop-row">
          <span>${getSkillName(cls.id, s.id, getLang())} — ${tier === 0 ? t('rpg.ui.trainer.unlearned') : ti('rpg.ui.trainer.tierLabel', getLang(), { tier, max: MAX_SKILL_TIER })}${maxed ? t('rpg.ui.trainer.maxed') : ''}</span>
          ${maxed ? '' : `<button class="rpg-train-skill-btn" data-skill="${s.id}">${ti('rpg.ui.trainer.trainBtn', getLang(), { label, item: getItemName(essenceItemId, getLang()), essence: cost.essence, gold: cost.gold })}</button>`}
        </div>
      `;
    }).join('')}
  `;
}

// ── 대장간 NPC - 수리(항상 가능) + 수리스킬 훈련(배우면 셀프 수리 가능, 대장간보다 저렴) ─────
const REPAIR_COST_PER_POINT_BY_RARITY = { normal: 2, uncommon: 3, rare: 5, epic: 8, legendary: 12 };
function rarityName(rarity) { return t(`rpg.ui.rarity.${rarity}`); }
function blacksmithHtml() {
  const needsRepair = DURABILITY_TRACKED_SLOTS
    .map((s) => ({ slot: s, itemId: character.equipment[s], durability: character.equipment[`${s}Durability`] ?? 100 }))
    .filter((e) => e.itemId && e.durability < 100);

  const repairRows = needsRepair.length ? needsRepair.map((e) => {
    const item = ITEMS[e.itemId];
    const costPerPoint = REPAIR_COST_PER_POINT_BY_RARITY[item.rarity] || 2;
    const cost = Math.ceil((100 - e.durability) * costPerPoint);
    return `
      <div class="rpg-shop-row">
        <span>${equipSlotLabel(e.slot)}: ${getItemName(item.id, getLang())} — 내구도 ${e.durability}/100</span>
        <button class="rpg-blacksmith-repair-btn" data-slot="${e.slot}">수리(${cost}골드)</button>
      </div>
    `;
  }).join('') : `<p class="rpg-hint">${t('rpg.ui.blacksmith.noRepairNeeded')}</p>`;

  const repairSkill = character.repairSkillLevel || 0;
  const maxedSkill = repairSkill >= MAX_REPAIR_SKILL_LEVEL;
  const nextSkillCost = maxedSkill ? null : REPAIR_SKILL_COSTS[repairSkill + 1];
  const capLabel = repairSkill > 0 ? ti('rpg.ui.blacksmith.selfRepairCap', getLang(), { rarity: rarityName(REPAIR_SKILL_RARITY_CAP[repairSkill]) }) : t('rpg.ui.blacksmith.selfRepairNone');

  return `
    <h5>${t('rpg.ui.blacksmith.needsRepairTitle')}</h5>
    ${repairRows}
    <h5>${t('rpg.ui.blacksmith.repairSkillTitle')}</h5>
    <div class="rpg-shop-row">
      <span>${ti('rpg.ui.blacksmith.repairSkillLabel', getLang(), { level: repairSkill, max: MAX_REPAIR_SKILL_LEVEL, cap: capLabel })}</span>
      ${maxedSkill ? '' : `<button class="rpg-train-repair-skill-btn">${ti('rpg.ui.blacksmith.trainSkillBtn', getLang(), { label: repairSkill === 0 ? t('rpg.ui.trainer.learnBtn') : t('rpg.ui.trainer.levelUpBtn'), cost: nextSkillCost })}</button>`}
    </div>
    <h5>${t('rpg.ui.blacksmith.craftTitle')}</h5>
    ${craftSectionHtml()}
  `;
}

// 지역 재료로 테마 장비를 만드는 제작 목록 - 지금 있는 마을(currentTown)에 속한 지역 레시피만 표시
function craftSectionHtml() {
  const recipes = Object.entries(CRAFT_RECIPES).filter(([, r]) => r.town === character.currentTown || r.town === null);
  if (!recipes.length) return `<p class="rpg-hint">${t('rpg.ui.craft.noneAvailable')}</p>`;
  const inventory = character.inventory || [];
  const sorted = recipes.sort(([, a], [, b]) => a.tier - b.tier || (a.tierKey === 'core' ? 1 : 0) - (b.tierKey === 'core' ? 1 : 0));
  return sorted.map(([key, r]) => {
    const item = ITEMS[r.resultItemId];
    const matItem = ITEMS[r.materialId];
    const have = (inventory.find((e) => e.itemId === r.materialId) || {}).qty || 0;
    const enoughMat = have >= r.materialQty;
    const enoughGold = (character.gold || 0) >= r.gold;
    return `
      <div class="rpg-shop-row">
        <span>${r.zoneName} ${r.tierKey === 'core' ? t('rpg.ui.craft.coreLabel') : ''} — ${getItemName(item.id, getLang())}${itemStatsLabel(item)}<br>
          <span class="rpg-hint">${ti('rpg.ui.craft.materialLabel', getLang(), { material: getItemName(matItem.id, getLang()), have, need: r.materialQty, gold: r.gold })}</span></span>
        <button class="rpg-craft-btn" data-recipe="${key}" ${enoughMat && enoughGold ? '' : 'disabled'}>${t('rpg.ui.craft.btn')}</button>
      </div>
    `;
  }).join('');
}

// ── 선술집 NPC - 용병 고용 UI(파티 구성은 플레이어 자유 - 오늘 로테이션 + 미고용 용병만 필터) ─────
function tavernHireHtml() {
  const mercenaries = character.mercenaries || [];
  const totalCap = MAX_MERCENARIES + MAX_TERRITORY_MERCENARIES;
  if (mercenaries.length >= totalCap) return `<p class="rpg-hint">${ti('rpg.ui.tavern.capReached', getLang(), { count: mercenaries.length, cap: totalCap })}</p>`;
  if (!character.classMain) return `<p class="rpg-hint">${t('rpg.ui.tavern.noClass')}</p>`;
  const hiredTemplateIds = new Set(mercenaries.map((m) => m.templateId));
  const todayRoster = new Set(dailyTavernRoster(character.currentTown || 'town1'));
  const options = Object.values(MERCENARY_TEMPLATES)
    .filter((tmpl) => todayRoster.has(tmpl.id) && !hiredTemplateIds.has(tmpl.id));
  if (!options.length) return `<p class="rpg-hint">${t('rpg.ui.tavern.noneToday')}</p>`;
  return options.map((tmpl) => {
    const cls = CLASSES[tmpl.classMain];
    return `
      <div class="rpg-shop-row">
        <span>${ti('rpg.ui.tavern.rowLabel', getLang(), { name: getMercTemplateName(tmpl.id, getLang()), level: tmpl.baseLevel, class: cls ? getClassName(cls.id, getLang()) : tmpl.classMain, hireCost: tmpl.hireCost, wage: tmpl.wagePerAdventure })}</span>
        <button class="rpg-hire-btn" data-template="${tmpl.id}">${t('rpg.ui.tavern.hireBtn')}</button>
      </div>
    `;
  }).join('');
}

// 다른 마을로 이동 가능한지 - 그 마을 소속 지역의 unlockZoneId 조건(이전 마을 최상위 지역 100회 공략)을 봄
function isTownUnlocked(townId) {
  if (townId === character.currentTown) return true;
  const gateZone = Object.values(ZONES).find((z) => z.town === townId);
  const gateZoneId = gateZone && gateZone.unlockZoneId;
  if (!gateZoneId) return true;
  return ((character.zoneClearCounts || {})[gateZoneId] || 0) >= CASTLE_CLEAR_REQUIREMENT;
}

// ── 마을 탭(NPC + 게시판) ────────────────────────────
function renderTownTab(content, container) {
  const townName = character.currentTown ? getTownName(character.currentTown, getLang()) : character.currentTown;
  const townNpcs = Object.values(NPCS).filter((n) => n.townId === character.currentTown);
  const otherTowns = Object.values(TOWNS).filter((town) => town.id !== character.currentTown);
  content.innerHTML = `
    <p class="rpg-hint">${ti('rpg.ui.town.currentLocation', getLang(), { town: townName })}</p>
    <h4>${t('rpg.ui.town.travelTitle')}</h4>
    <p class="rpg-hint">
      ${otherTowns.map((town) => {
        const unlocked = isTownUnlocked(town.id);
        return `<button class="rpg-travel-town-btn" data-town="${town.id}" ${unlocked ? '' : 'disabled'}>${getTownName(town.id, getLang())}${unlocked ? '' : ' 🔒'}</button>`;
      }).join('')}
      ${t('rpg.ui.town.travelCost')}
    </p>
    <h4>${t('rpg.ui.town.peopleTitle')}</h4>
    <div class="rpg-npc-list">
      ${townNpcs.map((npc) => `
        <div class="rpg-npc-card">
          <div class="rpg-class-name">${getNpcName(npc.id, getLang())}</div>
          ${getNpcDialogue(npc.id, getLang()).map((line) => `<p class="rpg-hint">"${line}"</p>`).join('')}
          ${(npc.questIds || []).map((qid) => questRowHtml(qid)).join('')}
          ${npc.role === 'doctor' ? doctorCureHtml() : ''}
          ${npc.role === 'tavern' ? tavernHireHtml() : ''}
          ${npc.role === 'trainer' ? trainerHtml() : ''}
          ${npc.role === 'blacksmith' ? blacksmithHtml() : ''}
        </div>
      `).join('') || `<p class="rpg-hint">${t('rpg.ui.town.noOneHere')}</p>`}
    </div>
    <h4>${t('rpg.ui.town.boardTitle')}</h4>
    <div class="rpg-board-list"><div class="rpg-loading">${t('rpg.ui.town.boardLoading')}</div></div>
    <div class="rpg-board-form">
      <input type="text" class="rpg-board-input" maxlength="150" placeholder="${t('rpg.ui.town.boardPlaceholder')}" style="width:70%">
      <button class="rpg-board-post-btn">${t('rpg.ui.town.boardSubmit')}</button>
    </div>
  `;
  content.querySelectorAll('.rpg-travel-town-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const destTown = TOWNS[btn.dataset.town];
    if (!confirm(ti('rpg.ui.town.travelConfirm', getLang(), { town: getTownName(destTown.id, getLang()) }))) return;
    try {
      const r = await apiPost('travel-town', { townId: btn.dataset.town });
      character.currentTown = r.currentTown;
      character.turnPoints = r.turnPoints;
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.town.traveled', getLang(), { town: getTownName(destTown.id, getLang()) }));
      showTerritoryNotice(container, r.territoryNotice);
    } catch (e) { handleActionError(container, e); }
  }));
  content.querySelectorAll('.rpg-quest-claim-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-quest', { questId: btn.dataset.quest });
      character.gold = r.gold;
      character.level = r.level;
      await loadCharacter();
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(t('rpg.ui.quest.completed') + (r.overflowed ? t('rpg.ui.quest.overflowNote') : ''));
      if (r.newLore && r.newLore.length) content.insertAdjacentHTML('afterbegin', loreUnlockHtml(r.newLore));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-hire-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('hire-mercenary', { templateId: btn.dataset.template });
      character.gold = r.gold;
      character.mercenaries = [...(character.mercenaries || []), r.hired];
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.tavern.hired', getLang(), { name: r.hired.name }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-train-skill-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('train-skill', { skillId: btn.dataset.skill });
      character.gold = r.gold;
      character.skillLevels = r.skillLevels;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.trainer.trained', getLang(), { tier: r.tier }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-blacksmith-repair-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('repair-equipment', { equipSlot: btn.dataset.slot });
      character.gold = r.gold;
      character.equipment[`${btn.dataset.slot}Durability`] = r.durability;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.blacksmith.repaired', getLang(), { cost: r.cost }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  const trainRepairBtn = content.querySelector('.rpg-train-repair-skill-btn');
  if (trainRepairBtn) trainRepairBtn.addEventListener('click', async () => {
    try {
      const r = await apiPost('train-repair-skill', {});
      character.gold = r.gold;
      character.repairSkillLevel = r.level;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.blacksmith.repairSkillTrained', getLang(), { level: r.level }));
    } catch (e) { showToast(friendlyError(e)); }
  });
  content.querySelectorAll('.rpg-craft-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('craft-equipment', { recipeKey: btn.dataset.recipe });
      character.gold = r.gold;
      await loadCharacter();
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.craft.crafted', getLang(), { item: getItemName(r.crafted, getLang()) }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-cure-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const mercId = btn.dataset.merc || null;
    try {
      const r = await apiPost('cure-injury', mercId ? { part: btn.dataset.part, mercId } : { part: btn.dataset.part });
      character.gold = r.gold;
      if (mercId) {
        const merc = (character.mercenaries || []).find((m) => m.id === mercId);
        if (merc) { merc.injuries = r.injuries; merc.hospitalized = false; }
      } else {
        character.injuries = r.injuries;
      }
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(ti('rpg.ui.doctor.cured', getLang(), { part: bodyPartName(r.part), cost: r.cost }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelector('.rpg-board-post-btn').addEventListener('click', async () => {
    const input = content.querySelector('.rpg-board-input');
    const message = input.value.trim();
    if (!message) return;
    try {
      await apiPost('board-post', { townId: character.currentTown, message });
      input.value = '';
      loadBoard(content);
      showToast(t('rpg.ui.board.posted'));
    } catch (e) { showToast(friendlyError(e)); }
  });
  loadBoard(content);
}

// ── 상점 탭(구매 + 뽑기) ──────────────────────────────
function renderShopTab(content, container) {
  const townTier = (TOWNS[character.currentTown] || {}).tier || 1;
  const shopItems = Object.values(ITEMS).filter((i) => i.shopPrice && i.type !== 'randombox' && (i.minTownTier || 1) <= townTier);
  content.innerHTML = `
    <h4>${t('rpg.ui.shop.title')}</h4>
    <div class="rpg-shop-list">
      ${shopItems.map((i) => `
        <div class="rpg-shop-row">
          <span>${getItemName(i.id, getLang())}${itemStatsLabel(i)} (${i.type === 'ammo' ? ti('rpg.ui.shop.ammoPriceLabel', getLang(), { price: i.shopPrice * 10 }) : ti('rpg.ui.shop.priceLabel', getLang(), { price: i.shopPrice })})</span>
          <button class="rpg-buy-btn" data-item="${i.id}">${t('rpg.ui.shop.buyBtn')}</button>
        </div>
      `).join('')}
    </div>
    <h4>${t('rpg.ui.shop.gachaTitle')}</h4>
    <div class="rpg-shop-row">
      <span>${ti('rpg.ui.shop.gachaDesc', getLang(), { item: getItemName('random_box', getLang()), price: ITEMS.random_box.shopPrice })}</span>
      <button class="rpg-randombox-btn">${t('rpg.ui.shop.gachaBtn')}</button>
    </div>
  `;
  content.querySelectorAll('.rpg-buy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = ITEMS[btn.dataset.item];
      const qty = item.type === 'ammo' ? 10 : 1;
      const totalPrice = item.shopPrice * qty;
      const canAfford = character.gold >= totalPrice;
      showConfirmOverlay(container, {
        title: `${getItemName(item.id, getLang())}${qty > 1 ? ` x${qty}` : ''} ${t('rpg.ui.shop.buyBtn')}`,
        bodyHtml: `
          <div class="rpg-stat-delta-table">
            <div class="rpg-stat-delta-row"><span>${t('rpg.ui.shop.priceRowLabel')}</span><span>${ti('rpg.ui.shop.priceLabel', getLang(), { price: totalPrice })}</span><span></span></div>
            <div class="rpg-stat-delta-row"><span>${t('rpg.ui.shop.ownedGoldLabel')}</span><span>${character.gold} → ${character.gold - totalPrice}</span><span class="${canAfford ? 'rpg-stat-up' : 'rpg-stat-down'}">${canAfford ? '' : t('rpg.ui.shop.insufficient')}</span></div>
          </div>
          ${!canAfford ? `<p class="rpg-hint">${t('rpg.ui.shop.insufficientGold')}</p>` : ''}
        `,
        confirmLabel: t('rpg.ui.shop.buyBtn'),
        confirmDisabled: !canAfford,
        onConfirm: async () => {
          try {
            const r = await apiPost('shop-buy', { itemId: btn.dataset.item, qty });
            character.gold = r.gold;
            container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
            showToast(qty > 1 ? ti('rpg.ui.shop.bought', getLang(), { item: getItemName(item.id, getLang()), qty }) : t('rpg.ui.shop.boughtSingle'));
          } catch (e) {
            showToast(friendlyError(e));
          }
        },
      });
    });
  });
  content.querySelector('.rpg-randombox-btn').addEventListener('click', async () => {
    try {
      const r = await apiPost('open-random-box', {});
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      const item = ITEMS[r.itemId];
      showToast(ti('rpg.ui.shop.gachaResult', getLang(), { item: `${getItemName(item.id, getLang())}${itemStatsLabel(item)}` }) + (r.overflowed ? t('rpg.ui.shop.inventoryFullNote') : ''));
    } catch (e) { showToast(friendlyError(e)); }
  });
}

// ── 마켓 탭(유저간 거래) ──────────────────────────────
function renderMarketTab(content, container) {
  content.innerHTML = `
    <h4>${t('rpg.ui.market.title')}</h4>
    <div class="rpg-market-list"><div class="rpg-loading">${t('rpg.ui.market.loading')}</div></div>
    <div class="rpg-market-list-form">
      <p class="rpg-hint">${t('rpg.ui.market.listHint')}</p>
    </div>
    <h4>${t('rpg.ui.market.goldAuctionTitle')}</h4>
    <p class="rpg-hint">${t('rpg.ui.market.testPiWarning')}</p>
    <div class="rpg-gold-listing-form">
      <input type="number" class="rpg-gold-list-amount" placeholder="${t('rpg.ui.market.goldAmountPlaceholder')}" min="100">
      <input type="number" class="rpg-gold-list-price" placeholder="${t('rpg.ui.market.priceTestPiPlaceholder')}" min="0.01" step="0.01">
      <button class="rpg-gold-list-submit">${t('rpg.ui.market.registerBtn')}</button>
    </div>
    <p class="rpg-hint">${t('rpg.ui.market.feeNote')}</p>
    <div class="rpg-gold-listing-list"><div class="rpg-loading">${t('rpg.ui.market.loading')}</div></div>
  `;
  loadMarketListings(content, container);
  loadGoldListings(content, container);

  content.querySelector('.rpg-gold-list-submit').addEventListener('click', async () => {
    const amountEl = content.querySelector('.rpg-gold-list-amount');
    const priceEl = content.querySelector('.rpg-gold-list-price');
    const goldAmount = Number(amountEl.value);
    const priceTestPi = Number(priceEl.value);
    if (!goldAmount || goldAmount < 100) { showToast(t('rpg.ui.market.goldAmountTooLow')); return; }
    if (!priceTestPi || priceTestPi <= 0) { showToast(t('rpg.ui.market.priceRequired')); return; }
    try {
      const r = await apiPost('create-gold-listing', { goldAmount, priceTestPi });
      character.gold = Math.max(0, (character.gold || 0) - goldAmount - (r.listing.feeGold || 0));
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      amountEl.value = ''; priceEl.value = '';
      showToast(ti('rpg.ui.market.goldListed', getLang(), { amount: goldAmount, price: priceTestPi, fee: r.listing.feeGold }));
      loadGoldListings(content, container);
    } catch (e) { showToast(friendlyError(e)); }
  });
}

// 골드 경매장 목록 - 내 리스팅은 "취소", 남의 리스팅은 "테스트파이로 구매"
async function loadGoldListings(content, container) {
  const listEl = content.querySelector('.rpg-gold-listing-list');
  try {
    const r = await apiPost('browse-gold-listings', {});
    if (!r.listings.length) { listEl.innerHTML = `<p class="rpg-hint">${t('rpg.ui.market.noGoldListings')}</p>`; return; }
    listEl.innerHTML = r.listings.map((l) => {
      const isMine = l.sellerUsername === myUsername && l.sellerSlot === activeSlot;
      return `
        <div class="rpg-shop-row">
          <span>${ti('rpg.ui.market.goldRowLabel', getLang(), { amount: l.goldAmount, price: l.priceTestPi })} ${isMine ? `<b>${t('rpg.ui.market.myListing')}</b>` : `· ${l.sellerUsername}`}</span>
          <span>
            ${isMine
              ? `<button class="rpg-gold-cancel-btn" data-listing="${l.id}">${t('rpg.ui.market.cancelBtn')}</button>`
              : `<button class="rpg-gold-buy-btn" data-listing="${l.id}">${t('rpg.ui.market.buyWithTestPiBtn')}</button>`}
          </span>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.rpg-gold-cancel-btn').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        const r = await apiPost('cancel-gold-listing', { listingId: btn.dataset.listing });
        character.gold = r.gold;
        container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
        showToast(t('rpg.ui.market.canceled'));
        loadGoldListings(content, container);
      } catch (e) { showToast(friendlyError(e)); }
    }));

    listEl.querySelectorAll('.rpg-gold-buy-btn').forEach((btn) => btn.addEventListener('click', () => {
      const listing = r.listings.find((l) => l.id === btn.dataset.listing);
      if (!listing) return;
      showConfirmOverlay(container, {
        title: t('rpg.ui.market.buyGoldTitle'),
        bodyHtml: `
          <div class="rpg-stat-delta-table">
            <div class="rpg-stat-delta-row"><span>${t('rpg.ui.market.goldRowGold')}</span><span>${ti('rpg.ui.market.goldRowUnit', getLang(), { amount: listing.goldAmount })}</span><span></span></div>
            <div class="rpg-stat-delta-row"><span>${t('rpg.ui.market.priceRow')}</span><span>${ti('rpg.ui.market.testPiUnit', getLang(), { price: listing.priceTestPi })}</span><span></span></div>
          </div>
          <p class="rpg-hint">${t('rpg.ui.market.purchaseWarning')}</p>
        `,
        confirmLabel: t('rpg.ui.market.payWithTestPiBtn'),
        onConfirm: async () => {
          try {
            await createGoldPurchasePayment(listing, activeSlot, currentAccessToken);
            showToast(ti('rpg.ui.market.goldPurchased', getLang(), { amount: listing.goldAmount }));
            await loadCharacter();
            container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
            loadGoldListings(content, container);
          } catch (e) {
            showToast(friendlyError(e));
          }
        },
      });
    }));
  } catch {
    listEl.innerHTML = `<p class="rpg-hint">${t('rpg.ui.market.loadFail')}</p>`;
  }
}

// ── 창고 탭(이송상자/저장상자) ────────────────────────
function renderStorageTab(content, container) {
  content.innerHTML = `
    <h4>${t('rpg.ui.storage.accountTitle')}</h4>
    <div class="rpg-storage-box" data-kind="account"><div class="rpg-loading">${t('rpg.ui.storage.loading')}</div></div>
    <h4>${t('rpg.ui.storage.characterTitle')}</h4>
    <div class="rpg-storage-box" data-kind="character"><div class="rpg-loading">${t('rpg.ui.storage.loading')}</div></div>
  `;
  loadStorageBox(content, container, 'account');
  loadStorageBox(content, container, 'character');
}

// ── 이송상자(계정 공유)/저장상자(캐릭터 전용) 공통 처리 ──
async function loadStorageBox(content, container, kind) {
  const boxEl = content.querySelector(`.rpg-storage-box[data-kind="${kind}"]`);
  const endpoint = kind === 'account' ? 'account-storage' : 'character-storage';
  const townId = character.currentTown;
  try {
    const data = await apiPost(endpoint, { townId, direction: 'view' });
    const items = data.items || [];
    const inventory = character.inventory || [];

    boxEl.innerHTML = `
      ${kind === 'account' ? `
        <p>${ti('rpg.ui.storage.goldStored', getLang(), { gold: data.gold })}</p>
        <div class="rpg-shop-row">
          <span>${t('rpg.ui.storage.goldExchangeLabel')}</span>
          <span>
            <input type="number" class="rpg-storage-gold-amount" min="1" style="width:70px">
            <button class="rpg-storage-gold-deposit">${t('rpg.ui.storage.depositBtn')}</button>
            <button class="rpg-storage-gold-withdraw">${t('rpg.ui.storage.withdrawBtn')}</button>
          </span>
        </div>
      ` : ''}
      <p class="rpg-hint">${t('rpg.ui.storage.storedItemsLabel')}</p>
      ${items.length ? items.map((e) => `
        <div class="rpg-shop-row">
          <span>${getItemName(e.itemId, getLang())} x${e.qty}</span>
          <button class="rpg-storage-withdraw-item" data-item="${e.itemId}">${t('rpg.ui.storage.withdrawBtn')}</button>
        </div>
      `).join('') : `<p class="rpg-hint">${t('rpg.ui.storage.noStoredItems')}</p>`}
      <p class="rpg-hint">${t('rpg.ui.storage.depositFromInventory')}</p>
      ${inventory.length ? inventory.map((e) => `
        <div class="rpg-shop-row">
          <span>${getItemName(e.itemId, getLang())} x${e.qty}</span>
          <button class="rpg-storage-deposit-item" data-item="${e.itemId}">${t('rpg.ui.storage.depositBtn')}</button>
        </div>
      `).join('') : `<p class="rpg-hint">${t('rpg.ui.storage.emptyInventory')}</p>`}
    `;

    if (kind === 'account') {
      boxEl.querySelector('.rpg-storage-gold-deposit').addEventListener('click', async () => {
        const amount = Number(boxEl.querySelector('.rpg-storage-gold-amount').value);
        if (!amount) return;
        try {
          const r = await apiPost('account-storage', { townId, direction: 'deposit', gold: amount });
          character.gold = r.gold;
          container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
          showToast(t('rpg.ui.storage.deposited'));
          loadStorageBox(content, container, kind);
        } catch (e) { showToast(friendlyError(e)); }
      });
      boxEl.querySelector('.rpg-storage-gold-withdraw').addEventListener('click', async () => {
        const amount = Number(boxEl.querySelector('.rpg-storage-gold-amount').value);
        if (!amount) return;
        try {
          const r = await apiPost('account-storage', { townId, direction: 'withdraw', gold: amount });
          character.gold = r.gold;
          container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
          showToast(t('rpg.ui.storage.withdrawn'));
          loadStorageBox(content, container, kind);
        } catch (e) { showToast(friendlyError(e)); }
      });
    }

    boxEl.querySelectorAll('.rpg-storage-withdraw-item').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await apiPost(endpoint, { townId, direction: 'withdraw', itemId: btn.dataset.item, qty: 1 });
        await loadCharacter();
        showToast(t('rpg.ui.storage.withdrawn'));
        loadStorageBox(content, container, kind);
      } catch (e) { showToast(friendlyError(e)); }
    }));
    boxEl.querySelectorAll('.rpg-storage-deposit-item').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await apiPost(endpoint, { townId, direction: 'deposit', itemId: btn.dataset.item, qty: 1 });
        await loadCharacter();
        showToast(t('rpg.ui.storage.deposited'));
        loadStorageBox(content, container, kind);
      } catch (e) { showToast(friendlyError(e)); }
    }));
  } catch (e) {
    boxEl.innerHTML = `<p class="rpg-hint">${t('rpg.ui.storage.loadFail')}</p>`;
  }
}

// ── 마을 게시판 ─────────────────────────────────────
async function loadBoard(content) {
  const listEl = content.querySelector('.rpg-board-list');
  try {
    const data = await apiGet('board-browse', { townId: character.currentTown });
    const posts = data.posts || [];
    listEl.innerHTML = posts.length
      ? posts.map((p) => `<p class="rpg-hint">📌 ${p.username}: ${p.message}</p>`).join('')
      : `<p class="rpg-hint">${t('rpg.ui.board.noPosts')}</p>`;
  } catch (e) {
    listEl.innerHTML = `<p class="rpg-hint">${t('rpg.ui.board.loadFail')}</p>`;
  }
}

async function loadMarketListings(content, container) {
  const listEl = content.querySelector('.rpg-market-list');
  try {
    const data = await apiGet('market-browse');
    const listings = data.listings || [];
    if (!listings.length) {
      listEl.innerHTML = `<p class="rpg-hint">${t('rpg.ui.market.noListings')}</p>`;
      return;
    }
    listEl.innerHTML = listings.map((l) => `
      <div class="rpg-shop-row">
        <span>${ti('rpg.ui.market.itemRowLabel', getLang(), { item: getItemName(l.itemId, getLang()), qty: l.qty, price: l.pricePerUnit, seller: l.sellerUsername })}</span>
        <button class="rpg-buy-btn" data-listing="${l.listingId}" data-qty="${l.qty}">${t('rpg.ui.shop.buyBtn')}</button>
      </div>
    `).join('');
    listEl.querySelectorAll('.rpg-buy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const r = await apiPost('market-buy', { listingId: btn.dataset.listing, qty: 1 });
          character.gold = r.buyerGold;
          container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
          showToast(t('rpg.ui.market.itemBought'));
          loadMarketListings(content, container);
        } catch (e) {
          showToast(friendlyError(e));
        }
      });
    });
  } catch (e) {
    listEl.innerHTML = `<p class="rpg-hint">${t('rpg.ui.market.itemLoadFail')}</p>`;
  }
}

// ── 인벤토리 탭 ─────────────────────────────────────
function renderInventoryTab(content, container) {
  const inventory = character.inventory || [];
  const capacity = capacityForCharacter(character);
  const weight = inventoryWeight(inventory);
  const weightLimit = weightLimitForCharacter(character);

  // 고정된 아이템을 먼저(pinnedItemIds 순서 - 앞쪽일수록 상단), 나머지는 선택된 정렬 모드 적용
  const pinnedSet = new Set(pinnedItemIds);
  const pinnedEntries = pinnedItemIds.map((id) => inventory.find((e) => e.itemId === id)).filter(Boolean);
  const restEntries = inventory.filter((e) => !pinnedSet.has(e.itemId));
  const sortCfg = INVENTORY_SORT_MODES[inventorySortMode];
  let sortedRest = restEntries;
  if (sortCfg && sortCfg.types) {
    const priority = [];
    const others = [];
    restEntries.forEach((e) => {
      const itemType = (ITEMS[e.itemId] || {}).type;
      (sortCfg.types.includes(itemType) ? priority : others).push(e);
    });
    sortedRest = [...priority, ...others];
  }
  const sortedInventory = [...pinnedEntries, ...sortedRest];
  const totalPages = Math.max(1, Math.ceil(sortedInventory.length / INVENTORY_PAGE_SIZE));
  inventoryPage = Math.min(Math.max(0, inventoryPage), totalPages - 1);
  const pageEntries = sortedInventory.slice(inventoryPage * INVENTORY_PAGE_SIZE, (inventoryPage + 1) * INVENTORY_PAGE_SIZE);

  content.innerHTML = `
    <p class="rpg-hint">${ti('rpg.ui.inventory.header', getLang(), { count: inventory.length, capacity, weight: weight.toFixed(1), weightLimit })}</p>
    <div class="rpg-inv-toolbar">
      <label class="rpg-hint">${t('rpg.ui.inventory.sortLabel')}
        <select class="rpg-inv-sort-select">
          ${Object.entries(INVENTORY_SORT_MODES).map(([key, cfg]) => `<option value="${key}" ${inventorySortMode === key ? 'selected' : ''}>${t(cfg.labelKey)}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="rpg-inventory-list">
      ${pageEntries.length ? pageEntries.map((entry) => {
        const item = ITEMS[entry.itemId] || { name: entry.itemId };
        const isPinned = pinnedSet.has(entry.itemId);
        const actions = [];
        const equippable = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
        const mercEquippable = MERC_EQUIP_SLOTS.includes(item.type);
        actions.push(`<button class="rpg-inv-pin ${isPinned ? 'rpg-inv-pin-active' : ''}" data-item="${entry.itemId}">${isPinned ? t('rpg.ui.inventory.pinnedBtn') : t('rpg.ui.inventory.pinBtn')}</button>`);
        if (item.type === 'consumable' || item.type === 'bag') actions.push(`<button class="rpg-inv-use" data-item="${entry.itemId}">${t('rpg.ui.inventory.useBtn')}</button>`);
        if (mercEquippable && (character.mercenaries || []).length) {
          // 무기/방패/상하의는 본인 또는 용병 중 골라서 장착 - 반지/목걸이는 용병 슬롯이 없어 본인 전용(장착 버튼만)
          actions.push(`
            <select class="rpg-inv-equip-target" data-item="${entry.itemId}">
              <option value="">${t('rpg.ui.inventory.toSelf')}</option>
              ${(character.mercenaries || []).map((m) => `<option value="${m.id}">${ti('rpg.ui.inventory.toMerc', getLang(), { name: m.name })}</option>`).join('')}
            </select>
          `);
        }
        if (equippable.includes(item.type)) actions.push(`<button class="rpg-inv-equip" data-item="${entry.itemId}">${t('rpg.ui.inventory.equipBtn')}</button>`);
        if (!isItemIdentified(item)) {
          actions.push(`<button class="rpg-inv-identify" data-item="${entry.itemId}">${t('rpg.ui.inventory.identifyBtn')}</button>`);
          actions.push(`<button class="rpg-inv-identify" data-item="${entry.itemId}" data-scroll="1">${t('rpg.ui.inventory.identifyScrollBtn')}</button>`);
        }
        if (entry.itemId === 'torn_cloth' && entry.qty >= 3) actions.push(`<button class="rpg-inv-craft-bandage">${t('rpg.ui.inventory.craftBandageBtn')}</button>`);
        actions.push(`<button class="rpg-inv-sell" data-item="${entry.itemId}">${t('rpg.ui.inventory.sellBtn')}</button>`);
        actions.push(`<button class="rpg-inv-list" data-item="${entry.itemId}">${t('rpg.ui.inventory.listBtn')}</button>`);
        return `
          <div class="rpg-inv-row">
            <span>${getItemName(entry.itemId, getLang())}${itemStatsLabel(item)} x${entry.qty}</span>
            <span class="rpg-inv-actions">${actions.join('')}</span>
          </div>
        `;
      }).join('') : `<p class="rpg-hint">${t('rpg.ui.inventory.empty')}</p>`}
    </div>
    ${sortedInventory.length ? `
      <div class="rpg-inv-pagination">
        <button class="rpg-inv-page-prev" ${inventoryPage === 0 ? 'disabled' : ''}>${t('rpg.ui.inventory.pagePrev')}</button>
        <span class="rpg-hint">${ti('rpg.ui.inventory.pageLabel', getLang(), { page: inventoryPage + 1, total: totalPages })}</span>
        <button class="rpg-inv-page-next" ${inventoryPage >= totalPages - 1 ? 'disabled' : ''}>${t('rpg.ui.inventory.pageNext')}</button>
      </div>
    ` : ''}
  `;
  content.querySelector('.rpg-inv-sort-select')?.addEventListener('change', (e) => {
    inventorySortMode = e.target.value;
    inventoryPage = 0;
    renderInventoryTab(content, container);
  });
  content.querySelector('.rpg-inv-page-prev')?.addEventListener('click', () => {
    inventoryPage -= 1;
    renderInventoryTab(content, container);
  });
  content.querySelector('.rpg-inv-page-next')?.addEventListener('click', () => {
    inventoryPage += 1;
    renderInventoryTab(content, container);
  });
  content.querySelectorAll('.rpg-inv-pin').forEach((btn) => btn.addEventListener('click', async () => {
    const itemId = btn.dataset.item;
    if (pinnedItemIds.includes(itemId)) {
      pinnedItemIds = pinnedItemIds.filter((id) => id !== itemId);
    } else {
      // 최종적으로 누른 아이템이 맨 상단으로 오도록 배열 맨 앞에 추가
      pinnedItemIds = [itemId, ...pinnedItemIds.filter((id) => id !== itemId)];
      inventoryPage = 0; // 방금 고정한 아이템을 바로 볼 수 있게 첫 페이지로 이동
    }
    character.pinnedItemIds = pinnedItemIds;
    renderInventoryTab(content, container);
    try { await apiPost('set-pinned-items', { pinnedItemIds }); } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-use').forEach((btn) => btn.addEventListener('click', () => {
    const itemId = btn.dataset.item;
    const item = ITEMS[itemId];
    const rows = [];
    let confirmDisabled = false;

    if (item.type === 'bag') {
      const tier = item.bagTier;
      const bagBonusByTier = character.bagBonusByTier || {};
      const tierUsed = bagBonusByTier[tier] || 0;
      const tierCap = BAG_TIER_CAPS[tier];
      if (tierUsed >= tierCap) {
        confirmDisabled = true;
        const nextTierItem = Object.values(ITEMS).find((i) => i.type === 'bag' && i.bagTier === tier + 1);
        rows.push(`<p class="rpg-hint">${ti('rpg.ui.inventory.bagTierFull', getLang(), { name: getItemName(item.id, getLang()), tier, cap: tierCap })}${nextTierItem ? ti('rpg.ui.inventory.bagTierNext', getLang(), { name: getItemName(nextTierItem.id, getLang()), tier: tier + 1 }) : t('rpg.ui.inventory.bagTierMax')}</p>`);
      } else {
        const before = capacityForCharacter(character);
        const after = before + item.slotBonus;
        rows.push(`<div class="rpg-stat-delta-row"><span>${t('rpg.ui.inventory.capacityLabel')}</span><span>${before} → ${after}</span><span class="rpg-stat-up">+${item.slotBonus}</span></div>`);
        rows.push(`<p class="rpg-hint">${ti('rpg.ui.inventory.tierProgress', getLang(), { tier, used: tierUsed, cap: tierCap })}</p>`);
      }
    } else if (item.cureInjury === 'mild') {
      const injuries = character.injuries || {};
      const mildPart = ['arm', 'leg'].find((p) => (injuries[p] || {}).severity === 1);
      if (!mildPart) {
        confirmDisabled = true;
        rows.push(`<p class="rpg-hint">${t('rpg.ui.inventory.noMildInjury')}</p>`);
      } else {
        rows.push(`<p>${ti('rpg.ui.bandage.previewMild', getLang(), { part: bodyPartName(mildPart) })}</p>`);
      }
    } else {
      const stats = computeCharacterCombatStats(character);
      if (item.healPct) {
        const beforeHp = character.currentHp;
        const afterHp = Math.min(stats.maxHp, beforeHp + Math.round(stats.maxHp * item.healPct));
        rows.push(`<div class="rpg-stat-delta-row"><span>${t('rpg.ui.stat.hp')}</span><span>${beforeHp}/${stats.maxHp} → ${afterHp}/${stats.maxHp}</span><span class="rpg-stat-up">+${afterHp - beforeHp}</span></div>`);
      }
      if (item.restoreMpPct) {
        const beforeMp = character.currentMp;
        const afterMp = Math.min(stats.maxMp, beforeMp + Math.round(stats.maxMp * item.restoreMpPct));
        rows.push(`<div class="rpg-stat-delta-row"><span>${t('rpg.ui.stat.mp')}</span><span>${beforeMp}/${stats.maxMp} → ${afterMp}/${stats.maxMp}</span><span class="rpg-stat-up">+${afterMp - beforeMp}</span></div>`);
      }
      if (item.restoreStaminaPct) {
        const beforeSt = character.currentStamina;
        const afterSt = Math.min(stats.maxStamina, beforeSt + Math.round(stats.maxStamina * item.restoreStaminaPct));
        rows.push(`<div class="rpg-stat-delta-row"><span>${t('rpg.ui.stat.stamina')}</span><span>${beforeSt}/${stats.maxStamina} → ${afterSt}/${stats.maxStamina}</span><span class="rpg-stat-up">+${afterSt - beforeSt}</span></div>`);
      }
      if (!rows.length) rows.push(`<p class="rpg-hint">${t('rpg.ui.inventory.noPreview')}</p>`);
    }

    showConfirmOverlay(container, {
      title: ti('rpg.ui.inventory.useTitle', getLang(), { name: getItemName(item.id, getLang()) }),
      bodyHtml: `<div class="rpg-stat-delta-table">${rows.join('')}</div>`,
      confirmLabel: t('rpg.ui.inventory.useBtn'),
      confirmDisabled,
      onConfirm: async () => {
        try {
          const r = await apiPost('use-item', { itemId });
          if (r.effect === 'potion') { character.currentHp = r.currentHp; character.currentMp = r.currentMp; character.currentStamina = r.currentStamina; }
          if (r.effect === 'bandage') { character.injuries = r.injuries; }
          await loadCharacter();
          container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
          renderInventoryTab(content, container);
          if (r.effect === 'bag') {
            showToast(ti('rpg.ui.inventory.bagUsed', getLang(), { bonus: r.slotBonus, capacity: capacityForCharacter(character) }));
          } else if (r.effect === 'bandage') {
            showToast(ti('rpg.ui.bandage.cured', getLang(), { part: bodyPartName(r.healedPart) }));
          } else {
            showToast(t('rpg.ui.inventory.used'));
          }
        } catch (e) { showToast(friendlyError(e)); }
      },
    });
  }));
  const EQUIP_SLOT_BY_TYPE = { weapon: 'weapon', shield: 'shield', armor_top: 'armor_top', armor_bottom: 'armor_bottom', ring: 'ring', necklace: 'necklace' };
  content.querySelectorAll('.rpg-inv-equip').forEach((btn) => btn.addEventListener('click', () => {
    const itemId = btn.dataset.item;
    const item = ITEMS[itemId];
    // 반지/목걸이는 대상 선택 select가 없음(용병 슬롯 자체가 없어서) - 그 외 슬롯은 select에서 고른 대상(나/용병)
    const targetSelect = content.querySelector(`.rpg-inv-equip-target[data-item="${itemId}"]`);
    const mercId = targetSelect ? targetSelect.value : '';
    const targetChar = mercId ? (character.mercenaries || []).find((m) => m.id === mercId) : character;
    if (mercId && !targetChar) return;
    const stats = effectiveStats(targetChar);
    const reqRows = [];
    let reqOk = true;
    if (item.strRequirement) {
      const ok = stats.str >= item.strRequirement;
      if (!ok) reqOk = false;
      reqRows.push(`<div class="rpg-stat-delta-row"><span>${t('rpg.ui.inventory.reqStr')}</span><span>${item.strRequirement} ${ti('rpg.ui.inventory.currentValue', getLang(), { v: stats.str })}</span><span>${ok ? '✅' : '❌'}</span></div>`);
    }
    if (item.wisRequirement) {
      const ok = stats.wis >= item.wisRequirement;
      if (!ok) reqOk = false;
      reqRows.push(`<div class="rpg-stat-delta-row"><span>${t('rpg.ui.inventory.reqWis')}</span><span>${item.wisRequirement} ${ti('rpg.ui.inventory.currentValue', getLang(), { v: stats.wis })}</span><span>${ok ? '✅' : '❌'}</span></div>`);
    }
    const slot = EQUIP_SLOT_BY_TYPE[item.type];
    const previousItemId = targetChar.equipment[slot];
    const previousItem = previousItemId ? ITEMS[previousItemId] : null;
    const before = computeCharacterCombatStats(targetChar);
    const after = computeCharacterCombatStats({
      ...targetChar,
      equipment: { ...targetChar.equipment, [slot]: itemId, [`${slot}Durability`]: 100 },
    });
    const classDef = CLASSES[targetChar.classMain];
    const penaltyWarning = equipPenaltyWarning(item, classDef);
    const addedParts = itemBonusParts(item);
    const removedParts = previousItem ? itemBonusParts(previousItem) : [];
    // 양손무기(스태프 등)는 방패와 같이 못 낌 - 장착하면 반대쪽이 자동으로 벗겨지니 미리 경고(api/_rpg/equip.js와 동일 규칙)
    let twoHandedWarning = null;
    if (item.type === 'shield') {
      const currentWeapon = targetChar.equipment.weapon ? ITEMS[targetChar.equipment.weapon] : null;
      if (currentWeapon && TWO_HANDED_WEAPON_TYPES.includes(currentWeapon.weaponType)) {
        twoHandedWarning = ti('rpg.ui.inventory.twoHandedShieldWarn', getLang(), { weapon: getItemName(currentWeapon.id, getLang()) });
      }
    } else if (item.type === 'weapon' && TWO_HANDED_WEAPON_TYPES.includes(item.weaponType) && targetChar.equipment.shield) {
      const currentShield = ITEMS[targetChar.equipment.shield];
      twoHandedWarning = ti('rpg.ui.inventory.twoHandedWeaponWarn', getLang(), { weapon: getItemName(item.id, getLang()), shield: currentShield ? getItemName(currentShield.id, getLang()) : t('rpg.ui.equip.shield') });
    }
    showConfirmOverlay(container, {
      title: mercId ? ti('rpg.ui.inventory.equipTitleForMerc', getLang(), { name: getItemName(item.id, getLang()), target: targetChar.name }) : ti('rpg.ui.inventory.equipTitle', getLang(), { name: getItemName(item.id, getLang()) }),
      bodyHtml: `
        ${reqRows.length ? `<div class="rpg-stat-delta-table">${reqRows.join('')}</div>` : ''}
        ${addedParts.length ? `<p class="rpg-stat-up">${ti('rpg.ui.inventory.added', getLang(), { parts: addedParts.join(', ') })}</p>` : ''}
        ${removedParts.length ? `<p class="rpg-stat-down">${ti('rpg.ui.inventory.removed', getLang(), { name: getItemName(previousItem.id, getLang()), parts: removedParts.join(', ') })}</p>` : ''}
        ${penaltyWarning ? `<p class="rpg-hint">${penaltyWarning}</p>` : ''}
        ${twoHandedWarning ? `<p class="rpg-hint">${twoHandedWarning}</p>` : ''}
        ${statsDeltaRowsHtml(before, after)}
        ${!reqOk ? `<p class="rpg-hint">${t('rpg.ui.inventory.reqNotMet')}</p>` : ''}
      `,
      confirmLabel: t('rpg.ui.inventory.equipBtn'),
      confirmDisabled: !reqOk,
      onConfirm: async () => {
        try {
          await apiPost('equip', mercId ? { itemId, mercId } : { itemId });
          await loadCharacter();
          const finalTarget = mercId ? (character.mercenaries || []).find((m) => m.id === mercId) : character;
          const finalAfter = computeCharacterCombatStats(finalTarget);
          renderInventoryTab(content, container);
          showToast(mercId
            ? ti('rpg.ui.inventory.equippedForMerc', getLang(), { target: targetChar.name, delta: statsDeltaMessage(before, finalAfter) })
            : ti('rpg.ui.inventory.equipped', getLang(), { delta: statsDeltaMessage(before, finalAfter) }));
        } catch (e) { showToast(friendlyError(e)); }
      },
    });
  }));
  content.querySelectorAll('.rpg-inv-sell').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('sell-item', { itemId: btn.dataset.item, qty: 1 });
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      await loadCharacter();
      renderInventoryTab(content, container);
      showToast(ti('rpg.ui.inventory.sold', getLang(), { proceeds: r.proceeds }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-list').forEach((btn) => btn.addEventListener('click', async () => {
    const price = prompt(t('rpg.ui.inventory.listPricePrompt'));
    if (!price) return;
    try {
      await apiPost('market-list', { itemId: btn.dataset.item, qty: 1, pricePerUnit: Number(price) });
      await loadCharacter();
      renderInventoryTab(content, container);
      showToast(t('rpg.ui.inventory.listed'));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-craft-bandage').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('craft-bandage', { qty: 1 });
      await loadCharacter();
      renderInventoryTab(content, container);
      showToast(ti('rpg.ui.inventory.bandageCrafted', getLang(), { used: r.clothUsed, crafted: r.crafted }));
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-identify').forEach((btn) => btn.addEventListener('click', async () => {
    const useScroll = !!btn.dataset.scroll;
    try {
      const r = await apiPost('identify-item', { itemId: btn.dataset.item, useScroll });
      if (r.identified) {
        character.identifiedItems = [...(character.identifiedItems || []), r.itemId];
        if (useScroll) await loadCharacter();
        renderInventoryTab(content, container);
        showToast(t('rpg.ui.inventory.identifySuccess'));
      } else {
        showToast(t('rpg.ui.inventory.identifyFail'));
      }
    } catch (e) { showToast(friendlyError(e)); }
  }));
}

// 진형을 '자동'으로 두면 장착 무기로 결정됨(활/지팡이=후열, 그 외=전열) - 표시용
function equipmentSectionEffectiveRow(characterLike = character) {
  const weaponId = characterLike.equipment && characterLike.equipment.weapon;
  const weapon = weaponId ? ITEMS[weaponId] : null;
  return weapon && ['bow', 'staff'].includes(weapon.weaponType) ? t('rpg.ui.inventory.formationBack') : t('rpg.ui.inventory.formationFront');
}

function formationRowLabel(row) {
  if (row === 'front') return t('rpg.ui.inventory.formationFront');
  if (row === 'mid') return t('rpg.ui.inventory.formationMid');
  if (row === 'back') return t('rpg.ui.inventory.formationBack');
  return row;
}

// 진형 선택 UI(전열/중열/후열 중 허용된 열만 버튼 표시 + 자동) - 활/마법은 1~3열 전부,
// 창을 든 전사는 전열/중열, 그 외 근접은 전열 고정이라 버튼 없이 안내문만 표시
// - mercId가 있으면 그 용병 대상, 없으면 본인 대상
function formationSectionHtml(characterLike, mercId) {
  const currentLabel = characterLike.formationRow
    ? formationRowLabel(characterLike.formationRow)
    : ti('rpg.ui.inventory.formationAutoLabel', getLang(), { row: equipmentSectionEffectiveRow(characterLike) });
  const mercAttr = mercId ? ` data-merc="${mercId}"` : '';
  const allowed = allowedFormationRows(characterLike);
  if (allowed.length === 1) {
    return `<p>${ti('rpg.ui.inventory.formationFixed', getLang(), { row: formationRowLabel(allowed[0]) })}</p>`;
  }
  return `
    <p>${t('rpg.ui.inventory.formationLabel')}
      ${allowed.map((row) => `<button class="rpg-formation-btn" data-formation="${row}"${mercAttr}>${formationRowLabel(row)}</button>`).join('')}
      <button class="rpg-formation-btn" data-formation=""${mercAttr}>${t('rpg.ui.inventory.formationAutoBtn')}</button>
      ${ti('rpg.ui.inventory.formationCurrent', getLang(), { current: currentLabel })}
    </p>
  `;
}

// ── 파티(고용한 용병) 섹션 - 캐릭터 탭에서 사용 ─────────
// 전투부대(active, 최대 MAX_MERCENARIES명)는 모험에 동행하고, 영지(territory)는 남아서 일을 함
// ── 영지 현황판 - 시설(개간지/훈련소/방벽/농장) 레벨과 다음 레벨까지 진행률을 한눈에 보여줌 ──
const FACILITY_ICONS = { clearing: '🌾', training: '⚔️', ramparts: '🛡️', farm: '🌱', hospital: '🏥', morale: '📯', sanctum: '🔮' };

// api/_rpgTurns.js와 반드시 같은 공식 유지 - 서버 전용 파일이라 브라우저가 직접 못 불러와서 복제해서 씀
function turnCapForLevelClient(level) {
  const base = 30 + (character.surveyBonusUnlocked ? 20 : 0);
  return base + Math.floor((level || 1) / 5);
}

// "영지 근무" 버튼 밑에 보여줄 "다음 레벨까지 턴 몇 개 남았는지" - work-territory.js의 기여 공식과 동일하게 계산
// (레벨1~4는 기준레벨(5)로 취급하는 하한도 서버와 동일하게 반영)
function turnsNeededForNextFacilityLevel(jobId) {
  const progress = facilityProgress((character.facilityDays || {})[jobId] || 0);
  const remainingDays = progress.daysForNextLevel - progress.daysIntoLevel;
  const effLevel = Math.max(character.level, BASELINE_MERC_LEVEL);
  const contributionPerTurn = (effLevel / BASELINE_MERC_LEVEL) * PLAYER_TERRITORY_BONUS_MULT / turnCapForLevelClient(character.level);
  return Math.max(1, Math.ceil(remainingDays / contributionPerTurn));
}

// 영지 근무 카드 - 아이콘/버튼을 크게 만들어 "여기 누르면 턴을 써서 이 시설을 키운다"는 게 분명하게 보이게 함
function workTerritoryCardHtml(jobId) {
  const job = TERRITORY_JOBS[jobId];
  const progress = facilityProgress((character.facilityDays || {})[jobId] || 0);
  const turnsNeeded = turnsNeededForNextFacilityLevel(jobId);
  return `
    <button class="rpg-work-territory-card" data-job="${jobId}">
      <div class="rpg-work-territory-icon">${FACILITY_ICONS[jobId] || '🏛️'}</div>
      <div class="rpg-work-territory-info">
        <div class="rpg-work-territory-name">${getTerritoryJobName(jobId, getLang())} <span class="rpg-hint">Lv.${progress.level}</span></div>
        <div class="rpg-hint">턴 1개로 여기서 일하기</div>
        <div class="rpg-hint">다음 레벨까지 턴 약 ${turnsNeeded}개 필요</div>
      </div>
    </button>
  `;
}
// 영지 경제 요약 - "지금 이대로 영지일이 하루 지나면 어떻게 되는지"를 rpg-territory.js의
// settleTerritoryDays와 똑같은 공식으로 미리 계산해서 보여줌(실제 정산은 그대로 서버에서 일어나고,
// 이건 화면 미리보기일 뿐). 골드 수입/지출, 식량 수급, 순변동, 부족 시 경고를 한눈에 보여줌
function territoryEconomySummaryHtml() {
  const workingMercs = (character.mercenaries || []).filter((m) => m.assignment === 'territory' && !m.hospitalized);
  const farmWorkers = workingMercs.filter((m) => m.job === 'farm');
  const otherWorkers = workingMercs.filter((m) => m.job !== 'farm');
  const clearingWorkers = workingMercs.filter((m) => m.job === 'clearing');

  const farmProduced = facilityAccrualRate(farmWorkers, 'farm') * FOOD_PER_DAY_PER_FARMER * facilityBonusMultiplier(character, 'farm');
  const foodAfterProduction = (character.foodStock || 0) + farmProduced;
  const neededFood = otherWorkers.length * FOOD_CONSUMPTION_PER_DAY_PER_WORKER;
  const foodDeficit = Math.max(0, neededFood - foodAfterProduction);
  const foodEmergencyCost = Math.round(foodDeficit * GOLD_PER_MISSING_FOOD);

  const goldIncome = Math.floor(clearingWorkers.length * TERRITORY_JOBS.clearing.goldPerDay * facilityBonusMultiplier(character, 'clearing'));
  const wagePaid = Math.round(workingMercs.length * WAGE_PER_MERC_PER_DAY);
  const goldDelta = goldIncome - wagePaid - foodEmergencyCost;

  const warnings = [];
  if (foodDeficit > 0) warnings.push(`⚠️ 식량이 하루 ${foodDeficit.toFixed(1)}만큼 부족해서 골드로 대신 사고 있어요(-${foodEmergencyCost}골드/일). 농장에 용병을 더 배치하세요.`);
  if (goldDelta < 0) warnings.push(`⚠️ 영지 운영이 매일 ${Math.abs(goldDelta)}골드 적자예요.`);
  if (!workingMercs.length) warnings.push('영지에 배치된 용병이 없어요. 전투 동행이 필요 없는 용병은 영지로 보내 시설을 키워보세요.');

  return `
    <div class="rpg-territory-economy">
      <h4>영지 경제 (하루 기준 예상치)</h4>
      <div class="rpg-stat-delta-table">
        <div class="rpg-stat-delta-row"><span>골드 수입</span><span>개간지</span><span class="rpg-stat-up">+${goldIncome}</span></div>
        <div class="rpg-stat-delta-row"><span>골드 지출</span><span>용병 상주 급여</span><span class="rpg-stat-down">-${wagePaid}</span></div>
        ${foodEmergencyCost > 0 ? `<div class="rpg-stat-delta-row"><span>골드 지출</span><span>식량 비상구매</span><span class="rpg-stat-down">-${foodEmergencyCost}</span></div>` : ''}
        <div class="rpg-stat-delta-row"><span>순변동</span><span></span><span class="${goldDelta >= 0 ? 'rpg-stat-up' : 'rpg-stat-down'}">${goldDelta >= 0 ? '+' : ''}${goldDelta}/일</span></div>
        <div class="rpg-stat-delta-row"><span>식량</span><span>생산 ${farmProduced.toFixed(1)} / 소비 ${neededFood.toFixed(1)}</span><span>재고 ${(character.foodStock || 0).toFixed(1)}</span></div>
      </div>
      ${warnings.length ? `<p class="rpg-hint">${warnings.join('<br>')}</p>` : ''}
    </div>
  `;
}
function facilityDashboardHtml() {
  const days = character.facilityDays || {};
  const territoryMercs = (character.mercenaries || []).filter((m) => m.assignment === 'territory' && !m.hospitalized);
  const rows = Object.keys(TERRITORY_JOBS).map((jobId) => {
    const job = TERRITORY_JOBS[jobId];
    const progress = facilityProgress(days[jobId] || 0);
    const pct = Math.min(100, Math.round((progress.daysIntoLevel / progress.daysForNextLevel) * 100));
    const workerCount = territoryMercs.filter((m) => m.job === jobId).length;
    const STAT_KEY_LABELS = { gold: '골드', atk: '공격력', def: '방어력', food: '식량생산', healCostReduction: '치료비/턴 절감', mentalResist: '멘탈저항', mp: '최대 마나/스테미나' };
    const flatBonusStats = ['mentalResist']; // %가 아니라 고정치로 붙는 보너스(사기진작소 등)
    const bonusAmount = job.bonusPctPerLevel * progress.level;
    const bonusLabel = job.bonusPctPerLevel
      ? `${STAT_KEY_LABELS[job.statKey] || job.statKey} +${bonusAmount.toFixed(1)}${flatBonusStats.includes(job.statKey) ? '' : '%'}`
      : '';
    return `
      <div class="rpg-facility-row">
        <div class="rpg-facility-head">
          <span>${FACILITY_ICONS[jobId] || '🏛️'} ${getTerritoryJobName(jobId, getLang())} Lv.${progress.level}</span>
          <span class="rpg-hint">${workerCount}/${MAX_MERCS_PER_FACILITY}명 · ${bonusLabel}</span>
        </div>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%"></div></div>
        <div class="rank-bar-pct">${progress.daysIntoLevel.toFixed(1)} / ${progress.daysForNextLevel}일</div>
      </div>
    `;
  }).join('');
  return `
    <div class="rpg-facility-dashboard">
      <h4>🏯 영지 현황판</h4>
      <p class="rpg-hint">🍚 식량 재고: ${(character.foodStock || 0).toFixed(1)} (농장 외 근무자 1명당 영지 1일에 1 소비, 부족하면 골드로 대신 지출됨)</p>
      ${rows}
    </div>
  `;
}

// 용병 장비 슬롯(무기/방패/상하의만 - 반지/목걸이 없음, api/_rpg/equip.js의 MERC_EQUIPPABLE_TYPES와 동일)
const MERC_EQUIP_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom'];
function mercEquipmentRowHtml(m) {
  return `
    <p class="rpg-hint rpg-merc-equipment">장비:
      ${MERC_EQUIP_SLOTS.map((slot) => {
        const itemId = m.equipment && m.equipment[slot];
        const item = itemId ? ITEMS[itemId] : null;
        return `${equipSlotLabel(slot)} ${item ? `${getItemName(item.id, getLang())}${itemStatsLabel(item)}` : '없음'} <button class="rpg-merc-recommend-btn" data-merc="${m.id}" data-slot="${slot}">✨추천</button>${item ? ` <button class="rpg-merc-unequip-btn" data-merc="${m.id}" data-slot="${slot}">해제</button>` : ''}`;
      }).join(' · ')}
    </p>
  `;
}
function mercCombatSettingsHtml(m) {
  const template = MERCENARY_TEMPLATES[m.templateId] || {};
  const stance = m.stance === 'aggressive' ? 'aggressive' : 'stable';
  const stanceRow = `
    <p>타겟 우선순위:
      <button class="rpg-merc-stance-btn" data-merc="${m.id}" data-stance="stable" ${stance === 'stable' ? 'disabled' : ''}>약한 몹부터</button>
      <button class="rpg-merc-stance-btn" data-merc="${m.id}" data-stance="aggressive" ${stance === 'aggressive' ? 'disabled' : ''}>쎈 몹부터</button>
      (현재: ${stance === 'aggressive' ? '쎈 몹부터' : '약한 몹부터'})
    </p>
  `;
  if (template.fixedCombatRole) {
    return `${stanceRow}<p class="rpg-hint">전투 역할: 서포트 고정 🔒 (힐러 컨셉 용병이라 항상 방어/힐을 우선함)</p>`;
  }
  const combatRole = m.combatRole === 'support' ? 'support' : 'fight';
  return `
    ${stanceRow}
    <p>전투 역할:
      <button class="rpg-merc-role-btn" data-merc="${m.id}" data-role="fight" ${combatRole === 'fight' ? 'disabled' : ''}>버티기(계속 공격)</button>
      <button class="rpg-merc-role-btn" data-merc="${m.id}" data-role="support" ${combatRole === 'support' ? 'disabled' : ''}>서포트(방어/힐 우선)</button>
      (현재: ${combatRole === 'support' ? '서포트' : '버티기'})
    </p>
  `;
}
function mercenaryCardHtml(m) {
  const cls = CLASSES[m.classMain];
  const injured = ['arm', 'leg'].filter((p) => (m.injuries && m.injuries[p] && m.injuries[p].severity) > 0);
  const otherAssignment = m.assignment === 'active' ? 'territory' : 'active';
  const otherLabel = m.assignment === 'active' ? '영지로 보내기' : '전투부대로 편입';
  const territoryMercs = (character.mercenaries || []).filter((mm) => mm.assignment === 'territory' && !mm.hospitalized);
  return `
    <div class="rpg-npc-card">
      <div class="rpg-class-name">${m.name} (Lv.${m.level} ${cls ? getClassName(cls.id, getLang()) : m.classMain})${m.hospitalized ? ' — 입원 중 🏥' : ''} <button class="rpg-rename-merc-btn" data-merc="${m.id}">✏️</button></div>
      <p class="rpg-hint">HP ${m.currentHp} · 보수 ${m.wagePerAdventure}골드/모험 ${injured.length ? ti('rpg.ui.territory.injuredLabel', getLang(), { parts: injured.map((p) => bodyPartName(p)).join(', ') }) : ''} ${m.assignment === 'territory' ? `· ${m.job ? getTerritoryJobName(m.job, getLang()) : t('rpg.ui.territory.restingLabel')} 중` : ''}</p>
      ${mercEquipmentRowHtml(m)}
      ${injured.length && !m.hospitalized ? `<p><button class="rpg-admit-merc-btn" data-merc="${m.id}">병원에 입원시키기 (10골드, 서서히 회복)</button></p>` : ''}
      ${m.hospitalized ? `<p class="rpg-hint">입원 중에는 모험에 동행하지 않고 보수도 나가지 않아요. 완쾌하면 자동으로 퇴원해요.</p>` : ''}
      <p>
        <button class="rpg-assignment-btn" data-merc="${m.id}" data-assignment="${otherAssignment}">${otherLabel}</button>
        <button class="rpg-dismiss-merc-btn" data-merc="${m.id}">해고</button>
      </p>
      ${m.assignment === 'active' ? `
        ${formationSectionHtml(m, m.id)}
        ${mercCombatSettingsHtml(m)}
      ` : `
        <p>일자리:
          ${Object.values(TERRITORY_JOBS).map((job) => {
            const countInJob = territoryMercs.filter((mm) => mm.job === job.id && mm.id !== m.id).length;
            const full = countInJob >= MAX_MERCS_PER_FACILITY && m.job !== job.id;
            return `<button class="rpg-merc-job-btn" data-merc="${m.id}" data-job="${job.id}" ${m.job === job.id ? 'disabled' : ''} ${full ? 'disabled' : ''}>${FACILITY_ICONS[job.id] || ''} ${getTerritoryJobName(job.id, getLang())}${m.job === job.id ? ' ✓' : full ? ' (가득참)' : ''}</button>`;
          }).join('')}
        </p>
      `}
      ${squireSectionHtml(m)}
    </div>
  `;
}

// 종자 흡수 UI - 이미 흡수했으면 결과만 표시, 아직이면 흡수 가능한 다른 용병들을 후보 버튼으로 나열
function squireSectionHtml(host) {
  if (host.classSub) {
    const subCls = CLASSES[host.classSub];
    return `<p class="rpg-hint">🧬 종자: ${subCls ? getClassName(subCls.id, getLang()) : host.classSub} 직업 스킬(50% 위력)+스탯 일부(10%) 흡수함</p>`;
  }
  const candidates = (character.mercenaries || []).filter((mm) => mm.id !== host.id && mm.classMain !== host.classMain);
  if (!candidates.length) return '';
  return `
    <p class="rpg-hint">🧬 종자로 흡수(1회만, 되돌릴 수 없음):
      ${candidates.map((c) => `<button class="rpg-squire-btn" data-host="${host.id}" data-squire="${c.id}">${c.name}(${getClassName(c.classMain, getLang())})</button>`).join('')}
    </p>
  `;
}
// 영지 근무 섹션 - 전투 없이 턴 1개로 시설에 기여(용병보다 20% 더 효율적). 예전엔 모험 탭에 있었는데
// "영지" 이름이 붙은 기능은 다 영지 탭에 모아두는 게 맞아서 이리로 옮김
function workTerritorySectionHtml() {
  return `
    <div class="rpg-facility-dashboard">
      <h4>🛠️ 영지 근무 (전투 없이 턴 1개로 안전하게 시설에 기여, 용병보다 20% 더 효율적)</h4>
      <div class="rpg-work-territory-list">
        ${Object.keys(TERRITORY_JOBS).map((jobId) => workTerritoryCardHtml(jobId)).join('')}
      </div>
    </div>
  `;
}
function partySectionHtml() {
  const mercenaries = character.mercenaries || [];
  const active = mercenaries.filter((m) => m.assignment === 'active');
  const territory = mercenaries.filter((m) => m.assignment !== 'active');
  if (!mercenaries.length) {
    return `<div class="rpg-party">${territoryEconomySummaryHtml()}${facilityDashboardHtml()}${workTerritorySectionHtml()}${territoryRestHtml()}<h4>파티 / 영지</h4><p class="rpg-hint">아직 고용한 용병이 없어요. 마을 선술집에서 용병을 고용해보세요.</p></div>`;
  }
  return `
    <div class="rpg-party">
      ${territoryEconomySummaryHtml()}
      ${facilityDashboardHtml()}
      ${workTerritorySectionHtml()}
      ${territoryRestHtml()}
      <h4>전투부대 (${active.length}/${MAX_MERCENARIES})</h4>
      ${active.length ? active.map(mercenaryCardHtml).join('') : '<p class="rpg-hint">동행 중인 용병이 없어요.</p>'}
      <h4>영지 (${territory.length}/${MAX_TERRITORY_MERCENARIES})</h4>
      ${territory.length ? territory.map(mercenaryCardHtml).join('') : '<p class="rpg-hint">영지에서 쉬고 있는 용병이 없어요.</p>'}
    </div>
  `;
}

// 여러 탭(캐릭터/영지)에서 공용으로 쓰는 용병 진형 버튼 핸들러 - rerender만 탭별로 다름
function wireFormationButtons(content, rerender) {
  content.querySelectorAll('.rpg-formation-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const mercId = btn.dataset.merc || null;
    const formationRow = btn.dataset.formation || null;
    try {
      await apiPost('set-formation', mercId ? { mercId, formationRow } : { formationRow });
      if (mercId) {
        const merc = (character.mercenaries || []).find((m) => m.id === mercId);
        if (merc) merc.formationRow = formationRow;
      } else {
        character.formationRow = formationRow;
      }
      rerender();
    } catch (e) { showToast(friendlyError(e)); }
  }));
}

// 턴 소모로 쉬며 회복(부상/체력) 버튼 공용 핸들러 - 영지 탭/성 화면에서 공유(rerender만 다름)
function wireRestHealButtons(content, container, rerender) {
  content.querySelectorAll('.rpg-rest-heal-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const mercId = btn.dataset.merc || null;
    try {
      const r = await apiPost('rest-heal', mercId ? { part: btn.dataset.part, mercId } : { part: btn.dataset.part });
      character.turnPoints = r.turnPoints;
      if (r.part === 'hp') {
        if (mercId) {
          const merc = (character.mercenaries || []).find((m) => m.id === mercId);
          if (merc) merc.currentHp = r.currentHp;
        } else {
          character.currentHp = r.currentHp;
        }
      } else if (mercId) {
        const merc = (character.mercenaries || []).find((m) => m.id === mercId);
        if (merc) merc.injuries = r.injuries;
      } else {
        character.injuries = r.injuries;
      }
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      showToast(r.part === 'hp' ? ti('rpg.ui.territory.hpHealed', getLang(), { cost: r.cost }) : ti('rpg.ui.territory.injuryHealed', getLang(), { part: bodyPartName(r.part), cost: r.cost }));
      rerender();
    } catch (e) { showToast(friendlyError(e)); }
  }));
}

// ── 영지 탭 - 고용한 용병 관리(전투부대/영지 배치, 진형, 해고, 입원) ──
function renderTerritoryTab(content, container) {
  content.innerHTML = partySectionHtml();
  const rerender = () => renderTerritoryTab(content, container);
  wireFormationButtons(content, rerender);
  wireRestHealButtons(content, container, rerender);
  content.querySelectorAll('.rpg-work-territory-card').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('work-territory', { job: btn.dataset.job });
      character.gold = r.gold;
      character.turnPoints = r.turnPoints;
      character.facilityDays = r.facilityDays;
      character.facilityLevels = r.facilityLevels;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      rerender();
      const levelMsg = r.leveledUp.length ? ` · 🎉 ${getTerritoryJobName(r.leveledUp[0].jobId, getLang())} Lv.${r.leveledUp[0].level}!` : '';
      showToast(`${getTerritoryJobName(r.job, getLang())}에서 일했습니다${r.goldIncome ? ` (+${r.goldIncome}골드)` : ''}${levelMsg}`);
      showTerritoryNotice(container, r.territoryNotice);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-merc-unequip-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await apiPost('unequip', { equipSlot: btn.dataset.slot, mercId: btn.dataset.merc });
      await loadCharacter();
      rerender();
      showToast('용병 장비를 해제했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-merc-recommend-btn').forEach((btn) => btn.addEventListener('click', () => {
    const merc = (character.mercenaries || []).find((m) => m.id === btn.dataset.merc);
    if (!merc) return;
    showRecommendOverlay(container, merc, btn.dataset.slot, merc.id, rerender);
  }));
  content.querySelectorAll('.rpg-dismiss-merc-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('dismiss-mercenary', { mercId: btn.dataset.merc });
      character.mercenaries = (character.mercenaries || []).filter((m) => m.id !== btn.dataset.merc);
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      rerender();
      showToast(r.refund > 0 ? `용병을 해고했습니다 (골드 ${r.refund} 환급)` : '용병을 해고했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-admit-merc-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('admit-mercenary', { mercId: btn.dataset.merc });
      character.gold = r.gold;
      const merc = (character.mercenaries || []).find((m) => m.id === r.mercId);
      if (merc) merc.hospitalized = true;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      rerender();
      showToast(`병원에 입원시켰습니다 (${r.cost}골드)`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-assignment-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('set-mercenary-assignment', { mercId: btn.dataset.merc, assignment: btn.dataset.assignment });
      const merc = (character.mercenaries || []).find((m) => m.id === r.mercId);
      if (merc) { merc.assignment = r.assignment; merc.job = r.job; }
      rerender();
      showToast(r.assignment === 'active' ? '전투부대로 편입했습니다' : '영지로 보냈습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-merc-stance-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('set-mercenary-combat-settings', { mercId: btn.dataset.merc, stance: btn.dataset.stance });
      const merc = (character.mercenaries || []).find((m) => m.id === r.mercId);
      if (merc) merc.stance = r.stance;
      rerender();
      showToast(r.stance === 'aggressive' ? '쎈 몹부터 노리도록 바꿨습니다' : '약한 몹부터 노리도록 바꿨습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-merc-role-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('set-mercenary-combat-settings', { mercId: btn.dataset.merc, combatRole: btn.dataset.role });
      const merc = (character.mercenaries || []).find((m) => m.id === r.mercId);
      if (merc) merc.combatRole = r.combatRole;
      rerender();
      showToast(r.combatRole === 'support' ? '서포트 역할로 바꿨습니다' : '버티기 역할로 바꿨습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-merc-job-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('set-mercenary-assignment', { mercId: btn.dataset.merc, assignment: 'territory', job: btn.dataset.job });
      const merc = (character.mercenaries || []).find((m) => m.id === r.mercId);
      if (merc) merc.job = r.job;
      rerender();
      showToast(`${getTerritoryJobName(r.job, getLang())}에 배치했습니다`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-rename-merc-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const merc = (character.mercenaries || []).find((m) => m.id === btn.dataset.merc);
    const nextName = prompt('용병의 새 이름을 입력하세요 (최대 12자)', merc ? merc.name : '');
    if (!nextName || !nextName.trim()) return;
    try {
      const r = await apiPost('rename-mercenary', { mercId: btn.dataset.merc, name: nextName.trim() });
      if (merc) merc.name = r.name;
      rerender();
      showToast('용병 이름을 변경했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-squire-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const squire = (character.mercenaries || []).find((m) => m.id === btn.dataset.squire);
    if (!confirm(`${squire ? squire.name : '이 용병'}을(를) 종자로 흡수하면 독립된 용병으로는 다시 못 씁니다(되돌릴 수 없음). 계속할까요?`)) return;
    try {
      const r = await apiPost('squire-mercenary', { hostMercId: btn.dataset.host, squireMercId: btn.dataset.squire });
      character.mercenaries = (character.mercenaries || []).filter((m) => m.id !== btn.dataset.squire);
      const host = character.mercenaries.find((m) => m.id === r.hostMercId);
      if (host) { host.classSub = r.classSub; host.squireStatBonus = r.squireStatBonus; host.hireCostBonus = r.hireCostBonus; }
      rerender();
      showToast(`${getClassName(r.classSub, getLang())} 종자를 흡수했습니다!`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
}

// ── 부상 상태 요약(캐릭터 탭에서 사용) ─────────────────
function injuriesSummaryHtml() {
  const injuries = character.injuries || {};
  const injuredParts = ['arm', 'leg'].filter((p) => (injuries[p] || {}).severity > 0);
  if (!injuredParts.length) return `<p class="rpg-hint">부상 없음</p>`;
  const lines = injuredParts.map((p) => {
    const injury = injuries[p];
    const severityLabel = injury.severity === 2 ? t('rpg.ui.injury.severityMajorFull') : t('rpg.ui.injury.severityMinorFull');
    return ti('rpg.ui.injury.summaryLine', getLang(), { part: bodyPartName(p), severity: severityLabel, turns: injury.turnsLeft });
  });
  return `<p class="rpg-hint">🩹 부상: ${lines.join(' / ')}</p>`;
}

// ── 캐릭터 탭 ───────────────────────────────────────
function renderCharacterTab(content, container) {
  const cls = CLASSES[character.classMain];
  const subCls = character.classSub ? CLASSES[character.classSub] : null;
  const needed = xpToNextLevel(character.level);
  content.innerHTML = `
    <div class="rpg-char-info">
      <p>직업: ${cls ? getClassName(cls.id, getLang()) : '-'}${subCls ? ` (부직업: ${getClassName(subCls.id, getLang())})` : ''}</p>
      <p>경험치: ${character.xp} / ${needed}</p>
      <p>전투 스탠스 (스킬은 스탠스와 무관하게 항상 씀 — 이건 몹이 여럿일 때 누구부터 때릴지만 정함):
        <button class="rpg-stance-btn" data-stance="stable">안정형(약한 몹부터)</button>
        <button class="rpg-stance-btn" data-stance="aggressive">공격형(강한 몹부터)</button>
        (현재: ${character.stance === 'aggressive' ? '공격형' : '안정형'})
      </p>
      ${formationSectionHtml(character)}
      ${injuriesSummaryHtml()}
    </div>
    <div class="rpg-stats">
      <p>남은 스탯포인트: ${character.statPoints}</p>
      ${['str', 'int', 'agi', 'vit', 'wis'].map((s) => `
        <div class="rpg-stat-row">
          <span>${s.toUpperCase()}: ${character.stats[s] || 0}</span>
          ${character.statPoints > 0 ? `<button class="rpg-stat-btn" data-stat="${s}">+1</button>` : ''}
        </div>
      `).join('')}
    </div>
    ${equipmentSectionHtml()}
    ${subclassSectionHtml()}
    ${journalHtml()}
  `;
  content.querySelectorAll('.rpg-stance-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await apiPost('set-stance', { stance: btn.dataset.stance });
      character.stance = btn.dataset.stance;
      renderCharacterTab(content, container);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  wireFormationButtons(content, () => renderCharacterTab(content, container));
  content.querySelectorAll('.rpg-stat-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('allocate-stat', { stat: btn.dataset.stat, amount: 1 });
      character.stats = r.stats;
      character.statPoints = r.statPoints;
      renderCharacterTab(content, container);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-unequip-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const before = computeCharacterCombatStats(character);
      await apiPost('unequip', { equipSlot: btn.dataset.slot });
      await loadCharacter();
      const after = computeCharacterCombatStats(character);
      renderCharacterTab(content, container);
      showToast(`해제 완료 — ${statsDeltaMessage(before, after)}`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-recommend-btn').forEach((btn) => btn.addEventListener('click', () => {
    showRecommendOverlay(container, character, btn.dataset.slot, null, () => renderCharacterTab(content, container));
  }));

  content.querySelectorAll('.rpg-self-repair-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('self-repair-equipment', { equipSlot: btn.dataset.slot });
      character.gold = r.gold;
      character.equipment[`${btn.dataset.slot}Durability`] = r.durability;
      await loadCharacter(); // 망치 소모분 인벤토리 갱신
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderCharacterTab(content, container);
      showToast(`직접 수리 완료! (${r.cost}골드 소모)`);
    } catch (e) { showToast(friendlyError(e)); }
  }));

  content.querySelectorAll('.rpg-enhance-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('enhance-equipment', { equipSlot: btn.dataset.slot });
      character.gold = r.gold;
      character.equipment[`${btn.dataset.slot}EnhanceLevel`] = r.level;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderCharacterTab(content, container);
      showToast(`강화 성공! +${r.level} (결정 ${r.cost.stones}개, ${r.cost.gold}골드 소모)`);
    } catch (e) { showToast(friendlyError(e)); }
  }));

  content.querySelectorAll('.rpg-subclass-card').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await apiPost('choose-subclass', { classId: btn.dataset.class });
      await loadCharacter();
      renderCharacterTab(content, container);
      showToast('부직업을 선택했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
}

// ── 슬롯별 "추천" — 착용 중인 장비와 가방 속 같은 부위 아이템들을 전부 착용 시뮬레이션해서
// 종합 전투력(공격력+방어력+최대체력/10)이 가장 높아지는 걸 골라줌. 요구스탯/직업 방어구제한을
// 못 채우는 아이템은 애초에 후보에서 제외(어차피 서버가 막을 조합이라 추천 의미가 없음)
function gearScore(stats) { return stats.atk + stats.def + Math.round(stats.maxHp / 10); }
function canEquipItemOn(targetChar, item) {
  const cls = CLASSES[targetChar.classMain] || CLASSES.warrior;
  if (['armor_top', 'armor_bottom'].includes(item.type) && item.armorClass) {
    if (cls.armorRestriction && !cls.armorRestriction.includes(item.armorClass)) return false;
  }
  if (['armor_top', 'armor_bottom', 'weapon', 'shield'].includes(item.type) && (item.strRequirement || item.wisRequirement)) {
    const stats = effectiveStats(targetChar);
    if (item.strRequirement && stats.str < item.strRequirement) return false;
    if (item.wisRequirement && stats.wis < item.wisRequirement) return false;
  }
  return true;
}
function findBestItemForSlot(targetChar, slot) {
  const baseline = computeCharacterCombatStats(targetChar);
  const currentItemId = (targetChar.equipment || {})[slot];
  let bestScore = gearScore(baseline);
  let best = null;
  for (const entry of (character.inventory || [])) { // 가방은 항상 계정(character) 공용
    const item = ITEMS[entry.itemId];
    if (!item || item.type !== slot || entry.itemId === currentItemId) continue;
    if (!canEquipItemOn(targetChar, item)) continue;
    const candidateStats = computeCharacterCombatStats({
      ...targetChar,
      equipment: { ...targetChar.equipment, [slot]: entry.itemId, [`${slot}Durability`]: 100 },
    });
    const score = gearScore(candidateStats);
    if (score > bestScore) { bestScore = score; best = { itemId: entry.itemId, item, stats: candidateStats }; }
  }
  return { baseline, best };
}
// mercId가 있으면 그 용병에게, 없으면 본인에게 추천 - 바꾸거나(교체) 취소할 수 있는 확인창으로 보여줌
function showRecommendOverlay(container, targetChar, slot, mercId, rerender) {
  const { baseline, best } = findBestItemForSlot(targetChar, slot);
  const currentItemId = (targetChar.equipment || {})[slot];
  const currentItem = currentItemId ? ITEMS[currentItemId] : null;
  if (!best) {
    showAlertOverlay(container, {
      title: `${equipSlotLabel(slot)} 추천`,
      bodyHtml: `<p>가방에서 지금보다 더 나은 ${equipSlotLabel(slot)}을(를) 찾지 못했습니다. 지금 착용 중인 ${currentItem ? getItemName(currentItem.id, getLang()) : '(없음)'}이(가) 최선이에요.</p>`,
    });
    return;
  }
  const removedParts = currentItem ? itemBonusParts(currentItem) : [];
  const addedParts = itemBonusParts(best.item);
  showConfirmOverlay(container, {
    title: `${equipSlotLabel(slot)} 추천 — ${getItemName(best.item.id, getLang())}`,
    bodyHtml: `
      <p class="rpg-hint">현재: ${currentItem ? `${getItemName(currentItem.id, getLang())}${itemStatsLabel(currentItem)}` : '없음'}</p>
      <p class="rpg-hint">추천: ${getItemName(best.item.id, getLang())}${itemStatsLabel(best.item)}</p>
      ${addedParts.length ? `<p class="rpg-stat-up">추가: ${addedParts.join(', ')}</p>` : ''}
      ${removedParts.length ? `<p class="rpg-stat-down">해제(${getItemName(currentItem.id, getLang())}): ${removedParts.join(', ')}</p>` : ''}
      ${statsDeltaRowsHtml(baseline, best.stats)}
    `,
    confirmLabel: '이 아이템으로 교체',
    onConfirm: async () => {
      try {
        await apiPost('equip', mercId ? { itemId: best.itemId, mercId } : { itemId: best.itemId });
        await loadCharacter();
        showToast(`${equipSlotLabel(slot)}을(를) ${getItemName(best.item.id, getLang())}(으)로 교체했습니다`);
        rerender();
      } catch (e) { showToast(friendlyError(e)); }
    },
  });
}

// ── 장비창 — 착용 중인 장비를 슬롯별로 한눈에 보여줌 ──
function equipSlotLabel(slot) { return t(`rpg.ui.equipSlot.${slot}`); }
const DURABILITY_TRACKED_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom'];
function equipmentSectionHtml() {
  const stats = computeCharacterCombatStats(character);
  const slots = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
  const hammerQty = ((character.inventory || []).find((e) => e.itemId === 'repair_hammer') || {}).qty || 0;
  return `
    <div class="rpg-equipment">
      <h4>장비창</h4>
      <p class="rpg-hint">공격력 ${stats.atk} · 방어력 ${stats.def} · 최대체력 ${stats.maxHp} · 공격속성: ${ELEMENT_NAMES[stats.element]}</p>
      <p class="rpg-hint">수리는 기본적으로 대장간에서만 가능해요. 수리스킬을 배우고 수리 망치를 가지고 있으면 여기서 직접 저렴하게 수리할 수 있어요.</p>
      ${slots.map((slot) => {
        const itemId = character.equipment[slot];
        const item = itemId ? ITEMS[itemId] : null;
        const tracked = DURABILITY_TRACKED_SLOTS.includes(slot);
        const durability = tracked ? (character.equipment[`${slot}Durability`] ?? 100) : null;
        const broken = tracked && durability <= 0;
        const durabilityLabel = tracked && item ? ` — 내구도 ${durability}/100${broken ? ' (파손됨!)' : ''}` : '';
        const canSelfRepair = tracked && item && durability < 100
          && hammerQty > 0 && rarityAllowedBySkill(item.rarity, character.repairSkillLevel || 0);
        const selfRepairCost = canSelfRepair
          ? Math.ceil((100 - durability) * (REPAIR_COST_PER_POINT_BY_RARITY[item.rarity] || 2) * 0.6)
          : 0;
        const enhanceLevel = tracked ? (character.equipment[`${slot}EnhanceLevel`] || 0) : 0;
        const enhanceLabel = tracked && item && enhanceLevel > 0 ? ` +${enhanceLevel}` : '';
        const nextEnhanceCost = tracked && item && enhanceLevel < MAX_ENHANCE_LEVEL ? ENHANCE_LEVEL_COSTS[enhanceLevel + 1] : null;
        return `
          <div class="rpg-shop-row">
            <span>${equipSlotLabel(slot)}: ${item ? `${getItemName(item.id, getLang())}${enhanceLabel}${itemStatsLabel(item)}${durabilityLabel}` : '없음'}</span>
            <span>
              <button class="rpg-recommend-btn" data-slot="${slot}">✨추천</button>
              ${item ? `<button class="rpg-unequip-btn" data-slot="${slot}">해제</button>` : ''}
              ${canSelfRepair ? `<button class="rpg-self-repair-btn" data-slot="${slot}">직접 수리(망치 1개, ${selfRepairCost}골드)</button>` : ''}
              ${nextEnhanceCost ? `<button class="rpg-enhance-btn" data-slot="${slot}">강화(${nextEnhanceCost.stones}개 결정, ${nextEnhanceCost.gold}골드)</button>` : ''}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── 부직업(겸업) 선택 섹션 ───────────────────────────
function subclassSectionHtml() {
  if (character.classSub) return '';
  if ((character.level || 1) < SUB_CLASS_UNLOCK_LEVEL) {
    return `<p class="rpg-hint">레벨 ${SUB_CLASS_UNLOCK_LEVEL}부터 부직업(겸업)을 선택할 수 있어요. (현재 Lv.${character.level})</p>`;
  }
  const options = Object.values(CLASSES).filter((c) => c.id !== character.classMain);
  if (!options.length) return '';
  return `
    <div class="rpg-subclass-select">
      <h4>부직업 선택</h4>
      <p class="rpg-hint">본업 스킬에 더해 부직업 스킬도 함께 쓸 수 있어요. 한 번 고르면 되돌릴 수 없어요.</p>
      <div class="rpg-class-cards">
        ${options.map((c) => `
          <button class="rpg-subclass-card" data-class="${c.id}">
            <div class="rpg-class-name">${getClassName(c.id, getLang())}</div>
            <div class="rpg-class-skills">${c.skills.map((s) => getSkillName(c.id, s.id, getLang())).join(', ')}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// ── 탐험일지(로어) - 큰 줄기 스토리 조각을 순서대로 모으는 섹션 ──
function journalHtml() {
  const unlocked = new Set(character.loreUnlocked || []);
  const entries = Object.values(LORE_ENTRIES).sort((a, b) => a.order - b.order);
  return `
    <div class="rpg-journal">
      <h4>탐험일지 (${unlocked.size}/${entries.length})</h4>
      ${entries.map((entry) => unlocked.has(entry.id) ? `
        <div class="rpg-journal-entry">
          <div class="rpg-class-name">${entry.order}. ${entry.title}</div>
          <p class="rpg-hint">${entry.text}</p>
        </div>
      ` : `
        <div class="rpg-journal-entry rpg-journal-locked">
          <div class="rpg-class-name">${entry.order}. ???</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── 포션 자동사용 규칙 편집기 (전투 중 HP/MP/스테미나 임계값 기반 자동사용) ──
// mercId를 주면 본인이 아니라 그 용병(character.mercenaries에서 찾음)의 규칙을 편집함
