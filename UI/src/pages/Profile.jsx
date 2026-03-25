import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Shield, Zap, Trash2, CheckCircle, ExternalLink, Eye, EyeOff, Clock } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [savingName, setSavingName] = useState(false);
  
  const [cronForm, setCronForm] = useState({ cronTime: user?.cronTime || '09:00' });
  const [savingCron, setSavingCron] = useState(false);

  const [smtpForm, setSmtpForm] = useState({
    smtpEmail: '',
    smtpPassword: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
  });
  const [showPass, setShowPass] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [removingSmtp, setRemovingSmtp] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(user?.smtp?.configured || false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await authAPI.updateProfile({ name: nameForm.name });
      updateUser({ name: res.data.user.name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingName(false); }
  };

  const handleSaveCron = async (e) => {
    e.preventDefault();
    setSavingCron(true);
    try {
      const res = await authAPI.updateProfile({ cronTime: cronForm.cronTime });
      updateUser({ cronTime: res.data.user.cronTime });
      toast.success(`Automated reminders scheduled for ${cronForm.cronTime} IST everyday.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingCron(false); }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      await authAPI.updateSmtpConfig(smtpForm);
      setSmtpConfigured(true);
      updateUser({ smtp: { configured: true, email: smtpForm.smtpEmail } });
      toast.success('Gmail SMTP connected! Reminders will now send from your email.');
      setSmtpForm(f => ({ ...f, smtpPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'SMTP setup failed');
    } finally { setSavingSmtp(false); }
  };

  const handleRemoveSmtp = async () => {
    if (!window.confirm('Remove your Gmail SMTP configuration?')) return;
    setRemovingSmtp(true);
    try {
      await authAPI.removeSmtpConfig();
      setSmtpConfigured(false);
      updateUser({ smtp: { configured: false } });
      toast.success('SMTP configuration removed.');
    } catch { toast.error('Failed to remove SMTP config'); }
    finally { setRemovingSmtp(false); }
  };

  const planColors = { free: '#A1A1AA', monthly: '#6366F1', lifetime: '#10B981' };
  const planLabels = { free: 'Free', monthly: 'Pro Monthly', lifetime: 'Lifetime' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}>
      <div>
        <h1 className="page-title">Profile & Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage your account and email configuration</p>
      </div>

      {/* Plan badge */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: `${planColors[user?.plan]}08`, borderColor: `${planColors[user?.plan]}30` }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${planColors[user?.plan]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={20} color={planColors[user?.plan]} />
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>Current Plan</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: planColors[user?.plan], fontFamily: 'Outfit, sans-serif' }}>
            {planLabels[user?.plan] || 'Free'}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} /> Account Details
        </h2>
        <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Full Name</label>
            <input className="input" type="text" value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })} required />
          </div>
          <div>
            <label className="input-label">Email Address</label>
            <input className="input" type="email" value={user?.email || ''} disabled
              style={{ background: 'var(--surface-2)', cursor: 'not-allowed', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={savingName}>
              {savingName ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Schedule Automation */}
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Automated Reminders Schedule
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Choose when the system should automatically check and send AI reminders for overdue invoices. (Times are in IST / Asia:Kolkata)
        </p>
        <form onSubmit={handleSaveCron} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Daily Run Time</label>
            <select className="input" value={cronForm.cronTime} onChange={e => setCronForm({ cronTime: e.target.value })}>
              {Array.from({ length: 24 }).map((_, i) => {
                const hour = i.toString().padStart(2, '0');
                const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
                return <option key={hour} value={`${hour}:00`}>{label}</option>;
              })}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={savingCron}>
              {savingCron ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* Gmail SMTP config */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} /> Gmail SMTP Setup
              {smtpConfigured && (
                <span style={{ marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                  <CheckCircle size={10} /> Connected
                </span>
              )}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              Connect your Gmail so reminders are sent <strong>from your email address</strong>. You must use a Gmail <strong>App Password</strong> (not your regular password).
            </p>
          </div>
          {smtpConfigured && (
            <button className="btn btn-ghost btn-sm" onClick={handleRemoveSmtp} disabled={removingSmtp}
              style={{ flexShrink: 0, color: 'var(--danger)', gap: 6 }}>
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>

        {/* How to get app password */}
        <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--accent)', lineHeight: 1.7 }}>
          <strong>How to get a Gmail App Password:</strong><br />
          1. Go to your Google Account → Security<br />
          2. Enable 2-Step Verification (required)<br />
          3. Search for "App passwords" → Create new → Name it "InvoiceAI"<br />
          4. Copy the 16-character password and paste below<br />
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            Open App Passwords <ExternalLink size={11} />
          </a>
        </div>

        <form onSubmit={handleSaveSmtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Your Gmail Address</label>
              <input className="input" type="email" placeholder="you@gmail.com" value={smtpForm.smtpEmail}
                onChange={e => setSmtpForm(f => ({ ...f, smtpEmail: e.target.value }))} required />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="input-label">App Password (16 characters)</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'}
                  placeholder="xxxx xxxx xxxx xxxx" value={smtpForm.smtpPassword}
                  onChange={e => setSmtpForm(f => ({ ...f, smtpPassword: e.target.value }))}
                  style={{ paddingRight: '44px', letterSpacing: showPass ? 'normal' : '0.15em' }} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">SMTP Host</label>
              <input className="input" type="text" value={smtpForm.smtpHost}
                onChange={e => setSmtpForm(f => ({ ...f, smtpHost: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Port</label>
              <input className="input" type="number" value={smtpForm.smtpPort}
                onChange={e => setSmtpForm(f => ({ ...f, smtpPort: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-accent" type="submit" disabled={savingSmtp}>
              {savingSmtp ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Verifying...</> : <><Mail size={14} /> {smtpConfigured ? 'Update Gmail Config' : 'Connect Gmail'}</>}
            </button>
          </div>
        </form>

        {smtpConfigured && user?.smtp?.email && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={14} />
            Reminders will be sent from <strong>{user.smtp.email || smtpForm.smtpEmail}</strong>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} /> Security
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          To change your password, contact support or use the forgot-password flow. JWT tokens expire after 7 days.
        </div>
      </div>
    </div>
  );
}
