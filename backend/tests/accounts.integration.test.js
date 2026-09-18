const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');

const testRunId = crypto.randomUUID();
const password = 'Passw0rd';

const emails = [
  `accounts-a-${testRunId}@example.test`,
  `accounts-b-${testRunId}@example.test`
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

test('account CRUD, validation, authorization, and transaction usage rules', async () => {
  server = app.listen(0);

  await new Promise((resolve) => server.once('listening', resolve));

  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  try {
    const registrationA = await request('/users', {
      method: 'POST',
      body: {
        name: 'Account User A',
        email: emails[0],
        password
      }
    });

    assert.equal(registrationA.status, 201);

    const registrationB = await request('/users', {
      method: 'POST',
      body: {
        name: 'Account User B',
        email: emails[1],
        password
      }
    });

    assert.equal(registrationB.status, 201);

    const loginA = await request('/users/login', {
      method: 'POST',
      body: {
        email: emails[0],
        password
      }
    });

    const loginB = await request('/users/login', {
      method: 'POST',
      body: {
        email: emails[1],
        password
      }
    });

    assert.equal(loginA.status, 200);
    assert.equal(loginB.status, 200);

    const noJwt = await request('/accounts');

    assert.equal(noJwt.status, 401);

    const invalidType = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        name: 'Invalid Account',
        type: 'CREDIT_CARD',
        initialBalance: '100.00'
      }
    });

    assert.equal(invalidType.status, 400);
    assert.equal(
      invalidType.body.details.type,
      'Type must be BANK, CASH, INVESTMENT or OTHER'
    );

    const missingType = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        name: 'Missing Type',
        initialBalance: '100.00'
      }
    });

    assert.equal(missingType.status, 400);
    assert.equal(
      missingType.body.details.type,
      'Type is required'
    );

    const suppliedUserId = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        userId: registrationB.body.id,
        name: 'Account A',
        type: 'BANK',
        initialBalance: '100.00'
      }
    });

    assert.equal(suppliedUserId.status, 201);

    const storedSuppliedUserIdAccount = await prisma.account.findUnique({
      where: { id: suppliedUserId.body.id }
    });

    assert.equal(
      storedSuppliedUserIdAccount.userId,
      registrationA.body.id
    );

    const accountA = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        name: 'Nubank',
        type: 'bank',
        initialBalance: '500.00'
      }
    });

    assert.equal(accountA.status, 201);
    assert.equal(accountA.body.name, 'Nubank');
    assert.equal(accountA.body.type, 'BANK');
    assert.equal(accountA.body.userId, undefined);
    assert.equal(accountA.body.transactions, undefined);

    const storedAccountA = await prisma.account.findUnique({
      where: { id: accountA.body.id }
    });

    assert.equal(
      storedAccountA.userId,
      registrationA.body.id
    );

    assert.equal(
      storedAccountA.type,
      'BANK'
    );

    const accountB = await request('/accounts', {
      method: 'POST',
      token: loginB.body.token,
      body: {
        name: 'Carteira',
        type: 'CASH',
        initialBalance: '200.00'
      }
    });

    assert.equal(accountB.status, 201);
    assert.equal(accountB.body.type, 'CASH');

    const ownAccounts = await request('/accounts', {
      token: loginA.body.token
    });

    assert.equal(ownAccounts.status, 200);

    assert.ok(
      ownAccounts.body.some(
        (account) => account.id === accountA.body.id
      )
    );

    assert.ok(
      ownAccounts.body.some(
        (account) => account.id === suppliedUserId.body.id
      )
    );

    assert.ok(
      ownAccounts.body.every(
        (account) => account.id !== accountB.body.id
      )
    );

    const otherAccountRead = await request(
      `/accounts/${accountB.body.id}`,
      {
        token: loginA.body.token
      }
    );

    assert.equal(otherAccountRead.status, 404);

    const otherAccountUpdate = await request(
      `/accounts/${accountB.body.id}`,
      {
        method: 'PUT',
        token: loginA.body.token,
        body: {
          name: 'Conta Alterada',
          type: 'BANK',
          initialBalance: '0'
        }
      }
    );

    assert.equal(otherAccountUpdate.status, 404);

    const otherAccountDelete = await request(
      `/accounts/${accountB.body.id}`,
      {
        method: 'DELETE',
        token: loginA.body.token
      }
    );

    assert.equal(otherAccountDelete.status, 404);

    const ownerCanStillRead = await request(
      `/accounts/${accountB.body.id}`,
      {
        token: loginB.body.token
      }
    );

    assert.equal(ownerCanStillRead.status, 200);

    const updatedAccount = await request(
      `/accounts/${accountA.body.id}`,
      {
        method: 'PUT',
        token: loginA.body.token,
        body: {
          name: 'Nubank Principal',
          type: 'BANK',
          initialBalance: '750.00'
        }
      }
    );

    assert.equal(updatedAccount.status, 200);
    assert.equal(updatedAccount.body.id, accountA.body.id);
    assert.equal(updatedAccount.body.name, 'Nubank Principal');
    assert.equal(updatedAccount.body.type, 'BANK');
    assert.equal(
      Number(updatedAccount.body.initialBalance),
      750
    );

    const accountToDelete = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        name: 'Conta para Excluir',
        type: 'OTHER',
        initialBalance: '50.00'
      }
    });

    assert.equal(accountToDelete.status, 201);

    const deletedAccount = await request(
      `/accounts/${accountToDelete.body.id}`,
      {
        method: 'DELETE',
        token: loginA.body.token
      }
    );

    assert.equal(deletedAccount.status, 204);

    const deletedAccountRead = await request(
      `/accounts/${accountToDelete.body.id}`,
      {
        token: loginA.body.token
      }
    );

    assert.equal(deletedAccountRead.status, 404);

    const accountInUse = await request('/accounts', {
      method: 'POST',
      token: loginA.body.token,
      body: {
        name: 'Conta com Transação',
        type: 'BANK',
        initialBalance: '1000.00'
      }
    });

    assert.equal(accountInUse.status, 201);

    const category = await prisma.category.create({
      data: {
        userId: registrationA.body.id,
        name: `Account Test Category ${testRunId}`,
        type: 'EXPENSE'
      }
    });

    await prisma.transaction.create({
      data: {
        userId: registrationA.body.id,
        accountId: accountInUse.body.id,
        categoryId: category.id,
        description: 'Account usage fixture',
        amount: '10.00',
        type: 'EXPENSE'
      }
    });

    const deleteInUseAccount = await request(
      `/accounts/${accountInUse.body.id}`,
      {
        method: 'DELETE',
        token: loginA.body.token
      }
    );

    assert.equal(deleteInUseAccount.status, 409);

    const accountStillExists = await request(
      `/accounts/${accountInUse.body.id}`,
      {
        token: loginA.body.token
      }
    );

    assert.equal(accountStillExists.status, 200);

    const transactionStillExists = await prisma.transaction.findFirst({
      where: {
        accountId: accountInUse.body.id
      }
    });

    assert.ok(transactionStillExists);
  } finally {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: emails
        }
      }
    });

    await new Promise((resolve) => server.close(resolve));

    await prisma.$disconnect();
  }
});