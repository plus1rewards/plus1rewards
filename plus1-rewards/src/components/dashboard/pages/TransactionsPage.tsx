// plus1-rewards/src/components/dashboard/pages/TransactionsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, volume: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '', // 'spend' or 'earn'
    dateFrom: '',
    dateTo: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          members(first_name, last_name, cell_phone, email),
          partners(shop_name, address, cashback_percent)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const completed = data?.filter(t => t.status === 'completed').length || 0;
      const pending = data?.filter(t => t.status === 'pending').length || 0;
      const volume = data?.reduce((sum, t) => sum + (parseFloat(t.purchase_amount) || 0), 0) || 0;
      
      setStats({ total, completed, pending, volume });
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    setDetailsLoading(true);
    try {
      const { data: policyTrans } = await supabaseAdmin
        .from('policy_transactions')
        .select('*')
        .eq('transaction_id', transactionId);

      setTransactionDetails({
        policyTransactions: policyTrans || []
      });
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (tx: any) => {
    setSelectedTransaction(tx);
    fetchTransactionDetails(tx.id);
  };

  const closeDetailsModal = () => {
    setSelectedTransaction(null);
    setTransactionDetails(null);
  };

  useEffect(() => { fetchData(); }, []);
  const handleRefresh = () => { fetchData(); };
  const handleLogout = () => navigate('/');
  const handleExport = () => console.log('Export CSV triggered');

  const statsData = [
    { icon: 'receipt_long', title: 'Total Transactions', value: stats.total.toString(), change: '+0%', description: 'All time' },
    { icon: 'check_circle', title: 'Completed', value: stats.completed.toString(), change: '+0%', description: 'Successful' },
    { icon: 'pending', title: 'Pending', value: stats.pending.toString(), change: '+0%', description: 'Awaiting confirmation' },
    { icon: 'payments', title: 'Total Volume', value: `R${stats.volume.toFixed(2)}`, change: '+0%', description: 'Transaction value' }
  ];

  const filteredTransactions = transactions.filter(t => {
    // Advanced Search
    const searchLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/);
    
    const matchesSearch = searchLower === '' || searchTerms.every(term => 
      t.id?.toLowerCase().includes(term) ||
      (t.members?.first_name || '')?.toLowerCase().includes(term) ||
      (t.members?.last_name || '')?.toLowerCase().includes(term) ||
      t.partners?.shop_name?.toLowerCase().includes(term) ||
      t.purchase_amount?.toString().includes(term) ||
      t.status?.toLowerCase().includes(term)
    );

    // Filters
    const matchesStatus = filters.status === '' || t.status === filters.status;
    const matchesType = filters.type === '' || 
      (filters.type === 'spend' && t.is_spend) || 
      (filters.type === 'earn' && !t.is_spend);
    
    const matchesDate = (!filters.dateFrom || new Date(t.created_at) >= new Date(filters.dateFrom)) &&
                        (!filters.dateTo || new Date(t.created_at) <= new Date(filters.dateTo));

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400" placeholder="Search transactions, members, partners or IDs..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined text-lg">refresh</span>Refresh
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm">
              <span className="material-symbols-outlined text-lg">logout</span>Logout
            </button>
          </div>
        </header>
        <div className="px-6 md:px-10 pb-10">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Transactions Management</h2>
            <p className="text-gray-600 mt-1">Monitor all platform transactions and payments</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (<StatCard key={index} icon={stat.icon} title={stat.title} value={stat.value} change={stat.change} description={stat.description} />))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>Transactions List ({filteredTransactions.length})
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className={`text-xs flex items-center gap-1 font-medium transition-colors ${showFilters ? 'text-[#1a558b]' : 'text-gray-600 hover:text-[#1a558b]'}`}
                >
                  <span className="material-symbols-outlined text-sm">{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                  {showFilters ? 'Hide Filters' : 'Filter'}
                </button>
                <button onClick={handleExport} className="text-xs text-gray-600 hover:text-[#1a558b] flex items-center gap-1 font-medium transition-colors">
                  <span className="material-symbols-outlined text-sm">download</span>Export CSV
                </button>
              </div>
            </div>

            {/* Advanced Filter Bar */}
            {showFilters && (
              <div className="px-6 py-4 border-b border-gray-200 bg-white grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-200">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="reversed">Reversed</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Type</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="earn">Earn (Purchase)</option>
                    <option value="spend">Spend (Rewards)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">From Date</label>
                  <input 
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">To Date</label>
                  <input 
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button 
                    onClick={() => setFilters({ status: '', type: '', dateFrom: '', dateTo: '' })}
                    className="text-[10px] font-bold text-[#1a558b] hover:underline uppercase tracking-widest"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Transaction ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Member</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Partner</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Member Cashback</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Time</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td className="px-6 py-12 text-center" colSpan={9}><p className="text-gray-600">Loading transactions...</p></td></tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr><td className="px-6 py-4" colSpan={9}><p className="text-sm text-gray-600 text-center">No transactions found</p></td></tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4"><span className="text-xs font-mono font-bold text-[#1a558b] px-2 py-1 bg-[#1a558b]/10 rounded">{tx.id.substring(0, 8).toUpperCase()}</span></td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{tx.members ? `${tx.members.first_name || ''} ${tx.members.last_name || ''}`.trim() : 'Unknown'}</div>
                          <div className="text-xs text-gray-600">{tx.members?.cell_phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{tx.partners?.shop_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600">{tx.partners?.address || 'No address'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === 'completed' ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30' : 
                            tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              tx.status === 'completed' ? 'bg-[#1a558b]' : 
                              tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></span>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4"><span className="text-sm font-bold text-gray-900">R{parseFloat(tx.purchase_amount || 0).toFixed(2)}</span></td>
                        <td className="px-6 py-4"><span className="text-sm font-bold text-[#1a558b]">R{parseFloat(tx.member_amount || 0).toFixed(2)}</span></td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</span></td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-600">{tx.transaction_time || new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDetails(tx)}
                            className="px-3 py-1.5 bg-[#1a558b] text-white rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-3 text-center" colSpan={8}><p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Showing {filteredTransactions.length} of {transactions.length} total records</p></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">© 2024 +1 Rewards Platform Management • Secured Admin Access</p>
          </div>
        </div>

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={closeDetailsModal}
          >
            <div 
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]">receipt_long</span>
                    Transaction Details
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5 font-mono">ID: {selectedTransaction.id}</p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="size-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto flex-1 bg-gray-50">
                <div className="p-6 space-y-6">
                  {/* Status & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2">Transaction Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        selectedTransaction.status === 'completed' ? 'bg-[#1a558b]/20 text-[#1a558b]' : 
                        selectedTransaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-red-500/20 text-red-600'
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          selectedTransaction.status === 'completed' ? 'bg-[#1a558b]' : 
                          selectedTransaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        {selectedTransaction.status}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2">Transaction Date</p>
                      <p className="text-sm text-gray-900">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Financial Summary</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Purchase Amount</p>
                          <p className="text-lg font-black text-gray-900">R{parseFloat(selectedTransaction.purchase_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Member Cashback</p>
                          <p className="text-lg font-black text-[#1a558b]">R{parseFloat(selectedTransaction.member_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">System Fee</p>
                          <p className="text-lg font-black text-gray-900">R{parseFloat(selectedTransaction.system_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Agent Commission</p>
                          <p className="text-lg font-black text-gray-600">R{parseFloat(selectedTransaction.agent_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Cashback %</p>
                          <p className="text-lg font-black text-gray-600">{parseFloat(selectedTransaction.cashback_percent || 0).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Entities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">person</span>
                        Member Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-900">
                          {selectedTransaction.members?.first_name && selectedTransaction.members?.last_name 
                            ? `${selectedTransaction.members.first_name} ${selectedTransaction.members.last_name}`.trim()
                            : 'Unknown Member'}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs">phone</span>
                          {selectedTransaction.members ? `${selectedTransaction.members.first_name || ''} ${selectedTransaction.members.last_name || ''}`.trim() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs">mail</span>
                          {selectedTransaction.members?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        Partner Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-900">{selectedTransaction.partners?.shop_name || 'Unknown Partner'}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {selectedTransaction.partners?.address || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2 font-bold">
                          Cashback Rate: {selectedTransaction.partners?.cashback_percent || '0'}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Policy Connection */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                      Policy Connection
                    </h3>
                    {detailsLoading ? (
                      <p className="text-xs text-gray-500 italic">Checking for policy impact...</p>
                    ) : transactionDetails?.policyTransactions?.length > 0 ? (
                      <div className="space-y-3">
                        {transactionDetails.policyTransactions.map((pt: any) => (
                          <div key={pt.id} className="p-3 bg-[#1a558b]/5 rounded border border-[#1a558b]/10">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-[#1a558b] uppercase">{pt.transaction_type}</span>
                              <span className="text-xs font-black text-gray-900">R{parseFloat(pt.amount).toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-600">{pt.description || 'No additional details'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">This transaction did not directly affect a policy plan.</p>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Transaction Timeline
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Created At</p>
                        <p className="text-xs text-gray-900">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Synced At</p>
                        <p className="text-xs text-gray-900">{selectedTransaction.synced_at ? new Date(selectedTransaction.synced_at).toLocaleString() : 'Not yet synced'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
