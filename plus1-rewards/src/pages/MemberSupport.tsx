import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';

interface Member {
  id: string;
  full_name: string;
  cell_phone: string;
  email?: string;
  qr_code: string;
  name?: string;
  phone?: string;
}

export default function MemberSupport() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disputeType, setDisputeType] = useState('missing_cashback');
  const [description, setDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = getSession('member');
      if (!session || !session.member) {
        console.log('No session found, redirecting to login');
        navigate('/member/login');
        return;
      }

      const memberId = session.member.id;
      if (!memberId) {
        console.log('No member ID in session, redirecting to login');
        navigate('/member/login');
        return;
      }

      const { data: memberData, error } = await supabase
        .from('members')
        .select('id, full_name, cell_phone, email, qr_code')
        .eq('id', memberId)
        .single();

      if (error) {
        console.error('Error fetching member:', error);
        navigate('/member/login');
        return;
      }

      if (memberData) {
        setMember({
          ...memberData,
          name: memberData.full_name,
          phone: memberData.cell_phone
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      navigate('/member/login');
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
      const session = getSession('member');
      if (!session || !session.member) {
        navigate('/member/login');
        return;
      }

      const memberId = session.member.id;
      if (!memberId) {
        navigate('/member/login');
        return;
      }

      // Only include transaction_id if it's a valid UUID format
      const transactionIdValue = transactionId?.trim() 
        ? (transactionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? transactionId : null)
        : null;

      const { error } = await supabase
        .from('disputes')
        .insert([{
          member_id: memberId,
          dispute_type: disputeType,
          description: description.trim(),
          transaction_id: transactionIdValue,
          status: 'open'
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setSuccessMessage('Dispute submitted successfully! Our team will review it within 24 hours.');
      setDescription('');
      setTransactionId('');
      setDisputeType('missing_cashback');

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    navigate('/member/login');
  };

  if (loading) {
    return (
      <MemberLayout
        member={member}
        isOnline={navigator.onLine}
        pendingTransactions={0}
        onSignOut={handleSignOut}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout
      member={member}
      isOnline={navigator.onLine}
      pendingTransactions={0}
      onSignOut={handleSignOut}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support & Admin Chat</h1>
          <p className="text-gray-600">Get help with your account and cover plans</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-green-600 flex-shrink-0">check_circle</span>
          <div>
            <p className="font-bold text-green-900">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Dispute Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-red-600">report_problem</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">File a Complaint or Dispute</h2>
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
            {submitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </form>
      </div>

      {/* Main Contact Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-[#1a558b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[#1a558b] text-3xl">support_agent</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Admin Support</h2>
        <p className="text-gray-600 mb-6">
          Our admin team is here to help you with any questions or issues.
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#1a558b]">email</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-bold text-gray-900">support@plus1rewards.co.za</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#1a558b]">phone</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-bold text-gray-900">0800 PLUS1 (75871)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#1a558b]">schedule</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hours</p>
              <p className="font-bold text-gray-900">Mon-Fri: 8:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Common Support Topics */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Common Support Topics</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-green-600">account_balance</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Top-Up Support</h4>
            <p className="text-sm text-gray-600">Help with EFT payments and proof of payment</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-blue-600">health_and_safety</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Cover Plan Questions</h4>
            <p className="text-sm text-gray-600">Status updates, plan changes, and upgrades</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-purple-600">receipt_long</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Transaction Problems</h4>
            <p className="text-sm text-gray-600">Missing cashback or incorrect transactions</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-orange-600">group_add</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Linked Person Requests</h4>
            <p className="text-sm text-gray-600">Add dependants and family members</p>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-600 flex-shrink-0">info</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Note</h3>
            <p className="text-sm text-gray-700">
              In a production environment, this page would include a live chat widget or messaging system 
              for instant communication with admin support. For now, please use the contact information above.
            </p>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
