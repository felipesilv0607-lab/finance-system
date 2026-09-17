const express = require('express');
const categoriesController = require('../controllers/categoriesController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.post('/', categoriesController.createCategory);
router.get('/', categoriesController.getCategories);
router.get('/:id', categoriesController.getCategoryById);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
