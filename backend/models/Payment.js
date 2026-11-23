// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true }, // Razorpay order ID
  paymentId: { type: String }, // Razorpay payment ID after success
  signature: { type: String }, // Razorpay signature for verification
  amount: { type: Number, required: true }, // in paise (or smallest currency unit)
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'captured', 'failed'], default: 'created' },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'processing', 'refunded', 'rejected'],
    default: 'none',
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
