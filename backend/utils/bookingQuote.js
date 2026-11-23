const Room = require('../models/Room');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const { isUnavailable } = require('./roomAvailability');
const { calculateCouponDiscount, normalizeCouponCode, validateCouponTarget } = require('./couponPricing');

const getBookingQuote = async ({ roomId, checkIn, checkOut, guests, rooms = 1, packageId, couponCode }) => {
  if (!mongoose.isValidObjectId(roomId)) throw Object.assign(new Error('Choose a valid room.'), { status: 400 });
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw Object.assign(new Error('Check-out must be after check-in.'), { status: 400 });
  }
  const room = await Room.findById(roomId);
  if (!room) throw Object.assign(new Error('Room not found.'), { status: 404 });
  if (!Number.isInteger(Number(rooms)) || Number(rooms) !== 1) throw Object.assign(new Error('Select one room at a time.'), { status: 400 });
  if (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > Number(room.capacity || 2)) {
    throw Object.assign(new Error(`This room allows up to ${room.capacity || 2} guests.`), { status: 400 });
  }
  if (isUnavailable(room, start, end)) throw Object.assign(new Error('Room is unavailable for those dates.'), { status: 409 });

  const packagePlan = packageId ? room.packages.find((plan) => String(plan._id) === String(packageId)) : null;
  if (packageId && !packagePlan) throw Object.assign(new Error('The selected room package was not found.'), { status: 400 });
  const nightlyPrice = packagePlan ? Number(packagePlan.pricePerNight) : Number(room.discountPrice ?? room.pricePerNight);
  if (!Number.isFinite(nightlyPrice) || nightlyPrice < 0) throw Object.assign(new Error('Room price is invalid.'), { status: 400 });

  const nights = Math.round((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86400000);
  const subtotal = nightlyPrice * nights * Number(rooms);
  const taxes = Math.round(subtotal * 0.12);
  let coupon = null;
  let discountAmount = 0;
  const normalizedCode = normalizeCouponCode(couponCode);
  if (normalizedCode) {
    coupon = await Coupon.findOne({ code: normalizedCode });
    if (!coupon) throw Object.assign(new Error('Coupon code is invalid or expired.'), { status: 400 });
    validateCouponTarget(coupon, room);
    discountAmount = calculateCouponDiscount(coupon, subtotal);
  }
  return {
    room,
    packagePlan,
    coupon,
    couponCode: coupon ? normalizedCode : null,
    couponDiscount: discountAmount,
    discountAmount,
    nights,
    rooms: Number(rooms),
    guests: Number(guests),
    subtotal,
    taxes,
    total: Math.max(0, subtotal + taxes - discountAmount),
  };
};

module.exports = { getBookingQuote };
