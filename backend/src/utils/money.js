// Valores monetários trafegam como string decimal exata ("1234.50").
// Nunca fazemos aritmética com float: somas e comparações usam Decimal
// (Prisma) ou BigInt em centavos.

const MAX_INTEGER_DIGITS = 13; // Decimal(15,2)
const DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/;

/**
 * Converte a entrada para uma string decimal com exatamente 2 casas,
 * ou retorna null se o valor não for um decimal monetário válido.
 *
 * Aceita:
 *  - string como "10", "10.5", "-3.20" (ponto como separador decimal);
 *  - number JSON cuja representação textual seja exata (ex.: 2500, 10.5).
 *
 * Rejeita: notação científica ("1e3"), hexadecimal, NaN/Infinity,
 * mais de 2 casas decimais, vírgula, espaços internos e valores fora de
 * Decimal(15,2). Nada é arredondado silenciosamente.
 */
function toMoneyString(value) {
  let raw;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    raw = String(value);
  } else if (typeof value === 'string') {
    raw = value.trim();
  } else {
    return null;
  }

  if (!DECIMAL_PATTERN.test(raw)) return null;

  const negative = raw.startsWith('-');
  const [integerRaw, fraction = ''] = raw.replace('-', '').split('.');
  const integerPart = integerRaw.replace(/^0+(?=\d)/, '');

  if (integerPart.length > MAX_INTEGER_DIGITS) return null;

  const normalized = `${integerPart}.${fraction.padEnd(2, '0')}`;
  const isZero = normalized === '0.00';

  return negative && !isZero ? `-${normalized}` : normalized;
}

function moneyStringToCents(money) {
  const negative = money.startsWith('-');
  const [integerPart, fraction] = money.replace('-', '').split('.');
  const cents = BigInt(integerPart) * 100n + BigInt(fraction);

  return negative ? -cents : cents;
}

function centsToMoneyString(cents) {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const integerPart = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, '0');

  return `${negative ? '-' : ''}${integerPart}.${fraction}`;
}

/**
 * Valida um campo monetário. Retorna a mensagem de erro (string) ou null.
 */
function validateMoneyField(
  value,
  { label, required = true, allowNegative = false, allowZero = false } = {}
) {
  const isEmpty = value === undefined || value === null || value === '';

  if (isEmpty) {
    return required ? `${label} is required` : null;
  }

  const money = toMoneyString(value);

  if (money === null) {
    return `${label} must be a valid amount with at most 2 decimal places`;
  }

  const cents = moneyStringToCents(money);

  if (!allowNegative && cents < 0n) {
    return `${label} must not be negative`;
  }

  if (!allowZero && cents === 0n) {
    return `${label} must be greater than zero`;
  }

  return null;
}

module.exports = {
  toMoneyString,
  moneyStringToCents,
  centsToMoneyString,
  validateMoneyField
};
