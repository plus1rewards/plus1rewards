// plus1-rewards/src/components/dashboard/FinancialOverview.tsx
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';
import { formatLargeNumber } from '../../utils/formatNumber';

interface FinancialData {
  // Transaction Breakdown
  totalTransactionVolume: number;
  totalTransactions: number;
  
  // Revenue Breakdown (1% system fee)
  systemRevenueTotal: number;
  systemRevenueThisMonth: number;
  systemRevenuePending: number; // From partners who haven't paid invoices
  
  // Agent Commissions (1% agent fee)
  agentCommissionsTotal: number;
  agentCommissionsThisMonth: number;
  agentCommissionsPending: number; // Unpaid commissions
  agentCommissionsPaid: number;
  
  // Member Cashback
  memberCashbackTotal: number;
  memberCashbackThisMonth: number;
  
  // Partner Obligations
  partnerOwesTotal: number; // Total outstanding invoices
  partnerOwesOverdue: number; // Overdue invoices
  
  // Cover Plans
  totalPolicyValue: number;
  totalFunded: number;
  fundingPercentage: number;
}

export default function FinancialOverview() {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalTransactionVolume: 0,
    totalTransactions: 0,
    systemRevenueTotal: 0,
    systemRevenueThisMonth: 0,
    systemRevenuePending: 0,
    agentCommissionsTotal: 0,
    agentCommissionsThisMonth: 0,
    agentCommissionsPending: 0,
    agentCommissionsPaid: 0,
    memberCashbackTotal: 0,
    memberCashbackThisMonth: 0,
    partnerOwesTotal: 0,
    partnerOwesOverdue: 0,
    totalPolicyValue: 0,
    totalFunded: 0,
    fundingPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch all completed transactions
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('purchase_amount, system_amount, agent_amount, member_amount, created_at, status')
        .eq('status', 'completed');

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Transaction totals
      const totalTransactionVolume = transactions?.reduce((sum, t) => 
        sum + (parseFloat(t.purchase_amount) || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;

      // System revenue (1% fee)
      const systemRevenueTotal = transactions?.reduce((sum, t) => 
        sum + (parseFloat(t.system_amount) || 0), 0) || 0;
      const systemRevenueThisMonth = transactions?.filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, t) => sum + (parseFloat(t.system_amount) || 0), 0) || 0;

      // Agent commissions (1% fee)
      const agentCommissionsTotal = transactions?.reduce((sum, t) => 
        sum + (parseFloat(t.agent_amount) || 0), 0) || 0;
      const agentCommissionsThisMonth = transactions?.filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0) || 0;

      // Member cashback
      const memberCashbackTotal = transactions?.reduce((sum, t) => 
        sum + (parseFloat(t.member_amount) || 0), 0) || 0;
      const memberCashbackThisMonth = transactions?.filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, t) => sum + (parseFloat(t.member_amount) || 0), 0) || 0;

      // Fetch agent commission payout data
      const { data: commissions } = await supabaseAdmin
        .from('agent_commissions')
        .select('amount, payout_status');

      const agentCommissionsPending = commissions?.filter(c => 
        c.payout_status === 'pending'
      ).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) || 0;

      const agentCommissionsPaid = commissions?.filter(c => 
        c.payout_status === 'paid'
      ).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) || 0;

      // Fetch partner invoice data
      const { data: invoices } = await supabaseAdmin
        .from('partner_invoices')
        .select('total_amount, status, due_date');

      const partnerOwesTotal = invoices?.filter(i => 
        i.status !== 'paid'
      ).reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0) || 0;

      const today = new Date();
      const partnerOwesOverdue = invoices?.filter(i => 
        i.status === 'overdue' || (i.status !== 'paid' && new Date(i.due_date) < today)
      ).reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0) || 0;

      // Fetch cover plan data
      const { data: coverPlans } = await supabaseAdmin
        .from('member_cover_plans')
        .select('target_amount, funded_amount');

      const totalPolicyValue = coverPlans?.reduce((sum, p) => 
        sum + (parseFloat(p.target_amount) || 0), 0) || 0;
      const totalFunded = coverPlans?.reduce((sum, p) => 
        sum + (parseFloat(p.funded_amount) || 0), 0) || 0;
      const fundingPercentage = totalPolicyValue > 0 ? (totalFunded / totalPolicyValue) * 100 : 0;

      // Calculate pending system revenue (from unpaid invoices)
      const systemRevenuePending = partnerOwesTotal * 0.01; // 1% of unpaid invoices

      setFinancialData({
        totalTransactionVolume,
        totalTransactions,
        systemRevenueTotal,
        systemRevenueThisMonth,
        systemRevenuePending,
        agentCommissionsTotal,
        agentCommissionsThisMonth,
        agentCommissionsPending,
        agentCommissionsPaid,
        memberCashbackTotal,
        memberCashbackThisMonth,
        partnerOwesTotal,
        partnerOwesOverdue,
        totalPolicyValue,
        totalFunded,
        fundingPercentage,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <span className="material-symbols-outlined text-[#1a558b] text-lg md:text-xl">monetization_on</span>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">Financial Overview</h2>
        </div>
        
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-20 bg-gray-100 rounded"></div>
                ))}
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
      
      <div className="space-y-4 md:space-y-6">
        {/* SYSTEM REVENUE (1% Fee) */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-green-600">account_balance</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">System Revenue (1% Fee)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <p className="text-[10px] font-bold uppercase text-green-700 tracking-widest mb-1">Total Collected</p>
              <p className="text-2xl font-black text-green-900">{formatLargeNumber(financialData.systemRevenueTotal).display}</p>
              <p className="text-[10px] text-green-600 mt-1">{formatCurrency(financialData.systemRevenueTotal)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <p className="text-[10px] font-bold uppercase text-blue-700 tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-black text-blue-900">{formatLargeNumber(financialData.systemRevenueThisMonth).display}</p>
              <p className="text-[10px] text-blue-600 mt-1">{formatCurrency(financialData.systemRevenueThisMonth)}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-[10px] font-bold uppercase text-yellow-700 tracking-widest mb-1">Pending (Unpaid Invoices)</p>
              <p className="text-2xl font-black text-yellow-900">{formatLargeNumber(financialData.systemRevenuePending).display}</p>
              <p className="text-[10px] text-yellow-600 mt-1">{formatCurrency(financialData.systemRevenuePending)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <p className="text-[10px] font-bold uppercase text-purple-700 tracking-widest mb-1">Total Transactions</p>
              <p className="text-2xl font-black text-purple-900">{financialData.totalTransactions}</p>
              <p className="text-[10px] text-purple-600 mt-1">{formatCurrency(financialData.totalTransactionVolume)} volume</p>
            </div>
          </div>
        </div>

        {/* AGENT COMMISSIONS (1% Fee) */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-indigo-600">support_agent</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Agent Commissions (1% Fee)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
              <p className="text-[10px] font-bold uppercase text-indigo-700 tracking-widest mb-1">Total Earned</p>
              <p className="text-2xl font-black text-indigo-900">{formatLargeNumber(financialData.agentCommissionsTotal).display}</p>
              <p className="text-[10px] text-indigo-600 mt-1">{formatCurrency(financialData.agentCommissionsTotal)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <p className="text-[10px] font-bold uppercase text-blue-700 tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-black text-blue-900">{formatLargeNumber(financialData.agentCommissionsThisMonth).display}</p>
              <p className="text-[10px] text-blue-600 mt-1">{formatCurrency(financialData.agentCommissionsThisMonth)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
              <p className="text-[10px] font-bold uppercase text-red-700 tracking-widest mb-1">Pending Payout</p>
              <p className="text-2xl font-black text-red-900">{formatLargeNumber(financialData.agentCommissionsPending).display}</p>
              <p className="text-[10px] text-red-600 mt-1">{formatCurrency(financialData.agentCommissionsPending)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <p className="text-[10px] font-bold uppercase text-green-700 tracking-widest mb-1">Already Paid</p>
              <p className="text-2xl font-black text-green-900">{formatLargeNumber(financialData.agentCommissionsPaid).display}</p>
              <p className="text-[10px] text-green-600 mt-1">{formatCurrency(financialData.agentCommissionsPaid)}</p>
            </div>
          </div>
        </div>

        {/* PARTNER OBLIGATIONS */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-orange-600">storefront</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Partner Obligations</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
              <p className="text-[10px] font-bold uppercase text-orange-700 tracking-widest mb-1">Total Outstanding</p>
              <p className="text-2xl font-black text-orange-900">{formatLargeNumber(financialData.partnerOwesTotal).display}</p>
              <p className="text-[10px] text-orange-600 mt-1">{formatCurrency(financialData.partnerOwesTotal)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
              <p className="text-[10px] font-bold uppercase text-red-700 tracking-widest mb-1">Overdue Invoices</p>
              <p className="text-2xl font-black text-red-900">{formatLargeNumber(financialData.partnerOwesOverdue).display}</p>
              <p className="text-[10px] text-red-600 mt-1">{formatCurrency(financialData.partnerOwesOverdue)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <p className="text-[10px] font-bold uppercase text-blue-700 tracking-widest mb-1">Member Cashback Total</p>
              <p className="text-2xl font-black text-blue-900">{formatLargeNumber(financialData.memberCashbackTotal).display}</p>
              <p className="text-[10px] text-blue-600 mt-1">{formatCurrency(financialData.memberCashbackTotal)}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
              <p className="text-[10px] font-bold uppercase text-cyan-700 tracking-widest mb-1">Cashback This Month</p>
              <p className="text-2xl font-black text-cyan-900">{formatLargeNumber(financialData.memberCashbackThisMonth).display}</p>
              <p className="text-[10px] text-cyan-600 mt-1">{formatCurrency(financialData.memberCashbackThisMonth)}</p>
            </div>
          </div>
        </div>

        {/* COVER PLANS FUNDING */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-purple-600">health_and_safety</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Cover Plans Funding</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <p className="text-[10px] font-bold uppercase text-purple-700 tracking-widest mb-1">Total Policy Value</p>
              <p className="text-2xl font-black text-purple-900">{formatLargeNumber(financialData.totalPolicyValue).display}</p>
              <p className="text-[10px] text-purple-600 mt-1">{formatCurrency(financialData.totalPolicyValue)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <p className="text-[10px] font-bold uppercase text-green-700 tracking-widest mb-1">Total Funded</p>
              <p className="text-2xl font-black text-green-900">{formatLargeNumber(financialData.totalFunded).display}</p>
              <p className="text-[10px] text-green-600 mt-1">{formatCurrency(financialData.totalFunded)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <p className="text-[10px] font-bold uppercase text-blue-700 tracking-widest mb-1">Funding Progress</p>
              <p className="text-2xl font-black text-blue-900">{financialData.fundingPercentage.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(financialData.fundingPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 rounded-xl border border-gray-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-gray-700">info</span>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Financial Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-gray-600 font-medium">System Revenue Collected:</span>
              <span className="font-black text-green-700">{formatCurrency(financialData.systemRevenueTotal)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-gray-600 font-medium">Agent Commissions Owed:</span>
              <span className="font-black text-red-700">{formatCurrency(financialData.agentCommissionsPending > 0 ? financialData.agentCommissionsPending : financialData.agentCommissionsTotal - financialData.agentCommissionsPaid)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-gray-600 font-medium">Partners Cashback Issued:</span>
              <span className="font-black text-orange-700">{formatCurrency(financialData.memberCashbackTotal)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-gray-600 font-medium">Total Transaction Volume:</span>
              <span className="font-black text-blue-700">{formatCurrency(financialData.totalTransactionVolume)}</span>
            </div>
          </div>
          
          {/* Breakdown Explanation */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-600 text-sm">lightbulb</span>
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-bold">Transaction Breakdown:</p>
                <p>• <span className="font-semibold">System (1%):</span> {formatCurrency(financialData.systemRevenueTotal)} collected from {financialData.totalTransactions} transactions</p>
                <p>• <span className="font-semibold">Agents (1%):</span> {formatCurrency(financialData.agentCommissionsTotal)} earned ({formatCurrency(financialData.agentCommissionsPaid)} paid, {formatCurrency(financialData.agentCommissionsTotal - financialData.agentCommissionsPaid)} pending)</p>
                <p>• <span className="font-semibold">Members (varies):</span> {formatCurrency(financialData.memberCashbackTotal)} cashback issued to cover plans</p>
                <p>• <span className="font-semibold">Partners:</span> Must pay back total cashback + fees = {formatCurrency(financialData.memberCashbackTotal + financialData.systemRevenueTotal + financialData.agentCommissionsTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
