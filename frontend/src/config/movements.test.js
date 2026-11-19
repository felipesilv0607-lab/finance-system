import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPENSE_PAGE, INCOME_PAGE, TRANSACTIONS_PAGE, movementVisual } from './movements.js';
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

test('Transações lista os dois tipos e mostra a mensagem do campo da API', () => {
  assert.equal(TRANSACTIONS_PAGE.type, null);
  assert.equal(TRANSACTIONS_PAGE.fieldErrors, true);
  assert.ok(icons[TRANSACTIONS_PAGE.emptyIcon], `faltando ícone ${TRANSACTIONS_PAGE.emptyIcon}`);

  for (const key of ['title', 'description', 'noun', 'nounPlural', 'Noun', 'placeholder', 'formSubtitle', 'emptyDescription']) {
    assert.ok(typeof TRANSACTIONS_PAGE[key] === 'string' && TRANSACTIONS_PAGE[key].trim(), `TRANSACTIONS_PAGE.${key} vazio`);
  }
});

test('movementVisual escolhe tom, sinal e ícone pelo tipo do lançamento', () => {
  assert.equal(movementVisual('INCOME').tone, 'income');
  assert.equal(movementVisual('INCOME').sign, '+');
  assert.equal(movementVisual('EXPENSE').tone, 'expense');
  assert.equal(movementVisual('EXPENSE').sign, '−');
  assert.ok(icons[movementVisual('INCOME').icon]);
  assert.ok(icons[movementVisual('EXPENSE').icon]);
});
