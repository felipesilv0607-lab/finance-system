function validateAccountInput({
  name,
  type,
  initialBalance
}) {
  const errors = {};

  // NAME
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters long';
  }

  // TYPE
  if (typeof type !== 'string' || type.trim().length === 0) {
    errors.type = 'Type is required';
  } else if (type.trim().length > 50) {
    errors.type = 'Type must be at most 50 characters long';
  }

  // INITIAL BALANCE
  if (
    initialBalance !== undefined &&
    initialBalance !== null &&
    initialBalance !== ''
  ) {
    const balance = Number(initialBalance);

    if (!Number.isFinite(balance)) {
      errors.initialBalance = 'Initial balance must be a valid number';
    } else if (balance < -9999999999999.99 || balance > 9999999999999.99) {
      errors.initialBalance = 'Initial balance is out of range';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function normalizeAccountInput({
  name,
  type,
  initialBalance
}) {
  return {
    name: name.trim(),
    type: type.trim(),
    initialBalance:
      initialBalance === undefined ||
      initialBalance === null ||
      initialBalance === ''
        ? '0'
        : String(initialBalance).trim()
  };
}

function isValidAccountId(id) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return typeof id === 'string' && uuidRegex.test(id);
}

function isValidUserId(id) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return typeof id === 'string' && uuidRegex.test(id);
}

module.exports = {
  validateAccountInput,
  normalizeAccountInput,
  isValidAccountId,
  isValidUserId
};