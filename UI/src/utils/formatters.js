export const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const fmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${symbols[currency] || currency}${fmt.format(amount)}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatRelativeDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30) return `${diff} days ago`;
  return formatDate(date);
};

export const getDaysOverdue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  if (now <= due) return 0;
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
};

export const getToneColor = (tone) => {
  const map = { polite: '#4338CA', reminder: '#C2410C', firm: '#BE123C', final: '#09090B' };
  return map[tone] || '#52525B';
};

export const getStatusVariant = (status) => {
  const map = { pending: 'badge-pending', overdue: 'badge-overdue', paid: 'badge-paid', cancelled: 'badge-cancelled' };
  return map[status] || 'badge-pending';
};

export const getToneVariant = (tone) => {
  const map = { polite: 'badge-polite', reminder: 'badge-reminder', firm: 'badge-firm', final: 'badge-final' };
  return map[tone] || 'badge-polite';
};

export const truncate = (str, n = 40) => str && str.length > n ? str.substring(0, n) + '…' : str;
