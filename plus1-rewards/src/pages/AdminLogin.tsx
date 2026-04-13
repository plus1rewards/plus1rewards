// plus1-rewards/src/pages/AdminLogin.tsx
import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAuth } from '../lib/adminAuth';
import PatternLock from '../components/auth/PatternLock';
import SecurityAlert from '../components/SecurityAlert';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [showPattern, setShowPattern] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patternError, setPatternError] = useState('');
  const [scanLine, setScanLine] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(p => (p + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        if (adminAuth.isAuthenticatedSync()) {
          const isValid = await adminAuth.isAuthenticated();
          if (isValid && mounted) {
            const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
            navigate(from, { replace: true });
          }
        }
      } catch {}
    };
    checkAuth();
    return () => { mounted = false; };
  }, [navigate, location]);

  const handlePhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setError('INVALID IDENTIFIER — 10 DIGITS REQUIRED');
      return;
    }
    setShowPattern(true);
  };

  const handlePatternComplete = async (pattern: number[]) => {
    if (pattern.length < 4) {
      setPatternError('MINIMUM 4 NODES REQUIRED');
      return;
    }
    setLoading(true);
    setPatternError('');
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const result = await adminAuth.loginWithPattern(cleanPhone, pattern, rememberMe);
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      } else {
        setPatternError('ACCESS DENIED — PATTERN MISMATCH');
        setTimeout(() => setPatternError(''), 2500);
      }
    } catch {
      setPatternError('SYSTEM ERROR — RETRY');
      setTimeout(() => setPatternError(''), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SecurityAlert />
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: '#020408', fontFamily: "'Inter', monospace" }}>

        {/* Animated grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        {/* Scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px opacity-20"
            style={{ top: `${scanLine}%`, background: 'linear-gradient(90deg, transparent, #00ff88, transparent)' }} />
        </div>

        {/* Corner decorations */}
        {[
          'top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-12 h-12 ${cls}`} style={{ borderColor: 'rgba(0,255,136,0.3)' }} />
        ))}

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 3 === 0 ? '#00ff88' : i % 3 === 1 ? '#1a568b' : '#ffffff',
              opacity: 0.4,
            }}
            animate={{ y: [0, -40, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 4 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 8, ease: 'easeInOut' }}
          />
        ))}

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06), transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(26,86,139,0.15), transparent 70%)' }} />

        {/* Main panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-md mx-4 ${glitch ? 'translate-x-[2px]' : ''}`}
          style={{ transition: glitch ? 'none' : 'transform 0.1s' }}
        >
          {/* Panel border glow */}
          <div className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(26,86,139,0.3), rgba(0,255,136,0.1))', borderRadius: '16px' }} />

          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: 'rgba(4,10,20,0.95)', border: '1px solid rgba(0,255,136,0.15)', backdropFilter: 'blur(20px)' }}>

            {/* Top status bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'rgba(0,255,136,0.1)', background: 'rgba(0,255,136,0.03)' }}>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#00ff88' }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#00ff88' }}>
                  SYSTEM ONLINE
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.5)' }}>
                  PLUS1-ADMIN-v2.0
                </span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="w-1 h-3 rounded-sm"
                      style={{ backgroundColor: 'rgba(0,255,136,0.4)' }}
                      animate={{ scaleY: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-7">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: '#00ff88' }}>admin_panel_settings</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: 'rgba(0,255,136,0.6)' }}>
                      RESTRICTED ACCESS
                    </div>
                    <h1 className={`text-xl font-black text-white glitch-text ${glitch ? 'opacity-80' : ''}`} data-text="ADMINISTRATOR LOGIN">
                      ADMINISTRATOR LOGIN
                    </h1>
                  </div>
                </div>

                {/* Typing effect subtitle */}
                <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(0,255,136,0.4)' }}>terminal</span>
                  Secure access to the +1 Rewards management system
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)' }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: '#ff5050' }}>error</span>
                    <span className="text-xs font-bold font-mono" style={{ color: '#ff5050' }}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {!showPattern ? (
                  <motion.form
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handlePhoneSubmit}
                    className="space-y-5"
                  >
                    {/* Phone input */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(0,255,136,0.7)' }}>
                        ADMIN IDENTIFIER
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base" style={{ color: 'rgba(0,255,136,0.5)' }}>fingerprint</span>
                          <span className="text-xs font-mono" style={{ color: 'rgba(0,255,136,0.3)' }}>|</span>
                        </div>
                        <input
                          ref={inputRef}
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="0714329190"
                          maxLength={10}
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-mono outline-none transition-all"
                          style={{
                            background: 'rgba(0,255,136,0.04)',
                            border: '1px solid rgba(0,255,136,0.2)',
                            color: '#00ff88',
                            caretColor: '#00ff88',
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,255,136,0.6)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,255,136,0.2)'}
                        />
                        {phone.length === 10 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <span className="material-symbols-outlined text-base" style={{ color: '#00ff88' }}>check_circle</span>
                          </motion.div>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-px rounded-full overflow-hidden" style={{ background: 'rgba(0,255,136,0.1)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #00ff88, #1a568b)', width: `${(phone.length / 10) * 100}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.3)' }}>INPUT</span>
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.3)' }}>{phone.length}/10</span>
                      </div>
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setRememberMe(r => !r)}
                        className="w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0"
                        style={{
                          background: rememberMe ? 'rgba(0,255,136,0.2)' : 'transparent',
                          border: `1px solid ${rememberMe ? '#00ff88' : 'rgba(0,255,136,0.3)'}`,
                        }}
                      >
                        {rememberMe && <span className="material-symbols-outlined text-sm" style={{ color: '#00ff88' }}>check</span>}
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        MAINTAIN SESSION — 2HR TOKEN
                      </span>
                    </label>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-xl font-black text-sm relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(26,86,139,0.3))', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88' }}
                    >
                      <motion.span
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                      />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-base">lock_open</span>
                        INITIATE AUTHENTICATION
                      </span>
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="pattern"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Back + identity */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setShowPattern(false); setPatternError(''); }}
                        className="flex items-center gap-1.5 text-xs font-mono transition-colors"
                        style={{ color: 'rgba(0,255,136,0.5)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,255,136,0.5)'}
                      >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        BACK
                      </button>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
                        <span className="material-symbols-outlined text-sm" style={{ color: '#00ff88' }}>verified_user</span>
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.7)' }}>ID: {phone}</span>
                      </div>
                    </div>

                    {/* Pattern container */}
                    <div className="rounded-2xl p-5 relative overflow-hidden"
                      style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.15)' }}>
                      {/* Corner brackets */}
                      {['top-2 left-2 border-t border-l', 'top-2 right-2 border-t border-r', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'].map((cls, i) => (
                        <div key={i} className={`absolute w-4 h-4 ${cls}`} style={{ borderColor: 'rgba(0,255,136,0.4)' }} />
                      ))}

                      <div className="text-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(0,255,136,0.6)' }}>
                          BIOMETRIC PATTERN LOCK
                        </span>
                      </div>

                      <PatternLock
                        onPatternComplete={handlePatternComplete}
                        gridSize={4}
                        minDots={4}
                        disabled={loading}
                        error={patternError}
                      />

                      {/* Error */}
                      <AnimatePresence>
                        {patternError && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 px-3 py-2 rounded-lg flex items-center gap-2"
                            style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)' }}
                          >
                            <span className="material-symbols-outlined text-sm" style={{ color: '#ff5050' }}>block</span>
                            <span className="text-[10px] font-bold font-mono" style={{ color: '#ff5050' }}>{patternError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Loading */}
                    <AnimatePresence>
                      {loading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-3 py-2"
                        >
                          <div className="flex gap-1">
                            {[...Array(4)].map((_, i) => (
                              <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: '#00ff88' }}
                                animate={{ scaleY: [1, 2, 1], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-mono" style={{ color: 'rgba(0,255,136,0.7)' }}>
                            VERIFYING CREDENTIALS...
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="mt-7 pt-5 border-t flex items-center justify-between"
                style={{ borderColor: 'rgba(0,255,136,0.08)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(255,50,50,0.6)' }}>warning</span>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    AUTHORIZED PERSONNEL ONLY
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.2)' }}>
                  ALL ACCESS LOGGED
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
