// routes/amenities.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Amenity = require('../models/Amenity');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET /api/amenities
// @desc    Public list of amenities
router.get('/', async (req, res) => {
  try {
    const amenities = await Amenity.find();
    res.json(amenities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/amenities (admin only)
router.post(
  '/',
  protect,
  admin,
  [body('name').notEmpty().withMessage('Name required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const amenity = new Amenity(req.body);
      await amenity.save();
      res.status(201).json(amenity);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/amenities/:id (admin only)
router.put(
  '/:id',
  protect,
  admin,
  [body('name').optional().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
      res.json(amenity);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/amenities/:id (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    res.json({ message: 'Amenity deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
