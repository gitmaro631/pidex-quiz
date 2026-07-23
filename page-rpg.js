import { currentAccessToken } from './pi-sdk.js';
import { showToast } from './page-quiz.js';
import { setupPullToRefresh } from './util-ptr.js';
import { ITEMS } from './data/rpg/items.js';
import { ZONES } from './data/rpg/zones.js';
import { CLASSES } from './data/rpg/classes.js';
import { xpToNextLevel, SUB_CLASS_UNLOCK_LEVEL } from './rpg-progression.js';
import { TOWNS } from './data/rpg/towns.js';
import { NPCS } from './data/rpg/npcs.js';
import { QUESTS } from './data/rpg/quests.js';
import { checkQuestCondition } from './rpg-quests.js';
import { LORE_ENTRIES } from './data/rpg/lore.js';

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
  if (!res.ok) throw new Error(data.error || 'request_failed');
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
  if (!res.ok) throw new Error(data.error || 'request_failed');
  return data;
}

const ERROR_MESSAGES = {
  not_enough_turns: '턴포인트가 부족합니다.',
  no_torch: '횃불이 없습니다. 상점에서 구매하세요.',
  invalid_zone: '알 수 없는 지역입니다.',
  not_enough_gold: '골드가 부족합니다.',
  not_purchasable: '구매할 수 없는 아이템입니다.',
  not_enough_items: '아이템 수량이 부족합니다.',
  item_not_owned: '보유하지 않은 아이템입니다.',
  not_usable: '사용할 수 없는 아이템입니다.',
  wrong_weapon_type: '이 직업으로는 장착할 수 없는 무기입니다.',
  not_equippable: '장착할 수 없는 아이템입니다.',
  nothing_equipped: '장착된 아이템이 없습니다.',
  inventory_full: '인벤토리가 가득 찼습니다.',
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
  invalid_direction: '잘못된 요청입니다.',
  invalid_amount: '금액/수량을 확인해주세요.',
  choose_one_resource_type: '골드와 아이템은 한 번에 하나만 처리할 수 있습니다.',
  unknown_item: '알 수 없는 아이템입니다.',
  not_enough_stored_gold: '보관함에 골드가 부족합니다.',
  not_enough_stored_items: '보관함에 아이템이 부족합니다.',
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
        ${slots.map((s) => s.exists ? `
          <button class="rpg-slot-btn" data-slot="${s.slot}">
            <div class="rpg-class-name">슬롯 ${s.slot} — Lv.${s.level} ${s.classMain ? (CLASSES[s.classMain] || {}).name : '(직업 미선택)'}</div>
            <div class="rpg-class-skills">${s.gold}골드</div>
          </button>
        ` : `
          <button class="rpg-slot-btn" data-slot="${s.slot}" data-new="1">
            <div class="rpg-class-name">슬롯 ${s.slot} — 새 캐릭터 생성</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  container.querySelectorAll('.rpg-slot-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const slot = Number(btn.dataset.slot);
    if (btn.dataset.new) {
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
}

function renderClassSelect(container) {
  container.innerHTML = `
    <div class="rpg-class-select">
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
  else if (activeTab === 'inventory') renderInventoryTab(content, container);
  else if (activeTab === 'character') renderCharacterTab(content, container);
}

// ── 모험 탭 ─────────────────────────────────────────
function renderAdventureTab(content, container) {
  content.innerHTML = `
    <div class="rpg-zone-list">
      ${Object.values(ZONES).map((z) => `
        <button class="rpg-zone-btn" data-zone="${z.id}">
          <div class="rpg-zone-name">${z.name}</div>
          <div class="rpg-zone-tier">Tier ${z.tier}${z.requiresTorch ? ' · 횃불 필요' : ''}</div>
        </button>
      `).join('')}
    </div>
    <div class="rpg-combat-log"></div>
  `;
  const log = content.querySelector('.rpg-combat-log');
  content.querySelectorAll('.rpg-zone-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      log.innerHTML = `<div class="rpg-loading">전투 중...</div>`;
      try {
        const result = await apiPost('adventure', { zoneId: btn.dataset.zone });
        await loadCharacter(); // 레벨업으로 maxHp 등이 바뀌었을 수 있어 서버 최신값으로 새로고침

        log.innerHTML = `
          <div class="rpg-log-lines">${result.log.map((l) => `<p>${l}</p>`).join('')}</div>
          <div class="rpg-log-summary">
            ${result.victory ? '승리' : '패배'} · 경험치 +${result.xpGain} · 골드 +${result.goldGain}
            ${result.levelsGained ? ` · <b>레벨업! Lv.${result.level}</b>` : ''}
            ${result.loot.length ? `<br>획득: ${result.loot.map((d) => `${(ITEMS[d.itemId] || {}).name || d.itemId} x${d.qty}`).join(', ')}` : ''}
          </div>
          ${loreUnlockHtml(result.newLore)}
        `;
        container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      } catch (e) {
        log.innerHTML = `<div class="rpg-loading">${friendlyError(e)}</div>`;
      }
    });
  });
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

