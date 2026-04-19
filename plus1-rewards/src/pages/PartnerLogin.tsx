// plus1-rewards/src/pages/PartnerLogin.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, AuthError, AuthLink } from '../components/auth/AuthComponents';
import { useNotification, Notification } from '../components/Notification';
import { normalizePhoneNumber, isValidMobileNumber } from '../utils/phoneValidation';

const BLUE = '#1a568b'
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { showNotification, hideNotification, notification } = useNotification();
  const [identifier, setIdentifier] = useState('');
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
      if (!/^\d{6}$/.test(pin)) {
        showNotification('error', 'Invalid PIN', 'PIN must be exactly 6 digits');
        return;
      }

      const normalizedPhone = normalizePhoneNumber(identifier);
      const isMobile = isValidMobileNumber(identifier);
      const isEmail = identifier.includes('@');

      if (!isMobile && !isEmail) {
        showNotification('error', 'Invalid Input', 'Please enter a valid 10-digit mobile number or email address');
        return;
      }

      // For phone login, use secure database verification
      if (isMobile) {
        const { data: verifyResult, error: verifyError } = await supabase
          .rpc('verify_partner_pin', {
            p_cell_phone: normalizedPhone,
            p_pin: pin
          });

        if (verifyError) {
          console.error('Verification error:', verifyError);
          showNotification('error', 'Login Failed', 'Failed to verify credentials. Please try again.');
          return;
        }

        if (!verifyResult || verifyResult.length === 0) {
          showNotification('error', 'Account Not Found', 'Partner account not found');
          return;
        }

        const { partner_id, is_valid, partner_data } = verifyResult[0];

        if (!partner_id || !is_valid) {
          // Fetch partner to update failed attempts
          const { data: partnerData } = await supabase
            .from('partners')
            .select('id, failed_login_attempts, locked_until')
            .eq('cell_phone', normalizedPhone)
            .single();

          if (partnerData) {
            if (partnerData.locked_until && new Date(partnerData.locked_until) > new Date()) {
              const mins = Math.ceil((new Date(partnerData.locked_until).getTime() - Date.now()) / 60000);
              showNotification('error', 'Account Locked', `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
              return;
            }

            const newAttempts = (partnerData.failed_login_attempts ?? 0) + 1;
            const shouldLock = newAttempts >= MAX_ATTEMPTS;
            
            await supabase.from('partners').update({
              failed_login_attempts: newAttempts,
              locked_until: shouldLock
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
                : null,
            }).eq('id', partnerData.id);

            if (shouldLock) {
              showNotification('error', 'Account Locked', `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
            } else {
              showNotification('error', 'Incorrect PIN', `The PIN you entered is incorrect. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
            }
          } else {
            showNotification('error', 'Account Not Found', 'Partner account not found');
          }
          return;
        }

        // PIN is valid - use partner_data from verification
        const partnerData = partner_data as any;

        // Check if account is locked
        if (partnerData.locked_until && new Date(partnerData.locked_until) > new Date()) {
          const mins = Math.ceil((new Date(partnerData.locked_until).getTime() - Date.now()) / 60000);
          showNotification('error', 'Account Locked', `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
          return;
        }

        // Reset failed attempts on successful login
        await supabase.from('partners').update({
          failed_login_attempts: 0,
          locked_until: null,
        }).eq('id', partner_id);

        // Check partner status
        if (partnerData.status === 'pending') {
          showNotification('warning', 'Pending Approval', `Your business "${partnerData.shop_name}" is still pending admin approval.`);
          return;
        }
        if (partnerData.status === 'paused') {
          showNotification('error', 'Account Paused', `Your business "${partnerData.shop_name}" has been paused. Please contact admin.`);
          return;
        }
        if (partnerData.status === 'rejected') {
          const msg = partnerData.rejection_reason
            ? `Registration rejected.\n\nReason: ${partnerData.rejection_reason}\n\nPlease contact admin.`
            : 'Registration rejected by admin. Please contact admin for more information.';
          showNotification('error', 'Application Rejected', msg, 40000);
          return;
        }
        if (partnerData.status !== 'active') {
          showNotification('error', 'Login Not Allowed', 'Your account status does not allow login. Please contact admin.');
          return;
        }

        const sessionData = {
          user: {
            id: partnerData.id,
            role: partnerData.role || 'partner',
            first_name: partnerData.first_name,
            last_name: partnerData.last_name,
            cell_phone: partnerData.cell_phone,
            status: partnerData.status,
          },
          partner: partnerData,
          loggedInAt: new Date().toISOString(),
          expiresAt: rememberMe ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          rememberMe,
        };

        if (rememberMe) {
          localStorage.setItem('partnerSession', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('partnerSession', JSON.stringify(sessionData));
        }

        showNotification('success', 'Welcome Back!', `Welcome back, ${partnerData.shop_name}!`);
        navigate('/partner/dashboard');
        return;
      }

      // Email login - legacy flow (keep existing logic)
      // Fetch partner by email
      // Email login - legacy flow (keep existing logic)
      // Fetch partner by email
      let query = supabase.from('partners').select('*').eq('email', identifier);
      const { data: partnerData, error: fetchError } = await query.single();

      if (fetchError || !partnerData) {
        showNotification('error', 'Account Not Found', 'Partner account not found');
        return;
      }

      // Check lockout
      if (partnerData.locked_until && new Date(partnerData.locked_until) > new Date()) {
        const mins = Math.ceil((new Date(partnerData.locked_until).getTime() - Date.now()) / 60000);
        showNotification('error', 'Account Locked', `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
        return;
      }

      // Verify PIN (for email login - legacy plain text check)
      if (partnerData.pin_code !== pin) {
        const newAttempts = (partnerData.failed_login_attempts ?? 0) + 1;
        const shouldLock = newAttempts >= MAX_ATTEMPTS;
        await supabase.from('partners').update({
          failed_login_attempts: newAttempts,
          locked_until: shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
            : null,
        }).eq('id', partnerData.id);

        if (shouldLock) {
          showNotification('error', 'Account Locked', `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
        } else {
          showNotification('error', 'Incorrect PIN', `The PIN you entered is incorrect. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
        }
        return;
      }

      // PIN correct — reset attempts
      await supabase.from('partners').update({
        failed_login_attempts: 0,
        locked_until: null,
      }).eq('id', partnerData.id);

      // Check partner status
      if (partnerData.status === 'pending') {
        showNotification('warning', 'Pending Approval', `Your business "${partnerData.shop_name}" is still pending admin approval.`);
        return;
      }
      if (partnerData.status === 'paused') {
        showNotification('error', 'Account Paused', `Your business "${partnerData.shop_name}" has been paused. Please contact admin.`);
        return;
      }
      if (partnerData.status === 'rejected') {
        const msg = partnerData.rejection_reason
          ? `Registration rejected.\n\nReason: ${partnerData.rejection_reason}\n\nPlease contact admin.`
          : 'Registration rejected by admin. Please contact admin for more information.';
        showNotification('error', 'Application Rejected', msg, 40000);
        return;
      }
      if (partnerData.status !== 'active') {
        showNotification('error', 'Login Not Allowed', 'Your account status does not allow login. Please contact admin.');
        return;
      }

      const sessionData = {
        user: {
          id: partnerData.id,
          role: partnerData.role || 'partner',
          first_name: partnerData.first_name,
          last_name: partnerData.last_name,
          cell_phone: partnerData.cell_phone,
          status: partnerData.status,
        },
        partner: partnerData,
        loggedInAt: new Date().toISOString(),
        expiresAt: rememberMe ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        rememberMe,
      };

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
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
