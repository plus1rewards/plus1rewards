// plus1-rewards/src/pages/AgentLogin.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, AuthError, AuthLink } from '../components/auth/AuthComponents';

const BLUE = '#1a568b'
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default function AgentLogin() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
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
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setError('PIN must be exactly 6 digits');
        return;
      }

      const cleanPhone = mobileNumber.replace(/\D/g, '');

      // Fetch agent by phone only first
      const { data: agentData, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('cell_phone', cleanPhone)
        .single();

      if (fetchError || !agentData) {
        setError('Invalid mobile number or PIN');
        return;
      }

      // Check lockout
      if (agentData.locked_until && new Date(agentData.locked_until) > new Date()) {
        const mins = Math.ceil((new Date(agentData.locked_until).getTime() - Date.now()) / 60000);
        setError(`Account locked. Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
        return;
      }

      // Verify PIN
      if (agentData.pin_code !== pin) {
        const newAttempts = (agentData.failed_login_attempts ?? 0) + 1;
        const shouldLock = newAttempts >= MAX_ATTEMPTS;
        await supabase.from('agents').update({
          failed_login_attempts: newAttempts,
          locked_until: shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
            : null,
        }).eq('id', agentData.id);

        if (shouldLock) {
          setError(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
        } else {
          setError(`Invalid mobile number or PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
        }
        return;
      }

      // PIN correct — reset attempts
      await supabase.from('agents').update({
        failed_login_attempts: 0,
        locked_until: null,
      }).eq('id', agentData.id);

      // Check status
      if (agentData.status === 'pending') {
        setError('Your application is still pending approval.');
        return;
      }
      if (agentData.status === 'suspended') {
        setError('Your account has been suspended. Please contact administrator.');
        return;
      }
      if (agentData.status === 'rejected') {
        setError('Your application has been rejected.');
        return;
      }
      if (agentData.status !== 'active') {
        setError('Your account status is unknown. Please contact support.');
        return;
      }

      const sessionData = { ...agentData, agent_id: agentData.id };
      if (rememberMe) {
        localStorage.setItem('currentAgent', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('currentAgent', JSON.stringify(sessionData));
      }
      navigate('/agent/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      portalIcon="assignment_ind"
      portalName="Agent Portal"
      headline={<>Build your network, <span style={{ color: '#93c5fd' }}>earn</span> recurring income.</>}
      subheadline="Connect local businesses with +1 Rewards and earn competitive commissions on every transaction they process."
      stats={[
        { value: '1%', label: 'Commission Rate' },
        { value: 'Monthly', label: 'Payouts' },
        { value: '∞', label: 'Earning Potential' },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Agent Login</h2>
          <p className="text-sm text-gray-500 mt-1">Access your commission dashboard and manage your network.</p>
        </div>

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Phone Number (10 digits)"
            icon="phone"
            id="mobileNumber"
            type="tel"
            placeholder="082 555 1234"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
          />

          <AuthInput
            label="6-Digit PIN"
            icon="lock"
            id="pin"
            type={showPin ? 'text' : 'password'}
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            maxLength={6}
            pattern="\d{6}"
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
                  id="agent-remember-cbx"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="agent-remember-cbx" className="check">
                  <svg width="18px" height="18px" viewBox="0 0 18 18">
                    <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z"></path>
                    <polyline points="1 9 7 14 15 4"></polyline>
                  </svg>
                </label>
              </div>
              Keep me signed in
            </label>
            <a href="#" className="text-sm font-semibold" style={{ color: BLUE }}>Contact Admin</a>
          </div>

          <AuthButton type="submit" loading={loading} loadingText="Signing in...">
            Access Agent Dashboard
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </AuthButton>
        </form>

        <AuthDivider label="Quick Access" />

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Member Login', icon: 'group', path: '/login' },
            { label: 'Partner Login', icon: 'storefront', path: '/partner/login' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
            >
              <span className="material-symbols-outlined text-base" style={{ color: BLUE }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 pt-2">
          Want to become an agent?{' '}
          <AuthLink onClick={() => navigate('/agent/register')}>Apply Now</AuthLink>
        </p>
      </div>
    </AuthLayout>
  );
}
