// routes/bookings.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const { protect, optionalProtect } = require('../middleware/auth');
const Razorpay = require('razorpay');
const razorpayConfig = require('../config/razorpay');
const { getBookingQuote } = require('../utils/bookingQuote');
const { redeemCoupon, releaseCouponRedemption } = require('../utils/couponPricing');

// @route   GET /api/bookings
// @desc    Get bookings for logged‑in user
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('hotel room payment')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pay at hotel creates a confirmed reservation with an unpaid balance.
router.post('/pay-at-hotel', optionalProtect, [
  body('roomId').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601(),
  body('guests').isInt({ min: 1 }), body('rooms').optional().isInt({ min: 1, max: 5 }),
  body('couponCode').optional().isString().isLength({ max: 32 }),
  body('guestInfo.name').trim().notEmpty(), body('guestInfo.email').isEmail(), body('guestInfo.phone').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  let couponRedeemed = false;
  let couponCode = '';
  try {
    const quote = await getBookingQuote(req.body);
    if (quote.couponCode) {
      await redeemCoupon(quote.couponCode);
      couponRedeemed = true;
      couponCode = quote.couponCode;
    }
    const booking = await Booking.create({
      user: req.user?.role === 'customer' ? req.user._id : undefined,
      hotel: quote.room.hotel, room: quote.room._id, packageId: quote.packagePlan?._id, checkIn: req.body.checkIn, checkOut: req.body.checkOut,
      guests: quote.guests, roomCount: quote.rooms, totalPrice: quote.total,
      couponCode: quote.couponCode || undefined, couponDiscount: quote.discountAmount,
      status: 'booked', paymentMethod: 'hotel', paymentStatus: 'pending',
      guestInfo: req.body.guestInfo,
    });
    quote.room.bookings.push({ start: req.body.checkIn, end: req.body.checkOut });
    await quote.room.save();
    const saved = await booking.populate('hotel room payment');
    return res.status(201).json({ booking: saved, quote: { nights: quote.nights, subtotal: quote.subtotal, taxes: quote.taxes, discountAmount: quote.discountAmount, total: quote.total } });
  } catch (err) {
    if (couponRedeemed) {
      try { await releaseCouponRedemption(couponCode); }
      catch (releaseError) { console.error(`Coupon redemption rollback failed for ${couponCode}:`, releaseError.message); }
    }
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Pay-at-hotel booking failed:', err.message);
    return res.status(500).json({ message: 'Unable to create booking.' });
  }
});

// Verify successful Razorpay payment server-side before confirming the booking.
router.post('/checkout', optionalProtect, [
  body('roomId').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601(),
  body('guests').isInt({ min: 1 }), body('rooms').optional().isInt({ min: 1, max: 5 }),
  body('couponCode').optional().isString().isLength({ max: 32 }),
  body('guestInfo.name').trim().notEmpty(), body('guestInfo.email').isEmail(), body('guestInfo.phone').trim().notEmpty(),
  body('orderId').notEmpty(), body('paymentId').notEmpty(), body('signature').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const result = await confirmCapturedBooking(req.body, true, req.user);
    return res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Paid booking verification failed:', err.stack || err);
    const response = { message: 'Unable to confirm payment and booking.' };
    if (process.env.NODE_ENV !== 'production') response.detail = err.message;
    return res.status(500).json(response);
  }
});

