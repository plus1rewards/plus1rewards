// plus1-rewards/src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoadingPage from './components/LoadingPage'
import Landing from './pages/Landing'
import MemberLogin from './pages/MemberLogin'
import MemberRegister from './pages/MemberRegister'
import PartnerLogin from './pages/PartnerLogin'
import PartnerRegister from './pages/PartnerRegister'
import AgentLogin from './pages/AgentLogin'
import AgentRegister from './pages/AgentRegister'
import PolicyProviderLogin from './pages/PolicyProviderLogin'
import AdminLogin from './pages/AdminLogin'
import Dashboard from './components/dashboard/Dashboard'
import MembersPage from './components/dashboard/pages/MembersPage'
import PartnersPage from './components/dashboard/pages/PartnersPage'
import AgentsPage from './components/dashboard/pages/AgentsPage'
import TransactionsPage from './components/dashboard/pages/TransactionsPage'
import ApprovalsPage from './components/dashboard/pages/ApprovalsPage'
import CoverPlansPage from './components/dashboard/pages/CoverPlansPage'
import NotificationsPage from './components/dashboard/pages/NotificationsPage'
import InvoicesPage from './components/dashboard/pages/InvoicesPage'
import CommissionsPage from './components/dashboard/pages/CommissionsPage'
import DisputesPage from './components/dashboard/pages/DisputesPage'
import TopUpsPage from './components/dashboard/pages/TopUpsPage'
import ProvidersPage from './components/dashboard/pages/ProvidersPage'
import ExportsPage from './components/dashboard/pages/ExportsPage'
import AuditLogsPage from './components/dashboard/pages/AuditLogsPage'
import SettingsPage from './components/dashboard/pages/SettingsPage'
import AdminChatDashboard from './components/dashboard/pages/AdminChatDashboard'
import { default as MemberDashboard } from './pages/DashboardNew'
import MemberCoverPlans from './pages/MemberCoverPlans'
import MemberTransactions from './pages/MemberTransactions'
import MemberTopUp from './pages/MemberTopUp'
import MemberSupport from './pages/MemberSupport'
import MemberChat from './pages/MemberChat'
import AddDependant from './pages/AddDependant'
import SponsorSomeone from './pages/SponsorSomeone'
import PartnerDashboard from './components/partner/PartnerDashboard'
import TransactionHistory from './components/partner/pages/TransactionHistory'
import PartnerTransactionDetail from './components/partner/PartnerTransactionDetail'
import MonthlyInvoice from './components/partner/pages/MonthlyInvoice'
import PartnerShopProfile from './components/partner/PartnerShopProfile'
import PartnerSupport from './pages/PartnerSupport'
import PartnerProcessTransaction from './components/partner/PartnerProcessTransaction'
import QuickTransaction from './components/partner/pages/QuickTransaction'
import PartnerMemberRegistration from './pages/PartnerMemberRegistration'
import PartnerSales from './pages/PartnerSales'
import PartnerSalesTerminal from './pages/PartnerSalesTerminal'
import { AgentDashboard } from './pages/AgentDashboard'
import { AgentAddShop } from './pages/AgentAddPartner'
import { AgentCommission } from './pages/AgentCommission'
import { AgentSupport } from './pages/AgentSupport'
import { AgentProfile } from './pages/AgentProfile'
import { AgentShopDetail } from './pages/AgentShopDetail'
import { PolicyProviderDashboard } from './pages/PolicyProviderDashboard'
import { MemberScanPartner } from './pages/MemberScanPartner'
import { MemberPolicySelector } from './pages/MemberPolicySelector'
import MemberPolicies from './pages/MemberPolicies'
import { MemberHistory } from './pages/MemberHistory'
import { MemberQR } from './pages/MemberQR'
import { MemberFindPartners } from './pages/MemberFindPartners'
import FindPartner from './pages/FindPartner'
import ProtectedPolicyProviderRoute from './components/ProtectedPolicyProviderRoute'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'

