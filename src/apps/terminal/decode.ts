// The decoder tools behind `decode <type>` (and the crypto notepad buttons in Phase 5).
// Each takes text and returns plain text, or throws an Error whose message the terminal prints.

export const decoderNames = ['caesar', 'base64', 'base32', 'vigenere', 'reverse', 'url', 'hex'];

const shiftLetter = (c: string, by: number) => {
  const base = c >= 'a' && c <= 'z' ? 97 : c >= 'A' && c <= 'Z' ? 65 : 0;
  if (!base) return c;
  return String.fromCharCode(((((c.charCodeAt(0) - base - by) % 26) + 26) % 26) + base);
};

/** Shifts letters back `shift` places (3 turns "IODJ" into "FLAG"); other characters stay. */
export function caesar(text: string, shift: number): string {
  return [...text].map((c) => shiftLetter(c, shift)).join('');
}

/** Undoes a Vigenère cipher: each letter moves back by the next key letter (A=0). */
export function vigenere(text: string, key: string): string {
  const shifts = [...key.toUpperCase()]
    .filter((c) => c >= 'A' && c <= 'Z')
    .map((c) => c.charCodeAt(0) - 65);
  if (shifts.length === 0) throw new Error('vigenere needs a key made of letters');
  let i = 0;
  return [...text]
    .map((c) => (/[a-z]/i.test(c) ? shiftLetter(c, shifts.at(i++ % shifts.length)!) : c))
    .join('');
}

const bytesToText = (bytes: number[]) => new TextDecoder().decode(new Uint8Array(bytes));

export function base64(text: string): string {
  const clean = text.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) throw new Error('that is not base64');
  return bytesToText([...atob(clean)].map((c) => c.charCodeAt(0)));
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32(text: string): string {
  const clean = text.trim().toUpperCase().replace(/=+$/, '');
  if (!/^[A-Z2-7]+$/.test(clean)) throw new Error('that is not base32 (only A–Z and 2–7)');
  let bits = '';
  for (const c of clean) bits += BASE32.indexOf(c).toString(2).padStart(5, '0');
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return bytesToText(bytes);
}

export const reverse = (text: string) => [...text].reverse().join('');

export function url(text: string): string {
  try {
    return decodeURIComponent(text.trim().replace(/\+/g, ' '));
  } catch {
    throw new Error('that is not valid URL encoding');
  }
}

export function hex(text: string): string {
  const clean = text.trim().replace(/\s+/g, '');
  if (!/^([0-9a-fA-F]{2})+$/.test(clean)) throw new Error('that is not hex (pairs of 0–9 and a–f)');
  return bytesToText(clean.match(/../g)!.map((pair) => parseInt(pair, 16)));
}
