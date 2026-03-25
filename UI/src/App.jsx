import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Reminders from './pages/Reminders';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Protected route wrapper
function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-layout">
      <Sidebar 
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} 
        collapsed={collapsed} setCollapsed={setCollapsed} 
      />
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        {/* Mobile top bar */}
        <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)} style={{ padding: 8 }}>
            <Menu size={18} />
          </button>
        </div>
        <AnimatedOutlet />
      </main>
    </div>
  );
}

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

// Public-only route (redirects if logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' },
            success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
