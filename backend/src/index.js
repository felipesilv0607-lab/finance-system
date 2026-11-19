require('dotenv').config();

const { validateEnv } = require('./config');

validateEnv();

const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API backend listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
