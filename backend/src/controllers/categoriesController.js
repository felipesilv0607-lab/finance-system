const categoriesService = require('../services/categoriesService');
const {
  CATEGORY_TYPES,
  validateCategoryInput,
  normalizeCategoryInput,
  isValidCategoryId
} = require('../utils/categoryValidation');

function hasUserIdInBody(body) {
  return body && Object.prototype.hasOwnProperty.call(body, 'userId');
}

function validateRequestBody(req, res) {
  if (hasUserIdInBody(req.body)) {
    res.status(400).json({ error: 'userId must not be provided' });
    return false;
  }

  return true;
}

async function createCategory(req, res, next) {
  try {
    if (!validateRequestBody(req, res)) return;

    const { name, type } = req.body;
    const validation = validateCategoryInput({ name, type });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const category = await categoriesService.createCategory({
      userId: req.user.id,
      ...normalizeCategoryInput({ name, type })
    });

    return res.status(201).json(category);
  } catch (error) {
    return next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const { type } = req.query;

    if (type !== undefined && !CATEGORY_TYPES.includes(String(type).trim().toUpperCase())) {
      return res.status(400).json({ error: 'Type must be either INCOME or EXPENSE' });
    }

    const categories = await categoriesService.getCategories(
      req.user.id,
      type === undefined ? undefined : String(type).trim().toUpperCase()
    );

    return res.status(200).json(categories);
  } catch (error) {
    return next(error);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidCategoryId(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const category = await categoriesService.getCategoryById(id, req.user.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(200).json(category);
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidCategoryId(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    if (!validateRequestBody(req, res)) return;

    const { name, type } = req.body;
    const validation = validateCategoryInput({ name, type });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const category = await categoriesService.updateCategory(
      id,
      req.user.id,
      normalizeCategoryInput({ name, type })
    );

    return res.status(200).json(category);
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidCategoryId(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    await categoriesService.deleteCategory(id, req.user.id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
