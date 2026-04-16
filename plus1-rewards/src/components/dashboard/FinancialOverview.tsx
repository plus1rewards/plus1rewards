// plus1-rewards/src/components/dashboard/FinancialOverview.tsx
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';

interface FinancialData {
  totalPolicyValue: number;
  totalFunded: number;
  revenueThisMonth: number;
  allTimeRevenue: number;
  totalRewardsIssued: number;
  agentCommissions: number;
}

export default function FinancialOverview() {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalPolicyValue: 0,
    totalFunded: 0,
    revenueThisMonth: 0,
    allTimeRevenue: 0,
    totalRewardsIssued: 0,
    agentCommissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch member cover plans for policy values
      const { data: coverPlansData } = await supabaseAdmin
        .from('member_cover_plans')
        .select('target_amount, funded_amount, status');
      
      // Total Policy Value = sum of all target amounts (monthly premiums)
      const totalPolicyValue = coverPlansData?.reduce((sum, plan) => 
        sum + (parseFloat(plan.target_amount) || 0), 0) || 0;
      
      // Total Funded = sum of all funded amounts
      const totalFunded = coverPlansData?.reduce((sum, plan) => 
        sum + (parseFloat(plan.funded_amount) || 0), 0) || 0;

      // Fetch transaction data for revenue calculations
      const { data: transactionData } = await supabaseAdmin
        .from('transactions')
        .select('system_amount, agent_amount, member_amount, created_at, status')
        .eq('status', 'completed');

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Revenue This Month = system_amount from this month's transactions
      const revenueThisMonth = transactionData?.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      }).reduce((sum, t) => sum + (parseFloat(t.system_amount) || 0), 0) || 0;

      // All-Time Revenue = total system_amount from all transactions
      const allTimeRevenue = transactionData?.reduce((sum, t) => 
        sum + (parseFloat(t.system_amount) || 0), 0) || 0;
      
      // Total Rewards Issued = total member_amount from all transactions
      const totalRewardsIssued = transactionData?.reduce((sum, t) => 
        sum + (parseFloat(t.member_amount) || 0), 0) || 0;

      // Fetch agent commissions
      const { data: commissionsData } = await supabaseAdmin
        .from('agent_commissions')
        .select('total_amount');
      
      // Agent Commissions = sum of all commission amounts
      const agentCommissions = commissionsData?.reduce((sum, c) => 
        sum + (parseFloat(c.total_amount) || 0), 0) || 0;

      setFinancialData({
        totalPolicyValue,
        totalFunded,
        revenueThisMonth,
        allTimeRevenue,
        totalRewardsIssued,
        agentCommissions,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <span className="material-symbols-outlined text-[#1a558b] text-lg md:text-xl">monetization_on</span>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">Financial Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl animate-pulse border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-2 md:h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-5 md:h-6 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
                <div className="w-8 md:w-10 h-8 md:h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <span className="material-symbols-outlined text-[#1a558b] text-lg md:text-xl">monetization_on</span>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">Financial Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Total Policy Value</p>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatCurrency(financialData.totalPolicyValue)}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">Monthly premiums</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">payments</span>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Total Funded</p>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatCurrency(financialData.totalFunded)}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">Via rewards pool</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">wallet</span>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Revenue This Month</p>
            <p className={`text-xl md:text-2xl font-black mt-1 ${financialData.revenueThisMonth > 0 ? 'text-[#1a558b]' : 'text-gray-900'}`}>{formatCurrency(financialData.revenueThisMonth)}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">Platform fees collected</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">analytics</span>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">All-Time Revenue</p>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatCurrency(financialData.allTimeRevenue)}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">Total platform fees</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">history_edu</span>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Total Rewards Issued</p>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatCurrency(financialData.totalRewardsIssued)}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">Allocated to members</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">stars</span>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Agent Commissions</p>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatCurrency(financialData.agentCommissions)}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">Total paid out</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">account_balance_wallet</span>
          </div>
        </div>
      </div>
    </section>
  );
}
