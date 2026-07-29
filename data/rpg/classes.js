// 직업 정의 — 데이터로만 관리, 나중에 도적/마법사 추가는 이 객체에 항목만 넣으면 됨
export const CLASSES = {
  warrior: {
    // resourceType: 'stamina' - 물리 직업은 스킬을 스테미나로 씀(마나 아님). 필드명은 그대로 manaCost지만
    // 실제로 어느 자원 풀에서 빠지는지는 이 resourceType이 결정함(rpg-combat.js 참고)
    id: 'warrior', name: '전사', weaponTypes: ['sword', 'spear', 'axe', 'flail'], statScaling: { atk: 'str' }, resourceType: 'stamina',
    // 스킬을 아직 못 배웠거나(훈련소) 그 스킬을 쓸 자원이 없으면 이 기본공격으로 대체됨(rpg-combat.js
    // performAttack 참고) - 무기가 있든 없든 항상 쓸 수 있고, 진짜 맨손(무기 보너스 0)일 때만 powerMult로 약해짐
    improvisedAttack: { name: '주먹질', powerMult: 0.8 },
    skills: [
      { id: 'power_strike', name: '강타', manaCost: 5, type: 'attack', power: 1.6 },
      { id: 'whirlwind', name: '회전베기', manaCost: 8, type: 'attack_all', power: 1.1 },
      { id: 'guard_stance', name: '방어태세', manaCost: 4, type: 'buff_def', power: 1.5 },
      { id: 'execute', name: '처형', manaCost: 10, type: 'execute', power: 2.5, hpThresholdPct: 0.2 },
      // 방패를 장착하고 있을 때만 쓸 수 있는 스킬 - 직업훈련소에서 다른 스킬과 똑같이 배우고 단계를 올림
      { id: 'shield_bash', name: '방패 강타', manaCost: 6, type: 'attack', power: 1.7, requiresShield: true },
    ],
    // 직업-몹 타입 상성(확률 발동, 명중 보장 아님) - 전사는 언데드 사냥에 강하고 야수 상대는 약함
    strongVs: [{ tag: 'undead', chance: 0.25, multiplier: 1.4 }],
    weakVs: [{ tag: 'beast', chance: 0.2, multiplier: 0.7 }],
  },
  archer: {
    // 궁수는 경갑만 착용 가능(중갑은 방어력은 높지만 무거워서 기동성 있는 궁술에 방해됨) - armorRestriction 참고
    // 주무기는 활(화살 소모 없이 항상 사용 가능) - 그 외 무기는 equip.js에서 막지 않지만
    // classDef.weaponTypes에 없는 무기라 rpg-combat.js에서 명중/데미지 패널티를 받음
    id: 'archer', name: '궁수', weaponTypes: ['bow', 'dagger'], armorRestriction: ['light'], statScaling: { atk: 'agi' }, resourceType: 'stamina',
    // 무기가 아예 없으면 짱돌이라도 던짐(약하지만 무기 없이도 뭐라도 함) - improvisedAttack 참고
    improvisedAttack: { name: '짱돌 던지기', powerMult: 0.5 },
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
  mage: {
    // 마법사는 천 방어구만 착용 가능(무거운 갑옷은 마력 운용을 방해함) - armorRestriction 참고
    // 주무기는 지팡이(마나로 원거리 마법공격), 마나가 부족하면 스킬 없이 기본 지팡이 공격만 나감(자연스러운 페널티) -
    // 단도는 페널티 없이 쓸 수 있는 보조무기, 그 외 무기는 off-class 페널티 대상
    id: 'mage', name: '마법사', weaponTypes: ['staff', 'dagger'], armorRestriction: ['cloth'], statScaling: { atk: 'int' }, resourceType: 'mana',
    // 마력탄(magic_bolt)을 아직 훈련 안 했어도(또는 마나가 없어도) 이 기본 마법 공격은 항상 나감 -
    // "마법사인데 마법을 못 쓴다"는 인상을 주지 않기 위함(powerMult 페널티도 없음, 이미 마법 공격 자체가 컨셉)
    improvisedAttack: { name: '마력 파동', powerMult: 1 },
    // elements 배열이 있는 스킬은 시전할 때마다 그 중 하나를 무작위로 골라 속성 공격이 나감(무기 속성 무시) -
    // rpg-combat.js의 performAttack 참고. attack_all은 현재 몹뿐 아니라 같은 조우에 대기 중인
    // 다른 몹에게도 스플래시 피해를 주지만(광역), 스플래시로는 죽지 않게(HP 1 보존) 처리됨
    skills: [
      { id: 'magic_bolt', name: '마력탄', manaCost: 5, type: 'attack', power: 1.5 },
      { id: 'elemental_lance', name: '원소의 창', manaCost: 8, type: 'attack', power: 1.8, elements: ['water', 'earth', 'air', 'holy', 'dark'] },
      { id: 'elemental_nova', name: '원소 폭발', manaCost: 12, type: 'attack_all', power: 1.2, elements: ['water', 'earth', 'air', 'holy', 'dark'] },
      { id: 'weapon_enchant', name: '무기 강화', manaCost: 6, type: 'buff_atk_party', power: 1.3 }, // 근접무기 강화 - 파티 전체 공격력 배율
      { id: 'arcane_ward', name: '마법 방어막', manaCost: 6, type: 'buff_def_party', power: 1.3 }, // 마법방어구 생성 - 파티 전체 방어력 배율
    ],
    strongVs: [{ tag: 'humanoid', chance: 0.25, multiplier: 1.4 }],
    weakVs: [{ tag: 'beast', chance: 0.2, multiplier: 0.75 }],
  },
  priest: {
    // 성직자는 파티 서포터 - 치유와 사기/멘탈 관리(용병의 멘탈 붕괴 방지)에 집중. 몹에게 직접 저주를
    // 거는 공격형 디버프는 나중에 다른 직업(예: 흑마법사 계열)에서 다룰 예정이라 여기서는 제외.
    // 성직자도 천 방어구만 착용 가능. 힐/사기(멘탈)관리는 새로 생긴 스킬 타입이라 rpg-combat.js의
    // tryUtilitySkill()이 매 라운드 우선순위(치유 > 사기진작) 순으로 사용 여부를 판단함
    id: 'priest', name: '성직자', weaponTypes: ['staff', 'dagger'], armorRestriction: ['cloth'], statScaling: { atk: 'wis' }, resourceType: 'mana',
    improvisedAttack: { name: '정화의 빛', powerMult: 1 },
    skills: [
      { id: 'smite', name: '심판의 빛', manaCost: 5, type: 'attack', power: 1.3 },
      { id: 'heal', name: '치유', manaCost: 6, type: 'heal_ally', power: 0.3 }, // 아군 체력을 maxHp의 30% 회복
      { id: 'morale_boost', name: '사기진작', manaCost: 8, type: 'buff_mental_party', power: 20 }, // 사기+멘탈관리 - 파티 멘탈저항 +20 (전투 중)
    ],
    strongVs: [{ tag: 'undead', chance: 0.3, multiplier: 1.4 }],
    weakVs: [{ tag: 'humanoid', chance: 0.2, multiplier: 0.75 }],
  },
  // 성기사 - 전사+성직자 진짜 하이브리드. 기본 공격/방패기는 스태미나로, 신성 스킬(치유/파티방어막/대신관의
  // 일격)은 마나로 씀(스킬 정의에 resourceType을 직접 지정해서 직업 기본 자원과 다르게 쓸 수 있음 -
  // rpg-combat.js의 skillResourceKey 참고). WIS 요구치가 없어도 되게 스킬 위력 자체를 성직자보다 낮게 잡음
  paladin: {
    id: 'paladin', name: '성기사', weaponTypes: ['sword', 'axe', 'flail'], statScaling: { atk: 'str' }, resourceType: 'stamina',
    improvisedAttack: { name: '맨손 강타', powerMult: 0.8 },
    skills: [
      { id: 'holy_strike', name: '성스러운 일격', manaCost: 5, type: 'attack', power: 1.6 },
      { id: 'holy_shield_bash', name: '성스러운 방패 강타', manaCost: 6, type: 'attack', power: 1.7, requiresShield: true },
      { id: 'smite_undead', name: '심판의 빛줄기', manaCost: 10, type: 'attack', power: 2.0, resourceType: 'mana' },
      { id: 'lay_on_hands', name: '안수 치유', manaCost: 8, type: 'heal_ally', power: 0.25, resourceType: 'mana' },
      { id: 'divine_shield', name: '신성한 방벽', manaCost: 6, type: 'buff_def_party', power: 1.3, resourceType: 'mana' },
    ],
    strongVs: [{ tag: 'undead', chance: 0.3, multiplier: 1.5 }, { tag: 'demon', chance: 0.25, multiplier: 1.4 }],
    weakVs: [{ tag: 'beast', chance: 0.2, multiplier: 0.75 }],
  },
  // 흑기사 - 체력 자체를 자원으로 쓰는 리스크&리턴형 근접 딜러(resourceType: 'hp'인 스킬 참고). 자기 체력을
  // 깎아 큰 피해를 내거나 파티 전체를 강화하는 대신, 잘못 쓰면 스스로를 위험에 빠뜨림(HP_SKILL_MIN_REMAINING으로
  // 자살은 방지되지만 그 다음 몹 반격에는 훨씬 취약해짐) - 성기사와 반대로 언데드에게 약함(죽음의 힘이
  // 이미 죽어있는 상대에겐 안 통한다는 컨셉)
  dark_knight: {
    id: 'dark_knight', name: '흑기사', weaponTypes: ['sword', 'axe', 'flail'], statScaling: { atk: 'str' }, resourceType: 'stamina',
    improvisedAttack: { name: '어둠의 손아귀', powerMult: 0.8 },
    skills: [
      { id: 'dark_strike', name: '암흑 일격', manaCost: 5, type: 'attack', power: 1.6 },
      { id: 'dark_shield_bash', name: '어둠의 방패 강타', manaCost: 6, type: 'attack', power: 1.7, requiresShield: true },
      { id: 'blood_strike', name: '유혈 강타', manaCost: 12, type: 'attack', power: 2.4, resourceType: 'hp' },
      { id: 'dark_pact', name: '어둠의 계약', manaCost: 15, type: 'buff_atk_party', power: 1.4, resourceType: 'hp' },
    ],
    strongVs: [{ tag: 'humanoid', chance: 0.3, multiplier: 1.4 }],
    weakVs: [{ tag: 'undead', chance: 0.2, multiplier: 0.75 }],
  },
  // 도적은 나중에 여기 추가 (직업 겸업 시스템은 캐릭터 단계에서 구현)
};
