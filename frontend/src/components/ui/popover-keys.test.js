import test from 'node:test';
import assert from 'node:assert/strict';
import { getPopoverAction, hasFocusLeft, shouldCloseOnFocusOut } from './popover-keys.js';

test('ESC fecha e devolve o foco ao gatilho apenas quando aberto', () => {
  assert.equal(getPopoverAction({ key: 'Escape', open: true }), 'close-and-focus-trigger');
  assert.equal(getPopoverAction({ key: 'Escape', open: false }), null);
});

test('Tab pede para conferir onde o foco foi parar (só quando aberto)', () => {
  assert.equal(getPopoverAction({ key: 'Tab', open: true }), 'check-focus');
  assert.equal(getPopoverAction({ key: 'Tab', open: false }), null);
});

test('outras teclas não são interceptadas', () => {
  for (const key of ['Enter', ' ', 'ArrowDown', 'a']) {
    assert.equal(getPopoverAction({ key, open: true }), null, key);
  }
});

test('fecha ao focar algo fora; ignora foco interno ou sem destino', () => {
  const inside = {};
  const container = { contains: (node) => node === inside };

  assert.equal(shouldCloseOnFocusOut({ open: true, relatedTarget: {}, container }), true);
  assert.equal(shouldCloseOnFocusOut({ open: true, relatedTarget: inside, container }), false);
  assert.equal(shouldCloseOnFocusOut({ open: true, relatedTarget: null, container }), false);
  assert.equal(shouldCloseOnFocusOut({ open: false, relatedTarget: {}, container }), false);
});

test('foco que foi para o body ou para fora do popover conta como saída', () => {
  const body = {};
  const inside = {};
  const container = { contains: (node) => node === inside };

  assert.equal(hasFocusLeft({ activeElement: inside, container, body }), false);
  assert.equal(hasFocusLeft({ activeElement: {}, container, body }), true);
  assert.equal(hasFocusLeft({ activeElement: body, container, body }), true);
  assert.equal(hasFocusLeft({ activeElement: null, container, body }), true);
  assert.equal(hasFocusLeft({ activeElement: inside, container: null, body }), false);
});
