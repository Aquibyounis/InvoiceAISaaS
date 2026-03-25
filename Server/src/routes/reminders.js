const express = require('express');
const router = express.Router();
const { getReminders, triggerReminders } = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getReminders);
router.post('/trigger', triggerReminders);

module.exports = router;
