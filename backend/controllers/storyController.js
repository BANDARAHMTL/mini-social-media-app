const { v4: uuidv4 } = require('uuid');
const Story = require('../models/Story');
const catchAsync = require('../middleware/catchAsync');

// ── POST /api/stories ────────────────────────────────────────────
// Create a new story
exports.createStory = catchAsync(async (req, res) => {
  const { caption } = req.body;
  const userId = req.user.id;
  let imageUrl = null;
  let videoUrl = null;

  // Handle media upload
  if (req.file) {
    const mediaPath = req.file.path.replace(/\\/g, '/');
    const mediaType = req.file.mimetype;

    // Determine if it's image or video
    if (mediaType.startsWith('video/')) {
      videoUrl = mediaPath;
    } else {
      imageUrl = mediaPath;
    }
  }

  // At least one media is required
  if (!imageUrl && !videoUrl) {
    return res.status(400).json({ message: 'Story must have an image or video' });
  }

  const storyId = uuidv4();
  await Story.create(storyId, userId, imageUrl, videoUrl, caption);

  const [stories] = await Story.findById(storyId);
  const enriched = await Story.enrichStory(stories[0], userId);

  res.status(201).json({
    message: 'Story created successfully',
    story: enriched
  });
});

// ── GET /api/stories/feed ────────────────────────────────────────
// Get all active stories from following (for feed)
exports.getStoriesFeed = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const stories = await Story.findActiveStoriesForFeed(userId);

  // Enrich stories
  const enriched = await Promise.all(
    stories.map(s => Story.enrichStory(s, userId))
  );

  res.json({
    count: enriched.length,
    stories: enriched
  });
});

// ── GET /api/stories/user/:userId ───────────────────────────────
// Get all active stories from a specific user
exports.getUserStories = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const stories = await Story.findByUserId(userId);

  // Enrich stories
  const enriched = await Promise.all(
    stories.map(s => Story.enrichStory(s, currentUserId))
  );

  res.json({
    count: enriched.length,
    stories: enriched
  });
});

// ── GET /api/stories/:storyId ────────────────────────────────────
// Get a single story
exports.getStory = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.id;

  const stories = await Story.findById(storyId);

  if (stories.length === 0) {
    return res.status(404).json({ message: 'Story not found or expired' });
  }

  const story = stories[0];

  // Auto-record view (if not the story owner)
  if (story.user_id !== userId) {
    await Story.recordView(storyId, userId);
  }

  const enriched = await Story.enrichStory(story, userId);

  res.json(enriched);
});

// ── GET /api/stories/:storyId/viewers ────────────────────────────
// Get who viewed a story (only story owner can see)
exports.getStoryViewers = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.id;

  const stories = await Story.findById(storyId);

  if (stories.length === 0) {
    return res.status(404).json({ message: 'Story not found or expired' });
  }

  const story = stories[0];

  // Only story owner can see viewers
  if (story.user_id !== userId) {
    return res.status(403).json({ message: 'Only story owner can view this' });
  }

  const viewers = await Story.getViewers(storyId);

  res.json({
    storyId: storyId,
    viewerCount: viewers.length,
    viewers: viewers
  });
});

// ── DELETE /api/stories/:storyId ─────────────────────────────────
// Delete a story (only owner can delete)
exports.deleteStory = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.id;

  const stories = await Story.findById(storyId);

  if (stories.length === 0) {
    return res.status(404).json({ message: 'Story not found' });
  }

  const story = stories[0];

  // Only story owner can delete
  if (story.user_id !== userId) {
    return res.status(403).json({ message: 'Only story owner can delete this' });
  }

  await Story.delete(storyId);

  res.json({ message: 'Story deleted successfully' });
});

// ── GET /api/stories/user/:userId/with-viewers ──────────────────
// Get all stories from user with viewer info (only for viewing own stories)
exports.getMyStoriesWithViewers = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Only user can see viewers on their own stories
  if (userId !== currentUserId) {
    return res.status(403).json({ message: 'You can only view your own story viewers' });
  }

  const stories = await Story.findByUserIdWithViewers(userId);

  res.json({
    count: stories.length,
    stories: stories
  });
});
