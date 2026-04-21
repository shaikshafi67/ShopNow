import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let nextId = 1;

const ICONS = {
  success: { Icon: CheckCircle, color: '#22c55e' },
  error: { Icon: AlertCircle, color: '#ef4444' },
  info: { Icon: Info, color: '#7c6aff' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, kind = 'info', duration = 3000) => {
    const id = nextId++;
    setToasts((arr) => [...arr, { id, message, kind }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = {
    push,
    dismiss,
    success: (m, d) => push(m, 'success', d),
    error: (m, d) => push(m, 'error', d),
    info: (m, d) => push(m, 'info', d),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 'calc(100vw - 48px)',
      }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const { Icon, color } = ICONS[t.kind] || ICONS.info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-glass-hover)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 280,
                  maxWidth: 380,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
                  color: 'var(--text-primary)',
                }}
              >
                <Icon size={18} color={color} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
