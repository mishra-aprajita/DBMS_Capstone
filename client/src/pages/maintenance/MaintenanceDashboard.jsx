import { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Plus, 
  DollarSign, 
  FileText,
  Play,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { api, showToast } from '../../services/api';

export function MaintenanceDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [maintenance, setMaintenance] = useState([]);
  const [resources, setResources] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({ resource_id: '', issue_description: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [maintList, resList] = await Promise.all([
        api('/maintenance').catch(() => []),
        api('/resources').catch(() => [])
      ]);
      setMaintenance(maintList || []);
      setResources(resList || []);
    } catch (err) {
      showToast('Error syncing maintenance records: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute maintenance statistics
  const stats = useMemo(() => {
    const total = maintenance.length;
    const inProgress = maintenance.filter((m) => m.status === 'IN_PROGRESS').length;
    const scheduled = maintenance.filter((m) => m.status === 'SCHEDULED').length;
    const completed = maintenance.filter((m) => m.status === 'COMPLETED').length;
    const totalExpenditure = maintenance
      .filter((m) => m.cost != null)
      .reduce((sum, m) => sum + Number(m.cost || 0), 0);

    return { total, inProgress, scheduled, completed, totalExpenditure };
  }, [maintenance]);

  // Update status (e.g., SCHEDULED -> IN_PROGRESS, or IN_PROGRESS -> COMPLETED)
  const handleUpdateStatus = async (item, newStatus) => {
    let cost = '';
    if (newStatus === 'COMPLETED') {
      const enteredCost = window.prompt('Enter final repair expenditure cost (e.g. 150.00), or leave blank:');
      if (enteredCost === null) return;
      cost = enteredCost;
    }

    try {
      await api(`/maintenance/${item.maintenance_id}`, {
        method: 'PATCH',
        body: { status: newStatus, cost }
      });
      showToast(`Maintenance #${item.maintenance_id} updated to ${newStatus}`, 'ok');
      loadData();
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  // Submit new maintenance ticket
  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!newIssue.resource_id || !newIssue.issue_description.trim()) {
      showToast('Please select a facility and describe the maintenance problem.', 'err');
      return;
    }

    try {
      await api('/maintenance', {
        method: 'POST',
        body: newIssue
      });
      showToast('Maintenance ticket registered successfully.', 'ok');
      setIsReportModalOpen(false);
      setNewIssue({ resource_id: '', issue_description: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  const columns = [
    { key: 'maintenance_id', label: 'Ticket', headerStyle: { width: '80px' }, render: (m) => <strong className="num-tabular">#{m.maintenance_id}</strong> },
    { key: 'resource_name', label: 'Resource / Hardware', render: (m) => <strong>{m.resource_name} ({m.resource_code})</strong> },
    { key: 'issue_description', label: 'Problem Diagnosis' },
    { key: 'reported_by', label: 'Reported By' },
    { key: 'start_time', label: 'Logged At', render: (m) => <span className="num-tabular">{m.start_time?.slice(0, 16)}</span> },
    { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.status} /> },
    { key: 'cost', label: 'Cost', render: (m) => <span className="num-tabular">{m.cost ? `\$${Number(m.cost).toFixed(2)}` : '—'}</span> },
    {
      key: 'actions',
      label: 'Engineer Actions',
      render: (m) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {m.status === 'SCHEDULED' && (
            <button 
              className="btn-academic btn-primary btn-sm"
              onClick={() => handleUpdateStatus(m, 'IN_PROGRESS')}
            >
              <Play size={13} />
              <span>Begin Repair</span>
            </button>
          )}
          {m.status === 'IN_PROGRESS' && (
            <button 
              className="btn-academic btn-success btn-sm"
              onClick={() => handleUpdateStatus(m, 'COMPLETED')}
            >
              <Check size={13} />
              <span>Mark Complete</span>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleTitle="Maintenance Engineering Portal"
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
                Campus Facilities & Engineering Operations
              </span>
              <h1 style={{ marginTop: '4px' }}>
                Maintenance Console — {currentUser?.full_name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Log repair work orders, track equipment downtime, and account for repair costs.
              </p>
            </div>

            <button 
              className="btn-academic btn-primary btn-lg"
              onClick={() => setIsReportModalOpen(true)}
            >
              <Plus size={16} />
              <span>Report Equipment Fault</span>
            </button>
          </div>

          <div className="stats-grid">
            <StatCard 
              title="Active In-Progress Repairs" 
              value={stats.inProgress} 
              subtext="Under active remediation"
              icon={Wrench} 
              color="var(--gold-dark)"
            />
            <StatCard 
              title="Scheduled Maintenance" 
              value={stats.scheduled} 
              subtext="Pending engineering shift"
              icon={Clock} 
            />
            <StatCard 
              title="Completed Restorations" 
              value={stats.completed} 
              subtext="Returned to AVAILABLE state"
              icon={CheckCircle2} 
              color="var(--success-text)"
            />
            <StatCard 
              title="Total Repair Expenditure" 
              value={`\$${stats.totalExpenditure.toFixed(2)}`} 
              subtext="Institutional repair ledger"
              icon={DollarSign} 
            />
          </div>

          <div className="card-academic" style={{ marginBottom: '28px' }}>
            <div className="card-header-academic">
              <h3><AlertTriangle size={18} /> High-Priority Active Repair Jobs</h3>
              <button 
                className="btn-academic btn-secondary btn-sm"
                onClick={() => setActiveTab('requests')}
              >
                View All Work Orders
              </button>
            </div>
            <DataTable 
              columns={columns} 
              data={maintenance.filter(m => m.status === 'IN_PROGRESS')}
              pageSize={5}
              emptyMessage="No ongoing repair jobs currently active."
            />
          </div>
        </div>
      )}

      {/* Requests / Assigned / History Tabs */}
      {(activeTab === 'requests' || activeTab === 'assigned' || activeTab === 'scheduled' || activeTab === 'completed' || activeTab === 'history') && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Wrench size={18} /> Facility Work Orders & Technical Ledger</h3>
            </div>
            <button 
              className="btn-academic btn-gold btn-sm"
              onClick={() => setIsReportModalOpen(true)}
            >
              <Plus size={14} />
              <span>Create Work Order</span>
            </button>
          </div>
          <DataTable 
            columns={columns} 
            data={maintenance}
            pageSize={8}
          />
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Create Maintenance Work Order"
          maxWidth="560px"
        >
          <form onSubmit={handleReportIssue}>
            <div className="form-group-academic">
              <label className="form-label-academic">Select Facility or Device</label>
              <select 
                required
                className="form-select-academic"
                value={newIssue.resource_id}
                onChange={(e) => setNewIssue({ ...newIssue, resource_id: e.target.value })}
              >
                <option value="">Select Resource</option>
                {resources.map((r) => (
                  <option key={r.resource_id} value={r.resource_id}>
                    {r.resource_name} ({r.resource_code}) — Currently {r.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-academic">
              <label className="form-label-academic">Fault Description & Diagnostic Findings</label>
              <textarea 
                rows={4}
                required
                placeholder="e.g. Projector lamp blown, extruder jammed on 3D printer, or HVAC temperature sensor fault."
                className="form-textarea-academic"
                value={newIssue.issue_description}
                onChange={(e) => setNewIssue({ ...newIssue, issue_description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn-academic btn-secondary"
                onClick={() => setIsReportModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-academic btn-primary"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
