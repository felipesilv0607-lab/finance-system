const rateLimit = require('express-rate-limit');

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de login. Tente novamente mais tarde.'
  }
});

const registerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.'
  }
});

module.exports = {
  loginRateLimit,
  registerRateLimit
};