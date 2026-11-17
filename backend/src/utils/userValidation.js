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

const MIN_PASSWORD_LENGTH = 10;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234',
  'passw0rd123', 'passw0rd12', '1234567890', '12345678910', '0123456789',
  'qwertyuiop', 'qwerty1234', 'qwerty12345', '1q2w3e4r5t', 'abcd123456',
  'abc1234567', 'senha12345', 'senha123456', 'senhasenha', 'mudar12345',
  'admin12345', 'letmein123', 'welcome123', 'iloveyou123', 'financesystem',
  'finance-system', 'finance1234'
]);

// A política vale para novas senhas; contas existentes não são afetadas.
function validatePassword(password, { email } = {}) {
  const errors = {};

  if (typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  } else if (password.length > 128) {
    errors.password = 'Password must be at most 128 characters long';
  } else {
    const lower = password.toLowerCase();
    const localPart =
      typeof email === 'string' ? email.trim().toLowerCase().split('@')[0] : '';

    if (COMMON_PASSWORDS.has(lower) || /^(.)\1+$/.test(password)) {
      errors.password = 'Password is too common or too simple';
    } else if (localPart.length >= 4 && lower.includes(localPart)) {
      errors.password = 'Password must not contain your email name';
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
  validatePassword,
  normalizeUserInput,
  isValidUserId
};
