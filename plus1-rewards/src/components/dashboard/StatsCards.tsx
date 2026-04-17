// plus1-rewards/src/components/dashboard/StatsCards.tsx
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { supabaseAdmin } from '../../lib/supabase';

interface Stats {
  totalMembers: number;
  membersWithQR: number;
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  totalAgents: number;
  activeAgents: number;
  pendingDay1HealthApprovals: number;
  totalPolicies: number;
  activePolicies: number;
  inProgressPolicies: number;
}

export interface StatsCardsRef {
  refresh: () => void;
}

const StatsCards = forwardRef<StatsCardsRef>((_, ref) => {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    membersWithQR: 0,
    totalShops: 0,
    activeShops: 0,
    suspendedShops: 0,
    totalAgents: 0,
    activeAgents: 0,
    pendingDay1HealthApprovals: 0,
    totalPolicies: 0,
    activePolicies: 0,
    inProgressPolicies: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching stats...');

      // Fetch members stats
      const { data: membersData, error: membersError } = await supabaseAdmin
        .from('members')
        .select('qr_code');
      
      console.log('👥 Members:', membersData?.length, 'Error:', membersError);
      
      const totalMembers = membersData?.length || 0;
      const membersWithQR = membersData?.filter(m => m.qr_code).length || 0;

      // Fetch partners stats (shops)
      const { data: partnersData, error: partnersError } = await supabaseAdmin
        .from('partners')
        .select('status');
      
      console.log('🏪 Partners:', partnersData?.length, 'Error:', partnersError);
      
      const totalShops = partnersData?.length || 0;
      const activeShops = partnersData?.filter(s => s.status === 'active').length || 0;
      const suspendedShops = partnersData?.filter(s => s.status === 'suspended').length || 0;

      // Fetch agents stats
      const { data: agentsData, error: agentsError } = await supabaseAdmin
        .from('agents')
        .select('status');
      
      console.log('🤝 Agents:', agentsData?.length, 'Error:', agentsError);
      
      const totalAgents = agentsData?.length || 0;
      const activeAgents = agentsData?.filter(a => a.status === 'active').length || 0;

      // Fetch member cover plans stats (policies)
      const { data: coverPlansData, error: coverPlansError } = await supabaseAdmin
        .from('member_cover_plans')
        .select('status');
      
      console.log('📋 Cover Plans:', coverPlansData?.length, 'Error:', coverPlansError);
      
      const totalPolicies = coverPlansData?.length || 0;
      const activePolicies = coverPlansData?.filter(p => p.status === 'active').length || 0;
      const inProgressPolicies = coverPlansData?.filter(p => p.status === 'in_progress').length || 0;
      const pendingDay1HealthApprovals = coverPlansData?.filter(p => p.status === 'pending_day1health').length || 0;

      console.log('✅ Stats calculated:', {
        totalMembers,
        totalShops,
        totalAgents,
        activeAgents,
        pendingDay1HealthApprovals,
        totalPolicies,
        activePolicies,
        inProgressPolicies
      });

      setStats({
        totalMembers,
        membersWithQR,
        totalShops,
        activeShops,
        suspendedShops,
        totalAgents,
        activeAgents,
        pendingDay1HealthApprovals,
        totalPolicies,
        activePolicies,
        inProgressPolicies,
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchStats
  }));

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl animate-pulse border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 md:w-10 h-8 md:h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-2 md:h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 md:h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 md:h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
      <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <span className="material-symbols-outlined text-[#1a558b] bg-[#1a558b]/10 p-1.5 md:p-2 rounded-lg text-lg md:text-xl">group</span>
          <span className="text-[9px] md:text-[10px] font-bold py-0.5 px-1.5 md:px-2 rounded bg-[#1a558b]/10 text-[#1a558b] uppercase">Active</span>
        </div>
        <p className="text-gray-600 text-[11px] md:text-xs font-bold uppercase tracking-wider">Total Members</p>
        <h3 className="text-2xl md:text-3xl font-black mt-1 text-gray-900">{stats.totalMembers}</h3>
        <p className="text-[10px] md:text-[11px] text-gray-500 mt-2">{stats.membersWithQR} with QR codes</p>
      </div>
      
      <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <span className="material-symbols-outlined text-[#1a558b] bg-[#1a558b]/10 p-1.5 md:p-2 rounded-lg text-lg md:text-xl">storefront</span>
          {stats.activeShops > 0 && (
            <span className="text-[9px] md:text-[10px] font-bold py-0.5 px-1.5 md:px-2 rounded bg-[#1a558b]/10 text-[#1a558b] uppercase">Active</span>
          )}
        </div>
        <p className="text-gray-600 text-[11px] md:text-xs font-bold uppercase tracking-wider">Total Shops</p>
        <h3 className="text-2xl md:text-3xl font-black mt-1 text-gray-900">{stats.totalShops}</h3>
        <p className="text-[10px] md:text-[11px] text-gray-500 mt-2">{stats.activeShops} active, {stats.suspendedShops} suspended</p>
      </div>
      
      <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <span className={`material-symbols-outlined p-1.5 md:p-2 rounded-lg text-lg md:text-xl ${stats.totalAgents > 0 ? 'text-[#1a558b] bg-[#1a558b]/10' : 'text-gray-400 bg-gray-100'}`}>support_agent</span>
          {stats.activeAgents > 0 && (
            <span className="text-[9px] md:text-[10px] font-bold py-0.5 px-1.5 md:px-2 rounded bg-[#1a558b]/10 text-[#1a558b] uppercase">Active</span>
          )}
        </div>
        <p className="text-gray-600 text-[11px] md:text-xs font-bold uppercase tracking-wider">Total Agents</p>
        <h3 className={`text-2xl md:text-3xl font-black mt-1 ${stats.totalAgents > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{stats.totalAgents}</h3>
        <p className="text-[10px] md:text-[11px] text-gray-500 mt-2">{stats.activeAgents} active agents</p>
      </div>
      
      <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <span className={`material-symbols-outlined p-1.5 md:p-2 rounded-lg text-lg md:text-xl ${stats.pendingDay1HealthApprovals > 0 ? 'text-orange-600 bg-orange-100' : 'text-gray-400 bg-gray-100'}`}>schedule</span>
          {stats.pendingDay1HealthApprovals > 0 && (
            <span className="text-[9px] md:text-[10px] font-bold py-0.5 px-1.5 md:px-2 rounded bg-orange-100 text-orange-600 uppercase">Pending</span>
          )}
        </div>
        <p className="text-gray-600 text-[11px] md:text-xs font-bold uppercase tracking-wider">Pending Day1Health</p>
        <h3 className={`text-2xl md:text-3xl font-black mt-1 ${stats.pendingDay1HealthApprovals > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{stats.pendingDay1HealthApprovals}</h3>
        <p className="text-[10px] md:text-[11px] text-gray-500 mt-2">Awaiting verification</p>
      </div>
      
      <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <span className={`material-symbols-outlined p-1.5 md:p-2 rounded-lg text-lg md:text-xl ${stats.totalPolicies > 0 ? 'text-[#1a558b] bg-[#1a558b]/10' : 'text-gray-400 bg-gray-100'}`}>description</span>
          {stats.activePolicies > 0 && (
            <span className="text-[9px] md:text-[10px] font-bold py-0.5 px-1.5 md:px-2 rounded bg-[#1a558b]/10 text-[#1a558b] uppercase">Active</span>
          )}
        </div>
        <p className="text-gray-600 text-[11px] md:text-xs font-bold uppercase tracking-wider">Total Policies</p>
        <h3 className={`text-2xl md:text-3xl font-black mt-1 ${stats.totalPolicies > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{stats.totalPolicies}</h3>
        <p className="text-[10px] md:text-[11px] text-gray-500 mt-2">{stats.activePolicies} active globally</p>
      </div>
      
      <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <span className={`material-symbols-outlined p-1.5 md:p-2 rounded-lg text-lg md:text-xl ${stats.inProgressPolicies > 0 ? 'text-[#1a558b] bg-[#1a558b]/10' : 'text-gray-400 bg-gray-100'}`}>pending_actions</span>
          {stats.inProgressPolicies > 0 && (
            <span className="text-[9px] md:text-[10px] font-bold py-0.5 px-1.5 md:px-2 rounded bg-[#1a558b]/10 text-[#1a558b] uppercase">In Progress</span>
          )}
        </div>
        <p className="text-gray-600 text-[11px] md:text-xs font-bold uppercase tracking-wider">In Progress</p>
        <h3 className={`text-2xl md:text-3xl font-black mt-1 ${stats.inProgressPolicies > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{stats.inProgressPolicies}</h3>
        <p className="text-[10px] md:text-[11px] text-gray-500 mt-2">Being funded</p>
      </div>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default StatsCards;
