import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitials } from './initials.js';

test('usa a primeira letra do primeiro e do último nome', () => {
  assert.equal(getInitials('Felipe Silva Souza'), 'FS');
  assert.equal(getInitials('  maria   clara '), 'MC');
});

test('nome único gera uma inicial só', () => {
  assert.equal(getInitials('Felipe'), 'F');
});

test('valores vazios ou ausentes não quebram', () => {
  assert.equal(getInitials(''), '?');
  assert.equal(getInitials('   '), '?');
  assert.equal(getInitials(null), '?');
  assert.equal(getInitials(undefined), '?');
});

test('respeita acentos em maiúsculas', () => {
  assert.equal(getInitials('émile zola'), 'ÉZ');
});
