import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface FoundMember {
  id: string; name: string; phone: string;
  active_policy: string; rewards_total: number;
  policy_current: number; policy_target: number;
  status: 'active' | 'suspended';
}

export function PartnerFindMember() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'phone' | 'scan'>('phone');
  const [phone, setPhone] = useState('');
  const [foundMember, setFoundMember] = useState<FoundMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setScanning] = useState(false);

  const partnerData = (() => {
    try { return JSON.parse(localStorage.getItem('currentPartner') || '{}'); } catch { return {}; }
  })();

  const searchByPhone = async () => {
    if (!phone.trim()) return;
    setLoading(true); setError(''); setFoundMember(null);
    try {
      const { data } = await supabase.from('members').select('id, name, phone, active_policy').eq('phone', phone.replace(/\s/g, '')).single();
      if (!data) { setError('No member found with that phone number.'); return; }
      
      // Check if member has an active policy
      if (!data.active_policy) {
        setError('Member must select a policy plan before receiving rewards. Ask them to choose a policy in their +1 Rewards app first.');
        return;
      }
      
      const { data: wallet } = await supabase.from('wallets').select('policies, rewards_total').eq('member_id', data.id).eq('partner_id', partnerData.id).single();
      const policies = wallet?.policies || {};
      const activePol = policies[data.active_policy] || {};
      setFoundMember({
        id: data.id, name: data.name, phone: data.phone,
        active_policy: data.active_policy || 'Day-to-Day Single',
        rewards_total: wallet?.rewards_total || 0,
        policy_current: activePol.current || 0,
        policy_target: activePol.target || 385,
        status: 'active',
      });
    } catch { setError('Member not found. Check the number and try again.'); }
    finally { setLoading(false); }
  };

  const startScan = async () => {
    setMode('scan'); setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { setError('Camera access denied. Use phone number search instead.'); setMode('phone'); setScanning(false); }
  };

  const stopScan = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false); setMode('phone');
  };

  const issueReward = async () => {
    if (!foundMember || !rewardAmount || !purchaseAmount) return;
    
    // Check if partner is suspended
    if (partnerData.status === 'suspended') {
      setError('Your account has been suspended. You cannot process transactions.');
      return;
    }
    
    // Check if partner is active
    if (partnerData.status !== 'active') {
      setError('Your account is not active. Only active partners can process transactions.');
      return;
    }
    
    setIssuing(true);
    try {
      await supabase.from('transactions').insert([{
        partner_id: partnerData.id, member_id: foundMember.id,
        purchase_amount: parseFloat(purchaseAmount),
        member_reward: parseFloat(rewardAmount),
        policy_filled: foundMember.active_policy,
        status: 'synced',
      }]);
      setIssued(true);
      setTimeout(() => { setFoundMember(null); setPhone(''); setRewardAmount(''); setPurchaseAmount(''); setIssued(false); }, 3000);
    } catch { setError('Failed to issue reward. Try again.'); }
    finally { setIssuing(false); }
  };

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>🔍 Find Member</h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{partnerData.name}</p>
          </div>
          <button onClick={() => navigate('/partner/dashboard')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Mode switcher */}
          <div className="card" style={{ padding: '0.875rem' }}>
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '3px' }}>
              <button onClick={() => { stopScan(); setMode('phone'); }} style={{
                flex: 1, padding: '0.625rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9375rem',
                background: mode === 'phone' ? '#fff' : 'transparent',
                color: mode === 'phone' ? 'var(--blue)' : 'var(--gray-text)',
                boxShadow: mode === 'phone' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s',
              }}>📞 Phone Number</button>
              <button onClick={startScan} style={{
                flex: 1, padding: '0.625rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9375rem',
                background: mode === 'scan' ? '#fff' : 'transparent',
                color: mode === 'scan' ? 'var(--blue)' : 'var(--gray-text)',
                boxShadow: mode === 'scan' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s',
              }}>📷 Scan QR</button>
            </div>
          </div>

          {/* Phone Search */}
          {mode === 'phone' && (
            <div className="card">
              <h2 className="section-title">Search by Mobile Number</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input type="tel" className="input" placeholder="082 555 0000" value={phone} onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchByPhone()} style={{ flex: 1 }} />
                <button onClick={searchByPhone} disabled={loading} className="btn btn-primary" style={{ borderRadius: '10px', padding: '0 1.25rem', flexShrink: 0 }}>
                  {loading ? '...' : 'Search'}
                </button>
              </div>
              {error && <div className="alert alert-error" style={{ marginTop: '0.875rem' }}>{error}</div>}
            </div>
          )}

          {/* QR Scan */}
          {mode === 'scan' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', background: '#000', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                {/* Corner markers */}
                {[['0,0'], ['auto,0'], ['0,auto'], ['auto,auto']].map(([pos], i) => {
                  const [l, t] = pos.split(',');
                  return (
                    <div key={i} style={{ position: 'absolute', [l === '0' ? 'left' : 'right']: 16, [t === '0' ? 'top' : 'bottom']: 16, width: '28px', height: '28px', borderTop: t === '0' ? '3px solid #37d270' : 'none', borderBottom: t !== '0' ? '3px solid #37d270' : 'none', borderLeft: l === '0' ? '3px solid #37d270' : 'none', borderRight: l !== '0' ? '3px solid #37d270' : 'none' }} />
                  );
                })}
                <div style={{ position: 'absolute', inset: '40px', border: '1px dashed rgba(255,255,255,0.25)', borderRadius: '8px' }} />
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Point at member's QR code
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <button onClick={stopScan} className="btn btn-ghost btn-block" style={{ borderRadius: '10px' }}>Cancel Scan</button>
              </div>
            </div>
          )}

          {/* Member found */}
          {foundMember && !issued && (
            <div className="card animate-fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--gray-border)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--blue), var(--blue-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                  {foundMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#111827', margin: '0 0 2px' }}>{foundMember.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-text)', margin: 0 }}>{foundMember.phone}</p>
                </div>
                <span className="badge badge-green" style={{ marginLeft: 'auto' }}>✓ Member</span>
              </div>

              {/* Policy progress */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-text)' }}>{foundMember.active_policy}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--blue)' }}>R{foundMember.policy_current} / R{foundMember.policy_target}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min((foundMember.policy_current / foundMember.policy_target) * 100, 100)}%` }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', marginTop: '0.375rem' }}>
                  {Math.round((foundMember.policy_current / foundMember.policy_target) * 100)}% to activation
                </p>
              </div>

              {/* Reward issue */}
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', marginBottom: '0.875rem' }}>💰 Issue Reward</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
                <div>
                  <label className="input-label">Purchase Amount (R)</label>
                  <input type="number" className="input" placeholder="1000.00" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} min="0" />
                </div>
                <div>
                  <label className="input-label">Reward to Issue (R)</label>
                  <input type="number" className="input" placeholder="30.00" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} min="0" />
                </div>
              </div>
              <button onClick={issueReward} disabled={issuing || !rewardAmount || !purchaseAmount} className="btn btn-green btn-block" style={{ height: '52px', borderRadius: '12px', fontSize: '1rem' }}>
                {issuing ? '⏳ Issuing...' : '✓ Confirm & Issue Reward'}
              </button>
            </div>
          )}

          {/* Success */}
          {issued && (
            <div className="card animate-fade-up" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', border: '2px solid var(--green)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>Reward Issued!</h2>
              <p style={{ color: 'var(--gray-text)' }}>R{rewardAmount} sent to {foundMember?.name}'s policy</p>
            </div>
          )}
        </div>
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid var(--gray-border)', padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--gray-light)', fontSize: '0.8125rem' }}>© 2026 +1 Rewards · Partner Portal</p>
      </footer>
    </div>
  );
}
