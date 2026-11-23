const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  bookingNotificationsReadAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
