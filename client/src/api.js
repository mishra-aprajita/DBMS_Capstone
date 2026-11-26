const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const api = async (path, opts = {}) => {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const endpoint = cleanPath.startsWith('/api') ? cleanPath : '/api' + cleanPath;
  const targetUrl = API_BASE ? `${API_BASE}${endpoint}` : endpoint;

  const r = await fetch(targetUrl, {
    ...opts, body: opts.body && JSON.stringify(opts.body),
    headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('uid') || '' },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
};
export const qs = (o) => { const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)).toString(); return s ? '?' + s : ''; };
export const toast = (m, t = 'ok') => window.dispatchEvent(new CustomEvent('toast', { detail: { m, t } }));
