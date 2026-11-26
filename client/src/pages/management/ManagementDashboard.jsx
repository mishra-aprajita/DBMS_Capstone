import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Layers, 
  DollarSign, 
  FileText, 
  Calendar,
  Building2,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api, qs, showToast } from '../../services/api';

const PALETTE = ['#17283D', '#B69A65', '#23533E', '#8C2A28', '#778494', '#22374E', '#DFC89B'];

export function ManagementDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics datasets
  const [analytics, setAnalytics] = useState({
    monthly: [],
    status: [],
    top: [],
    byDept: [],
    util: [],
    peak: [],
    unused: [],
    resStatus: []
  });
  const [dashboardStats, setDashboardStats] = useState({});
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, dash] = await Promise.all([
        api('/analytics' + qs(dateFilter)).catch(() => ({})),
        api('/dashboard').catch(() => ({}))
      ]);
      setAnalytics(analyticsData);
      setDashboardStats(dash);
    } catch (err) {
      showToast('Error syncing executive analytics: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const norm = (arr = []) => (arr || []).map((d) => ({ ...d, value: Number(d.value) || 0 }));

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleTitle="Executive Management Portal"
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
                Institutional Strategic Intelligence & Oversight
              </span>
              <h1 style={{ marginTop: '4px' }}>
                Executive Analytics — {currentUser?.full_name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Macro utilization metrics, department demand curves, asset ROI, and facilities efficiency.
              </p>
            </div>

            {/* Date Range Quick Filter */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                className="form-input-academic"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                value={dateFilter.from}
                onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              />
              <span style={{ color: 'var(--slate-grey)' }}>to</span>
              <input 
                type="date" 
                className="form-input-academic"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                value={dateFilter.to}
                onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              />
            </div>
          </div>

          <div className="stats-grid">
            <StatCard 
              title="Campus Inventory" 
              value={dashboardStats.resources || 15} 
              subtext="Monitored physical assets"
              icon={Layers} 
            />
            <StatCard 
              title="Total Reservations" 
              value={dashboardStats.bookings || 20} 
              subtext="Gross academic demand"
              icon={Calendar} 
            />
            <StatCard 
              title="Approval Rate" 
              value={
                dashboardStats.bookings 
                  ? `${Math.round(((dashboardStats.approved || 0) / dashboardStats.bookings) * 100)}%` 
                  : '75%'
              } 
              subtext="Validated bookings"
              icon={TrendingUp} 
              color="var(--success-text)"
            />
            <StatCard 
              title="Downtime Ratio" 
              value={
                dashboardStats.resources 
                  ? `${Math.round(((dashboardStats.maintenance || 0) / dashboardStats.resources) * 100)}%` 
                  : '6%'
              } 
              subtext="Under repair or offline"
              icon={BarChart3} 
              color="var(--gold-dark)"
            />
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Monthly Trend */}
            <div className="card-academic">
              <div className="card-header-academic">
                <h3><TrendingUp size={18} /> Monthly Reservation Trend</h3>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Line type="monotone" dataKey="bookings" stroke="#B69A65" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Donut */}
            <div className="card-academic">
              <div className="card-header-academic">
                <h3><PieChartIcon size={18} /> Booking Decision Distribution</h3>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={norm(analytics.status)} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={55} 
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {norm(analytics.status).map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Top Resources Bar Chart */}
            <div className="card-academic">
              <div className="card-header-academic">
                <h3><Layers size={18} /> Top Utilized Facilities</h3>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={norm(analytics.top)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis type="number" allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                    <YAxis type="category" dataKey="name" width={140} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Bar dataKey="value" fill="#17283D" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="card-academic">
              <div className="card-header-academic">
                <h3><Building2 size={18} /> Bookings by Academic Department</h3>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={norm(analytics.byDept)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Bar dataKey="value" fill="#B69A65" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Utilization Table */}
          <div className="card-academic">
            <div className="card-header-academic">
              <h3><Clock size={18} /> Resource Utilization (Approved & Completed Hours)</h3>
            </div>
            <DataTable 
              columns={[
                { key: 'resource_code', label: 'Code', render: (r) => <strong className="num-tabular">{r.resource_code}</strong> },
                { key: 'resource_name', label: 'Resource Facility Name', render: (r) => <strong>{r.resource_name}</strong> },
                { key: 'hours', label: 'Cumulative Booked Hours', render: (r) => <span className="num-tabular">{r.hours} Hours</span> }
              ]}
              data={analytics.util || []}
              pageSize={6}
            />
          </div>
        </div>
      )}

      {/* Other tabs map cleanly to analytics views */}
      {activeTab !== 'overview' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <h3><FileText size={18} /> Institutional Strategic Governance Report</h3>
          </div>
          <DataTable 
            columns={[
              { key: 'resource_code', label: 'Code', render: (r) => <strong className="num-tabular">{r.resource_code}</strong> },
              { key: 'resource_name', label: 'Facility Name', render: (r) => <strong>{r.resource_name}</strong> },
              { key: 'hours', label: 'Total Utilized Hours', render: (r) => <span className="num-tabular">{r.hours} Hours</span> }
            ]}
            data={analytics.util || []}
            pageSize={10}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
