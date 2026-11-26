import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarCheck, Boxes, Users, Building2, ClipboardCheck, Wrench, BarChart3, Settings as Cog, Menu, Search } from 'lucide-react';
import { api } from './api';
import { Dashboard, Bookings, Approvals, Resources, UsersPage, Departments, Maintenance, Analytics, Settings, ANALYTICS_ROLES } from './pages';

const NAV = [
  ['Dashboard', LayoutDashboard, Dashboard], ['Bookings', CalendarCheck, Bookings], ['Resources', Boxes, Resources],
  ['Users', Users, UsersPage, ANALYTICS_ROLES], ['Departments', Building2, Departments],
  ['Approvals', ClipboardCheck, Approvals, ANALYTICS_ROLES], ['Maintenance', Wrench, Maintenance, ['ADMIN', 'COORDINATOR', 'MAINTENANCE', 'MANAGEMENT']],
  ['Analytics', BarChart3, Analytics, ANALYTICS_ROLES], ['Settings', Cog, Settings],
];

export default function App() {
  const [users, setUsers] = useState([]); const [uid, setUid] = useState(localStorage.getItem('uid') || '');
  const [me, setMe] = useState(); const [page, setPage] = useState('Dashboard'); const [col, setCol] = useState(false); const [open, setOpen] = useState(false);
  const [q, setQ] = useState(''); const [bq, setBq] = useState(''); const [toast, setToast] = useState();

  useEffect(() => { api('/login-users').then((u) => { setUsers(u); if (!uid) { const a = u.find((x) => x.role === 'ADMIN') || u[0]; localStorage.setItem('uid', a.user_id); setUid(String(a.user_id)); } }).catch((e) => setToast({ m: 'Cannot reach API: ' + e.message, t: 'err' })); }, []);
  useEffect(() => { if (uid) api('/me').then(setMe).catch(() => { localStorage.removeItem('uid'); setUid(''); }); }, [uid]);
  useEffect(() => { const h = (e) => { setToast(e.detail); setTimeout(() => setToast(), 3500); }; window.addEventListener('toast', h); return () => window.removeEventListener('toast', h); }, []);

  const allowed = NAV.filter((n) => !n[3] || (me && n[3].includes(me.role)));
  const cur = allowed.find((n) => n[0] === page) || allowed[0]; const Cur = cur?.[2];
  const go = (name) => { setPage(name); setOpen(false); };
  const switchUser = (v) => { localStorage.setItem('uid', v); setUid(v); setPage('Dashboard'); };

  return <div className="app">
    <aside className={'side' + (col ? ' col' : '') + (open ? ' open' : '')}>
      <div className="brand"><Building2 /><span>Smart Campus</span></div>
      {allowed.map(([name, Icon]) => <button key={name} className={'nav' + (cur?.[0] === name ? ' on' : '')} onClick={() => go(name)}><Icon size={18} /><span className="lbl">{name}</span></button>)}
    </aside>
    <div className="main">
      <header className="top">
        <button className="ico" onClick={() => (window.innerWidth < 800 ? setOpen(!open) : setCol(!col))}><Menu size={20} /></button>
        <form className="search" onSubmit={(e) => { e.preventDefault(); setBq(q); go('Bookings'); }}><Search size={16} /><input placeholder="Search bookings…" value={q} onChange={(e) => setQ(e.target.value)} /></form>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <select value={uid} onChange={(e) => switchUser(e.target.value)}>{users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} — {u.role}</option>)}</select>
          <div className="role">Demo user switcher</div></div>
      </header>
      <main className="content">{me && Cur ? <Cur key={uid + cur[0] + (cur[0] === 'Bookings' ? bq : '')} me={me} initialQ={bq} /> : <div className="state">Loading…</div>}</main>
    </div>
    {toast && <div className={'toast' + (toast.t === 'err' ? ' err' : '')}>{toast.m}</div>}
  </div>;
}
