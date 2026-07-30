// 전투 중 행동으로 나가는 스킬이 아니라 훈련만 해두면 항상 켜져있는 패시브 - 모든 직업이 배울 수 있음.
// 원래 스태미나 자원 직업(전사/궁수/성기사/흑기사)이 아니면 방패를 껴도 방어 기여가 깎이는데(offClassShield,
// rpg-combat.js computeCharacterCombatStats), 이 스킬을 훈련하면 그 페널티가 없어짐(모든 직업 공통).
// 전사 전용 '방패기술'(shield_mastery)과는 다른 스킬 - 그쪽은 멘탈붕괴방어/반격확률/완전방어확률(방패 등급별 수치)
const SHIELD_EQUIP_SKILL = { id: 'shield_equip', name: '방패장착', manaCost: 0, type: 'passive_shield_equip', power: 1 };

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
      // 패시브 - 매 턴 확률로 발동, 지속시간 동안 몹들의 표적이 전부 전사에게 쏠리고 방어력이 2배가 됨.
      // power는 발동 확률 기준값(단계별로 세짐), 지속 라운드 수는 별도로 훈련 단계에 정비례해서 늘어남
      // (TAUNT_ROUNDS_BY_TIER, rpg-combat.js 참고)
      { id: 'taunt', name: '도발', manaCost: 6, type: 'passive_taunt', power: 0.15 },
      SHIELD_EQUIP_SKILL,
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
      // 전투 행동으로 나가는 게 아니라 훈련해두면 항상 켜져있는 패시브 - 단일공격이든 광역공격이든
      // 지금 나가는 공격에 일정 확률로 3배 데미지가 붙음(power는 "발동 확률" 기준값, 단계별로 세짐 -
      // rpg-combat.js computeCharacterCombatStats/performAttack 참고)
      { id: 'rapid_fire', name: '속사', manaCost: 0, type: 'passive_rapid_fire', power: 0.08 },
      // 마찬가지로 패시브 - 공격을 받을 때마다(명중 판정과는 별개로) 이 확률만큼 완전히 회피함.
      // 회피사격(evasive_shot, 서포트 역할일 때만 쓰는 일시적 자기버프)과는 다른, 항상 켜져있는 스킬
      { id: 'evasion', name: '회피', manaCost: 0, type: 'passive_evasion', power: 0.08 },
      // 패시브 - 명중할 때마다(확률 아님, 항상 적용) 그 몹의 회피력(AC)이 몇 라운드간 떨어짐. power는
      // 감소량 기준값, 단계가 오르면 감소량이 커짐(rpg-combat.js performAttack/EXPOSE_EVASION_ROUNDS 참고)
      { id: 'exposing_shot', name: '급소 노출', manaCost: 0, type: 'passive_expose_evasion', power: 3 },
      SHIELD_EQUIP_SKILL,
    ],
    // 궁수는 야수 사냥에 강하고 언데드(생체반응 없음) 상대는 약함 - 전사와 상호보완적 구도
    strongVs: [{ tag: 'beast', chance: 0.3, multiplier: 1.3 }],
    weakVs: [{ tag: 'undead', chance: 0.2, multiplier: 0.75 }],
  },
  mage: {
    // 마법사는 천 방어구만 착용 가능(무거운 갑옷은 마력 운용을 방해함) - armorRestriction 참고
    // 주무기는 지팡이/완드(마나로 원거리 마법공격) 중 선택 - 완드는 지팡이보다 기본 마법공격력은 낮지만
    // 한손무기 컨셉이라 방패와 함께 들 수 있음. 마나가 부족하면 스킬 없이 기본 지팡이/완드 공격만
    // 나감(자연스러운 페널티) - 단도는 페널티 없이 쓸 수 있는 보조무기, 그 외 무기는 off-class 페널티 대상
    id: 'mage', name: '마법사', weaponTypes: ['staff', 'wand', 'dagger'], armorRestriction: ['cloth'], statScaling: { atk: 'int' }, resourceType: 'mana',
    // 마력탄(magic_bolt)을 아직 훈련 안 했어도(또는 마나가 없어도) 이 기본 마법 공격은 항상 나감 -
    // "마법사인데 마법을 못 쓴다"는 인상을 주지 않기 위함(powerMult 페널티도 없음, 이미 마법 공격 자체가 컨셉)
    improvisedAttack: { name: '마력 파동', powerMult: 1 },
    // 원소계열 스킬은 무작위 속성이 아니라 장착한 지팡이/완드의 element를 그대로 씀(무속성 무기면 무속성
    // 공격) - rpg-combat.js의 performAttack에서 skill.elements가 없으면 weapon.element를 쓰는 걸 그대로 이용
    skills: [
      { id: 'magic_bolt', name: '마력탄', manaCost: 5, type: 'attack', power: 1.5 },
      { id: 'elemental_nova', name: '원소 폭발', manaCost: 12, type: 'attack_all', power: 1.2 },
      // 패시브 - 공격을 받을 때마다 이 확률로 방어의 오라를 둘러 몇 라운드간 자기 AC가 오름(전사 방어태세와
      // 같은 selfDefRounds/selfDefBonus 메커니즘 재사용). power는 발동 확률 기준값, 단계가 오르면 확률이 세짐
      { id: 'arcane_aura', name: '방어의 오라', manaCost: 0, type: 'passive_arcane_aura', power: 0.1 },
      SHIELD_EQUIP_SKILL,
    ],
    strongVs: [{ tag: 'humanoid', chance: 0.25, multiplier: 1.4 }],
    weakVs: [{ tag: 'beast', chance: 0.2, multiplier: 0.75 }],
  },
  priest: {
    // 성직자는 파티 서포터 - 치유와 사기/멘탈 관리(용병의 멘탈 붕괴 방지)에 집중. 몹에게 직접 저주를
    // 거는 공격형 디버프는 나중에 다른 직업(예: 흑마법사 계열)에서 다룰 예정이라 여기서는 제외.
    // 성직자도 천 방어구만 착용 가능. 힐/사기(멘탈)관리는 새로 생긴 스킬 타입이라 rpg-combat.js의
    // tryUtilitySkill()이 매 라운드 우선순위(치유 > 사기진작) 순으로 사용 여부를 판단함
    // 성직자는 날붙이를 쓰지 않는다는 설정(피를 보지 않는 신성한 전투) - 둔기(철퇴가 기본무기,
    // 전쟁망치/모닝스타/도리깨)와 지팡이(쿼터스태프), 원거리는 물매만 씀
    id: 'priest', name: '성직자', weaponTypes: ['mace', 'warhammer', 'morning_star', 'flail', 'staff', 'sling'], armorRestriction: ['cloth'], statScaling: { atk: 'wis' }, resourceType: 'mana',
    improvisedAttack: { name: '정화의 빛', powerMult: 1 },
    skills: [
      // 성직자의 단일공격은 무기속성이 아니라 항상 신성속성 고정(elements 배열이 하나뿐이면 그 하나만 나감,
      // 마법사 원소계열 스킬과 같은 방식 - performAttack의 castElement 참고)
      { id: 'smite', name: '심판의 빛', manaCost: 5, type: 'attack', power: 1.3, elements: ['holy'] },
      { id: 'heal', name: '치유', manaCost: 6, type: 'heal_ally', power: 0.3 }, // 아군 체력을 maxHp의 30% 회복
      // 광역힐 - 다친 아군 전원을 한 번에 회복(단일 치유보다 회복 비율은 낮음)
      { id: 'mass_heal', name: '치유의 빛', manaCost: 10, type: 'heal_ally_all', power: 0.2 },
      // 사기+멘탈관리 - 전투 내내 파티 멘탈저항 +20에 더해, 시전 순간 파티 전원이 몇 라운드 멘탈붕괴
      // 완전면역(MORALE_BOOST_IMMUNE_ROUNDS) + 이미 멘탈붕괴로 밀려나있던 아군은 원위치 복귀(tryUtilitySkill 참고)
      { id: 'morale_boost', name: '사기진작', manaCost: 8, type: 'buff_mental_party', power: 20 },
      SHIELD_EQUIP_SKILL,
    ],
    strongVs: [{ tag: 'undead', chance: 0.3, multiplier: 1.4 }],
    weakVs: [{ tag: 'humanoid', chance: 0.2, multiplier: 0.75 }],
  },
  // 성기사 - 전사+성직자 진짜 하이브리드. 기본 공격/방패기는 스태미나로, 신성 스킬(치유/파티방어막/대신관의
  // 일격)은 마나로 씀(스킬 정의에 resourceType을 직접 지정해서 직업 기본 자원과 다르게 쓸 수 있음 -
  // rpg-combat.js의 skillResourceKey 참고). WIS 요구치가 없어도 되게 스킬 위력 자체를 성직자보다 낮게 잡음
  paladin: {
    // 전용무기: 검+사슬도리깨(축복받은 둔기) - 발더스게이트/디아블로 성기사 컨셉 참고. 그 외 무기는
    // 장착은 가능하지만 비숙련 패널티(rpg-combat.js CONCEPT_WEAPON_BY_CLASS)
    id: 'paladin', name: '성기사', weaponTypes: ['sword', 'flail'], statScaling: { atk: 'str' }, resourceType: 'stamina',
    improvisedAttack: { name: '맨손 강타', powerMult: 0.8 },
    skills: [
      // 공격은 단일/광역 딱 둘 - 둘 다 신성속성 고정(elements 배열, performAttack의 castElement 참고)
      { id: 'holy_strike', name: '성스러운 일격', manaCost: 5, type: 'attack', power: 1.6, elements: ['holy'] },
      { id: 'holy_wave', name: '신성한 파동', manaCost: 10, type: 'attack_all', power: 1.2, resourceType: 'mana', elements: ['holy'] },
      { id: 'lay_on_hands', name: '안수 치유', manaCost: 8, type: 'heal_ally', power: 0.25, resourceType: 'mana' },
      { id: 'divine_shield', name: '신성한 방벽', manaCost: 6, type: 'buff_def_party', power: 1.3, resourceType: 'mana' },
      // 패시브 - 몹에게 피해를 입힐 때마다 그 피해량의 일정 %만큼 파티 중 체력이 가장 낮은 아군(본인 포함)을
      // 치료함. power는 회복 비율 기준값, 단계가 오르면 비율이 세짐
      { id: 'holy_leech', name: '축복의 손길', manaCost: 0, type: 'passive_holy_leech', power: 0.15 },
      // 패시브 - 공격을 받을 때마다 이 확률로 방어력이 한 단계씩 영구 상승(그 전투가 끝날 때까지 유지,
      // 계속 쌓일 수 있음) - power는 발동 확률 기준값, 단계가 오르면 확률이 세짐
      { id: 'indomitable_will', name: '불굴의 의지', manaCost: 0, type: 'passive_indomitable_will', power: 0.12 },
      // 패시브 - 매 턴 확률로 파티 전체의 공격력/방어력을 조금씩 영구 상승(그 전투 내내 유지, 계속 쌓임).
      // 다른 유틸리티 스킬(치유/방벽 등)이 먼저 나갈 여지가 있게 tryUtilitySkill 우선순위 맨 뒤에 둠
      { id: 'valorous_resolve', name: '용맹한 결의', manaCost: 0, type: 'passive_party_boost', power: 0.15 },
      SHIELD_EQUIP_SKILL,
    ],
    strongVs: [{ tag: 'undead', chance: 0.3, multiplier: 1.5 }, { tag: 'demon', chance: 0.25, multiplier: 1.4 }],
    weakVs: [{ tag: 'beast', chance: 0.2, multiplier: 0.75 }],
  },
  // 흑기사 - 체력 자체를 자원으로 쓰는 리스크&리턴형 근접 딜러(resourceType: 'hp'인 스킬 참고). 자기 체력을
  // 깎아 큰 피해를 내거나 파티 전체를 강화하는 대신, 잘못 쓰면 스스로를 위험에 빠뜨림(HP_SKILL_MIN_REMAINING으로
  // 자살은 방지되지만 그 다음 몹 반격에는 훨씬 취약해짐) - 성기사와 반대로 언데드에게 약함(죽음의 힘이
  // 이미 죽어있는 상대에겐 안 통한다는 컨셉)
  dark_knight: {
    // 전용무기: 도끼+대검(저주받은 양손검) - 디아블로류 어둠의 기사 컨셉 참고. 그 외 무기는 장착은
    // 가능하지만 비숙련 패널티(rpg-combat.js CONCEPT_WEAPON_BY_CLASS)
    id: 'dark_knight', name: '흑기사', weaponTypes: ['axe', 'greatsword'], statScaling: { atk: 'str' }, resourceType: 'stamina',
    improvisedAttack: { name: '어둠의 손아귀', powerMult: 0.8 },
    skills: [
      // 공격은 단일/광역 딱 둘 - 둘 다 어둠속성 고정. 유혈강타는 광역기 자리로 옮기고 HP소모 컨셉은 그대로 유지
      { id: 'dark_strike', name: '암흑 일격', manaCost: 5, type: 'attack', power: 1.6, elements: ['dark'] },
      { id: 'blood_strike', name: '유혈 강타', manaCost: 12, type: 'attack_all', power: 1.6, resourceType: 'hp', elements: ['dark'] },
      { id: 'dark_pact', name: '어둠의 계약', manaCost: 15, type: 'buff_atk_party', power: 1.4, resourceType: 'hp' },
      // 패시브(HP소모) - 공격이 명중하면 확률로 그 몹에게 흡혈 저주를 걸어 몇 라운드간 매 라운드
      // 몹 체력을 깎아 흑기사에게 옮겨줌. 발동 자체에도 소량의 HP를 씀(risk&return 컨셉 유지)
      { id: 'blood_drain', name: '피의 저주', manaCost: 5, type: 'passive_blood_drain', power: 0.15, resourceType: 'hp' },
      // 패시브(HP소모) - 공격을 받으면 확률로 그 몹을 멘탈붕괴시켜 몇 라운드간 공격을 못 하게 함
      { id: 'dread_aura', name: '공포의 오라', manaCost: 5, type: 'passive_dread_aura', power: 0.12, resourceType: 'hp' },
      // 패시브(HP소모) - 매 턴 사망한 아군이 있으면 확률로 되살림(tryUtilitySkill 최우선순위) - 다른 흑기사
      // 패시브와 같은 결로 HP를 대가로 씀
      { id: 'reanimate', name: '되살림의 저주', manaCost: 10, type: 'passive_revive', power: 0.15, resourceType: 'hp' },
      SHIELD_EQUIP_SKILL,
    ],
    strongVs: [{ tag: 'humanoid', chance: 0.3, multiplier: 1.4 }],
    weakVs: [{ tag: 'undead', chance: 0.2, multiplier: 0.75 }],
  },
  // 도적은 나중에 여기 추가 (직업 겸업 시스템은 캐릭터 단계에서 구현)
};
