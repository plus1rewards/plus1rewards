import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';
import MemberChat from './MemberChat';

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
  const [showChat, setShowChat] = useState(false);
  const [hasPendingFeedback, setHasPendingFeedback] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    checkPendingFeedback();
  }, []);

  const checkPendingFeedback = async () => {
    try {
      const session = getSession();
      if (!session?.member?.id) return;

      // Check for closed conversations with pending feedback
      const { data: pendingConvo } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('member_id', session.member.id)
        .eq('status', 'closed')
        .eq('feedback_requested', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingConvo) {
        // Check if feedback already given
        const { data: existingFeedback } = await supabase
          .from('chat_feedback')
          .select('id')
          .eq('conversation_id', pendingConvo.id)
          .eq('member_id', session.member.id)
          .maybeSingle();

        if (!existingFeedback) {
          setHasPendingFeedback(true);
          setPendingConversationId(pendingConvo.id);
        }
      }
    } catch (error) {
      console.error('Error checking pending feedback:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const session = getSession();
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
        .select('id, first_name, last_name, cell_phone, email, qr_code')
        .eq('id', memberId)
        .single();

      if (error) {
        console.error('Error fetching member:', error);
        navigate('/member/login');
        return;
      }

      if (memberData) {
        const fullName = `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim();
        setMember({
          ...memberData,
          full_name: fullName,
          name: fullName,
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
      const session = getSession();
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
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600">Get help with your account and cover plans</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Pending Feedback Banner */}
      {hasPendingFeedback && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-yellow-600 flex-shrink-0">feedback</span>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 mb-1">Feedback Requested</h3>
            <p className="text-sm text-yellow-800 mb-3">
              We'd love to hear about your recent support experience!
            </p>
            <button
              onClick={() => {
                setHasPendingFeedback(false);
                setShowChat(true);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Leave Feedback Now
            </button>
          </div>
        </div>
      )}

      {/* Chat with Admin - Primary CTA */}
      <div className="bg-gradient-to-br from-[#1a558b] via-blue-600 to-purple-600 rounded-2xl p-8 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 flex-shrink-0">
            <span className="material-symbols-outlined text-5xl text-white">support_agent</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Need Help? Chat with Us! 💬</h2>
            <p className="text-white/90 text-sm mb-4">
              Our friendly support team is online and ready to help you with anything. 
              Get instant answers to your questions!
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="bg-white hover:bg-gray-50 text-[#1a558b] font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">chat</span>
              Start Live Chat
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </div>
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
            <h3 className="font-bold text-gray-900 mb-2">Quick Response Times</h3>
            <p className="text-sm text-gray-700">
              Our support team typically responds within minutes during business hours (Mon-Fri, 7:30 AM - 7:00 PM). 
              For urgent matters, you can also call or WhatsApp us directly.
            </p>
          </div>
        </div>
      </div>

      {/* Full-screen chat overlay - same UI as admin chat */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => setShowChat(false)}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title="Close chat"
            >
              <span className="material-symbols-outlined text-gray-600 text-lg">close</span>
            </button>
          </div>
          <MemberChat onClose={() => setShowChat(false)} />
        </div>
      )}
    </MemberLayout>
  );
}
