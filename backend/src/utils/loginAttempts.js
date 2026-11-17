// Limite de tentativas de login por conta (e-mail normalizado), além do limite
// por IP. Em memória: reinicia com o processo e não é compartilhado entre
// instâncias (suficiente para uma instância no Render; com várias, usar Redis).
//
// Trade-off conhecido: quem sabe o e-mail de alguém pode bloqueá-lo por até
// WINDOW_MS. O bloqueio vale para qualquer e-mail, existente ou não, para não
// revelar quais contas existem.

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 10000;

const attempts = new Map();

function prune(now) {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }

  // Teto de memória: descarta as entradas mais antigas (ordem de inserção).
  while (attempts.size > MAX_ENTRIES) {
    attempts.delete(attempts.keys().next().value);
  }
}

// Retorna { locked, retryAfterSeconds }.
function checkLock(key, now = Date.now()) {
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now || entry.failures < MAX_FAILURES) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  return { locked: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}

function recordFailure(key, now = Date.now()) {
  const current = attempts.get(key);
  const entry = current && current.resetAt > now
    ? current
    : { failures: 0, resetAt: now + WINDOW_MS };

  entry.failures += 1;
  attempts.set(key, entry);

  if (attempts.size > MAX_ENTRIES) prune(now);
}

function reset(key) {
  attempts.delete(key);
}

function clearAll() {
  attempts.clear();
}

module.exports = { checkLock, recordFailure, reset, clearAll, MAX_FAILURES, WINDOW_MS };
