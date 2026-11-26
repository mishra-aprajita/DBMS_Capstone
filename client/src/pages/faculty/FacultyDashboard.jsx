import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Layers, 
  MapPin, 
  Users, 
  BookOpen,
  CalendarDays,
  Sparkles,
  Award,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MultiStepBookingModal } from '../../components/booking/MultiStepBookingModal';
import { api, showToast } from '../../services/api';

export function FacultyDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [lookups, setLookups] = useState({ resources: [], types: [], locations: [], departments: [] });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, lookupsData] = await Promise.all([
        api('/bookings').catch(() => []),
        api('/lookups').catch(() => ({ resources: [], types: [], locations: [], departments: [] }))
      ]);
      setBookings(bookingsData || []);
      setLookups(lookupsData);
    } catch (err) {
      showToast('Error syncing faculty data: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const approved = bookings.filter((b) => b.status === 'APPROVED').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    return { total, pending, approved, completed };
  }, [bookings]);

  const handleCancel = async (booking) => {
    const reason = window.prompt(`Faculty cancellation remarks for Booking #${booking.booking_id}:`);
    if (reason === null) return;
    try {
      await api(`/bookings/${booking.booking_id}/cancel`, {
        method: 'PATCH',
        body: { reason: reason || 'Cancelled by instructor' }
      });
      showToast(`Reservation #${booking.booking_id} cancelled.`, 'ok');
      loadData();
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  const bookingColumns = [
    { key: 'booking_id', label: 'ID', headerStyle: { width: '70px' }, render: (b) => <strong className="num-tabular">#{b.booking_id}</strong> },
    { key: 'resources', label: 'Resource / Lecture Hall', render: (b) => <strong style={{ color: 'var(--brand-primary)' }}>{b.resources}</strong> },
    { key: 'purpose', label: 'Course / Purpose' },
    { key: 'start_time', label: 'Start', render: (b) => <span className="num-tabular">{b.start_time?.slice(0, 16)}</span> },
    { key: 'end_time', label: 'End', render: (b) => <span className="num-tabular">{b.end_time?.slice(0, 16)}</span> },
    { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (b) => (
        <div>
          {['PENDING', 'APPROVED'].includes(b.status) && (
            <button 
              className="btn-academic btn-danger btn-sm"
              onClick={() => handleCancel(b)}
            >
              <XCircle size={13} />
              <span>Cancel</span>
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
      roleTitle="Faculty Portal"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenBookingModal={() => setIsBookingModalOpen(true)}
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
                Faculty Academic Governance
              </span>
              <h1 style={{ marginTop: '4px' }}>
                Good day, {currentUser?.full_name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Schedule smart classrooms, laboratory practical sessions, and research equipment.
              </p>
            </div>

            <button 
              className="btn-academic btn-primary btn-lg"
              onClick={() => setIsBookingModalOpen(true)}
            >
              <Plus size={16} />
              <span>Reserve Facility</span>
            </button>
          </div>

          <div className="stats-grid">
            <StatCard 
              title="Classroom / Lab Bookings" 
              value={stats.total} 
              subtext="Total course reservations"
              icon={BookOpen} 
            />
            <StatCard 
              title="Pending Approvals" 
              value={stats.pending} 
              subtext="Under coordinator review"
              icon={Clock} 
              color="var(--gold-dark)"
            />
            <StatCard 
              title="Approved Sessions" 
              value={stats.approved} 
              subtext="Scheduled on timetable"
              icon={CheckCircle2} 
              color="var(--success-text)"
            />
            <StatCard 
              title="Completed Lectures" 
              value={stats.completed} 
              subtext="Historical usage logs"
              icon={CalendarDays} 
            />
          </div>

          <div className="card-academic" style={{ marginBottom: '28px' }}>
            <div className="card-header-academic">
              <h3><Calendar size={18} /> Upcoming Class & Laboratory Reservations</h3>
              <button 
                className="btn-academic btn-secondary btn-sm"
                onClick={() => setActiveTab('reservations')}
              >
                View Full Timetable
              </button>
            </div>
            <DataTable 
              columns={bookingColumns} 
              data={bookings.filter(b => ['PENDING', 'APPROVED'].includes(b.status))}
              pageSize={6}
              emptyMessage="No pending or approved upcoming reservations."
            />
          </div>
        </div>
      )}

      {/* Catalogue Tab */}
      {activeTab === 'catalogue' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Layers size={18} /> Department Resource Catalogue</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-grey)', marginTop: '2px' }}>
                View specifications, coordinator details, and seating capacity.
              </p>
            </div>
          </div>
          <DataTable 
            columns={[
              { key: 'resource_code', label: 'Code', render: (r) => <strong className="num-tabular">{r.resource_code}</strong> },
              { key: 'resource_name', label: 'Resource Name', render: (r) => <strong style={{ color: 'var(--navy-primary)' }}>{r.resource_name}</strong> },
              { key: 'type_name', label: 'Category', render: (r) => r.type_name || 'Classroom/Lab' },
              { key: 'location', label: 'Location' },
              { key: 'capacity', label: 'Capacity', render: (r) => <span className="num-tabular">{r.capacity} seats</span> },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'action',
                label: 'Action',
                render: (r) => (
                  <button 
                    className="btn-academic btn-primary btn-sm"
                    disabled={r.status !== 'AVAILABLE'}
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    Reserve
                  </button>
                )
              }
            ]}
            data={lookups.resources || []}
            pageSize={8}
          />
        </div>
      )}

      {/* Reservations & Usage History Tabs */}
      {(activeTab === 'reservations' || activeTab === 'usage-history' || activeTab === 'new-booking') && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><CalendarDays size={18} /> Faculty Reservation History</h3>
            <button 
              className="btn-academic btn-gold btn-sm"
              onClick={() => setIsBookingModalOpen(true)}
            >
              <Plus size={14} />
              <span>Schedule New Session</span>
            </button>
          </div>
          <DataTable 
            columns={bookingColumns} 
            data={bookings}
            pageSize={8}
          />
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card-academic" style={{ maxWidth: '640px' }}>
          <div className="card-header-academic">
            <h3><Users size={18} /> Faculty Academic Credentials</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Faculty Name:</span>
              <strong>{currentUser?.full_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Academic Email:</span>
              <strong>{currentUser?.email || 'anita.sharma@campus.edu'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Department:</span>
              <strong>{currentUser?.dept_name || 'Computer Science and Engineering'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Designation:</span>
              <StatusBadge status="FACULTY" />
            </div>
          </div>
        </div>
      )}

      {/* Multi-step Booking Modal */}
      {isBookingModalOpen && (
        <MultiStepBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          lookups={lookups}
          onBookingSuccess={loadData}
        />
      )}
    </DashboardLayout>
  );
}
