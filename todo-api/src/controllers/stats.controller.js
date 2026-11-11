const statsService = require('../services/stats.service');
const catchAsync = require('../utils/catchAsync');

const getSummary = catchAsync(async (req, res) => {
  const data = await statsService.getSummary();
  res.status(200).json({
    success: true,
    message: 'Ringkasan statistik berhasil diambil',
    data,
  });
});

module.exports = { getSummary };