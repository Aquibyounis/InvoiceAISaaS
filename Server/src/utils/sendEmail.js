const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'reminders@yourdomain.com';
const fromName = process.env.FROM_NAME || 'AI Invoice';

const sendEmail = async ({ to, subject, body, replyTo }) => {
  try {
    const htmlContent = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
      <pre style="white-space:pre-wrap;font-size:14px;line-height:1.7;font-family:inherit">${body}</pre>
      <hr style="border:none;border-top:1px solid #eee;margin-top:32px"/>
      <p style="font-size:11px;color:#999;margin-top:12px">Sent via AI Invoice Recovery System</p>
    </div>`;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
      reply_to: replyTo,
    });

    if (error) {
      console.error('Resend email error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (err) {
    console.error('Fatal Resend email error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
