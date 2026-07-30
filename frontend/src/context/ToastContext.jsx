import { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from '../components/Toast/Toast';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef([]);

  const show = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = ++toastId;
    const toast = { id, type, message, duration };
    toastsRef.current = [...toastsRef.current, toast];
    setToasts([...toastsRef.current]);

    // Auto dismiss
    setTimeout(() => {
      toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
      setToasts([...toastsRef.current]);
    }, duration);

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
    setToasts([...toastsRef.current]);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
