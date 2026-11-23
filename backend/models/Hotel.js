// models/Hotel.js – Mongoose schema for hotels and embedded rooms
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  capacity: Number,
  bedType: String,
  amenities: [String],
  image: String,
});

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, trim: true },
  available: { type: Boolean, default: true },
}, { timestamps: true });

const menuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
}, { timestamps: true });

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  description: { type: String, trim: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },
  starCategory: { type: Number, min: 1, max: 5, default: 3 },
  pricePerNight: { type: Number, min: 0, default: 0 },
  amenities: [String],
  propertyType: { type: String, trim: true },
  images: [String],
  videos: [String],
  rooms: [roomSchema],
  menu: { type: [menuItemSchema], default: [] },
  menuCategories: { type: [menuCategorySchema], default: [] },
});

export default mongoose.model('Hotel', hotelSchema);
