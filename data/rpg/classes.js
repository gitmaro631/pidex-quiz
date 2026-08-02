// 전투 중 행동으로 나가는 스킬이 아니라 훈련만 해두면 항상 켜져있는 패시브 - 모든 직업이 배울 수 있음.
// 원래 스태미나 자원 직업(전사/궁수/성기사/흑기사)이 아니면 방패를 껴도 방어 기여가 깎이는데(offClassShield,
// rpg-combat.js computeCharacterCombatStats), 이 스킬을 훈련하면 그 페널티가 없어짐(모든 직업 공통).
// 전사 전용 '방패기술'(shield_mastery)과는 다른 스킬 - 그쪽은 멘탈붕괴방어/반격확률/완전방어확률(방패 등급별 수치)
const SHIELD_EQUIP_SKILL = { id: 'shield_equip', name: '방패장착', manaCost: 0, type: 'passive_shield_equip', power: 1 };
// 전 직업 공용 패시브 - 전투 중 매 라운드 확률 없이 무조건 발동, 훈련 단계만큼 최대체력/최대자원의 %를
// 회복함(HP_REGEN_PCT_BY_TIER/RESOURCE_REGEN_PCT_BY_TIER, rpg-combat.js 참고: 1단계 1% ~ 3단계 3%).
// 기력 회복은 그 직업이 실제로 쓰는 자원(마나 또는 스태미나)만 회복시켜줌 - 체력을 자원으로 쓰는
// 흑기사는 hp_regen이 자원 회복까지 겸해주는 효과라 특히 도움이 됨
const HP_REGEN_SKILL = { id: 'hp_regen', name: '생명력 재생', manaCost: 0, type: 'passive_hp_regen', power: 0 };
const RESOURCE_REGEN_SKILL = { id: 'resource_regen', name: '기력 회복', manaCost: 0, type: 'passive_resource_regen', power: 0 };

