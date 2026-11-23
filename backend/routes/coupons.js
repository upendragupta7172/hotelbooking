const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Coupon = require('../models/Coupon');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { getBookingQuote } = require('../utils/bookingQuote');
const { normalizeCouponCode } = require('../utils/couponPricing');

const router = express.Router();
const adminOnly = [protect, admin];

const couponView = (coupon) => ({
  _id: coupon._id,
  code: normalizeCouponCode(coupon.code),
  discountType: coupon.discountType || 'percentage',
  discountValue: Number(coupon.discountValue ?? coupon.discountPercent ?? 0),
  minBookingAmount: Number(coupon.minBookingAmount || 0),
  maxDiscountAmount: Number(coupon.maxDiscountAmount || 0),
  applicableHotel: coupon.applicableHotel ? String(coupon.applicableHotel._id || coupon.applicableHotel) : null,
  applicableCategory: coupon.applicableCategory ? String(coupon.applicableCategory._id || coupon.applicableCategory) : null,
  applicableHotelName: coupon.applicableHotel?.name || '',
  applicableCategoryName: coupon.applicableCategory?.name || '',
  expiryDate: coupon.expiryDate,
  usageLimit: Number(coupon.usageLimit || 0),
  usedCount: Number(coupon.usedCount || 0),
});

const isUsable = (coupon, now = new Date()) =>
  new Date(coupon.expiryDate) > now &&
  (!Number(coupon.usageLimit) || Number(coupon.usedCount || 0) < Number(coupon.usageLimit));

const validateAdminInput = [
  body('code').trim().toUpperCase().matches(/^[A-Z0-9][A-Z0-9_-]{2,31}$/).withMessage('Use 3–32 letters, numbers, hyphens, or underscores for the code.'),
  body('discountType').isIn(['percentage', 'flat']).withMessage('Choose percentage or flat discount.'),
  body('discountValue').isFloat({ min: 0.01 }).withMessage('Discount value must be greater than zero.'),
  body('discountValue').custom((value, { req }) => {
    if (req.body.discountType === 'percentage' && Number(value) > 100) throw new Error('Percentage discount cannot exceed 100%.');
    return true;
  }),
  body('minBookingAmount').isFloat({ min: 0 }).withMessage('Minimum booking amount cannot be negative.'),
  body('maxDiscountAmount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 0 }),
  body('applicableHotel').optional({ values: 'null' }).isMongoId().withMessage('Choose a valid hotel.')
    .bail().custom(async (id) => {
      if (id && !await mongoose.model('Hotel').exists({ _id: id })) throw new Error('Selected hotel was not found.');
      return true;
    }),
  body('applicableCategory').optional({ values: 'null' }).isMongoId().withMessage('Choose a valid room category.')
    .bail().custom(async (id) => {
      if (id && !await Category.exists({ _id: id })) throw new Error('Selected room category was not found.');
      return true;
    }),
  body('expiryDate').isISO8601().withMessage('Enter a valid expiry date.').custom((value) => {
    if (new Date(value) <= new Date()) throw new Error('Expiry date must be in the future.');
    return true;
  }),
];

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  return next();
};

const couponPayload = (body) => ({
  code: normalizeCouponCode(body.code),
  discountType: body.discountType,
  discountValue: Number(body.discountValue),
  minBookingAmount: Number(body.minBookingAmount || 0),
  maxDiscountAmount: Number(body.maxDiscountAmount || 0),
  applicableHotel: body.applicableHotel || null,
  applicableCategory: body.applicableCategory || null,
  usageLimit: Number(body.usageLimit || 0),
  expiryDate: new Date(body.expiryDate),
});

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({ expiryDate: { $gt: new Date() } })
      .populate('applicableHotel', 'name')
      .populate('applicableCategory', 'name')
      .sort({ expiryDate: 1 })
      .lean();
    return res.json(coupons.filter((coupon) => isUsable(coupon)).map(couponView));
  } catch (err) {
    console.error('Available coupon lookup failed:', err.message);
    return res.status(500).json({ message: 'Unable to load available coupons.' });
  }
});

