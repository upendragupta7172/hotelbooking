import express from 'express';
import mongoose from 'mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import { validateVideoUrls } from '../utils/videoUrls.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();
const requireAdmin = [protect, admin];
const editableFields = ['hotel', 'roomNumber', 'type', 'name', 'image', 'images', 'videos', 'description', 'capacity', 'size', 'bedType', 'category', 'amenities', 'pricePerNight', 'discountPrice', 'status', 'maintenancePeriods', 'packages'];
const pickRoomFields = (body) => Object.fromEntries(
  editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
);

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads', 'rooms');
const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

router.post('/images', ...requireAdmin, async (req, res) => {
  try {
    const { name, type, dataUrl } = req.body || {};
    const extension = imageTypes[type];
    const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!name || !extension || !match || match[1] !== type) return res.status(400).json({ message: 'Upload a JPG, PNG, WEBP, or GIF image.' });
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) return res.status(400).json({ message: 'Each image must be smaller than 5 MB.' });
    await mkdir(uploadsDirectory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(path.join(uploadsDirectory, filename), buffer, { flag: 'wx' });
    return res.status(201).json({ url: `/uploads/rooms/${filename}` });
  } catch (err) {
    console.error('Room image upload failed:', err.message);
    return res.status(500).json({ message: 'Unable to upload room image.' });
  }
});

router.get('/', ...requireAdmin, async (req, res) => {
  try {
    const rooms = await Room.find().populate('hotel category amenities packages.includedAmenities').sort({ createdAt: -1 });
    return res.json(rooms);
  } catch (err) {
    console.error('Admin room list failed:', err.message);
    return res.status(500).json({ message: 'Unable to load rooms.' });
  }
});

router.post('/', ...requireAdmin, async (req, res) => {
  try {
    const payload = pickRoomFields(req.body);
    if (payload.category === '') payload.category = null;
    if (!payload.hotel || !mongoose.isValidObjectId(payload.hotel)) return res.status(400).json({ message: 'Choose a valid hotel.' });
    if (!payload.roomNumber?.trim()) return res.status(400).json({ message: 'Room number is required.' });
    if (!payload.type?.trim()) return res.status(400).json({ message: 'Room type is required.' });
    payload.name = payload.type.trim();
    const imageError = validateImageUrls(payload.images, payload.image);
    if (imageError) return res.status(400).json({ message: imageError });
    const videoError = validateVideoUrls(payload.videos, 'Room videos');
    if (videoError) return res.status(400).json({ message: videoError });
    payload.image = payload.images?.[0] || payload.image || '';
    if (!Number.isFinite(Number(payload.pricePerNight)) || Number(payload.pricePerNight) < 0) {
      return res.status(400).json({ message: 'Enter a valid room price.' });
    }
    const packageError = validatePackages(payload.packages);
    if (packageError) return res.status(400).json({ message: packageError });
    if (payload.capacity !== undefined && (!Number.isInteger(Number(payload.capacity)) || Number(payload.capacity) < 1)) return res.status(400).json({ message: 'Guest capacity must be at least one.' });
    const pricingError = validateDiscount(payload.discountPrice, payload.pricePerNight);
    if (pricingError) return res.status(400).json({ message: pricingError });
    const periodError = validatePeriods(payload.maintenancePeriods);
    if (periodError) return res.status(400).json({ message: periodError });
    if (!(await Hotel.exists({ _id: payload.hotel }))) return res.status(400).json({ message: 'Selected hotel was not found.' });
    if (await Room.exists({ hotel: payload.hotel, roomNumber: payload.roomNumber.trim() })) return res.status(409).json({ message: 'That room number is already used for this hotel.' });
    const room = await Room.create({ ...payload, capacity: payload.capacity === undefined ? 2 : Number(payload.capacity), pricePerNight: Number(payload.pricePerNight) });
    return res.status(201).json(await room.populate('hotel category amenities packages.includedAmenities'));
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Admin room create failed:', err.message);
    return res.status(500).json({ message: 'Unable to create room.' });
  }
});

