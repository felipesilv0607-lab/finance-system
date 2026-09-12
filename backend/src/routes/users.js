const express = require('express');
const usersController = require('../controllers/usersController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', usersController.createUser);
router.post('/login', usersController.loginUser);
router.use(authenticate);
router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
