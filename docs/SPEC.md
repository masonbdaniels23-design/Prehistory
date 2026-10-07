# Game Spec: Cave Painting Hunting Game (Single Player)

Read this entire file before writing any code. Build the game one milestone at a time (see "Build Milestones"). After each milestone, stop, confirm the acceptance criteria are met, commit, and summarize what was built before starting the next one.

---

## 1. Overview

A single-player, top-down browser game. The player hunts increasingly dangerous Ice Age animals, earns XP and shells (currency), levels up, and buys better weapons, clothing, traps, and charms. The main menu is a campfire scene. The whole game is drawn in a cave painting style using code only. There are no image files.

Design priorities, in order:
1. Easy to pick up. A new player should understand every mechanic within one hunt.
2. Rewarding progression. Something new unlocks at every level.
3. Each animal has one signature attack and one clear weakness.

---

## 2. Tech Stack and Working Rules

- **Phaser 3** with **TypeScript** (strict mode) and **Vite**.
- **Vitest** for unit tests on progression and economy math.
- **No image, audio, or font files.** All visuals are drawn with Phaser Graphics, RenderTextures, and text. Use a system font stack for text.
- **No networking.** Everything runs locally in the browser.
- **Save data** in `localStorage` under the key `cavehunt_save`, with a `version` field.
- **All tunable numbers live in `src/data/`** as typed TypeScript objects. Systems read from data. Never hard-code damage, health, prices, speeds, or unlock levels inside systems.
- Keep files under roughly 300 lines. Split systems into separate files.
- Do not refactor code unrelated to the current milestone.
- After each milestone, `npm run build` and `npm test` must pass.

### Folder structure

```
src/
  main.ts
  config.ts                 // canvas size, physics settings
  data/
    palette.ts
    animals.ts
    items.ts                // spears, ranged, clothing, traps, charms, cosmetics
    progression.ts          // XP curve, unlock table, tier gating
    contracts.ts
    areas.ts
  scenes/
    BootScene.ts
    HubScene.ts             // campfire main menu
    LoadoutScene.ts
    TraderScene.ts
    CaveWallScene.ts
    HuntScene.ts
    ResultsScene.ts
  entities/
    Player.ts
    Animal.ts               // base class, state machine
    behaviors/              // one file per animal behavior
    Companion.ts
    Projectile.ts
    Trap.ts
  systems/
    Combat.ts
    Awareness.ts
    WoundTrail.ts
    MapGenerator.ts
    SaveSystem.ts
    Progression.ts
    Economy.ts
    StarRating.ts
  render/
    StoneTexture.ts
    PaintBrush.ts           // rough, hand-painted line helpers
    AnimalPainter.ts
    PlayerPainter.ts
    Effects.ts              // screen shake, hit pause, telegraph flashes
  ui/
    Hud.ts
    TargetCompass.ts
    DebugPanel.ts
tests/
```

---

## 3. Art Style: Cave Painting

Everything looks like ochre and charcoal paint on a rock wall.

### Palette (`src/data/palette.ts`)

| Name | Hex | Use |
|---|---|---|
| stoneLight | #d9c4a3 | Main background |
| stoneDark | #b89f7c | Background speckles, cracks |
| ochre | #b5562b | Most animals |
| redOchre | #8e2b1d | Predators, blood trail, damage |
| yellowOchre | #d49a3a | Fire, highlights, UI accents |
| charcoal | #2b2420 | Outlines, player, rocks, trees |
| kaolin | #efe6d6 | Telegraph flashes, UI text |

### Rendering rules

