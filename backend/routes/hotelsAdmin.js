import express from 'express';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import { validateVideoUrls } from '../utils/videoUrls.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();
const requireAdmin = [protect, admin];

router.get('/:id/menu', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
    const known = new Set(hotel.menuCategories.map((item) => item.name.toLowerCase()));
    for (const item of hotel.menu) {
      const name = String(item.category || '').trim();
      if (name && !known.has(name.toLowerCase())) { hotel.menuCategories.push({ name }); known.add(name.toLowerCase()); }
    }
    if (hotel.isModified('menuCategories')) await hotel.save();
    return res.json({ menu: hotel.menu, categories: hotel.menuCategories });
  } catch (err) {
    console.error('Hotel menu load failed:', err.message);
    return res.status(500).json({ message: 'Unable to load hotel menu.' });
  }
});

// @route   GET /api/admin/hotels
// @desc    Get all hotels (admin only)
router.get('/', ...requireAdmin, async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (err) {
    console.error('Admin hotel list failed:', err.message);
    res.status(500).json({ message: 'Unable to load hotels.' });
  }
});

router.post('/:id/menu', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
    const item = menuItemInput(req.body, hotel);
    hotel.menu.push(item);
    await hotel.save();
    return res.status(201).json(hotel.menu.at(-1));
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Hotel menu item create failed:', err.message);
    return res.status(500).json({ message: 'Unable to save menu item.' });
  }
});

router.put('/:id/menu/:itemId', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    const item = hotel?.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Menu item not found.' });
    Object.assign(item, menuItemInput(req.body, hotel));
    await hotel.save();
    return res.json(item);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Hotel menu item update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update menu item.' });
  }
});

router.post('/:id/menu-categories', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
    const name = menuCategoryName(req.body?.name);
    if (hotel.menuCategories.some((item) => item.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ message: 'This menu category already exists.' });
    hotel.menuCategories.push({ name });
    await hotel.save();
    return res.status(201).json(hotel.menuCategories.at(-1));
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Hotel menu category create failed:', err.message);
    return res.status(500).json({ message: 'Unable to save menu category.' });
  }
});

router.put('/:id/menu-categories/:categoryId', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    const category = hotel?.menuCategories.id(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Menu category not found.' });
    const name = menuCategoryName(req.body?.name);
    if (hotel.menuCategories.some((item) => item._id.toString() !== category._id.toString() && item.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ message: 'This menu category already exists.' });
    const oldName = category.name;
    category.name = name;
    hotel.menu.filter((item) => item.category.toLowerCase() === oldName.toLowerCase()).forEach((item) => { item.category = name; });
    await hotel.save();
    return res.json(category);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Hotel menu category update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update menu category.' });
  }
});

router.delete('/:id/menu-categories/:categoryId', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
    const category = hotel.menuCategories.id(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Menu category not found.' });
    if (hotel.menu.some((item) => item.category.toLowerCase() === category.name.toLowerCase())) return res.status(409).json({ message: 'Move or delete this category’s dishes before deleting the category.' });
    category.deleteOne();
    await hotel.save();
    return res.json({ message: 'Menu category deleted.' });
  } catch (err) {
    console.error('Hotel menu category delete failed:', err.message);
    return res.status(500).json({ message: 'Unable to delete menu category.' });
  }
});

router.delete('/:id/menu/:itemId', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
    const item = hotel.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Menu item not found.' });
    item.deleteOne();
    await hotel.save();
    return res.json({ message: 'Menu item deleted.' });
  } catch (err) {
    console.error('Hotel menu item delete failed:', err.message);
    return res.status(500).json({ message: 'Unable to delete menu item.' });
  }
});

// @route   POST /api/admin/hotels
// @desc    Create a new hotel
router.post('/', ...requireAdmin, async (req, res) => {
    try {
      const payload = pickHotelFields(req.body);
      const videoError = validateVideoUrls(payload.videos, 'Hotel videos');
      if (videoError) return res.status(400).json({ message: videoError });
      const hotel = await Hotel.create(payload);
      return res.status(201).json(hotel);
    } catch (err) {
      if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
      console.error('Admin hotel create failed:', err.message);
      return res.status(500).json({ message: 'Unable to create hotel.' });
    }
});

// @route   PUT /api/admin/hotels/:id
// @desc    Update a hotel
router.put('/:id', ...requireAdmin, async (req, res) => {
  try {
    const payload = pickHotelFields(req.body);
    const videoError = validateVideoUrls(payload.videos, 'Hotel videos');
    if (videoError) return res.status(400).json({ message: videoError });
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    return res.json(hotel);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Admin hotel update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update hotel.' });
  }
});

// @route   DELETE /api/admin/hotels/:id
// @desc    Delete a hotel
router.delete('/:id', ...requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    const rooms = await Room.find({ hotel: hotel._id }).select('_id');
    const bookingExists = await Booking.exists({ room: { $in: rooms.map((room) => room._id) } });
    if (bookingExists) return res.status(409).json({ message: 'This hotel has booking history and cannot be deleted.' });
    await Room.deleteMany({ hotel: hotel._id });
    await hotel.deleteOne();
    return res.json({ message: 'Hotel deleted' });
  } catch (err) {
    console.error('Admin hotel delete failed:', err.message);
    return res.status(500).json({ message: 'Unable to delete hotel.' });
  }
});

function pickHotelFields(body) {
  const fields = ['name', 'address', 'city', 'country', 'location', 'description', 'rating', 'reviewCount', 'starCategory', 'pricePerNight', 'amenities', 'propertyType', 'images', 'videos'];
  return Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
}

function menuItemInput(body = {}, hotel) {
  const name = String(body.name || '').trim();
  const category = String(body.category || '');
  const price = Number(body.price);
  if (!name || !Number.isFinite(price) || price < 0) {
    throw Object.assign(new Error('Provide a dish name and a valid price.'), { name: 'ValidationError' });
  }
  const savedCategory = hotel.menuCategories.find((item) => item.name.toLowerCase() === category.trim().toLowerCase());
  if (!savedCategory) throw Object.assign(new Error('Choose a category saved for this hotel.'), { name: 'ValidationError' });
  const data = { name, category: savedCategory.name, price, description: String(body.description || '').trim(), image: String(body.image || '').trim(), available: body.available !== false };
  return data;
}

function menuCategoryName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 40) throw Object.assign(new Error('Enter a category name up to 40 characters.'), { name: 'ValidationError' });
  return name;
}

export default router;
