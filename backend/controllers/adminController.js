const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Review = require('../models/Review');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// ── Dashboard Stats ────────────────────────────────────────────────────────
exports.getDashboard = catchAsync(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const matchFilter = restaurantId ? { restaurant: restaurantId } : {};

  const [
    todayReservations,
    monthReservations,
    lastMonthReservations,
    totalUsers,
    pendingReservations,
    recentReservations,
    revenueData,
  ] = await Promise.all([
    Reservation.countDocuments({ ...matchFilter, reservationDate: { $gte: startOfToday, $lte: endOfToday } }),
    Reservation.countDocuments({ ...matchFilter, reservationDate: { $gte: startOfMonth }, status: { $ne: 'cancelled' } }),
    Reservation.countDocuments({ ...matchFilter, reservationDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $ne: 'cancelled' } }),
    User.countDocuments({ role: 'customer' }),
    Reservation.countDocuments({ ...matchFilter, status: 'pending' }),
    Reservation.find({ ...matchFilter })
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .populate('table', 'tableNumber')
      .sort('-createdAt')
      .limit(10),
    Reservation.aggregate([
      {
        $match: {
          ...matchFilter,
          status: 'completed',
          reservationDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reservationDate' } },
          count: { $sum: 1 },
          guests: { $sum: '$guestCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const monthGrowth = lastMonthReservations > 0
    ? Math.round(((monthReservations - lastMonthReservations) / lastMonthReservations) * 100)
    : 100;

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        todayReservations,
        monthReservations,
        monthGrowth,
        totalUsers,
        pendingReservations,
      },
      recentReservations,
      revenueData,
    },
  });
});

// ── All Reservations (Admin) ───────────────────────────────────────────────
exports.getAllReservations = catchAsync(async (req, res) => {
  const { status, date, page = 1, limit = 20, search } = req.query;
  const restaurantId = req.user.restaurantId;

  const filter = restaurantId ? { restaurant: restaurantId } : {};
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    filter.reservationDate = { $gte: start, $lte: end };
  }

  let query = Reservation.find(filter)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name')
    .populate('table', 'tableNumber section capacity')
    .sort('-reservationDate -createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const [reservations, total] = await Promise.all([
    query,
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

// ── Analytics ──────────────────────────────────────────────────────────────
exports.getAnalytics = catchAsync(async (req, res) => {
  const { period = '30' } = req.query;
  const restaurantId = req.user.restaurantId;
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const matchFilter = {
    reservationDate: { $gte: startDate },
    ...(restaurantId ? { restaurant: restaurantId } : {}),
  };

  const [
    bookingsByDay,
    bookingsByStatus,
    bookingsByOccasion,
    guestsByHour,
    topRestaurants,
  ] = await Promise.all([
    Reservation.aggregate([
      { $match: matchFilter },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$reservationDate' } }, count: { $sum: 1 }, guests: { $sum: '$guestCount' } } },
      { $sort: { _id: 1 } },
    ]),
    Reservation.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Reservation.aggregate([
      { $match: { ...matchFilter, occasion: { $ne: '' } } },
      { $group: { _id: '$occasion', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Reservation.aggregate([
      { $match: { ...matchFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$timeSlot.startTime', count: { $sum: 1 }, avgGuests: { $avg: '$guestCount' } } },
      { $sort: { count: -1 } },
    ]),
    !restaurantId ? Restaurant.aggregate([
      { $lookup: { from: 'reservations', localField: '_id', foreignField: 'restaurant', as: 'reservations' } },
      { $project: { name: 1, totalReservations: { $size: '$reservations' }, rating: 1 } },
      { $sort: { totalReservations: -1 } },
      { $limit: 5 },
    ]) : Promise.resolve([]),
  ]);

  res.status(200).json({
    status: 'success',
    data: { bookingsByDay, bookingsByStatus, bookingsByOccasion, guestsByHour, topRestaurants },
  });
});

// ── All Users (Super Admin) ────────────────────────────────────────────────
exports.getAllUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: { users },
  });
});

// ── Update User Role ───────────────────────────────────────────────────────
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({ status: 'success', data: { user } });
});

// ── Toggle User Active ─────────────────────────────────────────────────────
exports.toggleUserActive = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  user.isActive = !user.isActive;
  await user.save();
  res.status(200).json({ status: 'success', data: { user } });
});
