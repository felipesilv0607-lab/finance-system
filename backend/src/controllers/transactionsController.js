const { isValidUUID } = require('../utils/uuid');
const transactionsService = require('../services/transactionsService');
const {
  TRANSACTION_TYPES,
  validateTransactionInput,
  normalizeTransactionInput,
  isValidTransactionId
} = require('../utils/transactionValidation');

function hasUserIdInBody(body) {
  return body && Object.prototype.hasOwnProperty.call(body, 'userId');
}

function validateRequestBody(req, res) {
  if (hasUserIdInBody(req.body)) {
    res.status(400).json({
      error: 'userId must not be provided'
    });

    return false;
  }

  return true;
}

async function createTransaction(req, res, next) {
  try {
    if (!validateRequestBody(req, res)) return;

    const {
      description,
      amount,
      type,
      date,
      accountId,
      categoryId
    } = req.body;

    const validation = validateTransactionInput({
      description,
      amount,
      type,
      date,
      accountId,
      categoryId
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const transaction = await transactionsService.createTransaction({
      userId: req.user.id,
      ...normalizeTransactionInput({
        description,
        amount,
        type,
        date,
        accountId,
        categoryId
      })
    });

    return res.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
}

function parseListQuery(query) {
  const errors = {};
  const filters = {};

  if (query.type !== undefined) {
    const type = String(query.type).trim().toUpperCase();

    if (!TRANSACTION_TYPES.includes(type)) {
      errors.type = 'Type must be either INCOME or EXPENSE';
    } else {
      filters.type = type;
    }
  }

  for (const key of ['accountId', 'categoryId']) {
    if (query[key] !== undefined) {
      if (!isValidUUID(String(query[key]))) {
        errors[key] = `${key} must be a valid UUID`;
      } else {
        filters[key] = String(query[key]);
      }
    }
  }

  if (query.q !== undefined) {
    const q = String(query.q).trim();

    if (q.length > 100) {
      errors.q = 'q must have at most 100 characters';
    } else if (q) {
      filters.q = q;
    }
  }

  for (const key of ['from', 'to']) {
    if (query[key] !== undefined) {
      const date = new Date(String(query[key]));

      if (Number.isNaN(date.getTime())) {
        errors[key] = `${key} must be a valid date`;
      } else {
        filters[key] = date;
      }
    }
  }

  for (const [key, max] of [['limit', 500], ['offset', Number.MAX_SAFE_INTEGER]]) {
    if (query[key] !== undefined) {
      const value = Number(query[key]);
      const min = key === 'limit' ? 1 : 0;

      if (!Number.isInteger(value) || value < min || value > max) {
        errors[key] = `${key} must be an integer between ${min} and ${max}`;
      } else {
        filters[key] = value;
      }
    }
  }

  return { errors, filters };
}

async function getTransactions(req, res, next) {
  try {
    const { errors, filters } = parseListQuery(req.query);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: errors.type || 'Validation failed',
        details: errors
      });
    }

    const transactions = await transactionsService.getTransactions(
      req.user.id,
      filters
    );

    return res.status(200).json(transactions);
  } catch (error) {
    return next(error);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidTransactionId(id)) {
      return res.status(400).json({
        error: 'Invalid transaction ID'
      });
    }

    const transaction =
      await transactionsService.getTransactionById(
        id,
        req.user.id
      );

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    return next(error);
  }
}

async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidTransactionId(id)) {
      return res.status(400).json({
        error: 'Invalid transaction ID'
      });
    }

    if (!validateRequestBody(req, res)) return;

    const {
      description,
      amount,
      type,
      date,
      accountId,
      categoryId
    } = req.body;

    const validation = validateTransactionInput({
      description,
      amount,
      type,
      date,
      accountId,
      categoryId
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const transaction =
      await transactionsService.updateTransaction(
        id,
        req.user.id,
        normalizeTransactionInput({
          description,
          amount,
          type,
          date,
          accountId,
          categoryId
        })
      );

    return res.status(200).json(transaction);
  } catch (error) {
    return next(error);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidTransactionId(id)) {
      return res.status(400).json({
        error: 'Invalid transaction ID'
      });
    }

    await transactionsService.deleteTransaction(
      id,
      req.user.id
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};