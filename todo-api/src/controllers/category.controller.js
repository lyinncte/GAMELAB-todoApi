const categoryService = require('../services/category.service');
const catchAsync = require('../utils/catchAsync');

const getCategories = catchAsync(async (req, res) => {
  const data = await categoryService.getCategories(req.user);
  res.status(200).json({ success: true, message: 'Kategori berhasil diambil', data });
});

const getCategoryById = catchAsync(async (req, res) => {
  const data = await categoryService.getCategoryById(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Kategori berhasil diambil', data });
});

const createCategory = catchAsync(async (req, res) => {
  const data = await categoryService.createCategory(req.user, req.body || {});
  res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data });
});

const updateCategory = catchAsync(async (req, res) => {
  const data = await categoryService.updateCategory(req.user, req.params.id, req.body || {});
  res.status(200).json({ success: true, message: 'Kategori berhasil diperbarui', data });
});

const deleteCategory = catchAsync(async (req, res) => {
  const data = await categoryService.deleteCategory(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Kategori berhasil dihapus', data });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};