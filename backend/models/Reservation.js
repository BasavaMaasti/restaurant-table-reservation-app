const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    reservationDate: {
      type: Date,
      required: [true, 'Reservation date is required'],
    },
    timeSlot: {
      startTime: { type: String, required: true }, // "19:00"
      endTime: { type: String, required: true },   // "21:00"
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Must have at least 1 guest'],
      max: [20, 'Cannot exceed 20 guests'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    specialRequests: {
      type: String,
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
    },
    occasion: {
      type: String,
      enum: ['birthday', 'anniversary', 'business', 'date', 'family', 'other', ''],
      default: '',
    },
    qrCode: String,
    confirmationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    reminderSent: {
      oneDayBefore: { type: Boolean, default: false },
      oneHourBefore: { type: Boolean, default: false },
    },
    payment: {
      depositRequired: { type: Boolean, default: false },
      depositAmount: { type: Number, default: 0 },
      isPaid: { type: Boolean, default: false },
      paymentId: String,
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkedInAt: Date,
    completedAt: Date,
    customerName: String,   // Snapshot at booking time
    customerEmail: String,
    customerPhone: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to prevent double-booking
reservationSchema.index(
  { table: 1, reservationDate: 1, 'timeSlot.startTime': 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed', 'seated'] },
    },
  }
);

reservationSchema.index({ restaurant: 1, reservationDate: 1 });
reservationSchema.index({ customer: 1, createdAt: -1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ confirmationCode: 1 });

// Generate confirmation code before save
reservationSchema.pre('save', function (next) {
  if (!this.confirmationCode) {
    this.confirmationCode = 'RES' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
