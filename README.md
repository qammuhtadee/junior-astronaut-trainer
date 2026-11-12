# Junior Astronaut Mission Trainer

NASA Space Apps Challenge 2026 - *Build a Junior Astronaut Mission Trainer*.
A 7-day Mars outpost survival game for ages 7-12. Design: [docs/design.md](docs/design.md) · Meter values: [docs/meter.md](docs/meter.md).

## Tech and build

| | |
|---|---|
| Engine | Phaser 3 (npm, bundled - not a CDN import) |
| Build tool | Vite |
| Language | Plain JavaScript (ES modules) |
| Design size | 1280 x 720, `Scale.FIT` letterboxing, `pixelArt: true` |
| Tests | Vitest (`npm test`) - game rules only, no browser needed |
| Hosting | Vercel free tier, auto-deploy from GitHub `main` |

```bash
npm install
npm run dev      # local dev server with hot reload
npm test         # rule tests (meters, checkpoints, rewind)
npm run build    # production build into dist/
```

### Deploying to Vercel
Import the GitHub repo in Vercel. It detects Vite automatically (build `npm run build`, output `dist`). No config file needed. Every push to `main` redeploys; every PR gets a preview URL.

## Folder layout

```
public/assets/        static art and audio, served as-is (grouped by type)
docs/                 design doc + meter table (source of truth for content)
src/
  main.js             Phaser config only
  config/             layout + tuning constants (no magic numbers in scenes)
  data/               scripted content as data: meter steps, station positions
  state/              GameState - pure JS, no Phaser, unit-tested
  objects/            reusable game objects (Astronaut, Station)
  scenes/             one scene per file; RoomScene holds shared room behaviour
tests/                Vitest tests
```

## Rules for contributors
1. **Content is data, not code.** Dialogue, facts, meter values and station positions live in `src/data/`. Scenes read them.
2. **One state owner.** Only `GameState` changes meters. Scenes listen to its events.
3. **Assets load once** in `PreloadScene`, never inside room or mini-game scenes.
4. **No magic numbers** - put them in `src/config/constants.js`.
5. Run `npm test` before pushing. The tests check that every canon step in meter.md is survivable and every wrong step rewinds.

## NASA data and credits
Every fact shown in game must be listed here with its NASA source URL and the date checked. Static data is never presented as live.
