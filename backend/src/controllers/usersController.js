const usersService = require('../services/usersService');

const {
  validateUserInput,
  normalizeUserInput,
  isValidUserId
} = require('../utils/userValidation');

async function createUser(req, res, next) {
  try {
    const { name, email } = req.body;

    const validation = validateUserInput({ name, email });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const normalizedData = normalizeUserInput({
      name,
      email
    });

    const user = await usersService.createUser(normalizedData);

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const users = await usersService.getUsers();

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidUserId(id)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const user = await usersService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidUserId(id)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const { name, email } = req.body;

    const validation = validateUserInput({ name, email });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const normalizedData = normalizeUserInput({
      name,
      email
    });

    const user = await usersService.updateUser(
      id,
      normalizedData
    );

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidUserId(id)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    await usersService.deleteUser(id);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};