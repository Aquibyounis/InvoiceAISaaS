/**
 * AI Prompt Service — Structured tone-escalation email generator
 * Tones based on days overdue:
 *   polite   → 1–7 days
 *   reminder → 8–14 days
 *   firm     → 15–21 days
 *   final    → 22+ days
 */

const getTone = (daysOverdue) => {
  if (daysOverdue <= 7) return 'polite';
  if (daysOverdue <= 14) return 'reminder';
  if (daysOverdue <= 21) return 'firm';
  return 'final';
};

const templates = {
  polite: (data) => ({
    subject: `Friendly Reminder: Invoice ${data.invoiceNumber} Due — ${data.clientName}`,
    body: `Dear ${data.clientName},

I hope this message finds you well. This is a friendly reminder that Invoice ${data.invoiceNumber} for ${data.currencySymbol}${data.amount.toLocaleString()} was due on ${data.dueDateFormatted}.

If you've already processed this payment, please disregard this message. Otherwise, we'd appreciate it if you could arrange the payment at your earliest convenience.

Payment details:
• Invoice Number: ${data.invoiceNumber}
• Amount Due: ${data.currencySymbol}${data.amount.toLocaleString()}
• Due Date: ${data.dueDateFormatted}
• Days Overdue: ${data.daysOverdue} day(s)

If you have any questions or need to discuss payment arrangements, please don't hesitate to reach out.

Thank you for your prompt attention to this matter.

Best regards,
${data.senderName}
${data.senderEmail}`,
  }),

  reminder: (data) => ({
    subject: `Payment Reminder: Invoice ${data.invoiceNumber} — ${data.daysOverdue} Days Overdue`,
    body: `Dear ${data.clientName},

We hope you're doing well. We're writing to follow up on Invoice ${data.invoiceNumber} for ${data.currencySymbol}${data.amount.toLocaleString()}, which is now ${data.daysOverdue} days past its due date of ${data.dueDateFormatted}.

We understand that oversights happen, and we would appreciate your assistance in resolving this outstanding balance as soon as possible.

Outstanding Details:
• Invoice Number: ${data.invoiceNumber}
• Amount Due: ${data.currencySymbol}${data.amount.toLocaleString()}
• Original Due Date: ${data.dueDateFormatted}
• Days Overdue: ${data.daysOverdue} days

To avoid any service disruption, please process this payment at the earliest. If there are any issues with the invoice or if you require a payment plan, we're open to discussing options.

Please reply to this email or contact us directly to provide an update.

Regards,
${data.senderName}
${data.senderEmail}`,
  }),

  firm: (data) => ({
    subject: `URGENT: Invoice ${data.invoiceNumber} — ${data.daysOverdue} Days Overdue — Immediate Action Required`,
    body: `Dear ${data.clientName},

This is an urgent notice regarding Invoice ${data.invoiceNumber} for ${data.currencySymbol}${data.amount.toLocaleString()}, which is now significantly overdue by ${data.daysOverdue} days (original due date: ${data.dueDateFormatted}).

Despite our previous reminders, this invoice remains unpaid. We must insist on immediate settlement of this outstanding balance.

Invoice Details:
• Invoice Number: ${data.invoiceNumber}
• Amount Due: ${data.currencySymbol}${data.amount.toLocaleString()}
• Due Date: ${data.dueDateFormatted}
• Days Overdue: ${data.daysOverdue} days

Please be advised that continued non-payment may result in:
1. Suspension of services
2. Referral to our collections department
3. Additional late payment charges

We strongly urge you to contact us immediately to resolve this matter. If payment has already been sent, please share the transaction details so we can update our records.

Sincerely,
${data.senderName}
${data.senderEmail}`,
  }),

  final: (data) => ({
    subject: `FINAL NOTICE: Invoice ${data.invoiceNumber} — Legal Action Pending`,
    body: `Dear ${data.clientName},

FINAL PAYMENT NOTICE

Invoice ${data.invoiceNumber} for ${data.currencySymbol}${data.amount.toLocaleString()} is now ${data.daysOverdue} days overdue. This is our FINAL notice before we are forced to take further action.

Invoice Details:
• Invoice Number: ${data.invoiceNumber}
• Amount Due: ${data.currencySymbol}${data.amount.toLocaleString()}
• Original Due Date: ${data.dueDateFormatted}
• Days Overdue: ${data.daysOverdue} days

IMMEDIATE PAYMENT IS REQUIRED WITHIN 48 HOURS.

Failure to respond or pay will result in:
1. Immediate termination of any active services
2. Formal referral to our legal team and/or collections agency
3. Potential impact to your credit record
4. Additional legal costs and fees

To avoid these consequences, please pay immediately or contact us URGENTLY to establish a payment arrangement.

This email serves as formal written notice of your outstanding debt.

Final notice issued by,
${data.senderName}
${data.senderEmail}`,
  }),
};

/**
 * Generate AI email content
 * If OPENAI_API_KEY is set, uses OpenAI (optional upgrade)
 * Otherwise falls back to structured templates
 */
const generateEmail = async (invoice, user) => {
  const daysOverdue = Math.floor(
    (new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
  );
  const tone = getTone(daysOverdue);

  const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

  const data = {
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    currencySymbol: currencySymbols[invoice.currency] || invoice.currency,
    dueDateFormatted: new Date(invoice.dueDate).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    daysOverdue,
    senderName: user.name || 'The Accounts Team',
    senderEmail: user.email,
  };

  // OpenAI path (optional)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemPrompt = `You are a professional accounts receivable specialist. Generate a ${tone} payment reminder email. The tone should be: ${tone === 'polite' ? 'friendly and understanding' : tone === 'reminder' ? 'professional but pressing' : tone === 'firm' ? 'firm and urgent' : 'final warning, serious legal consequences'}. Keep it professional, concise, and effective.`;
      const userPrompt = `Generate a ${tone} payment reminder email for:
- Client: ${data.clientName}
- Invoice: ${data.invoiceNumber}
- Amount: ${data.currencySymbol}${data.amount}
- Due Date: ${data.dueDateFormatted}
- Days Overdue: ${data.daysOverdue}
- Sender: ${data.senderName} (${data.senderEmail})

Return JSON: { "subject": "...", "body": "..." }`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        response_format: { type: 'json_object' },
      });
      const result = JSON.parse(completion.choices[0].message.content);
      return { tone, daysOverdue, subject: result.subject, body: result.body };
    } catch (err) {
      console.warn('OpenAI failed, falling back to templates:', err.message);
    }
  }

  // Template-based fallback
  const template = templates[tone](data);
  return { tone, daysOverdue, subject: template.subject, body: template.body };
};

module.exports = { generateEmail, getTone };
