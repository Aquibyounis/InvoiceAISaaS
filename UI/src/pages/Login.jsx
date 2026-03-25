import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeInUp 0.5s ease' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'var(--text-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '22px' }}>InvoiceAI</span>
        </Link>

        <div className="card" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Your password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingLeft: '40px', paddingRight: '44px' }} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
