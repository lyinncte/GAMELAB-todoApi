const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    todo: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
    todoTitle: { type: String, default: '' }, // salinan judul, tetap ada setelah todo dihapus
    action: { type: String, enum: ['create', 'update', 'delete', 'complete'], required: true },
    description: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);