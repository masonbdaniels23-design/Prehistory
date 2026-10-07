# Cave Hunt

A single-player, top-down Ice Age hunting game drawn entirely in code in a cave painting style.
Phaser 3 + TypeScript + Vite. No image, audio or font files.

The full design lives in [docs/SPEC.md](docs/SPEC.md). The game is built milestone by milestone.

## Run

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests (Vitest)
npm run build   # typecheck + production build into dist/
```

## Controls (so far)

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Aim |
| Left click | Stab |
| R | Hunt again (after a kill) |

## Status

- [x] Milestone 1: Foundation (stone map, player, stab, deer with wander/flee)
- [ ] Milestone 2: Combat core
- [ ] Milestone 3: Hunting tools
- [ ] Milestone 4: Progression backend
- [ ] Milestone 5: Campfire hub
- [ ] Milestone 6: Mid game
- [ ] Milestone 7: Endgame and polish
