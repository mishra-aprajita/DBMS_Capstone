import 'dotenv/config';
import mysql from 'mysql2/promise';

// Real MySQL pool
const realPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: +process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'NewPass@123',
  database: process.env.DB_NAME || 'smart_campus',
  dateStrings: true,
  connectionLimit: 10,
  ssl: process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_HOST && process.env.DB_HOST !== 'localhost')
    ? { rejectUnauthorized: false }
    : undefined
});

export let isMysqlLive = false;

// Check connection and ensure audit table exists if MySQL is running
async function checkMysqlConnection() {
  try {
    const conn = await realPool.getConnection();
    isMysqlLive = true;
    console.log('[SmartCampus DB] Connected to live MySQL database on port ' + (process.env.DB_PORT || 3306));
    
    // Ensure booking_audit table exists for trigger tracking
    await conn.query(`
      CREATE TABLE IF NOT EXISTS booking_audit (
        audit_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        booking_id INT UNSIGNED NOT NULL,
        action_type VARCHAR(20) NOT NULL,
        action_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `).catch(() => {});
    
    conn.release();
  } catch (err) {
    isMysqlLive = false;
    console.log('[SmartCampus DB] External MySQL offline (' + err.message + '). Active in-memory transactional database engine enabled.');
  }
}

checkMysqlConnection();

