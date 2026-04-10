import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PartnerChat from './PartnerChat';

interface Partner {
  id: string;
  shop_name: string;
  phone?: string;
  mobile_number?: string;
  email?: string;
}

export default function PartnerSupport() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disputeType, setDisputeType] = useState('other');
  const [description, setDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      
      if (!partnerSessionData) {
        navigate('/partner/login');
        return;
      }

      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id || session.user?.id;

      if (!partnerId) {
        navigate('/partner/login');
        return;
      }

      const { data: partnerData } = await supabase
        .from('partners')
        .select('id, shop_name, mobile_number, email')
        .eq('id', partnerId)
        .single();

      if (partnerData) {
        setPartner({
          ...partnerData,
          phone: partnerData.mobile_number
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('Please describe your issue');
      return;
    }

    setSubmitting(true);
    try {
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      
      if (!partnerSessionData) {
        navigate('/partner/login');
        return;
      }

      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id || session.user?.id;

      if (!partnerId) {
        navigate('/partner/login');
        return;
      }

      // Only include transaction_id if it's a valid UUID format
      const transactionIdValue = transactionId?.trim() 
        ? (transactionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? transactionId : null)
        : null;

      const { error } = await supabase
        .from('disputes')
        .insert([{
          partner_id: partnerId,
          dispute_type: disputeType,
          description: description.trim(),
          transaction_id: transactionIdValue,
          status: 'open'
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setSuccessMessage('Complaint submitted successfully! Our team will review it within 24 hours.');
      setDescription('');
      setTransactionId('');
      setDisputeType('other');

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f8fc]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-white bg-[#1a558b]">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Partner Support</h1>
              <p className="text-sm text-gray-600">Get help with your shop and transactions</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-green-600 flex-shrink-0">check_circle</span>
            <div>
              <p className="font-bold text-green-900">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Complaint Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">report_problem</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">File a Complaint</h2>
              <p className="text-sm text-gray-600">Report issues with transactions or your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmitDispute} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
              >
                <option value="missing_cashback">Missing Cashback</option>
                <option value="wrong_amount">Wrong Amount</option>
                <option value="unauthorized">Unauthorized Transaction</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID if applicable"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your issue in detail..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1a558b] hover:bg-[#1a558b]/90 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">{submitting ? 'hourglass_empty' : 'send'}</span>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-[#1a558b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#1a558b] text-3xl">support_agent</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Admin Support</h2>
          <p className="text-gray-600 mb-6">
            Our admin team is here to help you with any questions or issues.
          </p>

          {/* Live Chat Button */}
          <button
            onClick={() => setShowChat(true)}
            className="w-full bg-[#1a568b] hover:bg-[#1a568b]/90 text-white font-bold py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm mb-6 shadow-lg"
          >
            <span className="material-symbols-outlined">chat</span>
            Start Live Chat
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </button>
          
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#1a558b]">email</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-bold text-gray-900">plus1rewards@gmail.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#1a558b]">phone</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-bold text-gray-900">071 432 9190</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#1a558b]">schedule</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hours</p>
                <p className="font-bold text-gray-900">Mon-Fri: 7:30 AM - 7:00 PM</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <div className="mt-6">
            <a
              href="https://wa.me/27714329190"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Contact us on WhatsApp
            </a>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">help</span>
              Common Issues
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">How do I process a transaction?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                Use the Sales Terminal tab to search for a member by phone or QR code, then enter the purchase amount.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">When do I receive my cashback payments?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                Cashback is calculated monthly and invoiced to you. Payment terms depend on your agreement with the admin team.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">How do I register a new member?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                Use the Register Member tab to add a new customer. They'll receive a QR code for future transactions.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">What if a transaction fails?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                If a transaction fails, please file a complaint with the transaction ID and our team will investigate.
              </div>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
