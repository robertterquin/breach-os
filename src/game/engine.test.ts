// Run with `npm test`. Uses a made-up three-folder game, so the real flags never appear here.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Challenge } from './challenges.ts';
import {
  FREE_HINT_AFTER,
  gameRules,
  hashFlag,
  isCategoryOpen,
  isFinished,
  newGame,
  nextHint,
  recoveredFragments,
  repairStage,
  resultLine,
  score,
  submitFlag,
  takeHint,
  type GameState,
  type Rules,
} from './engine.ts';
import { loadGame, parseState, resetGame, saveGame } from './storage.ts';

const flag = (id: string) => `FLAG{practice_${id.replace('/', '_')}}`;

async function practiceRules(): Promise<Rules> {
  const spec: [string, Challenge['category'], number][] = [
    ['crypto/01', 'crypto', 50],
    ['crypto/02', 'crypto', 50],
    ['web/01', 'web', 100],
    ['forensics/01', 'forensics', 200],
  ];
  const challenges = await Promise.all(
    spec.map(async ([id, category, points]) => ({
      id,
      category,
      title: id,
      points,
      difficulty: 'easy' as const,
      flagHash: await hashFlag(flag(id)),
      hints: [`${id} hint 1`, `${id} hint 2`] as [string, string],
      fragment: `${id} fragment`,
    })),
  );
  return {
    challenges,
    categories: [
      { id: 'crypto', after: 0 },
      { id: 'web', after: 2 },
      { id: 'forensics', after: 1 },
    ],
  };
}

test('a new game opens only the first folder', async () => {
  const rules = await practiceRules();
  const state = newGame(1000);
  assert.equal(isCategoryOpen(state, 'crypto', rules), true);
  assert.equal(isCategoryOpen(state, 'web', rules), false);
  assert.equal(isCategoryOpen(state, 'forensics', rules), false);
  assert.equal(score(state, rules), 0);
  assert.equal(repairStage(state), 0);
});

test('flags: right, repeated, locked, wrong; spaces around the flag are ignored', async () => {
  const rules = await practiceRules();
  let state = newGame(1000);

  let result = await submitFlag(state, `  ${flag('crypto/01')} `, {}, rules);
  assert.equal(result.outcome, 'correct');
  assert.equal(result.challenge?.id, 'crypto/01');
  state = result.state;
  assert.deepEqual(state.solved, ['crypto/01']);
  assert.equal(score(state, rules), 50);

  assert.equal((await submitFlag(state, flag('crypto/01'), {}, rules)).outcome, 'already');
  assert.equal((await submitFlag(state, flag('web/01'), {}, rules)).outcome, 'locked');
  assert.equal((await submitFlag(state, 'FLAG{nope}', {}, rules)).outcome, 'wrong');
  // Case inside the braces matters.
  assert.equal(
    (await submitFlag(state, flag('crypto/02').toUpperCase(), {}, rules)).outcome,
    'wrong',
  );
});

test('folders unlock in order once enough flags are found', async () => {
  const rules = await practiceRules();
  let state = newGame(1000);
  state = (await submitFlag(state, flag('crypto/01'), {}, rules)).state;
  assert.equal(isCategoryOpen(state, 'web', rules), false);
  state = (await submitFlag(state, flag('crypto/02'), {}, rules)).state;
  assert.equal(isCategoryOpen(state, 'web', rules), true);
  assert.equal(isCategoryOpen(state, 'forensics', rules), false);
  state = (await submitFlag(state, flag('web/01'), {}, rules)).state;
  assert.equal(isCategoryOpen(state, 'forensics', rules), true);
});

test('wrong tries on a named challenge make its first hint free; the second costs 25', async () => {
  const rules = await practiceRules();
  let state = newGame(1000);
  assert.equal(nextHint(state, 'crypto/01', rules)?.cost, 25);

  for (let i = 0; i < FREE_HINT_AFTER; i++) {
    const result = await submitFlag(state, 'FLAG{guess}', { id: 'crypto/01' }, rules);
    assert.equal(result.outcome, 'wrong');
    state = result.state;
  }
  assert.equal(state.wrongTries['crypto/01'], FREE_HINT_AFTER);

  const first = takeHint(state, 'crypto/01', rules)!;
  assert.deepEqual([first.text, first.cost], ['crypto/01 hint 1', 0]);
  const second = takeHint(first.state, 'crypto/01', rules)!;
  assert.deepEqual([second.text, second.cost], ['crypto/01 hint 2', 25]);
  assert.equal(second.state.spent, 25);
  assert.equal(takeHint(second.state, 'crypto/01', rules), null, 'only two hints');
  assert.equal(takeHint(state, 'web/01', rules), null, 'no hints for a locked folder');
});

