const pool = require('../config/db');

class User {
  static async findByEmailOrUsername(email, username) {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows;
  }

  static async findByEmailWithPassword(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows;
  }

  static async create(id, username, email, password, bio) {
    await pool.query(
      'INSERT INTO users (id, username, email, password, bio) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, password, bio || null]
    );
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, bio, profile_pic, created_at, birthday, address, contact_number, school FROM users WHERE id = ?',
      [id]
    );
    return rows;
  }

  static async findAll(search) {
    let query = 'SELECT id, username, bio, profile_pic, created_at FROM users';
    const params = [];
    if (search) {
      query += ' WHERE username LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getFollowStats(userId) {
    const [[{ followers }]] = await pool.query(
      'SELECT COUNT(*) as followers FROM follows WHERE following_id = ?', [userId]
    );
    const [[{ following }]] = await pool.query(
      'SELECT COUNT(*) as following FROM follows WHERE follower_id = ?', [userId]
    );
    return { followers, following };
  }

  static async update(id, bio, profilePic, birthday, address, contactNumber, school) {
    await pool.query(
      'UPDATE users SET bio = ?, profile_pic = ?, birthday = ?, address = ?, contact_number = ?, school = ? WHERE id = ?',
      [bio ?? null, profilePic ?? null, birthday ?? null, address ?? null, contactNumber ?? null, school ?? null, id]
    );
  }

  static async getFollowers(userId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.bio, u.profile_pic
       FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = ? ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getFollowing(userId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.bio, u.profile_pic
       FROM follows f JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = ? ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async checkFollow(followerId, followingId) {
    const [existing] = await pool.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return existing;
  }

  static async unfollow(followerId, followingId) {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
  }

  static async follow(followId, followerId, followingId) {
    await pool.query(
      'INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)',
      [followId, followerId, followingId]
    );
  }
}

module.exports = User;
