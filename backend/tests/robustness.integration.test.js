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