// 직업 정의 — 데이터로만 관리, 나중에 도적/마법사 추가는 이 객체에 항목만 넣으면 됨
export const CLASSES = {
  warrior: {
    // resourceType: 'stamina' - 물리 직업은 스킬을 스테미나로 씀(마나 아님). 필드명은 그대로 manaCost지만
    // 실제로 어느 자원 풀에서 빠지는지는 이 resourceType이 결정함(rpg-combat.js 참고)
    id: 'warrior', name: '전사', weaponTypes: ['sword', 'spear', 'axe', 'flail'], statScaling: { atk: 'str' }, resourceType: 'stamina',
    // 다른 공격 스킬을 아직 못 배웠거나 쓸 자원이 없으면 이 기본공격으로 대체됨(rpg-combat.js performAttack
    // 참고) - skills 배열의 basic_attack 항목이 실제 위력(훈련으로 단계 상승 가능)을 담당하고, 아래
    // powerMult는 진짜 맨손(무기 보너스 0)일 때만 추가로 곱해지는 별도 페널티
    improvisedAttack: { powerMult: 0.8 },
    skills: [
      // 다른 스킬처럼 결정+골드로 훈련해 단계를 올릴 수 있음(0단계=미훈련이어도 항상 사용 가능,
      // 훈련하면 위력이 세짐 - TIER_POWER_MULT 참고). 공격 스킬 선택 로직(chooseAttackPlan)에서
      // 골라지지 않도록 type을 'attack'이 아닌 별도 값(passive_basic_attack)으로 둠
      { id: 'basic_attack', name: '주먹질', manaCost: 0, type: 'passive_basic_attack', power: 1 },
      { id: 'power_strike', name: '강타', manaCost: 5, type: 'attack', power: 1.6 },
      { id: 'whirlwind', name: '회전베기', manaCost: 8, type: 'attack_all', power: 1.1 },
      { id: 'guard_stance', name: '방어태세', manaCost: 4, type: 'buff_def', power: 1.5 },
      { id: 'execute', name: '처형', manaCost: 10, type: 'execute', power: 2.5, hpThresholdPct: 0.2 },
      // 패시브 - 매 턴 확률로 발동, 지속시간 동안 몹들의 표적이 전부 전사에게 쏠리고 방어력이 2배가 됨.
      // power는 발동 확률 기준값(단계별로 세짐), 지속 라운드 수는 별도로 훈련 단계에 정비례해서 늘어남
      // (TAUNT_ROUNDS_BY_TIER, rpg-combat.js 참고)
      { id: 'taunt', name: '도발', manaCost: 6, type: 'passive_taunt', power: 0.15 },
      // 전사 전용 - 방패 대신 보조무기(offhand)를 끼면(equip.js 참고) 그 무기의 공격력도 그대로 합산됨
      // (이건 훈련과 무관한 기본 동작). 이 스킬은 그 합산치에 추가 보너스를 얹어줌 - 3단계(만렙) 기준
      // +5%, DUAL_WIELD_BONUS_BY_TIER(rpg-combat.js)가 단계별 정확한 값을 관리(1단계 3%, 2단계 4%, 3단계 5%)
      { id: 'dual_wield', name: '이도류', manaCost: 0, type: 'passive_dual_wield', power: 0.05 },
      // 패시브 - 체력이 15% 이하로 처음 떨어지면 전투당 1회, 몇 라운드간 모든 피해를 완전히 무시하는
      // 무적 상태가 됨. 무적 자체는 훈련 단계와 무관하게 항상 발동(1단계만 배워도 있음) - 훈련해서
      // 단계를 올리면 대신 무기 데미지 보너스가 커짐(LAST_STAND_WEAPON_BONUS_BY_TIER, rpg-combat.js 참고)
      { id: 'last_stand', name: '최후의 저항', manaCost: 0, type: 'passive_last_stand', power: 0 },
      HP_REGEN_SKILL,
      RESOURCE_REGEN_SKILL,
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
    improvisedAttack: { powerMult: 0.5 },
    skills: [
      { id: 'basic_attack', name: '짱돌 던지기', manaCost: 0, type: 'passive_basic_attack', power: 1 },
      { id: 'aimed_shot', name: '조준사격', manaCost: 5, type: 'attack', power: 1.5 },
      { id: 'multi_shot', name: '다중사격', manaCost: 8, type: 'attack_all', power: 1.0 },
      { id: 'evasive_shot', name: '회피사격', manaCost: 4, type: 'buff_evade', power: 1.3 },
      // 패시브 - 공격을 받을 때마다(명중 판정과는 별개로) 이 확률만큼 완전히 회피함.
      // 회피사격(evasive_shot, 서포트 역할일 때만 쓰는 일시적 자기버프)과는 다른, 항상 켜져있는 스킬
      // 명중판정까지 통과한 크리티컬조차 조건 없이 무조건 무효화하는 유일한 방어수단이라 값이 과했던 걸
      // 재차 하향 - 훈련 만렙(3단계)은 5% 안쪽(EVASION_SKILL_BONUS_BY_TIER, rpg-combat.js 고정표),
      // 연무장 시설 개인 보너스도 최대 3%로 낮춤(BASICS_EVASION_GAIN_CAP, rpg-territory.js)
      { id: 'evasion', name: '회피', manaCost: 0, type: 'passive_evasion', power: 0.05 },
      // 패시브 - 명중 시 EXPOSE_SHOT_PROC_CHANCE_BY_TIER 확률로 그 몹의 회피력(AC)이 몇 라운드간 떨어짐
      // (원래는 명중하면 무조건 발동이었는데 궁수가 다른 직업보다 압도적으로 빨라서 확률제로 하향).
      // power는 발동 시 감소량 기준값, 단계가 오르면 발동확률/감소량 둘 다 커짐
      // (rpg-combat.js performAttack/EXPOSE_EVASION_ROUNDS/EXPOSE_SHOT_PROC_CHANCE_BY_TIER 참고)
      { id: 'exposing_shot', name: '급소 노출', manaCost: 0, type: 'passive_expose_evasion', power: 3 },
      HP_REGEN_SKILL,
      RESOURCE_REGEN_SKILL,
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
    improvisedAttack: { powerMult: 1 },
    // 원소계열 스킬은 무작위 속성이 아니라 장착한 지팡이/완드의 element를 그대로 씀(무속성 무기면 무속성
    // 공격) - rpg-combat.js의 performAttack에서 skill.elements가 없으면 weapon.element를 쓰는 걸 그대로 이용
    skills: [
      { id: 'basic_attack', name: '마력 파동', manaCost: 0, type: 'passive_basic_attack', power: 1 },
      { id: 'magic_bolt', name: '마력탄', manaCost: 5, type: 'attack', power: 1.5 },
      { id: 'elemental_nova', name: '원소 폭발', manaCost: 12, type: 'attack_all', power: 1.2 },
      // 패시브 - 공격을 받을 때마다 이 확률로 방어의 오라를 둘러 몇 라운드간 자기 AC가 오름(전사 방어태세와
      // 같은 selfDefRounds/selfDefBonus 메커니즘 재사용). power는 발동 확률 기준값, 단계가 오르면 확률이 세짐
      { id: 'arcane_aura', name: '방어의 오라', manaCost: 0, type: 'passive_arcane_aura', power: 0.1 },
      // 완드/스태프 각각 장착 중일 때만 주무기 공격력에 보너스가 붙음(둔기술과 같은 원칙). 완드는 원래
      // 화력이 낮은 대신 방패/이도류가 가능해서 보너스도 더 작게(3단계 5%), 스태프는 양손 전용이라
      // 화력이 세고 보너스도 더 크게(3단계 10%) - WAND/STAFF_MASTERY_BONUS_BY_TIER(rpg-combat.js) 참고
      { id: 'wand_mastery', name: '완드술', manaCost: 0, type: 'passive_wand_mastery', power: 0.05 },
      { id: 'staff_mastery', name: '스태프술', manaCost: 0, type: 'passive_staff_mastery', power: 0.10 },
      // 패시브 - 명중한 타격 하나하나마다(단일공격이든 원소 폭발의 각 타격이든 전부 독립 판정) 확률로
      // 그 타격 데미지의 절반이 무작위 다른 몹에게 튐(CHAIN_BOLT_SPLASH_MULT, rpg-combat.js 참고).
      // 스플래시로도 죽을 수 있음 - 원소 폭발 자체의 기본 스플래시(확률 없이 항상 발동, HP 1 보존)와는 별개
      { id: 'chain_bolt', name: '연쇄 마력탄', manaCost: 0, type: 'passive_chain_bolt', power: 0.15 },
      HP_REGEN_SKILL,
      RESOURCE_REGEN_SKILL,
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
    improvisedAttack: { powerMult: 1 },
    skills: [
      { id: 'basic_attack', name: '정화의 빛', manaCost: 0, type: 'passive_basic_attack', power: 1 },
      // 성직자의 단일공격은 무기속성이 아니라 항상 신성속성 고정(elements 배열이 하나뿐이면 그 하나만 나감,
      // 마법사 원소계열 스킬과 같은 방식 - performAttack의 castElement 참고)
      { id: 'smite', name: '심판의 빛', manaCost: 5, type: 'attack', power: 1.3, elements: ['holy'] },
      { id: 'heal', name: '치유', manaCost: 6, type: 'heal_ally', power: 0.3 }, // 아군 체력을 maxHp의 30% 회복
      // 광역힐 - 다친 아군 전원을 한 번에 회복(단일 치유보다 회복 비율은 낮음)
      { id: 'mass_heal', name: '치유의 빛', manaCost: 10, type: 'heal_ally_all', power: 0.2 },
      // 사기+멘탈관리 - 전투 내내 파티 멘탈저항 +20에 더해, 시전 순간 파티 전원이 몇 라운드 멘탈붕괴
      // 완전면역(MORALE_BOOST_IMMUNE_ROUNDS) + 이미 멘탈붕괴로 밀려나있던 아군은 원위치 복귀(tryUtilitySkill 참고)
      { id: 'morale_boost', name: '사기진작', manaCost: 8, type: 'buff_mental_party', power: 20 },
      // 둔기(철퇴/전쟁망치/모닝스타/도리깨) 장착 중일 때만 주무기 공격력에 보너스가 붙음(지팡이/물매는 해당 없음).
      // 3단계(만렙) 기준 +10%, BLUNT_MASTERY_BONUS_BY_TIER(rpg-combat.js)가 단계별 정확한 값을 관리(1단계 6%, 2단계 8%, 3단계 10%)
      { id: 'blunt_mastery', name: '둔기술', manaCost: 0, type: 'passive_blunt_mastery', power: 0.10 },
      // 패시브 - 치유(단일/광역 무관)를 시전하면 확률 없이 항상 발동, 몇 라운드간 파티 전체 공격력/방어력이
      // 오르고 매 라운드 소량 회복됨(ANGELIC_DESCENT_*_BY_TIER, rpg-combat.js 참고). 힐을 계속 쓸수록
      // 지속시간이 계속 갱신되는 구조라 서포터 롤을 계속 수행할수록 파티 전체가 강해짐
      { id: 'angelic_descent', name: '천사의 강림', manaCost: 0, type: 'passive_angelic_descent', power: 0 },
      HP_REGEN_SKILL,
      RESOURCE_REGEN_SKILL,
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
    improvisedAttack: { powerMult: 0.8 },
    skills: [
      { id: 'basic_attack', name: '맨손 강타', manaCost: 0, type: 'passive_basic_attack', power: 1 },
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
      // 패시브 - 공격이 명중하면 확률로 그 몹을 감화시켜 몇 라운드간 성기사(파티)를 공격하지 않고 대신
      // 다른 몹을 공격하게 함(CONVERSION_ROUNDS, rpg-combat.js 참고). 공격할 다른 몹이 없으면 그냥 가만히 있음
      { id: 'conversion', name: '감화', manaCost: 0, type: 'passive_conversion', power: 0.12 },
      HP_REGEN_SKILL,
      RESOURCE_REGEN_SKILL,
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
    improvisedAttack: { powerMult: 0.8 },
    skills: [
      { id: 'basic_attack', name: '어둠의 손아귀', manaCost: 0, type: 'passive_basic_attack', power: 1 },
      // 공격은 단일/광역 딱 둘 - 둘 다 어둠속성 고정. 유혈강타는 광역기 자리로 옮기고 HP소모 컨셉은 그대로 유지
      { id: 'dark_strike', name: '암흑 일격', manaCost: 5, type: 'attack', power: 1.6, elements: ['dark'] },
      // HP 소모량을 전반적으로 하향(12→8→6, 15→10→8) - 흑기사가 다른 직업 대비 체력 회복(휴식)에
      // 턴을 지나치게 많이 태우는 게 시뮬로 확인돼서 애초에 덜 태우게 조정
      { id: 'blood_strike', name: '유혈 강타', manaCost: 6, type: 'attack_all', power: 1.6, resourceType: 'hp', elements: ['dark'] },
      { id: 'dark_pact', name: '어둠의 계약', manaCost: 8, type: 'buff_atk_party', power: 1.4, resourceType: 'hp' },
      // 패시브 - 공격이 명중하면 확률로 그 몹에게 흡혈 저주를 걸어 몇 라운드간 매 라운드 몹 체력을 깎아
      // 흑기사에게 옮겨줌. 예전엔 발동 자체에도 소량 HP를 썼는데, 패시브까지 체력을 태우면 회복 부담이
      // 너무 커져서 패시브는 전부 무료로 하향(액티브로 직접 쓰는 스킬만 HP를 씀)
      { id: 'blood_drain', name: '피의 저주', manaCost: 0, type: 'passive_blood_drain', power: 0.15 },
      // 패시브 - 공격을 받으면 확률로 그 몹을 멘탈붕괴시켜 몇 라운드간 공격을 못 하게 함
      { id: 'dread_aura', name: '공포의 오라', manaCost: 0, type: 'passive_dread_aura', power: 0.12 },
      // 패시브 - 유저 본인이 죽는 순간 전투당 1회 확정 발동(확률 아님). 본인 포함 이미 죽어있던
      // 파티원 전원을 동시에 부활시키고, 부활 직후 몇 라운드간 파티 전원이 무적이 됨. 부활 시 채워지는
      // 체력 비율은 훈련 단계로 결정(1단계 25% / 2단계 50% / 3단계 75%, REANIMATE_HP_PCT_BY_TIER 참고)
      { id: 'reanimate', name: '되살림의 저주', manaCost: 0, type: 'passive_revive', power: 0 },
      // 패시브 - 공포의 오라(dread_aura, '맞았을 때' 발동)와 반대로 '때렸을 때' 발동함. 공격이 명중하면
      // 확률로 그 몹을 멘탈붕괴시켜 몇 라운드간 공격을 못 하게 함(같은 stunnedRounds를 공유해서
      // dread_aura와 겹치면 더 긴 쪽이 유지됨 - HP소모 없음, dread_aura와 달리 공격 자체가 대가)
      { id: 'fear_strike', name: '공포의 일격', manaCost: 0, type: 'passive_fear_strike', power: 0.12 },
      HP_REGEN_SKILL,
      RESOURCE_REGEN_SKILL,
      SHIELD_EQUIP_SKILL,
    ],
    strongVs: [{ tag: 'humanoid', chance: 0.3, multiplier: 1.4 }],
    weakVs: [{ tag: 'undead', chance: 0.2, multiplier: 0.75 }],
  },
  // 도적은 나중에 여기 추가 (직업 겸업 시스템은 캐릭터 단계에서 구현)
};
