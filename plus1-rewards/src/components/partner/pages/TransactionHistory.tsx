// src/components/partner/pages/TransactionHistory.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import PartnerLayout from '../PartnerLayout';

interface Transaction {
  id: string;
  member_id: string;
  purchase_amount: number;
  member_reward: number;
  created_at: string;
  status: string;
  members?: {
    name: string;
    phone: string;
  };
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('month');
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    loadPartnerAndTransactions();
  }, [filter]);

  const loadPartnerAndTransactions = async () => {
    setLoading(true);
    try {
      // Get partner session (custom auth)
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

      setPartnerId(partnerId);

      // Calculate date range based on filter
      let startDate = new Date();
      if (filter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (filter === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (filter === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate = new Date('2020-01-01'); // All time
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          id,
          member_id,
          purchase_amount,
          member_amount,
          created_at,
          status
        `)
        .eq('partner_id', partnerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (txData) {
        // Load member names separately
        const memberIds = [...new Set(txData.map(t => t.member_id))];
        if (memberIds.length > 0) {
          const { data: members } = await supabase
            .from('members')
            .select('id, first_name, last_name, cell_phone')
            .in('id', memberIds);

          const memberMap = new Map(members?.map(m => [m.id, { name: `${m.first_name} ${m.last_name}`.trim(), phone: m.cell_phone }]) || []);
          
          setTransactions(txData.map(t => ({
            ...t,
            member_reward: parseFloat(t.member_amount) || 0,
            members: memberMap.get(t.member_id)
          })));
        } else {
          setTransactions(txData.map(t => ({
            ...t,
            member_reward: parseFloat(t.member_amount) || 0
          })));
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPurchases = transactions.reduce((sum, tx) => sum + tx.purchase_amount, 0);
  const totalRewards = transactions.reduce((sum, tx) => sum + tx.member_reward, 0);

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm md:text-base text-gray-600">View all your reward transactions</p>
        </div>
        <button
          onClick={() => navigate('/partner/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm md:text-base w-full sm:w-auto"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">receipt</span>
            <div>
              <p className="text-gray-900 font-bold text-lg md:text-xl">{transactions.length}</p>
              <p className="text-gray-600 text-xs md:text-sm">Total Transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">shopping_cart</span>
            <div>
              <p className="text-gray-900 font-bold text-lg md:text-xl">R{totalPurchases.toFixed(2)}</p>
              <p className="text-gray-600 text-xs md:text-sm">Total Sales</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">payments</span>
            <div>
              <p className="text-gray-900 font-bold text-lg md:text-xl">R{totalRewards.toFixed(2)}</p>
              <p className="text-gray-600 text-xs md:text-sm">Rewards Issued</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'today', label: 'Today', icon: 'today' },
            { id: 'week', label: 'Last 7 Days', icon: 'date_range' },
            { id: 'month', label: 'Last 30 Days', icon: 'calendar_month' },
            { id: 'all', label: 'All Time', icon: 'history' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterPeriod)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-[#1a558b] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'today' ? 'Today' : tab.id === 'week' ? '7d' : tab.id === 'month' ? '30d' : 'All'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Transactions ({transactions.length})
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <span className="material-symbols-outlined text-gray-400 text-5xl md:text-6xl mb-4 block">receipt_long</span>
            <h3 className="text-gray-900 font-bold text-base md:text-lg mb-2">No transactions found</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              {filter === 'today' 
                ? "You haven't issued any rewards today yet."
                : `No transactions found for the selected period.`}
            </p>
            <button
              onClick={() => navigate('/partner/dashboard')}
              className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl transition-colors text-sm md:text-base"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start md:items-center justify-between gap-3 md:gap-4">
                  <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#1a558b]/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#1a558b] text-lg md:text-xl">shopping_cart</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm md:text-base text-gray-900 font-bold truncate">
                        {tx.members?.name || 'Unknown Member'}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {formatDate(tx.created_at)} • {tx.members?.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-base md:text-lg text-gray-900 font-bold">R{tx.purchase_amount.toFixed(2)}</p>
                    <p className="text-[#1a558b] text-xs md:text-sm whitespace-nowrap">+R{tx.member_reward.toFixed(2)} rewards</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