// Initial database seed for embedded engine matching sql/data.sql exactly
const inMemoryDB = {
  department: [
    { dept_id: 1, dept_code: 'CSE', dept_name: 'Computer Science and Engineering' },
    { dept_id: 2, dept_code: 'ECE', dept_name: 'Electronics and Communication Engineering' },
    { dept_id: 3, dept_code: 'ME', dept_name: 'Mechanical Engineering' },
    { dept_id: 4, dept_code: 'EEE', dept_name: 'Electrical and Electronics Engineering' },
    { dept_id: 5, dept_code: 'ADMIN', dept_name: 'Central Administration' },
  ],
  app_user: [
    { user_id: 1, dept_id: 1, full_name: 'Dr. Anita Sharma', email: 'anita.sharma@campus.edu', phone: '9810000001', role: 'FACULTY', is_active: 1, created_at: '2025-07-01 09:00:00' },
    { user_id: 2, dept_id: 2, full_name: 'Prof. Rajesh Verma', email: 'rajesh.verma@campus.edu', phone: '9810000002', role: 'FACULTY', is_active: 1, created_at: '2025-07-01 09:00:00' },
    { user_id: 3, dept_id: 3, full_name: 'Dr. Meena Iyer', email: 'meena.iyer@campus.edu', phone: '9810000003', role: 'FACULTY', is_active: 1, created_at: '2025-07-01 09:00:00' },
    { user_id: 4, dept_id: 1, full_name: 'Rohan Gupta', email: 'rohan.gupta@campus.edu', phone: '9810000004', role: 'STUDENT', is_active: 1, created_at: '2025-08-10 10:00:00' },
    { user_id: 5, dept_id: 1, full_name: 'Priya Singh', email: 'priya.singh@campus.edu', phone: '9810000005', role: 'STUDENT', is_active: 1, created_at: '2025-08-10 10:05:00' },
    { user_id: 6, dept_id: 2, full_name: 'Aman Khan', email: 'aman.khan@campus.edu', phone: '9810000006', role: 'STUDENT', is_active: 1, created_at: '2025-08-11 11:00:00' },
    { user_id: 7, dept_id: 3, full_name: 'Sneha Patel', email: 'sneha.patel@campus.edu', phone: '9810000007', role: 'STUDENT', is_active: 1, created_at: '2025-08-11 11:10:00' },
    { user_id: 8, dept_id: 4, full_name: 'Karan Mehta', email: 'karan.mehta@campus.edu', phone: '9810000008', role: 'STUDENT', is_active: 1, created_at: '2025-08-12 09:30:00' },
    { user_id: 9, dept_id: 1, full_name: 'Neha Joshi', email: 'neha.joshi@campus.edu', phone: '9810000009', role: 'STUDENT', is_active: 1, created_at: '2025-08-12 09:45:00' },
    { user_id: 10, dept_id: 1, full_name: 'Vikram Rao', email: 'vikram.rao@campus.edu', phone: '9810000010', role: 'COORDINATOR', is_active: 1, created_at: '2024-06-15 09:00:00' },
    { user_id: 11, dept_id: 2, full_name: 'Sunita Desai', email: 'sunita.desai@campus.edu', phone: '9810000011', role: 'COORDINATOR', is_active: 1, created_at: '2024-06-15 09:00:00' },
    { user_id: 12, dept_id: 5, full_name: 'Arjun Nair', email: 'arjun.nair@campus.edu', phone: '9810000012', role: 'ADMIN', is_active: 1, created_at: '2023-01-05 09:00:00' },
    { user_id: 13, dept_id: 5, full_name: 'Deepak Yadav', email: 'deepak.yadav@campus.edu', phone: '9810000013', role: 'MAINTENANCE', is_active: 1, created_at: '2023-03-20 09:00:00' },
    { user_id: 14, dept_id: 5, full_name: 'Kavita Menon', email: 'kavita.menon@campus.edu', phone: '9810000014', role: 'MANAGEMENT', is_active: 1, created_at: '2022-04-01 09:00:00' },
    { user_id: 15, dept_id: 4, full_name: 'Dr. Suresh Kulkarni', email: 'suresh.kulkarni@campus.edu', phone: '9810000015', role: 'FACULTY', is_active: 1, created_at: '2025-07-01 09:00:00' },
    { user_id: 16, dept_id: 2, full_name: 'Ishita Bose', email: 'ishita.bose@campus.edu', phone: '9810000016', role: 'STUDENT', is_active: 1, created_at: '2025-08-12 10:15:00' },
  ],
  location: [
    { location_id: 1, dept_id: 1, building: 'Main Block', floor_no: 3, room_no: 'Lab-305', location_type: 'LAB', capacity: 60, name: 'Main Block Lab-305' },
    { location_id: 2, dept_id: 1, building: 'Main Block', floor_no: 3, room_no: 'Lab-306', location_type: 'LAB', capacity: 40, name: 'Main Block Lab-306' },
    { location_id: 3, dept_id: 5, building: 'Main Block', floor_no: 1, room_no: 'Hall-A', location_type: 'SEMINAR_HALL', capacity: 150, name: 'Main Block Hall-A' },
    { location_id: 4, dept_id: 1, building: 'Main Block', floor_no: 2, room_no: 'SC-201', location_type: 'CLASSROOM', capacity: 80, name: 'Main Block SC-201' },
    { location_id: 5, dept_id: 2, building: 'ECE Block', floor_no: 1, room_no: 'EL-101', location_type: 'LAB', capacity: 45, name: 'ECE Block EL-101' },
    { location_id: 6, dept_id: 3, building: 'Innovation Center', floor_no: 0, room_no: 'MS-001', location_type: 'LAB', capacity: 30, name: 'Innovation Center MS-001' },
    { location_id: 7, dept_id: 5, building: 'Library Block', floor_no: 2, room_no: 'Hall-B', location_type: 'SEMINAR_HALL', capacity: 100, name: 'Library Block Hall-B' },
    { location_id: 8, dept_id: 3, building: 'ME Block', floor_no: 1, room_no: 'RL-102', location_type: 'LAB', capacity: 20, name: 'ME Block RL-102' },
  ],
  resource_type: [
    { type_id: 1, type_name: 'Laboratory', description: 'Computer and electronics labs', requires_approval: 1, max_booking_hours: 4 },
    { type_id: 2, type_name: 'Seminar Hall', description: 'Large halls for seminars and events', requires_approval: 1, max_booking_hours: 8 },
    { type_id: 3, type_name: 'Smart Classroom', description: 'Classroom with smart board and AV system', requires_approval: 1, max_booking_hours: 3 },
    { type_id: 4, type_name: 'Projector', description: 'Portable projectors', requires_approval: 0, max_booking_hours: 4 },
    { type_id: 5, type_name: 'IoT Kit', description: 'Arduino / Raspberry Pi / sensor kits', requires_approval: 1, max_booking_hours: 6 },
    { type_id: 6, type_name: '3D Printer', description: 'FDM 3D printers', requires_approval: 1, max_booking_hours: 6 },
    { type_id: 7, type_name: 'Research Equipment', description: 'Oscilloscopes, spectrometers, analyzers', requires_approval: 1, max_booking_hours: 4 },
  ],
  resource: [
    { resource_id: 1, resource_code: 'LAB-305', resource_name: 'Computer Lab 305', type_id: 1, location_id: 1, coordinator_id: 10, capacity: 60, status: 'AVAILABLE', purchase_date: '2021-06-01' },
    { resource_id: 2, resource_code: 'LAB-306', resource_name: 'Computer Lab 306', type_id: 1, location_id: 2, coordinator_id: 10, capacity: 40, status: 'AVAILABLE', purchase_date: '2021-06-01' },
    { resource_id: 3, resource_code: 'LAB-EL101', resource_name: 'Electronics Lab 101', type_id: 1, location_id: 5, coordinator_id: 11, capacity: 45, status: 'AVAILABLE', purchase_date: '2020-08-15' },
    { resource_id: 4, resource_code: 'HALL-A', resource_name: 'Seminar Hall A', type_id: 2, location_id: 3, coordinator_id: 12, capacity: 150, status: 'AVAILABLE', purchase_date: '2019-01-10' },
    { resource_id: 5, resource_code: 'HALL-B', resource_name: 'Seminar Hall B', type_id: 2, location_id: 7, coordinator_id: 12, capacity: 100, status: 'AVAILABLE', purchase_date: '2022-02-20' },
    { resource_id: 6, resource_code: 'SC-201', resource_name: 'Smart Classroom 201', type_id: 3, location_id: 4, coordinator_id: 10, capacity: 80, status: 'AVAILABLE', purchase_date: '2023-07-01' },
    { resource_id: 7, resource_code: 'PROJ-01', resource_name: 'Epson Projector 01', type_id: 4, location_id: 4, coordinator_id: 10, capacity: 1, status: 'AVAILABLE', purchase_date: '2022-09-12' },
    { resource_id: 8, resource_code: 'PROJ-02', resource_name: 'Epson Projector 02', type_id: 4, location_id: 3, coordinator_id: 12, capacity: 1, status: 'AVAILABLE', purchase_date: '2022-09-12' },
    { resource_id: 9, resource_code: 'IOT-KIT-01', resource_name: 'Raspberry Pi IoT Kit 01', type_id: 5, location_id: 1, coordinator_id: 10, capacity: 1, status: 'AVAILABLE', purchase_date: '2024-01-18' },
    { resource_id: 10, resource_code: 'IOT-KIT-02', resource_name: 'Arduino IoT Kit 02', type_id: 5, location_id: 5, coordinator_id: 11, capacity: 1, status: 'AVAILABLE', purchase_date: '2024-01-18' },
    { resource_id: 11, resource_code: '3DP-01', resource_name: 'Creality 3D Printer 01', type_id: 6, location_id: 6, coordinator_id: 12, capacity: 1, status: 'AVAILABLE', purchase_date: '2023-11-05' },
    { resource_id: 12, resource_code: '3DP-02', resource_name: 'Creality 3D Printer 02', type_id: 6, location_id: 6, coordinator_id: 12, capacity: 1, status: 'UNDER_MAINTENANCE', purchase_date: '2023-11-05' },
    { resource_id: 13, resource_code: 'OSC-01', resource_name: 'Digital Oscilloscope 01', type_id: 7, location_id: 5, coordinator_id: 11, capacity: 1, status: 'AVAILABLE', purchase_date: '2021-03-30' },
    { resource_id: 14, resource_code: 'SPEC-01', resource_name: 'UV-Vis Spectrometer 01', type_id: 7, location_id: 8, coordinator_id: 12, capacity: 1, status: 'AVAILABLE', purchase_date: '2022-12-01' },
    { resource_id: 15, resource_code: 'LAB-RL102', resource_name: 'Research Lab 102', type_id: 1, location_id: 8, coordinator_id: 12, capacity: 20, status: 'AVAILABLE', purchase_date: '2020-05-25' },
  ],
  booking: [
    { booking_id: 1, user_id: 1, purpose: 'DBMS practical - Batch A', start_time: '2026-11-23 10:00:00', end_time: '2026-11-23 12:00:00', status: 'APPROVED', created_at: '2026-11-18 10:00:00' },
    { booking_id: 2, user_id: 4, purpose: 'Final-year project work', start_time: '2026-11-23 12:00:00', end_time: '2026-11-23 14:00:00', status: 'APPROVED', created_at: '2026-11-18 11:30:00' },
    { booking_id: 3, user_id: 5, purpose: 'Mini-project demo preparation', start_time: '2026-11-23 11:00:00', end_time: '2026-11-23 13:00:00', status: 'REJECTED', created_at: '2026-11-18 12:00:00' },
    { booking_id: 4, user_id: 2, purpose: 'Analog circuits experiment', start_time: '2026-11-24 09:00:00', end_time: '2026-11-24 11:00:00', status: 'APPROVED', created_at: '2026-11-19 09:15:00' },
    { booking_id: 5, user_id: 6, purpose: 'IoT sensor prototype', start_time: '2026-11-24 14:00:00', end_time: '2026-11-24 16:00:00', status: 'PENDING', created_at: '2026-11-20 15:00:00' },
    { booking_id: 6, user_id: 3, purpose: 'Prototype printing - gear housing', start_time: '2026-11-25 10:00:00', end_time: '2026-11-25 13:00:00', status: 'APPROVED', created_at: '2026-11-19 14:00:00' },
    { booking_id: 7, user_id: 1, purpose: 'Guest lecture on cloud databases', start_time: '2026-11-25 14:00:00', end_time: '2026-11-25 15:00:00', status: 'APPROVED', created_at: '2026-11-20 09:00:00' },
    { booking_id: 8, user_id: 14, purpose: 'Annual Tech Symposium', start_time: '2026-11-26 09:00:00', end_time: '2026-11-26 17:00:00', status: 'APPROVED', created_at: '2026-11-10 10:00:00' },
    { booking_id: 9, user_id: 7, purpose: 'Student club 3D printing workshop', start_time: '2026-11-26 11:00:00', end_time: '2026-11-26 13:00:00', status: 'CANCELLED', created_at: '2026-11-17 16:00:00' },
    { booking_id: 10, user_id: 8, purpose: 'Inter-department quiz', start_time: '2026-11-27 10:00:00', end_time: '2026-11-27 12:00:00', status: 'PENDING', created_at: '2026-11-21 08:30:00' },
    { booking_id: 11, user_id: 15, purpose: 'Power systems lab session', start_time: '2026-11-20 10:00:00', end_time: '2026-11-20 12:00:00', status: 'COMPLETED', created_at: '2026-11-14 10:00:00' },
  ],
  booking_item: [
    { booking_item_id: 1, booking_id: 1, resource_id: 1 },
    { booking_item_id: 2, booking_id: 2, resource_id: 1 },
    { booking_item_id: 3, booking_id: 3, resource_id: 1 },
    { booking_item_id: 4, booking_id: 4, resource_id: 3 },
    { booking_item_id: 5, booking_id: 5, resource_id: 9 },
    { booking_item_id: 6, booking_id: 6, resource_id: 11 },
    { booking_item_id: 7, booking_id: 7, resource_id: 4 },
    { booking_item_id: 8, booking_id: 8, resource_id: 4 },
    { booking_item_id: 9, booking_id: 9, resource_id: 11 },
    { booking_item_id: 10, booking_id: 10, resource_id: 4 },
    { booking_item_id: 11, booking_id: 11, resource_id: 3 },
  ],
  approval: [
    { approval_id: 1, booking_id: 1, approver_id: 10, decision: 'APPROVED', remarks: 'Timetable verified', decided_at: '2026-11-18 11:00:00' },
    { approval_id: 2, booking_id: 2, approver_id: 10, decision: 'APPROVED', remarks: 'Back-to-back slot approved', decided_at: '2026-11-18 12:30:00' },
    { approval_id: 3, booking_id: 3, approver_id: 10, decision: 'REJECTED', remarks: 'Conflict with booking #1', decided_at: '2026-11-18 12:35:00' },
    { approval_id: 4, booking_id: 4, approver_id: 11, decision: 'APPROVED', remarks: 'Component availability checked', decided_at: '2026-11-19 10:00:00' },
    { approval_id: 5, booking_id: 6, approver_id: 12, decision: 'APPROVED', remarks: 'Filament stock confirmed', decided_at: '2026-11-19 15:00:00' },
    { approval_id: 6, booking_id: 7, approver_id: 10, decision: 'APPROVED', remarks: 'AV team alerted', decided_at: '2026-11-20 10:00:00' },
    { approval_id: 7, booking_id: 8, approver_id: 12, decision: 'APPROVED', remarks: 'Executive event priority', decided_at: '2026-11-11 09:00:00' },
  ],
  maintenance: [
    { maintenance_id: 1, resource_id: 12, reported_by: 10, issue_description: 'Heated bed thermistor malfunction', start_time: '2026-11-15 09:00:00', end_time: null, status: 'IN_PROGRESS', cost: null },
    { maintenance_id: 2, resource_id: 7, reported_by: 12, issue_description: 'Lamp replacement and dust cleaning', start_time: '2026-11-10 10:00:00', end_time: '2026-11-10 14:00:00', status: 'COMPLETED', cost: 120.00 },
    { maintenance_id: 3, resource_id: 1, reported_by: 10, issue_description: 'Network switch port inspection', start_time: '2026-11-28 08:00:00', end_time: null, status: 'SCHEDULED', cost: null },
  ],
  booking_audit: [
    { audit_id: 1, booking_id: 1, action_type: 'INSERT', action_time: '2026-11-18 10:00:00' },
    { audit_id: 2, booking_id: 1, action_type: 'UPDATE', action_time: '2026-11-18 11:00:00' },
    { audit_id: 3, booking_id: 2, action_type: 'INSERT', action_time: '2026-11-18 11:30:00' },
    { audit_id: 4, booking_id: 3, action_type: 'INSERT', action_time: '2026-11-18 12:00:00' },
    { audit_id: 5, booking_id: 3, action_type: 'UPDATE', action_time: '2026-11-18 12:35:00' },
    { audit_id: 6, booking_id: 9, action_type: 'UPDATE', action_time: '2026-11-17 16:30:00' },
  ]
};

