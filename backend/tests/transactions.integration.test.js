const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const http = require('node:http');

let server;
let BASE_URL;

async function startServer() {
  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();

  BASE_URL = `http://127.0.0.1:${port}`;
}

async function stopServer() {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function createToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function registerUser(suffix) {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  return prisma.user.create({
    data: {
      name: `Transaction Test ${suffix}`,
      email: `transaction-${suffix}-${crypto.randomUUID()}@test.com`,
      passwordHash
    }
  });
}

async function createAccount(userId, name, type = 'BANK') {
  return prisma.account.create({
    data: {
      name,
      type,
      initialBalance: '1000.00',
      userId
    }
  });
}

async function createCategory(userId, name, type) {
  return prisma.category.create({
    data: {
      name,
      type,
      userId
    }
  });
}

async function cleanupUser(userId) {
  await prisma.user.delete({
    where: {
      id: userId
    }
  });
}

test(
  'transaction CRUD, validation, authorization, ownership, type filter, and category compatibility',
  async () => {
    await startServer();

    const userA = await registerUser('A');
    const userB = await registerUser('B');

    const tokenA = createToken(userA.id);
    const tokenB = createToken(userB.id);

    const accountA = await createAccount(
      userA.id,
      'Conta Principal'
    );

    const accountB = await createAccount(
      userB.id,
      'Conta do Outro Usuário'
    );

    const incomeCategoryA = await createCategory(
      userA.id,
      'Salário',
      'INCOME'
    );

    const expenseCategoryA = await createCategory(
      userA.id,
      'Alimentação',
      'EXPENSE'
    );

    const incomeCategoryB = await createCategory(
      userB.id,
      'Salário B',
      'INCOME'
    );

    const validIncome = {
      description: 'Salário mensal',
      amount: 2500,
      type: 'INCOME',
      date: '2026-09-18T10:00:00.000Z',
      accountId: accountA.id,
      categoryId: incomeCategoryA.id
    };

    const validExpense = {
      description: 'Compra no mercado',
      amount: 150,
      type: 'EXPENSE',
      date: '2026-09-17T10:00:00.000Z',
      accountId: accountA.id,
      categoryId: expenseCategoryA.id
    };

    // Authentication
    const unauthenticatedResponse = await fetch(
      `${BASE_URL}/api/transactions`
    );

    assert.equal(unauthenticatedResponse.status, 401);

    // Invalid transaction type
    const invalidTypeResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          type: 'INVALID'
        })
      }
    );

    assert.equal(invalidTypeResponse.status, 400);

    // Invalid amount
    const invalidAmountResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          amount: -10
        })
      }
    );

    assert.equal(invalidAmountResponse.status, 400);

    // Invalid date
    const invalidDateResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          date: 'invalid-date'
        })
      }
    );

    assert.equal(invalidDateResponse.status, 400);

    // Invalid account ID
    const invalidAccountResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          accountId: 'invalid-id'
        })
      }
    );

    assert.equal(invalidAccountResponse.status, 400);

    // Invalid category ID
    const invalidCategoryResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          categoryId: 'invalid-id'
        })
      }
    );

    assert.equal(invalidCategoryResponse.status, 400);

    // userId must not be accepted from request body
    const userIdResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          userId: userB.id
        })
      }
    );

    assert.equal(userIdResponse.status, 400);

    // Cannot use another user's account
    const otherAccountResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          accountId: accountB.id
        })
      }
    );

    assert.equal(otherAccountResponse.status, 404);

    // Cannot use another user's category
    const otherCategoryResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          categoryId: incomeCategoryB.id
        })
      }
    );

    assert.equal(otherCategoryResponse.status, 404);

    // Category type must match transaction type
    const typeMismatchResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          ...validIncome,
          categoryId: expenseCategoryA.id
        })
      }
    );

    assert.equal(typeMismatchResponse.status, 400);

    // Create income
    const createIncomeResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify(validIncome)
      }
    );

    assert.equal(createIncomeResponse.status, 201);

    const createdIncome = await createIncomeResponse.json();

    assert.equal(createdIncome.description, 'Salário mensal');
    assert.equal(createdIncome.type, 'INCOME');
    assert.equal(createdIncome.accountId, accountA.id);
    assert.equal(createdIncome.categoryId, incomeCategoryA.id);

    // Create expense
    const createExpenseResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify(validExpense)
      }
    );

    assert.equal(createExpenseResponse.status, 201);

    const createdExpense = await createExpenseResponse.json();

    assert.equal(createdExpense.type, 'EXPENSE');

    // List transactions
    const listResponse = await fetch(
      `${BASE_URL}/api/transactions`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(listResponse.status, 200);

    const transactions = await listResponse.json();

    assert.equal(transactions.length, 2);

    // Filter by INCOME
    const incomeFilterResponse = await fetch(
      `${BASE_URL}/api/transactions?type=INCOME`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(incomeFilterResponse.status, 200);

    const incomes = await incomeFilterResponse.json();

    assert.equal(incomes.length, 1);
    assert.equal(incomes[0].type, 'INCOME');

    // Filter by EXPENSE
    const expenseFilterResponse = await fetch(
      `${BASE_URL}/api/transactions?type=EXPENSE`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(expenseFilterResponse.status, 200);

    const expenses = await expenseFilterResponse.json();

    assert.equal(expenses.length, 1);
    assert.equal(expenses[0].type, 'EXPENSE');

    // Invalid filter
    const invalidFilterResponse = await fetch(
      `${BASE_URL}/api/transactions?type=INVALID`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(invalidFilterResponse.status, 400);

    // Get transaction by ID
    const getResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdIncome.id}`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(getResponse.status, 200);

    const fetchedTransaction = await getResponse.json();

    assert.equal(fetchedTransaction.id, createdIncome.id);

    // Other user cannot access transaction
    const otherUserGetResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdIncome.id}`,
      {
        headers: {
          Authorization: `Bearer ${tokenB}`
        }
      }
    );

    assert.equal(otherUserGetResponse.status, 404);

    // Update transaction
    const updateResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdIncome.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          description: 'Salário atualizado',
          amount: 3000,
          type: 'INCOME',
          date: '2026-09-18T12:00:00.000Z',
          accountId: accountA.id,
          categoryId: incomeCategoryA.id
        })
      }
    );

    assert.equal(updateResponse.status, 200);

    const updatedTransaction = await updateResponse.json();

    assert.equal(
      updatedTransaction.description,
      'Salário atualizado'
    );

    // Other user cannot update transaction
    const otherUserUpdateResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdIncome.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          description: 'Tentativa indevida',
          amount: 999,
          type: 'INCOME',
          date: '2026-09-18T12:00:00.000Z',
          accountId: accountA.id,
          categoryId: incomeCategoryA.id
        })
      }
    );

    assert.equal(otherUserUpdateResponse.status, 404);

    // Delete transaction
    const deleteResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdExpense.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(deleteResponse.status, 204);

    // Deleted transaction no longer exists
    const deletedGetResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdExpense.id}`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`
        }
      }
    );

    assert.equal(deletedGetResponse.status, 404);

    // Cleanup
    await cleanupUser(userA.id);
    await cleanupUser(userB.id);

    await stopServer();
  }
);