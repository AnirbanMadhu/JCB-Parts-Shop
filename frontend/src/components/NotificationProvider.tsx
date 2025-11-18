'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification = { ...notification, id };
    
    setNotifications((prev) => [...prev, newNotification]);

    // Auto-hide after duration (default 5 seconds)
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  };

  const backgrounds = {
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
    warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
  };

  const titleColors = {
    success: 'text-green-900 dark:text-green-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
    info: 'text-blue-900 dark:text-blue-100'
  };

  const messageColors = {
    success: 'text-green-700 dark:text-green-300',
    error: 'text-red-700 dark:text-red-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    info: 'text-blue-700 dark:text-blue-300'
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 400, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 400, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`min-w-[320px] max-w-md pointer-events-auto ${backgrounds[notification.type]} border rounded-lg shadow-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {icons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${titleColors[notification.type]}`}>
                    {notification.title}
                  </h4>
                  {notification.message && (
                    <p className={`mt-1 text-sm ${messageColors[notification.type]}`}>
                      {notification.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => hideNotification(notification.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}
