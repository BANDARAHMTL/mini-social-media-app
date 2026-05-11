const pool = require('../config/db');

const postSelect = `
  SELECT
    p.id, p.content, p.image_url, p.video_url, p.created_at, p.updated_at,
    u.id   AS author_id,
    u.username AS author_username,
    u.profile_pic AS author_pic,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM shares s WHERE s.post_id = p.id) AS share_count
  FROM posts p
  JOIN users u ON u.id = p.user_id
`;

class Post {
  static async enrichPost(post, userId) {
    const [liked] = await pool.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [post.id, userId]
    );
    const [shared] = await pool.query(
      'SELECT id FROM shares WHERE post_id = ? AND user_id = ?', [post.id, userId]
    );
    const poll = await this.getPollByPostId(post.id);
    
    return { 
      ...post, 
      liked_by_me: liked.length > 0,
      shared_by_me: shared.length > 0,
      poll: poll || null
    };
  }

  static async findFeed(userId) {
    const [rows] = await pool.query(
      `${postSelect}
       WHERE p.user_id = ? OR p.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = ?
       )
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [userId, userId]
    );
    return rows;
  }

  static async findAllExplore() {
    const [rows] = await pool.query(`${postSelect} ORDER BY p.created_at DESC LIMIT 100`);
    return rows;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `${postSelect} WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`${postSelect} WHERE p.id = ?`, [id]);
    return rows;
  }

  static async findRawById(id) {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    return rows;
  }

  static async create(id, userId, content, imageUrl, videoUrl) {
    await pool.query(
      'INSERT INTO posts (id, user_id, content, image_url, video_url) VALUES (?, ?, ?, ?, ?)',
      [id, userId, content, imageUrl || null, videoUrl || null]
    );
  }

  static async update(id, content, imageUrl, videoUrl) {
    await pool.query(
      'UPDATE posts SET content = ?, image_url = ?, video_url = ? WHERE id = ?',
      [content, imageUrl, videoUrl, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
  }

  static async getPostCount(userId) {
    const [[{ posts }]] = await pool.query(
      'SELECT COUNT(*) as posts FROM posts WHERE user_id = ?', [userId]
    );
    return posts;
  }

  static async checkLike(postId, userId) {
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    return existing;
  }

  static async removeLike(postId, userId) {
    await pool.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
  }

  static async addLike(likeId, postId, userId) {
    await pool.query('INSERT INTO likes (id, post_id, user_id) VALUES (?, ?, ?)', [likeId, postId, userId]);
  }

  static async getLikeCount(postId) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);
    return count;
  }

  static async getComments(postId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.comment_text, c.created_at,
              u.id AS user_id, u.username, u.profile_pic
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return rows;
  }

  static async addComment(id, postId, userId, commentText) {
    await pool.query(
      'INSERT INTO comments (id, post_id, user_id, comment_text) VALUES (?, ?, ?, ?)',
      [id, postId, userId, commentText]
    );
  }

  static async getCommentById(id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.comment_text, c.created_at,
              u.id AS user_id, u.username, u.profile_pic
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [id]
    );
    return rows;
  }

  static async findRawCommentById(id) {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
    return rows;
  }

  static async deleteComment(id) {
    await pool.query('DELETE FROM comments WHERE id = ?', [id]);
  }

  // ── Share Methods ────────────────────────────────────────────────
  static async checkShare(postId, userId) {
    const [existing] = await pool.query(
      'SELECT id FROM shares WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    return existing;
  }

  static async addShare(shareId, postId, userId) {
    await pool.query('INSERT INTO shares (id, post_id, user_id) VALUES (?, ?, ?)', [shareId, postId, userId]);
  }

  static async removeShare(postId, userId) {
    await pool.query('DELETE FROM shares WHERE post_id = ? AND user_id = ?', [postId, userId]);
  }

  static async getShareCount(postId) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM shares WHERE post_id = ?', [postId]);
    return count;
  }

  // ── Poll Methods ────────────────────────────────────────────────
  static async createPoll(pollId, postId, question, options) {
    await pool.query('INSERT INTO polls (id, post_id, question) VALUES (?, ?, ?)', [pollId, postId, question]);
    
    for (let option of options) {
      const optionId = require('uuid').v4();
      await pool.query('INSERT INTO poll_options (id, poll_id, text) VALUES (?, ?, ?)', [optionId, pollId, option]);
    }
  }

  static async getPoll(pollId) {
    const [poll] = await pool.query('SELECT id, post_id, question FROM polls WHERE id = ?', [pollId]);
    
    if (poll.length === 0) return null;

    const [options] = await pool.query(
      'SELECT id, text FROM poll_options WHERE poll_id = ?',
      [pollId]
    );

    const enrichedOptions = await Promise.all(
      options.map(async (option) => {
        const [[{ voteCount }]] = await pool.query(
          'SELECT COUNT(*) as voteCount FROM poll_votes WHERE option_id = ?',
          [option.id]
        );
        return { id: option.id, text: option.text, votes: voteCount };
      })
    );

    return { ...poll[0], options: enrichedOptions };
  }

  static async checkPollVote(pollId, userId) {
    const [existing] = await pool.query(
      'SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?',
      [pollId, userId]
    );
    return existing;
  }

  static async addPollVote(voteId, pollId, optionId, userId) {
    await pool.query(
      'INSERT INTO poll_votes (id, poll_id, option_id, user_id) VALUES (?, ?, ?, ?)',
      [voteId, pollId, optionId, userId]
    );
  }

  static async getPollByPostId(postId) {
    const [polls] = await pool.query('SELECT id FROM polls WHERE post_id = ?', [postId]);
    if (polls.length === 0) return null;
    return this.getPoll(polls[0].id);
  }
}

module.exports = Post;


