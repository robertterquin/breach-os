import assert from 'node:assert/strict';
import { test } from 'node:test';
import { base32, base64, caesar, hex, reverse, url, vigenere } from './decode.ts';

test('caesar shifts letters back and keeps everything else', () => {
  assert.equal(caesar('Khoor, Zruog! 123 {x}', 3), 'Hello, World! 123 {u}');
  assert.equal(caesar('Hello', -3), 'Khoor');
  assert.equal(caesar('abc', 26), 'abc');
});

test('vigenere undoes the classic example and skips non-letters in the key count', () => {
  assert.equal(vigenere('LXFOPV EF RNHR', 'LEMON'), 'ATTACK AT DAWN');
  assert.equal(vigenere('lxfopv_ef', 'lemon'), 'attack_at');
  assert.throws(() => vigenere('abc', '123'), /letters/);
});

test('base64, base32, hex and url decode known values', () => {
  assert.equal(base64('aGVsbG8gd29ybGQ='), 'hello world');
  assert.equal(base32('NBSWY3DP'), 'hello');
  assert.equal(base32('nbswy3dp'), 'hello', 'case does not matter');
  assert.equal(hex('68656c6c6f'), 'hello');
  assert.equal(url('a%3Db%26c%20d'), 'a=b&c d');
  assert.equal(reverse('olleh'), 'hello');
});

test('bad input gives a readable error, not a crash', () => {
  assert.throws(() => base64('not base64!'), /not base64/);
  assert.throws(() => base32('189'), /not base32/);
  assert.throws(() => hex('abc'), /not hex/);
  assert.throws(() => url('%E0%A4%A'), /URL encoding/);
});
