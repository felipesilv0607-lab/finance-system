const prisma = require('../lib/prisma');

const categorySelect = {
  id: true,
  name: true,
  type: true,
  createdAt: true,
  updatedAt: true
};

function createNotFoundError() {
  const error = new Error('Category not found');
  error.statusCode = 404;
  return error;
}

function createDuplicateError() {
  const error = new Error('A category with this name and type already exists');
  error.statusCode = 409;
  return error;
}

function createInUseError() {
  const error = new Error('Category cannot be deleted because it is used by transactions');
  error.statusCode = 409;
  return error;
}

function isUniqueConstraintError(error) {
  return error?.code === 'P2002';
}

function isForeignKeyConstraintError(error) {
  return error?.code === 'P2003';
}

async function createCategory({ userId, name, type }) {
  try {
    return await prisma.category.create({
      data: { userId, name, type },
      select: categorySelect
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createDuplicateError();
    }

    throw error;
  }
}

async function getCategories(userId, type) {
  return prisma.category.findMany({
    where: {
      userId,
      ...(type ? { type } : {})
    },
    select: categorySelect,
    orderBy: [
      { name: 'asc' },
      { createdAt: 'asc' }
    ]
  });
}

async function getCategoryById(id, userId) {
  return prisma.category.findFirst({
    where: { id, userId },
    select: categorySelect
  });
}

async function updateCategory(id, userId, { name, type }) {
  const existingCategory = await prisma.category.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!existingCategory) {
    throw createNotFoundError();
  }

  try {
    return await prisma.category.update({
      where: { id },
      data: { name, type },
      select: categorySelect
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createDuplicateError();
    }

    throw error;
  }
}

async function deleteCategory(id, userId) {
  const existingCategory = await prisma.category.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!existingCategory) {
    throw createNotFoundError();
  }

  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id }
  });

  if (transactionCount > 0) {
    throw createInUseError();
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      throw createInUseError();
    }

    throw error;
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
