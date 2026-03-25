const ReminderLog = require('../models/ReminderLog');
const { processOverdueInvoices } = require('../services/cronService');

// @desc  Get reminder logs
// @route GET /api/reminders
const getReminders = async (req, res) => {
  try {
    const { page = 1, limit = 20, tone, invoiceId } = req.query;
    const query = { userId: req.user._id };
    if (tone) query.tone = tone;
    if (invoiceId) query.invoiceId = invoiceId;

    const skip = (page - 1) * limit;
    const [reminders, total] = await Promise.all([
      ReminderLog.find(query).sort('-sentAt').skip(skip).limit(parseInt(limit)).populate('invoiceId', 'invoiceNumber status'),
      ReminderLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      reminders,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Manually trigger reminder processing (dev/test)
// @route POST /api/reminders/trigger
const triggerReminders = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production.' });
  }
  try {
    const result = await processOverdueInvoices();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReminders, triggerReminders };
