const usersService = require('../services/usersService');

const {
  validateUserInput,
  validatePassword,
  normalizeUserInput,
  isValidUserId
} = require('../utils/userValidation');
const {
  hashPassword,
  verifyLoginPassword,
  createAccessToken
} = require('../utils/auth');
const loginAttempts = require('../utils/loginAttempts');

// Alterar o e-mail ou excluir a conta exige a senha atual: só o token (que
// pode vazar) não basta. As falhas contam no mesmo bloqueio por conta do login,
// para esta rota não virar um caminho de força bruta sem limite.
// Retorna true se confirmou; senão já respondeu.
async function confirmCurrentPassword(userId, currentPassword, res) {
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: { currentPassword: 'Current password is required' }
    });
    return false;
  }

  const user = await usersService.getUserForPasswordCheck(userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return false;
  }

  const lock = loginAttempts.checkLock(user.email);

  if (lock.locked) {
    res.set('Retry-After', String(lock.retryAfterSeconds));
    res.status(429).json({
      error: 'Muitas tentativas. Tente novamente mais tarde.'
    });
    return false;
  }

  const isPasswordValid = await verifyLoginPassword(
    currentPassword.slice(0, 128),
    user.passwordHash
  );

  if (!isPasswordValid) {
    loginAttempts.recordFailure(user.email);
    res.status(403).json({ error: 'Current password is incorrect' });
    return false;
  }

  loginAttempts.reset(user.email);
  return true;
}

async function createUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const validation = validateUserInput({ name, email });
    const passwordValidation = validatePassword(password, { email });

    if (!validation.isValid || !passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          ...validation.errors,
          ...passwordValidation.errors
        }
      });
    }

    const normalizedData = normalizeUserInput({
      name,
      email
    });

    const user = await usersService.createUser({
      ...normalizedData,
      passwordHash: await hashPassword(password)
    });

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase().slice(0, 254);
    const lock = loginAttempts.checkLock(normalizedEmail);

    if (lock.locked) {
      res.set('Retry-After', String(lock.retryAfterSeconds));
      return res.status(429).json({
        error: 'Muitas tentativas de login. Tente novamente mais tarde.'
      });
    }

    const user = await usersService.getUserByEmailForAuthentication(
      normalizedEmail
    );
    const isPasswordValid = await verifyLoginPassword(
      password,
      user?.passwordHash
    );

    if (!isPasswordValid) {
      loginAttempts.recordFailure(normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    loginAttempts.reset(normalizedEmail);

    return res.status(200).json({
      token: createAccessToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const users = await usersService.getUserById(req.user.id);

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    if (id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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

    if (id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!isValidUserId(id)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const { name, email, currentPassword } = req.body;

    const validation = validateUserInput({ name, email });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    if (!(await confirmCurrentPassword(id, currentPassword, res))) return;

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

    if (id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!isValidUserId(id)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    if (!(await confirmCurrentPassword(id, req.body.currentPassword, res))) return;

    await usersService.deleteUser(id);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
