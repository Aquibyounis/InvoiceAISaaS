const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  clientName: { type: String },
  clientEmail: { type: String },
  invoiceNumber: { type: String },
  amount: { type: Number },
  tone: {
    type: String,
    enum: ['polite', 'reminder', 'firm', 'final'],
    required: true,
  },
  daysOverdue: { type: Number },
  subject: { type: String },
  emailBody: { type: String },
  sentAt: { type: Date, default: Date.now },
  success: { type: Boolean, default: true },
  error: { type: String },
  messageId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
