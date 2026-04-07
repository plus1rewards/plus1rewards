// plus1-rewards/src/components/dashboard/pages/ExportsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function ExportsPage() {
  const navigate = useNavigate();
  const [exports, setExports] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalPlans: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all cover plans with member data
      const { data: coverPlans } = await supabaseAdmin
        .from('cover_plans')
        .select(`
          *,
          insurers(name)
        `)
        .order('created_at', { ascending: false });

      // Fetch member cover plans to get active plans
      const { data: memberPlans } = await supabaseAdmin
        .from('member_cover_plans')
        .select(`
          *,
          members(name, phone),
          cover_plans(plan_name, monthly_target_amount)
        `)
        .order('created_at', { ascending: false });

      const exportsList = (memberPlans || []).map((mp: any) => ({
        id: mp.id,
        member_name: mp.members?.name || 'Unknown',
        plan_name: mp.cover_plans?.plan_name || 'Unknown',
        monthly_target: mp.cover_plans?.monthly_target_amount || 0,
        amount_funded: mp.amount_funded || 0,
        status: mp.status,
        created_at: mp.created_at
      }));

      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonth = exportsList.filter(e => e.created_at.startsWith(currentMonth)).length;
      const totalPlans = exportsList.length;
      const totalValue = exportsList.reduce((sum, e) => sum + parseFloat(e.monthly_target || 0), 0);

      setStats({ total: exportsList.length, thisMonth, totalPlans, totalValue });
      setExports(exportsList);
    } catch (error) {
      console.error('Error fetching exports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generateCSVExport = async () => {
    setExporting(true);
    try {
      // Fetch all active member cover plans
      const { data: memberPlans } = await supabaseAdmin
        .from('member_cover_plans')
        .select(`
          *,
          members(name, phone, email),
          cover_plans(plan_name, monthly_target_amount),
          linked_people(name, relationship)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!memberPlans || memberPlans.length === 0) {
        alert('No active cover plans to export');
        setExporting(false);
        return;
      }

      // Build CSV content
      const headers = ['Member Name', 'Phone', 'Email', 'Plan Name', 'Monthly Target', 'Amount Funded', 'Funding %', 'Status', 'Linked Dependants', 'Created Date'];
      const rows = memberPlans.map((mp: any) => {
        const fundingPercent = mp.cover_plans?.monthly_target_amount 
          ? ((mp.amount_funded / mp.cover_plans.monthly_target_amount) * 100).toFixed(1)
          : '0';
        const linkedCount = (mp.linked_people || []).length;
        
        return [
          mp.members?.first_name && mp.members?.last_name ? `${mp.members.first_name} ${mp.members.last_name}` : 'Unknown',
          mp.members?.cell_phone || '',
          mp.members?.email || '',
          mp.cover_plans?.plan_name || 'Unknown',
          `R${parseFloat(mp.cover_plans?.monthly_target_amount || 0).toFixed(2)}`,
          `R${parseFloat(mp.amount_funded || 0).toFixed(2)}`,
          `${fundingPercent}%`,
          mp.status,
          linkedCount,
          new Date(mp.created_at).toLocaleDateString()
        ];
      });

      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const currentMonth = new Date().toISOString().slice(0, 7);
      link.setAttribute('href', url);
      link.setAttribute('download', `cover-plans-export-${currentMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Successfully exported ${memberPlans.length} active cover plans`);
      fetchData();
    } catch (error) {
      console.error('Error generating export:', error);
      alert('Failed to generate export');
    } finally {
      setExporting(false);
    }
  };

  const statsData = [
    { icon: 'upload_file', title: 'Total Exports', value: stats.total.toString(), change: '', description: 'All time' },
    { icon: 'calendar_month', title: 'This Month', value: stats.thisMonth.toString(), change: '', description: 'Current period' },
    { icon: 'health_and_safety', title: 'Total Plans', value: stats.totalPlans.toString(), change: '', description: 'Exported' },
    { icon: 'payments', title: 'Total Value', value: `R${stats.totalValue.toFixed(2)}`, change: '', description: 'All exports' }
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Provider Exports</h1>
            <p className="text-gray-600 mt-1">Generate and manage cover plan exports for providers</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={generateCSVExport} disabled={exporting} className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all text-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">{exporting ? 'hourglass_empty' : 'add'}</span>
              {exporting ? 'Exporting...' : 'Export Cover Plans'}
            </button>
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
                Export History ({exports.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading exports...</p>
              </div>
            ) : exports.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">upload_file</span>
                <p className="text-gray-600 text-lg font-bold">No active cover plans to export</p>
                <p className="text-sm text-gray-500 mt-2">Active cover plans will appear here and can be exported as CSV</p>
                <button onClick={generateCSVExport} disabled={exporting} className="mt-6 px-6 py-3 bg-[#1a558b] text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 mx-auto disabled:opacity-50">
                  <span className="material-symbols-outlined">{exporting ? 'hourglass_empty' : 'add'}</span>
                  {exporting ? 'Exporting...' : 'Generate Export'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Member</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Plan</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Monthly Target</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Funded</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Progress</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exports.map((exp) => {
                      const progress = exp.monthly_target ? ((exp.amount_funded / exp.monthly_target) * 100).toFixed(1) : 0;
                      return (
                        <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{exp.member_name}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-900">{exp.plan_name}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">R{parseFloat(exp.monthly_target || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-[#1a558b]">R{parseFloat(exp.amount_funded || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-[#1a558b] h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-gray-600">{progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              exp.status === 'active'
                                ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                            }`}>
                              <span className={`size-1.5 rounded-full ${exp.status === 'active' ? 'bg-green-600' : 'bg-yellow-500'}`}></span>
                              {exp.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-600">
                              {new Date(exp.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Export Process</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Exports include all active and approved cover plans</li>
                <li>• Member details and linked people are included</li>
                <li>• Providers can access exports through their dashboard</li>
                <li>• Export history is maintained for audit purposes</li>
                <li>• Failed records can be reviewed and corrected</li>
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
  );
}
