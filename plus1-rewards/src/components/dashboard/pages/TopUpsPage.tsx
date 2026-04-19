// plus1-rewards/src/components/dashboard/pages/TopUpsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function TopUpsPage() {
  const navigate = useNavigate();
  const [topUps, setTopUps] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabaseAdmin
        .from('top_ups')
        .select(`
          *,
          member_cover_plan:member_cover_plans(
            member:members(full_name, phone),
            cover_plan:cover_plans(plan_name)
          )
        `)
        .order('created_at', { ascending: false });

      const topUpsList = data || [];
      const total = topUpsList.length;
      const pending = topUpsList.filter(t => !t.approved_by).length;
      const approved = topUpsList.filter(t => t.approved_by).length;
      const totalAmount = topUpsList.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      setStats({ total, pending, approved, totalAmount });
      setTopUps(topUpsList);
    } catch (error) {
      console.error('Error fetching top-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statsData = [
    { icon: 'add_card', title: 'Total Top-Ups', value: stats.total.toString(), change: '', description: 'All payments' },
    { icon: 'person', title: 'Member Top-Ups', value: topUps.filter(t => t.payer_type === 'member').length.toString(), change: '', description: 'From members' },
    { icon: 'storefront', title: 'Partner Top-Ups', value: topUps.filter(t => t.payer_type === 'partner').length.toString(), change: '', description: 'From partners' },
    { icon: 'payments', title: 'Total Amount', value: `R${stats.totalAmount.toFixed(2)}`, change: '', description: 'All top-ups' }
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Mobile Header - 2 rows */}
        <header className="md:hidden p-4 space-y-3">
          {/* Row 1: Title + Count */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a558b] text-2xl">add_card</span>
            <h1 className="text-xl font-black text-gray-900">Top-Ups</h1>
            <span className="ml-auto px-2 py-0.5 bg-[#1a558b]/10 text-[#1a558b] text-xs font-bold" style={{ borderRadius: '5px' }}>
              {topUps.length}
            </span>
          </div>

          {/* Row 2: Refresh button */}
          <div className="flex gap-2">
            <button 
              onClick={() => fetchData()} 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Top-Ups Management</h1>
            <p className="text-gray-600 mt-1">View member and partner top-up payment logs</p>
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

        <div className="px-4 md:px-10 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
            {statsData.map((stat, index) => (
              <StatCard key={index} icon={stat.icon} title={stat.title} value={stat.value} change={stat.change} description={stat.description} />
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                <span className="hidden md:inline">All Top-Up Payments ({topUps.length})</span>
                <span className="md:hidden">Top-Ups</span>
              </h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading top-ups...</p>
              </div>
            ) : topUps.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">add_card</span>
                <p className="text-gray-600 text-lg font-bold">No top-up requests</p>
                <p className="text-sm text-gray-500 mt-2">Member and partner top-up requests will appear here</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {topUps.map((topUp) => (
                    <div key={topUp.id} className="p-4 hover:bg-gray-50 transition-colors">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-sm mb-1">
                            {topUp.member_cover_plan?.member?.full_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(topUp.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ borderRadius: "5px" }} ${
                          topUp.payer_type === 'member'
                            ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-700 border border-purple-500/30'
                        }`}>
                          {topUp.payer_type}
                        </span>
                      </div>

                      {/* Amount - Highlighted */}
                      <div className="mb-3 p-3 bg-[#1a558b]/5 border border-[#1a558b]/20 rounded-lg">
                        <p className="text-xs text-gray-600 mb-0.5">Amount</p>
                        <p className="text-2xl font-black text-[#1a558b]">R{parseFloat(topUp.amount).toFixed(2)}</p>
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="material-symbols-outlined text-gray-400 text-base">health_and_safety</span>
                          <span className="text-gray-600">Plan:</span>
                          <span className="text-gray-900 font-semibold">{topUp.member_cover_plan?.cover_plan?.plan_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="material-symbols-outlined text-gray-400 text-base">payment</span>
                          <span className="text-gray-600">Method:</span>
                          <span className="text-gray-900 font-semibold uppercase">{topUp.payment_method || 'N/A'}</span>
                        </div>
                        {topUp.reference_note && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="material-symbols-outlined text-gray-400 text-base">description</span>
                            <span className="text-gray-600">Ref:</span>
                            <span className="text-gray-900 font-semibold">{topUp.reference_note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Payer Type</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Payer Name</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Cover Plan</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Method</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Date</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topUps.map((topUp) => (
                        <tr key={topUp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase" style={{ borderRadius: "5px" }} ${
                              topUp.payer_type === 'member'
                                ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-700 border border-purple-500/30'
                            }`}>
                              {topUp.payer_type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{topUp.member_cover_plan?.member?.full_name || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-900">{topUp.member_cover_plan?.cover_plan?.plan_name || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-[#1a558b]">R{parseFloat(topUp.amount).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-600 uppercase">{topUp.payment_method || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-600">{new Date(topUp.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-600">{topUp.reference_note || '-'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Top-Up Information</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>â€¢ All top-ups are automatically processed and active</li>
                <li>â€¢ Members can top up cover plan shortfalls via EFT, card, or cash</li>
                <li>â€¢ Partners can top up to settle outstanding invoices</li>
                <li>â€¢ This page shows a complete log of all top-up payments</li>
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
  );
}


