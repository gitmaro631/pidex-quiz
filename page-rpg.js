import { currentAccessToken } from './pi-sdk.js';
import { showToast } from './page-quiz.js';
import { setupPullToRefresh } from './util-ptr.js';
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
import { computeCharacterCombatStats, monsterDifficultyTier, COMBAT_MISS_PHRASES, effectiveStats } from './rpg-combat.js';
import {
  MERCENARY_TEMPLATES, MAX_MERCENARIES, MAX_TERRITORY_MERCENARIES, TERRITORY_JOBS, dailyTavernRoster, PLAYER_TERRITORY_BONUS_MULT,
  FOOD_PER_DAY_PER_FARMER, FOOD_CONSUMPTION_PER_DAY_PER_WORKER, GOLD_PER_MISSING_FOOD, WAGE_PER_MERC_PER_DAY,
} from './data/rpg/mercenaries.js';
import { CLASS_ESSENCE_ITEM, MAX_SKILL_TIER, TRAINING_TIER_COSTS } from './data/rpg/training.js';
import { MAX_ENHANCE_LEVEL, ENHANCE_LEVEL_COSTS, MAX_REPAIR_SKILL_LEVEL, REPAIR_SKILL_COSTS, REPAIR_SKILL_RARITY_CAP, rarityAllowedBySkill } from './data/rpg/enhancement.js';
import { CASTLE_CLEAR_REQUIREMENT } from './data/rpg/castle.js';
import { computeCureCost, REST_HEAL_TURN_COST_BY_SEVERITY, HP_REST_HEAL_FULL_TURNS } from './data/rpg/injuries.js';
import { allowedFormationRows } from './rpg-combat.js';
import { facilityProgress, facilityAccrualRate, facilityBonusMultiplier, MAX_MERCS_PER_FACILITY, BASELINE_MERC_LEVEL } from './data/rpg/facilities.js';

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
const BODY_PART_NAMES = { arm: '팔', leg: '다리' };

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
  const setStr = item.setId ? ` <button class="rpg-set-info-btn" data-set="${item.setId}">🧩${SET_BONUSES[item.setId].name}</button>` : '';
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
  const levelLines = (notice.leveledUp || []).map((l) => `🎉 ${FACILITY_ICONS[l.jobId] || ''} ${l.name}이(가) Lv.${l.level}(으)로 성장했습니다!`);
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
  const pieceNames = [ringId, necklaceId].filter(Boolean).map((id) => (ITEMS[id] || {}).name || id);
  const bonusText = itemStatsLabel({ ...setDef.bonus }).replace(/^ \(|\)$/g, '');
  alert(`${setDef.name}\n\n구성: ${pieceNames.join(' + ')}\n둘 다 착용시 세트 효과: ${bonusText || '없음'}`);
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

let character = null;
let activeSlot = null;
let activeTab = 'adventure';

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
  bag_tier_maxed: '이 등급 가방은 이미 한도를 다 채웠습니다. 다음 등급 가방이 필요합니다.',
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
  not_enough_material: '재료가 부족합니다.',
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
};

function friendlyError(err) {
  return ERROR_MESSAGES[err.message] || '오류가 발생했습니다. 다시 시도해주세요.';
}

async function loadCharacter() {
  character = await apiPost('character', {});
  return character;
}

export async function renderRpgPage(container, _username) {
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

  renderMain(container);
}

// ── 캐릭터 선택 화면 (계정당 최대 3캐릭) ──────────────
async function renderCharacterSelect(container) {
  container.innerHTML = `<div class="rpg-loading">캐릭터 목록을 불러오는 중...</div>`;
  let slots;
  try {
    const res = await apiPostRaw('list-characters', {});
    slots = res.slots;
  } catch (e) {
    container.innerHTML = `<div class="rpg-loading">캐릭터 목록을 불러오지 못했습니다.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="rpg-page">
      <h3>캐릭터 선택</h3>
      <p class="rpg-hint">계정당 최대 3명까지 캐릭터를 만들 수 있어요.</p>
      <div class="rpg-class-cards">
        ${slots.map((s) => {
          // 직업을 아직 선택 안 한 캐릭터는(뒤로가기로 나온 경우 등) 실제로는 아무것도 안 정해진
          // 상태라 "새 캐릭터 생성"과 똑같이 취급함(선택을 안 했으니 눈에 보이는 변화도 없어야 함)
          const isBlank = !s.exists || !s.classMain;
          return isBlank ? `
          <div class="rpg-slot-block">
            <button class="rpg-slot-btn" data-slot="${s.slot}">
              <div class="rpg-class-name">슬롯 ${s.slot} — 새 캐릭터 생성</div>
            </button>
          </div>
        ` : `
          <div class="rpg-slot-block">
            <button class="rpg-slot-btn" data-slot="${s.slot}">
              <div class="rpg-class-name">슬롯 ${s.slot} — Lv.${s.level} ${(CLASSES[s.classMain] || {}).name}</div>
              <div class="rpg-class-skills">${s.gold}골드</div>
            </button>
            <button class="rpg-slot-delete-btn" data-slot="${s.slot}">이 캐릭터 삭제</button>
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
    if (!confirm(`슬롯 ${slot} 캐릭터를 정말 삭제할까요? 저장상자 내용물은 그대로 사라지고, 나머지 자산(골드/장비/인벤토리/용병)의 절반은 골드로 환산되어 마지막에 있던 마을의 이송상자로 들어갑니다. 되돌릴 수 없습니다.`)) return;
    try {
      const r = await apiPostRaw('delete-character', { slot });
      showToast(r.refund > 0 ? `캐릭터를 삭제했습니다. ${(TOWNS[r.refundTown] || {}).name || r.refundTown} 이송상자에 ${r.refund}골드가 들어갔습니다.` : '캐릭터를 삭제했습니다');
      renderCharacterSelect(container);
    } catch (e) {
      showToast(friendlyError(e));
    }
  }));
}

