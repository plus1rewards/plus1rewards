import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseAdmin } from "../lib/supabase";
import IncompleteProfileAlerts from "../components/admin/IncompleteProfileAlerts";

interface Entity {
  id: string; name: string; email?: string; phone?: string; status: string; 
  created_at: string; type: string; commission_rate?: number; total_commission?: number;
  company_name?: string; location?: string; qr_code?: string; active_policy?: string;
}

interface PolicyData {
  id: string; member_name: string; plan_name: string; provider_name: string;
  status: string; monthly_premium: number; amount_funded: number; start_date: string;
}

interface TransactionData {
  id: string; partner_name: string; member_name: string; agent_name?: string;
  purchase_amount: number; member_reward: number; agent_commission: number;
  platform_fee: number; status: string; created_at: string;
}

interface ComprehensiveStats {
  // Entity counts
  totalMembers: number; activeMembers: number; totalShops: number; activeShops: number;
  suspendedShops: number; totalAgents: number; totalPolicyProviders: number;
  
  // Policy stats
  totalPolicies: number; activePolicies: number; policiesInProgress: number;
  totalPolicyValue: number; totalFundedAmount: number;
  
  // Financial stats
  revenueThisMonth: number; revenueAllTime: number; totalTransactions: number;
  totalRewardsIssued: number; totalAgentCommissions: number; totalPlatformFees: number;
  
  // Operational stats
  overdueInvoices: number; pendingApprovals: number; systemHealth: number;
}

