const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { content } = req.body;
  const receiverId = req.params.receiverId;
  const senderId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    const id = uuidv4();
    await Message.create(id, senderId, receiverId, content.trim());
    res.status(201).json({ id, sender_id: senderId, receiver_id: receiverId, content: content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversation = async (req, res) => {
  const user1Id = req.user.id;
  const user2Id = req.params.otherUserId;

  try {
    const rows = await Message.getConversation(user1Id, user2Id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversationsList = async (req, res) => {
  try {
    const rows = await Message.getRecentConversations(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
