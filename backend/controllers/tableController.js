const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// ── Get Tables for Restaurant ──────────────────────────────────────────────
exports.getTables = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;
  const { date, startTime, guestCount } = req.query;

  const tables = await Table.find({ restaurant: restaurantId, isActive: true });

  if (!date || !startTime) {
    return res.status(200).json({ status: 'success', data: { tables } });
  }

  // Get booked tables for the given date/time
  const searchDate = new Date(date);
  const startOfDay = new Date(searchDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(searchDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedReservations = await Reservation.find({
    restaurant: restaurantId,
    reservationDate: { $gte: startOfDay, $lte: endOfDay },
    'timeSlot.startTime': startTime,
    status: { $in: ['pending', 'confirmed', 'seated'] },
  }).select('table');

  const bookedTableIds = new Set(bookedReservations.map((r) => r.table.toString()));

  const tablesWithStatus = tables.map((table) => ({
    ...table.toObject(),
    slotStatus: bookedTableIds.has(table._id.toString()) ? 'booked' : 'available',
    canAccommodate: guestCount ? table.capacity >= parseInt(guestCount) : true,
  }));

  res.status(200).json({ status: 'success', data: { tables: tablesWithStatus } });
});

// ── Create Table ───────────────────────────────────────────────────────────
exports.createTable = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.body.restaurant || req.params.restaurantId);

  if (!restaurant) return next(new AppError('Restaurant not found', 404));

  if (
    restaurant.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'super_admin'
  ) {
    return next(new AppError('Not authorized', 403));
  }

  const table = await Table.create({
    ...req.body,
    restaurant: restaurant._id,
  });

  // Update restaurant table count
  await Restaurant.findByIdAndUpdate(restaurant._id, {
    $inc: { totalTables: 1, totalCapacity: table.capacity },
  });

  // Emit event
  if (req.io) {
    req.io.to(`restaurant-${restaurant._id}`).emit('table-added', { table });
  }

  res.status(201).json({ status: 'success', data: { table } });
});

// ── Update Table ───────────────────────────────────────────────────────────
exports.updateTable = catchAsync(async (req, res, next) => {
  const table = await Table.findById(req.params.id).populate('restaurant');
  if (!table) return next(new AppError('Table not found', 404));

  if (
    table.restaurant.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'super_admin'
  ) {
    return next(new AppError('Not authorized', 403));
  }

  const oldCapacity = table.capacity;
  const updated = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Update total capacity if capacity changed
  if (req.body.capacity && req.body.capacity !== oldCapacity) {
    const diff = req.body.capacity - oldCapacity;
    await Restaurant.findByIdAndUpdate(table.restaurant._id, {
      $inc: { totalCapacity: diff },
    });
  }

  if (req.io) {
    req.io.to(`restaurant-${table.restaurant._id}`).emit('table-updated', { table: updated });
  }

  res.status(200).json({ status: 'success', data: { table: updated } });
});

// ── Delete Table ───────────────────────────────────────────────────────────
exports.deleteTable = catchAsync(async (req, res, next) => {
  const table = await Table.findById(req.params.id).populate('restaurant');
  if (!table) return next(new AppError('Table not found', 404));

  if (
    table.restaurant.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'super_admin'
  ) {
    return next(new AppError('Not authorized', 403));
  }

  await Table.findByIdAndUpdate(req.params.id, { isActive: false });
  await Restaurant.findByIdAndUpdate(table.restaurant._id, {
    $inc: { totalTables: -1, totalCapacity: -table.capacity },
  });

  res.status(204).json({ status: 'success', data: null });
});

// ── Get Live Status ────────────────────────────────────────────────────────
exports.getLiveStatus = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [tables, reservations] = await Promise.all([
    Table.find({ restaurant: restaurantId, isActive: true }),
    Reservation.find({
      restaurant: restaurantId,
      reservationDate: { $gte: today, $lte: endOfDay },
      status: { $in: ['confirmed', 'seated'] },
    }).select('table status timeSlot guestCount customerName'),
  ]);

  const tableMap = {};
  reservations.forEach((r) => {
    const tid = r.table.toString();
    if (!tableMap[tid]) tableMap[tid] = [];
    tableMap[tid].push(r);
  });

  const tablesWithStatus = tables.map((t) => ({
    ...t.toObject(),
    todayReservations: tableMap[t._id.toString()] || [],
    currentStatus: t.status,
  }));

  res.status(200).json({ status: 'success', data: { tables: tablesWithStatus } });
});
