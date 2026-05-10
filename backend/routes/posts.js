const express = require('express');
const auth = require('../middleware/auth');
const postController = require('../controllers/postController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, postController.getFeed);
router.get('/explore', auth, postController.getExplore);
router.get('/user/:userId', auth, postController.getUserPosts);
router.get('/:id', auth, postController.getPost);
router.post('/', auth, upload.single('image'), postController.createPost);
router.put('/:id', auth, upload.single('image'), postController.updatePost);
router.delete('/:id', auth, postController.deletePost);

router.post('/:id/like', auth, postController.toggleLike);

router.get('/:id/comments', auth, postController.getComments);
router.post('/:id/comment', auth, postController.addComment);
router.delete('/:id/comment/:commentId', auth, postController.deleteComment);

module.exports = router;