export default function App() {
  const [isLoading, setIsLoading] = useState(() => {
    // Check on initial render only
    return !sessionStorage.getItem('plus1_app_loaded');
  });

  useEffect(() => {
    // Only run if loading is true
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('plus1_app_loaded', 'true');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  // Sync session across storage when app loads or regains focus
  useEffect(() => {
    const syncSession = () => {
      const localSession = localStorage.getItem('memberSession');
      if (localSession && !sessionStorage.getItem('memberSession')) {
        try {
          const session = JSON.parse(localSession);
          // Check if not expired
          if (!session.expiresAt || new Date(session.expiresAt) > new Date()) {
            sessionStorage.setItem('memberSession', localSession);
          }
        } catch (e) {
          console.error('Error syncing session:', e);
        }
      }
    };
    
    syncSession();
    
    // Re-sync when window gains focus
    window.addEventListener('focus', syncSession);
    return () => window.removeEventListener('focus', syncSession);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 antialiased font-display overflow-x-hidden">
      <Router>
        {isLoading && <LoadingPage />}
        {!isLoading && (
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          
          {/* Unified login/register routes (for both Rewards and Go) */}
          <Route path="/login" element={<MemberLogin />} />
          <Route path="/register" element={<MemberRegister />} />
          
          {/* Legacy member routes (redirect to unified) */}
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/member/register" element={<MemberRegister />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/register" element={<AgentRegister />} />
          <Route path="/provider/login" element={<PolicyProviderLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/approvals" element={<ApprovalsPage />} />
          <Route path="/admin/members" element={<MembersPage />} />
          <Route path="/admin/cover-plans" element={<CoverPlansPage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/partners" element={<PartnersPage />} />
          <Route path="/admin/invoices" element={<InvoicesPage />} />
          <Route path="/admin/agents" element={<AgentsPage />} />
          <Route path="/admin/commissions" element={<CommissionsPage />} />
          <Route path="/admin/providers" element={<ProvidersPage />} />
          <Route path="/admin/transactions" element={<TransactionsPage />} />
          <Route path="/admin/disputes" element={<DisputesPage />} />
          <Route path="/admin/top-ups" element={<TopUpsPage />} />
          <Route path="/admin/exports" element={<ExportsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/chat" element={<AdminChatDashboard />} />
          <Route path="/member/dashboard" element={<MemberDashboard />} />
          <Route path="/member/chat" element={<MemberChat />} />
          <Route path="/member/cover-plans" element={<MemberCoverPlans />} />
          <Route path="/member/transactions" element={<MemberTransactions />} />
          <Route path="/member/top-up" element={<MemberTopUp />} />
          <Route path="/member/support" element={<MemberSupport />} />
          <Route path="/member/add-dependant" element={<AddDependant />} />
          <Route path="/member/sponsor" element={<SponsorSomeone />} />
          <Route path="/member/scan-partner" element={<MemberScanPartner />} />
          <Route path="/member/policy-selector" element={<MemberPolicySelector />} />
          <Route path="/member/policies" element={<MemberPolicies />} />
          <Route path="/member/history" element={<MemberHistory />} />
          <Route path="/member/qr" element={<MemberQR />} />
          <Route path="/member/find-partners" element={<MemberFindPartners />} />
          <Route path="/find-partner" element={<FindPartner />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="/partner/process-transaction" element={<PartnerProcessTransaction />} />
          <Route path="/partner/quick-transaction" element={<QuickTransaction />} />
          <Route path="/partner/member-registration" element={<PartnerMemberRegistration />} />
          <Route path="/partner/sales" element={<PartnerSales />} />
          <Route path="/partner/sales-terminal" element={<PartnerSalesTerminal />} />
          <Route path="/partner/transaction-history" element={<TransactionHistory />} />
          <Route path="/partner/transaction/:transactionId" element={<PartnerTransactionDetail />} />
          <Route path="/partner/monthly-invoice" element={<MonthlyInvoice />} />
          <Route path="/partner/profile" element={<PartnerShopProfile />} />
          <Route path="/partner/support" element={<PartnerSupport />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/add-shop" element={<AgentAddShop />} />
          <Route path="/agent/commission" element={<AgentCommission />} />
          <Route path="/agent/support" element={<AgentSupport />} />
          <Route path="/agent/profile" element={<AgentProfile />} />
          <Route path="/agent/shop/:partnerId" element={<AgentShopDetail />} />
          <Route path="/provider/dashboard" element={
            <ProtectedPolicyProviderRoute>
              <PolicyProviderDashboard />
            </ProtectedPolicyProviderRoute>
          } />
        </Routes>
        )}
      </Router>
    </div>
  )
}