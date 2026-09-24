const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const usersRoutes = require('./routes/users');
const accountsRoutes = require('./routes/accounts');
const categoriesRoutes = require('./routes/categories');
const transactionsRoutes = require('./routes/transactions');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = Number.isInteger(err.statusCode)
    ? err.statusCode
    : err.type === 'entity.too.large'
      ? 413
      : 500;

  const isInternalError = statusCode >= 500;

  res.status(statusCode).json({
    error: isInternalError
      ? 'Internal Server Error'
      : statusCode === 413
        ? 'Request body too large'
        : err.message || 'Request failed'
  });
});

module.exports = app;
