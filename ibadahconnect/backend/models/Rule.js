const mongoose = require('mongoose');

const RuleSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Performer Rules & Regulations'
  },
  content: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('Rule', RuleSchema);