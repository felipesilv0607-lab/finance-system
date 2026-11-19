import test from 'node:test';
import assert from 'node:assert/strict';
import { periodRange, periodLabel, PERIOD_OPTIONS } from './period.js';

const NOW = new Date(2026, 10, 17, 22, 30); // 17/11/2026 22:30 local

const local = (iso) => {
  const d = new Date(iso);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
};

test('este mês: [1º do mês, 1º do próximo)', () => {
  const { from, to } = periodRange('this-month', NOW);
  assert.deepEqual(local(from), [2026, 11, 1]);
  assert.deepEqual(local(to), [2026, 12, 1]);
});

test('mês passado e virada de ano', () => {
  const { from, to } = periodRange('last-month', new Date(2026, 0, 10));
  assert.deepEqual(local(from), [2025, 12, 1]);
  assert.deepEqual(local(to), [2026, 1, 1]);
});

test('últimos 30 dias inclui hoje inteiro', () => {
  const { from, to } = periodRange('last-30', NOW);
  assert.deepEqual(local(to), [2026, 11, 18]);
  assert.deepEqual(local(from), [2026, 10, 19]);
  assert.ok(new Date(to) > NOW);
});

test('este ano e valor desconhecido cai em este mês', () => {
  assert.deepEqual(local(periodRange('this-year', NOW).to), [2027, 1, 1]);
  assert.deepEqual(periodRange('xyz', NOW), periodRange('this-month', NOW));
});

test('todos os períodos têm rótulo e from < to', () => {
  for (const { value } of PERIOD_OPTIONS) {
    const { from, to } = periodRange(value, NOW);
    assert.ok(new Date(from) < new Date(to), value);
    assert.ok(periodLabel(value).length > 0);
  }
});
