const test = require('node:test');
const assert = require('node:assert/strict');

const {
  toMoneyString,
  moneyStringToCents,
  centsToMoneyString,
  validateMoneyField
} = require('../src/utils/money');

test('toMoneyString normaliza decimais válidos para 2 casas', () => {
  assert.equal(toMoneyString('10'), '10.00');
  assert.equal(toMoneyString('10.5'), '10.50');
  assert.equal(toMoneyString(' 0.07 '), '0.07');
  assert.equal(toMoneyString(2500), '2500.00');
  assert.equal(toMoneyString(10.5), '10.50');
  assert.equal(toMoneyString('007.10'), '7.10');
  assert.equal(toMoneyString('-3.2'), '-3.20');
  assert.equal(toMoneyString('-0'), '0.00');
  assert.equal(toMoneyString('9999999999999.99'), '9999999999999.99');
});

test('toMoneyString rejeita formatos ambíguos ou imprecisos', () => {
  const invalidValues = [
    '1e3', '0x10', 'abc', '', ' ', '1,50', '1.234', '1 000', '.5', '5.',
    '--1', '+1', NaN, Infinity, 1e21, 5e-7, 0.1 + 0.2, null, undefined,
    {}, [], true, '10000000000000.00'
  ];

  for (const invalid of invalidValues) {
    assert.equal(
      toMoneyString(invalid),
      null,
      `deveria rejeitar ${String(invalid)}`
    );
  }
});

test('conversão centavos <-> string é exata (sem float)', () => {
  assert.equal(moneyStringToCents('0.10') + moneyStringToCents('0.20'), 30n);
  assert.equal(centsToMoneyString(30n), '0.30');
  assert.equal(centsToMoneyString(-5n), '-0.05');
  assert.equal(
    centsToMoneyString(moneyStringToCents('9999999999999.99')),
    '9999999999999.99'
  );
});

test('validateMoneyField aplica regras de obrigatoriedade, sinal e zero', () => {
  assert.match(validateMoneyField('', { label: 'Amount' }), /required/);
  assert.equal(
    validateMoneyField('', { label: 'Initial balance', required: false }),
    null
  );
  assert.match(validateMoneyField('0', { label: 'Amount' }), /greater than zero/);
  assert.match(validateMoneyField('-1', { label: 'Amount' }), /negative/);
  assert.equal(
    validateMoneyField('-1', {
      label: 'Initial balance',
      allowNegative: true,
      allowZero: true
    }),
    null
  );
  assert.equal(
    validateMoneyField('0', { label: 'Initial balance', allowZero: true }),
    null
  );
  assert.match(
    validateMoneyField('1e3', { label: 'Amount' }),
    /valid amount/
  );
});
