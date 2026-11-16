const User = require('../models/User');
const Category = require('../models/Category');
const Todo = require('../models/Todo');
const ActivityLog = require('../models/ActivityLog');

const STATUSES = ['pending', 'in_progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];
const DAY = 24 * 60 * 60 * 1000;

// Hitung jumlah todo per nilai sebuah field; nilai yang belum ada diisi 0
const countBy = async (field, keys) => {
  const rows = await Todo.aggregate([{ $group: { _id: `$${field}`, total: { $sum: 1 } } }]);
  const counts = Object.fromEntries(rows.map((row) => [row._id, row.total]));
  return Object.fromEntries(keys.map((key) => [key, counts[key] || 0]));
};

const getSummary = async () => {
  const now = new Date();

  const [
    totalUsers,
    totalCategories,
    totalTodos,
    byStatus,
    byPriority,
    overdue,
    totalActivities,
    activitiesLast7Days,
  ] = await Promise.all([
    User.countDocuments(),
    Category.countDocuments(),
    Todo.countDocuments(),
    countBy('status', STATUSES),
    countBy('priority', PRIORITIES),
    Todo.countDocuments({ status: { $ne: 'completed' }, dueDate: { $lt: now } }),
    ActivityLog.countDocuments(),
    ActivityLog.countDocuments({ createdAt: { $gte: new Date(now - 7 * DAY) } }),
  ]);

  const completionRate = totalTodos
    ? Math.round((byStatus.completed / totalTodos) * 1000) / 10
    : 0;

  return {
    users: totalUsers,
    categories: totalCategories,
    todos: {
      total: totalTodos,
      byStatus,
      byPriority,
      overdue,
      completionRate, // persen todo berstatus completed
    },
    activity: {
      total: totalActivities,
      last7Days: activitiesLast7Days,
    },
    generatedAt: now.toISOString(),
  };
};

module.exports = { getSummary };