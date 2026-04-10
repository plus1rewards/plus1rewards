// plus1-rewards/src/components/dashboard/Sidebar.tsx
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    members: 0,
    coverPlans: 0,
    partners: 0,
    invoices: 0,
    agents: 0,
    commissions: 0,
    providers: 0,
    transactions: 0,
    disputes: 0,
    topUps: 0
  });

  // Track last visit times for each page
  const [lastVisitTimes, setLastVisitTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load last visit times from localStorage
    const stored = localStorage.getItem('adminPageVisits');
    if (stored) {
      setLastVisitTimes(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    // Update last visit time when navigating to a page
    if (currentPath) {
      const now = Date.now();
      const updated = { ...lastVisitTimes, [currentPath]: now };
      setLastVisitTimes(updated);
      localStorage.setItem('adminPageVisits', JSON.stringify(updated));
    }
  }, [currentPath]);

  useEffect(() => {
    fetchPendingCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [lastVisitTimes]);

  const fetchPendingCounts = async () => {
    try {
      const lastApprovalsVisit = lastVisitTimes['/admin/approvals'] || 0;
      const lastDisputesVisit = lastVisitTimes['/admin/disputes'] || 0;
      const lastTopUpsVisit = lastVisitTimes['/admin/top-ups'] || 0;

      // Count pending partners created after last visit
      const { count: partnersCount } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', new Date(lastApprovalsVisit).toISOString());

      // Count pending agents created after last visit
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', new Date(lastApprovalsVisit).toISOString());

      // Count pending providers created after last visit
      const { count: providersCount } = await supabase
        .from('insurers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', new Date(lastApprovalsVisit).toISOString());

      // Count open disputes created after last visit
      const { count: disputesCount } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'investigating'])
        .gte('created_at', new Date(lastDisputesVisit).toISOString());

      // Count top-ups created after last visit
      let topUpsCount = 0;
      try {
        const { count } = await supabase
          .from('top_ups')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(lastTopUpsVisit).toISOString());
        topUpsCount = count || 0;
      } catch (error) {
        console.log('Top-ups table not found or error:', error);
      }

      // Count pending/incomplete members (status = pending or incomplete profiles)
      const { count: pendingMembersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count in-progress cover plans
      const { count: inProgressCoverPlansCount } = await supabase
        .from('member_cover_plans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      // Count all active partners (for Partners tab)
      const { count: allPartnersCount } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });

      // Count overdue invoices
      const { count: overdueInvoicesCount } = await supabase
        .from('partner_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'overdue');

      // Count all active agents (for Agents tab)
      const { count: allAgentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });

      // Count unpaid commissions
      const { count: unpaidCommissionsCount } = await supabase
        .from('agent_commissions')
        .select('*', { count: 'exact', head: true })
        .eq('payout_status', 'pending');

      // Count all providers
      const { count: allProvidersCount } = await supabase
        .from('insurers')
        .select('*', { count: 'exact', head: true });

      // Count today's transactions
      const today = new Date().toISOString().split('T')[0];
      const { count: todayTransactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const totalApprovals = (partnersCount || 0) + (agentsCount || 0) + (providersCount || 0);

      setPendingCounts({
        approvals: totalApprovals,
        members: pendingMembersCount || 0,
        coverPlans: inProgressCoverPlansCount || 0,
        partners: allPartnersCount || 0,
        invoices: overdueInvoicesCount || 0,
        agents: allAgentsCount || 0,
        commissions: unpaidCommissionsCount || 0,
        providers: allProvidersCount || 0,
        transactions: todayTransactionsCount || 0,
        disputes: disputesCount || 0,
        topUps: topUpsCount
      });
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  const getLinkClasses = (path: string) => {
    return isActive(path)
      ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a558b]/10 text-[#1a558b] group"
      : "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-[#1a558b] transition-colors";
  };

  const getTextClasses = (path: string) => {
    return isActive(path) ? "text-sm font-semibold" : "text-sm font-medium";
  };

  const isActive = (path: string) => currentPath === path;

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    onClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
        <div className="flex items-center justify-center px-6 py-8">
          <img 
            src="/logo.png" 
            alt="+1 Rewards" 
            className="w-auto object-contain"
            style={{ height: '60px' }}
          />
        </div>
        
        <nav className="px-4 space-y-1">
          <a className={getLinkClasses('/admin/dashboard')} href="/admin/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className={getTextClasses('/admin/dashboard')}>Dashboard Home</span>
          </a>
          
          <a className={getLinkClasses('/admin/approvals')} href="/admin/approvals">
            <span className="material-symbols-outlined">approval</span>
            <span className={getTextClasses('/admin/approvals')}>Approvals</span>
            {pendingCounts.approvals > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.approvals}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/members')} href="/admin/members">
            <span className="material-symbols-outlined">group</span>
            <span className={getTextClasses('/admin/members')}>Members</span>
            {pendingCounts.members > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.members}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/cover-plans')} href="/admin/cover-plans">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span className={getTextClasses('/admin/cover-plans')}>Member Cover Plans</span>
            {pendingCounts.coverPlans > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.coverPlans}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/notifications')} href="/admin/notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className={getTextClasses('/admin/notifications')}>Notifications</span>
          </a>
          
          <a className={getLinkClasses('/admin/partners')} href="/admin/partners">
            <span className="material-symbols-outlined">storefront</span>
            <span className={getTextClasses('/admin/partners')}>Partners</span>
            {pendingCounts.partners > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.partners}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/invoices')} href="/admin/invoices">
            <span className="material-symbols-outlined">receipt</span>
            <span className={getTextClasses('/admin/invoices')}>Partner Billing</span>
            {pendingCounts.invoices > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.invoices}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/agents')} href="/admin/agents">
            <span className="material-symbols-outlined">support_agent</span>
            <span className={getTextClasses('/admin/agents')}>Agents</span>
            {pendingCounts.agents > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.agents}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/commissions')} href="/admin/commissions">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className={getTextClasses('/admin/commissions')}>Agent Commission</span>
            {pendingCounts.commissions > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.commissions}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/providers')} href="/admin/providers">
            <span className="material-symbols-outlined">business</span>
            <span className={getTextClasses('/admin/providers')}>Providers</span>
            {pendingCounts.providers > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.providers}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/transactions')} href="/admin/transactions">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className={getTextClasses('/admin/transactions')}>Transactions</span>
            {pendingCounts.transactions > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.transactions}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/disputes')} href="/admin/disputes">
            <span className="material-symbols-outlined">report_problem</span>
            <span className={getTextClasses('/admin/disputes')}>Disputes</span>
            {pendingCounts.disputes > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.disputes}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/top-ups')} href="/admin/top-ups">
            <span className="material-symbols-outlined">add_card</span>
            <span className={getTextClasses('/admin/top-ups')}>Top-Ups</span>
            {pendingCounts.topUps > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.topUps}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/settings')} href="/admin/settings">
            <span className="material-symbols-outlined">settings</span>
            <span className={getTextClasses('/admin/settings')}>Settings / Config</span>
          </a>
        </nav>
        
        <div className="mt-10 px-4 pb-6">
          <div className="p-4 rounded-xl bg-[#1a558b]/5 border border-[#1a558b]/10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1a558b] mb-2">System Health</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">All Entities Active</span>
              <span className="text-xs font-bold text-[#1a558b]">100%</span>
            </div>
            <div className="w-full bg-[#1a558b]/10 rounded-full h-1.5">
              <div className="bg-[#1a558b] h-1.5 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <img 
            src="/logo.png" 
            alt="+1 Rewards" 
            className="h-10 object-contain"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-700">close</span>
          </button>
        </div>
        
        <nav className="px-4 py-4 space-y-1">
          <a className={getLinkClasses('/admin/dashboard')} href="/admin/dashboard" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className={getTextClasses('/admin/dashboard')}>Dashboard Home</span>
          </a>
          
          <a className={getLinkClasses('/admin/approvals')} href="/admin/approvals" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">approval</span>
            <span className={getTextClasses('/admin/approvals')}>Approvals</span>
            {pendingCounts.approvals > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.approvals}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/members')} href="/admin/members" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">group</span>
            <span className={getTextClasses('/admin/members')}>Members</span>
            {pendingCounts.members > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.members}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/cover-plans')} href="/admin/cover-plans" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">health_and_safety</span>
            <span className={getTextClasses('/admin/cover-plans')}>Member Cover Plans</span>
            {pendingCounts.coverPlans > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.coverPlans}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/notifications')} href="/admin/notifications" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">notifications</span>
            <span className={getTextClasses('/admin/notifications')}>Notifications</span>
          </a>
          
          <a className={getLinkClasses('/admin/partners')} href="/admin/partners" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">storefront</span>
            <span className={getTextClasses('/admin/partners')}>Partners</span>
            {pendingCounts.partners > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.partners}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/invoices')} href="/admin/invoices" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">receipt</span>
            <span className={getTextClasses('/admin/invoices')}>Partner Billing</span>
            {pendingCounts.invoices > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.invoices}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/agents')} href="/admin/agents" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">support_agent</span>
            <span className={getTextClasses('/admin/agents')}>Agents</span>
            {pendingCounts.agents > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.agents}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/commissions')} href="/admin/commissions" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className={getTextClasses('/admin/commissions')}>Agent Commission</span>
            {pendingCounts.commissions > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.commissions}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/providers')} href="/admin/providers" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">business</span>
            <span className={getTextClasses('/admin/providers')}>Providers</span>
            {pendingCounts.providers > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.providers}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/transactions')} href="/admin/transactions" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span className={getTextClasses('/admin/transactions')}>Transactions</span>
            {pendingCounts.transactions > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.transactions}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/disputes')} href="/admin/disputes" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">report_problem</span>
            <span className={getTextClasses('/admin/disputes')}>Disputes</span>
            {pendingCounts.disputes > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.disputes}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/top-ups')} href="/admin/top-ups" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">add_card</span>
            <span className={getTextClasses('/admin/top-ups')}>Top-Ups</span>
            {pendingCounts.topUps > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingCounts.topUps}
              </span>
            )}
          </a>
          
          <a className={getLinkClasses('/admin/settings')} href="/admin/settings" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">settings</span>
            <span className={getTextClasses('/admin/settings')}>Settings / Config</span>
          </a>
        </nav>
        
        <div className="mt-6 px-4 pb-6">
          <div className="p-4 rounded-xl bg-[#1a558b]/5 border border-[#1a558b]/10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1a558b] mb-2">System Health</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">All Entities Active</span>
              <span className="text-xs font-bold text-[#1a558b]">100%</span>
            </div>
            <div className="w-full bg-[#1a558b]/10 rounded-full h-1.5">
              <div className="bg-[#1a558b] h-1.5 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
