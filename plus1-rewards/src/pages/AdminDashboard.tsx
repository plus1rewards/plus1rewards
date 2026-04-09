import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseAdmin } from "../lib/supabase";
import IncompleteProfileAlerts from "../components/admin/IncompleteProfileAlerts";
import MemberPoliciesAdmin from "../components/admin/MemberPoliciesAdmin";
import AdminNotificationsPage from "../components/admin/AdminNotificationsPage";

interface Entity {
  id: string; name?: string; email?: string; cell_phone?: string; status: string; 
  created_at: string; type: string; commission_rate?: number; total_commission?: number;
  company_name?: string; location?: string; qr_code?: string; active_policy?: string;
  full_name?: string; provider_name?: string; first_name?: string; last_name?: string;
}

interface PolicyData {
  id: string; member_name: string; plan_name: string; provider_name: string;
  status: string; monthly_premium: number; amount_funded: number; start_date: string;
}

interface TransactionData {
  id: string; partner_name: string; member_name: string; agent_name?: string;
  purchase_amount: number; member_reward: number; agent_commission: number;
  platform_fee: number; status: string; created_at: string; transaction_time?: string;
}

interface ComprehensiveStats {
  // Entity counts
  totalMembers: number; activeMembers: number; totalShops: number; activeShops: number;
  suspendedShops: number; totalAgents: number; totalPolicyProviders: number;
  pendingDay1HealthApprovals: number;
  
  // Policy stats
  totalPolicies: number; activePolicies: number; policiesInProgress: number;
  totalPolicyValue: number; totalFundedAmount: number;
  
  // Financial stats
  revenueThisMonth: number; revenueAllTime: number; totalTransactions: number;
  totalRewardsIssued: number; totalAgentCommissions: number; totalPlatformFees: number;
  
  // Operational stats
  overdueInvoices: number; pendingApprovals: number; systemHealth: number;
}

// Helper function to get full name from first_name and last_name
const getFullName = (entity: any): string => {
  if (entity.first_name || entity.last_name) {
    const firstName = entity.first_name || '';
    const lastName = entity.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'No name';
  }
  return entity.name || entity.full_name || 'No name';
};

