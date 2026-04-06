// plus1-rewards/src/pages/PartnerSalesTerminal.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, Check, AlertCircle } from 'lucide-react';

interface Partner {
  id: string;
  shop_name: string;
  cashback_percent: number;
  status: string;
}

interface Member {
  id: string;
  full_name: string;
  phone: string;
  status: string;
}

export default function PartnerSalesTerminal() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState<'phone' | 'amount'>('phone');

  useEffect(() => {
    loadPartner();
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

  const handleNumberClick = (num: string) => {
    if (activeField === 'phone') {
      if (phoneNumber.length < 10) {
        setPhoneNumber(phoneNumber + num);
      }
    } else if (activeField === 'amount') {
      // Handle decimal input for amount
      if (purchaseAmount.includes('.')) {
        const parts = purchaseAmount.split('.');
        if (parts[1].length < 2) {
          setPurchaseAmount(purchaseAmount + num);
        }
      } else {
        setPurchaseAmount(purchaseAmount + num);
      }
    }
  };

  const handleDecimal = () => {
    if (activeField === 'amount' && !purchaseAmount.includes('.')) {
      setPurchaseAmount(purchaseAmount + '.');
    }
  };

  const handleBackspace = () => {
    if (activeField === 'phone') {
      setPhoneNumber(phoneNumber.slice(0, -1));
    } else if (activeField === 'amount') {
      setPurchaseAmount(purchaseAmount.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (activeField === 'phone') {
      setPhoneNumber('');
    } else if (activeField === 'amount') {
      setPurchaseAmount('');
    }
    setError('');
  };

  const handleSubmit = async () => {
    // Validate phone number
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit cell phone number');
      setActiveField('phone');
      return;
    }

    // Validate amount
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid transaction amount');
      setActiveField('amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Look up member
      const { data, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, phone, status')
        .eq('cell_phone', phoneNumber)
        .single();

      if (memberError || !data) {
        setError('Member not found. Please ask them to register first.');
        setLoading(false);
        setActiveField('phone');
        return;
      }

      if (data.status !== 'active') {
        setError('Member account is not active');
        setLoading(false);
        setActiveField('phone');
        return;
      }

      setMember(data);
      setStep('confirm');
      setError('');
    } catch (err) {
      setError('Error searching for member');
      setActiveField('phone');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!member || !purchaseAmount || !partner) return;

    // Check if partner is suspended
    if (partner.status === 'suspended') {
      setError('Your account has been suspended. You cannot process transactions. Please contact admin.');
      setLoading(false);
      return;
    }

    // Check if partner is not active
    if (partner.status !== 'active') {
      setError('Your account is not active. Only active partners can process transactions.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(purchaseAmount);
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

      // Fund cover plans - first get in_progress plans
      const { data: inProgressPlans } = await supabase
        .from('member_cover_plans')
        .select('id, funded_amount, target_amount, status, overflow_balance')
        .eq('member_id', member.id)
        .eq('status', 'in_progress')
        .order('creation_order', { ascending: true });

      let remainingAmount = memberAmount;

      // First, fund any in_progress plans
      if (inProgressPlans && inProgressPlans.length > 0) {
        for (const plan of inProgressPlans) {
          if (remainingAmount <= 0) break;

          const needed = plan.target_amount - plan.funded_amount;
          const toAdd = Math.min(remainingAmount, needed);
          const newFundedAmount = plan.funded_amount + toAdd;
          const newStatus = newFundedAmount >= plan.target_amount ? 'active' : 'in_progress';

          await supabase
            .from('member_cover_plans')
            .update({
              funded_amount: newFundedAmount,
              status: newStatus,
              ...(newStatus === 'active' && {
                active_from: new Date().toISOString(),
                active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
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
        }
      }

      // If there's still remaining cashback, add it to overflow of the first active plan
      if (remainingAmount > 0) {
        const { data: activePlans } = await supabase
          .from('member_cover_plans')
          .select('id, overflow_balance')
          .eq('member_id', member.id)
          .eq('status', 'active')
          .order('creation_order', { ascending: true })
          .limit(1);

        if (activePlans && activePlans.length > 0) {
          const activePlan = activePlans[0];
          const newOverflow = (activePlan.overflow_balance || 0) + remainingAmount;

          await supabase
            .from('member_cover_plans')
            .update({
              overflow_balance: newOverflow
            })
            .eq('id', activePlan.id);

          await supabase
            .from('cover_plan_wallet_entries')
            .insert({
              member_id: member.id,
              member_cover_plan_id: activePlan.id,
              transaction_id: transaction.id,
              entry_type: 'overflow_added',
              amount: remainingAmount,
              balance_after: newOverflow
            });
        }
      }

      setStep('success');
      setTimeout(() => {
        handleNewTransaction();
      }, 3000);
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to process transaction. Please try again.');
      setLoading(false);
    }
  };

  const handleNewTransaction = () => {
    setStep('input');
    setPhoneNumber('');
    setPurchaseAmount('');
    setMember(null);
    setError('');
    setLoading(false);
    setActiveField('phone');
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('input');
      setMember(null);
    }
    setError('');
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const calculateCashback = () => {
    if (!partner || !purchaseAmount) return 0;
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount)) return 0;
    return (amount * (partner.cashback_percent - 2)) / 100;
  };

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">+1</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">{partner.shop_name}</h1>
                <p className="text-blue-300 text-sm">{partner.cashback_percent}% Cashback</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 flex flex-col justify-center">
              {step === 'input' && (
                <div className="text-center">
                  <div className="mb-8">
                    <h2 className="text-white text-5xl font-bold mb-3">Welcome! 👋</h2>
                    <p className="text-blue-200 text-xl">Earn cashback for your medi plan here!</p>
                  </div>

                  {/* Phone Number Field */}
                  <div 
                    className={`bg-black/30 rounded-2xl p-6 mb-6 cursor-pointer transition-all ${
                      activeField === 'phone' ? 'ring-4 ring-blue-400' : 'hover:bg-black/40'
                    }`}
                    onClick={() => setActiveField('phone')}
                  >
                    <p className="text-blue-300 text-sm font-semibold mb-2">Your Cell Phone Number</p>
                    <div className="text-white text-4xl font-mono tracking-wider min-h-[50px] flex items-center justify-center">
                      {phoneNumber || '___-___-____'}
                    </div>
                  </div>

                  {/* Transaction Amount Field */}
                  <div 
                    className={`bg-black/30 rounded-2xl p-6 mb-6 cursor-pointer transition-all ${
                      activeField === 'amount' ? 'ring-4 ring-green-400' : 'hover:bg-black/40'
                    }`}
                    onClick={() => setActiveField('amount')}
                  >
                    <p className="text-green-300 text-sm font-semibold mb-2">Enter Transaction Amount</p>
                    <div className="text-white text-5xl font-bold min-h-[60px] flex items-center justify-center">
                      R{purchaseAmount || '0.00'}
                    </div>
                    {purchaseAmount && partner && (
                      <p className="text-green-300 text-lg mt-3">
                        You'll earn: {formatCurrency(calculateCashback())} cashback! 🎉
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                      <p className="text-red-200 text-sm text-left">{error}</p>
                    </div>
                  )}

                  <p className="text-white/60 text-sm mt-4">
                    Thank you for supporting us!
                  </p>

                  {/* Registration Link */}
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-white/80 text-center text-sm">
                      Not Registered?{' '}
                      <button
                        onClick={() => navigate('/partner/member-registration')}
                        className="text-yellow-300 font-bold hover:text-yellow-200 underline transition-colors"
                      >
                        Register here!
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {step === 'confirm' && member && (
                <div className="text-center">
                  <h2 className="text-white text-4xl font-bold mb-8">Confirm Transaction</h2>
                  <div className="space-y-4 mb-8">
                    <div className="bg-black/30 rounded-xl p-6">
                      <p className="text-blue-200 text-sm mb-1">Member</p>
                      <p className="text-white text-2xl font-bold">{member.full_name}</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-6">
                      <p className="text-blue-200 text-sm mb-1">Purchase Amount</p>
                      <p className="text-white text-4xl font-bold">R{purchaseAmount}</p>
                    </div>
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
                      <p className="text-green-200 text-sm mb-1">Cashback Earned</p>
                      <p className="text-green-300 text-3xl font-bold">{formatCurrency(calculateCashback())}</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 'success' && member && (
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-white text-5xl font-bold mb-4">Success!</h2>
                  <p className="text-green-300 text-2xl mb-2">{member.full_name}</p>
                  <p className="text-blue-200 text-xl mb-8">earned {formatCurrency(calculateCashback())} cashback</p>
                  <p className="text-white/60 text-sm">Starting new transaction...</p>
                </div>
              )}
            </div>

            {/* Right Side - Keypad */}
            <div className="bg-blue-600 rounded-3xl p-8 flex flex-col">
              <div className="text-center mb-6">
                <p className="text-white text-lg font-semibold">
                  {step === 'input' 
                    ? activeField === 'phone' 
                      ? 'ENTER CELL PHONE NUMBER' 
                      : 'ENTER TRANSACTION AMOUNT'
                    : 'CONFIRM TRANSACTION'}
                </p>
              </div>

              {step === 'input' && (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-4xl font-bold rounded-2xl h-20 transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    {activeField === 'amount' && (
                      <button
                        onClick={handleDecimal}
                        className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-4xl font-bold rounded-2xl h-20 transition-all"
                      >
                        .
                      </button>
                    )}
                    {activeField === 'phone' && <div></div>}
                    <button
                      onClick={() => handleNumberClick('0')}
                      className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-4xl font-bold rounded-2xl h-20 transition-all"
                    >
                      0
                    </button>
                    <button
                      onClick={handleBackspace}
                      className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-2xl font-bold rounded-2xl h-20 transition-all"
                    >
                      ⌫
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleClear}
                      className="bg-red-500/80 hover:bg-red-500 text-white text-xl font-bold rounded-2xl h-16 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || phoneNumber.length !== 10 || !purchaseAmount}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-xl font-bold rounded-2xl h-16 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Continue
                          <Check className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="flex-1 flex flex-col gap-4">
                  <button
                    onClick={handleBack}
                    className="bg-white/20 hover:bg-white/30 text-white text-xl font-bold rounded-2xl h-20 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmTransaction}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-3xl font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-8 h-8" />
                        Confirm Sale
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleNewTransaction}
                    className="bg-red-500/80 hover:bg-red-500 text-white text-xl font-bold rounded-2xl h-16 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
