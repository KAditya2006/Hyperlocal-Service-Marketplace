const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  imageUrl: String,
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, chatId: 1 });
messageSchema.index({ chatId: 1, deliveredTo: 1 });
messageSchema.index({ chatId: 1, readBy: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