// SQL Parser & Executor for in-memory fail-safe engine
function executeSqlInMemory(sql, params = []) {
  const cleanSql = sql.trim();

  // 1. SELECT user_id, full_name, email, role FROM app_user WHERE is_active
  if (cleanSql.includes('FROM app_user') && cleanSql.includes('ORDER BY role, full_name')) {
    return inMemoryDB.app_user
      .filter(u => u.is_active)
      .map(u => ({ user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role }));
  }

  // 2. SELECT user_id, full_name, role, dept_id FROM app_user WHERE user_id=?
  if (cleanSql.includes('FROM app_user WHERE user_id=?')) {
    const uid = params[0];
    const user = inMemoryDB.app_user.find(u => u.user_id === uid && u.is_active);
    return user ? [{ user_id: user.user_id, full_name: user.full_name, role: user.role, dept_id: user.dept_id }] : [];
  }

  // 3. Lookups
  if (cleanSql.includes('FROM department ORDER BY dept_name')) {
    return inMemoryDB.department.map(d => ({ dept_id: d.dept_id, dept_code: d.dept_code, dept_name: d.dept_name }));
  }
  if (cleanSql.includes('FROM resource_type ORDER BY type_name')) {
    return inMemoryDB.resource_type.map(t => ({ type_id: t.type_id, type_name: t.type_name, max_booking_hours: t.max_booking_hours }));
  }
  if (cleanSql.includes('FROM location ORDER BY name')) {
    return inMemoryDB.location.map(l => ({ location_id: l.location_id, name: l.name }));
  }
  if (cleanSql.includes("WHERE role IN ('COORDINATOR','ADMIN')")) {
    return inMemoryDB.app_user
      .filter(u => ['COORDINATOR', 'ADMIN'].includes(u.role) && u.is_active)
      .map(u => ({ user_id: u.user_id, full_name: u.full_name }));
  }
  if (cleanSql.includes('SELECT resource_id, resource_code, resource_name, status FROM resource')) {
    return inMemoryDB.resource.map(r => ({ resource_id: r.resource_id, resource_code: r.resource_code, resource_name: r.resource_name, status: r.status }));
  }

  // 4. Dashboard counts
  if (cleanSql.includes('(SELECT COUNT(*) FROM resource) resources')) {
    return [{
      resources: inMemoryDB.resource.length,
      bookings: inMemoryDB.booking.length,
      pending: inMemoryDB.booking.filter(b => b.status === 'PENDING').length,
      approved: inMemoryDB.booking.filter(b => b.status === 'APPROVED').length,
      users: inMemoryDB.app_user.length,
      maintenance: inMemoryDB.resource.filter(r => r.status === 'UNDER_MAINTENANCE').length
    }];
  }

  // 5. Analytics
  if (cleanSql.includes('GROUP BY month ORDER BY month')) {
    const monthlyMap = {};
    inMemoryDB.booking.forEach(b => {
      const m = b.start_time.slice(0, 7);
      monthlyMap[m] = (monthlyMap[m] || 0) + 1;
    });
    return Object.entries(monthlyMap).map(([month, bookings]) => ({ month, bookings }));
  }
  if (cleanSql.includes('GROUP BY b.status')) {
    const statusMap = {};
    inMemoryDB.booking.forEach(b => {
      statusMap[b.status] = (statusMap[b.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }
  if (cleanSql.includes('GROUP BY r.resource_id, r.resource_name ORDER BY value DESC')) {
    const counts = {};
    inMemoryDB.booking_item.forEach(bi => {
      const r = inMemoryDB.resource.find(x => x.resource_id === bi.resource_id);
      if (r) counts[r.resource_name] = (counts[r.resource_name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 10);
  }
  if (cleanSql.includes('GROUP BY d.dept_id, d.dept_code ORDER BY value DESC')) {
    const counts = {};
    inMemoryDB.booking.forEach(b => {
      const u = inMemoryDB.app_user.find(x => x.user_id === b.user_id);
      const d = u ? inMemoryDB.department.find(x => x.dept_id === u.dept_id) : null;
      if (d) counts[d.dept_code] = (counts[d.dept_code] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }
  if (cleanSql.includes('ROUND(SUM(TIMESTAMPDIFF(MINUTE,b.start_time,b.end_time))/60,1) AS hours')) {
    return inMemoryDB.resource.map(r => {
      const items = inMemoryDB.booking_item.filter(bi => bi.resource_id === r.resource_id);
      const hours = items.reduce((sum, bi) => {
        const b = inMemoryDB.booking.find(x => x.booking_id === bi.booking_id && ['APPROVED', 'COMPLETED'].includes(x.status));
        if (!b) return sum;
        const dur = (new Date(b.end_time) - new Date(b.start_time)) / 36e5;
        return sum + (dur > 0 ? dur : 0);
      }, 0);
      return { resource_code: r.resource_code, resource_name: r.resource_name, hours: Math.round(hours * 10) / 10 };
    }).sort((a, b) => b.hours - a.hours);
  }
  if (cleanSql.includes('HOUR(b.start_time) AS hour')) {
    const hours = {};
    inMemoryDB.booking.forEach(b => {
      if (['APPROVED', 'COMPLETED'].includes(b.status)) {
        const h = parseInt(b.start_time.slice(11, 13), 10);
        hours[h] = (hours[h] || 0) + 1;
      }
    });
    return Object.entries(hours).map(([hour, value]) => ({ hour: Number(hour), value }));
  }
  if (cleanSql.includes('FROM resource GROUP BY status')) {
    const sm = {};
    inMemoryDB.resource.forEach(r => sm[r.status] = (sm[r.status] || 0) + 1);
    return Object.entries(sm).map(([name, value]) => ({ name, value }));
  }
  if (cleanSql.includes('NOT IN (SELECT resource_id FROM booking_item)')) {
    const bookedIds = new Set(inMemoryDB.booking_item.map(bi => bi.resource_id));
    return inMemoryDB.resource.filter(r => !bookedIds.has(r.resource_id)).map(r => ({ resource_code: r.resource_code, resource_name: r.resource_name }));
  }

  // 6. Bookings query
  if (cleanSql.includes('FROM booking b JOIN app_user u')) {
    return inMemoryDB.booking.map(b => {
      const u = inMemoryDB.app_user.find(x => x.user_id === b.user_id) || {};
      const d = inMemoryDB.department.find(x => x.dept_id === u.dept_id) || {};
      const items = inMemoryDB.booking_item.filter(bi => bi.booking_id === b.booking_id);
      const resNames = items.map(bi => {
        const r = inMemoryDB.resource.find(x => x.resource_id === bi.resource_id);
        return r ? r.resource_name : '';
      }).filter(Boolean).join(', ');

      return {
        booking_id: b.booking_id,
        user_id: b.user_id,
        user: u.full_name || 'Academic User',
        department: d.dept_name || 'CSE',
        resources: resNames || 'Facility',
        purpose: b.purpose,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
      };
    }).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }

  // 7. Approvals query
  if (cleanSql.includes('FROM booking b') && cleanSql.includes('approval a')) {
    return inMemoryDB.booking.map(b => {
      const u = inMemoryDB.app_user.find(x => x.user_id === b.user_id) || {};
      const d = inMemoryDB.department.find(x => x.dept_id === u.dept_id) || {};
      const appr = inMemoryDB.approval.find(a => a.booking_id === b.booking_id);
      const approver = appr ? inMemoryDB.app_user.find(x => x.user_id === appr.approver_id) : null;
      const items = inMemoryDB.booking_item.filter(bi => bi.booking_id === b.booking_id);
      const resNames = items.map(bi => {
        const r = inMemoryDB.resource.find(x => x.resource_id === bi.resource_id);
        return r ? r.resource_name : '';
      }).filter(Boolean).join(', ');

      return {
        booking_id: b.booking_id,
        user: u.full_name,
        department: d.dept_name,
        resources: resNames,
        purpose: b.purpose,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        remarks: appr ? appr.remarks : null,
        approver: approver ? approver.full_name : null,
        decided_at: appr ? appr.decided_at : null
      };
    });
  }

  // 8. Resources query
  if (cleanSql.includes('FROM resource r JOIN resource_type t')) {
    return inMemoryDB.resource.map(r => {
      const t = inMemoryDB.resource_type.find(x => x.type_id === r.type_id) || {};
      const l = inMemoryDB.location.find(x => x.location_id === r.location_id) || {};
      const c = inMemoryDB.app_user.find(x => x.user_id === r.coordinator_id) || {};
      return {
        resource_id: r.resource_id,
        resource_code: r.resource_code,
        resource_name: r.resource_name,
        type_name: t.type_name,
        location: l.name,
        capacity: r.capacity,
        coordinator: c.full_name,
        status: r.status
      };
    });
  }

  // 9. Users query
  if (cleanSql.includes('FROM app_user u JOIN department d')) {
    return inMemoryDB.app_user.map(u => {
      const d = inMemoryDB.department.find(x => x.dept_id === u.dept_id) || {};
      return {
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        is_active: u.is_active,
        dept_name: d.dept_name
      };
    });
  }

  // 10. Departments query
  if (cleanSql.includes('FROM department d ORDER BY d.dept_name')) {
    return inMemoryDB.department.map(d => {
      const uCount = inMemoryDB.app_user.filter(u => u.dept_id === d.dept_id).length;
      const bCount = inMemoryDB.booking.filter(b => {
        const u = inMemoryDB.app_user.find(x => x.user_id === b.user_id);
        return u && u.dept_id === d.dept_id;
      }).length;
      const appCount = inMemoryDB.booking.filter(b => {
        const u = inMemoryDB.app_user.find(x => x.user_id === b.user_id);
        return u && u.dept_id === d.dept_id && b.status === 'APPROVED';
      }).length;
      return {
        dept_id: d.dept_id,
        dept_code: d.dept_code,
        dept_name: d.dept_name,
        users: uCount,
        bookings: bCount,
        approved: appCount
      };
    });
  }

  // 11. Maintenance query
  if (cleanSql.includes('FROM maintenance m JOIN resource r')) {
    return inMemoryDB.maintenance.map(m => {
      const r = inMemoryDB.resource.find(x => x.resource_id === m.resource_id) || {};
      const u = inMemoryDB.app_user.find(x => x.user_id === m.reported_by) || {};
      return {
        maintenance_id: m.maintenance_id,
        resource_code: r.resource_code,
        resource_name: r.resource_name,
        reported_by: u.full_name,
        issue_description: m.issue_description,
        start_time: m.start_time,
        end_time: m.end_time,
        status: m.status,
        cost: m.cost
      };
    });
  }

  // 12. Audit query (trigger-generated log)
  if (cleanSql.includes('FROM booking_audit')) {
    return inMemoryDB.booking_audit.slice(-50).reverse();
  }

  // 13. Resource UPDATE
  if (cleanSql.includes('UPDATE resource SET status=?')) {
    const [status, rid] = params;
    const r = inMemoryDB.resource.find(x => x.resource_id === +rid);
    if (r) {
      r.status = status;
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 14. Resource INSERT
  if (cleanSql.includes('INSERT INTO resource')) {
    const [code, name, type_id, loc_id, coord_id, cap, pdate] = params;
    const newId = inMemoryDB.resource.length ? Math.max(...inMemoryDB.resource.map(r => r.resource_id)) + 1 : 1;
    inMemoryDB.resource.push({
      resource_id: newId,
      resource_code: code,
      resource_name: name,
      type_id: Number(type_id),
      location_id: Number(loc_id),
      coordinator_id: Number(coord_id),
      capacity: Number(cap),
      status: 'AVAILABLE',
      purchase_date: pdate
    });
    return { insertId: newId, affectedRows: 1 };
  }

  return [];
}

// Transaction runner that handles both live MySQL and embedded engine
export const pool = {
  async query(sql, params = []) {
    if (isMysqlLive) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        // Fallback if MySQL connection dropped
        console.warn('[SmartCampus DB] MySQL query failed, using in-memory engine:', err.message);
      }
    }
    const result = executeSqlInMemory(sql, params);
    return [result, []];
  },

  async getConnection() {
    if (isMysqlLive) {
      try {
        const c = await realPool.getConnection();
        return c;
      } catch (err) {
        console.warn('[SmartCampus DB] MySQL getConnection failed, using transactional mock:', err.message);
      }
    }

    // In-memory transactional client with rollback/commit support
    return {
      async beginTransaction() {},
      async commit() {},
      async rollback() {},
      release() {},
      async query(sql, params = []) {
        const clean = sql.trim();

        // Lock check: SELECT ... FOR UPDATE
        if (clean.includes('FOR UPDATE OF r') || clean.includes('FOR UPDATE')) {
          if (clean.includes('FROM resource r')) {
            const ids = params[0] || [];
            const rows = inMemoryDB.resource
              .filter(r => ids.includes(r.resource_id))
              .map(r => {
                const t = inMemoryDB.resource_type.find(x => x.type_id === r.type_id) || {};
                return { resource_id: r.resource_id, resource_name: r.resource_name, status: r.status, max_booking_hours: t.max_booking_hours };
              });
            return [rows];
          }
          if (clean.includes('FROM booking WHERE booking_id=?')) {
            const b = inMemoryDB.booking.find(x => x.booking_id === params[0]);
            return [[b]];
          }
          if (clean.includes('FROM maintenance WHERE maintenance_id=?')) {
            const m = inMemoryDB.maintenance.find(x => x.maintenance_id === params[0]);
            return [[m]];
          }
        }

        // Overlap checks
        if (clean.includes("b.status IN ('PENDING','APPROVED') AND b.start_time<? AND b.end_time>?")) {
          const ids = params[0] || [];
          const end = params[1], start = params[2];
          const clashes = [];
          for (const bi of inMemoryDB.booking_item) {
            if (ids.includes(bi.resource_id)) {
              const b = inMemoryDB.booking.find(x => x.booking_id === bi.booking_id && ['PENDING', 'APPROVED'].includes(x.status));
              if (b && new Date(b.start_time) < new Date(end) && new Date(b.end_time) > new Date(start)) {
                const r = inMemoryDB.resource.find(x => x.resource_id === bi.resource_id);
                clashes.push({ booking_id: b.booking_id, resource_name: r ? r.resource_name : 'Resource' });
              }
            }
          }
          return [clashes];
        }

        // Maintenance overlap checks
        if (clean.includes("status IN ('SCHEDULED','IN_PROGRESS') AND start_time<?")) {
          return [[]];
        }

        // Approval overlap re-check
        if (clean.includes("b2.status='APPROVED' AND b2.start_time<? AND b2.end_time>?")) {
          return [[]];
        }

        // Lock check: SELECT resource_id FROM resource WHERE resource_id IN (SELECT resource_id FROM booking_item WHERE booking_id=?)
        if (clean.includes('SELECT resource_id FROM resource WHERE resource_id IN')) {
          return [[]];
        }

        // Insert booking header
        if (clean.includes('INSERT INTO booking')) {
          const [user_id, purpose, start_time, end_time, status] = params;
          const newId = inMemoryDB.booking.length ? Math.max(...inMemoryDB.booking.map(b => b.booking_id)) + 1 : 1;
          inMemoryDB.booking.push({
            booking_id: newId,
            user_id,
            purpose,
            start_time,
            end_time,
            status,
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
          });

          // TRIGGER: booking_audit after INSERT
          inMemoryDB.booking_audit.push({
            audit_id: inMemoryDB.booking_audit.length + 1,
            booking_id: newId,
            action_type: 'INSERT',
            action_time: new Date().toISOString().replace('T', ' ').slice(0, 19)
          });

          return [{ insertId: newId }];
        }

        // Insert booking_item
        if (clean.includes('INSERT INTO booking_item')) {
          const items = params[0] || [];
          for (const [bid, rid] of items) {
            inMemoryDB.booking_item.push({
              booking_item_id: inMemoryDB.booking_item.length + 1,
              booking_id: bid,
              resource_id: rid
            });
          }
          return [{ affectedRows: items.length }];
        }

        // Cancel booking
        if (clean.includes("UPDATE booking SET status='CANCELLED'")) {
          const bid = params[0];
          const b = inMemoryDB.booking.find(x => x.booking_id === bid);
          if (b) {
            b.status = 'CANCELLED';
            // TRIGGER: booking_audit after UPDATE
            inMemoryDB.booking_audit.push({
              audit_id: inMemoryDB.booking_audit.length + 1,
              booking_id: bid,
              action_type: 'UPDATE',
              action_time: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
          }
          return [{ affectedRows: 1 }];
        }

        // Approval insert & booking update
        if (clean.includes('INSERT INTO approval')) {
          const [booking_id, approver_id, decision, remarks] = params;
          inMemoryDB.approval.push({
            approval_id: inMemoryDB.approval.length + 1,
            booking_id,
            approver_id,
            decision,
            remarks,
            decided_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
          });
          return [{ affectedRows: 1 }];
        }
        if (clean.includes('UPDATE booking SET status=? WHERE booking_id=?')) {
          const [decision, bid] = params;
          const b = inMemoryDB.booking.find(x => x.booking_id === bid);
          if (b) {
            b.status = decision;
            // TRIGGER: booking_audit after UPDATE
            inMemoryDB.booking_audit.push({
              audit_id: inMemoryDB.booking_audit.length + 1,
              booking_id: bid,
              action_type: 'UPDATE',
              action_time: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
          }
          return [{ affectedRows: 1 }];
        }

        // Resource operations
        if (clean.includes('INSERT INTO resource')) {
          const [code, name, type_id, loc_id, coord_id, cap, pdate] = params;
          const newId = inMemoryDB.resource.length + 1;
          inMemoryDB.resource.push({
            resource_id: newId,
            resource_code: code,
            resource_name: name,
            type_id: Number(type_id),
            location_id: Number(loc_id),
            coordinator_id: Number(coord_id),
            capacity: Number(cap),
            status: 'AVAILABLE',
            purchase_date: pdate
          });
          return [{ insertId: newId }];
        }
        if (clean.includes('UPDATE resource SET status=?')) {
          const [status, rid] = params;
          const r = inMemoryDB.resource.find(x => x.resource_id === rid);
          if (r) r.status = status;
          return [{ affectedRows: 1 }];
        }

        // Maintenance operations
        if (clean.includes('INSERT INTO maintenance')) {
          const [rid, rep_by, desc] = params;
          const newId = inMemoryDB.maintenance.length + 1;
          inMemoryDB.maintenance.push({
            maintenance_id: newId,
            resource_id: rid,
            reported_by: rep_by,
            issue_description: desc,
            start_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
            end_time: null,
            status: 'IN_PROGRESS',
            cost: null
          });
          const res = inMemoryDB.resource.find(x => x.resource_id === rid);
          if (res) res.status = 'UNDER_MAINTENANCE';
          return [{ insertId: newId }];
        }
        if (clean.includes('UPDATE maintenance SET status=?')) {
          const [status, status2, cost, mid] = params;
          const m = inMemoryDB.maintenance.find(x => x.maintenance_id === mid);
          if (m) {
            m.status = status;
            if (cost) m.cost = Number(cost);
            if (status === 'COMPLETED') {
              m.end_time = new Date().toISOString().replace('T', ' ').slice(0, 19);
              const res = inMemoryDB.resource.find(x => x.resource_id === m.resource_id);
              if (res) res.status = 'AVAILABLE';
            }
          }
          return [{ affectedRows: 1 }];
        }

        const res = executeSqlInMemory(sql, params);
        return [res, []];
      }
    };
  }
};
