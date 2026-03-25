import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Bell, CreditCard, LogOut, Zap, X, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/pricing', icon: CreditCard, label: 'Pricing' },
  { to: '/profile', icon: User, label: 'Profile & Settings' },
];

const planColors = { free: '#A1A1AA', monthly: '#6366F1', lifetime: '#10B981' };
const planLabels = { free: 'Free', monthly: 'Pro', lifetime: 'Lifetime' };

export default function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Desktop Collapse Toggle */}
        <button
          className="mobile-hidden-btn"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '30%', background: 'var(--text-primary)', border: 'none',
            color: 'white', zIndex: 100, display: window.innerWidth < 768 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            boxShadow: 'var(--shadow-sm)'
          }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo */}
        <div style={{ marginBottom: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: 'var(--text-primary)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={18} color="white" />
              </div>
              {!collapsed && (
                <div style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.1 }}>InvoiceAI</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery System</div>
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm mobile-only" onClick={() => setMobileOpen(false)} style={{ padding: 6 }}>
              <X size={16} />
            </button>
          </div>
          e        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px' : '10px 12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.15s',
              })}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16, display: 'flex', flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch'
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'var(--accent)',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
                  borderRadius: 99, fontSize: '10px', fontWeight: 600,
                  background: `${planColors[user?.plan] || planColors.free}15`,
                  color: planColors[user?.plan] || planColors.free,
                }}>
                  {planLabels[user?.plan] || 'Free'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%', marginBottom: '12px', flexShrink: 0,
              background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer'
            }} title={user?.name}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '6px 14px', gap: 8 }} onClick={handleLogout} title="Sign Out">
            <LogOut size={16} /> {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
