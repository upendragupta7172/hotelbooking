import express from 'express';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
const router = express.Router();

const roomTypeKey = (room) => String(room.type || room.name || room.roomNumber || '').trim().toLowerCase();

const withAvailableRoomCounts = (rooms) => {
  const countsByType = new Map();
  for (const room of rooms) {
    const typeKey = roomTypeKey(room);
    if (room.status === 'Available' && typeKey) {
      countsByType.set(typeKey, (countsByType.get(typeKey) || 0) + 1);
    }
  }
  return rooms.map((room) => ({
    ...room,
    availableRoomCount: countsByType.get(roomTypeKey(room)) || 0,
  }));
};

// GET /api/hotels - optional query params for search/filters
router.get('/', async (req, res) => {
  try {
    const { destination, minPrice, maxPrice, stars } = req.query;
    const filter = {};
    if (destination) filter.city = new RegExp(destination, 'i');
    if (minPrice) filter.pricePerNight = { $gte: Number(minPrice) };
    if (maxPrice) {
      filter.pricePerNight = filter.pricePerNight || {};
      filter.pricePerNight.$lte = Number(maxPrice);
    }
    if (stars) filter.starCategory = Number(stars);

    const hotels = await Hotel.find(filter).lean();
    const reviewSummaries = hotels.length
      ? await Review.aggregate([
        { $match: { hotel: { $in: hotels.map((hotel) => hotel._id) } } },
        { $group: { _id: '$hotel', reviewCount: { $sum: 1 }, rating: { $avg: '$rating' } } },
      ])
      : [];
    const summaryByHotel = new Map(reviewSummaries.map((summary) => [
      String(summary._id),
      { rating: Number(summary.rating.toFixed(1)), reviewCount: summary.reviewCount },
    ]));
    const roomGroups = hotels.length
      ? await Room.find({ hotel: { $in: hotels.map((hotel) => hotel._id) } }).populate('category amenities packages.includedAmenities').lean()
      : [];
    const roomsByHotel = new Map();
    for (const room of roomGroups) {
      const key = String(room.hotel);
      roomsByHotel.set(key, [...(roomsByHotel.get(key) || []), room]);
    }
    return res.json(hotels.map((hotel) => ({
      ...hotel,
      ...summaryByHotel.get(String(hotel._id)),
      rooms: withAvailableRoomCounts(
        roomsByHotel.get(String(hotel._id))?.length ? roomsByHotel.get(String(hotel._id)) : hotel.rooms || []
      ),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/hotels/:id - get single hotel with rooms
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).lean();
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activityStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const countableStatuses = ['booked', 'confirmed', 'checked-in', 'checked-out', 'completed', 'pending'];
    const [rooms, reviews] = await Promise.all([
      Room.find({ hotel: hotel._id }).populate('category amenities packages.includedAmenities').lean(),
      Review.find({ hotel: hotel._id }).populate('user', 'name').sort({ createdAt: -1 }).lean(),
    ]);
    const [recentBookingSummary, dailyBookingCounts] = await Promise.all([
      Booking.aggregate([
        { $match: { hotel: hotel._id, createdAt: { $gte: activityStart }, status: { $in: countableStatuses } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: null, count: { $sum: 1 }, roomId: { $first: '$room' }, createdAt: { $first: '$createdAt' } } },
      ]),
      Booking.aggregate([
        { $match: { hotel: hotel._id, createdAt: { $gte: dayStart }, status: { $in: countableStatuses } } },
        { $group: { _id: '$room', count: { $sum: 1 } } },
      ]),
    ]);
    if (rooms.length) hotel.rooms = rooms;
    const dailyCountByRoom = new Map(dailyBookingCounts.map((item) => [String(item._id), item.count]));
    hotel.rooms = withAvailableRoomCounts((hotel.rooms || []).map((room) => ({
      ...room,
      bookingsToday: dailyCountByRoom.get(String(room._id || room.id)) || 0,
    })));
    hotel.reviews = reviews;
    if (reviews.length) {
      hotel.reviewCount = reviews.length;
      hotel.rating = Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1));
    }
    const recentBooking = recentBookingSummary[0];
    return res.json({
      ...hotel,
      activity: {
        recentBookingCount: recentBooking?.count || 0,
        latestRoomId: recentBooking?.roomId ? String(recentBooking.roomId) : null,
        latestCreatedAt: recentBooking?.createdAt || null,
      },
    });
  } catch (err) {
    console.error('Hotel detail lookup failed:', err.message);
    res.status(err.name === 'CastError' ? 400 : 500).json({ message: err.name === 'CastError' ? 'Invalid hotel ID.' : 'Server error' });
  }
});

export default router;
