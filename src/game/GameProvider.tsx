import { useEffect, useState, type ReactNode } from 'react';
import { loadGame, saveGame } from './storage';
import { GameContext } from './useGame';

/** Holds the one game in progress for every view, and saves each change in the browser. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState(() => loadGame());

  useEffect(() => {
    saveGame(game);
  }, [game]);

  return <GameContext.Provider value={{ game, setGame }}>{children}</GameContext.Provider>;
}
