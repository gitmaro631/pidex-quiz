// 퀘스트 정의 — 1회성(완료 후 재도전 불가), condition은 rpg-quests.js의 checkQuestCondition이 판정
export const QUESTS = {
  q1_welcome: {
    id: 'q1_welcome', name: '첫 발걸음', npcId: 'npc_elder',
    desc: '직업을 선택하고 모험을 시작하세요.',
    condition: { type: 'hasClass' },
    reward: { gold: 20, xp: 10 },
  },
  q2_meadow_clear: {
    id: 'q2_meadow_clear', name: '초원 정리', npcId: 'npc_elder',
    desc: '초원/숲에서 몬스터를 5마리 처치하세요.',
    condition: { type: 'zoneKills', zoneId: 'meadow', target: 5 },
    reward: { gold: 50, xp: 30, itemId: 'weapon_uncommon', qty: 1 },
  },
  q3_level5: {
    id: 'q3_level5', name: '성장의 증표', npcId: 'npc_guard',
    desc: '레벨 5를 달성하세요.',
    condition: { type: 'level', target: 5 },
    reward: { gold: 100, xp: 0, itemId: 'bag_small', qty: 1 },
  },
  q4_swamp_clear: {
    id: 'q4_swamp_clear', name: '늪지 정찰', npcId: 'npc_trade_chief',
    desc: '늪지에서 몬스터를 8마리 처치하세요.',
    condition: { type: 'zoneKills', zoneId: 'swamp', target: 8 },
    reward: { gold: 120, xp: 60, itemId: 'armor_uncommon', qty: 1 },
  },
  q5_canyon_clear: {
    id: 'q5_canyon_clear', name: '협곡의 이상 징후', npcId: 'npc_scout',
    desc: '협곡/폐광에서 몬스터를 10마리 처치하세요.',
    condition: { type: 'zoneKills', zoneId: 'canyon', target: 10 },
    reward: { gold: 200, xp: 100, itemId: 'bag_medium', qty: 1 },
  },
};