export function AdminDashboard() {
  console.log('🚀 AdminDashboard component loaded!');
  const navigate = useNavigate();
  const [stats, setStats] = useState<ComprehensiveStats>({
    totalMembers: 0, activeMembers: 0, totalShops: 0, activeShops: 0, suspendedShops: 0,
    totalAgents: 0, totalPolicyProviders: 0, pendingDay1HealthApprovals: 0, totalPolicies: 0, activePolicies: 0,
    policiesInProgress: 0, totalPolicyValue: 0, totalFundedAmount: 0, revenueThisMonth: 0,
    revenueAllTime: 0, totalTransactions: 0, totalRewardsIssued: 0, totalAgentCommissions: 0,
    totalPlatformFees: 0, overdueInvoices: 0, pendingApprovals: 0, systemHealth: 100
  });
  
  const [recentMembers, setRecentMembers] = useState<Entity[]>([]);
  const [recentShops, setRecentShops] = useState<Entity[]>([]);
  const [recentAgents, setRecentAgents] = useState<Entity[]>([]);
  const [recentProviders, setRecentProviders] = useState<Entity[]>([]);
  const [recentPolicies, setRecentPolicies] = useState<PolicyData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionData[]>([]);
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'error' | 'warning' | 'info'; message: string; action?: () => void }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'members' | 'shops' | 'agents' | 'providers' | 'policies' | 'member-policies' | 'notifications' | 'transactions'>('overview');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [memberToSuspend, setMemberToSuspend] = useState<Entity | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => { 
    console.log('🎯 useEffect triggered - calling loadComprehensiveData');
    loadComprehensiveData(); 
  }, []);

  const checkMembersNeedingProfileCompletion = async (members: any[]) => {
    try {
      const membersNeedingAttention = [];
      
      console.log('🔍 Checking members for profile completion:', members.length);
      if (members.length > 0) {
        console.log('📋 First member sample:', JSON.stringify(members[0], null, 2));
      }
      
      for (const member of members) {
        try {
          // Check if profile is incomplete (temp email or no SA ID)
          const hasIncompleteProfile = 
            !member.email || 
            member.email.includes('@plus1rewards.local') || 
            !member.sa_id;
          
          console.log(`Member ${getFullName(member)}: incomplete=${hasIncompleteProfile}, has_policy=${!!member.active_policy}, email=${member.email}`);
          
          // Skip if profile is complete OR no active policy
          if (!hasIncompleteProfile || !member.active_policy) continue;
          
          // Get member's policy plan to check target
          const { data: policyPlan, error: planError } = await supabaseAdmin
            .from('policy_plans')
            .select('monthly_target')
            .eq('id', member.active_policy)
            .single();
          
          if (planError) {
            console.log(`Error fetching policy plan for member ${getFullName(member)}:`, planError);
            continue;
          }
          
          if (!policyPlan) {
            console.log(`No policy plan found for member ${getFullName(member)}`);
            continue;
          }
          
          // Get member's total rewards
          const { data: wallets, error: walletsError } = await supabaseAdmin
            .from('wallets')
            .select('rewards_total')
            .eq('member_id', member.id);
          
          if (walletsError) {
            console.log(`Error fetching wallets for member ${getFullName(member)}:`, walletsError);
            continue;
          }
          
          const totalRewards = (wallets || []).reduce((sum, w) => sum + (w.rewards_total || 0), 0);
          const percentComplete = (totalRewards / policyPlan.monthly_target) * 100;
          
          console.log(`Member ${getFullName(member)}: ${percentComplete.toFixed(1)}% complete (R${totalRewards}/R${policyPlan.monthly_target})`);
          
          // Alert if 90% or more complete
          if (percentComplete >= 90) {
            console.log(`⚠️ ALERT: Member ${getFullName(member)} needs profile verification!`);
            membersNeedingAttention.push({
              id: member.id,
              name: getFullName(member),
              phone: member.cell_phone,
              percentComplete: percentComplete.toFixed(1),
              amountFunded: totalRewards,
              target: policyPlan.monthly_target
            });
          }
        } catch (memberError) {
          console.error(`Error processing member ${getFullName(member)}:`, memberError);
        }
      }
      
      console.log('✅ Members needing attention:', membersNeedingAttention);
      return membersNeedingAttention;
    } catch (error) {
      console.error('❌ Error in checkMembersNeedingProfileCompletion:', error);
      return [];
    }
  };

  const loadComprehensiveData = async () => {
    console.log('🔄 loadComprehensiveData started');
    setLoading(true);
    try {
      // Load all entity data in parallel
      const [
        membersResult, shopsResult, agentsResult, providersResult,
        policiesResult, transactionsResult, invoicesResult
      ] = await Promise.all([
        supabaseAdmin.from("members").select("*").order('created_at', { ascending: false }).then((result: any) => {
          if (result.error) {
            console.error('members query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("partners").select("*").order('created_at', { ascending: false }).then((result: any) => {
          if (result.error) {
            console.error('partners query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("agents").select("*").order('created_at', { ascending: false }).then((result: any) => {
          if (result.error) {
            console.error('agents query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("insurers").select("*").order('created_at', { ascending: false }).then((result: any) => {
          if (result.error) {
            console.warn('insurers query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("member_cover_plans").select(`
          *, cover_plans(plan_name, monthly_target_amount)
        `).order('created_at', { ascending: false }).then((result: any) => {
          if (result.error) {
            console.warn('member_cover_plans query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("transactions").select(`
          *, partners(shop_name), members(first_name, last_name), agents(first_name, last_name)
        `).order('created_at', { ascending: false }).limit(50).then((result: any) => {
          // Handle case where transactions table has issues
          if (result.error) {
            console.warn('transactions query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("partner_invoices").select("*").then((result: any) => {
          // Handle case where monthly_invoices table doesn't exist
          if (result.error && result.error.code === 'PGRST116') {
            console.warn('monthly_invoices table does not exist yet');
            return { data: [], error: null };
          }
          return result;
        })
      ]);

      const members = membersResult.data || [];
      const shops = shopsResult.data || [];
      const agents = agentsResult.data || [];
      const insurers = providersResult.data || [];
      const coverPlans = policiesResult.data || [];
      const transactions = transactionsResult.data || [];
      const invoices = invoicesResult.data || [];

      // Calculate comprehensive stats
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthTransactions = transactions.filter((t: any) => t.created_at.startsWith(currentMonth));
      
      const comprehensiveStats: ComprehensiveStats = {
        // Entity counts
        totalMembers: members.length,
        activeMembers: members.filter((m: any) => m.qr_code).length,
        totalShops: shops.length,
        activeShops: shops.filter((s: any) => s.status === 'active').length,
        suspendedShops: shops.filter((s: any) => s.status === 'suspended').length,
        totalAgents: agents.length,
        totalPolicyProviders: insurers.length,
        pendingDay1HealthApprovals: coverPlans.filter((p: any) => p.status === 'pending').length,
        
        // Policy stats
        totalPolicies: coverPlans.length,
        activePolicies: coverPlans.filter((p: any) => p.status === 'active').length,
        policiesInProgress: coverPlans.filter((p: any) => p.status === 'in_progress').length,
        totalPolicyValue: coverPlans.reduce((sum: number, p: any) => sum + (parseFloat(p.target_amount) || 0), 0),
        totalFundedAmount: coverPlans.reduce((sum: number, p: any) => sum + (parseFloat(p.funded_amount) || 0), 0),
        
        // Financial stats
        revenueThisMonth: thisMonthTransactions.reduce((sum: number, t: any) => sum + (t.platform_fee || 0), 0),
        revenueAllTime: transactions.reduce((sum: number, t: any) => sum + (t.platform_fee || 0), 0),
        totalTransactions: transactions.length,
        totalRewardsIssued: transactions.reduce((sum: number, t: any) => sum + (t.member_reward || 0), 0),
        totalAgentCommissions: transactions.reduce((sum: number, t: any) => sum + (t.agent_commission || 0), 0),
        totalPlatformFees: transactions.reduce((sum: number, t: any) => sum + (t.platform_fee || 0), 0),
        
        // Operational stats
        overdueInvoices: invoices.filter((i: any) => i.status === 'overdue').length,
        pendingApprovals: (providersResult.data || []).filter((p: any) => p.status === 'pending').length + 
                         (shopsResult.data || []).filter((s: any) => s.status === 'pending').length,
        systemHealth: Math.round((((shopsResult.data || []).filter((s: any) => s.status === 'active').length / Math.max((shopsResult.data || []).length, 1)) * 100))
      };

      setStats(comprehensiveStats);

      // Set recent data for tables
      setRecentMembers((membersResult.data || []).slice(0, 10).map((m: any) => ({ ...m, type: 'member' })));
      setRecentShops((shopsResult.data || []).slice(0, 10).map((s: any) => ({ ...s, type: 'shop' })));
      setRecentAgents((agentsResult.data || []).slice(0, 10).map((a: any) => ({ ...a, type: 'agent' })));
      setRecentProviders((providersResult.data || []).slice(0, 10).map((p: any) => ({ ...p, type: 'insurer' })));
      
      setRecentPolicies((policiesResult.data || []).slice(0, 10).map((p: any) => ({
        id: p.id,
        member_name: p.members?.first_name || 'Unknown',
        plan_name: p.cover_plans?.plan_name || 'Unknown Plan',
        provider_name: p.insurers?.provider_name || 'Unknown Provider',
        status: p.status,
        monthly_premium: p.monthly_premium || 0,
        amount_funded: p.amount_funded || 0,
        start_date: p.start_date
      })));

      setRecentTransactions(transactions.slice(0, 20).map((t: any) => ({
        id: t.id,
        partner_name: t.partners?.shop_name || 'Unknown Partner',
        member_name: t.members ? `${t.members.first_name || ''} ${t.members.last_name || ''}`.trim() || 'Unknown Member' : 'Unknown Member',
        agent_name: t.agents ? `${t.agents.first_name || ''} ${t.agents.last_name || ''}`.trim() : undefined,
        purchase_amount: t.purchase_amount || 0,
        member_reward: t.member_reward || 0,
        agent_commission: t.agent_commission || 0,
        platform_fee: t.platform_fee || 0,
        status: t.status,
        created_at: t.created_at
      })));

      // Generate alerts
      const newAlerts = [];
      
      console.log('🔍 About to check members needing profile completion...');
      // Check for members at 90%+ policy completion with incomplete profiles
      const membersNeedingProfileCompletion = await checkMembersNeedingProfileCompletion(members);
      console.log('✅ checkMembersNeedingProfileCompletion returned:', membersNeedingProfileCompletion);
      if (membersNeedingProfileCompletion.length > 0) {
        newAlerts.push({
          id: 'incomplete-profiles-90',
          type: 'warning' as const,
          message: `${membersNeedingProfileCompletion.length} member(s) at 90%+ policy completion need profile verification`,
          action: () => navigate('/admin/members')
        });
      }
      
      if (comprehensiveStats.suspendedShops > 0) {
        newAlerts.push({
          id: 'suspended-shops',
          type: 'warning' as const,
          message: `${comprehensiveStats.suspendedShops} shops suspended - revenue impact detected`,
          action: () => navigate('/admin/suspensions')
        });
      }
      if (comprehensiveStats.overdueInvoices > 0) {
        newAlerts.push({
          id: 'overdue-invoices',
          type: 'error' as const,
          message: `${comprehensiveStats.overdueInvoices} overdue invoices require immediate action`,
          action: () => navigate('/admin/invoices')
        });
      }
      if (comprehensiveStats.pendingApprovals > 0) {
        newAlerts.push({
          id: 'pending-approvals',
          type: 'info' as const,
          message: `${comprehensiveStats.pendingApprovals} registrations awaiting approval`,
          action: () => setActiveView('shops')
        });
      }
      if (comprehensiveStats.systemHealth < 80) {
        newAlerts.push({
          id: 'system-health',
          type: 'warning' as const,
          message: `System health at ${comprehensiveStats.systemHealth}% - check suspended entities`
        });
      }

      setAlerts(newAlerts);
      console.log('✅ Alerts set:', newAlerts);

    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setAlerts([{
        id: 'load-error',
        type: 'error',
        message: 'Failed to load dashboard data. Please refresh the page.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const updateEntityStatus = async (entityType: string, id: string, newStatus: string) => {
    try {
      const { error } = await supabaseAdmin
        .from(entityType)
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      loadComprehensiveData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSuspendMember = (member: Entity) => {
    setMemberToSuspend(member);
    setSuspensionReason('');
    setSuspendModalOpen(true);
  };

  const confirmSuspendMember = async () => {
    if (!memberToSuspend || !suspensionReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      // Update member status to suspended
      const { error: memberError } = await supabaseAdmin
        .from('members')
        .update({ status: 'suspended' })
        .eq('id', memberToSuspend.id);
      
      if (memberError) throw memberError;

      // Suspend all member's cover plans
      const { error: plansError } = await supabaseAdmin
        .from('member_cover_plans')
        .update({ 
          status: 'suspended',
          suspended_at: new Date().toISOString()
        })
        .eq('member_id', memberToSuspend.id);
      
      if (plansError) throw plansError;

      // Create admin notification for audit trail
      await supabaseAdmin.from('admin_notifications').insert({
        type: 'member_suspended',
        member_id: memberToSuspend.id,
        member_name: getFullName(memberToSuspend),
        member_phone: memberToSuspend.cell_phone,
        message: `Member ${getFullName(memberToSuspend)} (${memberToSuspend.cell_phone}) has been SUSPENDED by admin. Reason: ${suspensionReason}`,
        priority: 'high',
        metadata: {
          suspension_reason: suspensionReason,
          suspended_at: new Date().toISOString(),
          action: 'member_suspended'
        }
      });

      // Close modal and refresh
      setSuspendModalOpen(false);
      setMemberToSuspend(null);
      setSuspensionReason('');
      loadComprehensiveData();
      
      alert(`Member ${getFullName(memberToSuspend)} has been suspended successfully.`);
    } catch (error) {
      console.error('Failed to suspend member:', error);
      alert('Failed to suspend member. Please try again.');
    }
  };

  const deleteEntity = async (entityType: string, id: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabaseAdmin
        .from(entityType)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      loadComprehensiveData();
    } catch (error) {
      console.error('Failed to delete entity:', error);
    }
  };

  const kpiCards = [
    // Entity Overview
    { label: 'Total Members', value: stats.totalMembers.toLocaleString(), sub: `${stats.activeMembers} with QR codes`, color: 'var(--blue)', category: 'entities' },
    { label: 'Total Shops', value: stats.totalShops.toLocaleString(), sub: `${stats.activeShops} active, ${stats.suspendedShops} suspended`, color: 'var(--green-dark)', category: 'entities' },
    { label: 'Total Agents', value: stats.totalAgents.toLocaleString(), sub: 'Sales representatives', color: '#0891b2', category: 'entities' },
    { label: 'Pending Day1Health Approval', value: stats.pendingDay1HealthApprovals.toLocaleString(), sub: 'Awaiting verification', color: '#f59e0b', category: 'entities' },
    
    // Policy Overview
    { label: 'Total Policies', value: stats.totalPolicies.toLocaleString(), sub: `${stats.activePolicies} active`, color: 'var(--blue)', category: 'policies' },
    { label: 'Policies In Progress', value: stats.policiesInProgress.toLocaleString(), sub: 'Being funded', color: 'var(--orange)', category: 'policies' },
    { label: 'Total Policy Value', value: `R${stats.totalPolicyValue.toLocaleString()}`, sub: 'Monthly premiums', color: 'var(--green-dark)', category: 'policies' },
    { label: 'Total Funded', value: `R${stats.totalFundedAmount.toLocaleString()}`, sub: 'Via rewards', color: '#0e7490', category: 'policies' },
    
    // Financial Overview
    { label: 'Revenue This Month', value: `R${stats.revenueThisMonth.toLocaleString()}`, sub: 'Platform fees', color: 'var(--blue)', category: 'financial' },
    { label: 'All-Time Revenue', value: `R${stats.revenueAllTime.toLocaleString()}`, sub: 'Total platform fees', color: 'var(--green-dark)', category: 'financial' },
    { label: 'Total Rewards Issued', value: `R${stats.totalRewardsIssued.toLocaleString()}`, sub: 'To members', color: '#0891b2', category: 'financial' },
    { label: 'Agent Commissions', value: `R${stats.totalAgentCommissions.toLocaleString()}`, sub: 'Total paid out', color: '#0e7490', category: 'financial' },
    
    // Operational Overview
    { label: 'Total Transactions', value: stats.totalTransactions.toLocaleString(), sub: 'All time', color: 'var(--blue)', category: 'operational' },
    { label: 'Overdue Invoices', value: stats.overdueInvoices.toLocaleString(), sub: 'Require action', color: 'var(--red)', category: 'operational' },
    { label: 'Pending Approvals', value: stats.pendingApprovals.toLocaleString(), sub: 'New registrations', color: 'var(--orange)', category: 'operational' },
    { label: 'System Health', value: `${stats.systemHealth}%`, sub: 'Active entities', color: stats.systemHealth >= 90 ? 'var(--green-dark)' : stats.systemHealth >= 70 ? 'var(--orange)' : 'var(--red)', category: 'operational' },
  ];

  if (loading) return (
    <div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--blue-light)', borderTopColor: 'var(--blue)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--gray-text)' }}>Loading comprehensive admin dashboard...</p>
    </div>
  );

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '90rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="logo-mark-white"><span className="logo-text">+1</span></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>🔧 ADMIN CONTROL CENTER</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Complete Platform Management</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button onClick={loadComprehensiveData} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
              🔄 Refresh All Data
            </button>
            <button onClick={() => { localStorage.removeItem("currentAdmin"); navigate("/"); }} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Critical Alerts */}
          {alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {alerts.map(alert => (
                <div key={alert.id} className={`alert alert-${alert.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : '💡'} {alert.message}
                  </span>
                  {alert.action && (
                    <button onClick={alert.action} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '0.25rem 0.75rem', color: 'inherit', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      Take Action
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Incomplete Profile Alerts */}
          <IncompleteProfileAlerts />

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--gray-border)', paddingBottom: '0.5rem' }}>
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'members', label: 'Members', icon: '👤', count: stats.totalMembers },
              { key: 'member-policies', label: 'Member Policies', icon: '🩺', count: stats.totalPolicies },
              { key: 'notifications', label: 'Notifications', icon: '🔔' },
              { key: 'shops', label: 'Shops', icon: '🏪', count: stats.totalShops },
              { key: 'agents', label: 'Agents', icon: '📈', count: stats.totalAgents },
              { key: 'providers', label: 'Pending Day1Health', icon: '⏳', count: stats.pendingDay1HealthApprovals },
              { key: 'policies', label: 'Policies', icon: '📋', count: stats.totalPolicies },
              { key: 'transactions', label: 'Transactions', icon: '💳', count: stats.totalTransactions }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                style={{
                  background: activeView === tab.key ? 'var(--blue)' : 'transparent',
                  color: activeView === tab.key ? '#fff' : 'var(--gray-text)',
                  border: 'none', borderRadius: '8px',
                  padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{ background: activeView === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--gray-light)', borderRadius: '12px', padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Overview Tab - KPI Cards */}
          {activeView === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {kpiCards.map((kpi, i) => (
                  <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${kpi.color}` }}>
                    <p className="stat-label">{kpi.label}</p>
                    <p className="stat-value" style={{ color: kpi.color }}>{kpi.value}</p>
                    <p className="stat-sub">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="section-title">⚡ Admin Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Partner Invoices', description: 'Manage billing & payments', action: () => navigate('/admin/invoices'), color: 'var(--blue)', icon: 'receipt' },
                    { label: 'Manage Partners', description: 'Handle suspensions & status', action: () => navigate('/admin/partners'), color: 'var(--red)', icon: 'block' },
                    { label: 'Agent Commissions', description: 'Process commission payouts', action: () => navigate('/admin/commissions'), color: '#0e7490', icon: 'paid' },
                    { label: 'Export System Data', description: 'CSV/Excel system export', action: () => navigate('/admin/exports'), color: 'var(--green-dark)', icon: 'ios_share' },
                    { label: 'Policy Providers', description: 'Edit insurance partners', action: () => navigate('/admin/providers'), color: '#064e3b', icon: 'corporate_fare' },
                    { label: 'Policy Management', description: 'Configuration & pricing', action: () => navigate('/admin/settings'), color: '#7c3aed', icon: 'settings_suggest' },
                    { label: 'Transactions', description: 'Real-time flow audit', action: () => navigate('/admin/transactions'), color: '#0891b2', icon: 'monitoring' },
                    { label: 'Members', description: 'Profiles & rewards history', action: () => navigate('/admin/members'), color: 'var(--blue)', icon: 'person_search' },
                  ].map((action, i) => (
                    <button key={i} onClick={action.action}
                      style={{ 
                        background: action.color, color: '#fff', border: 'none', 
                        borderRadius: '12px', padding: '1.25rem', fontSize: '0.875rem', 
                        fontWeight: 700, cursor: 'pointer', textAlign: 'left', 
                        transition: 'all 0.2s', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}
                      onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseOut={e => (e.currentTarget.style.transform = 'none')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', flexShrink: 0 }}>{action.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{action.label}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{action.description}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
                        <span>Access</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>chevron_right</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Members Tab */}
          {activeView === 'members' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>👤 All Members ({stats.totalMembers.toLocaleString()})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-blue">{stats.activeMembers} with QR</span>
                  <span className="badge badge-gray">{stats.totalMembers - stats.activeMembers} incomplete</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Contact</th>
                      <th>QR Code</th>
                      <th>Status</th>
                      <th>Active Policy</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map(member => (
                      <tr key={member.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{getFullName(member)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            ID: {member.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <div>{member.email || 'No email'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            {member.cell_phone || 'No phone'}
                          </div>
                        </td>
                        <td>
                          {member.qr_code ? (
                            <span className="badge badge-green">✓ Generated</span>
                          ) : (
                            <span className="badge badge-red">✗ Missing</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            member.status === 'active' ? 'badge-green' :
                            member.status === 'suspended' ? 'badge-red' :
                            'badge-yellow'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            {member.active_policy || 'None selected'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {member.status === 'suspended' ? (
                              <button
                                onClick={() => updateEntityStatus('members', member.id, 'active')}
                                style={{
                                  background: '#16a34a', color: '#fff', border: 'none',
                                  borderRadius: '4px', padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                                }}
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendMember(member)}
                                style={{
                                  background: '#ea580c', color: '#fff', border: 'none',
                                  borderRadius: '4px', padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                                }}
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => deleteEntity('members', member.id)}
                              style={{
                                background: '#ef4444', color: '#fff', border: 'none',
                                borderRadius: '4px', padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem', cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Member Policies Tab */}
          {activeView === 'member-policies' && (
            <div className="card">
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
                🩺 Member Policy Management
              </h2>
              <MemberPoliciesAdmin />
            </div>
          )}
          {/* Notifications Tab */}
          {activeView === 'notifications' && (
            <AdminNotificationsPage />
          )}
          {/* Shops Tab */}
          {activeView === 'shops' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>🏪 All Shops ({stats.totalShops.toLocaleString()})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-green">{stats.activeShops} active</span>
                  <span className="badge badge-red">{stats.suspendedShops} suspended</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Contact</th>
                      <th>Commission Rate</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentShops.map(shop => (
                      <tr key={shop.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{shop.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            ID: {shop.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <div>{shop.email || 'No email'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            {shop.cell_phone}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--green-dark)' }}>
                          {shop.commission_rate}%
                        </td>
                        <td>
                          <span className={`badge ${
                            shop.status === 'active' ? 'badge-green' :
                            shop.status === 'suspended' ? 'badge-red' :
                            'badge-yellow'
                          }`}>
                            {shop.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {shop.location || 'Not specified'}
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(shop.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                              value={shop.status}
                              onChange={(e) => updateEntityStatus('partners', shop.id, e.target.value)}
                              style={{
                                padding: '0.5rem', fontSize: '0.75rem', borderRadius: '4px',
                                border: '1px solid var(--gray-border)', background: '#fff',
                                fontWeight: 600,
                                color: shop.status === 'active' ? '#16a34a' : shop.status === 'suspended' ? '#dc2626' : '#ea580c'
                              }}
                            >
                              <option value="active">✓ Active</option>
                              <option value="suspended">⊘ Suspended</option>
                              <option value="pending">⏳ Pending</option>
                              <option value="rejected">✗ Rejected</option>
                            </select>
                            <button
                              onClick={() => deleteEntity('partners', shop.id)}
                              style={{
                                background: '#ef4444', color: '#fff', border: 'none',
                                borderRadius: '4px', padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem', cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeView === 'agents' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>📈 All Agents ({stats.totalAgents.toLocaleString()})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-blue">R{stats.totalAgentCommissions.toLocaleString()} total commissions</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Total Commission</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAgents.map(agent => (
                      <tr key={agent.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{agent.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            ID: {agent.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <div>{agent.email || 'No email'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            {agent.cell_phone}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            agent.status === 'active' ? 'badge-green' :
                            agent.status === 'suspended' ? 'badge-red' :
                            'badge-yellow'
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--green-dark)' }}>
                          R{(agent.total_commission || 0).toLocaleString()}
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(agent.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                              value={agent.status}
                              onChange={(e) => updateEntityStatus('agents', agent.id, e.target.value)}
                              style={{
                                padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px',
                                border: '1px solid var(--gray-border)', background: '#fff'
                              }}
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <button
                              onClick={() => deleteEntity('agents', agent.id)}
                              style={{
                                background: '#ef4444', color: '#fff', border: 'none',
                                borderRadius: '4px', padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem', cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Day1Health Approvals Tab */}
          {activeView === 'providers' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>⏳ Pending Day1Health Approvals ({stats.pendingDay1HealthApprovals.toLocaleString()})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-orange">{stats.pendingDay1HealthApprovals} awaiting verification</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Plan</th>
                      <th>Target Amount</th>
                      <th>Funded Amount</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPolicies.filter(p => p.status === 'pending').length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-text)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '3rem' }}>✅</div>
                            <div>
                              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>No Pending Approvals</h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-light)' }}>
                                All policies have been verified by Day1Health
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : recentPolicies.filter(p => p.status === 'pending').map(policy => (
                      <tr key={policy.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{policy.member_name}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{policy.plan_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            {policy.provider_name}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--blue)' }}>
                          R{policy.monthly_premium?.toFixed(2) || '0.00'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--green-dark)' }}>
                          R{policy.amount_funded?.toFixed(2) || '0.00'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '60px', height: '6px', background: 'var(--gray-light)', 
                              borderRadius: '3px', overflow: 'hidden' 
                            }}>
                              <div style={{ 
                                width: `${Math.min(100, ((policy.amount_funded || 0) / (policy.monthly_premium || 1)) * 100)}%`, 
                                height: '100%', 
                                background: 'var(--orange)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-text)' }}>
                              {Math.min(100, ((policy.amount_funded || 0) / (policy.monthly_premium || 1)) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-orange">
                            Pending Verification
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(policy.start_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Policies Tab */}
          {activeView === 'policies' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>🏥 All Policies ({stats.totalPolicies.toLocaleString()})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-green">{stats.activePolicies} active</span>
                  <span className="badge badge-orange">{stats.policiesInProgress} in progress</span>
                  <span className="badge badge-blue">R{stats.totalPolicyValue.toLocaleString()} total value</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Plan</th>
                      <th>Provider</th>
                      <th>Monthly Premium</th>
                      <th>Amount Funded</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPolicies.map(policy => (
                      <tr key={policy.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{policy.member_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            ID: {policy.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{policy.plan_name}</td>
                        <td>{policy.provider_name}</td>
                        <td style={{ fontWeight: 700, color: 'var(--blue)' }}>
                          R{policy.monthly_premium.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--green-dark)' }}>
                          R{policy.amount_funded.toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '60px', height: '6px', background: 'var(--gray-light)', 
                              borderRadius: '3px', overflow: 'hidden' 
                            }}>
                              <div style={{ 
                                width: `${Math.min((policy.amount_funded / policy.monthly_premium) * 100, 100)}%`, 
                                height: '100%', 
                                background: policy.amount_funded >= policy.monthly_premium ? 'var(--green-dark)' : 'var(--orange)',
                                transition: 'width 0.3s'
                              }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {Math.round((policy.amount_funded / policy.monthly_premium) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            policy.status === 'active' ? 'badge-green' :
                            policy.status === 'pending' ? 'badge-orange' :
                            'badge-red'
                          }`}>
                            {policy.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(policy.start_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeView === 'transactions' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>💳 Recent Transactions ({stats.totalTransactions.toLocaleString()} total)</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-blue">R{stats.totalRewardsIssued.toLocaleString()} rewards</span>
                  <span className="badge badge-green">R{stats.revenueAllTime.toLocaleString()} platform fees</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Member</th>
                      <th>Agent</th>
                      <th>Purchase</th>
                      <th>Member Reward</th>
                      <th>Agent Commission</th>
                      <th>Platform Fee</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{transaction.partner_name}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{transaction.member_name}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            {transaction.agent_name || 'Direct'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--blue)' }}>
                          R{transaction.purchase_amount.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--green-dark)' }}>
                          R{transaction.member_reward.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0891b2' }}>
                          R{transaction.agent_commission.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--orange)' }}>
                          R{transaction.platform_fee.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${
                            transaction.status === 'synced' ? 'badge-green' :
                            transaction.status === 'pending_sync' ? 'badge-orange' :
                            'badge-red'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {transaction.transaction_time || new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Suspend Member Modal */}
      {suspendModalOpen && memberToSuspend && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setSuspendModalOpen(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#fff',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>block</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Suspend Member</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                  This will freeze all transactions and funds
                </p>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Member Info */}
              <div style={{
                background: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '1.5rem' }}>warning</span>
                  <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: '0.875rem' }}>
                    WARNING: This action will:
                  </p>
                </div>
                <ul style={{ margin: '0.5rem 0 0 2.25rem', padding: 0, fontSize: '0.875rem', color: '#7f1d1d' }}>
                  <li>Suspend member account access</li>
                  <li>Freeze all cover plans</li>
                  <li>Block all future transactions</li>
                  <li>Prevent cashback earnings</li>
                </ul>
              </div>

              {/* Member Details */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Member Details
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{getFullName(memberToSuspend)}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <div>📧 {memberToSuspend.email || 'No email'}</div>
                    <div>📱 {memberToSuspend.cell_phone || 'No phone'}</div>
                    <div>🆔 {memberToSuspend.id.slice(0, 13)}...</div>
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#374151'
                }}>
                  Reason for Suspension <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter detailed reason for suspending this member (e.g., fraudulent activity, policy violation, etc.)"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  This reason will be logged for audit purposes
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setSuspendModalOpen(false);
                    setMemberToSuspend(null);
                    setSuspensionReason('');
                  }}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSuspendMember}
                  disabled={!suspensionReason.trim()}
                  style={{
                    flex: 1,
                    background: suspensionReason.trim() ? '#dc2626' : '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: suspensionReason.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    if (suspensionReason.trim()) {
                      e.currentTarget.style.background = '#991b1b';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (suspensionReason.trim()) {
                      e.currentTarget.style.background = '#dc2626';
                    }
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>block</span>
                  Suspend Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}