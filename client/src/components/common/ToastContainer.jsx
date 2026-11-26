import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type = 'ok' } = e.detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('campus-toast', handleToast);
    return () => window.removeEventListener('campus-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-academic ${toast.type}`}>
          {toast.type === 'err' ? (
            <AlertTriangle size={18} style={{ color: '#E85D58', flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={18} style={{ color: '#48BB78', flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, fontSize: '0.85rem' }}>{toast.message}</span>
          <button 
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.7, cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
