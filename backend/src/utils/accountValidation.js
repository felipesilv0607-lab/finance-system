const { isValidUUID } = require('./uuid');
const { toMoneyString, validateMoneyField } = require('./money');

const ACCOUNT_TYPES = ['BANK', 'CASH', 'INVESTMENT', 'OTHER'];

function validateAccountInput({ name, type, initialBalance }) {
  const errors = {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters long';
  }

  if (typeof type !== 'string' || type.trim().length === 0) {
    errors.type = 'Type is required';
  } else if (!ACCOUNT_TYPES.includes(type.trim().toUpperCase())) {
    errors.type = 'Type must be BANK, CASH, INVESTMENT or OTHER';
  }

  const balanceError = validateMoneyField(initialBalance, {
    label: 'Initial balance',
    required: false,
    allowNegative: true,
    allowZero: true
  });

  if (balanceError) {
    errors.initialBalance = balanceError;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function normalizeAccountInput({ name, type, initialBalance }) {
  const isEmpty =
    initialBalance === undefined ||
    initialBalance === null ||
    initialBalance === '';

  return {
    name: name.trim(),
    type: type.trim().toUpperCase(),
    initialBalance: isEmpty ? '0.00' : toMoneyString(initialBalance)
  };
}

module.exports = {
  ACCOUNT_TYPES,
  validateAccountInput,
  normalizeAccountInput,
  isValidAccountId: isValidUUID,
  isValidUserId: isValidUUID
};
