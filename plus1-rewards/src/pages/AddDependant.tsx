import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';
import { Notification, useNotification } from '../components/Notification';
import MemberLayout from '../components/member/MemberLayout';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}

interface MemberCoverPlan {
  id: string;
  cover_plan_id: string;
  target_amount: number;
  overflow_balance: number;
  status: string;
  cover_plans: { plan_name: string };
}

const AddDependant: React.FC = () => {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberCoverPlan, setMemberCoverPlan] = useState<MemberCoverPlan | null>(null);

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [linkedType, setLinkedType] = useState<'dependant' | 'spouse' | 'child' | 'other'>('dependant');
  const [dependantCost, setDependantCost] = useState(0);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!memberCoverPlan) return;
    setDependantCost(linkedType === 'child' ? 193 : 289);
  }, [memberCoverPlan, linkedType]);

  const loadData = async () => {
    try {
      const session = getSession();
      if (!session?.member) { navigate('/member/login'); return; }
      const md = session.member;
      setMember({
        id: md.id,
        name: md.name || md.full_name || `${md.first_name} ${md.last_name}`.trim(),
        phone: md.phone || md.cell_phone,
        email: md.email,
        qr_code: md.qr_code,
      });

      const { data: plan } = await supabase
        .from('member_cover_plans')
        .select('id, cover_plan_id, target_amount, overflow_balance, status, cover_plans(plan_name)')
        .eq('member_id', md.id).eq('status', 'active')
        .order('creation_order', { ascending: true }).limit(1).maybeSingle();

      if (!plan) {
        showError('No Active Plan', 'You must have an active cover plan to add dependants.', 5000);
        setTimeout(() => navigate('/member/dashboard'), 2000);
        return;
      }
      setMemberCoverPlan(plan as any);
    } catch {
      showError('Load Error', 'Failed to load data. Please try again.', 3000);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) { showWarning('Validation Error', "Please enter the dependant's full name.", 3000); return false; }
    if (idNumber.length !== 13) { showWarning('Validation Error', 'SA ID number must be 13 digits.', 3000); return false; }
    if (!memberCoverPlan) { showWarning('Validation Error', 'Could not find your active cover plan.', 3000); return false; }
    const overflow = Number(memberCoverPlan.overflow_balance || 0);
    if (overflow < dependantCost) {
      showWarning('Insufficient Overflow', `You need R${dependantCost} overflow. You have R${overflow.toFixed(2)}.`, 5000);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !member || !memberCoverPlan) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('dependants').insert({
        member_cover_plan_id: memberCoverPlan.id,
        linked_type: linkedType,
        full_name: fullName,
        id_number: idNumber,
        linked_to_main_member_id: member.id,
        status: 'pending',
      });
      if (error) throw error;

      await supabase.from('admin_notifications').insert({
        type: 'dependant_request',
        member_id: member.id,
        member_name: member.name,
        member_phone: member.phone,
        message: `${member.name} (${member.phone}) requested to add ${fullName} (${idNumber}) as ${linkedType} — R${dependantCost}/month. Overflow: R${Number(memberCoverPlan.overflow_balance).toFixed(2)}.`,
        priority: 'medium',
        metadata: { dependant_name: fullName, dependant_id: idNumber, dependant_type: linkedType, dependant_cost: dependantCost },
      });

      showSuccess('Request Submitted!', 'Your dependant request has been submitted for admin approval.', 5000);
      setFullName(''); setIdNumber(''); setLinkedType('dependant');
      setTimeout(() => navigate('/member/dashboard'), 3000);
    } catch {
      showError('Submission Failed', 'Failed to submit request. Please try again.', 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => { navigate('/member/login'); };

  if (loading) return (
    <MemberLayout member={member} isOnline={navigator.onLine} pendingTransactions={0} onSignOut={handleSignOut}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    </MemberLayout>
  );

  const overflow = Number(memberCoverPlan?.overflow_balance || 0);
  const hasEnough = overflow >= dependantCost;

  return (
    <MemberLayout member={member} isOnline={navigator.onLine} pendingTransactions={0} onSignOut={handleSignOut}>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Add Dependant</h1>
          <p className="text-gray-500 text-sm mt-0.5">Add a family member to your cover plan</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="self-start sm:self-auto bg-[#1a558b] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#1a558b]/90 transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-xl">person_add</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Dependant Details</h2>
                <p className="text-xs text-teal-100">Fill in the details below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
                  <input
                    type="text" value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Full name as per ID"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                  SA ID Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">badge</span>
                  <input
                    type="text" value={idNumber}
                    onChange={e => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="13-digit ID number" maxLength={13}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    disabled={submitting}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-400">{idNumber.length}/13</span>
                  {idNumber.length === 13 && (
                    <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>Valid
                    </span>
                  )}
                </div>
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">family_restroom</span>
                  <select
                    value={linkedType}
                    onChange={e => setLinkedType(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none appearance-none bg-white"
                    disabled={submitting}
                  >
                    <option value="dependant">Dependant (Adult)</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="other">Other (Adult)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                </div>
              </div>

              {/* Plan & cost summary */}
              {memberCoverPlan && (
                <div className="space-y-3">
                  {/* Your plan */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-base">person</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">Your Plan</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{memberCoverPlan.cover_plans.plan_name}</p>
                      </div>
                    </div>
                    <p className="text-base font-bold text-blue-600">R{memberCoverPlan.target_amount}/mo</p>
                  </div>

                  {/* Dependant cost */}
                  <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-base">
                          {linkedType === 'child' ? 'child_care' : 'person_add'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-teal-600 font-bold uppercase">Dependant Cost</p>
                        <p className="text-xs text-gray-600">{linkedType === 'child' ? 'Child rate' : 'Adult rate'}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-teal-600">R{dependantCost}/mo</p>
                  </div>

                  {/* Overflow check */}
                  <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${hasEnough ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`material-symbols-outlined text-lg flex-shrink-0 mt-0.5 ${hasEnough ? 'text-green-600' : 'text-red-600'}`}>
                      {hasEnough ? 'check_circle' : 'cancel'}
                    </span>
                    <div className="text-xs">
                      <p className={`font-bold mb-0.5 ${hasEnough ? 'text-green-800' : 'text-red-800'}`}>
                        {hasEnough ? 'Sufficient overflow' : 'Insufficient overflow'}
                      </p>
                      <p className={hasEnough ? 'text-green-700' : 'text-red-700'}>
                        You have <strong>R{overflow.toFixed(2)}</strong> — need <strong>R{dependantCost}</strong>
                        {!hasEnough && `. Earn R${(dependantCost - overflow).toFixed(2)} more.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button" onClick={() => navigate('/member/dashboard')}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm"
                  disabled={submitting || !memberCoverPlan || !hasEnough}
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Submitting...</span></>
                  ) : (
                    <><span className="material-symbols-outlined text-base">send</span><span>Submit Request</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Info sidebar ── */}
        <div className="space-y-4">
          {/* Important info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-base">info</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Important</h3>
            </div>
            <ul className="space-y-2">
              {[
                'Requests require admin approval',
                'You will be contacted for verification',
                'Dependants are funded in creation order',
                'Ensure all information is accurate',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="material-symbols-outlined text-blue-500 text-base flex-shrink-0 mt-0.5">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-900 text-base">payments</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Pricing</h3>
            </div>
            <div className="space-y-2 text-xs text-amber-900">
              <div className="flex justify-between"><span>Adults / Spouse</span><strong>R289/month</strong></div>
              <div className="flex justify-between"><span>Children</span><strong>R193/month</strong></div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-yellow-900 text-base">schedule</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">What happens next?</h3>
            </div>
            <ol className="space-y-2">
              {[
                'Request sent to admin for review',
                'Admin contacts you for verification',
                'Dependant plan activated once approved',
                'Cashback funds both plans in order',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-yellow-900">
                  <span className="w-5 h-5 bg-yellow-200 text-yellow-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {notification && (
        <Notification type={notification.type} title={notification.title} message={notification.message} onClose={hideNotification} duration={notification.duration} />
      )}
    </MemberLayout>
  );
};

export default AddDependant;
