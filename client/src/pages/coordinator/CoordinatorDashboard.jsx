import { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  Layers, 
  Search, 
  FileText, 
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { SqlEngineConsole } from '../../components/sql/SqlEngineConsole';
import { api, qs, showToast } from '../../services/api';

export function CoordinatorDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [approvals, setApprovals] = useState([]);
  const [resources, setResources] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apprData, resData, maintData] = await Promise.all([
        api('/approvals' + qs({ status: statusFilter || undefined })).catch(() => []),
        api('/resources').catch(() => []),
        api('/maintenance').catch(() => [])
      ]);
      setApprovals(Array.isArray(apprData) ? apprData : []);
      setResources(Array.isArray(resData) ? resData : []);
      setMaintenance(Array.isArray(maintData) ? maintData : []);
    } catch (err) {
      showToast('Error syncing coordinator queue: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Statistics
  const pendingApprovalsCount = useMemo(() => {
    return (Array.isArray(approvals) ? approvals : []).filter((a) => a.status === 'PENDING').length;
  }, [approvals]);

  const activeMaintenanceCount = useMemo(() => {
    return (Array.isArray(maintenance) ? maintenance : []).filter((m) => m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED').length;
  }, [maintenance]);

  // Approval decision handler
  const handleDecision = async (booking, decision) => {
    const remarks = window.prompt(`Enter coordinator remarks for ${decision}:`) || '';
    try {
      await api(`/approvals/${booking.booking_id}`, {
        method: 'POST',
        body: { decision, remarks }
      });
      showToast(`Booking #${booking.booking_id} marked as ${decision}`, 'ok');
      loadData();
      setSelectedBooking(null);
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  // Change resource status
  const handleResourceStatus = async (resourceId, newStatus) => {
    try {
      await api(`/resources/${resourceId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      showToast(`Resource status updated to ${newStatus}`, 'ok');
      loadData();
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  const approvalColumns = [
    { key: 'booking_id', label: 'ID', headerStyle: { width: '70px' }, render: (b) => <strong className="num-tabular">#{b.booking_id}</strong> },
    { key: 'user', label: 'Requester', render: (b) => <strong>{b.user} ({b.department})</strong> },
    { key: 'resources', label: 'Facility Requested', render: (b) => <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{b.resources}</span> },
    { key: 'purpose', label: 'Academic Purpose' },
    { key: 'start_time', label: 'Start Time', render: (b) => <span className="num-tabular">{b.start_time?.slice(0, 16)}</span> },
    { key: 'end_time', label: 'End Time', render: (b) => <span className="num-tabular">{b.end_time?.slice(0, 16)}</span> },
    { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      label: 'Coordinator Decision',
      render: (b) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn-academic btn-secondary btn-sm"
            onClick={() => setSelectedBooking(b)}
            title="Inspect full details"
          >
            <Eye size={13} />
            <span>Details</span>
          </button>
          {b.status === 'PENDING' && (
            <>
              <button 
                className="btn-academic btn-success btn-sm"
                onClick={() => handleDecision(b, 'APPROVED')}
              >
                <Check size={13} />
                <span>Approve</span>
              </button>
              <button 
                className="btn-academic btn-danger btn-sm"
                onClick={() => handleDecision(b, 'REJECTED')}
              >
                <X size={13} />
                <span>Reject</span>
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleTitle="Coordinator Portal"
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
                Resource Oversight & Lab Governance
              </span>
              <h1 style={{ marginTop: '4px' }}>
                Coordinator Console — {currentUser?.full_name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Review department requests, schedule equipment maintenance, and manage laboratory capacity.
              </p>
            </div>

            <button 
              className="btn-academic btn-primary btn-lg"
              onClick={() => setActiveTab('approvals')}
            >
              <ShieldCheck size={16} />
              <span>Pending Requests ({pendingApprovalsCount})</span>
            </button>
          </div>

          <div className="stats-grid">
            <StatCard 
              title="Pending Approval Queue" 
              value={pendingApprovalsCount} 
              subtext="Action required"
              icon={Clock} 
              color="var(--gold-dark)"
            />
            <StatCard 
              title="Managed Resources" 
              value={resources.length} 
              subtext="Laboratories & devices"
              icon={Layers} 
            />
            <StatCard 
              title="Active Maintenance" 
              value={activeMaintenanceCount} 
              subtext="Out of service"
              icon={Wrench} 
              color="var(--error-text)"
            />
            <StatCard 
              title="Approved Sessions" 
              value={(Array.isArray(approvals) ? approvals : []).filter(a => a.status === 'APPROVED').length} 
              subtext="Scheduled this month"
              icon={CheckCircle2} 
              color="var(--success-text)"
            />
          </div>

          <div className="card-academic" style={{ marginBottom: '28px' }}>
            <div className="card-header-academic">
              <h3><ShieldCheck size={18} /> High-Priority Approval Queue</h3>
              <button 
                className="btn-academic btn-secondary btn-sm"
                onClick={() => setActiveTab('approvals')}
              >
                Open Full Queue
              </button>
            </div>
            <DataTable 
              columns={approvalColumns} 
              data={(Array.isArray(approvals) ? approvals : []).filter(a => a.status === 'PENDING')}
              pageSize={5}
              emptyMessage="No pending reservation requests awaiting coordinator review."
            />
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><ShieldCheck size={18} /> Institutional Reservation Review Queue</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-grey)', marginTop: '2px' }}>
                Every reservation requires coordinator validation. Conflicting time slots trigger backend error rejection.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['PENDING', 'APPROVED', 'REJECTED', ''].map((st) => (
                <button
                  key={st}
                  className={`btn-academic btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st || 'All Statuses'}
                </button>
              ))}
            </div>
          </div>

          <DataTable 
            columns={approvalColumns} 
            data={approvals}
            pageSize={8}
            emptyMessage="No requests found under selected filter."
          />
        </div>
      )}

      {/* Resource Management Tab */}
      {activeTab === 'resources' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Layers size={18} /> Managed Facilities & Availability Control</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-grey)', marginTop: '2px' }}>
                Update laboratory or instrument status between AVAILABLE and UNDER_MAINTENANCE.
              </p>
            </div>
          </div>

          <DataTable 
            columns={[
              { key: 'resource_code', label: 'Code', render: (r) => <strong className="num-tabular">{r.resource_code}</strong> },
              { key: 'resource_name', label: 'Facility Name', render: (r) => <strong>{r.resource_name}</strong> },
              { key: 'type_name', label: 'Type' },
              { key: 'location', label: 'Location' },
              { key: 'capacity', label: 'Capacity', render: (r) => `${r.capacity} seats` },
              { key: 'status', label: 'Current Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'update_status',
                label: 'Set Operational Status',
                render: (r) => (
                  <select 
                    className="form-select-academic"
                    style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                    value={r.status}
                    onChange={(e) => handleResourceStatus(r.resource_id, e.target.value)}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                )
              }
            ]}
            data={resources}
            pageSize={8}
          />
        </div>
      )}

      {/* Maintenance Overview Tab */}
      {activeTab === 'maintenance' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><Wrench size={18} /> Facility Maintenance Overview</h3>
          </div>
          <DataTable 
            columns={[
              { key: 'resource_name', label: 'Equipment / Lab', render: (m) => <strong>{m.resource_name} ({m.resource_code})</strong> },
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

      {/* SQL Engine & Triggers Tab */}
      {activeTab === 'sql-engine' && (
        <SqlEngineConsole />
      )}

      {/* Booking Calendar / Logs / Reports / Profile */}
      {(activeTab === 'calendar' || activeTab === 'logs' || activeTab === 'reports') && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><FileText size={18} /> Institutional Reservation & Usage Ledger</h3>
          </div>
          <DataTable 
            columns={approvalColumns} 
            data={approvals}
            pageSize={8}
          />
        </div>
      )}

      {/* Details Modal */}
      {selectedBooking && (
        <Modal 
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Audit Dossier #${selectedBooking.booking_id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Requester:</span>
              <strong>{selectedBooking.user}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Department:</span>
              <strong>{selectedBooking.department}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resource:</span>
              <strong>{selectedBooking.resources}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Time Window:</span>
              <strong>{selectedBooking.start_time?.slice(0, 16)} to {selectedBooking.end_time?.slice(0, 16)}</strong>
            </div>
            <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Stated Academic Purpose:</span>
              <p style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--card-border)' }}>
                {selectedBooking.purpose}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <StatusBadge status={selectedBooking.status} />
            </div>

            {selectedBooking.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button 
                  className="btn-academic btn-success"
                  style={{ flex: 1 }}
                  onClick={() => handleDecision(selectedBooking, 'APPROVED')}
                >
                  <Check size={16} />
                  <span>Authorize Booking</span>
                </button>
                <button 
                  className="btn-academic btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => handleDecision(selectedBooking, 'REJECTED')}
                >
                  <X size={16} />
                  <span>Decline with Remarks</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
