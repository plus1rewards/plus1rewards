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
      
      // Get commission totals from agent_commissions table
      const { data: commissionsData } = await supabaseAdmin
        .from('agent_commissions')
        .select('total_amount');
      const commissions = commissionsData?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0;
      
      setStats({ totalAgents, verified, pending, sales: 0, commissions });
      setAgents(agentsData || []);
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
        .select('*, partners(shop_name, phone, status)')
        .eq('agent_id', agent.id);

      // Fetch agent's commissions
      const { data: commissions } = await supabaseAdmin
        .from('agent_commissions')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      setAgentDetails({
        agent,
        partners: partnerLinks || [],
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
      a.full_name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.mobile_number?.includes(term) ||
      a.id?.toLowerCase().includes(term) ||
      a.id_number?.includes(term)
    );

    // Filters
    const matchesStatus = filters.status === '' || a.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Topbar */}
        <header className="flex flex-col gap-4 p-4 md:p-6 lg:p-10 pb-4 md:pb-6">
          <div className="flex-1 max-w-2xl w-full">
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

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-xs md:text-sm"
            >
              <span className="material-symbols-outlined text-base md:text-lg">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-xs md:text-sm font-bold"
            >
              <span className="material-symbols-outlined text-base md:text-lg">logout</span>
              <span className="hidden sm:inline">Logout</span>
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
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
              <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Agent ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 font-center">Sales</th>
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
                            <span className="text-sm font-semibold text-gray-900">{agent.full_name || 'No name'}</span>
                            <div className="text-xs text-gray-600">{agent.mobile_number || 'No phone'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            agent.status === 'active' 
                              ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30' 
                              : agent.status === 'pending'
                              ? agent.agreement_file
                                ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              agent.status === 'active' ? 'bg-[#1a558b]' : 
                              agent.status === 'pending' 
                                ? agent.agreement_file ? 'bg-green-500' : 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}></span>
                            {agent.status === 'pending' && agent.agreement_file ? 'Digitally Signed' : agent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-gray-900">0</span></td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-gray-900">R0.00</span></td>
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
                            ) : (
                              <>
                                <button className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10" title="Edit Agent"><span className="material-symbols-outlined text-sm">edit</span></button>
                                <button className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-lg bg-gray-100 hover:bg-red-50" title="Suspend Agent"><span className="material-symbols-outlined text-sm">block</span></button>
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
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2024 +1 Rewards Platform Management • Secured Admin Access
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>

    {/* Agent Details Modal */}
    {selectedAgent && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{selectedAgent.full_name || 'Agent Details'}</h2>
              <p className="text-sm text-gray-600 mt-1">Complete Agent Information</p>
            </div>
            <button
              onClick={closeAgentModal}
              className="size-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6 bg-gray-50">
            {detailsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading agent details...</p>
              </div>
            ) : agentDetails ? (
              <>
                {/* Basic Information */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">person</span>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Agent ID</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedAgent.id}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Full Name</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedAgent.full_name || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Mobile Number</p>
                      <p className="text-sm text-gray-900">{selectedAgent.mobile_number || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Email</p>
                      <p className="text-sm text-gray-900">{selectedAgent.email || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">ID Number</p>
                      <p className="text-sm text-gray-900">{selectedAgent.id_number || 'N/A'}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedAgent.status === 'active' 
                          ? 'bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30'
                          : selectedAgent.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-700 border border-red-500/30'
                      }`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 uppercase font-bold mb-1">Created At</p>
                      <p className="text-sm text-gray-900">{new Date(selectedAgent.created_at).toLocaleString()}</p>
                    </div>
                    {selectedAgent.approved_at && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 uppercase font-bold mb-1">Approved At</p>
                        <p className="text-sm text-green-700 font-semibold">{new Date(selectedAgent.approved_at).toLocaleString()}</p>
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
                        <li>• Agent will earn 1% commission on every partner successfully registered.</li>
                        <li>• Commissions are calculated and paid out on a monthly basis.</li>
                        <li>• Agent is required to manage all partner and member functionality professionaly.</li>
                        <li>• Account will be approved by an administrator before it becomes active.</li>
                        <li>• Agent has reviewed and digitally signed the full agreement</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Recruited Partners */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">storefront</span>
                    Recruited Partners ({agentDetails.partners.length})
                  </h3>
                  {agentDetails.partners.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                              <td className="px-4 py-3 text-sm text-gray-600">{link.partners?.phone || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  link.partners?.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                                }`}>
                                  {link.partners?.status || 'unknown'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{new Date(link.linked_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No partners recruited yet</p>
                    </div>
                  )}
                </section>

                {/* Commission History */}
                <section>
                  <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    Commission History ({agentDetails.commissions.length})
                  </h3>
                  {agentDetails.commissions.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  commission.payout_status === 'paid' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                                }`}>
                                  {commission.payout_status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString() : 'Not paid'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No commission records yet</p>
                    </div>
                  )}
                </section>

                {/* Actions */}
                {selectedAgent.status === 'pending' && (
                  <section className="flex gap-4 justify-center pt-4">
                    <button
                      onClick={() => {
                        handleApproveAgent(selectedAgent.id);
                        closeAgentModal();
                      }}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      Approve Agent
                    </button>
                    <button
                      onClick={() => {
                        handleRejectAgent(selectedAgent.id);
                        closeAgentModal();
                      }}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">cancel</span>
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
