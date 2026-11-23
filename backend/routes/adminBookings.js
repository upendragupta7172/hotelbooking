import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import FoodOrder from '../models/FoodOrder.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import AdminSetting from '../models/AdminSetting.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { isUnavailable } from '../utils/roomAvailability.js';

const router = express.Router();
const requireAdmin = [protect, admin];
const editableStatuses = new Set(['pending', 'booked', 'confirmed']);

const validDate = (value) => value && !Number.isNaN(new Date(value).getTime());
const dateFilter = (from, to) => {
  const range = {};
  if (validDate(from)) range.$gte = new Date(from);
  if (validDate(to)) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : undefined;
};
const populateBooking = (query) => query
  .populate('user', 'name email phone')
  .populate('hotel', 'name city country address images')
  .populate('room', 'name type roomNumber pricePerNight discountPrice capacity hotel')
  .populate({ path: 'payment', select: 'orderId paymentId amount currency status refundStatus' });
const asDateKey = (value) => new Date(value).toISOString().slice(0, 10);
const sameRange = (range, checkIn, checkOut) => asDateKey(range.start) === asDateKey(checkIn) && asDateKey(range.end) === asDateKey(checkOut);

router.get('/notifications', ...requireAdmin, async (req, res) => {
  try {
    let settings = await AdminSetting.findOne({ key: 'booking-notifications' });
    if (!settings) {
      try {
        settings = await AdminSetting.create({ key: 'booking-notifications', bookingNotificationsReadAt: new Date() });
      } catch (error) {
        if (error.code !== 11000) throw error;
        settings = await AdminSetting.findOne({ key: 'booking-notifications' });
      }
    }
    const filter = {
      adminSeenAt: null,
      $or: [
        { status: 'pending' },
        { createdAt: { $gt: settings.bookingNotificationsReadAt || new Date() } },
      ],
    };
    const [count, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      populateBooking(Booking.find(filter).sort({ createdAt: -1 }).limit(10)),
    ]);
    return res.json({ count, bookings });
  } catch (err) {
    console.error('Admin booking notifications failed:', err.message);
    return res.status(500).json({ message: 'Unable to load booking notifications.' });
  }
});

router.post('/notifications/read', ...requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(mongoose.isValidObjectId) : [];
    const now = new Date();
    if (ids.length) {
      await Booking.updateMany({ _id: { $in: ids } }, { $set: { adminSeenAt: now } });
    } else {
      await AdminSetting.findOneAndUpdate({ key: 'booking-notifications' }, { $set: { bookingNotificationsReadAt: now } }, { upsert: true, new: true });
      await Booking.updateMany({ adminSeenAt: null, createdAt: { $lte: now } }, { $set: { adminSeenAt: now } });
    }
    return res.json({ message: 'Booking notifications marked as read.' });
  } catch (err) {
    console.error('Mark booking notifications read failed:', err.message);
    return res.status(500).json({ message: 'Unable to update booking notifications.' });
  }
});

router.get('/', ...requireAdmin, async (req, res) => {
  try {
    const { id = '', name = '', phone = '', bookingFrom, bookingTo, checkInFrom, checkInTo, status } = req.query;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const filter = {};
    if (id.trim()) {
      if (!mongoose.isValidObjectId(id.trim())) return res.json({ bookings: [], total: 0, page, pages: 0 });
      filter._id = id.trim();
    }
    if (name.trim()) filter['guestInfo.name'] = { $regex: name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (phone.trim()) filter['guestInfo.phone'] = { $regex: phone.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const createdAt = dateFilter(bookingFrom, bookingTo);
    const checkIn = dateFilter(checkInFrom, checkInTo);
    if (createdAt) filter.createdAt = createdAt;
    if (checkIn) filter.checkIn = checkIn;
    if (status) {
      const normalized = String(status).toLowerCase();
      filter.status = normalized === 'confirmed' ? { $in: ['confirmed', 'booked'] } : normalized;
    }

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
    ]);
    return res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin booking list failed:', err.message);
    return res.status(500).json({ message: 'Unable to load bookings.' });
  }
});

router.get('/:id', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking ID.' });
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    return res.json(booking);
  } catch (err) {
    console.error('Admin booking detail failed:', err.message);
    return res.status(500).json({ message: 'Unable to load booking details.' });
  }
});

