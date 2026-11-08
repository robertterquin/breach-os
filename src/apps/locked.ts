import { isCategoryOpen, type GameState } from '../game/engine';
import type { AppMeta } from './registry';

/** A challenge folder whose category hasn't unlocked yet. */
export const isLocked = (app: AppMeta, game: GameState) =>
  !!app.category && !isCategoryOpen(game, app.category);
