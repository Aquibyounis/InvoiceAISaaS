const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updateSmtpConfig, removeSmtpConfig } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/smtp-config', protect, updateSmtpConfig);
router.delete('/smtp-config', protect, removeSmtpConfig);

module.exports = router;
