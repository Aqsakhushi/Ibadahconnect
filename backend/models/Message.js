const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, default: 'User' },
    senderRole: { type: String, default: 'Sponsor', enum: ['Sponsor', 'Performer', 'Admin'] },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);