router.post('/validate', [
  body('code').trim().notEmpty().withMessage('Enter a coupon code.'),
  body('roomId').isMongoId(),
  body('checkIn').isISO8601(),
  body('checkOut').isISO8601(),
  body('guests').isInt({ min: 1 }),
  body('rooms').optional().isInt({ min: 1, max: 5 }),
  body('packageId').optional().isMongoId(),
], validateInput, async (req, res) => {
  try {
    const quote = await getBookingQuote({ ...req.body, couponCode: req.body.code });
    return res.json({
      coupon: couponView(quote.coupon),
      discountAmount: quote.discountAmount,
      subtotal: quote.subtotal,
      taxes: quote.taxes,
      total: quote.total,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Coupon validation failed:', err.message);
    return res.status(500).json({ message: 'Unable to validate this coupon.' });
  }
});

router.get('/admin', ...adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json(coupons.map(couponView));
  } catch (err) {
    console.error('Admin coupon list failed:', err.message);
    return res.status(500).json({ message: 'Unable to load coupons.' });
  }
});

router.get('/admin/occupancy', ...adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const [inventory, activeBookings] = await Promise.all([
      Room.aggregate([
        {
          $group: {
            _id: '$hotel',
            roomIds: { $push: '$_id' },
            availableRoomIds: {
              $push: { $cond: [{ $eq: ['$status', 'Available'] }, '$_id', null] },
            },
            occupiedRoomIds: {
              $push: { $cond: [{ $eq: ['$status', 'Occupied'] }, '$_id', null] },
            },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: { $in: ['booked', 'confirmed', 'pending', 'checked-in'] },
            checkIn: { $lte: now },
            checkOut: { $gt: now },
          },
        },
        { $group: { _id: '$hotel', roomIds: { $addToSet: '$room' } } },
      ]),
    ]);
    const activeRoomIdsByHotel = new Map(
      activeBookings.map((item) => [String(item._id), new Set(item.roomIds.map(String))])
    );
    const hotelIds = inventory.map((item) => item._id);
    const hotels = await mongoose.model('Hotel').find({ _id: { $in: hotelIds } }).select('name').lean();
    const hotelNames = new Map(hotels.map((hotel) => [String(hotel._id), hotel.name]));
    const insights = inventory.flatMap((item) => {
      const hotelName = hotelNames.get(String(item._id));
      if (!hotelName) return [];
      const inventoryRoomIds = new Set(item.roomIds.map(String));
      const activeRoomIds = activeRoomIdsByHotel.get(String(item._id)) || new Set();
      const bookedRoomIds = new Set([
        ...item.occupiedRoomIds.filter(Boolean).map(String),
        ...[...activeRoomIds].filter((roomId) => inventoryRoomIds.has(roomId)),
      ]);
      const availableRooms = item.availableRoomIds
        .filter(Boolean)
        .map(String)
        .filter((roomId) => inventoryRoomIds.has(roomId) && !bookedRoomIds.has(roomId)).length;
      return [{
        hotelId: String(item._id),
        hotelName,
        totalRooms: item.roomIds.length,
        availableRooms,
        bookedRooms: bookedRoomIds.size,
      }];
    });
    return res.json(insights);
  } catch (err) {
    console.error('Coupon occupancy lookup failed:', err.message);
    return res.status(500).json({ message: 'Unable to load current room occupancy.' });
  }
});

router.post('/admin', ...adminOnly, validateAdminInput, validateInput, async (req, res) => {
  try {
    const coupon = await Coupon.create(couponPayload(req.body));
    return res.status(201).json(couponView(coupon));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A coupon with this code already exists.' });
    console.error('Admin coupon creation failed:', err.message);
    return res.status(500).json({ message: 'Unable to create coupon.' });
  }
});

router.put('/admin/:id', ...adminOnly, [
  param('id').isMongoId(),
  ...validateAdminInput,
], validateInput, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, couponPayload(req.body), {
      new: true,
      runValidators: true,
    });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    return res.json(couponView(coupon));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A coupon with this code already exists.' });
    console.error('Admin coupon update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update coupon.' });
  }
});

router.delete('/admin/:id', ...adminOnly, [param('id').isMongoId()], validateInput, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    return res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    console.error('Admin coupon deletion failed:', err.message);
    return res.status(500).json({ message: 'Unable to delete coupon.' });
  }
});

module.exports = router;
