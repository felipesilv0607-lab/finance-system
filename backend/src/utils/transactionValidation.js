const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'];

function validateTransactionInput({
  description,
  amount,
  type,
  date,
  accountId,
  categoryId
}) {
  const errors = {};

  // DESCRIPTION
  if (
    typeof description !== 'string' ||
    description.trim().length === 0
  ) {
    errors.description = 'Description is required';
  } else if (description.trim().length < 2) {
    errors.description =
      'Description must be at least 2 characters long';
  } else if (description.trim().length > 200) {
    errors.description =
      'Description must be at most 200 characters long';
  }

  // AMOUNT
  if (
    amount === undefined ||
    amount === null ||
    amount === ''
  ) {
    errors.amount = 'Amount is required';
  } else {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      errors.amount = 'Amount must be a valid number';
    } else if (numericAmount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    } else if (numericAmount > 9999999999999.99) {
      errors.amount = 'Amount is out of range';
    }
  }

  // TYPE
  if (
    typeof type !== 'string' ||
    type.trim().length === 0
  ) {
    errors.type = 'Type is required';
  } else if (
    !TRANSACTION_TYPES.includes(type.trim().toUpperCase())
  ) {
    errors.type =
      'Type must be either INCOME or EXPENSE';
  }

  // DATE
  if (
    date === undefined ||
    date === null ||
    date === ''
  ) {
    errors.date = 'Date is required';
  } else {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.date = 'Date must be valid';
    }
  }

  // ACCOUNT ID
  if (!isValidUUID(accountId)) {
    errors.accountId = 'Invalid account ID';
  }

  // CATEGORY ID
  if (!isValidUUID(categoryId)) {
    errors.categoryId = 'Invalid category ID';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function normalizeTransactionInput({
  description,
  amount,
  type,
  date,
  accountId,
  categoryId
}) {
  return {
    description: description.trim(),
    amount: String(amount).trim(),
    type: type.trim().toUpperCase(),
    date: new Date(date),
    accountId: accountId.trim(),
    categoryId: categoryId.trim()
  };
}

function isValidUUID(id) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return typeof id === 'string' && uuidRegex.test(id);
}

function isValidTransactionId(id) {
  return isValidUUID(id);
}

module.exports = {
  TRANSACTION_TYPES,
  validateTransactionInput,
  normalizeTransactionInput,
  isValidTransactionId
};