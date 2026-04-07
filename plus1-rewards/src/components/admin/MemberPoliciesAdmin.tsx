import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';
import MemberPolicyStatusModal from './MemberPolicyStatusModal';

interface MemberPolicy {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  plan_name: string;
  status: 'in_progress' | 'active' | 'suspended';
  funded_amount: number;
  target_amount: number;
  created_at: string;
  suspended_at?: string;
}

export default function MemberPoliciesAdmin() {
  const [policies, setPolicies] = useState<MemberPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<MemberPolicy | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'suspended' | 'active' | 'in_progress'>('all');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('member_cover_plans')
        .select(`
          id,
          member_id,
          status,
          funded_amount,
          target_amount,
          created_at,
          suspended_at,
          cover_plans(plan_name),
          members(full_name, cell_phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPolicies = (data || []).map((p: any) => ({
        id: p.id,
        member_id: p.member_id,
        member_name: p.members?.full_name || 'Unknown',
        member_phone: p.members?.cell_phone || 'Unknown',
        plan_name: p.cover_plans?.plan_name || 'Unknown Plan',
        status: p.status,
        funded_amount: p.funded_amount,
        target_amount: p.target_amount,
        created_at: p.created_at,
        suspended_at: p.suspended_at
      }));

      setPolicies(formattedPolicies);
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPolicies = () => {
    if (filter === 'all') return policies;
    return policies.filter(p => p.status === filter);
  };

  const getProgressPercent = (policy: MemberPolicy) => {
    return Math.min((policy.funded_amount / policy.target_amount) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'in_progress':
        return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      case 'suspended':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  const filteredPolicies = getFilteredPolicies();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--blue-light)', borderTopColor: 'var(--blue)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--gray-text)' }}>Loading member policies...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', count: policies.length },
          { key: 'suspended', label: 'Suspended', count: policies.filter(p => p.status === 'suspended').length },
          { key: 'active', label: 'Active', count: policies.filter(p => p.status === 'active').length },
          { key: 'in_progress', label: 'In Progress', count: policies.filter(p => p.status === 'in_progress').length }
        ].map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key as any)}
            style={{
              background: filter === btn.key ? 'var(--blue)' : 'var(--gray-light)',
              color: filter === btn.key ? '#fff' : 'var(--gray-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {btn.label} ({btn.count})
          </button>
        ))}
      </div>

      {/* Policies table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Plan</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-text)' }}>
                  No policies found
                </td>
              </tr>
            ) : (
              filteredPolicies.map(policy => {
                const progress = getProgressPercent(policy);
                const statusColor = getStatusColor(policy.status);

                return (
                  <tr key={policy.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{policy.member_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
                        {policy.member_phone}
                      </div>
                    </td>
                    <td>{policy.plan_name}</td>
                    <td>
                      <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        R{policy.funded_amount.toFixed(2)} / R{policy.target_amount.toFixed(2)}
                      </div>
                      <div style={{ width: '100px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'var(--blue)',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)', marginTop: '0.25rem' }}>
                        {progress.toFixed(1)}%
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {policy.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--gray-text)' }}>
                      {new Date(policy.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setShowModal(true);
                        }}
                        style={{
                          background: 'var(--blue)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Status change modal */}
      {selectedPolicy && (
        <MemberPolicyStatusModal
          isOpen={showModal}
          memberId={selectedPolicy.member_id}
          memberName={selectedPolicy.member_name}
          memberPhone={selectedPolicy.member_phone}
          coverPlanId={selectedPolicy.id}
          currentStatus={selectedPolicy.status}
          onClose={() => {
            setShowModal(false);
            setSelectedPolicy(null);
          }}
          onSuccess={() => {
            loadPolicies();
          }}
        />
      )}
    </div>
  );
}
