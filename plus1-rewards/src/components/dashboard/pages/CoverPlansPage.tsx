// plus1-rewards/src/components/dashboard/pages/CoverPlansPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function CoverPlansPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [coverPlans, setCoverPlans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCoverPlans: 0,
    active: 0,
    suspended: 0,
    totalFunded: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    approvalStatus: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching cover plans data...');
      
      // First get all member cover plans
      const { data: memberCoverPlans, error: coverPlansError } = await supabaseAdmin
        .from('member_cover_plans')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Member cover plans raw data:', memberCoverPlans);
      console.log('Member cover plans error:', coverPlansError);

      if (coverPlansError) {
        console.error('Error fetching cover plans:', coverPlansError);
        setCoverPlans([]);
        setLoading(false);
        return;
      }

      if (!memberCoverPlans || memberCoverPlans.length === 0) {
        console.log('No cover plans found');
        setCoverPlans([]);
        setLoading(false);
        return;
      }

      // Get member details for each plan
      const plansWithDetails = await Promise.all(
        memberCoverPlans.map(async (mcp) => {
          // Get member details
          const { data: member } = await supabaseAdmin
            .from('members')
            .select('full_name, cell_phone, phone')
            .eq('id', mcp.member_id)
            .single();

          // Get cover plan details
          const { data: coverPlan } = await supabaseAdmin
            .from('cover_plans')
            .select('plan_name')
            .eq('id', mcp.cover_plan_id)
            .single();

          return {
            id: mcp.id,
            member_id: mcp.member_id,
            member_name: member?.full_name || 'Unknown',
            member_phone: member?.cell_phone || member?.phone || 'N/A',
            cover_plan_name: coverPlan?.plan_name || 'Unknown Plan',
            creation_order: mcp.creation_order,
            target_amount: parseFloat(mcp.target_amount),
            funded_amount: parseFloat(mcp.funded_amount || 0),
            status: mcp.status,
            active_from: mcp.active_from,
            active_to: mcp.active_to,
            created_at: mcp.created_at
          };
        })
      );

      console.log('Plans with details:', plansWithDetails);

      const totalCoverPlans = plansWithDetails.length;
      const active = plansWithDetails.filter(p => p.status === 'active').length;
      const suspended = plansWithDetails.filter(p => p.status === 'suspended' || p.status === 'in_progress').length;
      const totalFunded = plansWithDetails.reduce((sum, p) => sum + p.funded_amount, 0);

      setStats({ totalCoverPlans, active, suspended, totalFunded });
      setCoverPlans(plansWithDetails);
    } catch (error) {
      console.error('Error fetching cover plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualFunding = async (planId: string, amount: number) => {
    try {
      // Get current plan
      const { data: currentPlan } = await supabaseAdmin
        .from('member_cover_plans')
        .select('funded_amount, target_amount')
        .eq('id', planId)
        .single();

      if (!currentPlan) {
        alert('Cover plan not found');
        return;
      }

      const newFundedAmount = parseFloat(currentPlan.funded_amount || 0) + amount;
      const newStatus = newFundedAmount >= parseFloat(currentPlan.target_amount) ? 'active' : 'in_progress';

      // Update the plan
      const { error } = await supabaseAdmin
        .from('member_cover_plans')
        .update({ 
          funded_amount: newFundedAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        alert('Error adding funding: ' + error.message);
        return;
      }

      alert(`Successfully added R${amount.toFixed(2)} to cover plan`);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error adding manual funding:', error);
      alert('Failed to add funding');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => fetchData();
  const handleLogout = () => navigate('/');

  const filteredCoverPlans = coverPlans.filter(cp => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchLower === '' || 
      cp.member_name?.toLowerCase().includes(searchLower) ||
      cp.member_phone?.includes(searchLower) ||
      cp.cover_plan_name?.toLowerCase().includes(searchLower);

    const matchesStatus = filters.status === '' || cp.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  const statsData = [
    { icon: 'health_and_safety', title: 'Total Cover Plans', value: stats.totalCoverPlans.toString(), change: '', description: 'All member plans' },
    { icon: 'check_circle', title: 'Active', value: stats.active.toString(), change: '', description: 'Fully funded plans' },
    { icon: 'pause_circle', title: 'Suspended', value: stats.suspended.toString(), change: '', description: 'Awaiting funding' },
    { icon: 'payments', title: 'Total Funded', value: `R${stats.totalFunded.toFixed(2)}`, change: '', description: 'Across all plans' }
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Topbar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search by member name, phone, or plan..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 pb-10">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Member Cover Plans</h2>
            <p className="text-gray-600 mt-1">Monitor member cover plan funding and status</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                description={stat.description}
              />
            ))}
          </div>

          {/* Cover Plans Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                All Member Cover Plans ({filteredCoverPlans.length})
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`text-xs flex items-center gap-1 font-medium transition-colors ${showFilters ? 'text-[#1a558b]' : 'text-gray-600 hover:text-[#1a558b]'}`}
                >
                  <span className="material-symbols-outlined text-sm">{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                  {showFilters ? 'Hide Filters' : 'Filter'}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
              <div className="px-6 py-4 border-b border-gray-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => setFilters({ status: '', approvalStatus: '' })}
                    className="text-[10px] font-bold text-[#1a558b] hover:underline uppercase tracking-widest"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading cover plans...</p>
              </div>
            ) : filteredCoverPlans.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">No cover plans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Member</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Cover Plan</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Order</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Target</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Funded</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Progress</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Active Until</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCoverPlans.map((plan) => {
                      const progress = (plan.funded_amount / plan.target_amount) * 100;
                      
                      return (
                        <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{plan.member_name}</div>
                              <div className="text-xs text-gray-600">{plan.member_phone}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-900">{plan.cover_plan_name}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center size-8 rounded-full bg-[#1a558b]/10 text-[#1a558b] font-bold text-sm">
                              {plan.creation_order}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">R{plan.target_amount.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-[#1a558b]">R{plan.funded_amount.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-32">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-600">{progress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    progress >= 100 ? 'bg-green-500' : progress >= 90 ? 'bg-yellow-500' : 'bg-[#1a558b]'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              plan.status === 'active' 
                                ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                plan.status === 'active' ? 'bg-green-600' : 'bg-yellow-500'
                              }`}></span>
                              {plan.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {plan.active_to ? (
                              <span className="text-xs text-gray-600">
                                {new Date(plan.active_to).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/members?member_id=${plan.member_id}`)}
                                className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10"
                                title="View Member Details"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </button>
                              <button
                                onClick={() => {
                                  const amount = prompt('Enter manual funding amount (R):');
                                  if (amount && !isNaN(parseFloat(amount))) {
                                    handleManualFunding(plan.id, parseFloat(amount));
                                  }
                                }}
                                className="p-2 text-gray-600 hover:text-green-600 transition-colors rounded-lg bg-gray-100 hover:bg-green-50"
                                title="Add Manual Funding"
                              >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest text-center">
                Showing {filteredCoverPlans.length} of {coverPlans.length} total cover plans
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Cover Plan Funding Rules</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Cover plans fill in creation date order (oldest first)</li>
                <li>• Active status requires full target amount</li>
                <li>• Plans renew every 30 days if funding is maintained</li>
                <li>• Suspended plans need top-up or additional cashback</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2024 +1 Rewards Platform Management • Secured Admin Access
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
