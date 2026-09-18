const prisma = require('../lib/prisma');

async function createAccount({
  userId,
  name,
  type,
  initialBalance
}) {
  return prisma.account.create({
    data: {
      userId,
      name,
      type,
      initialBalance
    },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function getAccounts(userId) {
  return prisma.account.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

async function getAccountById(id, userId) {
  return prisma.account.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function updateAccount(
  id,
  userId,
  {
    name,
    type,
    initialBalance
  }
) {
  const existingAccount = await prisma.account.findFirst({
    where: { id, userId }
  });

  if (!existingAccount) {
    const error = new Error('Account not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.account.update({
    where: { id },
    data: {
      name,
      type,
      initialBalance
    },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function deleteAccount(id, userId) {
  const existingAccount = await prisma.account.findFirst({
    where: { id, userId }
  });

  if (!existingAccount) {
    const error = new Error('Account not found');
    error.statusCode = 404;
    throw error;
  }

  const transactionCount = await prisma.transaction.count({
    where: { accountId: id }
  });

  if (transactionCount > 0) {
    const error = new Error(
      'Cannot delete an account that has transactions'
    );
    error.statusCode = 409;
    throw error;
  }

  await prisma.account.delete({
    where: { id }
  });
}

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
};
