// ============================================================================
// rpg-balance-sim.mjs — Persistent RPG balance simulator (single source of truth)
// ============================================================================
//
// WHY THIS FILE EXISTS
// --------------------
// Over several sessions, throwaway "full playthrough" scripts were rebuilt from
// scratch to answer one question: how many turns / real days does each of the 6
// classes take to reach and win a fight in the final zone `starlight_ruins`?
// Because each script re-invented its own AI policy from prose, the numbers were
// NOT comparable run-to-run (warrior swung 536d -> 71.5d -> 49.1d across three
// disposable scripts). This file replaces that churn: ONE committed, documented,
// tunable policy so future runs diff against a stable baseline instead of drift.
//
// WHAT IT DOES
// ------------
// Imports the REAL game logic directly (no HTTP, no Firestore, pure in-process):
//   - resolveCombat()            (rpg-combat.js)      the actual turn-by-turn fight
//   - computeCharacterCombatStats (rpg-combat.js)     derived combat stats
//   - applyXpGain()              (rpg-progression.js) real XP curve + level-ups
//   - settleTerritoryDays()      (rpg-territory.js)   territory economy / merc jobs
//   - turnCapForLevel()          (api/_rpgTurns.js)   turn regen cap per level
//   - defaultCharacter(), createMercenaryInstance() (api/_rpgCharacter.js)
//   - data tables (zones, classes, items, enhancement, training, mercenaries...)
// It drives a fresh character of a given class through a full playthrough using
// the documented POLICY below, until it wins one fight in `starlight_ruins`.
//
// HOW "REAL DAYS" ARE COUNTED  (the headline metric)
// --------------------------------------------------
// Per the task spec: a non-admin account with NO ranking/survey bonuses regenerates
// exactly `turnCapForLevel(level)` turns per real day. So every turn spent while at
// level L costs 1 / turnCapForLevel(L) of a day. We accumulate that fraction on
// EVERY turn spent (adventures incl. cross-town +1, and rest-heal turns), summed
// across the run. This is the `days` figure reported. NOTE: this is deliberately
// distinct from the game's *territory* day model (floor(totalTurnsSpent/cap)),
// which we still use verbatim (via settleTerritoryDays) for the merc/gold economy
// so that stays faithful to the live game. Two clocks, on purpose.
//
// REPRODUCIBILITY
// ---------------
// The game logic uses unseeded Math.random() throughout. Rather than retrofit a
// seed through every call site, we swap globalThis.Math.random for a seeded
// mulberry32 PRNG for the duration of each (class, repeat) run, then restore it.
// This is non-invasive (no repo edits) and makes each run bit-for-bit reproducible
// given the same seed. Seed = hash(class) + repeatIndex (see runOne()).
//
// USAGE
// -----
//   node tools/rpg-balance-sim.mjs                 # all 6 classes x 3 repeats
//   node tools/rpg-balance-sim.mjs warrior 5       # single class, 5 repeats (fast iterate)
//   node tools/rpg-balance-sim.mjs all 3           # explicit form of the default
// Writes structured JSON to tools/rpg-balance-sim-results.json (overwrites) AND
// prints a human summary table to stdout. Exit code 0 on success.
//
// POLICY OVERVIEW (see the POLICY constant + decide* helpers for exact thresholds)
// --------------------------------------------------------------------------------
// The simulated player is a "sensible grinder":
//   * Zone choice: must farm each GATE zone (ruins_hill -> canyon -> ridge ->
//     sulfur_caves) to 100 clears to unlock the next town, then win once in
//     starlight_ruins. It only *pushes* a gate zone once its level clears the
//     zone's "recommended" level (tier*3) with a safety margin; otherwise it
//     LEVELS in the highest unlocked zone it is not under-leveled for.
//   * Healing: rest-heals HP to full (turn cost) whenever HP drops below a
//     threshold; rest-heals a *severe* (severity 2) limb injury to avoid the AC
//     penalty; lets minor injuries decay on their own.
//   * Resources: refills the class skill resource (mana for casters, stamina for
//     physical) to full by "buying potions" (abstracted as a gold cost) when it
//     dips below a threshold, so skills stay in rotation instead of decaying to
//     basic attacks. (We abstract consumable inventory: charge gold, top the pool.)
//   * Stats: spends level-up points by per-class weights (main scaling stat +
//     vitality, plus enough of the gear-requirement stat to wear its armor).
//   * Gear: equips better loot of a usable type/armor-class when requirements are
//     met; warriors slot a second one-hander as OFFHAND, mages slot a wand offhand
//     (to exercise dual_wield / wand_mastery). Enhances weapon (and offhand) with
//     enhance_stones + gold when stones pile up.
//   * Skills: trains a per-class priority list with class essence drops + gold,
//     deliberately including the mechanics the balance team tracks (warrior
//     dual_wield, archer evasion, mage wand_mastery/staff_mastery, priest
//     blunt_mastery, etc.).
//   * Mercenaries: hires up to 2 combat mercs (active) once affordable and puts a
//     couple more on territory jobs (clearing = gold, training = their XP).
//
// This is a MODEL of a competent player, not the optimal or the average one. The
// point is that it is FIXED and documented: tune the POLICY block deliberately if
// you want to move the numbers, and the diff will show exactly what changed.
// ============================================================================

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { resolveCombat, computeCharacterCombatStats, applyEquipmentWear, rollEncounter, effectiveStats } from '../rpg-combat.js';
import { applyXpGain } from '../rpg-progression.js';
import { settleTerritoryDays, territoryDaysElapsed } from '../rpg-territory.js';
import { turnCapForLevel } from '../api/_rpgTurns.js';
import { defaultCharacter, createMercenaryInstance } from '../api/_rpgCharacter.js';
import { ZONES } from '../data/rpg/zones.js';
import { CLASSES } from '../data/rpg/classes.js';
import { ITEMS } from '../data/rpg/items.js';
import { ENHANCE_LEVEL_COSTS, MAX_ENHANCE_LEVEL } from '../data/rpg/enhancement.js';
import { TRAINING_TIER_COSTS, MAX_SKILL_TIER, CLASS_ESSENCE_ITEM } from '../data/rpg/training.js';
import { CASTLE_CLEAR_REQUIREMENT } from '../data/rpg/castle.js';
import { HP_REST_HEAL_FULL_TURNS, REST_HEAL_TURN_COST_BY_SEVERITY } from '../data/rpg/injuries.js';
import { MERCENARY_TEMPLATES, ACTIVE_HIRE_COST_MULT_BY_SLOT } from '../data/rpg/mercenaries.js';
import { TOWNS } from '../data/rpg/towns.js';

