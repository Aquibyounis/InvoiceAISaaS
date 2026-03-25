import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, FileText, Mail, TrendingUp, ArrowRight, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Demo data for interactive preview
const DEMO_INVOICES = [
  { id: 1, client: 'Acme Corp', email: 'billing@acmecorp.com', amount: '₹85,000', dueDate: 'Mar 10, 2026', status: 'overdue', days: 14, tone: 'reminder', reminders: 2 },
  { id: 2, client: 'NovaTech Ltd', email: 'accounts@novatech.io', amount: '₹1,20,000', dueDate: 'Mar 5, 2026', status: 'overdue', days: 19, tone: 'firm', reminders: 3 },
  { id: 3, client: 'Stellar Designs', email: 'pay@stellar.co', amount: '₹32,500', dueDate: 'Mar 20, 2026', status: 'pending', days: 0, tone: null, reminders: 0 },
  { id: 4, client: 'DataFlow Inc', email: 'finance@dataflow.com', amount: '₹2,50,000', dueDate: 'Feb 28, 2026', status: 'overdue', days: 24, tone: 'final', reminders: 4 },
];

const TONE_BADGE = { reminder: { label: 'Reminder', bg: '#FFF7ED', color: '#C2410C' }, firm: { label: 'Firm', bg: '#FFF1F2', color: '#BE123C' }, final: { label: 'Final Notice', bg: '#1F1F23', color: '#fff' }, polite: { label: 'Polite', bg: '#EEF2FF', color: '#4338CA' } };
const STATUS_BADGE = { overdue: { bg: '#FEF2F2', color: '#991B1B' }, pending: { bg: '#FFFBEB', color: '#92400E' }, paid: { bg: '#ECFDF5', color: '#065F46' } };

