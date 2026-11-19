import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPENSE_PAGE, INCOME_PAGE } from './movements.js';
import { icons } from '../components/ui/icons.js';

test('Receitas e Despesas usam os tipos aceitos pela API', () => {
  assert.equal(INCOME_PAGE.type, 'INCOME');
  assert.equal(EXPENSE_PAGE.type, 'EXPENSE');
});

test('as duas configurações têm as mesmas chaves, todas preenchidas', () => {
  assert.deepEqual(Object.keys(EXPENSE_PAGE).sort(), Object.keys(INCOME_PAGE).sort());

  for (const page of [INCOME_PAGE, EXPENSE_PAGE]) {
    for (const [key, value] of Object.entries(page)) {
      assert.ok(typeof value === 'string' && value.trim(), `${page.type}.${key} vazio`);
    }
  }
});

test('ícones das telas de lançamentos existem', () => {
  for (const page of [INCOME_PAGE, EXPENSE_PAGE]) {
    assert.ok(icons[page.icon], `faltando ícone ${page.icon}`);
    assert.ok(icons[page.emptyIcon], `faltando ícone ${page.emptyIcon}`);
  }
});

test('tom visual corresponde ao tipo (verde = receita, vermelho = despesa)', () => {
  assert.equal(INCOME_PAGE.tone, 'income');
  assert.equal(EXPENSE_PAGE.tone, 'expense');
});
