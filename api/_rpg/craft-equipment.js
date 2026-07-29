// 대장간 "제작" - 지역 몹 재료를 소모해 그 지역 테마 장비를 만듦. CRAFT_RECIPES(data/rpg/craft-recipes.js)에
// zoneId별 basic(흔한 재료)/core(그 지역 레어몹 전용 재료, 결과물이 한 등급 위) 두 단계가 정의돼있고,
// 결과 아이템은 CRAFTED_ITEMS(data/rpg/crafted-items.js, ITEMS에 병합됨)에 있음.
// 그 지역이 속한 마을에 있을 때만 제작 가능(shop-buy.js의 마을 등급 제한과 같은 원칙 - 여기선 정확히 같은 마을).
import { verifyPiUser } from '../_verifyPiUser.js';
import { withFirestoreTransaction } from '../_firestore.js';
import { characterDocPath, defaultCharacter, isValidSlot } from '../_rpgCharacter.js';
import { removeItem, inventoryQty, tryAddItem } from '../_rpgInventory.js';
import { CRAFT_RECIPES } from '../../data/rpg/craft-recipes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, slot, recipeKey } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });
  if (!isValidSlot(slot, username)) return res.status(400).json({ error: 'invalid_slot' });

  const recipe = CRAFT_RECIPES[recipeKey];
  if (!recipe) return res.status(400).json({ error: 'invalid_recipe' });

  let outcome = null;
  try {
    const docPath = characterDocPath(username, slot);
    await withFirestoreTransaction(docPath, (current) => {
      const character = current || defaultCharacter(slot);
      // town이 null인 레시피(던전 지역)는 마을 소속이 없어 어디서든 제작 가능 - renderAdventureTab의
      // townZones 필터(z.town === currentTown || z.town === null)와 같은 원칙
      if (recipe.town !== null && character.currentTown !== recipe.town) { outcome = { error: 'wrong_town' }; return null; }
      if ((character.gold || 0) < recipe.gold) { outcome = { error: 'not_enough_gold' }; return null; }

      const inventory = [...(character.inventory || [])];
      if (inventoryQty(inventory, recipe.materialId) < recipe.materialQty) {
        outcome = { error: 'not_enough_material' };
        return null;
      }
      removeItem(inventory, recipe.materialId, recipe.materialQty);
      const added = tryAddItem(character, inventory, recipe.resultItemId, 1);
      if (!added.ok) { outcome = { error: added.reason }; return null; }

      const now = Date.now();
      outcome = { crafted: recipe.resultItemId, gold: (character.gold || 0) - recipe.gold };
      return { ...character, gold: (character.gold || 0) - recipe.gold, inventory, updatedAt: now };
    });

    if (outcome && outcome.error) return res.status(400).json({ error: outcome.error });
    return res.status(200).json(outcome);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
