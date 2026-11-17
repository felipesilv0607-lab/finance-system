const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

const TOKEN_EXPIRATION = process.env.JWT_EXPIRES_IN || '1h';

const JWT_ISSUER = process.env.JWT_ISSUER || 'finance-system-api';

const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'finance-system-client';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error(
      'JWT_SECRET must be configured with at least 32 characters'
    );
    error.statusCode = 500;
    throw error;
  }

  return secret;
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Hash descartável com o mesmo custo dos reais. Usado quando o e-mail não
// existe, para o login gastar o mesmo tempo de bcrypt nos dois casos.
let dummyHashPromise;

function getDummyHash() {
  dummyHashPromise ??= bcrypt.hash('dummy-password-for-timing', SALT_ROUNDS);
  return dummyHashPromise;
}

// Sempre executa um bcrypt.compare; só retorna true para usuário real e senha certa.
async function verifyLoginPassword(password, passwordHash) {
  const hasHash = typeof passwordHash === 'string' && passwordHash.length > 0;
  const matches = await bcrypt.compare(password, hasHash ? passwordHash : await getDummyHash());

  return hasHash && matches;
}

function createAccessToken(user) {
  return jwt.sign({ sub: user.id }, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: TOKEN_EXPIRATION,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}

module.exports = {
  hashPassword,
  comparePassword,
  verifyLoginPassword,
  createAccessToken,
  verifyAccessToken
};