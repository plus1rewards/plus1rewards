import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Transaction {
  id: string; member_id: string; purchase_amount: number;
  rewards_issued: number; policy_name: string; created_at: string; member_name?: string
}

export function PartnerHistory() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'top' | 'month'>('month')
  const [searchMember, setSearchMember] = useState('')
  const [totalRewards, setTotalRewards] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const partnerData = localStorage.getItem('currentPartner')
        if (!partnerData) { navigate('/partner/login'); return }
        const parsedPartner = JSON.parse(partnerData)
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select(`
            id,
            member_id,
            purchase_amount,
            member_amount,
            created_at,
            members (
              first_name,
              last_name,
              cell_phone
            )
          `)
          .eq('partner_id', parsedPartner.id)
          .order('created_at', { ascending: false })
        
        if (txError) {
          console.error('Transaction fetch error:', txError);
          throw txError;
        }
        
        console.log('Raw transaction data:', JSON.stringify(txData, null, 2));
        
        const formatted = txData?.map(tx => {
          console.log('Processing transaction:', tx);
          // Supabase returns the joined data directly in the members property
          const member = tx.members as any;
          const firstName = member?.first_name || '';
          const lastName = member?.last_name || '';
          const cellPhone = member?.cell_phone || 'N/A';
          const memberName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : 'Unknown Member';
          
          console.log('Extracted member data:', { firstName, lastName, cellPhone, memberName });
          
          return {
            id: tx.id,
            member_id: tx.member_id,
            purchase_amount: parseFloat(tx.purchase_amount),
            rewards_issued: parseFloat(tx.member_amount) || 0,
            policy_name: cellPhone,
            created_at: tx.created_at,
            member_name: memberName
          };
        }) || []
        setTransactions(formatted)
        setTotalRewards(formatted.reduce((sum, t) => sum + t.rewards_issued, 0))
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load history') }
      finally { setLoading(false) }
    }
    fetchData()
  }, [navigate])

  const filtered = (() => {
    let f = transactions
    if (searchMember) f = f.filter(tx => tx.member_name?.toLowerCase().includes(searchMember.toLowerCase()))
    if (filterType === 'month') { const m = new Date(); m.setDate(1); m.setHours(0,0,0,0); f = f.filter(tx => new Date(tx.created_at) >= m) }
    if (filterType === 'top') {
      const totals: Record<string, number> = {}; f.forEach(tx => { totals[tx.member_name || ''] = (totals[tx.member_name || ''] || 0) + tx.purchase_amount })
      const top5 = Object.entries(totals).sort(([,a],[,b]) => b-a).slice(0,5).map(([n]) => n)
      f = f.filter(tx => top5.includes(tx.member_name || ''))
    }
    return f
  })()

  const exportCSV = () => {
    const h = ['Date', 'Member', 'Purchase Amount', 'Rewards Issued'].join(',')
    const rows = filtered.map(tx => [`"${new Date(tx.created_at).toLocaleDateString()}"`, `"${tx.member_name}"`, `"R${tx.purchase_amount.toFixed(2)}"`, `"R${tx.rewards_issued.toFixed(2)}"`].join(','))
    const blob = new Blob([[h, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `partner-history-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>📊 Transaction History</h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>All rewards issued</p>
          </div>
          <button onClick={() => navigate('/partner/dashboard')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <p className="stat-label">Total Rewards</p>
              <p className="stat-value" style={{ color: 'var(--blue)', fontSize: '1.375rem' }}>R{totalRewards.toFixed(2)}</p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <p className="stat-label">Agent (1%)</p>
              <p className="stat-value" style={{ color: 'var(--gray-text)', fontSize: '1.375rem' }}>R{(totalRewards*0.01).toFixed(2)}</p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <p className="stat-label">Members (98%)</p>
              <p className="stat-value" style={{ color: 'var(--green-dark)', fontSize: '1.375rem' }}>R{(totalRewards*0.98).toFixed(2)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '0.875rem' }}>
              {[{ id: 'month', label: 'This Month' }, { id: 'all', label: 'All Time' }, { id: 'top', label: 'Top Members' }].map(tab => (
                <button key={tab.id} onClick={() => setFilterType(tab.id as typeof filterType)} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
                  background: filterType === tab.id ? '#fff' : 'transparent',
                  color: filterType === tab.id ? 'var(--blue)' : 'var(--gray-text)',
                  boxShadow: filterType === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}>{tab.label}</button>
              ))}
            </div>
            <input type="text" placeholder="🔍 Search member name..." value={searchMember}
              onChange={e => setSearchMember(e.target.value)} className="input" />
          </div>

          {/* Transactions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Transactions ({filtered.length})</h2>
              <button onClick={exportCSV} className="btn btn-ghost" style={{ fontSize: '0.8125rem', borderRadius: '8px', padding: '0.375rem 0.875rem' }}>
                ⬇ Export CSV
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--blue-light)', borderTopColor: 'var(--blue)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-light)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                No transactions found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map((tx, i) => (
                  <div key={tx.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 1.5rem', borderBottom: i < filtered.length - 1 ? '1px solid var(--gray-border)' : 'none',
                    background: i % 2 === 0 ? '#fff' : '#fafbff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: 'linear-gradient(135deg, #1a558b 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '1.25rem' }}>🛒</span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 2px', fontSize: '0.9375rem' }}>{tx.member_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', margin: 0 }}>
                          {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(tx.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })} • {tx.policy_name}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 2px', fontSize: '1rem' }}>R{tx.purchase_amount.toFixed(2)}</p>
                      <p style={{ fontSize: '0.75rem', color: '#16a34a', margin: 0, fontWeight: 600 }}>+R{tx.rewards_issued.toFixed(2)} rewards</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid var(--gray-border)', padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--gray-light)', fontSize: '0.8125rem' }}>© 2026 +1 Rewards · Partner Portal</p>
      </footer>
    </div>
  )
}
