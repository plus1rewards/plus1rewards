// plus1-rewards/src/components/admin/SessionTimeoutWarning.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../../lib/adminAuth';

export default function SessionTimeoutWarning() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const checkSession = () => {
      const timeLeft = adminAuth.getTimeUntilExpiry();
      const minutes = Math.floor(timeLeft / 60000);

      // Show warning when 5 minutes or less remaining
      if (minutes <= 5 && minutes > 0) {
        setShowWarning(true);
        setTimeRemaining(minutes);
      } else if (minutes === 0) {
        // Session expired
        adminAuth.logout();
        navigate('/admin/login', { replace: true });
      } else {
        setShowWarning(false);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, [navigate]);

  const handleExtendSession = () => {
    adminAuth.extendSession();
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-2xl p-4 max-w-sm border-2 border-white/20">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg mb-1">Session Expiring Soon</h3>
            <p className="text-sm text-white/90 mb-3">
              Your admin session will expire in {timeRemaining} {timeRemaining === 1 ? 'minute' : 'minutes'}. 
              Click below to stay logged in.
            </p>
            <button
              onClick={handleExtendSession}
              className="w-full bg-white text-orange-600 font-bold py-2 px-4 rounded-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>Extend Session</span>
            </button>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
