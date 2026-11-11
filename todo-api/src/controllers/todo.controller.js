const todoService = require('../services/todo.service');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getTodos = catchAsync(async (req, res) => {
  const { todos, pagination } = await todoService.getTodos(req.user, req.query);
  res.status(200).json({
    success: true,
    message: 'Todo berhasil diambil',
    data: todos,
    pagination,
  });
});

const getTodoById = catchAsync(async (req, res) => {
  const data = await todoService.getTodoById(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Todo berhasil diambil', data });
});

const createTodo = catchAsync(async (req, res) => {
  const data = await todoService.createTodo(req.user, req.body || {});
  res.status(201).json({ success: true, message: 'Todo berhasil dibuat', data });
});

const updateTodo = catchAsync(async (req, res) => {
  const data = await todoService.updateTodo(req.user, req.params.id, req.body || {});
  res.status(200).json({ success: true, message: 'Todo berhasil diperbarui', data });
});

const updateTodoStatus = catchAsync(async (req, res) => {
  const { status } = req.body || {};
  if (!status) throw new AppError('Status wajib diisi', 400);

  const data = await todoService.updateTodo(req.user, req.params.id, { status });
  res.status(200).json({ success: true, message: 'Status todo berhasil diubah', data });
});

const deleteTodo = catchAsync(async (req, res) => {
  const data = await todoService.deleteTodo(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Todo berhasil dihapus', data });
});

module.exports = { getTodos, getTodoById, createTodo, updateTodo, updateTodoStatus, deleteTodo };