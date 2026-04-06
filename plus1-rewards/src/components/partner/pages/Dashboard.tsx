// src/components/partner/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { DollarSign } from 'lucide-react';

interface Partner {
  id: string;
  shop_name: string;
  name: string;
  status: string;
  cashback_percent: number;
}

interface MonthlyStats {
  transactionCount: number;
  cashbackLiability: number;
}

interface LatestInvoice {
  amount: number;
  dueDate: string;
  status: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ transactionCount: 0, cashbackLiability: 0 });
  const [latestInvoice, setLatestInvoice] = useState<LatestInvoice | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<string>('Not assigned');
  const [loading, setLoading] = useState(true);
  const [showAgreementPDF, setShowAgreementPDF] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      
      if (!partnerSessionData) {
        navigate('/partner/login');
        return;
      }

      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id;

      if (!partnerId) {
        navigate('/partner/login');
        return;
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('id, shop_name, status, cashback_percent')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;
      setPartner({ ...partnerData, name: partnerData.shop_name });

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('purchase_amount, cashback_percent')
        .eq('partner_id', partnerId)
        .gte('created_at', firstDayOfMonth);

      if (!txError && transactions) {
        const count = transactions.length;
        // Calculate total cashback liability (what partner owes)
        const liability = transactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.purchase_amount) || 0;
          const percent = parseFloat(tx.cashback_percent) || 0;
          return sum + (amount * percent / 100);
        }, 0);
        setMonthlyStats({ transactionCount: count, cashbackLiability: liability });
      }

      const { data: invoiceData } = await supabase
        .from('partner_invoices')
        .select('total_amount, due_date, status')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (invoiceData) {
        setLatestInvoice({
          amount: invoiceData.total_amount,
          dueDate: invoiceData.due_date,
          status: invoiceData.status
        });
      }

      // Load assigned agent
      const { data: agentLink } = await supabase
        .from('partner_agent_links')
        .select('agent_id')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .maybeSingle();

      if (agentLink) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id, full_name, mobile_number')
          .eq('id', agentLink.agent_id)
          .single();

        if (agentData) {
          setAssignedAgent(agentData.full_name || 'Unknown Agent');
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-900 mb-4">No partner found</p>
          <button
            onClick={() => navigate('/partner/login')}
            className="bg-[#1a558b] text-white px-6 py-2 rounded-xl font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Partner Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">Welcome back, {partner?.shop_name || partner?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">receipt</span>
            <div>
              <p className="text-gray-900 font-bold text-lg md:text-xl">{monthlyStats.transactionCount}</p>
              <p className="text-gray-600 text-xs md:text-sm">This Month's Transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">payments</span>
            <div>
              <p className="text-gray-900 font-bold text-lg md:text-xl">R{monthlyStats.cashbackLiability.toFixed(2)}</p>
              <p className="text-gray-600 text-xs md:text-sm">Cashback Liability</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-symbols-outlined text-[#1a558b] text-xl md:text-2xl">support_agent</span>
            <div>
              <p className="text-gray-900 font-bold text-lg md:text-xl truncate">{assignedAgent}</p>
              <p className="text-gray-600 text-xs md:text-sm">Assigned Agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Status */}
      {latestInvoice && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Latest Invoice</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-gray-600 text-xs">Invoice Amount</p>
              <p className="text-gray-900 font-bold">R{latestInvoice.amount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600 text-xs">Due Date</p>
              <p className="text-gray-900 font-semibold text-sm">
                {new Date(latestInvoice.dueDate).toLocaleDateString('en-ZA')}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-600 text-xs">Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                latestInvoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                latestInvoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {latestInvoice.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Important Notices */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[#1a558b] text-lg">notifications</span>
          Important Notices
        </h3>
        <ul className="space-y-1 text-xs text-gray-700">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-xs mt-0.5 text-[#1a558b]">check_circle</span>
            <span>Invoices are generated on the 28th of each month</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-xs mt-0.5 text-[#1a558b]">check_circle</span>
            <span>Payment is due within 7 days to avoid suspension</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-xs mt-0.5 text-[#1a558b]">check_circle</span>
            <span>Contact your assigned agent for support</span>
          </li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-4 space-y-3">
          {/* Fullscreen Sales Terminal Button - Prominent */}
          <button
            onClick={() => navigate('/partner/sales-terminal')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
          >
            <DollarSign className="w-6 h-6" />
            Open Sales Terminal
          </button>

          {/* Two column row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/partner/transaction-history')}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              View Transactions
            </button>

            <button
              onClick={() => navigate('/partner/monthly-invoice')}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              View Invoices
            </button>
          </div>

          {/* Support button - full width */}
          <button
            onClick={() => navigate('/partner/support')}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">support_agent</span>
            Support
          </button>

          {/* View Partner Agreement - full width */}
          <button
            onClick={() => setShowAgreementPDF(true)}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">description</span>
            View Partner Agreement
          </button>
        </div>
      </div>

      {/* Supplier References */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a558b]">local_shipping</span>
            Supplier References
          </h2>
          <button
            onClick={() => navigate('/partner/profile')}
            className="text-blue-600 hover:text-blue-700 font-semibold text-xs md:text-sm"
          >
            Manage
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-600 text-xs md:text-sm mb-3">
            Add suppliers you work with to help them join +1 Rewards
          </p>
          <button
            onClick={() => navigate('/partner/profile')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add Supplier Reference
          </button>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showAgreementPDF && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '56rem',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Partner Agreement</h2>
              <button
                onClick={() => setShowAgreementPDF(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  padding: 0
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* PDF Viewer */}
            <div style={{
              flex: 1,
              overflow: 'auto'
            }}>
              <iframe
                src="/partner_responsibilities.pdf"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '600px',
                  border: 'none'
                }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/partner_agreement.pdf';
                  link.download = 'partner_agreement.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#1a558b',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                Download PDF
              </button>
              <button
                onClick={() => setShowAgreementPDF(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
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