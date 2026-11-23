const normalizeCouponCode = (code) => String(code || '').trim().toUpperCase();

const couponError = (message) => Object.assign(new Error(message), { status: 400 });

const validateCouponTarget = (coupon, room) => {
  if (coupon.applicableHotel && String(coupon.applicableHotel) !== String(room.hotel)) {
    throw couponError('This coupon is not valid for the selected hotel.');
  }
  if (coupon.applicableCategory && String(coupon.applicableCategory) !== String(room.category)) {
    throw couponError('This coupon is not valid for the selected room category.');
  }
};

const calculateCouponDiscount = (coupon, subtotal, now = new Date()) => {
  const bookingAmount = Number(subtotal);
  if (!Number.isFinite(bookingAmount) || bookingAmount < 0) throw couponError('Booking amount is invalid.');

  const expiryDate = new Date(coupon.expiryDate);
  if (Number.isNaN(expiryDate.getTime()) || expiryDate <= now) throw couponError('This coupon has expired.');

  const usageLimit = Number(coupon.usageLimit || 0);
  if (usageLimit > 0 && Number(coupon.usedCount || 0) >= usageLimit) {
    throw couponError('This coupon has reached its usage limit.');
  }

  const minBookingAmount = Number(coupon.minBookingAmount || 0);
  if (bookingAmount < minBookingAmount) {
    throw couponError(`Add items worth ₹${minBookingAmount.toLocaleString('en-IN')} to use this coupon.`);
  }

  const discountType = coupon.discountType || 'percentage';
  const discountValue = Number(coupon.discountValue ?? coupon.discountPercent);
  if (!Number.isFinite(discountValue) || discountValue <= 0) throw couponError('This coupon has an invalid discount.');

  let discount = discountType === 'percentage'
    ? Math.round(bookingAmount * discountValue / 100)
    : discountType === 'flat'
      ? Math.round(discountValue)
      : null;
  if (discount === null) throw couponError('This coupon has an unsupported discount type.');

  const maxDiscountAmount = Number(coupon.maxDiscountAmount || 0);
  if (maxDiscountAmount > 0) discount = Math.min(discount, Math.round(maxDiscountAmount));
  return Math.min(discount, Math.round(bookingAmount));
};

const redeemCoupon = async (code, now = new Date()) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOneAndUpdate({
    code: normalizedCode,
    expiryDate: { $gt: now },
    $or: [
      { usageLimit: 0 },
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
    ],
  }, { $inc: { usedCount: 1 } }, { new: true });
  if (!coupon) throw Object.assign(new Error('This coupon has expired or reached its usage limit.'), { status: 409 });
  return coupon;
};

const releaseCouponRedemption = async (code) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return;
  const Coupon = require('../models/Coupon');
  await Coupon.updateOne({ code: normalizedCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
};

module.exports = { calculateCouponDiscount, normalizeCouponCode, redeemCoupon, releaseCouponRedemption, validateCouponTarget };
