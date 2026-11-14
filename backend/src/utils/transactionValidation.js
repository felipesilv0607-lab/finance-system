const { isValidUUID } = require('./uuid');
const { toMoneyString, validateMoneyField } = require('./money');

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

  if (typeof description !== 'string' || description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (description.trim().length < 2) {
    errors.description = 'Description must be at least 2 characters long';
  } else if (description.trim().length > 200) {
    errors.description = 'Description must be at most 200 characters long';
  }

  const amountError = validateMoneyField(amount, { label: 'Amount' });

  if (amountError) {
    errors.amount = amountError;
  }

  if (typeof type !== 'string' || type.trim().length === 0) {
    errors.type = 'Type is required';
  } else if (!TRANSACTION_TYPES.includes(type.trim().toUpperCase())) {
    errors.type = 'Type must be either INCOME or EXPENSE';
  }

  if (date === undefined || date === null || date === '') {
    errors.date = 'Date is required';
  } else if (Number.isNaN(new Date(date).getTime())) {
    errors.date = 'Date must be valid';
  }

  if (!isValidUUID(accountId)) {
    errors.accountId = 'Invalid account ID';
  }

  if (!isValidUUID(categoryId)) {
    errors.categoryId = 'Invalid category ID';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
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
    amount: toMoneyString(amount),
    type: type.trim().toUpperCase(),
    date: new Date(date),
    accountId: accountId.trim(),
    categoryId: categoryId.trim()
  };
}

module.exports = {
  TRANSACTION_TYPES,
  validateTransactionInput,
  normalizeTransactionInput,
  isValidTransactionId: isValidUUID
};