router.put('/:id', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid room ID.' });
    const existingRoom = await Room.findById(req.params.id).select('hotel roomNumber pricePerNight discountPrice');
    if (!existingRoom) return res.status(404).json({ message: 'Room not found.' });
    const payload = pickRoomFields(req.body);
    if (payload.category === '') payload.category = null;
    if (payload.roomNumber !== undefined && !payload.roomNumber.trim()) return res.status(400).json({ message: 'Room number is required.' });
    if (payload.type !== undefined && !payload.type.trim()) return res.status(400).json({ message: 'Room type is required.' });
    if (payload.type !== undefined) payload.name = payload.type.trim();
    const imageError = validateImageUrls(payload.images, payload.image);
    if (imageError) return res.status(400).json({ message: imageError });
    const videoError = validateVideoUrls(payload.videos, 'Room videos');
    if (videoError) return res.status(400).json({ message: videoError });
    if (payload.images !== undefined) payload.image = payload.images[0] || '';
    if (payload.hotel && !(await Hotel.exists({ _id: payload.hotel }))) return res.status(400).json({ message: 'Selected hotel was not found.' });
    if (payload.roomNumber !== undefined || payload.hotel !== undefined) {
      const hotelId = payload.hotel || existingRoom.hotel;
      const roomNumber = payload.roomNumber?.trim() || existingRoom.roomNumber;
      if (await Room.exists({ _id: { $ne: req.params.id }, hotel: hotelId, roomNumber })) return res.status(409).json({ message: 'That room number is already used for this hotel.' });
    }
    if (payload.pricePerNight !== undefined) {
      if (!Number.isFinite(Number(payload.pricePerNight)) || Number(payload.pricePerNight) < 0) return res.status(400).json({ message: 'Enter a valid room price.' });
      payload.pricePerNight = Number(payload.pricePerNight);
    }
    if (payload.capacity !== undefined) {
      if (!Number.isInteger(Number(payload.capacity)) || Number(payload.capacity) < 1) return res.status(400).json({ message: 'Guest capacity must be at least one.' });
      payload.capacity = Number(payload.capacity);
    }
    const packageError = validatePackages(payload.packages);
    if (packageError) return res.status(400).json({ message: packageError });
    const pricingError = validateDiscount(
      payload.discountPrice === undefined ? existingRoom.discountPrice : payload.discountPrice,
      payload.pricePerNight === undefined ? existingRoom.pricePerNight : payload.pricePerNight
    );
    if (pricingError) return res.status(400).json({ message: pricingError });
    const periodError = validatePeriods(payload.maintenancePeriods);
    if (periodError) return res.status(400).json({ message: periodError });
    const room = await Room.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate('hotel category amenities packages.includedAmenities');
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    return res.json(room);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That room number is already used for this hotel.' });
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    console.error('Admin room update failed:', err.message);
    return res.status(500).json({ message: 'Unable to update room.' });
  }
});

router.delete('/:id', ...requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid room ID.' });
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (await Booking.exists({ room: room._id })) return res.status(409).json({ message: 'This room has booking history and cannot be deleted.' });
    await room.deleteOne();
    return res.json({ message: 'Room deleted.' });
  } catch (err) {
    console.error('Admin room delete failed:', err.message);
    return res.status(500).json({ message: 'Unable to delete room.' });
  }
});

export default router;

function validatePackages(packages) {
  if (packages === undefined) return null;
  if (!Array.isArray(packages)) return 'Packages must be a list.';
  for (const [index, plan] of packages.entries()) {
    if (!plan.name?.trim()) return `Package ${index + 1} needs a name.`;
    if (!Number.isFinite(Number(plan.pricePerNight)) || Number(plan.pricePerNight) < 0) return `Package ${index + 1} needs a valid nightly price.`;
    plan.pricePerNight = Number(plan.pricePerNight);
  }
  return null;
}

function validateDiscount(discountPrice, basePrice) {
  if (discountPrice === undefined || discountPrice === '' || discountPrice === null) return null;
  const discount = Number(discountPrice);
  const base = Number(basePrice);
  if (!Number.isFinite(discount) || discount < 0) return 'Discount price must be a valid non-negative amount.';
  if (Number.isFinite(base) && discount > base) return 'Discount price cannot be higher than the base price.';
  return null;
}

function validateImageUrls(images, image) {
  const urls = images === undefined ? (image ? [image] : []) : images;
  if (!Array.isArray(urls)) return 'Room images must be a list.';
  if (urls.length > 10) return 'A room can have up to 10 images.';
  const invalid = urls.some((url) => typeof url !== 'string' || (!/^https?:\/\//i.test(url) && !url.startsWith('/uploads/rooms/')));
  return invalid ? 'Room images must be uploaded images or http/https URLs.' : null;
}

function validatePeriods(periods) {
  if (periods === undefined) return null;
  if (!Array.isArray(periods)) return 'Maintenance periods must be a list.';
  for (const [index, period] of periods.entries()) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return `Maintenance period ${index + 1} must have a valid end after its start.`;
    }
  }
  return null;
}
