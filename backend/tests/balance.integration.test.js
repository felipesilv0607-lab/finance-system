const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');

test('saldo e resumo do dashboard usam aritmética decimal exata', async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Balance Test',
      email: `balance-${crypto.randomUUID()}@test.com`,
      passwordHash: await bcrypt.hash('Password123!', 4)
    }
  });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: process.env.JWT_ISSUER || 'finance-system-api',
    audience: process.env.JWT_AUDIENCE || 'finance-system-client'
  });

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const call = async (path, method = 'GET', body) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  };

  try {
    const account = await call('/accounts', 'POST', {
      name: 'Conta Teste', type: 'BANK', initialBalance: '100.00'
    });
    assert.equal(account.status, 201);
    assert.equal(account.body.balance, '100.00');

    const income = await prisma.category.create({
      data: { userId: user.id, name: 'Salário', type: 'INCOME' }
    });
    const expense = await prisma.category.create({
      data: { userId: user.id, name: 'Mercado', type: 'EXPENSE' }
    });
    const date = new Date().toISOString();

    for (const [amount, type, categoryId] of [
      ['0.10', 'INCOME', income.id],
      ['0.20', 'INCOME', income.id],
      ['0.05', 'EXPENSE', expense.id]
    ]) {
      const created = await call('/transactions', 'POST', {
        description: 'Lançamento', amount, type, date,
        accountId: account.body.id, categoryId
      });
      assert.equal(created.status, 201);
    }

    const accounts = await call('/accounts');
    assert.equal(accounts.body[0].balance, '100.25'); // 100 + 0.10 + 0.20 - 0.05

    const summary = await call('/dashboard/summary');
    assert.equal(summary.status, 200);
    assert.equal(summary.body.totalBalance, '100.25');
    assert.equal(summary.body.income, '0.30');
    assert.equal(summary.body.expense, '0.05');
    assert.equal(summary.body.net, '0.25');
    assert.equal(summary.body.recentTransactions.length, 3);

    const outOfPeriod = await call(
      '/dashboard/summary?from=2000-01-01T00:00:00Z&to=2000-02-01T00:00:00Z'
    );
    assert.equal(outOfPeriod.body.income, '0.00');
    assert.equal(outOfPeriod.body.totalBalance, '100.25');

    assert.equal((await call('/dashboard/summary?from=abc&to=x')).status, 400);
    assert.equal((await call('/dashboard/summary?from=2026-01-01')).status, 400);

    for (const amount of ['1e3', '0x10', '1.234', '1,5', 0.1 + 0.2]) {
      const rejected = await call('/transactions', 'POST', {
        description: 'Inválida', amount, type: 'INCOME', date,
        accountId: account.body.id, categoryId: income.id
      });
      assert.equal(rejected.status, 400, `amount ${amount} deveria ser rejeitado`);
    }

    const badBalance = await call('/accounts', 'POST', {
      name: 'Ruim', type: 'BANK', initialBalance: '1e3'
    });
    assert.equal(badBalance.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.user.delete({ where: { id: user.id } });
  }
});
