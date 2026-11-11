const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');
const todoValidator = require('../validators/todo.validator');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router

  .route('/')
  .get(todoValidator.getTodos, validate, todoController.getTodos)
  .post(todoValidator.createTodo, validate, todoController.createTodo);

router
  .route('/:id')
  .get(todoValidator.byId, validate, todoController.getTodoById)
  .put(todoValidator.updateTodo, validate, todoController.updateTodo)
  .delete(todoValidator.byId, validate, todoController.deleteTodo);

router.patch('/:id/status', todoValidator.updateStatus, validate, todoController.updateTodoStatus);

module.exports = router;