import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

// notify({ tone: 'success' | 'error' | 'info', title, message, duration })
// atalhos: success(title, message), error(title, message), info(title, message)
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }

  return context;
}
