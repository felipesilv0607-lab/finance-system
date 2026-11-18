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

module.exports = { getSummary };
