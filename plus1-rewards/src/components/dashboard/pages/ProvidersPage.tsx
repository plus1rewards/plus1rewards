// plus1-rewards/src/components/dashboard/pages/ProvidersPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function ProvidersPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, exports: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

      setStats({ total, active, pending, exports: 0 });
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

      // Fetch active member cover plans for each plan
      const plansWithCounts = await Promise.all(
        (coverPlans || []).map(async (plan) => {
          const { data: memberPlans } = await supabaseAdmin
            .from('member_cover_plans')
            .select('id, status')
            .eq('cover_plan_id', plan.id);

          return {
            ...plan,
            total_members: memberPlans?.length || 0,
            active_members: memberPlans?.filter(mp => mp.status === 'active').length || 0
          };
        })
      );

      // Fetch exports
      const { data: exports } = await supabaseAdmin
        .from('insurer_exports')
        .select('*')
        .eq('insurer_id', provider.id)
        .order('created_at', { ascending: false });

      setProviderDetails({
        provider,
        coverPlans: plansWithCounts,
        exports: exports || []
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
    { icon: 'pending', title: 'Pending', value: stats.pending.toString(), change: '', description: 'Awaiting approval' },
    { icon: 'upload_file', title: 'Exports', value: stats.exports.toString(), change: '', description: 'This month' }
  ];

  return (
    <>
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Providers Management</h1>
            <p className="text-gray-600 mt-1">Manage medical cover provider access and exports</p>
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Provider</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Company</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Last Export</th>
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            provider.status === 'active'
                              ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                          }`}>
                            <span className={`size-1.5 rounded-full ${provider.status === 'active' ? 'bg-green-600' : 'bg-yellow-500'}`}></span>
                            {provider.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600">Never</span>
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
                            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg bg-gray-100 hover:bg-blue-50" title="Create Export">
                              <span className="material-symbols-outlined text-sm">upload_file</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Provider Dashboard Access</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Providers can log in to view active cover plans</li>
                <li>• Access to approved member data for processing</li>
                <li>• Export functionality for monthly batches</li>
                <li>• View-only access (no editing capabilities)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2024 +1 Rewards Platform Management • Secured Admin Access
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
              className="size-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedProvider.status === 'active'
                          ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                      }`}>
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
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-[#1a558b]/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Plan Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Monthly Target</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Level</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Members</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Active Members</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {providerDetails.coverPlans.map((plan: any) => (
                            <tr key={plan.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{plan.plan_name}</td>
                              <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{parseFloat(plan.monthly_target_amount).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">Level {plan.plan_level}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-bold">{plan.total_members}</td>
                              <td className="px-4 py-3 text-sm text-green-700 font-bold">{plan.active_members}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  plan.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                                }`}>
                                  {plan.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No cover plans found</p>
                    </div>
                  )}
                </section>

                {/* Export History */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">upload_file</span>
                    Export History ({providerDetails.exports.length})
                  </h3>
                  {providerDetails.exports.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-[#1a558b]/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Export Month</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Plans</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Value</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Exported At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {providerDetails.exports.map((exp: any) => (
                            <tr key={exp.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{exp.export_month}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{exp.total_cover_plans}</td>
                              <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{parseFloat(exp.total_value || 0).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  exp.status === 'completed' ? 'bg-green-500/20 text-green-700' : 
                                  exp.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                  'bg-red-500/20 text-red-700'
                                }`}>
                                  {exp.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {exp.exported_at ? new Date(exp.exported_at).toLocaleString() : 'Not exported'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No exports yet</p>
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
