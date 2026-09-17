const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');

const testRunId = crypto.randomUUID();
const password = 'Passw0rd';
const emails = [
  `categories-a-${testRunId}@example.test`,
  `categories-b-${testRunId}@example.test`
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

test('category CRUD, validation, authorization, and transaction usage rules', async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  try {
    const registrationA = await request('/users', {
      method: 'POST',
      body: { name: 'Category User A', email: emails[0], password }
    });
    assert.equal(registrationA.status, 201);

    const registrationB = await request('/users', {
      method: 'POST',
      body: { name: 'Category User B', email: emails[1], password }
    });
    assert.equal(registrationB.status, 201);

    const loginA = await request('/users/login', {
      method: 'POST',
      body: { email: emails[0], password }
    });
    const loginB = await request('/users/login', {
      method: 'POST',
      body: { email: emails[1], password }
    });
    assert.equal(loginA.status, 200);
    assert.equal(loginB.status, 200);

    const noJwt = await request('/categories');
    assert.equal(noJwt.status, 401);

    const invalidName = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: ' ', type: 'INCOME' }
    });
    assert.equal(invalidName.status, 400);
    assert.equal(invalidName.body.details.name, 'Name is required');

    const invalidType = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: 'Salary', type: 'TRANSFER' }
    });
    assert.equal(invalidType.status, 400);
    assert.equal(invalidType.body.details.type, 'Type must be either INCOME or EXPENSE');

    const suppliedUserId = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: 'Salary', type: 'INCOME', userId: registrationB.body.id }
    });
    assert.equal(suppliedUserId.status, 400);

    const categoryA = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: ' Food ', type: 'expense' }
    });
    assert.equal(categoryA.status, 201);
    assert.equal(categoryA.body.name, 'Food');
    assert.equal(categoryA.body.type, 'EXPENSE');
    assert.equal(categoryA.body.userId, undefined);
    assert.equal(categoryA.body.transactions, undefined);

    const storedCategoryA = await prisma.category.findUnique({
      where: { id: categoryA.body.id }
    });
    assert.equal(storedCategoryA.userId, registrationA.body.id);

    const sameNameOtherType = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: 'Food', type: 'INCOME' }
    });
    assert.equal(sameNameOtherType.status, 201);

    const duplicate = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: 'Food', type: 'EXPENSE' }
    });
    assert.equal(duplicate.status, 409);

    const categoryB = await request('/categories', {
      method: 'POST',
      token: loginB.body.token,
      body: { name: 'Food', type: 'EXPENSE' }
    });
    assert.equal(categoryB.status, 201);

    const categoriesA = await request('/categories', { token: loginA.body.token });
    assert.equal(categoriesA.status, 200);
    assert.equal(categoriesA.body.length, 2);
    assert.ok(categoriesA.body.every((category) => category.id !== categoryB.body.id));

    const expenseCategoriesA = await request('/categories?type=EXPENSE', {
      token: loginA.body.token
    });
    assert.equal(expenseCategoriesA.status, 200);
    assert.deepEqual(expenseCategoriesA.body.map((category) => category.id), [categoryA.body.id]);

    const ownCategory = await request(`/categories/${categoryA.body.id}`, {
      token: loginA.body.token
    });
    assert.equal(ownCategory.status, 200);
    assert.equal(ownCategory.body.id, categoryA.body.id);

    const otherCategoryRead = await request(`/categories/${categoryB.body.id}`, {
      token: loginA.body.token
    });
    assert.equal(otherCategoryRead.status, 404);

    const otherCategoryUpdate = await request(`/categories/${categoryB.body.id}`, {
      method: 'PUT',
      token: loginA.body.token,
      body: { name: 'Changed', type: 'EXPENSE' }
    });
    assert.equal(otherCategoryUpdate.status, 404);

    const otherCategoryDelete = await request(`/categories/${categoryB.body.id}`, {
      method: 'DELETE',
      token: loginA.body.token
    });
    assert.equal(otherCategoryDelete.status, 404);

    const updatedCategory = await request(`/categories/${categoryA.body.id}`, {
      method: 'PUT',
      token: loginA.body.token,
      body: { name: 'Groceries', type: 'EXPENSE' }
    });
    assert.equal(updatedCategory.status, 200);
    assert.equal(updatedCategory.body.name, 'Groceries');

    const deletedCategory = await request(`/categories/${sameNameOtherType.body.id}`, {
      method: 'DELETE',
      token: loginA.body.token
    });
    assert.equal(deletedCategory.status, 204);

    const deletedCategoryRead = await request(`/categories/${sameNameOtherType.body.id}`, {
      token: loginA.body.token
    });
    assert.equal(deletedCategoryRead.status, 404);

    const categoryInUse = await request('/categories', {
      method: 'POST',
      token: loginA.body.token,
      body: { name: 'Housing', type: 'EXPENSE' }
    });
    assert.equal(categoryInUse.status, 201);

    const account = await prisma.account.create({
      data: {
        userId: registrationA.body.id,
        name: 'Category Test Account',
        type: 'BANK',
        initialBalance: '0'
      }
    });
    await prisma.transaction.create({
      data: {
        userId: registrationA.body.id,
        accountId: account.id,
        categoryId: categoryInUse.body.id,
        description: 'Category usage fixture',
        amount: '10.00',
        type: 'EXPENSE'
      }
    });

    const deleteInUseCategory = await request(`/categories/${categoryInUse.body.id}`, {
      method: 'DELETE',
      token: loginA.body.token
    });
    assert.equal(deleteInUseCategory.status, 409);
  } finally {
    await prisma.user.deleteMany({
      where: { email: { in: emails } }
    });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
