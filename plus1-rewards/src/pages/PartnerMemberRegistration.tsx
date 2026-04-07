// plus1-rewards/src/pages/PartnerMemberRegistration.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function PartnerMemberRegistration() {
  const navigate = useNavigate();
  const [activeField, setActiveField] = useState<'firstName' | 'lastName' | 'phone' | 'dob' | 'pin' | 'confirmPin'>('firstName');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNumberClick = (num: string) => {
    if (activeField === 'phone') {
      if (phoneNumber.length < 10) {
        setPhoneNumber(phoneNumber + num);
      }
    } else if (activeField === 'pin') {
      if (pinCode.length < 6) {
        setPinCode(pinCode + num);
      }
    } else if (activeField === 'confirmPin') {
      if (confirmPinCode.length < 6) {
        setConfirmPinCode(confirmPinCode + num);
      }
    }
  };

  const handleBackspace = () => {
    if (activeField === 'phone') {
      setPhoneNumber(phoneNumber.slice(0, -1));
    } else if (activeField === 'pin') {
      setPinCode(pinCode.slice(0, -1));
    } else if (activeField === 'confirmPin') {
      setConfirmPinCode(confirmPinCode.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (activeField === 'phone') {
      setPhoneNumber('');
    } else if (activeField === 'pin') {
      setPinCode('');
    } else if (activeField === 'confirmPin') {
      setConfirmPinCode('');
    }
    setError('');
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      setActiveField('firstName');
      return;
    }

    if (!lastName.trim()) {
      setError('Please enter your last name');
      setActiveField('lastName');
      return;
    }

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit cell phone number');
      setActiveField('phone');
      return;
    }

    if (!dateOfBirth) {
      setError('Please enter your date of birth');
      setActiveField('dob');
      return;
    }

    // Validate age (must be at least 18 years old)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    if (actualAge < 18) {
      setError('You must be at least 18 years old to register');
      setActiveField('dob');
      return;
    }

    if (pinCode.length !== 6) {
      setError('Please enter a 6-digit PIN code');
      setActiveField('pin');
      return;
    }

    if (!/^\d{6}$/.test(pinCode)) {
      setError('PIN must contain only numbers');
      setActiveField('pin');
      return;
    }

    if (confirmPinCode.length !== 6) {
      setError('Please confirm your PIN code');
      setActiveField('confirmPin');
      return;
    }

    if (pinCode !== confirmPinCode) {
      setError('PIN codes do not match');
      setActiveField('confirmPin');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('cell_phone', phoneNumber)
        .maybeSingle();

      if (existingMember) {
        setError('This phone number is already registered');
        setLoading(false);
        setActiveField('phone');
        return;
      }

      const { data: defaultPlan, error: planError } = await supabase
        .from('cover_plans')
        .select('id, plan_name, monthly_target_amount')
        .eq('status', 'active')
        .eq('monthly_target_amount', 390)
        .limit(1)
        .single();

      if (planError || !defaultPlan) {
        setError('System error: Default cover plan not found. Please contact support.');
        setLoading(false);
        return;
      }

      const qrCodeGen = `PLUS1-${phoneNumber}-${Date.now()}`;

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phoneNumber,
          cell_phone: phoneNumber,
          date_of_birth: dateOfBirth,
          pin_code: pinCode,
          qr_code: qrCodeGen,
          status: 'active',
          role: 'member'
        })
        .select()
        .single();

      if (memberError) throw memberError;

      const { error: coverPlanError } = await supabase
        .from('member_cover_plans')
        .insert({
          member_id: memberData.id,
          cover_plan_id: defaultPlan.id,
          creation_order: 1,
          target_amount: defaultPlan.monthly_target_amount,
          funded_amount: 0,
          status: 'in_progress'
        });

      if (coverPlanError) throw coverPlanError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/partner/sales-terminal');
      }, 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered') || err.message?.includes('duplicate')) {
        setError('This phone number is already registered');
        setActiveField('phone');
      } else {
        setError('Registration failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-20 h-20 text-white" />
          </div>
          <h2 className="text-white text-6xl font-bold mb-4">Success!</h2>
          <p className="text-green-300 text-2xl mb-2">{`${firstName} ${lastName}`.trim()}</p>
          <p className="text-blue-200 text-xl mb-8">You're now registered!</p>
          <p className="text-white/60 text-lg">Returning to sales terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">+1</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">Member Registration</h1>
                <p className="text-blue-300 text-sm">Join Plus1 Rewards</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/partner/sales-terminal')}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Form */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-white text-4xl font-bold mb-2">Create your account</h2>
                <p className="text-blue-200 text-base mb-3">Free to join — no credit card required</p>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white/80">NO sign-up fee</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white/80">Works Offline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white/80">Earn cashback</span>
                  </div>
                </div>
              </div>

              {/* First Name */}
              <div 
                className={`bg-black/30 rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  activeField === 'firstName' ? 'ring-2 ring-purple-400' : 'hover:bg-black/40'
                }`}
                onClick={() => setActiveField('firstName')}
              >
                <p className="text-purple-300 text-xs font-semibold mb-1.5">📝 First Name</p>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-transparent text-white text-xl font-semibold outline-none placeholder-white/30"
                />
              </div>

              {/* Last Name */}
              <div 
                className={`bg-black/30 rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  activeField === 'lastName' ? 'ring-2 ring-purple-400' : 'hover:bg-black/40'
                }`}
                onClick={() => setActiveField('lastName')}
              >
                <p className="text-purple-300 text-xs font-semibold mb-1.5">📝 Last Name</p>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Bloggs"
                  className="w-full bg-transparent text-white text-xl font-semibold outline-none placeholder-white/30"
                />
              </div>

              {/* Phone */}
              <div 
                className={`bg-black/30 rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  activeField === 'phone' ? 'ring-2 ring-blue-400' : 'hover:bg-black/40'
                }`}
                onClick={() => setActiveField('phone')}
              >
                <p className="text-blue-300 text-xs font-semibold mb-1.5">📱 Cell Phone Number (10 digits)</p>
                <div className="text-white text-xl font-mono">
                  {phoneNumber || 'No +1456789 or +27831456789'}
                </div>
              </div>

              {/* Date of Birth */}
              <div 
                className={`bg-black/30 rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  activeField === 'dob' ? 'ring-2 ring-cyan-400' : 'hover:bg-black/40'
                }`}
                onClick={() => setActiveField('dob')}
              >
                <p className="text-cyan-300 text-xs font-semibold mb-1.5">🎂 Date of Birth</p>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className="w-full bg-transparent text-white text-xl font-semibold outline-none"
                />
                <p className="text-white/50 text-xs mt-1.5">*Must be at least 18 years old</p>
              </div>

              {/* PIN */}
              <div 
                className={`bg-black/30 rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  activeField === 'pin' ? 'ring-2 ring-green-400' : 'hover:bg-black/40'
                }`}
                onClick={() => setActiveField('pin')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-green-300 text-xs font-semibold">🔒 6-Digit PIN</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPin(!showPin);
                    }}
                    className="text-green-300 hover:text-green-200"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-white text-2xl font-mono tracking-widest">
                  {showPin ? (pinCode || 'Enter 6-digit PIN') : '●'.repeat(pinCode.length) + '○'.repeat(6 - pinCode.length)}
                </div>
              </div>

              {/* Confirm PIN */}
              <div 
                className={`bg-black/30 rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  activeField === 'confirmPin' ? 'ring-2 ring-yellow-400' : 'hover:bg-black/40'
                }`}
                onClick={() => setActiveField('confirmPin')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-yellow-300 text-xs font-semibold">🔒 Confirm 6-Digit PIN</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmPin(!showConfirmPin);
                    }}
                    className="text-yellow-300 hover:text-yellow-200"
                  >
                    {showConfirmPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-white text-2xl font-mono tracking-widest">
                  {showConfirmPin ? (confirmPinCode || 'Re-enter 6-digit PIN') : '●'.repeat(confirmPinCode.length) + '○'.repeat(6 - confirmPinCode.length)}
                </div>
                <p className="text-white/50 text-xs mt-1.5">*Your PIN is used with your Cell Number to login</p>
              </div>

              {/* Terms */}
              <div className="bg-black/30 rounded-xl p-3 mb-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded"
                  />
                  <span className="text-white/80 text-xs">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-xs">{error}</p>
                </div>
              )}

              {/* Link to Transaction Screen */}
              <div className="mt-4 pt-4 border-t border-white/20 text-center">
                <p className="text-white/80 text-sm">
                  Already registered?{' '}
                  <button
                    onClick={() => navigate('/partner/sales-terminal')}
                    className="text-yellow-300 font-bold hover:text-yellow-200 underline transition-colors"
                  >
                    Claim your cashback here!
                  </button>
                </p>
              </div>
            </div>

            {/* Right Side - Keypad or Image */}
            <div className="bg-blue-600 rounded-3xl p-8 flex flex-col">
              <div className="text-center mb-6">
                <p className="text-white text-lg font-semibold">
                  {activeField === 'firstName' 
                    ? 'TYPE YOUR FIRST NAME' 
                    : activeField === 'lastName'
                    ? 'TYPE YOUR LAST NAME'
                    : activeField === 'phone'
                    ? 'ENTER PHONE NUMBER'
                    : activeField === 'dob'
                    ? 'SELECT DATE OF BIRTH'
                    : activeField === 'pin'
                    ? 'ENTER PIN CODE'
                    : 'CONFIRM PIN CODE'}
                </p>
              </div>

              {activeField === 'firstName' || activeField === 'lastName' || activeField === 'dob' ? (
                <div className="flex-1 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=800&fit=crop" 
                    alt="Join Plus1 Rewards" 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-4xl font-bold rounded-2xl h-20 transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    <div></div>
                    <button
                      onClick={() => handleNumberClick('0')}
                      className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-4xl font-bold rounded-2xl h-20 transition-all"
                    >
                      0
                    </button>
                    <button
                      onClick={handleBackspace}
                      className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-2xl font-bold rounded-2xl h-20 transition-all"
                    >
                      ⌫
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleClear}
                      className="bg-red-500/80 hover:bg-red-500 text-white text-xl font-bold rounded-2xl h-16 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !firstName.trim() || !lastName.trim() || phoneNumber.length !== 10 || !dateOfBirth || pinCode.length !== 6 || confirmPinCode.length !== 6 || !termsAccepted}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-xl font-bold rounded-2xl h-16 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Create My Account
                          <Check className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
