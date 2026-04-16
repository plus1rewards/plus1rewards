// src/components/partner/pages/ProcessTransaction.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import jsQR from 'jsqr';

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
}

export default function ProcessTransaction() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [searchMethod, setSearchMethod] = useState<'phone' | 'qr'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    loadPartner();
  }, []);

  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScannerActive(true);
        setCameraPermission('granted');
        scanQRCode();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraPermission('denied');
      setError('Camera access denied. Please enable camera permissions in your browser settings.');
    }
  };

  const stopQRScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setScannerActive(false);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scannerActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      console.log('✅ QR Code detected:', code.data);
      handleQRCodeScanned(code.data);
      stopQRScanner();
    } else {
      // Continue scanning
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRCodeScanned = async (qrData: string) => {
    console.log('📱 Processing QR code:', qrData);
    
    // QR code format: PLUS1-{phone}-{timestamp}
    const qrPattern = /^PLUS1-(\d{10})-\d+$/;
    const match = qrData.match(qrPattern);

    if (!match) {
      setError('Invalid QR code format. Please scan a valid Plus1 Rewards member QR code.');
      return;
    }

    const memberPhone = match[1];
    setPhoneNumber(memberPhone);
    
    // Search for member
    setLoading(true);
    setError('');
    setMember(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, cell_phone')
        .eq('cell_phone', memberPhone)
        .single();

      if (error || !data) {
        setError('Member not found. Please ask them to register first.');
        return;
      }

      setMember({
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.cell_phone
      });
      setSuccess(`✅ Member found: ${data.first_name} ${data.last_name}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Error searching for member');
    } finally {
      setLoading(false);
    }
  };

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
        .select('id, first_name, last_name, phone')
        .eq('phone', phoneNumber)
        .single();

      if (error || !data) {
        setError('Member not found. Please ask them to register first.');
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

    // Check if partner is suspended
    if (partner.status === 'suspended') {
      setError('Your account has been suspended. You cannot process transactions. Please contact admin.');
      return;
    }

    // Check if partner is active
    if (partner.status !== 'active') {
      setError('Your account is not active. Only active partners can process transactions.');
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
      // Calculate split
      const cashbackPercent = partner.cashback_percent;
      const totalCashback = (amount * cashbackPercent) / 100;
      const systemAmount = (amount * 1) / 100;
      const agentAmount = (amount * 1) / 100;
      const memberAmount = totalCashback - systemAmount - agentAmount;

      // Create transaction
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
          partner_contribution: totalCashback,
          status: 'pending_sync'
        })
        .select()
        .single();

      if (txError) throw txError;

      // Create wallet entry for member
      const { data: memberCoverPlans } = await supabase
        .from('member_cover_plans')
        .select('id')
        .eq('member_id', member.id)
        .order('creation_order', { ascending: true })
        .limit(1)
        .single();

      if (memberCoverPlans) {
        await supabase
          .from('cover_plan_wallet_entries')
          .insert({
            member_id: member.id,
            member_cover_plan_id: memberCoverPlans.id,
            transaction_id: transaction.id,
            entry_type: 'cashback_added',
            amount: memberAmount,
            balance_after: memberAmount
          });
      }

      setSuccess(`Transaction successful! R${amount.toFixed(2)} purchase recorded. Member received R${memberAmount.toFixed(2)} cashback.`);
      
      // Clear form
      setTimeout(() => {
        setMember(null);
        setPhoneNumber('');
        setPurchaseAmount('');
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to process transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setMember(null);
    setPhoneNumber('');
    setPurchaseAmount('');
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const systemAmount = member && purchaseAmount ? (parseFloat(purchaseAmount) * 1) / 100 : 0;
  const agentAmount = member && purchaseAmount ? (parseFloat(purchaseAmount) * 1) / 100 : 0;
  const memberAmount = member && purchaseAmount && partner ? 
    ((parseFloat(purchaseAmount) * partner.cashback_percent) / 100) - systemAmount - agentAmount : 0;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Process Transaction</h1>
          <p className="text-sm md:text-base text-gray-600">Capture member purchase and issue cashback</p>
        </div>
        <button
          onClick={() => navigate('/partner/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm md:text-base w-full sm:w-auto"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-sm flex items-start gap-3 md:gap-4">
          <span className="material-symbols-outlined text-green-600 text-xl md:text-2xl flex-shrink-0">check_circle</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-green-900 mb-1 text-sm md:text-base">Success!</h3>
            <p className="text-xs md:text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-sm flex items-start gap-3 md:gap-4">
          <span className="material-symbols-outlined text-red-600 text-xl md:text-2xl flex-shrink-0">error</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-red-900 mb-1 text-sm md:text-base">Error</h3>
            <p className="text-xs md:text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Search Method Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-sm">
        <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
          <button
            onClick={() => setSearchMethod('phone')}
            className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              searchMethod === 'phone'
                ? 'bg-[#1a558b] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-base md:text-lg mr-1 md:mr-2 align-middle">phone</span>
            <span className="align-middle">Phone Number</span>
          </button>
          <button
            onClick={() => setSearchMethod('qr')}
            className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              searchMethod === 'qr'
                ? 'bg-[#1a558b] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-base md:text-lg mr-1 md:mr-2 align-middle">qr_code_scanner</span>
            <span className="align-middle">QR Scan</span>
          </button>
        </div>

        {/* Phone Search */}
        {searchMethod === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Member Mobile Number
              </label>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0812345678"
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl focus:border-[#1a558b] focus:outline-none text-sm md:text-base"
                />
                <button
                  onClick={handleSearchMember}
                  disabled={loading || phoneNumber.length !== 10}
                  className="bg-[#1a558b] hover:bg-[#1a558b]/90 disabled:bg-gray-300 text-white font-bold px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-colors text-sm md:text-base whitespace-nowrap"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scan */}
        {searchMethod === 'qr' && (
          <div className="space-y-4">
            {!scannerActive ? (
              <button
                onClick={startQRScanner}
                className="w-full bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold py-3 md:py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <span className="material-symbols-outlined text-lg md:text-xl">qr_code_scanner</span>
                <span>Start QR Scanner</span>
              </button>
            ) : (
              <>
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* QR Scanner Frame */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-green-400 rounded-lg shadow-lg" style={{
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}>
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                    </div>
                  </div>

                  {/* Scanning indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    <span className="inline-block animate-pulse">● </span>
                    Scanning...
                  </div>
                </div>

                <button
                  onClick={stopQRScanner}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 md:py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <span className="material-symbols-outlined text-lg md:text-xl">close</span>
                  <span>Stop Scanner</span>
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 text-xs md:text-sm text-blue-700">
                  <p className="font-semibold mb-2">📱 How to scan:</p>
                  <ul className="space-y-1">
                    <li>• Position the member's QR code in the frame</li>
                    <li>• Keep the code steady for 2-3 seconds</li>
                    <li>• The scanner will automatically detect and process the code</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Member Details & Transaction Form */}
      {member && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">person</span>
            <span>Member Found</span>
          </h2>
          <div className="bg-green-50 rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-green-200">
            <p className="font-bold text-gray-900 text-sm md:text-base">{`${member.first_name} ${member.last_name}`.trim()}</p>
            <p className="text-xs md:text-sm text-gray-600">{member.phone}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Purchase Amount (R)
              </label>
              <input
                type="number"
                step="0.01"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl focus:border-[#1a558b] focus:outline-none text-xl md:text-2xl font-bold"
              />
            </div>

            {purchaseAmount && parseFloat(purchaseAmount) > 0 && partner && (
              <div className="bg-blue-50 rounded-xl p-3 md:p-4 border border-blue-200">
                <p className="text-xs font-bold text-gray-700 mb-2 md:mb-3">Cashback Split ({partner.cashback_percent}%):</p>
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">System Fee (1%)</span>
                    <span className="font-bold text-[#1a558b]">R{systemAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Commission (1%)</span>
                    <span className="font-bold text-[#1a558b]">R{agentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-blue-300">
                    <span className="text-gray-700 font-semibold">Member Reward</span>
                    <span className="font-black text-green-600 text-base md:text-lg">R{memberAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
              <button
                onClick={handleClear}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 md:py-3 rounded-xl transition-colors text-sm md:text-base"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitTransaction}
                disabled={submitting || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                className="flex-1 bg-[#1a558b] hover:bg-[#1a558b]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 md:py-3 rounded-xl transition-colors text-sm md:text-base"
              >
                {submitting ? 'Processing...' : 'Submit Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Admin */}
      <button
        onClick={() => navigate('/partner/support')}
        className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-bold py-2.5 md:py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
      >
        <span className="material-symbols-outlined text-lg md:text-xl">support_agent</span>
        <span>Contact Admin</span>
      </button>
    </>
  );
}