router.put('/:id/status', ...requireAdmin, async (req, res) => {
  const allowed = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'rejected', 'no-show', 'completed'];
  const nextStatus = String(req.body?.status || '').toLowerCase();
  if (!allowed.includes(nextStatus)) return res.status(400).json({ message: 'Choose a valid booking status.' });
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking ID.' });
    const booking = await Booking.findById(req.params.id).populate('room payment');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    const transitions = {
      pending: ['confirmed', 'cancelled', 'rejected', 'no-show'],
      booked: ['confirmed', 'checked-in', 'cancelled', 'rejected', 'no-show'],
      confirmed: ['checked-in', 'cancelled', 'rejected', 'no-show'],
      'checked-in': ['checked-out'],
      'checked-out': ['completed'],
      cancelled: [], rejected: [], 'no-show': [], completed: [],
    };
    if (!transitions[booking.status]?.includes(nextStatus) && booking.status !== nextStatus) {
      return res.status(409).json({ message: `Cannot change a ${statusLabel(booking.status)} booking to ${statusLabel(nextStatus)}.` });
    }
    if (nextStatus === 'no-show' && new Date(booking.checkIn) >= new Date(new Date().toDateString())) {
      return res.status(409).json({ message: 'A guest can only be marked no-show after their check-in date.' });
    }

    const previousStatus = booking.status;
    booking.status = nextStatus;
    await booking.save();
    if (['cancelled', 'rejected', 'no-show'].includes(nextStatus)) {
      if (['cancelled', 'rejected'].includes(nextStatus) && booking.payment && booking.payment.status === 'captured') {
        await Payment.findByIdAndUpdate(booking.payment._id, { refundStatus: 'requested' });
      }
      await releaseBookingRange(booking);
    }
    if (nextStatus === 'checked-in' && booking.room?.status === 'Available') {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'Occupied' });
    }
    if (['checked-out', 'completed'].includes(nextStatus) && booking.room?.status === 'Occupied') {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'Cleaning' });
    }
    console.info(`Admin changed booking ${booking._id}: ${previousStatus} -> ${nextStatus}`);
    return res.json(await populateBooking(Booking.findById(booking._id)));
  } catch (err) {
    console.error('Admin booking status update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update booking status.' });
  }
});

router.put('/:id/modify', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking ID.' });
    const booking = await Booking.findById(req.params.id).populate('room payment');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!editableStatuses.has(booking.status)) return res.status(409).json({ message: 'Only a pending or confirmed future reservation can be modified.' });
    const checkIn = req.body?.checkIn || booking.checkIn;
    const checkOut = req.body?.checkOut || booking.checkOut;
    const guests = Number(req.body?.guests ?? booking.guests);
    const guestInfo = { ...(booking.guestInfo?.toObject?.() || {}), ...(req.body?.guestInfo || {}) };
    if (!guestInfo.name?.trim() || !/^\S+@\S+\.\S+$/.test(guestInfo.email || '') || !guestInfo.phone?.trim()) {
      return res.status(400).json({ message: 'Enter a guest name, valid email, and phone number.' });
    }
    const quote = await quoteForAdminChange(booking, booking.room, checkIn, checkOut, guests);
    if (booking.payment?.status === 'captured' && quote.total !== booking.totalPrice) {
      return res.status(409).json({ message: 'This change alters the paid amount. Adjust or refund the payment before changing these stay details.' });
    }
    await moveBookingRange(booking, booking.room, checkIn, checkOut);
    booking.checkIn = checkIn;
    booking.checkOut = checkOut;
    booking.guests = guests;
    booking.totalPrice = quote.total;
    booking.guestInfo = guestInfo;
    await booking.save();
    return res.json(await populateBooking(Booking.findById(booking._id)));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Admin booking modification failed:', err.message);
    return res.status(500).json({ message: 'Unable to modify this booking.' });
  }
});

