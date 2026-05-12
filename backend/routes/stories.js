const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const storyController = require('../controllers/storyController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ── POST /api/stories
// Create a new story (image or video)
router.post('/', upload.single('media'), storyController.createStory);

// ── GET /api/stories/feed
// Get active stories from following
router.get('/feed', storyController.getStoriesFeed);

// ── GET /api/stories/user/:userId/with-viewers
// Get all stories from user with viewer info (must come before /:userId route)
router.get('/user/:userId/with-viewers', storyController.getMyStoriesWithViewers);

// ── GET /api/stories/user/:userId
// Get all active stories from a specific user
router.get('/user/:userId', storyController.getUserStories);

// ── GET /api/stories/:storyId
// Get a single story and auto-record view
router.get('/:storyId', storyController.getStory);

// ── GET /api/stories/:storyId/viewers
// Get who viewed a story (only owner)
router.get('/:storyId/viewers', storyController.getStoryViewers);

// ── DELETE /api/stories/:storyId
// Delete a story (only owner)
router.delete('/:storyId', storyController.deleteStory);

module.exports = router;
