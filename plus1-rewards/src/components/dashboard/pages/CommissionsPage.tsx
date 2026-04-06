// plus1-rewards/src/components/dashboard/pages/CommissionsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function CommissionsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCommissions: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [commissionDetails, setCommissionDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all agents
      const { data: agentsData, error: agentsError } = await supabaseAdmin
        .from('agents')
        .select('id, full_name, mobile_number, email')
        .order('created_at', { ascending: false });

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        setCommissions([]);
        setLoading(false);
        return;
      }

      // Get all transactions to calculate commissions
      const { data: transactionsData, error: transactionsError } = await supabaseAdmin
        .from('transactions')
        .select('id, agent_id, agent_amount, created_at, status')
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        setCommissions([]);
        setLoading(false);
        return;
      }

      // Group transactions by agent and calculate commissions
      const agentCommissionsMap = new Map();
      
      transactionsData?.forEach(transaction => {
        if (transaction.agent_id && transaction.status === 'completed') {
          if (!agentCommissionsMap.has(transaction.agent_id)) {
            agentCommissionsMap.set(transaction.agent_id, {
              agent_id: transaction.agent_id,
              total_amount: 0,
              transaction_count: 0,
              payout_status: 'pending'
            });
          }
          const commission = agentCommissionsMap.get(transaction.agent_id);
          commission.total_amount += parseFloat(transaction.agent_amount) || 0;
          commission.transaction_count += 1;
          // Mark as ready if total >= 100
          if (commission.total_amount >= 100) {
            commission.payout_status = 'ready';
          }
        }
      });

      // Combine with agent data
      const commissionsWithAgents = agentsData?.map(agent => {
        const commission = agentCommissionsMap.get(agent.id) || {
          agent_id: agent.id,
          total_amount: 0,
          transaction_count: 0,
          payout_status: 'pending'
        };
        return {
          ...commission,
          agent_name: agent.full_name || 'Unknown',
          agent_phone: agent.mobile_number || 'N/A',
          agent_email: agent.email || 'N/A'
        };
      }) || [];

      // Filter out agents with no commissions
      const commissionsWithData = commissionsWithAgents.filter(c => c.transaction_count > 0);

      const totalCommissions = commissionsWithData.length;
      const paid = commissionsWithData.filter(c => c.payout_status === 'paid').length;
      const pending = commissionsWithData.filter(c => c.payout_status === 'pending').length;
      const totalAmount = commissionsWithData.reduce((sum, c) => sum + (c.total_amount || 0), 0);

      setStats({ totalCommissions, paid, pending, totalAmount });
      setCommissions(commissionsWithData);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkPaid = async (commissionId: string, amount: number) => {
    if (confirm(`Mark commission of R${amount.toFixed(2)} as paid?`)) {
      try {
        const { error } = await supabaseAdmin
          .from('agent_commissions')
          .update({ 
            payout_status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', commissionId);

        if (error) throw error;
        alert('Commission marked as paid');
        fetchData();
      } catch (error) {
        console.error('Error marking commission as paid:', error);
        alert('Failed to update commission');
      }
    }
  };

  const handleRefresh = () => fetchData();
  const handleLogout = () => navigate('/');

  const handleViewCommission = async (commission: any) => {
    setSelectedCommission(commission);
    setDetailsLoading(true);
    try {
      // Fetch transactions for this agent
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          members(full_name, phone),
          partners(shop_name)
        `)
        .eq('agent_id', commission.agent_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      setCommissionDetails({
        commission,
        transactions: transactions || []
      });
    } catch (error) {
      console.error('Error fetching commission details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeCommissionModal = () => {
    setSelectedCommission(null);
    setCommissionDetails(null);
  };

  const filteredCommissions = commissions.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return searchLower === '' ||
      c.agent_name?.toLowerCase().includes(searchLower) ||
      c.agent_phone?.includes(searchLower);
  });

  const statsData = [
    { icon: 'account_balance_wallet', title: 'Total Agents', value: stats.totalCommissions.toString(), change: '', description: 'Earning commissions' },
    { icon: 'check_circle', title: 'Paid Out', value: stats.paid.toString(), change: '', description: 'This month' },
    { icon: 'pending', title: 'Pending', value: stats.pending.toString(), change: '', description: 'Below threshold' },
    { icon: 'payments', title: 'Total Amount', value: `R${stats.totalAmount.toFixed(2)}`, change: '', description: 'All commissions' }
  ];

  return (
    <>
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search by agent name or phone..."
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
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Agent Commission Management</h2>
            <p className="text-gray-600 mt-1">Track and manage agent commission payouts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (
              <StatCard key={index} icon={stat.icon} title={stat.title} value={stat.value} change={stat.change} description={stat.description} />
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                Agent Commissions ({filteredCommissions.length})
              </h3>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading commissions...</p>
              </div>
            ) : filteredCommissions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">No commission data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Agent</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Contact</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Transactions</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Commission Earned</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Payout Status</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-gray-900">{commission.agent_name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-gray-700">{commission.agent_phone}</div>
                          <div className="text-xs text-gray-600">{commission.agent_email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-gray-900">{commission.transaction_count || 0}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-[#1a558b]">R{parseFloat(commission.total_amount || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            commission.payout_status === 'ready'
                              ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              commission.payout_status === 'ready' ? 'bg-green-600' : 'bg-yellow-500'
                            }`}></span>
                            {commission.payout_status === 'ready' ? 'Ready for Payout' : 'Below Threshold'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {commission.payout_status === 'ready' && (
                              <button
                                onClick={() => handleMarkPaid(commission.id, commission.total_amount)}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleViewCommission(commission)}
                              className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10"
                              title="View Breakdown"
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
            )}

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest text-center">
                Showing {filteredCommissions.length} of {commissions.length} total agents
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Commission Rules</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Agents earn 1% from all partner transactions they manage</li>
                <li>• Minimum payout threshold: R100</li>
                <li>• Commissions calculated monthly</li>
                <li>• Payouts processed after month end</li>
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

    {/* Commission Details Modal */}
    {selectedCommission && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Commission Breakdown</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedCommission.agent_name} - {selectedCommission.month}</p>
            </div>
            <button
              onClick={closeCommissionModal}
              className="size-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6 bg-gray-50">
            {detailsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading commission details...</p>
              </div>
            ) : commissionDetails ? (
              <>
                {/* Summary */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">summarize</span>
                    Commission Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Agent Name</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedCommission.agent_name}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Month</p>
                      <p className="text-sm text-gray-900">{selectedCommission.month}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Commission</p>
                      <p className="text-2xl text-[#1a558b] font-bold">R{parseFloat(selectedCommission.total_amount).toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Payout Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedCommission.payout_status === 'paid'
                          ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                      }`}>
                        {selectedCommission.payout_status}
                      </span>
                    </div>
                    {selectedCommission.paid_at && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Paid At</p>
                        <p className="text-sm text-green-700 font-semibold">{new Date(selectedCommission.paid_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Transactions */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">receipt_long</span>
                    Transactions ({commissionDetails.transactions.length})
                  </h3>
                  {commissionDetails.transactions.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#1a558b]/10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Member</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Partner</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Purchase Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Agent Commission</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {commissionDetails.transactions.map((transaction: any) => (
                              <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{transaction.transaction_time || new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{transaction.members?.full_name || 'Unknown'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{transaction.partners?.shop_name || 'Unknown'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-bold">R{parseFloat(transaction.purchase_amount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{parseFloat(transaction.agent_amount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    transaction.status === 'completed' ? 'bg-green-500/20 text-green-700' : 
                                    transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                    'bg-red-500/20 text-red-700'
                                  }`}>
                                    {transaction.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No transactions found for this period</p>
                    </div>
                  )}
                </section>

                {/* Actions */}
                {selectedCommission.payout_status !== 'paid' && (
                  <section className="flex gap-4 justify-center pt-4">
                    <button
                      onClick={() => {
                        handleMarkPaid(selectedCommission.id, parseFloat(selectedCommission.total_amount));
                        closeCommissionModal();
                      }}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      Mark as Paid
                    </button>
                  </section>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
