// routes/auth.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 8, max: 20 }).withMessage('Enter a valid phone number'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, phone } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
      user = new User({ name, email, password, phone });
      await user.save();
      const token = jwt.sign({ id: user._id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post(
  '/login',
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').exists().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
      const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });
      res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout (client removes token)
router.post('/logout', protect, (req, res) => {
  // In a stateless JWT setup, logout is handled on client side.
  // This endpoint exists for symmetry and can be used to clear httpOnly cookies if implemented.
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
