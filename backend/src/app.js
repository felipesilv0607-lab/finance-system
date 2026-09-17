const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const usersRoutes = require('./routes/users');
const accountsRoutes = require('./routes/accounts');
const categoriesRoutes = require('./routes/categories');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
