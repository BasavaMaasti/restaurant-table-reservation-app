const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');

// ── Get All Restaurants ────────────────────────────────────────────────────
exports.getAllRestaurants = catchAsync(async (req, res) => {
  const { lat, lng, radius = 50, cuisine, priceRange, rating, features, search } = req.query;

  let query = { isActive: true };

  // Geo-spatial search
  if (lat && lng) {
    query['address.location'] = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000, // convert km to meters
      },
    };
  }

  if (cuisine) {
    query.cuisine = { $in: Array.isArray(cuisine) ? cuisine : [cuisine] };
  }

  if (priceRange) {
    query.priceRange = { $in: Array.isArray(priceRange) ? priceRange : [priceRange] };
  }

  if (rating) {
    query.rating = { $gte: parseFloat(rating) };
  }

  if (features) {
    query.features = { $all: Array.isArray(features) ? features : [features] };
  }

  if (search) {
    query.$text = { $search: search };
  }

const apiFeatures = new APIFeatures(Restaurant.find(query), req.query)
  .sort()
  .limitFields()
  .paginate();

const [restaurants, total] = await Promise.all([
  apiFeatures.query.populate('owner', 'name email'),
  Restaurant.countDocuments(query),
]);

  res.status(200).json({
    status: 'success',
    results: restaurants.length,
    total,
    page: parseInt(req.query.page) || 1,
    pages: Math.ceil(total / (parseInt(req.query.limit) || 10)),
    data: { restaurants },
  });
});

// ── Get Single Restaurant ──────────────────────────────────────────────────
exports.getRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id)
    .populate('owner', 'name email phone');

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  // Get table summary
  const tableSummary = await Table.aggregate([
    { $match: { restaurant: restaurant._id, isActive: true } },
    { $group: { _id: '$section', count: { $sum: 1 }, totalCapacity: { $sum: '$capacity' } } },
  ]);

  // Get recent reviews
  const reviews = await Review.find({ restaurant: restaurant._id, isVisible: true })
    .populate('customer', 'name avatar')
    .sort('-createdAt')
    .limit(5);

  res.status(200).json({
    status: 'success',
    data: { restaurant, tableSummary, reviews },
  });
});

// ── Create Restaurant ──────────────────────────────────────────────────────
exports.createRestaurant = catchAsync(async (req, res, next) => {
  req.body.owner = req.user._id;

  const restaurant = await Restaurant.create(req.body);

  // Update user's restaurantId
  await require('../models/User').findByIdAndUpdate(req.user._id, {
    restaurantId: restaurant._id,
  });

  res.status(201).json({ status: 'success', data: { restaurant } });
});

// ── Update Restaurant ──────────────────────────────────────────────────────
exports.updateRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) return next(new AppError('Restaurant not found', 404));

  // Only owner or super_admin can update
  if (
    restaurant.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'super_admin'
  ) {
    return next(new AppError('You are not authorized to update this restaurant', 403));
  }

  const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { restaurant: updated } });
});

// ── Delete Restaurant ──────────────────────────────────────────────────────
exports.deleteRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new AppError('Restaurant not found', 404));

  await Restaurant.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(204).json({ status: 'success', data: null });
});

// ── Check Availability ─────────────────────────────────────────────────────
exports.checkAvailability = catchAsync(async (req, res, next) => {
  const { date, guestCount } = req.query;
  const restaurantId = req.params.id;

  if (!date || !guestCount) {
    return next(new AppError('Date and guest count are required', 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return next(new AppError('Restaurant not found', 404));

  const searchDate = new Date(date);
  const dayName = searchDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Check if restaurant is open on that day
  const daySchedule = restaurant.operatingHours.find((h) => h.day === dayName);
  if (!daySchedule || daySchedule.isClosed) {
    return res.status(200).json({
      status: 'success',
      data: { available: false, reason: 'Restaurant is closed on this day', slots: [] },
    });
  }

  // Check if it's a holiday
  const isHoliday = restaurant.holidays.some(
    (h) => h.toDateString() === searchDate.toDateString()
  );
  if (isHoliday) {
    return res.status(200).json({
      status: 'success',
      data: { available: false, reason: 'Restaurant is closed on this date (holiday)', slots: [] },
    });
  }

  // Get tables that can accommodate the guest count
  const tables = await Table.find({
    restaurant: restaurantId,
    capacity: { $gte: parseInt(guestCount) },
    isActive: true,
  });

  if (tables.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: { available: false, reason: 'No tables available for this party size', slots: [] },
    });
  }

  // Generate time slots
  const slots = generateTimeSlots(
    daySchedule.open,
    daySchedule.close,
    restaurant.slotInterval,
    restaurant.reservationDuration
  );

  // Check which slots are already booked
  const startOfDay = new Date(searchDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(searchDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingReservations = await Reservation.find({
    restaurant: restaurantId,
    reservationDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed', 'seated'] },
  });

  const bookedTableSlots = {};
  existingReservations.forEach((res) => {
    const key = `${res.table.toString()}_${res.timeSlot.startTime}`;
    bookedTableSlots[key] = true;
  });

  // For each slot, find available tables
  const slotsWithAvailability = slots.map((slot) => {
    const availableTables = tables.filter((table) => {
      const key = `${table._id.toString()}_${slot.startTime}`;
      return !bookedTableSlots[key];
    });

    return {
      ...slot,
      availableTablesCount: availableTables.length,
      available: availableTables.length > 0,
      tables: availableTables.map((t) => ({
        _id: t._id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        section: t.section,
        features: t.features,
      })),
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      restaurant: { name: restaurant.name, reservationDuration: restaurant.reservationDuration },
      date,
      guestCount: parseInt(guestCount),
      slots: slotsWithAvailability,
    },
  });
});

function generateTimeSlots(openTime, closeTime, intervalMinutes, durationMinutes) {
  const slots = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM - durationMinutes;

  while (currentMinutes <= closeMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endMinutes = currentMinutes + durationMinutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    slots.push({
      startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      displayTime: formatTime(startH, startM),
    });

    currentMinutes += intervalMinutes;
  }

  return slots;
}

function formatTime(hours, minutes) {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}
