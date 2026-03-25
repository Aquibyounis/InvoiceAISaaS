const Invoice = require('../models/Invoice');
const ReminderLog = require('../models/ReminderLog');
const User = require('../models/User');
const { generateEmail } = require('../services/aiPromptService');
const { sendEmail } = require('../services/emailService');

const FREE_INVOICE_LIMIT = 4;

// @desc  Get all invoices for user
// @route GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = { userId: req.user._id };

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Invoice.countDocuments(query),
    ]);

    // Auto-update overdue status
    const now = new Date();
    const overdueIds = invoices
      .filter(inv => inv.status === 'pending' && new Date(inv.dueDate) < now)
      .map(inv => inv._id);
    if (overdueIds.length > 0) {
      await Invoice.updateMany({ _id: { $in: overdueIds } }, { status: 'overdue' });
      invoices.forEach(inv => {
        if (overdueIds.some(id => id.equals(inv._id))) inv.status = 'overdue';
      });
    }

    res.json({
      success: true,
      invoices,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single invoice
// @route GET /api/invoices/:id
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create invoice
// @route POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    // Free plan limit: 4 invoices
    if (req.user.plan === 'free') {
      const count = await Invoice.countDocuments({ userId: req.user._id });
      if (count >= FREE_INVOICE_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `Free plan limit reached (${FREE_INVOICE_LIMIT} invoices). Please upgrade to add more.`,
        });
      }
    }

    const { clientName, clientEmail, amount, dueDate, description, currency, notes } = req.body;
    const invoice = await Invoice.create({
      userId: req.user._id,
      clientName,
      clientEmail,
      amount,
      dueDate,
      description,
      currency: currency || 'INR',
      notes,
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update invoice
// @route PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const { clientName, clientEmail, amount, dueDate, status, description, currency, notes } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const updates = {};
    if (clientName) updates.clientName = clientName;
    if (clientEmail) updates.clientEmail = clientEmail;
    if (amount) updates.amount = amount;
    if (dueDate) updates.dueDate = dueDate;
    if (status) {
      updates.status = status;
      if (status === 'paid') updates.paidAt = new Date();
    }
    if (description !== undefined) updates.description = description;
    if (currency) updates.currency = currency;
    if (notes !== undefined) updates.notes = notes;

    const updated = await Invoice.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, invoice: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete invoice
// @route DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Mark invoice as paid
// @route PUT /api/invoices/:id/mark-paid
const markPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Send reminder for a specific invoice NOW
// @route POST /api/invoices/:id/send-reminder
const sendReminderNow = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid. No reminder needed.' });
    }

    if (invoice.status !== 'overdue') {
      const dueDate = new Date(invoice.dueDate);
      if (dueDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Invoice is not yet overdue. Reminder can only be sent for overdue invoices.' });
      }
    }

    // 23-hour cooldown check
    if (invoice.lastReminderAt) {
      const hoursSinceLast = (new Date() - new Date(invoice.lastReminderAt)) / (1000 * 60 * 60);
      if (hoursSinceLast < 23) {
        const hoursLeft = Math.ceil(23 - hoursSinceLast);
        return res.status(429).json({
          success: false,
          alreadySent: true,
          message: `A reminder was already sent ${Math.floor(hoursSinceLast)}h ago. Please wait ${hoursLeft}h before sending another.`,
          hoursLeft,
          lastSentAt: invoice.lastReminderAt,
        });
      }
    }

    // Get user with SMTP config
    const user = await User.findById(req.user._id).select('+smtp.password');

    // Mark overdue if needed
    if (invoice.status === 'pending') {
      await Invoice.findByIdAndUpdate(invoice._id, { status: 'overdue' });
      invoice.status = 'overdue';
    }

    // Generate AI email with proper tone based on days overdue
    const { tone, daysOverdue, subject, body } = await generateEmail(invoice, user);

    // Send from user's Gmail if configured, otherwise fallback
    const emailResult = await sendEmail({
      to: invoice.clientEmail,
      toName: invoice.clientName,
      subject,
      body,
      userSmtp: user.smtp?.configured ? user.smtp : null,
    });

    // Log it
    await ReminderLog.create({
      invoiceId: invoice._id,
      userId: user._id,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      tone,
      daysOverdue,
      subject,
      emailBody: body,
      success: emailResult.success,
      error: emailResult.error || null,
      messageId: emailResult.messageId || null,
    });

    // Update invoice
    await Invoice.findByIdAndUpdate(invoice._id, {
      remindersSent: (invoice.remindersSent || 0) + 1,
      lastReminderAt: new Date(),
      lastToneSent: tone,
    });

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: `Email send failed: ${emailResult.error}` });
    }

    res.json({
      success: true,
      tone,
      daysOverdue,
      message: `${tone.charAt(0).toUpperCase() + tone.slice(1)} reminder sent to ${invoice.clientEmail}`,
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, markPaid, sendReminderNow };
