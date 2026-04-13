// plus1-rewards/src/App.tsx
import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LoadingPage from './components/LoadingPage'
import Maintenance from './pages/Maintenance'
import { Component, type ReactNode } from 'react'

// Catches lazy chunk load failures so they don't silently route to 404
class ChunkErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'Inter, sans-serif' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1a568b' }}>Something went wrong loading this page.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#1a568b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

// All routes lazy loaded to prevent hook/context issues before Router mounts
const Landing = lazy(() => import('./pages/Landing'))
const MemberLogin = lazy(() => import('./pages/MemberLogin'))
const MemberRegister = lazy(() => import('./pages/MemberRegister'))

// Lazy load all other routes for code splitting
const PartnerLogin = lazy(() => import('./pages/PartnerLogin'))
const PartnerRegister = lazy(() => import('./pages/PartnerRegister'))
const AgentLogin = lazy(() => import('./pages/AgentLogin'))
const AgentRegister = lazy(() => import('./pages/AgentRegister'))
const PolicyProviderLogin = lazy(() => import('./pages/PolicyProviderLogin'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'))
const MembersPage = lazy(() => import('./components/dashboard/pages/MembersPage'))
const PartnersPage = lazy(() => import('./components/dashboard/pages/PartnersPage'))
const AgentsPage = lazy(() => import('./components/dashboard/pages/AgentsPage'))
const TransactionsPage = lazy(() => import('./components/dashboard/pages/TransactionsPage'))
const ApprovalsPage = lazy(() => import('./components/dashboard/pages/ApprovalsPage'))
const CoverPlansPage = lazy(() => import('./components/dashboard/pages/CoverPlansPage'))
const NotificationsPage = lazy(() => import('./components/dashboard/pages/NotificationsPage'))
const InvoicesPage = lazy(() => import('./components/dashboard/pages/InvoicesPage'))
const CommissionsPage = lazy(() => import('./components/dashboard/pages/CommissionsPage'))
const DisputesPage = lazy(() => import('./components/dashboard/pages/DisputesPage'))
const TopUpsPage = lazy(() => import('./components/dashboard/pages/TopUpsPage'))
const ProvidersPage = lazy(() => import('./components/dashboard/pages/ProvidersPage'))
const SettingsPage = lazy(() => import('./components/dashboard/pages/SettingsPage'))
const AdminChatDashboard = lazy(() => import('./components/dashboard/pages/AdminChatDashboard'))
const MemberDashboard = lazy(() => import('./pages/DashboardNew'))
const MemberCoverPlans = lazy(() => import('./pages/MemberCoverPlans'))
const MemberViewPlans = lazy(() => import('./pages/MemberViewPlans'))
const MemberTransactions = lazy(() => import('./pages/MemberTransactions'))
const MemberTopUp = lazy(() => import('./pages/MemberTopUp'))
const MemberSupport = lazy(() => import('./pages/MemberSupport'))
const MemberChat = lazy(() => import('./pages/MemberChat'))
const PartnerChat = lazy(() => import('./pages/PartnerChat'))
const AgentChat = lazy(() => import('./pages/AgentChat'))
const AddDependant = lazy(() => import('./pages/AddDependant'))
const SponsorSomeone = lazy(() => import('./pages/SponsorSomeone'))
const PartnerDashboard = lazy(() => import('./components/partner/PartnerDashboard'))
const TransactionHistory = lazy(() => import('./components/partner/pages/TransactionHistory'))
const PartnerTransactionDetail = lazy(() => import('./components/partner/PartnerTransactionDetail'))
const PartnerStatement = lazy(() => import('./pages/PartnerStatement'))
const PartnerShopProfile = lazy(() => import('./components/partner/PartnerShopProfile'))
const PartnerSupport = lazy(() => import('./pages/PartnerSupport'))
const PartnerProcessTransaction = lazy(() => import('./components/partner/PartnerProcessTransaction'))
const QuickTransaction = lazy(() => import('./components/partner/pages/QuickTransaction'))
const PartnerMemberRegistration = lazy(() => import('./pages/PartnerMemberRegistration'))
const PartnerSales = lazy(() => import('./pages/PartnerSales'))
const PartnerSalesTerminal = lazy(() => import('./pages/PartnerSalesTerminal'))
const AgentDashboard = lazy(() => import('./pages/AgentDashboard').then(m => ({ default: m.AgentDashboard })))
const AgentAddShop = lazy(() => import('./pages/AgentAddPartner').then(m => ({ default: m.AgentAddShop })))
const AgentCommission = lazy(() => import('./pages/AgentCommission').then(m => ({ default: m.AgentCommission })))
const AgentSupport = lazy(() => import('./pages/AgentSupport'))
const AgentProfile = lazy(() => import('./pages/AgentProfile').then(m => ({ default: m.AgentProfile })))
const AgentShopDetail = lazy(() => import('./pages/AgentShopDetail').then(m => ({ default: m.AgentShopDetail })))
const PolicyProviderDashboard = lazy(() => import('./pages/PolicyProviderDashboard').then(m => ({ default: m.PolicyProviderDashboard })))
const MemberScanPartner = lazy(() => import('./pages/MemberScanPartner').then(m => ({ default: m.MemberScanPartner })))
const MemberPolicySelector = lazy(() => import('./pages/MemberPolicySelector').then(m => ({ default: m.MemberPolicySelector })))
const MemberPolicies = lazy(() => import('./pages/MemberPolicies'))
const MemberHistory = lazy(() => import('./pages/MemberHistory').then(m => ({ default: m.MemberHistory })))
const MemberQR = lazy(() => import('./pages/MemberQR').then(m => ({ default: m.MemberQR })))
const MemberFindPartners = lazy(() => import('./pages/MemberFindPartners').then(m => ({ default: m.MemberFindPartners })))
const FindPartner = lazy(() => import('./pages/FindPartner'))
const ProtectedPolicyProviderRoute = lazy(() => import('./components/ProtectedPolicyProviderRoute'))
const ProtectedAdminRoute = lazy(() => import('./components/ProtectedAdminRoute'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const InsuranceDisclosure = lazy(() => import('./pages/InsuranceDisclosure'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const BlogAdminPage = lazy(() => import('./components/dashboard/pages/BlogAdminPage'))
const BecomePartner = lazy(() => import('./pages/BecomePartner'))

export default function App() {
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem('plus1_app_loaded');
  });

  const handleLoadComplete = () => {
    setIsLoading(false);
    sessionStorage.setItem('plus1_app_loaded', 'true');
  };
  
  useEffect(() => {
    const syncSession = () => {
      const localSession = localStorage.getItem('memberSession');
      if (localSession && !sessionStorage.getItem('memberSession')) {
        try {
          const session = JSON.parse(localSession);
          if (!session.expiresAt || new Date(session.expiresAt) > new Date()) {
            sessionStorage.setItem('memberSession', localSession);
          }
        } catch (e) {
          console.error('Error syncing session:', e);
        }
      }
    };
    
    syncSession();
    window.addEventListener('focus', syncSession);
    return () => window.removeEventListener('focus', syncSession);
  }, []);

  if (MAINTENANCE_MODE) return <Maintenance />

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 antialiased font-display overflow-x-hidden">
      <Router>
        <AnimatePresence mode="wait">
          {isLoading && <LoadingPage key="loader" onLoadComplete={handleLoadComplete} />}
        </AnimatePresence>
        {!isLoading && (
          <ChunkErrorBoundary>
          <Suspense fallback={<div className="fixed inset-0 bg-white" />}>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/insurance-disclosure" element={<InsuranceDisclosure />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/become-a-partner" element={<BecomePartner />} />
          
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
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute>
              <Dashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/approvals" element={
            <ProtectedAdminRoute>
              <ApprovalsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/members" element={
            <ProtectedAdminRoute>
              <MembersPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cover-plans" element={
            <ProtectedAdminRoute>
              <CoverPlansPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedAdminRoute>
              <NotificationsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/partners" element={
            <ProtectedAdminRoute>
              <PartnersPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/invoices" element={
            <ProtectedAdminRoute>
              <InvoicesPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/agents" element={
            <ProtectedAdminRoute>
              <AgentsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/commissions" element={
            <ProtectedAdminRoute>
              <CommissionsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/providers" element={
            <ProtectedAdminRoute>
              <ProvidersPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/transactions" element={
            <ProtectedAdminRoute>
              <TransactionsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/disputes" element={
            <ProtectedAdminRoute>
              <DisputesPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/top-ups" element={
            <ProtectedAdminRoute>
              <TopUpsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedAdminRoute>
              <SettingsPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/chat" element={
            <ProtectedAdminRoute>
              <AdminChatDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/blog" element={
            <ProtectedAdminRoute>
              <BlogAdminPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/member/dashboard" element={<MemberDashboard />} />
          <Route path="/member/chat" element={<MemberChat />} />
          <Route path="/member/cover-plans" element={<MemberCoverPlans />} />
          <Route path="/member/view-plans" element={<MemberViewPlans />} />
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
          <Route path="/partner/statement" element={<PartnerStatement />} />
          <Route path="/partner/profile" element={<PartnerShopProfile />} />
          <Route path="/partner/support" element={<PartnerSupport />} />
          <Route path="/partner/chat" element={<PartnerChat />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/add-shop" element={<AgentAddShop />} />
          <Route path="/agent/commission" element={<AgentCommission />} />
          <Route path="/agent/support" element={<AgentSupport />} />
          <Route path="/agent/chat" element={<AgentChat />} />
          <Route path="/agent/profile" element={<AgentProfile />} />
          <Route path="/agent/shop/:partnerId" element={<AgentShopDetail />} />
          <Route path="/provider/dashboard" element={
            <ProtectedPolicyProviderRoute>
              <PolicyProviderDashboard />
            </ProtectedPolicyProviderRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
          </ChunkErrorBoundary>
        )}
      </Router>
    </div>
  )
}