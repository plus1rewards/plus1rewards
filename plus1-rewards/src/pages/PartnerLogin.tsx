// plus1-rewards/src/pages/PartnerLogin.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, AuthError, AuthLink } from '../components/auth/AuthComponents';
import { useNotification, Notification } from '../components/Notification';
import { normalizePhoneNumber, isValidMobileNumber } from '../utils/phoneValidation';

const BLUE = '#1a558b'

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { showNotification, hideNotification, notification } = useNotification();
  const [identifier, setIdentifier] = useState(''); // mobile number OR email
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate PIN is 6 digits
      if (!/^\d{6}$/.test(pin)) {
        showNotification('error', 'Invalid PIN', 'PIN must be exactly 6 digits');
        setLoading(false);
        return;
      }

      // Determine if identifier is mobile number or email
      const normalizedPhone = normalizePhoneNumber(identifier);
      const isMobile = isValidMobileNumber(identifier);
      const isEmail = identifier.includes('@');

      if (!isMobile && !isEmail) {
        showNotification('error', 'Invalid Input', 'Please enter a valid 10-digit mobile number (e.g., 060 296 2491) or email address');
        setLoading(false);
        return;
      }

      // Query partners table directly (no central users table)
      let partnerQuery = supabase
        .from('partners')
        .select('*');

      if (isMobile) {
        // Use normalized phone number for database query
        partnerQuery = partnerQuery.eq('cell_phone', normalizedPhone);
      } else {
        partnerQuery = partnerQuery.eq('email', identifier);
      }

      const { data: partnerData, error: partnerError } = await partnerQuery.single();

      if (partnerError || !partnerData) {
        showNotification('error', 'Account Not Found', 'Partner account not found');
        setLoading(false);
        return;
      }

      // Verify PIN
      if (partnerData.pin_code !== pin) {
        showNotification('error', 'Incorrect PIN', 'The PIN you entered is incorrect');
        setLoading(false);
        return;
      }

      // Check partner status
      if (partnerData.status === 'pending') {
        showNotification('warning', 'Pending Approval', `Your business "${partnerData.shop_name}" is still pending admin approval.`);
        setLoading(false);
        return;
      }
      if (partnerData.status === 'paused') {
        showNotification('error', 'Account Paused', `Your business "${partnerData.shop_name}" has been paused. Please contact admin.`);
        setLoading(false);
        return;
      }
      if (partnerData.status === 'rejected') {
        const rejectionMessage = partnerData.rejection_reason 
          ? `Your business registration has been rejected by the system admin after review.\n\nReason: ${partnerData.rejection_reason}\n\nPlease contact admin for more information.`
          : 'Your business registration has been rejected by the system admin after review. Please contact admin for more information.';
        showNotification('error', 'Application Rejected', rejectionMessage, 40000);
        setLoading(false);
        return;
      }

      // Only allow active partners to login
      if (partnerData.status !== 'active') {
        showNotification('error', 'Login Not Allowed', 'Your account status does not allow login. Please contact admin.');
        setLoading(false);
        return;
      }

      // Create session
      const sessionData = {
        user: {
          id: partnerData.id,
          role: partnerData.role || 'partner',
          first_name: partnerData.first_name,
          last_name: partnerData.last_name,
          cell_phone: partnerData.cell_phone,
          status: partnerData.status
        },
        partner: partnerData,
        loggedInAt: new Date().toISOString(),
        expiresAt: rememberMe ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        rememberMe
      };

      // Store session
      if (rememberMe) {
        localStorage.setItem('partnerSession', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('partnerSession', JSON.stringify(sessionData));
      }

      showNotification('success', 'Welcome Back!', `Welcome back, ${partnerData.shop_name}!`);
      navigate('/partner/dashboard');
    } catch (err: any) {
      showNotification('error', 'Login Failed', err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      portalIcon="storefront"
      portalName="Partner Portal"
      headline={<>Grow your business with <span style={{ color: '#93c5fd' }}>customer</span> rewards.</>}
      subheadline="Attract loyal customers and increase sales with our innovative rewards program designed for local businesses."
      stats={[
        { value: '3%', label: 'Customer Rewards' },
        { value: '+25%', label: 'Customer Retention' },
        { value: '100%', label: 'Offline Ready' },
      ]}
    >
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Partner Login</h2>
          <p className="text-sm text-gray-500 mt-1">Access your business dashboard and manage customer rewards.</p>
        </div>

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Mobile Number or Email"
            icon="storefront"
            id="identifier"
            type="text"
            placeholder="0812345678 or partner@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <AuthInput
            label="6-Digit PIN"
            icon="pin"
            id="pin"
            type={showPin ? 'text' : 'password'}
            placeholder="••••••"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(value);
            }}
            required
            suffix={
              <button type="button" onClick={() => setShowPin(!showPin)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-xl">{showPin ? 'visibility_off' : 'visibility'}</span>
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="partner-remember-cbx"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="partner-remember-cbx" className="check">
                  <svg width="18px" height="18px" viewBox="0 0 18 18">
                    <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z"></path>
                    <polyline points="1 9 7 14 15 4"></polyline>
                  </svg>
                </label>
              </div>
              Keep me signed in for 30 days
            </label>
            <a href="#" className="text-sm font-semibold" style={{ color: BLUE }}>Forgot PIN?</a>
          </div>

          <AuthButton type="submit" loading={loading} loadingText="Signing in...">
            Access Partner Dashboard
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </AuthButton>
        </form>

        <AuthDivider label="Quick Access" />

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
          >
            <span className="material-symbols-outlined text-base" style={{ color: BLUE }}>group</span>
            Member Login
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 pt-2">
          Don&apos;t have a partner account?{' '}
          <AuthLink onClick={() => navigate('/partner/register')}>Register Your Business</AuthLink>
        </p>
      </div>
    </AuthLayout>
  );
}