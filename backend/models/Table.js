const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [20, 'Capacity cannot exceed 20'],
    },
    section: {
      type: String,
      enum: ['Indoor', 'Outdoor', 'Bar', 'Private', 'Rooftop', 'Garden'],
      default: 'Indoor',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    features: {
      type: [String],
      enum: ['Window View', 'Corner', 'Booth', 'High Chair', 'Wheelchair Accessible', 'Romantic', 'Private'],
    },
    isActive: { type: Boolean, default: true },
    positionX: { type: Number, default: 0 }, // For floor plan
    positionY: { type: Number, default: 0 },
    shape: {
      type: String,
      enum: ['round', 'square', 'rectangle'],
      default: 'square',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ restaurant: 1, status: 1 });
tableSchema.index({ restaurant: 1, capacity: 1 });

module.exports = mongoose.model('Table', tableSchema);
