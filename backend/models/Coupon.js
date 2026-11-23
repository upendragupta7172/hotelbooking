// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discountValue: { type: Number, min: 0.01 },
  minBookingAmount: { type: Number, min: 0, default: 0 },
  maxDiscountAmount: { type: Number, min: 0, default: 0 },
  applicableHotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null },
  applicableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  discountPercent: { type: Number, min: 0, max: 100 },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
