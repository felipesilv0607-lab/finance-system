const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../utils/auth');
const { isValidUUID } = require('../utils/uuid');

async function authenticate(req, res, next) {
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

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired authentication token'
    });
  }

  try {

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

    // O token continua válido por até JWT_EXPIRES_IN, mas só vale enquanto o
    // usuário existir (conta excluída não acessa nem cria dados).
    const user = isValidUUID(payload.sub)
      ? await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true }
        })
      : null;

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired authentication token'
      });
    }

    req.user = {
      id: user.id
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authenticate
};
