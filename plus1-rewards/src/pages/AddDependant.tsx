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
  cover_plan_id: string;
  target_amount: number;
  overflow_balance: number;
  status: string;
  cover_plans: {
    plan_name: string;
  };
}

const AddDependant: React.FC = () => {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberCoverPlan, setMemberCoverPlan] = useState<MemberCoverPlan | null>(null);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [linkedType, setLinkedType] = useState<'dependant' | 'spouse' | 'child' | 'other'>('dependant');
  const [dependantCost, setDependantCost] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  // Calculate dependant cost based on relationship (Day to Day pricing)
  useEffect(() => {
    if (!memberCoverPlan) return;

    let cost = 0;

    // Day to Day pricing structure
    if (linkedType === 'child') {
      cost = 193; // Children
    } else {
      // adult, spouse, dependant, other
      cost = 289; // Adults
    }

    setDependantCost(cost);
  }, [memberCoverPlan, linkedType]);

  const loadData = async () => {
    try {
      const session = getSession();
      
      if (!session || !session.member) {
        navigate('/member/login');
        return;
      }

      const memberData = session.member;
      setMember({
        id: memberData.id,
        name: memberData.name || memberData.full_name,
        phone: memberData.phone || memberData.cell_phone
      });

      // Get member's active cover plan
      const { data: coverPlanData, error: coverPlanError } = await supabase
        .from('member_cover_plans')
        .select(`
          id,
          cover_plan_id,
          target_amount,
          overflow_balance,
          status,
          cover_plans (plan_name)
        `)
        .eq('member_id', memberData.id)
        .eq('status', 'active')
        .order('creation_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (coverPlanError) {
        console.error('Error loading cover plan:', coverPlanError);
      }
      
      if (!coverPlanData) {
        showError('No Active Plan', 'You must have an active cover plan to add dependants.', 5000);
        setTimeout(() => navigate('/member/dashboard'), 2000);
        return;
      }
      
      setMemberCoverPlan(coverPlanData as any);

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Load Error', 'Failed to load data. Please try again.', 3000);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      showWarning('Validation Error', 'Please enter the dependant\'s full name.', 3000);
      return false;
    }

    if (!idNumber.trim()) {
      showWarning('Validation Error', 'Please enter the dependant\'s ID number.', 3000);
      return false;
    }

    if (idNumber.length !== 13) {
      showWarning('Validation Error', 'SA ID number must be 13 digits.', 3000);
      return false;
    }

    if (!memberCoverPlan) {
      showWarning('Validation Error', 'Could not find your active cover plan.', 3000);
      return false;
    }

    if (memberCoverPlan.status !== 'active') {
      showWarning('Validation Error', 'You must have an active cover plan to add dependants.', 3000);
      return false;
    }

    // Check if member has enough overflow to add dependant
    const overflowBalance = Number(memberCoverPlan.overflow_balance || 0);
    if (overflowBalance < dependantCost) {
      showWarning(
        'Insufficient Overflow', 
        `You need R${dependantCost} overflow to add this dependant. You have R${overflowBalance.toFixed(2)}.`,
        5000
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !member || !memberCoverPlan) return;

    setSubmitting(true);

    try {
      // Link dependant directly to the main member's ACTIVE cover plan
      // No new member_cover_plan is created - dependant shares the same plan
      const { error: linkedError } = await supabase
        .from('linked_people')
        .insert({
          member_cover_plan_id: memberCoverPlan.id, // Link to existing ACTIVE plan
          linked_type: linkedType,
          full_name: fullName,
          id_number: idNumber,
          linked_to_main_member_id: member.id,
          status: 'pending'
        });

      if (linkedError) throw linkedError;

      // Create admin notification
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'dependant_request',
          member_id: member.id,
          member_name: member.name,
          member_phone: member.phone,
          message: `${member.name} (${member.phone}) has requested to add a dependant: ${fullName} (${idNumber}) as ${linkedType} on ${memberCoverPlan.cover_plans.plan_name} plan (R${dependantCost}/month). Current overflow: R${Number(memberCoverPlan.overflow_balance).toFixed(2)}.`,
          priority: 'medium',
          metadata: {
            dependant_name: fullName,
            dependant_id: idNumber,
            linked_type: linkedType,
            plan_name: memberCoverPlan.cover_plans.plan_name,
            dependant_cost: dependantCost,
            main_member_plan_amount: memberCoverPlan.target_amount,
            overflow_balance: memberCoverPlan.overflow_balance
          }
        });

      showSuccess(
        'Request Submitted!',
        'Your dependant request has been submitted for admin approval. You will be contacted shortly.',
        5000
      );

      // Reset form
      setFullName('');
      setIdNumber('');
      setLinkedType('dependant');

      // Navigate back after delay
      setTimeout(() => {
        navigate('/member/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error submitting dependant request:', error);
      showError('Submission Failed', 'Failed to submit dependant request. Please try again.', 3000);
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
        <h1 className="text-white text-lg font-bold">Add Dependant</h1>
        <div className="w-10"></div>
      </header>

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form (2/3 width) */}
          <div className="lg:col-span-2">
            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white text-2xl">person_add</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Dependant Details</h2>
                    <p className="text-sm text-teal-100">Add a family member to your cover plan</p>
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
                      placeholder="Enter full name as per ID"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    SA ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">badge</span>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                      placeholder="13-digit ID number"
                      maxLength={13}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">{idNumber.length}/13 digits</p>
                    {idNumber.length === 13 && (
                      <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Valid
                      </span>
                    )}
                  </div>
                </div>

                {/* Relationship Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">family_restroom</span>
                    <select
                      value={linkedType}
                      onChange={(e) => setLinkedType(e.target.value as any)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all appearance-none bg-white"
                      disabled={submitting}
                    >
                      <option value="dependant">Dependant (Adult)</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="other">Other (Adult)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Cover Plan Display with Pricing */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Cover Plan & Monthly Cost
                  </label>
                  {memberCoverPlan ? (
                    <div className="space-y-3">
                      {/* Main Member Plan */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-xl">person</span>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 font-bold uppercase">Your Plan</p>
                              <p className="font-bold text-gray-900">{memberCoverPlan.cover_plans.plan_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Monthly</p>
                            <p className="text-lg font-bold text-blue-600">R{memberCoverPlan.target_amount}</p>
                          </div>
                        </div>
                      </div>

                      {/* Dependant Plan with Cost */}
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-xl">
                                {linkedType === 'child' ? 'child_care' : 'person_add'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-teal-600 font-bold uppercase">Dependant Plan</p>
                              <p className="font-bold text-gray-900">
                                {memberCoverPlan.cover_plans.plan_name}
                                <span className="text-sm text-gray-600 ml-2">
                                  ({linkedType === 'child' ? 'Child' : 'Adult'})
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Monthly</p>
                            <p className="text-2xl font-bold text-teal-600">R{dependantCost}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">info</span>
                          <div className="text-xs text-amber-800">
                            <p className="font-bold mb-1">Day to Day Pricing:</p>
                            <p>Adults R289/month • Children R193/month</p>
                          </div>
                        </div>
                      </div>

                      {/* Overflow Balance Check */}
                      <div className={`p-4 rounded-xl border-2 ${
                        Number(memberCoverPlan.overflow_balance) >= dependantCost 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className={`material-symbols-outlined text-lg mt-0.5 ${
                            Number(memberCoverPlan.overflow_balance) >= dependantCost 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {Number(memberCoverPlan.overflow_balance) >= dependantCost ? 'check_circle' : 'cancel'}
                          </span>
                          <div className="text-xs flex-1">
                            <p className="font-bold mb-1">
                              {Number(memberCoverPlan.overflow_balance) >= dependantCost 
                                ? 'Sufficient Overflow Balance' 
                                : 'Insufficient Overflow Balance'}
                            </p>
                            <p className={Number(memberCoverPlan.overflow_balance) >= dependantCost ? 'text-green-800' : 'text-red-800'}>
                              You have <span className="font-bold">R{Number(memberCoverPlan.overflow_balance).toFixed(2)}</span> overflow.
                              {' '}Need <span className="font-bold">R{dependantCost}</span> to add this dependant.
                            </p>
                            {Number(memberCoverPlan.overflow_balance) < dependantCost && (
                              <p className="text-red-800 mt-1 font-bold">
                                Earn R{(dependantCost - Number(memberCoverPlan.overflow_balance)).toFixed(2)} more cashback to add this dependant.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <p>Loading your cover plan...</p>
                      </div>
                    </div>
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    disabled={submitting || !memberCoverPlan}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Info Cards (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Important Information Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">info</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">Important Information</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5 flex-shrink-0">check_circle</span>
                  <span>Dependant requests require admin approval</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5 flex-shrink-0">check_circle</span>
                  <span>You will be contacted telephonically for verification</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5 flex-shrink-0">check_circle</span>
                  <span>Dependants will be funded in creation order from your cashback</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5 flex-shrink-0">check_circle</span>
                  <span>Ensure all information is accurate before submitting</span>
                </li>
              </ul>
            </div>

            {/* Process Steps Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-yellow-900 text-xl">schedule</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">What happens next?</h3>
              </div>
              <ol className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-yellow-900">
                  <span className="font-bold text-yellow-600 flex-shrink-0 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>Your request is sent to admin for review</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-yellow-900">
                  <span className="font-bold text-yellow-600 flex-shrink-0 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>Admin will contact you telephonically for verification</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-yellow-900">
                  <span className="font-bold text-yellow-600 flex-shrink-0 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs">3</span>
                  <span>Once approved, the dependant cover plan will be activated</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-yellow-900">
                  <span className="font-bold text-yellow-600 flex-shrink-0 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs">4</span>
                  <span>Your cashback will fund both plans in creation order</span>
                </li>
              </ol>
            </div>
          </div>
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

export default AddDependant;
