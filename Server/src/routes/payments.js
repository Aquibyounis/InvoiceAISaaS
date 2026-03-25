const express = require('express');
const router = express.Router();
const { createLifetimeOrder, createMonthlySubscription, verifyPayment, handleWebhook, validateCoupon } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Webhook must be before protect middleware (raw body needed)
router.post('/webhook', handleWebhook);

router.use(protect);
router.post('/create-order', createLifetimeOrder);
router.post('/create-subscription', createMonthlySubscription);
router.post('/verify', verifyPayment);
router.post('/validate-coupon', validateCoupon);

module.exports = router;
