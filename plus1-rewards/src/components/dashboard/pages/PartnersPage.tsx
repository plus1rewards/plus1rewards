// plus1-rewards/src/components/dashboard/pages/PartnersPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

// Helper function to get owner name from first_name and last_name or responsible_person
const getOwnerName = (partner: any): string => {
  if (partner.first_name || partner.last_name) {
    const firstName = partner.first_name || '';
    const lastName = partner.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Not provided';
  }
  return partner.responsible_person || 'Not provided';
};

export default function PartnersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPartners: 0,
    verified: 0,
    pending: 0,
    transactions: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [partnerDetails, setPartnerDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    businessType: '',
    location: ''
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    console.log('selectedPartner changed:', selectedPartner);
  }, [selectedPartner]);

  const fetchData = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPage(0);
      setPartners([]);
    }
    
    try {
      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      console.log(`Fetching partners page ${currentPage} (${from}-${to})...`);
      
      // Get total count first (only on initial load)
      if (!loadMore) {
        const { count } = await supabaseAdmin
          .from('partners')
          .select('*', { count: 'exact', head: true });
        setTotalCount(count || 0);
        console.log('Total partners:', count);
      }
      
      // Fetch partners with pagination
      const { data: partnersData, error: shopsError } = await supabaseAdmin
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (shopsError) throw shopsError;
      
      console.log('Partners fetched:', partnersData?.length);
      
      // Check if there are more records
      setHasMore(partnersData && partnersData.length === PAGE_SIZE);

      // Update partners list
      if (loadMore) {
        setPartners(prev => [...prev, ...partnersData || []]);
        setPage(currentPage);
      } else {
        setPartners(partnersData || []);
        
        // Fetch transactions for revenue calculation (only on initial load)
        const { data: transactionsData, error: transError} = await supabaseAdmin
          .from('transactions')
          .select('partner_id, purchase_amount, cashback_percent');

        if (transError) throw transError;

        // Calculate stats
        const { count: verifiedCount } = await supabaseAdmin
          .from('partners')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('approved_at', 'is', null);
        
        const { count: pendingCount } = await supabaseAdmin
          .from('partners')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        const transactions = transactionsData?.length || 0;
        const revenue = transactionsData?.reduce((sum, t) => sum + (parseFloat(t.purchase_amount) || 0), 0) || 0;

        setStats({
          totalPartners: totalCount,
          verified: verifiedCount || 0,
          pending: pendingCount || 0,
          transactions,
          revenue
        });
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePartners = () => {
    if (!loadingMore && hasMore) {
      fetchData(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePartner = async (partnerId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('partners')
        .update({ 
          status: 'active', 
          approved_at: new Date().toISOString(),
          approved_by: null
        })
        .eq('id', partnerId);

      if (error) throw error;
      
      alert('Partner approved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error approving partner:', error);
      alert('Failed to approve partner. Please try again.');
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    if (confirm('Are you sure you want to reject this partner application?')) {
      try {
        const { error } = await supabaseAdmin
          .from('partners')
          .update({ status: 'suspended' })
          .eq('id', partnerId);

        if (error) throw error;
        
        alert('Partner application rejected.');
        fetchData();
      } catch (error) {
        console.error('Error rejecting partner:', error);
        alert('Failed to reject partner. Please try again.');
      }
    }
  };

  const fetchPartnerDetails = async (partnerId: string) => {
    setDetailsLoading(true);
    try {
      const { data: partner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .select(`
          *,
          partner_agent_links(
            agent_id,
            agents(
              first_name,
              last_name,
              cell_phone,
              email
            )
          )
        `)
        .eq('id', partnerId)
        .single();

      if (partnerError) {
        console.error('Error fetching partner:', partnerError);
        setPartnerDetails(null);
        setDetailsLoading(false);
        return;
      }

      if (!partner) {
        console.error('No partner found with ID:', partnerId);
        setPartnerDetails(null);
        setDetailsLoading(false);
        return;
      }

      console.log('Partner data fetched:', partner);

      // Generate public URL for signature if it exists
      let signaturePublicUrl = null;
      if (partner?.signature_url) {
        console.log('Partner signature URL:', partner.signature_url);
        
        // Check if it's already a full URL
        if (partner.signature_url.startsWith('http')) {
          signaturePublicUrl = partner.signature_url;
        } else {
          // It's just a path, generate the public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(partner.signature_url);
          signaturePublicUrl = publicUrl;
        }
        
        console.log('Final signature public URL:', signaturePublicUrl);
      } else {
        console.log('No signature URL found for partner');
      }

      // Get transactions for this partner
      console.log('Fetching transactions for partner ID:', partnerId);
      const { data: transactions, error: transError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Transactions query result:', { transactions, transError });
      console.log('Number of transactions found:', transactions?.length || 0);
      if (transactions && transactions.length > 0) {
        console.log('First transaction:', transactions[0]);
      }

      // Fetch member details for transactions if we have transactions
      let transactionsWithMembers = transactions || [];
      if (transactions && transactions.length > 0) {
        const memberIds = [...new Set(transactions.map(t => t.member_id).filter(Boolean))];
        if (memberIds.length > 0) {
          const { data: membersData } = await supabaseAdmin
            .from('members')
            .select('id, first_name, last_name, cell_phone')
            .in('id', memberIds);
          
          const membersMap = new Map(membersData?.map(m => [m.id, m]) || []);
          transactionsWithMembers = transactions.map(t => ({
            ...t,
            members: membersMap.get(t.member_id) || null
          }));
        }
      }

      const { data: invoices } = await supabaseAdmin
        .from('monthly_invoices')
        .select('*')
        .eq('partner_id', partnerId)
        .order('invoice_month', { ascending: false });

      setPartnerDetails({
        partner: {
          ...partner,
          signature_public_url: signaturePublicUrl
        },
        transactions: transactionsWithMembers,
        invoices: invoices || [],
        assignedAgent: partner?.partner_agent_links?.[0]?.agents || null
      });
    } catch (error) {
      console.error('Error fetching partner details:', error);
      setPartnerDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (partner: any) => {
    console.log('View Details clicked for partner:', partner.name);
    setSelectedPartner(partner);
    fetchPartnerDetails(partner.id);
  };

  const closeDetailsModal = () => {
    setSelectedPartner(null);
    setPartnerDetails(null);
  };

  const filteredPartners = partners.filter(s => {
    // Advanced Search
    const searchLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/);
    
    const matchesSearch = searchLower === '' || searchTerms.every(term => 
      s.shop_name?.toLowerCase().includes(term) ||
      s.cell_phone?.includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.id?.toLowerCase().includes(term) ||
      s.address?.toLowerCase().includes(term) ||
      s.category?.toLowerCase().includes(term) ||
      getOwnerName(s).toLowerCase().includes(term)
    );

    // Filters
    const matchesStatus = filters.status === '' || s.status === filters.status;
    const matchesType = filters.businessType === '' || s.category === filters.businessType;
    const matchesLocation = filters.location === '' || 
      s.address?.toLowerCase().includes(filters.location.toLowerCase());

    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const handleExport = () => {
    const csv = [
      ['ID', 'Shop Name', 'Phone', 'Email', 'Cashback %', 'Status', 'Address', 'Postal Code', 'Category', 'Joined'].join(','),
      ...partners.map(s => [
        s.id,
        s.shop_name,
        s.cell_phone || '',
        s.email || '',
        s.cashback_percent || '',
        s.status,
        s.address || '',
        s.postal_code || '',
        s.category || '',
        new Date(s.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partners-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const statsData = [
    {
      icon: 'storefront',
      title: 'Total partners',
      value: stats.totalPartners.toString(),
      change: '+0%',
      description: 'All partners'
    },
    {
      icon: 'check_circle',
      title: 'Active',
      value: stats.verified.toString(),
      change: '+0%',
      description: 'Approved partners'
    },
    {
      icon: 'pending',
      title: 'Pending Approval',
      value: stats.pending.toString(),
      change: '+0%',
      description: 'Awaiting approval'
    },
    {
      icon: 'payments',
      title: 'Revenue',
      value: `R${stats.revenue.toFixed(2)}`,
      change: '+0%',
      description: 'Total collected'
    }
  ];

  return (
    <>
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
          {/* Topbar - Desktop */}
          <header className="hidden md:flex md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
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
                  placeholder="Search partners, transactions or IDs..."
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

          {/* Topbar - Mobile */}
          <header className="md:hidden p-4 space-y-3">
            {/* Row 1: Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search partners..."
              />
            </div>
            
            {/* Row 2: Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-xs flex-1"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-xs flex-1"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </header>

          <div className="px-6 md:px-10 pb-10">
            {/* Page Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Partners Management</h2>
              <p className="text-gray-600 mt-1">Manage partner shops and their transactions</p>
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

            {/* partners List Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
              {/* Desktop Header */}
              <div className="hidden md:flex px-6 py-5 border-b border-gray-200 items-center justify-between bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                  All partners ({filteredPartners.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleFilter}
                    className={`text-xs flex items-center gap-1 font-medium transition-colors ${showFilters ? 'text-[#1a558b]' : 'text-gray-600 hover:text-[#1a558b]'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                    {showFilters ? 'Hide Filters' : 'Filter'}
                  </button>
                  <button 
                    onClick={handleExport}
                    className="text-xs text-gray-600 hover:text-[#1a558b] flex items-center gap-1 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Mobile Header */}
              <div className="md:hidden px-4 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]" style={{ fontSize: '20px' }}>list_alt</span>
                    All partners ({filteredPartners.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleFilter}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      showFilters 
                        ? 'bg-[#1a558b] text-white' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#1a558b] hover:text-[#1a558b]'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                    <span>{showFilters ? 'Hide' : 'Filter'}</span>
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

              {/* Advanced Filter Bar */}
              {showFilters && (
                <div className="px-6 py-4 border-b border-gray-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-200">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Partner Status</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Business Type</label>
                    <select 
                      value={filters.businessType}
                      onChange={(e) => setFilters({...filters, businessType: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="Retail">Retail</option>
                      <option value="Service">Service</option>
                      <option value="Food & Beverage">Food & Beverage</option>
                      <option value="Pharmacy">Pharmacy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Location Search</label>
                    <input 
                      type="text"
                      placeholder="City, address line 1 or address..."
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button 
                      onClick={() => setFilters({ status: '', businessType: '', location: '' })}
                      className="text-[10px] font-bold text-[#1a558b] hover:underline uppercase tracking-widest"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-600">Loading partners...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-600">No partners found</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Partner</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Contact</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Address</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Postal Code</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Responsible Person</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Cashback %</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Registration</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Approval</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPartners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{partner.shop_name || 'No name'}</div>
                              <div className="text-[10px] font-mono text-gray-600">{partner.id.substring(0, 8)}</div>
                              {partner.category && (
                                <div className="text-[10px] text-gray-600 mt-0.5">{partner.category}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-700">{partner.cell_phone || 'No phone'}</div>
                            <div className="text-[10px] text-gray-600">{partner.email || 'No email'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-700">{partner.address || '-'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-700">{partner.postal_code || '-'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-700">{getOwnerName(partner)}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-[#1a558b]">{partner.cashback_percent || 0}%</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                              partner.status === 'active' 
                                ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30'
                                : partner.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                                : 'bg-red-500/20 text-red-600 border border-red-500/30'
                            }`} style={{ borderRadius: "5px" }}>
                              <span className={`size-1.5 ${
                                partner.status === 'active' ? 'bg-[#1a558b]' : 
                                partner.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} style={{ borderRadius: "50%" }}></span>
                              {partner.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-600">{new Date(partner.created_at).toLocaleDateString()}</div>
                            <div className="text-[10px] text-gray-600">{new Date(partner.created_at).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-4 py-4">
                            {partner.approved_at ? (
                              <>
                                <div className="text-xs text-green-600">{new Date(partner.approved_at).toLocaleDateString()}</div>
                                {partner.approved_by && (
                                  <div className="text-[10px] text-gray-600">By: {partner.approved_by}</div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-600">Not approved</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetails(partner)}
                                className="p-2 text-[#1a558b] hover:bg-[#1a558b]/10 rounded-lg transition-colors duration-150"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-xl">visibility</span>
                              </button>
                              {partner.status === 'suspended' ? (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Reactivate ${partner.shop_name}?`)) {
                                      try {
                                        await supabaseAdmin
                                          .from('partners')
                                          .update({ status: 'active' })
                                          .eq('id', partner.id);
                                        alert('Partner reactivated');
                                        fetchData();
                                      } catch (err: any) {
                                        alert('Error: ' + err.message);
                                      }
                                    }
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                                  title="Reactivate Partner"
                                >
                                  <span className="material-symbols-outlined text-xl">check_circle</span>
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const reason = prompt(`Enter reason for suspending ${partner.shop_name}:`);
                                    if (reason && reason.trim()) {
                                      try {
                                        await supabaseAdmin
                                          .from('partners')
                                          .update({ status: 'suspended' })
                                          .eq('id', partner.id);
                                        
                                        // Create audit log
                                        await supabaseAdmin.from('admin_notifications').insert({
                                          type: 'partner_suspended',
                                          member_id: null,
                                          member_name: partner.shop_name,
                                          member_phone: partner.cell_phone,
                                          message: `Partner ${partner.shop_name} (${partner.cell_phone}) has been SUSPENDED by admin. Reason: ${reason}`,
                                          priority: 'high',
                                          metadata: {
                                            suspension_reason: reason,
                                            suspended_at: new Date().toISOString(),
                                            action: 'partner_suspended',
                                            partner_id: partner.id
                                          }
                                        });
                                        
                                        alert(`Partner ${partner.shop_name} suspended successfully`);
                                        fetchData();
                                      } catch (err: any) {
                                        alert('Error: ' + err.message);
                                      }
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                  title="Suspend Partner"
                                >
                                  <span className="material-symbols-outlined text-xl">block</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredPartners.map((partner) => (
                    <div key={partner.id} className="p-4 bg-white">
                      {/* Partner Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="size-12 rounded-full bg-gradient-to-br from-[#1a558b] to-blue-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                          {(partner.shop_name || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 mb-0.5">{partner.shop_name || 'No name'}</p>
                          <p className="text-[10px] font-mono text-gray-500 mb-1">{partner.id.substring(0, 8)}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {partner.category && (
                              <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {partner.category}
                              </span>
                            )}
                            <span className="text-sm font-bold text-[#1a558b]">{partner.cashback_percent || 0}% cashback</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Compact Info Grid */}
                      <div className="space-y-2 mb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>phone</span>
                          <span className="text-gray-900">{partner.cell_phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>email</span>
                          <span className="text-gray-600 truncate">{partner.email || 'No email'}</span>
                        </div>
                        {partner.address && (
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-gray-400 flex-shrink-0" style={{ fontSize: '16px' }}>location_on</span>
                            <span className="text-gray-600">{partner.address}{partner.postal_code ? `, ${partner.postal_code}` : ''}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>person</span>
                          <span className="text-gray-600">{getOwnerName(partner)}</span>
                        </div>
                      </div>
                      
                      {/* Status & Dates Row */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase ${
                            partner.status === 'active' 
                              ? 'bg-[#1a558b]/20 text-[#1a558b]'
                              : partner.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-700'
                              : 'bg-red-500/20 text-red-700'
                          }`} style={{ borderRadius: "5px" }}>
                            <span className={`size-1.5 ${
                              partner.status === 'active' ? 'bg-[#1a558b]' : 
                              partner.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ borderRadius: "50%" }}></span>
                            {partner.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-500 uppercase font-bold">Registered</p>
                          <p className="text-[10px] text-gray-700">{new Date(partner.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(partner)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm font-bold"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                          View Details
                        </button>
                        {partner.status === 'suspended' ? (
                          <button
                            onClick={async () => {
                              if (confirm(`Reactivate ${partner.shop_name}?`)) {
                                try {
                                  await supabaseAdmin
                                    .from('partners')
                                    .update({ status: 'active' })
                                    .eq('id', partner.id);
                                  alert('Partner reactivated');
                                  fetchData();
                                } catch (err: any) {
                                  alert('Error: ' + err.message);
                                }
                              }
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Reactivate"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              const reason = prompt(`Enter reason for suspending ${partner.shop_name}:`);
                              if (reason && reason.trim()) {
                                try {
                                  await supabaseAdmin
                                    .from('partners')
                                    .update({ status: 'suspended' })
                                    .eq('id', partner.id);
                                  
                                  await supabaseAdmin.from('admin_notifications').insert({
                                    type: 'partner_suspended',
                                    member_id: null,
                                    member_name: partner.shop_name,
                                    member_phone: partner.cell_phone,
                                    message: `Partner ${partner.shop_name} (${partner.cell_phone}) has been SUSPENDED by admin. Reason: ${reason}`,
                                    priority: 'high',
                                    metadata: {
                                      suspension_reason: reason,
                                      suspended_at: new Date().toISOString(),
                                      action: 'partner_suspended',
                                      partner_id: partner.id
                                    }
                                  });
                                  
                                  alert(`Partner ${partner.shop_name} suspended successfully`);
                                  fetchData();
                                } catch (err: any) {
                                  alert('Error: ' + err.message);
                                }
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Suspend"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>block</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
              )}
              
              {/* Load More Button */}
              {!loading && hasMore && filteredPartners.length === partners.length && (
                <div className="mt-6 text-center px-6">
                  <button
                    onClick={loadMorePartners}
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
                        Load More Partners
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing {partners.length} of {totalCount} total partners
                  </p>
                </div>
              )}
              
              {!loading && !hasMore && partners.length > 0 && (
                <div className="mt-6 text-center px-6">
                  <p className="text-sm text-gray-600 font-medium">
                    All partners loaded ({partners.length} total)
                  </p>
                </div>
              )}
              
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest text-center">
                  Showing {filteredPartners.length} of {partners.length} loaded partners
                </p>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="mt-12 text-center">
              <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
                Â© 2026 +1 Rewards Platform Management â€¢ Secured Admin Access
              </p>
            </div>
          </div>
        </main>
      </DashboardLayout>

      {/* Detailed Shop Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="border border-gray-200 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: '#ffffff' }}>
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedPartner.shop_name || 'Partner'}</h2>
                <p className="text-sm text-gray-600 mt-1">Complete Partner Information</p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="size-10 bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors" style={{ borderRadius: "9px" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1">
              {detailsLoading ? (
                <div className="px-8 py-12 text-center bg-gray-50">
                  <p className="text-gray-600">Loading partner details...</p>
                </div>
              ) : partnerDetails ? (
                <div className="px-8 py-6 space-y-8 bg-gray-50">
                {/* Basic Information */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">info</span>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Partner ID</p>
                      <p className="text-sm text-gray-900 font-mono">{partnerDetails.partner.id}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Partner Name</p>
                      <p className="text-sm text-gray-900 font-semibold">{partnerDetails.partner.shop_name || 'Not provided'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Category</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.category || 'Not specified'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase ${
                        partnerDetails.partner.status === 'active' 
                          ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30'
                          : partnerDetails.partner.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-700 border border-red-500/30'
                      }`} style={{ borderRadius: "5px" }}>
                        {partnerDetails.partner.status}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Commission Rate</p>
                      <p className="text-lg text-[#1a558b] font-bold">{partnerDetails.partner.cashback_percent || 0}%</p>
                    </div>
                  </div>
                </section>

                {/* Assigned Agent */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">person_pin</span>
                    Assigned Agent
                  </h3>
                  {partnerDetails.assignedAgent ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Agent Name</p>
                        <p className="text-sm text-gray-900 font-semibold">{getOwnerName(partnerDetails.assignedAgent)}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Mobile Number</p>
                        <p className="text-sm text-gray-900">{partnerDetails.assignedAgent.cell_phone || 'Not provided'}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Email Address</p>
                        <p className="text-sm text-gray-900">{partnerDetails.assignedAgent.email || 'Not provided'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-gray-600">No agent assigned to this partner</p>
                    </div>
                  )}
                </section>

                {/* Contact Information */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">contact_phone</span>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Phone Number</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.cell_phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Email Address</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.email || 'Not provided'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Physical Address</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.address || 'Not provided'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Postal Code</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.postal_code || 'Not provided'}</p>
                    </div>
                  </div>
                </section>

                {/* Owner Information */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">person</span>
                    Owner Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Owner Name</p>
                      <p className="text-sm text-gray-900">{getOwnerName(partnerDetails.partner)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Owner Phone</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.cell_phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Owner Email</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.email || 'Not provided'}</p>
                    </div>
                  </div>
                </section>

                {/* Registration & Approval Details */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">verified</span>
                    Registration & Approval
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Created At</p>
                      <p className="text-sm text-gray-900">{new Date(partnerDetails.partner.created_at).toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Updated At</p>
                      <p className="text-sm text-gray-900">{new Date(partnerDetails.partner.updated_at).toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Approved At</p>
                      <p className="text-sm text-gray-900">{partnerDetails.partner.approved_at ? new Date(partnerDetails.partner.approved_at).toLocaleString() : 'Not approved yet'}</p>
                    </div>
                  </div>
                </section>

                {/* Digital Signature */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">edit_note</span>
                    Digital Signature
                  </h3>
                  {partnerDetails.partner.signature_public_url ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                      <img 
                        src={partnerDetails.partner.signature_public_url}
                        alt="Partner Signature"
                        className="w-full max-w-md h-auto border border-gray-300 rounded-lg"
                        onLoad={() => {
                          console.log('Signature image loaded successfully');
                        }}
                        onError={(e) => {
                          console.error('Failed to load signature image:', partnerDetails.partner.signature_public_url);
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="text-center py-8">
                                <p class="text-red-600 font-semibold mb-2">Signature image could not be loaded</p>
                                <p class="text-xs text-gray-500 mb-2">URL: ${partnerDetails.partner.signature_public_url}</p>
                                <button onclick="window.open('${partnerDetails.partner.signature_public_url}', '_blank')" class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                                  Try Direct Link
                                </button>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-gray-600">No signature on file</p>
                    </div>
                  )}
                </section>

                {/* Suppliers */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">local_shipping</span>
                    Suppliers ({(partnerDetails.partner.suppliers || []).length})
                  </h3>
                  {partnerDetails.partner.suppliers && partnerDetails.partner.suppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {partnerDetails.partner.suppliers.map((supplier: any, idx: number) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-xs text-gray-600 uppercase font-bold mb-3">Supplier {idx + 1}</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Name</p>
                              <p className="text-sm text-gray-900">{supplier.name || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Contact Person</p>
                              <p className="text-sm text-gray-900">{supplier.contact_person || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Phone</p>
                              <p className="text-sm text-gray-900">{supplier.cell_phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Email</p>
                              <p className="text-sm text-gray-900">{supplier.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-gray-600">No suppliers added</p>
                    </div>
                  )}
                </section>



                {/* Recent Transactions */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">receipt_long</span>
                    Recent Transactions ({partnerDetails.transactions.length})
                  </h3>
                  {partnerDetails.transactions.length > 0 ? (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#1a558b]/10">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Member</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Purchase Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Member Cashback</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {partnerDetails.transactions.map((transaction: any) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString()}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.transaction_time || new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900 font-semibold">{transaction.members ? `${transaction.members.first_name || ''} ${transaction.members.last_name || ''}`.trim() : 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{transaction.members?.cell_phone || 'No phone'}</div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-bold">R{parseFloat(transaction.purchase_amount || 0).toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{parseFloat(transaction.member_amount || transaction.cashback_amount || 0).toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.transaction_type || 'Purchase'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-bold ${
                                      transaction.status === 'completed' ? 'bg-green-500/20 text-green-600' : 
                                      transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                                      'bg-red-500/20 text-red-600'
                                    }`} style={{ borderRadius: "5px" }}>
                                      {transaction.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {partnerDetails.transactions.map((transaction: any) => (
                          <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            {/* Date & Time */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                                <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                                <span>{transaction.transaction_time || new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>

                            {/* Member Info */}
                            <div className="mb-2 pb-2 border-b border-gray-100">
                              <p className="text-sm font-bold text-gray-900">{transaction.members ? `${transaction.members.first_name || ''} ${transaction.members.last_name || ''}`.trim() : 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{transaction.members?.cell_phone || 'No phone'}</p>
                            </div>

                            {/* Amounts Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Purchase</p>
                                <p className="text-sm font-bold text-gray-900">R{parseFloat(transaction.purchase_amount || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Cashback</p>
                                <p className="text-sm font-bold text-[#1a558b]">R{parseFloat(transaction.member_amount || transaction.cashback_amount || 0).toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Status & Type */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{transaction.transaction_type || 'Purchase'}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold ${
                                transaction.status === 'completed' ? 'bg-green-500/20 text-green-600' : 
                                transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                                'bg-red-500/20 text-red-600'
                              }`} style={{ borderRadius: "5px" }}>
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No transactions recorded yet</p>
                    </div>
                  )}
                </section>

                {/* Monthly Invoices */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">request_quote</span>
                    Monthly Invoices ({partnerDetails.invoices.length})
                  </h3>
                  {partnerDetails.invoices.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#1a558b]/10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Month</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amount Due</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amount Paid</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {partnerDetails.invoices.map((invoice: any) => (
                              <tr key={invoice.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{invoice.invoice_month}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-bold">R{invoice.amount_due?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{invoice.amount_paid?.toFixed(2) || '0.00'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 text-xs font-bold ${
                                    invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                                    invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`} style={{ borderRadius: "5px" }}>
                                    {invoice.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(invoice.due_date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No invoices generated yet</p>
                    </div>
                  )}
                </section>

                {/* Action Buttons */}
                <section className="flex gap-4 justify-center pt-4 flex-wrap">
                  {partnerDetails.partner.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApprovePartner(partnerDetails.partner.id);
                          closeDetailsModal();
                        }}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        Approve Partner
                      </button>
                      <button
                        onClick={() => {
                          handleRejectPartner(partnerDetails.partner.id);
                          closeDetailsModal();
                        }}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                        Reject Partner
                      </button>
                    </>
                  )}
                  
                  {partnerDetails.partner.status === 'active' && (
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to suspend this partner?')) {
                          try {
                            await supabaseAdmin
                              .from('partners')
                              .update({ status: 'suspended' })
                              .eq('id', partnerDetails.partner.id);
                            alert('Partner suspended successfully');
                            fetchData();
                            closeDetailsModal();
                          } catch (err: any) {
                            alert('Error: ' + err.message);
                          }
                        }
                      }}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">block</span>
                      Suspend Partner
                    </button>
                  )}
                  
                  {partnerDetails.partner.status === 'suspended' && (
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to reactivate this partner?')) {
                          try {
                            await supabaseAdmin
                              .from('partners')
                              .update({ status: 'active' })
                              .eq('id', partnerDetails.partner.id);
                            alert('Partner reactivated successfully');
                            fetchData();
                            closeDetailsModal();
                          } catch (err: any) {
                            alert('Error: ' + err.message);
                          }
                        }
                      }}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      Reactivate Partner
                    </button>
                  )}
                </section>
              </div>
            ) : (
              <div className="px-8 py-12 text-center bg-gray-50">
                <p className="text-gray-600">Failed to load partner details. Please try again.</p>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


