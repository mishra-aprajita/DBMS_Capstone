import { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Layers, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Lock,
  Code2,
  FileCode,
  Sparkles,
  Server
} from 'lucide-react';
import { api, showToast } from '../../services/api';
import { DataTable } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';

export function SqlEngineConsole() {
  const [activeSubTab, setActiveSubTab] = useState('rbac');
  const [meta, setMeta] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLog, setTxLog] = useState(null);
  const [testingTx, setTestingTx] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sqlData, auditData] = await Promise.all([
        api('/sql-engine').catch(() => null),
        api('/audit').catch(() => [])
      ]);
      if (sqlData) setMeta(sqlData);
      setAuditLogs(auditData || []);
    } catch (err) {
      showToast('Error syncing SQL engine metadata: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const runTransactionTest = async (mode) => {
    setTestingTx(true);
    setTxLog(null);
    try {
      const res = await api('/test-transaction', {
        method: 'POST',
        body: { mode }
      });
      setTxLog(res);
      showToast(`Transaction ${mode.toUpperCase()} simulation executed successfully!`, 'ok');
      // Reload audit logs to see if trigger fired
      const freshAudit = await api('/audit').catch(() => []);
      setAuditLogs(freshAudit || []);
    } catch (err) {
      showToast(err.message, 'err');
    } finally {
      setTestingTx(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--r-xl)',
        padding: '22px 26px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="icon-badge icon-badge-blue" style={{ width: '44px', height: '44px' }}>
            <Database size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
              Relational Database & RBAC Security Console
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '3px' }}>
              MySQL 8.0 Engine • 3NF / BCNF Normalization • Trigger-driven Audit Trail • ACID Transactions
            </p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="btn-academic btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh DB State</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--card-border)',
        paddingBottom: '8px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'rbac', label: 'RBAC Security Matrix', icon: ShieldCheck },
          { id: 'triggers', label: 'Triggers & Audit Trail', icon: Activity, badge: auditLogs.length },
          { id: 'transactions', label: 'ACID Transaction Simulator', icon: Terminal },
          { id: 'functions', label: 'SQL Functions & Schema', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--r-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--brand-light)' : 'transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span style={{
                  backgroundColor: isActive ? 'var(--brand-primary)' : 'var(--card-border)',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--r-full)'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RBAC Security Matrix */}
      {activeSubTab === 'rbac' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><ShieldCheck size={18} /> Role-Based Access Control (RBAC) & Database User Grants</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Enforces least-privilege security via MySQL users (`campus_student`, `campus_coordinator`, `campus_admin`) and application middleware.
              </p>
            </div>
          </div>

          <DataTable 
            columns={[
              { 
                key: 'role', 
                label: 'App Role', 
                render: (r) => <StatusBadge status={r.role} /> 
              },
              { 
                key: 'db_user', 
                label: 'MySQL DB Principal', 
                render: (r) => (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                    {r.db_user}
                  </span>
                )
              },
              { 
                key: 'tables', 
                label: 'Granted Relational Tables', 
                render: (r) => (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-body)' }}>
                    {r.tables}
                  </span>
                )
              },
              { 
                key: 'privileges', 
                label: 'SQL Privileges', 
                render: (r) => (
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    {r.privileges}
                  </strong>
                )
              },
              { 
                key: 'isolation', 
                label: 'Concurrency Lock / Isolation', 
                render: (r) => (
                  <span className="num-tabular" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {r.isolation}
                  </span>
                )
              }
            ]}
            data={meta?.rbac || []}
            pageSize={6}
          />

          {/* SQL Grant Code Preview */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Code2 size={16} style={{ color: 'var(--brand-primary)' }} />
              <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Active MySQL Grant Statements (`sql/security.sql`)</strong>
            </div>
            <pre style={{
              margin: 0,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-body)',
              lineHeight: 1.5,
              overflowX: 'auto'
            }}>
{`GRANT SELECT ON smart_campus.department, location, resource_type, resource TO 'campus_student'@'localhost';
GRANT SELECT, INSERT ON smart_campus.booking, booking_item TO 'campus_student'@'localhost';
GRANT SELECT, INSERT, UPDATE ON smart_campus.booking, approval, maintenance TO 'campus_coordinator'@'localhost';
FLUSH PRIVILEGES;`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: Triggers & Audit Trail */}
      {activeSubTab === 'triggers' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Activity size={18} /> Trigger-driven Audit Trail (`booking_audit`)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Database triggers automatically execute on `booking` table lifecycle transitions, recording immutability timestamps.
              </p>
            </div>
            <button 
              className="btn-academic btn-secondary btn-sm"
              onClick={loadData}
            >
              <RefreshCw size={13} />
              <span>Poll Trigger Stream</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            {(meta?.triggers || []).map((t) => (
              <div 
                key={t.name}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--card-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--brand-primary)' }}>
                    {t.name}
                  </strong>
                  <span className="status-badge available" style={{ fontSize: '0.64rem' }}>
                    {t.timing}
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                  Target: <code>{t.table}</code> • {t.action}
                </p>
              </div>
            ))}
          </div>

          <DataTable 
            columns={[
              { key: 'audit_id', label: 'Audit ID', render: (a) => <strong className="num-tabular">#{a.audit_id}</strong> },
              { key: 'booking_id', label: 'Target Booking', render: (a) => <strong style={{ color: 'var(--brand-primary)' }}>Booking #{a.booking_id}</strong> },
              { key: 'action_type', label: 'Trigger Event', render: (a) => <StatusBadge status={a.action_type} /> },
              { key: 'action_time', label: 'Execution Timestamp', render: (a) => <span className="num-tabular">{a.action_time?.slice(0, 19)}</span> }
            ]}
            data={auditLogs}
            pageSize={8}
            emptyMessage="No audit trigger records captured yet."
          />
        </div>
      )}

      {/* TAB 3: ACID Transaction Simulator */}
      {activeSubTab === 'transactions' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Terminal size={18} /> ACID Transaction & Concurrency Engine Simulator</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Test atomic reservations with pessimistic locks (`FOR UPDATE`) and verify `ROLLBACK` vs `COMMIT` behaviors.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Test Commit */}
            <div style={{
              padding: '18px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                  1. Atomic COMMIT Verification
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Executes `START TRANSACTION`, locks resource rows, inserts header + items atomically, and permanently saves via `COMMIT`.
                </p>
              </div>
              <button 
                className="btn-academic btn-primary btn-sm"
                style={{ marginTop: '14px', width: 'fit-content' }}
                disabled={testingTx}
                onClick={() => runTransactionTest('commit')}
              >
                <CheckCircle2 size={15} />
                <span>Simulate Atomic COMMIT</span>
              </button>
            </div>

            {/* Test Rollback */}
            <div style={{
              padding: '18px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                  2. Atomic ROLLBACK (Abort & Undo)
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Simulates a conflict or integrity abort midway through execution; issues `ROLLBACK` to guarantee zero dirty reads or partial writes.
                </p>
              </div>
              <button 
                className="btn-academic btn-danger btn-sm"
                style={{ marginTop: '14px', width: 'fit-content' }}
                disabled={testingTx}
                onClick={() => runTransactionTest('rollback')}
              >
                <XCircle size={15} />
                <span>Simulate Atomic ROLLBACK</span>
              </button>
            </div>
          </div>

          {/* Real-time Execution Output Terminal */}
          {txLog && (
            <div style={{
              padding: '18px',
              backgroundColor: '#0F172A',
              color: '#38BDF8',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '6px' }}>
                <span>SQL TRANSACTION EXECUTION LOG</span>
                <span style={{ color: txLog.mode === 'commit' ? '#4ADE80' : '#F87171', fontWeight: 700 }}>
                  {txLog.mode?.toUpperCase()} RESULT: SUCCESS
                </span>
              </div>
              {txLog.log?.map((line, idx) => (
                <div key={idx} style={{ color: line.includes('ROLLBACK') ? '#F87171' : line.includes('COMMIT') ? '#4ADE80' : '#E2E8F0' }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SQL Functions & 11-Table Schema */}
      {activeSubTab === 'functions' && (
        <div className="card-academic">
          <div className="card-header-academic">
            <div>
              <h3><Layers size={18} /> Database Functions, Stored Validations & Schema Integrity</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Mathematical overlap conditions, CHECK constraints, and 3NF/BCNF entity-relationship model.
              </p>
            </div>
          </div>

          <DataTable 
            columns={[
              { 
                key: 'name', 
                label: 'SQL Logic / Function', 
                render: (f) => <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--brand-primary)' }}>{f.name}</strong> 
              },
              { key: 'type', label: 'Category' },
              { key: 'returns', label: 'Return Type', render: (f) => <code>{f.returns}</code> },
              { key: 'description', label: 'SQL Implementation Logic' }
            ]}
            data={meta?.functions || []}
            pageSize={6}
          />
        </div>
      )}
    </div>
  );
}
