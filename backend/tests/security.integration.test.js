const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { verifyLoginPassword } = require('../src/utils/auth');
const { validatePassword } = require('../src/utils/userValidation');
const loginAttempts = require('../src/utils/loginAttempts');

const PASSWORD = 'Sup3r-Segura-2026';

function signToken(sub) {
  return jwt.sign({ sub }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: process.env.JWT_ISSUER || 'finance-system-api',
    audience: process.env.JWT_AUDIENCE || 'finance-system-client'
  });
}

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, { method = 'GET', body, token } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return {
      status: response.status,
      headers: response.headers,
      body: await response.json().catch(() => null)
    };
  };

  try {
    await run(call);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('token de usuário excluído ou inexistente é rejeitado em rota protegida', async () => {
  const user = await prisma.user.create({
    data: { name: 'Temp', email: `tmp-${crypto.randomUUID()}@test.com`, passwordHash: 'x' }
  });
  const token = signToken(user.id);

  await withServer(async (call) => {
    assert.equal((await call('/accounts', { token })).status, 200);

    await prisma.user.delete({ where: { id: user.id } });

    for (const path of ['/accounts', '/dashboard/summary', '/transactions']) {
      assert.equal((await call(path, { token })).status, 401, path);
    }

    const created = await call('/accounts', {
      method: 'POST',
      token,
      body: { name: 'X', type: 'BANK', initialBalance: '1.00' }
    });
    assert.equal(created.status, 401);

    // sub que não é UUID nunca chega ao banco
    assert.equal((await call('/accounts', { token: signToken('not-a-uuid') })).status, 401);
    assert.equal((await call('/accounts', { token: signToken(crypto.randomUUID()) })).status, 401);
  });
});

test('login: bloqueio por conta após 5 falhas, reset após sucesso, resposta uniforme', async () => {
  loginAttempts.clearAll();
  const email = `lock-${crypto.randomUUID()}@test.com`;
  await prisma.user.create({
    data: { name: 'Lock', email, passwordHash: await bcrypt.hash(PASSWORD, 4) }
  });

  await withServer(async (call) => {
    const login = (password, mail = email) =>
      call('/users/login', { method: 'POST', body: { email: mail, password } });

    // falhas parciais + sucesso zeram o contador
    for (let i = 0; i < 3; i += 1) assert.equal((await login('errada-errada')).status, 401);
    assert.equal((await login(PASSWORD)).status, 200);

    for (let i = 0; i < 5; i += 1) assert.equal((await login('errada-errada')).status, 401);

    const locked = await login(PASSWORD);
    assert.equal(locked.status, 429);
    assert.ok(Number(locked.headers.get('retry-after')) > 0);
  });

  // e-mail inexistente também é limitado, sem revelar se a conta existe
  const ghost = `ghost-${crypto.randomUUID()}@test.com`;
  for (let i = 0; i < loginAttempts.MAX_FAILURES; i += 1) loginAttempts.recordFailure(ghost);
  assert.equal(loginAttempts.checkLock(ghost).locked, true);
});

test('loginAttempts: janela expira e memória é limitada', () => {
  loginAttempts.clearAll();
  const t0 = 1_000_000;

  for (let i = 0; i < loginAttempts.MAX_FAILURES; i += 1) loginAttempts.recordFailure('a@x.com', t0);
  assert.equal(loginAttempts.checkLock('a@x.com', t0 + 1000).locked, true);
  assert.equal(loginAttempts.checkLock('a@x.com', t0 + loginAttempts.WINDOW_MS + 1).locked, false);

  loginAttempts.reset('a@x.com');
  assert.equal(loginAttempts.checkLock('a@x.com', t0).locked, false);
  loginAttempts.clearAll();
});

test('verifyLoginPassword gasta bcrypt mesmo sem usuário e nunca aprova sem hash', async () => {
  const started = process.hrtime.bigint();
  assert.equal(await verifyLoginPassword('qualquer-coisa', undefined), false);
  assert.equal(await verifyLoginPassword('qualquer-coisa', null), false);
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(elapsedMs > 40, `esperava custo de bcrypt, levou ${elapsedMs}ms`);

  const hash = await bcrypt.hash(PASSWORD, 4);
  assert.equal(await verifyLoginPassword(PASSWORD, hash), true);
  assert.equal(await verifyLoginPassword('outra-senha-qualquer', hash), false);
});

test('política de senha: tamanho, senhas comuns, e-mail e repetição', () => {
  const ok = (password, email) => validatePassword(password, { email }).isValid;

  assert.equal(ok('Sup3r-Segura-2026', 'ana@test.com'), true);
  assert.equal(ok('curta1!', 'ana@test.com'), false);
  assert.equal(ok('Passw0rd1', 'ana@test.com'), false); // 9 caracteres
  assert.equal(ok('password123', 'ana@test.com'), false);
  assert.equal(ok('PASSWORD123', 'ana@test.com'), false);
  assert.equal(ok('aaaaaaaaaaaa', 'ana@test.com'), false);
  assert.equal(ok('felipe-silva-2026', 'felipe.silva@test.com'), true);
  assert.equal(ok('minha-felipe-senha', 'felipe@test.com'), false);
  assert.equal(ok('x'.repeat(129), 'ana@test.com'), false);
  assert.equal(validatePassword(undefined).isValid, false);
});

test('cadastro aplica a política de senha', async () => {
  await withServer(async (call) => {
    const register = (password, email = `pol-${crypto.randomUUID()}@test.com`) =>
      call('/users', { method: 'POST', body: { name: 'Pol', email, password } });

    const weak = await register('password123');
    assert.equal(weak.status, 400);
    assert.ok(weak.body.details.password);
    assert.equal((await register(PASSWORD)).status, 201);
  });
});

test('alterar ou excluir o próprio usuário exige a senha atual (com bloqueio de tentativas)', async () => {
  loginAttempts.clearAll();
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const email = `self-${crypto.randomUUID()}@test.com`;
  const user = await prisma.user.create({ data: { name: 'Self', email, passwordHash } });
  const token = signToken(user.id);
  const newEmail = `novo-${crypto.randomUUID()}@test.com`;

  try {
    await withServer(async (call) => {
      const update = (body) => call(`/users/${user.id}`, { method: 'PUT', token, body: { name: 'Self', email: newEmail, ...body } });
      const remove = (body) => call(`/users/${user.id}`, { method: 'DELETE', token, body });

      const noPassword = await update({});
      assert.equal(noPassword.status, 400);
      assert.ok(noPassword.body.details.currentPassword);
      assert.equal((await update({ currentPassword: 'senha-errada-123' })).status, 403);
      assert.equal((await remove({ currentPassword: 'senha-errada-123' })).status, 403);
      assert.equal((await remove(undefined)).status, 400);
      assert.equal((await prisma.user.findUnique({ where: { id: user.id } })).email, email);

      const updated = await update({ currentPassword: PASSWORD });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.email, newEmail);

      // Falhas contam no bloqueio por conta: após 5, nem a senha certa passa.
      for (let i = 0; i < 5; i++) {
        assert.equal((await remove({ currentPassword: `errada-${i}-xyz` })).status, 403);
      }
      const locked = await remove({ currentPassword: PASSWORD });
      assert.equal(locked.status, 429);
      assert.ok(locked.headers.get('retry-after'));

      loginAttempts.clearAll();
      assert.equal((await remove({ currentPassword: PASSWORD })).status, 204);
      assert.equal(await prisma.user.findUnique({ where: { id: user.id } }), null);
    });
  } finally {
    loginAttempts.clearAll();
    await prisma.user.deleteMany({ where: { id: user.id } });
  }
});

