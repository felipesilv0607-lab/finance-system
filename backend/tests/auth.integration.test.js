const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');

const testRunId = crypto.randomUUID();
const password = 'Passw0rd';
const testEmails = [
  `auth-a-${testRunId}@example.test`,
  `auth-b-${testRunId}@example.test`
];

let server;
let baseUrl;

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json()
  };
}

test('authentication and account authorization flow', async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  try {
    const shortPasswordRegistration = await request('/users', {
      method: 'POST',
      body: {
        name: 'Short Password User',
        email: `auth-short-${testRunId}@example.test`,
        password: 'Passw0r'
      }
    });
    assert.equal(shortPasswordRegistration.status, 400);
    assert.equal(
      shortPasswordRegistration.body.details.password,
      'Password must be at least 8 characters long'
    );

    const registrationA = await request('/users', {
      method: 'POST',
      body: { name: 'Test User A', email: testEmails[0], password }
    });
    assert.equal(registrationA.status, 201);
    assert.equal(registrationA.body.passwordHash, undefined);

    const storedUserA = await prisma.user.findUnique({
      where: { email: testEmails[0] }
    });
    assert.match(storedUserA.passwordHash, /^\$2[aby]\$/);

    const registrationB = await request('/users', {
      method: 'POST',
      body: { name: 'Test User B', email: testEmails[1], password }
    });
    assert.equal(registrationB.status, 201);

    const invalidLogin = await request('/users/login', {
      method: 'POST',
      body: { email: testEmails[0], password: 'WrongPass' }
    });
    assert.equal(invalidLogin.status, 401);

    const loginA = await request('/users/login', {
      method: 'POST',
      body: { email: testEmails[0], password }
    });
    assert.equal(loginA.status, 200);
    assert.equal(typeof loginA.body.token, 'string');

    const loginB = await request('/users/login', {
      method: 'POST',
      body: { email: testEmails[1], password }
    });
    assert.equal(loginB.status, 200);

    const unauthorized = await request('/accounts');
    assert.equal(unauthorized.status, 401);

    const accountA = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        userId: registrationB.body.id,
        name: 'Account A',
        type: 'BANK',
        initialBalance: '100.00'
      }
    });
    assert.equal(accountA.status, 201);

    const storedAccountA = await prisma.account.findUnique({
      where: { id: accountA.body.id }
    });
    assert.equal(storedAccountA.userId, registrationA.body.id);

    const accountB = await request('/accounts', {
      method: 'POST',
      token: loginB.body.token,
      body: {
        userId: registrationA.body.id,
        name: 'Account B',
        type: 'BANK',
        initialBalance: '200.00'
      }
    });
    assert.equal(accountB.status, 201);

    const ownAccounts = await request('/accounts', { token: loginA.body.token });
    assert.equal(ownAccounts.status, 200);
    assert.deepEqual(ownAccounts.body.map((account) => account.id), [accountA.body.id]);

    const otherAccountRead = await request(`/accounts/${accountB.body.id}`, {
      token: loginA.body.token
    });
    assert.equal(otherAccountRead.status, 404);

    const otherAccountUpdate = await request(`/accounts/${accountB.body.id}`, {
      method: 'PUT',
      token: loginA.body.token,
      body: { name: 'Changed', type: 'BANK', initialBalance: '0' }
    });
    assert.equal(otherAccountUpdate.status, 404);

    const otherAccountDelete = await request(`/accounts/${accountB.body.id}`, {
      method: 'DELETE',
      token: loginA.body.token
    });
    assert.equal(otherAccountDelete.status, 404);

    const ownerCanStillRead = await request(`/accounts/${accountB.body.id}`, {
      token: loginB.body.token
    });
    assert.equal(ownerCanStillRead.status, 200);

    const expiredToken = jwt.sign(
  { sub: registrationA.body.id },
  process.env.JWT_SECRET,
  {
    algorithm: 'HS256',
    expiresIn: '-1s',
    issuer: process.env.JWT_ISSUER || 'finance-system',
    audience: process.env.JWT_AUDIENCE || 'finance-system-api'
  }
   );
    const expiredAccess = await request('/accounts', { token: expiredToken });
    assert.equal(expiredAccess.status, 401);

    const invalidAccess = await request('/accounts', { token: 'not-a-jwt' });
    assert.equal(invalidAccess.status, 401);
  } finally {
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } }
    });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
