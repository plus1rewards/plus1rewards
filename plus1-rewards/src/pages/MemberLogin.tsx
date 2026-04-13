// plus1-rewards/src/pages/MemberLogin.tsx
import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, AuthError, AuthLink } from '../components/auth/AuthComponents';
import SEO from '../components/SEO';

const BLUE = '#1a568b'
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default function MemberLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const platform = searchParams.get('platform') || 'rewards';

  const [phone, setPhone] = useState('');
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
      const cleanPhone = phone.replace(/\D/g, '');

      if (cleanPhone.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }
      if (pin.length !== 6) {
        setError('PIN must be exactly 6 digits');
        return;
      }

      // Fetch member (by phone only — check lockout before verifying PIN)
      const { data: memberData, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .eq('cell_phone', cleanPhone)
        .single();

      if (fetchError || !memberData) {
        setError('Invalid mobile number or PIN');
        return;
      }

      // Check lockout
      if (memberData.locked_until && new Date(memberData.locked_until) > new Date()) {
        const mins = Math.ceil((new Date(memberData.locked_until).getTime() - Date.now()) / 60000);
        setError(`Account locked. Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
        return;
      }

      // Verify PIN
      if (memberData.pin_code !== pin) {
        const newAttempts = (memberData.failed_login_attempts ?? 0) + 1;
        const shouldLock = newAttempts >= MAX_ATTEMPTS;
        await supabase.from('members').update({
          failed_login_attempts: newAttempts,
          locked_until: shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
            : null,
        }).eq('id', memberData.id);

        if (shouldLock) {
          setError(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
        } else {
          setError(`Invalid mobile number or PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
        }
        return;
      }

      // PIN correct — reset attempts
      await supabase.from('members').update({
        failed_login_attempts: 0,
        locked_until: null,
      }).eq('id', memberData.id);

      if (memberData.status !== 'active') {
        setError('Your account is ' + memberData.status + '. Please contact support.');
        return;
      }

      const now = new Date();
      const sessionData = {
        member: memberData,
        loggedInAt: now.toISOString(),
        expiresAt: rememberMe ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        rememberMe,
        platform,
      };

      if (rememberMe) {
        localStorage.setItem('memberSession', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('memberSession', JSON.stringify(sessionData));
      }

      navigate('/member/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      portalIcon="add_circle"
      portalName="+1 Rewards"
      headline={<>Start earning <span style={{ color: '#93c5fd' }}>cashback</span> that pays your Medical Cover.</>}
      subheadline="Join thousands of members who fund their Family Medical Cover through everyday shopping at local partners."
      stats={[
        { value: 'NO sign up Fee', label: '' },
        { value: '3%', label: 'Rewards Rate' },
        { value: 'R390', label: 'Monthly Target' },
      ]}
    >
      <SEO
        title="Member Login & Register | Plus1 Rewards"
        description="Sign in or create your Plus1 Rewards account to start earning cashback toward your medical cover plan."
        keywords="Plus1 Rewards login, member login, medical cover login, cashback account"
        canonical="https://plus1rewards.com/member/login"
        robots="noindex, nofollow"
      />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your {platform === 'go' ? 'delivery' : 'member'} account
          </p>
        </div>

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Cell Phone Number (10 digits)"
            icon="phone"
            id="phone"
            type="tel"
            placeholder="082 555 1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <AuthInput
            label="6-Digit PIN"
            icon="pin"
            id="pin"
            type={showPin ? 'text' : 'password'}
            placeholder="Enter your 6-digit PIN"
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
                  id="remember-me-cbx"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="remember-me-cbx" className="check">
                  <svg width="18px" height="18px" viewBox="0 0 18 18">
                    <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z"></path>
                    <polyline points="1 9 7 14 15 4"></polyline>
                  </svg>
                </label>
              </div>
              Remember me for 30 days
            </label>
            <a href="#" className="text-sm font-semibold" style={{ color: BLUE }}>Forgot PIN?</a>
          </div>

          <AuthButton type="submit" loading={loading} loadingText="Signing in...">
            Sign In
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </AuthButton>
        </form>

        <AuthDivider label="Or sign in as" />

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => navigate('/partner/login')}
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
          >
            <span className="material-symbols-outlined text-base" style={{ color: BLUE }}>storefront</span>
            Partner
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 pt-2">
          Don&apos;t have an account?{' '}
          <AuthLink onClick={() => navigate(`/member/register?platform=${platform}`)}>Register Now</AuthLink>
        </p>
      </div>
    </AuthLayout>
  );
}