router.put('/:id/assign-room', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.body?.roomId)) return res.status(400).json({ message: 'Choose a valid room.' });
    const booking = await Booking.findById(req.params.id).populate('room payment');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!editableStatuses.has(booking.status)) return res.status(409).json({ message: 'Room assignment is available only for pending or confirmed reservations.' });
    const room = await Room.findById(req.body.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (String(room.hotel) !== String(booking.hotel)) return res.status(400).json({ message: 'Assign a room from the same hotel.' });
    const quote = await quoteForAdminChange(booking, room, booking.checkIn, booking.checkOut, booking.guests);
    if (booking.payment?.status === 'captured' && quote.total !== booking.totalPrice) {
      return res.status(409).json({ message: 'This room has a different rate. A paid booking can only be reassigned to a room with the same total.' });
    }
    const changingRoom = String(room._id) !== String(booking.room._id || booking.room);
    await moveBookingRange(booking, room, booking.checkIn, booking.checkOut);
    booking.room = room._id;
    if (changingRoom) booking.packageId = undefined;
    booking.totalPrice = quote.total;
    await booking.save();
    return res.json(await populateBooking(Booking.findById(booking._id)));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Admin room assignment failed:', err.message);
    return res.status(500).json({ message: 'Unable to assign this room.' });
  }
});

router.put('/:id/room-service/settle', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!['checked-in', 'checked-out', 'completed'].includes(booking.status)) return res.status(409).json({ message: 'Room dining bill can be settled during guest checkout.' });
    if (!(booking.roomServiceTotal > 0)) return res.status(409).json({ message: 'There is no room dining balance to settle.' });
    booking.roomServiceSettledAt = booking.roomServiceSettledAt || new Date();
    await booking.save();
    await FoodOrder.updateMany({ booking: booking._id, paymentMethod: 'room-bill', paymentStatus: 'room-bill' }, { $set: { paymentStatus: 'paid' } });
    return res.json(await populateBooking(Booking.findById(booking._id)));
  } catch (err) {
    console.error('Room dining bill settlement failed:', err.message);
    return res.status(500).json({ message: 'Unable to settle the room dining bill.' });
  }
});

async function quoteForAdminChange(booking, room, checkIn, checkOut, guests) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw Object.assign(new Error('Check-out must be after check-in.'), { status: 400 });
  if (!Number.isInteger(guests) || guests < 1 || guests > Number(room.capacity || 2)) throw Object.assign(new Error(`This room allows up to ${room.capacity || 2} guests.`), { status: 400 });
  const candidate = room.toObject();
  if (String(room._id) === String(booking.room._id || booking.room)) {
    candidate.bookings = (candidate.bookings || []).filter((range) => !sameRange(range, booking.checkIn, booking.checkOut));
    if (candidate.status === 'Occupied') candidate.status = 'Available';
  }
  if (isUnavailable(candidate, start, end)) throw Object.assign(new Error('The room is unavailable for those dates.'), { status: 409 });
  const nights = Math.round((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86400000);
  if (nights < 1) throw Object.assign(new Error('A stay must be at least one night.'), { status: 400 });
  const packagePlan = booking.packageId && room.packages?.find((item) => String(item._id) === String(booking.packageId));
  const subtotal = Number(packagePlan?.pricePerNight ?? room.discountPrice ?? room.pricePerNight) * nights * Number(booking.roomCount || 1);
  return { total: subtotal + Math.round(subtotal * .12) };
}

async function moveBookingRange(booking, targetRoom, checkIn, checkOut) {
  const sameRoom = booking.room && String(booking.room._id || booking.room) === String(targetRoom._id);
  if (booking.room && (!sameRoom || !sameRange({ start: checkIn, end: checkOut }, booking.checkIn, booking.checkOut))) {
    await removeRange(booking.room._id || booking.room, booking.checkIn, booking.checkOut);
  }
  const room = await Room.findById(targetRoom._id);
  if (!room.bookings.some((range) => sameRange(range, checkIn, checkOut))) room.bookings.push({ start: checkIn, end: checkOut });
  await room.save();
}

async function removeRange(roomId, checkIn, checkOut) {
  const room = await Room.findById(roomId);
  if (!room) return;
  room.bookings = room.bookings.filter((range) => !sameRange(range, checkIn, checkOut));
  await room.save();
}

async function releaseBookingRange(booking) {
  await removeRange(booking.room?._id || booking.room, booking.checkIn, booking.checkOut);
}

function statusLabel(status) {
  return ({ 'checked-in': 'checked-in', 'checked-out': 'checked-out', 'no-show': 'no-show' })[status] || status;
}

export default router;
