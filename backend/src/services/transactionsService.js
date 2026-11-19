const prisma = require('../lib/prisma');

const transactionSelect = {
  id: true,
  description: true,
  amount: true,
  type: true,
  date: true,
  accountId: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true
};

function createNotFoundError() {
  const error = new Error('Transaction not found');
  error.statusCode = 404;
  return error;
}

function createAccountNotFoundError() {
  const error = new Error('Account not found');
  error.statusCode = 404;
  return error;
}

function createCategoryNotFoundError() {
  const error = new Error('Category not found');
  error.statusCode = 404;
  return error;
}

function createCategoryTypeMismatchError() {
  const error = new Error(
    'Category type must match transaction type'
  );
  error.statusCode = 400;
  return error;
}

async function validateAccountAndCategory({
  userId,
  accountId,
  categoryId,
  type
}, db = prisma) {
  const account = await db.account.findFirst({
    where: {
      id: accountId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!account) {
    throw createAccountNotFoundError();
  }

  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      userId
    },
    select: {
      id: true,
      type: true
    }
  });

  if (!category) {
    throw createCategoryNotFoundError();
  }

  if (category.type !== type) {
    throw createCategoryTypeMismatchError();
  }
}

async function createTransaction({
  userId,
  description,
  amount,
  type,
  date,
  accountId,
  categoryId
}) {
  return prisma.$transaction(async (tx) => {
    await validateAccountAndCategory(
      { userId, accountId, categoryId, type },
      tx
    );

    return tx.transaction.create({
      data: {
        userId,
        description,
        amount,
        type,
        date,
        accountId,
        categoryId
      },
      select: transactionSelect
    });
  });
}

// Filtros opcionais: type, accountId, categoryId, q (descrição, sem diferenciar
// maiúsculas), from (inclusivo), to (exclusivo), limit, offset.
// Sem limit, mantém o comportamento original (lista completa).
// Prisma repassa % e _ ao LIKE sem escapar; escapa-os para a busca ser literal.
function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

async function getTransactions(
  userId,
  { type, from, to, accountId, categoryId, q, limit, offset } = {}
) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
      ...(accountId ? { accountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { description: { contains: escapeLike(q), mode: 'insensitive' } } : {}),
      ...(from || to
        ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } }
        : {})
    },
    select: transactionSelect,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    ...(limit ? { take: limit } : {}),
    ...(offset ? { skip: offset } : {})
  });
}

async function getTransactionById(id, userId) {
  return prisma.transaction.findFirst({
    where: {
      id,
      userId
    },
    select: transactionSelect
  });
}

async function updateTransaction(
  id,
  userId,
  { description, amount, type, date, accountId, categoryId }
) {
  return prisma.$transaction(async (tx) => {
    const existingTransaction = await tx.transaction.findFirst({
      where: { id, userId },
      select: { id: true }
    });

    if (!existingTransaction) {
      throw createNotFoundError();
    }

    await validateAccountAndCategory(
      { userId, accountId, categoryId, type },
      tx
    );

    return tx.transaction.update({
      where: { id },
      data: { description, amount, type, date, accountId, categoryId },
      select: transactionSelect
    });
  });
}

async function deleteTransaction(id, userId) {
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId
    },
    select: {
      id: true
    }
  });

  if (!existingTransaction) {
    throw createNotFoundError();
  }

  await prisma.transaction.delete({
    where: {
      id
    }
  });
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};