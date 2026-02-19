const Reservation = require('../models/Reservation');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const sendReservationReminders = async () => {
  try {
    const now = new Date();

    // 24-hour reminder
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const start24 = new Date(in24h.setMinutes(0, 0, 0));
    const end24 = new Date(in24h.setMinutes(59, 59, 999));

    // 1-hour reminder
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const start1 = new Date(in1h.setMinutes(0, 0, 0));
    const end1 = new Date(in1h.setMinutes(59, 59, 999));

    const [reminders24h, reminders1h] = await Promise.all([
      Reservation.find({
        reservationDate: { $gte: start24, $lte: end24 },
        status: { $in: ['confirmed', 'pending'] },
        'reminderSent.oneDayBefore': false,
      }).populate('restaurant', 'name').populate('customer', 'name email'),

      Reservation.find({
        reservationDate: { $gte: start1, $lte: end1 },
        status: { $in: ['confirmed', 'pending'] },
        'reminderSent.oneHourBefore': false,
      }).populate('restaurant', 'name').populate('customer', 'name email'),
    ]);

    for (const reservation of reminders24h) {
      await sendEmail({
        to: reservation.customerEmail || reservation.customer?.email,
        template: 'reservationReminder',
        data: {
          customerName: reservation.customerName || reservation.customer?.name,
          restaurantName: reservation.restaurant.name,
          date: reservation.reservationDate.toLocaleDateString(),
          time: reservation.timeSlot.startTime,
          guestCount: reservation.guestCount,
          confirmationCode: reservation.confirmationCode,
        },
      });
      await Reservation.findByIdAndUpdate(reservation._id, { 'reminderSent.oneDayBefore': true });
    }

    for (const reservation of reminders1h) {
      await sendEmail({
        to: reservation.customerEmail || reservation.customer?.email,
        template: 'reservationReminder',
        data: {
          customerName: reservation.customerName || reservation.customer?.name,
          restaurantName: reservation.restaurant.name,
          date: reservation.reservationDate.toLocaleDateString(),
          time: reservation.timeSlot.startTime,
          guestCount: reservation.guestCount,
          confirmationCode: reservation.confirmationCode,
        },
      });
      await Reservation.findByIdAndUpdate(reservation._id, { 'reminderSent.oneHourBefore': true });
    }

    logger.info(`Reminders sent: ${reminders24h.length} (24h) + ${reminders1h.length} (1h)`);
  } catch (err) {
    logger.error('Reminder job error:', err);
  }
};

module.exports = { sendReservationReminders };
