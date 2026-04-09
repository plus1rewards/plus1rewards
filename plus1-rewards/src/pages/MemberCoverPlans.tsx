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
  linked_type: string;
  status: string;
}

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

        // Load linked people for each cover plan
        const linkedPeopleMap: Record<string, LinkedPerson[]> = {};
        
        for (const plan of allPlans) {
          const { data: linkedData } = await supabase
            .from('linked_people')
            .select('id, first_name, last_name, id_number, linked_type, status')
            .eq('member_cover_plan_id', plan.id)
            .order('first_name', { ascending: true });

          if (linkedData && linkedData.length > 0) {
            linkedPeopleMap[plan.id] = linkedData as LinkedPerson[];
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Cover Plans</h1>
          <p className="text-gray-600">View all your healthcare cover plans</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          ← Back to Dashboard
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

                    {/* Linked People Dropdown */}
                    {hasLinkedPeople && (
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          onClick={() => togglePlanExpanded(plan.id)}
                          className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-600">group</span>
                            <span className="text-sm font-bold text-gray-900">
                              Linked People ({linkedPeople.length})
                            </span>
                          </div>
                          <span className={`material-symbols-outlined text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {linkedPeople.map((person) => (
                              <div key={person.id} className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="material-symbols-outlined text-white text-sm">
                                        {person.linked_type === 'child' ? 'child_care' : person.linked_type === 'spouse' ? 'favorite' : 'person'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-gray-900">{person.full_name}</p>
                                      <p className="text-xs text-teal-700 uppercase font-bold">
                                        {person.linked_type}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                    person.status === 'active' ? 'bg-green-100 text-green-700' :
                                    person.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    person.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {person.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeDetailsModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1a558b] to-blue-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-2xl">person</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Member Details</h2>
                  <p className="text-sm text-blue-100">Read-only information</p>
                </div>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a558b]">badge</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                    <p className="text-gray-900 font-medium">{detailsMemberData.first_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                    <p className="text-gray-900 font-medium">{detailsMemberData.last_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Cell Phone</label>
                    <p className="text-gray-900 font-medium">{detailsMemberData.cell_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                    <p className="text-gray-900 font-medium break-all">{detailsMemberData.email || 'N/A'}</p>
                  </div>
                  {detailsMemberData.sa_id && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">SA ID Number</label>
                      <p className="text-gray-900 font-medium">{detailsMemberData.sa_id}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                    <p className={`font-bold ${detailsMemberData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {detailsMemberData.status?.toUpperCase() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Plan Information */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a558b]">health_and_safety</span>
                  Cover Plan Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Plan Name</label>
                    <p className="text-gray-900 font-medium">{selectedPlanForDetails.cover_plans.plan_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Monthly Target</label>
                    <p className="text-gray-900 font-medium">R{selectedPlanForDetails.target_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Funded Amount</label>
                    <p className="text-gray-900 font-medium">R{selectedPlanForDetails.funded_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Plan Status</label>
                    <p className={`font-bold ${
                      selectedPlanForDetails.status === 'active' ? 'text-green-600' :
                      selectedPlanForDetails.status === 'in_progress' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {selectedPlanForDetails.status.toUpperCase()}
                    </p>
                  </div>
                  {selectedPlanForDetails.active_from && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Active From</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedPlanForDetails.active_from).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                  )}
                  {selectedPlanForDetails.active_to && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Active Until</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedPlanForDetails.active_to).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code */}
              {detailsMemberData.qr_code && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[#1a558b]">qr_code</span>
                    QR Code
                  </h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <p className="text-sm font-mono text-gray-700">{detailsMemberData.qr_code}</p>
                  </div>
                </div>
              )}

              {/* Sponsorship Info */}
              {selectedPlanForDetails.sponsored_by && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">volunteer_activism</span>
                    Sponsorship Information
                  </h3>
                  <p className="text-sm text-gray-700 mt-2">
                    This plan is sponsored by another member
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-6 py-2 rounded-lg transition-colors"
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
