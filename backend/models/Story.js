const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const storySelect = `
  SELECT
    s.id, s.user_id, s.image_url, s.video_url, s.caption, s.created_at, s.expires_at,
    u.id   AS author_id,
    u.username AS author_username,
    u.profile_pic AS author_pic,
    (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id) AS view_count
  FROM stories s
  JOIN users u ON u.id = s.user_id
`;

class Story {
  static async enrichStory(story, userId) {
    try {
      // Guard clause: return empty object if story is undefined
      if (!story || !story.id) {
        return story || {};
      }
      
      const [viewed] = await pool.query(
        'SELECT id FROM story_views WHERE story_id = ? AND user_id = ?',
        [story.id, userId]
      );
      
      return {
        ...story,
        viewed_by_me: viewed.length > 0
      };
    } catch (error) {
      console.warn('Warning: Story enrichment issue:', error.message);
      // Return story with default viewed_by_me value
      return {
        ...story,
        viewed_by_me: false
      };
    }
  }

  // Get all active stories from following + own (for feed)
  static async findActiveStoriesForFeed(userId) {
    const [rows] = await pool.query(
      `${storySelect}
       WHERE (s.user_id = ? OR s.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = ?
       ))
       AND s.expires_at > NOW()
       ORDER BY s.created_at DESC`,
      [userId, userId]
    );
    return rows;
  }

  // Get all active stories from a specific user
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `${storySelect}
       WHERE s.user_id = ? AND s.expires_at > NOW()
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return rows;
  }

  // Get a single story by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `${storySelect}
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [id]
    );
    return rows;
  }

  // Get active stories with view info
  static async findByUserIdWithViewers(userId) {
    const [rows] = await pool.query(
      `${storySelect}
       WHERE s.user_id = ? AND s.expires_at > NOW()
       ORDER BY s.created_at DESC`,
      [userId]
    );

    // Fetch viewers for each story
    for (let story of rows) {
      const [viewers] = await pool.query(
        `SELECT sv.user_id, sv.viewed_at, u.username, u.profile_pic
         FROM story_views sv
         JOIN users u ON u.id = sv.user_id
         WHERE sv.story_id = ?
         ORDER BY sv.viewed_at DESC`,
        [story.id]
      );
      story.viewers = viewers;
    }

    return rows;
  }

  // Create a new story
  static async create(id, userId, imageUrl, videoUrl, caption) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    await pool.query(
      'INSERT INTO stories (id, user_id, image_url, video_url, caption, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, imageUrl || null, videoUrl || null, caption || null, expiresAt]
    );
  }

  // Record a story view
  static async recordView(storyId, userId) {
    const viewId = uuidv4();
    try {
      await pool.query(
        'INSERT INTO story_views (id, story_id, user_id) VALUES (?, ?, ?)',
        [viewId, storyId, userId]
      );
      return viewId;
    } catch (error) {
      // Ignore duplicate view error - user already viewed
      if (error.code === 'ER_DUP_ENTRY') {
        return null;
      }
      throw error;
    }
  }

  // Delete a story (hard delete)
  static async delete(id) {
    await pool.query('DELETE FROM stories WHERE id = ?', [id]);
  }

  // Get story viewers count
  static async getViewers(storyId) {
    const [rows] = await pool.query(
      `SELECT sv.user_id, sv.viewed_at, u.username, u.profile_pic
       FROM story_views sv
       JOIN users u ON u.id = sv.user_id
       WHERE sv.story_id = ?
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );
    return rows;
  }

  // Clean up expired stories
  static async deleteExpired() {
    const [result] = await pool.query(
      'DELETE FROM stories WHERE expires_at < NOW()'
    );
    return result.affectedRows;
  }
}

module.exports = Story;
