const pool = require('../config/db');

class Message {
  static async create(id, senderId, receiverId, content) {
    await pool.query(
      'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [id, senderId, receiverId, content]
    );
  }

  static async getConversation(user1Id, user2Id) {
    const [rows] = await pool.query(
      `SELECT m.*, u.username as sender_username, u.profile_pic as sender_pic
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) 
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [user1Id, user2Id, user2Id, user1Id]
    );
    return rows;
  }

  static async getRecentConversations(userId) {
    const [rows] = await pool.query(
      `SELECT DISTINCT
         CASE 
           WHEN m.sender_id = ? THEN m.receiver_id 
           ELSE m.sender_id 
         END as contact_id,
         u.username as contact_username,
         u.profile_pic as contact_pic
       FROM messages m
       JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
       WHERE m.sender_id = ? OR m.receiver_id = ?`,
      [userId, userId, userId, userId]
    );
    return rows;
  }
}

module.exports = Message;
