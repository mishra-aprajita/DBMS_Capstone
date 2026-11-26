import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function DataTable({ 
  columns = [], 
  data = [], 
  pageSize = 8, 
  emptyMessage = "No academic records found.",
  isLoading = false 
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const safeData = Array.isArray(data) ? data : [];

  const totalPages = Math.max(1, Math.ceil(safeData.length / pageSize));
  
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return safeData.slice(start, start + pageSize);
  }, [safeData, currentPage, pageSize]);

  const handlePrev = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  const handleFirst = () => setCurrentPage(0);
  const handleLast = () => setCurrentPage(totalPages - 1);

  if (isLoading) {
    return (
      <div className="academic-table-wrapper" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Loading institutional dataset…</p>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="academic-table-wrapper" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="academic-table-wrapper">
      <table className="academic-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} style={col.headerStyle}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIdx) => (
            <tr key={row.id || row.booking_id || row.resource_id || row.user_id || rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={col.key || colIdx} style={col.cellStyle}>
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {safeData.length > pageSize && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderTop: '1px solid var(--card-border)',
          backgroundColor: 'var(--bg-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing <strong className="num-tabular" style={{ color: 'var(--text-primary)' }}>{currentPage * pageSize + 1}</strong> to <strong className="num-tabular" style={{ color: 'var(--text-primary)' }}>{Math.min((currentPage + 1) * pageSize, safeData.length)}</strong> of <strong className="num-tabular" style={{ color: 'var(--text-primary)' }}>{safeData.length}</strong> entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="btn-academic btn-secondary btn-sm"
              onClick={handleFirst} 
              disabled={currentPage === 0}
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button 
              className="btn-academic btn-secondary btn-sm"
              onClick={handlePrev} 
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ padding: '0 8px', fontWeight: 700, color: 'var(--text-primary)' }} className="num-tabular">
              {currentPage + 1} / {totalPages}
            </span>

            <button 
              className="btn-academic btn-secondary btn-sm"
              onClick={handleNext} 
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <button 
              className="btn-academic btn-secondary btn-sm"
              onClick={handleLast} 
              disabled={currentPage >= totalPages - 1}
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
