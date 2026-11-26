import { 
  Building2, 
  LayoutDashboard, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Users, 
  Wrench, 
  BarChart3, 
  Settings as SettingsIcon, 
  Bell, 
  User, 
  LogOut, 
  Layers, 
  FileText, 
  ShieldCheck, 
  FolderKanban,
  CalendarDays,
  Sparkles,
  Award,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const ROLE_NAVIGATION = {
  STUDENT: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore Resources', icon: Search },
    { id: 'my-bookings', label: 'My Bookings', icon: Calendar },
    { id: 'history', label: 'Booking History', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User }
  ],
  FACULTY: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'catalogue', label: 'Resource Catalogue', icon: Layers },
    { id: 'new-booking', label: 'New Booking', icon: Sparkles },
    { id: 'reservations', label: 'My Reservations', icon: CalendarDays },
    { id: 'usage-history', label: 'Usage History', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User }
  ],
  COORDINATOR: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approval Requests', icon: ShieldCheck, badgeKey: 'pendingApprovals' },
    { id: 'resources', label: 'Resource Management', icon: Layers },
    { id: 'calendar', label: 'Booking Calendar', icon: CalendarDays },
    { id: 'maintenance', label: 'Maintenance Overview', icon: Wrench },
    { id: 'sql-engine', label: 'SQL Engine & Triggers', icon: Database },
    { id: 'logs', label: 'Usage Logs', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User }
  ],
  ADMIN: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'locations', label: 'Locations', icon: FolderKanban },
    { id: 'resource-types', label: 'Resource Types', icon: Layers },
    { id: 'resources', label: 'Resources', icon: Layers },
    { id: 'all-bookings', label: 'All Bookings', icon: CalendarDays },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'sql-engine', label: 'SQL Engine & RBAC', icon: Database },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon }
  ],
  MAINTENANCE: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'Maintenance Requests', icon: Wrench },
    { id: 'assigned', label: 'Assigned Resources', icon: Layers },
    { id: 'scheduled', label: 'Scheduled Maintenance', icon: Calendar },
    { id: 'completed', label: 'Completed Repairs', icon: CheckCircle },
    { id: 'history', label: 'Maintenance History', icon: Clock },
    { id: 'profile', label: 'Profile', icon: User }
  ],
  MANAGEMENT: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'utilization', label: 'Resource Utilization', icon: BarChart3 },
    { id: 'dept-analytics', label: 'Department Analytics', icon: Building2 },
    { id: 'booking-analytics', label: 'Booking Analytics', icon: CalendarDays },
    { id: 'expenditure', label: 'Maintenance Expenditure', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User }
  ]
};

export function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse, mobileOpen }) {
  const { currentUser, logout } = useAuth();
  const { navigate } = useRouter();
  const role = currentUser?.role || 'STUDENT';
  const navItems = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.STUDENT;

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Building2 size={20} strokeWidth={2.2} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Smart Campus</span>
            <span className="sidebar-brand-sub">Resource Governance</span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="sidebar-nav-container">
        {!isCollapsed && (
          <div className="sidebar-section-title">
            {role} Workspace
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="user-avatar-sm">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-details">
              <span className="sidebar-user-name" title={currentUser?.full_name}>
                {currentUser?.full_name || 'Academic User'}
              </span>
              <span className="sidebar-user-role">
                {currentUser?.role || 'User'}
              </span>
            </div>
          )}
        </div>

        <button 
          onClick={logout}
          className="sidebar-nav-item" 
          style={{ color: 'var(--error-text)', marginTop: '4px' }}
          title={isCollapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
