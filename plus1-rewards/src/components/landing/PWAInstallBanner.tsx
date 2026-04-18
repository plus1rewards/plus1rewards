import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function PWAInstallBanner() {
  const { canInstall, isInstalling, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check if user previously dismissed
    const wasDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setDismissed(true);
    }
  };

  // Only show on mobile, if can install, and not dismissed
  if (!isMobile || !canInstall || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-md mx-auto">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/60 hover:text-white p-2"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: '#1a568b' }}
            >
              +1
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base mb-1">
                Install Plus1 Rewards
              </h3>
              <p className="text-white/70 text-xs mb-3 leading-relaxed">
                Get instant notifications when you earn cashback. Works offline!
              </p>

              {/* Install Button */}
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-sm text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #1a568b 0%, #2d6fa8 100%)',
                }}
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Installing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 16V4" />
                      <path d="M8 12l4 4 4-4" />
                      <path d="M4 20h16" />
                    </svg>
                    Install App
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