function renderClassSelect(container) {
  container.innerHTML = `
    <div class="rpg-class-select">
      <button class="rpg-back-to-slots-btn">← 캐릭터 선택으로</button>
      <h3>직업을 선택하세요</h3>
      <p class="rpg-hint">한 번 선택하면 되돌릴 수 없어요. 부직업은 나중에 레벨업하면 고를 수 있어요.</p>
      <div class="rpg-class-cards">
        ${Object.values(CLASSES).map((c) => `
          <button class="rpg-class-card" data-class="${c.id}">
            <div class="rpg-class-name">${c.name}</div>
            <div class="rpg-class-skills">${c.skills.map((s) => s.name).join(', ')}</div>
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
      <button class="rpg-switch-char-btn">캐릭터 변경</button>
    </div>
  `;
}


function renderMain(container) {
  container.innerHTML = `
    <div class="rpg-page">
      ${statusBarHtml()}
      <div class="rpg-tabs">
        <button class="rpg-tab" data-tab="adventure">모험</button>
        <button class="rpg-tab" data-tab="town">마을</button>
        <button class="rpg-tab" data-tab="shop">상점</button>
        <button class="rpg-tab" data-tab="market">마켓</button>
        <button class="rpg-tab" data-tab="storage">창고</button>
        <button class="rpg-tab" data-tab="territory">영지</button>
        <button class="rpg-tab" data-tab="inventory">인벤토리</button>
        <button class="rpg-tab" data-tab="character">캐릭터</button>
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
// 몹 전력비(difficultyRatio, preview-zone.js가 계산)를 색으로 - rpg-combat.js의 MONSTER_DIFFICULTY_TIERS와
// 같은 기준을 그대로 재사용(경험치/골드 배율도 이 기준과 일치함)
function monsterDifficultyColor(ratio) {
  return monsterDifficultyTier(ratio ?? 0).color;
}

function renderAdventureTab(content, container) {
  const townName = (TOWNS[character.currentTown] || {}).name || character.currentTown || '없음(던전)';
  const townZones = Object.values(ZONES).filter((z) => z.town === character.currentTown || z.town === null);
  content.innerHTML = `
    <p class="rpg-hint">현재 위치: ${townName} — 다른 마을로 가려면 "마을" 탭에서 이동하세요.</p>
    <div class="rpg-zone-list">
      ${townZones.map((z) => {
        const clears = (character.zoneClearCounts || {})[z.id] || 0;
        const eligible = clears >= CASTLE_CLEAR_REQUIREMENT;
        const unlockClears = z.unlockZoneId ? ((character.zoneClearCounts || {})[z.unlockZoneId] || 0) : null;
        const locked = z.unlockZoneId && unlockClears < CASTLE_CLEAR_REQUIREMENT;
        return `
        <div class="rpg-zone-block">
          <button class="rpg-zone-btn" data-zone="${z.id}" ${locked ? 'disabled' : ''}>
            <div class="rpg-zone-name">${z.name}${locked ? ' 🔒' : ''}</div>
            <div class="rpg-zone-tier">Tier ${z.tier}${z.requiresTorch ? ' · 횃불 필요' : ''}</div>
            ${locked ? `<div class="rpg-zone-tier">${ZONES[z.unlockZoneId].name} ${unlockClears}/${CASTLE_CLEAR_REQUIREMENT}회 공략 후 해금</div>` : ''}
          </button>
          ${eligible ? `<p class="rpg-hint"><button class="rpg-castle-challenge-btn" data-zone="${z.id}">성 도전하기</button></p>` : ''}
        </div>
      `;
      }).join('')}
    </div>
    <p class="rpg-hint"><button class="rpg-castle-income-btn">성주 수입 수령</button></p>
    <div class="rpg-facility-dashboard">
      <h4>🛠️ 영지 근무 (전투 없이 턴 1개로 안전하게 시설에 기여, 용병보다 20% 더 효율적)</h4>
      <div class="rpg-work-territory-list">
        ${Object.keys(TERRITORY_JOBS).map((jobId) => workTerritoryCardHtml(jobId)).join('')}
      </div>
    </div>
  `;
  content.querySelectorAll('.rpg-castle-challenge-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-castle', { zoneId: btn.dataset.zone });
      if (r.wasEmpty) {
        showToast(`${ZONES[r.zoneId].name}의 성이 비어있어 바로 차지했습니다!`);
      } else if (r.won) {
        showToast(`${r.previousOwnerName}을(를) 꺾고 ${ZONES[r.zoneId].name}의 성을 차지했습니다! (${r.challengerRoll} vs ${r.defenderRoll})`);
      } else {
        showToast(`도전 실패... (${r.challengerRoll} vs ${r.defenderRoll})`);
      }
    } catch (e) { showToast(friendlyError(e)); }
  }));
  const incomeBtn = content.querySelector('.rpg-castle-income-btn');
  if (incomeBtn) incomeBtn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-castle-income', {});
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      if (r.alreadyClaimed) showToast('오늘은 이미 수령했습니다.');
      else if (r.income > 0) showToast(`성주 수입 ${r.income}골드를 수령했습니다! (보유 성 ${r.ownedZones.length}개)`);
      else showToast('현재 소유한 성이 없습니다.');
    } catch (e) { showToast(friendlyError(e)); }
  });
  content.querySelectorAll('.rpg-work-territory-card').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('work-territory', { job: btn.dataset.job });
      character.gold = r.gold;
      character.turnPoints = r.turnPoints;
      character.facilityDays = r.facilityDays;
      character.facilityLevels = r.facilityLevels;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderAdventureTab(content, container);
      const levelMsg = r.leveledUp.length ? ` · 🎉 ${r.leveledUp[0].name} Lv.${r.leveledUp[0].level}!` : '';
      showToast(`${TERRITORY_JOBS[r.job].name}에서 일했습니다${r.goldIncome ? ` (+${r.goldIncome}골드)` : ''}${levelMsg}`);
      showTerritoryNotice(container, r.territoryNotice);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-zone-btn').forEach((btn) => {
    btn.addEventListener('click', () => enterZonePreview(content, container, btn.dataset.zone));
  });
}