// ----------------------------------------------------------------------------
// Seeded RNG (mulberry32) — installed over Math.random for reproducible runs.
// ----------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ----------------------------------------------------------------------------
// POLICY — every tunable knob in one place. Change here, commit, diff.
// ----------------------------------------------------------------------------
const POLICY = {
  // Zone gate chain that must each be cleared CASTLE_CLEAR_REQUIREMENT (100) times
  // to open the road to the final zone. (Derived from zones.js unlock chain.)
  GATE_ZONES: ['ruins_hill', 'canyon', 'ridge', 'sulfur_caves'],
  FINAL_ZONE: 'starlight_ruins',

  // Only push a gate/target zone once level >= ceil(zoneTier * 3 * PUSH_LEVEL_MARGIN).
  // tier*3 is the game's own "under-leveled" line (isUnderleveled in resolveCombat);
  // the margin buys reliability so we aren't feeding 40%-winrate attempts.
  PUSH_LEVEL_MARGIN: 1.15,
  // For a LEVELING zone we require level >= tier*3 (not under-leveled) so grinding
  // stays efficient; we pick the highest unlocked zone that clears this bar.
  LEVEL_ZONE_MIN_MARGIN: 1.0,

  HEAL_HP_BELOW_PCT: 0.55,      // rest-heal to full when HP fraction dips below this
  HEAL_SEVERE_INJURY: true,     // rest-heal a severity-2 limb injury (AC penalty) immediately
  REFILL_RESOURCE_BELOW_PCT: 0.45, // refill mana/stamina pool when below this fraction
  RESOURCE_FULL_REFILL_GOLD: 120,  // abstracted gold cost of a full mana/stamina top-off
  RESOURCE_MIN_GOLD_BUFFER: 200,   // don't spend the last coins on potions

  STANCE: 'stable',             // 'stable' finishes weakest monster first (survival-leaning)

  // Stat allocation weights per class (main scaling stat + vitality + gear-req stat).
  // Points are handed out by largest-remainder each level so integer points sum right.
  STAT_WEIGHTS: {
    warrior:     { str: 0.60, vit: 0.40 },
    paladin:     { str: 0.60, vit: 0.40 },
    dark_knight: { str: 0.60, vit: 0.40 },
    archer:      { agi: 0.60, vit: 0.40 },
    mage:        { int: 0.55, vit: 0.30, wis: 0.15 }, // wis to meet cloth-armor wisRequirement
    priest:      { wis: 0.55, vit: 0.30, str: 0.15 }, // str to meet cloth-armor strRequirement
  },

  // Skill training priority per class (trained with class essences + gold, up to
  // MAX_SKILL_TIER). Deliberately front-loads the mechanics balance wants tracked.
  SKILL_PRIORITY: {
    warrior:     ['power_strike', 'dual_wield', 'whirlwind', 'guard_stance', 'taunt', 'last_stand', 'hp_regen', 'resource_regen'],
    archer:      ['aimed_shot', 'evasion', 'multi_shot', 'exposing_shot', 'hp_regen', 'resource_regen'],
    mage:        ['magic_bolt', 'staff_mastery', 'wand_mastery', 'elemental_nova', 'arcane_aura', 'chain_bolt', 'hp_regen', 'resource_regen'],
    priest:      ['smite', 'blunt_mastery', 'heal', 'mass_heal', 'morale_boost', 'angelic_descent', 'hp_regen', 'resource_regen'],
    paladin:     ['holy_strike', 'holy_leech', 'holy_wave', 'divine_shield', 'indomitable_will', 'conversion', 'hp_regen', 'resource_regen'],
    dark_knight: ['dark_strike', 'blood_drain', 'blood_strike', 'dread_aura', 'dark_pact', 'fear_strike', 'hp_regen', 'resource_regen'],
  },

  // Combat mercenaries: hire up to this many ACTIVE mercs once we can afford them
  // with a buffer. Early towns only offer warrior/archer (minTownTier 1).
  MAX_ACTIVE_MERCS: 3,
  ACTIVE_MERC_IDS: ['merc_warrior', 'merc_archer', 'merc_priest'],
  MERC_HIRE_GOLD_BUFFER: 400,   // keep this much gold after a hire
  TERRITORY_CLEARING_MERCS: 2,  // extra mercs put on 'clearing' (gold income) when affordable

  // Enhancement: pump the weapon (and warrior/mage offhand) whenever we have the
  // stones + gold for the next level, keeping a gold buffer for potions/heals.
  ENHANCE_GOLD_BUFFER: 300,

  // Safety valve: abort a run that somehow can't finish (policy bug) instead of hanging.
  MAX_ADVENTURES: 400000,
};

