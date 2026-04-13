import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';
import MemberTopUpChat from './MemberTopUpChat';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}

export default function MemberTopUp() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = getSession();
      if (!session) {
        navigate('/member/login');
        return;
      }

      const { data: memberData } = await supabase
        .from('members')
        .select('id, full_name, phone, email, qr_code')
        .eq('id', session.user.id)
        .single();

      if (memberData) {
        setMember({
          ...memberData,
          name: memberData.full_name
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Top-Up Cover Plan</h1>
          <p className="text-gray-600 text-sm">Add funds to reach your cover plan target</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="self-start sm:self-auto bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Main Action Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-8 mb-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-green-600 text-3xl">account_balance</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Do Instant EFT</h2>
        <p className="text-gray-600 mb-6">
          Click the button below to start a direct chat with our admin team.<br />
          They will assist you with your top-up payment.
        </p>

        <button
          onClick={() => setShowChat(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined">chat</span>
          Start Chat with Admin
        </button>
      </div>

      {/* How It Works */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">info</span>
          How Top-Up Works
        </h3>
        <ol className="space-y-3">
          {[
            'Click "Start Chat with Admin" above',
            'Tell admin which cover plan you want to top up',
            'Admin will provide banking details for EFT payment',
            'Make your payment and upload proof',
            'Admin will confirm and credit your cover plan'
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#1a558b] text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Top-Up Options */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Top-Up Options</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            <div>
              <p className="font-bold text-gray-900">Full Top-Up</p>
              <p className="text-sm text-gray-600">Pay entire shortfall to reach target</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            <div>
              <p className="font-bold text-gray-900">Partial Top-Up</p>
              <p className="text-sm text-gray-600">Pay any amount you choose</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-2xl shadow-xl flex flex-col h-[85vh] sm:h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a558b] to-[#1a558b]/80 text-white p-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Chat with Admin</h3>
                <p className="text-sm text-[#1a558b]/80">Top-Up Payment Support</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Chat Content */}
            <MemberTopUpChat onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
