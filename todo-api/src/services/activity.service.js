const ActivityLog = require('../models/ActivityLog');

// Mencatat aktivitas. Kegagalan pencatatan tidak boleh menggagalkan request utama.
const log = async (user, action, todo, description) => {
  try {
    await ActivityLog.create({
      user: user._id,
      todo: todo._id,
      todoTitle: todo.title,
      action,
      description,
    });
  } catch (err) {
    console.error('Gagal mencatat activity log:', err.message);
  }
};

const getLogs = async (user, query) => {
  const isAdmin = user.role === 'admin';
  const filter = isAdmin ? {} : { user: user._id };

  if (query.action) filter.action = query.action;
  if (query.todo) filter.todo = query.todo;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const finder = ActivityLog.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  if (isAdmin) finder.populate('user', 'name email');

  const [logs, totalItems] = await Promise.all([finder, ActivityLog.countDocuments(filter)]);
  const totalPages = Math.ceil(totalItems / limit);

  return {
    logs,
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

module.exports = { log, getLogs };