const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Nama wajib diisi'], trim: true },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password wajib diisi'],
      minlength: [6, 'Password minimal 6 karakter'],
      select: false, // tidak ikut terambil saat query biasa
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

// Hash password otomatis sebelum disimpan
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Dipakai saat login untuk membandingkan password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);