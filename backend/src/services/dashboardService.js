const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const {
  moneyStringToCents,
  centsToMoneyString
} = require('../utils/money');

function sumToCents(decimal) {
  return decimal ? moneyStringToCents(decimal.toFixed(2)) : 0n;
}

async function getSummary(userId, { from, to }) {
  const periodWhere = { userId, date: { gte: from, lt: to } };

  const [accountsSum, allTime, period, recent] = await Promise.all([
    prisma.account.aggregate({
      where: { userId },
      _sum: { initialBalance: true }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: periodWhere,
      _sum: { amount: true }
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
        account: { select: { name: true } },
        category: { select: { name: true } }
      }
    })
  ]);

  const byType = (rows, type) =>
    sumToCents(rows.find((row) => row.type === type)?._sum.amount);

  const totalBalance =
    sumToCents(accountsSum._sum.initialBalance) +
    byType(allTime, 'INCOME') -
    byType(allTime, 'EXPENSE');

  const income = byType(period, 'INCOME');
  const expense = byType(period, 'EXPENSE');

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    totalBalance: centsToMoneyString(totalBalance),
    income: centsToMoneyString(income),
    expense: centsToMoneyString(expense),
    net: centsToMoneyString(income - expense),
    recentTransactions: recent.map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount.toFixed(2),
      type: transaction.type,
      date: transaction.date,
      accountName: transaction.account.name,
      categoryName: transaction.category.name
    }))
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_MAX_DAYS = 62;
const TOP_CATEGORIES = 6;

function pad(value) {
  return String(value).padStart(2, '0');
}

function dayKey(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

// Intervalo [from, to): diário até 62 dias, mensal acima disso. As chaves
// (YYYY-MM-DD, dia ou 1º do mês em UTC) preenchem também os períodos sem
// movimento, para o gráfico não ter buracos.
function buildBuckets(from, to) {
  const granularity = (to - from) / DAY_MS <= DAILY_MAX_DAYS ? 'day' : 'month';
  const keys = [];

  if (granularity === 'day') {
    const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());

    for (let t = start; t < to.getTime(); t += DAY_MS) {
      keys.push(dayKey(new Date(t)));
    }
  } else {
    let year = from.getUTCFullYear();
    let month = from.getUTCMonth();

    while (Date.UTC(year, month, 1) < to.getTime()) {
      keys.push(dayKey(new Date(Date.UTC(year, month, 1))));
      month += 1;
      if (month === 12) {
        month = 0;
        year += 1;
      }
    }
  }

  return { granularity, keys };
}

// Evolução, categorias e movimentações respeitam accountId/categoryId.
// O saldo (totalBalance e balance da série) respeita só accountId: categoria
// não altera o patrimônio de uma conta.
async function getOverview(userId, { from, to, accountId, categoryId, recentLimit }) {
  const accountScope = accountId ? { accountId } : {};
  const filters = { ...accountScope, ...(categoryId ? { categoryId } : {}) };
  const periodWhere = { userId, ...filters, date: { gte: from, lt: to } };
  const { granularity, keys } = buildBuckets(from, to);

  if (accountId) {
    const owned = await prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true }
    });

    if (!owned) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      throw error;
    }
  }

  if (categoryId) {
    const owned = await prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true }
    });

    if (!owned) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const sqlFilters = Prisma.sql`${accountId ? Prisma.sql`AND "accountId" = ${accountId}` : Prisma.empty} ${
    categoryId ? Prisma.sql`AND "categoryId" = ${categoryId}` : Prisma.empty
  }`;

  const [
    accountsSum,
    before,
    allTime,
    period,
    bucketRows,
    expenseByCategory,
    recent
  ] = await Promise.all([
    prisma.account.aggregate({
      where: { userId, ...(accountId ? { id: accountId } : {}) },
      _sum: { initialBalance: true }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, ...accountScope, date: { lt: from } },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, ...accountScope },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: periodWhere,
      _sum: { amount: true }
    }),
    prisma.$queryRaw`
      SELECT to_char(date_trunc(${granularity}, "date"), 'YYYY-MM-DD') AS bucket,
             "type"::text AS type,
             SUM("amount")::text AS total
      FROM "transactions"
      WHERE "userId" = ${userId}
        AND "date" >= ${from} AND "date" < ${to}
        ${sqlFilters}
      GROUP BY 1, 2`,
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...periodWhere, type: 'EXPENSE' },
      _sum: { amount: true }
    }),
    prisma.transaction.findMany({
      where: { userId, ...filters },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: recentLimit,
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      }
    })
  ]);

  const byType = (rows, type) =>
    sumToCents(rows.find((row) => row.type === type)?._sum.amount);

  const income = byType(period, 'INCOME');
  const expense = byType(period, 'EXPENSE');
  const initial = sumToCents(accountsSum._sum.initialBalance);
  const totalBalance = initial + byType(allTime, 'INCOME') - byType(allTime, 'EXPENSE');

  const cells = new Map(keys.map((key) => [key, { income: 0n, expense: 0n }]));

  for (const row of bucketRows) {
    const cell = cells.get(row.bucket);

    if (cell) {
      cell[row.type === 'INCOME' ? 'income' : 'expense'] += moneyStringToCents(row.total);
    }
  }

  let running = initial + byType(before, 'INCOME') - byType(before, 'EXPENSE');
  const series = keys.map((key) => {
    const cell = cells.get(key);
    running += cell.income - cell.expense;

    return {
      date: key,
      income: centsToMoneyString(cell.income),
      expense: centsToMoneyString(cell.expense),
      balance: centsToMoneyString(running)
    };
  });

  const categories = await prisma.category.findMany({
    where: { userId, id: { in: expenseByCategory.map((row) => row.categoryId) } },
    select: { id: true, name: true }
  });
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const ranked = expenseByCategory
    .map((row) => ({
      categoryId: row.categoryId,
      name: names.get(row.categoryId) ?? 'Sem categoria',
      cents: sumToCents(row._sum.amount)
    }))
    .sort((a, b) => (a.cents === b.cents ? a.name.localeCompare(b.name) : a.cents > b.cents ? -1 : 1));
  const top = ranked.slice(0, TOP_CATEGORIES);
  const rest = ranked.slice(TOP_CATEGORIES).reduce((sum, row) => sum + row.cents, 0n);

  if (rest > 0n) {
    top.push({ categoryId: null, name: 'Outras', cents: rest });
  }

  const share = (cents) =>
    expense > 0n ? Number((cents * 10000n) / expense) / 100 : 0;

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    granularity,
    filters: { accountId: accountId ?? null, categoryId: categoryId ?? null },
    totalBalance: centsToMoneyString(totalBalance),
    income: centsToMoneyString(income),
    expense: centsToMoneyString(expense),
    net: centsToMoneyString(income - expense),
    series,
    expensesByCategory: top.map((row) => ({
      categoryId: row.categoryId,
      name: row.name,
      amount: centsToMoneyString(row.cents),
      percentage: share(row.cents)
    })),
    recentTransactions: recent.map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount.toFixed(2),
      type: transaction.type,
      date: transaction.date,
      accountId: transaction.account.id,
      accountName: transaction.account.name,
      categoryId: transaction.category.id,
      categoryName: transaction.category.name
    }))
  };
}

module.exports = { getSummary, getOverview, buildBuckets };
