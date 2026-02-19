const Review = require('../models/Review');
const Reservation = require('../models/Reservation');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getRestaurantReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const [reviews, total] = await Promise.all([
    Review.find({ restaurant: req.params.restaurantId, isVisible: true })
      .populate('customer', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Review.countDocuments({ restaurant: req.params.restaurantId, isVisible: true }),
  ]);
  res.status(200).json({ status: 'success', total, data: { reviews } });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const { restaurantId, reservationId, rating, food, service, ambiance, value, title, comment } = req.body;

  // Verify reservation belongs to user and is completed
  if (reservationId) {
    const reservation = await Reservation.findOne({
      _id: reservationId,
      customer: req.user._id,
      restaurant: restaurantId,
      status: 'completed',
    });
    if (!reservation) {
      return next(new AppError('You can only review restaurants you have dined at', 403));
    }

    // Check if already reviewed
    const existing = await Review.findOne({ reservation: reservationId, customer: req.user._id });
    if (existing) {
      return next(new AppError('You have already reviewed this visit', 400));
    }
  }

  const review = await Review.create({
    restaurant: restaurantId,
    customer: req.user._id,
    reservation: reservationId,
    rating, food, service, ambiance, value, title, comment,
    isVerified: !!reservationId,
  });

  const populated = await Review.findById(review._id).populate('customer', 'name avatar');
  res.status(201).json({ status: 'success', data: { review: populated } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));

  if (review.customer.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    return next(new AppError('Not authorized', 403));
  }

  await Review.findByIdAndUpdate(req.params.id, { isVisible: false });
  res.status(204).json({ status: 'success', data: null });
});

exports.replyToReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      adminReply: {
        text: req.body.text,
        repliedAt: new Date(),
        repliedBy: req.user._id,
      },
    },
    { new: true }
  ).populate('customer', 'name avatar');

  if (!review) return next(new AppError('Review not found', 404));
  res.status(200).json({ status: 'success', data: { review } });
});
