// Validação de ambiente no boot: falha rápido, com mensagem clara,
// em vez de quebrar na primeira requisição.
function validateEnv(env = process.env) {
  const problems = [];

  if (!env.DATABASE_URL) {
    problems.push('DATABASE_URL is required');
  }

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET must be set with at least 32 characters');
  }

  if (env.NODE_ENV === 'production' && !env.FRONTEND_URL) {
    problems.push('FRONTEND_URL is required in production (CORS)');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${problems.join('\n- ')}`);
  }
}

function getAllowedOrigins(env = process.env) {
  const origins = [env.FRONTEND_URL];

  if (env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173');
  }

  return origins.filter(Boolean);
}

// TRUST_PROXY: número de proxies à frente da API (ex.: 1 no Render).
// Necessário para o rate limit enxergar o IP real do cliente.
function getTrustProxy(env = process.env) {
  if (env.TRUST_PROXY === undefined || env.TRUST_PROXY === '') return false;

  const hops = Number(env.TRUST_PROXY);

  return Number.isInteger(hops) && hops >= 0 ? hops : false;
}

module.exports = { validateEnv, getAllowedOrigins, getTrustProxy };
