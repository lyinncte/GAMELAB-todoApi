const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    title: { type: String, required: [true, 'Judul wajib diisi'], trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    archived: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

todoSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Todo', todoSchema);