// src/components/partner/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface Partner {
  id: string;
  shop_name: string;
  status: string;
  cashback_percent: number;
  store_logo_url?: string;
}

interface MonthlyStats {
  transactionCount: number;
  cashbackLiability: number;
}

interface LatestInvoice {
  amount: number;
  dueDate: string;
  status: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ transactionCount: 0, cashbackLiability: 0 });
  const [latestInvoice, setLatestInvoice] = useState<LatestInvoice | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<string>('Not assigned');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      
      if (!partnerSessionData) {
        navigate('/partner/login');
        return;
      }

      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id;

      if (!partnerId) {
        navigate('/partner/login');
        return;
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('id, shop_name, status, cashback_percent, store_logo_url')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;
      setPartner(partnerData);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('purchase_amount, cashback_percent')
        .eq('partner_id', partnerId)
        .gte('created_at', firstDayOfMonth);

      if (!txError && transactions) {
        const count = transactions.length;
        const liability = transactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.purchase_amount) || 0;
          const percent = parseFloat(tx.cashback_percent) || 0;
          return sum + (amount * percent / 100);
        }, 0);
        setMonthlyStats({ transactionCount: count, cashbackLiability: liability });
      }

      const { data: invoiceData } = await supabase
        .from('partner_invoices')
        .select('total_amount, due_date, status')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (invoiceData) {
        setLatestInvoice({
          amount: invoiceData.total_amount,
          dueDate: invoiceData.due_date,
          status: invoiceData.status
        });
      }

      // Load assigned agent
      const { data: agentLink } = await supabase
        .from('partner_agent_links')
        .select('agent_id')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .maybeSingle();

      if (agentLink) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id, first_name, last_name, cell_phone')
          .eq('id', agentLink.agent_id)
          .single();

        if (agentData) {
          setAssignedAgent(`${agentData.first_name} ${agentData.last_name}`.trim() || 'Unknown Agent');
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-900 mb-4">No partner found</p>
          <button
            onClick={() => navigate('/partner/login')}
            className="bg-[#1a558b] text-white px-6 py-2 rounded-xl font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a558b] to-[#2563eb] rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="w-24 h-24 flex-shrink-0 bg-white/20 rounded-xl flex items-center justify-center border-2 border-white/30">
              {partner.store_logo_url ? (
                <img
                  src={partner.store_logo_url}
                  alt={partner.shop_name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="material-symbols-outlined text-white text-5xl">storefront</span>
              )}
            </div>
            
            {/* Info */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Partner Dashboard</h1>
              <p className="text-white/90 text-lg mb-3">Welcome back, {partner.shop_name}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  partner.status === 'active' 
                    ? 'bg-green-500/30 text-green-100 border border-green-400/50' 
                    : 'bg-yellow-500/30 text-yellow-100 border border-yellow-400/50'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {partner.status === 'active' ? 'Active' : 'Pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  <span className="material-symbols-outlined text-sm">percent</span>
                  {partner.cashback_percent}% Cashback
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/partner/profile')}
              className="px-6 py-2 bg-white text-[#1a558b] font-bold rounded-lg hover:bg-white/90 transition-all"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">This Month's Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{monthlyStats.transactionCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#1a558b]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Cashback Issued</p>
              <p className="text-3xl font-bold text-gray-900">R{monthlyStats.cashbackLiability.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Assigned Agent</p>
              <p className="text-lg font-bold text-gray-900 truncate">{assignedAgent}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/partner/sales-terminal')}
            className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-[#1a558b] to-[#2563eb] text-white hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-bold">Process Sale</p>
              <p className="text-xs text-white/80">Record transaction</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/partner/transaction-history')}
            className="flex items-center gap-4 p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1a558b]">history</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">View History</p>
              <p className="text-xs text-gray-600">Past transactions</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/partner/statement')}
            className="flex items-center gap-4 p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1a558b]">analytics</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Monthly Statement</p>
              <p className="text-xs text-gray-600">View invoices</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/partner/support')}
            className="flex items-center gap-4 p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1a558b]">support_agent</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Get Support</p>
              <p className="text-xs text-gray-600">Contact us</p>
            </div>
          </button>
        </div>
      </div>

      {/* Latest Invoice */}
      {latestInvoice && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Latest Invoice
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Amount Due</p>
              <p className="text-2xl font-bold text-gray-900">R{latestInvoice.amount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Due Date</p>
              <p className="font-semibold text-gray-900">{new Date(latestInvoice.dueDate).toLocaleDateString('en-ZA')}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <p className="text-gray-600">Status</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                latestInvoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                latestInvoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {latestInvoice.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Important Notices */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">notifications</span>
          Important Notices
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-xs mt-0.5 text-[#1a558b]">check_circle</span>
            <span>Invoices are generated on the 28th of each month</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-xs mt-0.5 text-[#1a558b]">check_circle</span>
            <span>Payment is due within 7 days to avoid suspension</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-xs mt-0.5 text-[#1a558b]">check_circle</span>
            <span>Contact your assigned agent for support</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
