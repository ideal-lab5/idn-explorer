'use client';

import { useCallback, useState } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
  visible: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, duration = 5000 }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);

    setToasts(prev => [...prev, { id, title, description, visible: true, duration }]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, visible: false } : t)));

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300); // Animation duration
    }, duration);

    return id;
  }, []);

  return { toast, toasts };
}
