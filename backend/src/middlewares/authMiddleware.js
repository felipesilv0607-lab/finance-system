const { verifyAccessToken } = require('../utils/auth');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyAccessToken(token);

    if (typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

module.exports = {
  authenticate
};
