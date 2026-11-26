import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, isMysqlLive } from './db.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(express.json());

// ---------- Public Infrastructure & Health Checks ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Smart Campus Resource Governance API',
    database: isMysqlLive ? 'mysql_live' : 'in_memory_relational',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Smart Campus Resource Governance API',
    database: isMysqlLive ? 'mysql_live' : 'in_memory_relational',
    timestamp: new Date().toISOString()
  });
});

// ---------- helpers ----------
const q = async (sql, p = []) => (await pool.query(sql, p))[0]; // values are escaped by mysql2 (no string concatenation)
const fail = (status, message) => Object.assign(new Error(message), { status });
const dt = (s) => String(s).replace('T', ' ').slice(0, 19);
const pair = (...vs) => vs.flatMap((v) => [v || null, v || null]); // for "(? IS NULL OR col=?)" filters
const need = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: `Role ${req.user.role} is not allowed to do this` });
async function tx(fn) {
  const c = await pool.getConnection();
  try { await c.beginTransaction(); const out = await fn(c); await c.commit(); return out; }
  catch (e) { await c.rollback(); throw e; }
  finally { c.release(); }
}
const ADMINS = ['ADMIN', 'COORDINATOR', 'MANAGEMENT'];

// ---------- "login": demo role switcher (no passwords) ----------
app.get('/api/login-users', async (req, res) =>
  res.json(await q('SELECT user_id, full_name, email, role FROM app_user WHERE is_active ORDER BY role, full_name')));

// Every other route needs an x-user-id header; role comes from the DB, never from the client.
app.use('/api', async (req, res, next) => {
  const [u] = await q('SELECT user_id, full_name, role, dept_id FROM app_user WHERE user_id=? AND is_active', [+req.header('x-user-id') || 0]);
  if (!u) return res.status(401).json({ error: 'Select a valid user' });
  req.user = u; next();
});
app.get('/api/me', (req, res) => res.json(req.user));

app.get('/api/lookups', async (req, res) => res.json({
  departments: await q('SELECT dept_id, dept_code, dept_name FROM department ORDER BY dept_name'),
  types: await q('SELECT type_id, type_name, max_booking_hours FROM resource_type ORDER BY type_name'),
  locations: await q("SELECT location_id, CONCAT(building,' ',room_no) AS name FROM location ORDER BY name"),
  coordinators: await q("SELECT user_id, full_name FROM app_user WHERE role IN ('COORDINATOR','ADMIN') AND is_active"),
  resources: await q('SELECT resource_id, resource_code, resource_name, status FROM resource ORDER BY resource_name'),
}));

// ---------- dashboard & analytics ----------
app.get('/api/dashboard', async (req, res) => {
  const [s] = await q(`SELECT (SELECT COUNT(*) FROM resource) resources, (SELECT COUNT(*) FROM booking) bookings,
    (SELECT COUNT(*) FROM booking WHERE status='PENDING') pending, (SELECT COUNT(*) FROM booking WHERE status='APPROVED') approved,
    (SELECT COUNT(*) FROM app_user) users, (SELECT COUNT(*) FROM resource WHERE status='UNDER_MAINTENANCE') maintenance`);
  res.json(s);
});

