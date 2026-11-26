// API communication layer with configurable Vercel backend URL
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const api = async (path, opts = {}) => {
  const token = localStorage.getItem('uid') || '';
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': token,
    ...(opts.headers || {})
  };

  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const endpoint = cleanPath.startsWith('/api') ? cleanPath : '/api' + cleanPath;
  const targetUrl = API_BASE ? `${API_BASE}${endpoint}` : endpoint;

  const response = await fetch(targetUrl, {
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, val]) => val !== '' && val != null);
  const search = new URLSearchParams(entries).toString();
  return search ? '?' + search : '';
};

export const showToast = (message, type = 'ok') => {
  window.dispatchEvent(new CustomEvent('campus-toast', { detail: { message, type } }));
};
