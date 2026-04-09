// plus1-rewards/src/pages/PolicyProviderDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const BLUE = '#1a558b';

interface Provider {
  id: string;
  provider_name: string;
  email: string;
  status: string;
}

interface CoverPlan {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  plan_name: string;
  target_amount: number;
  funded_amount: number;
  status: 'active' | 'paused' | 'in_progress';
  active_from: string | null;
  active_to: string | null;
  paused_at: string | null;
  linked_people_count: number;
}

export function PolicyProviderDashboard() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [activePlans, setActivePlans] = useState<CoverPlan[]>([]);
  const [pausedPlans, setPausedPlans] = useState<CoverPlan[]>([]);
  const [inProgressPlans, setInProgressPlans] = useState<CoverPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'paused' | 'in_progress'>('active');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check session storage first, then localStorage
      const providerDataStr = sessionStorage.getItem('currentProvider') || localStorage.getItem('currentProvider');
      
      if (!providerDataStr) {
        navigate('/provider/login');
        return;
      }

      const providerData = JSON.parse(providerDataStr);
      
      // Verify it's Day1Health with active status (local auth, no database check)
      if (providerData.id !== 'day1health' || providerData.status !== 'active') {
        sessionStorage.removeItem('currentProvider');
        localStorage.removeItem('currentProvider');
        navigate('/provider/login');
        return;
      }

      setProvider(providerData);
      await loadCoverPlans();
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/provider/login');
    }
  };

  const loadCoverPlans = async () => {
    setLoading(true);
    try {
      console.log('Starting to load cover plans...');
      
      // First, try a simple query to test connectivity
      const { data: testData, error: testError } = await supabase
        .from('member_cover_plans')
        .select('id')
        .limit(1);
      
      console.log('Test query result:', { testData, testError });

      // Load all member cover plans (Day1Health sees all plans)
      const { data: memberCoverPlans, error } = await supabase
        .from('member_cover_plans')
        .select(`
          id,
          member_id,
          cover_plan_id,
          target_amount,
          funded_amount,
          status,
          active_from,
          active_to,
          paused_at,
          created_at
        `);

      console.log('Member cover plans query result:', { memberCoverPlans, error });

      if (error) {
        console.error('Error loading cover plans:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));
        setActivePlans([]);
        setPausedPlans([]);
        setInProgressPlans([]);
        setLoading(false);
        return;
      }

      if (!memberCoverPlans || memberCoverPlans.length === 0) {
        console.log('No member cover plans found');
        setActivePlans([]);
        setPausedPlans([]);
        setInProgressPlans([]);
        setLoading(false);
        return;
      }

      console.log('Loaded member cover plans:', memberCoverPlans);

      // Get member details
      const memberIds = memberCoverPlans.map(mcp => mcp.member_id);
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone')
        .in('id', memberIds);

      console.log('Members query result:', { members, membersError });

      // Get cover plan details
      const coverPlanIds = memberCoverPlans.map(mcp => mcp.cover_plan_id);
      const { data: coverPlans, error: coverPlansError } = await supabase
        .from('cover_plans')
        .select('id, plan_name')
        .in('id', coverPlanIds);

      console.log('Cover plans query result:', { coverPlans, coverPlansError });

      const membersMap = new Map(members?.map(m => [m.id, m]) || []);
      const coverPlansMap = new Map(coverPlans?.map(cp => [cp.id, cp]) || []);

      // Count linked people separately for each member_cover_plan
      const plansWithLinkedPeople = await Promise.all((memberCoverPlans || []).map(async (mcp: any) => {
        const { data: linkedPeople, error: linkedError } = await supabase
          .from('linked_people')
          .select('id')
          .eq('member_cover_plan_id', mcp.id);

        if (linkedError) {
          console.error(`Error fetching linked people for ${mcp.id}:`, linkedError);
        }

        const member = membersMap.get(mcp.member_id);
        const coverPlan = coverPlansMap.get(mcp.cover_plan_id);

        return {
          id: mcp.id,
          member_id: mcp.member_id,
          member_name: `${member?.first_name} ${member?.last_name}`.trim() || 'Unknown',
          member_phone: member?.phone || 'N/A',
          plan_name: coverPlan?.plan_name || 'Unknown Plan',
          target_amount: parseFloat(mcp.target_amount || 0),
          funded_amount: parseFloat(mcp.funded_amount || 0),
          status: mcp.status,
          active_from: mcp.active_from,
          active_to: mcp.active_to,
          paused_at: mcp.paused_at,
          linked_people_count: linkedPeople?.length || 0
        };
      }));

      console.log('Plans with linked people:', plansWithLinkedPeople);

      // Separate by status
      const activePlansData = plansWithLinkedPeople.filter(p => p.status === 'active');
      const pausedPlansData = plansWithLinkedPeople.filter(p => p.status === 'paused');
      const inProgressPlansData = plansWithLinkedPeople.filter(p => p.status === 'in_progress');

      console.log('Separated plans:', { activePlansData, pausedPlansData, inProgressPlansData });

      setActivePlans(activePlansData);
      setPausedPlans(pausedPlansData);
      setInProgressPlans(inProgressPlansData);
    } catch (error) {
      console.error('Error loading cover plans:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const headers = ['Member ID', 'Member Name', 'Phone', 'Plan Name', 'Monthly Premium (R)', 'Funded Amount (R)', 'Status', 'Active From', 'Active To', 'Linked People', 'Month'];
      const rows = activePlans.map(plan => [
        plan.member_id,
        plan.member_name,
        plan.member_phone,
        plan.plan_name,
        plan.target_amount.toFixed(2),
        plan.funded_amount.toFixed(2),
        'ACTIVE',
        plan.active_from || 'N/A',
        plan.active_to || 'N/A',
        plan.linked_people_count.toString(),
        currentMonth
      ]);

      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${provider?.provider_name.replace(/\s+/g, '_')}_active_plans_${currentMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentProvider');
    localStorage.removeItem('currentProvider');
    navigate('/provider/login');
  };

  const totalActivePremium = activePlans.reduce((sum, p) => sum + p.target_amount, 0);
  const totalActiveFunded = activePlans.reduce((sum, p) => sum + p.funded_amount, 0);
  const totalPausedPremium = pausedPlans.reduce((sum, p) => sum + p.target_amount, 0);
  const totalInProgressPremium = inProgressPlans.reduce((sum, p) => sum + p.target_amount, 0);
  const totalInProgressFunded = inProgressPlans.reduce((sum, p) => sum + p.funded_amount, 0);
  const totalLinkedPeople = activePlans.reduce((sum, p) => sum + p.linked_people_count, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BLUE }}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayPlans = activeTab === 'active' ? activePlans : activeTab === 'paused' ? pausedPlans : inProgressPlans;

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-2xl">health_and_safety</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{provider?.provider_name || 'Provider Dashboard'}</h1>
              <p className="text-sm text-gray-600">Policy Provider Dashboard · {currentMonth}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Plans</span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{activePlans.length}</p>
            <p className="text-sm text-gray-600">Ready for coverage</p>
            <p className="text-xs text-green-600 font-bold mt-2">R{totalActivePremium.toFixed(2)} premium</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-blue-600 text-2xl">hourglass_empty</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">In Progress</span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{inProgressPlans.length}</p>
            <p className="text-sm text-gray-600">Building up funds</p>
            <p className="text-xs text-blue-600 font-bold mt-2">R{totalInProgressFunded.toFixed(2)} / R{totalInProgressPremium.toFixed(2)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-orange-600 text-2xl">pending</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Paused</span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{pausedPlans.length}</p>
            <p className="text-sm text-gray-600">Awaiting funding</p>
            <p className="text-xs text-orange-600 font-bold mt-2">R{totalPausedPremium.toFixed(2)} premium</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-cyan-600 text-2xl">people</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Linked People</span>
            </div>
            <p className="text-3xl font-black text-cyan-600 mb-1">{totalLinkedPeople}</p>
            <p className="text-sm text-gray-600">Dependants & Spouses</p>
            <p className="text-xs text-cyan-600 font-bold mt-2">On active plans</p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0">info</span>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Monthly Batch Submission</p>
            <p>Active cover plans are submitted on the <strong>10th of each month</strong>. Download your CSV export for integration into your policy management system.</p>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-900">Active Coverage</h3>
              <span className="material-symbols-outlined text-green-600 text-2xl">verified</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Total Premium:</span>
                <span className="text-lg font-bold text-green-900">R{totalActivePremium.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Funded Amount:</span>
                <span className="text-lg font-bold text-green-900">R{totalActiveFunded.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Coverage Rate:</span>
                <span className="text-lg font-bold text-green-900">{totalActivePremium > 0 ? ((totalActiveFunded / totalActivePremium) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-900">In Progress</h3>
              <span className="material-symbols-outlined text-blue-600 text-2xl">hourglass_empty</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Total Target:</span>
                <span className="text-lg font-bold text-blue-900">R{totalInProgressPremium.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Currently Funded:</span>
                <span className="text-lg font-bold text-blue-900">R{totalInProgressFunded.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Funding Progress:</span>
                <span className="text-lg font-bold text-blue-900">{totalInProgressPremium > 0 ? ((totalInProgressFunded / totalInProgressPremium) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-900">Portfolio Summary</h3>
              <span className="material-symbols-outlined text-purple-600 text-2xl">summarize</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-800">Total Members:</span>
                <span className="text-lg font-bold text-purple-900">{activePlans.length + inProgressPlans.length + pausedPlans.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-800">Total Premium Value:</span>
                <span className="text-lg font-bold text-purple-900">R{(totalActivePremium + totalInProgressPremium + totalPausedPremium).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-800">Linked Dependants:</span>
                <span className="text-lg font-bold text-purple-900">{totalLinkedPeople}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-1">Monthly Batch Export</h2>
              <p className="text-sm text-gray-600">{activePlans.length} active cover plans · {currentMonth}</p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={exporting || activePlans.length === 0}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              {exporting ? 'Exporting...' : `Export CSV (${activePlans.length} plans)`}
            </button>
          </div>
        </div>

        {/* Cover Plans Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                activeTab === 'active'
                  ? 'border-b-2 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ borderColor: activeTab === 'active' ? BLUE : 'transparent' }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">verified</span>
                Active ({activePlans.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                activeTab === 'in_progress'
                  ? 'border-b-2 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ borderColor: activeTab === 'in_progress' ? BLUE : 'transparent' }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                In Progress ({inProgressPlans.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('paused')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                activeTab === 'paused'
                  ? 'border-b-2 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ borderColor: activeTab === 'paused' ? BLUE : 'transparent' }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">pending</span>
                Paused ({pausedPlans.length})
              </span>
            </button>
          </div>

          {/* Table Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              {activeTab === 'active' ? 'Active' : activeTab === 'in_progress' ? 'In Progress' : 'Paused'} Cover Plans
            </h3>
            <button
              onClick={() => loadCoverPlans()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
          </div>

          {/* Table Content */}
          {displayPlans.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">policy</span>
              <p className="text-gray-600">No {activeTab} cover plans</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Member</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Plan</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Target Amount</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Funded</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Dates</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Linked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">{plan.member_name}</p>
                        <p className="text-xs text-gray-600">{plan.member_phone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-gray-900">{plan.plan_name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-gray-900">R{plan.target_amount.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold ${plan.status === 'active' ? 'text-green-600' : 'text-orange-600'}`}>
                          R{plan.funded_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          plan.status === 'active'
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                            : plan.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                            : 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            plan.status === 'active' ? 'bg-green-600' : plan.status === 'in_progress' ? 'bg-blue-600' : 'bg-orange-600'
                          }`}></span>
                          {plan.status === 'active' ? 'Active' : plan.status === 'in_progress' ? 'In Progress' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {plan.status === 'active' ? (
                          <div className="text-xs text-gray-600">
                            <p>From: {plan.active_from ? new Date(plan.active_from).toLocaleDateString() : 'N/A'}</p>
                            <p>To: {plan.active_to ? new Date(plan.active_to).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600">
                            <p>Paused: {plan.paused_at ? new Date(plan.paused_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-gray-900">{plan.linked_people_count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest text-center">
              Showing {displayPlans.length} {activeTab} cover plans for {currentMonth}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">© 2026 +1 Rewards · Provider Portal</p>
        </div>
      </footer>
    </div>
  );
}
