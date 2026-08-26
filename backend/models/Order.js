const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  serviceType: {
    type: String,
    enum: ['Umrah Badal', 'Hajj Badal', 'Donation'], 
    required: true
  },
  recipientName: {
    type: String,
    default: "N/A"
  },
  recipientRelation: {
    type: String,
    default: "N/A"
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  milestones: [
    {
      step: { type: String },
      isCompleted: { type: Boolean, default: false },
      proofUrl: { type: String } 
    }
  ],
  price: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);