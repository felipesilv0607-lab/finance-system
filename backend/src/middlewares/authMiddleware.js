const { verifyAccessToken } = require('../utils/auth');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (
    typeof authorization !== 'string' ||
    !authorization.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const token = authorization.slice(7).trim();

  if (!token || token.length > 4096) {
    return res.status(401).json({
      error: 'Invalid authentication token'
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim()
    ) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      });
    }

    req.user = {
      id: payload.sub
    };

    return next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired authentication token'
    });
  }
}

module.exports = {
  authenticate
};