// Reconcile a captured payment when the browser lost the original callback.
router.post('/recover-payment', optionalProtect, [
  body('roomId').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601(),
  body('guests').isInt({ min: 1 }), body('rooms').optional().isInt({ min: 1, max: 5 }),
  body('couponCode').optional().isString().isLength({ max: 32 }),
  body('guestInfo.name').trim().notEmpty(), body('guestInfo.email').isEmail(), body('guestInfo.phone').trim().notEmpty(),
  body('paymentId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const result = await confirmCapturedBooking(req.body, false, req.user);
    return res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Payment recovery failed:', err.stack || err);
    const response = { message: 'Unable to recover the paid booking.' };
    if (process.env.NODE_ENV !== 'production') response.detail = err.message;
    return res.status(500).json(response);
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking (only if not already cancelled/completed)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.user || booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your booking' });
    if (!['booked', 'confirmed', 'pending'].includes(booking.status))
      return res.status(400).json({ message: 'Cannot cancel this booking' });

    booking.status = 'cancelled';
    await booking.save();

    if (booking.payment) {
      await Payment.findByIdAndUpdate(booking.payment, { refundStatus: 'requested' });
    }

    // Remove dates from room.bookings array
    const room = await Room.findById(booking.room);
    room.bookings = room.bookings.filter(b => {
      const start = new Date(b.start).getTime();
      const end = new Date(b.end).getTime();
      return !(start === new Date(booking.checkIn).getTime() && end === new Date(booking.checkOut).getTime());
    });
    await room.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

async function confirmCapturedBooking(payload, requireSignature, accountUser) {
  const razorpay = new Razorpay(razorpayConfig.getCredentials());
  const { orderId: requestedOrderId, paymentId, signature } = payload;
  if (requireSignature) {
    const valid = verifyRazorpaySignature(requestedOrderId, paymentId, signature, razorpayConfig.getCredentials().key_secret);
    if (!valid) throw Object.assign(new Error('Payment signature verification failed.'), { status: 400 });
  }

  const gatewayPayment = await razorpay.payments.fetch(paymentId);
  const orderId = requestedOrderId || gatewayPayment.order_id;
  if (!orderId || gatewayPayment.order_id !== orderId) throw Object.assign(new Error('Payment does not belong to this order.'), { status: 400 });
  if (gatewayPayment.status !== 'captured' && gatewayPayment.captured !== true) {
    throw Object.assign(new Error('Razorpay has not marked this payment as captured yet.'), { status: 409 });
  }
  const order = await razorpay.orders.fetch(orderId);
  if (order.status !== 'paid' || Number(order.amount_paid) < Number(order.amount)) {
    throw Object.assign(new Error('Razorpay has not marked this order as paid yet. Retry confirmation shortly.'), { status: 409 });
  }
  const expectedNotes = {
    roomId: String(payload.roomId),
    checkIn: new Date(payload.checkIn).toISOString(),
    checkOut: new Date(payload.checkOut).toISOString(),
    guestCount: String(Number(payload.guests)),
    roomCount: String(Number(payload.rooms || 1)),
    packageId: payload.packageId ? String(payload.packageId) : '',
    couponCode: requireSignature
      ? String(payload.couponCode || '').trim().toUpperCase()
      : String(order.notes?.couponCode || '').trim().toUpperCase(),
  };
  if (Object.entries(expectedNotes).some(([key, value]) => String(order.notes?.[key] || '') !== value)) {
    throw Object.assign(new Error('Payment order does not match this booking. Confirm the same stay details used at checkout.'), { status: 400 });
  }
  if (order.notes?.guestEmail && order.notes.guestEmail !== String(payload.guestInfo?.email || '').trim().toLowerCase()) {
    throw Object.assign(new Error('The guest email does not match the payment order.'), { status: 400 });
  }

  const previousPayment = await Payment.findOne({ orderId, paymentId });
  let existingBooking = previousPayment?.booking
    ? await Booking.findById(previousPayment.booking)
    : previousPayment ? await Booking.findOne({ payment: previousPayment._id }) : null;
  if (existingBooking) {
    const room = await Room.findById(existingBooking.room);
    if (room) {
      const alreadyReserved = room.bookings.some((range) =>
        new Date(range.start).getTime() === new Date(existingBooking.checkIn).getTime() &&
        new Date(range.end).getTime() === new Date(existingBooking.checkOut).getTime()
      );
      if (!alreadyReserved) {
        room.bookings.push({ start: existingBooking.checkIn, end: existingBooking.checkOut });
        await room.save();
      }
    }
    if (previousPayment && !previousPayment.booking) {
      previousPayment.booking = existingBooking._id;
      await previousPayment.save();
    }
    return { booking: await existingBooking.populate('hotel room payment'), payment: previousPayment, created: false };
  }

  const quote = await getBookingQuote({ ...payload, couponCode: expectedNotes.couponCode });
  const couponDiscount = Number(order.notes?.couponDiscount || 0);
  if (!Number.isFinite(couponDiscount) || couponDiscount !== quote.discountAmount) {
    throw Object.assign(new Error('Payment order has an invalid coupon discount.'), { status: 400 });
  }
  if (Number(order.amount) !== Math.round(quote.total * 100) || Number(gatewayPayment.amount) !== Number(order.amount)) {
    throw Object.assign(new Error('The captured payment amount does not match this booking total.'), { status: 400 });
  }
  let couponRedeemed = false;
  try {
    if (quote.couponCode) {
      await redeemCoupon(quote.couponCode);
      couponRedeemed = true;
    }
    const payment = previousPayment || await Payment.create({
      orderId, paymentId, signature, amount: gatewayPayment.amount,
      currency: gatewayPayment.currency || 'INR', status: 'captured',
    });
    const booking = await Booking.create({
      user: accountUser?.role === 'customer' ? accountUser._id : undefined,
      hotel: quote.room.hotel, room: quote.room._id, packageId: quote.packagePlan?._id, checkIn: payload.checkIn, checkOut: payload.checkOut,
      guests: quote.guests, roomCount: quote.rooms, totalPrice: quote.total,
      couponCode: expectedNotes.couponCode || undefined, couponDiscount,
      status: 'pending',
      paymentMethod: 'online', paymentStatus: 'paid', guestInfo: payload.guestInfo, payment: payment._id,
    });
    payment.booking = booking._id;
    if (signature) payment.signature = signature;
    await payment.save();
    quote.room.bookings.push({ start: payload.checkIn, end: payload.checkOut });
    await quote.room.save();
    return { booking: await booking.populate('hotel room payment'), payment, created: true };
  } catch (err) {
    if (couponRedeemed) {
      try { await releaseCouponRedemption(quote.couponCode); }
      catch (releaseError) { console.error(`Coupon redemption rollback failed for ${quote.couponCode}:`, releaseError.message); }
    }
    throw err;
  }
}

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
