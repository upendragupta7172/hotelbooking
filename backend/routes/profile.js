const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const customerOnly = (req, res, next) => req.user.role === 'customer'
  ? next()
  : res.status(403).json({ message: 'Customer account required.' });

router.get('/me', protect, customerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(user);
  } catch (err) {
    console.error('Profile load failed:', err.message);
    return res.status(500).json({ message: 'Unable to load your profile.' });
  }
});

router.put('/me', protect, customerOnly, [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Enter a valid email address.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 8, max: 20 }).withMessage('Enter a valid phone number.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  try {
    const email = req.body.email;
    const duplicate = await User.exists({ email, _id: { $ne: req.user._id } });
    if (duplicate) return res.status(409).json({ message: 'That email address is already in use.' });
    const user = await User.findByIdAndUpdate(req.user._id, {
      name: req.body.name.trim(), email, phone: req.body.phone?.trim() || '',
    }, { new: true, runValidators: true }).select('-password');
    return res.json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That email address is already in use.' });
    console.error('Profile update failed:', err.message);
    return res.status(500).json({ message: 'Unable to save your profile.' });
  }
});

router.put('/password', protect, customerOnly, [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must contain at least 8 characters.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  try {
    const user = await User.findById(req.user._id);
    if (!user || !(await user.matchPassword(req.body.currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    user.password = req.body.newPassword;
    await user.save();
    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update your password.' });
  }
});

module.exports = router;
