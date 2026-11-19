const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateEnv,
  getAllowedOrigins,
  getTrustProxy
} = require('../src/config');

const validEnv = {
  DATABASE_URL: 'postgresql://u:p@h:5432/d',
  JWT_SECRET: 'x'.repeat(32)
};

test('validateEnv aceita configuração válida', () => {
  assert.doesNotThrow(() => validateEnv(validEnv));
});

test('validateEnv rejeita DATABASE_URL ausente e JWT_SECRET curto', () => {
  assert.throws(() => validateEnv({}), /DATABASE_URL is required[\s\S]*JWT_SECRET/);
  assert.throws(
    () => validateEnv({ ...validEnv, JWT_SECRET: 'curto' }),
    /JWT_SECRET/
  );
});

test('em produção FRONTEND_URL é obrigatório e localhost não é liberado', () => {
  const production = { ...validEnv, NODE_ENV: 'production' };

  assert.throws(() => validateEnv(production), /FRONTEND_URL/);
  assert.deepEqual(
    getAllowedOrigins({ NODE_ENV: 'production', FRONTEND_URL: 'https://app.example' }),
    ['https://app.example']
  );
  assert.deepEqual(getAllowedOrigins({ FRONTEND_URL: 'https://app.example' }), [
    'https://app.example',
    'http://localhost:5173'
  ]);
});

test('getTrustProxy interpreta TRUST_PROXY com segurança', () => {
  assert.equal(getTrustProxy({}), false);
  assert.equal(getTrustProxy({ TRUST_PROXY: '1' }), 1);
  assert.equal(getTrustProxy({ TRUST_PROXY: 'true' }), false);
  assert.equal(getTrustProxy({ TRUST_PROXY: '-2' }), false);
});

test('validateEnv rejeita o segredo de exemplo do .env.example', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const example = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
  const placeholder = example.match(/^JWT_SECRET="?([^"\r\n]+)"?/m)[1];

  assert.ok(placeholder.length >= 32, 'o exemplo tem tamanho suficiente para passar só no tamanho');
  assert.throws(
    () => validateEnv({ ...validEnv, JWT_SECRET: placeholder }),
    /placeholder/
  );
});

test('validateEnv limita a validade do token entre 1 minuto e 24 horas', () => {
  for (const ok of ['15m', '1h', '24h', '1d', '900', '60s']) {
    assert.doesNotThrow(() => validateEnv({ ...validEnv, JWT_EXPIRES_IN: ok }), ok);
  }

  for (const bad of ['30s', '2d', '365d', '0', 'abc', '-1h', '1 semana']) {
    assert.throws(() => validateEnv({ ...validEnv, JWT_EXPIRES_IN: bad }), /JWT_EXPIRES_IN/, bad);
  }

  assert.doesNotThrow(() => validateEnv({ ...validEnv, JWT_EXPIRES_IN: '' }));
});
