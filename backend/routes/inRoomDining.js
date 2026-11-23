const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const FoodOrder = require('../models/FoodOrder');
const { protect } = require('../middleware/auth');
const razorpayConfig = require('../config/razorpay');

const router = express.Router();

router.get('/:bookingId/menu', protect, async (req, res) => {
  try {
    const booking = await activeGuestBooking(req.params.bookingId, req.user._id);
    if (!booking) return res.status(403).json({ message: 'Room service is available only during your checked-in stay.' });
    return res.json({ hotel: booking.hotel.name, room: booking.room.roomNumber || booking.room.name, menu: booking.hotel.menu.filter((item) => item.available) });
  } catch (err) { return handleError(res, err, 'Unable to load the hotel menu.'); }
});

router.get('/:bookingId/orders', protect, async (req, res) => {
  try {
    const booking = await activeGuestBooking(req.params.bookingId, req.user._id);
    if (!booking) return res.status(403).json({ message: 'Room service is available only during your checked-in stay.' });
    return res.json(await FoodOrder.find({ booking: booking._id }).sort({ createdAt: -1 }));
  } catch (err) { return handleError(res, err, 'Unable to load your room service orders.'); }
});

router.post('/:bookingId/orders', protect, async (req, res) => {
  try {
    const booking = await activeGuestBooking(req.params.bookingId, req.user._id);
    if (!booking) return res.status(403).json({ message: 'Only checked-in guests can order room service.' });
    const paymentMethod = req.body.paymentMethod;
    if (!['online', 'room-bill'].includes(paymentMethod)) return res.status(400).json({ message: 'Choose online payment or add to room bill.' });
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) return res.status(400).json({ message: 'Add at least one menu item.' });

    const lines = [];
    for (const requested of req.body.items) {
      if (!mongoose.isValidObjectId(requested.menuItemId)) return res.status(400).json({ message: 'A selected menu item is invalid.' });
      const menuItem = booking.hotel.menu.id(requested.menuItemId);
      const quantity = Number(requested.quantity);
      if (!menuItem || !menuItem.available || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ message: 'One or more items are unavailable or have an invalid quantity.' });
      lines.push({ menuItemId: menuItem._id, name: menuItem.name, category: menuItem.category, quantity, unitPrice: menuItem.price, lineTotal: menuItem.price * quantity });
    }
    const total = Number(lines.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const order = await FoodOrder.create({ booking: booking._id, hotel: booking.hotel._id, room: booking.room._id, user: req.user._id, roomNumber: booking.room.roomNumber, items: lines, total, paymentMethod, paymentStatus: paymentMethod === 'room-bill' ? 'room-bill' : 'pending', status: paymentMethod === 'room-bill' ? 'placed' : 'payment-pending' });
    if (paymentMethod === 'room-bill') {
      await Booking.updateOne({ _id: booking._id }, { $inc: { roomServiceTotal: total }, $set: { roomServiceSettledAt: null } });
      return res.status(201).json({ order, bookingRoomServiceTotal: Number(booking.roomServiceTotal || 0) + total });
    }

    const credentials = razorpayConfig.getCredentials();
    const razorpay = new Razorpay(credentials);
    const gatewayOrder = await razorpay.orders.create({ amount: Math.round(total * 100), currency: 'INR', receipt: `food_${order._id.toString().slice(-18)}`, notes: { type: 'room-service', foodOrderId: String(order._id), bookingId: String(booking._id), guestId: String(req.user._id) } });
    order.razorpayOrderId = gatewayOrder.id;
    await order.save();
    return res.status(201).json({ order, razorpay: { order: gatewayOrder, keyId: credentials.key_id } });
  } catch (err) { return handleError(res, err, 'Unable to place your room service order.'); }
});

router.post('/:bookingId/orders/:orderId/confirm-payment', protect, async (req, res) => {
  try {
    const booking = await activeGuestBooking(req.params.bookingId, req.user._id);
    if (!booking) return res.status(403).json({ message: 'Only checked-in guests can confirm a room service payment.' });
    const order = await FoodOrder.findOne({ _id: req.params.orderId, booking: booking._id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Food order not found.' });
    if (order.status === 'placed' && order.paymentStatus === 'paid') return res.json({ order, message: 'Payment already confirmed.' });
    if (order.status !== 'payment-pending' || !order.razorpayOrderId) return res.status(409).json({ message: 'This food order is not awaiting online payment.' });
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (orderId !== order.razorpayOrderId || !verifySignature(orderId, paymentId, signature, razorpayConfig.getCredentials().key_secret)) return res.status(400).json({ message: 'Razorpay payment signature verification failed.' });
    const razorpay = new Razorpay(razorpayConfig.getCredentials());
    const [payment, gatewayOrder] = await Promise.all([razorpay.payments.fetch(paymentId), razorpay.orders.fetch(orderId)]);
    if (payment.order_id !== orderId || (payment.status !== 'captured' && payment.captured !== true) || gatewayOrder.status !== 'paid' || Number(gatewayOrder.amount_paid) < Number(gatewayOrder.amount) || Number(gatewayOrder.amount) !== Math.round(order.total * 100) || gatewayOrder.notes?.foodOrderId !== String(order._id)) return res.status(409).json({ message: 'Razorpay has not confirmed the expected food order payment yet.' });
    order.status = 'placed'; order.paymentStatus = 'paid'; order.razorpayPaymentId = paymentId; order.razorpaySignature = signature;
    await order.save();
    return res.json({ order });
  } catch (err) { return handleError(res, err, 'Unable to confirm the room service payment.'); }
});

async function activeGuestBooking(bookingId, userId) {
  if (!mongoose.isValidObjectId(bookingId)) return null;
  const booking = await Booking.findOne({ _id: bookingId, user: userId, status: 'checked-in' }).populate('hotel room');
  // The admin-controlled "checked-in" status is the source of truth for an active stay
  // (it flips to "checked-out" at departure), so no extra date-window check is applied.
  if (!booking || !booking.hotel || !booking.room) return null;
  return booking;
}
function verifySignature(orderId, paymentId, signature, secret) {
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
function handleError(res, err, fallback) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid booking or order id.' });
  console.error(fallback, err.stack || err);
  const response = { message: fallback };
  if (process.env.NODE_ENV !== 'production') response.detail = err.message;
  return res.status(500).json(response);
}
module.exports = router;
