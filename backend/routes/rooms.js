// routes/rooms.js
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Room = require('../models/Room');
const Category = require('../models/Category');
const Amenity = require('../models/Amenity');
const { protect } = require('../middleware/auth');
const { isUnavailable } = require('../utils/roomAvailability');
const admin = require('../middleware/admin');

const ACTIVE_VIEWER_TIMEOUT_MS = 45_000;
const MAX_ACTIVE_VIEWERS_PER_ROOM = 1000;
const activeRoomViewers = new Map();

const pruneRoomViewers = (roomId, now = Date.now()) => {
  const viewers = activeRoomViewers.get(roomId);
  if (!viewers) return null;
  for (const [viewerId, lastSeen] of viewers) {
    if (now - lastSeen > ACTIVE_VIEWER_TIMEOUT_MS) viewers.delete(viewerId);
  }
  if (!viewers.size) {
    activeRoomViewers.delete(roomId);
    return null;
  }
  return viewers;
};

const pruneActiveViewers = () => {
  const now = Date.now();
  for (const roomId of activeRoomViewers.keys()) pruneRoomViewers(roomId, now);
};

const viewerCleanupTimer = setInterval(pruneActiveViewers, ACTIVE_VIEWER_TIMEOUT_MS);
if (typeof viewerCleanupTimer.unref === 'function') viewerCleanupTimer.unref();

router.post('/:id/viewers', [
  param('id').isMongoId(),
  body('viewerId').isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const roomId = req.params.id;
    let viewers = pruneRoomViewers(roomId);
    if (!viewers) {
      if (!await Room.exists({ _id: roomId })) return res.status(404).json({ message: 'Room not found.' });
      viewers = new Map();
      activeRoomViewers.set(roomId, viewers);
    }
    if (viewers.has(req.body.viewerId) || viewers.size < MAX_ACTIVE_VIEWERS_PER_ROOM) {
      viewers.set(req.body.viewerId, Date.now());
    }
    return res.json({ count: viewers.size });
  } catch (err) {
    console.error('Room viewer heartbeat failed:', err.message);
    return res.status(500).json({ message: 'Unable to update room viewer count.' });
  }
});

router.delete('/:id/viewers', [
  param('id').isMongoId(),
  body('viewerId').isUUID(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const viewers = activeRoomViewers.get(req.params.id);
  if (viewers) {
    viewers.delete(req.body.viewerId);
    if (!viewers.size) activeRoomViewers.delete(req.params.id);
  }
  return res.json({ count: viewers?.size || 0 });
});

// @route   GET /api/rooms
// @desc    List rooms with optional filters (date range, category, amenities, price range)
router.get(
  '/',
  [
    query('checkIn').optional().isISO8601(),
    query('checkOut').optional().isISO8601(),
    query('category').optional().isMongoId(),
    query('amenities').optional().isString(), // comma separated ids
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { checkIn, checkOut, category, amenities, minPrice, maxPrice } = req.query;
    if (Boolean(checkIn) !== Boolean(checkOut)) return res.status(400).json({ message: 'Provide both check-in and check-out dates.' });
    if (checkIn && new Date(checkOut) <= new Date(checkIn)) return res.status(400).json({ message: 'Check-out must be after check-in.' });
    let filter = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
    if (amenities) {
      const amenityIds = amenities.split(',').map(id => id.trim());
      filter.amenities = { $all: amenityIds };
    }
    try {
      let rooms = await Room.find(filter).populate('category amenities hotel packages.includedAmenities');
      // If dates provided, filter out rooms that are booked for any overlapping range
      if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        rooms = rooms.filter((room) => !isUnavailable(room, start, end));
      } else {
        rooms = rooms.filter((room) => room.status !== 'Inactive' && room.status !== 'Cleaning' && !(room.status === 'Maintenance' && !room.maintenancePeriods.length));
      }
      res.json(rooms); // real‑time availability
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/rooms (admin only) – create a new room
router.post('/', protect, admin, async (req, res) => {
  const { hotel, name, category, amenities, pricePerNight } = req.body;
  try {
    const room = new Room({ hotel, name, category, amenities, pricePerNight, bookings: [] });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
