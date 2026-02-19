const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    food: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    ambiance: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    title: {
      type: String,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    images: [String],
    isVerified: { type: Boolean, default: false }, // verified diner
    adminReply: {
      text: String,
      repliedAt: Date,
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One review per reservation
reviewSchema.index({ reservation: 1, customer: 1 }, { unique: true, sparse: true });
reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

// Update restaurant rating after review save
reviewSchema.post('save', async function () {
  await updateRestaurantRating(this.restaurant);
});

reviewSchema.post('remove', async function () {
  await updateRestaurantRating(this.restaurant);
});

async function updateRestaurantRating(restaurantId) {
  const Restaurant = mongoose.model('Restaurant');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { restaurant: restaurantId, isVisible: true } },
    { $group: { _id: '$restaurant', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, { rating: 0, totalReviews: 0 });
  }
}

module.exports = mongoose.model('Review', reviewSchema);
