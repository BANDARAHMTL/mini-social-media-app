const express = require('express');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, userController.getUsers);
router.get('/:id', auth, userController.getProfile);
router.put('/:id', auth, upload.single('profile_pic'), userController.updateProfile);
router.get('/:id/followers', auth, userController.getFollowers);
router.get('/:id/following', auth, userController.getFollowing);
router.post('/follow/:userId', auth, userController.toggleFollow);

module.exports = router;
