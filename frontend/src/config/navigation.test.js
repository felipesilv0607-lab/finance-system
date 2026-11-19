import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  allNavigationItems,
  getNavigationGroupLabel,
  navigationGroups,
  newEntryActions,
} from './navigation.js';
import { icons } from '../components/ui/icons.js';

const appSource = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');

test('todas as rotas do menu são únicas e começam com /', () => {
  const paths = allNavigationItems.map((item) => item.to);

  assert.equal(new Set(paths).size, paths.length);

  for (const path of paths) assert.match(path, /^\/[a-z-]*$/);
});

test('o menu cobre todas as páginas autenticadas, sem perder nenhuma', () => {
  assert.deepEqual(
    allNavigationItems.map((item) => item.to).sort(),
    ['/', '/accounts', '/categories', '/expenses', '/income', '/transactions']
  );
});

test('toda rota do menu existe em App.jsx', () => {
  for (const { to } of [...allNavigationItems, ...newEntryActions]) {
    const pattern = to === '/' ? 'path="/"' : `path="${to}"`;

    assert.ok(appSource.includes(pattern), `rota ${to} não registrada em App.jsx`);
  }
});

test('todo item usa um ícone que existe e tem rótulo', () => {
  for (const item of [...allNavigationItems, ...newEntryActions]) {
    assert.ok(icons[item.icon], `ícone ${item.icon} não existe`);
    assert.ok(item.label.trim().length > 0);
  }
});

test('grupos têm id único e ao menos um item', () => {
  const ids = navigationGroups.map((group) => group.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const group of navigationGroups) assert.ok(group.items.length > 0, group.id);
});

test('só o Dashboard usa correspondência exata ("/" casaria com tudo)', () => {
  const exact = allNavigationItems.filter((item) => item.end).map((item) => item.to);

  assert.deepEqual(exact, ['/']);
});

test('atalhos de nova movimentação apontam para páginas do menu', () => {
  const paths = new Set(allNavigationItems.map((item) => item.to));

  for (const action of newEntryActions) assert.ok(paths.has(action.to), action.to);
});

test('o rótulo da seção vem do grupo da rota', () => {
  assert.equal(getNavigationGroupLabel('/'), 'Visão geral');
  assert.equal(getNavigationGroupLabel('/income'), 'Movimentações');
  assert.equal(getNavigationGroupLabel('/accounts'), 'Cadastros');
  assert.equal(getNavigationGroupLabel('/inexistente'), undefined);
});
