const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
require('dotenv').config();

const app = require('../src/app');
const prisma = require('../src/lib/prisma');

test('rota inexistente retorna 404 JSON e cadastro simultâneo retorna 409 (não 500)', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const email = `race-${crypto.randomUUID()}@example.test`;

  try {
    const missing = await fetch(`${base}/nao-existe`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'Route not found' });

    const register = () =>
      fetch(`${base}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Race User', email, password: 'Passw0rd!' })
      });

    const statuses = (await Promise.all([register(), register(), register()]))
      .map((response) => response.status)
      .sort();

    assert.equal(statuses.filter((status) => status === 201).length, 1);
    assert.equal(statuses.filter((status) => status === 409).length, 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('listagem de transações valida e aplica filtros/paginação opcionais', async () => {
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const user = await prisma.user.create({
    data: {
      name: 'List Test',
      email: `list-${crypto.randomUUID()}@test.com`,
      passwordHash: await bcrypt.hash('Password123!', 4)
    }
  });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: process.env.JWT_ISSUER || 'finance-system-api',
    audience: process.env.JWT_AUDIENCE || 'finance-system-client'
  });
  const account = await prisma.account.create({
    data: { userId: user.id, name: 'A', type: 'BANK' }
  });
  const category = await prisma.category.create({
    data: { userId: user.id, name: 'C', type: 'INCOME' }
  });

  for (const day of ['01', '02', '03']) {
    await prisma.transaction.create({
      data: {
        userId: user.id, accountId: account.id, categoryId: category.id,
        description: `dia ${day}`, amount: '10.00', type: 'INCOME',
        date: new Date(`2026-03-${day}T12:00:00Z`)
      }
    });
  }

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/transactions`;
  const list = async (query) => {
    const response = await fetch(`${base}${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { status: response.status, body: await response.json() };
  };

  try {
    assert.equal((await list('')).body.length, 3);
    assert.deepEqual(
      (await list('?limit=2')).body.map((t) => t.description),
      ['dia 03', 'dia 02']
    );
    assert.deepEqual(
      (await list('?limit=2&offset=2')).body.map((t) => t.description),
      ['dia 01']
    );
    assert.equal(
      (await list('?from=2026-03-02T00:00:00Z&to=2026-03-03T00:00:00Z')).body.length,
      1
    );
    for (const bad of ['?limit=0', '?limit=501', '?limit=abc', '?offset=-1', '?from=x', '?type=NOPE']) {
      assert.equal((await list(bad)).status, 400, bad);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('categoria em uso não pode mudar de tipo, mas pode ser renomeada', async () => {
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const user = await prisma.user.create({
    data: {
      name: 'Cat Type',
      email: `cattype-${crypto.randomUUID()}@test.com`,
      passwordHash: await bcrypt.hash('Password123!', 4)
    }
  });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: process.env.JWT_ISSUER || 'finance-system-api',
    audience: process.env.JWT_AUDIENCE || 'finance-system-client'
  });
  const account = await prisma.account.create({
    data: { userId: user.id, name: 'A', type: 'BANK' }
  });
  const used = await prisma.category.create({
    data: { userId: user.id, name: 'Usada', type: 'INCOME' }
  });
  const unused = await prisma.category.create({
    data: { userId: user.id, name: 'Livre', type: 'INCOME' }
  });
  await prisma.transaction.create({
    data: {
      userId: user.id, accountId: account.id, categoryId: used.id,
      description: 'x', amount: '1.00', type: 'INCOME'
    }
  });

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/categories`;
  const put = (id, body) =>
    fetch(`${base}/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

  try {
    assert.equal((await put(used.id, { name: 'Usada', type: 'EXPENSE' })).status, 409);
    assert.equal((await put(used.id, { name: 'Renomeada', type: 'INCOME' })).status, 200);
    assert.equal((await put(unused.id, { name: 'Livre', type: 'EXPENSE' })).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.user.delete({ where: { id: user.id } });
  }
});
