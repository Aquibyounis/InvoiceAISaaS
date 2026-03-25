import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 480, md: 560, lg: 720, xl: 900 };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: sizes[size],
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        animation: 'fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px', borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
