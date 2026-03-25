const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const ReminderLog = require('../models/ReminderLog');
const { generateEmail } = require('./aiPromptService');
const { sendEmail } = require('../utils/sendEmail');

const processOverdueInvoices = async (isManualObj = false) => {
  // express routes might pass req, res as arguments, so ensure we check boolean
  const isManual = isManualObj === true;
  console.log(`\n🔄 [CRON] Running overdue invoice check (Manual: ${isManual}) at ${new Date().toISOString()}`);

  try {
    const now = new Date();
    
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
    });
    let currentHHMM = istFormatter.format(now);
    if (currentHHMM.startsWith('24')) currentHHMM = '00' + currentHHMM.substring(2);
    const currentHourPrefix = currentHHMM.split(':')[0]; // e.g., "09"

    // Find all non-paid invoices past due date
    const overdueInvoices = await Invoice.find({
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lt: now },
    }).populate('userId', 'name email plan cronTime smtp');

    console.log(`📋 Found ${overdueInvoices.length} overdue invoice(s)`);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const invoice of overdueInvoices) {
      const user = invoice.userId;
      if (!user) { skipped++; continue; }

      // If scheduled cron run, only process if the current hour matches the user's cronTime
      if (!isManual) {
        const userCronHour = (user.cronTime || '09:00').split(':')[0];
        if (userCronHour !== currentHourPrefix) {
          skipped++;
          continue;
        }
      }

      // Free plan: max 3 reminders per invoice
      if (user.plan === 'free' && invoice.remindersSent >= 3) {
        skipped++;
        continue;
      }

      // Avoid sending more than one reminder per day per invoice
      if (invoice.lastReminderAt) {
        const hoursSinceLast = (now - new Date(invoice.lastReminderAt)) / (1000 * 60 * 60);
        if (hoursSinceLast < 23) { skipped++; continue; }
      }

      // Update status to overdue
      if (invoice.status === 'pending') {
        await Invoice.findByIdAndUpdate(invoice._id, { status: 'overdue' });
      }

      try {
        // Generate AI email
        const { tone, daysOverdue, subject, body } = await generateEmail(invoice, user);

        // Send email via Resend
        const emailResult = await sendEmail({
          to: invoice.clientEmail,
          subject,
          body,
          replyTo: user.email,
        });

        // Log the reminder
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
          remindersSent: invoice.remindersSent + 1,
          lastReminderAt: now,
          lastToneSent: tone,
        });

        if (emailResult.success) {
          console.log(`  ✅ Sent ${tone} reminder to ${invoice.clientEmail} (Invoice ${invoice.invoiceNumber})`);
          sent++;
        } else {
          console.log(`  ⚠️  Failed to send to ${invoice.clientEmail}: ${emailResult.error}`);
          errors++;
        }
      } catch (err) {
        console.error(`  ❌ Error processing invoice ${invoice.invoiceNumber}:`, err.message);
        errors++;
      }
    }

    console.log(`📊 [CRON] Done — Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}\n`);
    return { sent, skipped, errors, total: overdueInvoices.length };
  } catch (err) {
    console.error('❌ [CRON] Fatal error:', err.message);
    throw err;
  }
};

const startCronJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => processOverdueInvoices(false), {
    timezone: 'Asia/Kolkata',
  });
  console.log('⏰ Cron job scheduled: Hourly check for user-defined times');
};

module.exports = { startCronJob, processOverdueInvoices };
