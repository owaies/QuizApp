const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2;
      },
      message: 'At least 2 options required'
    }
  },
  answer: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);