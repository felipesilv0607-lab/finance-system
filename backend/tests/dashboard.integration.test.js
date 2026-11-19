const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { buildBuckets } = require('../src/services/dashboardService');
const { parseOverviewQuery } = require('../src/utils/dashboardQuery');

async function createUser(label) {
  const user = await prisma.user.create({
    data: {
      name: label,
      email: `${label}-${crypto.randomUUID()}@test.com`,
      passwordHash: 'x'
    }
  });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: process.env.JWT_ISSUER || 'finance-system-api',
    audience: process.env.JWT_AUDIENCE || 'finance-system-client'
  });
  return { user, token };
}

async function seed(userId, prefix) {
  const bank = await prisma.account.create({
    data: { userId, name: `${prefix} Banco`, type: 'BANK', initialBalance: '100.00' }
  });
  const cash = await prisma.account.create({
    data: { userId, name: `${prefix} Caixa`, type: 'CASH', initialBalance: '0.00' }
  });
  const salary = await prisma.category.create({
    data: { userId, name: `${prefix} Salário`, type: 'INCOME' }
  });
  const food = await prisma.category.create({
    data: { userId, name: `${prefix} Mercado`, type: 'EXPENSE' }
  });
  const rent = await prisma.category.create({
    data: { userId, name: `${prefix} Aluguel`, type: 'EXPENSE' }
  });
  const rows = [
    ['Salário de novembro', '0.10', 'INCOME', salary, bank, '2026-11-02T12:00:00Z'],
    ['Bônus', '0.20', 'INCOME', salary, cash, '2026-11-02T15:00:00Z'],
    ['Supermercado Central', '0.05', 'EXPENSE', food, bank, '2026-11-10T12:00:00Z'],
    ['Aluguel', '10.00', 'EXPENSE', rent, bank, '2026-11-10T13:00:00Z'],
    ['Compra antiga', '5.00', 'EXPENSE', food, bank, '2026-10-20T12:00:00Z']
  ];

  for (const [description, amount, type, category, account, date] of rows) {
    await prisma.transaction.create({
      data: {
        userId,
        description,
        amount,
        type,
        date: new Date(date),
        accountId: account.id,
        categoryId: category.id
      }
    });
  }

  return { bank, cash, salary, food, rent };
}

async function withServer(token, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path) => {
    const response = await fetch(`${base}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  };

  try {
    await run(call);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const PERIOD = 'from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z';

test('overview: totais, série e categorias exatos, com isolamento entre usuários', async () => {
  const a = await createUser('dash-a');
  const b = await createUser('dash-b');
  const mine = await seed(a.user.id, 'A');
  const theirs = await seed(b.user.id, 'B');

  await withServer(a.token, async (call) => {
    const res = await call(`/dashboard/overview?${PERIOD}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.granularity, 'day');
    // saldo: 100.00 + (0.10 + 0.20) - (0.05 + 10.00 + 5.00)
    assert.equal(res.body.totalBalance, '85.25');
    assert.equal(res.body.income, '0.30');
    assert.equal(res.body.expense, '10.05');
    assert.equal(res.body.net, '-9.75');
    assert.equal(res.body.series.length, 30);

    const day2 = res.body.series.find((p) => p.date === '2026-11-02');
    assert.equal(day2.income, '0.30');
    assert.equal(day2.expense, '0.00');
    // saldo de abertura (antes de 01/11): 100.00 - 5.00 = 95.00
    assert.equal(res.body.series[0].balance, '95.00');
    assert.equal(day2.balance, '95.30');
    assert.equal(res.body.series.at(-1).balance, '85.25');

    const names = res.body.expensesByCategory.map((c) => [c.name, c.amount]);
    assert.deepEqual(names, [['A Aluguel', '10.00'], ['A Mercado', '0.05']]);
    assert.equal(
      res.body.expensesByCategory.reduce((sum, c) => sum + c.percentage, 0) > 99.9,
      true
    );
    assert.equal(res.body.recentTransactions.length, 5);
    assert.ok(res.body.recentTransactions.every((t) => !t.description.startsWith('B ')));

    // filtro por conta: só a conta Caixa
    const cash = await call(`/dashboard/overview?${PERIOD}&accountId=${mine.cash.id}`);
    assert.equal(cash.body.totalBalance, '0.20');
    assert.equal(cash.body.income, '0.20');
    assert.equal(cash.body.expense, '0.00');
    assert.equal(cash.body.recentTransactions.length, 1);

    // filtro por categoria: só Aluguel
    const rent = await call(`/dashboard/overview?${PERIOD}&categoryId=${mine.rent.id}`);
    assert.equal(rent.body.expense, '10.00');
    assert.equal(rent.body.income, '0.00');
    assert.equal(rent.body.totalBalance, '85.25');

    // recursos de outro usuário: 404, sem revelar existência
    for (const query of [`accountId=${theirs.bank.id}`, `categoryId=${theirs.food.id}`]) {
      assert.equal((await call(`/dashboard/overview?${PERIOD}&${query}`)).status, 404);
    }

    // intervalo longo vira série mensal
    const year = await call('/dashboard/overview?from=2026-01-01T00:00:00Z&to=2027-01-01T00:00:00Z');
    assert.equal(year.body.granularity, 'month');
    assert.equal(year.body.series.length, 12);
    assert.equal(year.body.series[10].expense, '10.05');
    assert.equal(year.body.series[9].expense, '5.00');
  });
});

