import express from 'express';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();
const requireAdmin = [protect, admin];

router.get('/summary', ...requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const [
      totalBookings,
      todayCheckIns,
      todayCheckOuts,
      upcomingBookings,
      totalRooms,
      occupiedRoomIds,
      cancelledBookings,
      refundRequests,
      revenueResult,
      pendingResult,
      pendingBookingResult,
      recentBookings,
      monthlyRevenue,
      bookingGroups,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['booked', 'pending', 'confirmed', 'checked-in'] }, checkIn: { $gte: dayStart, $lt: dayEnd } }),
      Booking.countDocuments({ status: { $in: ['booked', 'pending', 'confirmed', 'checked-in'] }, checkOut: { $gte: dayStart, $lt: dayEnd } }),
      Booking.countDocuments({ status: { $in: ['booked', 'confirmed', 'pending'] }, checkIn: { $gte: dayEnd } }),
      Room.countDocuments(),
      Booking.distinct('room', { status: { $in: ['booked', 'confirmed', 'checked-in'] }, checkIn: { $lte: now }, checkOut: { $gt: now } }),
      Booking.countDocuments({ status: { $in: ['cancelled', 'rejected'] } }),
      Payment.countDocuments({ refundStatus: 'requested' }),
      Payment.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'created' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: 'pending', status: { $in: ['booked', 'confirmed', 'pending'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Booking.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email').populate('hotel', 'name city').populate('room', 'name type roomNumber'),
      Payment.aggregate([
        { $match: { status: 'captured', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' }, total: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const monthKeys = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1, label: date.toLocaleString('en', { month: 'short' }) };
    });
    const revenueByMonth = new Map(monthlyRevenue.map((item) => [`${item._id.year}-${item._id.month}`, item.total / 100]));
    const bookingsByMonth = new Map();
    for (const item of bookingGroups) {
      const key = `${item._id.year}-${item._id.month}`;
      const group = bookingsByMonth.get(key) || { booked: 0, cancelled: 0, completed: 0 };
      const chartStatus = ['cancelled', 'rejected'].includes(item._id.status) ? 'cancelled' : ['completed', 'checked-out'].includes(item._id.status) ? 'completed' : 'booked';
      group[chartStatus] += item.total;
      bookingsByMonth.set(key, group);
    }

    const occupiedRooms = occupiedRoomIds.length;
    return res.json({
      metrics: {
        totalBookings,
        todayCheckIns,
        todayCheckOuts,
        upcomingBookings,
        availableRooms: Math.max(totalRooms - occupiedRooms, 0),
        occupiedRooms,
        totalRevenue: (revenueResult[0]?.total || 0) / 100,
        pendingPayments: (pendingResult[0]?.total || 0) / 100 + (pendingBookingResult[0]?.total || 0),
        cancelledBookings,
        refundRequests,
        roomOccupancyRate: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      },
      recentBookings,
      monthlyRevenue: monthKeys.map((month) => ({
        label: month.label,
        value: revenueByMonth.get(`${month.year}-${month.month}`) || 0,
      })),
      bookingStatistics: monthKeys.map((month) => ({
        label: month.label,
        ...(bookingsByMonth.get(`${month.year}-${month.month}`) || { booked: 0, cancelled: 0, completed: 0 }),
      })),
    });
  } catch (err) {
    console.error('Admin dashboard summary failed:', err.message);
    return res.status(500).json({ message: 'Unable to load dashboard data.' });
  }
});

router.get('/refunds', ...requireAdmin, async (req, res) => {
  try {
    const refunds = await Payment.find({ refundStatus: 'requested' })
      .sort({ updatedAt: -1 })
      .populate('user', 'name email')
      .populate({ path: 'booking', populate: [{ path: 'hotel', select: 'name city' }, { path: 'room', select: 'name' }] });
    return res.json(refunds);
  } catch (err) {
    console.error('Admin refund list failed:', err.message);
    return res.status(500).json({ message: 'Unable to load refund requests.' });
  }
});

export default router;
