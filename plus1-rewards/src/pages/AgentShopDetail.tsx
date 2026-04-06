// plus1-rewards/src/pages/AgentShopDetail.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Notification, useNotification } from '../components/Notification';

const BLUE = '#1a558b';

export function AgentShopDetail() {
  const navigate = useNavigate();
  const { partnerId } = useParams();
  const [partner, setPartner] = useState<any>(null);
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportNote, setSupportNote] = useState('');
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  useEffect(() => {
    loadShopDetail();
  }, [partnerId]);

  const loadShopDetail = async () => {
    setLoading(true);
    try {
      // Load partner data - all partner details are stored directly in partners table
      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (partnerData) {
        setPartner(partnerData);
        // Partner data is stored directly, no separate users table
        setPartnerUser(partnerData);

        // Load recent transactions
        const { data: transactionData } = await supabase
          .from('transactions')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false })
          .limit(10);

        setTransactions(transactionData || []);
      }
    } catch (error) {
      console.error('Error loading shop detail:', error);
      showError('Error', 'Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLogin = async () => {
    if (!partnerUser) return;

    // In production, this would send email/SMS
    showSuccess('Login Details Sent', `Login details have been sent to ${partnerUser.email}`);
  };

  const handleContactShop = () => {
    const phoneNumber = partner?.phone || partnerUser?.mobile_number;
    if (!phoneNumber) {
      showError('No Contact', 'No phone number available for this shop');
      return;
    }
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleAddNote = () => {
    if (!supportNote.trim()) {
      showError('Empty Note', 'Please enter a support note');
      return;
    }

    // In production, this would save to database
    showSuccess('Note Added', 'Support note has been saved');
    setSupportNote('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BLUE }}></div>
          <p className="text-gray-600">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">store</span>
          <p className="text-gray-600">Shop not found</p>
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="mt-4 px-6 py-2 text-white rounded-lg font-semibold"
            style={{ backgroundColor: BLUE }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const monthlyTransactions = transactions.filter(t => {
    const transDate = new Date(t.created_at);
    const now = new Date();
    return transDate.getMonth() === now.getMonth() && transDate.getFullYear() === now.getFullYear();
  });

  const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.purchase_amount || '0'), 0);
  const monthlyCommission = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.agent_amount || '0'), 0);

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
              <span className="material-symbols-outlined text-2xl">store</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{partner.shop_name}</h1>
              <p className="text-sm text-gray-600">Partner Shop Details</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleResendLogin}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="size-10 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-xl">mail</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">Resend Login</p>
              <p className="text-xs text-gray-600">Send credentials</p>
            </div>
          </button>

          <button
            onClick={handleContactShop}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="size-10 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform bg-green-600">
              <span className="material-symbols-outlined text-xl">call</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">Contact Shop</p>
              <p className="text-xs text-gray-600">Call directly</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/agent/support')}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="size-10 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform bg-orange-600">
              <span className="material-symbols-outlined text-xl">support_agent</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">Contact Admin</p>
              <p className="text-xs text-gray-600">Get help</p>
            </div>
          </button>
        </div>

        {/* Shop Details */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>info</span>
              Shop Information
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Business Name</label>
              <p className="text-gray-900 font-semibold">{partner.shop_name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</label>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                partner.status === 'active'
                  ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                  : partner.status === 'pending'
                  ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                  : 'bg-red-500/20 text-red-600 border border-red-500/30'
              }`}>
                <span className={`size-2 rounded-full ${
                  partner.status === 'active' ? 'bg-green-600' : partner.status === 'pending' ? 'bg-orange-600' : 'bg-red-600'
                }`}></span>
                {partner.status}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Responsible Person</label>
              <p className="text-gray-900 font-semibold">{partner.responsible_person || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Category</label>
              <p className="text-gray-900 font-semibold">{partner.category || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
              <p className="text-gray-900 font-semibold">{partner.phone || partnerUser?.mobile_number || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email</label>
              <p className="text-gray-900 font-semibold">{partnerUser?.email || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Address</label>
              <p className="text-gray-900 font-semibold">{partner.address || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cashback Rate</label>
              <p className="text-2xl font-black" style={{ color: BLUE }}>{partner.cashback_percent}%</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Linked Since</label>
              <p className="text-gray-900 font-semibold">{new Date(partner.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Monthly Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>receipt</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">This Month</span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{monthlyTransactions.length}</p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-2xl text-green-600">trending_up</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Sales Volume</span>
            </div>
            <p className="text-3xl font-black text-green-600 mb-1">R{monthlyTotal.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total sales</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-2xl text-orange-600">account_balance_wallet</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Agent Commission</span>
            </div>
            <p className="text-3xl font-black text-orange-600 mb-1">R{monthlyCommission.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Earned this month</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>history</span>
              Recent Transactions
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">receipt_long</span>
              <p className="text-gray-600">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Time</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Cashback</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Agent Commission</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{new Date(transaction.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">R{parseFloat(transaction.purchase_amount).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold" style={{ color: BLUE }}>{partner.cashback_percent}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-green-600">R{parseFloat(transaction.agent_amount || '0').toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-600 border border-green-500/30">
                          <span className="size-1.5 rounded-full bg-green-600"></span>
                          {transaction.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Support Note */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>note_add</span>
              Add Support Note
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <textarea
              value={supportNote}
              onChange={(e) => setSupportNote(e.target.value)}
              placeholder="Add notes about support interactions, issues, or follow-ups..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
            <button
              onClick={handleAddNote}
              className="w-full py-3 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: BLUE }}
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Save Note
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
