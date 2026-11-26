import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../common/ToastContainer';

export function DashboardLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  roleTitle,
  searchQuery,
  onSearchChange,
  onOpenBookingModal
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 900) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          onTabChange(tab);
          setMobileOpen(false);
        }}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileOpen}
      />

      <div className="main-wrapper">
        <Topbar 
          onToggleSidebar={handleToggleSidebar}
          activeTab={activeTab}
          roleTitle={roleTitle}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenBookingModal={onOpenBookingModal}
        />

        <main className="main-content">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
