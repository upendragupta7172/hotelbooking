const mongoose = require('mongoose');

const foodOrderSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomNumber: { type: String, trim: true },
  items: [{ menuItemId: mongoose.Schema.Types.ObjectId, name: String, category: String, quantity: { type: Number, min: 1 }, unitPrice: { type: Number, min: 0 }, lineTotal: { type: Number, min: 0 } }],
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['online', 'room-bill'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'room-bill', 'failed'], default: 'pending' },
  status: { type: String, enum: ['payment-pending', 'placed', 'preparing', 'ready', 'delivered', 'payment-failed'], default: 'placed' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  adminSeenAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('FoodOrder', foodOrderSchema);
