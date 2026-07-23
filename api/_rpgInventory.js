// 인벤토리 배열({itemId, qty}[]) 조작 헬퍼 — adventure/shop/equip 엔드포인트가 공유
export const BASE_INVENTORY_CAPACITY = 20;

// 슬롯 = 인벤토리 배열의 서로 다른 itemId 개수(같은 아이템은 qty로 쌓임, 슬롯 추가 소모 없음)
export function capacityForCharacter(character) {
  return BASE_INVENTORY_CAPACITY + (character.inventorySlotBonus || 0);
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
