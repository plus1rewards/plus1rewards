// plus1-rewards/src/components/dashboard/Dashboard.tsx
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import Topbar from './Topbar';
import StatsCards, { StatsCardsRef } from './StatsCards';
import FinancialOverview from './FinancialOverview';
import PlatformStatus from './PlatformStatus';
import QuickActions from './QuickActions';
import Footer from './Footer';
import AdminNotifications from '../admin/AdminNotifications';
import SessionTimeoutWarning from '../admin/SessionTimeoutWarning';
import { supabaseAdmin } from '../../lib/supabase';
import { setupAdminActivityMonitor } from '../../lib/adminAuth';

export default function Dashboard() {
  const statsCardsRef = useRef<StatsCardsRef>(null);
  const navigate = useNavigate();
  const [alert, setAlert] = useState<{ message: string; action: () => void } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [membersNeedingVerification, setMembersNeedingVerification] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    percentComplete: string;
    amountFunded: number;
    target: number;
  }>>([]);

  // Set up activity monitoring for session extension
  useEffect(() => {
    setupAdminActivityMonitor();
  }, []);

  const handleRefresh = () => {
    if (statsCardsRef.current) {
      statsCardsRef.current.refresh();
    }
    checkMembersNeedingProfileCompletion();
  };

  const checkMembersNeedingProfileCompletion = async () => {
    try {
      console.log('Checking for members at 90%+ needing profile completion...');
      
      // Get all member cover plans with member details
      const { data: memberCoverPlans, error } = await supabaseAdmin
        .from('member_cover_plans')
        .select(`
          id,
          member_id,
          funded_amount,
          target_amount,
          status,
          members (
            id,
            first_name,
            last_name,
            cell_phone,
            email,
            sa_id,
            address_line_1
          )
        `)
        .eq('creation_order', 1)
        .in('status', ['in_progress', 'paused']);
      
      if (error) {
        console.error('Error fetching member cover plans:', error);
        setAlert(null);
        setMembersNeedingVerification([]);
        return;
      }
      
      if (!memberCoverPlans || memberCoverPlans.length === 0) {
        setAlert(null);
        setMembersNeedingVerification([]);
        return;
      }
      
      console.log(`Found ${memberCoverPlans.length} active cover plans`);
      
      const membersNeedingAttention: Array<{
        id: string;
        name: string;
        phone: string;
        email: string;
        percentComplete: string;
        amountFunded: number;
        target: number;
      }> = [];
      
      for (const plan of memberCoverPlans) {
        const member = plan.members;
        if (!member) continue;
        
        // Check if profile is incomplete
        const hasIncompleteProfile = 
          !member.email || 
          member.email.includes('@plus1rewards.local') || 
          !member.sa_id ||
          !member.address_line_1;
        
        if (!hasIncompleteProfile) continue;
        
        const fundedAmount = parseFloat(plan.funded_amount || '0');
        const targetAmount = parseFloat(plan.target_amount || '0');
        
        if (targetAmount === 0) continue;
        
        const percentComplete = (fundedAmount / targetAmount) * 100;
        
        console.log(`Member ${member.first_name} ${member.last_name}: ${percentComplete.toFixed(1)}% complete (R${fundedAmount}/R${targetAmount}), incomplete=${hasIncompleteProfile}`);
        
        if (percentComplete >= 90) {
          membersNeedingAttention.push({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`.trim(),
            phone: member.cell_phone || 'N/A',
            email: member.email || 'Not provided',
            percentComplete: percentComplete.toFixed(1),
            amountFunded: fundedAmount,
            target: targetAmount
          });
          console.log(`ALERT: Member ${member.first_name} ${member.last_name} at ${percentComplete.toFixed(1)}% needs verification!`);
        }
      }
      
      if (membersNeedingAttention.length > 0) {
        setMembersNeedingVerification(membersNeedingAttention);
        setAlert({
          message: `${membersNeedingAttention.length} member(s) at 90%+ cover plan completion need profile verification`,
          action: () => setShowModal(true)
        });
      } else {
        setAlert(null);
        setMembersNeedingVerification([]);
      }
    } catch (error) {
      console.error('Error checking members:', error);
      setAlert(null);
      setMembersNeedingVerification([]);
    }
  };

  useEffect(() => {
    checkMembersNeedingProfileCompletion();
  }, []);

  return (
    <DashboardLayout>
      <SessionTimeoutWarning />
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc] p-3 md:p-6 lg:p-10">
        <Topbar onRefresh={handleRefresh} />
        
        {/* Admin Notifications */}
        <AdminNotifications />
        
        {/* Alert Notification */}
        {alert && (
          <div className="mb-3 md:mb-6 bg-yellow-50 border border-yellow-200 rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <span className="material-symbols-outlined text-yellow-600 flex-shrink-0 text-lg md:text-xl">warning</span>
              <span className="text-yellow-800 font-medium text-xs md:text-sm break-words">{alert.message}</span>
            </div>
            <button
              onClick={alert.action}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-xs md:text-sm w-full sm:w-auto flex-shrink-0"
            >
              View Details
            </button>
          </div>
        )}
        
        <StatsCards ref={statsCardsRef} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
            <FinancialOverview />
            <PlatformStatus />
          </div>
          
          <QuickActions />
        </div>
        
        <Footer />
      </main>

      {/* Members Needing Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-200 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl md:rounded-2xl max-w-2xl md:max-w-3xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-4 md:my-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 md:p-6">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex items-start gap-2 md:gap-4 flex-1 min-w-0">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg md:rounded-xl p-1.5 md:p-3 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl md:text-4xl">verified_user</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base md:text-2xl font-black mb-0.5 md:mb-1">Profile Verification Required</h2>
                    <p className="text-yellow-50 text-[11px] md:text-sm font-medium">
                      {membersNeedingVerification.length} {membersNeedingVerification.length === 1 ? 'member has' : 'members have'} reached 90%+ cover plan completion with incomplete profiles
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition-all hover:rotate-90 duration-200 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-lg md:text-2xl">close</span>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3 md:p-6 overflow-y-auto max-h-[calc(95vh-180px)] md:max-h-[calc(90vh-200px)] bg-gray-50">
              <div className="space-y-3 md:space-y-4">
                {membersNeedingVerification.map((member, index) => (
                  <div 
                    key={member.id} 
                    className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Member Header */}
                    <div className="flex items-start justify-between mb-3 md:mb-5 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="bg-gradient-to-br from-[#1a558b] to-[#2d7ab8] text-white rounded-full w-8 md:w-12 h-8 md:h-12 flex items-center justify-center font-black text-sm md:text-lg flex-shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-xl font-black text-gray-900 truncate">{member.name}</h3>
                          <p className="text-[10px] md:text-xs text-gray-500 font-mono truncate">ID: {member.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                      <div className="text-right bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-2 border border-yellow-200 flex-shrink-0">
                        <div className="text-xl md:text-3xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                          {member.percentComplete}%
                        </div>
                        <div className="text-[9px] md:text-xs text-gray-600 font-bold uppercase tracking-wide">Complete</div>
                      </div>
                    </div>
                    
                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-5">
                      <div className="bg-gray-50 rounded-lg p-2 md:p-4 border border-gray-200">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <span className="material-symbols-outlined text-[#1a558b] text-sm md:text-lg">phone</span>
                          <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold tracking-wide">Phone</p>
                        </div>
                        <p className="text-sm md:text-lg font-black text-gray-900">{member.phone}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 md:p-4 border border-gray-200">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <span className="material-symbols-outlined text-purple-600 text-sm md:text-lg">mail</span>
                          <p className="text-[10px] md:text-xs text-gray-600 uppercase font-bold tracking-wide">Email</p>
                        </div>
                        {member.email?.includes('@plus1rewards.local') ? (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-red-500 text-xs md:text-sm">error</span>
                            <span className="text-[10px] md:text-xs font-bold text-red-600">Temporary Email</span>
                          </div>
                        ) : (
                          <p className="text-[10px] md:text-xs font-bold text-gray-900 truncate">{member.email || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Policy Progress */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg md:rounded-xl p-2.5 md:p-4 mb-3 md:mb-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                          <span className="material-symbols-outlined text-green-600 flex-shrink-0 text-sm md:text-base">trending_up</span>
                          <span className="text-[10px] md:text-xs text-gray-600 uppercase font-bold tracking-wide truncate">Cover Plan Funding</span>
                        </div>
                        <span className="text-[10px] md:text-sm font-black text-green-600 flex-shrink-0">
                          R{member.amountFunded.toFixed(2)} / R{member.target.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${Math.min(parseFloat(member.percentComplete), 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-[9px] md:text-xs text-gray-500 mt-1.5 md:mt-2 text-center font-medium">
                        R{(member.target - member.amountFunded).toFixed(2)} remaining to reach 100%
                      </p>
                    </div>
                    
                    {/* Action Required Box */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg md:rounded-xl p-3 md:p-5">
                      <div className="flex items-start gap-1.5 md:gap-3 mb-2 md:mb-4">
                        <div className="bg-[#1a558b] rounded-lg p-1 md:p-2 flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-base md:text-xl">priority_high</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-sm font-black text-blue-900 mb-0.5 md:mb-1 uppercase tracking-wide">Urgent Action Required</p>
                          <p className="text-[10px] md:text-sm text-blue-800 leading-relaxed">
                            Contact this member immediately to verify their profile information including SA ID, valid email address, and residential address before cover plan goes live.
                          </p>
                        </div>
                      </div>
                      <a 
                        href={`tel:${member.phone}`}
                        className="w-full flex items-center justify-center gap-1.5 md:gap-3 bg-gradient-to-r from-[#1a558b] to-[#2d7ab8] hover:from-[#1a558b]/90 hover:to-[#2d7ab8]/90 text-white rounded-lg md:rounded-xl py-2 md:py-3.5 px-3 md:px-6 font-black text-xs md:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-base md:text-2xl">call</span>
                        <span>Call {member.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 p-3 md:p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-3">
              <p className="text-[10px] md:text-xs text-gray-500 font-medium text-center sm:text-left">
                <span className="material-symbols-outlined text-xs md:text-sm align-middle mr-1">info</span>
                Verify all members before they reach 100% completion
              </p>
              <div className="flex gap-1.5 md:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 sm:flex-none px-3 md:px-5 py-2 md:py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all duration-200 text-xs md:text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate('/admin/members');
                  }}
                  className="flex-1 sm:flex-none px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm"
                >
                  <span className="material-symbols-outlined text-sm md:text-lg">group</span>
                  <span className="hidden sm:inline">View All Members</span>
                  <span className="sm:hidden">View All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
