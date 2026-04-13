// plus1-rewards/src/components/dashboard/pages/DisputesPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';

export default function DisputesPage() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: disputesData, error } = await supabaseAdmin
        .from('disputes')
        .select(`
          *,
          members(first_name, last_name, cell_phone),
          partners(shop_name, cell_phone),
          transactions(purchase_amount)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching disputes:', error);
      }

      // Fetch agent data separately for disputes with agent_id
      if (disputesData) {
        const agentIds = disputesData
          .filter(d => d.agent_id)
          .map(d => d.agent_id);
        
        if (agentIds.length > 0) {
          const { data: agentsData } = await supabaseAdmin
            .from('agents')
            .select('id, name, surname, cell_phone')
            .in('id', agentIds);
          
          // Map agent data to disputes
          disputesData.forEach(dispute => {
            if (dispute.agent_id) {
              const agent = agentsData?.find(a => a.id === dispute.agent_id);
              if (agent) {
                dispute.agents = agent;
              }
            }
          });
        }
      }

      const total = disputesData?.length || 0;
      const open = disputesData?.filter(d => d.status === 'open').length || 0;
      const resolved = disputesData?.filter(d => d.status === 'resolved').length || 0;
      const rejected = disputesData?.filter(d => d.status === 'rejected').length || 0;

      setDisputes(disputesData || []);
      setStats({ total, open, resolved, rejected });
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestigate = async (disputeId: string) => {
    setActionLoading(`investigate-${disputeId}`);
    try {
      const { error } = await supabaseAdmin
        .from('disputes')
        .update({ status: 'investigating' })
        .eq('id', disputeId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error investigating dispute:', error);
      alert('Failed to update dispute status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (disputeId: string) => {
    setSelectedDispute(disputeId);
    setShowResolutionModal(true);
  };

  const submitResolution = async () => {
    if (!resolutionNote.trim()) {
      alert('Please enter a resolution note');
      return;
    }

    setActionLoading(`resolve-${selectedDispute}`);
    try {
      const { error } = await supabaseAdmin
        .from('disputes')
        .update({
          status: 'resolved',
          resolution_note: resolutionNote.trim(),
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedDispute);

      if (error) throw error;
      
      setShowResolutionModal(false);
      setResolutionNote('');
      setSelectedDispute(null);
      await fetchData();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (disputeId: string) => {
    if (!window.confirm('Are you sure you want to reject this dispute?')) return;

    setActionLoading(`reject-${disputeId}`);
    try {
      const { error } = await supabaseAdmin
        .from('disputes')
        .update({ status: 'rejected' })
        .eq('id', disputeId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error rejecting dispute:', error);
      alert('Failed to reject dispute');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (dispute: any) => {
    const memberInfo = dispute.dispute_type === 'call_request' ? 'N/A (Agent Request)' : (`${dispute.members?.first_name} ${dispute.members?.last_name}`.trim() || 'Unknown');
    const partnerInfo = dispute.dispute_type === 'call_request' ? 'N/A (Agent Request)' : (dispute.partners?.shop_name || 'Unknown');
    const disputeTypeDisplay = dispute.dispute_type === 'call_request' ? 'Call Requested' : dispute.dispute_type;
    
    alert(`Dispute Details:\n\nID: ${dispute.id}\nMember: ${memberInfo}\nPartner: ${partnerInfo}\nType: ${disputeTypeDisplay}\nStatus: ${dispute.status}\nDescription: ${dispute.description}\n\nCreated: ${new Date(dispute.created_at).toLocaleString('en-ZA')}`);
  };

  useEffect(() => { fetchData(); }, []);

  const statsData = [
    { icon: 'report_problem', title: 'Total Disputes', value: stats.total.toString(), change: '', description: 'All time' },
    { icon: 'pending', title: 'Open', value: stats.open.toString(), change: '', description: 'Awaiting resolution' },
    { icon: 'check_circle', title: 'Resolved', value: stats.resolved.toString(), change: '', description: 'Successfully resolved' },
    { icon: 'cancel', title: 'Rejected', value: stats.rejected.toString(), change: '', description: 'Invalid disputes' }
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Disputes Management</h1>
            <p className="text-gray-600 mt-1">Handle transaction disputes and complaints</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchData()} className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined text-lg">refresh</span>Refresh
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm">
              <span className="material-symbols-outlined text-lg">logout</span>Logout
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (
              <StatCard key={index} icon={stat.icon} title={stat.title} value={stat.value} change={stat.change} description={stat.description} />
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                All Disputes ({disputes.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading disputes...</p>
              </div>
            ) : disputes.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
                <p className="text-gray-600 text-lg font-bold">No disputes found</p>
                <p className="text-sm text-gray-500 mt-2">Disputes will appear here when members or partners report issues</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            dispute.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                            dispute.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                            dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {dispute.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(dispute.created_at).toLocaleDateString('en-ZA', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-bold">Submitted By</p>
                            <p className="text-sm text-gray-900">
                              {dispute.member_id ? `${dispute.members?.first_name} ${dispute.members?.last_name}`.trim() || 'Unknown Member' :
                               dispute.partner_id ? dispute.partners?.shop_name || 'Unknown Partner' :
                               dispute.agent_id ? `${dispute.agents?.name} ${dispute.agents?.surname}`.trim() || 'Unknown Agent' :
                               'Unknown'}
                            </p>
                            <div className="text-xs text-gray-600">
                              {dispute.member_id ? dispute.members?.cell_phone :
                               dispute.partner_id ? dispute.partners?.cell_phone :
                               dispute.agent_id ? dispute.agents?.cell_phone :
                               '-'}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-bold">User Type</p>
                            <p className="text-sm text-gray-900">
                              {dispute.member_id ? 'Member' :
                               dispute.partner_id ? 'Partner' :
                               dispute.agent_id ? 'Agent' :
                               'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-bold">Dispute Type</p>
                            <p className="text-sm text-gray-900 capitalize">
                              {dispute.dispute_type?.replace('_', ' ') || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-bold">Transaction Amount</p>
                            <p className="text-sm text-gray-900">R{dispute.transactions?.purchase_amount?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>

                        {dispute.description && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-gray-600 uppercase font-bold mb-1">Description</p>
                            <p className="text-sm text-gray-700">{dispute.description}</p>
                          </div>
                        )}

                        {dispute.resolution_note && (
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <p className="text-xs text-green-700 uppercase font-bold mb-1">Resolution Note</p>
                            <p className="text-sm text-green-800">{dispute.resolution_note}</p>
                            {dispute.resolved_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Resolved on {new Date(dispute.resolved_at).toLocaleDateString('en-ZA')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {dispute.status === 'open' && (
                          <>
                            <button 
                              onClick={() => handleInvestigate(dispute.id)}
                              disabled={actionLoading === `investigate-${dispute.id}`}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">{actionLoading === `investigate-${dispute.id}` ? 'hourglass_empty' : 'search'}</span>
                              {actionLoading === `investigate-${dispute.id}` ? 'Investigating...' : 'Investigate'}
                            </button>
                            <button 
                              onClick={() => handleResolve(dispute.id)}
                              disabled={actionLoading === `resolve-${dispute.id}`}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">{actionLoading === `resolve-${dispute.id}` ? 'hourglass_empty' : 'check_circle'}</span>
                              {actionLoading === `resolve-${dispute.id}` ? 'Resolving...' : 'Resolve'}
                            </button>
                            <button 
                              onClick={() => handleReject(dispute.id)}
                              disabled={actionLoading === `reject-${dispute.id}`}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">{actionLoading === `reject-${dispute.id}` ? 'hourglass_empty' : 'cancel'}</span>
                              {actionLoading === `reject-${dispute.id}` ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {dispute.status === 'investigating' && (
                          <>
                            <button 
                              onClick={() => handleResolve(dispute.id)}
                              disabled={actionLoading === `resolve-${dispute.id}`}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">{actionLoading === `resolve-${dispute.id}` ? 'hourglass_empty' : 'check_circle'}</span>
                              {actionLoading === `resolve-${dispute.id}` ? 'Resolving...' : 'Resolve'}
                            </button>
                            <button 
                              onClick={() => handleReject(dispute.id)}
                              disabled={actionLoading === `reject-${dispute.id}`}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">{actionLoading === `reject-${dispute.id}` ? 'hourglass_empty' : 'cancel'}</span>
                              {actionLoading === `reject-${dispute.id}` ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Dispute Resolution Process</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Review dispute details and supporting evidence</li>
                <li>• Contact member and partner for clarification</li>
                <li>• Reverse transaction if necessary</li>
                <li>• Add manual adjustments to correct balances</li>
                <li>• Document resolution notes for audit trail</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2026 +1 Rewards Platform Management • Secured Admin Access
            </p>
          </div>
        </div>

        {/* Resolution Modal */}
        {showResolutionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resolve Dispute</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Resolution Note *</label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Explain how this dispute was resolved..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowResolutionModal(false);
                      setResolutionNote('');
                      setSelectedDispute(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitResolution}
                    disabled={actionLoading?.startsWith('resolve-')}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">{actionLoading?.startsWith('resolve-') ? 'hourglass_empty' : 'check_circle'}</span>
                    {actionLoading?.startsWith('resolve-') ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
