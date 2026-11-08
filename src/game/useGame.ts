import { createContext, useContext } from 'react';
import type { GameState } from './engine';

export type GameContextValue = {
  game: GameState;
  setGame: (next: GameState) => void;
};

export const GameContext = createContext<GameContextValue | null>(null);

/** The game in progress, shared by every view (see GameProvider). */
export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside <GameProvider>');
  return value;
}
