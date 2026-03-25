import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — token expired or invalid
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  updateSmtpConfig: (data) => api.put('/auth/smtp-config', data),
  removeSmtpConfig: () => api.delete('/auth/smtp-config'),
};

// Invoices
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  markPaid: (id) => api.put(`/invoices/${id}/mark-paid`),
  sendReminder: (id) => api.post(`/invoices/${id}/send-reminder`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getChart: () => api.get('/dashboard/chart'),
};

// Reminders
export const remindersAPI = {
  getAll: (params) => api.get('/reminders', { params }),
  trigger: () => api.post('/reminders/trigger'),
};

// Payments
export const paymentsAPI = {
  createLifetimeOrder: () => api.post('/payments/create-order'),
  createSubscription: () => api.post('/payments/create-subscription'),
  verify: (data) => api.post('/payments/verify', data),
  validateCoupon: (couponCode) => api.post('/payments/validate-coupon', { couponCode }),
};

export default api;