export function AdminDashboard() {
  console.log('🚀 AdminDashboard component loaded!');
  const navigate = useNavigate();
  const [stats, setStats] = useState<ComprehensiveStats>({
    totalMembers: 0, activeMembers: 0, totalShops: 0, activeShops: 0, suspendedShops: 0,
    totalAgents: 0, totalPolicyProviders: 0, totalPolicies: 0, activePolicies: 0,
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
  const [activeView, setActiveView] = useState<'overview' | 'members' | 'shops' | 'agents' | 'providers' | 'policies' | 'transactions'>('overview');

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
          
          console.log(`Member ${member.name}: incomplete=${hasIncompleteProfile}, has_policy=${!!member.active_policy}, email=${member.email}`);
          
          // Skip if profile is complete OR no active policy
          if (!hasIncompleteProfile || !member.active_policy) continue;
          
          // Get member's policy plan to check target
          const { data: policyPlan, error: planError } = await supabaseAdmin
            .from('policy_plans')
            .select('monthly_target')
            .eq('id', member.active_policy)
            .single();
          
          if (planError) {
            console.log(`Error fetching policy plan for member ${member.name}:`, planError);
            continue;
          }
          
          if (!policyPlan) {
            console.log(`No policy plan found for member ${member.name}`);
            continue;
          }
          
          // Get member's total rewards
          const { data: wallets, error: walletsError } = await supabaseAdmin
            .from('wallets')
            .select('rewards_total')
            .eq('member_id', member.id);
          
          if (walletsError) {
            console.log(`Error fetching wallets for member ${member.name}:`, walletsError);
            continue;
          }
          
          const totalRewards = (wallets || []).reduce((sum, w) => sum + (w.rewards_total || 0), 0);
          const percentComplete = (totalRewards / policyPlan.monthly_target) * 100;
          
          console.log(`Member ${member.name}: ${percentComplete.toFixed(1)}% complete (R${totalRewards}/R${policyPlan.monthly_target})`);
          
          // Alert if 90% or more complete
          if (percentComplete >= 90) {
            console.log(`⚠️ ALERT: Member ${member.name} needs profile verification!`);
            membersNeedingAttention.push({
              id: member.id,
              name: member.name,
              phone: member.phone,
              percentComplete: percentComplete.toFixed(1),
              amountFunded: totalRewards,
              target: policyPlan.monthly_target
            });
          }
        } catch (memberError) {
          console.error(`Error processing member ${member.name}:`, memberError);
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
        supabase.from("members").select("*").order('created_at', { ascending: false }).then(result => {
          if (result.error) {
            console.error('members query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabase.from("partners").select("*").order('created_at', { ascending: false }).then(result => {
          if (result.error) {
            console.error('partners query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabase.from("agents").select("*").order('created_at', { ascending: false }).then(result => {
          if (result.error) {
            console.error('agents query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("insurers").select("*").order('created_at', { ascending: false }).then(result => {
          if (result.error) {
            console.warn('insurers query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabaseAdmin.from("member_cover_plans").select(`
          *, cover_plans(plan_name, monthly_target_amount)
        `).order('created_at', { ascending: false }).then(result => {
          if (result.error) {
            console.warn('member_cover_plans query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabase.from("transactions").select(`
          *, partners(shop_name), members(full_name), agents(full_name)
        `).order('created_at', { ascending: false }).limit(50).then(result => {
          // Handle case where transactions table has issues
          if (result.error) {
            console.warn('transactions query error:', result.error);
            return { data: [], error: null };
          }
          return result;
        }),
        supabase.from("partner_invoices").select("*").then(result => {
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
      const thisMonthTransactions = transactions.filter(t => t.created_at.startsWith(currentMonth));
      
      const comprehensiveStats: ComprehensiveStats = {
        // Entity counts
        totalMembers: members.length,
        activeMembers: members.filter(m => m.qr_code).length,
        totalShops: shops.length,
        activeShops: shops.filter(s => s.status === 'active').length,
        suspendedShops: shops.filter(s => s.status === 'suspended').length,
        totalAgents: agents.length,
        totalPolicyProviders: insurers.length,
        
        // Policy stats
        totalPolicies: coverPlans.length,
        activePolicies: coverPlans.filter(p => p.status === 'active').length,
        policiesInProgress: coverPlans.filter(p => p.status === 'in_progress').length,
        totalPolicyValue: coverPlans.reduce((sum, p) => sum + (parseFloat(p.target_amount) || 0), 0),
        totalFundedAmount: coverPlans.reduce((sum, p) => sum + (parseFloat(p.funded_amount) || 0), 0),
        
        // Financial stats
        revenueThisMonth: thisMonthTransactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0),
        revenueAllTime: transactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0),
        totalTransactions: transactions.length,
        totalRewardsIssued: transactions.reduce((sum, t) => sum + (t.member_reward || 0), 0),
        totalAgentCommissions: transactions.reduce((sum, t) => sum + (t.agent_commission || 0), 0),
        totalPlatformFees: transactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0),
        
        // Operational stats
        overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
        pendingApprovals: providers.filter(p => p.status === 'pending').length + 
                         shops.filter(s => s.status === 'pending').length,
        systemHealth: Math.round(((shops.filter(s => s.status === 'active').length / Math.max(shops.length, 1)) * 100))
      };

      setStats(comprehensiveStats);

      // Set recent data for tables
      setRecentMembers(members.slice(0, 10).map(m => ({ ...m, type: 'member' })));
      setRecentShops(shops.slice(0, 10).map(s => ({ ...s, type: 'shop' })));
      setRecentAgents(agents.slice(0, 10).map(a => ({ ...a, type: 'agent' })));
      setRecentProviders(insurers.slice(0, 10).map(p => ({ ...p, type: 'insurer' })));
      
      setRecentPolicies(policies.slice(0, 10).map(p => ({
        id: p.id,
        member_name: p.members?.name || 'Unknown',
        plan_name: p.policy_plans?.name || 'Unknown Plan',
        provider_name: p.policy_providers?.name || 'Unknown Provider',
        status: p.status,
        monthly_premium: p.monthly_premium || 0,
        amount_funded: p.amount_funded || 0,
        start_date: p.start_date
      })));

      setRecentTransactions(transactions.slice(0, 20).map(t => ({
        id: t.id,
        partner_name: t.partners?.name || 'Unknown Partner',
        member_name: t.members?.name || 'Unknown Member',
        agent_name: t.agents?.name,
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
    { label: 'Policy Providers', value: stats.totalPolicyProviders.toLocaleString(), sub: 'Insurance partners', color: '#064e3b', category: 'entities' },
    
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
              { key: 'shops', label: 'Shops', icon: '🏪', count: stats.totalShops },
              { key: 'agents', label: 'Agents', icon: '📈', count: stats.totalAgents },
              { key: 'providers', label: 'Policy Providers', icon: '🏥', count: stats.totalPolicyProviders },
              { key: 'policies', label: 'Policies', icon: '🩺', count: stats.totalPolicies },
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
                      <th>Active Policy</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map(member => (
                      <tr key={member.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{member.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            ID: {member.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <div>{member.email || 'No email'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            {member.phone || 'No phone'}
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
                          <span className="badge badge-blue">
                            {member.active_policy || 'None selected'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                            {shop.phone}
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
                            {agent.phone}
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

          {/* Policy Providers Tab */}
          {activeView === 'providers' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>🏥 All Policy Providers ({stats.totalPolicyProviders.toLocaleString()})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-green">{recentProviders.filter(p => p.status === 'active').length} active</span>
                  <span className="badge badge-orange">{recentProviders.filter(p => p.status === 'pending').length} pending approval</span>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Commission Rate</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProviders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-text)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '3rem' }}>🏥</div>
                            <div>
                              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>No Policy Providers Found</h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-light)' }}>
                                The policy_providers table may not exist yet.<br/>
                                Run the CREATE_POLICY_PROVIDERS_TABLE.sql file to set up the table.
                              </p>
                            </div>
                            <button 
                              onClick={() => window.open('/provider/register', '_blank')}
                              style={{ 
                                background: 'var(--blue)', color: '#fff', border: 'none',
                                borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.875rem',
                                fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              Register New Provider
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : recentProviders.map(provider => (
                      <tr key={provider.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{provider.full_name || provider.provider_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            ID: {provider.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{provider.provider_name}</div>
                        </td>
                        <td>
                          <div>{provider.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                            {provider.phone || provider.mobile_number || 'No phone'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--green-dark)' }}>
                          N/A
                        </td>
                        <td>
                          <span className={`badge ${
                            provider.status === 'active' ? 'badge-green' :
                            provider.status === 'suspended' ? 'badge-red' :
                            'badge-orange'
                          }`}>
                            {provider.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                          {new Date(provider.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                              value={provider.status}
                              onChange={(e) => updateEntityStatus('insurers', provider.id, e.target.value)}
                              style={{
                                padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px',
                                border: '1px solid var(--gray-border)', background: '#fff'
                              }}
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="pending">Pending</option>
                            </select>
                            <button
                              onClick={() => deleteEntity('insurers', provider.id)}
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
    </div>
  );
}