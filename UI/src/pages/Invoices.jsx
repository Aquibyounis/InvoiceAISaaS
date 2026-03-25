import { useState, useEffect, useCallback } from 'react';
import { invoicesAPI } from '../api';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, getStatusVariant, getDaysOverdue } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, CheckCircle, Bell, FileText, Mail, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const EMPTY_FORM = { clientName: '', clientEmail: '', amount: '', dueDate: '', description: '', currency: 'INR', notes: '' };
const STATUSES = ['all', 'pending', 'overdue', 'paid', 'cancelled'];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [confirmSend, setConfirmSend] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });
  const [searchParams] = useSearchParams();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesAPI.getAll({ status: statusFilter, search });
      setInvoices(res.data.invoices);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  // Open modal if ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') openCreate();
  }, [searchParams]);

  const openCreate = () => { setEditingInvoice(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (inv) => {
    setEditingInvoice(inv);
    setForm({
      clientName: inv.clientName, clientEmail: inv.clientEmail,
      amount: inv.amount, dueDate: inv.dueDate?.slice(0, 10),
      description: inv.description || '', currency: inv.currency, notes: inv.notes || '',
    });
    setShowModal(true);
  };
  const handleClose = () => { setShowModal(false); setEditingInvoice(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingInvoice) {
        await invoicesAPI.update(editingInvoice._id, form);
        toast.success('Invoice updated');
      } else {
        await invoicesAPI.create(form);
        toast.success('Invoice created!');
      }
      handleClose();
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await invoicesAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await invoicesAPI.markPaid(id);
      toast.success('Invoice marked as paid ✓');
      fetchInvoices();
    } catch { toast.error('Failed to update'); }
  };

  const handleSendNow = async (inv) => {
    setSendingReminder(inv._id);
    try {
      const res = await invoicesAPI.sendReminder(inv._id);
      toast.success(`✉️ ${res.data.message}`, { duration: 5000 });
      if (res.data.previewUrl) {
        toast(`📬 Preview: ${res.data.previewUrl}`, {
          icon: '🔗', duration: 10000,
          style: { fontSize: '11px', maxWidth: '500px' },
        });
      }
      setConfirmSend(null);
      fetchInvoices();
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadySent) {
        // 23h cooldown warning
        toast(`⏳ Already sent! Wait ${data.hoursLeft}h before sending another reminder to ${inv.clientName}.`, {
          icon: '🚫', duration: 6000,
          style: { color: '#92400E', background: '#FFFBEB', border: '1px solid #F59E0B', maxWidth: '480px' },
        });
      } else {
        toast.error(data?.message || 'Failed to send reminder');
      }
    } finally { setSendingReminder(null); }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const activeInvoices = sortedInvoices.filter(i => i.status !== 'paid');
  const paidInvoices = sortedInvoices.filter(i => i.status === 'paid');

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: 4 }} />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} /> 
      : <ArrowDown size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />;
  };

  const renderTable = (data, isPaid = false) => {
    if (data.length === 0) return null;
    return (
      <div className="table-container" style={{ marginTop: isPaid ? '40px' : 0 }}>
        {isPaid && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Paid Invoices</h3>
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('invoiceNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>Invoice # <SortIcon column="invoiceNumber" /></th>
              <th onClick={() => handleSort('clientName')} style={{ cursor: 'pointer', userSelect: 'none' }}>Client <SortIcon column="clientName" /></th>
              <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>Amount <SortIcon column="amount" /></th>
              <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>Due Date <SortIcon column="dueDate" /></th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>Status <SortIcon column="status" /></th>
              <th>Reminders</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {data.map(inv => {
              const daysOver = getDaysOverdue(inv.dueDate);
              return (
                <motion.tr key={inv._id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  <td>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 6 }}>
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{inv.clientName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.clientEmail}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(inv.amount, inv.currency)}</td>
                  <td>
                    {formatDate(inv.dueDate)}
                    {daysOver > 0 && inv.status !== 'paid' && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>{daysOver}d overdue</div>}
                  </td>
                  <td><span className={`badge ${getStatusVariant(inv.status)}`}>{inv.status}</span></td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {inv.remindersSent > 0 ? (
                        <><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.remindersSent}</span> sent{inv.lastToneSent && ` · ${inv.lastToneSent}`}</>
                      ) : 'None'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {inv.status !== 'paid' && (
                        <button className="btn btn-ghost btn-sm" title="Send reminder now" onClick={() => setConfirmSend(inv)} style={{ padding: '6px 10px', color: 'var(--accent)', background: 'var(--accent-light)', gap: 6 }}>
                          <Mail size={13} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>Send Reminder</span>
                        </button>
                      )}
                      {inv.status !== 'paid' && (
                        <button className="btn btn-ghost btn-sm" title="Mark paid" onClick={() => handleMarkPaid(inv._id)} style={{ padding: '6px', color: 'var(--success)' }}>
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(inv)} style={{ padding: '6px' }}><Edit size={15} /></button>
                      <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(inv._id)} disabled={deleting === inv._id} style={{ padding: '6px', color: 'var(--danger)' }}>
                        {deleting === inv._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{total} total invoice{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Invoice</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" type="text" placeholder="Search by name, email, invoice #..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="btn btn-sm"
              style={{
                background: statusFilter === s ? 'var(--text-primary)' : 'var(--surface)',
                color: statusFilter === s ? 'white' : 'var(--text-secondary)',
                border: '1.5px solid', borderColor: statusFilter === s ? 'var(--text-primary)' : 'var(--border)',
                textTransform: 'capitalize',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-sm)' }} />)}
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No invoices found</h3>
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            {search || statusFilter !== 'all' ? 'Try changing your filters' : 'Create your first invoice to get started'}
          </p>
          {!search && statusFilter === 'all' && (
            <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Create Invoice</button>
          )}
        </div>
      ) : (
        <div>
          {renderTable(activeInvoices, false)}
          {renderTable(paidInvoices, true)}
        </div>
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
              {sendingReminder === confirmSend?._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Mail size={14} />} Send Email
            </button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={handleClose} title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid">
            <div style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Client Name *</label>
              <input className="input" type="text" placeholder="Acme Corp" value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Client Email *</label>
              <input className="input" type="email" placeholder="billing@acmecorp.com" value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Amount *</label>
              <input className="input" type="number" placeholder="25000" min="1" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Currency</label>
              <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Due Date *</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} required />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Description</label>
              <textarea className="input" placeholder="Web design services for Q1 2025..." rows={2}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ resize: 'vertical', minHeight: '64px' }} />
            </div>
            {editingInvoice && (
              <div>
                <label className="input-label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['pending', 'overdue', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : editingInvoice ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