test('requisição sem corpo JSON recebe 400, não 500', async () => {
  const user = await prisma.user.create({
    data: { name: 'Raw', email: `raw-${crypto.randomUUID()}@test.com`, passwordHash: 'x' }
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;

  try {
    // Os testes anteriores esgotam o limite de login por IP (em memória, mesmo processo).
    const { loginRateLimit } = require('../src/middlewares/rateLimitMiddleware');
    for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1']) await loginRateLimit.resetKey(ip);

    const login = await fetch(`${base}/users/login`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
    assert.equal(login.status, 400);

    const auth = { Authorization: `Bearer ${signToken(user.id)}` };
    for (const path of ['/accounts', '/categories', '/transactions']) {
      const created = await fetch(`${base}${path}`, { method: 'POST', headers: auth });
      assert.equal(created.status, 400, path);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('data de lançamento: dia inexistente é recusado, formatos válidos continuam aceitos', () => {
  const { validateTransactionInput } = require('../src/utils/transactionValidation');
  const dateError = (date) => validateTransactionInput({
    description: 'Teste', amount: '1.00', type: 'EXPENSE', date,
    accountId: crypto.randomUUID(), categoryId: crypto.randomUUID()
  }).errors.date;

  for (const invalid of ['2026-02-31', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', 'invalid-date', '']) {
    assert.ok(dateError(invalid), invalid);
  }
  for (const valid of ['2026-02-28', '2024-02-29', '2026-12-31', '2026-11-10T15:00:00.000Z']) {
    assert.equal(dateError(valid), undefined, valid);
  }
});
