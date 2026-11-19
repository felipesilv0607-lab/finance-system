import test from 'node:test';
import assert from 'node:assert/strict';
import { periodRange, periodLabel, PERIOD_OPTIONS } from './period.js';

const NOW = new Date(2026, 10, 17, 22, 30); // 17/11/2026 22:30 local

// Os limites são meia-noite UTC dos dias do calendário local (o mesmo formato
// em que a API grava as datas de lançamento).
const day = (iso) => {
  const d = new Date(iso);
  assert.equal(d.getUTCHours() + d.getUTCMinutes(), 0, `${iso} deveria ser meia-noite UTC`);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
};

test('este mês: [1º do mês, 1º do próximo)', () => {
  const { from, to } = periodRange('this-month', NOW);
  assert.deepEqual(day(from), [2026, 11, 1]);
  assert.deepEqual(day(to), [2026, 12, 1]);
});

test('mês passado e virada de ano', () => {
  const { from, to } = periodRange('last-month', new Date(2026, 0, 10));
  assert.deepEqual(day(from), [2025, 12, 1]);
  assert.deepEqual(day(to), [2026, 1, 1]);
});

test('últimos 30 dias inclui hoje inteiro', () => {
  const { from, to } = periodRange('last-30', NOW);
  assert.deepEqual(day(to), [2026, 11, 18]);
  assert.deepEqual(day(from), [2026, 10, 19]);
  // Um lançamento de hoje (17/11, gravado como meia-noite UTC) está no intervalo.
  const today = new Date('2026-11-17T00:00:00.000Z');
  assert.ok(today >= new Date(from) && today < new Date(to));
});

test('este ano e valor desconhecido cai em este mês', () => {
  assert.deepEqual(day(periodRange('this-year', NOW).to), [2027, 1, 1]);
  assert.deepEqual(periodRange('xyz', NOW), periodRange('this-month', NOW));
});

test('todos os períodos têm rótulo e from < to', () => {
  for (const { value } of PERIOD_OPTIONS) {
    const { from, to } = periodRange(value, NOW);
    assert.ok(new Date(from) < new Date(to), value);
    assert.ok(periodLabel(value).length > 0);
  }
});
