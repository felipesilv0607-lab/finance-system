const prisma = require('../lib/prisma');

async function createAccount({
  userId,
  name,
  type,
  initialBalance
}) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

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
      userId: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function getAccounts() {
  return prisma.account.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

async function getAccountById(id) {
  return prisma.account.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function updateAccount(
  id,
  {
    name,
    type,
    initialBalance
  }
) {
  const existingAccount = await prisma.account.findUnique({
    where: { id }
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
      userId: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function deleteAccount(id) {
  const existingAccount = await prisma.account.findUnique({
    where: { id }
  });

  if (!existingAccount) {
    const error = new Error('Account not found');
    error.statusCode = 404;
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