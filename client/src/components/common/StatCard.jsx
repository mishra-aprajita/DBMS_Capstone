export function StatCard({ title, value, subtext, icon: Icon, color = 'var(--brand-primary)' }) {
  return (
    <div className="stat-box">
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <span className="stat-val">{value ?? '—'}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
      {Icon && (
        <div 
          className="stat-icon-wrapper" 
          style={{ 
            background: `linear-gradient(135deg, ${color}1A 0%, ${color}0D 100%)`,
            color: color,
            borderColor: `${color}33`
          }}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>
      )}
    </div>
  );
}
