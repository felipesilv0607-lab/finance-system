const express = require('express');
const transactionsController = require('../controllers/transactionsController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', transactionsController.createTransaction);
router.get('/', transactionsController.getTransactions);
router.get('/:id', transactionsController.getTransactionById);
router.put('/:id', transactionsController.updateTransaction);
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router;