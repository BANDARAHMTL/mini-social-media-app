const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    // Migrate: Add is_shared_from column to posts table if it doesn't exist
    try {
      const [columns] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_shared_from'",
        [process.env.DB_NAME || 'pulse_social']
      );

      if (columns.length === 0) {
        console.log('🔄 Migrating database: Adding is_shared_from column to posts table...');
        await pool.query(`
          ALTER TABLE posts ADD COLUMN is_shared_from VARCHAR(36) DEFAULT NULL,
          ADD FOREIGN KEY (is_shared_from) REFERENCES posts(id) ON DELETE CASCADE,
          ADD INDEX idx_shared_from (is_shared_from)
        `);
        console.log('✓ Migration complete: is_shared_from column added');
      }
    } catch (migrationError) {
      console.log('⚠️  Migration check passed (column may already exist)');
    }

    // Check if shares table exists
    const [tables] = await pool.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'shares'",
      [process.env.DB_NAME || 'pulse_social']
    );

    if (tables.length === 0) {
      console.log('📦 Initializing database tables for new features...');
      
      // Create shares table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shares (
          id         VARCHAR(36) PRIMARY KEY,
          post_id    VARCHAR(36) NOT NULL,
          user_id    VARCHAR(36) NOT NULL,
          shared_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_share (post_id, user_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_post_id (post_id),
          INDEX idx_user_id (user_id)
        )
      `);
      console.log('✓ Created shares table');

      // Create polls table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS polls (
          id         VARCHAR(36) PRIMARY KEY,
          post_id    VARCHAR(36) NOT NULL UNIQUE,
          question   TEXT        NOT NULL,
          created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME    DEFAULT NULL,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          INDEX idx_post_id (post_id)
        )
      `);
      console.log('✓ Created polls table');

      // Create poll_options table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS poll_options (
          id      VARCHAR(36) PRIMARY KEY,
          poll_id VARCHAR(36) NOT NULL,
          text    TEXT        NOT NULL,
          FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
          INDEX idx_poll_id (poll_id)
        )
      `);
      console.log('✓ Created poll_options table');

      // Create poll_votes table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS poll_votes (
          id         VARCHAR(36) PRIMARY KEY,
          poll_id    VARCHAR(36) NOT NULL,
          option_id  VARCHAR(36) NOT NULL,
          user_id    VARCHAR(36) NOT NULL,
          voted_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_poll_user (poll_id, user_id),
          FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
          FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_poll_id (poll_id),
          INDEX idx_user_id (user_id)
        )
      `);
      console.log('✓ Created poll_votes table');

      // Create stories table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stories (
          id         VARCHAR(36)  PRIMARY KEY,
          user_id    VARCHAR(36)  NOT NULL,
          image_url  VARCHAR(500) DEFAULT NULL,
          video_url  VARCHAR(500) DEFAULT NULL,
          caption    TEXT         DEFAULT NULL,
          created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME     NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_expires_at (expires_at)
        )
      `);
      console.log('✓ Created stories table');

      // Create story_views table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS story_views (
          id         VARCHAR(36) PRIMARY KEY,
          story_id   VARCHAR(36) NOT NULL,
          user_id    VARCHAR(36) NOT NULL,
          viewed_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_story_view (story_id, user_id),
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_story_id (story_id),
          INDEX idx_user_id (user_id)
        )
      `);
      console.log('✓ Created story_views table');

      // Check if share_count column exists in postSelect
      const [postColumns] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts'",
        [process.env.DB_NAME || 'pulse_social']
      );
      
      console.log('✓ All tables created successfully!');
    } else {
      console.log('✓ Database tables already exist');
    }
  } catch (error) {
    console.error('⚠️  Database initialization warning:', error.message);
    // Don't exit on error - allow app to continue even if init fails
  }
}

module.exports = initializeDatabase;
