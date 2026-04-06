// plus1-rewards/src/pages/AgentRegister.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import { AuthInput, AuthButton, AuthError, AuthLink } from '../components/auth/AuthComponents';
import { Notification, useNotification } from '../components/Notification';
import AgentDigitalSignature from '../components/AgentDigitalSignature';

const BLUE = '#1a558b';
const BLUE_LIGHT = 'rgba(26,85,139,0.08)';

export default function AgentRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const { notification, showSuccess, hideNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    idNumber: '',
    mobileNumber: '',
    email: '',
    pin: '',
    confirmPin: '',
    documentFile: null as File | null,
    agreementAccepted: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;
    const checked = target.checked;
    const files = target.files;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value 
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.surname.trim()) {
      setError('Surname is required');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setError('ID number is required');
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
    if (!formData.documentFile) {
      setError('Please upload your ID document');
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
      setError('You must accept the Sales Agent Agreement');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2);
      } else if (currentStep === 2 && validateStep2()) {
        // Check for duplicate phone number in agents table
        const cleanPhone = formData.mobileNumber.replace(/\D/g, '');
        const { data: existingPhone } = await supabase
          .from('agents')
          .select('id')
          .eq('mobile_number', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          setError('This mobile number is already registered');
          setIsSubmitting(false);
          return;
        }

        // Check for duplicate email
        const { data: existingEmail } = await supabase
          .from('agents')
          .select('id')
          .eq('email', formData.email.trim())
          .maybeSingle();

        if (existingEmail) {
          setError('This email is already registered');
          setIsSubmitting(false);
          return;
        }

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
    setShowSignature(false);
    setIsSubmitting(true);

    try {
      const cleanPhone = formData.mobileNumber.replace(/\D/g, '');

      // Check if mobile number already exists
      const { data: existingPhone } = await supabase
        .from('agents')
        .select('id')
        .eq('mobile_number', cleanPhone)
        .maybeSingle();

      if (existingPhone) {
        setError('This mobile number is already registered');
        setIsSubmitting(false);
        return;
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('agents')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingEmail) {
        setError('This email is already registered');
        setIsSubmitting(false);
        return;
      }

      // Upload ID document to storage
      const idDocBlob = formData.documentFile ? await fetch(URL.createObjectURL(formData.documentFile)).then(r => r.blob()) : null;
      let idDocFileName = null;
      
      if (idDocBlob) {
        idDocFileName = `agent-documents/${Date.now()}_${formData.documentFile?.name}`;
        const { error: idUploadError } = await supabase.storage
          .from('documents')
          .upload(idDocFileName, idDocBlob, {
            upsert: false
          });

        if (idUploadError) {
          console.error('ID document upload error:', idUploadError);
        }
      }

      // Upload signature to storage
      const signatureBlob = await fetch(signatureDataUrl).then(r => r.blob());
      const signatureFileName = `agent-signatures/${Date.now()}_signature.png`;
      
      let signatureStoragePath = null;
      try {
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(signatureFileName, signatureBlob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Signature upload error:', uploadError);
          setError('Failed to upload signature. Please try again.');
          setIsSubmitting(false);
          return;
        } else {
          signatureStoragePath = signatureFileName;
          console.log('Signature uploaded successfully:', signatureFileName);
        }
      } catch (uploadException) {
        console.error('Signature upload exception:', uploadException);
        setError('Failed to upload signature. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Create agent record directly in agents table
      const { error: agentError } = await supabase
        .from('agents')
        .insert({
          full_name: `${formData.firstName} ${formData.surname}`,
          mobile_number: cleanPhone,
          pin_code: formData.pin,
          email: formData.email,
          id_number: formData.idNumber,
          agreement_file: signatureStoragePath,
          status: 'pending',
          role: 'agent'
        });

      if (agentError) throw agentError;

      showSuccess(
        'Registration Submitted Successfully!',
        'Your application is pending admin approval. You will be notified once approved.'
      );

      setTimeout(() => {
        navigate('/agent/login');
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Personal Info', 'Contact & Documents', 'Security & Agreement'];

  return (
    <AuthLayout
      portalIcon="assignment_ind"
      portalName="Agent Portal"
      headline={<>Build your <span style={{ color: '#93c5fd' }}>sales</span> empire.</>}
      subheadline="Become a +1 Rewards sales agent and earn recurring commissions by connecting local businesses with our platform."
      stats={[
        { value: '1%', label: 'Commission Rate' },
        { value: 'Monthly', label: 'Payouts' },
        { value: '∞', label: 'Earning Potential' },
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
          <h2 className="text-2xl font-black text-gray-900">Become an Agent</h2>
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
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <>
              <AuthInput
                label="First Name"
                icon="person"
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Michael"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />

              <AuthInput
                label="Surname"
                icon="person"
                id="surname"
                name="surname"
                type="text"
                placeholder="Johnson"
                value={formData.surname}
                onChange={handleInputChange}
                required
              />

              <AuthInput
                label="ID Number"
                icon="badge"
                id="idNumber"
                name="idNumber"
                type="text"
                placeholder="8001015009087"
                value={formData.idNumber}
                onChange={handleInputChange}
                required
              />

              <AuthButton type="button" onClick={handleNext} loading={isSubmitting} loadingText="Checking...">
                Next Step →
              </AuthButton>
            </>
          )}

          {/* Step 2: Contact & Documents */}
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
                placeholder="agent@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              {/* ID Document upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Upload ID / Passport / Driver's License</label>
                <label
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-all"
                  style={{ borderColor: formData.documentFile ? BLUE : '#e5e7eb', backgroundColor: formData.documentFile ? BLUE_LIGHT : '#fafafa' }}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ color: formData.documentFile ? BLUE : '#9ca3af' }}>upload_file</span>
                  <span className="text-sm font-semibold" style={{ color: formData.documentFile ? BLUE : '#6b7280' }}>
                    {formData.documentFile ? formData.documentFile.name : 'Click to upload file'}
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG or PDF — max 5MB</span>
                  <input type="file" name="documentFile" accept="image/*,.pdf" onChange={handleInputChange} className="hidden" required />
                </label>
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
                  Sales Agent Agreement Summary
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• You earn 1% commission on total sales at every partner shop you register and manage.</li>
                  <li>• Commissions are calculated and paid out on a monthly basis.</li>
                  <li>• You are required to manage all partner and member functionality professionaly.</li>
                  <li>• Your account will be approved by an administrator before it becomes active.</li>
                  <li>• Please read and sign the agreement summary before final submission.</li>
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
          Already an agent?{' '}
          <AuthLink onClick={() => navigate('/agent/login')}>Sign In</AuthLink>
        </p>
      </div>

      {/* Digital Signature Popup */}
      {showSignature && (
        <AgentDigitalSignature
          agentName={`${formData.firstName} ${formData.surname}`}
          onSign={handleSignatureComplete}
          onCancel={() => setShowSignature(false)}
        />
      )}
    </AuthLayout>
  );
}
