import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import { encodeMemberQR } from '../lib/config';
import QRCode from 'qrcode';
import UpgradePromptModal from '../components/member/UpgradePromptModal';
import ProfileIncompleteModal from '../components/member/ProfileIncompleteModal';
import PlanSelectionModal from '../components/member/PlanSelectionModal';
import PendingVerificationModal from '../components/member/PendingVerificationModal';
import { Notification, useNotification } from '../components/Notification';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
  status: string;
  role?: string;
  sa_id?: string;
  date_of_birth?: string;
  address_line_1?: string;
  city?: string;
  postal_code?: string;
}

interface MemberCoverPlan {
  id: string;
  creation_order: number;
  target_amount: number | string;
  funded_amount: number | string;
  overflow_balance: number | string;
  status: string;
  active_from: string | null;
  active_to: string | null;
  plan_changes_count: number;
  cover_plans: {
    plan_name: string;
  };
}

interface Transaction {
  id: string;
  purchase_amount: number;
  member_amount: number;
  created_at: string;
  partners: {
    shop_name: string;
  };
}

interface LinkedPerson {
  id: string;
  full_name: string;
  id_number: string;
  linked_type: string;
  status: string;
  member_cover_plans: {
    target_amount: number;
    funded_amount: number;
    status: string;
    cover_plans: {
      plan_name: string;
    };
  };
}

const DashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  
  // Member and data state
  const [member, setMember] = useState<Member | null>(null);
  const [mainCoverPlan, setMainCoverPlan] = useState<MemberCoverPlan | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<LinkedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for form inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showProfileIncomplete, setShowProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [canChangePlan, setCanChangePlan] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPendingVerification, setShowPendingVerification] = useState(false);


  // Debug: Log when showProfileIncomplete changes
  useEffect(() => {
    console.log('📢 showProfileIncomplete changed:', showProfileIncomplete, 'missingFields:', missingFields);
  }, [showProfileIncomplete, missingFields]);

  const generateQRCode = async (qrCode: string, phone: string) => {
    const qrValue = encodeMemberQR(qrCode, phone);
    try {
      const url = await QRCode.toDataURL(qrValue, {
        width: 400,
        margin: 2,
        color: { dark: '#1a558b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const session = getSession();
      
      if (!session) {
        navigate('/member/login');
        return;
      }

      const sessionMemberData = session.member;
      
      if (!sessionMemberData || !sessionMemberData.id) {
        console.error('No member data in session');
        navigate('/member/login');
        return;
      }

      // Fetch member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, cell_phone, email, qr_code, status, role, sa_id, address_line_1, city, postal_code')
        .eq('id', sessionMemberData.id)
        .single();

      if (memberError || !memberData) {
        console.error('Error fetching member data:', memberError);
        navigate('/member/login');
        return;
      }

      setMember({
        id: memberData.id,
        name: `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim(),
        phone: memberData.cell_phone,
        email: memberData.email,
        qr_code: memberData.qr_code,
        status: memberData.status,
        role: memberData.role,
        sa_id: memberData.sa_id,
        address_line_1: memberData.address_line_1,
        city: memberData.city,
        postal_code: memberData.postal_code
      });
      
      setFirstName(memberData.first_name || '');
      setLastName(memberData.last_name || '');
      setContactNumber(memberData.cell_phone);
      setEmail(memberData.email || '');

      // Generate QR code
      if (memberData.qr_code) {
        generateQRCode(memberData.qr_code, memberData.cell_phone);
      }

      // Get main cover plan
      const { data: coverPlansData } = await supabase
        .from('member_cover_plans')
        .select(`
          *,
          cover_plans (plan_name)
        `)
        .eq('member_id', memberData.id)
        .order('creation_order', { ascending: true });

      console.log('Cover plans query result:', { coverPlansData, memberId: memberData.id });

      if (coverPlansData && coverPlansData.length > 0) {
        console.log('Found cover plan:', coverPlansData[0]);
        console.log('🔍 COVER PLAN STATUS:', coverPlansData[0].status);
        console.log('🔍 COVER PLAN FULL DATA:', JSON.stringify(coverPlansData[0], null, 2));
        const planWithNumbers = {
          ...coverPlansData[0],
          target_amount: typeof coverPlansData[0].target_amount === 'string' 
            ? parseFloat(coverPlansData[0].target_amount) 
            : coverPlansData[0].target_amount,
          funded_amount: typeof coverPlansData[0].funded_amount === 'string' 
            ? parseFloat(coverPlansData[0].funded_amount) 
            : coverPlansData[0].funded_amount,
          overflow_balance: typeof coverPlansData[0].overflow_balance === 'string' 
            ? parseFloat(coverPlansData[0].overflow_balance) 
            : (coverPlansData[0].overflow_balance || 0)
        };
        console.log('🔍 PLAN WITH NUMBERS STATUS:', planWithNumbers.status);
        setMainCoverPlan(planWithNumbers);
      } else {
        console.log('No cover plans found - showing plan selection modal');
        setShowPlanSelection(true);
      }

      // Get recent transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          id,
          purchase_amount,
          member_amount,
          created_at,
          partners (shop_name)
        `)
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (txData) {
        setRecentTransactions(txData as any);
      }

      // Get linked people (dependants)
      const { data: linkedData } = await supabase
        .from('linked_people')
        .select(`
          id,
          full_name,
          id_number,
          linked_type,
          status,
          member_cover_plans (
            target_amount,
            funded_amount,
            status,
            cover_plans (plan_name)
          )
        `)
        .eq('linked_to_main_member_id', memberData.id)
        .order('full_name', { ascending: true });

      if (linkedData) {
        setLinkedPeople(linkedData as any);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    navigate('/member/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  // Calculate values
  const targetAmount = mainCoverPlan ? Number(mainCoverPlan.target_amount) : 0;
  const fundedAmount = mainCoverPlan ? Number(mainCoverPlan.funded_amount) : 0;
  const overflowBalance = mainCoverPlan ? Number(mainCoverPlan.overflow_balance) : 0;
  const totalCashbackEarned = fundedAmount + overflowBalance;
  const progressPercent = mainCoverPlan 
    ? Math.min((fundedAmount / targetAmount) * 100, 100)
    : 0;

  // Check if we should show upgrade prompt (when overflow >= plan amount on login)
  useEffect(() => {
    if (mainCoverPlan && overflowBalance >= targetAmount && mainCoverPlan.status === 'active') {
      const lastPromptOverflow = sessionStorage.getItem('last_upgrade_prompt_overflow');
      const currentOverflowKey = `${mainCoverPlan.id}_${Math.floor(overflowBalance)}`;
      
      if (lastPromptOverflow !== currentOverflowKey) {
        setShowUpgradePrompt(true);
        sessionStorage.setItem('last_upgrade_prompt_overflow', currentOverflowKey);
      }
    }
  }, [mainCoverPlan, overflowBalance, targetAmount]);

  // Check if policy reached 100% and is pending verification
  useEffect(() => {
    if (!member || !mainCoverPlan) return;

    // Show pending verification modal if status is pending (only once per session unless dismissed)
    if (mainCoverPlan.status === 'pending' && progressPercent >= 100) {
      const hasSeenPendingModal = sessionStorage.getItem(`pending_modal_seen_${mainCoverPlan.id}`);
      const hasDismissedTemp = sessionStorage.getItem(`pending_modal_dismissed_temp`);
      
      // Only show if not seen before AND not temporarily dismissed
      if (!hasSeenPendingModal && !hasDismissedTemp) {
        setShowPendingVerification(true);
        sessionStorage.setItem(`pending_modal_seen_${mainCoverPlan.id}`, 'true');
      }
    }
  }, [member, mainCoverPlan, progressPercent]);

  // Check profile completeness when plan reaches 90%+
  useEffect(() => {
    if (!member || !mainCoverPlan || isEditingProfile) return;

    const checkProfileCompleteness = async () => {
      const missing: string[] = [];
      if (!member.email || member.email.includes('@plus1rewards.local')) {
        missing.push('Valid Email Address');
      }
      if (!member.sa_id) {
        missing.push('SA ID Number');
      }
      if (!member.address_line_1) {
        missing.push('Address Line 1');
      }

      const isProfileIncomplete = missing.length > 0;
      const isProfileComplete = !isProfileIncomplete;

      console.log('🔍 Profile check:', {
        progressPercent,
        isProfileIncomplete,
        missing,
        email: member.email,
        sa_id: member.sa_id,
        address_line_1: member.address_line_1,
        status: mainCoverPlan.status,
        shouldShow: isProfileIncomplete && progressPercent >= 90
      });

      // If plan is paused (reached 100% with incomplete profile), show modal
      if (mainCoverPlan.status === 'paused' && isProfileIncomplete) {
        console.log('⚠️ Plan is paused due to incomplete profile at 100%');
        
        // Check if user can still change plan
        const planChangesCount = mainCoverPlan.plan_changes_count || 0;
        setCanChangePlan(planChangesCount < 1);
        
        setMissingFields(missing);
        setShowProfileIncomplete(true);
        
        const lastPromptProgress = sessionStorage.getItem('last_profile_prompt_paused');
        const currentProgressKey = `${mainCoverPlan.id}_paused`;
        
        if (lastPromptProgress !== currentProgressKey) {
          sessionStorage.setItem('last_profile_prompt_paused', currentProgressKey);

          try {
            await supabase.from('admin_notifications').insert({
              type: 'profile_incomplete_paused',
              member_id: member.id,
              member_name: member.name,
              member_phone: member.phone,
              message: `CRITICAL: Member ${member.name} (${member.phone}) reached 100% with incomplete profile. Plan has been PAUSED. Missing: ${missing.join(', ')}`,
              priority: 'high',
              metadata: {
                progress_percent: progressPercent,
                missing_fields: missing,
                cover_plan_id: mainCoverPlan.id,
                action: 'plan_paused'
              }
            });
          } catch (error) {
            console.error('Error creating admin notification:', error);
          }
        }
      }
      // At 96%+: Show warning modal
      else if (isProfileIncomplete && progressPercent >= 96 && progressPercent < 100) {
        console.log('⚠️ At 96%+: Profile incomplete - showing warning');
        
        // Check if user has dismissed this modal at 96%
        const dismissedKey96 = `profile_modal_dismissed_96_${mainCoverPlan.id}`;
        const isDismissed96 = localStorage.getItem(dismissedKey96) === 'true';
        
        console.log('96% dismissal check:', { dismissedKey96, isDismissed96, storedValue: localStorage.getItem(dismissedKey96) });
        
        // Always show at 96%+ (mandatory, can't dismiss)
        console.log('✅ Showing 96% modal (mandatory)');
        // Check if user can still change plan
        const planChangesCount = mainCoverPlan.plan_changes_count || 0;
        setCanChangePlan(planChangesCount < 1);
        
        setMissingFields(missing);
        setShowProfileIncomplete(true);
        
        const lastPromptProgress = sessionStorage.getItem('last_profile_prompt_96');
        const currentProgressKey = `${mainCoverPlan.id}_96`;
        
        if (lastPromptProgress !== currentProgressKey) {
          sessionStorage.setItem('last_profile_prompt_96', currentProgressKey);

          try {
            await supabase.from('admin_notifications').insert({
              type: 'profile_incomplete_96_suspended',
              member_id: member.id,
              member_name: member.name,
              member_phone: member.phone,
              message: `CRITICAL: Member ${member.name} (${member.phone}) has reached ${progressPercent.toFixed(0)}% cover plan completion with incomplete profile. Plan has been PAUSED. Missing: ${missing.join(', ')}`,
              priority: 'high',
              metadata: {
                progress_percent: progressPercent,
                missing_fields: missing,
                cover_plan_id: mainCoverPlan.id,
                action: 'plan_suspended'
              }
            });
          } catch (error) {
            console.error('Error creating admin notification:', error);
          }
        }
      }
      // At 95%: Show mandatory modal (but don't suspend yet)
      else if (isProfileIncomplete && progressPercent >= 95 && progressPercent < 96) {
        console.log('✅ Checking 95% modal dismissal');
        
        // Check if user has dismissed this modal at 95%
        const dismissedKey95 = `profile_modal_dismissed_95_${mainCoverPlan.id}`;
        const isDismissed95 = localStorage.getItem(dismissedKey95) === 'true';
        
        console.log('95% dismissal check:', { dismissedKey95, isDismissed95, storedValue: localStorage.getItem(dismissedKey95) });
        
        // Only show if not dismissed
        if (!isDismissed95) {
          console.log('✅ Showing 95% modal');
          // Check if user can still change plan
          const planChangesCount = mainCoverPlan.plan_changes_count || 0;
          setCanChangePlan(planChangesCount < 1);
          
          setMissingFields(missing);
          setShowProfileIncomplete(true);
        } else {
          console.log('⏭️ 95% modal dismissed, not showing');
          setShowProfileIncomplete(false);
        }
        
        const lastPromptProgress = sessionStorage.getItem('last_profile_prompt_progress_95');
        const currentProgressKey = `${mainCoverPlan.id}_95`;
        
        if (lastPromptProgress !== currentProgressKey) {
          sessionStorage.setItem('last_profile_prompt_progress_95', currentProgressKey);

          try {
            await supabase.from('admin_notifications').insert({
              type: 'profile_incomplete_95',
              member_id: member.id,
              member_name: member.name,
              member_phone: member.phone,
              message: `URGENT: Member ${member.name} (${member.phone}) has reached ${progressPercent.toFixed(0)}% cover plan completion. Profile completion is now MANDATORY. Missing: ${missing.join(', ')}`,
              priority: 'high',
              metadata: {
                progress_percent: progressPercent,
                missing_fields: missing,
                cover_plan_id: mainCoverPlan.id
              }
            });
          } catch (error) {
            console.error('Error creating admin notification:', error);
          }
        }
      }
      // At 90-94%: Show with "Remind Me Later" option
      else if (isProfileIncomplete && progressPercent >= 90 && progressPercent < 95) {
        console.log('✅ At 90% - showing modal');
        
        // Check if user can still change plan
        const planChangesCount = mainCoverPlan.plan_changes_count || 0;
        setCanChangePlan(planChangesCount < 1);
        
        setMissingFields(missing);
        setShowProfileIncomplete(true);
        
        const lastPromptProgress = sessionStorage.getItem('last_profile_prompt_progress_90');
        const currentProgressKey = `${mainCoverPlan.id}_90`;
        
        if (lastPromptProgress !== currentProgressKey) {
          sessionStorage.setItem('last_profile_prompt_progress_90', currentProgressKey);

          try {
            await supabase.from('admin_notifications').insert({
              type: 'profile_incomplete_90',
              member_id: member.id,
              member_name: member.name,
              member_phone: member.phone,
              message: `Member ${member.name} (${member.phone}) has reached ${progressPercent.toFixed(0)}% cover plan completion but has incomplete profile. Missing: ${missing.join(', ')}`,
              priority: 'medium',
              metadata: {
                progress_percent: progressPercent,
                missing_fields: missing,
                cover_plan_id: mainCoverPlan.id
              }
            });
          } catch (error) {
            console.error('Error creating admin notification:', error);
          }
        }
      }
      // If profile is complete and plan was paused, change to pending for Day1Health verification
      else if (isProfileComplete && mainCoverPlan.status === 'paused' && progressPercent >= 100) {
        console.log('✅ Profile complete - changing paused plan to pending for verification');
        const { error: updateError } = await supabase
          .from('member_cover_plans')
          .update({ status: 'pending' })
          .eq('id', mainCoverPlan.id);

        if (updateError) {
          console.error('Error updating plan to pending:', updateError);
        } else {
          console.log('✅ Plan changed to pending - ready for Day1Health verification');
          
          try {
            await supabase.from('admin_notifications').insert({
              type: 'profile_complete_pending',
              member_id: member.id,
              member_name: member.name,
              member_phone: member.phone,
              message: `Member ${member.name} (${member.phone}) has completed their profile. Paused plan has been changed to pending for Day1Health verification.`,
              priority: 'medium',
              metadata: {
                progress_percent: progressPercent,
                cover_plan_id: mainCoverPlan.id,
                action: 'plan_pending'
              }
            });
          } catch (error) {
            console.error('Error creating admin notification:', error);
          }
          
          // Close the modal and reload data to show pending status
          setShowProfileIncomplete(false);
          await loadDashboardData();
          
          // Show pending verification modal after data reload
          setTimeout(() => {
            setShowPendingVerification(true);
          }, 500);
        }
      }
      // If profile is complete and plan is already pending, don't show profile incomplete modal
      else if (isProfileComplete && mainCoverPlan.status === 'pending') {
        console.log('✅ Profile complete and plan is pending - no action needed');
        setShowProfileIncomplete(false);
      }
    };

    checkProfileCompleteness();
  }, [member, mainCoverPlan, progressPercent, isEditingProfile]);

  const handleUpgrade = async () => {
    if (!mainCoverPlan) return;

    const currentTarget = Number(mainCoverPlan.target_amount);
    const currentOverflow = Number(mainCoverPlan.overflow_balance);
    
    let nextTarget = 0;
    let upgradeCost = 0;
    let nextPlanId = '';
    
    if (currentTarget === 390) {
      nextTarget = 665;
      upgradeCost = 275;
      // Get the R665 plan ID
      const { data: nextPlan } = await supabase
        .from('cover_plans')
        .select('id')
        .eq('monthly_target_amount', 665)
        .eq('status', 'active')
        .single();
      
      if (!nextPlan) {
        showError('Upgrade Error', 'R665 plan not found. Please contact support.', 3000);
        return;
      }
      nextPlanId = nextPlan.id;
    } else {
      showWarning('Maximum Plan Reached', 'You are already on the highest plan!', 3000);
      return;
    }

    if (currentOverflow < upgradeCost) {
      showError(
        'Insufficient Overflow', 
        `You need R${upgradeCost.toFixed(2)} to upgrade. You have R${currentOverflow.toFixed(2)}.`,
        3000
      );
      return;
    }

    try {
      const newOverflow = currentOverflow - upgradeCost;
      
      const { error } = await supabase
        .from('member_cover_plans')
        .update({ 
          cover_plan_id: nextPlanId,
          target_amount: nextTarget,
          funded_amount: nextTarget,
          overflow_balance: newOverflow,
          status: 'active',
          active_from: new Date().toISOString(),
          active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', mainCoverPlan.id);

      if (error) throw error;

      await supabase
        .from('cover_plan_wallet_entries')
        .insert({
          member_id: member!.id,
          member_cover_plan_id: mainCoverPlan.id,
          entry_type: 'overflow_moved',
          amount: -upgradeCost,
          balance_after: newOverflow
        });

      setShowUpgradePrompt(false);
      sessionStorage.removeItem('last_upgrade_prompt_overflow');
      loadDashboardData();
      
      showSuccess(
        'Plan Upgraded Successfully!',
        `Upgraded to R${nextTarget} plan! Remaining overflow: R${newOverflow.toFixed(2)}`,
        3000
      );
    } catch (error) {
      console.error('Error upgrading plan:', error);
      showError('Upgrade Failed', 'Failed to upgrade plan. Please try again.', 3000);
    }
  };

  const handleDeclineUpgrade = () => {
    setShowUpgradePrompt(false);
  };

  const handleAddDependant = () => {
    navigate('/member/add-dependant');
  };

  const handleSponsorSomeone = () => {
    navigate('/member/sponsor');
  };

  const handleSaveProfile = async () => {
    if (!member) return;

    try {
      setIsEditingProfile(true);

      const { error } = await supabase
        .from('members')
        .update({
          first_name: firstName,
          last_name: lastName,
          cell_phone: contactNumber,
          email: email,
          sa_id: member.sa_id,
          address_line_1: member.address_line_1,
          city: member.city,
          postal_code: member.postal_code
        })
        .eq('id', member.id);

      if (error) {
        // Check for duplicate SA ID error
        if (error.code === '23505' && error.message.includes('sa_id')) {
          throw new Error('This SA ID number is already registered to another member. Please check your SA ID or contact support if you believe this is an error.');
        }
        throw error;
      }

      // Close the profile incomplete modal after successful save
      setShowProfileIncomplete(false);
      setIsEditingProfile(false);

      showSuccess('Profile Updated', 'Profile updated successfully!', 3000);
      loadDashboardData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setIsEditingProfile(false);
      
      // Show specific error message
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      showError('Update Failed', errorMessage, 5000);
    }
  };

  const handleInputFocus = () => {
    setIsEditingProfile(true);
    setShowProfileIncomplete(false);
  };

  const handleDiscardChanges = () => {
    if (member) {
      setFirstName(member.name.split(' ')[0] || '');
      setLastName(member.name.split(' ').slice(1).join(' ') || '');
      setContactNumber(member.phone);
      setEmail(member.email || '');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-gray-900">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 h-16 bg-slate-900 dark:bg-background-dark z-50 transition-all">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="Plus1 Rewards" 
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="10" y="25" fill="white" font-family="Arial" font-size="16" font-weight="bold">Plus1</text></svg>';
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Profile Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Profile Picture - placeholder if not available */}
              <div className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 shadow-sm bg-gray-100 flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-gray-400 text-4xl">person</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                ACTIVE
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{member?.name || 'Member'}</h1>
              <p className="text-gray-600 font-medium">{member?.phone} • {member?.qr_code}</p>
              <button 
                onClick={() => {
                  const element = document.getElementById('edit-profile-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="mt-2 text-gray-900 font-bold text-sm flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Edit Profile
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg flex items-center gap-4 shadow-sm border border-gray-200">
            <button 
              onClick={() => setShowQRModal(true)}
              className="bg-white p-1 rounded-[4px] border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
            >
              {qrDataUrl ? (
                <img
                  className="w-16 h-16"
                  src={qrDataUrl}
                  alt="QR Code"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-400">qr_code</span>
                </div>
              )}
            </button>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.05em]">Membership ID</p>
              <p className="text-sm font-bold text-gray-900">{member?.qr_code || 'N/A'}</p>
              <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                DIGITAL PASS
              </span>
            </div>
          </div>
        </div>


        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Balance & Metrics */}
          <div className="md:col-span-8 flex flex-col gap-6">
            {/* Primary Balance Card */}
            <div className="bg-blue-700 text-white p-8 rounded-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="material-symbols-outlined text-8xl">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.1em] mb-1">
                  Overflow Balance
                </p>
                <h2 className="text-6xl font-extrabold tracking-tighter">R{overflowBalance.toFixed(2)}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/20">
                <div>
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.05em]">
                    Total Lifetime Earned
                  </p>
                  <p className="text-xl font-bold">R{totalCashbackEarned.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.05em]">
                    Policy Deductions
                  </p>
                  <p className="text-xl font-bold text-green-300">-R{fundedAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Manage Cashback Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={handleUpgrade}
                disabled={Number(mainCoverPlan?.target_amount) >= 665}
                className="!bg-blue-600 !text-white p-4 rounded-lg text-left hover:scale-[0.98] transition-all flex flex-col justify-between min-h-[120px] disabled:!bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined text-2xl !text-white">upgrade</span>
                <span className="font-bold text-sm leading-tight !text-white">
                  Upgrade<br />Plan
                </span>
              </button>
              <button 
                onClick={handleAddDependant}
                disabled={mainCoverPlan?.status !== 'active' || overflowBalance < 156}
                className="!bg-teal-800 !text-white p-4 rounded-lg text-left hover:scale-[0.98] transition-all flex flex-col justify-between min-h-[120px] disabled:!bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                title={
                  mainCoverPlan?.status !== 'active' 
                    ? 'Plan must be active to add dependants' 
                    : overflowBalance < 156 
                    ? 'Need at least R156 overflow to add a child dependant' 
                    : 'Add a dependant to your plan'
                }
              >
                <span className="material-symbols-outlined text-2xl !text-white">person_add</span>
                <span className="font-bold text-sm leading-tight !text-white">
                  Add<br />Dependant
                </span>
              </button>
              <button 
                onClick={handleSponsorSomeone}
                disabled={mainCoverPlan?.status !== 'active' || overflowBalance < 390}
                className="!bg-green-700 !text-white p-4 rounded-lg text-left hover:scale-[0.98] transition-all flex flex-col justify-between min-h-[120px] disabled:!bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                title={
                  mainCoverPlan?.status !== 'active' 
                    ? 'Plan must be active to sponsor someone' 
                    : overflowBalance < 390 
                    ? 'Need at least R390 overflow to sponsor someone' 
                    : 'Sponsor someone\'s cover plan'
                }
              >
                <span className="material-symbols-outlined text-2xl !text-white">volunteer_activism</span>
                <span className="font-bold text-sm leading-tight !text-white">
                  Sponsor<br />Someone
                </span>
              </button>
              <button 
                onClick={() => navigate('/member/cover-plans')}
                className="!bg-slate-600 !text-white p-4 rounded-lg text-left hover:scale-[0.98] transition-all flex flex-col justify-between min-h-[120px]"
              >
                <span className="material-symbols-outlined text-2xl !text-white">list_alt</span>
                <span className="font-bold text-sm leading-tight !text-white">
                  View All<br />Plans
                </span>
              </button>
            </div>


            {/* Recent Transactions */}
            {member?.role !== 'sponsored_member' && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-gray-500">
                    Recent Rewards History
                  </h3>
                  <button className="text-blue-600 text-xs font-bold hover:underline">View Statement</button>
                </div>
                <div className="space-y-3">
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No recent transactions</p>
                    </div>
                  ) : (
                    recentTransactions.map((tx, index) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600">
                              {index === 0 ? 'shopping_cart' : index === 1 ? 'medication' : 'coffee'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{tx.partners?.shop_name || 'Partner Store'}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                              {formatDate(tx.created_at)} • CASHBACK REWARD
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-green-600">+R{tx.member_amount.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500">Cashback</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>


          {/* Side Grid Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Active Policy Card */}
            <div className={`${
              mainCoverPlan?.status === 'paused' ? 'bg-orange-50 border-orange-300' : 
              mainCoverPlan?.status === 'pending' ? 'bg-yellow-50 border-yellow-300' : 
              'bg-white border-gray-200'
            } border p-6 rounded-lg shadow-sm`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">
                    Current Plan
                  </p>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {mainCoverPlan?.cover_plans?.plan_name || 'No Plan'}
                  </h3>
                </div>
                <span className={`material-symbols-outlined ${
                  mainCoverPlan?.status === 'paused' ? 'text-orange-600' : 
                  mainCoverPlan?.status === 'pending' ? 'text-yellow-600' : 
                  mainCoverPlan?.status === 'active' ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {mainCoverPlan?.status === 'paused' ? 'pause_circle' : 
                   mainCoverPlan?.status === 'pending' ? 'pending_actions' :
                   mainCoverPlan?.status === 'active' ? 'check_circle' :
                   'verified'}
                </span>
              </div>
              <div className="space-y-4">
                {mainCoverPlan?.status === 'paused' && (
                  <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-orange-600 text-xl">pause_circle</span>
                      <p className="text-sm font-black text-orange-700">POLICY PAUSED</p>
                    </div>
                    <p className="text-xs text-orange-700 font-semibold">
                      Your policy is paused due to incomplete profile information. Complete your profile below to reactivate.
                    </p>
                  </div>
                )}
                {mainCoverPlan?.status === 'pending' && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-yellow-600 text-xl">pending_actions</span>
                      <p className="text-sm font-black text-yellow-700">PENDING VERIFICATION</p>
                    </div>
                    <p className="text-xs text-yellow-700 font-semibold mb-3">
                      Your policy is fully funded! Complete verification at Day1Health to activate your coverage.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => window.open('https://www.day1main.com/plus1confirm', '_blank')}
                        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Verify at Day1Health
                      </button>
                      <button
                        onClick={() => setShowPendingVerification(true)}
                        className="text-xs font-bold text-yellow-800 hover:text-yellow-900 underline"
                      >
                        View Verification Steps →
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-end">
                  <span className={`text-xs font-bold ${
                    mainCoverPlan?.status === 'active' ? 'text-green-600' : 
                    mainCoverPlan?.status === 'paused' ? 'text-orange-600' : 
                    mainCoverPlan?.status === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    Policy {
                      mainCoverPlan?.status === 'active' ? 'Active' : 
                      mainCoverPlan?.status === 'paused' ? 'PAUSED' : 
                      mainCoverPlan?.status === 'pending' ? 'PENDING' :
                      'In Progress'
                    }
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {mainCoverPlan?.status === 'active' || mainCoverPlan?.status === 'pending' ? '100' : progressPercent.toFixed(2)}% Utilization
                  </span>
                </div>
                {/* Precision Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      mainCoverPlan?.status === 'active' ? 'bg-green-500' : 
                      mainCoverPlan?.status === 'paused' ? 'bg-orange-500' : 
                      mainCoverPlan?.status === 'pending' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} 
                    style={{ width: `${mainCoverPlan?.status === 'active' || mainCoverPlan?.status === 'pending' ? 100 : progressPercent}%` }}
                  ></div>
                </div>
                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Premium</p>
                    <p className="text-sm font-bold text-slate-900">R{targetAmount.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Renewal</p>
                    <p className="text-sm font-bold text-slate-900">
                      {mainCoverPlan?.active_to ? new Date(mainCoverPlan.active_to).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/find-partner')}
                className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors group border border-blue-100">
                <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">
                  store
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-center text-gray-900">Find Partners</span>
              </button>
              <button 
                onClick={() => navigate('/member/cover-plans')}
                className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors group border border-blue-100">
                <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">
                  health_and_safety
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-center text-gray-900">My Cover Plans</span>
              </button>
              {member?.role !== 'sponsored_member' && (
                <button 
                  onClick={() => navigate('/member/transactions')}
                  className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors group border border-blue-100">
                  <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">
                    history
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-center text-gray-900">View All Transactions</span>
                </button>
              )}
              <button 
                onClick={() => navigate('/member/top-up')}
                className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors group border border-blue-100">
                <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">
                  account_balance
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-center text-gray-900">Top Up</span>
              </button>
              <button 
                onClick={() => navigate('/member/support')}
                className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors group border border-blue-100">
                <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">
                  support_agent
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-center text-gray-900">Support</span>
              </button>
            </div>

            {/* Linked People / Dependants */}
            {linkedPeople.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-gray-500">
                    Linked People & Dependants
                  </h3>
                </div>
                <div className="space-y-3">
                  {linkedPeople.map((person) => {
                    const planData = person.member_cover_plans;
                    const targetAmount = Number(planData?.target_amount || 0);
                    const fundedAmount = Number(planData?.funded_amount || 0);
                    const progressPercent = targetAmount > 0 ? Math.min((fundedAmount / targetAmount) * 100, 100) : 0;
                    
                    return (
                      <div key={person.id} className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-white text-xl">
                                {person.linked_type === 'child' ? 'child_care' : person.linked_type === 'spouse' ? 'favorite' : 'person'}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900">{person.full_name}</p>
                              <p className="text-[10px] text-teal-700 uppercase tracking-wider font-bold">
                                {person.linked_type}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            person.status === 'active' ? 'bg-green-100 text-green-700' :
                            person.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {person.status.toUpperCase()}
                          </span>
                        </div>
                        
                        {planData && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">{planData.cover_plans?.plan_name || 'Cover Plan'}</span>
                              <span className="font-bold text-teal-700">R{targetAmount.toFixed(0)}/mo</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${planData.status === 'active' ? 'bg-green-500' : 'bg-teal-500'}`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-600">
                                R{fundedAmount.toFixed(2)} / R{targetAmount.toFixed(2)}
                              </span>
                              <span className="font-bold text-teal-700">
                                {progressPercent.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>


          {/* Settings Form Section */}
          <div id="edit-profile-section" className="md:col-span-12 bg-blue-50 rounded-lg border border-blue-100 overflow-hidden shadow-sm">
            <div className="bg-blue-100 px-6 py-4 flex items-center gap-2 border-b border-blue-200">
              <span className="material-symbols-outlined text-blue-700">manage_accounts</span>
              <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-gray-700">
                Account Settings &amp; Preferences
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    First Name
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    value={firstName}
                    onFocus={handleInputFocus}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    Last Name
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    value={lastName}
                    onFocus={handleInputFocus}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    Contact Number
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    value={contactNumber}
                    onFocus={handleInputFocus}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="email"
                    value={email}
                    onFocus={handleInputFocus}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    SA ID Number
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    placeholder="Enter your SA ID number"
                    value={member?.sa_id || ''}
                    onFocus={handleInputFocus}
                    onChange={(e) => setMember(prev => prev ? {...prev, sa_id: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    Address Line 1
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    placeholder="Enter your address line 1"
                    value={member?.address_line_1 || ''}
                    onFocus={handleInputFocus}
                    onChange={(e) => setMember(prev => prev ? {...prev, address_line_1: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    City
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    placeholder="Enter your city"
                    value={member?.city || ''}
                    onFocus={handleInputFocus}
                    onChange={(e) => setMember(prev => prev ? {...prev, city: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.05em] block">
                    Postal Code
                  </label>
                  <input
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    type="text"
                    placeholder="Enter your postal code"
                    value={member?.postal_code || ''}
                    onFocus={handleInputFocus}
                    onChange={(e) => setMember(prev => prev ? {...prev, postal_code: e.target.value} : null)}
                  />
                </div>
              </div>
              <div className="mt-10 flex justify-end gap-3">
                <button 
                  onClick={handleDiscardChanges}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors rounded-lg"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="bg-blue-600 text-white px-8 py-2.5 text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-white dark:bg-background-dark shadow-[0px_-4px_20px_rgba(0,31,40,0.06)] border-t border-gray-200">
        <button className="flex flex-col items-center justify-center bg-primary-50 text-primary-600 rounded-lg px-3 py-1 transition-transform active:scale-95">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            dashboard
          </span>
          <span className="text-[10px] uppercase font-bold tracking-[0.05em]">
            Dashboard
          </span>
        </button>
        <button className="flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <span className="material-symbols-outlined">military_tech</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.05em]">
            Rewards
          </span>
        </button>
        <button className="flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.05em]">
            History
          </span>
        </button>
        <button className="flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <span className="material-symbols-outlined">medical_services</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.05em]">
            Health
          </span>
        </button>
      </nav>

      {/* QR Code Modal */}
      {showQRModal && qrDataUrl && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Your Member QR Code</h3>
              <button 
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
              <img 
                src={qrDataUrl} 
                alt="Member QR Code" 
                className="w-full h-auto"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Show this QR code at partner stores</p>
              <p className="text-xs text-gray-500">{member?.name}</p>
              <p className="text-xs text-gray-500">{member?.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && mainCoverPlan && (
        <UpgradePromptModal
          currentPlanName={mainCoverPlan.cover_plans.plan_name}
          currentTarget={targetAmount}
          fundedAmount={fundedAmount}
          overflowAmount={overflowBalance}
          onUpgrade={handleUpgrade}
          onDecline={handleDeclineUpgrade}
        />
      )}

      {/* Profile Incomplete Modal */}
      {showProfileIncomplete && member && (
        <ProfileIncompleteModal
          memberName={member.name}
          percentComplete={progressPercent}
          missingFields={missingFields}
          currentPlanName={mainCoverPlan?.cover_plans?.plan_name}
          canChangePlan={canChangePlan}
          planId={mainCoverPlan?.id}
          onClose={() => {
            if (progressPercent < 100) {
              setShowProfileIncomplete(false);
            }
          }}
          onForceClose={() => {
            setShowProfileIncomplete(false);
          }}
          onChangePlan={() => {
            setShowProfileIncomplete(false);
            setShowPlanSelection(true);
          }}
        />
      )}

      {/* Plan Selection Modal - Show for new members */}
      {showPlanSelection && member && (
        <PlanSelectionModal
          memberId={member.id}
          onPlanSelected={() => {
            setShowPlanSelection(false);
            // Reload page after a short delay to ensure database is updated
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
        />
      )}

      {/* Pending Verification Modal - Show when policy reaches 100% */}
      {showPendingVerification && member && (
        <PendingVerificationModal
          memberName={member.name}
          memberPhone={member.phone}
          onClose={() => setShowPendingVerification(false)}
        />
      )}
    </div>
  );
};

export default DashboardNew;
