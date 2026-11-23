import express from 'express';
import mongoose from 'mongoose';
import FoodOrder from '../models/FoodOrder.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();
const requireAdmin = [protect, admin];

router.get('/', ...requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await FoodOrder.find(filter).populate('hotel', 'name city').populate('room', 'roomNumber name type').populate('user', 'name email').sort({ createdAt: -1 }).limit(300);
    return res.json(orders);
  } catch (err) { console.error('Food order list failed:', err.message); return res.status(500).json({ message: 'Unable to load room service orders.' }); }
});

router.get('/notifications', ...requireAdmin, async (req, res) => {
  try {
    const orders = await FoodOrder.find({ adminSeenAt: null, status: { $ne: 'payment-pending' } }).populate('hotel', 'name').populate('room', 'roomNumber name').populate('user', 'name').sort({ createdAt: -1 }).limit(50);
    return res.json({ count: orders.length, orders });
  } catch (err) { console.error('Food order notifications failed:', err.message); return res.status(500).json({ message: 'Unable to load room service notifications.' }); }
});

router.post('/notifications/read', ...requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(mongoose.isValidObjectId) : [];
    const filter = ids.length ? { _id: { $in: ids } } : { adminSeenAt: null };
    await FoodOrder.updateMany(filter, { $set: { adminSeenAt: new Date() } });
    return res.json({ message: 'Room service notifications marked as read.' });
  } catch (err) { console.error('Food notification read update failed:', err.message); return res.status(500).json({ message: 'Unable to update notifications.' }); }
});

router.put('/:id/status', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order id.' });
    const allowed = ['preparing', 'ready', 'delivered'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Choose Preparing, Ready, or Delivered.' });
    const order = await FoodOrder.findOneAndUpdate({ _id: req.params.id, status: { $in: ['placed', 'preparing', 'ready'] } }, { $set: { status: req.body.status } }, { new: true, runValidators: true }).populate('hotel', 'name city').populate('room', 'roomNumber name type').populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Active food order not found.' });
    return res.json(order);
  } catch (err) { console.error('Food order status update failed:', err.message); return res.status(500).json({ message: 'Unable to update room service order.' }); }
});

export default router;
