// Security alert component for tamper detection warnings
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Shield, X } from 'lucide-react';

export default function SecurityAlert() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [alertType, setAlertType] = useState<'tamper' | 'fingerprint' | 'general'>('general');

  useEffect(() => {
    const securityAlert = searchParams.get('security_alert');
    const alertReason = searchParams.get('reason');

    if (securityAlert === '1') {
      setShow(true);
      
      if (alertReason === 'fingerprint') {
        setAlertType('fingerprint');
      } else if (alertReason === 'tamper') {
        setAlertType('tamper');
      } else {
        setAlertType('general');
      }
    }
  }, [searchParams]);

  const handleClose = () => {
    setShow(false);
    // Remove security_alert from URL
    navigate(window.location.pathname, { replace: true });
  };

  if (!show) return null;

  const messages = {
    tamper: {
      title: 'Security Breach Detected',
      description: 'Unauthorized modification of authentication code was detected. Your session has been terminated for security reasons.',
      icon: AlertTriangle,
      color: 'red'
    },
    fingerprint: {
      title: 'Device Mismatch Detected',
      description: 'Your browser fingerprint has changed. This could indicate a security issue. Please log in again.',
      icon: Shield,
      color: 'yellow'
    },
    general: {
      title: 'Security Alert',
      description: 'Your session was terminated due to a security concern. Please log in again.',
      icon: AlertTriangle,
      color: 'yellow'
    }
  };

  const message = messages[alertType];
  const Icon = message.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            message.color === 'red' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              message.color === 'red' ? 'text-red-600' : 'text-yellow-600'
            }`} />
          </div>

          <div className="flex-1 pt-1">
            <h3 className={`text-lg font-semibold mb-2 ${
              message.color === 'red' ? 'text-red-900' : 'text-yellow-900'
            }`}>
              {message.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {message.description}
            </p>

            {alertType === 'tamper' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-800">
                  <strong>What happened?</strong> Our security system detected that critical authentication code was modified in your browser. This is a serious security violation.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  message.color === 'red'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
