import { useEffect, useState } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Notification({ type, title, message, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: 'check_circle',
          iconBg: 'rgba(255, 255, 255, 0.2)'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          icon: 'error',
          iconBg: 'rgba(255, 255, 255, 0.2)'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          icon: 'warning',
          iconBg: 'rgba(255, 255, 255, 0.2)'
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: 'info',
          iconBg: 'rgba(255, 255, 255, 0.2)'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className="fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 sm:max-w-md w-auto sm:w-full animate-slide-in-right"
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div
        className="rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 text-white relative overflow-hidden"
        style={{ background: styles.bg }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16" />
        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full -ml-8 sm:-ml-12 -mb-8 sm:-mb-12" />
        
        <div className="relative flex items-start gap-3 sm:gap-4">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: styles.iconBg }}
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">{styles.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-black mb-1">{title}</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed whitespace-pre-line">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
          </button>
        </div>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white/50"
              style={{
                animation: `shrink ${duration}ms linear`
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// Hook for managing notifications
export function useNotification() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  } | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => {
    setNotification({ type, title, message, duration });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess: (title: string, message: string, duration?: number) => showNotification('success', title, message, duration),
    showError: (title: string, message: string, duration?: number) => showNotification('error', title, message, duration),
    showWarning: (title: string, message: string, duration?: number) => showNotification('warning', title, message, duration),
    showInfo: (title: string, message: string, duration?: number) => showNotification('info', title, message, duration),
  };
}
