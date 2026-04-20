// plus1-rewards/src/components/dashboard/pages/ApprovalsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';
import { Notification, useNotification } from '../../Notification';

type ApprovalTab = 'partners' | 'agents' | 'cover_plans' | 'dependants';

// Helper function to get owner/agent name from first_name and last_name
const getOwnerName = (person: any): string => {
  if (!person) return 'Unknown';
  if (person.first_name || person.last_name) {
    const firstName = person.first_name || '';
    const lastName = person.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  }
  return person.full_name || person.responsible_person || 'Unknown';
};

// Helper function to calculate days until deletion for rejected partners
const getDaysUntilDeletion = (rejectedAt: string | null): number | null => {
  if (!rejectedAt) return null;
  const rejectionDate = new Date(rejectedAt);
  const deletionDate = new Date(rejectionDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
  const now = new Date();
  const daysLeft = Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return daysLeft > 0 ? daysLeft : 0;
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('partners');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [pendingPartners, setPendingPartners] = useState<any[]>([]);
  const [rejectedPartners, setRejectedPartners] = useState<any[]>([]);
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [coverPlanRequests, setCoverPlanRequests] = useState<any[]>([]);
  const [linkedPeopleRequests, setLinkedPeopleRequests] = useState<any[]>([]);
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [passportImageUrl, setPassportImageUrl] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<{
    show: boolean;
    type: 'partner' | 'agent' | null;
    id: string;
    reason: string;
  }>({
    show: false,
    type: null,
    id: '',
    reason: ''
  });
  
  const [stats, setStats] = useState({
    totalPending: 0,
    partners: 0,
    agents: 0,
    providers: 0,
    coverPlans: 0,
    linkedPeople: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('ðŸ” Fetching approvals data...');
      
      // Fetch pending partners with agent information
      const { data: partners, error: partnersError } = await supabaseAdmin
        .from('partners')
        .select(`
          *,
          partner_agent_links!inner(
            agent_id,
            agents(
              id,
              first_name,
              last_name,
              cell_phone
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Also fetch partners without agents
      let partnersWithoutAgentsQuery = supabaseAdmin
        .from('partners')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Exclude partners that already have agents
      if (partners && partners.length > 0) {
        partnersWithoutAgentsQuery = partnersWithoutAgentsQuery.not('id', 'in', `(${partners.map(p => p.id).join(',')})`);
      }

      const { data: partnersWithoutAgents, error: partnersWithoutAgentsError } = await partnersWithoutAgentsQuery;

      // Combine both results
      const allPartners = [
        ...(partners || []),
        ...(partnersWithoutAgents || [])
      ];

      if (partnersError || partnersWithoutAgentsError) {
        console.error('âŒ Partners error:', partnersError || partnersWithoutAgentsError);
      } else {
        console.log('âœ… Partners:', allPartners?.length || 0);
      }

      // Fetch pending agents
      const { data: agents, error: agentsError } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (agentsError) {
        console.error('âŒ Agents error:', agentsError);
        setPendingAgents([]);
      } else {
        console.log('âœ… Agents:', agents?.length || 0);
        // Agent details are stored directly in agents table, no need for separate join
        setPendingAgents(agents || []);
      }

      // Fetch ALL active agents for assignment dropdown
      const { data: activeAgents } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Agent details are stored directly in agents table
      setAllAgents(activeAgents || []);

      // Fetch pending insurers
      const { data: insurers, error: insurersError } = await supabaseAdmin
        .from('insurers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (insurersError) {
        console.error('âŒ Insurers error:', insurersError);
      } else {
        console.log('âœ… Insurers:', insurers?.length || 0);
      }

      // Fetch pending dependants - NO LONGER NEEDED
      // Day1Health handles all approvals on their side and only sends approved dependants
      // This query is kept for reference but will always return empty
      setLinkedPeopleRequests([]);

      setPendingPartners(allPartners || []);
      if (agentsError) {
        setPendingAgents([]);
      }

      // Fetch rejected partners (to show deletion countdown)
      const { data: rejected, error: rejectedError } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('status', 'rejected')
        .not('rejected_at', 'is', null)
        .order('rejected_at', { ascending: true });

      if (rejectedError) {
        console.error('âŒ Rejected partners error:', rejectedError);
        setRejectedPartners([]);
      } else {
        console.log('âœ… Rejected partners:', rejected?.length || 0);
        setRejectedPartners(rejected || []);
      }

      const totalPending = (allPartners?.length || 0) + (agents?.length || 0) + (insurers?.length || 0);
      
      console.log('ðŸ“Š Total pending:', totalPending);
      
      setStats({
        totalPending,
        partners: partners?.length || 0,
        agents: agents?.length || 0,
        providers: insurers?.length || 0,
        coverPlans: 0,
        linkedPeople: linkedPeopleRequests?.length || 0
      });
    } catch (error) {
      console.error('âŒ Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch signature URL and passport image when modal opens
  useEffect(() => {
    const fetchSignatureUrl = async () => {
      if (showDetailsModal && selectedItem) {
        try {
          console.log('ðŸ“‹ Modal opened for:', selectedItem.type, 'ID:', selectedItem.id);
          
          // For partners, use signature_url; for agents, use agreement_file
          const signaturePath = selectedItem.type === 'partner' 
            ? selectedItem.signature_url 
            : selectedItem.agreement_file;

          if (signaturePath) {
            const { data, error } = await supabaseAdmin.storage
              .from('documents')
              .createSignedUrl(signaturePath, 3600); // 1 hour expiry

            if (error) {
              console.error('Error fetching signature URL:', error);
              setSignatureUrl(null);
            } else {
              setSignatureUrl(data.signedUrl);
            }
          } else {
            setSignatureUrl(null);
          }

          // For agents, also fetch passport image
          if (selectedItem.type === 'agent' && selectedItem.id_document_url) {
            console.log('ðŸ–¼ï¸ Fetching passport image:', selectedItem.id_document_url);
            const { data: passportData, error: passportError } = await supabaseAdmin.storage
              .from('documents')
              .createSignedUrl(selectedItem.id_document_url, 3600); // 1 hour expiry

            if (passportError) {
              console.error('âŒ Error fetching passport image URL:', passportError);
              setPassportImageUrl(null);
            } else {
              console.log('âœ… Passport image URL fetched successfully');
              setPassportImageUrl(passportData.signedUrl);
            }
          } else {
            console.log('âš ï¸ Not fetching passport - type:', selectedItem.type, 'has id_document_url:', !!selectedItem.id_document_url);
            setPassportImageUrl(null);
          }
        } catch (error) {
          console.error('Error:', error);
          setSignatureUrl(null);
          setPassportImageUrl(null);
        }
      } else {
        setSignatureUrl(null);
        setPassportImageUrl(null);
      }
    };

    fetchSignatureUrl();
  }, [showDetailsModal, selectedItem]);

  const handleApprovePartner = async (partnerId: string, assignedAgentId?: string) => {
    try {
      const updateData: any = { 
        status: 'active',
        approved_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('partners')
        .update(updateData)
        .eq('id', partnerId);

      if (error) throw error;

      // If agent is assigned, create the link in partner_agent_links table
      if (assignedAgentId) {
        const { error: linkError } = await supabaseAdmin
          .from('partner_agent_links')
          .insert({
            partner_id: partnerId,
            agent_id: assignedAgentId,
            status: 'active'
          });

        if (linkError) {
          console.error('Error linking agent:', linkError);
          showWarning('Partial Success', 'Partner approved but failed to assign agent. Please assign manually.');
        } else {
          showSuccess('Success!', 'Partner approved and agent assigned successfully!');
        }
      } else {
        showSuccess('Success!', 'Partner approved successfully!');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error approving partner:', error);
      showError('Error', 'Failed to approve partner. Please try again.');
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    // Show rejection reason modal
    setRejectionModal({
      show: true,
      type: 'partner',
      id: partnerId,
      reason: ''
    });
  };

  const submitRejection = async () => {
    if (!rejectionModal.reason.trim()) {
      showError('Rejection Reason Required', 'Please provide a reason for rejecting this application.');
      return;
    }

    try {
      if (rejectionModal.type === 'partner') {
        const { error } = await supabaseAdmin
          .from('partners')
          .update({ 
            status: 'rejected',
            rejection_reason: rejectionModal.reason.trim()
          })
          .eq('id', rejectionModal.id);

        if (error) throw error;
        showSuccess('Rejected', 'Partner application has been rejected.');
      } else if (rejectionModal.type === 'agent') {
        const { error } = await supabaseAdmin
          .from('agents')
          .update({ 
            status: 'rejected',
            rejection_reason: rejectionModal.reason.trim()
          })
          .eq('id', rejectionModal.id);

        if (error) throw error;
        showSuccess('Rejected', 'Agent application has been rejected.');
      }

      setRejectionModal({ show: false, type: null, id: '', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Error rejecting application:', error);
      showError('Error', 'Failed to reject application. Please try again.');
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
      showSuccess('Success!', 'Agent approved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error approving agent:', error);
      showError('Error', 'Failed to approve agent. Please try again.');
    }
  };

  const handleRejectAgent = async (agentId: string) => {
    // Show rejection reason modal
    setRejectionModal({
      show: true,
      type: 'agent',
      id: agentId,
      reason: ''
    });
  };

  const handleRefresh = () => fetchData();
  const handleLogout = () => navigate('/');

  const statsData = [
    { icon: 'pending_actions', title: 'Total Pending', value: stats.totalPending.toString(), description: 'Awaiting approval' },
    { icon: 'storefront', title: 'Partners', value: stats.partners.toString(), description: 'Partner applications' },
    { icon: 'support_agent', title: 'Agents', value: stats.agents.toString(), description: 'Agent applications' }
  ];

  return (
    <DashboardLayout>
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        {/* Topbar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Approvals Management</h1>
            <p className="text-gray-600 mt-1">Review and approve pending applications and requests</p>
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

        <div className="px-6 md:px-10 pb-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                value={stat.value}
                description={stat.description}
              />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 w-fit shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                activeTab === 'partners' ? 'bg-[#1a558b] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Partners
              {stats.partners > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-bold" style={{ borderRadius: "9px" }} ${
                  activeTab === 'partners' ? 'bg-white text-[#1a558b]' : 'bg-red-500 text-white'
                }`}>
                  {stats.partners}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                activeTab === 'agents' ? 'bg-[#1a558b] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Agents
              {stats.agents > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-bold" style={{ borderRadius: "9px" }} ${
                  activeTab === 'agents' ? 'bg-white text-[#1a558b]' : 'bg-red-500 text-white'
                }`}>
                  {stats.agents}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cover_plans')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                activeTab === 'cover_plans' ? 'bg-[#1a558b] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Cover Plan Changes
              {stats.coverPlans > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-bold" style={{ borderRadius: "9px" }} ${
                  activeTab === 'cover_plans' ? 'bg-white text-[#1a558b]' : 'bg-red-500 text-white'
                }`}>
                  {stats.coverPlans}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dependants')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                activeTab === 'dependants' ? 'bg-[#1a558b] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              dependants
              {stats.linkedPeople > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-bold" style={{ borderRadius: "9px" }} ${
                  activeTab === 'dependants' ? 'bg-white text-[#1a558b]' : 'bg-red-500 text-white'
                }`}>
                  {stats.linkedPeople}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            {/* Partners Tab */}
            {activeTab === 'partners' && (
              <div>
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]">storefront</span>
                    Pending Partner Applications ({pendingPartners.length})
                  </h3>
                </div>
                
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : pendingPartners.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
                    <p className="text-gray-600">No pending partner applications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {pendingPartners.map((partner) => (
                      <div key={partner.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-6">
                          {/* Left side - Business Info */}
                          <div className="flex-1">
                            {/* Shop Name */}
                            <div className="mb-4">
                              <h4 className="text-xl font-bold text-gray-900">{partner.shop_name || 'Unknown Shop'}</h4>
                              <p className="text-sm text-gray-500 mt-1">Applied on {new Date(partner.created_at).toLocaleDateString()}</p>
                            </div>

                            {/* Business Details Grid */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Category & Cashback */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
                                    <p className="text-sm font-medium text-gray-900">{partner.category || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cashback Rate</p>
                                    <p className="text-lg font-bold text-[#1a558b]">{partner.cashback_percent || 0}%</p>
                                  </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                                    <p className="text-sm font-medium text-gray-900">{partner.address || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Postal Code</p>
                                    <p className="text-sm font-medium text-gray-900">{partner.postal_code || 'Not specified'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-gray-400 text-lg">phone</span>
                                <span className="font-medium text-gray-900">{partner.cell_phone || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-gray-400 text-lg">email</span>
                                <span className="font-medium text-gray-900">{partner.email || 'Not provided'}</span>
                              </div>
                            </div>

                            {partner.agreement_accepted && (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold mt-3">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Agreement Accepted
                              </div>
                            )}
                          </div>

                          {/* Right side - Action Buttons */}
                          <div className="flex flex-col gap-2 min-w-[160px]">
                            <button
                              onClick={() => handleApprovePartner(partner.id)}
                              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPartner(partner.id)}
                              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-lg">cancel</span>
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem({ ...partner, type: 'partner' });
                                setShowDetailsModal(true);
                              }}
                              className="px-6 py-2.5 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                              View Details
                            </button>
                            <button
                              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-gray-300"
                            >
                              <span className="material-symbols-outlined text-lg">phone</span>
                              Call Required
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Rejected Partners - Pending Deletion */}
                {rejectedPartners.length > 0 && (
                  <div className="mt-8">
                    <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                      <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600">delete_forever</span>
                        Rejected Partners - Scheduled for Deletion ({rejectedPartners.length})
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        These partners will be automatically deleted 3 days after rejection
                      </p>
                    </div>
                    
                    <div className="divide-y divide-red-100 bg-red-50/30">
                      {rejectedPartners.map((partner) => {
                        const daysLeft = getDaysUntilDeletion(partner.rejected_at);
                        return (
                          <div key={partner.id} className="p-6 hover:bg-red-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-6">
                              {/* Left side - Business Info */}
                              <div className="flex-1">
                                <div className="mb-3">
                                  <h4 className="text-lg font-bold text-gray-900">{partner.shop_name || 'Unknown Shop'}</h4>
                                  <p className="text-sm text-red-600 mt-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    {daysLeft !== null && daysLeft > 0 ? (
                                      <>Will be deleted in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</>
                                    ) : (
                                      <>Scheduled for deletion (processing...)</>
                                    )}
                                  </p>
                                </div>

                                <div className="bg-white rounded-lg p-4 mb-3 border border-red-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                                      <p className="text-sm font-medium text-red-700">{partner.rejection_reason || 'No reason provided'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rejected On</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {partner.rejected_at ? new Date(partner.rejected_at).toLocaleDateString() : 'Unknown'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">phone</span>
                                    {partner.cell_phone || 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">email</span>
                                    {partner.email || 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* Right side - Status Badge */}
                              <div className="flex flex-col items-end gap-2">
                                <div className="px-4 py-2 bg-red-100 border-2 border-red-300 rounded-lg">
                                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Rejected</p>
                                  {daysLeft !== null && (
                                    <p className="text-2xl font-black text-red-600 text-center mt-1">
                                      {daysLeft}
                                    </p>
                                  )}
                                  <p className="text-xs text-red-700 text-center">day{daysLeft !== 1 ? 's' : ''} left</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agents Tab */}
            {activeTab === 'agents' && (
              <div>
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]">support_agent</span>
                    Pending Agent Applications ({pendingAgents.length})
                  </h3>
                </div>
                
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : pendingAgents.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
                    <p className="text-gray-600">No pending agent applications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {pendingAgents.map((agent) => (
                      <div key={agent.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{getOwnerName(agent)}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-bold">ID Number</p>
                                <p className="text-sm text-gray-900">{agent.sa_id || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-bold">Phone</p>
                                <p className="text-sm text-gray-900">{agent.cell_phone || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-bold">Email</p>
                                <p className="text-sm text-gray-900">{agent.email || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 uppercase font-bold">Applied</p>
                                <p className="text-sm text-gray-900">{new Date(agent.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {agent.agreement_file && (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                                <span className="material-symbols-outlined text-sm">draw</span>
                                Digitally Signed
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleApproveAgent(agent.id)}
                              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectAgent(agent.id)}
                              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">cancel</span>
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem({ ...agent, type: 'agent' });
                                setShowDetailsModal(true);
                              }}
                              className="px-6 py-2 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                              View Details
                            </button>
                            <button
                              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">info</span>
                              Request Info
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cover Plan Changes Tab */}
            {activeTab === 'cover_plans' && (
              <div>
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]">health_and_safety</span>
                    Cover Plan Change Requests ({stats.coverPlans})
                  </h3>
                </div>
                
                <div className="px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">health_and_safety</span>
                  <p className="text-gray-600">No pending cover plan change requests</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="material-symbols-outlined text-sm align-middle">info</span>
                    Important: Telephonic conversation required before approval
                  </p>
                </div>
              </div>
            )}

            {/* dependants Tab - DEPRECATED */}
            {activeTab === 'dependants' && (
              <div>
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a558b]">group_add</span>
                    dependants Requests ({stats.linkedPeople})
                  </h3>
                </div>
                
                <div className="px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
                  <p className="text-gray-600 font-bold">All dependants are auto-approved by Day1Health</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="material-symbols-outlined text-sm align-middle">info</span>
                    Day1Health handles all dependant verification and approval on their side. Approved dependants are automatically added to our system.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              Â© 2026 +1 Rewards Platform Management â€¢ Secured Admin Access
            </p>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedItem && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowDetailsModal(false)}
          >
            <div 
              className="rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              style={{ backgroundColor: '#ffffff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-[#1a558b] text-3xl">
                      {selectedItem.type === 'partner' ? 'storefront' : 'support_agent'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">
                      {selectedItem.type === 'partner' ? selectedItem.shop_name || selectedItem.name : getOwnerName(selectedItem)}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedItem.type === 'partner' ? 'Partner Application' : 'Agent Application'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-600 hover:text-gray-900 text-2xl"
                >
                  âœ•
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto flex-1 bg-gray-50">
                <div className="px-6 py-6 space-y-6">
                  {/* Partner Details */}
                  {selectedItem.type === 'partner' && (
                    <>
                      {/* Basic Information */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">storefront</span>
                          Business Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Shop Name</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.shop_name || selectedItem.name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Category</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.category || selectedItem.business_type || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Cashback Percent</p>
                            <p className="text-sm text-[#1a558b] font-bold">{selectedItem.cashback_percent || selectedItem.commission_rate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Address</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.address || selectedItem.location || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Postal Code</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.postal_code || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">contact_phone</span>
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Responsible Person</p>
                            <p className="text-sm text-gray-900 font-semibold">
                              {selectedItem.first_name && selectedItem.last_name 
                                ? `${selectedItem.first_name} ${selectedItem.last_name}` 
                                : selectedItem.responsible_person || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Phone</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.cell_phone || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Email</p>
                            <p className="text-sm text-gray-900 font-semibold break-all">{selectedItem.email || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Digital Signature */}
                      {selectedItem.signature_url && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#1a558b]">draw</span>
                            Digital Signature
                          </h3>
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              Partner agreement signed digitally on {new Date(selectedItem.created_at).toLocaleDateString()}
                            </p>
                            <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                              {signatureUrl ? (
                                <img 
                                  src={signatureUrl}
                                  alt="Partner Signature"
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
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              <span>Digitally signed and verified</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Agent Assignment */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">person_add</span>
                          Sales Agent Assignment
                        </h3>
                        <div className="space-y-3">
                          {/* Show existing agent if assigned */}
                          {selectedItem.partner_agent_links && selectedItem.partner_agent_links.length > 0 ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-green-600">check_circle</span>
                                <span className="text-sm font-bold text-green-800">Agent Already Assigned</span>
                              </div>
                              <div className="text-sm text-green-700">
                                <p><strong>Agent:</strong> {getOwnerName(selectedItem.partner_agent_links[0].agents)}</p>
                                <p><strong>Phone:</strong> {selectedItem.partner_agent_links[0].agents?.cell_phone || 'Not provided'}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600">
                                Assign a sales agent to manage this partner shop and earn commissions on transactions.
                              </p>
                              <div>
                                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-2">
                                  Select Agent
                                </label>
                                <select
                                  value={selectedAgentId}
                                  onChange={(e) => setSelectedAgentId(e.target.value)}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                                >
                                  <option value="">No agent assigned</option>
                                  {allAgents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                      {`${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown'} - {agent.cell_phone || 'No phone'}
                                    </option>
                                  ))}
                                </select>
                                {allAgents.length === 0 && (
                                  <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    No active agents available. Approve agents first.
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">info</span>
                          Application Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Applied Date</p>
                            <p className="text-sm text-gray-900 font-semibold">{new Date(selectedItem.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Application Status</p>
                            <p className="text-sm font-semibold">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                                <span className="material-symbols-outlined text-sm">pending</span>
                                {selectedItem.status || 'Pending'}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Agreement Status</p>
                            <p className="text-sm text-gray-900 font-semibold">
                              {selectedItem.agreement_accepted ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  Accepted
                                </span>
                              ) : (
                                <span className="text-yellow-600">Pending</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Agent Details */}
                  {selectedItem.type === 'agent' && (
                    <>
                      {/* Personal Information */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">person</span>
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Full Name</p>
                            <p className="text-sm text-gray-900 font-semibold">{`${selectedItem.first_name || ''} ${selectedItem.last_name || ''}`.trim() || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">ID Number</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.sa_id || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Mobile Number</p>
                            <p className="text-sm text-gray-900 font-semibold">{selectedItem.cell_phone || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Email</p>
                            <p className="text-sm text-gray-900 font-semibold break-all">{selectedItem.email || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Reason - if rejected */}
                      {selectedItem.status === 'rejected' && selectedItem.rejection_reason && (
                        <div className="bg-white border border-red-200 rounded-xl p-6 bg-red-50">
                          <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-600">cancel</span>
                            Rejection Reason
                          </h3>
                          <p className="text-sm text-red-700 font-semibold">{selectedItem.rejection_reason}</p>
                        </div>
                      )}

                      {/* Passport/ID Document */}
                      {selectedItem.id_document_url && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#1a558b]">badge</span>
                            ID Document / Passport
                          </h3>
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              Uploaded on {new Date(selectedItem.created_at).toLocaleDateString()}
                            </p>
                            <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                              {passportImageUrl ? (
                                <img 
                                  src={passportImageUrl}
                                  alt="ID Document"
                                  className="max-w-full h-auto max-h-64 mx-auto"
                                  onError={(e) => {
                                    console.error('Image load error:', e);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="text-center text-gray-500 text-sm">
                                  <span className="material-symbols-outlined text-4xl mb-2 block">warning</span>
                                  <p>Document file could not be retrieved</p>
                                  <p className="text-xs mt-1">The agent may need to re-upload their document during re-registration</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              <span>Document verified and uploaded</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Agreement Information with Digital Signature */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">draw</span>
                          Digital Signature & Agreement
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Agreement Status</p>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-green-600">check_circle</span>
                              <span className="text-sm text-green-600 font-semibold">
                                Digitally signed on {new Date(selectedItem.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Digital Signature Display */}
                          {selectedItem.agreement_file && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Agent Signature</p>
                              <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
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
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <h4 className="font-bold text-sm text-blue-900 mb-2">Sales Agent Agreement Summary</h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                              <li>â€¢ You earn 1% commission on total sales at every partner shop you register and manage.</li>
                              <li>â€¢ Commissions are calculated and paid out on a monthly basis.</li>
                              <li>â€¢ Agent is required to manage all partner and member functionality professionaly.</li>
                              <li>â€¢ Account will be approved by an administrator before it becomes active.</li>
                              <li>â€¢ Please read and sign the agreement summary before final submission.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1a558b]">info</span>
                          Application Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Applied Date</p>
                            <p className="text-sm text-gray-900 font-semibold">{new Date(selectedItem.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Application Status</p>
                            <p className="text-sm text-gray-900 font-semibold">
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded text-xs font-bold uppercase">
                                {selectedItem.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (selectedItem.type === 'partner') {
                            handleApprovePartner(selectedItem.id, selectedAgentId || undefined);
                          } else {
                            handleApproveAgent(selectedItem.id);
                          }
                          setShowDetailsModal(false);
                          setSelectedAgentId('');
                        }}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        {selectedItem.type === 'partner' && selectedAgentId ? 'Approve & Assign Agent' : 'Approve Application'}
                      </button>
                      <button
                        onClick={() => {
                          if (selectedItem.type === 'partner') {
                            handleRejectPartner(selectedItem.id);
                          } else {
                            handleRejectAgent(selectedItem.id);
                          }
                          setShowDetailsModal(false);
                          setSelectedAgentId('');
                        }}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                        Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && confirmAction && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowConfirmModal(false)}
          >
            <div 
              className="rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
              style={{ backgroundColor: '#ffffff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{confirmAction.title}</h2>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6">
                <p className="text-gray-700 leading-relaxed">{confirmAction.message}</p>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.onConfirm}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {rejectionModal.show && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setRejectionModal({ show: false, type: null, id: '', reason: '' })}
          >
            <div 
              className="rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
              style={{ backgroundColor: '#ffffff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 text-2xl">cancel</span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900">
                    Reject {rejectionModal.type === 'partner' ? 'Partner' : 'Agent'} Application
                  </h2>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Please provide a brief reason for rejecting this application. This will be shown to the applicant when they try to log in.
                </p>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectionModal.reason}
                    onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Incomplete documentation, Invalid business registration, Does not meet eligibility criteria..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectionModal.reason.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setRejectionModal({ show: false, type: null, id: '', reason: '' })}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionModal.reason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}


