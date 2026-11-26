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
  FileText,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MultiStepBookingModal } from '../../components/booking/MultiStepBookingModal';
import { api, qs, showToast } from '../../services/api';

export function StudentDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [lookups, setLookups] = useState({ resources: [], types: [], locations: [], departments: [] });
  const [loading, setLoading] = useState(true);

  // Filter states for Explore tab
  const [resourceSearch, setResourceSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, lookupsData] = await Promise.all([
        api('/bookings').catch(() => []),
        api('/lookups').catch(() => ({ resources: [], types: [], locations: [], departments: [] }))
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setLookups(lookupsData);
    } catch (err) {
      showToast('Error syncing student data: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute student stats
  const stats = useMemo(() => {
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    const total = safeBookings.length;
    const pending = safeBookings.filter((b) => b.status === 'PENDING').length;
    const approved = safeBookings.filter((b) => b.status === 'APPROVED').length;
    const completed = safeBookings.filter((b) => b.status === 'COMPLETED').length;
    return { total, pending, approved, completed };
  }, [bookings]);

  // Cancel reservation
  const handleCancelBooking = async (booking) => {
    const reason = window.prompt(`Enter reason for cancelling Booking #${booking.booking_id}:`);
    if (reason === null) return;
    try {
      await api(`/bookings/${booking.booking_id}/cancel`, {
        method: 'PATCH',
        body: { reason: reason || 'Cancelled by student' }
      });
      showToast(`Booking #${booking.booking_id} cancelled.`, 'ok');
      loadData();
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  // Filtered resources for exploration
  const filteredResources = useMemo(() => {
    return (lookups.resources || []).filter((r) => {
      const q = (resourceSearch || searchQuery).toLowerCase();
      const matchSearch = !q || 
        r.resource_name.toLowerCase().includes(q) || 
        r.resource_code.toLowerCase().includes(q);
      const matchType = !selectedType || String(r.type_id) === String(selectedType);
      const matchLoc = !selectedLocation || String(r.location_id) === String(selectedLocation);
      return matchSearch && matchType && matchLoc;
    });
  }, [lookups.resources, resourceSearch, searchQuery, selectedType, selectedLocation]);

  const bookingColumns = [
    { key: 'booking_id', label: 'ID', headerStyle: { width: '70px' }, render: (b) => <strong className="num-tabular">#{b.booking_id}</strong> },
    { key: 'resources', label: 'Booked Facility / Equipment', render: (b) => <span style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{b.resources || 'Resource'}</span> },
    { key: 'purpose', label: 'Academic Purpose' },
    { key: 'start_time', label: 'Start Time', render: (b) => <span className="num-tabular">{b.start_time?.slice(0, 16)}</span> },
    { key: 'end_time', label: 'End Time', render: (b) => <span className="num-tabular">{b.end_time?.slice(0, 16)}</span> },
    { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (b) => (
        <div>
          {['PENDING', 'APPROVED'].includes(b.status) && (
            <button 
              className="btn-academic btn-danger btn-sm"
              onClick={() => handleCancelBooking(b)}
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
      roleTitle="Student Portal"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenBookingModal={() => setIsBookingModalOpen(true)}
    >
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Welcome Header */}
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
                Academic Year 2026–2027
              </span>
              <h1 style={{ marginTop: '4px' }}>
                Welcome back, {currentUser?.full_name?.split(' ')[0]}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Manage your lab reservations, workshop access, and hardware kits.
              </p>
            </div>

            <button 
              className="btn-academic btn-primary btn-lg"
              onClick={() => setIsBookingModalOpen(true)}
            >
              <Plus size={16} />
              <span>Request Lab Slot</span>
            </button>
          </div>

          {/* Stat Cards */}
          <div className="stats-grid">
            <StatCard 
              title="Total Reservations" 
              value={stats.total} 
              subtext="Semester requests"
              icon={Calendar} 
            />
            <StatCard 
              title="Pending Reviews" 
              value={stats.pending} 
              subtext="Awaiting coordinator"
              icon={Clock} 
              color="var(--gold-dark)"
            />
            <StatCard 
              title="Approved Slots" 
              value={stats.approved} 
              subtext="Ready for check-in"
              icon={CheckCircle2} 
              color="var(--success-text)"
            />
            <StatCard 
              title="Completed Sessions" 
              value={stats.completed} 
              subtext="Logged lab hours"
              icon={CalendarDays} 
            />
          </div>

          {/* Quick Explore & Upcoming */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
            <div className="card-academic">
              <div className="card-header-academic">
                <h3><Calendar size={18} /> Upcoming Academic Reservations</h3>
                <button 
                  className="btn-academic btn-secondary btn-sm"
                  onClick={() => setActiveTab('my-bookings')}
                >
                  View All
                </button>
              </div>

              <DataTable 
                columns={bookingColumns} 
                data={bookings.filter(b => ['PENDING', 'APPROVED'].includes(b.status)).slice(0, 5)}
                pageSize={5}
                emptyMessage="No pending or approved upcoming reservations."
              />
            </div>

            <div className="card-academic">
              <div className="card-header-academic">
                <h3><Sparkles size={18} /> Quick Facilities</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(lookups.resources || []).slice(0, 4).map((r) => (
                  <div 
                    key={r.resource_id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--ivory-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--navy-primary)' }}>{r.resource_name}</strong>
                      <p style={{ fontSize: '0.72rem', color: 'var(--slate-grey)' }}>{r.resource_code}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
              <button 
                className="btn-academic btn-secondary"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => setActiveTab('explore')}
              >
                <span>Browse Full Catalogue</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explore Resources Tab */}
      {activeTab === 'explore' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Search size={18} /> Campus Resource Catalogue</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-grey)', marginTop: '2px' }}>
                Discover computer labs, 3D printers, seminar halls, and measurement instruments.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input 
                type="text" 
                placeholder="Search facility by name or identifier…" 
                className="form-input-academic"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>

            <select 
              className="form-select-academic"
              style={{ width: '200px' }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Categories</option>
              {(lookups.types || []).map((t) => (
                <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
              ))}
            </select>

            <select 
              className="form-select-academic"
              style={{ width: '200px' }}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {(lookups.locations || []).map((l) => (
                <option key={l.location_id} value={l.location_id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Resources Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {filteredResources.map((res) => (
              <div 
                key={res.resource_id}
                style={{
                  border: '1px solid var(--border-grey)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  backgroundColor: 'var(--white)',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <StatusBadge status={res.status} />
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--slate-grey)', backgroundColor: 'var(--ivory-warm)', padding: '2px 6px', borderRadius: '4px' }}>
                      {res.resource_code}
                    </span>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--navy-primary)', fontSize: '1.05rem', marginBottom: '8px' }}>
                    {res.resource_name}
                  </h4>

                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-grey)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} color="var(--gold-muted)" /> {res.type_name || 'Academic Facility'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--gold-muted)" /> {res.location || 'Campus Core'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="var(--gold-muted)" /> Capacity: {res.capacity || 1} people
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--gold-muted)" /> Max Duration: {res.max_booking_hours || 4} hours
                    </span>
                  </div>
                </div>

                <button 
                  className="btn-academic btn-primary btn-sm"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={res.status !== 'AVAILABLE'}
                  onClick={() => setIsBookingModalOpen(true)}
                >
                  {res.status === 'AVAILABLE' ? 'Book This Resource' : 'Unavailable'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Bookings & History Tabs */}
      {(activeTab === 'my-bookings' || activeTab === 'history') && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3>
                {activeTab === 'my-bookings' ? <Calendar size={18} /> : <Clock size={18} />}
                {activeTab === 'my-bookings' ? 'Active & Upcoming Reservations' : 'Complete Booking Log'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-grey)', marginTop: '2px' }}>
                Official reservation records maintained under 3NF transactional integrity.
              </p>
            </div>

            <button 
              className="btn-academic btn-gold btn-sm"
              onClick={() => setIsBookingModalOpen(true)}
            >
              <Plus size={14} />
              <span>New Reservation</span>
            </button>
          </div>

          <DataTable 
            columns={bookingColumns} 
            data={activeTab === 'my-bookings' 
              ? bookings.filter((b) => ['PENDING', 'APPROVED'].includes(b.status))
              : bookings
            } 
            pageSize={8}
            emptyMessage="No reservation records found for your account."
          />
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><CalendarDays size={18} /> Institutional Bulletins & Alerts</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-grey)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--ivory-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--navy-primary)' }}>Final-Year Project Priority Booking</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-grey)' }}>Today, 09:30 AM</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-grey)' }}>
                Electronics Lab 101 and Robotics Lab are reserved for Capstone practical demonstrations between 10:00 AM and 04:00 PM.
              </p>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-grey)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--ivory-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--navy-primary)' }}>Scheduled Maintenance Notice</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-grey)' }}>23 Nov 2026</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-grey)' }}>
                3D Printer #2 is currently under routine recalibration. Alternate bookings should be directed to Printer #1.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card-academic" style={{ maxWidth: '640px' }}>
          <div className="card-header-academic">
            <h3><Users size={18} /> Academic Student Dossier</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Full Name:</span>
              <strong>{currentUser?.full_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Institutional Email:</span>
              <strong>{currentUser?.email || 'rohan.gupta@campus.edu'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Primary Department:</span>
              <strong>{currentUser?.dept_name || 'Computer Science and Engineering'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Authorized Role:</span>
              <StatusBadge status="STUDENT" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--slate-grey)' }}>Account Standing:</span>
              <StatusBadge status="ACTIVE" />
            </div>
          </div>
        </div>
      )}

      {/* Multi-step booking modal */}
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
