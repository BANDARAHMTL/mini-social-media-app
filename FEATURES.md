# Social Mini - New Features Documentation

## ✅ Features Added

### 1. **Share Post Feature** 📤
Users can now share posts from other users on their own account.

#### Database Schema
**Table: `shares`**
- `id` (VARCHAR 36) - Primary key
- `post_id` (VARCHAR 36) - Post being shared
- `user_id` (VARCHAR 36) - User who shared
- `shared_at` (DATETIME) - When it was shared
- Unique constraint: `(post_id, user_id)` - Each user can share a post only once

#### API Endpoints

##### Toggle Share (Like/Unlike)
```
POST /api/posts/:id/share
Authorization: Required
```
**Response:**
```json
{
  "shared": true,
  "share_count": 5
}
```

### 2. **Polls Feature** 🗳️
Users can create polls with multiple options when creating posts, and other users can vote on them.

#### Database Schema

**Table: `polls`**
- `id` (VARCHAR 36) - Primary key
- `post_id` (VARCHAR 36) - Associated post (unique)
- `question` (TEXT) - Poll question
- `created_at` (DATETIME) - When poll was created
- `expires_at` (DATETIME) - Optional expiration time

**Table: `poll_options`**
- `id` (VARCHAR 36) - Primary key
- `poll_id` (VARCHAR 36) - Poll reference
- `text` (TEXT) - Option text

**Table: `poll_votes`**
- `id` (VARCHAR 36) - Primary key
- `poll_id` (VARCHAR 36) - Poll being voted on
- `option_id` (VARCHAR 36) - Option selected
- `user_id` (VARCHAR 36) - User who voted
- `voted_at` (DATETIME) - When vote was cast
- Unique constraint: `(poll_id, user_id)` - Each user can vote once per poll

#### API Endpoints

##### Create a Poll
```
POST /api/posts/:id/poll
Authorization: Required

Body:
{
  "question": "What's your favorite programming language?",
  "options": ["JavaScript", "Python", "Go", "Rust"]
}
```
**Response:**
```json
{
  "id": "poll-uuid",
  "post_id": "post-uuid",
  "question": "What's your favorite programming language?",
  "options": [
    { "id": "opt-1", "text": "JavaScript", "votes": 0 },
    { "id": "opt-2", "text": "Python", "votes": 2 },
    { "id": "opt-3", "text": "Go", "votes": 1 },
    { "id": "opt-4", "text": "Rust", "votes": 3 }
  ]
}
```

##### Get Poll Results
```
GET /api/posts/:id/poll/:pollId
Authorization: Required
```
**Response:** Same as above

##### Vote on Poll
```
POST /api/posts/:id/poll/:pollId/vote
Authorization: Required

Body:
{
  "optionId": "opt-2"
}
```
**Response:** Updated poll with vote counts

### 3. **Updated Post Data** 📝
All posts now include:
- `share_count` - Number of shares
- `shared_by_me` - Boolean indicating if current user shared it
- `poll` - Poll object if one exists (null otherwise)

#### Example Post Response
```json
{
  "id": "post-uuid",
  "content": "My awesome post!",
  "author_id": "user-uuid",
  "author_username": "john_doe",
  "author_pic": "pic_url",
  "like_count": 5,
  "comment_count": 2,
  "share_count": 3,
  "liked_by_me": true,
  "shared_by_me": false,
  "poll": {
    "id": "poll-uuid",
    "question": "What do you think?",
    "options": [
      { "id": "opt-1", "text": "Great!", "votes": 10 },
      { "id": "opt-2", "text": "Not bad", "votes": 5 }
    ]
  },
  "created_at": "2026-05-11T10:30:00Z"
}
```

## 🛠️ Database Migration

To apply these features to an existing database, run:
```bash
mysql -u root -p pulse_social < backend/config/schema.sql
```

Or manually create the tables:
1. `shares` table for tracking shared posts
2. `polls` table for poll questions
3. `poll_options` table for poll answer options
4. `poll_votes` table for user votes

## 🚀 Usage Examples

### Share a Post
```javascript
// Frontend
const sharePost = async (postId) => {
  const response = await fetch(`/api/posts/${postId}/share`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Create a Poll
```javascript
const createPoll = async (postId, question, options) => {
  const response = await fetch(`/api/posts/${postId}/poll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question, options })
  });
  return response.json();
};
```

### Vote on a Poll
```javascript
const votePoll = async (postId, pollId, optionId) => {
  const response = await fetch(`/api/posts/${postId}/poll/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ optionId })
  });
  return response.json();
};
```

## 📋 Notes
- Users can share a post only once (toggle on/off)
- Users can vote on a poll only once
- Poll results are shown with vote counts
- Share count is displayed on all posts
- Polls are optional - a post doesn't need a poll to be created
