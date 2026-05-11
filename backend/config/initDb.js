const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
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
