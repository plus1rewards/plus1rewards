// plus1-rewards/src/pages/AgentDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const BLUE = '#1a558b';
const BLUE_LIGHT = 'rgba(26,85,139,0.08)';

interface Agent {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  status: string;
}

interface PartnerShop {
  id: string;
  shop_name: string;
  cashback_percent: number;
  status: 'active' | 'suspended';
  monthly_commission: number;
  contact_person: string;
  phone: string;
}

export function AgentDashboard() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [partnerShops, setPartnerShops] = useState<PartnerShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [showAgreementPDF, setShowAgreementPDF] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check session storage first, then localStorage
      const agentDataStr = sessionStorage.getItem('currentAgent') || localStorage.getItem('currentAgent');
      
      if (!agentDataStr) {
        navigate('/agent/login');
        return;
      }

      const agentData = JSON.parse(agentDataStr);
      
      // Verify agent status - use agent_id from session data
      const { data: currentAgent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentData.agent_id || agentData.id)
        .single();

      if (agentError || !currentAgent) {
        console.error('Agent not found:', agentError);
        sessionStorage.removeItem('currentAgent');
        localStorage.removeItem('currentAgent');
        navigate('/agent/login');
        return;
      }

      if (currentAgent.status !== 'active') {
        sessionStorage.removeItem('currentAgent');
        localStorage.removeItem('currentAgent');
        alert('Your agent account is not yet approved. Please wait for admin approval.');
        navigate('/agent/login');
        return;
      }

      // Use agent data directly - no separate users table
      const combinedData = {
        ...currentAgent,
        name: currentAgent.full_name?.split(' ')[0] || 'Agent',
        surname: currentAgent.full_name?.split(' ').slice(1).join(' ') || '',
        phone: currentAgent.mobile_number || '',
        email: currentAgent.email || ''
      };

      setAgent(combinedData as Agent);
      await loadDashboardData(currentAgent.id);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/agent/login');
    }
  };

  const loadDashboardData = async (agentId: string) => {
    setLoading(true);
    try {
      // Load partner shops linked to this agent through partner_agent_links
      const { data: links, error: linksError } = await supabase
        .from('partner_agent_links')
        .select('partner_id')
        .eq('agent_id', agentId)
        .eq('status', 'active');

      if (linksError) {
        console.error('Error loading partner links:', linksError);
        setPartnerShops([]);
        setLoading(false);
        return;
      }

      if (!links || links.length === 0) {
        setPartnerShops([]);
        setLoading(false);
        return;
      }

      const partnerIds = links.map(link => link.partner_id);

      // Get partner details
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .in('id', partnerIds);

      if (partnersError) {
        console.error('Error loading partners:', partnersError);
        setPartnerShops([]);
      } else {
        // Calculate monthly commission for each partner
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        console.log('Date range for commission:', {
          start: currentMonthStart.toISOString(),
          end: nextMonthStart.toISOString()
        });
        
        const shopsWithCommission = await Promise.all((partners || []).map(async (partner) => {
          // Get transactions for this partner this month
          const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('agent_amount')
            .eq('partner_id', partner.id)
            .gte('created_at', currentMonthStart.toISOString())
            .lt('created_at', nextMonthStart.toISOString())
            .eq('status', 'completed');

          if (txError) {
            console.error(`Error fetching transactions for partner ${partner.id}:`, txError);
          }
          
          console.log(`Transactions for partner ${partner.shop_name}:`, transactions);

          const monthlyCommission = (transactions || []).reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0);

          return {
            id: partner.id,
            shop_name: partner.shop_name,
            cashback_percent: partner.cashback_percent,
            status: partner.status,
            monthly_commission: monthlyCommission,
            contact_person: partner.responsible_person,
            phone: partner.phone
          };
        }));

        setPartnerShops(shopsWithCommission);
        
        // Calculate totals
        const monthlyTotal = shopsWithCommission.reduce((sum, shop) => sum + shop.monthly_commission, 0);
        setMonthlyCommission(monthlyTotal);

        // Get total commission from ALL transactions (not just agent_commissions table)
        const { data: allTransactions, error: allTxError } = await supabase
          .from('transactions')
          .select('agent_amount')
          .eq('agent_id', agentId)
          .eq('status', 'completed');

        if (allTxError) {
          console.error('Error fetching all transactions:', allTxError);
        }
        
        console.log('All transactions for agent:', allTransactions);

        const total = (allTransactions || []).reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0);
        setTotalCommission(total);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentAgent');
    localStorage.removeItem('currentAgent');
    navigate('/agent/login');
  };

  const handleResendLogin = async (partnerId: string) => {
    try {
      const partner = partnerShops.find(s => s.id === partnerId);
      if (!partner) return;

      // Get partner details from database
      const { data: partnerData, error } = await supabase
        .from('partners')
        .select('mobile_number, pin_code, shop_name, email')
        .eq('id', partnerId)
        .single();

      if (error || !partnerData) {
        alert('Could not retrieve partner details');
        return;
      }

      // In production, this would send an SMS/email
      // For now, show the details in an alert
      const message = `Partner Login Details for ${partner.shop_name}:\n\nMobile: ${partnerData.mobile_number}\nPIN: ${partnerData.pin_code}\n\nLogin at: /partner/login`;
      
      alert(message);
      
      // TODO: Integrate with SMS/Email service to send these details
      console.log('Resend login details:', { partnerId, mobile: partnerData.mobile_number, pin: partnerData.pin_code });
    } catch (err) {
      console.error('Error resending login:', err);
      alert('Failed to resend login details');
    }
  };

  const activeShops = partnerShops.filter(s => s.status === 'active').length;
  const suspendedShops = partnerShops.filter(s => s.status === 'suspended').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BLUE }}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-2xl">assignment_ind</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-600">{agent?.name} {agent?.surname}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agent/profile')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Agent Profile Summary */}
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-white/70 mb-1">Agent Profile</p>
              <h2 className="text-2xl font-black mb-2">{agent?.name} {agent?.surname}</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">phone</span>
                  <span>{agent?.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">mail</span>
                  <span>{agent?.email}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70 mb-1">Total Commission Earned</p>
              <p className="text-4xl font-black text-cyan-200">R{totalCommission.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>storefront</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Shops</span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{partnerShops.length}</p>
            <p className="text-sm text-gray-600">Recruited</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Shops</span>
            </div>
            <p className="text-3xl font-black text-green-600 mb-1">{activeShops}</p>
            <p className="text-sm text-gray-600">Earning now</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-orange-600 text-2xl">warning</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Suspended</span>
            </div>
            <p className="text-3xl font-black text-orange-600 mb-1">{suspendedShops}</p>
            <p className="text-sm text-gray-600">Need attention</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-cyan-600 text-2xl">payments</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">This Month</span>
            </div>
            <p className="text-3xl font-black text-cyan-600 mb-1">R{monthlyCommission.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Commission</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/agent/add-shop')}
              className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              style={{ borderColor: '#e5e7eb' }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>add_business</span>
              <div className="text-left">
                <p className="font-bold text-gray-900">Add Partner Shop</p>
                <p className="text-xs text-gray-600">Recruit new business</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/agent/commission')}
              className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              style={{ borderColor: '#e5e7eb' }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>account_balance_wallet</span>
              <div className="text-left">
                <p className="font-bold text-gray-900">View Commission</p>
                <p className="text-xs text-gray-600">Earnings breakdown</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/agent/support')}
              className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              style={{ borderColor: '#e5e7eb' }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>support_agent</span>
              <div className="text-left">
                <p className="font-bold text-gray-900">Contact Admin</p>
                <p className="text-xs text-gray-600">Get help & support</p>
              </div>
            </button>

            <button
              onClick={() => setShowAgreementPDF(true)}
              className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              style={{ borderColor: '#e5e7eb' }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>description</span>
              <div className="text-left">
                <p className="font-bold text-gray-900">View Agreement</p>
                <p className="text-xs text-gray-600">Full PDF document</p>
              </div>
            </button>
          </div>
        </div>

        {/* Partner Shops List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>storefront</span>
              My Partner Shops ({partnerShops.length})
            </h3>
          </div>

          {partnerShops.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">store</span>
              <p className="text-gray-600 mb-2">No partner shops recruited yet</p>
              <p className="text-sm text-gray-500 mb-4">Start recruiting shops to earn commissions!</p>
              <button
                onClick={() => navigate('/agent/add-shop')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: BLUE }}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add First Shop
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {partnerShops.map((shop) => (
                <div key={shop.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{shop.shop_name}</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          shop.status === 'active' 
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                            : 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                        }`}>
                          <span className={`size-1.5 rounded-full ${shop.status === 'active' ? 'bg-green-600' : 'bg-orange-600'}`}></span>
                          {shop.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Cashback: {shop.cashback_percent}%</span>
                        <span>•</span>
                        <span>Contact: {shop.contact_person}</span>
                        <span>•</span>
                        <span>{shop.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Monthly Commission</p>
                      <p className="text-2xl font-black" style={{ color: BLUE }}>R{shop.monthly_commission.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/agent/shop/${shop.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      View Details
                    </button>
                    <button
                      onClick={() => handleResendLogin(shop.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">mail</span>
                      Resend Login
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">support</span>
                      Contact Shop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">© 2026 +1 Rewards · Agent Portal</p>
        </div>
      </footer>

      {/* PDF Viewer Modal */}
      {showAgreementPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Agent Agreement</h2>
              <button
                onClick={() => setShowAgreementPDF(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto">
              <iframe
                src="/plus1_rewards_agent_agreement.pdf"
                className="w-full h-full"
                style={{ minHeight: '600px' }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/plus1_rewards_agent_agreement.pdf';
                  link.download = 'plus1_rewards_agent_agreement.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <span className="material-symbols-outlined">download</span>
                Download PDF
              </button>
              <button
                onClick={() => setShowAgreementPDF(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
