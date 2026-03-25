const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createOrder = async (amount, currency = 'INR', notes = {}) => {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount, // in paise
    currency,
    receipt: `rcpt_${Date.now()}`,
    notes,
  });
  return order;
};

const createSubscription = async (planId, totalCount = 12) => {
  const razorpay = getRazorpay();
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
  });
  return subscription;
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const verifyWebhookSignature = (body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  return expectedSignature === signature;
};

module.exports = {
  createOrder,
  createSubscription,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
