const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../services/emailService');

// ── Get My Reservations ────────────────────────────────────────────────────
exports.getMyReservations = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { customer: req.user._id };
  if (status) filter.status = status;

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .populate('restaurant', 'name address images coverImage phone')
      .populate('table', 'tableNumber section capacity')
      .sort('-reservationDate')
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Reservation.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: { reservations },
  });
});

// ── Get Single Reservation ─────────────────────────────────────────────────
exports.getReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('restaurant', 'name address phone email images coverImage operatingHours')
    .populate('table', 'tableNumber section capacity features')
    .populate('customer', 'name email phone');

  if (!reservation) return next(new AppError('Reservation not found', 404));

  // Only owner or admin can view
  if (
    reservation.customer._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'super_admin'
  ) {
    return next(new AppError('Not authorized to view this reservation', 403));
  }

  res.status(200).json({ status: 'success', data: { reservation } });
});

// ── Create Reservation ─────────────────────────────────────────────────────
exports.createReservation = catchAsync(async (req, res, next) => {
  const { restaurantId, tableId, reservationDate, startTime, endTime, guestCount, specialRequests, occasion } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate restaurant
    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError('Restaurant not found or not available', 404);
    }

    // 2. Validate table
    const table = await Table.findOne({ _id: tableId, restaurant: restaurantId }).session(session);
    if (!table || !table.isActive) {
      throw new AppError('Table not found or not available', 404);
    }

    if (table.capacity < guestCount) {
      throw new AppError(`Table capacity (${table.capacity}) is less than guest count (${guestCount})`, 400);
    }

    // 3. Check for conflicts
    const searchDate = new Date(reservationDate);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Reservation.findOne({
      table: tableId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      'timeSlot.startTime': startTime,
      status: { $in: ['pending', 'confirmed', 'seated'] },
    }).session(session);

    if (conflict) {
      throw new AppError('This table is already booked for the selected time slot', 409);
    }

    // 4. Generate QR code
    const tempId = new mongoose.Types.ObjectId().toString();
    const qrData = JSON.stringify({
      id: tempId,
      restaurant: restaurant.name,
      date: reservationDate,
      time: startTime,
      guests: guestCount,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // 5. Create reservation
    const [reservation] = await Reservation.create(
      [
        {
          customer: req.user._id,
          restaurant: restaurantId,
          table: tableId,
          reservationDate: searchDate,
          timeSlot: { startTime, endTime },
          guestCount,
          specialRequests,
          occasion,
          qrCode,
          customerName: req.user.name,
          customerEmail: req.user.email,
          customerPhone: req.user.phone,
          status: 'confirmed', // auto-confirm for now
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // 6. Emit real-time event
    if (req.io) {
      req.io.to(`restaurant-${restaurantId}`).emit('reservation-created', {
        tableId,
        date: reservationDate,
        startTime,
        reservationId: reservation._id,
      });
    }

    // 7. Send confirmation email (async, don't block response)
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('restaurant', 'name address phone')
      .populate('table', 'tableNumber section');

    sendEmail({
      to: req.user.email,
      subject: `Reservation Confirmed - ${restaurant.name}`,
      template: 'reservationConfirmation',
      data: {
        customerName: req.user.name,
        restaurantName: restaurant.name,
        restaurantAddress: `${restaurant.address.street}, ${restaurant.address.city}`,
        restaurantPhone: restaurant.phone,
        date: new Date(reservationDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: startTime,
        guestCount,
        tableNumber: table.tableNumber,
        confirmationCode: reservation.confirmationCode,
        qrCode,
        specialRequests: specialRequests || 'None',
        occasion: occasion || 'None',
      },
    }).catch(console.error);

    res.status(201).json({
      status: 'success',
      data: { reservation: populatedReservation },
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ── Update Reservation ─────────────────────────────────────────────────────
exports.updateReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return next(new AppError('Reservation not found', 404));

  if (reservation.customer.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  if (['cancelled', 'completed', 'no_show'].includes(reservation.status)) {
    return next(new AppError('Cannot modify a reservation that is cancelled or completed', 400));
  }

  const { specialRequests, occasion, guestCount } = req.body;
  const updated = await Reservation.findByIdAndUpdate(
    req.params.id,
    { specialRequests, occasion, guestCount },
    { new: true, runValidators: true }
  ).populate('restaurant table');

  res.status(200).json({ status: 'success', data: { reservation: updated } });
});

// ── Cancel Reservation ─────────────────────────────────────────────────────
exports.cancelReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('restaurant', 'name')
    .populate('table', 'tableNumber');

  if (!reservation) return next(new AppError('Reservation not found', 404));

  const isOwner = reservation.customer.toString() === req.user._id.toString();
  const isAdminOrSuper = ['admin', 'super_admin'].includes(req.user.role);

  if (!isOwner && !isAdminOrSuper) {
    return next(new AppError('Not authorized', 403));
  }

  if (['cancelled', 'completed'].includes(reservation.status)) {
    return next(new AppError('Reservation is already cancelled or completed', 400));
  }

  const updated = await Reservation.findByIdAndUpdate(
    req.params.id,
    {
      status: 'cancelled',
      cancellationReason: req.body.reason || 'Cancelled by user',
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
    },
    { new: true }
  );

  // Emit real-time event
  if (req.io) {
    req.io.to(`restaurant-${reservation.restaurant._id}`).emit('reservation-cancelled', {
      tableId: reservation.table._id,
      date: reservation.reservationDate,
      startTime: reservation.timeSlot.startTime,
    });
  }

  // Send cancellation email
  sendEmail({
    to: reservation.customerEmail,
    subject: `Reservation Cancelled - ${reservation.restaurant.name}`,
    template: 'reservationCancelled',
    data: {
      customerName: reservation.customerName,
      restaurantName: reservation.restaurant.name,
      confirmationCode: reservation.confirmationCode,
      reason: req.body.reason || 'Cancelled by user',
    },
  }).catch(console.error);

  res.status(200).json({ status: 'success', data: { reservation: updated } });
});

// ── Admin: Update Status ───────────────────────────────────────────────────
exports.updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const reservation = await Reservation.findById(req.params.id)
    .populate('restaurant', 'name')
    .populate('customer', 'name email');

  if (!reservation) return next(new AppError('Reservation not found', 404));

  const updates = { status };
  if (status === 'seated') updates.checkedInAt = new Date();
  if (status === 'completed') updates.completedAt = new Date();

  const updated = await Reservation.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('restaurant', 'name address phone')
    .populate('table', 'tableNumber section');

  // Notify customer
  if (req.io) {
    req.io.to(`user-${reservation.customer._id}`).emit('reservation-status-changed', {
      reservationId: reservation._id,
      status,
      restaurantName: reservation.restaurant.name,
    });
  }

  // Email notification
  sendEmail({
    to: reservation.customer.email,
    subject: `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)} - ${reservation.restaurant.name}`,
    template: 'reservationStatusUpdate',
    data: {
      customerName: reservation.customer.name,
      status,
      restaurantName: reservation.restaurant.name,
      confirmationCode: reservation.confirmationCode,
    },
  }).catch(console.error);

  res.status(200).json({ status: 'success', data: { reservation: updated } });
});
