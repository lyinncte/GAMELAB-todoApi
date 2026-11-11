const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: [true, 'Nama kategori wajib diisi'], trim: true },
    color: { type: String, default: '#3498db' },
  },
  { timestamps: true }
);

// Nama kategori boleh sama antar user, tapi unik untuk satu user
categorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);