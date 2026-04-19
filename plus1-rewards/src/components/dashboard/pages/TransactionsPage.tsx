// plus1-rewards/src/components/dashboard/pages/TransactionsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';
import { FilterConfig, FilterValues } from '../AdvancedFilters';
import { applyFilters, countActiveFilters, commonFilters } from '../../../utils/filterHelpers';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, volume: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  // Advanced Filter Configuration
  const transactionFilters: FilterConfig[] = [
    {
      id: 'transactionId',
      label: 'Transaction ID',
      type: 'text',
      placeholder: 'Search by transaction ID...'
    },
    {
      id: 'memberName',
      label: 'Member Name',
      type: 'text',
      placeholder: 'Search by member name...'
    },
    {
      id: 'memberPhone',
      label: 'Member Phone',
      type: 'text',
      placeholder: 'Search by phone...'
    },
    {
      id: 'partnerName',
      label: 'Partner Name',
      type: 'text',
      placeholder: 'Search by partner...'
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'reversed', label: 'Reversed' },
        { value: 'disputed', label: 'Disputed' }
      ]
    },
    {
      id: 'purchaseAmount',
      label: 'Purchase Amount (R)',
      type: 'numberRange',
      min: 0
    },
    {
      id: 'cashbackAmount',
      label: 'Cashback Amount (R)',
      type: 'numberRange',
      min: 0
    },
    {
      id: 'transactionDate',
      label: 'Transaction Date',
      type: 'dateRange'
    }
  ];

  const fetchData = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPage(0);
      setTransactions([]);
    }
    
    try {
      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      console.log(`Fetching transactions page ${currentPage} (${from}-${to})...`);
      
      // Get total count first (only on initial load)
      if (!loadMore) {
        const { count } = await supabaseAdmin
          .from('transactions')
          .select('*', { count: 'exact', head: true });
        setTotalCount(count || 0);
        console.log('Total transactions:', count);
      }
      
      // Fetch transactions with pagination
      const { data: transactionsData, error: transactionsError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        throw transactionsError;
      }
      
      console.log('Transactions fetched:', transactionsData?.length);
      
      // Check if there are more records
      setHasMore(transactionsData && transactionsData.length === PAGE_SIZE);
      
      // Fetch members and partners separately
      let transactionsWithDetails = transactionsData || [];
      
      if (transactionsData && transactionsData.length > 0) {
        // Get unique member IDs and partner IDs
        const memberIds = [...new Set(transactionsData.map(t => t.member_id).filter(Boolean))];
        const partnerIds = [...new Set(transactionsData.map(t => t.partner_id).filter(Boolean))];
        
        console.log('Fetching members:', memberIds.length);
        console.log('Fetching partners:', partnerIds.length);
        
        // Fetch members
        const { data: membersData } = await supabaseAdmin
          .from('members')
          .select('id, first_name, last_name, cell_phone, email')
          .in('id', memberIds);
        
        // Fetch partners
        const { data: partnersData } = await supabaseAdmin
          .from('partners')
          .select('id, shop_name, address, cashback_percent')
          .in('id', partnerIds);
        
        console.log('Members fetched:', membersData?.length);
        console.log('Partners fetched:', partnersData?.length);
        
        // Create maps for quick lookup
        const membersMap = new Map(membersData?.map(m => [m.id, m]) || []);
        const partnersMap = new Map(partnersData?.map(p => [p.id, p]) || []);
        
        // Merge data
        transactionsWithDetails = transactionsData.map(tx => ({
          ...tx,
          members: membersMap.get(tx.member_id) || null,
          partners: partnersMap.get(tx.partner_id) || null
        }));
      }
      
      // Update transactions list
      if (loadMore) {
        setTransactions(prev => [...prev, ...transactionsWithDetails]);
        setPage(currentPage);
      } else {
        setTransactions(transactionsWithDetails);
        
        // Calculate stats (only on initial load)
        const { count: completedCount } = await supabaseAdmin
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        const { count: pendingCount } = await supabaseAdmin
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        const { data: volumeData } = await supabaseAdmin
          .from('transactions')
          .select('purchase_amount');
        
        const volume = volumeData?.reduce((sum, t) => sum + (parseFloat(t.purchase_amount) || 0), 0) || 0;
        
        setStats({ 
          total: totalCount, 
          completed: completedCount || 0, 
          pending: pendingCount || 0, 
          volume 
        });
        
        console.log('Stats:', { total: totalCount, completed: completedCount, pending: pendingCount, volume });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTransactions = () => {
    if (!loadingMore && hasMore) {
      fetchData(true);
    }
  };

  const handleViewDetails = (tx: any) => {
    setSelectedTransaction(tx);
  };

  const closeDetailsModal = () => {
    setSelectedTransaction(null);
  };

  useEffect(() => { fetchData(); }, []);
  const handleRefresh = () => { fetchData(); };
  const handleLogout = () => navigate('/');
  const handleExport = () => console.log('Export CSV triggered');

  const statsData = [
    { icon: 'receipt_long', title: 'Total Transactions', value: stats.total.toString(), change: '', description: 'All time' },
    { icon: 'check_circle', title: 'Completed', value: stats.completed.toString(), change: '', description: 'Successful' },
    { icon: 'pending', title: 'Pending', value: stats.pending.toString(), change: '', description: 'Awaiting confirmation' },
    { icon: 'payments', title: 'Total Volume', value: `R${stats.volume.toFixed(2)}`, change: '', description: 'Transaction value' }
  ];

  // Advanced Filter Configuration
  const filterConfig = {
    transactionId: (tx: any, value: string) => 
      commonFilters.textMatch(tx.id, value),
    
    memberName: (tx: any, value: string) => {
      const fullName = `${tx.members?.first_name || ''} ${tx.members?.last_name || ''}`.trim();
      return commonFilters.textMatch(fullName, value);
    },
    
    memberPhone: (tx: any, value: string) => 
      commonFilters.textMatch(tx.members?.cell_phone, value),
    
    partnerName: (tx: any, value: string) => 
      commonFilters.textMatch(tx.partners?.shop_name, value),
    
    status: (tx: any, value: string) => 
      tx.status === value,
    
    purchaseAmount: (tx: any, range: { from?: string; to?: string }) => 
      commonFilters.numberInRange(parseFloat(tx.purchase_amount) || 0, range),
    
    cashbackAmount: (tx: any, range: { from?: string; to?: string }) => 
      commonFilters.numberInRange(parseFloat(tx.member_amount) || 0, range),
    
    transactionDate: (tx: any, range: { from?: string; to?: string }) => 
      commonFilters.dateInRange(tx.created_at, range)
  };

  // Apply advanced filters
  const filteredTransactions = applyFilters(transactions, filterValues, filterConfig).filter(t => {
    // Keep the search term filter separate for quick searching
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower === '') return true;
    
    const searchTerms = searchLower.split(/\s+/);
    return searchTerms.every(term => 
      t.id?.toLowerCase().includes(term) ||
      (t.members?.first_name || '')?.toLowerCase().includes(term) ||
      (t.members?.last_name || '')?.toLowerCase().includes(term) ||
      t.partners?.shop_name?.toLowerCase().includes(term) ||
      t.purchase_amount?.toString().includes(term) ||
      t.status?.toLowerCase().includes(term)
    );
  });

  const activeFiltersCount = countActiveFilters(filterValues);

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
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]" style={{ fontSize: '20px' }}>list_alt</span>
                    Transactions List ({filteredTransactions.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      showFilters 
                        ? 'bg-[#1a558b] text-white' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#1a558b] hover:text-[#1a558b]'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                    <span>{showFilters ? 'Hide' : 'Filter'}</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-green-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full ml-1">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={handleExport} 
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-[#1a558b] hover:text-[#1a558b] transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                    <span>Export</span>
                  </button>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                  Transactions List ({filteredTransactions.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`text-xs flex items-center gap-1 font-medium transition-colors ${showFilters ? 'text-[#1a558b]' : 'text-gray-600 hover:text-[#1a558b]'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                    {showFilters ? 'Hide Filters' : 'Filter'}
                    {activeFiltersCount > 0 && (
                      <span className="bg-green-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full ml-1">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                  <button onClick={handleExport} className="text-xs text-gray-600 hover:text-[#1a558b] flex items-center gap-1 font-medium transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span>Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-white animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]">tune</span>
                    Filter Options
                  </h3>
                  <button
                    onClick={() => setFilterValues({})}
                    className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">restart_alt</span>
                    Reset All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transactionFilters.map((filter) => (
                    <div key={filter.id} className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        {filter.label}
                      </label>
                      {filter.type === 'text' && (
                        <input
                          type="text"
                          value={filterValues[filter.id] || ''}
                          onChange={(e) => setFilterValues({ ...filterValues, [filter.id]: e.target.value })}
                          placeholder={filter.placeholder}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
                        />
                      )}
                      {filter.type === 'select' && (
                        <select
                          value={filterValues[filter.id] || ''}
                          onChange={(e) => setFilterValues({ ...filterValues, [filter.id]: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
                        >
                          <option value="">All {filter.label}</option>
                          {filter.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {filter.type === 'dateRange' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">From</label>
                            <input
                              type="date"
                              value={filterValues[filter.id]?.from || ''}
                              onChange={(e) => setFilterValues({ 
                                ...filterValues, 
                                [filter.id]: { ...(filterValues[filter.id] || {}), from: e.target.value } 
                              })}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">To</label>
                            <input
                              type="date"
                              value={filterValues[filter.id]?.to || ''}
                              onChange={(e) => setFilterValues({ 
                                ...filterValues, 
                                [filter.id]: { ...(filterValues[filter.id] || {}), to: e.target.value } 
                              })}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
                            />
                          </div>
                        </div>
                      )}
                      {filter.type === 'numberRange' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min</label>
                            <input
                              type="number"
                              value={filterValues[filter.id]?.from || ''}
                              onChange={(e) => setFilterValues({ 
                                ...filterValues, 
                                [filter.id]: { ...(filterValues[filter.id] || {}), from: e.target.value } 
                              })}
                              placeholder="Min"
                              min={filter.min}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Max</label>
                            <input
                              type="number"
                              value={filterValues[filter.id]?.to || ''}
                              onChange={(e) => setFilterValues({ 
                                ...filterValues, 
                                [filter.id]: { ...(filterValues[filter.id] || {}), to: e.target.value } 
                              })}
                              placeholder="Max"
                              max={filter.max}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Active Filters Summary */}
                {activeFiltersCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-bold">{activeFiltersCount}</span> filter{activeFiltersCount !== 1 ? 's' : ''} active
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <table className="hidden md:table w-full text-left border-collapse">
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                            tx.status === 'completed' ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30' : 
                            tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`} style={{ borderRadius: '9px' }}>
                            <span className={`size-1.5 ${
                              tx.status === 'completed' ? 'bg-[#1a558b]' : 
                              tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ borderRadius: '50%' }}></span>
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
                </tbody>
              </table>
              
              {/* Mobile Card View */}
              <div className="md:hidden">
                {loading ? (
                  <div className="p-6 text-center"><p className="text-gray-600">Loading transactions...</p></div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-6 text-center"><p className="text-sm text-gray-600">No transactions found</p></div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredTransactions.map((tx) => (
                      <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Transaction ID & Status */}
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#1a558b] px-2 py-1 bg-[#1a558b]/10 rounded flex-shrink-0">
                            {tx.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase flex-shrink-0 ${
                            tx.status === 'completed' ? 'bg-[#1a558b]/20 text-[#1a558b]' : 
                            tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-red-500/20 text-red-600'
                          }`} style={{ borderRadius: '5px' }}>
                            <span className={`size-1 ${
                              tx.status === 'completed' ? 'bg-[#1a558b]' : 
                              tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ borderRadius: '50%' }}></span>
                            {tx.status}
                          </span>
                        </div>
                        
                        {/* Member Info */}
                        <div className="mb-2">
                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Member</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {tx.members ? `${tx.members.first_name || ''} ${tx.members.last_name || ''}`.trim() : 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-600">{tx.members?.cell_phone || 'No phone'}</p>
                        </div>
                        
                        {/* Partner Info */}
                        <div className="mb-3">
                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Partner</p>
                          <p className="text-sm font-semibold text-gray-900">{tx.partners?.shop_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-600">{tx.partners?.address || 'No address'}</p>
                        </div>
                        
                        {/* Amount Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3 bg-gray-50 rounded-lg p-3">
                          <div>
                            <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Purchase Amount</p>
                            <p className="text-base font-black text-gray-900">R{parseFloat(tx.purchase_amount || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Member Cashback</p>
                            <p className="text-base font-black text-[#1a558b]">R{parseFloat(tx.member_amount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {/* Date & Time */}
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {tx.transaction_time || new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => handleViewDetails(tx)}
                          className="w-full px-3 py-2 bg-[#1a558b] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          View Full Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Load More Button */}
            {!loading && hasMore && filteredTransactions.length === transactions.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreTransactions}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-[#1a558b] text-white rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">expand_more</span>
                      Load More Transactions
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Showing {transactions.length} of {totalCount} total transactions
                </p>
              </div>
            )}
            
            {!loading && !hasMore && transactions.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 font-medium">
                  All transactions loaded ({transactions.length} total)
                </p>
              </div>
            )}
          </div>
          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">© 2026 +1 Rewards Platform Management • Secured Admin Access</p>
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
                  className="size-8 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors" style={{ borderRadius: '9px' }}
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
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase ${
                        selectedTransaction.status === 'completed' ? 'bg-[#1a558b]/20 text-[#1a558b]' : 
                        selectedTransaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-red-500/20 text-red-600'
                      }`} style={{ borderRadius: '9px' }}>
                        <span className={`size-1.5 ${
                          selectedTransaction.status === 'completed' ? 'bg-[#1a558b]' : 
                          selectedTransaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ borderRadius: '50%' }}></span>
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
                          {selectedTransaction.members?.cell_phone || 'N/A'}
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

                  {/* Cover Plan Impact Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                      <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">Cover Plan Funding</h3>
                        <p className="text-xs text-blue-800">
                          The member cashback of <span className="font-bold">R{parseFloat(selectedTransaction.member_amount || 0).toFixed(2)}</span> was automatically allocated to this member's cover plan based on their funding priority (creation order).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Transaction Timeline
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Transaction Date & Time</p>
                        <p className="text-sm text-gray-900 font-semibold">{new Date(selectedTransaction.created_at).toLocaleString('en-ZA', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}</p>
                      </div>
                      {selectedTransaction.transaction_time && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Partner Recorded Time</p>
                          <p className="text-sm text-gray-900">{selectedTransaction.transaction_time}</p>
                        </div>
                      )}
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
