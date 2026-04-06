// plus1-rewards/src/pages/PartnerRegister.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthError, AuthLink } from '../components/auth/AuthComponents';
import { Notification, useNotification } from '../components/Notification';
import DigitalSignature from '../components/DigitalSignature';

const BLUE = '#1a558b';
const BLUE_LIGHT = 'rgba(26,85,139,0.08)';

const CATEGORIES = [
  'Grocery Store',
  'Pharmacy',
  'Restaurant',
  'Clothing Store',
  'Hardware Store',
  'Fuel Station',
  'Bakery',
  'Butchery',
  'General Dealer',
  'Other'
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [cashbackPercent, setCashbackPercent] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const { notification, showSuccess, hideNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    category: '',
    responsiblePerson: '',
    mobileNumber: '',
    email: '',
    cashbackPercent: 3,
    pin: '',
    confirmPin: '',
    agreementAccepted: false,
    suppliers: [] as Array<{ name: string; contactPerson: string; phone: string; email: string }>
  });
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSupplierChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      suppliers: prev.suppliers.map((supplier, i) => 
        i === index ? { ...supplier, [field]: value } : supplier
      )
    }));
  };

  const addSupplier = () => {
    if (formData.suppliers.length < 3) {
      setFormData(prev => ({
        ...prev,
        suppliers: [...prev.suppliers, { name: '', contactPerson: '', phone: '', email: '' }]
      }));
      setExpandedSupplier(formData.suppliers.length);
    }
  };

  const removeSupplier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter((_, i) => i !== index)
    }));
    setExpandedSupplier(null);
  };

  const validateStep1 = () => {
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.responsiblePerson.trim()) {
      setError('Responsible person name is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const phoneDigits = formData.mobileNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email address is required');
      return false;
    }
    if (cashbackPercent < 3 || cashbackPercent > 40) {
      setError('Cashback percentage must be between 3% and 40%');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.pin.length !== 6 || !/^\d{6}$/.test(formData.pin)) {
      setError('PIN must be exactly 6 digits');
      return false;
    }
    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return false;
    }
    if (!formData.agreementAccepted) {
      setError('You must accept the Partner Agreement');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (currentStep === 1 && validateStep1()) {
        // Check for duplicate business name
        const { data: existingBusiness } = await supabase
          .from('partners')
          .select('id')
          .eq('shop_name', formData.businessName.trim())
          .maybeSingle();

        if (existingBusiness) {
          setError('A business with this name is already registered');
          setIsSubmitting(false);
          return;
        }

        setCurrentStep(2);
      } else if (currentStep === 2 && validateStep2()) {
        // Check for duplicate phone number in partners table
        const cleanPhone = formData.mobileNumber.replace(/\D/g, '');
        const { data: existingPhone } = await supabase
          .from('partners')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          setError('This mobile number is already registered');
          setIsSubmitting(false);
          return;
        }

        // Check for duplicate email
        const { data: existingEmail } = await supabase
          .from('partners')
          .select('id')
          .eq('email', formData.email.trim())
          .maybeSingle();

        if (existingEmail) {
          setError('This email is already registered');
          setIsSubmitting(false);
          return;
        }

        setFormData(prev => ({ ...prev, cashbackPercent }));
        setCurrentStep(3);
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      setError('Failed to validate information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep3()) return;

    // Show signature popup
    setShowSignature(true);
  };

  const handleSignatureComplete = async (signatureDataUrl: string) => {
    setSignatureData(signatureDataUrl);
    setShowSignature(false);
    setIsSubmitting(true);

    try {
      const cleanPhone = formData.mobileNumber.replace(/\D/g, '');

      // Check if mobile number already exists in partners table
      const { data: existingPhone } = await supabase
        .from('partners')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingPhone) {
        setError('This mobile number is already registered');
        setIsSubmitting(false);
        return;
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('partners')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingEmail) {
        setError('This email is already registered');
        setIsSubmitting(false);
        return;
      }

      // Generate a unique ID for the partner
      const partnerId = crypto.randomUUID();

      // Upload signature to storage
      const signatureBlob = await fetch(signatureDataUrl).then(r => r.blob());
      const signatureFileName = `partner-signatures/${partnerId}_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(signatureFileName, signatureBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error('Signature upload error:', uploadError);
        // Continue even if signature upload fails
      }

      // Create partner profile directly in partners table
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          id: partnerId,
          shop_name: formData.businessName,
          address: formData.address,
          category: formData.category,
          phone: cleanPhone,
          email: formData.email,
          cashback_percent: cashbackPercent,
          responsible_person: formData.responsiblePerson,
          status: 'pending',
          signature_url: uploadError ? null : signatureFileName,
          suppliers: formData.suppliers.filter(s => s.name.trim()).map((s, idx) => ({
            id: `supplier-${idx + 1}`,
            name: s.name,
            contact_person: s.contactPerson,
            phone: s.phone,
            email: s.email
          })),
          pin_code: formData.pin,
          full_name: formData.responsiblePerson,
          mobile_number: cleanPhone,
          role: 'partner',
          kyc_status: 'pending'
        });

      if (partnerError) throw partnerError;

      showSuccess(
        'Registration Submitted Successfully!',
        'Your application is pending admin approval. You will be notified once approved.'
      );

      setTimeout(() => {
        navigate('/partner/login');
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Business Details', 'Contact & Cashback', 'Security & Agreement'];

  return (
    <AuthLayout
      portalIcon="storefront"
      portalName="Partner Portal"
      headline={<>Join the <span style={{ color: '#93c5fd' }}>rewards</span> revolution.</>}
      subheadline="Partner with +1 Rewards to offer your customers life-changing healthcare benefits while growing your business."
      stats={[
        { value: 'Free', label: 'To Join' },
        { value: '3-40%', label: 'Cashback Range' },
        { value: '100%', label: 'Offline Ready' },
      ]}
    >
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-gray-900">Register Your Business</h2>
          <p className="text-sm text-gray-500 mt-1">Step {currentStep} of 3 — {steps[currentStep - 1]}</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div 
                className="h-1.5 rounded-full transition-all duration-300" 
                style={{ backgroundColor: i < currentStep ? BLUE : '#e5e7eb' }} 
              />
              <span 
                className="text-[10px] font-bold uppercase tracking-wider" 
                style={{ color: i < currentStep ? BLUE : '#9ca3af' }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Business Details */}
          {currentStep === 1 && (
            <>
              <AuthInput
                label="Business Name"
                icon="storefront"
                id="businessName"
                name="businessName"
                type="text"
                placeholder="ABC Supermarket"
                value={formData.businessName}
                onChange={handleInputChange}
                required
              />

              <AuthInput
                label="Physical Address"
                icon="location_on"
                id="address"
                name="address"
                type="text"
                placeholder="123 Main Street, Cape Town"
                value={formData.address}
                onChange={handleInputChange}
                required
              />

              <div>
                <label 
                  htmlFor="category"
                  className="block text-xs font-bold mb-2"
                  style={{ color: BLUE }}
                >
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">category</span>
                    Business Category
                  </span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm"
                  style={{ borderColor: BLUE, backgroundColor: '#f5f8fc' }}
                  required
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <AuthInput
                label="Responsible Person"
                icon="person"
                id="responsiblePerson"
                name="responsiblePerson"
                type="text"
                placeholder="John Doe"
                value={formData.responsiblePerson}
                onChange={handleInputChange}
                required
              />

              <AuthButton type="button" onClick={handleNext} loading={isSubmitting} loadingText="Checking...">
                Next Step →
              </AuthButton>
            </>
          )}

          {/* Step 2: Contact & Cashback */}
          {currentStep === 2 && (
            <>
              <AuthInput
                label="Cell Phone Number (10 digits)"
                icon="phone"
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                placeholder="082 555 1234"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
              />

              <AuthInput
                label="Email Address"
                icon="email"
                id="email"
                name="email"
                type="email"
                placeholder="shop@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: BLUE }}>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">percent</span>
                    Cashback Percentage (3% - 40%)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="3"
                    max="40"
                    value={cashbackPercent}
                    onChange={(e) => setCashbackPercent(Number(e.target.value))}
                    className="flex-1 cashback-slider"
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: `linear-gradient(to right, ${BLUE} 0%, ${BLUE} ${((cashbackPercent - 3) / 37) * 100}%, #e5e7eb ${((cashbackPercent - 3) / 37) * 100}%, #e5e7eb 100%)`,
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div 
                    className="w-20 text-center py-2 rounded-xl font-black text-xl"
                    style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}
                  >
                    {cashbackPercent}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Split: 1% system, 1% agent, {cashbackPercent - 2}% to member
                </p>
              </div>

              <style>{`
                .cashback-slider::-webkit-slider-thumb {
                  appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: white;
                  border: 4px solid ${BLUE};
                  cursor: pointer;
                  box-shadow: 0 4px 12px rgba(26, 85, 139, 0.3);
                  transition: all 0.2s ease;
                }
                
                .cashback-slider::-webkit-slider-thumb:hover {
                  transform: scale(1.15);
                  box-shadow: 0 6px 16px rgba(26, 85, 139, 0.4);
                }
                
                .cashback-slider::-webkit-slider-thumb:active {
                  transform: scale(1.05);
                }
                
                .cashback-slider::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: white;
                  border: 4px solid ${BLUE};
                  cursor: pointer;
                  box-shadow: 0 4px 12px rgba(26, 85, 139, 0.3);
                  transition: all 0.2s ease;
                }
                
                .cashback-slider::-moz-range-thumb:hover {
                  transform: scale(1.15);
                  box-shadow: 0 6px 16px rgba(26, 85, 139, 0.4);
                }
                
                .cashback-slider::-moz-range-thumb:active {
                  transform: scale(1.05);
                }
              `}</style>

              {/* Suppliers Section */}
              <div className="pt-6 border-t-2" style={{ borderColor: BLUE_LIGHT }}>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold" style={{ color: BLUE }}>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      Suppliers (Optional - Up to 3)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={addSupplier}
                    disabled={formData.suppliers.length >= 3}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: formData.suppliers.length >= 3 ? '#e5e7eb' : BLUE,
                      color: formData.suppliers.length >= 3 ? '#9ca3af' : 'white',
                      cursor: formData.suppliers.length >= 3 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Supplier
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Add suppliers you get your products from that you'd like to sign up to Plus1 Rewards
                </p>

                {formData.suppliers.length === 0 ? (
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: BLUE_LIGHT, border: `2px dashed ${BLUE}` }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: BLUE }}>
                      local_shipping
                    </span>
                    <p className="text-sm font-semibold mt-2" style={{ color: BLUE }}>
                      No suppliers added yet
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Click "Add Supplier" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.suppliers.map((supplier, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden border-2" style={{ borderColor: BLUE }}>
                        {/* Dropdown Header */}
                        <button
                          type="button"
                          onClick={() => setExpandedSupplier(expandedSupplier === idx ? null : idx)}
                          className="w-full px-4 py-3 flex items-center justify-between transition-colors"
                          style={{
                            backgroundColor: expandedSupplier === idx ? BLUE : BLUE_LIGHT,
                            color: expandedSupplier === idx ? 'white' : BLUE
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <span className="material-symbols-outlined text-lg">
                              {supplier.name ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider">
                                Supplier {idx + 1}
                              </p>
                              <p className="text-sm font-semibold">
                                {supplier.name || 'Click to add details'}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined transition-transform" style={{
                            transform: expandedSupplier === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}>
                            expand_more
                          </span>
                        </button>

                        {/* Dropdown Content */}
                        {expandedSupplier === idx && (
                          <div className="px-4 py-4 bg-white border-t-2" style={{ borderColor: BLUE }}>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-bold mb-1.5 block" style={{ color: BLUE }}>
                                  Supplier Name *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g., ABC Wholesale"
                                  value={supplier.name}
                                  onChange={(e) => handleSupplierChange(idx, 'name', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border-2 text-sm font-medium"
                                  style={{ borderColor: BLUE }}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold mb-1.5 block" style={{ color: BLUE }}>
                                  Contact Person
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g., John Smith"
                                  value={supplier.contactPerson}
                                  onChange={(e) => handleSupplierChange(idx, 'contactPerson', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border-2 text-sm font-medium"
                                  style={{ borderColor: BLUE }}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-bold mb-1.5 block" style={{ color: BLUE }}>
                                    Phone
                                  </label>
                                  <input
                                    type="tel"
                                    placeholder="082 555 1234"
                                    value={supplier.phone}
                                    onChange={(e) => handleSupplierChange(idx, 'phone', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border-2 text-sm font-medium"
                                    style={{ borderColor: BLUE }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold mb-1.5 block" style={{ color: BLUE }}>
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    placeholder="supplier@example.com"
                                    value={supplier.email}
                                    onChange={(e) => handleSupplierChange(idx, 'email', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border-2 text-sm font-medium"
                                    style={{ borderColor: BLUE }}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSupplier(idx)}
                                className="w-full mt-3 px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-2 border-red-200"
                              >
                                <span className="flex items-center justify-center gap-1">
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                  Remove Supplier
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <AuthButton type="button" onClick={handleBack} variant="outline">
                  ← Back
                </AuthButton>
                <AuthButton type="button" onClick={handleNext} loading={isSubmitting} loadingText="Checking...">
                  Next Step →
                </AuthButton>
              </div>
            </>
          )}

          {/* Step 3: Security & Agreement */}
          {currentStep === 3 && (
            <>
              <AuthInput
                label="6-Digit PIN"
                icon="pin"
                id="pin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                placeholder="Enter 6-digit PIN"
                value={formData.pin}
                onChange={handleInputChange}
                maxLength={6}
                pattern="\d{6}"
                required
                suffix={
                  <button 
                    type="button" 
                    onClick={() => setShowPin(!showPin)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPin ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
              />

              <AuthInput
                label="Confirm 6-Digit PIN"
                icon="pin"
                id="confirmPin"
                name="confirmPin"
                type={showConfirmPin ? 'text' : 'password'}
                placeholder="Confirm your PIN"
                value={formData.confirmPin}
                onChange={handleInputChange}
                maxLength={6}
                pattern="\d{6}"
                required
                suffix={
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirmPin ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
              />

              <p className="text-xs text-gray-600">
                Your PIN will be used with your mobile number or email to log in
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-sm mb-2" style={{ color: BLUE }}>
                  Partner Agreement Summary
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• You will offer {cashbackPercent}% cashback to Plus1 members</li>
                  <li>• Cashback is invoiced monthly and payable by month end</li>
                  <li>• You agree to process member transactions accurately</li>
                  <li>• Your account requires admin approval before activation</li>
                  <li>• You will review and sign the full agreement before submission</li>
                </ul>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-gray-600 cursor-pointer">
                <div className="checkbox-container mt-0.5">
                  <input
                    type="checkbox"
                    id="agreement-cbx"
                    name="agreementAccepted"
                    checked={formData.agreementAccepted}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    required
                  />
                  <label htmlFor="agreement-cbx" className="check">
                    <svg width="18px" height="18px" viewBox="0 0 18 18">
                      <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z"></path>
                      <polyline points="1 9 7 14 15 4"></polyline>
                    </svg>
                  </label>
                </div>
                <span>
                  I have read and agree to the terms. I will provide my digital signature to complete registration.
                </span>
              </label>

              <div className="flex gap-3">
                <AuthButton type="button" onClick={handleBack} variant="outline">
                  ← Back
                </AuthButton>
                <AuthButton type="submit" loading={isSubmitting} loadingText="Submitting...">
                  Submit Application
                </AuthButton>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 pt-2">
          Already have an account?{' '}
          <AuthLink onClick={() => navigate('/partner/login')}>Sign In</AuthLink>
        </p>
      </div>

      {/* Digital Signature Popup */}
      {showSignature && (
        <DigitalSignature
          partnerName={formData.businessName}
          cashbackPercent={cashbackPercent}
          onSign={handleSignatureComplete}
          onCancel={() => setShowSignature(false)}
        />
      )}
    </AuthLayout>
  );
}