test('overview: validação de parâmetros e autenticação', async () => {
  const a = await createUser('dash-v');

  await withServer(a.token, async (call) => {
    for (const query of [
      'from=2026-11-01',
      'from=x&to=y',
      'from=2026-12-01&to=2026-11-01',
      'from=2000-01-01&to=2026-11-01',
      'accountId=nao-uuid',
      'categoryId=1',
      'recent=0',
      'recent=999'
    ]) {
      const res = await call(`/dashboard/overview?${query}`);
      assert.equal(res.status, 400, query);
    }

    const empty = await call('/dashboard/overview');
    assert.equal(empty.status, 200);
    assert.equal(empty.body.totalBalance, '0.00');
    assert.deepEqual(empty.body.expensesByCategory, []);
    assert.deepEqual(empty.body.recentTransactions, []);
  });

  await withServer(null, async (call) => {
    assert.equal((await call('/dashboard/overview')).status, 401);
  });
});

test('transactions: filtros accountId, categoryId e q, com paginação', async () => {
  const a = await createUser('tx-a');
  const b = await createUser('tx-b');
  const mine = await seed(a.user.id, 'A');
  const theirs = await seed(b.user.id, 'B');

  await withServer(a.token, async (call) => {
    const all = await call('/transactions');
    assert.equal(all.body.length, 5);

    const byAccount = await call(`/transactions?accountId=${mine.cash.id}`);
    assert.deepEqual(byAccount.body.map((t) => t.description), ['Bônus']);

    const byCategory = await call(`/transactions?categoryId=${mine.food.id}`);
    assert.equal(byCategory.body.length, 2);

    const search = await call('/transactions?q=%20SUPERMERCADO%20');
    assert.deepEqual(search.body.map((t) => t.description), ['Supermercado Central']);

    // % e _ são literais para o Prisma, não curingas
    assert.equal((await call('/transactions?q=%25')).body.length, 0);

    // filtro com recurso de outro usuário: lista vazia, nunca dados alheios
    assert.deepEqual((await call(`/transactions?accountId=${theirs.bank.id}`)).body, []);

    const page1 = await call('/transactions?limit=2&offset=0');
    const page2 = await call('/transactions?limit=2&offset=2');
    const ids = [...page1.body, ...page2.body].map((t) => t.id);
    assert.equal(new Set(ids).size, 4);

    for (const query of ['accountId=abc', 'categoryId=1', `q=${'a'.repeat(101)}`]) {
      assert.equal((await call(`/transactions?${query}`)).status, 400, query);
    }
  });
});

test('summary continua com o contrato original', async () => {
  const a = await createUser('sum-a');
  await seed(a.user.id, 'A');

  await withServer(a.token, async (call) => {
    const res = await call(`/dashboard/summary?${PERIOD}`);
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body).sort(), [
      'expense', 'income', 'net', 'period', 'recentTransactions', 'totalBalance'
    ]);
    assert.equal(res.body.totalBalance, '85.25');
  });
});

test('buildBuckets e parseOverviewQuery: casos de borda', () => {
  const feb = buildBuckets(new Date('2028-02-01T00:00:00Z'), new Date('2028-03-01T00:00:00Z'));
  assert.equal(feb.keys.length, 29);

  const { params, errors } = parseOverviewQuery({}, new Date('2026-12-31T23:00:00Z'));
  assert.deepEqual(errors, {});
  assert.equal(params.from.toISOString(), '2026-12-01T00:00:00.000Z');
  assert.equal(params.to.toISOString(), '2027-01-01T00:00:00.000Z');
});
