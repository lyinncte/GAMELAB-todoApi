const Category = require('../models/Category');
const Todo = require('../models/Todo');
const AppError = require('../utils/AppError');

const isOwner = (category, user) => category.user.toString() === user._id.toString();

const handleDuplicate = (err) => {
  if (err.code === 11000) {
    throw new AppError('Kategori dengan nama tersebut sudah ada', 409);
  }
  throw err;
};

const findOrFail = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError('Kategori tidak ditemukan', 404);
  return category;
};

const getCategories = async (user) => {
  const isAdmin = user.role === 'admin';
  const query = Category.find(isAdmin ? {} : { user: user._id }).sort({ name: 1 });
  if (isAdmin) query.populate('user', 'name email');
  return await query;
};

const getCategoryById = async (user, id) => {
  const category = await findOrFail(id);
  if (!isOwner(category, user) && user.role !== 'admin') {
    throw new AppError('Anda tidak punya izin mengakses kategori ini', 403);
  }
  return category;
};

const createCategory = async (user, data) => {
  try {
    return await Category.create({ user: user._id, name: data.name, color: data.color });
  } catch (err) {
    handleDuplicate(err);
  }
};

const updateCategory = async (user, id, data) => {
  const category = await findOrFail(id);
  if (!isOwner(category, user)) {
    throw new AppError('Anda hanya boleh mengubah kategori milik sendiri', 403);
  }

  if (data.name !== undefined) category.name = data.name;
  if (data.color !== undefined) category.color = data.color;

  try {
    await category.save();
  } catch (err) {
    handleDuplicate(err);
  }
  return category;
};

const deleteCategory = async (user, id) => {
  const category = await findOrFail(id);
  if (!isOwner(category, user)) {
    throw new AppError('Anda hanya boleh menghapus kategori milik sendiri', 403);
  }

  // Todo yang memakai kategori ini dilepas, bukan ikut terhapus
  await Todo.updateMany({ category: category._id }, { category: null });
  await category.deleteOne();
  return category;
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};