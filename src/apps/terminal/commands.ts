// The terminal's commands. Pure apart from the callbacks in Context, so a whole game can be
// played in tests. Relative imports carry .ts so Node's test runner can load this file.
import { categories, challenges, type Category } from '../../game/challenges.ts';
import {
  findChallenge,
  hintsUsed,
  isCategoryOpen,
  isFinished,
  lockReason,
  nextHint,
  repairStage,
  score,
  solvedCount,
  submitFlag,
  takeHint,
  newGame,
  type GameState,
} from '../../game/engine.ts';
import { apps, type AppId } from '../registry.ts';
import * as decoders from './decode.ts';
import { extractStrings, pageAt, readText, root, type FileNode, type Node } from './files.ts';

export type Line = { kind: 'in' | 'out' | 'err'; text: string; prompt?: string };

/** Asks the app to replay the boot sequence. */
export const REBOOT_EVENT = 'breach-os:reboot';

export type Context = {
  game: GameState;
  setGame: (next: GameState) => void;
  /** Current folder as names from home, e.g. ['crypto']. */
  cwd: string[];
  setCwd: (next: string[]) => void;
  openApp: (id: AppId) => void;
  /** Replays the boot sequence (the hidden reboot command). */
  reboot: () => void;
};

/** What `run` returns: lines to print, or 'clear' to wipe the screen. */
export type Result = string[] | { error: string } | 'clear';

export const promptFor = (cwd: string[]) => ['~', ...cwd].join('/') + ' $';

const help = [
  'Files',
  '  ls [-a] [folder]      list files (-a shows hidden ones)',
  '  cd <folder>           move into a folder; cd .. goes back',
  '  cat <file>            print a file',
  '  strings <file>        keep only the readable text in a binary file',
  '  exif <file>           show a photo’s properties',
  '  grep <text> <file>    print only the lines that contain text',
  '  curl <address>        fetch a page, e.g. curl lab07.local/admin',
  'Decoding',
  '  decode <type> <text>  caesar <shift>, base64, base32, vigenere <key>, reverse, url, hex',
  'Game',
  '  submit <flag>         check a flag, e.g. submit FLAG{...}',
  '  hint <challenge>      get a hint, e.g. hint crypto/01 (costs points)',
  '  status                flags, score and locked folders',
  '  reset                 start the game over',
  'Other',
  '  open <app>  date  clear',
];

type Found = { node: Node; path: string[] } | { locked: Category } | null;

/** Follows a path from the current folder; stops at the first locked folder on the way. */
function lookup(ctx: Context, raw = ''): Found {
  const segments = raw.startsWith('~') || raw.startsWith('/') ? [] : [...ctx.cwd];
  for (const part of raw.replace(/^~/, '').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') segments.pop();
    else segments.push(part);
  }
  let node: Node = root;
  for (const name of segments) {
    if (node.kind !== 'dir') return null;
    const child: Node | undefined = node.children.find((c) => c.name === name);
    if (!child) return null;
    if (child.kind === 'dir' && child.category && !isCategoryOpen(ctx.game, child.category)) {
      return { locked: child.category };
    }
    node = child;
  }
  return { node, path: segments };
}

/** Finds a file for commands like cat, or returns the error to print. */
function fileAt(
  ctx: Context,
  command: string,
  raw: string | undefined,
): { error: string } | { file: FileNode } {
  if (!raw) return { error: `${command}: which file?` };
  const found = lookup(ctx, raw);
  if (!found) return { error: `${command}: ${raw}: no such file` };
  if ('locked' in found) {
    return {
      error: `${command}: ${found.locked}/ is locked; ${lockReason(ctx.game, found.locked)}.`,
    };
  }
  if (found.node.kind === 'dir') return { error: `${command}: ${raw} is a folder; try ls ${raw}` };
  return { file: found.node };
}

/** The text after the first `skip` words, spacing kept, e.g. the cipher text after `decode caesar 3`. */
const rest = (input: string, skip: number) =>
  input.trim().replace(new RegExp(`^(\\S+\\s+){${skip}}`), '');

