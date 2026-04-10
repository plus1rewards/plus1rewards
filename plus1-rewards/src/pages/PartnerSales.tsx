// plus1-rewards/src/pages/PartnerSales.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Phone, DollarSign, User, CheckCircle, XCircle, Loader, QrCode, Camera } from 'lucide-react';

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

export default function PartnerSales() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [searchMethod, setSearchMethod] = useState<'phone' | 'qr'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadPartner();
    loadRecentTransactions();
  }, []);

  useEffect(() => {
    if (showScanner) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showScanner]);

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
        .limit(10);

      if (data) setRecentTransactions(data);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSearchByPhone = async () => {
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
        .select('id, first_name, last_name, phone, status, role')
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

      // Prevent transactions for sponsored members
      if (data.role === 'sponsored_member') {
        setError('This is a sponsored member. Only the sponsor can earn cashback, not the sponsored member.');
        return;
      }

      setMember(data);
    } catch (err) {
      setError('Error searching for member');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByQR = async () => {
    if (!qrCode) {
      setError('Please enter a QR code');
      return;
    }

    setLoading(true);
    setError('');
    setMember(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, status, role')
        .eq('qr_code', qrCode)
        .single();

      if (error || !data) {
        setError('Member not found with this QR code');
        return;
      }

      if (data.status !== 'active') {
        setError('Member account is not active');
        return;
      }

      // Prevent transactions for sponsored members
      if (data.role === 'sponsored_member') {
        setError('This is a sponsored member. Only the sponsor can earn cashback, not the sponsored member.');
        return;
      }

      setMember(data);
      setShowScanner(false);
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

    if (partner.status === 'paused') {
      setError('Your account is paused. Please contact support.');
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
          let updateData: any = {
            funded_amount: newFundedAmount,
            status: newStatus
          };
          
          if (newFundedAmount >= plan.target_amount) {
            // When plan reaches 100%, it goes to PENDING (not active)
            // Day1Health will change it to active after verification
            newStatus = isProfileComplete ? 'pending' : 'paused';
            updateData.status = newStatus;
          }

          await supabase
            .from('member_cover_plans')
            .update(updateData)
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

            // Check if this member sponsors anyone and reactivate paused plans if possible
            await supabase.rpc('reactivate_paused_sponsored_plans', {
              p_sponsor_id: member.id
            });
          }
        }
      }

      setSuccess(`Sale completed! ${`${member.first_name} ${member.last_name}`.trim()} earned R${memberAmount.toFixed(2)} cashback`);
      setPhoneNumber('');
      setQrCode('');
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

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Terminal</h1>
              <p className="text-gray-600">{partner.shop_name}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold">
                {partner.cashback_percent}% Cashback
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Transaction Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Search Method Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => {
                    setSearchMethod('phone');
                    setShowScanner(false);
                    setMember(null);
                    setError('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    searchMethod === 'phone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                  Phone Number
                </button>
                <button
                  onClick={() => {
                    setSearchMethod('qr');
                    setMember(null);
                    setError('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    searchMethod === 'qr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  QR Code
                </button>
              </div>

              {/* Phone Search */}
              {searchMethod === 'phone' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Member Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="0812345678"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        maxLength={10}
                      />
                    </div>
                    <button
                      onClick={handleSearchByPhone}
                      disabled={loading || phoneNumber.length !== 10}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code Search */}
              {searchMethod === 'qr' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Member QR Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={qrCode}
                          onChange={(e) => setQrCode(e.target.value)}
                          placeholder="PLUS1-0812345678-..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleSearchByQR}
                        disabled={loading || !qrCode}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
                      </button>
                    </div>
                  </div>

                  {/* Camera Scanner */}
                  <div>
                    <button
                      onClick={() => setShowScanner(!showScanner)}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      {showScanner ? 'Close Scanner' : 'Open Camera Scanner'}
                    </button>
                  </div>

                  {showScanner && (
                    <div className="relative bg-black rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-4 border-white/50 rounded-xl"></div>
                      </div>
                      <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2">
                        Position QR code within the frame
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Member Info & Transaction */}
            {member && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{`${member.first_name} ${member.last_name}`.trim()}</p>
                      <p className="text-sm text-gray-600">{member.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-2xl font-bold"
                    />
                  </div>
                  {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Member will earn: {formatCurrency((parseFloat(purchaseAmount) * (partner.cashback_percent - 2)) / 100)}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmitTransaction}
                  disabled={submitting || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Sale
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Recent Transactions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sales</h2>
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No sales yet</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">{`${tx.members?.first_name} ${tx.members?.last_name}`.trim()}</p>
                      <p className="text-xs text-gray-600">{tx.members?.phone}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(tx.purchase_amount)}</span>
                        <span className="text-xs text-green-600">+{formatCurrency(tx.member_amount)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(tx.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
