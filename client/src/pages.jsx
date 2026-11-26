import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Boxes, CalendarCheck, Clock, CheckCircle2, Users as UsersIcon, Wrench, Plus, X } from 'lucide-react';
import { api, qs, toast } from './api';

export const ANALYTICS_ROLES = ['ADMIN', 'COORDINATOR', 'MANAGEMENT'];
const COLORS = ['#4f46e5', '#0d9488', '#f59e0b', '#ef4444', '#64748b', '#0ea5e9'];
const fmt = (s) => (s ? s.slice(0, 16) : '—');

// ---------- small shared pieces ----------
function useData(path) {
  const [s, set] = useState({}); const [n, setN] = useState(0);
  useEffect(() => {
    let on = true; set((x) => ({ data: x.data }));
    api(path).then((data) => on && set({ data })).catch((e) => on && set({ error: e.message }));
    return () => { on = false; };
  }, [path, n]);
  return { ...s, reload: () => setN(n + 1) };
}
const Async = ({ d, children }) => d.error ? <div className="state err">{d.error}</div> : !d.data ? <div className="state">Loading…</div> : children(d.data);
const Badge = ({ v }) => <span className={'badge ' + String(v).toLowerCase()}>{String(v).replace('_', ' ')}</span>;
const Table = ({ cols, rows }) => rows.length
  ? <div className="tw"><table><thead><tr>{cols.map((c) => <th key={c[0]}>{c[0]}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c[0]}>{c[1](r)}</td>)}</tr>)}</tbody></table></div>
  : <div className="state">No records found</div>;