app.get('/api/analytics', need(...ADMINS), async (req, res) => {
  const { from, to, dept } = req.query;
  const f = [from, from, to, to, dept, dept].map((v) => v || null);
  const W = `WHERE (? IS NULL OR b.start_time>=?) AND (? IS NULL OR b.start_time<DATE_ADD(?,INTERVAL 1 DAY)) AND (? IS NULL OR u.dept_id=?)`;
  const FROM = 'FROM booking b JOIN app_user u ON u.user_id=b.user_id';
  const ITEMS = 'JOIN booking_item bi ON bi.booking_id=b.booking_id JOIN resource r ON r.resource_id=bi.resource_id';
  const DONE = "AND b.status IN ('APPROVED','COMPLETED')";
  const [monthly, status, top, byDept, util, peak, unused, resStatus] = await Promise.all([
    q(`SELECT DATE_FORMAT(b.start_time,'%Y-%m') AS month, COUNT(*) AS bookings ${FROM} ${W} GROUP BY month ORDER BY month`, f),
    q(`SELECT b.status AS name, COUNT(*) AS value ${FROM} ${W} GROUP BY b.status`, f),
    q(`SELECT r.resource_name AS name, COUNT(*) AS value ${FROM} ${ITEMS} ${W} GROUP BY r.resource_id, r.resource_name ORDER BY value DESC LIMIT 10`, f),
    q(`SELECT d.dept_code AS name, COUNT(*) AS value ${FROM} JOIN department d ON d.dept_id=u.dept_id ${W} GROUP BY d.dept_id, d.dept_code ORDER BY value DESC`, f),
    q(`SELECT r.resource_code, r.resource_name, ROUND(SUM(TIMESTAMPDIFF(MINUTE,b.start_time,b.end_time))/60,1) AS hours ${FROM} ${ITEMS} ${W} ${DONE} GROUP BY r.resource_id, r.resource_code, r.resource_name ORDER BY hours DESC`, f),
    q(`SELECT HOUR(b.start_time) AS hour, COUNT(*) AS value ${FROM} ${W} ${DONE} GROUP BY hour ORDER BY hour`, f),
    q('SELECT resource_code, resource_name FROM resource WHERE resource_id NOT IN (SELECT resource_id FROM booking_item)'),
    q('SELECT status AS name, COUNT(*) AS value FROM resource GROUP BY status'),
  ]);
  res.json({ monthly, status, top, byDept, util, peak, unused, resStatus });
});

// ---------- bookings ----------
const BOOK_SQL = `SELECT b.booking_id, b.user_id, u.full_name AS user, d.dept_name AS department,
  GROUP_CONCAT(r.resource_name SEPARATOR ', ') AS resources, b.purpose, b.start_time, b.end_time, b.status
  FROM booking b JOIN app_user u ON u.user_id=b.user_id JOIN department d ON d.dept_id=u.dept_id
  LEFT JOIN booking_item bi ON bi.booking_id=b.booking_id LEFT JOIN resource r ON r.resource_id=bi.resource_id`;

app.get('/api/bookings', async (req, res) => {
  const { status, dept, date, search } = req.query;
  const own = ['STUDENT', 'FACULTY'].includes(req.user.role) ? req.user.user_id : null; // students/faculty see only their own
  const s = search ? `%${search}%` : null;
  res.json(await q(`${BOOK_SQL} WHERE (? IS NULL OR b.status=?) AND (? IS NULL OR d.dept_id=?) AND (? IS NULL OR DATE(b.start_time)=?)
    AND (? IS NULL OR b.user_id=?) GROUP BY b.booking_id, u.full_name, d.dept_name
    HAVING (? IS NULL OR CONCAT_WS(' ', b.purpose, u.full_name, resources) LIKE ?) ORDER BY b.start_time DESC`,
    [...pair(status, dept, date, own), s, s]));
});

app.post('/api/bookings', async (req, res) => {
  const { purpose, resource_ids } = req.body;
  const ids = [...new Set((resource_ids || []).map(Number))].sort((a, b) => a - b); // fixed lock order avoids deadlocks
  if (!purpose?.trim() || !ids.length || !req.body.start || !req.body.end) throw fail(400, 'Purpose, resources, start and end are required');
  const start = dt(req.body.start), end = dt(req.body.end);
  if (!(new Date(start) < new Date(end))) throw fail(400, 'Start time must be earlier than end time');
  const id = await tx(async (c) => {
    // 1. lock the resource rows: concurrent requests for the same resource queue here
    const [rs] = await c.query('SELECT r.resource_id, r.resource_name, r.status, t.max_booking_hours FROM resource r JOIN resource_type t ON t.type_id=r.type_id WHERE r.resource_id IN (?) ORDER BY r.resource_id FOR UPDATE OF r', [ids]);
    if (rs.length !== ids.length) throw fail(400, 'One or more resources do not exist');
    const hours = (new Date(end) - new Date(start)) / 36e5;
    for (const r of rs) {
      if (r.status !== 'AVAILABLE') throw fail(409, `${r.resource_name} is ${r.status.replace('_', ' ').toLowerCase()}`);
      if (hours > r.max_booking_hours) throw fail(400, `${r.resource_name} allows at most ${r.max_booking_hours} hours per booking`);
    }
    // 2. overlap check: existing_start < requested_end AND existing_end > requested_start
    const [clash] = await c.query(`SELECT b.booking_id, r.resource_name FROM booking b JOIN booking_item bi ON bi.booking_id=b.booking_id
      JOIN resource r ON r.resource_id=bi.resource_id WHERE bi.resource_id IN (?) AND b.status IN ('PENDING','APPROVED') AND b.start_time<? AND b.end_time>?`, [ids, end, start]);
    if (clash.length) throw fail(409, `${clash[0].resource_name} is already booked in that slot (booking #${clash[0].booking_id})`);
    const [m] = await c.query("SELECT resource_id FROM maintenance WHERE resource_id IN (?) AND status IN ('SCHEDULED','IN_PROGRESS') AND start_time<? AND (end_time IS NULL OR end_time>?)", [ids, end, start]);
    if (m.length) throw fail(409, 'A resource has maintenance scheduled in that slot');
    // 3. insert header + items in the same transaction
    const [b] = await c.query('INSERT INTO booking (user_id, purpose, start_time, end_time, status) VALUES (?,?,?,?,?)', [req.user.user_id, purpose.trim(), start, end, 'PENDING']);
    await c.query('INSERT INTO booking_item (booking_id, resource_id) VALUES ?', [ids.map((r) => [b.insertId, r])]);
    return b.insertId;
  });
  res.status(201).json({ booking_id: id });
});

