// src/components/dashboard/pages/MembersPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

// Helper function to get full name from first_name and last_name
const getFullName = (member: any): string => {
  const firstName = member.first_name || '';
  const lastName = member.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'No name';
};

// Pricing calculation functions (same logic as MemberCoverPlans.tsx)
const getPlanPricing = (planName: string) => {
  const lowerPlanName = planName.toLowerCase();
  
  // Comprehensive plans
  if (lowerPlanName.includes('comprehensive')) {
    if (lowerPlanName.includes('value plus')) {
      return { single: 665, couple: 1151, childCost: 266 };
    } else if (lowerPlanName.includes('platinum')) {
      return { single: 896, couple: 1611, childCost: 358 };
    } else if (lowerPlanName.includes('executive')) {
      return { single: 985, couple: 1724, childCost: 394 };
    }
  }
  
  // Hospital plans
  if (lowerPlanName.includes('hospital')) {
    return { single: 390, couple: 624, childCost: 156 };
  }
  
  // Day to Day plans
  if (lowerPlanName.includes('day')) {
    return { single: 385, couple: 578, childCost: 193 };
  }
  
  // Default fallback
  return { single: 0, couple: 0, childCost: 0 };
};

const calculateDependantCost = (planName: string, dependantType: string): number => {
  const pricing = getPlanPricing(planName);
  
  if (dependantType === 'child') {
    return pricing.childCost;
  } else {
    // Adult dependant (spouse/partner/other) = couple price - single price
    return pricing.couple - pricing.single;
  }
};

