// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true },
  roomCount: { type: Number, min: 1, default: 1 },
  totalPrice: { type: Number, required: true },
  couponCode: { type: String, trim: true, uppercase: true },
  couponDiscount: { type: Number, min: 0, default: 0 },
  roomServiceTotal: { type: Number, min: 0, default: 0 },
  roomServiceSettledAt: { type: Date, default: null },
  paymentMethod: { type: String, enum: ['online', 'hotel'], default: 'online' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'refunded'], default: 'pending' },
  guestInfo: {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    requests: { type: String, trim: true },
  },
  status: { type: String, enum: ['pending', 'booked', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'rejected', 'no-show', 'completed'], default: 'booked' },
  adminSeenAt: { type: Date, default: null },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

bookingSchema.index({ hotel: 1, createdAt: -1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
