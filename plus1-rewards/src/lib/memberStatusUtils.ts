import { supabaseAdmin } from './supabase';

interface StatusChangeParams {
  memberId: string;
  memberName: string;
  memberPhone: string;
  coverPlanId: string;
  newStatus: 'in_progress' | 'active' | 'suspended';
  reason?: string;
}

export async function changeMemberPolicyStatus({
  memberId,
  memberName,
  memberPhone,
  coverPlanId,
  newStatus,
  reason = ''
}: StatusChangeParams) {
  try {
    // Update the cover plan status
    const { error: updateError } = await supabaseAdmin
      .from('member_cover_plans')
      .update({ 
        status: newStatus,
        suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null
      })
      .eq('id', coverPlanId);

    if (updateError) throw updateError;

    // Create notification for member
    const notificationMessages: Record<string, string> = {
      suspended: `Your cover plan has been PAUSED. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
      'in_progress': `Your cover plan status has been changed to in progress. ${reason ? `Reason: ${reason}` : ''}`,
      active: `Your cover plan is now active. ${reason ? `Reason: ${reason}` : ''}`
    };

    const { error: notificationError } = await supabaseAdmin
      .from('admin_notifications')
      .insert({
        type: `policy_status_changed_${newStatus}`,
        member_id: memberId,
        member_name: memberName,
        member_phone: memberPhone,
        message: notificationMessages[newStatus],
        priority: newStatus === 'suspended' ? 'high' : 'medium',
        metadata: {
          cover_plan_id: coverPlanId,
          action: `status_changed_to_${newStatus}`,
          reason: reason
        }
      });

    if (notificationError) throw notificationError;

    return { success: true, message: `Policy status changed to ${newStatus}` };
  } catch (error) {
    console.error('Error changing member policy status:', error);
    throw error;
  }
}

export async function suspendMemberPolicy({
  memberId,
  memberName,
  memberPhone,
  coverPlanId,
  reason = 'Admin action'
}: Omit<StatusChangeParams, 'newStatus'>) {
  return changeMemberPolicyStatus({
    memberId,
    memberName,
    memberPhone,
    coverPlanId,
    newStatus: 'suspended',
    reason
  });
}

export async function unsuspendMemberPolicy({
  memberId,
  memberName,
  memberPhone,
  coverPlanId,
  reason = 'Profile completed'
}: Omit<StatusChangeParams, 'newStatus'>) {
  return changeMemberPolicyStatus({
    memberId,
    memberName,
    memberPhone,
    coverPlanId,
    newStatus: 'in_progress',
    reason
  });
}
