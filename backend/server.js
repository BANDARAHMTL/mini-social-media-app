require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes  = require('./routes/auth');
const userRoutes  = require('./routes/users');
const postRoutes  = require('./routes/posts');
const messageRoutes = require('./routes/messages');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

// Follow route is on users router but at top level for convenience
const auth = require('./middleware/auth');
const userRouter = require('./routes/users');
app.use('/api', userRouter); // exposes /api/follow/:userId

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ── 404 ────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Pulse API running on http://localhost:${PORT}`));
