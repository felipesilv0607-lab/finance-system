const express = require('express');
const accountsController = require('../controllers/accountsController');

const router = express.Router();

router.post('/', accountsController.createAccount);
router.get('/', accountsController.getAccounts);
router.get('/:id', accountsController.getAccountById);
router.put('/:id', accountsController.updateAccount);
router.delete('/:id', accountsController.deleteAccount);

module.exports = router;
