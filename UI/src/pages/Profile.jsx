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

      <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', fontSize: '13px', color: 'var(--accent)', lineHeight: 1.6, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '4px' }}>
          <Mail size={16} /> Automated Email Delivery
        </div>
        Reminder emails are reliably sent from our high-deliverability system via <strong>reminders@yourdomain.com</strong>.<br/>
        When clients reply to the reminders, their responses will automatically be routed directly back to <strong>your email address ({user?.email})</strong>.
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
