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

async function getTransactions(req, res, next) {
  try {
    const { type } = req.query;

    if (
      type !== undefined &&
      !TRANSACTION_TYPES.includes(
        String(type).trim().toUpperCase()
      )
    ) {
      return res.status(400).json({
        error: 'Type must be either INCOME or EXPENSE'
      });
    }

    const transactions =
      await transactionsService.getTransactions(
        req.user.id,
        type === undefined
          ? undefined
          : String(type).trim().toUpperCase()
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