const CATEGORY_TYPES = ['INCOME', 'EXPENSE'];

function validateCategoryInput({ name, type }) {
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
  } else if (!CATEGORY_TYPES.includes(type.trim().toUpperCase())) {
    errors.type = 'Type must be either INCOME or EXPENSE';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function normalizeCategoryInput({ name, type }) {
  return {
    name: name.trim(),
    type: type.trim().toUpperCase()
  };
}

function isValidCategoryId(id) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return typeof id === 'string' && uuidRegex.test(id);
}

module.exports = {
  CATEGORY_TYPES,
  validateCategoryInput,
  normalizeCategoryInput,
  isValidCategoryId
};
