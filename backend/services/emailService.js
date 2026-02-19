const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const templates = {
  welcome: (data) => ({
    subject: 'Welcome to Restaurant Reservations!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
        <div style="background:#1B4332;padding:30px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Welcome, ${data.name}!</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Thank you for joining Restaurant Reservations. You can now browse and book tables at top restaurants.</p>
          <p>Start exploring now!</p>
        </div>
      </div>
    `,
  }),

  reservationConfirmation: (data) => ({
    subject: `Reservation Confirmed - ${data.restaurantName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
        <div style="background:#1B4332;padding:30px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Reservation Confirmed!</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear ${data.customerName},</p>
          <p>Your reservation at <strong>${data.restaurantName}</strong> has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:10px;border:1px solid #ddd">${data.date}</td></tr>
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:10px;border:1px solid #ddd">${data.time}</td></tr>
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Guests</strong></td><td style="padding:10px;border:1px solid #ddd">${data.guestCount}</td></tr>
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Table</strong></td><td style="padding:10px;border:1px solid #ddd">${data.tableNumber}</td></tr>
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Confirmation #</strong></td><td style="padding:10px;border:1px solid #ddd"><strong style="color:#1B4332">${data.confirmationCode}</strong></td></tr>
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Address</strong></td><td style="padding:10px;border:1px solid #ddd">${data.restaurantAddress}</td></tr>
            <tr><td style="padding:10px;background:#f5f5f5;border:1px solid #ddd"><strong>Special Requests</strong></td><td style="padding:10px;border:1px solid #ddd">${data.specialRequests}</td></tr>
          </table>
          ${data.qrCode ? `<div style="text-align:center"><img src="${data.qrCode}" style="width:150px"/><p style="color:#666;font-size:12px">Show this QR code at the restaurant</p></div>` : ''}
          <p>See you soon!</p>
        </div>
      </div>
    `,
  }),

  reservationCancelled: (data) => ({
    subject: `Reservation Cancelled - ${data.restaurantName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#c62828;padding:30px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Reservation Cancelled</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear ${data.customerName},</p>
          <p>Your reservation at <strong>${data.restaurantName}</strong> (Confirmation: ${data.confirmationCode}) has been cancelled.</p>
          <p>Reason: ${data.reason}</p>
          <p>We hope to serve you again soon!</p>
        </div>
      </div>
    `,
  }),

  reservationReminder: (data) => ({
    subject: `Reminder: Upcoming Reservation at ${data.restaurantName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1B4332;padding:30px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Reservation Reminder</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear ${data.customerName},</p>
          <p>This is a reminder for your upcoming reservation at <strong>${data.restaurantName}</strong>.</p>
          <p><strong>Date:</strong> ${data.date} at ${data.time}</p>
          <p><strong>Guests:</strong> ${data.guestCount}</p>
          <p><strong>Confirmation:</strong> ${data.confirmationCode}</p>
          <p>We look forward to seeing you!</p>
        </div>
      </div>
    `,
  }),

  reservationStatusUpdate: (data) => ({
    subject: `Reservation ${data.status} - ${data.restaurantName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1B4332;padding:30px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Reservation Update</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear ${data.customerName},</p>
          <p>Your reservation at <strong>${data.restaurantName}</strong> (${data.confirmationCode}) status has been updated to: <strong>${data.status.toUpperCase()}</strong></p>
        </div>
      </div>
    `,
  }),

  resetPassword: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1B4332;padding:30px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Reset Your Password</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear ${data.name},</p>
          <p>Click the button below to reset your password. This link expires in 10 minutes.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${data.resetURL}" style="background:#1B4332;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:16px">Reset Password</a>
          </div>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  }),
};

const sendEmail = async ({ to, subject, template, data, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email Skipped] To: ${to}, Subject: ${subject}`);
    return;
  }

  const templateFn = templates[template];
  const emailContent = templateFn ? templateFn(data) : { subject, html };

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Restaurant Reservations" <${process.env.EMAIL_USER}>`,
    to,
    subject: emailContent.subject || subject,
    html: emailContent.html || html,
  };

  const transport = getTransporter();
  await transport.sendMail(mailOptions);
};

module.exports = { sendEmail };