// ── 마을 탭(상점 + 마켓 + 이송상자/저장상자) ─────────
function renderTownTab(content, container) {
  const shopItems = Object.values(ITEMS).filter((i) => i.shopPrice);
  const townName = (TOWNS[character.currentTown] || {}).name || character.currentTown;
  const townNpcs = Object.values(NPCS).filter((n) => n.townId === character.currentTown);
  content.innerHTML = `
    <p class="rpg-hint">현재 위치: ${townName}</p>
    <h4>마을 사람들</h4>
    <div class="rpg-npc-list">
      ${townNpcs.map((npc) => `
        <div class="rpg-npc-card">
          <div class="rpg-class-name">${npc.name}</div>
          ${npc.dialogue.map((line) => `<p class="rpg-hint">"${line}"</p>`).join('')}
          ${(npc.questIds || []).map((qid) => questRowHtml(qid)).join('')}
        </div>
      `).join('') || '<p class="rpg-hint">이 마을엔 아직 만날 사람이 없어요.</p>'}
    </div>
    <h4>마을 게시판</h4>
    <div class="rpg-board-list"><div class="rpg-loading">불러오는 중...</div></div>
    <div class="rpg-board-form">
      <input type="text" class="rpg-board-input" maxlength="150" placeholder="게시판에 글 남기기 (150자 이내)" style="width:70%">
      <button class="rpg-board-post-btn">등록</button>
    </div>
    <h4>상점</h4>
    <div class="rpg-shop-list">
      ${shopItems.map((i) => `
        <div class="rpg-shop-row">
          <span>${i.name} (${i.shopPrice}골드)</span>
          <button class="rpg-buy-btn" data-item="${i.id}">구매</button>
        </div>
      `).join('')}
    </div>
    <h4>유저 마켓</h4>
    <div class="rpg-market-list"><div class="rpg-loading">불러오는 중...</div></div>
    <div class="rpg-market-list-form">
      <p class="rpg-hint">인벤토리 탭에서 아이템의 "마켓등록" 버튼으로 판매를 등록하세요.</p>
    </div>
    <h4>이송상자 (계정 공유 - 내 다른 캐릭터와 골드/아이템 주고받기)</h4>
    <div class="rpg-storage-box" data-kind="account"><div class="rpg-loading">불러오는 중...</div></div>
    <h4>저장상자 (이 캐릭터 전용)</h4>
    <div class="rpg-storage-box" data-kind="character"><div class="rpg-loading">불러오는 중...</div></div>
  `;
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
  content.querySelectorAll('.rpg-buy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const r = await apiPost('shop-buy', { itemId: btn.dataset.item, qty: 1 });
        character.gold = r.gold;
        container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
        showToast('구매 완료');
      } catch (e) {
        showToast(friendlyError(e));
      }
    });
  });
  loadMarketListings(content, container);
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
  content.innerHTML = `
    <div class="rpg-inventory-list">
      ${inventory.length ? inventory.map((entry) => {
        const item = ITEMS[entry.itemId] || { name: entry.itemId };
        const actions = [];
        if (item.type === 'consumable' || item.type === 'bag') actions.push(`<button class="rpg-inv-use" data-item="${entry.itemId}">사용</button>`);
        if (item.type === 'weapon' || item.type === 'armor') actions.push(`<button class="rpg-inv-equip" data-item="${entry.itemId}">장착</button>`);
        actions.push(`<button class="rpg-inv-sell" data-item="${entry.itemId}">NPC판매</button>`);
        actions.push(`<button class="rpg-inv-list" data-item="${entry.itemId}">마켓등록</button>`);
        return `
          <div class="rpg-inv-row">
            <span>${item.name} x${entry.qty}</span>
            <span class="rpg-inv-actions">${actions.join('')}</span>
          </div>
        `;
      }).join('') : '<p class="rpg-hint">인벤토리가 비어있습니다.</p>'}
    </div>
  `;
  content.querySelectorAll('.rpg-inv-use').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const r = await apiPost('use-item', { itemId: btn.dataset.item });
      if (r.effect === 'potion') { character.currentHp = r.currentHp; character.currentMp = r.currentMp; }
      await loadCharacter();
      container.querySelector('.rpg-statusbar').outerHTML = statusBarHtml();
      renderInventoryTab(content, container);
      showToast('사용했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  }));
  content.querySelectorAll('.rpg-inv-equip').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await apiPost('equip', { itemId: btn.dataset.item });
      await loadCharacter();
      renderInventoryTab(content, container);
      showToast('장착했습니다');
    } catch (e) { showToast(friendlyError(e)); }
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
      <p>전투 스탠스:
        <button class="rpg-stance-btn" data-stance="stable">안정형</button>
        <button class="rpg-stance-btn" data-stance="aggressive">공격형</button>
        (현재: ${character.stance === 'aggressive' ? '공격형' : '안정형'})
      </p>
    </div>
    <div class="rpg-stats">
      <p>남은 스탯포인트: ${character.statPoints}</p>
      ${['str', 'int', 'agi', 'vit'].map((s) => `
        <div class="rpg-stat-row">
          <span>${s.toUpperCase()}: ${character.stats[s]}</span>
          ${character.statPoints > 0 ? `<button class="rpg-stat-btn" data-stat="${s}">+1</button>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="rpg-equipment">
      <p>무기: ${character.equipment.weapon ? (ITEMS[character.equipment.weapon] || {}).name : '없음'} ${character.equipment.weapon ? '<button class="rpg-unequip-btn" data-slot="weapon">해제</button>' : ''}</p>
      <p>방어구: ${character.equipment.armor ? (ITEMS[character.equipment.armor] || {}).name : '없음'} ${character.equipment.armor ? '<button class="rpg-unequip-btn" data-slot="armor">해제</button>' : ''}</p>
    </div>
    ${subclassSectionHtml()}
    ${potionRulesEditorHtml()}
    ${journalHtml()}
  `;
  content.querySelectorAll('.rpg-stance-btn').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await apiPost('set-stance', { stance: btn.dataset.stance });
      character.stance = btn.dataset.stance;
      renderCharacterTab(content, container);
    } catch (e) { showToast(friendlyError(e)); }
  }));
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
      await apiPost('unequip', { equipSlot: btn.dataset.slot });
      await loadCharacter();
      renderCharacterTab(content, container);
      showToast('해제했습니다');
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

  const saveBtn = content.querySelector('.rpg-potion-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    const rows = content.querySelectorAll('.rpg-potion-rule-row');
    const potionRules = [];
    rows.forEach((row) => {
      const checkbox = row.querySelector('.rpg-potion-enable');
      if (!checkbox.checked) return;
      potionRules.push({
        itemId: row.dataset.item,
        hpThresholdPct: Number(row.querySelector('.rpg-potion-threshold').value) || 50,
        maxPerBattle: Number(row.querySelector('.rpg-potion-max').value) || 1,
      });
    });
    try {
      await apiPost('set-potion-rules', { potionRules });
      character.potionRules = potionRules;
      showToast('포션 자동사용 설정을 저장했습니다');
    } catch (e) { showToast(friendlyError(e)); }
  });
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

// ── 포션 자동사용 규칙 편집기 (전투 중 HP 임계값 기반 자동사용) ──
function potionRulesEditorHtml() {
  const hpPotions = Object.values(ITEMS).filter((i) => i.type === 'consumable' && i.healPct);
  const rulesByItem = {};
  (character.potionRules || []).forEach((r) => { rulesByItem[r.itemId] = r; });

  return `
    <div class="rpg-potion-rules">
      <p class="rpg-hint">전투 중 체력이 설정한 비율 이하로 떨어지면 자동으로 물약을 마셔요.</p>
      ${hpPotions.map((item) => {
        const rule = rulesByItem[item.id];
        return `
          <div class="rpg-potion-rule-row" data-item="${item.id}">
            <label>
              <input type="checkbox" class="rpg-potion-enable" ${rule ? 'checked' : ''}>
              ${item.name} 자동사용
            </label>
            <span>HP <input type="number" class="rpg-potion-threshold" min="1" max="100" value="${rule ? rule.hpThresholdPct : 50}" style="width:48px">% 이하 시</span>
            <span>전투당 최대 <input type="number" class="rpg-potion-max" min="1" max="10" value="${rule ? rule.maxPerBattle : 2}" style="width:40px">개</span>
          </div>
        `;
      }).join('')}
      <button class="rpg-potion-save-btn">저장</button>
    </div>
  `;
}
