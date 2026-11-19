import test from 'node:test';
import assert from 'node:assert/strict';
import { cx } from './cx.js';

test('cx ignora valores falsos e achata listas', () => {
  assert.equal(cx('a', false, null, undefined, '', 'b'), 'a b');
  assert.equal(cx('a', ['b', ['c', 0]], 'd'), 'a b c d');
  assert.equal(cx(), '');
});
