import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ title, isOpen = true, onClose, children, maxWidth = '560px', footer }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-academic" onClick={onClose}>
      <div 
        className="modal-dialog-academic" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header-academic">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body-academic">
          {children}
        </div>
        {footer && (
          <div className="modal-footer-academic">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
