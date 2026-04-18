const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  }
}, {
  timestamps: true
});

chatSchema.index({ participants: 1, updatedAt: -1 });
chatSchema.index({ 'lastMessage.createdAt': -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
