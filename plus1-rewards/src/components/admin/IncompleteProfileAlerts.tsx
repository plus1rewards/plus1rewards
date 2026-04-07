import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';

interface IncompleteProfileMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  sa_id?: string;
  city?: string;
  address_line_1?: string;
  policy_progress: number;
  missing_fields: string[];
}

export default function IncompleteProfileAlerts() {
  const [alerts, setAlerts] = useState<IncompleteProfileMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkIncompleteProfiles();
  }, []);

  const checkIncompleteProfiles = async () => {
    setLoading(true);
    try {
      // Get all members with their wallets and policy info
      const { data: members } = await supabaseAdmin
        .from('members')
        .select(`
          id, name, phone, email, sa_id, city, address_line_1, active_policy,
          wallets(rewards_total)
        `);

      if (!members) return;

      const incompleteMembers: IncompleteProfileMember[] = [];

      for (const member of members) {
        if (!member.active_policy) continue;

        // Get policy target
        const { data: policyPlan } = await supabaseAdmin
          .from('policy_plans')
          .select('monthly_target')
          .eq('id', member.active_policy)
          .single();

        if (!policyPlan) continue;

        // Calculate total rewards
        const totalRewards = member.wallets?.reduce((sum: number, w: any) => sum + (w.rewards_total || 0), 0) || 0;
        const progress = (totalRewards / policyPlan.monthly_target) * 100;

        // Check if at 90% or more
        if (progress >= 90) {
          // Check for missing fields
          const missingFields = [];
          if (!member.email || member.email.includes('@plus1rewards.local')) missingFields.push('Email');
          if (!member.sa_id) missingFields.push('SA ID');
          if (!member.city) missingFields.push('City');
          if (!member.address_line_1) missingFields.push('Address Line 1');

          // If any fields are missing, add to alerts
          if (missingFields.length > 0) {
            incompleteMembers.push({
              id: member.id,
              name: member.name,
              phone: member.phone,
              email: member.email,
              sa_id: member.sa_id,
              city: member.city,
              address_line_1: member.address_line_1,
              policy_progress: Math.round(progress),
              missing_fields: missingFields
            });
          }
        }
      }

      setAlerts(incompleteMembers);
    } catch (error) {
      console.error('Error checking incomplete profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (memberId: string) => {
    setDismissed(prev => new Set([...prev, memberId]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissed.has(alert.id));

  if (loading) return null;
  if (visibleAlerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {visibleAlerts.map(alert => (
        <div
          key={alert.id}
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'start',
            gap: '1rem'
          }}
        >
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                Incomplete Profile Alert
              </h3>
              <span style={{
                background: '#f59e0b',
                color: '#fff',
                padding: '0.125rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {alert.policy_progress}% Policy Progress
              </span>
            </div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#78350f', fontSize: '0.875rem' }}>
              <strong>{alert.name}</strong> ({alert.phone}) has reached {alert.policy_progress}% of their policy target but is missing critical information.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>Missing:</span>
              {alert.missing_fields.map(field => (
                <span
                  key={field}
                  style={{
                    background: '#fff',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {field}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  // Copy member ID to clipboard for easy lookup
                  navigator.clipboard.writeText(alert.id);
                  window.location.href = '/admin/members';
                }}
                style={{
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Review Member
              </button>
              <button
                onClick={() => handleDismiss(alert.id)}
                style={{
                  background: '#fff',
                  color: '#92400e',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