async function submit(args: string[], ctx: Context): Promise<Result> {
  // `submit FLAG{...}` or `submit crypto/03 FLAG{...}` (the second counts wrong tries for hints).
  const named = args.length > 1 && findChallenge(args[0]) ? args[0] : undefined;
  const flag = named ? args.slice(1).join(' ') : args.join(' ');
  if (!flag) return { error: 'submit: which flag? e.g. submit FLAG{...}' };

  const before = ctx.game;
  const { state, outcome, challenge } = await submitFlag(before, flag, { id: named });
  ctx.setGame(state);

  if (outcome === 'wrong')
    return { error: '✕ Not the flag. Check every character, then try again.' };
  if (outcome === 'unknown') return { error: `submit: no challenge called ${named}` };
  if (outcome === 'already') return [`Already solved: ${challenge!.id}.`];
  if (outcome === 'locked') {
    return {
      error: `That flag is real, but ${challenge!.category}/ is still locked. Come back later.`,
    };
  }

  const out = [
    `✓ Correct: ${challenge!.id} ${challenge!.title}. +${challenge!.points} pts.`,
    `Fragment recovered. Check notes.txt.`,
  ];
  for (const { id } of categories) {
    if (!isCategoryOpen(before, id) && isCategoryOpen(state, id)) out.push(`Unlocked: ${id}/`);
  }
  if (repairStage(state) > repairStage(before)) out.push('Repairing display drivers…');
  if (isFinished(state)) out.push('All 10 flags recovered. Read notes.txt to the end.');
  return out;
}

function hint(args: string[], ctx: Context): Result {
  const id = args[0];
  if (!id) return { error: 'hint: which challenge? e.g. hint crypto/01' };
  const challenge = findChallenge(id);
  if (!challenge) return { error: `hint: no challenge called ${id}. Try ls to see the files.` };
  if (ctx.game.solved.includes(id)) return [`${id} is already solved.`];
  if (!isCategoryOpen(ctx.game, challenge.category)) {
    return {
      error: `hint: ${challenge.category}/ is locked; ${lockReason(ctx.game, challenge.category)}.`,
    };
  }
  const next = nextHint(ctx.game, id);
  if (!next) return [`No hints left for ${id}.`];
  if (next.cost > 0 && args[1] !== 'yes') {
    return [
      `Hint ${next.number} for ${id} costs ${next.cost} points. To take it, type: hint ${id} yes`,
    ];
  }
  const taken = takeHint(ctx.game, id)!;
  ctx.setGame(taken.state);
  return [`Hint ${next.number}${taken.cost ? ` (−${taken.cost} pts)` : ' (free)'}: ${taken.text}`];
}

function status(ctx: Context): Result {
  const { game } = ctx;
  const rows = categories.map(({ id }) => {
    const total = findTotal(id);
    return isCategoryOpen(game, id)
      ? `  ${id.padEnd(10)} ${solvedCount(game, id)}/${total} solved`
      : `  ${id.padEnd(10)} locked: ${lockReason(game, id)}`;
  });
  return [
    ...rows,
    `Flags ${game.solved.length}/10 · Score ${score(game)} · Hints ${hintsUsed(game)}`,
  ];
}

const findTotal = (category: Category) => challenges.filter((c) => c.category === category).length;

function decode(input: string): Result {
  const [type] = input.trim().split(/\s+/).slice(1);
  if (!type) return { error: `decode: which type? ${decoders.decoderNames.join(', ')}` };
  try {
    switch (type.toLowerCase()) {
      case 'caesar': {
        const shift = Number(input.trim().split(/\s+/).at(2));
        if (!Number.isInteger(shift))
          return { error: 'decode caesar <shift> <text>, e.g. decode caesar 3 Khoor' };
        return [decoders.caesar(rest(input, 3), shift)];
      }
      case 'vigenere': {
        const key = input.trim().split(/\s+/).at(2);
        if (!key) return { error: 'decode vigenere <key> <text>' };
        return [decoders.vigenere(rest(input, 3), key)];
      }
      case 'base64':
        return [decoders.base64(rest(input, 2))];
      case 'base32':
        return [decoders.base32(rest(input, 2))];
      case 'reverse':
        return [decoders.reverse(rest(input, 2))];
      case 'url':
        return [decoders.url(rest(input, 2))];
      case 'hex':
        return [decoders.hex(rest(input, 2))];
      default:
        return { error: `decode: no ${type} decoder. Types: ${decoders.decoderNames.join(', ')}` };
    }
  } catch (error) {
    return { error: `decode: ${(error as Error).message}` };
  }
}

function curl(args: string[], ctx: Context): Result {
  const address = args[0];
  if (!address) return { error: 'curl: which address? e.g. curl lab07.local/admin' };
  const page = pageAt(address);
  if (page === 'no-host') return { error: `curl: could not resolve ${address.split('/')[0]}` };
  if (!isCategoryOpen(ctx.game, 'web')) {
    return {
      error: `curl: lab07.local is not answering yet; web/ ${lockReason(ctx.game, 'web')}.`,
    };
  }
  return page === 'not-found' ? { error: 'curl: 404 Not Found' } : page.split('\n');
}

