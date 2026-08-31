function validateUserInput({ name, email }) {
  const errors = {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters long';
  }

  if (typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else {
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      errors.email = 'Invalid email format';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function normalizeUserInput({ name, email }) {
  return {
    name: name.trim(),
    email: email.trim().toLowerCase()
  };
}
function isValidUserId(id) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return typeof id === 'string' && uuidRegex.test(id);
}
module.exports = {
  validateUserInput,
  normalizeUserInput,
  isValidUserId
};