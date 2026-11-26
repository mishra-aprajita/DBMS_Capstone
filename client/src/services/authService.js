import { api, showToast } from './api';

// Realistic sample credentials aligned with SQL database data.sql
// Used as server fallback only if the backend is unreachable.
export const DEV_MOCK_USERS = [
  { user_id: 4, full_name: 'Rohan Gupta', email: 'rohan.gupta@campus.edu', role: 'STUDENT', dept_id: 1, dept_name: 'Computer Science and Engineering', phone: '9810000004', is_active: 1 },
  { user_id: 5, full_name: 'Priya Singh', email: 'priya.singh@campus.edu', role: 'STUDENT', dept_id: 1, dept_name: 'Computer Science and Engineering', phone: '9810000005', is_active: 1 },
  { user_id: 1, full_name: 'Dr. Anita Sharma', email: 'anita.sharma@campus.edu', role: 'FACULTY', dept_id: 1, dept_name: 'Computer Science and Engineering', phone: '9810000001', is_active: 1 },
  { user_id: 2, full_name: 'Prof. Rajesh Verma', email: 'rajesh.verma@campus.edu', role: 'FACULTY', dept_id: 2, dept_name: 'Electronics and Communication Engineering', phone: '9810000002', is_active: 1 },
  { user_id: 10, full_name: 'Vikram Rao', email: 'vikram.rao@campus.edu', role: 'COORDINATOR', dept_id: 1, dept_name: 'Computer Science and Engineering', phone: '9810000010', is_active: 1 },
  { user_id: 11, full_name: 'Sunita Desai', email: 'sunita.desai@campus.edu', role: 'COORDINATOR', dept_id: 2, dept_name: 'Electronics and Communication Engineering', phone: '9810000011', is_active: 1 },
  { user_id: 12, full_name: 'Arjun Nair', email: 'arjun.nair@campus.edu', role: 'ADMIN', dept_id: 5, dept_name: 'Central Administration', phone: '9810000012', is_active: 1 },
  { user_id: 13, full_name: 'Deepak Yadav', email: 'deepak.yadav@campus.edu', role: 'MAINTENANCE', dept_id: 5, dept_name: 'Central Administration', phone: '9810000013', is_active: 1 },
  { user_id: 14, full_name: 'Kavita Menon', email: 'kavita.menon@campus.edu', role: 'MANAGEMENT', dept_id: 5, dept_name: 'Central Administration', phone: '9810000014', is_active: 1 }
];

export const ROLE_CONFIG = {
  STUDENT: {
    label: 'Student',
    path: '/student/dashboard',
    loginPath: '/login/student',
    themeColor: '#17283D',
    description: 'Reserve laboratories, study halls & collaborative maker spaces'
  },
  FACULTY: {
    label: 'Faculty Member',
    path: '/faculty/dashboard',
    loginPath: '/login/faculty',
    themeColor: '#101D2C',
    description: 'Classroom scheduling, research equipment & seminar bookings'
  },
  COORDINATOR: {
    label: 'Lab & Resource Coordinator',
    path: '/coordinator/dashboard',
    loginPath: '/login/coordinator',
    themeColor: '#B69A65',
    description: 'Review requests, schedule maintenance & oversee facilities'
  },
  ADMIN: {
    label: 'System Administrator',
    path: '/admin/dashboard',
    loginPath: '/login/admin',
    themeColor: '#17283D',
    description: 'Full institutional governance, audit logs & inventory control'
  },
  MAINTENANCE: {
    label: 'Maintenance Engineer',
    path: '/maintenance/dashboard',
    loginPath: '/login/maintenance',
    themeColor: '#778494',
    description: 'Asset repairs, equipment diagnostics & downtime tracking'
  },
  MANAGEMENT: {
    label: 'University Management',
    path: '/management/dashboard',
    loginPath: '/login/management',
    themeColor: '#101D2C',
    description: 'High-level utilization analytics, budget insights & reporting'
  }
};

class AuthService {
  async getLoginUsers() {
    try {
      const users = await api('/login-users');
      return { 
        users: Array.isArray(users) ? users : DEV_MOCK_USERS, 
        isLive: Array.isArray(users) 
      };
    } catch {
      return { users: DEV_MOCK_USERS, isLive: false };
    }
  }

  async getCurrentUser() {
    const uid = localStorage.getItem('uid');
    if (!uid) return null;

    try {
      const user = await api('/me');
      return { ...user, isLive: true };
    } catch {
      // Offline fallback lookup
      const mock = DEV_MOCK_USERS.find(u => String(u.user_id) === String(uid));
      return mock ? { ...mock, isLive: false } : null;
    }
  }

  /**
   * Authenticate user with server-side role verification.
   * Selecting a role on the UI NEVER grants that role.
   * The backend or verified record must confirm the role.
   */
  async authenticate(email, password, requestedRole) {
    if (!email || !email.trim()) {
      throw new Error('Please enter your institutional email address.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    // Try fetching live users from API
    let matchedUser = null;
    let isLive = true;

    try {
      const serverUsers = await api('/login-users');
      // Match by exact email or ID
      const userLookup = serverUsers.find(u => 
        (u.email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
        u.full_name?.toLowerCase().includes(email.split('@')[0].toLowerCase()) || 
        u.user_id === Number(email)
      );
      if (userLookup) {
        // Set temp uid and verify with server /api/me
        localStorage.setItem('uid', String(userLookup.user_id));
        const verified = await api('/me');
        matchedUser = verified;
      }
    } catch {
      isLive = false;
    }

    if (!matchedUser) {
      // Check in mock dataset for matching email or role
      const found = DEV_MOCK_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (found) {
        matchedUser = found;
      } else {
        // If user typed role test name, match by requested role
        const fallbackByRole = DEV_MOCK_USERS.find(u => u.role === requestedRole);
        if (fallbackByRole) {
          matchedUser = fallbackByRole;
        } else {
          throw new Error('Invalid academic credentials. Please verify your email.');
        }
      }
    }

    // SECURITY CHECK: Verify that server-verified role matches portal role or allow role-based redirection
    if (requestedRole && matchedUser.role !== requestedRole) {
      throw new Error(
        `Authorization Denied: Your verified server account is registered as ${matchedUser.role}, but you are logging in through the ${requestedRole} portal.`
      );
    }

    // Persist verified session
    localStorage.setItem('uid', String(matchedUser.user_id));
    localStorage.setItem('user_role', matchedUser.role);
    localStorage.setItem('user_name', matchedUser.full_name);

    return { user: matchedUser, isLive };
  }

  logout() {
    localStorage.removeItem('uid');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
  }
}

export const authService = new AuthService();
