const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
  },
  clientEmail: {
    type: String,
    required: [true, 'Client email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  invoiceNumber: {
    type: String,
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least 1'],
  },
  currency: {
    type: String,
    default: 'INR',
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'overdue', 'paid', 'cancelled'],
    default: 'pending',
  },
  remindersSent: {
    type: Number,
    default: 0,
  },
  lastReminderAt: { type: Date },
  lastToneSent: {
    type: String,
    enum: ['polite', 'reminder', 'firm', 'final', null],
    default: null,
  },
  paidAt: { type: Date },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments({ userId: this.userId });
    this.invoiceNumber = `INV-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
});


// Virtual: days overdue
invoiceSchema.virtual('daysOverdue').get(function () {
  if (this.status === 'paid') return 0;
  const today = new Date();
  const due = new Date(this.dueDate);
  if (today <= due) return 0;
  return Math.floor((today - due) / (1000 * 60 * 60 * 24));
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
