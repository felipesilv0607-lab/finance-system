const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getAllowedOrigins, getTrustProxy } = require('./config');
const healthRoutes = require('./routes/health');
const usersRoutes = require('./routes/users');
const accountsRoutes = require('./routes/accounts');
const categoriesRoutes = require('./routes/categories');
const transactionsRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.set('trust proxy', getTrustProxy());

app.use(helmet());
app.use(cors({ origin: getAllowedOrigins() }));
app.use(express.json({ limit: '100kb' }));
// No Express 5, req.body fica undefined sem corpo JSON (sem Content-Type ou
// text/plain). Um objeto vazio faz essas requisições caírem na validação (400)
// em vez de quebrar a desestruturação nos controllers (500).
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

app.use('/api/health', healthRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number.isInteger(err.statusCode)
    ? err.statusCode
    : err.type === 'entity.too.large'
      ? 413
      : 500;

  // Só erros inesperados (5xx) vão para o log de erro; 4xx são esperados.
  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error:
      statusCode >= 500
        ? 'Internal Server Error'
        : statusCode === 413
          ? 'Request body too large'
          : err.message || 'Request failed'
  });
});

module.exports = app;
