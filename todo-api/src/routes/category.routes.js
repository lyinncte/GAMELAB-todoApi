const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const categoryValidator = require('../validators/category.validator');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router
  .route('/')
  .get(categoryController.getCategories)
  .post(categoryValidator.createCategory, validate, categoryController.createCategory);

router
  .route('/:id')
  .get(categoryValidator.byId, validate, categoryController.getCategoryById)
  .put(categoryValidator.updateCategory, validate, categoryController.updateCategory)
  .delete(categoryValidator.byId, validate, categoryController.deleteCategory);

module.exports = router;