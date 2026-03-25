import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome to InvoiceAI, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeInUp 0.5s ease' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'var(--text-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '22px' }}>InvoiceAI</span>
        </Link>

        <div className="card" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Get started free</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>Create your account — no credit card required</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" type="text" placeholder="Jane Smith" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ paddingLeft: '40px' }} required />
              </div>
            </div>

            <div>
              <label className="input-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" type="email" placeholder="you@company.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ paddingLeft: '40px' }} required />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingLeft: '40px', paddingRight: '44px' }} required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