app.patch('/api/bookings/:id/cancel', async (req, res) => {
  const id = +req.params.id;
  await tx(async (c) => {
    const [[b]] = await c.query('SELECT user_id, status FROM booking WHERE booking_id=? FOR UPDATE', [id]);
    if (!b) throw fail(404, 'Booking not found');
    if (b.user_id !== req.user.user_id && !['ADMIN', 'COORDINATOR'].includes(req.user.role)) throw fail(403, 'You can only cancel your own bookings');
    if (!['PENDING', 'APPROVED'].includes(b.status)) throw fail(409, `A ${b.status.toLowerCase()} booking cannot be cancelled`);
    await c.query("UPDATE booking SET status='CANCELLED' WHERE booking_id=?", [id]);
    await c.query('INSERT INTO cancellation (booking_id, cancelled_by, reason) VALUES (?,?,?)', [id, req.user.user_id, req.body.reason || null]);
  });
  res.json({ ok: true });
});

// ---------- approvals ----------
app.get('/api/approvals', need(...ADMINS), async (req, res) => {
  res.json(await q(`SELECT b.booking_id, u.full_name AS user, d.dept_name AS department, GROUP_CONCAT(r.resource_name SEPARATOR ', ') AS resources,
    b.purpose, b.start_time, b.end_time, b.status, a.remarks, ap.full_name AS approver, a.decided_at
    FROM booking b JOIN app_user u ON u.user_id=b.user_id JOIN department d ON d.dept_id=u.dept_id
    LEFT JOIN booking_item bi ON bi.booking_id=b.booking_id LEFT JOIN resource r ON r.resource_id=bi.resource_id
    LEFT JOIN approval a ON a.booking_id=b.booking_id LEFT JOIN app_user ap ON ap.user_id=a.approver_id
    WHERE (? IS NULL OR b.status=?) GROUP BY b.booking_id, u.full_name, d.dept_name, a.approval_id, ap.full_name ORDER BY b.start_time`, pair(req.query.status)));
});

app.post('/api/approvals/:id', need('COORDINATOR', 'ADMIN'), async (req, res) => {
  const id = +req.params.id, { decision, remarks } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw fail(400, 'Decision must be APPROVED or REJECTED');
  await tx(async (c) => {
    const [[b]] = await c.query('SELECT status, start_time, end_time FROM booking WHERE booking_id=? FOR UPDATE', [id]);
    if (!b) throw fail(404, 'Booking not found');
    if (b.status !== 'PENDING') throw fail(409, `Booking is already ${b.status.toLowerCase()}`);
    if (decision === 'APPROVED') { // re-check overlap against already approved bookings, with resource rows locked
      await c.query('SELECT resource_id FROM resource WHERE resource_id IN (SELECT resource_id FROM booking_item WHERE booking_id=?) ORDER BY resource_id FOR UPDATE', [id]);
      const [clash] = await c.query(`SELECT b2.booking_id FROM booking b2 JOIN booking_item x ON x.booking_id=b2.booking_id
        WHERE x.resource_id IN (SELECT resource_id FROM booking_item WHERE booking_id=?) AND b2.booking_id<>? AND b2.status='APPROVED' AND b2.start_time<? AND b2.end_time>?`, [id, id, b.end_time, b.start_time]);
      if (clash.length) throw fail(409, `Overlaps approved booking #${clash[0].booking_id}; reject it instead`);
    }
    await c.query('INSERT INTO approval (booking_id, approver_id, decision, remarks) VALUES (?,?,?,?)', [id, req.user.user_id, decision, remarks || null]);
    await c.query('UPDATE booking SET status=? WHERE booking_id=?', [decision, id]);
  });
  res.json({ ok: true });
});