// 지역 클릭 시 - 바로 전투가 아니라 몹 구성을 먼저 보여줌("필드에 들어간" 느낌). 처음 보는 건 무료
async function enterZonePreview(content, container, zoneId) {
  content.innerHTML = `<div class="rpg-loading">지역에 들어가는 중...</div>`;
  try {
    const r = await apiPost('preview-zone', { zoneId });
    renderZonePreviewScreen(content, container, r.preview);
  } catch (e) {
    content.innerHTML = `<div class="rpg-loading">${friendlyError(e)}</div><p><button class="rpg-zone-back-btn">◀ 지역 목록</button></p>`;
    const backBtn = content.querySelector('.rpg-zone-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => renderAdventureTab(content, container));
  }
}

// 필드 진입 화면 - 서로 다른 랜덤 몹 구성 후보 여러 개를 한 번에 보여주고, 그중 하나를 골라 그 조합
// 그대로 전투를 시작함("여러 조합 중에 골라서 들어간다"). 새로고침은 골드를 써서 후보 전체를 다시 굴림
// (다른 지역에 갔다와도 이 지역 미리보기는 그대로 유지됨 - 지역별로 따로 저장)
function renderZonePreviewScreen(content, container, preview) {
  const zone = ZONES[preview.zoneId];
  content.innerHTML = `
    <p><button class="rpg-zone-back-btn">◀ 지역 목록</button></p>
    <h4>${zone.name}에 들어왔다</h4>
    <p class="rpg-hint">마주칠 수 있는 조합 중 하나를 골라 들어가세요.</p>
    <div class="rpg-encounter-option-list">
      ${preview.options.map((opt, idx) => `
        <button class="rpg-encounter-option-btn" data-zone="${preview.zoneId}" data-option="${idx}">
          ${opt.isRare ? '<span class="rpg-encounter-rare-tag">⚠️ 희귀</span>' : ''}
          <div class="rpg-encounter-option-monsters">
            ${opt.monsters.map((m) => `
              <span class="rpg-encounter-icon">${MONSTER_TAG_ICONS[(m.tags || [])[0]] || '❓'}</span>
              <span class="rpg-encounter-name" style="color: ${monsterDifficultyColor(m.difficultyRatio)}">${m.name}</span>
            `).join(' · ')}
          </div>
        </button>
      `).join('')}
    </div>
    <p class="rpg-hint">
      <button class="rpg-refresh-encounter-btn" data-zone="${preview.zoneId}" ${character.gold >= preview.refreshGoldCost ? '' : 'disabled'}>🔄 새로고침 (${preview.refreshGoldCost}골드)</button>
    </p>
    ${combatLogSpeedControlHtml()}
    <div class="rpg-combat-log"></div>
  `;
  const log = content.querySelector('.rpg-combat-log');
  wireCombatLogSpeedControl(content);
  content.querySelector('.rpg-zone-back-btn').addEventListener('click', () => renderAdventureTab(content, container));
  content.querySelector('.rpg-refresh-encounter-btn').addEventListener('click', async () => {
    try {
      const r = await apiPost('preview-zone', { zoneId: preview.zoneId, refresh: true });
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderZonePreviewScreen(content, container, r.preview);
    } catch (e) { showToast(friendlyError(e)); }
  });
  content.querySelectorAll('.rpg-encounter-option-btn').forEach((btn) => btn.addEventListener('click', async () => {
    log.innerHTML = `<div class="rpg-loading">전투 중...</div>`;
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
          ${result.victory ? '승리' : '패배'} · 경험치 +${result.xpGain} · 골드 +${result.goldGain}
          ${result.levelsGained ? ` · <b>레벨업! Lv.${result.level}</b>` : ''}
          ${result.loot.length ? `<br>획득: ${result.loot.map((d) => `${(ITEMS[d.itemId] || {}).name || d.itemId} x${d.qty}`).join(', ')}` : ''}
        </div>
        ${loreUnlockHtml(result.newLore)}
      `);
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      showTerritoryNotice(container, result.territoryNotice);
    } catch (e) {
      if (log.isConnected) log.innerHTML = `<div class="rpg-loading">${friendlyError(e)}</div>`;
    }
  }));
}

// 전투 로그에서 강타/특수기/치명타/추가타처럼 눈에 띄어야 할 메시지를 구분하기 위한 키워드 모음.
// 로그가 구조화된 데이터가 아니라 문장이라, 직업/몹 스킬 이름을 전부 모아서 문장에 포함되는지로 판별함
const ALL_SKILL_NAMES = [
  ...Object.values(CLASSES).flatMap((c) => c.skills.map((s) => s.name)),
  ...Object.values(MONSTERS).flatMap((m) => (m.skills || []).map((s) => s.name)),
];
// 5가지로 구분: 치명타(빨강) > 추가타(보라) > 스킬/강타(청록) > 회복(초록) > 빗나감/회피(회색)
// - 겹치면 앞쪽(치명타 등)이 우선, CSS에서도 같은 순서로 선언해 우선순위를 맞춤
function classifyCombatLogLine(line) {
  const classes = [];
  if (line.includes('💥치명타')) classes.push('rpg-log-crit');
  if (line.includes('(추가타!)')) classes.push('rpg-log-extra');
  if (ALL_SKILL_NAMES.some((name) => line.includes(name))) classes.push('rpg-log-skill');
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
async function playCombatLog(logEl, lines) {
  logEl.innerHTML = '<div class="rpg-log-lines"></div>';
  const linesEl = logEl.querySelector('.rpg-log-lines');
  // 실제 줄이 들어가기 시작하는 지금 시점에 화면으로 끌어옴 - 버튼 클릭 시점엔 아직 "전투 중..." 표시만
  // 있어서 위치가 안 잡혀있었을 수 있음(레이아웃이 자리잡은 뒤 스크롤되게 requestAnimationFrame으로 한 틱 미룸)
  requestAnimationFrame(() => logEl.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  const speedMult = COMBAT_LOG_SPEEDS[getCombatLogSpeed()].mult;
  const delay = Math.max(300, Math.min(1200, 6000 / Math.max(lines.length, 1))) * speedMult;
  for (const line of lines) {
    if (!logEl.isConnected) return; // 재생 도중 다른 탭으로 넘어갔으면 조용히 멈춤
    const p = document.createElement('p');
    p.textContent = line;
    classifyCombatLogLine(line).forEach((cls) => p.classList.add(cls));
    linesEl.appendChild(p);
    linesEl.scrollTop = linesEl.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// ── 새로 언락된 탐험일지(로어) 알림 ───────────────────
function loreUnlockHtml(newLore) {
  if (!newLore || !newLore.length) return '';
  return newLore.map((entry) => `
    <div class="rpg-lore-unlock">
      📖 <b>탐험일지 갱신: ${entry.title}</b><br>${entry.text}
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
      <span>${quest.name} — ${quest.desc}${done ? ' ✅' : ''}</span>
      ${!done ? `<button class="rpg-quest-claim-btn" data-quest="${questId}" ${met ? '' : 'disabled'}>완료 보고</button>` : ''}
    </div>
  `;
}

// ── 의사 NPC 치료 UI(경상/중상 관계없이 즉시 완치, 비용은 남은 회복턴에 비례) ─────
// 본인뿐 아니라 고용한 용병들의 부상도 여기서 같이 치료 가능(mercId 데이터속성으로 구분)
function cureRowHtml(name, part, injury, mercId) {
  const severityLabel = injury.severity === 2 ? '중상' : '경상';
  const mercAttr = mercId ? ` data-merc="${mercId}"` : '';
  const cost = computeCureCost(injury);
  const restCost = REST_HEAL_TURN_COST_BY_SEVERITY[injury.severity] || 2;
  return `
    <div class="rpg-shop-row">
      <span>${name} - ${BODY_PART_NAMES[part]} ${severityLabel} (남은 ${injury.turnsLeft}턴)</span>
      <span>
        <button class="rpg-cure-btn" data-part="${part}"${mercAttr}>치료 (${cost}골드)</button>
        <button class="rpg-rest-heal-btn" data-part="${part}"${mercAttr}>영지에서 쉬기 (턴 ${restCost}개)</button>
      </span>
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
      <span>${name} - 체력 ${currentHp}/${maxHp}</span>
      <span><button class="rpg-rest-heal-btn" data-part="hp"${mercAttr}>영지에서 쉬며 체력 회복 (턴 ${restCost}개)</button></span>
    </div>
  `;
}
function doctorCureHtml() {
  const rows = [];
  const injuries = character.injuries || {};
  ['arm', 'leg'].filter((p) => (injuries[p] || {}).severity > 0)
    .forEach((part) => rows.push(cureRowHtml('나', part, injuries[part], null)));
  const selfStats = computeCharacterCombatStats(character);
  rows.push(hpRestRowHtml('나', null, character.currentHp, selfStats.maxHp));
  (character.mercenaries || []).forEach((m) => {
    const mInjuries = m.injuries || {};
    ['arm', 'leg'].filter((p) => (mInjuries[p] || {}).severity > 0)
      .forEach((part) => rows.push(cureRowHtml(m.name, part, mInjuries[part], m.id)));
    const mStats = computeCharacterCombatStats(m);
    rows.push(hpRestRowHtml(m.name, m.id, m.currentHp, mStats.maxHp));
  });
  if (!rows.length) return `<p class="rpg-hint">지금은 다친 사람도, 체력이 깎인 사람도 없네요.</p>`;
  return rows.join('');
}

// ── 직업 교관 NPC - 스킬 훈련 UI. 미습득 스킬은 전투에서 안 나가니 먼저 배워야 함 ─────
function trainerHtml() {
  if (!character.classMain) return `<p class="rpg-hint">직업을 먼저 선택해야 스킬을 배울 수 있어요.</p>`;
  const cls = CLASSES[character.classMain];
  const essenceItemId = CLASS_ESSENCE_ITEM[character.classMain];
  const essenceItem = ITEMS[essenceItemId];
  const owned = (character.inventory || []).find((e) => e.itemId === essenceItemId);
  const ownedQty = owned ? owned.qty : 0;
  const skillLevels = character.skillLevels || {};
  return `
    <p class="rpg-hint">보유 ${essenceItem.name}: ${ownedQty}개 (몹을 잡으면 확률적으로 드랍돼요)</p>
    ${cls.skills.map((s) => {
      const tier = skillLevels[s.id] || 0;
      const maxed = tier >= MAX_SKILL_TIER;
      const cost = maxed ? null : TRAINING_TIER_COSTS[tier + 1];
      const label = tier === 0 ? '배우기' : '단계 올리기';
      return `
        <div class="rpg-shop-row">
          <span>${s.name} — ${tier === 0 ? '미습득' : `${tier}/${MAX_SKILL_TIER}단계`}${maxed ? ' (최대)' : ''}</span>
          ${maxed ? '' : `<button class="rpg-train-skill-btn" data-skill="${s.id}">${label} (${essenceItem.name} ${cost.essence}개, ${cost.gold}골드)</button>`}
        </div>
      `;
    }).join('')}
  `;
}

// ── 대장간 NPC - 수리(항상 가능) + 수리스킬 훈련(배우면 셀프 수리 가능, 대장간보다 저렴) ─────
const REPAIR_COST_PER_POINT_BY_RARITY = { normal: 2, uncommon: 3, rare: 5, epic: 8, legendary: 12 };
const RARITY_NAMES = { normal: '일반', uncommon: '고급', rare: '희귀', epic: '영웅', legendary: '전설' };
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
        <span>${EQUIP_SLOT_LABELS[e.slot]}: ${item.name} — 내구도 ${e.durability}/100</span>
        <button class="rpg-blacksmith-repair-btn" data-slot="${e.slot}">수리(${cost}골드)</button>
      </div>
    `;
  }).join('') : `<p class="rpg-hint">수리가 필요한 장비가 없어요.</p>`;

  const repairSkill = character.repairSkillLevel || 0;
  const maxedSkill = repairSkill >= MAX_REPAIR_SKILL_LEVEL;
  const nextSkillCost = maxedSkill ? null : REPAIR_SKILL_COSTS[repairSkill + 1];
  const capLabel = repairSkill > 0 ? `${RARITY_NAMES[REPAIR_SKILL_RARITY_CAP[repairSkill]]} 등급까지 셀프 수리 가능` : '아직 셀프 수리 불가';

  return `
    <h5>수리가 필요한 장비</h5>
    ${repairRows}
    <h5>수리스킬 (배우면 수리 망치로 직접 수리 가능, 대장간보다 저렴)</h5>
    <div class="rpg-shop-row">
      <span>수리스킬 ${repairSkill}/${MAX_REPAIR_SKILL_LEVEL}단계 — ${capLabel}</span>
      ${maxedSkill ? '' : `<button class="rpg-train-repair-skill-btn">${repairSkill === 0 ? '배우기' : '단계 올리기'} (${nextSkillCost}골드)</button>`}
    </div>
  `;
}

// ── 선술집 NPC - 용병 고용 UI(파티 구성은 플레이어 자유 - 오늘 로테이션 + 미고용 용병만 필터) ─────
function tavernHireHtml() {
  const mercenaries = character.mercenaries || [];
  const totalCap = MAX_MERCENARIES + MAX_TERRITORY_MERCENARIES;
  if (mercenaries.length >= totalCap) return `<p class="rpg-hint">더 이상 용병을 고용할 수 없습니다 (${mercenaries.length}/${totalCap}).</p>`;
  if (!character.classMain) return `<p class="rpg-hint">직업을 먼저 선택해야 용병을 고용할 수 있어요.</p>`;
  const hiredTemplateIds = new Set(mercenaries.map((m) => m.templateId));
  const todayRoster = new Set(dailyTavernRoster(character.currentTown || 'town1'));
  const options = Object.values(MERCENARY_TEMPLATES)
    .filter((t) => todayRoster.has(t.id) && !hiredTemplateIds.has(t.id));
  if (!options.length) return `<p class="rpg-hint">오늘은 고용 가능한 용병이 없네요. 내일 다시 들러보세요.</p>`;
  return options.map((t) => {
    const cls = CLASSES[t.classMain];
    return `
      <div class="rpg-shop-row">
        <span>${t.name} (Lv.${t.baseLevel} ${cls ? cls.name : t.classMain}) — 고용비 ${t.hireCost}골드, 보수 ${t.wagePerAdventure}골드/모험</span>
        <button class="rpg-hire-btn" data-template="${t.id}">고용</button>
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
  const townName = (TOWNS[character.currentTown] || {}).name || character.currentTown;
  const townNpcs = Object.values(NPCS).filter((n) => n.townId === character.currentTown);
  const otherTowns = Object.values(TOWNS).filter((t) => t.id !== character.currentTown);
  content.innerHTML = `
    <p class="rpg-hint">현재 위치: ${townName}</p>
    <h4>다른 마을로 이동</h4>
    <p class="rpg-hint">
      ${otherTowns.map((t) => {
        const unlocked = isTownUnlocked(t.id);
        return `<button class="rpg-travel-town-btn" data-town="${t.id}" ${unlocked ? '' : 'disabled'}>${t.name}${unlocked ? '' : ' 🔒'}</button>`;
      }).join('')}
      (턴 1개 소모)
    </p>
    <h4>마을 사람들</h4>
    <div class="rpg-npc-list">
      ${townNpcs.map((npc) => `
        <div class="rpg-npc-card">
          <div class="rpg-class-name">${npc.name}</div>
          ${npc.dialogue.map((line) => `<p class="rpg-hint">"${line}"</p>`).join('')}
          ${(npc.questIds || []).map((qid) => questRowHtml(qid)).join('')}
          ${npc.role === 'doctor' ? doctorCureHtml() : ''}
          ${npc.role === 'tavern' ? tavernHireHtml() : ''}
          ${npc.role === 'trainer' ? trainerHtml() : ''}
          ${npc.role === 'blacksmith' ? blacksmithHtml() : ''}
        </div>
      `).join('') || '<p class="rpg-hint">이 마을엔 아직 만날 사람이 없어요.</p>'}
    </div>
    <h4>마을 게시판</h4>
    <div class="rpg-board-list"><div class="rpg-loading">불러오는 중...</div></div>
    <div class="rpg-board-form">
      <input type="text" class="rpg-board-input" maxlength="150" placeholder="게시판에 글 남기기 (150자 이내)" style="width:70%">
      <button class="rpg-board-post-btn">등록</button>
    </div>
  `;
  content.querySelectorAll('.rpg-travel-town-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const destTown = TOWNS[btn.dataset.town];
    if (!confirm(`${destTown.name}(으)로 이동하시겠습니까? 턴포인트 1개를 소모합니다.`)) return;
    try {
      const r = await apiPost('travel-town', { townId: btn.dataset.town });
      character.currentTown = r.currentTown;
      character.turnPoints = r.turnPoints;
      character.gold = r.gold;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(`${destTown.name}(으)로 이동했습니다`);
      showTerritoryNotice(container, r.territoryNotice);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-quest-claim-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('claim-quest', { questId: btn.dataset.quest });
      character.gold = r.gold;
      character.level = r.level;
      await loadCharacter();
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast('퀘스트를 완료했습니다!' + (r.overflowed ? ' (인벤토리가 가득 차 보상 아이템을 놓쳤어요)' : ''));
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
      showToast(`${r.hired.name}을(를) 고용했습니다!`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-train-skill-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('train-skill', { skillId: btn.dataset.skill });
      character.gold = r.gold;
      character.skillLevels = r.skillLevels;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(`${r.tier}단계로 훈련했습니다!`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-blacksmith-repair-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('repair-equipment', { equipSlot: btn.dataset.slot });
      character.gold = r.gold;
      character.equipment[`${btn.dataset.slot}Durability`] = r.durability;
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderTownTab(content, container);
      showToast(`수리 완료! (${r.cost}골드 소모)`);
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
      showToast(`수리스킬 ${r.level}단계로 훈련했습니다!`);
    } catch (e) { showToast(friendlyError(e)); }
  });
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
      showToast(`${BODY_PART_NAMES[r.part]} 부상을 치료했습니다 (${r.cost}골드)`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
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
      renderTownTab(content, container);
      showToast(r.part === 'hp' ? `체력을 회복했습니다 (턴 ${r.cost}개 소모)` : `${BODY_PART_NAMES[r.part]} 부상이 나았습니다 (턴 ${r.cost}개 소모)`);
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
      showToast('게시글을 등록했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  });
  loadBoard(content);
}

// ── 상점 탭(구매 + 뽑기) ──────────────────────────────
function renderShopTab(content, container) {
  const townTier = (TOWNS[character.currentTown] || {}).tier || 1;
  const shopItems = Object.values(ITEMS).filter((i) => i.shopPrice && i.type !== 'randombox' && (i.minTownTier || 1) <= townTier);
  content.innerHTML = `
    <h4>상점</h4>
    <div class="rpg-shop-list">
      ${shopItems.map((i) => `
        <div class="rpg-shop-row">
          <span>${i.name}${itemStatsLabel(i)} (${i.type === 'ammo' ? `${i.shopPrice * 10}골드/10개` : `${i.shopPrice}골드`})</span>
          <button class="rpg-buy-btn" data-item="${i.id}">구매</button>
        </div>
      `).join('')}
    </div>
    <h4>뽑기 (랜덤박스)</h4>
    <div class="rpg-shop-row">
      <span>${ITEMS.random_box.name} — 속성무기·방어구·장신구 중 하나 획득 (${ITEMS.random_box.shopPrice}골드)</span>
      <button class="rpg-randombox-btn">뽑기</button>
    </div>
  `;
  content.querySelectorAll('.rpg-buy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = ITEMS[btn.dataset.item];
      const qty = item.type === 'ammo' ? 10 : 1;
      const totalPrice = item.shopPrice * qty;
      const canAfford = character.gold >= totalPrice;
      showConfirmOverlay(container, {
        title: `${item.name}${qty > 1 ? ` x${qty}` : ''} 구매`,
        bodyHtml: `
          <div class="rpg-stat-delta-table">
            <div class="rpg-stat-delta-row"><span>가격</span><span>${totalPrice}골드</span><span></span></div>
            <div class="rpg-stat-delta-row"><span>보유 골드</span><span>${character.gold} → ${character.gold - totalPrice}</span><span class="${canAfford ? 'rpg-stat-up' : 'rpg-stat-down'}">${canAfford ? '' : '부족'}</span></div>
          </div>
          ${!canAfford ? '<p class="rpg-hint">⚠️ 골드가 부족합니다.</p>' : ''}
        `,
        confirmLabel: '구매',
        confirmDisabled: !canAfford,
        onConfirm: async () => {
          try {
            const r = await apiPost('shop-buy', { itemId: btn.dataset.item, qty });
            character.gold = r.gold;
            container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
            showToast(qty > 1 ? `${item.name} ${qty}개 구매 완료` : '구매 완료');
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
      showToast(`${item.name}${itemStatsLabel(item)} 획득!` + (r.overflowed ? ' (인벤토리가 가득 차 놓쳤어요)' : ''));
    } catch (e) { showToast(friendlyError(e)); }
  });
}

// ── 마켓 탭(유저간 거래) ──────────────────────────────
function renderMarketTab(content, container) {
  content.innerHTML = `
    <h4>유저 마켓</h4>
    <div class="rpg-market-list"><div class="rpg-loading">불러오는 중...</div></div>
    <div class="rpg-market-list-form">
      <p class="rpg-hint">인벤토리 탭에서 아이템의 "마켓등록" 버튼으로 판매를 등록하세요.</p>
    </div>
  `;
  loadMarketListings(content, container);
}

// ── 창고 탭(이송상자/저장상자) ────────────────────────
function renderStorageTab(content, container) {
  content.innerHTML = `
    <h4>이송상자 (계정 공유 - 내 다른 캐릭터와 골드/아이템 주고받기)</h4>
    <div class="rpg-storage-box" data-kind="account"><div class="rpg-loading">불러오는 중...</div></div>
    <h4>저장상자 (이 캐릭터 전용)</h4>
    <div class="rpg-storage-box" data-kind="character"><div class="rpg-loading">불러오는 중...</div></div>
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
        <p>보관된 골드: ${data.gold}</p>
        <div class="rpg-shop-row">
          <span>골드 입출금</span>
          <span>
            <input type="number" class="rpg-storage-gold-amount" min="1" style="width:70px">
            <button class="rpg-storage-gold-deposit">입금</button>
            <button class="rpg-storage-gold-withdraw">출금</button>
          </span>
        </div>
      ` : ''}
      <p class="rpg-hint">보관 중인 아이템</p>
      ${items.length ? items.map((e) => `
        <div class="rpg-shop-row">
          <span>${(ITEMS[e.itemId] || {}).name || e.itemId} x${e.qty}</span>
          <button class="rpg-storage-withdraw-item" data-item="${e.itemId}">출금</button>
        </div>
      `).join('') : '<p class="rpg-hint">보관된 아이템이 없습니다.</p>'}
      <p class="rpg-hint">인벤토리에서 입금</p>
      ${inventory.length ? inventory.map((e) => `
        <div class="rpg-shop-row">
          <span>${(ITEMS[e.itemId] || {}).name || e.itemId} x${e.qty}</span>
          <button class="rpg-storage-deposit-item" data-item="${e.itemId}">입금</button>
        </div>
      `).join('') : '<p class="rpg-hint">인벤토리가 비어있습니다.</p>'}
    `;

    if (kind === 'account') {
      boxEl.querySelector('.rpg-storage-gold-deposit').addEventListener('click', async () => {
        const amount = Number(boxEl.querySelector('.rpg-storage-gold-amount').value);
        if (!amount) return;
        try {
          const r = await apiPost('account-storage', { townId, direction: 'deposit', gold: amount });
          character.gold = r.gold;
          container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
          showToast('입금했습니다');
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
          showToast('출금했습니다');
          loadStorageBox(content, container, kind);
        } catch (e) { showToast(friendlyError(e)); }
      });
    }

    boxEl.querySelectorAll('.rpg-storage-withdraw-item').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await apiPost(endpoint, { townId, direction: 'withdraw', itemId: btn.dataset.item, qty: 1 });
        await loadCharacter();
        showToast('출금했습니다');
        loadStorageBox(content, container, kind);
      } catch (e) { showToast(friendlyError(e)); }
    }));
    boxEl.querySelectorAll('.rpg-storage-deposit-item').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await apiPost(endpoint, { townId, direction: 'deposit', itemId: btn.dataset.item, qty: 1 });
        await loadCharacter();
        showToast('입금했습니다');
        loadStorageBox(content, container, kind);
      } catch (e) { showToast(friendlyError(e)); }
    }));
  } catch (e) {
    boxEl.innerHTML = `<p class="rpg-hint">보관함을 불러오지 못했습니다.</p>`;
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
      : '<p class="rpg-hint">아직 등록된 글이 없습니다.</p>';
  } catch (e) {
    listEl.innerHTML = '<p class="rpg-hint">게시판을 불러오지 못했습니다.</p>';
  }
}

