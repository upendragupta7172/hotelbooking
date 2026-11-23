// models/Amenity.js
const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String }, // optional, could be an icon class name or URL
}, { timestamps: true });

module.exports = mongoose.model('Amenity', amenitySchema);
