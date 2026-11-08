import { challenges } from '../game/challenges';
import { isCategoryOpen, isFinished, solvedCount, type GameState } from '../game/engine';
import type { AppMeta } from './registry';

/** A challenge folder whose category hasn't unlocked yet. */
export const isLocked = (app: AppMeta, game: GameState) =>
  !!app.category && !isCategoryOpen(game, app.category);

/** admin_message.txt only appears once all 10 flags are found. */
export const isShown = (app: AppMeta, game: GameState) => !app.endingOnly || isFinished(game);

/** Icon and list label: "web (locked)", or a folder's progress like "crypto 2/3". */
export function iconLabel(app: AppMeta, game: GameState): string {
  if (!app.category) return app.label;
  if (isLocked(app, game)) return `${app.label} (locked)`;
  const total = challenges.filter((c) => c.category === app.category).length;
  return `${app.label} ${solvedCount(game, app.category)}/${total}`;
}

export const windowTitle = (app: AppMeta, game: GameState) =>
  isLocked(app, game) ? `${app.label}/ - Access denied` : app.windowTitle;