async function loadMarketListings(content, container) {
  const listEl = content.querySelector('.rpg-market-list');
  try {
    const data = await apiGet('market-browse');
    const listings = data.listings || [];
    if (!listings.length) {
      listEl.innerHTML = `<p class="rpg-hint">등록된 거래가 없습니다.</p>`;
      return;
    }
    listEl.innerHTML = listings.map((l) => `
      <div class="rpg-shop-row">
        <span>${(ITEMS[l.itemId] || {}).name || l.itemId} x${l.qty} — ${l.pricePerUnit}골드/개 (판매자: ${l.sellerUsername})</span>
        <button class="rpg-buy-btn" data-listing="${l.listingId}" data-qty="${l.qty}">구매</button>
      </div>
    `).join('');
    listEl.querySelectorAll('.rpg-buy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const r = await apiPost('market-buy', { listingId: btn.dataset.listing, qty: 1 });
          character.gold = r.buyerGold;
          container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
          showToast('구매 완료');
          loadMarketListings(content, container);
        } catch (e) {
          showToast(friendlyError(e));
        }
      });
    });
  } catch (e) {
    listEl.innerHTML = `<p class="rpg-hint">마켓을 불러오지 못했습니다.</p>`;
  }
}

// ── 인벤토리 탭 ─────────────────────────────────────
function renderInventoryTab(content, container) {
  const inventory = character.inventory || [];
  const capacity = capacityForCharacter(character);
  const weight = inventoryWeight(inventory);
  const weightLimit = weightLimitForCharacter(character);
  content.innerHTML = `
    <p class="rpg-hint">인벤토리 (${inventory.length}/${capacity}칸, 무게 ${weight.toFixed(1)}/${weightLimit})</p>
    <div class="rpg-inventory-list">
      ${inventory.length ? inventory.map((entry) => {
        const item = ITEMS[entry.itemId] || { name: entry.itemId };
        const actions = [];
        const equippable = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
        if (item.type === 'consumable' || item.type === 'bag') actions.push(`<button class="rpg-inv-use" data-item="${entry.itemId}">사용</button>`);
        if (equippable.includes(item.type)) actions.push(`<button class="rpg-inv-equip" data-item="${entry.itemId}">장착</button>`);
        if (!isItemIdentified(item)) {
          actions.push(`<button class="rpg-inv-identify" data-item="${entry.itemId}">감정하기</button>`);
          actions.push(`<button class="rpg-inv-identify" data-item="${entry.itemId}" data-scroll="1">스크롤로 감정</button>`);
        }
        if (entry.itemId === 'torn_cloth' && entry.qty >= 3) actions.push(`<button class="rpg-inv-craft-bandage">붕대로 제작</button>`);
        actions.push(`<button class="rpg-inv-sell" data-item="${entry.itemId}">NPC판매</button>`);
        actions.push(`<button class="rpg-inv-list" data-item="${entry.itemId}">마켓등록</button>`);
        return `
          <div class="rpg-inv-row">
            <span>${item.name}${itemStatsLabel(item)} x${entry.qty}</span>
            <span class="rpg-inv-actions">${actions.join('')}</span>
          </div>
        `;
      }).join('') : '<p class="rpg-hint">인벤토리가 비어있습니다.</p>'}
    </div>
  `;
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
        rows.push(`<p class="rpg-hint">⚠️ ${item.name} 등급(${tier}등급)은 이미 한도(${tierCap}칸)를 다 채웠습니다.${nextTierItem ? ` 더 늘리려면 "${nextTierItem.name}"(${tier + 1}등급)이 필요합니다.` : ' 이게 최고 등급입니다.'}</p>`);
      } else {
        const before = capacityForCharacter(character);
        const after = before + item.slotBonus;
        rows.push(`<div class="rpg-stat-delta-row"><span>인벤토리 칸</span><span>${before} → ${after}</span><span class="rpg-stat-up">+${item.slotBonus}</span></div>`);
        rows.push(`<p class="rpg-hint">${tier}등급 진행도: ${tierUsed}/${tierCap}칸</p>`);
      }
    } else if (item.cureInjury === 'mild') {
      const injuries = character.injuries || {};
      const mildPart = ['arm', 'leg'].find((p) => (injuries[p] || {}).severity === 1);
      if (!mildPart) {
        confirmDisabled = true;
        rows.push('<p class="rpg-hint">⚠️ 치료할 경상이 없습니다.</p>');
      } else {
        rows.push(`<p>${BODY_PART_NAMES[mildPart]} 경상이 치료됩니다.</p>`);
      }
    } else {
      const stats = computeCharacterCombatStats(character);
      if (item.healPct) {
        const beforeHp = character.currentHp;
        const afterHp = Math.min(stats.maxHp, beforeHp + Math.round(stats.maxHp * item.healPct));
        rows.push(`<div class="rpg-stat-delta-row"><span>체력</span><span>${beforeHp}/${stats.maxHp} → ${afterHp}/${stats.maxHp}</span><span class="rpg-stat-up">+${afterHp - beforeHp}</span></div>`);
      }
      if (item.restoreMpPct) {
        const beforeMp = character.currentMp;
        const afterMp = Math.min(stats.maxMp, beforeMp + Math.round(stats.maxMp * item.restoreMpPct));
        rows.push(`<div class="rpg-stat-delta-row"><span>마나</span><span>${beforeMp}/${stats.maxMp} → ${afterMp}/${stats.maxMp}</span><span class="rpg-stat-up">+${afterMp - beforeMp}</span></div>`);
      }
      if (item.restoreStaminaPct) {
        const beforeSt = character.currentStamina;
        const afterSt = Math.min(stats.maxStamina, beforeSt + Math.round(stats.maxStamina * item.restoreStaminaPct));
        rows.push(`<div class="rpg-stat-delta-row"><span>스테미나</span><span>${beforeSt}/${stats.maxStamina} → ${afterSt}/${stats.maxStamina}</span><span class="rpg-stat-up">+${afterSt - beforeSt}</span></div>`);
      }
      if (!rows.length) rows.push('<p class="rpg-hint">이 아이템은 즉시 사용 효과 미리보기가 없습니다.</p>');
    }

    showConfirmOverlay(container, {
      title: `${item.name} 사용`,
      bodyHtml: `<div class="rpg-stat-delta-table">${rows.join('')}</div>`,
      confirmLabel: '사용',
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
            showToast(`가방을 사용해 인벤토리가 +${r.slotBonus}칸 늘었습니다! (현재 ${capacityForCharacter(character)}칸)`);
          } else if (r.effect === 'bandage') {
            showToast(`${BODY_PART_NAMES[r.healedPart]} 부상을 붕대로 치료했습니다`);
          } else {
            showToast('사용했습니다');
          }
        } catch (e) { showToast(friendlyError(e)); }
      },
    });
  }));
  const EQUIP_SLOT_BY_TYPE = { weapon: 'weapon', shield: 'shield', armor_top: 'armor_top', armor_bottom: 'armor_bottom', ring: 'ring', necklace: 'necklace' };
  content.querySelectorAll('.rpg-inv-equip').forEach((btn) => btn.addEventListener('click', () => {
    const itemId = btn.dataset.item;
    const item = ITEMS[itemId];
    const stats = effectiveStats(character);
    const reqRows = [];
    let reqOk = true;
    if (item.strRequirement) {
      const ok = stats.str >= item.strRequirement;
      if (!ok) reqOk = false;
      reqRows.push(`<div class="rpg-stat-delta-row"><span>요구 힘</span><span>${item.strRequirement} (현재 ${stats.str})</span><span>${ok ? '✅' : '❌'}</span></div>`);
    }
    if (item.wisRequirement) {
      const ok = stats.wis >= item.wisRequirement;
      if (!ok) reqOk = false;
      reqRows.push(`<div class="rpg-stat-delta-row"><span>요구 지혜</span><span>${item.wisRequirement} (현재 ${stats.wis})</span><span>${ok ? '✅' : '❌'}</span></div>`);
    }
    const slot = EQUIP_SLOT_BY_TYPE[item.type];
    const previousItemId = character.equipment[slot];
    const previousItem = previousItemId ? ITEMS[previousItemId] : null;
    const before = computeCharacterCombatStats(character);
    const after = computeCharacterCombatStats({
      ...character,
      equipment: { ...character.equipment, [slot]: itemId, [`${slot}Durability`]: 100 },
    });
    const classDef = CLASSES[character.classMain];
    const penaltyWarning = equipPenaltyWarning(item, classDef);
    const addedParts = itemBonusParts(item);
    const removedParts = previousItem ? itemBonusParts(previousItem) : [];
    showConfirmOverlay(container, {
      title: `${item.name} 장착`,
      bodyHtml: `
        ${reqRows.length ? `<div class="rpg-stat-delta-table">${reqRows.join('')}</div>` : ''}
        ${addedParts.length ? `<p class="rpg-stat-up">추가: ${addedParts.join(', ')}</p>` : ''}
        ${removedParts.length ? `<p class="rpg-stat-down">해제(${previousItem.name}): ${removedParts.join(', ')}</p>` : ''}
        ${penaltyWarning ? `<p class="rpg-hint">${penaltyWarning}</p>` : ''}
        ${statsDeltaRowsHtml(before, after)}
        ${!reqOk ? '<p class="rpg-hint">⚠️ 요구치를 채우지 못해 장착할 수 없습니다.</p>' : ''}
      `,
      confirmLabel: '장착',
      confirmDisabled: !reqOk,
      onConfirm: async () => {
        try {
          await apiPost('equip', { itemId });
          await loadCharacter();
          const finalAfter = computeCharacterCombatStats(character);
          renderInventoryTab(content, container);
          showToast(`장착 완료 — ${statsDeltaMessage(before, finalAfter)}`);
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
      showToast(`${r.proceeds}골드에 판매했습니다`);
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-list').forEach((btn) => btn.addEventListener('click', async () => {
    const price = prompt('개당 판매 가격(골드)을 입력하세요');
    if (!price) return;
    try {
      await apiPost('market-list', { itemId: btn.dataset.item, qty: 1, pricePerUnit: Number(price) });
      await loadCharacter();
      renderInventoryTab(content, container);
      showToast('마켓에 등록했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-craft-bandage').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('craft-bandage', { qty: 1 });
      await loadCharacter();
      renderInventoryTab(content, container);
      showToast(`해진 천 ${r.clothUsed}개로 붕대 ${r.crafted}개를 만들었습니다`);
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
        showToast('감정 성공! 아이템 정보가 확인됐습니다');
      } else {
        showToast('감정에 실패했습니다. 지혜가 부족하거나 스크롤이 필요해요');
      }
    } catch (e) { showToast(friendlyError(e)); }
  }));
}

// 진형을 '자동'으로 두면 장착 무기로 결정됨(활/지팡이=후열, 그 외=전열) - 표시용
function equipmentSectionEffectiveRow(characterLike = character) {
  const weaponId = characterLike.equipment && characterLike.equipment.weapon;
  const weapon = weaponId ? ITEMS[weaponId] : null;
  return weapon && ['bow', 'staff'].includes(weapon.weaponType) ? '후열' : '전열';
}

const FORMATION_ROW_LABELS = { front: '전열', mid: '중열', back: '후열' };

// 진형 선택 UI(전열/중열/후열 중 허용된 열만 버튼 표시 + 자동) - 활/마법은 1~3열 전부,
// 창을 든 전사는 전열/중열, 그 외 근접은 전열 고정이라 버튼 없이 안내문만 표시
// - mercId가 있으면 그 용병 대상, 없으면 본인 대상
function formationSectionHtml(characterLike, mercId) {
  const currentLabel = characterLike.formationRow
    ? FORMATION_ROW_LABELS[characterLike.formationRow]
    : `자동(${equipmentSectionEffectiveRow(characterLike)})`;
  const mercAttr = mercId ? ` data-merc="${mercId}"` : '';
  const allowed = allowedFormationRows(characterLike);
  if (allowed.length === 1) {
    return `<p>진형: ${FORMATION_ROW_LABELS[allowed[0]]} 고정(근접 직업)</p>`;
  }
  return `
    <p>진형:
      ${allowed.map((row) => `<button class="rpg-formation-btn" data-formation="${row}"${mercAttr}>${FORMATION_ROW_LABELS[row]}</button>`).join('')}
      <button class="rpg-formation-btn" data-formation=""${mercAttr}>자동</button>
      (현재: ${currentLabel})
    </p>
  `;
}

// ── 파티(고용한 용병) 섹션 - 캐릭터 탭에서 사용 ─────────
// 전투부대(active, 최대 MAX_MERCENARIES명)는 모험에 동행하고, 영지(territory)는 남아서 일을 함
// ── 영지 현황판 - 시설(개간지/훈련소/방벽/농장) 레벨과 다음 레벨까지 진행률을 한눈에 보여줌 ──
const FACILITY_ICONS = { clearing: '🌾', training: '⚔️', ramparts: '🛡️', farm: '🌱', hospital: '🏥', morale: '📯', sanctum: '🔮' };

// api/_rpgTurns.js와 반드시 같은 공식 유지 - 서버 전용 파일이라 브라우저가 직접 못 불러와서 복제해서 씀
function turnCapForLevelClient(level) {
  return 10 + Math.floor((level || 1) / 5);
}

// "영지 근무" 버튼 밑에 보여줄 "다음 레벨까지 턴 몇 개 남았는지" - work-territory.js의 기여 공식과 동일하게 계산
function turnsNeededForNextFacilityLevel(jobId) {
  const progress = facilityProgress((character.facilityDays || {})[jobId] || 0);
  const remainingDays = progress.daysForNextLevel - progress.daysIntoLevel;
  const contributionPerTurn = (character.level / BASELINE_MERC_LEVEL) * PLAYER_TERRITORY_BONUS_MULT / turnCapForLevelClient(character.level);
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
        <div class="rpg-work-territory-name">${job.name} <span class="rpg-hint">Lv.${progress.level}</span></div>
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
          <span>${FACILITY_ICONS[jobId] || '🏛️'} ${job.name} Lv.${progress.level}</span>
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

function mercenaryCardHtml(m) {
  const cls = CLASSES[m.classMain];
  const injured = ['arm', 'leg'].filter((p) => (m.injuries && m.injuries[p] && m.injuries[p].severity) > 0);
  const otherAssignment = m.assignment === 'active' ? 'territory' : 'active';
  const otherLabel = m.assignment === 'active' ? '영지로 보내기' : '전투부대로 편입';
  const territoryMercs = (character.mercenaries || []).filter((mm) => mm.assignment === 'territory' && !mm.hospitalized);
  return `
    <div class="rpg-npc-card">
      <div class="rpg-class-name">${m.name} (Lv.${m.level} ${cls ? cls.name : m.classMain})${m.hospitalized ? ' — 입원 중 🏥' : ''} <button class="rpg-rename-merc-btn" data-merc="${m.id}">✏️</button></div>
      <p class="rpg-hint">HP ${m.currentHp} · 보수 ${m.wagePerAdventure}골드/모험 ${injured.length ? `· 부상: ${injured.map((p) => BODY_PART_NAMES[p]).join(', ')}` : ''} ${m.assignment === 'territory' ? `· ${(TERRITORY_JOBS[m.job] || {}).name || '휴식'} 중` : ''}</p>
      ${injured.length && !m.hospitalized ? `<p><button class="rpg-admit-merc-btn" data-merc="${m.id}">병원에 입원시키기 (10골드, 서서히 회복)</button></p>` : ''}
      ${m.hospitalized ? `<p class="rpg-hint">입원 중에는 모험에 동행하지 않고 보수도 나가지 않아요. 완쾌하면 자동으로 퇴원해요.</p>` : ''}
      <p>
        <button class="rpg-assignment-btn" data-merc="${m.id}" data-assignment="${otherAssignment}">${otherLabel}</button>
        <button class="rpg-dismiss-merc-btn" data-merc="${m.id}">해고</button>
      </p>
      ${m.assignment === 'active' ? `
        ${formationSectionHtml(m, m.id)}
      ` : `
        <p>일자리:
          ${Object.values(TERRITORY_JOBS).map((job) => {
            const countInJob = territoryMercs.filter((mm) => mm.job === job.id && mm.id !== m.id).length;
            const full = countInJob >= MAX_MERCS_PER_FACILITY && m.job !== job.id;
            return `<button class="rpg-merc-job-btn" data-merc="${m.id}" data-job="${job.id}" ${m.job === job.id ? 'disabled' : ''} ${full ? 'disabled' : ''}>${FACILITY_ICONS[job.id] || ''} ${job.name}${m.job === job.id ? ' ✓' : full ? ' (가득참)' : ''}</button>`;
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
    return `<p class="rpg-hint">🧬 종자: ${subCls ? subCls.name : host.classSub} 직업 스킬(50% 위력)+스탯 일부(10%) 흡수함</p>`;
  }
  const candidates = (character.mercenaries || []).filter((mm) => mm.id !== host.id && mm.classMain !== host.classMain);
  if (!candidates.length) return '';
  return `
    <p class="rpg-hint">🧬 종자로 흡수(1회만, 되돌릴 수 없음):
      ${candidates.map((c) => `<button class="rpg-squire-btn" data-host="${host.id}" data-squire="${c.id}">${c.name}(${(CLASSES[c.classMain] || {}).name || c.classMain})</button>`).join('')}
    </p>
  `;
}
function partySectionHtml() {
  const mercenaries = character.mercenaries || [];
  const active = mercenaries.filter((m) => m.assignment === 'active');
  const territory = mercenaries.filter((m) => m.assignment !== 'active');
  if (!mercenaries.length) {
    return `<div class="rpg-party">${territoryEconomySummaryHtml()}${facilityDashboardHtml()}<h4>파티 / 영지</h4><p class="rpg-hint">아직 고용한 용병이 없어요. 마을 선술집에서 용병을 고용해보세요.</p></div>`;
  }
  return `
    <div class="rpg-party">
      ${territoryEconomySummaryHtml()}
      ${facilityDashboardHtml()}
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

// ── 영지 탭 - 고용한 용병 관리(전투부대/영지 배치, 진형, 해고, 입원) ──
function renderTerritoryTab(content, container) {
  content.innerHTML = partySectionHtml();
  const rerender = () => renderTerritoryTab(content, container);
  wireFormationButtons(content, rerender);
  content.querySelectorAll('.rpg-dismiss-merc-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await apiPost('dismiss-mercenary', { mercId: btn.dataset.merc });
      character.mercenaries = (character.mercenaries || []).filter((m) => m.id !== btn.dataset.merc);
      rerender();
      showToast('용병을 해고했습니다');
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
  content.querySelectorAll('.rpg-merc-job-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('set-mercenary-assignment', { mercId: btn.dataset.merc, assignment: 'territory', job: btn.dataset.job });
      const merc = (character.mercenaries || []).find((m) => m.id === r.mercId);
      if (merc) merc.job = r.job;
      rerender();
      showToast(`${TERRITORY_JOBS[r.job].name}에 배치했습니다`);
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
      showToast(`${(CLASSES[r.classSub] || {}).name || r.classSub} 종자를 흡수했습니다!`);
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
    const severityLabel = injury.severity === 2 ? '중상(의사에게 치료 필요)' : '경상(붕대로 치료 가능)';
    return `${BODY_PART_NAMES[p]} ${severityLabel} — 남은 ${injury.turnsLeft}턴`;
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
      <p>직업: ${cls ? cls.name : '-'}${subCls ? ` (부직업: ${subCls.name})` : ''}</p>
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

// ── 장비창 — 착용 중인 장비를 슬롯별로 한눈에 보여줌 ──
const EQUIP_SLOT_LABELS = { weapon: '무기', shield: '방패', armor_top: '상의', armor_bottom: '하의', ring: '반지', necklace: '목걸이' };
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
            <span>${EQUIP_SLOT_LABELS[slot]}: ${item ? `${item.name}${enhanceLabel}${itemStatsLabel(item)}${durabilityLabel}` : '없음'}</span>
            <span>
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
            <div class="rpg-class-name">${c.name}</div>
            <div class="rpg-class-skills">${c.skills.map((s) => s.name).join(', ')}</div>
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
