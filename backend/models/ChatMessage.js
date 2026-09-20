const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, default: 'User' },
    senderRole: { type: String, enum: ['Sponsor', 'Performer', 'Admin'], default: 'Sponsor' },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);