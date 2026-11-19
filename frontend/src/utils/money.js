// Valores monetários são strings decimais ("1234.50"). Nenhuma soma ou
// comparação usa float: a aritmética é feita em centavos com BigInt.

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Intl.NumberFormat aceita string decimal e formata sem passar por float.
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return brl.format('0');
  }

  return brl.format(String(value));
}

// Converte o texto digitado ("12,5", "12.50") em string decimal com 2 casas.
// Se o texto não for um valor válido, devolve como está para o backend
// rejeitar com mensagem clara (nunca arredonda nem converte para float).
export function toAmountPayload(text) {
  const normalized = String(text ?? '').trim().replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return normalized;
  }

  const [integerPart, fraction = ''] = normalized.split('.');

  return `${integerPart}.${fraction.padEnd(2, '0')}`;
}

function toCents(value) {
  const normalized = toAmountPayload(value);

  if (!/^-?\d+\.\d{2}$/.test(normalized)) {
    return 0n;
  }

  const negative = normalized.startsWith('-');
  const [integerPart, fraction] = normalized.replace('-', '').split('.');
  const cents = BigInt(integerPart) * 100n + BigInt(fraction);

  return negative ? -cents : cents;
}

export function sumAmounts(values) {
  const totalCents = values.reduce((total, value) => total + toCents(value), 0n);
  const negative = totalCents < 0n;
  const absolute = negative ? -totalCents : totalCents;
  const fraction = String(absolute % 100n).padStart(2, '0');

  return `${negative ? '-' : ''}${absolute / 100n}.${fraction}`;
}
