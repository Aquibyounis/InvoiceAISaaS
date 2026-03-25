import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, remindersAPI } from '../api';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDate, getStatusVariant, getToneVariant } from '../utils/formatters';
import toast from 'react-hot-toast';
import { FileText, TrendingUp, AlertCircle, CheckCircle, Bell, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentReminders, setRecentReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.stats);
      setRecentInvoices(res.data.recentInvoices || []);
      setRecentReminders(res.data.recentReminders || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await remindersAPI.trigger();
      const { sent, skipped, errors } = res.data.result;
      toast.success(`Reminders processed: ${sent} sent, ${skipped} skipped, ${errors} errors`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius)' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Here's what's happening with your invoices today
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleTrigger} disabled={triggering}>
            {triggering ? <span className="spinner" /> : <RefreshCw size={14} />}
            {triggering ? 'Running...' : 'Run Reminders'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices?new=1')}>
            <Plus size={14} /> New Invoice
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="Total Invoices" value={stats?.totalInvoices || 0} icon={FileText} color="#6366F1"
          subtitle="All time" />
        <StatCard title="Outstanding" value={formatCurrency(stats?.totalOutstanding || 0)} icon={TrendingUp} color="#F59E0B"
          subtitle={`${stats?.pendingInvoices || 0} pending`} />
        <StatCard title="Overdue" value={formatCurrency(stats?.totalOverdue || 0)} icon={AlertCircle} color="#EF4444"
          subtitle={`${stats?.overdueInvoices || 0} invoice(s)`} />
        <StatCard title="Collected" value={formatCurrency(stats?.totalCollected || 0)} icon={CheckCircle} color="#10B981"
          subtitle={`${stats?.paidInvoices || 0} paid`} />
      </motion.div>

      {/* Two-column layout */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="dashboard-grid">
        {/* Recent Invoices */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Invoices</h2>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={() => navigate('/invoices')}>View all →</button>
          </div>
          {recentInvoices.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No invoices yet.</p>
              <button className="btn btn-accent btn-sm" style={{ marginTop: '12px' }} onClick={() => navigate('/invoices?new=1')}>
                <Plus size={13} /> Create your first invoice
              </button>
            </div>
          ) : (
            <div>
              {recentInvoices.map((inv) => (
                <div key={inv._id} onClick={() => navigate(`/invoices`)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{inv.clientName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{inv.invoiceNumber} · Due {formatDate(inv.dueDate)}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{formatCurrency(inv.amount, inv.currency)}</div>
                    <span className={`badge ${getStatusVariant(inv.status)}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reminders */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Reminders</h2>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={() => navigate('/reminders')}>View all →</button>
          </div>
          {recentReminders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No reminders sent yet.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Reminders auto-send daily for overdue invoices.</p>
            </div>
          ) : (
            <div>
              {recentReminders.map((r) => (
                <div key={r._id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.clientName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.invoiceNumber} · {r.daysOverdue}d overdue</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className={`badge ${getToneVariant(r.tone)}`}>{r.tone}</span>
                    <div style={{ fontSize: '11px', color: r.success ? 'var(--success)' : 'var(--danger)' }}>
                      {r.success ? '✓ Sent' : '✗ Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
