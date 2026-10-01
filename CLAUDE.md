# Coconut Island Tycoon (2.5D)

Stack: Vite + TypeScript (strict) + Phaser 3. Spec: `../Coconut_Island_Tycoon_2.5D_PRD_TRD_MVP.md`.

## Rules
- Logic is 2D (x/y). 2.5D look = iso-style sprites + `setDepth(y)` (origin bottom-center).
- Scenes (`scenes/`) orchestrate; logic lives in `systems/`, `world/`, `workers/`, `player/`.
- Player never reads input directly: `KeyboardInput`/`TouchInput` -> `PlayerController` -> `Player`.
- World (`IslandScene`) and UI (`UIScene`) are separate; they talk via `core/EventBus.ts`.
- All balance numbers live in `src/data/`. New islands = data in `data/islands.ts`.
- Money flows only through `EconomySystem` (never negative / NaN / Infinity). Buy order: check -> deduct -> apply -> save.
- Save data is versioned (`SAVE_VERSION`); add a migration step in `SaveSystem` when changing the shape.
- Keep `any` out, remove unused code, run `npm run build` after every change.

## Regression checklist
start game, player visible, WASD + arrows, camera follow, tree collision, harvest, sell, coin up,
upgrade, worker moves, save, reload restore, blur while holding a key must stop movement.

## Commands
`npm run dev` / `npm run build`

## Multi-island + side content
- Islands are data (`data/islands.ts`); travel = boat at the dock (`IslandScene.board`) charging `unlockCost`. Upgrades/workers carry over; `stats.islandEarned` and `questIndex` reset per island. Quests are per island (`data/quests.ts`).
- Golden trees (`kind: 'golden'`) give rare golden coconuts (player only, workers skip them).
- Temple (optional side content, `TempleScene` + `temple/`, one per island in `data/temple.ts`): jump course (bonus coin gems) -> island guardian boss. Beating it grants that island's relic (`data/collectibles.ts`, +5% sell price each). Keep it OPTIONAL: do not gate island progress on it.
- Save v4: `completedIslands`, `golden`, `collectibles`, `stats.islandEarned/golden` (v1 saves migrate in `SaveSystem`).
- Dev-only `window.__game` exposes the Phaser game for headless tests.
- Relics from earlier islands are boss abilities (keys 1/2/3 or tap): Sun Beam (pierces armor), Moon Shield, Star Stun. Island 2+ guardians get Stone Armor in phase 2, so relics help a lot but are not strictly required.
- Island 3 (Jungle): `autoSellStorage: false` -> Carriers (`workers/Carrier.ts`, `gameState.data.carriers`, hired at the hire hut only on such islands) haul storage -> sell stand. Save v5 adds `carriers`.
