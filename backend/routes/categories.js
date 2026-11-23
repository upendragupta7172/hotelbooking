// routes/categories.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET /api/categories
// @desc    Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories (admin only)
router.post(
  '/',
  protect,
  admin,
  [body('name').notEmpty().withMessage('Name required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const category = new Category(req.body);
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/categories/:id (admin only)
router.put(
  '/:id',
  protect,
  admin,
  [body('name').optional().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/categories/:id (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
