import { useEffect } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard';
import { ManagementDashboard } from './pages/management/ManagementDashboard';
import { showToast } from './services/api';

function AppContent() {
  const { currentPath, navigate } = useRouter();
  const { currentUser, loading } = useAuth();

  // Root redirect logic
  useEffect(() => {
    if (loading) return;

    if (currentPath === '/' || currentPath === '') {
      if (currentUser?.role) {
        navigate(`/${currentUser.role.toLowerCase()}/dashboard`, { replace: true });
      } else {
        navigate('/login/student', { replace: true });
      }
    }
  }, [currentPath, currentUser, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--brand-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Smart Campus
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Loading institutional environment…
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Auth Routes
  if (currentPath.startsWith('/login')) {
    const roleMatch = currentPath.split('/')[2]?.toUpperCase();
    return <LoginPage initialRole={roleMatch || 'STUDENT'} />;
  }

  // Protected Dashboard Routes
  if (currentPath.includes('/dashboard')) {
    if (!currentUser) {
      const targetRole = currentPath.split('/')[1]?.toLowerCase() || 'student';
      navigate(`/login/${targetRole}`, { replace: true });
      return null;
    }

    const requestedRole = currentPath.split('/')[1]?.toUpperCase();
    const userRole = currentUser.role?.toUpperCase();

    // Role Guard: prevent unauthorized dashboard viewing
    if (requestedRole && requestedRole !== userRole) {
      showToast(`Privilege Notice: Redirecting from ${requestedRole} to your authorized ${userRole} portal.`, 'err');
      navigate(`/${userRole.toLowerCase()}/dashboard`, { replace: true });
      return null;
    }

    // Render verified role dashboard
    switch (userRole) {
      case 'STUDENT':
        return <StudentDashboard />;
      case 'FACULTY':
        return <FacultyDashboard />;
      case 'COORDINATOR':
        return <CoordinatorDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'MAINTENANCE':
        return <MaintenanceDashboard />;
      case 'MANAGEMENT':
        return <ManagementDashboard />;
      default:
        return <StudentDashboard />;
    }
  }

  // Fallback: render login
  return <LoginPage initialRole="STUDENT" />;
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}