// Starting weapon (main), optional offhand weapon type, and armor class per class.
// Mains are chosen from each class's weaponTypes[0]-ish concept weapon.
const CLASS_LOADOUT = {
  warrior:     { mainType: 'sword', offhandType: 'sword', armorClass: 'heavy', startWeapon: 'weapon_basic_sword', startArmorTop: 'armor_basic', startArmorBottom: 'armor_bottom_basic' },
  archer:      { mainType: 'bow',   offhandType: null,     armorClass: 'light', startWeapon: 'weapon_basic_bow',   startArmorTop: 'armor_basic', startArmorBottom: 'armor_bottom_basic' },
  mage:        { mainType: 'staff', offhandType: 'wand',   armorClass: 'cloth', startWeapon: 'weapon_basic_staff', startArmorTop: 'armor_cloth_basic', startArmorBottom: 'armor_bottom_cloth_basic' },
  priest:      { mainType: 'mace',  offhandType: null,     armorClass: 'cloth', startWeapon: 'weapon_basic_mace',  startArmorTop: 'armor_cloth_basic', startArmorBottom: 'armor_bottom_cloth_basic' },
  paladin:     { mainType: 'sword', offhandType: null,     armorClass: 'heavy', startWeapon: 'weapon_basic_sword', startArmorTop: 'armor_basic', startArmorBottom: 'armor_bottom_basic' },
  dark_knight: { mainType: 'greatsword', offhandType: null, armorClass: 'heavy', startWeapon: 'weapon_basic_greatsword', startArmorTop: 'armor_basic', startArmorBottom: 'armor_bottom_basic' },
};

const CLASSES_LIST = ['warrior', 'archer', 'mage', 'priest', 'paladin', 'dark_knight'];

