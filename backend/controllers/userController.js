const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Post = require('../models/Post');

exports.getUsers = async (req, res) => {
  const { search } = req.query;
  try {
    const rows = await User.findAll(search);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const users = await User.findById(req.params.id);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = users[0];
    const { followers, following } = await User.getFollowStats(user.id);
    const postsCount = await Post.getPostCount(user.id);
    const isFollowingRow = await User.checkFollow(req.user.id, user.id);

    res.json({
      ...user,
      followers_count: followers,
      following_count: following,
      posts_count: postsCount,
      is_following: isFollowingRow.length > 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { bio, birthday, address, contact_number, school } = req.body;
  let profile_pic = req.body.profile_pic;
  if (req.file) {
    profile_pic = `/uploads/${req.file.filename}`;
  }
  
  try {
    await User.update(req.user.id, bio, profile_pic, birthday, address, contact_number, school);
    const rows = await User.findById(req.user.id);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const rows = await User.getFollowers(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const rows = await User.getFollowing(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleFollow = async (req, res) => {
  const followingId = req.params.userId;
  const followerId = req.user.id;
  if (followerId === followingId) {
    return res.status(400).json({ message: 'Cannot follow yourself' });
  }
  try {
    const existing = await User.checkFollow(followerId, followingId);
    if (existing.length > 0) {
      await User.unfollow(followerId, followingId);
      return res.json({ following: false });
    } else {
      await User.follow(uuidv4(), followerId, followingId);
      return res.json({ following: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
