import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Notification, useNotification } from '../components/Notification';
import { normalizePhoneNumber, isValidMobileNumber } from '../utils/phoneValidation';

const BLUE = '#1a558b';

interface FormData {
  shop_name: string;
  cell_phone: string;
  email: string;
  address: string;
  postal_code: string;
  category: string;
  cashback_percent: string;
  responsible_person: string;
  pin_code: string;
}

export function AgentAddShop() {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const [step, setStep] = useState<'details' | 'agreement' | 'confirmation'>('details');
  const [form, setForm] = useState<FormData>({ 
    shop_name: '', 
    cell_phone: '', 
    email: '', 
    address: '', 
    postal_code: '',
    category: '',
    cashback_percent: '5',
    responsible_person: '',
    pin_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [partnerCreated, setPartnerCreated] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const agent = (() => { 
    try { 
      return JSON.parse(sessionStorage.getItem('currentAgent') || localStorage.getItem('currentAgent') || '{}'); 
    } catch { 
      return {}; 
    } 
  })();

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Initialize canvas when agreement step is reached
  useEffect(() => {
    if (step === 'agreement') {
      setTimeout(() => initializeCanvas(), 100);
    }
  }, [step]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cashback = parseFloat(form.cashback_percent);
    if (cashback < 3 || cashback > 40) {
      showError('Invalid Cashback', 'Cashback must be between 3% and 40%');
      return;
    }

    // Validate mobile number
    if (!isValidMobileNumber(form.cell_phone.trim())) {
      showError('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number (e.g., 060 296 2491)');
      return;
    }

    // Validate PIN
    if (!/^\d{6}$/.test(form.pin_code.trim())) {
      showError('Invalid PIN', 'PIN must be exactly 6 digits');
      return;
    }

    // Validate email is unique if provided
    if (form.email.trim()) {
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('email', form.email.trim())
        .single();

      if (existingPartner) {
        showError('Email Already Exists', 'This email is already registered as a partner. Please use a different email.');
        return;
      }
    }

    // Create partner record first
    setLoading(true);
    try {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .insert([{
          shop_name: form.shop_name.trim(),
          cell_phone: normalizePhoneNumber(form.cell_phone.trim()),
          email: form.email.trim() || null,
          address: form.address.trim(),
          postal_code: form.postal_code.trim(),
          category: form.category.trim() || null,
          cashback_percent: cashback,
          responsible_person: form.responsible_person.trim(),
          pin_code: form.pin_code.trim(),
          status: 'pending'
        }])
        .select()
        .single();

      if (partnerError) {
        if (partnerError.message.includes('duplicate key')) {
          showError('Duplicate Entry', 'This email or phone is already registered. Please use different contact details.');
        } else {
          throw partnerError;
        }
        return;
      }

      setPartnerCreated(partnerData);
      setStep('agreement');
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to create partner record');
    } finally {
      setLoading(false);
    }
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSignAgreement = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    setSignatureData(signatureDataUrl);
    setStep('confirmation');
  };

  const handleConfirmConnection = async () => {
    if (!partnerCreated || !signatureData) return;

    setLoading(true);
    try {
      // Upload signature to storage
      const timestamp = Date.now();
      const fileName = `partner-signatures/${partnerCreated.id}_${timestamp}.png`;
      
      const response = await fetch(signatureData);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, { upsert: false });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Update partner with signature URL
      const { error: updateError } = await supabase
        .from('partners')
        .update({ signature_url: publicUrl })
        .eq('id', partnerCreated.id);

      if (updateError) throw updateError;

      // Create partner-agent link with proof of signature
      const { error: linkError } = await supabase
        .from('partner_agent_links')
        .insert([{
          partner_id: partnerCreated.id,
          agent_id: agent.agent_id || agent.id,
          status: 'active'
        }]);

      if (linkError) throw linkError;

      showSuccess(
        'Partner Connected!',
        `${form.shop_name} has been successfully connected to your network with signed agreement proof.`
      );
      
      setTimeout(() => navigate('/agent/dashboard'), 2500);
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to complete connection');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setStep('details');
    setPartnerCreated(null);
    setSignatureData(null);
    setHasSignature(false);
  };

  const handleBackToAgreement = () => {
    setStep('agreement');
    setSignatureData(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-2xl">add_business</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {step === 'details' && 'Add Partner Shop'}
                {step === 'agreement' && 'Partner Agreement'}
                {step === 'confirmation' && 'Confirm Connection'}
              </h1>
              <p className="text-sm text-gray-600">
                {step === 'details' && 'Enter shop details'}
                {step === 'agreement' && 'Review and sign the agreement'}
                {step === 'confirmation' && 'Confirm the connection'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${step === 'details' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step === 'details' ? 'bg-blue-600' : 'bg-green-600'}`}>
                {step === 'details' ? '1' : '✓'}
              </div>
              <span className="text-sm font-semibold text-gray-700">Shop Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step !== 'details' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-3 ${step === 'agreement' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step === 'agreement' ? 'bg-blue-600' : step === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'}`}>
                {step === 'confirmation' ? '✓' : '2'}
              </div>
              <span className="text-sm font-semibold text-gray-700">Sign Agreement</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step === 'confirmation' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-3 ${step === 'confirmation' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step === 'confirmation' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="text-sm font-semibold text-gray-700">Confirm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* STEP 1: Shop Details */}
        {step === 'details' && (
        <form onSubmit={handleDetailsSubmit} className="space-y-6">
          {/* Shop Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>store</span>
              Shop Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="e.g. Pick n Pay Rosebank" 
                  value={form.shop_name} 
                  onChange={e => update('shop_name', e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  value={form.category} 
                  onChange={e => update('category', e.target.value)} 
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Grocery Store">Grocery Store</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Clothing Store">Clothing Store</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Hardware Store">Hardware Store</option>
                  <option value="Beauty Salon">Beauty Salon</option>
                  <option value="Barber Shop">Barber Shop</option>
                  <option value="Fuel Station">Fuel Station</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Butchery">Butchery</option>
                  <option value="Liquor Store">Liquor Store</option>
                  <option value="Convenience Store">Convenience Store</option>
                  <option value="Furniture Store">Furniture Store</option>
                  <option value="Bookstore">Bookstore</option>
                  <option value="Sports Store">Sports Store</option>
                  <option value="Toy Store">Toy Store</option>
                  <option value="Pet Store">Pet Store</option>
                  <option value="Garden Center">Garden Center</option>
                  <option value="Medical Practice">Medical Practice</option>
                  <option value="Dental Practice">Dental Practice</option>
                  <option value="Optometrist">Optometrist</option>
                  <option value="Fitness Center">Fitness Center</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    placeholder="shop@email.co.za" 
                    value={form.email} 
                    onChange={e => update('email', e.target.value)} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Business email address</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Physical Address <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="e.g. 123 Voortrekker Road, Bellville, Cape Town, Western Cape" 
                  value={form.address} 
                  onChange={e => update('address', e.target.value)} 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">Format: Street Number, Street Name, Address Line 1, City, Province</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="e.g. 7530" 
                  value={form.postal_code} 
                  onChange={e => update('postal_code', e.target.value)} 
                  maxLength="4"
                  pattern="\d{4}"
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">4-digit South African postal code</p>
              </div>
            </div>
          </div>

          {/* Personal Contact Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>person</span>
              Personal Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Manager name" 
                  value={form.responsible_person} 
                  onChange={e => update('responsible_person', e.target.value)} 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">Name of person responsible for the shop</p>
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>login</span>
              Login Credentials
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Important:</strong> These credentials will be used by the partner to log into the Plus1 Rewards system.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cell Phone Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="0812345678" 
                  value={form.cell_phone} 
                  onChange={e => update('cell_phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  maxLength="10"
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">10-digit cell phone number for system login and contact</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  PIN (6 digits) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="000000" 
                  value={form.pin_code} 
                  onChange={e => update('pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  maxLength="6"
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">6-digit PIN for system login</p>
              </div>
            </div>
          </div>

          {/* Cashback Configuration */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>percent</span>
              Cashback Configuration
            </h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cashback Percentage (3% - 40%) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="5" 
                min="3" 
                max="40" 
                step="0.5" 
                value={form.cashback_percent} 
                onChange={e => update('cashback_percent', e.target.value)} 
                required 
              />
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Split breakdown:</strong> Of {form.cashback_percent}% cashback:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>• 1% → Platform fee</li>
                  <li>• 1% → Your commission</li>
                  <li>• {Math.max(parseFloat(form.cashback_percent || '0') - 2, 1)}% → Member reward</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Commission Info */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-cyan-600 text-2xl">info</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Your Commission</h3>
                <p className="text-sm text-gray-700">
                  You earn <strong>1%</strong> of every transaction made by members at this partner. 
                  Commissions are paid monthly (minimum R500 payout threshold).
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-lg"
            style={{ backgroundColor: BLUE }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Creating Partner Record...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">arrow_forward</span>
                Continue to Agreement
              </>
            )}
          </button>
        </form>
        )}

        {/* STEP 2: Agreement & Signature */}
        {step === 'agreement' && partnerCreated && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Plus1 Rewards Partner Agreement</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm max-h-96 overflow-y-auto mb-6">
                <div className="space-y-2">
                  <p className="font-semibold">Partner: {form.shop_name}</p>
                  <p className="font-semibold">Contact: {form.responsible_person}</p>
                  <p className="font-semibold">Cashback Rate: {form.cashback_percent}%</p>
                </div>

                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <h4 className="font-bold">1. Cashback Structure</h4>
                  <p>You agree to provide {form.cashback_percent}% cashback on qualifying purchases, distributed as follows:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>1% - Plus1 Rewards system fee</li>
                    <li>1% - Sales agent commission</li>
                    <li>{Math.max(parseFloat(form.cashback_percent || '0') - 2, 1)}% - Member cashback benefit</li>
                  </ul>
                </div>

                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <h4 className="font-bold">2. Payment Terms</h4>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Cashback liability is invoiced monthly on the 28th</li>
                    <li>Payment is due within 7 days of invoice date</li>
                    <li>Late payments may result in account suspension</li>
                    <li>All payments must be made via EFT to the designated account</li>
                  </ul>
                </div>

                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <h4 className="font-bold">3. Partner Obligations</h4>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Process all member transactions accurately and honestly</li>
                    <li>Verify member identity before processing transactions</li>
                    <li>Maintain accurate records of all transactions</li>
                    <li>Report any suspicious activity immediately</li>
                    <li>Comply with all Plus1 Rewards policies and procedures</li>
                  </ul>
                </div>

                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <h4 className="font-bold">4. Account Approval</h4>
                  <p>Your account requires admin approval before activation. You will be notified via email once approved.</p>
                </div>

                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <h4 className="font-bold">5. Termination</h4>
                  <p>Either party may terminate this agreement with 30 days written notice. Outstanding invoices remain payable.</p>
                </div>

                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <h4 className="font-bold">6. Data Protection</h4>
                  <p>You agree to protect member data and use it only for Plus1 Rewards transactions.</p>
                </div>
              </div>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <label className="block text-sm font-bold" style={{ color: BLUE }}>
                  Digital Signature *
                </label>
                <p className="text-xs text-gray-600">Sign below using your mouse or touchscreen</p>
                <div className="border-2 rounded-xl overflow-hidden bg-white" style={{ borderColor: BLUE }}>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none block"
                    style={{ touchAction: 'none', display: 'block' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Clear Signature
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                Back to Details
              </button>
              <button
                type="button"
                onClick={handleSignAgreement}
                disabled={!hasSignature}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: hasSignature ? BLUE : '#9ca3af',
                  cursor: hasSignature ? 'pointer' : 'not-allowed'
                }}
              >
                Sign & Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 'confirmation' && partnerCreated && signatureData && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">check</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900 mb-1">Agreement Signed Successfully</h3>
                  <p className="text-sm text-green-800">
                    Your digital signature has been captured and will serve as proof of this partnership agreement.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Connection</h2>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2"><strong>Shop Name:</strong> {form.shop_name}</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Contact Person:</strong> {form.responsible_person}</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Phone:</strong> {form.cell_phone}</p>
                  <p className="text-sm text-gray-700"><strong>Cashback Rate:</strong> {form.cashback_percent}%</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>✓ Signature Proof:</strong> The partner's digital signature has been captured and stored as proof of this recruitment agreement.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>Next Step:</strong> This partner account is pending admin approval. Once approved, they can start processing member transactions and you'll earn commissions.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" className="w-5 h-5 rounded" required />
                  <span className="text-sm text-gray-700">
                    I confirm that <strong>{form.responsible_person}</strong> from <strong>{form.shop_name}</strong> has digitally signed this agreement and is connected to my agent account.
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToAgreement}
                className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                Back to Signature
              </button>
              <button
                type="button"
                onClick={handleConfirmConnection}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: BLUE }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Confirming...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Confirm & Complete
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