const FEATURES = [
  { icon: Mail, title: 'AI-Generated Emails', desc: 'Tone-escalating reminders from polite nudge to firm legal notice, powered by AI.' },
  { icon: Clock, title: 'Smart Scheduling', desc: 'Daily cron job automatically detects overdue invoices and sends perfectly timed emails.' },
  { icon: TrendingUp, title: 'Recovery Dashboard', desc: 'Track outstanding amounts, recovery rate, and reminder history in one place.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'JWT auth, encrypted data, and Razorpay-powered payments. GDPR-compliant.' },
];

export default function Landing() {
  const heroRef = useRef(null);
  const headingRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const floatRef = useRef(null);
  const featuresRef = useRef(null);
  const demoRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo(headingRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
        .fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(floatRef.current, { y: 40, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1 }, '-=0.5');

      // Floating animation
      gsap.to(floatRef.current, { y: -12, duration: 2.5, ease: 'power1.inOut', repeat: -1, yoyo: true });

      // Features stagger on scroll
      gsap.utils.toArray('.feature-card').forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          y: 40, opacity: 0, duration: 0.7,
          delay: i * 0.1, ease: 'power3.out',
        });
      });

      // Demo section
      gsap.from(demoRef.current, {
        scrollTrigger: { trigger: demoRef.current, start: 'top 80%' },
        y: 50, opacity: 0, duration: 0.8, ease: 'power3.out',
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} style={{ background: 'var(--background)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,250,250,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center justify-between h-16 w-full" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-[34px] sm:h-[34px] bg-[var(--text-primary)] flex items-center justify-center shrink-0" style={{ borderRadius: 10 }}>
              <Zap size={16} color="white" />
            </div>
            <span className="font-['Outfit'] font-black text-base sm:text-lg">InvoiceAI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full" style={{ maxWidth: 1200, margin: '0 auto', padding: window.innerWidth < 1024 ? '64px 24px' : '100px 24px 64px 24px' }}>
        <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
            <Zap size={12} /> AI-Powered Invoice Recovery
          </div>

          <h1 ref={headingRef} className="font-['Outfit'] text-[clamp(40px,8vw,64px)] font-black leading-[1.05] tracking-tight mb-5 break-words">
            Stop chasing<br />
            <span className="gradient-text">unpaid invoices.</span>
          </h1>

          <p ref={subRef} style={{ fontSize: '16px', marginTop: 10, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '480px' }}>
            InvoiceAI automatically sends AI-generated payment reminders that escalate in tone — from polite nudge to firm final notice — until you get paid.
          </p>

          <div ref={ctaRef} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }} className="lg:justify-start">
            <Link to="/register" className="btn btn-primary btn-lg" style={{ gap: 8 }}>
              Start recovering invoices <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign in →</Link>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '32px', flexWrap: 'wrap' }}>
            {[['Free to start', CheckCircle], ['No credit card', Shield], ['Cancel anytime', Clock]].map(([text, Icon]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <Icon size={14} color="var(--success)" /> {text}
              </div>
            ))}
          </div>
        </div>

        {/* Demo card (floating) */}
        <div ref={floatRef}>
          <div className="bg-[var(--surface)] overflow-hidden border border-[var(--border)] shadow-2xl" style={{ padding: 0, borderRadius: 'var(--radius-lg)' }}>
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-wrap items-center gap-2" style={{ padding: '16px 24px' }}>
              <FileText size={15} color="var(--accent)" className="shrink-0" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Live Invoice Demo</span>
              <span className="ml-auto px-2 py-0.5 whitespace-nowrap" style={{ fontSize: '11px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 99, fontWeight: 600 }}>Auto-reminders ON</span>
            </div>
            {DEMO_INVOICES.map(inv => (
              <div key={inv.id} className="border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[13px]" style={{ padding: '14px 24px' }}>
                <div className="flex-1" style={{ minWidth: '120px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.client}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{inv.days > 0 ? `${inv.days}d overdue` : `Due ${inv.dueDate}`}</div>
                </div>
                <div className="shrink-0" style={{ fontWeight: 700 }}>{inv.amount}</div>
                <div className="flex flex-wrap justify-end gap-1.5 shrink-0" style={{ minWidth: '100px' }}>
                  <span className="rounded-full font-medium" style={{ padding: '4px 12px', fontSize: '11px', background: STATUS_BADGE[inv.status]?.bg, color: STATUS_BADGE[inv.status]?.color }}>{inv.status}</span>
                  {inv.tone && <span className="rounded-full font-medium" style={{ padding: '4px 12px', fontSize: '11px', background: TONE_BADGE[inv.tone]?.bg, color: TONE_BADGE[inv.tone]?.color }}>{TONE_BADGE[inv.tone]?.label}</span>}
                </div>
              </div>
            ))}
            <div className="bg-[var(--accent-light)] flex flex-wrap items-center gap-2 leading-relaxed" style={{ padding: '14px 24px', fontSize: '12px', color: 'var(--accent)' }}>
              <Mail size={12} className="shrink-0" />
              <span>AI sent 9 reminder emails today · ₹4,55,000 recovery in progress</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tone Escalation Section */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '12px' }}>4 stages of intelligent escalation</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '15px' }}>The AI automatically selects the right tone based on days overdue</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              { tone: 'Polite', days: '1–7 days', color: '#4338CA', bg: '#EEF2FF', desc: 'Friendly reminder, assumes oversight' },
              { tone: 'Reminder', days: '8–14 days', color: '#C2410C', bg: '#FFF7ED', desc: 'Professional follow-up, requests update' },
              { tone: 'Firm', days: '15–21 days', color: '#BE123C', bg: '#FFF1F2', desc: 'Urgent notice, mentions consequences' },
              { tone: 'Final', days: '22+ days', color: '#fff', bg: '#09090B', desc: 'Legal warning, 48-hour ultimatum' },
            ].map((item, i) => (
              <div key={item.tone} style={{ padding: '20px', borderRadius: 'var(--radius)', background: item.bg, border: `1px solid ${item.color}25` }}>
                <div style={{ fontSize: '11px', color: item.color, fontWeight: 600, opacity: item.tone === 'Final' ? 0.7 : 1, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.days}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: item.color, marginBottom: '8px', letterSpacing: item.tone === 'Final' ? 0 : -0.02 }}>{item.tone}</div>
                <div style={{ fontSize: '12px', color: item.tone === 'Final' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                {i < 3 && (
                  <div style={{ fontSize: '18px', marginTop: '8px', color: item.color, opacity: 0.4 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features section */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '12px' }}>Everything you need to get paid</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>A complete automated accounts receivable system</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card card" style={{ cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Icon size={20} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section style={{ background: 'var(--text-primary)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Start recovering revenue today
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '32px' }}>
            Free plan includes 10 invoices and 3 reminders each. No credit card required.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--text-primary)', fontWeight: 700, gap: 8 }}>
            Get started for free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', maxWidth: 1200, margin: '0 auto', fontSize: '13px', color: 'var(--text-muted)' }}>
        <span>© 2026 InvoiceAI Recovery System</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
