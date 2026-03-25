const nodemailer = require('nodemailer');

let sharedTransporter = null;

const createTransporter = async (userSmtp = null) => {
  // Use user's own configured Gmail SMTP if available
  if (userSmtp && userSmtp.configured && userSmtp.email && userSmtp.password) {
    return nodemailer.createTransport({
      host: userSmtp.host || 'smtp.gmail.com',
      port: userSmtp.port || 587,
      secure: false,
      auth: { user: userSmtp.email, pass: userSmtp.password },
    });
  }

  // Use configured system SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (!sharedTransporter) {
      sharedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      console.log('📧 Using system SMTP server');
    }
    return sharedTransporter;
  }

  // Ethereal fallback (dev only)
  if (!sharedTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    sharedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`📧 Ethereal test email: ${testAccount.user}`);
  }
  return sharedTransporter;
};

const sendEmail = async ({ to, toName, subject, body, userSmtp = null }) => {
  try {
    const transport = await createTransporter(userSmtp);

    const fromEmail = userSmtp?.configured ? userSmtp.email : (process.env.FROM_EMAIL || 'noreply@invoicerecovery.ai');
    const fromName  = process.env.FROM_NAME || 'AI Invoice Recovery';

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${toName}" <${to}>`,
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
        <pre style="white-space:pre-wrap;font-size:14px;line-height:1.7;font-family:inherit">${body}</pre>
        <hr style="border:none;border-top:1px solid #eee;margin-top:32px"/>
        <p style="font-size:11px;color:#999;margin-top:12px">Sent via InvoiceAI Recovery System</p>
      </div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`📧 Preview: ${previewUrl}`);

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
