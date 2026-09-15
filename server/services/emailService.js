import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

/**
 * Initializes and retrieves the Nodemailer transporter instance.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const hasSmtpConfig =
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER.trim() !== '';

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal / Test Transporter for local development & automated test suites
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch {
      // Stream fallback if network is offline
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
};

/**
 * Helper to dispatch email with error containment
 */
const sendMailSafe = async ({ to, subject, text, html }) => {
  try {
    const client = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"SkillNest LMS" <noreply@skillnest.lms>';

    const info = await client.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Registration Welcome Email
 */
export const sendWelcomeEmail = async (email, name) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
  const subject = 'Welcome to SkillNest LMS';
  const text = `Hello ${name},\n\nWelcome to SkillNest! Your account has been successfully created. Explore our courses and start learning today at ${clientUrl}/courses.\n\nBest regards,\nThe SkillNest Team`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">Welcome to SkillNest</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">
        Thank you for joining SkillNest. Your account is ready, and you now have access to our catalog of curated courses, interactive lessons, and hands-on projects.
      </p>
      <div style="margin: 28px 0;">
        <a href="${clientUrl}/courses" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          Browse Course Catalog
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.4; color: #6b7280; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        If you have any questions, feel free to reply to this email or visit our help center.
      </p>
    </div>
  `;

  return await sendMailSafe({ to: email, subject, text, html });
};

/**
 * 2. Password Reset Email
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = 'Password Reset Request - SkillNest';
  const text = `Hello ${name},\n\nYou recently requested to reset your password for your SkillNest account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nThe SkillNest Team`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">
        We received a request to reset the password for your SkillNest account. Click the button below to choose a new password.
      </p>
      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          Reset Your Password
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.4; color: #6b7280;">
        <em>Note: This password reset link will expire in 10 minutes.</em>
      </p>
      <p style="font-size: 13px; line-height: 1.4; color: #6b7280; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        If you did not request a password reset, please ignore this email or reach out to support if you have concerns.
      </p>
    </div>
  `;

  return await sendMailSafe({ to: email, subject, text, html });
};

/**
 * 3. Course Enrollment Confirmation Email
 */
export const sendEnrollmentConfirmationEmail = async (email, name, courseTitle, amount = 0) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
  const subject = `Enrollment Confirmed: ${courseTitle}`;
  const priceDisplay = amount > 0 ? `$${amount}` : 'Free';
  const text = `Hello ${name},\n\nYour enrollment in "${courseTitle}" has been confirmed! Price: ${priceDisplay}.\n\nYou can access your course anytime at ${clientUrl}/my-courses.\n\nHappy Learning,\nThe SkillNest Team`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">Enrollment Confirmation</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">
        Congratulations! You have successfully enrolled in:
      </p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 16px;">${courseTitle}</h3>
        <p style="margin: 0; font-size: 14px; color: #4b5563;">Payment: <strong>${priceDisplay}</strong></p>
      </div>
      <div style="margin: 28px 0;">
        <a href="${clientUrl}/my-courses" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          Go to My Courses
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.4; color: #6b7280; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Thank you for choosing SkillNest. Keep advancing your skills!
      </p>
    </div>
  `;

  return await sendMailSafe({ to: email, subject, text, html });
};

/**
 * 4. Course Completion Notification Email
 */
export const sendCourseCompletionEmail = async (email, name, courseTitle) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
  const subject = `Congratulations on Completing: ${courseTitle}!`;
  const text = `Hello ${name},\n\nCongratulations! You have completed 100% of the lessons in "${courseTitle}".\n\nView your progress at ${clientUrl}/my-courses.\n\nKeep learning,\nThe SkillNest Team`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">🎉 Course Completed!</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">
        Outstanding achievement! You have completed all lessons and modules in <strong>${courseTitle}</strong>.
      </p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">
          Status: 100% Completed
        </p>
      </div>
      <div style="margin: 28px 0;">
        <a href="${clientUrl}/my-courses" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          View Learning Dashboard
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.4; color: #6b7280; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Ready for your next milestone? Explore more courses on SkillNest!
      </p>
    </div>
  `;

  return await sendMailSafe({ to: email, subject, text, html });
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEnrollmentConfirmationEmail,
  sendCourseCompletionEmail,
};
