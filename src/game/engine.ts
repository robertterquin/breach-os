// The game's rules, independent of any screen. Every function is pure: it takes a state and
// returns a new one. Rules (challenges and unlock order) default to the real game and can be
// swapped for test fixtures, so the tests never need the real flags.
// Relative imports carry .ts so Node's test runner can load this file directly.
import {
  categories as gameCategories,
  challenges as gameChallenges,
  type Category,
  type Challenge,
} from './challenges.ts';

export const HINT_COST = 25;
/** After this many wrong flags on one challenge, its first hint is free. */
export const FREE_HINT_AFTER = 3;

export type GameState = {
  /** Solved challenge ids, in the order they were found. */
  solved: string[];
  /** Hints taken per challenge id: 0, 1 or 2. */
  hintsTaken: Record<string, number>;
  /** Wrong flags per challenge id, counted only when the player named the challenge. */
  wrongTries: Record<string, number>;
  /** Points paid for hints so far. */
  spent: number;
  startedAt: number;
  finishedAt?: number;
};

export type Rules = {
  challenges: Challenge[];
  categories: { id: Category; after: number }[];
};

export const gameRules: Rules = { challenges: gameChallenges, categories: gameCategories };

export type SubmitOutcome = 'correct' | 'wrong' | 'already' | 'locked' | 'unknown';

export function newGame(now = Date.now()): GameState {
  return { solved: [], hintsTaken: {}, wrongTries: {}, spent: 0, startedAt: now };
}

export function findChallenge(id: string, rules = gameRules): Challenge | undefined {
  return rules.challenges.find((c) => c.id === id);
}

export function solvedCount(state: GameState, category: Category, rules = gameRules): number {
  return rules.challenges.filter((c) => c.category === category && state.solved.includes(c.id))
    .length;
}

/** The first category is open from the start; each next one after enough flags in the one before. */
export function isCategoryOpen(state: GameState, category: Category, rules = gameRules): boolean {
  const index = rules.categories.findIndex((c) => c.id === category);
  if (index <= 0) return index === 0;
  const before = rules.categories.at(index - 1)!;
  return solvedCount(state, before.id, rules) >= rules.categories.at(index)!.after;
}

export function isChallengeOpen(state: GameState, id: string, rules = gameRules): boolean {
  const challenge = findChallenge(id, rules);
  return !!challenge && isCategoryOpen(state, challenge.category, rules);
}

/** SHA-256 of the trimmed input, as lowercase hex. Case inside the braces matters. */
export async function hashFlag(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks a flag. With `id` (a challenge window), only that challenge counts and a wrong flag
 * adds to its tries. Without it (the terminal's `submit FLAG{...}`), any open challenge can match.
 */
export async function submitFlag(
  state: GameState,
  input: string,
  options: { id?: string; now?: number } = {},
  rules = gameRules,
): Promise<{ state: GameState; outcome: SubmitOutcome; challenge?: Challenge }> {
  const hash = await hashFlag(input);
  const now = options.now ?? Date.now();

  if (options.id) {
    const challenge = findChallenge(options.id, rules);
    if (!challenge) return { state, outcome: 'unknown' };
    if (state.solved.includes(challenge.id)) return { state, outcome: 'already', challenge };
    if (!isChallengeOpen(state, challenge.id, rules))
      return { state, outcome: 'locked', challenge };
    if (hash === challenge.flagHash) return solve(state, challenge, now, rules);
    const wrongTries = {
      ...state.wrongTries,
      [challenge.id]: (state.wrongTries[challenge.id] ?? 0) + 1,
    };
    return { state: { ...state, wrongTries }, outcome: 'wrong', challenge };
  }

  const match = rules.challenges.find((c) => c.flagHash === hash);
  if (!match) return { state, outcome: 'wrong' };
  if (state.solved.includes(match.id)) return { state, outcome: 'already', challenge: match };
  if (!isChallengeOpen(state, match.id, rules))
    return { state, outcome: 'locked', challenge: match };
  return solve(state, match, now, rules);
}

function solve(state: GameState, challenge: Challenge, now: number, rules: Rules) {
  const solved = [...state.solved, challenge.id];
  const finishedAt = solved.length === rules.challenges.length ? now : state.finishedAt;
  return {
    state: { ...state, solved, finishedAt },
    outcome: 'correct' as const,
    challenge,
  };
}

/** The next hint for a challenge and what it would cost, or null when none is available. */
export function nextHint(
  state: GameState,
  id: string,
  rules = gameRules,
): { text: string; cost: number; number: 1 | 2 } | null {
  const challenge = findChallenge(id, rules);
  if (!challenge || state.solved.includes(id) || !isChallengeOpen(state, id, rules)) return null;
  const taken = state.hintsTaken[id] ?? 0;
  if (taken >= challenge.hints.length) return null;
  const free = taken === 0 && (state.wrongTries[id] ?? 0) >= FREE_HINT_AFTER;
  return { text: challenge.hints[taken], cost: free ? 0 : HINT_COST, number: taken === 0 ? 1 : 2 };
}

/** Takes the next hint, paying its cost. Returns null when there is no hint to take. */
export function takeHint(
  state: GameState,
  id: string,
  rules = gameRules,
): { state: GameState; text: string; cost: number } | null {
  const hint = nextHint(state, id, rules);
  if (!hint) return null;
  const hintsTaken = { ...state.hintsTaken, [id]: (state.hintsTaken[id] ?? 0) + 1 };
  return {
    state: { ...state, hintsTaken, spent: state.spent + hint.cost },
    text: hint.text,
    cost: hint.cost,
  };
}

/** Points for solved challenges minus hints paid, never below 0. */
export function score(state: GameState, rules = gameRules): number {
  const earned = rules.challenges
    .filter((c) => state.solved.includes(c.id))
    .reduce((sum, c) => sum + c.points, 0);
  return Math.max(0, earned - state.spent);
}

/** How healed the desktop looks: one stage per two flags, 0 to 5 (styles/repair.css). */
export function repairStage(state: GameState): number {
  return Math.min(5, Math.floor(state.solved.length / 2));
}

export function isFinished(state: GameState, rules = gameRules): boolean {
  return state.solved.length === rules.challenges.length;
}

/** Recovered note lines, in story order (challenge order), not the order found. */
export function recoveredFragments(state: GameState, rules = gameRules): string[] {
  return rules.challenges.filter((c) => state.solved.includes(c.id)).map((c) => c.fragment);
}
