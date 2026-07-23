// 직업 정의 — 데이터로만 관리, 나중에 도적/마법사 추가는 이 객체에 항목만 넣으면 됨
export const CLASSES = {
  warrior: {
    id: 'warrior', name: '전사', weaponTypes: ['sword', 'spear', 'axe'], statScaling: { atk: 'str' },
    skills: [
      { id: 'power_strike', name: '강타', manaCost: 5, type: 'attack', power: 1.6 },
      { id: 'whirlwind', name: '회전베기', manaCost: 8, type: 'attack_all', power: 1.1 },
      { id: 'guard_stance', name: '방어태세', manaCost: 4, type: 'buff_def', power: 1.5 },
      { id: 'execute', name: '처형', manaCost: 10, type: 'execute', power: 2.5, hpThresholdPct: 0.2 },
    ],
    // 직업-몹 타입 상성(확률 발동, 명중 보장 아님) - 전사는 언데드 사냥에 강하고 야수 상대는 약함
    strongVs: [{ tag: 'undead', chance: 0.25, multiplier: 1.4 }],
    weakVs: [{ tag: 'beast', chance: 0.2, multiplier: 0.7 }],
  },
  archer: {
    id: 'archer', name: '궁수', weaponTypes: ['bow'], statScaling: { atk: 'agi' },
    skills: [
      { id: 'aimed_shot', name: '조준사격', manaCost: 5, type: 'attack', power: 1.5 },
      { id: 'multi_shot', name: '다중사격', manaCost: 8, type: 'attack_all', power: 1.0 },
      { id: 'evasive_shot', name: '회피사격', manaCost: 4, type: 'buff_evade', power: 1.3 },
      { id: 'headshot', name: '급소저격', manaCost: 10, type: 'attack', power: 2.2, critBonus: 0.3 },
    ],
    // 궁수는 야수 사냥에 강하고 언데드(생체반응 없음) 상대는 약함 - 전사와 상호보완적 구도
    strongVs: [{ tag: 'beast', chance: 0.3, multiplier: 1.3 }],
    weakVs: [{ tag: 'undead', chance: 0.2, multiplier: 0.75 }],
  },
  // 도적/마법사는 나중에 여기 추가 (직업 겸업 시스템은 캐릭터 단계에서 구현)
};
