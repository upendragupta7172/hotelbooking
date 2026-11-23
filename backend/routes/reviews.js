import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const customerOnly = (req, res, next) => req.user.role === 'customer'
  ? next()
  : res.status(403).json({ message: 'Customer account required.' });

router.get('/mine', protect, customerOnly, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .select('booking hotel rating comment createdAt')
      .lean();
    return res.json(reviews);
  } catch (err) {
    console.error('Customer reviews lookup failed:', err.message);
    return res.status(500).json({ message: 'Unable to load your reviews.' });
  }
});

router.post('/bookings/:bookingId', protect, customerOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const rating = Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Choose a rating from 1 to 5.' });
    }
    if (!comment) return res.status(400).json({ message: 'Write a short review before submitting.' });
    if (comment.length > 2000) return res.status(400).json({ message: 'Review must be 2000 characters or fewer.' });

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id,
      status: { $in: ['checked-out', 'completed'] },
    }).select('hotel');
    if (!booking) {
      return res.status(403).json({ message: 'You can review your stay after checkout.' });
    }

    const review = await Review.create({
      user: req.user._id,
      hotel: booking.hotel,
      booking: booking._id,
      rating,
      comment,
    });
    await review.populate('user', 'name');
    return res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already reviewed this stay.' });
    console.error('Review submission failed:', err.message);
    return res.status(500).json({ message: 'Unable to submit your review.' });
  }
});

export default router;