test('wrong flags without a named challenge never count toward a free hint', async () => {
  const rules = await practiceRules();
  const result = await submitFlag(newGame(1000), 'FLAG{guess}', {}, rules);
  assert.deepEqual(result.state.wrongTries, {});
});

test('score never drops below 0', async () => {
  const rules = await practiceRules();
  let state = newGame(1000);
  state = takeHint(state, 'crypto/01', rules)!.state;
  state = takeHint(state, 'crypto/02', rules)!.state;
  assert.equal(state.spent, 50);
  assert.equal(score(state, rules), 0);
});

test('a full run: finish time, story order of fragments, repair stages', async () => {
  const rules = await practiceRules();
  let state = newGame(1000);
  for (const id of ['crypto/02', 'crypto/01', 'web/01']) {
    state = (await submitFlag(state, flag(id), { now: 2000 }, rules)).state;
  }
  assert.equal(repairStage(state), 1);
  assert.equal(isFinished(state, rules), false);
  assert.equal(state.finishedAt, undefined);

  state = (await submitFlag(state, flag('forensics/01'), { now: 5000 }, rules)).state;
  assert.equal(isFinished(state, rules), true);
  assert.equal(state.finishedAt, 5000);
  assert.equal(score(state, rules), 400);
  assert.deepEqual(recoveredFragments(state, rules), [
    'crypto/01 fragment',
    'crypto/02 fragment',
    'web/01 fragment',
    'forensics/01 fragment',
  ]);
  const twelve: GameState = { ...state, solved: Array.from({ length: 12 }, (_, i) => `x${i}`) };
  assert.equal(repairStage(twelve), 5, 'stage tops out at 5');
});

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

test('progress survives a reload, and reset wipes it', async () => {
  const store = memoryStore();
  let state = loadGame(store, 1000);
  assert.deepEqual(state.solved, []);
  state = takeHint(state, 'crypto/01')!.state;
  saveGame(state, store);

  const reloaded = loadGame(store, 9999);
  assert.deepEqual(reloaded, state);

  const fresh = resetGame(store, 7000);
  assert.deepEqual(fresh.solved, []);
  assert.equal(loadGame(store, 8000).startedAt, 8000, 'nothing saved after reset');
});

test('malformed or tampered saves start a fresh game', () => {
  const ok = { solved: [], hintsTaken: {}, wrongTries: {}, spent: 0, startedAt: 1 };
  assert.notEqual(parseState(JSON.stringify(ok)), null);
  for (const bad of [
    'not json',
    'null',
    JSON.stringify({ ...ok, solved: ['crypto/99'] }),
    JSON.stringify({ ...ok, solved: ['crypto/01', 'crypto/01'] }),
    JSON.stringify({ ...ok, hintsTaken: { 'crypto/01': 3 } }),
    JSON.stringify({ ...ok, wrongTries: { 'crypto/01': -1 } }),
    JSON.stringify({ ...ok, spent: -25 }),
    JSON.stringify({ ...ok, startedAt: 'yesterday' }),
  ]) {
    assert.equal(parseState(bad), null, bad);
  }
});

test('the real game: 10 challenges, 1,300 points, unique hashes, two hints each', () => {
  const { challenges, categories } = gameRules;
  assert.equal(challenges.length, 10);
  assert.equal(new Set(challenges.map((c) => c.id)).size, 10);
  assert.equal(new Set(challenges.map((c) => c.flagHash)).size, 10);
  assert.ok(challenges.every((c) => /^[0-9a-f]{64}$/.test(c.flagHash)));
  assert.ok(challenges.every((c) => c.hints.every((h) => h.length > 0) && c.fragment.length > 0));
  assert.equal(
    challenges.reduce((sum, c) => sum + c.points, 0),
    1300,
  );
  assert.deepEqual(
    categories.map((c) => c.id),
    ['crypto', 'web', 'forensics', 'network'],
  );
  assert.ok(challenges.every((c) => c.id.startsWith(`${c.category}/`)));
});

test('the result line is spoiler-free and counts minutes and hints', async () => {
  const rules = await practiceRules();
  let state = newGame(0);
  state = takeHint(state, 'crypto/01', rules)!.state;
  for (const id of ['crypto/01', 'crypto/02', 'web/01', 'forensics/01']) {
    state = (await submitFlag(state, flag(id), { now: 54 * 60000 }, rules)).state;
  }
  const line = resultLine(state, rules);
  assert.equal(line, 'breach.os · 4/4 flags · 375 pts · 1 hint · 54 min');
  assert.doesNotMatch(line, /FLAG/);
});
