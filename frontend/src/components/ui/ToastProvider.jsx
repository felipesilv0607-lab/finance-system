import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from '../toast-context';
import Icon from './Icon';
import IconButton from './IconButton';

const MAX_TOASTS = 4;
const DEFAULT_DURATION = 5000;

const toneIcons = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);

  // O timer pausa com o mouse/foco em cima, para dar tempo de ler.
  useEffect(() => {
    if (paused) return undefined;

    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);

    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`ui-toast ui-toast--${toast.tone}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={toneIcons[toast.tone]} size={20} className="ui-toast__icon" />
      <div className="ui-toast__content">
        <p className="ui-toast__title">{toast.title}</p>
        {toast.message && <p className="ui-toast__message">{toast.message}</p>}
      </div>
      <IconButton
        icon="x"
        label="Fechar notificação"
        size="sm"
        onClick={() => onDismiss(toast.id)}
      />
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ tone = 'info', title, message, duration = DEFAULT_DURATION }) => {
      nextId.current += 1;
      const toast = { id: nextId.current, tone, title, message, duration };

      setToasts((current) => [...current, toast].slice(-MAX_TOASTS));

      return toast.id;
    },
    []
  );

  const value = useMemo(
    () => ({
      notify,
      dismiss,
      success: (title, message) => notify({ tone: 'success', title, message }),
      error: (title, message) =>
        notify({ tone: 'error', title, message, duration: 8000 }),
      info: (title, message) => notify({ tone: 'info', title, message }),
    }),
    [notify, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-region" aria-label="Notificações">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
