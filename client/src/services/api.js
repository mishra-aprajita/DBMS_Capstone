// API communication layer
export const api = async (path, opts = {}) => {
  const token = localStorage.getItem('uid') || '';
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': token,
    ...(opts.headers || {})
  };

  const response = await fetch('/api' + path, {
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