const commands: Record<
  string,
  (args: string[], ctx: Context, input: string) => Result | Promise<Result>
> = {
  help: () => help,
  ls: (args, ctx) => {
    const all = args.includes('-a');
    const target = args.find((a) => a !== '-a');
    const found = lookup(ctx, target);
    if (!found) return { error: `ls: ${target}: no such folder` };
    if ('locked' in found)
      return { error: `ls: ${found.locked}/ is locked; ${lockReason(ctx.game, found.locked)}.` };
    if (found.node.kind === 'file') return [found.node.name];
    const names = found.node.children
      .filter((c) => all || !c.name.startsWith('.'))
      .map((c) => {
        const locked = c.kind === 'dir' && c.category && !isCategoryOpen(ctx.game, c.category);
        return c.kind === 'dir' ? `${c.name}/${locked ? '  (locked)' : ''}` : c.name;
      });
    return names.length ? names : ['(empty)'];
  },
  cd: (args, ctx) => {
    const found = lookup(ctx, args[0] ?? '~');
    if (!found) return { error: `cd: ${args[0]}: no such folder` };
    if ('locked' in found)
      return { error: `cd: ${found.locked}/ is locked; ${lockReason(ctx.game, found.locked)}.` };
    if (found.node.kind === 'file')
      return { error: `cd: ${args[0]} is a file; try cat ${args[0]}` };
    ctx.setCwd(found.path);
    return [];
  },
  pwd: (_, ctx) => [['~', ...ctx.cwd].join('/')],
  cat: (args, ctx) => {
    const result = fileAt(ctx, 'cat', args[0]);
    return 'error' in result ? result : readText(result.file, ctx.game).split('\n');
  },
  strings: (args, ctx) => {
    const result = fileAt(ctx, 'strings', args[0]);
    if ('error' in result) return result;
    const found = extractStrings(readText(result.file, ctx.game));
    return found.length ? found : ['(no readable text)'];
  },
  exif: (args, ctx) => {
    const result = fileAt(ctx, 'exif', args[0]);
    if ('error' in result) return result;
    const exif = result.file.exif;
    if (!exif) return { error: `exif: ${result.file.name} has no photo properties` };
    return exif.map(([key, value]) => `${key.padEnd(12)} ${value}`);
  },
  grep: (args, ctx) => {
    const [needle, path] = args;
    if (!needle || !path)
      return { error: 'grep <text> <file>, e.g. grep 10.0.7.66 network/dns.log' };
    const result = fileAt(ctx, 'grep', path);
    if ('error' in result) return result;
    const hits = readText(result.file, ctx.game)
      .split('\n')
      .filter((line) => line.toLowerCase().includes(needle.toLowerCase()));
    return hits.length ? hits : ['(no matching lines)'];
  },
  curl,
  decode: (_, __, input) => decode(input),
  submit,
  hint,
  status: (_, ctx) => status(ctx),
  reset: (args, ctx) => {
    if (args[0] !== 'yes')
      return ['This wipes every flag, hint and score. To start over, type: reset yes'];
    ctx.setGame(newGame());
    ctx.setCwd([]);
    return ['Progress wiped. The machine is broken again.'];
  },
  open: (args, ctx) => {
    const query = args.join(' ').trim().toLowerCase();
    const app = apps.find((a) => a.id === query || a.label.toLowerCase() === query);
    if (!app) return { error: `open: no app called "${query}".` };
    ctx.openApp(app.id);
    return [`Opening ${app.label}.`];
  },
  date: () => [new Date().toLocaleDateString('en-PH', { dateStyle: 'full' })],
  clear: () => 'clear',
  echo: (args) => [args.join(' ')],
  // Not listed in help: flavour only, worth no points.
  whoami: () => ['guest'],
  sudo: () => ({ error: 'guest is not in the sudoers file. This incident will be reported.' }),
  reboot: (_, ctx) => {
    ctx.reboot();
    return ['Rebooting breach.os.'];
  },
};

/** Runs one line of input and returns what to print. */
export async function run(input: string, ctx: Context): Promise<Result> {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];
  const command = commands[name.toLowerCase()];
  if (!command) return { error: `command not found: ${name}. Type help for the list.` };
  return command(args, ctx, input);
}

export const welcomeLines: Line[] = [
  { kind: 'out', text: 'breach.os terminal · SDCA-LAB-07' },
  { kind: 'out', text: 'Type cat readme.txt to begin, or help for every command.' },
];
