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

const SponsorSomeone: React.FC = () => {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  
  const [sponsor, setSponsor] = useState<Member | null>(null);
  const [sponsorCoverPlan, setSponsorCoverPlan] = useState<MemberCoverPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saId, setSaId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Load Error', 'Failed to load data. Please try again.', 3000);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      showWarning('Validation Error', 'Please enter the full name.', 3000);
      return false;
    }

    const cleanPhone = cellPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showWarning('Validation Error', 'Cell phone must be 10 digits.', 3000);
      return false;
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showWarning('Validation Error', 'Please enter a valid email address.', 3000);
      return false;
    }

    if (saId && saId.length !== 13) {
      showWarning('Validation Error', 'SA ID must be 13 digits.', 3000);
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

      // Create new member
      const { data: newMember, error: memberError } = await supabase
        .from('members')
        .insert({
          full_name: fullName,
          cell_phone: cleanPhone,
          email: email || `${cleanPhone}@plus1rewards.local`,
          sa_id: saId || null,
          pin_code: pin,
          qr_code: qrCode,
          status: 'active'
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Get default R390 plan
      const { data: defaultPlan } = await supabase
        .from('cover_plans')
        .select('id')
        .eq('monthly_target_amount', 390)
        .eq('status', 'active')
        .single();

      if (!defaultPlan) {
        throw new Error('Default R390 plan not found');
      }

      // Create active cover plan for sponsored member
      const activeFrom = new Date();
      const activeTo = new Date(activeFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: newCoverPlan, error: planError } = await supabase
        .from('member_cover_plans')
        .insert({
          member_id: newMember.id,
          cover_plan_id: defaultPlan.id,
          creation_order: 1,
          target_amount: 390,
          funded_amount: 390,
          overflow_balance: 0,
          status: 'active',
          active_from: activeFrom.toISOString(),
          active_to: activeTo.toISOString(),
          sponsored_by: sponsor.id
        })
        .select()
        .single();

      if (planError) throw planError;

      // Deduct R390 from sponsor's overflow
      const newOverflow = Number(sponsorCoverPlan.overflow_balance) - 390;
      
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
          amount: -390,
          balance_after: newOverflow
        });

      // Create wallet entry for sponsored member
      await supabase
        .from('cover_plan_wallet_entries')
        .insert({
          member_id: newMember.id,
          member_cover_plan_id: newCoverPlan.id,
          entry_type: 'sponsored_activation',
          amount: 390,
          balance_after: 390
        });

      showSuccess(
        'Sponsorship Complete!',
        `Successfully sponsored ${fullName}. Their plan is now active!`,
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
                You're about to sponsor someone's medical cover plan. R390 will be deducted from your overflow balance to activate their plan for 30 days.
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
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
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
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{cellPhone.length}/10 digits</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email (Optional)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* SA ID */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                SA ID Number (Optional)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">badge</span>
                <input
                  type="text"
                  value={saId}
                  onChange={(e) => setSaId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  placeholder="13-digit ID number"
                  maxLength={13}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  disabled={submitting}
                />
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
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sponsoring...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">volunteer_activism</span>
                    <span>Sponsor for R390</span>
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