export default function MembersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    verified: 0,
    qrCodes: 0,
    totalRewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '', // 'complete' or 'incomplete'
    hasPolicy: '', // 'yes' or 'no'
    hasQR: '' // 'yes' or 'no'
  });
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [memberDependants, setMemberDependants] = useState<Record<string, any[]>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const fetchData = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPage(0);
      setMembers([]);
    }
    
    try {
      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      console.log(`Fetching members page ${currentPage} (${from}-${to})...`);
      
      // Get total count first (only on initial load)
      if (!loadMore) {
        const { count } = await supabaseAdmin
          .from('members')
          .select('*', { count: 'exact', head: true });
        setTotalCount(count || 0);
        console.log('Total members:', count);
      }
      
      // Fetch members with pagination
      const { data: membersData, error: membersError } = await supabaseAdmin
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (membersError) throw membersError;
      
      console.log('Members fetched:', membersData?.length);
      
      // Check if there are more records
      setHasMore(membersData && membersData.length === PAGE_SIZE);

      // Fetch cover plans separately to avoid ambiguous relationship
      if (membersData && membersData.length > 0) {
        const memberIds = membersData.map(m => m.id);
        const { data: coverPlansData } = await supabaseAdmin
          .from('member_cover_plans')
          .select('member_id, funded_amount, status, id, cover_plan_id')
          .in('member_id', memberIds);

        // Fetch cover plan names
        const coverPlanIdsForNames = [...new Set(coverPlansData?.map(cp => cp.cover_plan_id) || [])];
        const { data: coverPlanNamesData } = await supabaseAdmin
          .from('cover_plans')
          .select('id, plan_name')
          .in('id', coverPlanIdsForNames);
        
        // Create a map of cover_plan_id to plan_name
        const planNamesMap = new Map(coverPlanNamesData?.map(cp => [cp.id, cp.plan_name]) || []);

        // Fetch dependants for all members
        const coverPlanIds = coverPlansData?.map(cp => cp.id) || [];
        const { data: dependantsData } = await supabaseAdmin
          .from('dependants')
          .select('*')
          .in('member_cover_plan_id', coverPlanIds);

        // Group dependants by member_id
        const dependantsByMember: Record<string, any[]> = {};
        if (dependantsData && coverPlansData) {
          dependantsData.forEach(dep => {
            const coverPlan = coverPlansData.find(cp => cp.id === dep.member_cover_plan_id);
            if (coverPlan) {
              if (!dependantsByMember[coverPlan.member_id]) {
                dependantsByMember[coverPlan.member_id] = [];
              }
              // Add plan name to dependant for pricing calculation
              const planName = planNamesMap.get(coverPlan.cover_plan_id) || '';
              dependantsByMember[coverPlan.member_id].push({
                ...dep,
                plan_name: planName
              });
            }
          });
        }
        
        if (loadMore) {
          setMemberDependants(prev => ({ ...prev, ...dependantsByMember }));
        } else {
          setMemberDependants(dependantsByMember);
        }

        // Attach cover plans to members
        const membersWithPlans = membersData.map(member => ({
          ...member,
          member_cover_plans: coverPlansData?.filter(cp => cp.member_id === member.id) || []
        }));

        // Update members list
        if (loadMore) {
          setMembers(prev => [...prev, ...membersWithPlans]);
          setPage(currentPage);
        } else {
          setMembers(membersWithPlans);
          
          // Calculate stats (only on initial load)
          const { count: verifiedCount } = await supabaseAdmin
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
          
          const { count: qrCount } = await supabaseAdmin
            .from('members')
            .select('*', { count: 'exact', head: true })
            .not('qr_code', 'is', null);
          
          const { data: allCoverPlans } = await supabaseAdmin
            .from('member_cover_plans')
            .select('funded_amount');
          
          const totalRewards = allCoverPlans?.reduce((sum, p) => sum + (parseFloat(p.funded_amount) || 0), 0) || 0;
          
          setStats({
            totalMembers: totalCount,
            verified: verifiedCount || 0,
            qrCodes: qrCount || 0,
            totalRewards
          });
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMembers = () => {
    if (!loadingMore && hasMore) {
      fetchData(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Phone', 'Email', 'QR Code', 'Status', 'Joined'].join(','),
      ...members.map(m => [
        m.id,
        getFullName(m),
        m.cell_phone || '',
        m.email || '',
        m.qr_code || '',
        m.status || '',
        new Date(m.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredMembers = members.filter(m => {
    // Advanced Search
    const searchLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/);
    
    const matchesSearch = searchLower === '' || searchTerms.every(term => 
      getFullName(m).toLowerCase().includes(term) ||
      m.cell_phone?.includes(term) ||
      m.phone?.includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.id?.toLowerCase().includes(term) ||
      m.qr_code?.toLowerCase().includes(term)
    );

    // Filters
    const isIncomplete = !m.email || (!m.cell_phone && !m.phone);
    const matchesStatus = filters.status === '' || 
      (filters.status === 'complete' && !isIncomplete) || 
      (filters.status === 'incomplete' && isIncomplete);
    
    const matchesPolicy = filters.hasPolicy === '' || 
      (filters.hasPolicy === 'yes' && m.status === 'active') || 
      (filters.hasPolicy === 'no' && m.status !== 'active');

    const matchesQR = filters.hasQR === '' || 
      (filters.hasQR === 'yes' && m.qr_code) || 
      (filters.hasQR === 'no' && !m.qr_code);

    return matchesSearch && matchesStatus && matchesPolicy && matchesQR;
  });

  const fetchMemberDetails = async (memberId: string) => {
    setDetailsLoading(true);
    try {
      // Get complete member data with all fields including phone
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) {
        console.error('Error fetching member:', memberError);
        throw memberError;
      }

      // Get member cover plans with plan details - using simpler approach
      const { data: coverPlans, error: coverPlansError } = await supabaseAdmin
        .from('member_cover_plans')
        .select('*')
        .eq('member_id', memberId)
        .order('creation_order', { ascending: true });

      console.log('Cover plans query result:', coverPlans);
      console.log('Cover plans error:', coverPlansError);
      console.log('Member ID being queried:', memberId);

      // Get cover plan details separately if we have cover plans
      let coverPlansWithDetails = [];
      if (coverPlans && coverPlans.length > 0) {
        for (const memberPlan of coverPlans) {
          const { data: planDetails } = await supabaseAdmin
            .from('cover_plans')
            .select('plan_name, monthly_target_amount, provider_id')
            .eq('id', memberPlan.cover_plan_id)
            .single();
          
          coverPlansWithDetails.push({
            ...memberPlan,
            cover_plans: planDetails
          });
        }
      }

      // Get wallet entries (cashback history)
      const { data: walletEntries } = await supabaseAdmin
        .from('cover_plan_wallet_entries')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get recent transactions with partner info
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          partners(shop_name, address)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(15);

      // Get top-ups
      const { data: topUps } = await supabaseAdmin
        .from('top_ups')
        .select('*')
        .eq('payer_id', memberId)
        .eq('payer_type', 'member')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get disputes
      const { data: disputes } = await supabaseAdmin
        .from('disputes')
        .select(`
          *,
          partners(shop_name),
          transactions(purchase_amount)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      // Get dependants
      const { data: linkedPeople } = await supabaseAdmin
        .from('dependants')
        .select('*')
        .in('member_cover_plan_id', coverPlans?.map(cp => cp.id) || []);

      // Calculate totals
      const totalFunded = coverPlansWithDetails?.reduce((sum, cp) => sum + (parseFloat(cp.funded_amount) || 0), 0) || 0;
      const totalTarget = coverPlansWithDetails?.reduce((sum, cp) => sum + (parseFloat(cp.target_amount) || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const totalSpent = transactions?.reduce((sum, t) => sum + (parseFloat(t.purchase_amount) || 0), 0) || 0;
      const totalCashback = transactions?.reduce((sum, t) => sum + (parseFloat(t.member_amount) || 0), 0) || 0;

      setMemberDetails({
        member,
        coverPlans: coverPlansWithDetails || [],
        walletEntries: walletEntries || [],
        transactions: transactions || [],
        topUps: topUps || [],
        disputes: disputes || [],
        linkedPeople: linkedPeople || [],
        stats: {
          totalFunded,
          totalTarget,
          totalTransactions,
          totalSpent,
          totalCashback,
          fundingProgress: totalTarget > 0 ? (totalFunded / totalTarget) * 100 : 0
        }
      });
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (member: any) => {
    setSelectedMember(member);
    fetchMemberDetails(member.id);
  };

  const closeDetailsModal = () => {
    setSelectedMember(null);
    setMemberDetails(null);
  };

  const toggleDependants = (memberId: string) => {
    setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
  };

  const statsData = [
    {
      icon: 'group',
      title: 'Total Members',
      value: stats.totalMembers.toString(),
      change: '+0%',
      description: 'Active members on platform'
    },
    {
      icon: 'verified_user',
      title: 'Verified',
      value: stats.verified.toString(),
      change: '+0%',
      description: 'KYC completed accounts'
    },
    {
      icon: 'qr_code',
      title: 'QR Codes Issued',
      value: stats.qrCodes.toString(),
      change: '+0%',
      description: 'Active codes in circulation'
    },
    {
      icon: 'payments',
      title: 'Total Rewards',
      value: `R${stats.totalRewards.toFixed(2)}`,
      change: '+0%',
      description: 'Issued to members'
    }
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Topbar */}
        <header className="flex flex-col gap-4 p-4 md:p-6 lg:p-10 pb-4 md:pb-6">
          <div className="flex-1 max-w-2xl w-full">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search by name, phone, email, or ID..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-xs md:text-sm"
            >
              <span className="material-symbols-outlined text-base md:text-lg">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-xs md:text-sm font-bold"
            >
              <span className="material-symbols-outlined text-base md:text-lg">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-10 pb-6 md:pb-10">
          {/* Page Title */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Members Management</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">Complete member details and profile information</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
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

          {/* Members List Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]" style={{ fontSize: '20px' }}>list_alt</span>
                    All Members ({filteredMembers.length})
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
                  All Members ({filteredMembers.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
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
            </div>

            {/* Advanced Filter Bar */}
            {showFilters && (
              <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-200">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Member Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Members</option>
                    <option value="complete">Complete Profiles</option>
                    <option value="incomplete">Incomplete Profiles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Has Cover Plans</label>
                  <select 
                    value={filters.hasPolicy}
                    onChange={(e) => setFilters({...filters, hasPolicy: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Members</option>
                    <option value="yes">With Cover Plans</option>
                    <option value="no">No Cover Plans</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">QR Code</label>
                  <select 
                    value={filters.hasQR}
                    onChange={(e) => setFilters({...filters, hasQR: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Members</option>
                    <option value="yes">QR Issued</option>
                    <option value="no">No QR Code</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button 
                    onClick={() => setFilters({ status: '', hasPolicy: '', hasQR: '' })}
                    className="text-[10px] font-bold text-[#1a558b] hover:underline uppercase tracking-widest"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">No members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-left">Member</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-left">Phone</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-left">Email</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-center">QR Code</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-right">Funded Amount</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-center">Joined</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => {
                      const fundedAmount = member.member_cover_plans?.reduce((s: number, p: any) => s + (parseFloat(p.funded_amount) || 0), 0) || 0;
                      const dependants = memberDependants[member.id] || [];
                      const isExpanded = expandedMemberId === member.id;
                      
                      return (
                        <>
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-150">
                            {/* Member Info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-[#1a558b] flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">{getFullName(member).charAt(0)}</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{getFullName(member)}</p>
                                    {dependants.length > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800" style={{ borderRadius: '5px' }}>
                                        {dependants.length} dep
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono">{member.id.substring(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                          
                          {/* Phone */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {member.cell_phone || (
                                <span className="text-gray-400 italic">No phone</span>
                              )}
                            </div>
                          </td>
                          
                          {/* Email */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {member.email ? (
                                // Extract only the email part (after @ symbol if phone number is prepended)
                                member.email.includes('@') ? 
                                  member.email.split('@')[0].match(/^\d+$/) ? 
                                    member.email : // If it starts with digits, show full email
                                    member.email.split(' ').find((part: string) => part.includes('@')) || member.email
                                  : member.email
                              ) : (
                                <span className="text-gray-400 italic">No email</span>
                              )}
                            </div>
                          </td>
                          
                          {/* QR Code */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {member.qr_code ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800" style={{ borderRadius: '5px' }}>
                                  ✓ Issued
                                </span>
                                <span className="text-xs text-gray-500 font-mono">{member.qr_code.substring(0, 12)}...</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800" style={{ borderRadius: '5px' }}>
                                ✗ Not Issued
                              </span>
                            )}
                          </td>
                          
                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${
                              member.status === 'active' 
                                ? 'bg-[#1a558b] text-white'
                                : member.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`} style={{ borderRadius: '9px' }}>
                              {member.status?.toUpperCase()}
                            </span>
                          </td>
                          
                          {/* Funded Amount */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-bold text-[#1a558b]">
                              R{fundedAmount.toFixed(2)}
                            </div>
                          </td>
                          
                          {/* Joined Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900">
                              {new Date(member.created_at).toLocaleDateString('en-ZA', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Expand button for dependants - moved here */}
                              {dependants.length > 0 && (
                                <button
                                  onClick={() => toggleDependants(member.id)}
                                  className="p-2 text-gray-400 hover:text-[#1a558b] rounded-lg transition-colors duration-150"
                                  title={`View ${dependants.length} dependant${dependants.length > 1 ? 's' : ''}`}
                                >
                                  <span className="material-symbols-outlined text-xl">
                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDetails(member)}
                                className="p-2 text-[#1a558b] hover:bg-[#1a558b]/10 rounded-lg transition-colors duration-150"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-xl">visibility</span>
                              </button>
                              {member.status === 'suspended' ? (
                                <button
                                  onClick={() => {
                                    // Reactivate member
                                    if (confirm(`Reactivate ${getFullName(member)}?`)) {
                                      supabaseAdmin
                                        .from('members')
                                        .update({ status: 'active' })
                                        .eq('id', member.id)
                                        .then(() => fetchData());
                                    }
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                                  title="Reactivate Member"
                                >
                                  <span className="material-symbols-outlined text-xl">check_circle</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    // Open suspend modal
                                    const reason = prompt(`Enter reason for suspending ${getFullName(member)}:`);
                                    if (reason && reason.trim()) {
                                      supabaseAdmin
                                        .from('members')
                                        .update({ status: 'suspended' })
                                        .eq('id', member.id)
                                        .then(async () => {
                                          // Suspend all cover plans
                                          await supabaseAdmin
                                            .from('member_cover_plans')
                                            .update({ 
                                              status: 'suspended',
                                              suspended_at: new Date().toISOString()
                                            })
                                            .eq('member_id', member.id);
                                          
                                          // Create audit log
                                          await supabaseAdmin.from('admin_notifications').insert({
                                            type: 'member_suspended',
                                            member_id: member.id,
                                            member_name: getFullName(member),
                                            member_phone: member.cell_phone,
                                            message: `Member ${getFullName(member)} (${member.cell_phone}) has been SUSPENDED by admin. Reason: ${reason}`,
                                            priority: 'high',
                                            metadata: {
                                              suspension_reason: reason,
                                              suspended_at: new Date().toISOString(),
                                              action: 'member_suspended'
                                            }
                                          });
                                          
                                          fetchData();
                                          alert(`Member ${getFullName(member)} has been suspended successfully.`);
                                        });
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                  title="Suspend Member"
                                >
                                  <span className="material-symbols-outlined text-xl">block</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable Dependants Row */}
                        {isExpanded && dependants.length > 0 && (
                          <tr key={`${member.id}-dependants`} className="bg-blue-50">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="material-symbols-outlined text-[#1a558b] text-lg">group</span>
                                  <h4 className="text-sm font-bold text-gray-900">Dependants ({dependants.length})</h4>
                                </div>
                                {dependants.map((dep: any) => (
                                  <div key={dep.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Full Name</p>
                                        <p className="text-sm text-gray-900 font-semibold">{dep.first_name} {dep.last_name}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Type</p>
                                        <p className="text-sm text-gray-900 font-semibold capitalize">{dep.dependant_type || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">SA ID</p>
                                        <p className="text-sm text-gray-900 font-semibold font-mono">{dep.sa_id || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Date of Birth</p>
                                        <p className="text-sm text-gray-900 font-semibold">{dep.date_of_birth ? new Date(dep.date_of_birth).toLocaleDateString('en-ZA') : 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Gender</p>
                                        <p className="text-sm text-gray-900 font-semibold capitalize">{dep.gender || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Relationship</p>
                                        <p className="text-sm text-gray-900 font-semibold capitalize">{dep.relationship || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Email</p>
                                        <p className="text-sm text-gray-900 font-semibold break-all">{dep.email || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Phone</p>
                                        <p className="text-sm text-gray-900 font-semibold">{dep.cell_phone || 'Not provided'}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredMembers.map((member) => {
                    const fundedAmount = member.member_cover_plans?.reduce((s: number, p: any) => s + (parseFloat(p.funded_amount) || 0), 0) || 0;
                    const dependants = memberDependants[member.id] || [];
                    const isExpanded = expandedMemberId === member.id;
                    
                    // Calculate dependant prices using plan name and dependant type
                    const dependantsWithPrices = dependants.map((dep: any) => {
                      const price = dep.plan_name && dep.dependant_type 
                        ? calculateDependantCost(dep.plan_name, dep.dependant_type)
                        : 0;
                      return {
                        ...dep,
                        price
                      };
                    });
                    
                    return (
                      <div key={member.id} className="p-4 bg-white">
                        {/* Member Header */}
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="size-10 rounded-full bg-gradient-to-br from-[#1a558b] to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                              {getFullName(member).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 truncate">{getFullName(member)}</p>
                              <p className="text-xs text-gray-600">{member.cell_phone}</p>
                            </div>
                          </div>
                          {dependantsWithPrices.length > 0 && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 flex-shrink-0" style={{ borderRadius: '5px' }}>
                              {dependantsWithPrices.length} dep
                            </span>
                          )}
                        </div>
                        
                        {/* Email */}
                        <div className="mb-3">
                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Email</p>
                          <p className="text-xs text-gray-900 truncate">{member.email || 'Not provided'}</p>
                        </div>
                        
                        {/* QR Code & Status Row */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">QR Code</p>
                            {member.qr_code ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-green-100 text-green-700" style={{ borderRadius: '5px' }}>
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Issued
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-600" style={{ borderRadius: '5px' }}>
                                <span className="material-symbols-outlined text-xs">cancel</span>
                                Not Issued
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Status</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold ${
                              member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`} style={{ borderRadius: '5px' }}>
                              {member.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Funded Amount */}
                        <div className="mb-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Total Funded</p>
                          <p className="text-lg font-black text-[#1a558b]">R{fundedAmount.toFixed(2)}</p>
                        </div>
                        
                        {/* Joined Date */}
                        <div className="mb-3">
                          <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Joined</p>
                          <p className="text-xs text-gray-600">{new Date(member.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {/* Dependants Dropdown */}
                        {dependantsWithPrices.length > 0 && (
                          <div className="mb-3">
                            <button
                              onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold text-blue-900"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">group</span>
                                View {dependantsWithPrices.length} Dependant{dependantsWithPrices.length !== 1 ? 's' : ''}
                              </span>
                              <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                expand_more
                              </span>
                            </button>
                            
                            {isExpanded && (
                              <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-200">
                                {dependantsWithPrices.map((dep: any) => (
                                  <div key={dep.id} className="bg-white border border-gray-200 rounded-lg p-2">
                                    <p className="text-xs font-semibold text-gray-900">{dep.first_name} {dep.last_name}</p>
                                    <p className="text-[10px] text-gray-600">Price: R{parseFloat(dep.price || 0).toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-600">Dependant Type: {dep.dependant_type || 'Not specified'}</p>
                                    <p className="text-[10px] text-gray-600">ID: {dep.id ? dep.id.substring(0, 12) + '...' : 'N/A'}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleViewDetails(member)}
                            className="px-3 py-2 bg-[#1a558b] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            View
                          </button>
                          {member.status === 'suspended' ? (
                            <button
                              onClick={() => {
                                if (confirm(`Reactivate ${getFullName(member)}?`)) {
                                  supabaseAdmin
                                    .from('members')
                                    .update({ status: 'active' })
                                    .eq('id', member.id)
                                    .then(() => fetchData());
                                }
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const reason = prompt(`Enter reason for suspending ${getFullName(member)}:`);
                                if (reason && reason.trim()) {
                                  supabaseAdmin
                                    .from('members')
                                    .update({ status: 'suspended' })
                                    .eq('id', member.id)
                                    .then(async () => {
                                      await supabaseAdmin
                                        .from('member_cover_plans')
                                        .update({ 
                                          status: 'suspended',
                                          suspended_at: new Date().toISOString()
                                        })
                                        .eq('member_id', member.id);
                                      
                                      await supabaseAdmin.from('admin_notifications').insert({
                                        type: 'member_suspended',
                                        member_id: member.id,
                                        member_name: getFullName(member),
                                        member_phone: member.cell_phone,
                                        message: `Member ${getFullName(member)} (${member.cell_phone}) has been SUSPENDED by admin. Reason: ${reason}`,
                                        priority: 'high',
                                        metadata: {
                                          suspension_reason: reason,
                                          suspended_at: new Date().toISOString(),
                                          action: 'member_suspended'
                                        }
                                      });
                                      
                                      fetchData();
                                    });
                                }
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">block</span>
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Load More Button */}
            {!loading && hasMore && filteredMembers.length === members.length && (
              <div className="mt-6 text-center px-4 md:px-6">
                <button
                  onClick={loadMoreMembers}
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
                      Load More Members
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Showing {members.length} of {totalCount} total members
                </p>
              </div>
            )}
            
            {!loading && !hasMore && members.length > 0 && (
              <div className="mt-6 text-center px-4 md:px-6">
                <p className="text-sm text-gray-600 font-medium">
                  All members loaded ({members.length} total)
                </p>
              </div>
            )}
            
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest text-center">
                Showing {filteredMembers.length} of {members.length} loaded members
              </p>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2026 +1 Rewards Platform Management • Secured Admin Access
            </p>
          </div>
        </div>

        {/* Member Details Modal */}
        {selectedMember && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-3 md:p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={closeDetailsModal}
          >
            <div 
              className="rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              style={{ backgroundColor: '#ffffff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                  <div className="size-12 md:size-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-[#1a558b] font-bold text-lg md:text-2xl">{getFullName(selectedMember).charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 truncate">{getFullName(selectedMember)}</h2>
                    <p className="text-xs md:text-sm text-gray-600 truncate">Member ID: {selectedMember.id}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-600 hover:text-gray-900 text-xl md:text-2xl flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto flex-1">
                {detailsLoading ? (
                  <div className="px-4 md:px-6 py-12 text-center bg-gray-50">
                    <p className="text-gray-600">Loading member details...</p>
                  </div>
                ) : memberDetails ? (
                  <div className="px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 bg-gray-50">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Funded</p>
                        <p className="text-xl md:text-2xl font-black text-[#1a558b]">R{memberDetails.stats.totalFunded.toFixed(2)}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Target</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900">R{memberDetails.stats.totalTarget.toFixed(2)}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Transactions</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900">{memberDetails.stats.totalTransactions}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Cashback</p>
                        <p className="text-xl md:text-2xl font-black text-green-600">R{memberDetails.stats.totalCashback.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1a558b]">person</span>
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Full Name</p>
                          <p className="text-sm text-gray-900 font-semibold truncate">{getFullName(memberDetails.member)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">First Name</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.first_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Last Name</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.last_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">SA ID Number</p>
                          <p className="text-sm text-gray-900 font-semibold font-mono">{memberDetails.member.sa_id || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Phone</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.cell_phone || memberDetails.member.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Email</p>
                          <p className="text-sm text-gray-900 font-semibold break-all">{memberDetails.member.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Address Line 1</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.address_line_1 || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Address Line 2</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.address_line_2 || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">City</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.city || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Province</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.province || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Postal Code</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.postal_code || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Country</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.country || 'South Africa'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">QR Code</p>
                          <p className="text-sm text-gray-900 font-semibold font-mono truncate">{memberDetails.member.qr_code || 'Not issued'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Cover Plan Price</p>
                          <p className="text-sm text-gray-900 font-semibold">R{memberDetails.member.cover_plan_price || '0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Status</p>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                            memberDetails.member.status === 'active' ? 'bg-[#1a558b]/20 text-[#1a558b]' : 
                            memberDetails.member.status === 'suspended' ? 'bg-red-500/20 text-red-600' :
                            'bg-yellow-500/20 text-yellow-600'
                          }`} style={{ borderRadius: '5px' }}>
                            {memberDetails.member.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Joined</p>
                          <p className="text-sm text-gray-900 font-semibold">{new Date(memberDetails.member.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Last Updated</p>
                          <p className="text-sm text-gray-900 font-semibold">{memberDetails.member.updated_at ? new Date(memberDetails.member.updated_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Member ID</p>
                          <p className="text-xs text-gray-900 font-semibold font-mono break-all">{memberDetails.member.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Policy Status Alert - Show if any plan is suspended */}
                    {memberDetails.coverPlans.some((p: any) => p.status === 'suspended') && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 md:p-6">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-600 text-3xl flex-shrink-0 mt-1">error</span>
                          <div className="flex-1">
                            <p className="text-red-900 font-black text-base md:text-lg">⚠️ POLICY SUSPENDED</p>
                            <p className="text-red-800 text-sm md:text-base mt-1 font-semibold">
                              This member's cover plan is currently suspended. Partners cannot send money to this member until the policy is reactivated.
                            </p>
                            <div className="mt-3 space-y-1">
                              {memberDetails.coverPlans.filter((p: any) => p.status === 'suspended').map((plan: any) => (
                                <p key={plan.id} className="text-red-700 text-xs md:text-sm">
                                  • {plan.cover_plans?.plan_name || 'Cover Plan'} - Suspended {plan.suspended_at ? `on ${new Date(plan.suspended_at).toLocaleDateString()}` : ''}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cover Plans */}
                    {memberDetails.coverPlans.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">health_and_safety</span>
                          Cover Plans ({memberDetails.coverPlans.length})
                        </h3>
                        <div className="space-y-3 md:space-y-4">
                          {memberDetails.coverPlans.map((plan: any) => (
                            <div key={plan.id} className={`border rounded-lg p-3 md:p-4 ${
                              plan.status === 'suspended' 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                                <div>
                                  <p className="font-bold text-gray-900 text-sm md:text-base">{plan.cover_plans?.plan_name || 'Cover Plan'}</p>
                                  <p className="text-xs text-gray-600">Priority: {plan.creation_order}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold self-start ${
                                  plan.status === 'active' ? 'bg-green-500/20 text-green-600' :
                                  plan.status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                  plan.status === 'suspended' ? 'bg-red-500/20 text-red-600 font-black' :
                                  'bg-gray-500/20 text-gray-600'
                                }`} style={{ borderRadius: '5px' }}>
                                  {plan.status === 'suspended' ? '🚫 ' + plan.status.toUpperCase() : plan.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-600">Target</p>
                                  <p className="text-sm font-bold text-gray-900">R{parseFloat(plan.target_amount || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Funded</p>
                                  <p className="text-sm font-bold text-[#1a558b]">R{parseFloat(plan.funded_amount || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Overflow</p>
                                  <p className="text-sm font-bold text-green-600">R{parseFloat(plan.overflow_balance || 0).toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-600">Progress</p>
                                  <p className="text-sm font-bold text-gray-900">
                                    {((parseFloat(plan.funded_amount || 0) / parseFloat(plan.target_amount || 1)) * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Total Earned</p>
                                  <p className="text-sm font-bold text-teal-600">R{(parseFloat(plan.funded_amount || 0) + parseFloat(plan.overflow_balance || 0)).toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    plan.status === 'suspended' ? 'bg-red-500' : 'bg-[#1a558b]'
                                  }`}
                                  style={{ width: `${Math.min(100, (parseFloat(plan.funded_amount || 0) / parseFloat(plan.target_amount || 1)) * 100)}%` }}
                                ></div>
                              </div>
                              {plan.suspended_at && (
                                <p className="text-xs text-red-600 font-semibold mt-2">Suspended: {new Date(plan.suspended_at).toLocaleDateString()}</p>
                              )}
                              {plan.active_from && !plan.suspended_at && (
                                <p className="text-xs text-gray-600 mt-2">Active from: {new Date(plan.active_from).toLocaleDateString()}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-yellow-600 text-2xl flex-shrink-0">info</span>
                          <div>
                            <p className="text-yellow-900 font-bold text-sm md:text-base">No cover plans found for this member</p>
                            <p className="text-yellow-800 text-xs md:text-sm mt-1">This member has not enrolled in any cover plans yet.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1a558b]">receipt_long</span>
                        Recent Transactions ({memberDetails.transactions.length})
                      </h3>
                      {memberDetails.transactions.length > 0 ? (
                        <div className="space-y-3">
                          {memberDetails.transactions.slice(0, 10).map((tx: any) => (
                            <div key={tx.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{tx.partners?.shop_name || 'Unknown Partner'}</p>
                                  <p className="text-xs text-gray-600">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold ${
                                  tx.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                  tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                                  'bg-red-500/20 text-red-600'
                                }`} style={{ borderRadius: '5px' }}>
                                  {tx.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-600">Purchase</p>
                                  <p className="font-bold text-gray-900">R{parseFloat(tx.purchase_amount || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Cashback</p>
                                  <p className="font-bold text-[#1a558b]">R{parseFloat(tx.member_amount || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Rate</p>
                                  <p className="font-bold text-gray-900">{parseFloat(tx.cashback_percent || 0).toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-center py-4">No transactions found</p>
                      )}
                    </div>

                    {/* Top-Ups */}
                    {memberDetails.topUps.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">account_balance_wallet</span>
                          Top-Ups ({memberDetails.topUps.length})
                        </h3>
                        <div className="space-y-3">
                          {memberDetails.topUps.map((topUp: any) => (
                            <div key={topUp.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">R{parseFloat(topUp.amount || 0).toFixed(2)}</p>
                                  <p className="text-xs text-gray-600">{new Date(topUp.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs text-gray-600">{topUp.payment_method || 'N/A'}</span>
                              </div>
                              {topUp.reference_note && (
                                <p className="text-xs text-gray-600 mt-2">{topUp.reference_note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disputes */}
                    {memberDetails.disputes.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-600">report_problem</span>
                          Disputes ({memberDetails.disputes.length})
                        </h3>
                        <div className="space-y-3">
                          {memberDetails.disputes.map((dispute: any) => (
                            <div key={dispute.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{dispute.dispute_type}</p>
                                  <p className="text-xs text-gray-600">{new Date(dispute.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  dispute.status === 'resolved' ? 'bg-green-500/20 text-green-600' :
                                  dispute.status === 'rejected' ? 'bg-red-500/20 text-red-600' :
                                  'bg-yellow-500/20 text-yellow-600'
                                }`}>
                                  {dispute.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{dispute.description}</p>
                              {dispute.resolution_note && (
                                <p className="text-xs text-gray-600 mt-2 italic">Resolution: {dispute.resolution_note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* dependants */}
                    {memberDetails.linkedPeople.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">group</span>
                          Dependants ({memberDetails.linkedPeople.length})
                        </h3>
                        <div className="space-y-4">
                          {memberDetails.linkedPeople.map((person: any) => (
                            <div key={person.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Dependant ID</p>
                                  <p className="text-xs text-gray-900 font-semibold font-mono break-all">{person.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Full Name</p>
                                  <p className="text-sm text-gray-900 font-semibold">{person.first_name} {person.last_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Dependant Type</p>
                                  <p className="text-sm text-gray-900 font-semibold capitalize">{person.dependant_type || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">SA ID Number</p>
                                  <p className="text-sm text-gray-900 font-semibold font-mono">{person.sa_id || 'Not provided'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Date of Birth</p>
                                  <p className="text-sm text-gray-900 font-semibold">{person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString('en-ZA') : 'Not provided'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Gender</p>
                                  <p className="text-sm text-gray-900 font-semibold capitalize">{person.gender || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Relationship</p>
                                  <p className="text-sm text-gray-900 font-semibold capitalize">{person.relationship || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Email</p>
                                  <p className="text-sm text-gray-900 font-semibold break-all">{person.email || 'Not provided'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Phone</p>
                                  <p className="text-sm text-gray-900 font-semibold">{person.cell_phone || 'Not provided'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Added On</p>
                                  <p className="text-sm text-gray-900 font-semibold">{person.created_at ? new Date(person.created_at).toLocaleDateString('en-ZA') : 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center bg-gray-50">
                    <p className="text-gray-600">No details available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
