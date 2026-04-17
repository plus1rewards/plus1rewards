import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}

interface CoverPlan {
  id: string;
  plan_name: string;
  monthly_target_amount: number;
}

interface MemberCoverPlan {
  id: string;
  member_id: string;
  cover_plan_id: string;
  creation_order: number;
  target_amount: number;
  funded_amount: number;
  status: 'in_progress' | 'active' | 'paused';
  active_from: string | null;
  active_to: string | null;
  paused_at: string | null;
  created_at: string;
  sponsored_by: string | null;
  cover_plans: CoverPlan;
  sponsored_member?: {
    full_name: string;
    cell_phone: string;
  };
}

interface LinkedPerson {
  id: string;
  full_name: string;
  id_number: string;
  dependant_type: string;
}

// Get pricing based on plan name
const getPlanPricing = (planName: string) => {
  const lowerPlanName = planName.toLowerCase();
  
  // Comprehensive plans
  if (lowerPlanName.includes('comprehensive')) {
    if (lowerPlanName.includes('value plus')) {
      return { single: 665, couple: 1151, childCost: 266 };
    } else if (lowerPlanName.includes('platinum')) {
      return { single: 896, couple: 1611, childCost: 358 };
    } else if (lowerPlanName.includes('executive')) {
      return { single: 985, couple: 1724, childCost: 394 };
    }
  }
  
  // Hospital plans
  if (lowerPlanName.includes('hospital')) {
    return { single: 390, couple: 624, childCost: 156 };
  }
  
  // Day to Day plans
  if (lowerPlanName.includes('day')) {
    return { single: 385, couple: 578, childCost: 193 };
  }
  
  // Default fallback (shouldn't happen)
  return { single: 0, couple: 0, childCost: 0 };
};

// Calculate dependant cost based on plan name and dependant type
const calculateDependantCost = (planName: string, dependantType: string): number => {
  const pricing = getPlanPricing(planName);
  
  if (dependantType === 'child') {
    return pricing.childCost;
  } else {
    // Adult dependant (spouse/partner/other) = couple price - single price
    return pricing.couple - pricing.single;
  }
};