- **Background:** Generate a stone texture once per hunt into a RenderTexture: base color plus random speckles, faint cracks, and soft darker blotches. Seeded so it's consistent per hunt.
- **Hand-painted look:** `PaintBrush.ts` provides helpers that draw lines and shapes with slight random jitter and uneven thickness, so nothing looks perfectly geometric. Use these for all entities.
- **True top-down view.** Each animal and the player is drawn once, facing right, inside a Container. The Container rotates to face the movement direction. No direction-specific drawings.
- **Animals:** Silhouette built from a body shape, head, and 4 legs drawn as thick strokes. Legs swing procedurally: angle = `sin(time * stepRate) * swingAmount`, scaled by current speed. Tusks, antlers, and armor plates are extra strokes in charcoal or kaolin.
- **Player:** Charcoal stick-figure-style hunter seen from above (head circle, shoulders, arms), holding the equipped spear. Equipped clothing changes body fill color and adds simple shapes (a cloak outline, fur fringe strokes). Equipped weapon tier changes spear tip color: wood (yellowOchre), flint (stoneDark), obsidian (charcoal), bone (kaolin).
- **Environment:** Rocks as charcoal blobs, trees as charcoal scribble circles, tall grass as clusters of short ochre strokes, water as stoneDark wavy lines.
- **Telegraphs:** Before any animal attack, the animal flashes a kaolin outline and shakes for the telegraph duration. Charges also draw a dashed charcoal line on the ground along the charge path. Area attacks draw a kaolin circle that fills before it hits.
- **Feedback:** Screen shake on big hits, 50 ms hit pause on player hits landing, redOchre splatter marks on damage that fade over 10 seconds.

---

