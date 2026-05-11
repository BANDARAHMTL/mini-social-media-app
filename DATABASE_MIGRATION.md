# 🔧 Database Migration Guide

## Problem
The new Share Post and Polls features require new database tables that need to be created.

## Solution - Choose One Method:

### Method 1: Using MySQL Command (Recommended)
```bash
cd c:\Users\THARINDU\Desktop\socialmini
mysql -u root -p pulse_social < backend/config/schema.sql
```

### Method 2: Using MySQL Workbench
1. Open MySQL Workbench
2. Create a new connection or use existing
3. Run this script:

```sql
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
```

### Method 3: Using Node.js Script
Create a file `migrate-db.js` in the backend folder:

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const schema = fs.readFileSync('./config/schema.sql', 'utf8');
  const queries = schema.split(';').filter(q => q.trim());
  
  for (const query of queries) {
    try {
      await connection.query(query);
      console.log('✓ Executed:', query.substring(0, 50) + '...');
    } catch (error) {
      console.error('✗ Error:', error.message);
    }
  }
  
  await connection.end();
  console.log('✓ Migration complete!');
}

runMigration().catch(console.error);
```

Then run: `node migrate-db.js`

## Verify Tables Created
Run this query in MySQL to verify:

```sql
SHOW TABLES WHERE Tables_in_pulse_social IN ('shares', 'polls', 'poll_options', 'poll_votes');
```

Expected output:
```
Tables_in_pulse_social
-----------------------
shares
polls
poll_options
poll_votes
```

## Troubleshooting

### Error: "Table doesn't exist"
- Make sure you ran one of the migration methods above
- Verify your database name is `pulse_social`

### Error: "Foreign key constraint fails"
- Ensure `users` and `posts` tables exist first
- They should exist from the original schema

### Error: "Duplicate key name"
- The tables might already exist
- This is safe - the `CREATE TABLE IF NOT EXISTS` prevents errors
