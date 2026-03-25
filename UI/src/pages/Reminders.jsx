import { useState, useEffect } from 'react';
import { remindersAPI, invoicesAPI } from '../api';
import { formatCurrency, formatDate, formatRelativeDate, getToneVariant } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Bell, RefreshCw, ChevronDown, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

const TONES = ['all', 'polite', 'reminder', 'firm', 'final'];
const toneDescriptions = { polite: '1–7 days overdue', reminder: '8–14 days', firm: '15–21 days', final: '22+ days' };

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toneFilter, setToneFilter] = useState('all');
  const [triggering, setTriggering] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [confirmSend, setConfirmSend] = useState(null);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const params = toneFilter !== 'all' ? { tone: toneFilter } : {};
      const res = await remindersAPI.getAll(params);
      setReminders(res.data.reminders || []);
    } catch { toast.error('Failed to load reminders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReminders(); }, [toneFilter]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await remindersAPI.trigger();
      const { sent, skipped, errors } = res.data.result;
      toast.success(`Done! Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`);
      fetchReminders();
    } catch (err) { toast.error(err.response?.data?.message || 'Trigger failed'); }
    finally { setTriggering(false); }
  };

  const handleSendNow = async (r) => {
    setSendingReminder(r._id);
    try {
      const res = await invoicesAPI.sendReminder(r.invoiceId);
      toast.success(`✉️ ${res.data.message}`, { duration: 5000 });
      if (res.data.previewUrl) {
        toast(`📬 Preview: ${res.data.previewUrl}`, {
          icon: '🔗', duration: 10000,
          style: { fontSize: '11px', maxWidth: '500px' },
        });
      }
      fetchReminders(); // refresh logs
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadySent) {
        toast(`⏳ Already sent! Wait ${data.hoursLeft}h before sending another to ${r.clientName}.`, {
          icon: '🚫', duration: 6000,
          style: { color: '#92400E', background: '#FFFBEB', border: '1px solid #F59E0B', maxWidth: '480px' },
        });
      } else {
        toast.error(data?.message || 'Failed to send reminder');
      }
    } finally {
      setSendingReminder(null);
      setConfirmSend(null);
    }
  };

  const toneColors = { polite: '#4338CA', reminder: '#C2410C', firm: '#BE123C', final: '#09090B' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Reminder Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            All AI-generated payment reminder emails sent to clients
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleTrigger} disabled={triggering}>
          {triggering ? <span className="spinner" /> : <RefreshCw size={14} />}
          {triggering ? 'Processing...' : 'Run Reminders Now'}
        </button>
      </div>

      {/* Tone escalation legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {['polite', 'reminder', 'firm', 'final'].map(tone => (
          <div key={tone} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: toneColors[tone] }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', color: toneColors[tone] }}>{tone}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{toneDescriptions[tone]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tone filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {TONES.map(t => (
          <button key={t} onClick={() => setToneFilter(t)} className="btn btn-sm"
            style={{
              textTransform: 'capitalize',
              background: toneFilter === t ? 'var(--text-primary)' : 'var(--surface)',
              color: toneFilter === t ? 'white' : 'var(--text-secondary)',
              border: '1.5px solid', borderColor: toneFilter === t ? 'var(--text-primary)' : 'var(--border)',
            }}>
            {t === 'all' ? 'All Tones' : t}
          </button>
        ))}
      </div>

      {/* Reminders list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : reminders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No reminders yet</h3>
          <p style={{ fontSize: '14px' }}>Reminders are automatically sent daily for overdue invoices. Use the button above to trigger manually.</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reminders.map(r => (
            <motion.div 
              key={r._id} className="card" style={{ padding: 0, overflow: 'hidden' }}
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}
            >
              {/* Row */}
              <div
                onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', background: expanded === r._id ? 'var(--surface-2)' : 'transparent', transition: 'background 0.15s' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${toneColors[r.tone]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={16} color={toneColors[r.tone]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.clientName}</span>
                    <span className={`badge ${getToneVariant(r.tone)}`}>{r.tone}</span>
                    {!r.success && <span className="badge badge-overdue">Failed</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {r.invoiceNumber} · {formatCurrency(r.amount)} · {r.daysOverdue}d overdue · {formatRelativeDate(r.sentAt)}
                  </div>
                </div>
                {/* Spot reminder trigger */}
                <button
                  className="btn btn-ghost btn-sm"
                  title="Send reminder now"
                  onClick={(e) => { e.stopPropagation(); setConfirmSend(r); }}
                  style={{ padding: '6px 10px', color: 'var(--accent)', background: 'var(--accent-light)', gap: 6, flexShrink: 0 }}>
                  <Mail size={13} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>Send Reminder</span>
                </button>
                <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: expanded === r._id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </div>
              {/* Expanded email body */}
              {expanded === r._id && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', animation: 'fadeInUp 0.2s ease' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Subject</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>{r.subject}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Email Body</div>
                  <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, padding: '12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', maxHeight: '300px', overflowY: 'auto' }}>
                    {r.emailBody}
                  </pre>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={!!confirmSend} onClose={() => setConfirmSend(null)} title="Send Reminder Now">
        <div style={{ padding: '4px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Are you sure you want to send a reminder email to <strong>{confirmSend?.clientName}</strong> now? This will use your configured AI tone sequence and will count towards your daily limit.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-ghost" onClick={() => setConfirmSend(null)} disabled={sendingReminder === confirmSend?._id}>Cancel</button>
            <button className="btn btn-accent" onClick={() => handleSendNow(confirmSend)} disabled={sendingReminder === confirmSend?._id}>
              {sendingReminder === confirmSend?._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Mail size={14} />} Send Details
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