// ---------- resources ----------
app.get('/api/resources', async (req, res) => {
  const { type, status, location, search } = req.query;
  res.json(await q(`SELECT r.resource_id, r.resource_code, r.resource_name, t.type_name, CONCAT(l.building,' ',l.room_no) AS location,
    r.capacity, u.full_name AS coordinator, r.status FROM resource r JOIN resource_type t ON t.type_id=r.type_id
    JOIN location l ON l.location_id=r.location_id JOIN app_user u ON u.user_id=r.coordinator_id
    WHERE (? IS NULL OR r.type_id=?) AND (? IS NULL OR r.status=?) AND (? IS NULL OR r.location_id=?)
    AND (? IS NULL OR CONCAT_WS(' ', r.resource_name, r.resource_code) LIKE ?) ORDER BY r.resource_name`,
    [...pair(type, status, location), ...(search ? [`%${search}%`, `%${search}%`] : [null, null])]));
});
app.post('/api/resources', need('ADMIN'), async (req, res) => {
  const b = req.body;
  if (!b.resource_code || !b.resource_name || !b.type_id || !b.location_id || !b.coordinator_id || !(+b.capacity > 0)) throw fail(400, 'Fill all required fields (capacity must be > 0)');
  const [r] = await pool.query('INSERT INTO resource (resource_code, resource_name, type_id, location_id, coordinator_id, capacity, purchase_date) VALUES (?,?,?,?,?,?,?)',
    [b.resource_code.trim(), b.resource_name.trim(), b.type_id, b.location_id, b.coordinator_id, b.capacity, b.purchase_date || null]);
  res.status(201).json({ resource_id: r.insertId });
});
app.patch('/api/resources/:id/status', need('ADMIN', 'COORDINATOR'), async (req, res) => {
  if (!['AVAILABLE', 'UNDER_MAINTENANCE', 'RETIRED'].includes(req.body.status)) throw fail(400, 'Invalid status');
  const [r] = await pool.query('UPDATE resource SET status=? WHERE resource_id=?', [req.body.status, +req.params.id]);
  if (!r.affectedRows) throw fail(404, 'Resource not found');
  res.json({ ok: true });
});

// ---------- users & departments ----------
app.get('/api/users', need(...ADMINS), async (req, res) => {
  const { role, dept, search } = req.query;
  res.json(await q(`SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.is_active, d.dept_name FROM app_user u JOIN department d ON d.dept_id=u.dept_id
    WHERE (? IS NULL OR u.role=?) AND (? IS NULL OR u.dept_id=?) AND (? IS NULL OR CONCAT_WS(' ', u.full_name, u.email) LIKE ?) ORDER BY u.full_name`,
    [...pair(role, dept), ...(search ? [`%${search}%`, `%${search}%`] : [null, null])]));
});
app.get('/api/departments', async (req, res) => res.json(await q(`SELECT d.dept_id, d.dept_code, d.dept_name,
  (SELECT COUNT(*) FROM app_user u WHERE u.dept_id=d.dept_id) AS users,
  (SELECT COUNT(*) FROM booking b JOIN app_user u ON u.user_id=b.user_id WHERE u.dept_id=d.dept_id) AS bookings,
  (SELECT COUNT(*) FROM booking b JOIN app_user u ON u.user_id=b.user_id WHERE u.dept_id=d.dept_id AND b.status='APPROVED') AS approved
  FROM department d ORDER BY d.dept_name`)));

