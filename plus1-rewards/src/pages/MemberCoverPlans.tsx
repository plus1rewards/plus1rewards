import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';
import MemberNotifications from '../components/member/MemberNotifications';

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
  status: 'in_progress' | 'active' | 'suspended';
  active_from: string | null;
  active_to: string | null;
  suspended_at: string | null;
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
  const [searchParams] = useSearchParams();
  const [member, setMember] = useState<Member | null>(null);
  const [coverPlans, setCoverPlans] = useState<MemberCoverPlan[]>([]);
  const [linkedPeopleByPlan, setLinkedPeopleByPlan] = useState<Record<string, LinkedPerson[]>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'notifications'>((searchParams.get('tab') as any) || 'plans');

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
        .select('id, full_name, cell_phone, email, qr_code')
        .eq('id', sessionMemberData.id)
        .single();

      if (memberError || !memberData) {
        console.error('Error fetching member data:', memberError);
        navigate('/member/login');
        return;
      }

      setMember({
        id: memberData.id,
        name: memberData.full_name,
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
            .select('full_name, cell_phone')
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
            .select('id, full_name, id_number, linked_type, status')
            .eq('member_cover_plan_id', plan.id)
            .order('full_name', { ascending: true });

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
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'plans'
              ? 'border-[#1a558b] text-[#1a558b]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">health_and_safety</span>
            Cover Plans
          </span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'notifications'
              ? 'border-[#1a558b] text-[#1a558b]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">notifications</span>
            Notifications
          </span>
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
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
                          {plan.sponsored_member.full_name} ({plan.sponsored_member.cell_phone})
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
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && member && (
        <MemberNotifications memberId={member.id} />
      )}
    </MemberLayout>
  );
}
