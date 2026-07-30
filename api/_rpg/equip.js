import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { addItem, removeItem, inventoryQty, capacityForCharacter } from '../_rpgInventory.js';
import { ITEMS } from '../../data/rpg/items.js';
import { CLASSES } from '../../data/rpg/classes.js';
import { effectiveStats, TWO_HANDED_WEAPON_TYPES } from '../../rpg-combat.js';

const EQUIPPABLE_TYPES = ['weapon', 'shield', 'armor_top', 'armor_bottom', 'ring', 'necklace'];
// 용병은 반지/목걸이 슬롯이 없음(createMercenaryInstance 참고) - 무기/방패/상하의만 장착 가능
const MERC_EQUIPPABLE_TYPES = ['weapon', 'shield', 'armor_top', 'armor_bottom'];
const ARMOR_SLOTS = ['armor_top', 'armor_bottom'];
const DURABILITY_SLOTS = ['weapon', 'shield', 'armor_top', 'armor_bottom'];
// 보조무기 슬롯(내구도/강화 추적 없음) - 위치에 따라 상황에 맞는 무기로 자동 전환하는 데 씀(rpg-combat.js의
// selectAttackWeapon 참고). weaponSlot 파라미터로 주무기/보조무기 중 어디에 낄지 고름(무기 타입 아이템만 해당)
const WEAPON_SLOTS = ['weapon', 'weapon2', 'weapon3'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, itemId, mercId, weaponSlot } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

  const item = ITEMS[itemId];
  const allowedTypes = mercId ? MERC_EQUIPPABLE_TYPES : EQUIPPABLE_TYPES;
  if (!item || !allowedTypes.includes(item.type)) {
    return res.status(400).json({ error: 'not_equippable' });
  }
  if (weaponSlot && (item.type !== 'weapon' || !WEAPON_SLOTS.includes(weaponSlot))) {
    return res.status(400).json({ error: 'invalid_weapon_slot' });
  }
  const equipSlot = item.type === 'weapon' ? (weaponSlot || 'weapon') : item.type; // 'weapon'|'weapon2'|'weapon3'|'shield'|'armor_top'|'armor_bottom'|'ring'|'necklace'

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      const mercenaries = [...(character.mercenaries || [])];
      const mercIdx = mercId ? mercenaries.findIndex((m) => m.id === mercId) : -1;
      if (mercId && mercIdx === -1) { outcome = { error: 'mercenary_not_found' }; return null; }
      // 장착 대상(target)만 캐릭터 본인 또는 용병으로 갈리고, 인벤토리는 항상 계정(character) 공용
      const target = mercId ? mercenaries[mercIdx] : character;

      const inventory = [...(character.inventory || [])];
      if (inventoryQty(inventory, itemId) < 1) { outcome = { error: 'item_not_owned' }; return null; }

      const cls = CLASSES[target.classMain] || CLASSES.warrior;

      // 무기는 직업에 안 맞아도 장착은 허용(전투 중 명중/위력 패널티는 rpg-combat.js가 처리) -
      // 상/하의는 직업 제한(예: 궁수는 경갑만)을 못 채우면 아예 장착 불가(하드 블록)
      if (ARMOR_SLOTS.includes(equipSlot) && item.armorClass) {
        if (cls.armorRestriction && !cls.armorRestriction.includes(item.armorClass)) {
          outcome = { error: 'armor_class_restricted' };
          return null;
        }
      }
      // 방패는 캐스터도 장착은 허용(하드 블록 없음) - 다만 전투 중 방어력 기여가 크게 깎임(rpg-combat.js의
      // OFF_CLASS_SHIELD_DEF_MULT 참고), 무기의 직업 불일치 패널티와 같은 원칙
      if ((ARMOR_SLOTS.includes(equipSlot) || WEAPON_SLOTS.includes(equipSlot) || equipSlot === 'shield') && (item.strRequirement || item.wisRequirement)) {
        const stats = effectiveStats(target);
        if (item.strRequirement && stats.str < item.strRequirement) {
          outcome = { error: 'not_enough_strength' };
          return null;
        }
        if (item.wisRequirement && stats.wis < item.wisRequirement) {
          outcome = { error: 'not_enough_wisdom' };
          return null;
        }
      }

      const equipment = { ...(target.equipment || {}) };
      const previous = equipment[equipSlot];
      removeItem(inventory, itemId, 1);
      if (previous && !addItem(inventory, previous, 1, capacityForCharacter(character))) {
        outcome = { error: 'inventory_full' };
        return null;
      }

      // 양손무기(스태프 등)는 방패와 같이 못 낌 - 방패를 끼는데 양손무기를 쓰고 있으면 그 무기를 자동으로
      // 벗기고, 반대로 양손무기를 끼는데 방패를 쓰고 있으면 방패를 자동으로 벗김(무기 슬롯 자체는 아래서
      // 새 아이템으로 이미 교체되므로 신경 안 써도 됨 - 여기선 "나머지 한쪽"만 처리)
      let forcedUnequippedItemId = null;
      let forcedUnequippedSlot = null;
      if (equipSlot === 'shield') {
        const currentWeaponItem = equipment.weapon ? ITEMS[equipment.weapon] : null;
        if (currentWeaponItem && TWO_HANDED_WEAPON_TYPES.includes(currentWeaponItem.weaponType)) {
          forcedUnequippedItemId = equipment.weapon;
          forcedUnequippedSlot = 'weapon';
        }
      } else if (equipSlot === 'weapon' && TWO_HANDED_WEAPON_TYPES.includes(item.weaponType) && equipment.shield) {
        forcedUnequippedItemId = equipment.shield;
        forcedUnequippedSlot = 'shield';
      }
      if (forcedUnequippedSlot) {
        if (!addItem(inventory, forcedUnequippedItemId, 1, capacityForCharacter(character))) {
          outcome = { error: 'inventory_full' };
          return null;
        }
        equipment[forcedUnequippedSlot] = null;
        equipment[`${forcedUnequippedSlot}Durability`] = 100;
        equipment[`${forcedUnequippedSlot}EnhanceLevel`] = 0;
      }

      equipment[equipSlot] = itemId;
      // 내구도와 강화 단계 모두 개별 아이템 인스턴스를 추적하지 않는 v1 단순화 설계라 재장착시 초기화됨
      if (DURABILITY_SLOTS.includes(equipSlot)) {
        equipment[`${equipSlot}Durability`] = 100;
        equipment[`${equipSlot}EnhanceLevel`] = 0;
      }

      const now = Date.now();
      outcome = {
        equipSlot, equipped: itemId, previous: previous || null, mercId: mercId || null,
        forcedUnequippedSlot, forcedUnequippedItemId,
      };
      if (mercId) {
        mercenaries[mercIdx] = { ...target, equipment };
        return { ...character, mercenaries, inventory, updatedAt: now };
      }
      return { ...character, equipment, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
