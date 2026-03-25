const User = require('../models/User');
const { createOrder, createSubscription, verifyPaymentSignature, verifyWebhookSignature } = require('../services/razorpayService');

// @desc  Create Razorpay order (lifetime plan)
// @route POST /api/payments/create-order
const createLifetimeOrder = async (req, res) => {
  try {
    const order = await createOrder(
      parseInt(process.env.LIFETIME_PLAN_AMOUNT) || 499900,
      'INR',
      { userId: req.user._id.toString(), plan: 'lifetime', userEmail: req.user.email }
    );
    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create Razorpay subscription (monthly plan)
// @route POST /api/payments/create-subscription
const createMonthlySubscription = async (req, res) => {
  try {
    const subscription = await createSubscription(process.env.RAZORPAY_PLAN_ID);
    res.json({
      success: true,
      subscription,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Verify payment and upgrade plan
// @route POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      plan: plan || 'lifetime',
      subscriptionStatus: plan === 'monthly' ? 'active' : null,
    });

    res.json({ success: true, message: `Plan upgraded to ${plan || 'lifetime'} successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Razorpay webhook handler
// @route POST /api/payments/webhook
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const event = req.body.event;
  try {
    if (event === 'subscription.activated') {
      const subId = req.body.payload.subscription.entity.id;
      await User.findOneAndUpdate({ razorpaySubscriptionId: subId }, { subscriptionStatus: 'active', plan: 'monthly' });
    } else if (event === 'subscription.cancelled' || event === 'subscription.expired') {
      const subId = req.body.payload.subscription.entity.id;
      await User.findOneAndUpdate({ razorpaySubscriptionId: subId }, { subscriptionStatus: event === 'subscription.cancelled' ? 'cancelled' : 'expired', plan: 'free' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Validate coupon code and optionally apply free upgrade
// @route POST /api/payments/validate-coupon
const validateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const envCode = (process.env.COUPON_CODE || '').trim().toUpperCase();
    const inputCode = couponCode.trim().toUpperCase();

    if (!envCode || inputCode !== envCode) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code.' });
    }

    const discount = parseInt(process.env.COUPON_DISCOUNT) || 0;

    // If 100% discount → free lifetime upgrade right now
    if (discount >= 100) {
      if (req.user.plan === 'lifetime') {
        return res.status(400).json({ success: false, message: 'You already have the Lifetime plan!' });
      }
      await User.findByIdAndUpdate(req.user._id, { plan: 'lifetime', subscriptionStatus: null });
      return res.json({
        success: true,
        discount: 100,
        planUpgraded: true,
        message: '🎉 Coupon applied! You now have Lifetime access for free!',
      });
    }

    // Partial discount — return % for frontend to calculate
    res.json({
      success: true,
      discount,
      planUpgraded: false,
      message: `Coupon applied! ${discount}% discount on Lifetime plan.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createLifetimeOrder, createMonthlySubscription, verifyPayment, handleWebhook, validateCoupon };
