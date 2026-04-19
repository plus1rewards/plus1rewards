// plus1-rewards/src/components/dashboard/pages/AgentsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAgents: 0, verified: 0, pending: 0, sales: 0, commissions: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch agents - details are stored directly in agents table
      const { data: agentsData, error: agentsError } = await supabaseAdmin
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        setAgents([]);
        setLoading(false);
        return;
      }
      
      const totalAgents = agentsData?.length || 0;
      const verified = agentsData?.filter(a => a.status === 'active').length || 0;
      const pending = agentsData?.filter(a => a.status === 'pending').length || 0;
      
      // Get commission totals from transactions table
      const { data: transactionsData } = await supabaseAdmin
        .from('transactions')
        .select('agent_amount')
        .eq('status', 'completed');
      const commissions = transactionsData?.reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0) || 0;
      
      // Calculate per-agent commissions and signed partners
      const agentsWithCommissions = await Promise.all((agentsData || []).map(async (agent) => {
        try {
          const { data: agentTransactions } = await supabaseAdmin
            .from('transactions')
            .select('agent_amount')
            .eq('agent_id', agent.id)
            .eq('status', 'completed');
          
          const agentCommission = agentTransactions?.reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0) || 0;
          
          // Get count of active partner links
          const { data: partnerLinks, error: linksError } = await supabaseAdmin
            .from('partner_agent_links')
            .select('id')
            .eq('agent_id', agent.id)
            .eq('status', 'active');
          
          if (linksError) {
            console.error(`Error fetching partner links for agent ${agent.id}:`, linksError);
          }
          
          const signedPartners = partnerLinks?.length || 0;
          
          console.log(`Agent ${agent.id}: ${signedPartners} signed partners, R${agentCommission.toFixed(2)} commission`);
          
          return {
            ...agent,
            commission: agentCommission,
            signedPartners: signedPartners
          };
        } catch (error) {
          console.error(`Error processing agent ${agent.id}:`, error);
          return {
            ...agent,
            commission: 0,
            signedPartners: 0
          };
        }
      }));
      
      setStats({ totalAgents, verified, pending, sales: 0, commissions });
      setAgents(agentsWithCommissions);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAgent = async (agentId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('agents')
        .update({ 
          status: 'active', 
          approved_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (error) throw error;
      
      alert('Agent approved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error approving agent:', error);
      alert('Failed to approve agent. Please try again.');
    }
  };

  const handleRejectAgent = async (agentId: string) => {
    if (confirm('Are you sure you want to reject this agent application?')) {
      try {
        const { error } = await supabaseAdmin
          .from('agents')
          .update({ status: 'rejected' })
          .eq('id', agentId);

        if (error) throw error;
        
        alert('Agent application rejected.');
        fetchData();
      } catch (error) {
        console.error('Error rejecting agent:', error);
        alert('Failed to reject agent. Please try again.');
      }
    }
  };

  const handleRefresh = () => { fetchData(); };

  const handleViewAgent = async (agent: any) => {
    setSelectedAgent(agent);
    setDetailsLoading(true);
    try {
      // Fetch agent's partners
      const { data: partnerLinks } = await supabaseAdmin
        .from('partner_agent_links')
        .select(`
          *,
          partners(
            id,
            shop_name,
            cell_phone,
            email,
            status,
            cashback_percent,
            address
          )
        `)
        .eq('agent_id', agent.id);

      // Fetch agent's commissions from transactions
      const { data: transactions, error: transError } = await supabaseAdmin
        .from('transactions')
        .select('id, created_at, purchase_amount, agent_amount, status, member_id')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      console.log('Transactions query result:', { transactions, transError });

      // Fetch member details separately if we have transactions
      let transactionsWithMembers = transactions || [];
      if (transactions && transactions.length > 0) {
        const memberIds = [...new Set(transactions.map(t => t.member_id).filter(Boolean))];
        console.log('Member IDs to fetch:', memberIds);
        
        if (memberIds.length > 0) {
          const { data: membersData, error: membersError } = await supabaseAdmin
            .from('members')
            .select('id, first_name, last_name, cell_phone')
            .in('id', memberIds);
          
          console.log('Members data:', { membersData, membersError });
          
          const membersMap = new Map(membersData?.map(m => [m.id, m]) || []);
          transactionsWithMembers = transactions.map(t => ({
            ...t,
            members: membersMap.get(t.member_id) || null
          }));
        }
      }

      console.log('Transactions with members:', transactionsWithMembers);

      // Fetch monthly commission records
      const { data: commissions } = await supabaseAdmin
        .from('agent_commissions')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false});

      setAgentDetails({
        agent,
        partners: partnerLinks || [],
        transactions: transactionsWithMembers,
        commissions: commissions || []
      });
    } catch (error) {
      console.error('Error fetching agent details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeAgentModal = () => {
    setSelectedAgent(null);
    setAgentDetails(null);
    setSignatureUrl(null);
  };

  // Fetch signature URL when modal opens
  useEffect(() => {
    const fetchSignatureUrl = async () => {
      if (selectedAgent && selectedAgent.agreement_file) {
        try {
          const { data, error } = await supabaseAdmin.storage
            .from('documents')
            .createSignedUrl(selectedAgent.agreement_file, 3600); // 1 hour expiry

          if (error) {
            console.error('Error fetching signature URL:', error);
            setSignatureUrl(null);
          } else {
            setSignatureUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error:', error);
          setSignatureUrl(null);
        }
      } else {
        setSignatureUrl(null);
      }
    };

    fetchSignatureUrl();
  }, [selectedAgent]);

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    navigate('/');
  };

  const statsData = [
    { icon: 'support_agent', title: 'Total Agents', value: stats.totalAgents.toString(), change: '+0%', description: 'All agents' },
    { icon: 'verified_user', title: 'Active', value: stats.verified.toString(), change: '+0%', description: 'Approved agents' },
    { icon: 'pending', title: 'Pending Approval', value: stats.pending.toString(), change: '+0%', description: 'Awaiting approval' },
    { icon: 'account_balance_wallet', title: 'Commissions Paid', value: `R${stats.commissions.toFixed(2)}`, change: '+0%', description: 'Total payouts' }
  ];

  const filteredAgents = agents.filter(a => {
    // Advanced Search
    const searchLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/);
    
    const matchesSearch = searchLower === '' || searchTerms.every(term => 
      a.first_name?.toLowerCase().includes(term) ||
      a.last_name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.cell_phone?.includes(term) ||
      a.id?.toLowerCase().includes(term) ||
      a.sa_id?.includes(term)
    );

    // Filters
    const matchesStatus = filters.status === '' || a.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Desktop Header */}
        <header className="hidden md:flex md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search agents, contact info or IDs..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Header - 2 Rows */}
        <header className="md:hidden p-4 space-y-3">
          {/* Row 1: Title + Count */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">support_agent</span>
                Agents
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">{filteredAgents.length} total</p>
            </div>
          </div>
          
          {/* Row 2: Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
              placeholder="Search agents..."
            />
          </div>

          {/* Row 3: Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-lg transition-all text-xs flex-1 ${
                showFilters 
                  ? 'bg-[#1a558b] text-white' 
                  : 'border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              <span>Filter</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-xs flex-1"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-10 pb-6 md:pb-10">
          {/* Page Title */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Agents Management</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">Manage sales agents and their commissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                description={stat.description}
              />
            ))}
          </div>

          {/* Agents List Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]" style={{ fontSize: '20px' }}>list_alt</span>
                    All Agents ({filteredAgents.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      showFilters 
                        ? 'bg-[#1a558b] text-white' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#1a558b] hover:text-[#1a558b]'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                    <span>{showFilters ? 'Hide' : 'Filter'}</span>
                  </button>
                  <button 
                    onClick={() => {}}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-[#1a558b] hover:text-[#1a558b] transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                    <span>Export</span>
                  </button>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                  All Agents ({filteredAgents.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`text-xs flex items-center gap-1 font-medium transition-colors ${showFilters ? 'text-[#1a558b]' : 'text-gray-600 hover:text-[#1a558b]'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                    {showFilters ? 'Hide Filters' : 'Filter'}
                  </button>
                  <button 
                    onClick={() => {}}
                    className="text-xs text-gray-600 hover:text-[#1a558b] flex items-center gap-1 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filter Bar */}
            {showFilters && (
              <div className="px-6 py-4 border-b border-gray-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-200">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Agent Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button 
                    onClick={() => setFilters({ status: '' })}
                    className="text-[10px] font-bold text-[#1a558b] hover:underline uppercase tracking-widest"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Agent ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 font-center">Partners Signed</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 font-center">Commission</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td className="px-6 py-12 text-center" colSpan={6}><p className="text-gray-600">Loading agents...</p></td></tr>
                  ) : filteredAgents.length === 0 ? (
                    <tr><td className="px-6 py-4" colSpan={6}><p className="text-sm text-gray-600 text-center">No agents found</p></td></tr>
                  ) : (
                    filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4"><span className="text-xs font-mono font-bold text-[#1a558b] px-2 py-1 bg-[#1a558b]/10 rounded">{agent.id.substring(0, 8).toUpperCase()}</span></td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{`${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'No name'}</span>
                            <div className="text-xs text-gray-600">{agent.cell_phone || 'No phone'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                            agent.status === 'active' 
                              ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30' 
                              : agent.status === 'pending'
                              ? agent.agreement_file
                                ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`} style={{ borderRadius: "5px" }}>
                            <span className={`size-1.5 ${
                              agent.status === 'active' ? 'bg-[#1a558b]' : 
                              agent.status === 'pending' 
                                ? agent.agreement_file ? 'bg-green-500' : 'bg-yellow-500'
                                : 'bg-red-500'
                            }`} style={{ borderRadius: "50%" }}></span>
                            {agent.status === 'pending' && agent.agreement_file ? 'Digitally Signed' : agent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-gray-900">{agent.signedPartners ?? 0}</span></td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-gray-900">R{(agent.commission || 0).toFixed(2)}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleViewAgent(agent)}
                              className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10" 
                              title="View Details"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                            </button>
                            {agent.status === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => handleApproveAgent(agent.id)}
                                  className="p-2 text-gray-600 hover:text-green-600 transition-colors rounded-lg bg-gray-100 hover:bg-green-50" 
                                  title="Approve Agent"
                                >
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                </button>
                                <button 
                                  onClick={() => handleRejectAgent(agent.id)}
                                  className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-lg bg-gray-100 hover:bg-red-50" 
                                  title="Reject Agent"
                                >
                                  <span className="material-symbols-outlined text-sm">cancel</span>
                                </button>
                              </>
                            ) : agent.status === 'suspended' ? (
                              <>
                                <button 
                                  onClick={async () => {
                                    if (confirm(`Reactivate ${agent.first_name} ${agent.last_name}?`)) {
                                      try {
                                        await supabaseAdmin
                                          .from('agents')
                                          .update({ status: 'active' })
                                          .eq('id', agent.id);
                                        alert('Agent reactivated');
                                        fetchData();
                                      } catch (err: any) {
                                        alert('Error: ' + err.message);
                                      }
                                    }
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150" 
                                  title="Reactivate Agent"
                                >
                                  <span className="material-symbols-outlined text-xl">check_circle</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={async () => {
                                    const reason = prompt(`Enter reason for suspending ${agent.first_name} ${agent.last_name}:`);
                                    if (reason && reason.trim()) {
                                      try {
                                        await supabaseAdmin
                                          .from('agents')
                                          .update({ status: 'suspended' })
                                          .eq('id', agent.id);
                                        
                                        // Create audit log
                                        await supabaseAdmin.from('admin_notifications').insert({
                                          type: 'agent_suspended',
                                          member_id: null,
                                          member_name: `${agent.first_name} ${agent.last_name}`,
                                          member_phone: agent.cell_phone,
                                          message: `Agent ${agent.first_name} ${agent.last_name} (${agent.cell_phone}) has been SUSPENDED by admin. Reason: ${reason}`,
                                          priority: 'high',
                                          metadata: {
                                            suspension_reason: reason,
                                            suspended_at: new Date().toISOString(),
                                            action: 'agent_suspended',
                                            agent_id: agent.id
                                          }
                                        });
                                        
                                        alert(`Agent ${agent.first_name} ${agent.last_name} suspended successfully`);
                                        fetchData();
                                      } catch (err: any) {
                                        alert('Error: ' + err.message);
                                      }
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150" 
                                  title="Suspend Agent"
                                >
                                  <span className="material-symbols-outlined text-xl">block</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-3 text-center" colSpan={6}>
                      <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Showing {filteredAgents.length} of {agents.length} total records</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600">Loading agents...</p>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-600">No agents found</p>
                </div>
              ) : (
                filteredAgents.map((agent) => (
                  <div key={agent.id} className="p-4 bg-white">
                    {/* Agent Header */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="size-10 rounded-full bg-gradient-to-br from-[#1a558b] to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                          {(agent.first_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{`${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'No name'}</p>
                          <p className="text-xs text-gray-600">{agent.cell_phone || 'No phone'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Agent ID */}
                    <div className="mb-3">
                      <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Agent ID</p>
                      <span className="text-xs font-mono font-bold text-[#1a558b] px-2 py-1 bg-[#1a558b]/10 rounded">{agent.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    
                    {/* Status */}
                    <div className="mb-3">
                      <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase ${
                        agent.status === 'active' 
                          ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30' 
                          : agent.status === 'pending'
                          ? agent.agreement_file
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-600 border border-red-500/30'
                      }`} style={{ borderRadius: "5px" }}>
                        <span className={`size-1.5 ${
                          agent.status === 'active' ? 'bg-[#1a558b]' : 
                          agent.status === 'pending' 
                            ? agent.agreement_file ? 'bg-green-500' : 'bg-yellow-500'
                            : 'bg-red-500'
                        }`} style={{ borderRadius: "50%" }}></span>
                        {agent.status === 'pending' && agent.agreement_file ? 'Digitally Signed' : agent.status}
                      </span>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Partners Signed</p>
                        <p className="text-sm font-bold text-gray-900">{agent.signedPartners ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Commission</p>
                        <p className="text-sm font-bold text-[#1a558b]">R{(agent.commission || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewAgent(agent)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-xs font-bold flex-1"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        View Details
                      </button>
                      
                      {agent.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveAgent(agent.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                            title="Approve"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button 
                            onClick={() => handleRejectAgent(agent.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Reject"
                          >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        </>
                      )}
                      
                      {agent.status === 'suspended' && (
                        <button 
                          onClick={async () => {
                            if (confirm(`Reactivate ${agent.first_name} ${agent.last_name}?`)) {
                              try {
                                await supabaseAdmin
                                  .from('agents')
                                  .update({ status: 'active' })
                                  .eq('id', agent.id);
                                alert('Agent reactivated');
                                fetchData();
                              } catch (err: any) {
                                alert('Error: ' + err.message);
                              }
                            }
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                          title="Reactivate"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                      )}
                      
                      {agent.status === 'active' && (
                        <button 
                          onClick={async () => {
                            const reason = prompt(`Enter reason for suspending ${agent.first_name} ${agent.last_name}:`);
                            if (reason && reason.trim()) {
                              try {
                                await supabaseAdmin
                                  .from('agents')
                                  .update({ status: 'suspended' })
                                  .eq('id', agent.id);
                                
                                await supabaseAdmin.from('admin_notifications').insert({
                                  type: 'agent_suspended',
                                  member_id: null,
                                  member_name: `${agent.first_name} ${agent.last_name}`,
                                  member_phone: agent.cell_phone,
                                  message: `Agent ${agent.first_name} ${agent.last_name} (${agent.cell_phone}) has been SUSPENDED by admin. Reason: ${reason}`,
                                  priority: 'high',
                                  metadata: {
                                    suspension_reason: reason,
                                    suspended_at: new Date().toISOString(),
                                    action: 'agent_suspended',
                                    agent_id: agent.id
                                  }
                                });
                                
                                alert(`Agent suspended successfully`);
                                fetchData();
                              } catch (err: any) {
                                alert('Error: ' + err.message);
                              }
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Suspend"
                        >
                          <span className="material-symbols-outlined text-lg">block</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              Â© 2026 +1 Rewards Platform Management â€¢ Secured Admin Access
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>

    {/* Agent Details Modal */}
    {selectedAgent && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-2 md:my-0">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between flex-shrink-0 bg-white sticky top-0 z-10">
            <div className="flex-1 min-w-0 mr-2 md:mr-3">
              <h2 className="text-lg md:text-2xl font-black text-gray-900 truncate">{`${selectedAgent.first_name || ''} ${selectedAgent.last_name || ''}`.trim() || 'Agent Details'}</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">Complete Agent Information</p>
            </div>
            <button
              onClick={closeAgentModal}
              className="size-8 md:size-10 bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors flex-shrink-0" style={{ borderRadius: "9px" }}
            >
              <span className="material-symbols-outlined text-lg md:text-xl">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 px-3 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6 bg-gray-50">
            {detailsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading agent details...</p>
              </div>
            ) : agentDetails ? (
              <>
                {/* Basic Information */}
                <section>
                  <h3 className="text-base md:text-lg font-bold text-[#1a558b] mb-3 md:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg md:text-xl">person</span>
                    <span>Basic Information</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Agent ID</p>
                      <p className="text-xs md:text-sm text-gray-900 font-mono break-all">{selectedAgent.id}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Full Name</p>
                      <p className="text-xs md:text-sm text-gray-900 font-semibold">{`${selectedAgent.first_name || ''} ${selectedAgent.last_name || ''}`.trim() || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Mobile Number</p>
                      <p className="text-xs md:text-sm text-gray-900">{selectedAgent.cell_phone || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Email</p>
                      <p className="text-xs md:text-sm text-gray-900 break-all">{selectedAgent.email || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">ID Number</p>
                      <p className="text-xs md:text-sm text-gray-900">{selectedAgent.sa_id || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-bold uppercase ${
                        selectedAgent.status === 'active' 
                          ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30'
                          : selectedAgent.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-700 border border-red-500/30'
                      }`} style={{ borderRadius: "5px" }}>
                        {selectedAgent.status}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Created At</p>
                      <p className="text-xs md:text-sm text-gray-900">{new Date(selectedAgent.created_at).toLocaleString()}</p>
                    </div>
                    {selectedAgent.approved_at && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                        <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold mb-1">Approved At</p>
                        <p className="text-xs md:text-sm text-green-700 font-semibold">{new Date(selectedAgent.approved_at).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedAgent.status === 'rejected' && selectedAgent.rejection_reason && (
                      <div className="bg-white border border-red-200 rounded-lg p-3 md:p-4 col-span-full">
                        <p className="text-[10px] md:text-xs text-red-600 uppercase font-bold mb-2">Rejection Reason</p>
                        <p className="text-xs md:text-sm text-red-700 font-semibold">{selectedAgent.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Digital Signature & Agreement */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">draw</span>
                    Digital Signature & Agreement
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-bold mb-2">Agreement Status</p>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                        <span className="text-sm text-green-600 font-semibold">
                          Digitally signed on {new Date(selectedAgent.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Digital Signature Display */}
                    {selectedAgent.agreement_file && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-bold mb-2">Agent Signature</p>
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                          {signatureUrl ? (
                            <img 
                              src={signatureUrl}
                              alt="Agent Signature"
                              className="max-w-full h-auto max-h-40 mx-auto"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                if (errorDiv) errorDiv.classList.remove('hidden');
                              }}
                            />
                          ) : (
                            <div className="text-center text-gray-500 text-sm py-8">
                              <div className="w-12 h-12 border-4 border-gray-300 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
                              Loading signature...
                            </div>
                          )}
                          <div className="hidden text-center text-gray-500 text-sm">
                            <span className="material-symbols-outlined text-4xl mb-2 block">error</span>
                            Unable to load signature image
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>Digitally signed and verified</span>
                        </div>
                      </div>
                    )}

                    {/* Agreement Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-sm text-blue-900 mb-2">Sales Agent Agreement Summary</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>â€¢ Agent will earn 1% commission on every partner successfully registered.</li>
                        <li>â€¢ Commissions are calculated and paid out on a monthly basis.</li>
                        <li>â€¢ Agent is required to manage all partner and member functionality professionaly.</li>
                        <li>â€¢ Account will be approved by an administrator before it becomes active.</li>
                        <li>â€¢ Agent has reviewed and digitally signed the full agreement</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Recruited Partners */}
                <section>
                  <h3 className="text-base md:text-lg font-bold text-[#1a558b] mb-3 md:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg md:text-xl">storefront</span>
                    <span>Recruited Partners ({agentDetails.partners.length})</span>
                  </h3>
                  {agentDetails.partners.length > 0 ? (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-[#1a558b]/10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Partner Name</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Phone</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Linked At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {agentDetails.partners.map((link: any) => (
                              <tr key={link.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{link.partners?.shop_name || 'Unknown'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{link.partners?.cell_phone || 'N/A'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 text-xs font-bold ${
                                    link.partners?.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                                  }`} style={{ borderRadius: "5px" }}>
                                    {link.partners?.status || 'unknown'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(link.linked_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {agentDetails.partners.map((link: any) => (
                          <div key={link.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">{link.partners?.shop_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{link.partners?.cell_phone || 'N/A'}</p>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-bold ${
                                link.partners?.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                              }`} style={{ borderRadius: "5px" }}>
                                {link.partners?.status || 'unknown'}
                              </span>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Linked At</p>
                              <p className="text-xs text-gray-600">{new Date(link.linked_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 text-center">
                      <span className="material-symbols-outlined text-4xl md:text-5xl text-gray-300 block mb-2">storefront</span>
                      <p className="text-sm md:text-base text-gray-600">No partners recruited yet</p>
                    </div>
                  )}
                </section>

                {/* Commission History */}
                <section>
                  <h3 className="text-base md:text-lg font-bold text-[#1a558b] mb-3 md:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg md:text-xl">account_balance_wallet</span>
                    <span>Commission History ({agentDetails.transactions?.length || 0})</span>
                  </h3>
                  {agentDetails.transactions && agentDetails.transactions.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {/* Summary Card */}
                      <div className="bg-gradient-to-br from-[#1a558b] to-blue-700 text-white rounded-xl p-4 md:p-6 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                          <div>
                            <p className="text-xs md:text-sm opacity-90 mb-1">Total Transactions</p>
                            <p className="text-3xl md:text-4xl font-black">{agentDetails.transactions.length}</p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm opacity-90 mb-1">Total Commission Earned</p>
                            <p className="text-3xl md:text-4xl font-black">
                              R{agentDetails.transactions.reduce((sum: number, t: any) => sum + parseFloat(t.agent_amount || 0), 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm opacity-90 mb-1">Total Purchase Volume</p>
                            <p className="text-3xl md:text-4xl font-black">
                              R{agentDetails.transactions.reduce((sum: number, t: any) => sum + parseFloat(t.purchase_amount || 0), 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transactions - Desktop Table */}
                      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-[#1a558b]/10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Member</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Purchase Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Commission (1%)</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {agentDetails.transactions.slice(0, 10).map((transaction: any) => (
                              <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{new Date(transaction.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {transaction.members?.first_name && transaction.members?.last_name
                                      ? `${transaction.members.first_name} ${transaction.members.last_name}`
                                      : 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-600">{transaction.members?.cell_phone || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">R{parseFloat(transaction.purchase_amount).toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{parseFloat(transaction.agent_amount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 text-xs font-bold ${
                                    transaction.status === 'completed' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                                  }`} style={{ borderRadius: "5px" }}>
                                    {transaction.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {agentDetails.transactions.length > 10 && (
                          <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
                            Showing 10 of {agentDetails.transactions.length} transactions
                          </div>
                        )}
                      </div>

                      {/* Transactions - Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {agentDetails.transactions.slice(0, 10).map((transaction: any) => (
                          <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                            {/* Header with Member and Status */}
                            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="size-10 rounded-full bg-gradient-to-br from-[#1a558b] to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                  {(transaction.members?.first_name || 'M').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {transaction.members?.first_name && transaction.members?.last_name
                                      ? `${transaction.members.first_name} ${transaction.members.last_name}`
                                      : 'Unknown Member'}
                                  </p>
                                  <p className="text-xs text-gray-600">{transaction.members?.cell_phone || 'N/A'}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ml-2 ${
                                transaction.status === 'completed' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                              }`} style={{ borderRadius: "5px" }}>
                                {transaction.status}
                              </span>
                            </div>
                            
                            {/* Transaction Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Date</p>
                                <p className="text-xs text-gray-900 font-semibold">{new Date(transaction.created_at).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Purchase Amount</p>
                                <p className="text-xs font-bold text-gray-900">R{parseFloat(transaction.purchase_amount).toFixed(2)}</p>
                              </div>
                              <div className="col-span-2 bg-[#1a558b]/5 rounded-lg p-2 border border-[#1a558b]/20">
                                <p className="text-[9px] font-bold uppercase text-[#1a558b] mb-0.5">Your Commission (1%)</p>
                                <p className="text-lg font-black text-[#1a558b]">R{parseFloat(transaction.agent_amount || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {agentDetails.transactions.length > 10 && (
                          <div className="text-center py-2">
                            <p className="text-xs text-gray-600">Showing 10 of {agentDetails.transactions.length} transactions</p>
                          </div>
                        )}
                      </div>

                      {/* Monthly Payouts (if any) */}
                      {agentDetails.commissions && agentDetails.commissions.length > 0 && (
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-gray-900 mb-3">Monthly Payouts</h4>
                          
                          {/* Desktop Table */}
                          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-[#1a558b]/10">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Month</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Paid At</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {agentDetails.commissions.map((commission: any) => (
                                  <tr key={commission.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{commission.month}</td>
                                    <td className="px-4 py-3 text-sm text-[#1a558b] font-bold">R{parseFloat(commission.total_amount).toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 text-xs font-bold ${
                                        commission.payout_status === 'paid' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                                      }`} style={{ borderRadius: "5px" }}>
                                        {commission.payout_status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString() : 'Pending'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-3">
                            {agentDetails.commissions.map((commission: any) => (
                              <div key={commission.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{commission.month}</p>
                                    <p className="text-lg font-black text-[#1a558b] mt-1">R{parseFloat(commission.total_amount).toFixed(2)}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold ${
                                    commission.payout_status === 'paid' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                                  }`} style={{ borderRadius: "5px" }}>
                                    {commission.payout_status}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-gray-500 mb-0.5">Paid At</p>
                                  <p className="text-xs text-gray-600">
                                    {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString() : 'Pending'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 text-center">
                      <span className="material-symbols-outlined text-4xl md:text-5xl text-gray-300 block mb-2">account_balance_wallet</span>
                      <p className="text-sm md:text-base text-gray-600">No commission records yet</p>
                    </div>
                  )}
                </section>

                {/* Actions */}
                {selectedAgent.status === 'pending' && (
                  <section className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4">
                    <button
                      onClick={() => {
                        handleApproveAgent(selectedAgent.id);
                        closeAgentModal();
                      }}
                      className="px-4 md:px-6 py-2.5 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <span className="material-symbols-outlined text-lg md:text-xl">check_circle</span>
                      Approve Agent
                    </button>
                    <button
                      onClick={() => {
                        handleRejectAgent(selectedAgent.id);
                        closeAgentModal();
                      }}
                      className="px-4 md:px-6 py-2.5 md:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <span className="material-symbols-outlined text-lg md:text-xl">cancel</span>
                      Reject Agent
                    </button>
                  </section>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
