const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const catchAsync = require('../middleware/catchAsync');

exports.register = catchAsync(async (req, res) => {
  const { username, email, password, bio } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  const existing = await User.findByEmailOrUsername(email, username);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Email or username already taken' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const id = uuidv4();
  await User.create(id, username, email, hashed, bio);
  
  const token = jwt.sign({ id, username, email }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.status(201).json({ token, user: { id, username, email, bio: bio || null, profile_pic: null } });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  const rows = await User.findByEmailWithPassword(email);
  if (rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

exports.getMe = catchAsync(async (req, res) => {
  const rows = await User.findById(req.user.id);
  if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
  res.json(rows[0]);
});

