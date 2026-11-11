const mongoose = require('mongoose');
const Todo = require('../models/Todo');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const activityService = require('./activity.service');

const TRACKED_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'category'];

const isOwner = (todo, user) => todo.user.toString() === user._id.toString();

const findOrFail = async (id) => {
  const todo = await Todo.findById(id);
  if (!todo) throw new AppError('Todo tidak ditemukan', 404);
  return todo;
};

// Kategori harus ada DAN milik user yang sama
const resolveCategory = async (categoryId, userId) => {
  if (categoryId === null || categoryId === '') return null;
  if (typeof categoryId !== 'string' || !mongoose.isValidObjectId(categoryId)) {
    throw new AppError('ID kategori tidak valid', 400);
  }
  const category = await Category.findOne({ _id: categoryId, user: userId });
  if (!category) throw new AppError('Kategori tidak ditemukan', 404);
  return category._id;
};

// Hanya field yang diizinkan yang dibaca dari input (user tidak bisa diubah lewat body)
const applyData = async (todo, data) => {
  for (const field of ['title', 'description', 'priority', 'dueDate']) {
    if (data[field] !== undefined) todo[field] = data[field];
  }

  if (data.category !== undefined) {
    todo.category = await resolveCategory(data.category, todo.user);
  }

  if (data.status !== undefined) {
    todo.status = data.status;
    todo.completedAt = data.status === 'done' ? todo.completedAt || new Date() : null;
  }
};

// Karakter khusus regex di-escape supaya search "(" atau ".*" tidak error
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTodos = async (user, query) => {
  const isAdmin = user.role === 'admin';
  const filter = isAdmin ? {} : { user: user._id };

  // Filter
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  // Search pada judul dan deskripsi (tidak peduli huruf besar/kecil)
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  // Pagination dan sorting
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const sortBy = query.sortBy || 'createdAt';
  const direction = query.order === 'asc' ? 1 : -1;

  const finder = Todo.find(filter)
    // _id sebagai pembeda urutan supaya halaman tidak saling tumpang tindih
    .sort({ [sortBy]: direction, _id: direction })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category', 'name color');
  if (isAdmin) finder.populate('user', 'name email');

  const [todos, totalItems] = await Promise.all([finder, Todo.countDocuments(filter)]);
  const totalPages = Math.ceil(totalItems / limit);

  return {
    todos,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getTodoById = async (user, id) => {
  const todo = await findOrFail(id);
  if (!isOwner(todo, user) && user.role !== 'admin') {
    throw new AppError('Anda tidak punya izin mengakses todo ini', 403);
  }
  await todo.populate('category', 'name color');
  return todo;
};

const createTodo = async (user, data) => {
  const todo = new Todo({ user: user._id }); // pemilik selalu dari token
  await applyData(todo, data);
  await todo.save();
  await todo.populate('category', 'name color');

  await activityService.log(user, 'create', todo, `Membuat todo "${todo.title}"`);
  return todo;
};

const updateTodo = async (user, id, data) => {
  const todo = await findOrFail(id);
  if (!isOwner(todo, user)) {
    throw new AppError('Anda hanya boleh mengubah todo milik sendiri', 403);
  }

  const wasDone = todo.status === 'done';
  await applyData(todo, data);
  await todo.save();
  await todo.populate('category', 'name color');

  const becameDone = !wasDone && todo.status === 'done';
  const changed = TRACKED_FIELDS.filter((field) => data[field] !== undefined);
  await activityService.log(
    user,
    becameDone ? 'complete' : 'update',
    todo,
    becameDone
      ? `Menyelesaikan todo "${todo.title}"`
      : `Mengubah todo "${todo.title}" (field: ${changed.join(', ')})`
  );
  return todo;
};

const deleteTodo = async (user, id) => {
  const todo = await findOrFail(id);
  if (!isOwner(todo, user)) {
    throw new AppError('Anda hanya boleh menghapus todo milik sendiri', 403);
  }
  await todo.deleteOne();

  await activityService.log(user, 'delete', todo, `Menghapus todo "${todo.title}"`);
  return todo;
};

module.exports = { getTodos, getTodoById, createTodo, updateTodo, deleteTodo };