import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './auth.js';

test('cadastro exige no mínimo 10 e no máximo 128 caracteres de senha', () => {
  assert.equal(PASSWORD_MIN_LENGTH, 10);
  assert.equal(PASSWORD_MAX_LENGTH, 128);
});

test('regras de senha do frontend acompanham as do backend', () => {
  const backend = readFileSync(
    new URL('../../../backend/src/utils/userValidation.js', import.meta.url),
    'utf8'
  );

  assert.equal(Number(/MIN_PASSWORD_LENGTH = (\d+)/.exec(backend)?.[1]), PASSWORD_MIN_LENGTH);
  assert.match(backend, new RegExp(`password\\.length > ${PASSWORD_MAX_LENGTH}\\b`));
});

test('tela de cadastro usa as regras compartilhadas, sem mínimo fixo', () => {
  const register = readFileSync(new URL('../pages/Register.jsx', import.meta.url), 'utf8');

  assert.match(register, /minLength=\{PASSWORD_MIN_LENGTH\}/);
  assert.match(register, /maxLength=\{PASSWORD_MAX_LENGTH\}/);
  assert.match(register, /Use ao menos \{PASSWORD_MIN_LENGTH\} caracteres\./);
  assert.doesNotMatch(register, /minLength="8"|8 caracteres/);
});
