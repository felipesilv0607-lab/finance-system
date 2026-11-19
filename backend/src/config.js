// Validação de ambiente no boot: falha rápido, com mensagem clara,
// em vez de quebrar na primeira requisição.
const MAX_TOKEN_SECONDS = 24 * 60 * 60;

// Aceita o formato do jsonwebtoken para durações: 900, "15m", "1h", "1d".
function parseDurationSeconds(value) {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(String(value).trim());

  if (!match) return null;

  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] ?? 's'];

  return Number(match[1]) * unit;
}

function validateEnv(env = process.env) {
  const problems = [];

  if (!env.DATABASE_URL) {
    problems.push('DATABASE_URL is required');
  }

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET must be set with at least 32 characters');
  } else if (/replace-with|change-?me|your-secret|example/i.test(env.JWT_SECRET)) {
    // O valor de .env.example tem mais de 32 caracteres e passaria na regra acima.
    problems.push('JWT_SECRET still looks like a placeholder; generate a random value');
  }

  if (env.JWT_EXPIRES_IN !== undefined && env.JWT_EXPIRES_IN !== '') {
    const seconds = parseDurationSeconds(env.JWT_EXPIRES_IN);

    if (seconds === null || seconds < 60 || seconds > MAX_TOKEN_SECONDS) {
      problems.push('JWT_EXPIRES_IN must be between 1 minute and 24 hours (e.g. 15m, 1h)');
    }
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
