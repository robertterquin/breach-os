// The ten challenges, from the game design doc (kept private: it holds the answers).
// Flags never appear in this repo: only the SHA-256 hash of each exact flag. Changing a
// flag means updating its hash here.

export type Category = 'crypto' | 'web' | 'forensics' | 'network';

export type Challenge = {
  /** Also the path players see, e.g. crypto/03. */
  id: string;
  category: Category;
  title: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  /** SHA-256 hex of the exact flag text, FLAG{...}. */
  flagHash: string;
  /** Shown in order; each costs HINT_COST unless it's free (see engine.ts). */
  hints: [string, string];
  /** The line of the admin's notes this flag recovers. */
  fragment: string;
};

/** Categories in unlock order; each opens after `after` flags in the one before it. */
export const categories: { id: Category; after: number }[] = [
  { id: 'crypto', after: 0 },
  { id: 'web', after: 2 },
  { id: 'forensics', after: 2 },
  { id: 'network', after: 2 },
];

export const challenges: Challenge[] = [
  {
    id: 'crypto/01',
    category: 'crypto',
    title: 'Caesar note',
    points: 50,
    difficulty: 'easy',
    flagHash: '82d488ddac93e4b5ac1f325404ee4824c768dd5b7601a78bed2e1e6fd1a6a94e',
    hints: [
      'Every letter moved the same distance. Try the Caesar tool.',
      '"IODJ" should read "FLAG". How far is I from F?',
    ],
    fragment: "23:40 Backup started. The disk light won't stop blinking.",
  },
  {
    id: 'crypto/02',
    category: 'crypto',
    title: 'Backup blob',
    points: 50,
    difficulty: 'easy',
    flagHash: '0f029a1821f93379da990b855392fef8ee8f2d5a6155880bddd85d6376b3c9f5',
    hints: [
      'The file extension is a big clue.',
      'Letters, digits, + and /, and it starts with "RkxBR3". Try the base64 tool.',
    ],
    fragment: '23:42 The backup is three times bigger than it should be.',
  },
  {
    id: 'crypto/03',
    category: 'crypto',
    title: 'Room key',
    points: 150,
    difficulty: 'medium',
    flagHash: 'da55fa79273ae8972cc64cdf08c3b97660f62187ee9d70568b147d3c3529fc33',
    hints: [
      "The Caesar note told you what the key is. Look at the machine's name.",
      'Spell the room out in letters: LAB SEVEN, no space.',
    ],
    fragment: "23:44 There's a backup job I didn't write. The backup was a trap.",
  },
  {
    id: 'web/01',
    category: 'web',
    title: 'Old login',
    points: 100,
    difficulty: 'easy',
    flagHash: '8b612bb186e0cfc9699e4bc6fdf52c584ceb2010783bcbdc1b15580ceac6c4bd',
    hints: [
      "What the page shows isn't everything it contains. Try view-source.",
      "Follow the path in the HTML comment, then check that page's source too.",
    ],
    fragment: '23:46 The old admin page was still online. Took it down, too late.',
  },
  {
    id: 'web/02',
    category: 'web',
    title: 'Robots map',
    points: 150,
    difficulty: 'medium',
    flagHash: 'e0d67df29678f48438a79111d035bae14168ffcfe8e8fd6e9c18b6e6bf97f412',
    hints: [
      'Websites tell search engines where not to look. Where is that file kept?',
      'Open lab07.local/robots.txt and visit what it disallows.',
    ],
    fragment: '23:47 robots.txt listed my backup folder. I wrote that file myself.',
  },
  {
    id: 'forensics/01',
    category: 'forensics',
    title: 'Lab photo',
    points: 100,
    difficulty: 'easy',
    flagHash: '0f3f11bb07fcf72db917b97519603f50ddb9a179512e83fd99fea624b28bd917',
    hints: [
      'Photos remember more than they show. Open the Properties.',
      'The comment starts like the backup blob did. Same tool.',
    ],
    fragment: '23:49 The webcam caught the desk at 23:41. Nobody was in the room.',
  },
  {
    id: 'forensics/02',
    category: 'forensics',
    title: 'Memory dump',
    points: 150,
    difficulty: 'medium',
    flagHash: 'c8da7367bc9c70a933436a41d837e8d70e3468175df22fe8a203153aad3ee116',
    hints: [
      'Most of this file is noise. Is there a command that keeps only readable text?',
      'Try strings memory.dmp.',
    ],
    fragment: "23:51 A process I don't recognise is running: gw_sync.exe.",
  },
  {
    id: 'forensics/03',
    category: 'forensics',
    title: 'Shell history',
    points: 150,
    difficulty: 'medium',
    flagHash: 'bdc945274bd28a5c5dc02eaddb3c16416318edcc77deb1bee6e6101cb7576531',
    hints: [
      'Files whose names start with a dot are hidden. How do you list them?',
      'The string reads right to left. Try the reverse tool.',
    ],
    fragment: '23:53 Their shell history. They forgot to clear it.',
  },
  {
    id: 'network/01',
    category: 'network',
    title: 'DNS leak',
    points: 200,
    difficulty: 'hard',
    flagHash: '7c815134f7cf97842904d379a8d945ca137af3fb9dcbc539253cf7b596d553bf',
    hints: [
      "One machine's lookups look nothing like the others. Filter by it.",
      "Join the three random-looking names in order. Only A–Z and 2–7 appear: that's base32.",
    ],
    fragment: '23:55 Files are leaving through DNS lookups to x.net.',
  },
  {
    id: 'network/02',
    category: 'network',
    title: 'Last upload',
    points: 200,
    difficulty: 'hard',
    flagHash: '690ac335fc2791fc6bf66aee995203c192c3acd3be3f6187ec71167b5704598f',
    hints: [
      'The %3D and %26 are URL encoding. Decode that first.',
      "The data value uses only 0–9 and a–f, two characters per letter: that's hex.",
    ],
    fragment:
      "23:58 GHOSTWIRE's last upload failed. Wiping /home/admin now. If you're reading this, it worked.",
  },
];