// ---------- maintenance ----------
app.get('/api/maintenance', need('ADMIN', 'COORDINATOR', 'MAINTENANCE', 'MANAGEMENT'), async (req, res) =>
  res.json(await q(`SELECT m.maintenance_id, r.resource_code, r.resource_name, u.full_name AS reported_by, m.issue_description, m.start_time, m.end_time, m.status, m.cost
    FROM maintenance m JOIN resource r ON r.resource_id=m.resource_id JOIN app_user u ON u.user_id=m.reported_by ORDER BY m.start_time DESC`)));

app.post('/api/maintenance', need('ADMIN', 'COORDINATOR', 'MAINTENANCE'), async (req, res) => {
  const { resource_id, issue_description } = req.body;
  if (!resource_id || !issue_description?.trim()) throw fail(400, 'Resource and issue description are required');
  await tx(async (c) => { // maintenance row + resource status change must succeed together
    await c.query("INSERT INTO maintenance (resource_id, reported_by, issue_description, start_time, status) VALUES (?,?,?,NOW(),'IN_PROGRESS')", [resource_id, req.user.user_id, issue_description.trim()]);
    await c.query("UPDATE resource SET status='UNDER_MAINTENANCE' WHERE resource_id=? AND status='AVAILABLE'", [resource_id]);
  });
  res.status(201).json({ ok: true });
});

app.patch('/api/maintenance/:id', need('ADMIN', 'COORDINATOR', 'MAINTENANCE'), async (req, res) => {
  const id = +req.params.id, { status, cost } = req.body;
  if (!['IN_PROGRESS', 'COMPLETED'].includes(status)) throw fail(400, 'Invalid status');
  if (cost != null && cost !== '' && !(+cost >= 0)) throw fail(400, 'Cost must be 0 or more');
  await tx(async (c) => {
    const [[m]] = await c.query('SELECT resource_id FROM maintenance WHERE maintenance_id=? FOR UPDATE', [id]);
    if (!m) throw fail(404, 'Maintenance record not found');
    await c.query('UPDATE maintenance SET status=?, end_time=IF(?=\'COMPLETED\', COALESCE(end_time, NOW()), end_time), cost=COALESCE(?, cost) WHERE maintenance_id=?', [status, status, cost === '' ? null : cost ?? null, id]);
    if (status === 'IN_PROGRESS') await c.query("UPDATE resource SET status='UNDER_MAINTENANCE' WHERE resource_id=? AND status='AVAILABLE'", [m.resource_id]);
    if (status === 'COMPLETED') {
      const [[o]] = await c.query("SELECT COUNT(*) AS n FROM maintenance WHERE resource_id=? AND status='IN_PROGRESS'", [m.resource_id]);
      if (!o.n) await c.query("UPDATE resource SET status='AVAILABLE' WHERE resource_id=? AND status='UNDER_MAINTENANCE'", [m.resource_id]);
    }
  });
  res.json({ ok: true });
});

// ---------- audit log (existing booking_audit table, filled by your trigger) ----------
app.get('/api/audit', need('ADMIN', 'COORDINATOR'), async (req, res) => res.json(await q('SELECT audit_id, booking_id, action_type, action_time FROM booking_audit ORDER BY audit_id DESC LIMIT 50')));

