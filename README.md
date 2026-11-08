# breach.os

A capture-the-flag puzzle game set on an abandoned school lab computer. The admin wiped SDCA-LAB-07 and vanished; recover ten flags to find out why. The desktop starts corrupted and heals as flags are found.

Built from the desktop shell of my midterm portfolio, which this repo used to hold. It's preserved in the tag [`portfolio-midterm-v1`](https://github.com/robertterquin/breach-os/tree/portfolio-midterm-v1).

## Run it

Needs Node 20.19 or newer.

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm install`       | Install dependencies            |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Type-check and build to `dist/` |
| `npm run preview`   | Serve the production build      |
| `npm run lint`      | Lint with oxlint                |
| `npm run format`    | Format with Prettier            |
| `npm run typecheck` | Type-check only                 |
| `npm test`          | Run the game-engine tests       |

## Project structure

Each component lives in its own folder with its stylesheet beside it.

```
src/
  main.tsx, App.tsx    entry point and the shell that picks a view
  styles/              design tokens, base styles, and repair.css (the desktop's 6 healing stages)
  lib/                 small helpers: links in the address bar, the Effects switch, scrolling
  os/                  desktop chrome: Window, MenuBar, Dock, DesktopIcon, BootScreen
  game/                the rules: challenges (flag hashes only), engine, saved progress, tests
  apps/                one folder per window; registry.ts lists them, AppContent.tsx picks one
  views/               the three layouts: desktop, list, phone
  dev/                 preview of every component at every healing stage (development only, open /?preview)
```

## Status

Phases 0–3 done: the empty desktop, the game design (kept private, since it holds the answers), the visual system, and the challenge engine. Next is Phase 4, the terminal and its file system.

The repo never contains a flag, only its SHA-256 hash in `src/game/challenges.ts`. The tests use made-up practice flags.
