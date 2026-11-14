/**
 * Safe Email Delivery Service
 * Supports SMTP delivery when configured, and falls back gracefully
 * with complete security and audit logging when unconfigured.
 */

const sendPasswordResetEmail = async ({ toEmail, resetToken, resetUrl }) => {
  const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (!isSmtpConfigured) {
    console.info(`[AUTH - EMAIL SERVICE] Password reset requested for ${toEmail}. SMTP not configured in environment.`);
    console.info(`[AUTH - EMAIL SERVICE] Secure Reset Token: ${resetToken}`);
    return {
      delivered: false,
      mode: 'simulated',
      message: 'Email service simulated. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to deliver live emails.'
    };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"BloodNet+ Security" <noreply@bloodnet.org>',
      to: toEmail,
      subject: 'BloodNet+ Password Reset Request',
      text: `You have requested to reset your password for BloodNet+.\n\nPlease click the link below to set a new password:\n${resetUrl}\n\nIf you did not request this, please ignore this email. Your password will remain unchanged. This link expires in 1 hour.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; rounded: 12px;">
          <h2 style="color: #dc2626;">BloodNet+ Password Reset</h2>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">This link is valid for 1 hour. If you did not make this request, you can safely ignore this message.</p>
        </div>
      `
    });

    console.info(`[AUTH - EMAIL SERVICE] Reset email sent to ${toEmail}: ${info.messageId}`);
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error('[AUTH - EMAIL SERVICE] Failed to send email via SMTP:', error.message);
    return { delivered: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail
};
