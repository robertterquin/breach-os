# breach.os

A capture-the-flag puzzle game set on an abandoned school lab computer. The admin wiped SDCA-LAB-07 and vanished; recover ten flags to find out why. The desktop starts corrupted and heals as flags are found.

Built from the desktop shell of [portfolio-os](https://github.com/robertterquin/portfolio-os) (tag `portfolio-midterm-v1`).

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

## Project structure

Each component lives in its own folder with its stylesheet beside it.

```
src/
  main.tsx, App.tsx    entry point and the shell that picks a view
  styles/              design tokens and base page styles
  lib/                 small helpers: links in the address bar, theme, wallpaper, scrolling
  os/                  desktop chrome: Window, MenuBar, Dock, DesktopIcon, BootScreen
  apps/                one folder per window; registry.ts lists them, AppContent.tsx picks one
  views/               the three layouts: desktop, list, phone
```

## Status

Phase 0 done: an empty desktop with the terminal. Next is Phase 1, the game design document.
