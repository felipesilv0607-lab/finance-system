import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Lê tokens.css, resolve var(--x) e valida contraste WCAG dos pares usados
// pelos componentes. Evita regressões de acessibilidade ao mexer na paleta.

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const tokens = new Map(
  [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

function resolve(name, depth = 0) {
  const value = tokens.get(name);

  assert.ok(value, `token ${name} não existe`);
  assert.ok(depth < 10, `referência circular em ${name}`);

  const ref = value.match(/^var\((--[\w-]+)\)$/);

  return ref ? resolve(ref[1], depth + 1) : value;
}

function luminance(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `valor não é #rrggbb: ${hex}`);

  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x);

  return (light + 0.05) / (dark + 0.05);
}

const AA_TEXT = 4.5;
const AA_UI = 3;

const textPairs = [
  ['--text-primary', '--bg-surface'],
  ['--text-primary', '--bg-app'],
  ['--text-secondary', '--bg-surface'],
  ['--text-secondary', '--bg-app'],
  ['--text-secondary', '--bg-muted'],
  ['--text-placeholder', '--bg-surface'],
  ['--text-link', '--bg-surface'],
  ['--text-income', '--bg-surface'],
  ['--text-expense', '--bg-surface'],
  ['--text-inverse', '--accent'],
  ['--text-inverse', '--accent-hover'],
  ['--text-inverse', '--color-danger-700'],
  ['--text-inverse', '--color-danger-800'],
  ['--text-inverse', '--color-neutral-900'],
  ['--color-neutral-300', '--color-neutral-900'],
  ['--accent', '--accent-soft'],
  ['--color-primary-700', '--color-primary-50'],
  ['--color-success-700', '--color-success-50'],
  ['--color-danger-700', '--color-danger-50'],
  ['--color-warning-700', '--color-warning-50'],
  ['--color-info-700', '--color-info-50'],
  ['--color-neutral-700', '--color-neutral-100'],
  ['--text-sidebar', '--bg-sidebar'],
  ['--text-sidebar-muted', '--bg-sidebar'],
  ['--text-inverse', '--bg-sidebar'],
  ['--text-inverse', '--bg-sidebar-hover'],
  ['--text-inverse', '--bg-sidebar-active'],
];

for (const [fg, bg] of textPairs) {
  test(`contraste de texto ${fg} sobre ${bg} >= 4.5:1`, () => {
    const ratio = contrast(fg, bg);

    assert.ok(ratio >= AA_TEXT, `${fg}/${bg} = ${ratio.toFixed(2)}:1`);
  });
}

for (const [fg, bg] of [
  ['--border-input', '--bg-surface'],
  ['--border-focus', '--bg-surface'],
]) {
  test(`contraste de componente ${fg} sobre ${bg} >= 3:1`, () => {
    const ratio = contrast(fg, bg);

    assert.ok(ratio >= AA_UI, `${fg}/${bg} = ${ratio.toFixed(2)}:1`);
  });
}

test('escala de espaçamento segue a base de 4px', () => {
  for (const [name, value] of tokens) {
    if (!/^--space-\d+$/.test(name) || value === '0') continue;

    const rem = parseFloat(value);

    assert.equal((rem * 16) % 4, 0, `${name}: ${value} não é múltiplo de 4px`);
  }
});
