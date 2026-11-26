export const api = async (path, opts = {}) => {
  const r = await fetch('/api' + path, {
    ...opts, body: opts.body && JSON.stringify(opts.body),
    headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('uid') || '' },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
};
export const qs = (o) => { const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)).toString(); return s ? '?' + s : ''; };
export const toast = (m, t = 'ok') => window.dispatchEvent(new CustomEvent('toast', { detail: { m, t } }));
