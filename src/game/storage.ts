// Saves progress in the browser. Saved data can be edited by the player or left over from an
// older version, so it is checked on load; anything malformed means a fresh game.
import { gameRules, newGame, type GameState } from './engine.ts';

const STORAGE_KEY = 'breach-os:progress';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

function isCountMap(
  value: unknown,
  ids: Set<string>,
  max = Infinity,
): value is Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.entries(value).every(([id, n]) => ids.has(id) && isCount(n) && n <= max);
}

/** The saved state if it is valid for these rules, else null. */
export function parseState(raw: string | null, rules = gameRules): GameState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const s = data as Record<string, unknown>;
  const ids = new Set(rules.challenges.map((c) => c.id));
  const solved = s.solved;
  const valid =
    Array.isArray(solved) &&
    solved.every((id) => typeof id === 'string' && ids.has(id)) &&
    new Set(solved).size === solved.length &&
    isCountMap(s.hintsTaken, ids, 2) &&
    isCountMap(s.wrongTries, ids) &&
    isCount(s.spent) &&
    typeof s.startedAt === 'number' &&
    (s.finishedAt === undefined || typeof s.finishedAt === 'number');
  if (!valid) return null;
  return {
    solved: solved as string[],
    hintsTaken: s.hintsTaken as Record<string, number>,
    wrongTries: s.wrongTries as Record<string, number>,
    spent: s.spent as number,
    startedAt: s.startedAt as number,
    ...(s.finishedAt !== undefined && { finishedAt: s.finishedAt as number }),
  };
}

function defaultStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The saved game, or a new one when nothing valid is saved. */
export function loadGame(store = defaultStore(), now = Date.now()): GameState {
  try {
    return parseState(store?.getItem(STORAGE_KEY) ?? null) ?? newGame(now);
  } catch {
    return newGame(now);
  }
}

export function saveGame(state: GameState, store = defaultStore()): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked or full; progress then lasts only for this visit.
  }
}

/** Wipes saved progress and returns a fresh game (the terminal's `reset`). */
export function resetGame(store = defaultStore(), now = Date.now()): GameState {
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing saved to remove.
  }
  return newGame(now);
}
