const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { getPagination } = require('../utils/bookingRules');
const createNotification = require('../utils/createNotification');

const findUserChat = (chatId, userId) => {
  return Chat.findOne({ _id: chatId, participants: userId });
};

exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'name email avatar role')
      .sort({ updatedAt: -1 });
    
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page, limit, skip } = getPagination(req.query);
    const chat = await findUserChat(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const total = await Message.countDocuments({ chatId });
    const messages = await Message.find({ chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.initiateChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId || recipientId === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'A valid recipient is required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, recipientId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.id, recipientId]
      });
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

// Handle Image Message Upload via REST (Socket handles text)
exports.uploadImageMessage = async (req, res, next) => {
  try {
    const { chatId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const chat = await findUserChat(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      content: 'Image',
      messageType: 'image',
      imageUrl: req.file.path
    });

    // Update last message in chat
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: 'Sent an image',
        sender: req.user.id,
        createdAt: new Date()
      }
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');
    const io = req.app.get('io');

    if (io) {
      io.to(chatId).emit('receive_message', populatedMessage);

      await Promise.all(chat.participants
        .filter((participantId) => participantId.toString() !== req.user.id.toString())
        .map(async (participantId) => {
          await createNotification({
            user: participantId,
            type: 'message',
            title: 'New image message',
            message: `${req.user.name} sent an image`,
            entityType: 'Chat',
            entityId: chatId
          });
          io.to(participantId.toString()).emit('new_notification', {
            type: 'message',
            chatId,
            senderName: req.user.name,
            text: 'Sent an image'
          });
        }));
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};
