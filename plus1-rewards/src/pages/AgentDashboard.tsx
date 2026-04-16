// plus1-rewards/src/pages/AgentDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AgentLayout from "../components/agent/AgentLayout";

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
        name: currentAgent.first_name || 'Agent',
        surname: currentAgent.last_name || '',
        phone: currentAgent.cell_phone || '',
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
            .eq('agent_id', agentId)
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
            contact_person: partner.contact_person || partner.first_name || 'N/A',
            phone: partner.cell_phone || partner.phone || 'N/A'
          };
        }));

        setPartnerShops(shopsWithCommission);
        
        // Calculate totals - sum all agent transactions this month
        const { data: monthlyTransactions, error: monthlyTxError } = await supabase
          .from('transactions')
          .select('agent_amount')
          .eq('agent_id', agentId)
          .gte('created_at', currentMonthStart.toISOString())
          .lt('created_at', nextMonthStart.toISOString())
          .eq('status', 'completed');

        if (monthlyTxError) {
          console.error('Error fetching monthly transactions:', monthlyTxError);
        }

        const monthlyTotal = (monthlyTransactions || []).reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0);
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

  const handleSignOut = () => {
    handleLogout();
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
      <AgentLayout agent={agent} onSignOut={handleSignOut}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout agent={agent} onSignOut={handleSignOut}>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4 md:px-6 py-6 md:py-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#1a558b] to-[#2563eb] rounded-xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Agent Dashboard</h1>
              <p className="text-base md:text-lg text-white/90 mb-3">Welcome back, {agent?.name} {agent?.surname}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">phone</span>
                  <span className="truncate">{agent?.phone}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">mail</span>
                  <span className="truncate">{agent?.email}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-white/80 mb-1">Total Commission Earned</p>
              <p className="text-3xl md:text-4xl font-bold text-white">R{totalCommission.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">storefront</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl">{partnerShops.length}</p>
                <p className="text-gray-600 text-xs md:text-sm">Total Shops</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-green-600 text-xl md:text-2xl">check_circle</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl">{activeShops}</p>
                <p className="text-gray-600 text-xs md:text-sm">Active Shops</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-orange-600 text-xl md:text-2xl">warning</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl">{suspendedShops}</p>
                <p className="text-gray-600 text-xs md:text-sm">Suspended</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">payments</span>
              <div>
                <p className="text-gray-900 font-bold text-lg md:text-xl">R{monthlyCommission.toFixed(2)}</p>
                <p className="text-gray-600 text-xs md:text-sm">This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Desktop Only */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/agent/add-shop')}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-[#1a558b] to-[#2563eb] text-white hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-2xl">add_business</span>
              <div className="text-left">
                <p className="font-bold text-sm">Add Partner Shop</p>
                <p className="text-xs text-white/80">Recruit new business</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/agent/commission')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[#1a558b] text-2xl">account_balance_wallet</span>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900">View Commission</p>
                <p className="text-xs text-gray-600">Earnings breakdown</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/agent/support')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[#1a558b] text-2xl">support_agent</span>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900">Get Support</p>
                <p className="text-xs text-gray-600">Contact admin</p>
              </div>
            </button>
            <button
              onClick={() => setShowAgreementPDF(true)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[#1a558b] text-2xl">description</span>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900">View Agreement</p>
                <p className="text-xs text-gray-600">Full PDF document</p>
              </div>
            </button>
          </div>
        </div>

        {/* Partner Shops List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-20 md:mb-0">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">storefront</span>
              My Partner Shops ({partnerShops.length})
            </h2>
          </div>

          {partnerShops.length === 0 ? (
            <div className="px-4 md:px-6 py-8 md:py-12 text-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl md:text-6xl mb-4 block">store</span>
              <p className="text-gray-600 mb-2 text-sm md:text-base">No partner shops recruited yet</p>
              <p className="text-xs md:text-sm text-gray-500 mb-4">Start recruiting shops to earn commissions!</p>
              <button
                onClick={() => navigate('/agent/add-shop')}
                className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-white rounded-lg font-bold transition-all hover:opacity-90 bg-[#1a558b] text-sm md:text-base"
              >
                <span className="material-symbols-outlined text-base md:text-lg">add</span>
                Add First Shop
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {partnerShops.map((shop) => (
                <div key={shop.id} className="px-4 md:px-6 py-4 md:py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                        <h4 className="text-base md:text-lg font-bold text-gray-900 truncate">{shop.shop_name}</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase flex-shrink-0 ${
                          shop.status === 'active' 
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                            : 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                        }`}>
                          <span className={`size-1.5 rounded-full ${shop.status === 'active' ? 'bg-green-600' : 'bg-orange-600'}`}></span>
                          {shop.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-gray-600">
                        <span>Cashback: {shop.cashback_percent}%</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">Contact: {shop.contact_person}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{shop.phone}</span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Monthly Commission</p>
                      <p className="text-xl md:text-2xl font-bold text-[#1a558b]">R{shop.monthly_commission.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                    <button
                      onClick={() => navigate(`/agent/shop/${shop.id}`)}
                      className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs md:text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm md:text-base">visibility</span>
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </button>
                    <button
                      onClick={() => handleResendLogin(shop.id)}
                      className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs md:text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm md:text-base">mail</span>
                      <span className="hidden sm:inline">Resend Login</span>
                      <span className="sm:hidden">Resend</span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs md:text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm md:text-base">support</span>
                      <span className="hidden sm:inline">Contact Shop</span>
                      <span className="sm:hidden">Contact</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-white shadow-[0px_-4px_20px_rgba(0,31,40,0.06)] border-t border-gray-200">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-[#1a558b] transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Home</span>
          </button>
          <button 
            onClick={() => navigate('/agent/add-shop')} 
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">add_business</span>
            <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Add Shop</span>
          </button>
          <button 
            onClick={() => navigate('/agent/commission')} 
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Commission</span>
          </button>
          <button 
            onClick={() => navigate('/agent/support')} 
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">support_agent</span>
            <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Support</span>
          </button>
          <button 
            onClick={() => setShowAgreementPDF(true)} 
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">description</span>
            <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Agreement</span>
          </button>
        </nav>

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
    </AgentLayout>
  );
}