## 4. Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Aim (player faces the cursor) |
| Left click (tap) | Stab with spear |
| Left click (hold) | Brace spear |
| Right click | Fire ranged weapon (throwing spear or bow) |
| Space | Dodge roll in movement direction (or aim direction if standing still) |
| E | Place trap at the player's feet |
| Esc | Pause menu (resume, abandon hunt) |
| ` (backtick) | Toggle debug panel (dev builds only) |

Disable the browser context menu on the game canvas.

---

## 5. Player

- Max health: 100. Speed: 180 px/s.
- **Stab:** 0.35 s cooldown, arc of 60 degrees in front, range 60 px.
- **Brace:** While holding left click, movement speed drops to 40%. If a charging animal hits the player during a brace, the animal takes `spearDamage x 3`, is stunned for 1.5 s, and the player takes no damage. Braced state is shown by the spear pointing forward and a kaolin glint on the tip.
- **Dodge:** 0.3 s roll, 140 px distance, invulnerable during the roll, 1.2 s cooldown.
- **Traps:** Hold E for the trap's set time to place it. Max 2 traps placed at once. Each hunt starts with the number of trap charges in the loadout (default 3).
- **Death:** Hunt ends. No shells or XP, no gear lost. Go to Results screen showing failure.

---

## 6. Gear (`src/data/items.ts`)

Every item has: `id`, `name`, `slot`, `tier`, `price`, `unlockLevel`, stats, and a short description. Four material tiers: Wood, Flint, Obsidian, Bone.

### Spears (slot: spear)

| Item | Damage | Brace window bonus | Price | Unlock level |
|---|---|---|---|---|
| Wood spear | 10 | 0 | 0 (starting) | 1 |
| Flint spear | 16 | 0 | 50 | 3 |
| Obsidian spear | 24 | +0.1 s | 300 | 13 |
| Bone spear | 34 | +0.2 s | 1000 | 25 |

### Ranged (slot: ranged, pick one)

| Item | Type | Damage | Cooldown | Projectile speed | Price | Unlock level |
|---|---|---|---|---|---|---|
| Wood javelin | Throw | 18 | 1.2 s | 500 | 0 (starting) | 1 |
| Short bow | Bow | 5 | 0.4 s | 700 | 30 | 2 |
| Flint javelin | Throw | 28 | 1.2 s | 520 | 60 | 5 |
| Flint bow | Bow | 8 | 0.4 s | 720 | 60 | 7 |
| Obsidian atlatl | Throw | 42 | 1.1 s | 650 | 320 | 15 |
| Recurve bow | Bow | 12 | 0.35 s | 760 | 320 | 17 |
| Bone atlatl | Throw | 60 | 1.0 s | 700 | 1100 | 26 |
| Composite bow | Bow | 17 | 0.3 s | 800 | 1100 | 27 |

### Clothing (slot: clothing)

Protection is percent damage reduction.

| Item | Protection | Perk | Price | Unlock level |
|---|---|---|---|---|
| Hide wraps | 0% | None | 0 (starting) | 1 |
| Leather | 10% | None | 60 | 5 |
| Wolf pelt | 15% | Animal awareness rings 30% smaller | 250 | 11 |
| Bear hide | 25% | Immune to knockback | 500 | 18 |
| Mammoth fur | 35% | +20 max health | 1200 | 28 |

### Traps (slot: trap, pick one type per hunt)

| Item | Set time | Effect | Price | Unlock level |
|---|---|---|---|---|
| Snare | 1.0 s | Roots the first animal that steps on it for 2.5 s (bosses 1 s) | 0 (starting) | 1 |
| Pit trap | 1.5 s | 40 damage and holds the animal for 3 s (bosses 1.5 s) | 80 | 6 |
| Fire trap | 1.2 s | 100 px fire zone for 6 s. Animals path around it. Reveals hidden animals within 200 px | 200 | 14 |

### Charms (slot: charm)

| Item | Effect | Price | Unlock level |
|---|---|---|---|
| Quick Feet | Dodge cooldown -20% | 40 | 4 |
| Trapper | Trap set time -50% | 70 | 8 |
| Haggler | +15% shells per hunt | 120 | 10 |
| Thick Skin | +15 max health | 300 | 16 |
| Hunter's Eye | Ranged damage +15% | 400 | 19 |
| Steady Hands | Brace window +50% | 500 | 22 |
| Apex | All damage +10% | 1500 | 29 |

### Other unlocks

- **Large trap kit** (level 23, 400 shells): +1 trap charge per hunt. Permanent upgrade.
- **Wolf companion** (level 12, 350 shells): Follows the player, attacks the player's last damaged target, draws aggro. 60 health, 6 damage per bite every 0.8 s, respawns next hunt if killed. **Companion training** (level 20, 600 shells): damage +50%, health +50%.
- **Cosmetics** (face paints and body markings, no stats): unlocks at levels 9, 21, 24, and 30, priced 50 to 300. Shown as kaolin or redOchre marks on the player sprite.

---

## 7. Animals (`src/data/animals.ts`)

Each animal definition includes: `id`, `name`, `tier`, `health`, `speed`, `attack` data, `awarenessRadius`, `behavior` (behavior id), `xp`, `shells`, `size`, `color`, and `paintingShape` parameters.

All animals use a shared state machine in `Animal.ts`: `idle`, `wander`, `alert`, `flee`, `chase`, `telegraph`, `attack`, `recover`, `stunned`, `trapped`, `dead`. Each behavior file decides transitions.

### Shared rules

- **Awareness ring:** Faint dashed circle around each animal at its `awarenessRadius`. If the player enters it, the animal switches to `alert` (prey) or `chase` (predators). Wolf pelt shrinks rings. Attacking an animal always makes it aware.
- **Wounded trail:** Animals below 50% health that flee leave redOchre dots every 30 px. Dots fade after 20 s.
- **Prey fleeing:** Fleeing animals run directly away from the player and steer around obstacles. They stop fleeing after 6 s without being hit and return to `wander`.
- **Map bounds:** Animals never leave the map.

### Roster

| Tier | Animal | HP | Speed | Signature move | Weakness | XP | Shells |
|---|---|---|---|---|---|---|---|
| 1 | Hare | 15 | 220 | Zigzag flee, no attack | Bow, snare | 40 | 10 |
| 1 | Deer | 30 | 200 | Bolts the moment you enter its ring, no attack | Sneak close, throw | 50 | 12 |
| 2 | Giant elk | 70 | 170 | Flees; when cornered against an obstacle or bounds, antler swipe (15 dmg, 0.5 s telegraph, 80 px arc) | Snare, then stab | 90 | 30 |
| 2 | Hell pig | 90 | 120 / charge 320 | Straight-line charge, 20 dmg, 0.7 s telegraph, stops after 400 px or hitting an obstacle, then 1.2 s recover | Brace | 100 | 32 |
| 3 | Dire wolves (pack of 3) | 40 each | 190 | Circle player at 150 px, one wolf lunges at a time (10 dmg, 0.4 s telegraph), others keep circling | Dodge lunge, stab during recover | 180 total | 70 total |
| 3 | Terror bird | 80 | 260 | Sprints to player, 3-kick combo (12 dmg each, 0.4 s telegraph) | Snare roots it | 180 | 70 |
| 3 | Glyptodont | 180 | 70 | Tail spin hitting 360 degrees around it (18 dmg, 0.8 s telegraph). Front 120 degrees takes 80% less damage | Attack from behind | 200 | 75 |
| 4 | Cave bear | 260 | 140 | Ground slam, 30 dmg in 90 px radius, 0.9 s telegraph. Below 30% HP enrages: +30% speed, +30% damage, red tint | Pit trap during enrage | 320 | 140 |
| 4 | Smilodon | 160 | 230 / pounce 450 | Starts hidden in tall grass (invisible). Pounces from up to 250 px, 28 dmg, 0.3 s telegraph. Re-hides in grass after attacking | Fire trap reveals it | 330 | 145 |
| 5 | Woolly rhino | 320 | 110 / charge 380 | Long charge, 30 dmg plus 150 px knockback, 0.8 s telegraph, 600 px max | Brace, or lead into a pit | 520 | 250 |
| 5 | Woolly mammoth | 600 | 110 / charge 300 | Tusk sweep (35 dmg, 120 degree arc, 1.0 s telegraph) and stampede charge (40 dmg, 1.0 s telegraph) | Pit trap plus ranged | 560 | 270 |
| Boss | Mammoth matriarch | 1200 | 120 / charge 320 | All mammoth moves. At 66% and 33% HP, roars (0.5 s stun if within 200 px) and calls 2 juvenile mammoths (150 HP, charge only). Below 33%, adds a stomp shockwave ring (30 dmg) | Everything | 1200 | 600 |

All numbers are starting values to be tuned through playtesting.

### Legendary variants

At player level 20+, open hunts have a 10% chance to replace one tier 1 to 4 animal with a legendary version: 2x health, 1.25x damage, kaolin scar markings, 3x XP and shells, and a separate legendary entry on the cave wall.

---

## 8. Hunts

### Areas (`src/data/areas.ts`)

| Area | Tiers | Features | Unlock |
|---|---|---|---|
| Steppe | 1 to 2 | Open ground, scattered rocks | Start |
| Forest | 2 to 4 | Dense trees, tall grass patches | Tier 2 unlocked |
| River valley | 3 to 4 | Water bands (slow movement 50%), rocks, grass | Tier 3 unlocked |
| Tundra | 5 and boss | Open, sparse rocks, background tinted lighter | Tier 5 unlocked |

### Map generation

- World size 2400 x 2400 px, seeded per hunt.
- `MapGenerator.ts` places features by area: rocks and trees as static obstacles, tall grass as non-blocking hide zones, water as slow zones.
- Player spawns at the map edge. Target spawns at least 900 px away.
- 3 to 6 ambient tier 1 animals spawn in tier 1 to 3 areas. Killing them gives normal rewards.

### Hunt types

- **Contract hunt:** One specific target. The hunt ends when the target dies.
- **Open hunt:** 3 to 5 random animals from unlocked tiers for that area. Ends when the player walks to the exit marker (charcoal arrow at the spawn point) or all animals are dead.

### HUD

- Health bar, top left.
- Ranged cooldown, dodge cooldown, trap charges, bottom center.
- **Target compass:** Arrow at the screen edge pointing to the contract target (or nearest living animal in open hunts) when it's off screen.
- Hunt timer, top right.

---

## 9. Progression (`src/data/progression.ts`)

### XP curve

`xpToNext(level) = round(30 + 20 * level ^ 1.4)`. Level cap 30. This should give a level up after almost every hunt early on and around 3 to 4 hunts per level near the cap.

### Shells

`shellsEarned = baseShells x starMultiplier x (1 + charmBonus)`.

- **Stars:** 1 star for completing. 2 stars for meeting either the par time or taking less than 25% of max health in damage. 3 stars for both. Par time per contract is set in `contracts.ts`.
- **Star multiplier:** 1.0 / 1.25 / 1.5 for 1 / 2 / 3 stars. Applies to XP too.
- **First kill bonus:** First kill of each species gives 3x base shells and adds its painting to the cave wall.

### Tier gating

A tier's contracts appear when **both** are true: the player has reached the tier's level, and the previous tier's final chain contract is completed.

| Tier | Level required |
|---|---|
| 1 | 1 |
| 2 | 6 |
| 3 | 11 |
| 4 | 18 |
| 5 | 25 |
| Boss | 30 |

### Unlock table

Every level unlocks at least one thing. The trader shows newly unlocked items with a yellowOchre "new" mark.

| Level | Unlock |
|---|---|
| 1 | Wood spear, wood javelin, hide wraps, snare, tier 1 contracts |
| 2 | Short bow |
| 3 | Flint spear |
| 4 | Quick Feet charm |
| 5 | Flint javelin, leather |
| 6 | Pit trap, tier 2 contracts, Forest area |
| 7 | Flint bow |
| 8 | Trapper charm |
| 9 | Cosmetic: ochre face paint |
| 10 | Haggler charm |
| 11 | Wolf pelt, tier 3 contracts, River valley area |
| 12 | Wolf companion |
| 13 | Obsidian spear |
| 14 | Fire trap |
| 15 | Obsidian atlatl |
| 16 | Thick Skin charm |
| 17 | Recurve bow |
| 18 | Bear hide, tier 4 contracts |
| 19 | Hunter's Eye charm |
| 20 | Companion training, legendary variants begin |
| 21 | Cosmetic: charcoal hand prints |
| 22 | Steady Hands charm |
| 23 | Large trap kit |
| 24 | Cosmetic: red ochre war stripes |
| 25 | Bone spear, tier 5 contracts, Tundra area |
| 26 | Bone atlatl |
| 27 | Composite bow |
| 28 | Mammoth fur |
| 29 | Apex charm |
| 30 | Matriarch boss contract, cosmetic: kaolin full-body markings |

### Contract chains (`src/data/contracts.ts`)

Each contract has: `id`, `tier`, `title`, `target`, `area`, `parTime`, an optional `condition`, and `isChainFinale`. Contracts can be replayed after completion for rewards (first-completion pays a 2x bonus).

| Tier | Chain |
|---|---|
| 1 | Hunt a hare. Hunt a deer. **Finale:** Hunt a deer without taking damage. |
| 2 | Hunt a hell pig. Hunt a giant elk. **Finale:** Kill a hell pig with a brace counter. |
| 3 | Hunt the dire wolf pack. Hunt a terror bird. **Finale:** Hunt a glyptodont. |
| 4 | Hunt a cave bear. Hunt a smilodon. **Finale:** Kill a cave bear while it's in a pit trap. |
| 5 | Hunt a woolly rhino. Hunt a woolly mammoth. **Finale:** Hunt two woolly mammoths in one hunt. |
| Boss | The Matriarch. |

Conditions are checked by the hunt and shown on the Results screen.

---

## 10. Scenes

### HubScene (campfire main menu)

A static side-view scene (this is the one non-top-down scene), drawn in the cave painting style:

- Rock wall background using the stone texture.
- **Fire** in the center: animated flickering flame shapes in yellowOchre and redOchre, with a soft light circle that pulses. Sparks float upward.
- **Player character** sitting on a log next to the fire, drawn side-on, showing equipped clothing, spear, and cosmetic. Click: opens LoadoutScene.
- **Trader** on the left, sitting behind a blanket of goods. Click: opens TraderScene.
- **Cave wall** section on the right with small paintings of killed species. Click: opens CaveWallScene.
- **Trail** leading off the right edge into charcoal trees. Click: opens hunt selection (list of available contracts and open hunts by area).
- Each object shows a kaolin label on hover.
- Top bar: level, XP bar, shells.

### LoadoutScene
Slots for spear, ranged, trap, clothing, charm, cosmetic. Click a slot to see owned items for it. Preview of the player sprite updates live.

### TraderScene
Grid of items grouped by slot. Locked items show as faint outlines with "Level X". Unlocked but unowned items show price and a Buy button. Owned items show "Owned". New unlocks get a "new" mark until viewed.

### CaveWallScene
A large rock wall. Each species has a fixed spot. Killed species are painted in full with kill count and best star rating. Unkilled species show as faint charcoal outlines. Legendary kills get a separate kaolin painting next to the normal one.

### HuntScene
The top-down hunt described in sections 5 to 8.

### ResultsScene
Shows success or failure, target, time, damage taken, stars earned (animate them in one at a time), XP gained with the XP bar filling, shells earned, first-kill bonus, contract conditions met, and any level ups with their unlocks listed. Button back to the hub.

---

## 11. Save Data (`SaveSystem.ts`)

```ts
interface SaveData {
  version: 1;
  level: number;
  xp: number;
  shells: number;
  owned: string[];                  // item ids
  equipped: {
    spear: string;
    ranged: string;
    trap: string;
    clothing: string;
    charm: string | null;
    cosmetic: string | null;
  };
  kills: Record<string, { count: number; bestStars: number; legendaryCount: number }>;
  contractsCompleted: string[];
  seenUnlocks: string[];            // for the "new" marks
  upgrades: { largeTrapKit: boolean; companion: boolean; companionTraining: boolean };
}
```

Save after every hunt and every purchase or loadout change. If the save is missing or fails to parse, start a new game with starting gear. Wrap all storage access in try/catch.

---

## 12. Debug Panel

Toggled with backtick in dev builds:
- +1000 shells
- +1 level
- Unlock everything
- Spawn any animal at the cursor
- Toggle invincibility
- Show animal state labels and awareness rings at full opacity
- Reset save

---

## 13. Build Milestones

Each milestone must be fully playable before moving on. Use simple placeholder shapes only where a milestone says so; otherwise follow the art rules.

### Milestone 1: Foundation
- Vite + Phaser + TypeScript project, strict mode, Vitest set up.
- Palette and PaintBrush helpers, stone background texture.
- HuntScene with a 2400 x 2400 world, camera following the player, map bounds.
- Player movement, aiming, stab, health.
- One deer with wander and flee behavior.
- **Done when:** You can walk around a painted stone map and kill a deer with the spear.

### Milestone 2: Combat core
- Animal base class and state machine.
- Hare, deer, giant elk, hell pig behaviors.
- Telegraphs, brace, dodge, damage, player death, hit effects.
- Basic ResultsScene (success or failure only).
- **Done when:** You can brace-counter a hell pig charge and die to one if you don't dodge.

### Milestone 3: Hunting tools
- Ranged weapons (javelin and bow) with projectiles.
- Snare and pit traps.
- Awareness rings, wounded trail, target compass, HUD.
- MapGenerator for the Steppe.
- **Done when:** You can snare a hare, sneak up on a deer, and pit-trap a hell pig.

### Milestone 4: Progression backend
- SaveSystem, Progression (XP curve, levels, unlocks), Economy (shells, prices), StarRating.
- All data files for items, unlocks, contracts.
- Full ResultsScene with stars, XP, shells, level ups.
- Unit tests for XP curve, shell math, star rating, tier gating.
- **Done when:** Completing hunts earns XP and shells that persist after a page refresh.

### Milestone 5: Campfire hub
- HubScene, LoadoutScene, TraderScene, CaveWallScene, hunt selection.
- Equipped gear changes the player sprite in the hub and in hunts.
- Debug panel.
- **Done when:** The full loop works: hub, pick contract, hunt, results, buy gear at the trader, equip it, hunt again.

### Milestone 6: Mid game
- Dire wolf pack, terror bird, glyptodont, cave bear, smilodon.
- Fire trap, tall grass hiding, wolf companion.
- Forest and River valley areas.
- Charms.
- **Done when:** Tiers 1 to 4 are fully playable from a fresh save.

### Milestone 7: Endgame and polish
- Woolly rhino, woolly mammoth, mammoth matriarch boss.
- Tundra area, legendary variants, cosmetics.
- Polish pass: screen shake, hit pause, splatter, fire animation, star animations.
- **Done when:** A fresh save can reach level 30 and beat the matriarch.

---

## 14. Out of Scope

Do not build any of these unless asked: multiplayer or networking, sound files, mobile touch controls, procedural quest text, crafting from materials, stamina, weather.
