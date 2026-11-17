import test from 'node:test';
import assert from 'node:assert/strict';
import { icons, iconNames } from './icons.js';

test('todo ícone tem paths válidos e sem duplicatas (chaves do React)', () => {
  assert.ok(iconNames.length >= 30);

  for (const [name, paths] of Object.entries(icons)) {
    assert.ok(Array.isArray(paths) && paths.length > 0, `${name} sem paths`);
    assert.equal(new Set(paths).size, paths.length, `${name} tem path repetido`);

    for (const d of paths) {
      assert.match(d, /^[Mm]/, `${name}: path deve começar com M/m`);
      assert.match(d, /^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$/, `${name}: caracteres inválidos em "${d}"`);
    }
  }
});

test('ícones usados pelos tipos de conta existem', () => {
  for (const name of ['bank', 'cash', 'chart-line', 'wallet']) {
    assert.ok(icons[name], `faltando ícone ${name}`);
  }
});
