// models/Room.js
const mongoose = require('mongoose');

const ratePlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  pricePerNight: { type: Number, required: true, min: 0 },
  includedAmenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
});

const maintenancePeriodSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  reason: { type: String, trim: true },
});

const roomSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomNumber: { type: String, trim: true },
  type: { type: String, trim: true },
  name: { type: String, required: true },
  image: { type: String, trim: true },
  images: [{ type: String, trim: true }],
  videos: [{ type: String, trim: true }],
  description: { type: String, trim: true },
  capacity: { type: Number, min: 1, default: 2 },
  size: { type: String, trim: true },
  bedType: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
  pricePerNight: { type: Number, required: true },
  discountPrice: { type: Number, min: 0 },
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning', 'Inactive'], default: 'Available' },
  maintenancePeriods: [maintenancePeriodSchema],
  packages: [ratePlanSchema],
  // Simple availability: array of booked date ranges { start: Date, end: Date }
  bookings: [{ start: Date, end: Date }],
}, { timestamps: true });

roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true, partialFilterExpression: { roomNumber: { $type: 'string' } } });

module.exports = mongoose.model('Room', roomSchema);
