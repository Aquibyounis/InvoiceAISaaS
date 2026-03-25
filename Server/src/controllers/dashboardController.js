const Invoice = require('../models/Invoice');
const ReminderLog = require('../models/ReminderLog');

// @desc  Get dashboard stats
// @route GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Auto-update overdue statuses
    await Invoice.updateMany(
      { userId, status: 'pending', dueDate: { $lt: now } },
      { status: 'overdue' }
    );

    const [
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      totalAmountResult,
      overdueAmountResult,
      paidAmountResult,
      recentReminders,
      recentInvoices,
    ] = await Promise.all([
      Invoice.countDocuments({ userId }),
      Invoice.countDocuments({ userId, status: 'pending' }),
      Invoice.countDocuments({ userId, status: 'overdue' }),
      Invoice.countDocuments({ userId, status: 'paid' }),
      Invoice.aggregate([
        { $match: { userId, status: { $in: ['pending', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Invoice.aggregate([
        { $match: { userId, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Invoice.aggregate([
        { $match: { userId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ReminderLog.find({ userId }).sort('-sentAt').limit(5),
      Invoice.find({ userId }).sort('-createdAt').limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        totalInvoices,
        pendingInvoices,
        overdueInvoices,
        paidInvoices,
        totalOutstanding: totalAmountResult[0]?.total || 0,
        totalOverdue: overdueAmountResult[0]?.total || 0,
        totalCollected: paidAmountResult[0]?.total || 0,
      },
      recentReminders,
      recentInvoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get monthly revenue data
// @route GET /api/dashboard/chart
const getChartData = async (req, res) => {
  try {
    const userId = req.user._id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Invoice.aggregate([
      {
        $match: {
          userId,
          status: 'paid',
          paidAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$paidAt' }, year: { $year: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getChartData };
