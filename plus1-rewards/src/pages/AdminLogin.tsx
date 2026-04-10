// plus1-rewards/src/pages/AdminLogin.tsx
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../lib/adminAuth';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, AuthError } from '../components/auth/AuthComponents';

const BLUE = '#1a558b';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated
  useEffect(() => {
    if (adminAuth.isAuthenticated()) {
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number format
      const cleanPhone = phone.replace(/\s/g, '');
      if (!/^0\d{9}$/.test(cleanPhone)) {
        setError('Invalid phone number format. Must be 10 digits starting with 0.');
        setLoading(false);
        return;
      }

      // Attempt login
      const result = await adminAuth.login(cleanPhone, password, rememberMe);

      if (result.success) {
        // Successfully logged in, redirect to admin dashboard
        const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <AuthInput
            label="Password"
            icon="lock"
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            suffix={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            }
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

          <AuthButton type="submit" loading={loading} loadingText="Signing in...">
            Access Admin Dashboard
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </AuthButton>
        </form>

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
  );
}