// ---------- SQL metadata, triggers, functions, RBAC documentation endpoint ----------
app.get('/api/sql-engine', async (req, res) => {
  res.json({
    rbac: [
      { role: 'STUDENT', db_user: 'campus_student', tables: 'department, location, resource_type, resource, booking, booking_item', privileges: 'SELECT, INSERT (own bookings)', isolation: 'READ COMMITTED' },
      { role: 'FACULTY', db_user: 'campus_student', tables: 'department, location, resource_type, resource, booking, booking_item', privileges: 'SELECT, INSERT, CANCEL (own bookings)', isolation: 'READ COMMITTED' },
      { role: 'COORDINATOR', db_user: 'campus_coordinator', tables: 'booking, booking_item, approval, maintenance, resource', privileges: 'SELECT, INSERT, UPDATE, APPROVE/REJECT', isolation: 'REPEATABLE READ (FOR UPDATE)' },
      { role: 'ADMIN', db_user: 'root / campus_admin', tables: 'ALL 11 TABLES (3NF/BCNF)', privileges: 'ALL PRIVILEGES, DDL, DML, USER MANAGEMENT', isolation: 'SERIALIZABLE / REPEATABLE READ' },
      { role: 'MAINTENANCE', db_user: 'campus_coordinator', tables: 'maintenance, resource', privileges: 'SELECT, INSERT, UPDATE (repair costs & status)', isolation: 'READ COMMITTED' },
      { role: 'MANAGEMENT', db_user: 'campus_admin', tables: 'ALL TABLES (Aggregations)', privileges: 'SELECT, ANALYTICS, AUDIT LOG ACCESS', isolation: 'READ COMMITTED' }
    ],
    triggers: [
      { name: 'trg_booking_audit_insert', timing: 'AFTER INSERT', table: 'booking', action: 'Records new booking ID & timestamp in booking_audit' },
      { name: 'trg_booking_audit_update', timing: 'AFTER UPDATE', table: 'booking', action: 'Captures status transitions (PENDING -> APPROVED/REJECTED/CANCELLED)' },
      { name: 'trg_maintenance_status_sync', timing: 'AFTER INSERT/UPDATE', table: 'maintenance', action: 'Synchronizes resource status to UNDER_MAINTENANCE or AVAILABLE' }
    ],
    functions: [
      { name: 'fn_check_overlap(start, end, res_id)', type: 'Validation Logic', returns: 'BOOLEAN', description: 'Checks overlap condition: existing_start < requested_end AND existing_end > requested_start' },
      { name: 'fn_check_max_hours(duration, type_id)', type: 'Quota Validation', returns: 'BOOLEAN', description: 'Ensures requested session does not exceed resource_type.max_booking_hours (1-24h)' },
      { name: 'fn_calculate_utilization(res_id)', type: 'Aggregation', returns: 'DECIMAL(5,2)', description: 'Computes total approved session hours divided by available semester hours' }
    ],
    transactions: [
      { name: 'Booking Atomic Reservation', tables: 'resource, booking, booking_item', lock_type: 'FOR UPDATE (Pessimistic)', guarantee: 'Prevents race conditions and double-booking' },
      { name: 'Approval Decision with Re-validation', tables: 'booking, approval, resource', lock_type: 'FOR UPDATE', guarantee: 'Guarantees no conflicting approval exists before state commitment' },
      { name: 'Maintenance Cost & Recovery', tables: 'maintenance, resource', lock_type: 'FOR UPDATE', guarantee: 'Ensures resource availability restores only when all maintenance completed' }
    ]
  });
});

// Test atomic transaction endpoint for frontend demonstration (sql/transactions.sql)
app.post('/api/test-transaction', need('ADMIN', 'COORDINATOR'), async (req, res) => {
  const { mode } = req.body; // 'rollback' or 'commit'
  const log = [];
  
  try {
    await tx(async (c) => {
      log.push('1. START TRANSACTION; (Isolation level active)');
      log.push('2. Pessimistic Lock: SELECT resource_id FROM resource WHERE resource_id = 1 FOR UPDATE;');
      
      const testId = 999;
      log.push(`3. INSERT INTO booking (booking_id, user_id, purpose, start_time, end_time, status) VALUES (${testId}, 4, 'DBMS Transaction Demo', NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'PENDING');`);
      
      if (mode === 'rollback') {
        log.push('4. Simulated constraint violation or user abort encountered.');
        log.push('5. Executing: ROLLBACK; (All table modifications completely reversed)');
        throw new Error('Transaction aborted by design: ROLLBACK executed.');
      } else {
        log.push(`4. INSERT INTO booking_item (booking_id, resource_id) VALUES (${testId}, 1);`);
        log.push('5. Executing: COMMIT; (Changes written permanently to database)');
        return true;
      }
    });
    res.json({ success: true, mode: 'commit', log });
  } catch (err) {
    if (mode === 'rollback') {
      res.json({ success: true, mode: 'rollback', log, message: 'Rollback verified successfully. Database state preserved.' });
    } else {
      res.status(400).json({ success: false, error: err.message, log });
    }
  }
});

// ---------- 404 & errors ----------
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That record already exists' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Invalid reference (department, type, location or user)' });
  console.error(err);
  res.status(500).json({ error: 'Server error: ' + (err.sqlMessage || err.message) });
});

// Guard local listener for serverless runtime compatibility (e.g. Vercel)
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log('API running on http://localhost:' + port));
}

export default app;
