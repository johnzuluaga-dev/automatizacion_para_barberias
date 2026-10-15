import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'danger' | 'info';

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  description?: string;
}

export interface ToastItem extends Required<Pick<ToastInput, 'tone' | 'title'>> {
  id: number;
  description?: string;
}

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return push;
}
