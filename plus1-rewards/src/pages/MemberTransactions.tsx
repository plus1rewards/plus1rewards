import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}

interface Transaction {
  id: string;
  partner_id: string;
  purchase_amount: number;
  cashback_percent: number;
  member_amount: number;
  created_at: string;
  status: string;
  partners: {
    shop_name: string;
  };
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

export default function MemberTransactions() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('month');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = getSession();
      if (!session) {
        navigate('/member/login');
        return;
      }

      console.log('Session:', session);
      
      // Get member ID from session - it's in session.member.id, not session.user.id
      const memberId = session.member?.id || session.user?.id;
      console.log('Member ID:', memberId);

      if (!memberId) {
        console.error('No member ID found in session');
        navigate('/member/login');
        return;
      }

      // Load member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, phone, email, qr_code')
        .eq('id', memberId)
        .single();

      if (memberError) {
        console.error('Error loading member:', memberError);
      }

      if (memberData) {
        setMember({
          ...memberData,
          name: memberData.full_name
        });
      }

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

      console.log('Fetching transactions for member:', memberId);
      console.log('Start date:', startDate.toISOString());

      // Load transactions without join first
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error loading transactions:', txError);
      }

      console.log('Transactions loaded:', txData?.length || 0);
      console.log('Transaction data:', txData);

      // If we have transactions, fetch partner names separately
      if (txData && txData.length > 0) {
        const partnerIds = [...new Set(txData.map(tx => tx.partner_id))];
        const { data: partnersData } = await supabase
          .from('partners')
          .select('id, shop_name')
          .in('id', partnerIds);

        // Map partner names to transactions
        const partnersMap = new Map(partnersData?.map(p => [p.id, p.shop_name]) || []);
        
        const enrichedTransactions = txData.map(tx => ({
          ...tx,
          partners: {
            shop_name: partnersMap.get(tx.partner_id) || 'Unknown Partner'
          }
        }));

        setTransactions(enrichedTransactions as Transaction[]);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    navigate('/member/login');
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
  const totalCashback = transactions.reduce((sum, tx) => sum + tx.member_amount, 0);

  if (loading) {
    return (
      <MemberLayout
        member={member}
        isOnline={navigator.onLine}
        pendingTransactions={0}
        onSignOut={handleSignOut}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout
      member={member}
      isOnline={navigator.onLine}
      pendingTransactions={0}
      onSignOut={handleSignOut}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 text-sm">View all your cashback transactions</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="self-start sm:self-auto bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-2xl">receipt</span>
            <div>
              <p className="text-gray-900 font-bold text-xl">{transactions.length}</p>
              <p className="text-gray-600 text-sm">Total Transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-2xl">shopping_cart</span>
            <div>
              <p className="text-gray-900 font-bold text-xl">R{totalPurchases.toFixed(2)}</p>
              <p className="text-gray-600 text-sm">Total Purchases</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-2xl">payments</span>
            <div>
              <p className="text-gray-900 font-bold text-xl">R{totalCashback.toFixed(2)}</p>
              <p className="text-gray-600 text-sm">Total Cashback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 mb-6 shadow-sm">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'today', label: 'Today', icon: 'today' },
            { id: 'week', label: '7 Days', icon: 'date_range' },
            { id: 'month', label: '30 Days', icon: 'calendar_month' },
            { id: 'all', label: 'All Time', icon: 'history' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterPeriod)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                filter === tab.id
                  ? 'bg-[#1a558b] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Transactions ({transactions.length})
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-gray-400 text-6xl mb-4 block">receipt_long</span>
            <h3 className="text-gray-900 font-bold text-lg mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'today' 
                ? "You haven't made any purchases today yet."
                : `No transactions found for the selected period.`}
            </p>
            <button
              onClick={() => navigate('/member/dashboard')}
              className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#1a558b]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#1a558b] text-lg">store</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-gray-900 font-bold text-sm truncate">
                        {tx.partners?.shop_name || 'Partner Store'}
                      </h3>
                      <p className="text-gray-500 text-xs truncate">
                        {formatDate(tx.created_at)} · {tx.cashback_percent}% back
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-900 font-bold text-sm">R{tx.purchase_amount.toFixed(2)}</p>
                    <p className="text-green-600 text-xs font-semibold">+R{tx.member_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
