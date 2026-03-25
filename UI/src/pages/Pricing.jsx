import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../api';
import toast from 'react-hot-toast';
import { Check, Zap, Crown, Infinity, Shield, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES_FREE = ['Up to 10 invoices', '3 reminders per invoice', 'Email via Ethereal (dev)', 'Basic dashboard'];
const FEATURES_MONTHLY = ['Unlimited invoices', 'Unlimited reminders (4 tones)', 'Real email sending', 'Full dashboard + charts', 'Priority support', 'API access'];
const FEATURES_LIFETIME = ['Everything in Monthly', 'One-time payment, forever', 'Early access to new features', 'White-label options', 'Direct founder access'];

export default function Pricing() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleLifetime = async () => {
    setLoading('lifetime');
    try {
      // If 100% discount from coupon, Razorpay is bypassed by backend in validateCoupon
      // But if they clicked Buy with a partial discount, we still need Razorpay
      const amount = 4999 * (1 - discount / 100);

      const ok = await loadRazorpay();
      if (!ok) return toast.error('Could not load payment gateway');

      const orderRes = await paymentsAPI.createLifetimeOrder();
      const { order, key } = orderRes.data;

      const options = {
        key,
        amount: Math.round(order.amount * (1 - discount / 100)), // Apply discount to paise
        currency: order.currency,
        name: 'InvoiceAI',
        description: discount > 0 ? `Lifetime Plan (${discount}% off)` : 'Lifetime Plan',
        order_id: order.id,
        handler: async (response) => {
          try {
            await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: 'lifetime',
            });
            updateUser({ plan: 'lifetime' });
            toast.success('🎉 Lifetime plan activated!');
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#09090B' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return toast.error('Please enter a coupon code');
    setLoading('coupon');
    try {
      const res = await paymentsAPI.validateCoupon(couponCode);
      const data = res.data;
      
      setDiscount(data.discount);
      toast.success(data.message);

      // If backend says plan was auto-upgraded (100% discount)
      if (data.planUpgraded) {
        updateUser({ plan: 'lifetime' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setDiscount(0);
    } finally {
      setLoading(null);
    }
  };

  const handleMonthly = async () => {
    setLoading('monthly');
    try {
      const ok = await loadRazorpay();
      if (!ok) return toast.error('Could not load payment gateway');

      const subRes = await paymentsAPI.createSubscription();
      const { subscription, key } = subRes.data;

      const options = {
        key,
        subscription_id: subscription.id,
        name: 'InvoiceAI Monthly',
        description: 'Pro Monthly Subscription',
        handler: async (response) => {
          try {
            await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_payment_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: 'monthly',
            });
            updateUser({ plan: 'monthly' });
            toast.success('🎉 Pro subscription activated!');
          } catch { toast.error('Subscription verification failed'); }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#6366F1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = user?.plan || 'free';

  const plans = [
    {
      id: 'free', name: 'Free', price: '₹0', period: 'forever',
      icon: Users, color: '#52525B', features: FEATURES_FREE,
      cta: 'Current Plan', ctaDisabled: true, action: null,
    },
    {
      id: 'monthly', name: 'Pro', price: '₹999', period: 'per month',
      icon: Zap, color: '#6366F1', features: FEATURES_MONTHLY,
      cta: currentPlan === 'monthly' ? 'Current Plan' : currentPlan === 'lifetime' ? 'Included' : 'Subscribe Monthly',
      ctaDisabled: currentPlan === 'monthly' || currentPlan === 'lifetime',
      action: handleMonthly, popular: true,
    },
    {
      id: 'lifetime', name: 'Lifetime', price: '₹4,999', period: 'one-time',
      icon: Crown, color: '#10B981', features: FEATURES_LIFETIME,
      cta: currentPlan === 'lifetime' ? '✓ You have this' : 'Buy Lifetime Access',
      ctaDisabled: currentPlan === 'lifetime',
      action: handleLifetime,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '32px' }}>Simple, transparent pricing</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0' }}>
          Start free, upgrade when you're ready. No hidden fees, cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              key={plan.id} className="card" style={{
              position: 'relative', overflow: 'hidden',
              border: plan.popular ? `2px solid ${plan.color}` : '1px solid var(--border)',
              transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: 0, right: 0, background: plan.color, color: 'white',
                  fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderBottomLeftRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>Most Popular</div>
              )}
              {/* Plan header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={plan.color} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{plan.name}</div>
                  {isCurrent && <div style={{ fontSize: '10px', color: plan.color, fontWeight: 600 }}>✓ ACTIVE</div>}
                </div>
              </div>
              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
                  {plan.id === 'lifetime' && discount > 0 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '24px', marginRight: '8px' }}>{plan.price}</span>
                      {discount === 100 ? '₹0' : `₹${Math.round(4999 * (1 - discount / 100))}`}
                    </>
                  ) : plan.price}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>/{plan.period}</span>
              </div>
              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Check size={14} color={plan.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              {/* Coupon for Lifetime */}
              {plan.id === 'lifetime' && !isCurrent && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input className="input" type="text" placeholder="Coupon code" value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} disabled={discount > 0} />
                  <button className="btn btn-outline btn-sm" onClick={handleApplyCoupon} disabled={!couponCode || loading === 'coupon' || discount > 0}>
                    {loading === 'coupon' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : discount > 0 ? 'Applied' : 'Apply'}
                  </button>
                </div>
              )}

              {/* CTA */}

              <button
                className={`btn btn-lg ${plan.ctaDisabled ? 'btn-outline' : 'btn-primary'}`}
                style={{
                  width: '100%',
                  background: plan.ctaDisabled ? undefined : plan.color,
                  borderColor: plan.ctaDisabled ? 'var(--border)' : undefined,
                }}
                onClick={plan.action}
                disabled={plan.ctaDisabled || loading === plan.id}
              >
                {loading === plan.id ? <span className="spinner" style={{ width: 18, height: 18 }} /> : plan.cta}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ / Guarantee */}
      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Shield size={14} />
          Payments secured by Razorpay. Cancel subscription anytime.
        </div>
      </div>
    </div>
  );
}
