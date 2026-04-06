// src/components/partner/pages/Dashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Phone, DollarSign, User, CheckCircle, XCircle, Loader, QrCode, Camera, UserPlus } from 'lucide-react';
import jsQR from 'jsqr';

interface Partner {
  id: string;
  shop_name: string;
  name: string;
  status: string;
  cashback_percent: number;
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

interface Member {
  id: string;
  full_name: string;
  phone: string;
  status: string;
}

type ActiveTab = 'sales' | 'register';

export default function Dashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ transactionCount: 0, cashbackLiability: 0 });
  const [latestInvoice, setLatestInvoice] = useState<LatestInvoice | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<string>('Not assigned');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('sales');
  
  // Sales state
  const [searchMethod, setSearchMethod] = useState<'phone' | 'qr'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  
  // Registration state
  const [showPin, setShowPin] = useState(false);
  const [regFormData, setRegFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    terms: false
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (showScanner) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showScanner]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        // Start scanning for QR codes
        startQRScanning();
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
    stopQRScanning();
  };

  const startQRScanning = () => {
    if (scanIntervalRef.current) return;
    
    scanIntervalRef.current = window.setInterval(() => {
      scanQRCode();
    }, 300); // Scan every 300ms
  };

  const stopQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      // QR code detected!
      console.log('QR Code detected:', code.data);
      setQrCode(code.data);
      stopCamera();
      setShowScanner(false);
      // Automatically search for the member
      searchByQRCode(code.data);
    }
  };

  const searchByQRCode = async (qrCodeValue: string) => {
    console.log('Searching for member with QR code:', qrCodeValue);
    setSearchLoading(true);
    setError('');
    setMember(null);

    try {
      // First, try exact QR code match
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, status, qr_code')
        .eq('qr_code', qrCodeValue)
        .maybeSingle();

      console.log('Exact QR search result:', { data, error });

      // If exact match found, validate and return
      if (data && !error) {
        if (data.status !== 'active') {
          setError('Member account is not active');
          return;
        }

        // Check if member is connected to this partner
        if (partner) {
          const { data: connectionData, error: connectionError } = await supabase
            .from('member_partner_connections')
            .select('id, status')
            .eq('member_id', data.id)
            .eq('partner_id', partner.id)
            .eq('status', 'active')
            .maybeSingle();

          if (connectionError || !connectionData) {
            setError(`${data.full_name} is not connected to your store yet. Please ask them to connect first via the Find Partners page.`);
            return;
          }
        }

        setMember(data);
        return;
      }

      // If no exact match, try extracting phone from PLUS1 format: PLUS1-{phone}-{timestamp}
      const phoneMatch = qrCodeValue.match(/PLUS1-(\d+)-/);
      if (phoneMatch && phoneMatch[1]) {
        const phone = phoneMatch[1];
        console.log('Extracted phone from QR, searching by phone:', phone);
        
        const { data: phoneData, error: phoneError } = await supabase
          .from('members')
          .select('id, full_name, phone, status')
          .eq('phone', phone)
          .maybeSingle();

        if (phoneError || !phoneData) {
          console.log('Phone search failed:', phoneError);
          setError('Member not found with this QR code');
          return;
        }

        if (phoneData.status !== 'active') {
          setError('Member account is not active');
          return;
        }

        // Check if member is connected to this partner
        if (partner) {
          const { data: connectionData, error: connectionError } = await supabase
            .from('member_partner_connections')
            .select('id, status')
            .eq('member_id', phoneData.id)
            .eq('partner_id', partner.id)
            .eq('status', 'active')
            .maybeSingle();

          if (connectionError || !connectionData) {
            setError(`${phoneData.full_name} is not connected to your store yet. Please ask them to connect first via the Find Partners page.`);
            return;
          }
        }

        setMember(phoneData);
        return;
      }

      // No match found with either method
      console.log('No match found for QR code:', qrCodeValue);
      setError('Member not found with this QR code. Please ensure the member is registered and the QR code is valid.');
    } catch (err) {
      console.error('Error searching for member:', err);
      setError('Error searching for member');
    } finally {
      setSearchLoading(false);
    }
  };

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
        .select('id, shop_name, status, cashback_percent')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;
      setPartner({ ...partnerData, name: partnerData.shop_name });

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('purchase_amount, cashback_percent')
        .eq('partner_id', partnerId)
        .gte('created_at', firstDayOfMonth);

      if (!txError && transactions) {
        const count = transactions.length;
        // Calculate total cashback liability (what partner owes)
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
          .select('id, user_id')
          .eq('id', agentLink.agent_id)
          .single();

        if (agentData) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', agentData.user_id)
            .single();

          if (userData) {
            setAssignedAgent(userData.full_name);
          }
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sales handlers
  const handleSearchByPhone = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setSearchLoading(true);
    setError('');
    setMember(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, status')
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

      // Check if member is connected to this partner
      if (partner) {
        const { data: connectionData, error: connectionError } = await supabase
          .from('member_partner_connections')
          .select('id, status')
          .eq('member_id', data.id)
          .eq('partner_id', partner.id)
          .eq('status', 'active')
          .maybeSingle();

        if (connectionError || !connectionData) {
          setError(`${data.full_name} is not connected to your store yet. Please ask them to connect first via the Find Partners page.`);
          return;
        }
      }

      setMember(data);
    } catch (err) {
      setError('Error searching for member');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchByQR = async () => {
    if (!qrCode) {
      setError('Please enter a QR code');
      return;
    }

    setSearchLoading(true);
    setError('');
    setMember(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, status')
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

      // Check if member is connected to this partner
      if (partner) {
        const { data: connectionData, error: connectionError } = await supabase
          .from('member_partner_connections')
          .select('id, status')
          .eq('member_id', data.id)
          .eq('partner_id', partner.id)
          .eq('status', 'active')
          .maybeSingle();

        if (connectionError || !connectionData) {
          setError(`${data.full_name} is not connected to your store yet. Please ask them to connect first via the Find Partners page.`);
          return;
        }
      }

      setMember(data);
      setShowScanner(false);
    } catch (err) {
      setError('Error searching for member');
    } finally {
      setSearchLoading(false);
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

      // Get member's first cover plan (by creation order)
      const { data: memberCoverPlans } = await supabase
        .from('member_cover_plans')
        .select('id, funded_amount, target_amount, status, overflow_balance')
        .eq('member_id', member.id)
        .order('creation_order', { ascending: true });

      if (memberCoverPlans && memberCoverPlans.length > 0) {
        const firstPlan = memberCoverPlans[0];
        const currentFunded = Number(firstPlan.funded_amount);
        const targetAmount = Number(firstPlan.target_amount);
        const currentOverflow = Number(firstPlan.overflow_balance || 0);
        
        // If plan is already active, all cashback goes to overflow
        if (firstPlan.status === 'active') {
          const newOverflow = currentOverflow + memberAmount;
          
          await supabase
            .from('member_cover_plans')
            .update({
              overflow_balance: newOverflow
            })
            .eq('id', firstPlan.id);

          await supabase
            .from('cover_plan_wallet_entries')
            .insert({
              member_id: member.id,
              member_cover_plan_id: firstPlan.id,
              transaction_id: transaction.id,
              entry_type: 'cashback_added',
              amount: memberAmount,
              balance_after: newOverflow
            });
        } 
        // If plan is in_progress, check if this cashback will activate it
        else if (firstPlan.status === 'in_progress') {
          const totalCashback = currentFunded + memberAmount;
          
          // Check if we have enough to activate the plan
          if (totalCashback >= targetAmount) {
            // Deduct plan amount, rest goes to overflow
            const overflow = totalCashback - targetAmount;
            
            await supabase
              .from('member_cover_plans')
              .update({
                funded_amount: targetAmount,
                overflow_balance: overflow,
                status: 'active',
                active_from: new Date().toISOString(),
                active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('id', firstPlan.id);

            // Record plan activation
            await supabase
              .from('cover_plan_wallet_entries')
              .insert({
                member_id: member.id,
                member_cover_plan_id: firstPlan.id,
                transaction_id: transaction.id,
                entry_type: 'cashback_added',
                amount: targetAmount,
                balance_after: targetAmount
              });

            // Record overflow if any
            if (overflow > 0) {
              await supabase
                .from('cover_plan_wallet_entries')
                .insert({
                  member_id: member.id,
                  member_cover_plan_id: firstPlan.id,
                  transaction_id: transaction.id,
                  entry_type: 'cashback_added',
                  amount: overflow,
                  balance_after: overflow
                });
            }
          } else {
            // Not enough to activate, just add to funded amount
            await supabase
              .from('member_cover_plans')
              .update({
                funded_amount: totalCashback
              })
              .eq('id', firstPlan.id);

            await supabase
              .from('cover_plan_wallet_entries')
              .insert({
                member_id: member.id,
                member_cover_plan_id: firstPlan.id,
                transaction_id: transaction.id,
                entry_type: 'cashback_added',
                amount: memberAmount,
                balance_after: totalCashback
              });
          }
        }
      }

      setSuccess(`Sale completed! ${member.full_name} earned R${memberAmount.toFixed(2)} cashback`);
      setPhoneNumber('');
      setQrCode('');
      setPurchaseAmount('');
      setMember(null);
      loadDashboardData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to process transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Registration handlers
  const handleRegInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setRegFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regFormData.terms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (regFormData.pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (!/^\d{6}$/.test(regFormData.pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    const phoneDigits = regFormData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);

    try {
      const { data: existingUser } = await supabase
        .from('users').select('id').eq('mobile_number', phoneDigits).maybeSingle();

      if (existingUser) {
        setError('This phone number is already registered');
        setSubmitting(false);
        return;
      }

      const { data: existingMember } = await supabase
        .from('members').select('id').eq('phone', phoneDigits).maybeSingle();

      if (existingMember) {
        setError('This phone number is already registered');
        setSubmitting(false);
        return;
      }

      const { data: defaultPlan, error: planError } = await supabase
        .from('cover_plans')
        .select('id, plan_name, monthly_target_amount')
        .eq('status', 'active')
        .eq('monthly_target_amount', 390)
        .limit(1)
        .single();

      if (planError || !defaultPlan) {
        setError('System error: Default cover plan not found. Please contact support.');
        setSubmitting(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          role: 'member',
          full_name: regFormData.name,
          mobile_number: phoneDigits,
          pin_code: regFormData.pin,
          status: 'active'
        })
        .select()
        .single();

      if (userError) throw userError;

      const qrCodeGen = `PLUS1-${phoneDigits}-${Date.now()}`;

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: userData.id,
          full_name: regFormData.name,
          phone: phoneDigits,
          qr_code: qrCodeGen,
          status: 'active'
        })
        .select()
        .single();

      if (memberError) throw memberError;

      const { error: coverPlanError } = await supabase
        .from('member_cover_plans')
        .insert({
          member_id: memberData.id,
          cover_plan_id: defaultPlan.id,
          creation_order: 1,
          target_amount: defaultPlan.monthly_target_amount,
          funded_amount: 0,
          status: 'in_progress'
        });

      if (coverPlanError) throw coverPlanError;

      setSuccess(`Member ${regFormData.name} registered successfully!`);
      setRegFormData({ name: '', phone: '', pin: '', terms: false });

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      if (err.message?.includes('already registered') || err.message?.includes('duplicate')) {
        setError('This phone number is already registered');
      } else {
        setError('Registration failed: ' + err.message);
      }
    } finally {
      setSubmitting(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full px-2 md:px-0">
      {/* LEFT SIDE - Sales & Registration */}
      <div className="space-y-3 md:space-y-4">
        {/* Tab Switcher */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('sales');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 md:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-base ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Sales Terminal</span>
            <span className="sm:hidden">Sales</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 md:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-base ${
              activeTab === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Register Member</span>
            <span className="sm:hidden">Register</span>
          </button>
          <button
            onClick={() => navigate('/partner/support')}
            className="py-2 md:py-3 px-3 md:px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-base bg-gray-50 text-gray-600 hover:bg-gray-100"
            title="Get Help & Support"
          >
            <span className="material-symbols-outlined text-lg">help</span>
            <span className="hidden sm:inline">Help</span>
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-xs md:text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-xs md:text-sm">{error}</p>
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-3 md:space-y-4">
            {/* Search Method Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4">
              <div className="flex gap-2 mb-3 md:mb-4">
                <button
                  onClick={() => {
                    setSearchMethod('phone');
                    setShowScanner(false);
                    setMember(null);
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm ${
                    searchMethod === 'phone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Phone className="w-3 h-3 md:w-4 md:h-4" />
                  Phone
                </button>
                <button
                  onClick={() => {
                    setSearchMethod('qr');
                    setMember(null);
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm ${
                    searchMethod === 'qr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </button>
              </div>

              {/* Phone Search */}
              {searchMethod === 'phone' && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Member Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="0812345678"
                        className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-xs md:text-sm"
                        maxLength={10}
                      />
                    </div>
                    <button
                      onClick={handleSearchByPhone}
                      disabled={searchLoading || phoneNumber.length !== 10}
                      className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs md:text-sm whitespace-nowrap"
                    >
                      {searchLoading ? <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : 'Search'}
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code Search */}
              {searchMethod === 'qr' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                      Member QR Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <QrCode className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                        <input
                          type="text"
                          value={qrCode}
                          onChange={(e) => setQrCode(e.target.value)}
                          placeholder="PLUS1-..."
                          className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-xs md:text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSearchByQR}
                        disabled={searchLoading || !qrCode}
                        className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs md:text-sm whitespace-nowrap"
                      >
                        {searchLoading ? <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : 'Search'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowScanner(!showScanner)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs md:text-sm"
                  >
                    <Camera className="w-3 h-3 md:w-4 md:h-4" />
                    {showScanner ? 'Close Scanner' : 'Open Camera Scanner'}
                  </button>

                  {showScanner && (
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-48 md:h-64 object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/50 rounded-lg"></div>
                          <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-white/90 px-2 md:px-3 py-1 rounded-full">
                            <p className="text-xs font-semibold text-gray-900">Scanning...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Member Info & Transaction */}
            {member && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 space-y-3 md:space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs md:text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-gray-600">{member.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Purchase Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-base md:text-lg">R</span>
                    <input
                      type="number"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-7 md:pl-10 pr-2 md:pr-3 py-2 md:py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg md:text-xl font-bold"
                    />
                  </div>
                  {purchaseAmount && parseFloat(purchaseAmount) > 0 && partner && (
                    <p className="mt-2 text-xs md:text-sm text-gray-600">
                      Member will earn: R{((parseFloat(purchaseAmount) * (partner.cashback_percent - 2)) / 100).toFixed(2)}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmitTransaction}
                  disabled={submitting || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                  className="w-full py-2 md:py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      <span className="hidden sm:inline">Processing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Complete Sale</span>
                      <span className="sm:hidden">Complete</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* REGISTER TAB */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Register New Member</h2>
            
            <form onSubmit={handleRegSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={regFormData.name}
                    onChange={handleRegInputChange}
                    placeholder="Sarah Dlamini"
                    className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm md:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Cell Phone Number (10 digits)
                </label>
                <div className="relative">
                  <Phone className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={regFormData.phone}
                    onChange={handleRegInputChange}
                    placeholder="082 555 1234"
                    className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm md:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  6-Digit PIN
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base md:text-lg">
                    pin
                  </span>
                  <input
                    type={showPin ? 'text' : 'password'}
                    name="pin"
                    value={regFormData.pin}
                    onChange={handleRegInputChange}
                    placeholder="Enter 6-digit PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full pl-7 md:pl-9 pr-10 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm md:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-base md:text-lg">
                      {showPin ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Member will use this PIN with their phone number to log in
                </p>
              </div>

              <label className="flex items-start gap-2 text-xs md:text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={regFormData.terms}
                  onChange={handleRegInputChange}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <span>
                  I confirm the member agrees to the Terms of Service and Privacy Policy
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 md:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Creating Account...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Create Member Account</span>
                    <span className="sm:hidden">Create Account</span>
                    <span className="material-symbols-outlined text-base md:text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Dashboard Stats */}
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Welcome back, {partner?.shop_name || partner?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">receipt</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl">{monthlyStats.transactionCount}</p>
                <p className="text-gray-600 text-xs md:text-sm">This Month's Transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">payments</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl">R{monthlyStats.cashbackLiability.toFixed(2)}</p>
                <p className="text-gray-600 text-xs md:text-sm">Cashback Liability</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">support_agent</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl truncate">{assignedAgent}</p>
                <p className="text-gray-600 text-xs md:text-sm">Assigned Agent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        {latestInvoice && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Latest Invoice</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-600 text-xs">Invoice Amount</p>
                <p className="text-gray-900 font-bold">R{latestInvoice.amount.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600 text-xs">Due Date</p>
                <p className="text-gray-900 font-semibold text-sm">
                  {new Date(latestInvoice.dueDate).toLocaleDateString('en-ZA')}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-xs">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[#1a558b] text-lg">notifications</span>
            Important Notices
          </h3>
          <ul className="space-y-1 text-xs text-gray-700">
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

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {/* Fullscreen Sales Terminal Button - Prominent */}
            <button
              onClick={() => navigate('/partner/sales-terminal')}
              className="col-span-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
            >
              <DollarSign className="w-6 h-6" />
              Open Sales Terminal
            </button>

            <button
              onClick={() => navigate('/partner/transaction-history')}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              View Transactions
            </button>

            <button
              onClick={() => navigate('/partner/monthly-invoice')}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              View Invoices
            </button>

            <button
              onClick={() => navigate('/partner/support')}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-lg">account_balance</span>
              Do Instant EFT
            </button>

            <button
              onClick={() => navigate('/partner/support')}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-lg">support_agent</span>
              Contact Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
