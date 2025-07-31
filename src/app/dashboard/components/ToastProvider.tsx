'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NotificationType } from '@prisma/client';
import ToastNotification from './ToastNotification';

interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  autoHide?: boolean;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newToast: Toast = {
      id,
      autoHide: true,
      duration: getDefaultDuration(toast.type),
      ...toast,
    };

    setToasts((prevToasts) => {
      // Limit to maximum 4 toasts at once
      const updatedToasts = [...prevToasts, newToast];
      if (updatedToasts.length > 4) {
        return updatedToasts.slice(-4);
      }
      return updatedToasts;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Get default duration based on notification type
  const getDefaultDuration = (type: string): number => {
    switch (type) {
      case 'TVA_THRESHOLD_EXCEEDED':
        return 12000; // 12 seconds for urgent alerts
      case 'TVA_THRESHOLD_WARNING':
        return 10000; // 10 seconds for warnings
      case 'URSSAF_REMINDER':
        return 8000;  // 8 seconds for reminders
      default:
        return 6000;  // 6 seconds for general notifications
    }
  };

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            actionUrl={toast.actionUrl}
            autoHide={toast.autoHide}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Utility function to show urgent notifications as toasts
export const shouldShowAsToast = (type: string): boolean => {
  return ['TVA_THRESHOLD_EXCEEDED', 'TVA_THRESHOLD_WARNING'].includes(type);
};