-- ============================================================
-- Pulse Social Media – Database Schema
-- Run this file to initialize the database:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS pulse_social;
USE pulse_social;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  bio         TEXT,
  profile_pic VARCHAR(500) DEFAULT NULL,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Posts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id         VARCHAR(36)  PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  content    TEXT         NOT NULL,
  image_url  VARCHAR(500) DEFAULT NULL,
  video_url  VARCHAR(500) DEFAULT NULL,
  is_shared_from VARCHAR(36) DEFAULT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (is_shared_from) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_shared_from (is_shared_from)
);

-- ── Comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id           VARCHAR(36) PRIMARY KEY,
  post_id      VARCHAR(36) NOT NULL,
  user_id      VARCHAR(36) NOT NULL,
  comment_text TEXT        NOT NULL,
  created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Likes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id         VARCHAR(36) PRIMARY KEY,
  post_id    VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Follows ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           VARCHAR(36) PRIMARY KEY,
  follower_id  VARCHAR(36) NOT NULL,
  following_id VARCHAR(36) NOT NULL,
  created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_follow (follower_id, following_id),
  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Shares ───────────────────────────────────────────────
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
);

-- ── Polls ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polls (
  id         VARCHAR(36) PRIMARY KEY,
  post_id    VARCHAR(36) NOT NULL UNIQUE,
  question   TEXT        NOT NULL,
  created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME    DEFAULT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id)
);

-- ── Poll Options ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_options (
  id      VARCHAR(36) PRIMARY KEY,
  poll_id VARCHAR(36) NOT NULL,
  text    TEXT        NOT NULL,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  INDEX idx_poll_id (poll_id)
);

-- ── Poll Votes ──────────────────────────────────────────────
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
);

-- ── Stories (WhatsApp/Facebook Stories) ──────────────────────
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
);

-- ── Story Views ────────────────────────────────────────────────
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
);

-- ── Seed demo data ───────────────────────────────────────────
-- Passwords are bcrypt hash of "password123"
INSERT IGNORE INTO users (id, username, email, password, bio) VALUES
  ('u-demo-1', 'nova_dev',     'nova@pulse.dev',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi', 'Building the future one commit at a time 🚀'),
  ('u-demo-2', 'pixel_artist', 'pixel@pulse.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi', 'Digital dreamer. Colors are my language 🎨'),
  ('u-demo-3', 'echo_writes',  'echo@pulse.dev',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi', 'Words, worlds, wonder ✍️');

INSERT IGNORE INTO posts (id, user_id, content, image_url) VALUES
  ('p-1', 'u-demo-1', 'Just shipped a feature that cuts load time by 60%. Lazy-loading with Intersection Observer is underrated 🎯', NULL),
  ('p-2', 'u-demo-2', 'Finished this generative art piece — 4096 iterations shaped into something beautiful 🌀', 'https://picsum.photos/seed/art42/600/300'),
  ('p-3', 'u-demo-3', 'Reading about distributed systems at 2am. The CAP theorem hits different after surviving an outage.', NULL);

INSERT IGNORE INTO follows (id, follower_id, following_id) VALUES
  ('f-1', 'u-demo-1', 'u-demo-2'),
  ('f-2', 'u-demo-1', 'u-demo-3'),
  ('f-3', 'u-demo-2', 'u-demo-1');

INSERT IGNORE INTO likes (id, post_id, user_id) VALUES
  ('l-1', 'p-1', 'u-demo-2'),
  ('l-2', 'p-1', 'u-demo-3'),
  ('l-3', 'p-2', 'u-demo-1');

INSERT IGNORE INTO comments (id, post_id, user_id, comment_text) VALUES
  ('c-1', 'p-2', 'u-demo-3', 'This is stunning! What algorithm did you use?'),
  ('c-2', 'p-2', 'u-demo-1', 'The color palette 🔥 — love the contrast.');
