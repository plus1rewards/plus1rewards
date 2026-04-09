import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';
import { Notification, useNotification } from '../components/Notification';

interface Member {
  id: string;
  name: string;
  phone: string;
}

interface MemberCoverPlan {
  id: string;
  overflow_balance: number;
  status: string;
}

interface CoverPlan {
  id: string;
  plan_name: string;
  monthly_target_amount: number;
}

const SponsorSomeone: React.FC = () => {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  
  const [sponsor, setSponsor] = useState<Member | null>(null);
  const [sponsorCoverPlan, setSponsorCoverPlan] = useState<MemberCoverPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<CoverPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phoneExists, setPhoneExists] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Check phone number in real-time
  useEffect(() => {
    const checkPhoneExists = async () => {
      const cleanPhone = cellPhone.replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        setPhoneExists(false);
        return;
      }

      setCheckingPhone(true);
      
      try {
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .eq('cell_phone', cleanPhone)
          .maybeSingle();

        setPhoneExists(!!data);
      } catch (error) {
        console.error('Error checking phone:', error);
      } finally {
        setCheckingPhone(false);
      }
    };

    const timeoutId = setTimeout(checkPhoneExists, 500);
    return () => clearTimeout(timeoutId);
  }, [cellPhone]);

  const loadData = async () => {
    try {
      const session = getSession();
      
      if (!session || !session.member) {
        navigate('/member/login');
        return;
      }

      const memberData = session.member;
      setSponsor({
        id: memberData.id,
        name: `${memberData.first_name} ${memberData.last_name}`.trim() || `${memberData.first_name} ${memberData.last_name}`.trim(),
        phone: memberData.phone || memberData.cell_phone
      });

      // Get sponsor's active cover plan with overflow
      const { data: coverPlanData, error: coverPlanError } = await supabase
        .from('member_cover_plans')
        .select('id, overflow_balance, status')
        .eq('member_id', memberData.id)
        .eq('status', 'active')
        .order('creation_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (coverPlanError) {
        console.error('Error loading cover plan:', coverPlanError);
      }
      
      if (!coverPlanData) {
        showError('No Active Plan', 'You must have an active cover plan to sponsor someone.', 5000);
        setTimeout(() => navigate('/member/dashboard'), 2000);
        return;
      }

      if (Number(coverPlanData.overflow_balance) < 390) {
        showError('Insufficient Overflow', 'You need at least R390 overflow to sponsor someone.', 5000);
        setTimeout(() => navigate('/member/dashboard'), 2000);
        return;
      }
      
      setSponsorCoverPlan(coverPlanData as any);

      // Load available cover plans (exclude Comprehensive)
      const { data: plansData, error: plansError } = await supabase
        .from('cover_plans')
        .select('id, plan_name, monthly_target_amount')
        .eq('status', 'active')
        .not('plan_name', 'ilike', '%Comprehensive%')
        .order('monthly_target_amount', { ascending: true });

      if (plansError) {
        console.error('Error loading plans:', plansError);
      } else if (plansData && plansData.length > 0) {
        setAvailablePlans(plansData);
        setSelectedPlanId(plansData[0].id); // Default to first plan
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Load Error', 'Failed to load data. Please try again.', 3000);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!selectedPlanId) {
      showWarning('Validation Error', 'Please select a cover plan.', 3000);
      return false;
    }

    if (!firstName.trim()) {
      showWarning('Validation Error', 'Please enter the first name.', 3000);
      return false;
    }

    if (!lastName.trim()) {
      showWarning('Validation Error', 'Please enter the last name.', 3000);
      return false;
    }

    if (!dateOfBirth) {
      showWarning('Validation Error', 'Please enter the date of birth.', 3000);
      return false;
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      showWarning('Validation Error', 'Member must be at least 18 years old.', 3000);
      return false;
    }

    const cleanPhone = cellPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showWarning('Validation Error', 'Cell phone must be 10 digits.', 3000);
      return false;
    }

    if (phoneExists) {
      showError('Phone Already Registered', 'This phone number is already registered in the system. Please use a different number.', 5000);
      return false;
    }

    if (pin.length !== 6) {
      showWarning('Validation Error', 'PIN must be 6 digits.', 3000);
      return false;
    }

    if (pin !== confirmPin) {
      showWarning('Validation Error', 'PINs do not match.', 3000);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !sponsor || !sponsorCoverPlan) return;

    setSubmitting(true);

    try {
      const cleanPhone = cellPhone.replace(/\D/g, '');
      const timestamp = Date.now();
      const qrCode = `PLUS1-${cleanPhone}-${timestamp}`;

      // Check if phone already exists
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('cell_phone', cleanPhone)
        .maybeSingle();

      if (existingMember) {
        showError('Phone Exists', 'This phone number is already registered.', 3000);
        setSubmitting(false);
        return;
      }

      // Create new member with role 'sponsored_member'
      const { data: newMember, error: memberError } = await supabase
        .from('members')
        .insert({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          cell_phone: cleanPhone,
          email: `${cleanPhone}@plus1rewards.local`,
          sa_id: null,
          pin_code: pin,
          qr_code: qrCode,
          status: 'active',
          role: 'sponsored_member'
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Get selected plan details
      const selectedPlan = availablePlans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }

      const planAmount = selectedPlan.monthly_target_amount;

      // Check if sponsor has enough overflow for selected plan
      if (Number(sponsorCoverPlan.overflow_balance) < planAmount) {
        showError('Insufficient Overflow', `You need at least R${planAmount} overflow to sponsor this plan.`, 3000);
        setSubmitting(false);
        return;
      }

      // Create active cover plan for sponsored member
      // Status is 'paused' because plan is 100% funded but profile is incomplete
      const activeFrom = new Date();
      const activeTo = new Date(activeFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: newCoverPlan, error: planError } = await supabase
        .from('member_cover_plans')
        .insert({
          member_id: newMember.id,
          cover_plan_id: selectedPlanId,
          creation_order: 2,
          target_amount: planAmount,
          funded_amount: planAmount,
          overflow_balance: 0,
          status: 'paused',
          active_from: activeFrom.toISOString(),
          active_to: activeTo.toISOString(),
          sponsored_by: sponsor.id
        })
        .select()
        .single();

      if (planError) throw planError;

      // Deduct plan amount from sponsor's overflow
      const newOverflow = Number(sponsorCoverPlan.overflow_balance) - planAmount;
      
      const { error: updateError } = await supabase
        .from('member_cover_plans')
        .update({ overflow_balance: newOverflow })
        .eq('id', sponsorCoverPlan.id);

      if (updateError) throw updateError;

      // Create wallet entry for sponsor
      await supabase
        .from('cover_plan_wallet_entries')
        .insert({
          member_id: sponsor.id,
          member_cover_plan_id: sponsorCoverPlan.id,
          entry_type: 'sponsorship',
          amount: -planAmount,
          balance_after: newOverflow
        });

      // Create wallet entry for sponsored member
      await supabase
        .from('cover_plan_wallet_entries')
        .insert({
          member_id: newMember.id,
          member_cover_plan_id: newCoverPlan.id,
          entry_type: 'sponsored_activation',
          amount: planAmount,
          balance_after: planAmount
        });

      showSuccess(
        'Sponsorship Complete!',
        `Successfully sponsored ${firstName} ${lastName} with ${selectedPlan.plan_name}. Their plan is now active!`,
        5000
      );

      setTimeout(() => {
        navigate('/member/cover-plans');
      }, 3000);

    } catch (error) {
      console.error('Error sponsoring member:', error);
      showError('Sponsorship Failed', 'Failed to sponsor member. Please try again.', 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/member/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 h-16 bg-slate-900 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <img 
            src="/logo.png" 
            alt="Plus1 Rewards" 
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="10" y="25" fill="white" font-family="Arial" font-size="16" font-weight="bold">Plus1</text></svg>';
            }}
          />
        </div>
        <h1 className="text-white text-lg font-bold">Sponsor Someone</h1>
        <div className="w-10"></div>
      </header>

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Info Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">volunteer_activism</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sponsor a Cover Plan</h2>
              <p className="text-sm text-gray-700 mb-2">
                You're about to sponsor someone's medical cover plan. Select a plan below and the amount will be deducted from your overflow balance to activate their plan for 30 days.
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">Your overflow:</span> R{Number(sponsorCoverPlan?.overflow_balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-white text-2xl">person_add</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Member Details</h2>
                <p className="text-sm text-green-100">Register the person you're sponsoring</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Cover Plan Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Cover Plan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">health_and_safety</span>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all appearance-none bg-white"
                  disabled={submitting}
                >
                  <option value="">Choose a plan...</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name} - R{plan.monthly_target_amount}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
              </div>
              {selectedPlanId && (
                <p className="text-xs text-gray-600 mt-2">
                  R{availablePlans.find(p => p.id === selectedPlanId)?.monthly_target_amount} will be deducted from your overflow
                </p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">cake</span>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Member must be at least 18 years old</p>
            </div>

            {/* Cell Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cell Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">phone</span>
                <input
                  type="tel"
                  value={cellPhone}
                  onChange={(e) => setCellPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit cell phone"
                  maxLength={10}
                  className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:ring-2 outline-none transition-all ${
                    phoneExists 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : cellPhone.length === 10 && !checkingPhone
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  disabled={submitting}
                />
                {cellPhone.length === 10 && (
                  <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 ${
                    checkingPhone ? 'text-gray-400 animate-spin' : phoneExists ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {checkingPhone ? 'progress_activity' : phoneExists ? 'cancel' : 'check_circle'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">{cellPhone.length}/10 digits</p>
                {phoneExists && cellPhone.length === 10 && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Phone number already registered
                  </p>
                )}
                {!phoneExists && cellPhone.length === 10 && !checkingPhone && (
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Available
                  </p>
                )}
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                6-Digit PIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Confirm PIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Confirm 6-digit PIN"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
              {pin && confirmPin && pin !== confirmPin && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  PINs do not match
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                disabled={submitting || !selectedPlanId || phoneExists || checkingPhone}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sponsoring...</span>
                  </>
                ) : phoneExists ? (
                  <>
                    <span className="material-symbols-outlined">error</span>
                    <span>Phone Already Registered</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">volunteer_activism</span>
                    <span>
                      {selectedPlanId 
                        ? `Sponsor for R${availablePlans.find(p => p.id === selectedPlanId)?.monthly_target_amount || 0}`
                        : 'Select a Plan'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}
    </div>
  );
};

export default SponsorSomeone;
