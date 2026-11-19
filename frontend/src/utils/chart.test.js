import test from 'node:test';
import assert from 'node:assert/strict';
import {
  niceScale,
  scaleY,
  linePath,
  areaPath,
  nearestIndex,
  labelIndexes,
  bucketLabel,
  bucketLongLabel,
  donutSegments,
  formatAxis
} from './chart.js';

test('niceScale inclui o zero e usa passos redondos', () => {
  const scale = niceScale(0, 870);
  assert.equal(scale.min, 0);
  assert.equal(scale.max, 1000);
  assert.deepEqual(scale.ticks, [0, 500, 1000]);

  const negative = niceScale(-130, 40);
  assert.ok(negative.min <= -130 && negative.max >= 40);
  assert.ok(negative.ticks.includes(0));

  assert.deepEqual(niceScale(0, 0).ticks, [0, 1]);
});

test('scaleY mapeia mínimo para a base e máximo para o topo', () => {
  const scale = { min: 0, max: 100 };
  assert.equal(scaleY(0, scale, 10, 200), 210);
  assert.equal(scaleY(100, scale, 10, 200), 10);
});

test('linePath e areaPath', () => {
  assert.equal(linePath([[0, 10], [5, 20]]), 'M0.0 10.0 L5.0 20.0');
  assert.equal(areaPath([], 50), '');
  assert.match(areaPath([[0, 10], [5, 20]], 50), /Z$/);
});

test('nearestIndex limita ao intervalo válido', () => {
  assert.equal(nearestIndex(-50, 10, 0, 100), 0);
  assert.equal(nearestIndex(55, 10, 0, 100), 5);
  assert.equal(nearestIndex(999, 10, 0, 100), 9);
  assert.equal(nearestIndex(5, 0, 0, 100), -1);
});

test('labelIndexes reduz rótulos mantendo o primeiro', () => {
  assert.deepEqual(labelIndexes(3), [0, 1, 2]);
  const idx = labelIndexes(30, 6);
  assert.equal(idx[0], 0);
  assert.ok(idx.length <= 6);
});

test('rótulos de data não dependem de fuso', () => {
  assert.equal(bucketLabel('2026-11-02', 'day'), '02/11');
  assert.equal(bucketLabel('2026-11-01', 'month'), 'nov/26');
  assert.equal(bucketLongLabel('2026-11-02', 'day'), '02/11/2026');
  assert.equal(bucketLongLabel('2026-03-01', 'month'), 'mar de 2026');
});

test('donutSegments soma a circunferência e ignora total zero', () => {
  assert.deepEqual(donutSegments([0, 0], 100), []);
  const segments = donutSegments([50, 50], 100);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].length, 50);
  assert.equal(segments[1].offset, -50);
  assert.equal(donutSegments([10], 100, 4)[0].length, 100);
});

test('formatAxis abrevia milhares e milhões', () => {
  assert.equal(formatAxis(950), '950');
  assert.equal(formatAxis(1200), '1,2 mil');
  assert.equal(formatAxis(-3500000), '−3,5 mi');
});
