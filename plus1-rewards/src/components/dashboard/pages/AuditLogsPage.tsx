// plus1-rewards/src/components/dashboard/pages/AuditLogsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, approvals: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ actionType: '', table: '', user: '', dateFrom: '', dateTo: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Build query with filters
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.table) {
        query = query.eq('table_name', filters.table);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: logsData, count } = await query.limit(100);

      // Get stats
      const { data: todayLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', today);

      const { data: weekLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', sevenDaysAgo);

      const { data: approvalLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action_type', 'approval')
        .gte('created_at', monthStart);

      setLogs(logsData || []);
      setStats({
        total: count || 0,
        today: todayLogs?.length || 0,
        thisWeek: weekLogs?.length || 0,
        approvals: approvalLogs?.length || 0
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
      setStats({ total: 0, today: 0, thisWeek: 0, approvals: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const statsData = [
    { icon: 'history', title: 'Total Actions', value: stats.total.toString(), change: '', description: 'All time' },
    { icon: 'today', title: 'Today', value: stats.today.toString(), change: '', description: 'Actions today' },
    { icon: 'calendar_week', title: 'This Week', value: stats.thisWeek.toString(), change: '', description: 'Last 7 days' },
    { icon: 'approval', title: 'Approvals', value: stats.approvals.toString(), change: '', description: 'This month' }
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Track all system actions and changes</p>
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

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">filter_list</span>
              Filter Audit Logs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Action Type</label>
                <select value={filters.actionType} onChange={(e) => setFilters({...filters, actionType: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none">
                  <option value="">All Actions</option>
                  <option value="approval">Approval</option>
                  <option value="rejection">Rejection</option>
                  <option value="suspension">Suspension</option>
                  <option value="activation">Activation</option>
                  <option value="reversal">Transaction Reversal</option>
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="export">Export Creation</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Table</label>
                <select value={filters.table} onChange={(e) => setFilters({...filters, table: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none">
                  <option value="">All Tables</option>
                  <option value="members">Members</option>
                  <option value="partners">Partners</option>
                  <option value="agents">Agents</option>
                  <option value="transactions">Transactions</option>
                  <option value="invoices">Invoices</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">From Date</label>
                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">To Date</label>
                <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none" />
              </div>
              <div className="flex items-end">
                <button onClick={() => setFilters({ actionType: '', table: '', user: '', dateFrom: '', dateTo: '' })} className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-colors">
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                Audit Trail ({logs.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">history</span>
                <p className="text-gray-600 text-lg font-bold">No audit logs yet</p>
                <p className="text-sm text-gray-500 mt-2">System actions will be tracked here automatically</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-gray-700">Timestamp</th>
                      <th className="px-6 py-3 text-left font-bold text-gray-700">Action</th>
                      <th className="px-6 py-3 text-left font-bold text-gray-700">Table</th>
                      <th className="px-6 py-3 text-left font-bold text-gray-700">Record ID</th>
                      <th className="px-6 py-3 text-left font-bold text-gray-700">User</th>
                      <th className="px-6 py-3 text-left font-bold text-gray-700">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-900 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            log.action_type === 'approval' ? 'bg-green-100 text-green-700' :
                            log.action_type === 'rejection' ? 'bg-red-100 text-red-700' :
                            log.action_type === 'suspension' ? 'bg-orange-100 text-orange-700' :
                            log.action_type === 'activation' ? 'bg-blue-100 text-blue-700' :
                            log.action_type === 'reversal' ? 'bg-purple-100 text-purple-700' :
                            log.action_type === 'adjustment' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-900 capitalize">{log.table_name}</td>
                        <td className="px-6 py-3 text-gray-600 font-mono text-xs">{log.record_id?.substring(0, 8) || '-'}...</td>
                        <td className="px-6 py-3 text-gray-900">{log.user_id?.substring(0, 8) || 'System'}...</td>
                        <td className="px-6 py-3">
                          <details className="cursor-pointer">
                            <summary className="text-[#1a558b] font-bold hover:underline">View</summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono max-w-xs overflow-auto">
                              {log.old_value && (
                                <div className="mb-2">
                                  <p className="font-bold text-red-600">Before:</p>
                                  <pre className="text-red-700">{JSON.stringify(log.old_value, null, 2)}</pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div>
                                  <p className="font-bold text-green-600">After:</p>
                                  <pre className="text-green-700">{JSON.stringify(log.new_value, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </details>
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
              <h4 className="text-sm font-bold text-blue-900 mb-1">Tracked Actions</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Partner, agent, and provider approvals/rejections</li>
                <li>• Cover plan activations and suspensions</li>
                <li>• Transaction reversals and manual adjustments</li>
                <li>• Invoice status changes and payments</li>
                <li>• Export creation and provider access</li>
                <li>• Top-up approvals and dispute resolutions</li>
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
