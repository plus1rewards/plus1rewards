// plus1-rewards/src/components/dashboard/pages/ProvidersPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function ProvidersPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabaseAdmin
        .from('insurers')
        .select('*')
        .order('created_at', { ascending: false });

      const total = data?.length || 0;
      const active = data?.filter(p => p.status === 'active').length || 0;
      const pending = data?.filter(p => p.status === 'pending').length || 0;

      setStats({ total, active, pending });
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleViewProvider = async (provider: any) => {
    setSelectedProvider(provider);
    setDetailsLoading(true);
    try {
      // Fetch cover plans for this provider
      const { data: coverPlans } = await supabaseAdmin
        .from('cover_plans')
        .select('*')
        .eq('insurer_id', provider.id);

      // Fetch member cover plans with member details for each plan
      const plansWithMembers = await Promise.all(
        (coverPlans || []).map(async (plan) => {
          const { data: memberCoverPlans } = await supabaseAdmin
            .from('member_cover_plans')
            .select('id, status, member_id, funded_amount, target_amount, active_from, active_to')
            .eq('cover_plan_id', plan.id);

          // Fetch member details
          let membersWithDetails: any[] = [];
          if (memberCoverPlans && memberCoverPlans.length > 0) {
            const memberIds = [...new Set(memberCoverPlans.map(mcp => mcp.member_id).filter(Boolean))];
            
            const { data: membersData } = await supabaseAdmin
              .from('members')
              .select('id, first_name, last_name, cell_phone, email')
              .in('id', memberIds);

            const membersMap = new Map(membersData?.map(m => [m.id, m]) || []);
            
            membersWithDetails = memberCoverPlans.map(mcp => ({
              ...mcp,
              member: membersMap.get(mcp.member_id) || null
            }));
          }

          return {
            ...plan,
            total_members: memberCoverPlans?.length || 0,
            active_members: memberCoverPlans?.filter(mp => mp.status === 'active').length || 0,
            members: membersWithDetails
          };
        })
      );

      setProviderDetails({
        provider,
        coverPlans: plansWithMembers
      });
    } catch (error) {
      console.error('Error fetching provider details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeProviderModal = () => {
    setSelectedProvider(null);
    setProviderDetails(null);
  };

  const statsData = [
    { icon: 'business', title: 'Total Providers', value: stats.total.toString(), change: '', description: 'All providers' },
    { icon: 'check_circle', title: 'Active', value: stats.active.toString(), change: '', description: 'With access' },
    { icon: 'pending', title: 'Pending', value: stats.pending.toString(), change: '', description: 'Awaiting approval' }
  ];

  return (
    <>
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Desktop Header */}
        <header className="hidden md:flex md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Providers Management</h1>
            <p className="text-gray-600 mt-1">Manage medical cover provider access</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchData()} className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined text-lg">refresh</span>Refresh
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm">
              <span className="material-symbols-outlined text-lg">logout</span>Logout
            </button>
          </div>
        </header>

        {/* Mobile Header - 2 Rows */}
        <header className="md:hidden p-4 space-y-3">
          {/* Row 1: Title */}
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Providers</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage provider access</p>
          </div>
          
          {/* Row 2: Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => fetchData()} className="flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-xs flex-1">
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Refresh</span>
            </button>
            <button onClick={() => navigate('/')} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-xs flex-1">
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (
              <StatCard key={index} icon={stat.icon} title={stat.title} value={stat.value} change={stat.change} description={stat.description} />
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                All Providers ({providers.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading providers...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">business</span>
                <p className="text-gray-600 text-lg font-bold">No providers found</p>
                <p className="text-sm text-gray-500 mt-2">Medical cover providers will appear here</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Provider</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Company</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {providers.map((provider) => (
                        <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{provider.provider_name || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-900">{provider.full_name || provider.provider_name || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                              provider.status === 'active'
                                ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                            }`} style={{ borderRadius: "5px" }}>
                              <span className={`size-1.5 ${provider.status === 'active' ? 'bg-green-600' : 'bg-yellow-500'}`} style={{ borderRadius: "50%" }}></span>
                              {provider.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleViewProvider(provider)}
                                className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10" 
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <div key={provider.id} className="p-4 bg-white">
                      {/* Provider Header */}
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="size-10 rounded-full bg-gradient-to-br from-[#1a558b] to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {(provider.provider_name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{provider.provider_name || 'N/A'}</p>
                            <p className="text-xs text-gray-600 truncate">{provider.full_name || provider.provider_name || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="mb-3">
                        <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                          provider.status === 'active'
                            ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                        }`} style={{ borderRadius: "5px" }}>
                          <span className={`size-1.5 ${provider.status === 'active' ? 'bg-green-600' : 'bg-yellow-500'}`} style={{ borderRadius: "50%" }}></span>
                          {provider.status}
                        </span>
                      </div>
                      
                      {/* Created Date */}
                      <div className="mb-3">
                        <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Created</p>
                        <p className="text-xs text-gray-600">{new Date(provider.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      {/* Action Button */}
                      <button 
                        onClick={() => handleViewProvider(provider)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm font-bold"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Provider Dashboard Access</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>â€¢ Providers can log in to view active cover plans</li>
                <li>â€¢ Access to approved member data for processing</li>
                <li>â€¢ View-only access (no editing capabilities)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              Â© 2026 +1 Rewards Platform Management â€¢ Secured Admin Access
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>

    {/* Provider Details Modal */}
    {selectedProvider && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{selectedProvider.provider_name}</h2>
              <p className="text-sm text-gray-600 mt-1">Provider Details & Cover Plans</p>
            </div>
            <button
              onClick={closeProviderModal}
              className="size-10 bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors" style={{ borderRadius: "9px" }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6 bg-gray-50">
            {detailsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading provider details...</p>
              </div>
            ) : providerDetails ? (
              <>
                {/* Basic Information */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">business</span>
                    Provider Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Provider Name</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedProvider.provider_name}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase ${
                        selectedProvider.status === 'active'
                          ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                      }`} style={{ borderRadius: "5px" }}>
                        {selectedProvider.status}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Created At</p>
                      <p className="text-sm text-gray-900">{new Date(selectedProvider.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </section>

                {/* Cover Plans */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">health_and_safety</span>
                    Cover Plans ({providerDetails.coverPlans.length})
                  </h3>
                  {providerDetails.coverPlans.length > 0 ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-600 uppercase tracking-wider">Plan Name</th>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-600 uppercase tracking-wider">Monthly Target</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider">Level</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider">Total Members</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider">Active Members</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                          {providerDetails.coverPlans.map((plan: any) => {
                            const isExpanded = expandedPlans.has(plan.id);
                            const members = plan.members || [];
                            
                            return (
                              <>
                                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{plan.plan_name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-[#1a558b]">R{parseFloat(plan.monthly_target_amount).toFixed(2)}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg">
                                      Level {plan.plan_level}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="text-sm font-bold text-gray-900">{plan.total_members}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="text-sm font-bold text-green-700">{plan.active_members}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold uppercase ${
                                      plan.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                                    }`} style={{ borderRadius: "5px" }}>
                                      {plan.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {members.length > 0 && (
                                      <button
                                        onClick={() => {
                                          const newExpanded = new Set(expandedPlans);
                                          if (isExpanded) {
                                            newExpanded.delete(plan.id);
                                          } else {
                                            newExpanded.add(plan.id);
                                          }
                                          setExpandedPlans(newExpanded);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#1a558b] hover:bg-[#1a558b]/5 rounded-lg transition-colors"
                                        title={`View ${members.length} member${members.length > 1 ? 's' : ''}`}
                                      >
                                        <span className="material-symbols-outlined text-base">
                                          {isExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                        <span>{members.length}</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                                
                                {/* Expandable Members Row */}
                                {isExpanded && members.length > 0 && (
                                  <tr key={`${plan.id}-members`} className="bg-blue-50">
                                    <td colSpan={7} className="px-6 py-4">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="material-symbols-outlined text-[#1a558b] text-lg">group</span>
                                          <h4 className="text-sm font-bold text-gray-900">Members on {plan.plan_name} ({members.length})</h4>
                                        </div>
                                        {members.map((memberPlan: any) => {
                                          const member = memberPlan.member;
                                          if (!member) return null;
                                          
                                          return (
                                            <div key={memberPlan.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                                <div>
                                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Member Name</p>
                                                  <p className="text-sm text-gray-900 font-semibold">{member.first_name} {member.last_name}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Phone</p>
                                                  <p className="text-sm text-gray-900 font-semibold">{member.cell_phone || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Email</p>
                                                  <p className="text-sm text-gray-900 font-semibold break-all">{member.email || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Status</p>
                                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
                                                    memberPlan.status === 'active' ? 'bg-green-500/20 text-green-700' :
                                                    memberPlan.status === 'in_progress' ? 'bg-blue-500/20 text-blue-700' :
                                                    memberPlan.status === 'pending_day1health' ? 'bg-yellow-500/20 text-yellow-700' :
                                                    memberPlan.status === 'paused' ? 'bg-orange-500/20 text-orange-700' :
                                                    'bg-gray-500/20 text-gray-700'
                                                  }`} style={{ borderRadius: '5px' }}>
                                                    {memberPlan.status}
                                                  </span>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Funded Amount</p>
                                                  <p className="text-sm text-[#1a558b] font-bold">R{parseFloat(memberPlan.funded_amount || 0).toFixed(2)} / R{parseFloat(memberPlan.target_amount || 0).toFixed(2)}</p>
                                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div 
                                                      className="h-1.5 rounded-full bg-[#1a558b]"
                                                      style={{ width: `${Math.min(100, (parseFloat(memberPlan.funded_amount || 0) / parseFloat(memberPlan.target_amount || 1)) * 100)}%` }}
                                                    ></div>
                                                  </div>
                                                </div>
                                                {memberPlan.active_from && (
                                                  <div>
                                                    <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Active From</p>
                                                    <p className="text-sm text-gray-900 font-semibold">{new Date(memberPlan.active_from).toLocaleDateString('en-ZA')}</p>
                                                  </div>
                                                )}
                                                {memberPlan.active_to && (
                                                  <div>
                                                    <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Active To</p>
                                                    <p className="text-sm text-gray-900 font-semibold">{new Date(memberPlan.active_to).toLocaleDateString('en-ZA')}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {providerDetails.coverPlans.map((plan: any) => {
                        const isExpanded = expandedPlans.has(plan.id);
                        const members = plan.members || [];
                        
                        return (
                          <div key={plan.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {/* Plan Card */}
                            <div className="p-4">
                              {/* Plan Name */}
                              <div className="mb-3">
                                <p className="text-sm font-bold text-gray-900">{plan.plan_name}</p>
                              </div>
                              
                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Monthly Target</p>
                                  <p className="text-sm font-bold text-[#1a558b]">R{parseFloat(plan.monthly_target_amount).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Level</p>
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg">
                                    Level {plan.plan_level}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Total Members</p>
                                  <p className="text-sm font-bold text-gray-900">{plan.total_members}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Active Members</p>
                                  <p className="text-sm font-bold text-green-700">{plan.active_members}</p>
                                </div>
                              </div>
                              
                              {/* Status */}
                              <div className="mb-3">
                                <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase ${
                                  plan.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                                }`} style={{ borderRadius: "5px" }}>
                                  {plan.status}
                                </span>
                              </div>
                              
                              {/* View Members Button */}
                              {members.length > 0 && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedPlans);
                                    if (isExpanded) {
                                      newExpanded.delete(plan.id);
                                    } else {
                                      newExpanded.add(plan.id);
                                    }
                                    setExpandedPlans(newExpanded);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold text-blue-900"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">group</span>
                                    View {members.length} Member{members.length !== 1 ? 's' : ''}
                                  </span>
                                  <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </button>
                              )}
                            </div>
                            
                            {/* Expanded Members List */}
                            {isExpanded && members.length > 0 && (
                              <div className="border-t border-gray-200 bg-blue-50 p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="material-symbols-outlined text-[#1a558b] text-base">group</span>
                                  <h4 className="text-xs font-bold text-gray-900">Members ({members.length})</h4>
                                </div>
                                {members.map((memberPlan: any) => {
                                  const member = memberPlan.member;
                                  if (!member) return null;
                                  
                                  return (
                                    <div key={memberPlan.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                      {/* Member Name */}
                                      <div className="mb-2">
                                        <p className="text-xs font-bold text-gray-900">{member.first_name} {member.last_name}</p>
                                      </div>
                                      
                                      {/* Contact Info */}
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Phone</p>
                                          <p className="text-[10px] text-gray-900">{member.cell_phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Status</p>
                                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold ${
                                            memberPlan.status === 'active' ? 'bg-green-500/20 text-green-700' :
                                            memberPlan.status === 'in_progress' ? 'bg-blue-500/20 text-blue-700' :
                                            memberPlan.status === 'pending_day1health' ? 'bg-yellow-500/20 text-yellow-700' :
                                            memberPlan.status === 'paused' ? 'bg-orange-500/20 text-orange-700' :
                                            'bg-gray-500/20 text-gray-700'
                                          }`} style={{ borderRadius: '5px' }}>
                                            {memberPlan.status}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Email */}
                                      <div className="mb-2">
                                        <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Email</p>
                                        <p className="text-[10px] text-gray-900 break-all">{member.email || 'N/A'}</p>
                                      </div>
                                      
                                      {/* Funded Amount */}
                                      <div className="mb-2">
                                        <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Funded Amount</p>
                                        <p className="text-xs text-[#1a558b] font-bold mb-1">
                                          R{parseFloat(memberPlan.funded_amount || 0).toFixed(2)} / R{parseFloat(memberPlan.target_amount || 0).toFixed(2)}
                                        </p>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                          <div 
                                            className="h-1.5 rounded-full bg-[#1a558b]"
                                            style={{ width: `${Math.min(100, (parseFloat(memberPlan.funded_amount || 0) / parseFloat(memberPlan.target_amount || 1)) * 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      
                                      {/* Active Dates */}
                                      {(memberPlan.active_from || memberPlan.active_to) && (
                                        <div className="grid grid-cols-2 gap-2">
                                          {memberPlan.active_from && (
                                            <div>
                                              <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Active From</p>
                                              <p className="text-[10px] text-gray-900">{new Date(memberPlan.active_from).toLocaleDateString('en-ZA')}</p>
                                            </div>
                                          )}
                                          {memberPlan.active_to && (
                                            <div>
                                              <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Active To</p>
                                              <p className="text-[10px] text-gray-900">{new Date(memberPlan.active_to).toLocaleDateString('en-ZA')}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No cover plans found</p>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    )}
    </>
  );
}


