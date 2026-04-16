// src/components/partner/pages/QuickTransaction.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Phone, DollarSign, User, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Partner {
  id: string;
  shop_name: string;
  cashback_percent: number;
  status: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
}

export default function QuickTransaction() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadPartner();
    loadRecentTransactions();
  }, []);

  const loadPartner = async () => {
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

      const { data, error } = await supabase
        .from('partners')
        .select('id, shop_name, cashback_percent, status')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      setPartner(data);
    } catch (error) {
      console.error('Error loading partner:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      if (!partnerSessionData) return;

      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id;
      if (!partnerId) return;

      const { data } = await supabase
        .from('transactions')
        .select(`
          id,
          purchase_amount,
          member_amount,
          created_at,
          members (first_name, last_name, phone)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setRecentTransactions(data);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
    }
  };

  const handleSearchMember = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setMember(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, status')
        .eq('phone', phoneNumber)
        .single();

      if (error || !data) {
        setError('Member not found. Please ask them to register first.');
        return;
      }

      if (data.status !== 'active') {
        setError('Member account is not active');
        return;
      }

      setMember(data);
    } catch (err) {
      setError('Error searching for member');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!member || !purchaseAmount || !partner) {
      setError('Please complete all fields');
      return;
    }

    if (partner.status === 'suspended') {
      setError('Your account is suspended. Please contact support.');
      return;
    }

    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid purchase amount');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const cashbackPercent = partner.cashback_percent;
      const totalCashback = (amount * cashbackPercent) / 100;
      const systemAmount = (amount * 1) / 100;
      const agentAmount = (amount * 1) / 100;
      const memberAmount = totalCashback - systemAmount - agentAmount;

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          partner_id: partner.id,
          member_id: member.id,
          purchase_amount: amount,
          cashback_percent: cashbackPercent,
          system_percent: 1,
          agent_percent: 1,
          member_percent: cashbackPercent - 2,
          system_amount: systemAmount,
          agent_amount: agentAmount,
          member_amount: memberAmount,
          status: 'completed'
        })
        .select()
        .single();

      if (txError) throw txError;

      const { data: memberCoverPlans } = await supabase
        .from('member_cover_plans')
        .select('id, funded_amount, target_amount, status')
        .eq('member_id', member.id)
        .eq('status', 'in_progress')
        .order('creation_order', { ascending: true });

      if (memberCoverPlans && memberCoverPlans.length > 0) {
        let remainingAmount = memberAmount;

        for (const plan of memberCoverPlans) {
          if (remainingAmount <= 0) break;

          const needed = plan.target_amount - plan.funded_amount;
          const toAdd = Math.min(remainingAmount, needed);

          const newFundedAmount = plan.funded_amount + toAdd;
          
          // Check if member profile is complete
          const { data: memberData } = await supabase
            .from('members')
            .select('email, sa_id, address_line_1')
            .eq('id', member.id)
            .single();
          
          const isProfileComplete = memberData && 
            memberData.email && 
            !memberData.email.includes('@plus1rewards.local') &&
            memberData.sa_id && 
            memberData.address_line_1;
          
          // Determine status based on funding and profile completeness
          let newStatus = 'in_progress';
          if (newFundedAmount >= plan.target_amount) {
            newStatus = isProfileComplete ? 'pending' : 'paused';
          }

          await supabase
            .from('member_cover_plans')
            .update({
              funded_amount: newFundedAmount,
              status: newStatus
            })
            .eq('id', plan.id);

          await supabase
            .from('cover_plan_wallet_entries')
            .insert({
              member_id: member.id,
              member_cover_plan_id: plan.id,
              transaction_id: transaction.id,
              entry_type: 'cashback_added',
              amount: toAdd,
              balance_after: newFundedAmount
            });

          remainingAmount -= toAdd;
          
          // If there's overflow after reaching 100%, add it to the same plan's overflow
          if (remainingAmount > 0 && newFundedAmount >= plan.target_amount) {
            const newOverflow = (plan.overflow_balance || 0) + remainingAmount;
            
            await supabase
              .from('member_cover_plans')
              .update({
                overflow_balance: newOverflow
              })
              .eq('id', plan.id);

            await supabase
              .from('cover_plan_wallet_entries')
              .insert({
                member_id: member.id,
                member_cover_plan_id: plan.id,
                transaction_id: transaction.id,
                entry_type: 'overflow_added',
                amount: remainingAmount,
                balance_after: newOverflow
              });

            remainingAmount = 0;
          }
        }
      }

      setSuccess(`Transaction successful! Member earned R${memberAmount.toFixed(2)} cashback`);
      setPhoneNumber('');
      setPurchaseAmount('');
      setMember(null);
      loadRecentTransactions();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to process transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Process Transaction</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Quick transaction processing for {partner?.shop_name}
          </p>
          <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
            Cashback Rate: {partner?.cashback_percent}%
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 md:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Transaction Form */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 md:mb-6">New Transaction</h2>

          {/* Phone Number Input */}
          <div className="mb-4 md:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Member Phone Number
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0812345678"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  maxLength={10}
                />
              </div>
              <button
                onClick={handleSearchMember}
                disabled={loading || phoneNumber.length !== 10}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                {loading ? <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" /> : 'Search'}
              </button>
            </div>
          </div>

          {/* Member Info */}
          {member && (
            <div className="mb-4 md:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{`${member.first_name} ${member.last_name}`.trim()}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{member.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Amount */}
          {member && (
            <div className="mb-4 md:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Purchase Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                <p className="mt-2 text-xs sm:text-sm text-gray-600">
                  Member will earn: {formatCurrency((parseFloat(purchaseAmount) * (partner?.cashback_percent || 0) - parseFloat(purchaseAmount) * 2) / 100)}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          {member && (
            <button
              onClick={handleSubmitTransaction}
              disabled={submitting || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
              className="w-full py-2.5 sm:py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                'Complete Transaction'
              )}
            </button>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-500 text-center py-6 md:py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{`${tx.members?.first_name} ${tx.members?.last_name}`.trim()}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{tx.members?.phone}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(tx.purchase_amount)}</p>
                    <p className="text-xs sm:text-sm text-green-600 whitespace-nowrap">+{formatCurrency(tx.member_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
