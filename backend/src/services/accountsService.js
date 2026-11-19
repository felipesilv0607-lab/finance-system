const prisma = require('../lib/prisma');
const {
  moneyStringToCents,
  centsToMoneyString
} = require('../utils/money');

const accountSelect = {
  id: true,
  name: true,
  type: true,
  initialBalance: true,
  createdAt: true,
  updatedAt: true
};

function createNotFoundError() {
  const error = new Error('Account not found');
  error.statusCode = 404;
  return error;
}

// Movimento líquido (receitas - despesas) por conta, em centavos (BigInt).
async function getNetMovementByAccount(userId, accountIds) {
  const grouped = await prisma.transaction.groupBy({
    by: ['accountId', 'type'],
    where: { userId, accountId: { in: accountIds } },
    _sum: { amount: true }
  });

  const net = new Map();

  for (const row of grouped) {
    const cents = moneyStringToCents(row._sum.amount.toFixed(2));
    const signed = row.type === 'INCOME' ? cents : -cents;
    net.set(row.accountId, (net.get(row.accountId) || 0n) + signed);
  }

  return net;
}

async function attachBalances(userId, accounts) {
  if (accounts.length === 0) return [];

  const net = await getNetMovementByAccount(
    userId,
    accounts.map((account) => account.id)
  );

  return accounts.map((account) => {
    const initial = moneyStringToCents(account.initialBalance.toFixed(2));
    const balance = initial + (net.get(account.id) || 0n);

    return { ...account, balance: centsToMoneyString(balance) };
  });
}

async function createAccount({ userId, name, type, initialBalance }) {
  const account = await prisma.account.create({
    data: { userId, name, type, initialBalance },
    select: accountSelect
  });

  return (await attachBalances(userId, [account]))[0];
}

async function getAccounts(userId) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: accountSelect,
    orderBy: { createdAt: 'desc' }
  });

  return attachBalances(userId, accounts);
}

async function getAccountById(id, userId) {
  const account = await prisma.account.findFirst({
    where: { id, userId },
    select: accountSelect
  });

  if (!account) return null;

  return (await attachBalances(userId, [account]))[0];
}

async function updateAccount(id, userId, { name, type, initialBalance }) {
  const existingAccount = await prisma.account.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!existingAccount) {
    throw createNotFoundError();
  }

  const account = await prisma.account.update({
    where: { id },
    data: { name, type, initialBalance },
    select: accountSelect
  });

  return (await attachBalances(userId, [account]))[0];
}

async function deleteAccount(id, userId) {
  const existingAccount = await prisma.account.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!existingAccount) {
    throw createNotFoundError();
  }

  const transactionCount = await prisma.transaction.count({
    where: { accountId: id }
  });

  if (transactionCount > 0) {
    const error = new Error('Cannot delete an account that has transactions');
    error.statusCode = 409;
    throw error;
  }

  await prisma.account.delete({ where: { id } });
}

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
};
