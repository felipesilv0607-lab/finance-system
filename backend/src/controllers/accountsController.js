const accountsService = require('../services/accountsService');

const {
  validateAccountInput,
  normalizeAccountInput,
  isValidAccountId
} = require('../utils/accountValidation');

async function createAccount(req, res, next) {
  try {
    const { name, type, initialBalance } = req.body;

    const validation = validateAccountInput({
      name,
      type,
      initialBalance
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const normalizedData = normalizeAccountInput({
      name,
      type,
      initialBalance
    });

    const account = await accountsService.createAccount({
      userId: req.user.id,
      ...normalizedData
    });

    return res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

async function getAccounts(req, res, next) {
  try {
    const accounts = await accountsService.getAccounts(req.user.id);

    return res.status(200).json(accounts);
  } catch (error) {
    next(error);
  }
}

async function getAccountById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidAccountId(id)) {
      return res.status(400).json({
        error: 'Invalid account ID'
      });
    }

    const account = await accountsService.getAccountById(id, req.user.id);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found'
      });
    }

    return res.status(200).json(account);
  } catch (error) {
    next(error);
  }
}

async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidAccountId(id)) {
      return res.status(400).json({
        error: 'Invalid account ID'
      });
    }

    const {
      name,
      type,
      initialBalance
    } = req.body;

    const validation = validateAccountInput({
      name,
      type,
      initialBalance
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const normalizedData = normalizeAccountInput({
      name,
      type,
      initialBalance
    });

    const account = await accountsService.updateAccount(
      id,
      req.user.id,
      normalizedData
    );

    return res.status(200).json(account);
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidAccountId(id)) {
      return res.status(400).json({
        error: 'Invalid account ID'
      });
    }

    await accountsService.deleteAccount(id, req.user.id);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
};
