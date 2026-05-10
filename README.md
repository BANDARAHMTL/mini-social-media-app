# 🌐 Pulse — Mini Social Media App

A full-stack social media application with React frontend and Node.js/Express backend, backed by MySQL.

---

## 📁 Project Structure

```
socialmini/
├── backend/
│   ├── config/
│   │   ├── db.js          # MySQL connection pool
│   │   └── schema.sql     # Database schema + seed data
│   ├── middleware/
│   │   └── auth.js        # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js        # /api/auth/*
│   │   ├── users.js       # /api/users/*, /api/follow/*
│   │   └── posts.js       # /api/posts/* (likes + comments)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── CreatePost.js
    │   │   ├── Navbar.js
    │   │   ├── PostCard.js
    │   │   ├── UI.js        # Avatar, Spinner, Toast, etc.
    │   │   └── UserCard.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── FeedPage.js
    │   │   ├── ExplorePage.js
    │   │   └── ProfilePage.js
    │   ├── api.js           # Axios instance
    │   ├── App.js
    │   ├── index.css
    │   └── index.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+

---

### 1. Database Setup

```bash
# Log in to MySQL and run the schema
mysql -u root -p < backend/config/schema.sql
```

This creates the `pulse_social` database, all tables, and three demo users.

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — set DB_PASSWORD and a strong JWT_SECRET

# Start (development with hot reload)
npm run dev

# Start (production)
npm start
```

Backend runs on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env (defaults work out of the box)
cp .env.example .env

# Start dev server
npm start
```

Frontend runs on **http://localhost:3000**

---

## 🔑 Demo Accounts

All demo users have password: `password123`

| Username       | Email               |
|----------------|---------------------|
| nova_dev       | nova@pulse.dev      |
| pixel_artist   | pixel@pulse.dev     |
| echo_writes    | echo@pulse.dev      |

---

## 🗄️ Database Schema

| Table    | Key Columns                                                  |
|----------|--------------------------------------------------------------|
| users    | id, username, email, password, bio, profile_pic, created_at  |
| posts    | id, user_id, content, image_url, created_at                  |
| comments | id, post_id, user_id, comment_text, created_at               |
| likes    | id, post_id, user_id (unique pair prevents duplicates)       |
| follows  | id, follower_id, following_id (unique pair)                  |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/auth/register    | Create account        |
| POST   | /api/auth/login       | Login, get JWT        |
| GET    | /api/auth/me          | Get current user      |

### Users
| Method | Endpoint                  | Description            |
|--------|---------------------------|------------------------|
| GET    | /api/users                | List / search users    |
| GET    | /api/users/:id            | Get user profile       |
| PUT    | /api/users/:id            | Update own profile     |
| GET    | /api/users/:id/followers  | Get follower list      |
| GET    | /api/users/:id/following  | Get following list     |
| POST   | /api/users/follow/:userId | Toggle follow          |

### Posts
| Method | Endpoint                          | Description          |
|--------|-----------------------------------|----------------------|
| GET    | /api/posts                        | Home feed            |
| GET    | /api/posts/explore                | All posts            |
| GET    | /api/posts/user/:userId           | User's posts         |
| GET    | /api/posts/:id                    | Single post          |
| POST   | /api/posts                        | Create post          |
| PUT    | /api/posts/:id                    | Edit post (owner)    |
| DELETE | /api/posts/:id                    | Delete post (owner)  |
| POST   | /api/posts/:id/like               | Toggle like          |
| GET    | /api/posts/:id/comments           | Get comments         |
| POST   | /api/posts/:id/comment            | Add comment          |
| DELETE | /api/posts/:id/comment/:commentId | Delete own comment   |

---

## ✨ Features

- **JWT Authentication** — secure token-based auth
- **User Profiles** — bio, profile picture, stats
- **Posts** — create, edit, delete with optional image URL
- **Likes** — toggle like/unlike, duplicate prevention
- **Comments** — add and delete your own comments
- **Follow System** — follow/unfollow, follower/following lists
- **Home Feed** — posts from followed users + own posts
- **Explore** — discover all users and posts
- **Responsive Design** — works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, React Router v6, Axios  |
| Backend  | Node.js, Express 4                |
| Database | MySQL 8 (mysql2 driver)           |
| Auth     | JWT (jsonwebtoken) + bcryptjs     |
| Styling  | Custom CSS (no framework needed)  |