export default function MemberCoverPlans() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [coverPlans, setCoverPlans] = useState<MemberCoverPlan[]>([]);
  const [linkedPeopleByPlan, setLinkedPeopleByPlan] = useState<Record<string, LinkedPerson[]>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<MemberCoverPlan | null>(null);
  const [detailsMemberData, setDetailsMemberData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = getSession();
      if (!session) {
        navigate('/member/login');
        return;
      }

      // Get member ID from session
      const sessionMemberData = session.member;
      
      if (!sessionMemberData || !sessionMemberData.id) {
        console.error('No member data in session');
        navigate('/member/login');
        return;
      }

      // Fetch fresh member data from database
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, cell_phone, email, qr_code')
        .eq('id', sessionMemberData.id)
        .single();

      if (memberError || !memberData) {
        console.error('Error fetching member data:', memberError);
        navigate('/member/login');
        return;
      }

      setMember({
        id: memberData.id,
        name: `${memberData.first_name} ${memberData.last_name}`.trim(),
        phone: memberData.cell_phone,
        email: memberData.email,
        qr_code: memberData.qr_code
      });

      // Load cover plans owned by this member AND plans they're sponsoring
      const { data: ownPlansData } = await supabase
        .from('member_cover_plans')
        .select(`
          *,
          cover_plans (
            id,
            plan_name,
            monthly_target_amount
          )
        `)
        .eq('member_id', memberData.id)
        .order('creation_order', { ascending: true });

      // Load plans this member is sponsoring
      const { data: sponsoredPlansData } = await supabase
        .from('member_cover_plans')
        .select(`
          *,
          cover_plans (
            id,
            plan_name,
            monthly_target_amount
          )
        `)
        .eq('sponsored_by', memberData.id)
        .order('created_at', { ascending: false });

      // For sponsored plans, fetch the member details separately
      const sponsoredPlansWithMembers = await Promise.all(
        (sponsoredPlansData || []).map(async (plan) => {
          const { data: memberInfo } = await supabase
            .from('members')
            .select('first_name, last_name, cell_phone')
            .eq('id', plan.member_id)
            .single();
          
          return {
            ...plan,
            sponsored_member: memberInfo
          };
        })
      );

      const allPlans = [
        ...(ownPlansData || []),
        ...sponsoredPlansWithMembers
      ];

      if (allPlans.length > 0) {
        setCoverPlans(allPlans as any);

        // Load dependants for each cover plan
        const linkedPeopleMap: Record<string, LinkedPerson[]> = {};
        
        for (const plan of allPlans) {
          const { data: linkedData } = await supabase
            .from('dependants')
            .select('id, first_name, last_name, id_number, dependant_type')
            .eq('member_cover_plan_id', plan.id)
            .order('first_name', { ascending: true });

          if (linkedData && linkedData.length > 0) {
            linkedPeopleMap[plan.id] = linkedData.map((d: any) => ({
              ...d,
              full_name: `${d.first_name} ${d.last_name}`.trim()
            })) as LinkedPerson[];
          }
        }

        setLinkedPeopleByPlan(linkedPeopleMap);
      }
    } catch (error) {
      console.error('Error loading cover plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    navigate('/member/login');
  };

  const getProgressPercent = (plan: MemberCoverPlan) => {
    return Math.min((plan.funded_amount / plan.target_amount) * 100, 100);
  };

  const togglePlanExpanded = (planId: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const handleViewDetails = async (plan: MemberCoverPlan) => {
    setSelectedPlanForDetails(plan);
    
    // Fetch full member details
    const memberId = plan.member_id;
    const { data: memberDetails } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();
    
    setDetailsMemberData(memberDetails);
  };

  const closeDetailsModal = () => {
    setSelectedPlanForDetails(null);
    setDetailsMemberData(null);
  };

  if (loading) {
    return (
      <MemberLayout
        member={member}
        isOnline={navigator.onLine}
        pendingTransactions={0}
        onSignOut={handleSignOut}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cover plans...</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout
      member={member}
      isOnline={navigator.onLine}
      pendingTransactions={0}
      onSignOut={handleSignOut}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Cover Plans</h1>
          <p className="text-gray-600 text-sm">View all your healthcare cover plans</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="self-start sm:self-auto bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          className={`px-4 py-3 font-bold text-sm transition-all border-b-2 border-[#1a558b] text-[#1a558b]`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">health_and_safety</span>
            Cover Plans
          </span>
        </button>
      </div>

      {/* Plans Tab */}
      {/* Summary Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-2xl">health_and_safety</span>
            <div>
              <p className="text-gray-900 font-bold text-xl">{coverPlans.length}</p>
              <p className="text-gray-600 text-sm">Total Cover Plans</p>
            </div>
          </div>
        </div>

        {/* Cover Plans List */}
        {coverPlans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-gray-400 text-6xl mb-4 block">health_and_safety</span>
            <h3 className="text-gray-900 font-bold text-lg mb-2">No cover plans yet</h3>
            <p className="text-gray-600 mb-6">Contact support to add a cover plan</p>
            <button
              onClick={() => navigate('/member/support')}
              className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Contact Support
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {coverPlans.map((plan) => {
              const linkedPeople = linkedPeopleByPlan[plan.id] || [];
              const isExpanded = expandedPlans[plan.id] || false;
              const hasLinkedPeople = linkedPeople.length > 0;
              const isSponsored = plan.member_id !== member?.id;

              return (
                <div key={plan.id} className={`bg-white border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${
                  isSponsored ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isSponsored && (
                          <span className="text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-700 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                            SPONSORED
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          #{plan.creation_order}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">{plan.cover_plans.plan_name}</h3>
                      </div>
                      {isSponsored && plan.sponsored_member && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-green-600 text-sm">person</span>
                          <p className="text-sm font-bold text-green-700">
                            {`${plan.sponsored_member.first_name} ${plan.sponsored_member.last_name}`.trim()} ({plan.sponsored_member.cell_phone})
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">Created {new Date(plan.created_at).toLocaleDateString('en-ZA')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      plan.status === 'active' ? 'bg-green-100 text-green-700' :
                      plan.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {plan.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>R{plan.funded_amount.toFixed(2)} funded</span>
                      <span>R{plan.target_amount.toFixed(2)} target</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#1a558b] h-3 rounded-full transition-all"
                        style={{ width: `${getProgressPercent(plan)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold text-[#1a558b]">{getProgressPercent(plan).toFixed(1)}%</span>
                    </div>

                    {plan.status === 'active' && plan.active_to && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Active until: <span className="font-bold text-gray-900">
                            {new Date(plan.active_to).toLocaleDateString('en-ZA')}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* dependants Dropdown */}
                    {hasLinkedPeople && (
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          onClick={() => togglePlanExpanded(plan.id)}
                          className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-600">group</span>
                            <span className="text-sm font-bold text-gray-900">
                              dependants ({linkedPeople.length})
                            </span>
                          </div>
                          <span className={`material-symbols-outlined text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>

                        {/* Total Cost Summary */}
                        {(() => {
                          const pricing = getPlanPricing(plan.cover_plans.plan_name);
                          const mainMemberCost = pricing.single;
                          const totalDependantCost = linkedPeople.reduce((sum, person) => 
                            sum + calculateDependantCost(plan.cover_plans.plan_name, person.dependant_type), 0
                          );
                          const totalMonthlyCost = mainMemberCost + totalDependantCost;
                          
                          return (
                            <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-600">Main Member</span>
                                <span className="text-sm font-bold text-gray-900">R{mainMemberCost.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-600">Dependants ({linkedPeople.length})</span>
                                <span className="text-sm font-bold text-gray-900">R{totalDependantCost.toFixed(2)}</span>
                              </div>
                              <div className="pt-2 border-t border-blue-300 flex items-center justify-between">
                                <span className="text-sm font-black text-[#1a558b]">Total Monthly Cost</span>
                                <span className="text-lg font-black text-[#1a558b]">R{totalMonthlyCost.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {linkedPeople.map((person) => {
                              const dependantCost = calculateDependantCost(plan.cover_plans.plan_name, person.dependant_type);
                              
                              return (
                                <div key={person.id} className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="material-symbols-outlined text-white text-lg">
                                          {person.dependant_type === 'child' ? 'child_care' : person.dependant_type === 'spouse' ? 'favorite' : 'person'}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold text-base text-gray-900">{person.full_name}</p>
                                        <p className="text-xs text-teal-700 uppercase font-bold tracking-wider">
                                          {person.dependant_type}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Details Grid */}
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white/60 rounded p-2">
                                      <p className="text-gray-500 font-semibold uppercase tracking-wider mb-0.5">ID Number</p>
                                      <p className="font-bold text-gray-900">{person.id_number || 'N/A'}</p>
                                    </div>
                                    <div className="bg-white/60 rounded p-2">
                                      <p className="text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Type</p>
                                      <p className="font-bold text-gray-900 capitalize">{person.dependant_type}</p>
                                    </div>
                                    <div className="col-span-2 bg-gradient-to-r from-teal-600 to-emerald-600 rounded p-2">
                                      <p className="text-white/80 font-semibold uppercase tracking-wider mb-0.5 text-[10px]">Monthly Cost</p>
                                      <p className="font-black text-white text-lg">R{dependantCost.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleViewDetails(plan)}
                        className="w-full flex items-center justify-center gap-2 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>{isSponsored ? 'View Sponsored Member' : 'View Main Member'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Member Details Modal */}
      {selectedPlanForDetails && detailsMemberData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={closeDetailsModal}>
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a558b] to-blue-700 px-4 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg">person</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">Member Details</h2>
                  <p className="text-xs text-blue-100">Read-only information</p>
                </div>
              </div>
              <button onClick={closeDetailsModal} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">

              {/* Personal Info */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1a558b] text-base">badge</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    { label: 'First Name',   value: detailsMemberData.first_name },
                    { label: 'Last Name',    value: detailsMemberData.last_name },
                    { label: 'Cell Phone',   value: detailsMemberData.cell_phone },
                    { label: 'Status',       value: detailsMemberData.status?.toUpperCase(), bold: true,
                      color: detailsMemberData.status === 'active' ? 'text-green-600' : 'text-red-600' },
                    ...(detailsMemberData.sa_id ? [{ label: 'SA ID', value: detailsMemberData.sa_id }] : []),
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</p>
                      <p className={`text-sm font-medium text-gray-900 break-all ${(f as any).color || ''} ${(f as any).bold ? 'font-bold' : ''}`}>
                        {(f as any).value || 'N/A'}
                      </p>
                    </div>
                  ))}
                  {/* Email full width */}
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{detailsMemberData.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Cover Plan Info */}
              <div className="bg-blue-50 rounded-xl p-3 space-y-2.5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1a558b] text-base">health_and_safety</span>
                  Cover Plan
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    { label: 'Plan Name',      value: selectedPlanForDetails.cover_plans.plan_name },
                    { label: 'Monthly Target', value: `R${selectedPlanForDetails.target_amount.toFixed(2)}` },
                    { label: 'Funded',         value: `R${selectedPlanForDetails.funded_amount.toFixed(2)}` },
                    { label: 'Status',         value: selectedPlanForDetails.status.toUpperCase(), bold: true,
                      color: selectedPlanForDetails.status === 'active' ? 'text-green-600' :
                             selectedPlanForDetails.status === 'in_progress' ? 'text-blue-600' : 'text-red-600' },
                    ...(selectedPlanForDetails.active_from ? [{ label: 'Active From', value: new Date(selectedPlanForDetails.active_from).toLocaleDateString('en-ZA') }] : []),
                    ...(selectedPlanForDetails.active_to   ? [{ label: 'Active Until', value: new Date(selectedPlanForDetails.active_to).toLocaleDateString('en-ZA') }] : []),
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</p>
                      <p className={`text-sm font-medium text-gray-900 ${(f as any).color || ''} ${(f as any).bold ? 'font-bold' : ''}`}>
                        {(f as any).value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              {detailsMemberData.qr_code && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[#1a558b] text-base">qr_code</span>
                    QR Code
                  </h3>
                  <p className="text-xs font-mono text-gray-600 break-all bg-white border border-gray-200 rounded-lg p-2">
                    {detailsMemberData.qr_code}
                  </p>
                </div>
              )}

              {/* Sponsorship */}
              {selectedPlanForDetails.sponsored_by && (
                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg">volunteer_activism</span>
                  <p className="text-sm text-gray-700 font-medium">This plan is sponsored by another member</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={closeDetailsModal}
                className="w-full bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
