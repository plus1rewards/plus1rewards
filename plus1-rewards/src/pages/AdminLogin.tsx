// plus1-rewards/src/pages/AdminLogin.tsx
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../lib/adminAuth';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, AuthError } from '../components/auth/AuthComponents';
import PatternLock from '../components/auth/PatternLock';
import SecurityAlert from '../components/SecurityAlert';

const BLUE = '#1a558b';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [showPattern, setShowPattern] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patternError, setPatternError] = useState('');

  // Check if already authenticated
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Use sync check first to avoid async issues
        if (adminAuth.isAuthenticatedSync()) {
          const isValid = await adminAuth.isAuthenticated();
          if (isValid && mounted) {
            const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
            navigate(from, { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, [navigate, location]);

  const handlePhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number format
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setError('Invalid phone number format. Must be 10 digits starting with 0.');
      return;
    }

    // Show pattern lock
    setShowPattern(true);
  };

  const handlePatternComplete = async (pattern: number[]) => {
    if (pattern.length < 4) {
      setPatternError('Pattern must connect at least 4 dots');
      return;
    }

    setLoading(true);
    setPatternError('');

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      
      // Attempt login with pattern
      const result = await adminAuth.loginWithPattern(cleanPhone, pattern, rememberMe);

      if (result.success) {
        // Successfully logged in, redirect to admin dashboard
        const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      } else {
        setPatternError(result.error || 'Invalid pattern. Please try again.');
        // Reset after showing error
        setTimeout(() => setPatternError(''), 2000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setPatternError('An unexpected error occurred. Please try again.');
      setTimeout(() => setPatternError(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SecurityAlert />
      <AuthLayout
        portalIcon="admin_panel_settings"
        portalName="Admin Portal"
        headline={<>Complete platform <span style={{ color: '#93c5fd' }}>control</span> center.</>}
        subheadline="Manage all aspects of the +1 Rewards ecosystem from shops and agents to policy providers and system analytics."
        stats={[
          { value: 'All', label: 'System Access' },
          { value: 'Real-time', label: 'Analytics' },
          { value: 'Secure', label: 'Admin Panel' },
        ]}
      >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Administrator Login</h2>
          <p className="text-sm text-gray-500 mt-1">Secure access to the +1 Rewards management system.</p>
        </div>

        <AuthError message={error} />

        {!showPattern ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <AuthInput
              label="Administrator Phone Number"
              icon="admin_panel_settings"
              id="phone"
              type="tel"
              placeholder="0714329190"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="admin-remember-cbx"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="admin-remember-cbx" className="check">
                    <svg width="18px" height="18px" viewBox="0 0 18 18">
                      <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z"></path>
                      <polyline points="1 9 7 14 15 4"></polyline>
                    </svg>
                  </label>
                </div>
                Keep me signed in for 2 hours
              </label>
              <a href="#" className="text-sm font-semibold" style={{ color: BLUE }}>Contact IT</a>
            </div>

            <AuthButton type="submit" loading={loading} loadingText="Verifying...">
              Continue
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </AuthButton>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowPattern(false);
                  setPatternError('');
                }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>
              <p className="text-sm text-gray-600">Phone: {phone}</p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Draw Your Pattern</h3>
              <PatternLock
                onPatternComplete={handlePatternComplete}
                gridSize={4}
                minDots={4}
                disabled={loading}
                error={patternError}
              />
            </div>

            {loading && (
              <div className="text-center">
                <div className="inline-block w-6 h-6 border-3 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 mt-2">Verifying pattern...</p>
              </div>
            )}
          </div>
        )}

        <AuthDivider label="Restricted Access" />

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-red-600 text-xl">warning</span>
            <span className="text-sm font-bold text-red-800">Authorized Personnel Only</span>
          </div>
          <p className="text-xs text-red-700">
            This system is restricted to authorized +1 Rewards administrators. All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </AuthLayout>
    </>
  );
}