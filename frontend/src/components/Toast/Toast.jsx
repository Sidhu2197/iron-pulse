import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export default function Toast({ id, type = 'info', message, duration = 4000, onDismiss }) {
  const timerRef = useRef(null);
  const Icon = ICONS[type] || Info;

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [id, duration, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert">
      {/* Radial glow pulse */}
      <div className="toast__glow" />

      {/* Content */}
      <div className="toast__body">
        <Icon size={18} className="toast__icon" />
        <span className="toast__message">{message}</span>
        <button className="toast__close" onClick={() => onDismiss(id)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="toast__progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}
