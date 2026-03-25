export default function StatCard({ title, value, subtitle, icon: Icon, color = '#6366F1', trend }) {
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', gap: '16px',
      transition: 'all 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>{title}</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>{value}</div>
          {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ fontSize: '12px', color: trend > 0 ? 'var(--success)' : trend < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% from last month
        </div>
      )}
    </div>
  );
}
