// config/db.js – MongoDB connection (CommonJS)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env explicitly from this directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/staynest';
  if (!process.env.MONGO_URI) {
    console.warn('⚠️ MONGO_URI not found – using fallback local MongoDB');
  } else {
    console.log('🔑 Using MONGO_URI from .env');
  }
  try {
    await mongoose.connect(uri, {
      // No extra options needed for Mongoose 7+
    });
    console.log('🟢 MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
