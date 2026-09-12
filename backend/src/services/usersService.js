const prisma = require('../lib/prisma');

async function createUser({ name, email, passwordHash }) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function getUserByEmailForAuthentication(email) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true
    }
  });
}

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });
}        async function updateUser(id, { name, email }) {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email }
  });

  if (emailOwner && emailOwner.id !== id) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  return prisma.user.update({
    where: { id },
    data: {
      name,
      email
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });
}   async function deleteUser(id) {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({
    where: { id }
  });
}

module.exports = {
  createUser,
  getUserByEmailForAuthentication,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
