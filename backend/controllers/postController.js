const { v4: uuidv4 } = require('uuid');
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

