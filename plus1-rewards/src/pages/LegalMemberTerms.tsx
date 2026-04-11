import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LegalMemberTerms() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>📄 Member Terms</h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Please read carefully before joining</p>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Intro */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--blue-light), #f0f9ff)', border: '1px solid #dce8f5' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>📋</div>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--blue)', marginBottom: '0.375rem' }}>+1 Rewards Member Agreement</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-text)', lineHeight: 1.6, margin: 0 }}>
                  By joining +1 Rewards you agree to the following terms. These terms govern your use of the rewads platform and your relationship with partner shops, Day1 Health, and +1 Rewards (Pty) Ltd.
                </p>
              </div>
            </div>
          </div>

          {/* Terms sections */}
          {[
            {
              icon: '💰', title: 'How Rewards Work',
              points: [
                'Rewards are earned as a percentage of your purchase at participating partner shops.',
                'The commission split is fixed: 1% to your Sales Agent, 1% to the +1 Rewards platform, and the remainder goes directly to your Day1 Health policy.',
                'Rewards are applied to your active policy bucket and cannot be withdrawn as cash.',
                'You may "spend" your Rewards Total at partner businesses as a discount (minimum R10 per transaction).',
                'You may not spend more than 50% of your Rewards Total in a single transaction.',
              ],
            },
            {
              icon: '🏥', title: 'Day1 Health Policy',
              points: [
                'You must select an active Day1 Health plan to receive policy top-ups from rewards.',
                'Plans available: Day-to-Day (from R385/month), Hospital (from R390/month), Comprehensive - Value Plus (from R665/month), Senior (from R425/month).',
                'Your policy activates ("Auto-Paid Benefit") once the monthly target amount is fully funded by rewards.',
                'You may hold a maximum of 5 active policies simultaneously.',
                'Plan changes take effect at the next billing cycle — no mid-cycle downgrades.',
                'Claims are handled directly by Day1 Health and are subject to their terms and conditions.',
              ],
            },
            {
              icon: '⚠️', title: 'Shop Suspensions',
              points: [
                'If a partner shop does not pay their monthly invoice, the partner will be suspended.',
                'During suspension, rewards from that shop are paused (not deleted) and you will be notified.',
                'Your accumulated rewards remain safe and will be restored upon shop reactivation.',
                'The suspension popup message will read: "Shop temporarily suspended. Rewards safe."',
                'You can continue earning at other active partner shops during any suspension.',
              ],
            },
            {
              icon: '🔐', title: 'Account & Security',
              points: [
                'Your account is identified by your mobile number and/or date of birth (passwordless authentication).',
                'Your unique QR code expires every 30 days and is automatically refreshed.',
                'If you lose your phone, you can recover your account within 48 hours using your mobile number and date of birth.',
                'You are responsible for keeping your login details secure.',
                'Suspected fraudulent activity (e.g. same member scanned 5+ times daily) triggers an automatic fraud review.',
              ],
            },
            {
              icon: '📊', title: 'Data & Privacy',
              points: [
                'Your personal data is processed in accordance with our POPIA Privacy Policy.',
                'Transaction data is retained for 7 years as required by South African financial legislation.',
                'You may request a full export of your personal data at any time.',
                'Your full transaction history can be downloaded in CSV format from the app.',
                'You may request account deletion (subject to mandatory retention periods).',
              ],
            },
            {
              icon: '📋', title: 'General Rules',
              points: [
                'Rewards expire if your account is inactive for more than 90 days (30-day notice will be sent).',
                'You will receive a 7-day notification before any policy renewal reset.',
                'You have a 7-day dispute window for any incorrect rewards — disputes hold affected rewards pending investigation.',
                'Emergency top-ups are available for a maximum R500 shortfall per policy cycle.',
                'These terms are governed by the laws of the Republic of South Africa.',
              ],
            },
          ].map((section, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{section.icon}</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>{section.title}</h2>
              </div>
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {section.points.map((point, j) => (
                  <li key={j} style={{ fontSize: '0.875rem', color: 'var(--gray-text)', lineHeight: 1.65 }}>{point}</li>
                ))}
              </ol>
            </div>
          ))}

          {/* Acceptance */}
          <div className="card" style={{ border: accepted ? '2px solid var(--green)' : '2px solid var(--gray-border)', transition: 'border-color 0.2s' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', cursor: 'pointer' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '2px',
                background: accepted ? 'var(--green)' : '#fff',
                border: accepted ? 'none' : '2px solid var(--gray-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }} onClick={() => setAccepted(!accepted)}>
                {accepted && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
              </div>
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ display: 'none' }} />
              <div>
                <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 0.25rem', fontSize: '0.9375rem' }}>I Accept the Member Terms & Conditions</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-text)', margin: 0, lineHeight: 1.5 }}>
                  I confirm that I have read, understood, and agree to the +1 Rewards Member Agreement, Privacy Policy (POPIA), and Day1 Health terms as set out above.
                </p>
              </div>
            </label>
          </div>

          <div style={{ paddingBottom: '1.5rem' }}>
            <button
              onClick={() => accepted && navigate('/member/register')}
              disabled={!accepted}
              className="btn btn-primary btn-block"
              style={{ height: '56px', fontSize: '1rem', borderRadius: '14px', opacity: accepted ? 1 : 0.45 }}
            >
              {accepted ? '✓ Continue to Registration →' : 'Please accept the terms above'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
