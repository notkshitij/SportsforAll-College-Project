import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from './icons';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.type}`} onClick={() => onDismiss(t.id)}>
          {t.type === 'success' && <CheckCircle2 size={20} />}
          {t.type === 'error' && <XCircle size={20} />}
          {t.type === 'warning' && <AlertTriangle size={20} />}
          {t.type === 'info' && <Info size={20} />}
          <div className="toast-content">{t.message}</div>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(t.id);
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
