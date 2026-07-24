// 인벤토리 배열({itemId, qty}[]) 조작 헬퍼 — adventure/shop/equip 엔드포인트가 공유
import { ITEMS } from '../data/rpg/items.js';

export const BASE_INVENTORY_CAPACITY = 20;
export const BASE_WEIGHT_LIMIT = 30;
export const WEIGHT_PER_STR = 4; // 힘 1당 들 수 있는 무게 +4

// 슬롯 = 인벤토리 배열의 서로 다른 itemId 개수(같은 아이템은 qty로 쌓임, 슬롯 추가 소모 없음)
export function capacityForCharacter(character) {
  return BASE_INVENTORY_CAPACITY + (character.inventorySlotBonus || 0);
}

// 무게 제한 = 힘(str) 스탯에 비례 - 슬롯과 별개로 "얼마나 무거운 짐을 들 수 있는가"를 제한
export function weightLimitForCharacter(character) {
  const str = (character.stats && character.stats.str) || 0;
  return BASE_WEIGHT_LIMIT + str * WEIGHT_PER_STR;
}

export function inventoryWeight(inventory) {
  return (inventory || []).reduce((sum, e) => sum + ((ITEMS[e.itemId] && ITEMS[e.itemId].weight) || 0) * e.qty, 0);
}

// 슬롯 여유 + 무게 여유를 모두 확인한 뒤 addItem을 수행하는 래퍼. 신규 획득(상점구매/전리품/뽑기/제작 등)에 사용
export function tryAddItem(character, inventory, itemId, qty, capacity = capacityForCharacter(character)) {
  const item = ITEMS[itemId];
  const addedWeight = ((item && item.weight) || 0) * qty;
  if (inventoryWeight(inventory) + addedWeight > weightLimitForCharacter(character)) {
    return { ok: false, reason: 'overweight' };
  }
  if (!addItem(inventory, itemId, qty, capacity)) return { ok: false, reason: 'inventory_full' };
  return { ok: true };
}

// 새 아이템 종류를 추가할 때 capacity를 넘으면 실패(false) - 이미 있는 아이템 수량 증가는 항상 성공
export function addItem(inventory, itemId, qty, capacity = Infinity) {
  const idx = inventory.findIndex((e) => e.itemId === itemId);
  if (idx !== -1) {
    inventory[idx] = { ...inventory[idx], qty: inventory[idx].qty + qty };
    return true;
  }
  if (inventory.length >= capacity) return false;
  inventory.push({ itemId, qty });
  return true;
}

export function removeItem(inventory, itemId, qty) {
  const idx = inventory.findIndex((e) => e.itemId === itemId);
  if (idx === -1) return false;
  if (inventory[idx].qty < qty) return false;
  const nextQty = inventory[idx].qty - qty;
  if (nextQty <= 0) inventory.splice(idx, 1);
  else inventory[idx] = { ...inventory[idx], qty: nextQty };
  return true;
}

export function inventoryQty(inventory, itemId) {
  const entry = (inventory || []).find((e) => e.itemId === itemId);
  return entry ? entry.qty : 0;
}
