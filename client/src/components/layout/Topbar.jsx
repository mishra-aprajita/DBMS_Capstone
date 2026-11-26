import { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  ExternalLink,
  Calendar,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useTheme } from '../../context/ThemeContext';

export function Topbar({ 
  onToggleSidebar, 
  activeTab, 
  roleTitle,
  searchQuery,
  onSearchChange,
  onOpenBookingModal
}) {
  const { currentUser, allUsers, switchDemoUser, logout, isLiveApi } = useAuth();
  const { navigate } = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(e.target)) setNotifyOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRoleSwitch = async (e) => {
    const selectedUserId = e.target.value;
    if (selectedUserId) {
      const switched = await switchDemoUser(selectedUserId);
      if (switched?.role) {
        navigate(`/${switched.role.toLowerCase()}/dashboard`);
      }
    }
  };

  return (
    <header className="app-topbar">
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="topbar-left">
        <button 
          className="topbar-toggle-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        <div className="topbar-breadcrumbs">
          <span style={{ color: 'var(--text-muted)' }}>Smart Campus</span>
          <span style={{ color: 'var(--text-subtle)' }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{roleTitle}</span>
          <span style={{ color: 'var(--text-subtle)' }}>/</span>
          <span className="active" style={{ textTransform: 'capitalize' }}>
            {activeTab.replace(/-/g, ' ')}
          </span>
        </div>
      </div>

      {/* Right: Search, Booking Action, Dark Mode Toggle, Demo Switcher, Notification, Profile */}
      <div className="topbar-right">
        {/* Global/Tab Search */}
        <div className="topbar-search-form">
          <Search size={15} className="topbar-search-icon" />
          <input 
            type="text" 
            placeholder="Search resources, records…" 
            className="topbar-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Quick Reserve Action */}
        {onOpenBookingModal && (
          <button 
            className="btn-academic btn-primary btn-sm"
            onClick={onOpenBookingModal}
          >
            <Calendar size={14} />
            <span>New Booking</span>
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          className="icon-action-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Soft Light Mode" : "Switch to Deep Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={17} style={{ color: '#FBBF24' }} /> : <Moon size={17} style={{ color: 'var(--brand-primary)' }} />}
        </button>

        {/* Demo Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select 
            className="form-select-academic" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.8rem', 
              width: 'auto', 
              maxWidth: '220px',
              borderRadius: 'var(--r-md)',
              fontWeight: 500
            }}
            value={currentUser?.user_id || ''}
            onChange={handleRoleSwitch}
            title="Switch institutional role persona"
          >
            {(Array.isArray(allUsers) ? allUsers : []).map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Live / Mock Mode Indicator */}
        {!isLiveApi && (
          <span 
            className="status-badge pending" 
            style={{ fontSize: '0.68rem', cursor: 'help' }} 
            title="Database API offline; running with verified development mock dataset"
          >
            Demo Mock Mode
          </span>
        )}

        {/* Notifications dropdown */}
        <div style={{ position: 'relative' }} ref={notifyRef}>
          <button 
            className="icon-action-btn"
            onClick={() => setNotifyOpen(!notifyOpen)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="indicator-badge" />
          </button>

          {notifyOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '320px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--card-border)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Campus Alerts</span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  backgroundColor: 'var(--brand-light)', 
                  color: 'var(--brand-primary)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--r-full)'
                }}>
                  3 new
                </span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Lab Maintenance Scheduled</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Computer Lab 305 routine updates scheduled on Saturday.</p>
                </div>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Booking Approved</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Seminar Hall A reservation confirmed by Coordinator.</p>
                </div>
                <div style={{ padding: '12px 18px', fontSize: '0.8rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Equipment Check-in</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Oscilloscope #01 ready for collection in Electronics Lab.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              padding: '4px 12px 4px 6px',
              borderRadius: 'var(--r-full)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div className="user-avatar-sm" style={{ width: '28px', height: '28px', fontSize: '0.76rem' }}>
              {currentUser?.full_name?.charAt(0) || 'A'}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentUser?.full_name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '240px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              padding: '8px 0',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--card-border)' }}>
                <p style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{currentUser?.full_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{currentUser?.email || 'user@campus.edu'}</p>
                <span className="status-badge available" style={{ marginTop: '8px', fontSize: '0.66rem' }}>
                  {currentUser?.role}
                </span>
              </div>
              <button 
                onClick={() => { setProfileOpen(false); navigate('/login/student'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <ExternalLink size={15} style={{ color: 'var(--text-muted)' }} />
                <span>Switch Portal</span>
              </button>
              <button 
                onClick={() => { setProfileOpen(false); logout(); navigate('/login/student'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--error-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
