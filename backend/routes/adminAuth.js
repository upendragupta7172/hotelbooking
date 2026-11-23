const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/auth');

const router = express.Router();

const validationMessage = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const createAdminToken = (user) => jwt.sign(
  { id: user._id },
  config.jwtSecret,
  { expiresIn: config.jwtExpiresIn }
);

// Allow first-time setup only. Once an admin exists, registration is closed.
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validationMessage,
  async (req, res) => {
    try {
      const adminExists = await User.exists({ role: 'admin' });
      if (adminExists) {
        return res.status(409).json({ message: 'Admin registration is closed. An admin already exists.' });
      }

      const email = req.body.email;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: 'Administrator',
        email,
        password: req.body.password,
        role: 'admin',
      });

      return res.status(201).json({
        token: createAdminToken(user),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      console.error('Admin registration failed:', err.message);
      return res.status(500).json({ message: 'Unable to create admin account.' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validationMessage,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email, role: 'admin' });
      if (!user || !(await user.matchPassword(req.body.password))) {
        return res.status(401).json({ message: 'Invalid admin email or password.' });
      }

      return res.json({
        token: createAdminToken(user),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('Admin login failed:', err.message);
      return res.status(500).json({ message: 'Unable to sign in.' });
    }
  }
);

module.exports = router;
