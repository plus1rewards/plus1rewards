// plus1-rewards/src/components/dashboard/FinancialOverview.tsx
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';
import { formatLargeNumber } from '../../utils/formatNumber';

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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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

      // Agent Commissions = total agent_amount from all completed transactions
      const agentCommissions = transactionData?.reduce((sum, t) => 
        sum + (parseFloat(t.agent_amount) || 0), 0) || 0;

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

  const tooltips: Record<string, string> = {
    totalPolicyValue: 'Sum of all monthly premium target amounts across all active member cover plans. This represents the total monthly value of policies on the platform.',
    totalFunded: 'Total amount of cashback earned by members that has been allocated to their cover plans through the rewards pool.',
    revenueThisMonth: 'Platform fees (1% of each transaction) collected during the current calendar month.',
    allTimeRevenue: 'Cumulative platform fees (1% of each transaction) collected since platform launch.',
    totalRewardsIssued: 'Total cashback amount allocated to members from all completed transactions.',
    agentCommissions: 'Total commission amounts (1% of each transaction) paid out to agents for partner recruitment.'
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
        {/* Total Policy Value */}
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Total Policy Value</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveTooltip('totalPolicyValue')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-[#1a558b] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                {activeTooltip === 'totalPolicyValue' && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-700">
                    {tooltips.totalPolicyValue}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatLargeNumber(financialData.totalPolicyValue).display}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">{formatCurrency(financialData.totalPolicyValue)}</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">payments</span>
          </div>
        </div>
        
        {/* Total Funded */}
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Total Funded</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveTooltip('totalFunded')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-[#1a558b] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                {activeTooltip === 'totalFunded' && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-700">
                    {tooltips.totalFunded}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatLargeNumber(financialData.totalFunded).display}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">{formatCurrency(financialData.totalFunded)}</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">wallet</span>
          </div>
        </div>
        
        {/* Revenue This Month */}
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Revenue This Month</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveTooltip('revenueThisMonth')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-[#1a558b] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                {activeTooltip === 'revenueThisMonth' && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-700">
                    {tooltips.revenueThisMonth}
                  </div>
                )}
              </div>
            </div>
            <p className={`text-xl md:text-2xl font-black mt-1 ${financialData.revenueThisMonth > 0 ? 'text-[#1a558b]' : 'text-gray-900'}`}>{formatLargeNumber(financialData.revenueThisMonth).display}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">{formatCurrency(financialData.revenueThisMonth)}</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">analytics</span>
          </div>
        </div>
        
        {/* All-Time Revenue */}
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">All-Time Revenue</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveTooltip('allTimeRevenue')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-[#1a558b] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                {activeTooltip === 'allTimeRevenue' && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-700">
                    {tooltips.allTimeRevenue}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatLargeNumber(financialData.allTimeRevenue).display}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">{formatCurrency(financialData.allTimeRevenue)}</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">history_edu</span>
          </div>
        </div>
        
        {/* Total Rewards Issued */}
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Total Rewards Issued</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveTooltip('totalRewardsIssued')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-[#1a558b] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                {activeTooltip === 'totalRewardsIssued' && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-700">
                    {tooltips.totalRewardsIssued}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatLargeNumber(financialData.totalRewardsIssued).display}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">{formatCurrency(financialData.totalRewardsIssued)}</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">stars</span>
          </div>
        </div>
        
        {/* Agent Commissions */}
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-600 tracking-widest">Agent Commissions</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveTooltip('agentCommissions')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-[#1a558b] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                {activeTooltip === 'agentCommissions' && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-700">
                    {tooltips.agentCommissions}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black mt-1 text-gray-900">{formatLargeNumber(financialData.agentCommissions).display}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase">{formatCurrency(financialData.agentCommissions)}</p>
          </div>
          <div className="size-8 md:size-10 flex items-center justify-center rounded-full bg-[#1a558b]/10 text-[#1a558b] flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">account_balance_wallet</span>
          </div>
        </div>
      </div>
    </section>
  );
}
