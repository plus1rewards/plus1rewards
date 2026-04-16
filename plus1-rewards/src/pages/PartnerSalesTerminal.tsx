// plus1-rewards/src/pages/PartnerSalesTerminal.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Check, AlertCircle, User, DollarSign, Sparkles, ShoppingBag, QrCode, X } from 'lucide-react';
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
  cell_phone: string;
  status: string;
}

const BLUE = '#1a558b';

export default function PartnerSalesTerminal() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState<'phone' | 'amount'>('phone');
  const [scannerActive, setScannerActive] = useState(false);

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

  const startQRScanner = async () => {
    try {
      console.log('🎥 Starting QR scanner...');
      setScannerActive(true);
      setError('');
      
      // Request camera with mobile-friendly constraints
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 }
        },
        audio: false
      };
      
      console.log('📱 Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('📹 Stream assigned to video element');
        
        // Ensure video plays
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('▶️ Video playing');
              // Start scanning after a short delay to ensure video is ready
              setTimeout(() => {
                console.log('🔍 Starting scan loop');
                scanQRCode();
              }, 500);
            })
            .catch(err => {
              console.error('❌ Error playing video:', err);
              setError('Error starting video playback');
            });
        }
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      setScannerActive(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another app.');
      } else {
        setError('Failed to access camera: ' + err.message);
      }
    }
  };

  const stopQRScanner = () => {
    console.log('🛑 Stopping QR scanner');
    setScannerActive(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      console.log(`📹 Stopping ${tracks.length} media tracks`);
      tracks.forEach(track => {
        track.stop();
        console.log(`✅ Stopped ${track.kind} track`);
      });
      videoRef.current.srcObject = null;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scannerActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('❌ Canvas context not available');
      return;
    }

    // Check if video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⏳ Video not ready yet, retrying...');
      requestAnimationFrame(scanQRCode);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data and scan for QR code
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log('✅ QR Code detected:', code.data);
        // Stop scanner immediately
        setScannerActive(false);
        stopQRScanner();
        // Process the QR code
        handleQRCodeScanned(code.data);
        return;
      }
    } catch (err) {
      console.error('❌ Error during scanning:', err);
    }

    // Continue scanning
    if (scannerActive) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRCodeScanned = async (qrData: string) => {
    console.log('📱 Processing QR code:', qrData);
    
    // Try to parse the QR code - it could be a URL or raw format
    let memberIdentifier = null;
    
    // Check if it's a URL format: https://www.plus1rewards.com/member?id=PLUS1-{phone}-{timestamp}
    try {
      const url = new URL(qrData);
      const id = url.searchParams.get('id');
      if (id) {
        memberIdentifier = decodeURIComponent(id);
        console.log('✅ Parsed URL format QR code:', memberIdentifier);
      }
    } catch (e) {
      // Not a URL, try raw format
      console.log('⏳ Not a URL format, trying raw format');
    }
    
    // If not a URL, try raw format: PLUS1-{phone}-{timestamp}
    if (!memberIdentifier) {
      const qrPattern = /^PLUS1-(\d{10})-\d+$/;
      const match = qrData.match(qrPattern);
      if (match) {
        memberIdentifier = match[1];
        console.log('✅ Parsed raw format QR code, phone:', memberIdentifier);
      }
    }
    
    // If still no match, try to extract phone from any PLUS1 format
    if (!memberIdentifier) {
      const plusMatch = qrData.match(/PLUS1-(\d{10})/);
      if (plusMatch) {
        memberIdentifier = plusMatch[1];
        console.log('✅ Extracted phone from PLUS1 format:', memberIdentifier);
      }
    }
    
    if (!memberIdentifier) {
      console.error('❌ Could not parse QR code:', qrData);
      setError('Invalid QR code format. Please scan a valid Plus1 Rewards member QR code.');
      return;
    }

    // Search for member by phone
    setLoading(true);
    setError('');
    setMember(null);

    try {
      console.log('🔍 Searching for member with phone:', memberIdentifier);
      const { data, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, cell_phone, status, role, email, sa_id, address_line_1')
        .eq('cell_phone', memberIdentifier)
        .single();

      if (memberError || !data) {
        console.error('❌ Member not found:', memberError);
        setError('Member not found. Please ask them to register first.');
        setLoading(false);
        return;
      }

      console.log('✅ Member found:', data.first_name, data.last_name);

      if (data.status !== 'active') {
        console.warn('⚠️ Member status not active:', data.status);
        setError('Member account is not active');
        setLoading(false);
        return;
      }

      // Prevent transactions for sponsored members
      if (data.role === 'sponsored_member') {
        console.warn('⚠️ Sponsored member detected');
        setError('This is a sponsored member. Only the sponsor can earn cashback, not the sponsored member.');
        setLoading(false);
        return;
      }

      // Check if member has any paused cover plans
      const { data: pausedPlans, error: planError } = await supabase
        .from('member_cover_plans')
        .select('id, status')
        .eq('member_id', data.id)
        .eq('status', 'paused');

      if (!planError && pausedPlans && pausedPlans.length > 0) {
        // Check if profile is complete to determine the reason for pause
        const isProfileComplete = 
          data.email && 
          !data.email.includes('@plus1rewards.local') && 
          data.sa_id && 
          data.address_line_1;

        if (!isProfileComplete) {
          // Profile incomplete - BLOCK transaction
          console.warn('⚠️ Profile incomplete, blocking transaction');
          setError('Member policy is PAUSED. Member needs to complete their profile information (email, ID number, address) in the +1 Rewards app before transactions can continue. Please ask them to update their information.');
          setLoading(false);
          return;
        }
      }

      setMember(data);
      setPhoneNumber(memberIdentifier);
      setActiveField('amount');
      setError('');
      console.log('✅ QR scan successful, ready for amount entry');
    } catch (err) {
      console.error('❌ Error searching for member:', err);
      setError('Error searching for member');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (num: string) => {
    if (activeField === 'phone') {
      if (phoneNumber.length < 10) {
        setPhoneNumber(phoneNumber + num);
      }
    } else if (activeField === 'amount') {
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
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit cell phone number');
      setActiveField('phone');
      return;
    }

    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid transaction amount');
      setActiveField('amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, cell_phone, status, role, email, sa_id, address_line_1')
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

      // Prevent transactions for sponsored members
      if (data.role === 'sponsored_member') {
        setError('This is a sponsored member. Only the sponsor can earn cashback, not the sponsored member.');
        setLoading(false);
        setActiveField('phone');
        return;
      }

      // Check if member has any paused cover plans
      const { data: pausedPlans, error: planError } = await supabase
        .from('member_cover_plans')
        .select('id, status')
        .eq('member_id', data.id)
        .eq('status', 'paused');

      console.log('🔍 Paused plans check:', { pausedPlans, planError });

      if (!planError && pausedPlans && pausedPlans.length > 0) {
        // Check if profile is complete to determine the reason for pause
        const isProfileComplete = 
          data.email && 
          !data.email.includes('@plus1rewards.local') && 
          data.sa_id && 
          data.address_line_1;

        console.log('🔍 Profile check:', {
          email: data.email,
          hasEmail: !!data.email,
          notPlusRewards: !data.email?.includes('@plus1rewards.local'),
          sa_id: data.sa_id,
          address: data.address_line_1,
          isProfileComplete
        });

        if (!isProfileComplete) {
          // Profile incomplete - BLOCK transaction
          console.log('❌ Blocking: Profile incomplete');
          setError('Member policy is PAUSED. Member needs to complete their profile information (email, ID number, address) in the +1 Rewards app before transactions can continue. Please ask them to update their information.');
          setLoading(false);
          setActiveField('phone');
          return;
        }
        // If profile is complete but paused (insufficient funds), ALLOW transaction to continue
        // They need to earn cashback to reactivate their plan
        console.log('✅ Allowing: Profile complete, paused due to insufficient funds');
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

    if (partner.status === 'paused') {
      setError('Your account has been paused. You cannot process transactions. Please contact admin.');
      setLoading(false);
      return;
    }

    if (partner.status !== 'active') {
      setError('Your account is not active. Only active partners can process transactions.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get the agent_id for this partner
      const { data: partnerLink, error: linkError } = await supabase
        .from('partner_agent_links')
        .select('agent_id')
        .eq('partner_id', partner.id)
        .eq('status', 'active')
        .single();

      if (linkError || !partnerLink) {
        console.warn('No active agent link found for partner:', partner.id);
      }

      const agentId = partnerLink?.agent_id || null;

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
          agent_id: agentId,
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

      const { data: inProgressPlans } = await supabase
        .from('member_cover_plans')
        .select('id, funded_amount, target_amount, status, overflow_balance')
        .eq('member_id', member.id)
        .eq('status', 'in_progress')
        .order('creation_order', { ascending: true });

      let remainingAmount = memberAmount;

      if (inProgressPlans && inProgressPlans.length > 0) {
        for (const plan of inProgressPlans) {
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
          }
        }
      }

      // Handle overflow for active plans (if any remaining amount)
      if (remainingAmount > 0) {
        // First try to find active plans
        const { data: activePlans } = await supabase
          .from('member_cover_plans')
          .select('id, overflow_balance')
          .eq('member_id', member.id)
          .eq('status', 'active')
          .order('creation_order', { ascending: true })
          .limit(1);

        // If no active plans, check for paused plans with complete profile
        let targetPlan = activePlans && activePlans.length > 0 ? activePlans[0] : null;
        
        if (!targetPlan) {
          // Check if member has complete profile
          const { data: memberData } = await supabase
            .from('members')
            .select('email, sa_id, address_line_1')
            .eq('id', member.id)
            .single();
          
          const isProfileComplete = 
            memberData?.email && 
            !memberData.email.includes('@plus1rewards.local') && 
            memberData.sa_id && 
            memberData.address_line_1;
          
          if (isProfileComplete) {
            // Profile complete, allow overflow to paused plans
            const { data: pausedPlans } = await supabase
              .from('member_cover_plans')
              .select('id, overflow_balance')
              .eq('member_id', member.id)
              .eq('status', 'paused')
              .order('creation_order', { ascending: true })
              .limit(1);
            
            if (pausedPlans && pausedPlans.length > 0) {
              targetPlan = pausedPlans[0];
            }
          }
        }

        if (targetPlan) {
          const newOverflow = (targetPlan.overflow_balance || 0) + remainingAmount;

          // Get the plan's target amount and current status
          const { data: planData } = await supabase
            .from('member_cover_plans')
            .select('target_amount, status')
            .eq('id', targetPlan.id)
            .single();

          const updateData: any = {
            overflow_balance: newOverflow
          };

          // If plan is paused and now has enough overflow, check if we should reactivate
          if (planData?.status === 'paused' && newOverflow >= planData.target_amount) {
            // Check if profile is complete
            const { data: memberData } = await supabase
              .from('members')
              .select('email, sa_id, address_line_1')
              .eq('id', member.id)
              .single();
            
            const isProfileComplete = 
              memberData?.email && 
              !memberData.email.includes('@plus1rewards.local') && 
              memberData.sa_id && 
              memberData.address_line_1;

            // Only reactivate if profile is complete (paused due to insufficient funds, not incomplete profile)
            if (isProfileComplete) {
              updateData.status = 'active';
              updateData.active_from = new Date().toISOString();
              updateData.active_to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              updateData.overflow_balance = newOverflow - planData.target_amount;

              // Create wallet entry for reactivation
              await supabase
                .from('cover_plan_wallet_entries')
                .insert({
                  member_id: member.id,
                  member_cover_plan_id: targetPlan.id,
                  transaction_id: transaction.id,
                  entry_type: 'plan_reactivated',
                  amount: planData.target_amount,
                  balance_after: planData.target_amount
                });
            }
          }

          await supabase
            .from('member_cover_plans')
            .update(updateData)
            .eq('id', targetPlan.id);

          await supabase
            .from('cover_plan_wallet_entries')
            .insert({
              member_id: member.id,
              member_cover_plan_id: targetPlan.id,
              transaction_id: transaction.id,
              entry_type: 'overflow_added',
              amount: remainingAmount,
              balance_after: newOverflow
            });

          // Check if this member sponsors anyone and reactivate paused plans if possible
          await supabase.rpc('reactivate_paused_sponsored_plans', {
            p_sponsor_id: member.id
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <motion.header 
        className="bg-white border-b border-gray-200 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/partner/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </motion.button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h1 className="text-xl font-bold text-gray-900">{partner.shop_name}</h1>
                <p className="text-sm text-blue-600 font-semibold">{partner.cashback_percent}% Cashback Rate</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BLUE }}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Left Side - Input Display */}
              <div className="space-y-6">
                <motion.div 
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Sales Terminal</h2>
                      <p className="text-sm text-gray-600">Process member transactions</p>
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div 
                    className={`mb-6 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      activeField === 'phone' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setActiveField('phone');
                      if (scannerActive) stopQRScanner();
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <label className="text-sm font-semibold text-gray-700">Member Cell Phone</label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const text = await navigator.clipboard.readText();
                              const cleaned = text.replace(/\D/g, '').slice(0, 10);
                              setPhoneNumber(cleaned);
                              setActiveField('phone');
                            } catch (err) {
                              console.error('Failed to paste:', err);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">content_paste</span>
                          Paste
                        </button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (scannerActive) {
                              stopQRScanner();
                            } else {
                              startQRScanner();
                            }
                          }}
                          className={`px-3 py-1 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                            scannerActive 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <QrCode className="w-4 h-4" />
                          {scannerActive ? 'Stop' : 'Scan'}
                        </motion.button>
                      </div>
                    </div>
                    <div className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                      {phoneNumber || '0XX XXX XXXX'}
                    </div>
                    {phoneNumber.length === 10 && (
                      <motion.div 
                        className="mt-2 flex items-center gap-1 text-green-600 text-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Check className="w-4 h-4" />
                        <span>Valid number</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div 
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      activeField === 'amount' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveField('amount')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <label className="text-sm font-semibold text-gray-700">Purchase Amount</label>
                    </div>
                    <div className="text-4xl font-bold text-gray-900">
                      R{purchaseAmount || '0.00'}
                    </div>
                    {purchaseAmount && partner && (
                      <motion.div 
                        className="mt-3 p-3 bg-green-100 rounded-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-sm text-green-800 font-semibold">
                          💰 Member earns: {formatCurrency(calculateCashback())} cashback
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {error && (
                    <motion.div 
                      className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 font-medium">{error}</p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Info Card */}
                <motion.div 
                  className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-bold mb-2">Member Not Registered?</h3>
                  <p className="text-blue-100 text-sm mb-4">Help them sign up in seconds!</p>
                  <motion.button
                    onClick={() => navigate('/partner/member-registration')}
                    className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Register New Member →
                  </motion.button>
                </motion.div>
              </div>

              {/* Right Side - Keypad */}
              <motion.div 
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="mb-6 text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {activeField === 'phone' ? 'Enter Phone Number' : 'Enter Amount'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                      key={num}
                      onClick={() => handleNumberClick(num.toString())}
                      className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 text-2xl font-bold rounded-xl transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {num}
                    </motion.button>
                  ))}
                  {activeField === 'amount' ? (
                    <motion.button
                      onClick={handleDecimal}
                      className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 text-2xl font-bold rounded-xl transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      .
                    </motion.button>
                  ) : (
                    <div></div>
                  )}
                  <motion.button
                    onClick={() => handleNumberClick('0')}
                    className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 text-2xl font-bold rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    0
                  </motion.button>
                  <motion.button
                    onClick={handleBackspace}
                    className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 text-xl font-bold rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ⌫
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={handleClear}
                    className="h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear
                  </motion.button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading || phoneNumber.length !== 10 || !purchaseAmount}
                    className="h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Continue
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 'confirm' && member && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                  <h2 className="text-3xl font-bold text-white text-center">Review Transaction</h2>
                  <p className="text-blue-100 text-center mt-1">Please confirm the details below</p>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="space-y-5 mb-8">
                    {/* Member Info */}
                    <motion.div 
                      className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 relative overflow-hidden"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-30"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <p className="text-sm text-blue-700 font-bold uppercase tracking-wide">Member Details</p>
                        </div>
                        <p className="text-3xl font-black text-gray-900 mb-1">{`${member.first_name} ${member.last_name}`.trim()}</p>
                        <p className="text-lg text-gray-700 font-mono">{member.cell_phone}</p>
                      </div>
                    </motion.div>
                    
                    {/* Purchase Amount */}
                    <motion.div 
                      className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-6 relative overflow-hidden"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-300 rounded-full -mr-16 -mt-16 opacity-20"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingBag className="w-5 h-5 text-gray-600" />
                          <p className="text-sm text-gray-700 font-bold uppercase tracking-wide">Purchase Amount</p>
                        </div>
                        <p className="text-5xl font-black text-gray-900">R{purchaseAmount}</p>
                      </div>
                    </motion.div>
                    
                    {/* Cashback */}
                    <motion.div 
                      className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 relative overflow-hidden"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-300 rounded-full -mr-16 -mt-16 opacity-30"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          <p className="text-sm text-green-700 font-bold uppercase tracking-wide">Cashback Earned</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-5xl font-black text-green-600">{formatCurrency(calculateCashback())}</p>
                          <span className="text-2xl text-green-600">🎉</span>
                        </div>
                        <p className="text-sm text-green-700 mt-2 font-medium">Goes toward medical cover</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={handleBack}
                      className="h-16 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </motion.button>
                    <motion.button
                      onClick={handleConfirmTransaction}
                      disabled={loading}
                      className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                      whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? undefined : '0 8px 20px rgba(34, 197, 94, 0.4)' }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-6 h-6" />
                          Confirm Sale
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Security Note */}
                  <motion.p 
                    className="text-center text-sm text-gray-500 mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    🔒 Transaction will be recorded securely
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && member && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                <motion.div
                  className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Check className="w-16 h-16 text-white" />
                </motion.div>
                <motion.h2 
                  className="text-4xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Transaction Complete! 🎉
                </motion.h2>
                <motion.p 
                  className="text-xl text-gray-600 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {`${member.first_name} ${member.last_name}`.trim()}
                </motion.p>
                <motion.p 
                  className="text-2xl font-bold text-green-600 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  earned {formatCurrency(calculateCashback())} cashback
                </motion.p>
                <motion.p 
                  className="text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Starting new transaction...
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {scannerActive && (
          <motion.div
            key="qr-scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4"
          >
            {/* Close Button */}
            <motion.button
              onClick={stopQRScanner}
              className="absolute top-6 right-6 z-10 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 text-white"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <QrCode className="w-8 h-8 text-green-400" />
                <h2 className="text-3xl font-bold">Scan QR Code</h2>
              </div>
              <p className="text-gray-300 text-lg">Position member's QR code in the frame</p>
            </motion.div>

            {/* Video Container */}
            <div className="relative w-full max-w-md aspect-square mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none">
                <div className="relative w-64 h-64">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                  
                  {/* Center crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-12 bg-green-400 opacity-50"></div>
                    <div className="w-12 h-1 bg-green-400 opacity-50 absolute"></div>
                  </div>
                  
                  {/* Animated scanning line */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-b from-green-400 to-transparent"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>

              {/* Vignette effect */}
              <div className="absolute inset-0 rounded-2xl shadow-2xl pointer-events-none" style={{
                boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.8)'
              }}></div>
            </div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white border border-white/20"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center text-black font-bold text-sm">1</div>
                  <p className="text-sm">Hold the QR code steady in front of the camera</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center text-black font-bold text-sm">2</div>
                  <p className="text-sm">Make sure the code is well-lit and in focus</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center text-black font-bold text-sm">3</div>
                  <p className="text-sm">The scanner will automatically detect the code</p>
                </div>
              </div>
            </motion.div>

            {/* Status Indicator */}
            <motion.div
              className="mt-6 flex items-center gap-2 text-green-400"
              animate={{ opacity: [0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm font-semibold">Scanning...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
