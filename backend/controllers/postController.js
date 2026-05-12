const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const Post = require('../models/Post');
const catchAsync = require('../middleware/catchAsync');

exports.getFeed = catchAsync(async (req, res) => {
  const rows = await Post.findFeed(req.user.id);
  const enriched = await Promise.all(rows.map(p => Post.enrichPost(p, req.user.id)));
  res.json(enriched);
});

exports.getExplore = catchAsync(async (req, res) => {
  const rows = await Post.findAllExplore();
  const enriched = await Promise.all(rows.map(p => Post.enrichPost(p, req.user.id)));
  res.json(enriched);
});

exports.getUserPosts = catchAsync(async (req, res) => {
  const rows = await Post.findByUserId(req.params.userId);
  const enriched = await Promise.all(rows.map(p => Post.enrichPost(p, req.user.id)));
  res.json(enriched);
});

exports.getPost = catchAsync(async (req, res) => {
  const rows = await Post.findById(req.params.id);
  if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });
  const enriched = await Post.enrichPost(rows[0], req.user.id);
  res.json(enriched);
});

exports.createPost = catchAsync(async (req, res) => {
  const { content } = req.body;
  let image_url = req.body.image_url;
  let video_url = req.body.video_url;
  
  if (req.file) {
    const mediaUrl = `/uploads/${req.file.filename}`;
    if (req.file.mimetype.startsWith('video/')) {
      video_url = mediaUrl;
    } else {
      image_url = mediaUrl;
    }
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required' });
  }
  
  const id = uuidv4();
  await Post.create(id, req.user.id, content.trim(), image_url || null, video_url || null);
  const rows = await Post.findById(id);
  const enriched = await Post.enrichPost(rows[0], req.user.id);
  res.status(201).json(enriched);
});

exports.updatePost = catchAsync(async (req, res) => {
  const { content } = req.body;
  let image_url = req.body.image_url;
  let video_url = req.body.video_url;
  
  if (req.file) {
    const mediaUrl = `/uploads/${req.file.filename}`;
    if (req.file.mimetype.startsWith('video/')) {
      video_url = mediaUrl;
    } else {
      image_url = mediaUrl;
    }
  }
  
  const rows = await Post.findRawById(req.params.id);
  if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  await Post.update(req.params.id, content ?? rows[0].content, image_url ?? rows[0].image_url, video_url ?? rows[0].video_url);
  const updated = await Post.findById(req.params.id);
  const enriched = await Post.enrichPost(updated[0], req.user.id);
  res.json(enriched);
});

exports.deletePost = catchAsync(async (req, res) => {
  const rows = await Post.findRawById(req.params.id);
  if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  await Post.delete(req.params.id);
  res.json({ message: 'Deleted' });
});

exports.toggleLike = catchAsync(async (req, res) => {
  const existing = await Post.checkLike(req.params.id, req.user.id);
  if (existing.length > 0) {
    await Post.removeLike(req.params.id, req.user.id);
    const count = await Post.getLikeCount(req.params.id);
    return res.json({ liked: false, like_count: count });
  } else {
    await Post.addLike(uuidv4(), req.params.id, req.user.id);
    const count = await Post.getLikeCount(req.params.id);
    return res.json({ liked: true, like_count: count });
  }
});

exports.getComments = catchAsync(async (req, res) => {
  const rows = await Post.getComments(req.params.id);
  res.json(rows);
});

exports.addComment = catchAsync(async (req, res) => {
  const { comment_text } = req.body;
  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }
  const id = uuidv4();
  await Post.addComment(id, req.params.id, req.user.id, comment_text.trim());
  const rows = await Post.getCommentById(id);
  res.status(201).json(rows[0]);
});

exports.deleteComment = catchAsync(async (req, res) => {
  const rows = await Post.findRawCommentById(req.params.commentId);
  if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  await Post.deleteComment(req.params.commentId);
  res.json({ message: 'Deleted' });
});

exports.toggleShare = catchAsync(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  
  // Check if user has already shared this post to their profile
  const [existingShares] = await pool.query(
    'SELECT id FROM posts WHERE is_shared_from = ? AND user_id = ?',
    [postId, userId]
  );
  
  if (existingShares.length > 0) {
    // Remove the shared post
    await pool.query('DELETE FROM posts WHERE is_shared_from = ? AND user_id = ?', [postId, userId]);
    const count = await Post.getShareCount(postId);
    return res.json({ shared: false, share_count: count });
  } else {
    // Get the original post
    const [originalPost] = await Post.findRawById(postId);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });
    
    // Create a shared post
    const sharedPostId = uuidv4();
    await Post.create(
      sharedPostId, 
      userId, 
      originalPost.content, 
      originalPost.image_url, 
      originalPost.video_url,
      postId // Mark this as shared from the original post
    );
    const count = await Post.getShareCount(postId);
    return res.json({ shared: true, share_count: count });
  }
});

exports.createPoll = catchAsync(async (req, res) => {
  const { question, options } = req.body;
  
  if (!question || !question.trim()) {
    return res.status(400).json({ message: 'Poll question is required' });
  }
  
  if (!options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: 'At least 2 poll options are required' });
  }
  
  // Check if post exists
  const post = await Post.findRawById(req.params.id);
  if (post.length === 0) return res.status(404).json({ message: 'Post not found' });
  if (post[0].user_id !== req.user.id) return res.status(403).json({ message: 'Only post owner can add polls' });

  const pollId = uuidv4();
  await Post.createPoll(pollId, req.params.id, question.trim(), options);
  const poll = await Post.getPoll(pollId);
  res.status(201).json(poll);
});

exports.votePoll = catchAsync(async (req, res) => {
  const { optionId } = req.body;
  
  if (!optionId) {
    return res.status(400).json({ message: 'optionId is required' });
  }

  // Check if poll exists
  const poll = await Post.getPoll(req.params.pollId);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });

  // Check if option exists in this poll
  const optionExists = poll.options.some(opt => opt.id === optionId);
  if (!optionExists) return res.status(400).json({ message: 'Invalid option' });

  // Check if user already voted
  const existingVote = await Post.checkPollVote(req.params.pollId, req.user.id);
  if (existingVote.length > 0) {
    return res.status(400).json({ message: 'User has already voted on this poll' });
  }

  await Post.addPollVote(uuidv4(), req.params.pollId, optionId, req.user.id);
  const updatedPoll = await Post.getPoll(req.params.pollId);
  res.json(updatedPoll);
});

exports.getPoll = catchAsync(async (req, res) => {
  const poll = await Post.getPoll(req.params.pollId);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });
  res.json(poll);
});