function usePager(rows, size = 10) {
  const [p, setP] = useState(0); useEffect(() => setP(0), [rows.length]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  return { slice: rows.slice(p * size, p * size + size), ui: <div className="pager"><span>{rows.length} records</span><button className="btn ghost sm" disabled={p === 0} onClick={() => setP(p - 1)}>Prev</button><span>Page {p + 1} / {pages}</span><button className="btn ghost sm" disabled={p >= pages - 1} onClick={() => setP(p + 1)}>Next</button></div> };
}
const Modal = ({ title, onClose, children }) => <div className="ov" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><h2>{title}<button className="ico" onClick={onClose}><X size={18} /></button></h2>{children}</div></div>;
const Fld = ({ l, children }) => <label className="fld"><span>{l}</span>{children}</label>;
const Sel = ({ v, set, opts, ph }) => <select value={v} onChange={(e) => set(e.target.value)}><option value="">{ph}</option>{opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>;
const Page = ({ title, action, children }) => <><div className="bar" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>{title}</h1>{action}</div>{children}</>;
async function run(fn, ok, after) { try { await fn(); toast(ok); after?.(); } catch (e) { toast(e.message, 'err'); } }
const ROLES = ['STUDENT', 'FACULTY', 'COORDINATOR', 'ADMIN', 'MAINTENANCE', 'MANAGEMENT'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
const RSTAT = ['AVAILABLE', 'UNDER_MAINTENANCE', 'RETIRED'];
const opt = (a) => a.map((x) => [x, x.replace('_', ' ')]);

// ---------- charts ----------
const norm = (arr = []) => (arr || []).map((d) => ({ ...d, value: Number(d.value) || 0 }));
const Card = ({ title, children }) => (
  <div className="card">
    <h3>{title}</h3>
    <div className="chart" style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  </div>
);
const Donut = ({ data }) => {
  const rows = norm(data);
  return (
    <PieChart>
      <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
        {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
};
const Hbar = ({ data, color, vertical }) => {
  const rows = norm(data);
  return (
    <BarChart data={rows} layout={vertical ? 'vertical' : 'horizontal'}>
      <CartesianGrid strokeDasharray="3 3" />
      {vertical ? (
        <>
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={130} />
        </>
      ) : (
        <>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
        </>
      )}
      <Tooltip />
      <Bar dataKey="value" fill={color} />
    </BarChart>
  );
};
function Charts({ a }) {
  return (
    <div className="grid2">
      <Card title="Monthly booking trend">
        <LineChart data={a.monthly}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line dataKey="bookings" stroke="#4f46e5" strokeWidth={2} />
        </LineChart>
      </Card>
      <Card title="Booking status distribution"><Donut data={a.status} /></Card>
      <Card title="Most booked resources"><Hbar data={a.top} color="#0d9488" vertical /></Card>
      <Card title="Bookings by department"><Hbar data={a.byDept} color="#4f46e5" /></Card>
      <Card title="Resource availability"><Donut data={a.resStatus} /></Card>
    </div>
  );
}
// ---------- pages ----------
export function Dashboard({ me }) {
  const s = useData('/dashboard'); const a = useData(ANALYTICS_ROLES.includes(me.role) ? '/analytics' : '/lookups');
  const cards = [['Total Resources', 'resources', Boxes], ['Total Bookings', 'bookings', CalendarCheck], ['Pending Bookings', 'pending', Clock], ['Approved Bookings', 'approved', CheckCircle2], ['Total Users', 'users', UsersIcon], ['Under Maintenance', 'maintenance', Wrench]];
  return <Page title="Dashboard"><Async d={s}>{(d) => <div className="cards">{cards.map(([t, k, I]) => <div className="card stat" key={k}><div><small>{t}</small><b>{d[k]}</b></div><i><I size={20} /></i></div>)}</div>}</Async>
    {ANALYTICS_ROLES.includes(me.role) ? <Async d={a}>{(d) => <Charts a={d} />}</Async> : <div className="state">Charts are available to Admin, Coordinator and Management roles.</div>}</Page>;
}

function BookingForm({ lk, onDone }) {
  const [f, setF] = useState({ purpose: '', start: '', end: '', resource_ids: [] }); const [busy, setBusy] = useState(false);
  const tog = (id) => setF({ ...f, resource_ids: f.resource_ids.includes(id) ? f.resource_ids.filter((x) => x !== id) : [...f.resource_ids, id] });
  const submit = async () => { setBusy(true); await run(() => api('/bookings', { method: 'POST', body: f }), 'Booking requested (pending approval)', onDone); setBusy(false); };
  return <>
    <Fld l="Purpose"><input value={f.purpose} maxLength={200} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></Fld>
    <Fld l="Start"><input type="datetime-local" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Fld>
    <Fld l="End"><input type="datetime-local" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Fld>
    <Fld l="Resources (available only)"><div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 8, padding: 8 }}>
      {lk.resources.filter((r) => r.status === 'AVAILABLE').map((r) => <label className="chk" key={r.resource_id}><input type="checkbox" checked={f.resource_ids.includes(r.resource_id)} onChange={() => tog(r.resource_id)} /> {r.resource_name} ({r.resource_code})</label>)}</div></Fld>
    <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Checking…' : 'Submit request'}</button></>;
}

export function Bookings({ me, initialQ }) {
  const [f, setF] = useState({ search: initialQ || '', status: '', dept: '', date: '' }); const set = (k) => (v) => setF({ ...f, [k]: v });
  const d = useData('/bookings' + qs(f)); const lk = useData('/lookups'); const [sel, setSel] = useState(); const [nw, setNw] = useState(false);
  const rows = d.data || []; const pg = usePager(rows);
  const cancel = (b) => { const reason = window.prompt('Reason for cancelling?'); if (reason !== null) run(() => api(`/bookings/${b.booking_id}/cancel`, { method: 'PATCH', body: { reason } }), 'Booking cancelled', d.reload); };
  const canCancel = (b) => ['PENDING', 'APPROVED'].includes(b.status) && (b.user_id === me.user_id || ['ADMIN', 'COORDINATOR'].includes(me.role));
  return <Page title="Bookings" action={<button className="btn" onClick={() => setNw(true)}><Plus size={16} />New booking</button>}>
    <div className="bar"><input placeholder="Search purpose, user, resource" value={f.search} onChange={(e) => set('search')(e.target.value)} />
      <Sel v={f.status} set={set('status')} opts={opt(STATUSES)} ph="All statuses" />
      <Sel v={f.dept} set={set('dept')} opts={(lk.data?.departments || []).map((x) => [x.dept_id, x.dept_name])} ph="All departments" />
      <input type="date" value={f.date} onChange={(e) => set('date')(e.target.value)} /></div>
    <Async d={d}>{() => <><Table rows={pg.slice} cols={[['ID', (b) => b.booking_id], ['User', (b) => b.user], ['Department', (b) => b.department], ['Resource', (b) => b.resources], ['Purpose', (b) => b.purpose], ['Start', (b) => fmt(b.start_time)], ['End', (b) => fmt(b.end_time)], ['Status', (b) => <Badge v={b.status} />],
      ['Actions', (b) => <><button className="btn ghost sm" onClick={() => setSel(b)}>View</button>{canCancel(b) && <button className="btn no sm" onClick={() => cancel(b)}>Cancel</button>}</>]]} />{pg.ui}</>}</Async>
    {sel && <Modal title={`Booking #${sel.booking_id}`} onClose={() => setSel()}>{[['Booked by', sel.user], ['Department', sel.department], ['Resources', sel.resources], ['Purpose', sel.purpose], ['Start', fmt(sel.start_time)], ['End', fmt(sel.end_time)]].map(([k, v]) => <p key={k}><b>{k}:</b> {v}</p>)}<Badge v={sel.status} /></Modal>}
    {nw && lk.data && <Modal title="New booking" onClose={() => setNw(false)}><BookingForm lk={lk.data} onDone={() => { setNw(false); d.reload(); lk.reload(); }} /></Modal>}
  </Page>;
}

export function Approvals({ me }) {
  const [st, setSt] = useState('PENDING'); const d = useData('/approvals' + qs({ status: st })); const can = ['COORDINATOR', 'ADMIN'].includes(me.role);
  const decide = (b, decision) => { const remarks = window.prompt('Remarks (optional)'); if (remarks !== null) run(() => api(`/approvals/${b.booking_id}`, { method: 'POST', body: { decision, remarks } }), `Booking ${decision.toLowerCase()}`, d.reload); };
  return <Page title="Approvals"><div className="bar"><Sel v={st} set={setSt} opts={opt(STATUSES)} ph="All statuses" /></div>
    <Async d={d}>{(rows) => <Table rows={rows} cols={[['ID', (b) => b.booking_id], ['Requester', (b) => `${b.user} (${b.department})`], ['Resource', (b) => b.resources], ['Purpose', (b) => b.purpose], ['Start', (b) => fmt(b.start_time)], ['End', (b) => fmt(b.end_time)], ['Status', (b) => <Badge v={b.status} />], ['Decision', (b) => b.approver ? `${b.approver}${b.remarks ? ': ' + b.remarks : ''}` : '—'],
      ['Actions', (b) => b.status === 'PENDING' && can ? <><button className="btn ok sm" onClick={() => decide(b, 'APPROVED')}>Approve</button><button className="btn no sm" onClick={() => decide(b, 'REJECTED')}>Reject</button></> : '—']]} />}</Async></Page>;
}

function ResourceForm({ lk, onDone }) {
  const [f, setF] = useState({ resource_code: '', resource_name: '', type_id: '', location_id: '', coordinator_id: '', capacity: 1, purchase_date: '' }); const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return <><Fld l="Code"><input value={f.resource_code} onChange={s('resource_code')} /></Fld><Fld l="Name"><input value={f.resource_name} onChange={s('resource_name')} /></Fld>
    <Fld l="Type"><Sel v={f.type_id} set={(v) => setF({ ...f, type_id: v })} ph="Select" opts={lk.types.map((x) => [x.type_id, x.type_name])} /></Fld>
    <Fld l="Location"><Sel v={f.location_id} set={(v) => setF({ ...f, location_id: v })} ph="Select" opts={lk.locations.map((x) => [x.location_id, x.name])} /></Fld>
    <Fld l="Coordinator"><Sel v={f.coordinator_id} set={(v) => setF({ ...f, coordinator_id: v })} ph="Select" opts={lk.coordinators.map((x) => [x.user_id, x.full_name])} /></Fld>
    <Fld l="Capacity"><input type="number" min="1" value={f.capacity} onChange={s('capacity')} /></Fld><Fld l="Purchase date"><input type="date" value={f.purchase_date} onChange={s('purchase_date')} /></Fld>
    <button className="btn" onClick={() => run(() => api('/resources', { method: 'POST', body: f }), 'Resource added', onDone)}>Add resource</button></>;
}
export function Resources({ me }) {
  const [f, setF] = useState({ search: '', type: '', status: '', location: '' }); const set = (k) => (v) => setF({ ...f, [k]: v });
  const d = useData('/resources' + qs(f)); const lk = useData('/lookups'); const [nw, setNw] = useState(false); const L = lk.data || { types: [], locations: [] };
  const rows = d.data || []; const pg = usePager(rows); const canSet = ['ADMIN', 'COORDINATOR'].includes(me.role);
  return <Page title="Resources" action={me.role === 'ADMIN' && <button className="btn" onClick={() => setNw(true)}><Plus size={16} />Add resource</button>}>
    <div className="bar"><input placeholder="Search name or code" value={f.search} onChange={(e) => set('search')(e.target.value)} /><Sel v={f.type} set={set('type')} ph="All types" opts={L.types.map((x) => [x.type_id, x.type_name])} />
      <Sel v={f.status} set={set('status')} ph="All statuses" opts={opt(RSTAT)} /><Sel v={f.location} set={set('location')} ph="All locations" opts={L.locations.map((x) => [x.location_id, x.name])} /></div>
    <Async d={d}>{() => <><Table rows={pg.slice} cols={[['Name', (r) => r.resource_name], ['Code', (r) => r.resource_code], ['Type', (r) => r.type_name], ['Location', (r) => r.location], ['Capacity', (r) => r.capacity], ['Coordinator', (r) => r.coordinator], ['Status', (r) => <Badge v={r.status} />],
      ['Update status', (r) => canSet ? <select value={r.status} onChange={(e) => run(() => api(`/resources/${r.resource_id}/status`, { method: 'PATCH', body: { status: e.target.value } }), 'Status updated', d.reload)}>{opt(RSTAT).map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select> : '—']]} />{pg.ui}</>}</Async>
    {nw && lk.data && <Modal title="Add resource" onClose={() => setNw(false)}><ResourceForm lk={lk.data} onDone={() => { setNw(false); d.reload(); }} /></Modal>}</Page>;
}

export function UsersPage() {
  const [f, setF] = useState({ search: '', role: '', dept: '' }); const set = (k) => (v) => setF({ ...f, [k]: v });
  const d = useData('/users' + qs(f)); const lk = useData('/lookups'); const rows = d.data || []; const pg = usePager(rows);
  return <Page title="Users"><div className="bar"><input placeholder="Search name or email" value={f.search} onChange={(e) => set('search')(e.target.value)} /><Sel v={f.role} set={set('role')} ph="All roles" opts={opt(ROLES)} />
    <Sel v={f.dept} set={set('dept')} ph="All departments" opts={(lk.data?.departments || []).map((x) => [x.dept_id, x.dept_name])} /></div>
    <Async d={d}>{() => <><Table rows={pg.slice} cols={[['Name', (u) => u.full_name], ['Email', (u) => u.email], ['Phone', (u) => u.phone || '—'], ['Department', (u) => u.dept_name], ['Role', (u) => <Badge v={u.role} />], ['Active', (u) => <span className={'badge ' + (u.is_active ? 'yes' : 'no')}>{u.is_active ? 'Active' : 'Inactive'}</span>]]} />{pg.ui}</>}</Async></Page>;
}
export function Departments() {
  const d = useData('/departments');
  return <Page title="Departments"><Async d={d}>{(rows) => <Table rows={rows} cols={[['Code', (x) => x.dept_code], ['Name', (x) => x.dept_name], ['Users', (x) => x.users], ['Bookings', (x) => x.bookings], ['Approved', (x) => x.approved]]} />}</Async></Page>;
}

export function Maintenance({ me }) {
  const d = useData('/maintenance'); const lk = useData('/lookups'); const [nw, setNw] = useState(false); const [f, setF] = useState({ resource_id: '', issue_description: '' });
  const can = ['ADMIN', 'COORDINATOR', 'MAINTENANCE'].includes(me.role);
  const upd = (m, status) => { const cost = status === 'COMPLETED' ? window.prompt('Repair cost (leave blank if none)') : ''; if (cost !== null) run(() => api(`/maintenance/${m.maintenance_id}`, { method: 'PATCH', body: { status, cost } }), 'Maintenance updated', () => { d.reload(); lk.reload(); }); };
  return <Page title="Maintenance" action={can && <button className="btn" onClick={() => setNw(true)}><Plus size={16} />Report issue</button>}>
    <Async d={d}>{(rows) => <Table rows={rows} cols={[['Resource', (m) => `${m.resource_name} (${m.resource_code})`], ['Issue', (m) => m.issue_description], ['Reported by', (m) => m.reported_by], ['Start', (m) => fmt(m.start_time)], ['End', (m) => fmt(m.end_time)], ['Status', (m) => <Badge v={m.status} />], ['Cost', (m) => m.cost ?? '—'],
      ['Actions', (m) => can && m.status === 'SCHEDULED' ? <button className="btn sm" onClick={() => upd(m, 'IN_PROGRESS')}>Start</button> : can && m.status === 'IN_PROGRESS' ? <button className="btn ok sm" onClick={() => upd(m, 'COMPLETED')}>Complete</button> : '—']]} />}</Async>
    {nw && lk.data && <Modal title="Report maintenance issue" onClose={() => setNw(false)}><Fld l="Resource"><Sel v={f.resource_id} set={(v) => setF({ ...f, resource_id: v })} ph="Select" opts={lk.data.resources.map((r) => [r.resource_id, r.resource_name])} /></Fld>
      <Fld l="Issue"><textarea rows={3} value={f.issue_description} onChange={(e) => setF({ ...f, issue_description: e.target.value })} /></Fld>
      <button className="btn" onClick={() => run(() => api('/maintenance', { method: 'POST', body: f }), 'Issue reported', () => { setNw(false); d.reload(); lk.reload(); })}>Submit</button></Modal>}</Page>;
}

export function Analytics() {
  const [f, setF] = useState({ from: '', to: '', dept: '' }); const lk = useData('/lookups'); const d = useData('/analytics' + qs(f));
  return <Page title="Analytics"><div className="bar"><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
    <Sel v={f.dept} set={(v) => setF({ ...f, dept: v })} ph="All departments" opts={(lk.data?.departments || []).map((x) => [x.dept_id, x.dept_name])} /></div>
    <Async d={d}>{(a) => <><Charts a={a} /><div className="grid2"><Card title="Peak booking hours (start hour)"><Hbar data={a.peak.map((p) => ({ name: p.hour + ':00', value: p.value }))} color="#f59e0b" /></Card>
      <div className="card"><h3>Resource utilization (approved + completed hours)</h3><Table rows={a.util} cols={[['Resource', (r) => r.resource_name], ['Hours booked', (r) => r.hours]]} /></div>
      <div className="card"><h3>Resources never booked</h3><Table rows={a.unused} cols={[['Code', (r) => r.resource_code], ['Name', (r) => r.resource_name]]} /></div></div></>}</Async></Page>;
}

export function Settings({ me }) {
  const d = useData(me.role === 'ADMIN' ? '/audit' : '/me');
  return <Page title="Settings"><div className="card" style={{ marginBottom: 14 }}><h3>Current session</h3><p>{me.full_name} · <Badge v={me.role} /></p><p className="role">Demo mode: switch user from the top bar. Roles are read from the database and enforced by the API on every request.</p></div>
    {me.role === 'ADMIN' && <div className="card"><h3>Booking audit log (booking_audit)</h3><Async d={d}>{(rows) => <Table rows={rows} cols={[['#', (r) => r.audit_id], ['Booking', (r) => r.booking_id], ['Action', (r) => r.action_type], ['Time', (r) => fmt(r.action_time)]]} />}</Async></div>}</Page>;
}
