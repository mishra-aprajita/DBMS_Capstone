import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, ROLE_CONFIG } from '../services/authService';
import { showToast } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [isLiveApi, setIsLiveApi] = useState(true);

  // Initial user session verification
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { users, isLive } = await authService.getLoginUsers();
        if (!mounted) return;
        setAllUsers(users || []);
        setIsLiveApi(isLive);

        const activeUser = await authService.getCurrentUser();
        if (mounted) {
          setCurrentUser(activeUser);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          showToast(`Auth Init Notice: ${err.message}`, 'err');
        }
      }
    }

    initAuth();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password, requestedRole) => {
    setLoading(true);
    try {
      const result = await authService.authenticate(email, password, requestedRole);
      setCurrentUser(result.user);
      setIsLiveApi(result.isLive);
      showToast(`Welcome, ${result.user.full_name} (${result.user.role})`, 'ok');
      return result.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    showToast('You have been signed out safely.', 'ok');
  }, []);

  // Fast demo user switcher for professors / reviewers
  const switchDemoUser = useCallback(async (userId) => {
    localStorage.setItem('uid', String(userId));
    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        showToast(`Switched persona to ${user.full_name} [${user.role}]`, 'ok');
      }
      return user;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        allUsers,
        isLiveApi,
        login,
        logout,
        switchDemoUser,
        roleConfig: currentUser?.role ? ROLE_CONFIG[currentUser.role] : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
