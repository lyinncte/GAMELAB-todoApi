const activityService = require('../services/activity.service');
const catchAsync = require('../utils/catchAsync');

const getLogs = catchAsync(async (req, res) => {
  const { logs, pagination } = await activityService.getLogs(req.user, req.query);
  res.status(200).json({
    success: true,
    message: 'Activity log berhasil diambil',
    data: logs,
    pagination,
  });
});

module.exports = { getLogs };