// Blunt weapon types (priest blunt_mastery applies to these) — mirror rpg-combat.js.
const BLUNT_TYPES = ['mace', 'warhammer', 'morning_star', 'flail'];
const TWO_HANDED = ['staff']; // mirror TWO_HANDED_WEAPON_TYPES in rpg-combat.js

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------
function townTierOf(townId) { return (TOWNS[townId] || {}).tier || 1; }
function zoneUnlocked(char, zone) {
  if (!zone.town) return false; // dungeons: skip (optional content, need torches)
  if (!zone.unlockZoneId) return true;
  return (char.zoneClearCounts[zone.unlockZoneId] || 0) >= CASTLE_CLEAR_REQUIREMENT;
}
// Distribute `points` integer stat points across weighted stats (largest remainder).
function allocateStatPoints(char, points) {
  const weights = POLICY.STAT_WEIGHTS[char.classMain];
  const keys = Object.keys(weights);
  const raw = keys.map((k) => ({ k, exact: points * weights[k] }));
  const alloc = raw.map((r) => ({ k: r.k, n: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let used = alloc.reduce((s, a) => s + a.n, 0);
  alloc.sort((a, b) => b.rem - a.rem);
  for (let i = 0; used < points; i++, used++) alloc[i % alloc.length].n++;
  for (const a of alloc) char.stats[a.k] = (char.stats[a.k] || 0) + a.n;
}

// ----------------------------------------------------------------------------
// A single full playthrough for one class. Returns a rich result record.
// ----------------------------------------------------------------------------
function runOne(classId, repeatIndex) {
  // Install seeded RNG for this run (restored in finally).
  const originalRandom = Math.random;
  const seed = (hashStr(classId) + repeatIndex * 0x9E3779B1) >>> 0;
  Math.random = mulberry32(seed);

  try {
    const loadout = CLASS_LOADOUT[classId];
    const char = defaultCharacter(1);
    char.classMain = classId;
    char.stance = POLICY.STANCE;
    // Starting gear (as if bought from the town1 shop).
    char.equipment.weapon = loadout.startWeapon;
    char.equipment.armor_top = loadout.startArmorTop;
    char.equipment.armor_bottom = loadout.startArmorBottom;
    // Give a little starting gold (character starts at 0; a real player has quest/
    // starter gold + sells early loot — we seed a small float so early potions/heals
    // and the first merc hire aren't impossible. Kept small so it doesn't distort.)
    char.gold = 200;

    // Simulator-side counters (kept outside the game character object).
    const sim = {
      days: 0,                 // headline metric (see file header)
      turnsAdventure: 0,       // turns spent on adventures (incl. cross-town +1)
      turnsHeal: 0,            // turns spent rest-healing HP + injuries
      goldEarnedCombat: 0,
      goldSpentPotions: 0,
      goldSpentEnhance: 0,
      goldSpentTraining: 0,
      goldSpentMercs: 0,
      goldFromTerritory: 0,
      essences: 0,             // class essence count (training material)
      stones: 0,               // enhance_stone count
      wins: 0, losses: 0,
      winsByTierBand: {},      // { 'low(1-4)': {w,l}, 'mid(5-8)':..., 'high(9-12)':... }
      defeats: 0,              // combat defeats (== losses; kept for clarity)
      mercsHiredActive: 0,
      mercsHiredTerritory: 0,
      trainedSkills: {},       // { skillId: tier }
    };

    const tierBand = (t) => (t <= 4 ? 'low(t1-4)' : t <= 8 ? 'mid(t5-8)' : 'high(t9-12)');
    const recordFight = (zone, victory) => {
      const band = tierBand(zone.tier);
      sim.winsByTierBand[band] = sim.winsByTierBand[band] || { w: 0, l: 0 };
      if (victory) { sim.wins++; sim.winsByTierBand[band].w++; }
      else { sim.losses++; sim.defeats++; sim.winsByTierBand[band].l++; }
    };

    // Spend a batch of turns and advance the "real days" clock at the CURRENT level.
    const spendTurns = (n, bucket) => {
      sim.days += n / turnCapForLevel(char.level); // no survey/ranking bonus, per spec
      if (bucket === 'heal') sim.turnsHeal += n; else sim.turnsAdventure += n;
    };

    // -- Zone selection -------------------------------------------------------
    // Returns the zoneId to fight next, plus whether it's the current gate target.
    function chooseZone() {
      // First gate not yet at 100 clears AND unlocked is our progression target.
      let gate = null;
      for (const gz of POLICY.GATE_ZONES) {
        if ((char.zoneClearCounts[gz] || 0) < CASTLE_CLEAR_REQUIREMENT) {
          if (zoneUnlocked(char, ZONES[gz])) gate = gz;
          break; // gates are sequential; stop at the first unmet one
        }
      }
      // All gates done -> go win the final zone.
      const gatesDone = POLICY.GATE_ZONES.every((gz) => (char.zoneClearCounts[gz] || 0) >= CASTLE_CLEAR_REQUIREMENT);
      if (gatesDone) return { zoneId: POLICY.FINAL_ZONE, isTarget: true };

      if (gate) {
        const gateTier = ZONES[gate].tier;
        const pushLevel = Math.ceil(gateTier * 3 * POLICY.PUSH_LEVEL_MARGIN);
        if (char.level >= pushLevel) return { zoneId: gate, isTarget: true };
      }
      // Not ready to push the gate: LEVEL in the highest unlocked zone we are not
      // under-leveled for (level >= tier*3). Falls back to meadow when very fresh.
      let best = null;
      for (const z of Object.values(ZONES)) {
        if (!zoneUnlocked(char, z)) continue;
        if (char.level < Math.ceil(z.tier * 3 * POLICY.LEVEL_ZONE_MIN_MARGIN)) continue;
        if (!best || z.tier > best.tier) best = z;
      }
      if (best) return { zoneId: best.id, isTarget: false };
      return { zoneId: 'meadow', isTarget: false };
    }

    // -- Between-fight upkeep: heal, refill resources, spend points, gear, train, hire
    function upkeep() {
      const stats = computeCharacterCombatStats(char);

      // 1) Rest-heal HP to full if low (turn cost, per rest-heal.js).
      if (char.currentHp < stats.maxHp * POLICY.HEAL_HP_BELOW_PCT) {
        const missingPct = Math.max(0, (stats.maxHp - char.currentHp) / stats.maxHp);
        const cost = Math.max(1, Math.round(missingPct * HP_REST_HEAL_FULL_TURNS)); // hospital mult = 1 (no facility)
        spendTurns(cost, 'heal');
        char.currentHp = stats.maxHp;
      }
      // 2) Rest-heal a SEVERE limb injury (severity 2) to drop the AC penalty.
      if (POLICY.HEAL_SEVERE_INJURY) {
        for (const part of ['arm', 'leg']) {
          const inj = char.injuries[part];
          if (inj && inj.severity >= 2) {
            spendTurns(REST_HEAL_TURN_COST_BY_SEVERITY[inj.severity] || 5, 'heal');
            char.injuries[part] = { severity: 0, turnsLeft: 0 };
          }
        }
      }
      // 3) Refill class skill resource (mana/stamina) via abstracted potions.
      const resourceType = CLASSES[classId].resourceType; // 'stamina' | 'mana'
      if (resourceType === 'stamina' || resourceType === 'mana') {
        const isMana = resourceType === 'mana';
        const cur = isMana ? char.currentMp : char.currentStamina;
        const max = isMana ? stats.maxMp : stats.maxStamina;
        if (max > 0 && cur < max * POLICY.REFILL_RESOURCE_BELOW_PCT && char.gold > POLICY.RESOURCE_MIN_GOLD_BUFFER) {
          const deficitPct = (max - cur) / max;
          const cost = Math.round(deficitPct * POLICY.RESOURCE_FULL_REFILL_GOLD);
          if (char.gold - cost > POLICY.RESOURCE_MIN_GOLD_BUFFER) {
            char.gold -= cost; sim.goldSpentPotions += cost;
            if (isMana) char.currentMp = stats.maxMp; else char.currentStamina = stats.maxStamina;
          }
        }
      }

      // 4) Spend level-up stat points.
      if ((char.statPoints || 0) > 0) { allocateStatPoints(char, char.statPoints); char.statPoints = 0; }

      // 5) Equip better dropped gear (weapon of a usable type, armor of the right class).
      equipUpgrades();

      // 6) Train skills (essence + gold), following the class priority list.
      trainSkills();

      // 7) Enhance weapon (and offhand) when stones + gold allow.
      enhanceGear();

      // 8) Hire mercenaries (active combatants + territory workers).
      hireMercs();
    }

    // Equip a better item of a slot if requirements are met. `loot`-gained items are
    // held implicitly: we only track the BEST candidate seen per slot (a real player
    // keeps/sells the rest; the sim doesn't model inventory slots/weight).
    const bestOwned = { weapon: null, offhand: null, armor_top: null, armor_bottom: null, shield: null };
    function considerLoot(itemId) {
      const it = ITEMS[itemId];
      if (!it) return;
      if (it.type === 'weapon') {
        // main-hand candidate (prefer our class's main weapon type; accept usable types)
        keepBetterWeapon(itemId, it);
      } else if (it.type === 'armor_top' || it.type === 'armor_bottom') {
        const cur = bestOwned[it.type] ? ITEMS[bestOwned[it.type]] : null;
        if (armorUsable(it) && (!cur || (it.defBonus || 0) + (it.hpBonus || 0) / 10 > (cur.defBonus || 0) + (cur.hpBonus || 0) / 10)) bestOwned[it.type] = itemId;
      } else if (it.type === 'shield' && CLASSES[classId].resourceType === 'stamina') {
        const cur = bestOwned.shield ? ITEMS[bestOwned.shield] : null;
        if (!cur || (it.defBonus || 0) > (cur.defBonus || 0)) bestOwned.shield = itemId;
      }
    }
    function keepBetterWeapon(itemId, it) {
      const usable = CLASSES[classId].weaponTypes.includes(it.weaponType);
      if (!usable) return; // off-class weapons carry combat penalties; skip
      const cur = bestOwned.weapon ? ITEMS[bestOwned.weapon] : null;
      if (!cur || (it.atkBonus || 0) > (cur.atkBonus || 0)) bestOwned.weapon = itemId;
      // Offhand: warrior (any one-hander) or mage (wand only).
      const loadout = CLASS_LOADOUT[classId];
      if (loadout.offhandType && it.weaponType === loadout.offhandType && !TWO_HANDED.includes(it.weaponType)) {
        const curO = bestOwned.offhand ? ITEMS[bestOwned.offhand] : null;
        if (!curO || (it.atkBonus || 0) > (curO.atkBonus || 0)) bestOwned.offhand = itemId;
      }
    }
    function armorUsable(it) {
      const cls = CLASSES[classId];
      if (it.armorClass && cls.armorRestriction && !cls.armorRestriction.includes(it.armorClass)) return false;
      return true;
    }
    function reqMet(it) {
      const eff = effectiveStatsLite();
      if (it.strRequirement && eff.str < it.strRequirement) return false;
      if (it.wisRequirement && eff.wis < it.wisRequirement) return false;
      return true;
    }
    function effectiveStatsLite() {
      // stats + ring/necklace bonuses (we don't equip accessories in the sim, so just stats)
      return { str: char.stats.str, wis: char.stats.wis || 0, agi: char.stats.agi, int: char.stats.int };
    }
    function equipUpgrades() {
      for (const slot of ['weapon', 'offhand', 'armor_top', 'armor_bottom', 'shield']) {
        const cand = bestOwned[slot];
        if (!cand) continue;
        const candItem = ITEMS[cand];
        const curId = char.equipment[slot];
        const curItem = curId ? ITEMS[curId] : null;
        if (!reqMet(candItem)) continue;
        // two-handed main weapon can't coexist with offhand/shield
        if (slot === 'weapon' && TWO_HANDED.includes(candItem.weaponType)) {
          char.equipment.offhand = null; char.equipment.shield = null;
        }
        if (slot === 'offhand') {
          const mainItem = char.equipment.weapon ? ITEMS[char.equipment.weapon] : null;
          if (mainItem && TWO_HANDED.includes(mainItem.weaponType)) continue; // no free hand
        }
        const better = !curItem
          || (candItem.atkBonus || 0) > (curItem.atkBonus || 0)
          || (candItem.defBonus || 0) > (curItem.defBonus || 0);
        if (better) {
          char.equipment[slot] = cand;
          char.equipment[`${slot}Durability`] = 100;
          char.equipment[`${slot}EnhanceLevel`] = 0; // re-equip resets enhance (v1 game rule)
        }
      }
    }

    function trainSkills() {
      const essenceId = CLASS_ESSENCE_ITEM[classId];
      const priority = POLICY.SKILL_PRIORITY[classId] || [];
      // Train the highest-priority skill that can still level and that we can afford.
      let progress = true;
      while (progress) {
        progress = false;
        for (const skillId of priority) {
          // dual_wield / offhand-dependent masteries only matter once the item is worn,
          // but training them early is harmless — still, skip dual_wield until offhand exists.
          if (skillId === 'dual_wield' && !char.equipment.offhand) continue;
          if (skillId === 'wand_mastery' && (!char.equipment.offhand || ITEMS[char.equipment.offhand]?.weaponType !== 'wand')) continue;
          const cur = char.skillLevels[skillId] || 0;
          if (cur >= MAX_SKILL_TIER) continue;
          const cost = TRAINING_TIER_COSTS[cur + 1];
          if (char.gold < cost.gold + POLICY.ENHANCE_GOLD_BUFFER) continue;
          if (sim.essences < cost.essence) continue;
          char.gold -= cost.gold; sim.goldSpentTraining += cost.gold;
          sim.essences -= cost.essence;
          char.skillLevels[skillId] = cur + 1;
          sim.trainedSkills[skillId] = cur + 1;
          progress = true;
          break; // re-evaluate priority from the top after each train
        }
      }
    }

    function enhanceGear() {
      for (const slot of ['weapon', 'offhand']) {
        if (!char.equipment[slot]) continue;
        let guard = 0;
        while (guard++ < MAX_ENHANCE_LEVEL) {
          const lvl = char.equipment[`${slot}EnhanceLevel`] || 0;
          if (lvl >= MAX_ENHANCE_LEVEL) break;
          const cost = ENHANCE_LEVEL_COSTS[lvl + 1];
          if (sim.stones < cost.stones) break;
          if (char.gold < cost.gold + POLICY.ENHANCE_GOLD_BUFFER) break;
          sim.stones -= cost.stones;
          char.gold -= cost.gold; sim.goldSpentEnhance += cost.gold;
          char.equipment[`${slot}EnhanceLevel`] = lvl + 1;
        }
      }
    }

    function hireMercs() {
      const townTier = townTierOf(char.currentTown);
      const activeCount = char.mercenaries.filter((m) => m.assignment === 'active').length;
      // Active combat mercs (up to MAX_ACTIVE_MERCS).
      for (const mid of POLICY.ACTIVE_MERC_IDS) {
        const slotIdx = char.mercenaries.filter((m) => m.assignment === 'active').length;
        if (slotIdx >= POLICY.MAX_ACTIVE_MERCS) break;
        const tmpl = MERCENARY_TEMPLATES[mid];
        if (!tmpl || (tmpl.minTownTier || 1) > townTier) continue;
        if (char.mercenaries.some((m) => m.templateId === mid && m.assignment === 'active')) continue;
        // 2번째/3번째 전투 슬롯은 고용비가 할증됨(ACTIVE_HIRE_COST_MULT_BY_SLOT, hire-mercenary.js와 동일 규칙)
        const cost = Math.round(tmpl.hireCost * (ACTIVE_HIRE_COST_MULT_BY_SLOT[slotIdx] || 1));
        if (char.gold < cost + POLICY.MERC_HIRE_GOLD_BUFFER) continue;
        char.gold -= cost; sim.goldSpentMercs += cost;
        const merc = createMercenaryInstance(mid);
        merc.assignment = 'active';
        char.mercenaries.push(merc);
        sim.mercsHiredActive++;
      }
      // Territory 'clearing' mercs for passive gold (cheapest available template).
      const territoryCount = char.mercenaries.filter((m) => m.assignment === 'territory').length;
      if (territoryCount < POLICY.TERRITORY_CLEARING_MERCS) {
        const mid = 'merc_warrior'; // always available, cheap
        const tmpl = MERCENARY_TEMPLATES[mid];
        if (tmpl && char.gold > tmpl.hireCost + POLICY.MERC_HIRE_GOLD_BUFFER + 300) {
          char.gold -= tmpl.hireCost; sim.goldSpentMercs += tmpl.hireCost;
          const merc = createMercenaryInstance(mid);
          merc.assignment = 'territory'; merc.job = 'clearing';
          char.mercenaries.push(merc);
          sim.mercsHiredTerritory++;
        }
      }
    }

    // -- One adventure = one call into the real resolveCombat + real bookkeeping ---
    function doAdventure(zoneId) {
      const zone = ZONES[zoneId];
      const travelingBetweenTowns = zone.town && char.currentTown && zone.town !== char.currentTown;
      const turnCost = 1 + (travelingBetweenTowns ? 1 : 0);
      spendTurns(turnCost, 'adventure');

      const activeMercs = char.mercenaries.filter((m) => m.assignment === 'active' && !m.hospitalized);
      const result = resolveCombat({
        character: { ...char, mercenaries: activeMercs },
        zoneId, stance: char.stance, lang: 'ko',
      });

      recordFight(zone, result.victory);

      // Loot: bank essences / enhance stones / consider gear.
      const essenceId = CLASS_ESSENCE_ITEM[classId];
      for (const drop of result.loot) {
        if (drop.itemId === essenceId) sim.essences += drop.qty;
        else if (drop.itemId === 'enhance_stone') sim.stones += drop.qty;
        else considerLoot(drop.itemId);
      }

      // XP + level (real curve). statSnapshot mirrors adventure.js's HP/MP/Stamina lock-in-at-level-up system.
      const effStats = effectiveStats(char);
      const mainCls = CLASSES[char.classMain] || CLASSES.warrior;
      const statSnapshot = { vit: effStats.vit, mainStat: effStats[mainCls.statScaling.atk] ?? effStats.str, agi: effStats.agi };
      const progression = applyXpGain(char, result.xpGain, statSnapshot);
      char.level = progression.level; char.xp = progression.xp; char.statPoints = progression.statPoints;
      char.vitHpAccrued = progression.vitHpAccrued; char.mainStatMpAccrued = progression.mainStatMpAccrued; char.agiStaminaAccrued = progression.agiStaminaAccrued;

      // Gold (combat) minus defeat loss.
      const goldGain = result.goldGain;
      sim.goldEarnedCombat += goldGain;
      char.gold = Math.max(0, char.gold + goldGain - (result.goldLost || 0));

      // Equipment wear (real), matching adventure.js zone-tier wear chance.
      const wearChance = zone.tier <= 2 ? 0.35 : zone.tier <= 5 ? 0.7 : 1;
      const { equipment: worn } = applyEquipmentWear(char.equipment, wearChance);
      char.equipment = worn;
      // Auto-repair broken durability gear cheaply in town (abstract: restore to 100
      // and charge a token gold cost) so a run isn't derailed by a broken weapon.
      for (const slot of ['weapon', 'offhand', 'shield', 'armor_top', 'armor_bottom']) {
        if (char.equipment[slot] && (char.equipment[`${slot}Durability`] ?? 100) <= 0) {
          char.equipment[`${slot}Durability`] = 100;
          const repairCost = 40;
          if (char.gold >= repairCost) { char.gold -= repairCost; sim.goldSpentPotions += 0; sim.goldSpentEnhance += 0; sim.goldFromTerritory += 0; sim.goldSpentMercs += 0; }
        }
      }

      // HP/MP/stamina persist to next fight.
      char.currentHp = result.finalHp;
      char.currentMp = result.finalMp;
      char.currentStamina = result.finalStamina;

      // Injuries decay (mirror adventure.js decayInjuries with this fight's fresh ones).
      char.injuries = decayInjuries(char.injuries, result.newInjuries);

      // Merc results (HP/level) — keep active mercs roughly in sync so they stay useful.
      for (const mr of result.mercenaries || []) {
        const merc = char.mercenaries.find((m) => m.id === mr.id);
        if (!merc) continue;
        merc.currentHp = mr.finalHp; merc.currentMp = mr.finalMp; merc.currentStamina = mr.finalStamina;
        const mp = applyXpGain(merc, result.xpGain);
        merc.level = Math.min(char.level, mp.level); merc.xp = mp.xp; merc.statPoints = mp.statPoints;
        merc.injuries = decayInjuries(merc.injuries, mr.newInjuries);
      }

      // Kill/clear counts (mirror adventure.js).
      if (result.isRareEncounter) char.zoneKillCounts[zoneId] = 0;
      else char.zoneKillCounts[zoneId] = (char.zoneKillCounts[zoneId] || 0) + result.killedMonsterIds.length;
      if (result.victory) char.zoneClearCounts[zoneId] = (char.zoneClearCounts[zoneId] || 0) + 1;

      // Territory economy settlement (real function) — faithful to adventure.js using
      // the game's own territory-day model (distinct from our headline `days` clock).
      char.totalTurnsSpent = (char.totalTurnsSpent || 0) + turnCost;
      const daysNow = territoryDaysElapsed(char.totalTurnsSpent, char.level);
      const daysSince = daysNow - (char.territoryDayCheckpoint || 0);
      if (daysSince > 0) {
        const settlement = settleTerritoryDays(char, daysSince, char.level);
        if (settlement) {
          char.gold = Math.max(0, char.gold + settlement.goldDelta);
          sim.goldFromTerritory += settlement.goldIncome;
          char.mercenaries = settlement.nextMercenaries;
        }
        char.territoryDayCheckpoint = daysNow;
      }

      // Current town follows the zone (adventure.js sets nextTown = zone.town).
      char.currentTown = zone.town || char.currentTown || 'town1';

      return result;
    }

    // ---- main loop ---------------------------------------------------------
    let adventures = 0;
    let bailed = false;
    while (true) {
      const { zoneId, isTarget } = chooseZone();
      const result = doAdventure(zoneId);
      // WIN CONDITION: a victory in the final zone.
      if (zoneId === POLICY.FINAL_ZONE && result.victory) break;
      upkeep();
      if (++adventures > POLICY.MAX_ADVENTURES) { bailed = true; break; }
    }

    // ---- assemble result record -------------------------------------------
    const finalStats = computeCharacterCombatStats(char);
    const totalTurns = sim.turnsAdventure + sim.turnsHeal;
    const record = {
      class: classId,
      repeat: repeatIndex,
      seed,
      bailed,
      days: round1(sim.days),
      totalTurns,
      turnsAdventure: sim.turnsAdventure,
      turnsHeal: sim.turnsHeal,
      healTurnShare: totalTurns ? round3(sim.turnsHeal / totalTurns) : 0,
      adventures,
      finalLevel: char.level,
      finalHp: finalStats.maxHp,
      finalAtk: finalStats.atk,
      finalDef: finalStats.def,
      wins: sim.wins,
      losses: sim.losses,
      winRate: (sim.wins + sim.losses) ? round3(sim.wins / (sim.wins + sim.losses)) : 0,
      winsByTierBand: sim.winsByTierBand,
      gold: {
        earnedCombat: sim.goldEarnedCombat,
        fromTerritory: sim.goldFromTerritory,
        spentPotions: sim.goldSpentPotions,
        spentEnhance: sim.goldSpentEnhance,
        spentTraining: sim.goldSpentTraining,
        spentMercs: sim.goldSpentMercs,
        finalGold: char.gold,
      },
      equipment: {
        weapon: char.equipment.weapon,
        weaponEnhance: char.equipment.weaponEnhanceLevel || 0,
        offhand: char.equipment.offhand || null,
        offhandEnhance: char.equipment.offhandEnhanceLevel || 0,
        shield: char.equipment.shield || null,
        armor_top: char.equipment.armor_top,
        armor_bottom: char.equipment.armor_bottom,
      },
      skills: { ...char.skillLevels },
      mercs: { hiredActive: sim.mercsHiredActive, hiredTerritory: sim.mercsHiredTerritory, current: char.mercenaries.length },
      classMechanic: classMechanicReport(classId, char, finalStats),
      gateClears: Object.fromEntries(POLICY.GATE_ZONES.map((g) => [g, char.zoneClearCounts[g] || 0])),
      finalZoneClears: char.zoneClearCounts[POLICY.FINAL_ZONE] || 0,
    };
    return record;
  } finally {
    Math.random = originalRandom;
  }
}

// Mirror adventure.js decayInjuries.
function decayInjuries(prevInjuries, freshInjuries) {
  const prev = prevInjuries || { arm: { severity: 0, turnsLeft: 0 }, leg: { severity: 0, turnsLeft: 0 } };
  const injuries = {};
  for (const part of ['arm', 'leg']) {
    const prevPart = prev[part] || { severity: 0, turnsLeft: 0 };
    const fresh = freshInjuries && freshInjuries[part];
    if (fresh) injuries[part] = { severity: fresh.severity, turnsLeft: fresh.turnsLeft };
    else if (prevPart.severity > 0) {
      const turnsLeft = Math.max(0, prevPart.turnsLeft - 1);
      injuries[part] = turnsLeft > 0 ? { severity: prevPart.severity, turnsLeft } : { severity: 0, turnsLeft: 0 };
    } else injuries[part] = { severity: 0, turnsLeft: 0 };
  }
  return injuries;
}

// Class-specific mechanic usage, for the balance readout.
function classMechanicReport(classId, char, stats) {
  const sk = char.skillLevels || {};
  switch (classId) {
    case 'warrior':
      return { dual_wield_tier: sk.dual_wield || 0, offhand_equipped: !!char.equipment.offhand, offhand_id: char.equipment.offhand || null };
    case 'archer':
      return { evasion_tier: sk.evasion || 0, evasionChance: round3(stats.evasionChance || 0), exposing_shot_tier: sk.exposing_shot || 0, exposeShotChance: round3(stats.exposeShotChance || 0) };
    case 'mage':
      return { staff_mastery_tier: sk.staff_mastery || 0, wand_mastery_tier: sk.wand_mastery || 0, offhand_wand: char.equipment.offhand && ITEMS[char.equipment.offhand]?.weaponType === 'wand' || false };
    case 'priest':
      return { blunt_mastery_tier: sk.blunt_mastery || 0, weapon_is_blunt: BLUNT_TYPES.includes(ITEMS[char.equipment.weapon]?.weaponType) };
    case 'paladin':
      return { holy_leech_tier: sk.holy_leech || 0, indomitable_will_tier: sk.indomitable_will || 0 };
    case 'dark_knight':
      return { blood_drain_tier: sk.blood_drain || 0, dread_aura_tier: sk.dread_aura || 0 };
    default: return {};
  }
}

const round1 = (n) => Math.round(n * 10) / 10;
const round3 = (n) => Math.round(n * 1000) / 1000;
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ----------------------------------------------------------------------------
// Runner / CLI
// ----------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  let classes = CLASSES_LIST;
  let repeats = 3;
  if (args[0] && args[0] !== 'all') {
    if (!CLASSES_LIST.includes(args[0])) {
      console.error(`Unknown class "${args[0]}". Valid: ${CLASSES_LIST.join(', ')} | all`);
      process.exit(1);
    }
    classes = [args[0]];
  }
  if (args[1]) repeats = Math.max(1, parseInt(args[1], 10) || 3);

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const runs = [];
  const perClass = {};

  for (const cls of classes) {
    const clsRuns = [];
    for (let r = 0; r < repeats; r++) {
      const rec = runOne(cls, r);
      clsRuns.push(rec);
      runs.push(rec);
      console.error(`  [${cls}] repeat ${r + 1}/${repeats}: ${rec.days}d, L${rec.finalLevel}, ${rec.adventures} adventures, winRate ${rec.winRate}${rec.bailed ? '  *** BAILED ***' : ''}`);
    }
    const days = clsRuns.map((r) => r.days);
    const levels = clsRuns.map((r) => r.finalLevel);
    perClass[cls] = {
      runs: clsRuns.length,
      daysMedian: round1(median(days)),
      daysMin: round1(Math.min(...days)),
      daysMax: round1(Math.max(...days)),
      finalLevelMedian: median(levels),
      totalTurnsMedian: median(clsRuns.map((r) => r.totalTurns)),
      winRateMedian: round3(median(clsRuns.map((r) => r.winRate))),
      healTurnShareMedian: round3(median(clsRuns.map((r) => r.healTurnShare))),
      anyBailed: clsRuns.some((r) => r.bailed),
    };
  }

  const output = {
    meta: {
      generatedAt: startedAt,
      runtimeSeconds: round1((Date.now() - t0) / 1000),
      repeats,
      classes,
      note: 'FIRST TRUSTWORTHY BASELINE. Prior throwaway scripts (warrior 536d/71.5d/49.1d) are NOT comparable. Diff future runs against this file.',
      policySummary: 'See POLICY block in rpg-balance-sim.mjs. Seeded mulberry32 per (class,repeat) -> reproducible.',
    },
    perClass,
    runs,
  };

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, 'rpg-balance-sim-results.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  // Human summary table to stdout.
  printSummary(perClass);
  console.error(`\nWrote ${outPath}`);
}

function printSummary(perClass) {
  const rows = Object.entries(perClass)
    .map(([cls, s]) => ({ cls, ...s }))
    .sort((a, b) => a.daysMedian - b.daysMedian);
  console.log('\n=== RPG BALANCE SIM — median days to win in starlight_ruins (ranked) ===');
  console.log('class        | days(med) | range        | Lvl(med) | turns(med) | winRate | heal%');
  console.log('-------------|-----------|--------------|----------|------------|---------|------');
  for (const r of rows) {
    console.log(
      `${r.cls.padEnd(12)} | ${String(r.daysMedian).padStart(9)} | ${(`${r.daysMin}-${r.daysMax}`).padStart(12)} | ${String(r.finalLevelMedian).padStart(8)} | ${String(r.totalTurnsMedian).padStart(10)} | ${String(r.winRateMedian).padStart(7)} | ${String(Math.round(r.healTurnShareMedian * 100) + '%').padStart(5)}${r.anyBailed ? '  *BAIL*' : ''}`,
    );
  }
}

main();
