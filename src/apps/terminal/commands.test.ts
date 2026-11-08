// Plays the real game end to end through terminal commands, the way a player would, and
// submits each flag it uncovers. No flag text appears here: each one is found in the clues.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { challenges } from '../../game/challenges.ts';
import { isFinished, newGame, score } from '../../game/engine.ts';
import { run, type Context } from './commands.ts';

function terminal() {
  const ctx: Context = {
    game: newGame(0),
    setGame: (next) => void (ctx.game = next),
    cwd: [],
    setCwd: (next) => void (ctx.cwd = next),
    openApp: () => {},
    reboot: () => {},
  };
  /** Runs a command and returns its lines, failing the test on an error. */
  const lines = async (input: string) => {
    const result = await run(input, ctx);
    assert.ok(Array.isArray(result), `${input} → ${JSON.stringify(result)}`);
    return result;
  };
  const error = async (input: string) => {
    const result = await run(input, ctx);
    assert.ok(typeof result === 'object' && 'error' in result, `${input} should fail`);
    return result.error;
  };
  const text = async (input: string) => (await lines(input)).join('\n');
  return { ctx, lines, error, text };
}

const FLAG = /FLAG\{[a-z0-9_]+\}/;
const flagIn = (text: string) => {
  const match = text.match(FLAG);
  assert.ok(match, `no flag in: ${text}`);
  return match[0];
};

test('locked folders and the intranet stay shut until their flags are found', async () => {
  const t = terminal();
  assert.match(await t.text('ls'), /web\/ {2}\(locked\)/);
  assert.match(await t.error('cd web'), /opens after 2 crypto flags \(0\/2\)/);
  assert.match(await t.error('cat network/dns.log'), /network\/ is locked/);
  assert.match(await t.error('curl lab07.local/admin'), /not answering/);
  assert.match(await t.error('hint web/01'), /locked/);
});

test('the whole game can be solved from the terminal alone', async () => {
  const t = terminal();
  const solve = async (flag: string) => {
    const out = await t.text(`submit ${flag}`);
    assert.match(out, /^✓ Correct/);
    return out;
  };

  // crypto/01: Caesar, shift 3
  await t.lines('cd crypto');
  const caesarNote = await t.text('cat 01_caesar.txt');
  await solve(flagIn(await t.text(`decode caesar 3 ${caesarNote}`)));

  // crypto/02: base64; the second crypto flag opens web/
  const blob = await t.text('cat 02_backup.b64');
  assert.match(await solve(flagIn(await t.text(`decode base64 ${blob}`))), /Unlocked: web\//);

  // crypto/03: Vigenère with the room name as the key
  const cipher = (await t.lines('cat 03_vigenere.txt'))[0];
  await solve(flagIn(await t.text(`decode vigenere LABSEVEN ${cipher}`)));

  // web/01: view source, follow the comment, view source again
  await t.lines('cd ..');
  const admin = await t.text('curl lab07.local/admin');
  const oldPage = admin.match(/moved to (\S+?),/)![1];
  await solve(flagIn(await t.text(`curl lab07.local${oldPage}`)));

  // web/02: robots.txt names the hidden folder
  const robots = await t.text('curl lab07.local/robots.txt');
  const hidden = robots.match(/Disallow: (\S+)/)![1];
  assert.match(await t.text(`curl lab07.local${hidden}`), /README\.txt/);
  assert.match(
    await solve(flagIn(await t.text(`curl lab07.local${hidden}README.txt`))),
    /Unlocked: forensics\//,
  );

  // forensics/01: the photo's comment is base64
  const exif = await t.text('exif forensics/lab_photo.jpg');
  const comment = exif.match(/Comment\s+(\S+)/)![1];
  await solve(flagIn(await t.text(`decode base64 ${comment}`)));

  // forensics/02: strings pulls the only readable runs out of the dump
  const found = await t.lines('strings forensics/memory.dmp');
  assert.equal(found.length, 2, 'only gw_sync.exe and the flag survive strings');
  assert.match(await solve(flagIn(found.join('\n'))), /Unlocked: network\//);

  // forensics/03: hidden shell history, reversed text
  assert.doesNotMatch(await t.text('ls forensics'), /bash_history/);
  assert.match(await t.text('ls -a forensics'), /\.bash_history/);
  const reversed = (await t.text('cat forensics/.bash_history')).match(/"(\}[^"]+)"/)![1];
  await solve(flagIn(await t.text(`decode reverse ${reversed}`)));

  // network/01: three DNS names from one machine, joined, base32
  const dns = await t.lines('grep 10.0.7.66 network/dns.log');
  const labels = dns.map((row) => row.trim().split(/\s+/).at(2)!.split('.')[0]).join('');
  await solve(flagIn(await t.text(`decode base32 ${labels}`)));

  // network/02: URL-decode the upload, then hex-decode its data
  const upload = (await t.lines('grep 10.0.7.66 network/access.log')).find((row) =>
    row.includes('POST'),
  )!;
  const query = upload.match(/\?q=(\S+)/)![1];
  const params = await t.text(`decode url ${query}`);
  const data = params.match(/data=([0-9a-f]+)/)![1];
  assert.match(await solve(flagIn(await t.text(`decode hex ${data}`))), /All 10 flags recovered/);

  assert.ok(isFinished(t.ctx.game));
  assert.equal(score(t.ctx.game), 1300);
  const notes = await t.text('cat ~/notes.txt');
  for (const c of challenges) assert.ok(notes.includes(c.fragment), `notes has ${c.id}`);
  assert.match(await t.text('status'), /Flags 10\/10 · Score 1300/);
});

test('hints: shown price first, paid on yes, free after 3 wrong tries; reset wipes all', async () => {
  const t = terminal();
  assert.match(await t.text('hint crypto/01'), /costs 25 points/);
  assert.equal(t.ctx.game.spent, 0, 'asking the price is free');
  assert.match(await t.text('hint crypto/01 yes'), /Hint 1 \(−25 pts\)/);

  for (let i = 0; i < 3; i++) await t.error('submit crypto/02 FLAG{guess}');
  assert.match(await t.text('hint crypto/02'), /Hint 1 \(free\)/);
  assert.equal(t.ctx.game.spent, 25);

  assert.match(await t.text('reset'), /reset yes/);
  await t.lines('reset yes');
  assert.deepEqual(t.ctx.game.solved, []);
  assert.equal(t.ctx.game.spent, 0);
});

test('decode and paths handle mistakes with readable errors', async () => {
  const t = terminal();
  assert.match(await t.error('decode base32 189'), /not base32/);
  assert.match(await t.error('decode caesar x abc'), /decode caesar <shift>/);
  assert.match(await t.error('decode rot47 abc'), /no rot47 decoder/);
  assert.match(await t.error('cat nope.txt'), /no such file/);
  assert.match(await t.error('cd readme.txt'), /is a file/);
  assert.match(await t.error('flarp'), /command not found/);
  await t.lines('cd crypto');
  assert.equal(t.ctx.cwd.join('/'), 'crypto');
  await t.lines('cd ~');
  assert.deepEqual(t.ctx.cwd, []);
});
