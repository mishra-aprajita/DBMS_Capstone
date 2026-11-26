import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  Layers, 
  CalendarDays, 
  Wrench, 
  Plus, 
  Settings, 
  ShieldCheck, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { SqlEngineConsole } from '../../components/sql/SqlEngineConsole';
import { api, qs, showToast } from '../../services/api';

export function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Core administrative dataset
  const [dashboardStats, setDashboardStats] = useState({});
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lookups, setLookups] = useState({ types: [], locations: [], coordinators: [] });
  const [loading, setLoading] = useState(true);

  // New Resource Modal State
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_code: '',
    resource_name: '',
    type_id: '',
    location_id: '',
    coordinator_id: '',
    capacity: 30,
    purchase_date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, uList, deptList, resList, bookList, maintList, auditList, lkList] = await Promise.all([
        api('/dashboard').catch(() => ({})),
        api('/users').catch(() => []),
        api('/departments').catch(() => []),
        api('/resources').catch(() => []),
        api('/bookings').catch(() => []),
        api('/maintenance').catch(() => []),
        api('/audit').catch(() => []),
        api('/lookups').catch(() => ({ types: [], locations: [], coordinators: [] }))
      ]);

      setDashboardStats(dash);
      setUsers(uList || []);
      setDepartments(deptList || []);
      setResources(resList || []);
      setBookings(bookList || []);
      setMaintenance(maintList || []);
      setAuditLogs(auditList || []);
      setLookups(lkList);
    } catch (err) {
      showToast('Error syncing administrative dataset: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Resource
  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResource.resource_code || !newResource.resource_name || !newResource.type_id || !newResource.location_id || !newResource.coordinator_id) {
      showToast('Please fill all mandatory resource parameters.', 'err');
      return;
    }

    try {
      await api('/resources', {
        method: 'POST',
        body: newResource
      });
      showToast(`Resource ${newResource.resource_code} created successfully!`, 'ok');
      setIsAddResourceOpen(false);
      setNewResource({
        resource_code: '',
        resource_name: '',
        type_id: '',
        location_id: '',
        coordinator_id: '',
        capacity: 30,
        purchase_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleTitle="Administrator Portal"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--r-xl)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-primary)', fontWeight: 700 }}>
                Institutional Systems Administration
              </span>
              <h1 style={{ marginTop: '4px' }}>
                Central Administration — {currentUser?.full_name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Institutional directory, departments, physical locations, booking triggers, and audit ledger.
              </p>
            </div>

            <button 
              className="btn-academic btn-primary btn-lg"
              onClick={() => setIsAddResourceOpen(true)}
            >
              <Plus size={16} />
              <span>Register New Resource</span>
            </button>
          </div>

          <div className="stats-grid">
            <StatCard 
              title="Registered Users" 
              value={dashboardStats.users || users.length} 
              subtext="Faculty, staff & students"
              icon={Users} 
            />
            <StatCard 
              title="Total Facilities" 
              value={dashboardStats.resources || resources.length} 
              subtext="Active inventory"
              icon={Layers} 
            />
            <StatCard 
              title="Academic Bookings" 
              value={dashboardStats.bookings || bookings.length} 
              subtext="Logged reservations"
              icon={CalendarDays} 
            />
            <StatCard 
              title="Under Maintenance" 
              value={dashboardStats.maintenance || 0} 
              subtext="Assets undergoing repair"
              icon={Wrench} 
              color="var(--error-text)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
            <div className="card-academic">
              <div className="card-header-academic">
                <h3><FileText size={18} /> System Audit Trail (Database Triggers)</h3>
              </div>
              <DataTable 
                columns={[
                  { key: 'audit_id', label: 'Audit ID', render: (a) => <strong className="num-tabular">#{a.audit_id}</strong> },
                  { key: 'booking_id', label: 'Booking', render: (a) => `#${a.booking_id}` },
                  { key: 'action_type', label: 'Action', render: (a) => <StatusBadge status={a.action_type} /> },
                  { key: 'action_time', label: 'Timestamp', render: (a) => <span className="num-tabular">{a.action_time?.slice(0, 19)}</span> }
                ]}
                data={auditLogs}
                pageSize={6}
                emptyMessage="No recent audit events captured by database triggers."
              />
            </div>

            <div className="card-academic">
              <div className="card-header-academic">
                <h3><Building2 size={18} /> Academic Departments</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {departments.map((dept) => (
                  <div 
                    key={dept.dept_id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--card-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dept.dept_name}</strong>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Code: {dept.dept_code}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                      {dept.users} Users
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><Users size={18} /> Institutional User Directory</h3>
          </div>
          <DataTable 
            columns={[
              { key: 'user_id', label: 'ID', render: (u) => <strong className="num-tabular">#{u.user_id}</strong> },
              { key: 'full_name', label: 'Full Name', render: (u) => <strong>{u.full_name}</strong> },
              { key: 'email', label: 'Institutional Email' },
              { key: 'dept_name', label: 'Department' },
              { key: 'role', label: 'Authorized Role', render: (u) => <StatusBadge status={u.role} /> },
              { key: 'is_active', label: 'Status', render: (u) => <StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} /> }
            ]}
            data={users}
            pageSize={8}
          />
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><Building2 size={18} /> Academic Departments & Statistics</h3>
          </div>
          <DataTable 
            columns={[
              { key: 'dept_code', label: 'Dept Code', render: (d) => <strong>{d.dept_code}</strong> },
              { key: 'dept_name', label: 'Department Name' },
              { key: 'users', label: 'Registered Users', render: (d) => <span className="num-tabular">{d.users}</span> },
              { key: 'bookings', label: 'Total Reservations', render: (d) => <span className="num-tabular">{d.bookings}</span> },
              { key: 'approved', label: 'Approved Reservations', render: (d) => <span className="num-tabular">{d.approved}</span> }
            ]}
            data={departments}
            pageSize={8}
          />
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Layers size={18} /> Campus Inventory & Asset Catalog</h3>
            </div>
            <button 
              className="btn-academic btn-gold btn-sm"
              onClick={() => setIsAddResourceOpen(true)}
            >
              <Plus size={14} />
              <span>Add Resource</span>
            </button>
          </div>
          <DataTable 
            columns={[
              { key: 'resource_code', label: 'Code', render: (r) => <strong className="num-tabular">{r.resource_code}</strong> },
              { key: 'resource_name', label: 'Facility Name', render: (r) => <strong>{r.resource_name}</strong> },
              { key: 'type_name', label: 'Type' },
              { key: 'location', label: 'Location' },
              { key: 'coordinator', label: 'Coordinator' },
              { key: 'capacity', label: 'Capacity', render: (r) => `${r.capacity} seats` },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> }
            ]}
            data={resources}
            pageSize={8}
          />
        </div>
      )}

      {/* All Bookings Tab */}
      {activeTab === 'all-bookings' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><CalendarDays size={18} /> All Institutional Bookings</h3>
          </div>
          <DataTable 
            columns={[
              { key: 'booking_id', label: 'ID', render: (b) => <strong className="num-tabular">#{b.booking_id}</strong> },
              { key: 'user', label: 'Requester', render: (b) => `${b.user} (${b.department})` },
              { key: 'resources', label: 'Resource', render: (b) => <strong>{b.resources}</strong> },
              { key: 'purpose', label: 'Purpose' },
              { key: 'start_time', label: 'Start', render: (b) => b.start_time?.slice(0, 16) },
              { key: 'end_time', label: 'End', render: (b) => b.end_time?.slice(0, 16) },
              { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> }
            ]}
            data={bookings}
            pageSize={8}
          />
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><Wrench size={18} /> Maintenance Ledger</h3>
          </div>
          <DataTable 
            columns={[
              { key: 'resource_name', label: 'Facility', render: (m) => <strong>{m.resource_name} ({m.resource_code})</strong> },
              { key: 'issue_description', label: 'Issue Description' },
              { key: 'reported_by', label: 'Reported By' },
              { key: 'start_time', label: 'Started', render: (m) => m.start_time?.slice(0, 16) },
              { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.status} /> },
              { key: 'cost', label: 'Repair Cost', render: (m) => m.cost ? `\$${m.cost}` : '—' }
            ]}
            data={maintenance}
            pageSize={8}
          />
        </div>
      )}

      {/* SQL Engine & RBAC Console Tab */}
      {activeTab === 'sql-engine' && (
        <SqlEngineConsole />
      )}

      {/* Reports & System Settings Fallback */}
      {(activeTab === 'reports' || activeTab === 'settings' || activeTab === 'locations' || activeTab === 'resource-types') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-academic">
            <div className="card-header-academic">
              <h3><Settings size={18} /> Administrative System & Security Overview</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Institutional governance policies, access controls, database triggers, and RBAC matrix are active and monitored in real-time.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-academic btn-primary"
                onClick={() => setActiveTab('sql-engine')}
              >
                Launch SQL Engine & RBAC Console
              </button>
              <button 
                className="btn-academic btn-secondary"
                onClick={() => setActiveTab('overview')}
              >
                Return to Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {isAddResourceOpen && (
        <Modal
          isOpen={isAddResourceOpen}
          onClose={() => setIsAddResourceOpen(false)}
          title="Register Campus Facility or Asset"
          maxWidth="620px"
        >
          <form onSubmit={handleCreateResource}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group-academic">
                <label className="form-label-academic">Resource Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. LAB-401"
                  className="form-input-academic"
                  value={newResource.resource_code}
                  onChange={(e) => setNewResource({ ...newResource, resource_code: e.target.value })}
                />
              </div>

              <div className="form-group-academic">
                <label className="form-label-academic">Resource Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. AI & Robotics Lab"
                  className="form-input-academic"
                  value={newResource.resource_name}
                  onChange={(e) => setNewResource({ ...newResource, resource_name: e.target.value })}
                />
              </div>

              <div className="form-group-academic">
                <label className="form-label-academic">Category Type</label>
                <select 
                  required
                  className="form-select-academic"
                  value={newResource.type_id}
                  onChange={(e) => setNewResource({ ...newResource, type_id: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {(lookups.types || []).map((t) => (
                    <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-academic">
                <label className="form-label-academic">Building & Room Location</label>
                <select 
                  required
                  className="form-select-academic"
                  value={newResource.location_id}
                  onChange={(e) => setNewResource({ ...newResource, location_id: e.target.value })}
                >
                  <option value="">Select Location</option>
                  {(lookups.locations || []).map((l) => (
                    <option key={l.location_id} value={l.location_id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-academic">
                <label className="form-label-academic">Assigned Coordinator</label>
                <select 
                  required
                  className="form-select-academic"
                  value={newResource.coordinator_id}
                  onChange={(e) => setNewResource({ ...newResource, coordinator_id: e.target.value })}
                >
                  <option value="">Select Coordinator</option>
                  {(lookups.coordinators || []).map((c) => (
                    <option key={c.user_id} value={c.user_id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-academic">
                <label className="form-label-academic">Seating / User Capacity</label>
                <input 
                  type="number" 
                  min={1}
                  required
                  className="form-input-academic"
                  value={newResource.capacity}
                  onChange={(e) => setNewResource({ ...newResource, capacity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn-academic btn-secondary"
                onClick={() => setIsAddResourceOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-academic btn-primary"
              >
                Create Resource
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
