const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  open: { type: String, default: '09:00' },
  close: { type: String, default: '22:00' },
  isClosed: { type: Boolean, default: false },
}, { _id: false });

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    cuisine: {
      type: [String],
      required: [true, 'At least one cuisine type is required'],
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: 'India' },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0],
        },
      },
    },
    images: [String],
    coverImage: String,
    operatingHours: {
      type: [operatingHoursSchema],
      default: [
        { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Tuesday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Wednesday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Thursday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Friday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Saturday', open: '10:00', close: '23:00', isClosed: false },
        { day: 'Sunday', open: '10:00', close: '21:00', isClosed: false },
      ],
    },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
      default: '$$',
    },
    phone: String,
    email: String,
    website: String,
    features: {
      type: [String],
      enum: ['WiFi', 'Parking', 'Outdoor Seating', 'Live Music', 'Bar', 'Private Dining', 'Takeaway', 'Delivery', 'Valet Parking', 'Wheelchair Accessible'],
    },
    totalTables: { type: Number, default: 0 },
    totalCapacity: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    holidays: [Date],
    avgPreparationTime: { type: Number, default: 15 }, // minutes
    reservationDuration: { type: Number, default: 90 }, // minutes per slot
    slotInterval: { type: Number, default: 30 }, // minutes between slots
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geo-spatial index
restaurantSchema.index({ 'address.location': '2dsphere' });
restaurantSchema.index({ name: 'text', 'address.city': 'text', cuisine: 'text' });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ isActive: 1 });

// Virtual for reviews
restaurantSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'restaurant',
});

// Virtual for tables
restaurantSchema.virtual('tables', {
  ref: 'Table',
  localField: '_id',
  foreignField: 'restaurant',
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
