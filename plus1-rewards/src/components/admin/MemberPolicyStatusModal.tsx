import { useState } from 'react';
import { changeMemberPolicyStatus } from '../../lib/memberStatusUtils';

interface MemberPolicyStatusModalProps {
  isOpen: boolean;
  memberId: string;
  memberName: string;
  memberPhone: string;
  coverPlanId: string;
  currentStatus: 'in_progress' | 'active' | 'suspended';
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemberPolicyStatusModal({
  isOpen,
  memberId,
  memberName,
  memberPhone,
  coverPlanId,
  currentStatus,
  onClose,
  onSuccess
}: MemberPolicyStatusModalProps) {
  const [newStatus, setNewStatus] = useState<'in_progress' | 'active' | 'suspended'>(currentStatus);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async () => {
    if (newStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await changeMemberPolicyStatus({
        memberId,
        memberName,
        memberPhone,
        coverPlanId,
        newStatus,
        reason
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Change Policy Status
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--gray-text)' }}>
            Member: <span style={{ fontWeight: 600 }}>{memberName}</span> ({memberPhone})
          </p>
          <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--gray-text)' }}>
            Current Status: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{currentStatus}</span>
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            New Status
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--gray-border)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <option value="in_progress">In Progress</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for status change..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--gray-border)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'var(--gray-light)',
              color: 'var(--gray-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStatusChange}
            disabled={loading}
            style={{
              background: newStatus === 'suspended' ? '#ef4444' : 'var(--blue)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Updating...' : 'Change Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
