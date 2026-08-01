# RPG Balance Simulator

`rpg-balance-sim.mjs` is a persistent, committed, in-process simulator that drives a
fresh character of each of the 6 classes through a **full playthrough** — from level 1
to winning one fight in the final zone `starlight_ruins` — and reports how long that
takes in turns and "real days", plus win rates, gold flow, gear, skills, and
class-mechanic usage.

It exists to end the churn: this used to be rebuilt from scratch by every session,
so the numbers never lined up run-to-run. There is now **one documented policy** in
the repo. Tune it deliberately in the `POLICY` block and diff; don't rewrite it.

## How to run

```bash
node tools/rpg-balance-sim.mjs                # all 6 classes x 3 repeats (default)
node tools/rpg-balance-sim.mjs warrior 5      # one class, 5 repeats (fast iteration)
node tools/rpg-balance-sim.mjs all 3          # explicit default
```

- Progress lines go to **stderr**; the ranked summary table goes to **stdout**.
- Structured results are written to **`tools/rpg-balance-sim-results.json`** (overwritten
  each run). That file is committed as the reference baseline — future runs diff against it.
- Pure in-process: imports `rpg-combat.js`, `rpg-progression.js`, `rpg-territory.js`,
  `api/_rpgTurns.js`, `api/_rpgCharacter.js`, and `data/rpg/*.js`. **No HTTP, no Firestore.**
- Reproducible: a seeded mulberry32 PRNG is swapped over `Math.random` per `(class, repeat)`,
  so a given run is bit-for-bit repeatable. (Restored after each run; no repo files touched.)

## What "days" means

A non-admin account with no ranking/survey bonuses regenerates `turnCapForLevel(level)`
turns per real day, so **every turn spent at level L costs `1 / turnCapForLevel(L)` of a
day**, summed across the whole run (adventures incl. cross-town +1, plus rest-heal turns).
That sum is the reported `days`. This is intentionally separate from the game's *territory*
day model (`floor(totalTurnsSpent / cap)`), which is still applied verbatim for the
merc/gold economy via `settleTerritoryDays`.

## What the policy does (summary — full detail is in the `POLICY` block + `decide*` helpers)

A "sensible grinder", not an optimizer:

- **Zones**: must farm each gate zone `ruins_hill -> canyon -> ridge -> sulfur_caves`
  to 100 clears (unlocking the next town), then win once in `starlight_ruins`. It only
  *pushes* a gate once its level clears the zone's recommended level (`tier*3`) with a
  1.15x margin; otherwise it *levels* in the highest unlocked zone it isn't under-leveled for.
- **Healing**: rest-heals HP to full when below 55%; rest-heals a *severe* (severity-2)
  limb injury to avoid its AC penalty; lets minor injuries decay.
- **Resources**: refills mana (casters) / stamina (physical) to full via abstracted
  potion gold when the pool dips below 45%, so skills stay in rotation.
- **Stats**: per-class weights — main scaling stat + vitality, plus the gear-requirement
  stat (str for heavy armor, wis for cloth).
- **Gear**: equips better usable loot when requirements are met; warriors slot a second
  one-hander as **offhand**, mages slot a **wand** offhand; enhances weapon + offhand with
  enhance-stones + gold.
- **Skills**: trains a per-class priority list with class-essence drops + gold, deliberately
  including the tracked mechanics (warrior `dual_wield`, archer `evasion`, mage
  `staff_mastery`/`wand_mastery`, priest `blunt_mastery`, etc.).
- **Mercenaries**: hires up to 2 active combat mercs once affordable, plus a couple on
  `clearing` (territory gold).

Known abstractions (documented so they're not mistaken for game rules): consumable
inventory is not modeled slot-by-slot — MP/stamina refills and broken-gear repairs are
charged as gold and applied directly; the sim keeps only the best-seen loot per slot.

## Today's baseline — 2026-08-02 (median days to win in `starlight_ruins`, ranked)

**THIS IS THE FIRST TRUSTWORTHY BASELINE.** Prior throwaway scripts reported warrior at
**536d / 71.5d / 49.1d** across three different disposable simulators — those numbers are
**NOT comparable** to this file or to each other (different, unrecorded policies). From now
on, diff against `rpg-balance-sim-results.json`.

| class        | days (median) | range        | final Lvl | turns (median) | win rate | heal-turn share |
|--------------|--------------:|--------------|----------:|---------------:|---------:|----------------:|
| archer       |         168.7 | 168–169.7    |        27 |          5,532 |    0.999 |             10% |
| paladin      |         283.7 | 279–286.6    |        27 |          9,312 |    0.990 |             46% |
| warrior      |         355.2 | 350.8–378.4  |        27 |         11,663 |    0.967 |             55% |
| mage         |         414.0 | 413.1–416.7  |        27 |         13,659 |    0.938 |             61% |
| priest       |         427.8 | 427.6–434.4  |        27 |         14,114 |    0.974 |             65% |
| dark_knight  |         493.3 | 486.5–532.4  |        27 |         16,243 |    0.919 |             65% |

Sanity: each run logs ~4,900–5,900 adventures, comfortably above the ~400-victory gate
floor (100 clears × 4 gate zones). Rankings track survivability: archer's `evasion`
passive gives a ~99.9% win rate and a tiny 10% heal share, while `dark_knight`'s
HP-cost skills push the highest heal share (65%) and lowest win rate, hence the longest run.
