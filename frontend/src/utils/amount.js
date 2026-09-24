export function formatAmountInput(value) {
  if (value === '') {
    return '';
  }

  const normalizedValue = String(value)
    .replace(',', '.')
    .replace(/[^\d.]/g, '');

  const firstDotIndex = normalizedValue.indexOf('.');

  if (firstDotIndex !== -1) {
    const integerPart = normalizedValue.slice(0, firstDotIndex);
    const decimalPart = normalizedValue
      .slice(firstDotIndex + 1)
      .replace(/\./g, '')
      .slice(0, 2);

    return `${integerPart || '0'}.${decimalPart}`;
  }

  return normalizedValue;
}

export function formatAmountOnBlur(value) {
  if (value === '') {
    return '0.00';
  }

  const number = Number(String(value).replace(',', '.'));

  if (!Number.isFinite(number)) {
    return '0.00';
  }

  return number.toFixed(2);
}
