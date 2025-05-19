const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

module.exports = mongoose.model('Setting', settingSchema);